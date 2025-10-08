const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories.controller');
const { authenticateToken } = require('../middleware/auth');
const {
  validateCategory,
  validateCategoryUpdate,
} = require('../utils/validators');

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  validateCategory,
  categoriesController.createCategory
);

/**
 * @route   GET /api/categories
 * @desc    Get all categories with optional filters
 * @access  Private
 * @query   type (income/expense), parent_id (uuid or null)
 */
router.get('/', authenticateToken, categoriesController.getCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, categoriesController.getCategoryById);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private
 */
router.put(
  '/:id',
  authenticateToken,
  validateCategoryUpdate,
  categoriesController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (soft delete)
 * @access  Private
 */
router.delete('/:id', authenticateToken, categoriesController.deleteCategory);

/**
 * @route   GET /api/categories/:id/spending
 * @desc    Get category spending statistics
 * @access  Private
 * @query   start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
 */
router.get(
  '/:id/spending',
  authenticateToken,
  categoriesController.getCategorySpending
);

module.exports = router;