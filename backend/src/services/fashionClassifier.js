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
 * pure-JS @tensorflow/tfjs (CPU backend) — no native bindings, no API
 * key, no network round-trip per image.
 *
 * @module services/fashionClassifier
 */

const sharp = require('sharp');
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
 * Decode a JPG/PNG buffer into an int32 tf.Tensor3D of shape [h, w, 3]
 * using sharp (already a dependency) instead of tfjs-node's native
 * decoder, so no native compilation is required at deploy time.
 * @param {Buffer} buffer
 * @returns {Promise<tf.Tensor3D>}
 */
async function bufferToTensor(buffer) {
  const { data, info } = await sharp(buffer)
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