// src/controllers/accounts.controller.js
const accountService = require('../services/account.service');
const { successResponse, errorResponse } = require('../utils/responses');

class AccountsController {
  /**
   * Create a new account
   * POST /api/accounts
   */
  async createAccount(req, res) {
    try {
      const userId = req.user.id;
      const accountData = req.body;

      const account = await accountService.createAccount(userId, accountData);

      return successResponse(
        res,
        account,
        'Account created successfully',
        201
      );
    } catch (error) {
      console.error('Create account error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get all accounts with filters
   * GET /api/accounts
   */
  async getAccounts(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        type: req.query.type,
        currency: req.query.currency,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
      };

      const accounts = await accountService.getAccounts(userId, filters);

      return successResponse(
        res,
        accounts,
        'Accounts retrieved successfully'
      );
    } catch (error) {
      console.error('Get accounts error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get a single account by ID
   * GET /api/accounts/:id
   */
  async getAccountById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const account = await accountService.getAccountById(userId, id);

      return successResponse(
        res,
        account,
        'Account retrieved successfully'
      );
    } catch (error) {
      console.error('Get account error:', error);
      return errorResponse(res, error.message, 404);
    }
  }

  /**
   * Update an account
   * PUT /api/accounts/:id
   */
  async updateAccount(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;

      const account = await accountService.updateAccount(userId, id, updateData);

      return successResponse(
        res,
        account,
        'Account updated successfully'
      );
    } catch (error) {
      console.error('Update account error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Delete an account
   * DELETE /api/accounts/:id
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await accountService.deleteAccount(userId, id);

      return successResponse(
        res,
        result,
        'Account deleted successfully'
      );
    } catch (error) {
      console.error('Delete account error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get account summary statistics
   * GET /api/accounts/summary
   */
  async getAccountSummary(req, res) {
    try {
      const userId = req.user.id;

      const summary = await accountService.getAccountSummary(userId);

      return successResponse(
        res,
        summary,
        'Account summary retrieved successfully'
      );
    } catch (error) {
      console.error('Get account summary error:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new AccountsController();