/**
 * Product Routes
 * 
 * Defines API endpoints for product operations.
 * 
 * @module routes/product
 */

const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const productController = require('../controllers/product');
const { productValidationRules, validateRequest } = require('../middleware/validator');

/**
 * @route   POST /api/products
 * @desc    Create a new product with images
 * @access  Public
 */
router.post(
  '/',
  upload.array('images', 5),
  productValidationRules,
  validateRequest,
  productController.createProduct
);

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product by ID
 * @access  Public
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;
