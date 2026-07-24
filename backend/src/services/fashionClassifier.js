/**
 * Fashion Classifier Service
 *
 * Detects whether an uploaded image actually contains a fashion product
 * (clothing, footwear, bag, or accessory) using a LOCAL, pre-trained
 * MobileNet image classification model.
 *
 * IMPORTANT: This does NOT call any external AI API (no OpenAI, no Google
 * Vision/Gemini, no per-request network call). The model weights are
 * downloaded once when the server process starts (or read from local
 * cache) and then every classification runs entirely in-process using
 * pure-JS @tensorflow/tfjs (CPU backend) - no native bindings, no API
 * key, no network round-trip per image.
 *
 * The model is a general-purpose ImageNet classifier. We don't need a
 * fashion-specific model: ImageNet already contains ~90 classes that map
 * directly to clothing / footwear / bags / accessories, so we simply check
 * whether the model's top predictions land in that whitelist.
 *
 * @module services/fashionClassifier
 */

const sharp = require('sharp');
const CONSTANTS = require('../constants');

let tf = null;
let mobilenetLib = null;
let modelPromise = null;
let loadFailed = false;

// Maximum milliseconds to wait for the TF.js model on a cold start.
// If the model isn't ready in time we fall back to the fast heuristic
// so the upload request still completes quickly instead of stalling for
// 10-15 seconds while TF.js finishes initialising.
const ML_CLASSIFY_TIMEOUT_MS = parseInt(process.env.ML_CLASSIFY_TIMEOUT_MS || '4000', 10);

// MobileNet resizes internally to 224x224 anyway, so there is no benefit
// to feeding it a full-resolution photo - doing so just wastes memory
// (a 4000x3000 photo would otherwise allocate a ~140MB tensor). We
// downscale with sharp BEFORE building the tensor to keep memory usage
// small and constant regardless of the uploaded photo's original size.
const CLASSIFIER_INPUT_SIZE = 224;

/**
 * Lazily require heavy ML deps + load the model exactly once.
 * If loading fails (e.g. no outbound internet on first boot), we mark
 * loadFailed so callers can fall back to the heuristic detector instead
 * of crashing the request.
 */
function getModel() {
  if (modelPromise) return modelPromise;

  modelPromise = (async () => {
    try {
      // Require inside the function so the rest of the app still works
      // even if these deps are missing in an environment.
      tf = require('@tensorflow/tfjs');
      require('@tensorflow/tfjs-backend-cpu');
      mobilenetLib = require('@tensorflow-models/mobilenet');

      await tf.setBackend('cpu');
      await tf.ready();

      const model = await mobilenetLib.load({
        version: 2,
        alpha: 1.0
      });

      return model;
    } catch (error) {
      loadFailed = true;
      console.error('[fashionClassifier] Failed to load local ML model, ' +
        'will fall back to heuristic detection:', error.message);
      return null;
    }
  })();

  return modelPromise;
}

/**
 * Warm up the model at server startup so the first real request isn't
 * slow. Safe to call multiple times; safe to ignore failures.
 */
async function warmUp() {
  await getModel();
}

/**
 * Decode a JPG/PNG buffer into a small int32 tf.Tensor3D of shape
 * [224, 224, 3] using sharp (already a dependency) instead of tfjs-node's
 * native decoder. Downscaling here (rather than after decode) is what
 * keeps memory usage low and constant no matter how large the uploaded
 * photo is.
 * @param {Buffer} buffer
 * @returns {Promise<tf.Tensor3D>}
 */
async function bufferToTensor(buffer) {
  const { data, info } = await sharp(buffer)
    .resize(CLASSIFIER_INPUT_SIZE, CLASSIFIER_INPUT_SIZE, { fit: 'fill' })
    .removeAlpha()
    .toColorspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  return tf.tensor3d(
    Uint8Array.from(data),
    [info.height, info.width, info.channels],
    'int32'
  );
}

/**
 * Classify an image buffer and decide if it's a fashion product.
 *
 * Races the real ML classification against a timeout so that cold-start
 * TF.js model loading never stalls the entire upload request. If the
 * model isn't ready within ML_CLASSIFY_TIMEOUT_MS (default 4 s), we
 * return {available: false} so the caller falls back to the heuristic
 * immediately.
 *
 * @param {Buffer} buffer - Raw image bytes (jpg/png)
 * @returns {Promise<{available: boolean, isFashion: boolean, confidence: number, matchedClass: string|null, topPredictions: Array}>}
 */
async function classifyFashion(buffer) {
  const timeoutResult = {
    available: false,
    isFashion: false,
    confidence: 0,
    matchedClass: null,
    topPredictions: []
  };

  // Race: real classification vs. a wall-clock timeout.
  // This prevents a cold-start TF.js load (10-15 s) from stalling uploads.
  const classifyPromise = _classifyFashionInternal(buffer);
  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve({ _timedOut: true }), ML_CLASSIFY_TIMEOUT_MS)
  );

  const result = await Promise.race([classifyPromise, timeoutPromise]);

  if (result._timedOut) {
    console.warn('[fashionClassifier] ML classification timed out after ' +
      `${ML_CLASSIFY_TIMEOUT_MS}ms, falling back to heuristic.`);
    return timeoutResult;
  }

  return result;
}

/**
 * Internal classification logic (no timeout). Called by classifyFashion.
 * @param {Buffer} buffer
 */
async function _classifyFashionInternal(buffer) {
  const model = await getModel();

  if (!model || loadFailed) {
    return {
      available: false,
      isFashion: false,
      confidence: 0,
      matchedClass: null,
      topPredictions: []
    };
  }

  let imageTensor = null;

  try {
    imageTensor = await bufferToTensor(buffer);

    const predictions = await model.classify(imageTensor, 10);

    const fashionWhitelist = CONSTANTS.FASHION_IMAGENET_CLASSES;

    let bestMatch = null;
    let bestScore = 0;

    for (const prediction of predictions) {
      const className = prediction.className.toLowerCase();
      const isFashionClass = fashionWhitelist.some((fashionTerm) =>
        className.includes(fashionTerm)
      );

      if (isFashionClass && prediction.probability > bestScore) {
        bestScore = prediction.probability;
        bestMatch = prediction.className;
      }
    }

    const isFashion = bestMatch !== null &&
      bestScore >= CONSTANTS.FASHION_ML_CONFIDENCE_THRESHOLD;

    return {
      available: true,
      isFashion,
      confidence: Math.round(bestScore * 100) / 100,
      matchedClass: bestMatch,
      topPredictions: predictions.map((p) => ({
        className: p.className,
        probability: Math.round(p.probability * 1000) / 1000
      }))
    };
  } catch (error) {
    console.error('[fashionClassifier] Classification error:', error.message);
    return {
      available: false,
      isFashion: false,
      confidence: 0,
      matchedClass: null,
      topPredictions: []
    };
  } finally {
    if (imageTensor) {
      imageTensor.dispose();
    }
  }
}

module.exports = {
  warmUp,
  classifyFashion
};