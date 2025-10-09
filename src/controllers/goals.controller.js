// goals.controller.js - Goals Controller for Lumina Finance Backend
// Handles HTTP requests for financial goals

import goalService from '../services/goal.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class GoalsController {
  /**
   * Create a new goal
   * POST /api/goals
   */
  async createGoal(req, res) {
    try {
      const userId = req.user.id;
      const goalData = req.body;

      const goal = await goalService.createGoal(userId, goalData);

      return successResponse(res, goal, 'Goal created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get all goals with optional filters
   * GET /api/goals?status=active&linked_account_id=xxx
   */
  async getAllGoals(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        status: req.query.status, // 'completed', 'active', or undefined for all
        linked_account_id: req.query.linked_account_id
      };

      const goals = await goalService.getAllGoals(userId, filters);

      return successResponse(res, goals, 'Goals retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get a single goal by ID
   * GET /api/goals/:id
   */
  async getGoalById(req, res) {
    try {
      const userId = req.user.id;
      const goalId = req.params.id;

      const goal = await goalService.getGoalById(userId, goalId);

      return successResponse(res, goal, 'Goal retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  /**
   * Update a goal
   * PUT /api/goals/:id
   */
  async updateGoal(req, res) {
    try {
      const userId = req.user.id;
      const goalId = req.params.id;
      const updateData = req.body;

      const goal = await goalService.updateGoal(userId, goalId, updateData);

      return successResponse(res, goal, 'Goal updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Delete a goal
   * DELETE /api/goals/:id
   */
  async deleteGoal(req, res) {
    try {
      const userId = req.user.id;
      const goalId = req.params.id;

      const result = await goalService.deleteGoal(userId, goalId);

      return successResponse(res, result, 'Goal deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

export default new GoalsController();