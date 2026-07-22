/**
 * Request Validator Middleware
 * 
 * Validates incoming request data using express-validator.
 * 
 * @module middleware/validator
 */

const { body, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

/**
 * Product creation validation rules
 */
const productValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .withMessage('Product name must not exceed 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 2000 })
    .withMessage('Product description must not exceed 2000 characters')
];

/**
 * Validate request middleware
 * Checks for validation errors and throws ApiError if found
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    throw new ApiError('Validation failed', 400, errorMessages);
  }

  next();
};

module.exports = {
  productValidationRules,
  validateRequest
};
