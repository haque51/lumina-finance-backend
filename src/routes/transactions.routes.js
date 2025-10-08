// src/routes/transactions.routes.js
const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactions.controller');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateCreateTransaction, 
  validateUpdateTransaction,
  validateTransactionQuery 
} = require('../utils/validators');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post(
  '/',
  validateCreateTransaction,
  transactionsController.createTransaction
);

/**
 * @route   POST /api/transactions/bulk
 * @desc    Bulk create transactions
 * @access  Private
 */
router.post(
  '/bulk',
  transactionsController.bulkCreateTransactions
);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions with filters
 * @access  Private
 */
router.get(
  '/',
  validateTransactionQuery,
  transactionsController.getTransactions
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get a single transaction by ID
 * @access  Private
 */
router.get(
  '/:id',
  transactionsController.getTransactionById
);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update a transaction
 * @access  Private
 */
router.put(
  '/:id',
  validateUpdateTransaction,
  transactionsController.updateTransaction
);

/**
 * @route   PUT /api/transactions/:id/reconcile
 * @desc    Toggle reconciliation status
 * @access  Private
 */
router.put(
  '/:id/reconcile',
  transactionsController.toggleReconciliation
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a transaction
 * @access  Private
 */
router.delete(
  '/:id',
  transactionsController.deleteTransaction
);

module.exports = router;