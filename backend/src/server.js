/**
 * Restylee Product Listing API
 * 
 * Main server entry point.
 * Express application with CORS, security headers, rate limiting,
 * and product listing routes.
 * 
 * @module server
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const CONSTANTS = require('./constants');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const productRoutes = require('./routes/product');
const healthRoutes = require('./routes/health');
const fashionClassifier = require('./services/fashionClassifier');
const ocrWorkerPool = require('./services/ocrWorkerPool');

const app = express();
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: CONSTANTS.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errors: ['Rate limit exceeded']
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (CONSTANTS.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files - serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/products', productRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restylee Product Listing API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: [`Cannot ${req.method} ${req.path}`]
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = CONSTANTS.PORT;

// Load the local fashion-detection ML model in the background at boot so
// the first product upload doesn't have to wait for it. Uploads still
// work while this is loading (they just fall back to the heuristic
// detector until it's ready).
fashionClassifier.warmUp();

// Spin up the persistent OCR worker pool in the background at boot too,
// for the same reason - so the first upload doesn't pay the one-off
// Tesseract worker startup cost (loading the WASM core + traineddata).
ocrWorkerPool.warmUp();

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   Restylee Product Listing API                           ║
  ║   Server running on port ${PORT}                            ║
  ║   Environment: ${CONSTANTS.NODE_ENV.padEnd(40)}║
  ║                                                          ║
  ║   Endpoints:                                             ║
  ║   • GET  /api/health          - Health check             ║
  ║   • GET  /api/products        - List all products        ║
  ║   • POST /api/products        - Create product           ║
  ║   • GET  /api/products/:id    - Get single product       ║
  ║   • DEL  /api/products/:id    - Delete product           ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;