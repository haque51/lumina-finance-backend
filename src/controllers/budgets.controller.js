// src/controllers/budgets.controller.js

import budgetService from '../services/budget.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class BudgetsController {
  /**
   * Create a new budget
   * POST /api/budgets
   */
  async createBudget(req, res) {
    try {
      const budget = await budgetService.createBudget(req.user.id, req.body);
      return successResponse(res, budget, 'Budget created successfully', 201);
    } catch (error) {
      console.error('Error creating budget:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get all budgets for the authenticated user
   * GET /api/budgets?month=YYYY-MM&category_id=uuid
   */
  async getBudgets(req, res) {
    try {
      const filters = {
        month: req.query.month,
        category_id: req.query.category_id
      };

      const budgets = await budgetService.getBudgets(req.user.id, filters);
      return successResponse(res, budgets, 'Budgets retrieved successfully');
    } catch (error) {
      console.error('Error fetching budgets:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get a single budget by ID
   * GET /api/budgets/:id
   */
  async getBudgetById(req, res) {
    try {
      const budget = await budgetService.getBudgetById(req.user.id, req.params.id);
      return successResponse(res, budget, 'Budget retrieved successfully');
    } catch (error) {
      console.error('Error fetching budget:', error);
      const statusCode = error.message === 'Budget not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Update a budget
   * PUT /api/budgets/:id
   */
  async updateBudget(req, res) {
    try {
      const budget = await budgetService.updateBudget(req.user.id, req.params.id, req.body);
      return successResponse(res, budget, 'Budget updated successfully');
    } catch (error) {
      console.error('Error updating budget:', error);
      const statusCode = error.message === 'Budget not found' ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Delete a budget
   * DELETE /api/budgets/:id
   */
  async deleteBudget(req, res) {
    try {
      const result = await budgetService.deleteBudget(req.user.id, req.params.id);
      return successResponse(res, result, 'Budget deleted successfully');
    } catch (error) {
      console.error('Error deleting budget:', error);
      const statusCode = error.message === 'Budget not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Get budget summary for a month
   * GET /api/budgets/summary?month=YYYY-MM
   */
  async getBudgetSummary(req, res) {
    try {
      const month = req.query.month;
      const summary = await budgetService.getBudgetSummary(req.user.id, month);
      return successResponse(res, summary, 'Budget summary retrieved successfully');
    } catch (error) {
      console.error('Error fetching budget summary:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

export default new BudgetsController();