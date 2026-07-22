/**
 * Database Configuration
 * 
 * Currently using an in-memory store for the assignment.
 * In production, this would connect to MongoDB, PostgreSQL, or similar.
 * 
 * @module config/database
 */

const products = new Map();

const database = {
  products,

  /**
   * Save a product to the database
   * @param {Object} product - The product to save
   * @returns {Object} The saved product with generated ID
   */
  saveProduct(product) {
    products.set(product.id, product);
    return product;
  },

  /**
   * Retrieve a product by ID
   * @param {string} id - Product ID
   * @returns {Object|null} The product or null if not found
   */
  getProduct(id) {
    return products.get(id) || null;
  },

  /**
   * Retrieve all products
   * @returns {Array} Array of all products
   */
  getAllProducts() {
    return Array.from(products.values());
  },

  /**
   * Delete a product by ID
   * @param {string} id - Product ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteProduct(id) {
    return products.delete(id);
  }
};

module.exports = database;
