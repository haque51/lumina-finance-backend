// goals.routes.js - Goals Routes for Lumina Finance Backend
// Defines API endpoints for financial goals

import express from 'express';
import goalsController from '../controllers/goals.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateGoal, validateGoalUpdate } from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/goals
 * @desc    Create a new goal
 * @access  Private
 */
router.post('/', validateGoal, goalsController.createGoal);

/**
 * @route   GET /api/goals
 * @desc    Get all goals with optional filters
 * @access  Private
 * @query   status - Filter by status (completed, active)
 * @query   linked_account_id - Filter by linked account
 */
router.get('/', goalsController.getAllGoals);

/**
 * @route   GET /api/goals/:id
 * @desc    Get a single goal by ID
 * @access  Private
 */
router.get('/:id', goalsController.getGoalById);

/**
 * @route   PUT /api/goals/:id
 * @desc    Update a goal
 * @access  Private
 */
router.put('/:id', validateGoalUpdate, goalsController.updateGoal);

/**
 * @route   DELETE /api/goals/:id
 * @desc    Delete a goal (soft delete)
 * @access  Private
 */
router.delete('/:id', goalsController.deleteGoal);

export default router;