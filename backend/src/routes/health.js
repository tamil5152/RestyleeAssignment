/**
 * Health Check Routes
 * 
 * @module routes/health
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Check API health status
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @route   GET /api/ping
 * @desc    Ultra-lightweight keep-alive endpoint.
 *          The frontend pings this every 10 minutes so Render's free-tier
 *          instance never spins down. Returns in < 5 ms with a minimal
 *          payload so it never meaningfully loads the server.
 * @access  Public
 */
router.get('/ping', (req, res) => {
  res.status(200).json({ ok: true });
});

module.exports = router;
