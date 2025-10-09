// src/controllers/transactions.controller.js

import transactionService from '../services/transaction.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class TransactionsController {
  async createTransaction(req, res) {
    try {
      const transaction = await transactionService.createTransaction(req.user.id, req.body);
      return successResponse(res, transaction, 'Transaction created successfully', 201);
    } catch (error) {
      console.error('Error creating transaction:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async getTransactions(req, res) {
    try {
      const filters = {
        type: req.query.type,
        account_id: req.query.account_id,
        category_id: req.query.category_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        min_amount: req.query.min_amount,
        max_amount: req.query.max_amount,
        search: req.query.search
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };
      const result = await transactionService.getTransactions(req.user.id, filters, pagination);
      return successResponse(res, result, 'Transactions retrieved successfully');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getTransactionById(req, res) {
    try {
      const transaction = await transactionService.getTransactionById(req.user.id, req.params.id);
      return successResponse(res, transaction, 'Transaction retrieved successfully');
    } catch (error) {
      console.error('Error fetching transaction:', error);
      const statusCode = error.message === 'Transaction not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async updateTransaction(req, res) {
    try {
      const transaction = await transactionService.updateTransaction(req.user.id, req.params.id, req.body);
      return successResponse(res, transaction, 'Transaction updated successfully');
    } catch (error) {
      console.error('Error updating transaction:', error);
      const statusCode = error.message === 'Transaction not found' ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async deleteTransaction(req, res) {
    try {
      const result = await transactionService.deleteTransaction(req.user.id, req.params.id);
      return successResponse(res, result, 'Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      const statusCode = error.message === 'Transaction not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async toggleReconciliation(req, res) {
    try {
      const transaction = await transactionService.toggleReconciliation(req.user.id, req.params.id);
      return successResponse(res, transaction, 'Transaction reconciliation toggled successfully');
    } catch (error) {
      console.error('Error toggling reconciliation:', error);
      const statusCode = error.message === 'Transaction not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async bulkImport(req, res) {
    try {
      const result = await transactionService.bulkImport(req.user.id, req.body.transactions);
      return successResponse(res, result, 'Transactions imported successfully', 201);
    } catch (error) {
      console.error('Error importing transactions:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

export default new TransactionsController();