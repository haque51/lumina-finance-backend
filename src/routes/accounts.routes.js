// src/routes/accounts.routes.js
const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accounts.controller');
const { authenticateToken } = require('../middleware/auth');
const { validateAccount, validateAccountUpdate } = require('../utils/validators');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/accounts/summary
 * @desc    Get account summary statistics
 * @access  Private
 */
router.get('/summary', accountsController.getAccountSummary);

/**
 * @route   POST /api/accounts
 * @desc    Create a new account
 * @access  Private
 */
router.post('/', validateAccount, accountsController.createAccount);

/**
 * @route   GET /api/accounts
 * @desc    Get all accounts with filters
 * @access  Private
 */
router.get('/', accountsController.getAccounts);

/**
 * @route   GET /api/accounts/:id
 * @desc    Get a single account by ID
 * @access  Private
 */
router.get('/:id', accountsController.getAccountById);

/**
 * @route   PUT /api/accounts/:id
 * @desc    Update an account
 * @access  Private
 */
router.put('/:id', validateAccountUpdate, accountsController.updateAccount);

/**
 * @route   DELETE /api/accounts/:id
 * @desc    Delete an account
 * @access  Private
 */
router.delete('/:id', accountsController.deleteAccount);

module.exports = router;