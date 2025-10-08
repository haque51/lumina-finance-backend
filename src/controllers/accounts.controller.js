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

      return successResponse(res, account, 'Account created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get all accounts with optional filters
   * GET /api/accounts?type=checking&currency=EUR&is_active=true
   */
  async getAccounts(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        type: req.query.type,
        currency: req.query.currency,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined
      };

      const accounts = await accountService.getAccounts(userId, filters);

      return successResponse(res, accounts, 'Accounts retrieved successfully');
    } catch (error) {
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
      const accountId = req.params.id;

      const account = await accountService.getAccountById(userId, accountId);

      return successResponse(res, account, 'Account retrieved successfully');
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Update an account
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
      const statusCode = error.message.includes('not found') ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Delete an account
   * DELETE /api/accounts/:id
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const accountId = req.params.id;

      const result = await accountService.deleteAccount(userId, accountId);

      return successResponse(res, result, 'Account deleted successfully');
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Cannot delete') ? 409 : 400;
      return errorResponse(res, error.message, statusCode);
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

      return successResponse(res, summary, 'Account summary retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new AccountsController();
