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

module.exports = router;
