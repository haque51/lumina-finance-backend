const categoryService = require('../services/category.service');
const { successResponse, errorResponse } = require('../utils/responses');

class CategoriesController {
  /**
   * Create new category
   * POST /api/categories
   */
  async createCategory(req, res) {
    try {
      const userId = req.user.id;
      const categoryData = req.body;

      const category = await categoryService.createCategory(userId, categoryData);

      return successResponse(res, category, 'Category created successfully', 201);
    } catch (error) {
      console.error('Create category error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get all categories
   * GET /api/categories?type=income&parent_id=null
   */
  async getCategories(req, res) {
    try {
      const userId = req.user.id;
      const filters = {};

      // Extract query parameters
      if (req.query.type) {
        filters.type = req.query.type;
      }

      if (req.query.parent_id !== undefined) {
        filters.parent_id = req.query.parent_id === 'null' ? null : req.query.parent_id;
      }

      const categories = await categoryService.getCategories(userId, filters);

      return successResponse(
        res,
        {
          categories,
          total: categories.length,
          filters,
        },
        'Categories retrieved successfully'
      );
    } catch (error) {
      console.error('Get categories error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get single category by ID
   * GET /api/categories/:id
   */
  async getCategoryById(req, res) {
    try {
      const userId = req.user.id;
      const categoryId = req.params.id;

      const category = await categoryService.getCategoryById(userId, categoryId);

      return successResponse(res, category, 'Category retrieved successfully');
    } catch (error) {
      console.error('Get category error:', error);
      return errorResponse(res, error.message, 404);
    }
  }

  /**
   * Update category
   * PUT /api/categories/:id
   */
  async updateCategory(req, res) {
    try {
      const userId = req.user.id;
      const categoryId = req.params.id;
      const updateData = req.body;

      const category = await categoryService.updateCategory(
        userId,
        categoryId,
        updateData
      );

      return successResponse(res, category, 'Category updated successfully');
    } catch (error) {
      console.error('Update category error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  async deleteCategory(req, res) {
    try {
      const userId = req.user.id;
      const categoryId = req.params.id;

      const result = await categoryService.deleteCategory(userId, categoryId);

      return successResponse(res, result, 'Category deleted successfully');
    } catch (error) {
      console.error('Delete category error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get category spending statistics
   * GET /api/categories/:id/spending?start_date=2025-01-01&end_date=2025-12-31
   */
  async getCategorySpending(req, res) {
    try {
      const userId = req.user.id;
      const categoryId = req.params.id;
      const dateRange = {};

      if (req.query.start_date) {
        dateRange.start_date = req.query.start_date;
      }
      if (req.query.end_date) {
        dateRange.end_date = req.query.end_date;
      }

      const spending = await categoryService.getCategorySpending(
        userId,
        categoryId,
        dateRange
      );

      return successResponse(res, spending, 'Category spending retrieved successfully');
    } catch (error) {
      console.error('Get category spending error:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new CategoriesController();