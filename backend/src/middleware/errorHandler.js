/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the application.
 * Formats errors into consistent API responses.
 * 
 * @module middleware/errorHandler
 */
const multer = require('multer');
const CONSTANTS = require('../constants');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (always log server-side, regardless of env —
  // this only goes to Render's private logs, never to the client response)
  console.error('=========== SERVER ERROR ===========');
  console.error('Path:', req.method, req.originalUrl);
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack:', err.stack);
  console.error('=====================================');

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: CONSTANTS.MESSAGES.FILE_TOO_LARGE,
        errors: [CONSTANTS.MESSAGES.FILE_TOO_LARGE]
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: CONSTANTS.MESSAGES.TOO_MANY_IMAGES.replace('{max}', CONSTANTS.MAX_IMAGES_PER_PRODUCT),
        errors: [CONSTANTS.MESSAGES.TOO_MANY_IMAGES.replace('{max}', CONSTANTS.MAX_IMAGES_PER_PRODUCT)]
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      errors: [err.message]
    });
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : [err.message]
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    errors: [message]
  });
};

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ApiError,
  errorHandler,
  asyncHandler
};