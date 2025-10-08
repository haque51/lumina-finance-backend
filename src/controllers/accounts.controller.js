const accountService = require('../services/account.service');
const { successResponse, errorResponse } = require('../utils/responses');

class AccountsController {
  /**
   * Create new account
   * POST /api/accounts
   */
  async createAccount(req, res) {
    try {
      const userId = req.user.id;
      const accountData = req.body;

      const account = await accountService.createAccount(userId, accountData);

      return successResponse(res, account, 'Account created successfully', 201);
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
      const filters = {};

      if (req.query.type) filters.type = req.query.type;
      if (req.query.currency) filters.currency = req.query.currency;
      if (req.query.is_active !== undefined) {
        filters.is_active = req.query.is_active === 'true';
      }

      const accounts = await accountService.getAccounts(userId, filters);

      return successResponse(
        res,
        {
          accounts,
          total: accounts.length,
          filters,
        },
        'Accounts retrieved successfully'
      );
    } catch (error) {
      console.error('Get accounts error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get account summary
   * GET /api/accounts/summary
   */
  async getAccountSummary(req, res) {
    try {
      const userId = req.user.id;

      const summary = await accountService.getAccountSummary(userId);

      return successResponse(res, summary, 'Account summary retrieved successfully');
    } catch (error) {
      console.error('Get account summary error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get single account
   * GET /api/accounts/:id
   */
  async getAccountById(req, res) {
    try {
      const userId = req.user.id;
      const accountId = req.params.id;

      const account = await accountService.getAccountById(userId, accountId);

      return successResponse(res, account, 'Account retrieved successfully');
    } catch (error) {
      console.error('Get account error:', error);
      return errorResponse(res, error.message, 404);
    }
  }

  /**
   * Update account
   * PUT /api/accounts/:id
   */
  async updateAccount(req, res) {
    try {
      const userId = req.user.id;
      const accountId = req.params.id;
      const updateData = req.body;

      const account = await accountService.updateAccount(userId, accountId, updateData);

      return successResponse(res, account, 'Account updated successfully');
    } catch (error) {
      console.error('Update account error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Delete account
   * DELETE /api/accounts/:id
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const accountId = req.params.id;

      const result = await accountService.deleteAccount(userId, accountId);

      return successResponse(res, result, 'Account deleted successfully');
    } catch (error) {
      console.error('Delete account error:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new AccountsController();