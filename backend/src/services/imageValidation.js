/**
 * Image Validation Service
 * 
 * Handles all image-related validations including:
 * - Format validation (JPG, JPEG, PNG only)
 * - Size validation (max 5MB)
 * - Dimension validation
 * - Fashion product detection
 * - Text detection (OCR)
 * - Personal information detection in descriptions
 * 
 * @module services/imageValidation
 */

const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs').promises;
const CONSTANTS = require('../constants');
const fashionClassifier = require('./fashionClassifier');

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string} [error] - Error message if validation failed
 * @property {Object} [metadata] - Image metadata if validation passed
 */

class ImageValidationService {
  constructor() {
    this.allowedMimeTypes = new Set(CONSTANTS.ALLOWED_MIME_TYPES);
    this.allowedExtensions = new Set(CONSTANTS.ALLOWED_EXTENSIONS);
  }

  /**
   * Validate file type (MIME type and extension)
   * @param {Object} file - Multer file object
   * @returns {ValidationResult}
   */
  validateFileType(file) {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!this.allowedExtensions.has(ext)) {
      return {
        isValid: false,
        error: CONSTANTS.MESSAGES.INVALID_FILE_TYPE
      };
    }

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      return {
        isValid: false,
        error: CONSTANTS.MESSAGES.INVALID_FILE_TYPE
      };
    }

    return { isValid: true };
  }

  /**
   * Validate file size
   * @param {Object} file - Multer file object
   * @returns {ValidationResult}
   */
  validateFileSize(file) {
    if (file.size > CONSTANTS.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: CONSTANTS.MESSAGES.FILE_TOO_LARGE
      };
    }
    return { isValid: true };
  }

  /**
   * Validate image dimensions using Sharp
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<ValidationResult>}
   */
  async validateDimensions(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      const { width, height } = metadata;

      if (width < CONSTANTS.MIN_IMAGE_WIDTH || height < CONSTANTS.MIN_IMAGE_HEIGHT) {
        return {
          isValid: false,
          error: CONSTANTS.MESSAGES.IMAGE_TOO_SMALL
            .replace('{minWidth}', CONSTANTS.MIN_IMAGE_WIDTH)
            .replace('{minHeight}', CONSTANTS.MIN_IMAGE_HEIGHT)
        };
      }

      if (width > CONSTANTS.MAX_IMAGE_WIDTH || height > CONSTANTS.MAX_IMAGE_HEIGHT) {
        return {
          isValid: false,
          error: CONSTANTS.MESSAGES.IMAGE_TOO_LARGE
            .replace('{maxWidth}', CONSTANTS.MAX_IMAGE_WIDTH)
            .replace('{maxHeight}', CONSTANTS.MAX_IMAGE_HEIGHT)
        };
      }

      return {
        isValid: true,
        metadata: { width, height, format: metadata.format }
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Unable to read image dimensions. Please upload a valid image file.'
      };
    }
  }

  /**
   * Detect if image contains text using Tesseract OCR
   * Returns true if significant text is detected
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<{hasText: boolean, confidence: number, text: string}>}
   */
  async detectText(buffer) {
    try {
      // Preprocess image for better OCR accuracy
      const processedBuffer = await sharp(buffer)
  .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
  .greyscale()
  .normalize()
  .threshold(180)
  .toBuffer();

      const result = await Tesseract.recognize(
  processedBuffer,
  'eng',
  {
    logger: () => {},
    errorHandler: () => {},
    langPath: path.join(__dirname, '../../'),  // use the bundled eng.traineddata
    gzip: false,
    cacheMethod: 'none'
  }
);

      const text = result.data.text.trim();
      const confidence = result.data.confidence;

      // Consider text detected if confidence is high enough and text length is significant
      const hasText = confidence > CONSTANTS.TEXT_CONFIDENCE_THRESHOLD && 
                      text.length >= CONSTANTS.MIN_TEXT_LENGTH_TO_REJECT;

      return {
        hasText,
        confidence,
        text: text.substring(0, 200) // Limit for logging
      };
    } catch (error) {
      // If OCR fails, assume no text to be safe
      return {
        hasText: false,
        confidence: 0,
        text: ''
      };
    }
  }

  /**
   * Detect if image contains a fashion product.
   *
   * Primary path: a LOCAL pre-trained MobileNet ML model
   * (see services/fashionClassifier.js) actually recognizes the object
   * in the image and checks it against a whitelist of clothing/footwear/
   * bag/accessory classes. This runs entirely on this server process -
   * no external AI API, no per-request network call.
   *
   * Fallback path: if the ML model failed to load (e.g. no outbound
   * internet on first boot) we fall back to the old pixel/edge heuristic
   * so the endpoint still works, just less accurately.
   *
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<{isFashion: boolean, confidence: number, reason: string, method: string}>}
   */
  async detectFashionProduct(buffer) {
    const mlResult = await fashionClassifier.classifyFashion(buffer);

    if (mlResult.available) {
      return {
        isFashion: mlResult.isFashion,
        confidence: mlResult.confidence,
        reason: mlResult.isFashion
          ? `Recognized as "${mlResult.matchedClass}"`
          : `Top predictions did not match a clothing/footwear/bag/accessory class (best guesses: ${mlResult.topPredictions.slice(0, 3).map((p) => p.className).join(', ')})`,
        method: 'ml'
      };
    }

    // ML model unavailable - fall back to heuristic analysis.
    const heuristicResult = await this.detectFashionProductHeuristic(buffer);
    return { ...heuristicResult, method: 'heuristic' };
  }

  /**
   * Heuristic-only fashion detector (fallback, no ML).
   * Uses image composition analysis (color variance, edge density, etc.)
   * This is a rough approximation and can accept some non-clothing
   * images - it is only used if the ML model in fashionClassifier.js
   * is unavailable.
   *
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<{isFashion: boolean, confidence: number, reason: string}>}
   */
  async detectFashionProductHeuristic(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      const { width, height, format } = metadata;

      // Get image statistics for analysis
      const stats = await sharp(buffer)
        .resize(300, 300, { fit: 'inside' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = stats;
      const pixelCount = info.width * info.height;

      // Analyze color distribution
      let totalR = 0, totalG = 0, totalB = 0;
      let colorVariance = 0;
      const colorHistogram = new Map();

      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        totalR += r;
        totalG += g;
        totalB += b;

        // Quantize colors for histogram
        const quantizedR = Math.floor(r / 32);
        const quantizedG = Math.floor(g / 32);
        const quantizedB = Math.floor(b / 32);
        const key = `${quantizedR},${quantizedG},${quantizedB}`;
        colorHistogram.set(key, (colorHistogram.get(key) || 0) + 1);
      }

      const avgR = totalR / pixelCount;
      const avgG = totalG / pixelCount;
      const avgB = totalB / pixelCount;

      // Calculate color variance (fashion products tend to have more varied colors)
      for (let i = 0; i < data.length; i += 3) {
        colorVariance += Math.pow(data[i] - avgR, 2);
        colorVariance += Math.pow(data[i + 1] - avgG, 2);
        colorVariance += Math.pow(data[i + 2] - avgB, 2);
      }
      colorVariance /= (pixelCount * 3);

      // Unique color count (fashion products typically have moderate color variety)
      const uniqueColors = colorHistogram.size;
      const colorDiversity = uniqueColors / 512; // 512 = 8^3 possible quantized colors

      // Edge detection proxy: check for high contrast regions
      // Fashion products typically have defined edges
      let edgeScore = 0;
      const stride = info.width * 3;
      for (let y = 1; y < info.height - 1; y++) {
        for (let x = 1; x < info.width - 1; x++) {
          const idx = y * stride + x * 3;
          const leftIdx = y * stride + (x - 1) * 3;
          const topIdx = (y - 1) * stride + x * 3;

          const diffX = Math.abs(data[idx] - data[leftIdx]) +
                       Math.abs(data[idx + 1] - data[leftIdx + 1]) +
                       Math.abs(data[idx + 2] - data[leftIdx + 2]);

          const diffY = Math.abs(data[idx] - data[topIdx]) +
                       Math.abs(data[idx + 1] - data[topIdx + 1]) +
                       Math.abs(data[idx + 2] - data[topIdx + 2]);

          if (diffX > 100 || diffY > 100) {
            edgeScore++;
          }
        }
      }
      const edgeDensity = edgeScore / pixelCount;

      // Fashion product heuristics
      // 1. Reasonable aspect ratio (not too extreme)
      const aspectRatio = width / height;
      const aspectScore = aspectRatio >= 0.3 && aspectRatio <= 3 ? 1 : 0.3;

      // 2. Moderate color variance (fashion products have texture)
      const varianceScore = colorVariance > 500 && colorVariance < 8000 ? 1 : 0.5;

      // 3. Good color diversity but not too chaotic
      const diversityScore = colorDiversity > 0.1 && colorDiversity < 0.8 ? 1 : 0.4;

      // 4. Edge density (products have defined shapes)
      const edgeScore_norm = edgeDensity > 0.05 && edgeDensity < 0.4 ? 1 : 0.3;

      // 5. Image quality indicators
      const qualityScore = (width >= 400 && height >= 400) ? 1 : 0.5;

      // Weighted confidence score
      const confidence = (
        aspectScore * 0.15 +
        varianceScore * 0.25 +
        diversityScore * 0.20 +
        edgeScore_norm * 0.25 +
        qualityScore * 0.15
      );

      const isFashion = confidence >= CONSTANTS.FASHION_CONFIDENCE_THRESHOLD;

      return {
        isFashion,
        confidence: Math.round(confidence * 100) / 100,
        reason: isFashion 
          ? 'Image characteristics match fashion product patterns'
          : 'Image does not exhibit typical fashion product characteristics'
      };
    } catch (error) {
      // If analysis fails, reject to be safe
      return {
        isFashion: false,
        confidence: 0,
        reason: 'Unable to analyze image content'
      };
    }
  }

  /**
   * Run complete validation on a single image
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} Complete validation result
   */
  async validateImage(file) {
    const results = {
      fileType: null,
      fileSize: null,
      dimensions: null,
      fashionDetection: null,
      textDetection: null,
      isValid: false,
      errors: []
    };

    // Step 1: File type validation
    results.fileType = this.validateFileType(file);
    if (!results.fileType.isValid) {
      results.errors.push(results.fileType.error);
    }

    // Step 2: File size validation
    results.fileSize = this.validateFileSize(file);
    if (!results.fileSize.isValid) {
      results.errors.push(results.fileSize.error);
    }

    // If basic validations fail, skip advanced checks
    if (results.errors.length > 0) {
      return results;
    }

    const buffer = file.buffer;

    // Step 3: Dimension validation
    results.dimensions = await this.validateDimensions(buffer);
    if (!results.dimensions.isValid) {
      results.errors.push(results.dimensions.error);
    }

    // Step 4: Fashion product detection
    results.fashionDetection = await this.detectFashionProduct(buffer);
    if (!results.fashionDetection.isFashion) {
      results.errors.push(CONSTANTS.MESSAGES.NOT_FASHION_IMAGE);
    }

    // Step 5: Text detection
    results.textDetection = await this.detectText(buffer);
    if (results.textDetection.hasText) {
      results.errors.push(CONSTANTS.MESSAGES.TEXT_DETECTED);
    }

    // Final result
    results.isValid = results.errors.length === 0;

    return results;
  }

  /**
   * Process and save image to disk
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Target filename
   * @returns {Promise<string>} Path to saved image
   */
  async saveImage(buffer, filename) {
    const outputPath = path.join(CONSTANTS.UPLOAD_DIR, filename);

    // Process image: resize if too large, optimize quality
    await sharp(buffer)
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Generate thumbnail for image
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Target filename
   * @returns {Promise<string>} Path to saved thumbnail
   */
  async generateThumbnail(buffer, filename) {
    const thumbnailName = `thumb_${filename}`;
    const outputPath = path.join(CONSTANTS.UPLOAD_DIR, thumbnailName);

    await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return outputPath;
  }
}

module.exports = new ImageValidationService();