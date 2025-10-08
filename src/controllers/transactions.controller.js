const transactionService = require('../services/transaction.service');
const { successResponse, errorResponse } = require('../utils/responses');

class TransactionsController {
  /**
   * Create new transaction
   * POST /api/transactions
   */
  async createTransaction(req, res) {
    try {
      const userId = req.user.id;
      const transactionData = req.body;

      const transaction = await transactionService.createTransaction(
        userId,
        transactionData
      );

      return successResponse(res, transaction, 'Transaction created successfully', 201);
    } catch (error) {
      console.error('Create transaction error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get all transactions with filters
   * GET /api/transactions
   */
  async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const filters = {};
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      // Extract filters from query params
      if (req.query.type) filters.type = req.query.type;
      if (req.query.account_id) filters.account_id = req.query.account_id;
      if (req.query.category_id) filters.category_id = req.query.category_id;
      if (req.query.start_date) filters.start_date = req.query.start_date;
      if (req.query.end_date) filters.end_date = req.query.end_date;
      if (req.query.min_amount) filters.min_amount = parseFloat(req.query.min_amount);
      if (req.query.max_amount) filters.max_amount = parseFloat(req.query.max_amount);
      if (req.query.search) filters.search = req.query.search;
      if (req.query.is_reconciled !== undefined) {
        filters.is_reconciled = req.query.is_reconciled === 'true';
      }

      const result = await transactionService.getTransactions(
        userId,
        filters,
        pagination
      );

      return successResponse(res, result, 'Transactions retrieved successfully');
    } catch (error) {
      console.error('Get transactions error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get single transaction
   * GET /api/transactions/:id
   */
  async getTransactionById(req, res) {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;

      const transaction = await transactionService.getTransactionById(
        userId,
        transactionId
      );

      return successResponse(res, transaction, 'Transaction retrieved successfully');
    } catch (error) {
      console.error('Get transaction error:', error);
      return errorResponse(res, error.message, 404);
    }
  }

  /**
   * Update transaction
   * PUT /api/transactions/:id
   */
  async updateTransaction(req, res) {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;
      const updateData = req.body;

      const transaction = await transactionService.updateTransaction(
        userId,
        transactionId,
        updateData
      );

      return successResponse(res, transaction, 'Transaction updated successfully');
    } catch (error) {
      console.error('Update transaction error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Delete transaction
   * DELETE /api/transactions/:id
   */
  async deleteTransaction(req, res) {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;

      const result = await transactionService.deleteTransaction(userId, transactionId);

      return successResponse(res, result, 'Transaction deleted successfully');
    } catch (error) {
      console.error('Delete transaction error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Toggle reconciliation status
   * PUT /api/transactions/:id/reconcile
   */
  async reconcileTransaction(req, res) {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;

      const transaction = await transactionService.reconcileTransaction(
        userId,
        transactionId
      );

      return successResponse(
        res,
        transaction,
        `Transaction ${transaction.is_reconciled ? 'reconciled' : 'unreconciled'} successfully`
      );
    } catch (error) {
      console.error('Reconcile transaction error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Bulk import transactions
   * POST /api/transactions/bulk
   */
  async bulkImport(req, res) {
    try {
      const userId = req.user.id;
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return errorResponse(res, 'Transactions array is required', 400);
      }

      const result = await transactionService.bulkImport(userId, transactions);

      return successResponse(res, result, 'Transactions imported successfully', 201);
    } catch (error) {
      console.error('Bulk import error:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new TransactionsController();