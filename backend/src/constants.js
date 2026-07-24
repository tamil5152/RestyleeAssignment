/**
 * Application Constants
 * Centralized configuration values for the Restylee backend
 * 
 * @module constants
 */

const path = require('path');

const CONSTANTS = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // CORS
 CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://restylee-assignment-61ky.vercel.app',

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_PRODUCT: parseInt(process.env.MAX_IMAGES_PER_PRODUCT, 10) || 5,
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads/products'),

  // Allowed Image Formats
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],

  // Image Dimensions
  MIN_IMAGE_WIDTH: 200,
  MIN_IMAGE_HEIGHT: 200,
  MAX_IMAGE_WIDTH: 8000,
  MAX_IMAGE_HEIGHT: 8000,

  // Fashion Detection
  FASHION_CONFIDENCE_THRESHOLD: 0.6,

  // Text Detection (OCR)
  TEXT_CONFIDENCE_THRESHOLD: 60,
  MIN_TEXT_LENGTH_TO_REJECT: 3,

  // Personal Information Patterns
  PERSONAL_INFO_PATTERNS: [
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    // Phone numbers (various formats)
    /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    // Social media handles
    /@[A-Za-z0-9_]{3,30}/,
    // URLs
    /https?:\/\/[^\s]+/i,
    // ID numbers (generic patterns)
    /\b(?:ID|id|passport|license|SSN|social security)[\s:#-]*\d{4,}\b/i,
  ],

  // Validation Messages
  MESSAGES: {
    INVALID_FILE_TYPE: 'Only JPG, JPEG, and PNG images are allowed.',
    FILE_TOO_LARGE: 'Image size must not exceed 5MB.',
    TOO_MANY_IMAGES: 'Maximum {max} images allowed per product.',
    IMAGE_TOO_SMALL: 'Image dimensions must be at least {minWidth}x{minHeight} pixels.',
    IMAGE_TOO_LARGE: 'Image dimensions must not exceed {maxWidth}x{maxHeight} pixels.',
    NOT_FASHION_IMAGE: 'The uploaded image does not appear to contain a fashion product. Please upload images of clothing, footwear, bags, or accessories.',
    TEXT_DETECTED: 'Images containing text are not allowed. Please upload clean product images without text overlays, watermarks, or captions.',
    PERSONAL_INFO_DETECTED: 'Product description contains personal information (email, phone, social media, or IDs). Please remove it before submitting.',
    MIN_IMAGES_REQUIRED: 'At least 2 product images are required.',
    NAME_REQUIRED: 'Product name is required.',
    NAME_TOO_LONG: 'Product name must not exceed 100 characters.',
    DESCRIPTION_REQUIRED: 'Product description is required.',
    DESCRIPTION_TOO_LONG: 'Product description must not exceed 2000 characters.',
    SUBMISSION_BLOCKED: 'Please fix all image validation errors before submitting.',
  }
};

module.exports = CONSTANTS;
