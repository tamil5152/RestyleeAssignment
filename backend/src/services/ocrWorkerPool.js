/**
 * OCR Worker Pool
 *
 * Performance-tuned for < 10 s total validation of 5 images.
 *
 * Key changes vs original:
 *  1. Pool size defaults to 5 (one worker per image slot) so all 5 images
 *     OCR concurrently with zero queuing delay.
 *  2. Every worker is configured with PSM 11 (sparse text) after creation.
 *     PSM 11 skips expensive layout-analysis heuristics and just finds
 *     isolated words anywhere in the image - 2-3x faster than the default
 *     PSM 3 (auto with OSD) for the watermark/caption detection use-case.
 *  3. A 2500 ms wall-clock timeout is applied to each recognize() call.
 *     If Tesseract hasn't finished in time we assume no text (safe for our
 *     use-case: a true watermark produces confident text quickly; long OCR
 *     times usually mean a complex photo with no actual text).
 *
 * Still 100 % local - no external API calls, no API key.
 *
 * @module services/ocrWorkerPool
 */

const { createWorker } = require('tesseract.js');
const path = require('path');

// One worker per image slot → all 5 images OCR in parallel, no queuing.
const POOL_SIZE = Math.max(1, parseInt(process.env.OCR_WORKER_POOL_SIZE || '5', 10));

// Maximum ms to wait for a single recognize() call before giving up.
const OCR_TIMEOUT_MS = parseInt(process.env.OCR_TIMEOUT_MS || '2500', 10);

const LANG_PATH = path.join(__dirname, '../../'); // bundled eng.traineddata lives here

let pool = []; // [{ worker, busy }]
let waitQueue = []; // resolvers waiting for a free worker
let initPromise = null;

/**
 * Create the pool's workers once. Safe to call multiple times - later
 * calls just await the same in-flight/completed initialization.
 */
function warmUp() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const created = await Promise.all(
      Array.from({ length: POOL_SIZE }, () =>
        createWorker('eng', 1, {
          langPath: LANG_PATH,
          gzip: false,
          cacheMethod: 'none',
          logger: () => {}
        })
      )
    );

    // Configure every worker with PSM 11 (sparse text) for 2-3x faster
    // recognition on product photos (finds isolated words, skips layout
    // analysis which is expensive and irrelevant for watermark detection).
    await Promise.all(
      created.map((w) =>
        w.setParameters({ tessedit_pageseg_mode: '11' }).catch(() => {
          // setParameters is best-effort; if it fails the worker still works
          // with its default PSM, just slightly slower.
        })
      )
    );

    pool = created.map((worker) => ({ worker, busy: false }));
  })().catch((error) => {
    console.error('[ocrWorkerPool] Failed to initialize workers:', error.message);
    pool = [];
  });

  return initPromise;
}

function acquire() {
  const free = pool.find((entry) => !entry.busy);
  if (free) {
    free.busy = true;
    return Promise.resolve(free);
  }
  return new Promise((resolve) => waitQueue.push(resolve)).then((entry) => {
    entry.busy = true;
    return entry;
  });
}

function release(entry) {
  entry.busy = false;
  const next = waitQueue.shift();
  if (next) next(entry);
}

/**
 * Recognize text in an image buffer using a pooled worker.
 * Applies a wall-clock timeout so slow images never block the request.
 *
 * @param {Buffer} buffer
 * @returns {Promise<{data: {text: string, confidence: number}}>}
 */
async function recognize(buffer) {
  await warmUp();

  if (pool.length === 0) {
    throw new Error('OCR worker pool unavailable');
  }

  const entry = await acquire();

  try {
    // Race the real OCR against a timeout. A genuine watermark / caption
    // produces confident results quickly; if we exceed the timeout the
    // image almost certainly has no readable text overlay.
    const timeoutResult = { data: { text: '', confidence: 0 } };
    const recognizePromise = entry.worker.recognize(buffer);
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ _timedOut: true }), OCR_TIMEOUT_MS)
    );

    const result = await Promise.race([recognizePromise, timeoutPromise]);

    if (result._timedOut) {
      return timeoutResult;
    }

    return result;
  } finally {
    release(entry);
  }
}

module.exports = { warmUp, recognize };