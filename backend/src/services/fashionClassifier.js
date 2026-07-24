/**
 * Fashion Classifier Service
 *
 * Detects whether an uploaded image actually contains a fashion product
 * (clothing, footwear, bag, or accessory) using a LOCAL, pre-trained
 * MobileNet image classification model.
 *
 * IMPORTANT: This does NOT call any external AI API (no OpenAI, no Google
 * Vision, no per-request network call). The model file is downloaded once
 * when the server process starts (or read from local cache) and then all
 * classification happens in-process using @tensorflow/tfjs-node. There is
 * no API key and no network round-trip per image.
 *
 * The model is a general-purpose ImageNet classifier. We don't need a
 * fashion-specific model: ImageNet already contains ~90 classes that map
 * directly to clothing / footwear / bags / accessories, so we simply check
 * whether the model's top predictions land in that whitelist.
 *
 * @module services/fashionClassifier
 */

const CONSTANTS = require('../constants');

let tf = null;
let mobilenetLib = null;
let modelPromise = null;
let loadFailed = false;

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
      // even if these native/heavy deps are missing in an environment.
      tf = require('@tensorflow/tfjs-node');
      mobilenetLib = require('@tensorflow-models/mobilenet');

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
 * Classify an image buffer and decide if it's a fashion product.
 *
 * @param {Buffer} buffer - Raw image bytes (jpg/png)
 * @returns {Promise<{available: boolean, isFashion: boolean, confidence: number, matchedClass: string|null, topPredictions: Array}>}
 */
async function classifyFashion(buffer) {
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
    // Decode straight from bytes -> uint8 tensor, no filesystem round-trip.
    imageTensor = tf.node.decodeImage(buffer, 3);

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
    // Any runtime decode/classify failure -> treat model as unavailable
    // for this image only, let the caller fall back to heuristics.
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