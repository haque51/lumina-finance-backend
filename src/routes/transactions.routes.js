const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactions.controller');
const { authenticateToken } = require('../middleware/auth');
const { validateTransaction, validateTransactionUpdate } = require('../utils/validators');

/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  validateTransaction,
  transactionsController.createTransaction
);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions with filters and pagination
 * @access  Private
 */
router.get('/', authenticateToken, transactionsController.getTransactions);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction
 * @access  Private
 */
router.get('/:id', authenticateToken, transactionsController.getTransactionById);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
router.put(
  '/:id',
  authenticateToken,
  validateTransactionUpdate,
  transactionsController.updateTransaction
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
router.delete('/:id', authenticateToken, transactionsController.deleteTransaction);

/**
 * @route   PUT /api/transactions/:id/reconcile
 * @desc    Toggle transaction reconciliation status
 * @access  Private
 */
router.put('/:id/reconcile', authenticateToken, transactionsController.reconcileTransaction);

/**
 * @route   POST /api/transactions/bulk
 * @desc    Bulk import transactions
 * @access  Private
 */
router.post('/bulk', authenticateToken, transactionsController.bulkImport);

module.exports = router;