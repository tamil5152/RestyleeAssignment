/**
 * Product Service
 * 
 * Business logic layer for product operations.
 * Handles product creation, retrieval, and management.
 * 
 * @module services/product
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const database = require('../config/database');
const imageValidationService = require('./imageValidation');
const descriptionValidationService = require('./descriptionValidation');
const CONSTANTS = require('../constants');

/**
 * Product data structure
 * @typedef {Object} Product
 * @property {string} id - Unique identifier
 * @property {string} name - Product name
 * @property {string} description - Product description
 * @property {Array<Object>} images - Array of image objects
 * @property {string} images[].originalName - Original filename
 * @property {string} images[].filename - Saved filename
 * @property {string} images[].thumbnail - Thumbnail filename
 * @property {string} images[].url - Public URL
 * @property {string} images[].thumbnailUrl - Thumbnail public URL
 * @property {Object} images[].dimensions - Image dimensions
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class ProductService {
  /**
   * Create a new product with validated images
   * @param {Object} productData - Product data from request
   * @param {Array<Object>} files - Array of multer file objects
   * @returns {Promise<{success: boolean, product: Product|null, errors: Array}>}
   */
  async createProduct(productData, files) {
    const errors = [];
    const { name, description } = productData;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      errors.push(CONSTANTS.MESSAGES.NAME_REQUIRED);
    } else if (name.trim().length > 100) {
      errors.push(CONSTANTS.MESSAGES.NAME_TOO_LONG);
    }

    if (!description || description.trim().length === 0) {
      errors.push(CONSTANTS.MESSAGES.DESCRIPTION_REQUIRED);
    } else if (description.trim().length > 2000) {
      errors.push(CONSTANTS.MESSAGES.DESCRIPTION_TOO_LONG);
    }

    // Validate description content: personal info, special characters,
    // slang/short-forms, usernames/handles, relevance to product name,
    // and excessive word repetition. Skipped only when the description
    // is empty (that's already caught by the required-field check above).
    if (description && description.trim().length > 0) {
      const descriptionValidation = descriptionValidationService.validateDescriptionContent(
        name || '',
        description
      );
      if (!descriptionValidation.isValid) {
        errors.push(...descriptionValidation.errors);
      }
    }

    // Validate image count
    if (!files || files.length === 0) {
      errors.push(CONSTANTS.MESSAGES.MIN_IMAGES_REQUIRED);
    } else if (files.length > CONSTANTS.MAX_IMAGES_PER_PRODUCT) {
      errors.push(
        CONSTANTS.MESSAGES.TOO_MANY_IMAGES
          .replace('{max}', CONSTANTS.MAX_IMAGES_PER_PRODUCT)
      );
    } else if (files.length < 2) {
      errors.push(CONSTANTS.MESSAGES.MIN_IMAGES_REQUIRED);
    }

    // If basic validation fails, return early
    if (errors.length > 0) {
      return { success: false, product: null, errors };
    }

    // Validate each image. Each image's validation (dimensions, ML fashion
    // classification, portrait check, OCR) is independent of every other
    // image's, so we run them all concurrently with Promise.all instead of
    // awaiting them one at a time - this is what actually shrinks total
    // request time when a product has 2-5 images.
    const validatedImages = [];
    const imageErrors = [];

    const validations = await Promise.all(
      files.map((file) => imageValidationService.validateImage(file))
    );

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validations[i];

      if (!validation.isValid) {
        imageErrors.push({
          index: i,
          filename: file.originalname,
          errors: validation.errors
        });
      } else {
        validatedImages.push({
          file,
          validation
        });
      }
    }

    // If any image fails validation, reject the entire submission
    if (imageErrors.length > 0) {
      const allImageErrors = imageErrors.flatMap(e => 
        e.errors.map(err => `${e.filename}: ${err}`)
      );
      errors.push(...allImageErrors);
      errors.push(CONSTANTS.MESSAGES.SUBMISSION_BLOCKED);

      return { success: false, product: null, errors };
    }

    // All validations passed - save images and create product.
    // Saving the main image and generating its thumbnail don't depend on
    // each other (both just read the same source buffer), and the images
    // themselves don't depend on each other either, so everything below
    // runs concurrently instead of sequentially, file by file.
    const productId = uuidv4();

    const imageRecords = await Promise.all(
      validatedImages.map(async ({ file, validation }) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${productId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

        await Promise.all([
          imageValidationService.saveImage(file.buffer, filename),
          imageValidationService.generateThumbnail(file.buffer, filename)
        ]);

        return {
          originalName: file.originalname,
          filename,
          thumbnail: `thumb_${filename}`,
          url: `/uploads/products/${filename}`,
          thumbnailUrl: `/uploads/products/thumb_${filename}`,
          dimensions: validation.dimensions.metadata,
          size: file.size,
          mimetype: file.mimetype
        };
      })
    );

    // Create product record
    const product = {
      id: productId,
      name: name.trim(),
      description: description.trim(),
      images: imageRecords,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    database.saveProduct(product);

    return {
      success: true,
      product: this.sanitizeProduct(product),
      errors: []
    };
  }

  /**
   * Get all products
   * @returns {Array<Product>}
   */
  getAllProducts() {
    const products = database.getAllProducts();
    return products.map(p => this.sanitizeProduct(p));
  }

  /**
   * Get a single product by ID
   * @param {string} id - Product ID
   * @returns {Product|null}
   */
  getProductById(id) {
    const product = database.getProduct(id);
    return product ? this.sanitizeProduct(product) : null;
  }

  /**
   * Delete a product by ID
   * @param {string} id - Product ID
   * @returns {boolean}
   */
  deleteProduct(id) {
    return database.deleteProduct(id);
  }

  /**
   * Sanitize product for API response
   * Removes internal fields and formats data
   * @param {Object} product - Raw product from database
   * @returns {Object} Sanitized product
   */
  sanitizeProduct(product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      images: product.images.map(img => ({
        originalName: img.originalName,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        dimensions: img.dimensions,
        size: img.size
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    };
  }
}

module.exports = new ProductService();
