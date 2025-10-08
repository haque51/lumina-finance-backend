const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accounts.controller');
const { authenticateToken } = require('../middleware/auth');
const { validateAccount, validateAccountUpdate } = require('../utils/validators');

/**
 * All routes are protected and require authentication
 */

/**
 * @route   GET /api/accounts/summary
 * @desc    Get account summary statistics
 * @access  Private
 */
router.get('/summary', authenticateToken, accountsController.getAccountSummary);

/**
 * @route   POST /api/accounts
 * @desc    Create a new account
 * @access  Private
 */
router.post('/', authenticateToken, validateAccount, accountsController.createAccount);

/**
 * @route   GET /api/accounts
 * @desc    Get all accounts with optional filters
 * @query   ?type=checking&currency=EUR&is_active=true
 * @access  Private
 */
router.get('/', authenticateToken, accountsController.getAccounts);

/**
 * @route   GET /api/accounts/:id
 * @desc    Get a single account by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, accountsController.getAccountById);

/**
 * @route   PUT /api/accounts/:id
 * @desc    Update an account
 * @access  Private
 */
router.put('/:id', authenticateToken, validateAccountUpdate, accountsController.updateAccount);

/**
 * @route   DELETE /api/accounts/:id
 * @desc    Delete an account (soft delete)
 * @access  Private
 */
router.delete('/:id', authenticateToken, accountsController.deleteAccount);

module.exports = router;