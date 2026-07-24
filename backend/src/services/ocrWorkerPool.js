/**
 * OCR Worker Pool
 *
 * tesseract.js's `Tesseract.recognize()` convenience function spins up a
 * brand-new worker (spawns a process/thread, loads the WASM core, then
 * loads and parses the eng.traineddata file) EVERY time it's called, and
 * tears it back down when it's done. That setup/teardown cost is roughly
 * 1-3 seconds per call, on top of the actual OCR work - and previously we
 * paid that cost for every single uploaded image, on every request.
 *
 * This module creates a small pool of persistent workers once, when the
 * server boots (see server.js -> warmUp()), and keeps them alive for the
 * lifetime of the process. Recognizing text just borrows a free worker
 * from the pool and gives it back afterwards, so the expensive
 * spin-up/tear-down only happens a handful of times total, not once per
 * image per request.
 *
 * Still 100% local - no external API calls, no API key.
 *
 * @module services/ocrWorkerPool
 */

const { createWorker } = require('tesseract.js');
const path = require('path');

// Small pool so a single product upload (2-5 images) can OCR several
// images concurrently instead of queueing behind one worker. Override
// with the OCR_WORKER_POOL_SIZE env var if the host has more/fewer CPUs.
const POOL_SIZE = Math.max(1, parseInt(process.env.OCR_WORKER_POOL_SIZE || '2', 10));

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

    pool = created.map((worker) => ({ worker, busy: false }));
  })().catch((error) => {
    // If pool creation fails, leave `pool` empty - recognize() below
    // will then throw per-call, and imageValidation.detectText() already
    // treats OCR failures as "no text detected" so uploads keep working.
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
    return await entry.worker.recognize(buffer);
  } finally {
    release(entry);
  }
}

module.exports = { warmUp, recognize };