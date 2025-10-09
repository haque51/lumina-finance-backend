// recurring.controller.js - Recurring Transactions Controller for Lumina Finance Backend
// Handles HTTP requests for recurring transactions

import recurringService from '../services/recurring.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class RecurringController {
  /**
   * Create a new recurring transaction
   * POST /api/recurring
   */
  async createRecurring(req, res) {
    try {
      const userId = req.user.id;
      const recurringData = req.body;

      const recurring = await recurringService.createRecurring(userId, recurringData);

      return successResponse(res, recurring, 'Recurring transaction created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get all recurring transactions with optional filters
   * GET /api/recurring?is_active=true&type=income&account_id=xxx&frequency=monthly
   */
  async getAllRecurring(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        is_active: req.query.is_active,
        type: req.query.type, // 'income' or 'expense'
        account_id: req.query.account_id,
        frequency: req.query.frequency // 'daily', 'weekly', 'monthly', 'yearly'
      };

      const recurring = await recurringService.getAllRecurring(userId, filters);

      return successResponse(res, recurring, 'Recurring transactions retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get a single recurring transaction by ID
   * GET /api/recurring/:id
   */
  async getRecurringById(req, res) {
    try {
      const userId = req.user.id;
      const recurringId = req.params.id;

      const recurring = await recurringService.getRecurringById(userId, recurringId);

      return successResponse(res, recurring, 'Recurring transaction retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  /**
   * Update a recurring transaction
   * PUT /api/recurring/:id
   */
  async updateRecurring(req, res) {
    try {
      const userId = req.user.id;
      const recurringId = req.params.id;
      const updateData = req.body;

      const recurring = await recurringService.updateRecurring(userId, recurringId, updateData);

      return successResponse(res, recurring, 'Recurring transaction updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Delete a recurring transaction
   * DELETE /api/recurring/:id
   */
  async deleteRecurring(req, res) {
    try {
      const userId = req.user.id;
      const recurringId = req.params.id;

      const result = await recurringService.deleteRecurring(userId, recurringId);

      return successResponse(res, result, 'Recurring transaction deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Process a recurring transaction (create actual transaction)
   * POST /api/recurring/:id/process
   */
  async processRecurring(req, res) {
    try {
      const userId = req.user.id;
      const recurringId = req.params.id;

      const result = await recurringService.processRecurring(userId, recurringId);

      return successResponse(res, result, 'Recurring transaction processed successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

export default new RecurringController();