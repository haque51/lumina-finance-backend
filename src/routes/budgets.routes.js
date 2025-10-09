// src/routes/budgets.routes.js

import express from 'express';
import budgetsController from '../controllers/budgets.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBudget, validateBudgetUpdate } from '../utils/validators.js';

const router = express.Router();

/**
 * Budget Routes
 * All routes require authentication
 */

// Get budget summary (must be before /:id to avoid route conflict)
router.get(
  '/summary',
  authenticateToken,
  budgetsController.getBudgetSummary
);

// Create a new budget
router.post(
  '/',
  authenticateToken,
  validateBudget,
  budgetsController.createBudget
);

// Get all budgets with optional filters
router.get(
  '/',
  authenticateToken,
  budgetsController.getBudgets
);

// Get a single budget by ID
router.get(
  '/:id',
  authenticateToken,
  budgetsController.getBudgetById
);

// Update a budget
router.put(
  '/:id',
  authenticateToken,
  validateBudgetUpdate,
  budgetsController.updateBudget
);

// Delete a budget
router.delete(
  '/:id',
  authenticateToken,
  budgetsController.deleteBudget
);

export default router;