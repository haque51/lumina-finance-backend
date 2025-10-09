// src/controllers/accounts.controller.js

import accountService from '../services/account.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class AccountsController {
  async createAccount(req, res) {
    try {
      const account = await accountService.createAccount(req.user.id, req.body);
      return successResponse(res, account, 'Account created successfully', 201);
    } catch (error) {
      console.error('Error creating account:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async getAccounts(req, res) {
    try {
      const filters = {
        type: req.query.type,
        currency: req.query.currency,
        is_active: req.query.is_active
      };
      const accounts = await accountService.getAccounts(req.user.id, filters);
      return successResponse(res, accounts, 'Accounts retrieved successfully');
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getAccountById(req, res) {
    try {
      const account = await accountService.getAccountById(req.user.id, req.params.id);
      return successResponse(res, account, 'Account retrieved successfully');
    } catch (error) {
      console.error('Error fetching account:', error);
      const statusCode = error.message === 'Account not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async updateAccount(req, res) {
    try {
      const account = await accountService.updateAccount(req.user.id, req.params.id, req.body);
      return successResponse(res, account, 'Account updated successfully');
    } catch (error) {
      console.error('Error updating account:', error);
      const statusCode = error.message === 'Account not found' ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async deleteAccount(req, res) {
    try {
      const result = await accountService.deleteAccount(req.user.id, req.params.id);
      return successResponse(res, result, 'Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      const statusCode = error.message === 'Account not found' ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async getAccountSummary(req, res) {
    try {
      const summary = await accountService.getAccountSummary(req.user.id);
      return successResponse(res, summary, 'Account summary retrieved successfully');
    } catch (error) {
      console.error('Error fetching account summary:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

export default new AccountsController();