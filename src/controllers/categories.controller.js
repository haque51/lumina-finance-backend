// src/controllers/categories.controller.js

import categoryService from '../services/category.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class CategoriesController {
  async createCategory(req, res) {
    try {
      const category = await categoryService.createCategory(req.user.id, req.body);
      return successResponse(res, category, 'Category created successfully', 201);
    } catch (error) {
      console.error('Error creating category:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async getCategories(req, res) {
    try {
      const filters = {
        type: req.query.type,
        parent_id: req.query.parent_id,
        hierarchical: req.query.hierarchical === 'true'
      };
      const categories = await categoryService.getCategories(req.user.id, filters);
      return successResponse(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      console.error('Error fetching categories:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getCategoryById(req, res) {
    try {
      const category = await categoryService.getCategoryById(req.user.id, req.params.id);
      return successResponse(res, category, 'Category retrieved successfully');
    } catch (error) {
      console.error('Error fetching category:', error);
      const statusCode = error.message === 'Category not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async updateCategory(req, res) {
    try {
      const category = await categoryService.updateCategory(req.user.id, req.params.id, req.body);
      return successResponse(res, category, 'Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      const statusCode = error.message === 'Category not found' ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async deleteCategory(req, res) {
    try {
      const result = await categoryService.deleteCategory(req.user.id, req.params.id);
      return successResponse(res, result, 'Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      const statusCode = error.message === 'Category not found' ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async getCategorySpending(req, res) {
    try {
      const spending = await categoryService.getCategorySpending(req.user.id, req.params.id);
      return successResponse(res, spending, 'Category spending retrieved successfully');
    } catch (error) {
      console.error('Error fetching category spending:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

export default new CategoriesController();
