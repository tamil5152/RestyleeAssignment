/**
 * Multer Configuration
 * 
 * Configures file upload handling with memory storage
 * for processing before saving to disk.
 * 
 * @module config/multer
 */

const multer = require('multer');
const CONSTANTS = require('../constants');

// Use memory storage so we can process images before saving
const storage = multer.memoryStorage();

/**
 * File filter for multer
 * Only accepts JPG, JPEG, and PNG files
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = new Set(CONSTANTS.ALLOWED_MIME_TYPES);

  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(CONSTANTS.MESSAGES.INVALID_FILE_TYPE), false);
  }
};

/**
 * Multer upload configuration
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: CONSTANTS.MAX_FILE_SIZE,
    files: CONSTANTS.MAX_IMAGES_PER_PRODUCT
  }
});

module.exports = upload;
