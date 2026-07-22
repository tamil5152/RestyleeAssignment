/**
 * Product Controller
 * 
 * Handles HTTP requests for product-related operations.
 * Delegates business logic to the ProductService.
 * 
 * @module controllers/product
 */

const productService = require('../services/product');
const { asyncHandler } = require('../middleware/errorHandler');

class ProductController {
  /**
   * Create a new product
   * POST /api/products
   */
  createProduct = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const files = req.files || [];

    const result = await productService.createProduct(
      { name, description },
      files
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Product creation failed',
        errors: result.errors
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.product
    });
  });

  /**
   * Get all products
   * GET /api/products
   */
  getAllProducts = asyncHandler(async (req, res) => {
    const products = productService.getAllProducts();

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      count: products.length
    });
  });

  /**
   * Get a single product by ID
   * GET /api/products/:id
   */
  getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errors: ['Product with the given ID does not exist']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });
  });

  /**
   * Delete a product by ID
   * DELETE /api/products/:id
   */
  deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = productService.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errors: ['Product with the given ID does not exist']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  });
}

module.exports = new ProductController();
