// recurring.routes.js - Recurring Transactions Routes for Lumina Finance Backend
// Defines API endpoints for recurring transactions

import express from 'express';
import recurringController from '../controllers/recurring.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRecurring, validateRecurringUpdate } from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/recurring
 * @desc    Create a new recurring transaction
 * @access  Private
 */
router.post('/', validateRecurring, recurringController.createRecurring);

/**
 * @route   GET /api/recurring
 * @desc    Get all recurring transactions with optional filters
 * @access  Private
 * @query   is_active - Filter by active status (true/false)
 * @query   type - Filter by type (income/expense)
 * @query   account_id - Filter by account
 * @query   frequency - Filter by frequency (daily/weekly/monthly/yearly)
 */
router.get('/', recurringController.getAllRecurring);

/**
 * @route   GET /api/recurring/:id
 * @desc    Get a single recurring transaction by ID
 * @access  Private
 */
router.get('/:id', recurringController.getRecurringById);

/**
 * @route   PUT /api/recurring/:id
 * @desc    Update a recurring transaction
 * @access  Private
 */
router.put('/:id', validateRecurringUpdate, recurringController.updateRecurring);

/**
 * @route   DELETE /api/recurring/:id
 * @desc    Delete a recurring transaction (soft delete)
 * @access  Private
 */
router.delete('/:id', recurringController.deleteRecurring);

/**
 * @route   POST /api/recurring/:id/process
 * @desc    Process a recurring transaction (create actual transaction)
 * @access  Private
 */
router.post('/:id/process', recurringController.processRecurring);

export default router;