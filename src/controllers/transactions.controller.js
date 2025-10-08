// src/controllers/transactions.controller.js
const transactionService = require('../services/transaction.service');
const { successResponse, errorResponse } = require('../utils/responses');

class TransactionsController {
  /**
   * Create a new transaction
   * POST /api/transactions
   */
  async createTransaction(req, res) {
    try {
      const userId = req.user.id;
      const transactionData = req.body;

      const transaction = await transactionService.createTransaction(userId, transactionData);

      return successResponse(
        res,
        transaction,
        'Transaction created successfully',
        201
      );
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
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        type: req.query.type,
        accountId: req.query.accountId,
        categoryId: req.query.categoryId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        minAmount: req.query.minAmount,
        maxAmount: req.query.maxAmount,
        search: req.query.search,
        isReconciled: req.query.isReconciled === 'true' ? true : 
                      req.query.isReconciled === 'false' ? false : undefined
      };

      const result = await transactionService.getTransactions(userId, filters);

      return successResponse(
        res,
        result,
        'Transactions retrieved successfully'
      );
    } catch (error) {
      console.error('Get transactions error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get a single transaction by ID
   * GET /api/transactions/:id
   */
  async getTransactionById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const transaction = await transactionService.getTransactionById(userId, id);

      return successResponse(
        res,
        transaction,
        'Transaction retrieved successfully'
      );
    } catch (error) {
      console.error('Get transaction error:', error);
      return errorResponse(res, error.message, 404);
    }
  }

  /**
   * Update a transaction
   * PUT /api/transactions/:id
   */
  async updateTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;

      const transaction = await transactionService.updateTransaction(userId, id, updateData);

      return successResponse(
        res,
        transaction,
        'Transaction updated successfully'
      );
    } catch (error) {
      console.error('Update transaction error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Delete a transaction
   * DELETE /api/transactions/:id
   */
  async deleteTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await transactionService.deleteTransaction(userId, id);

      return successResponse(
        res,
        result,
        'Transaction deleted successfully'
      );
    } catch (error) {
      console.error('Delete transaction error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Toggle reconciliation status
   * PUT /api/transactions/:id/reconcile
   */
  async toggleReconciliation(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const transaction = await transactionService.toggleReconciliation(userId, id);

      return successResponse(
        res,
        transaction,
        'Transaction reconciliation toggled successfully'
      );
    } catch (error) {
      console.error('Toggle reconciliation error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Bulk create transactions
   * POST /api/transactions/bulk
   */
  async bulkCreateTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return errorResponse(res, 'Transactions array is required and must not be empty', 400);
      }

      const results = await transactionService.bulkCreateTransactions(userId, transactions);

      return successResponse(
        res,
        results,
        `Bulk import completed. ${results.successful.length} successful, ${results.failed.length} failed`,
        201
      );
    } catch (error) {
      console.error('Bulk create error:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new TransactionsController();