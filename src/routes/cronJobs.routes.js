import express from 'express';
import cronJobsController from '../controllers/cronJobs.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/cron/snapshot-rates
 * @desc    Manually trigger monthly exchange rates snapshot
 * @access  Private (Admin only - add admin check if needed)
 */
router.post('/snapshot-rates', authenticateToken, cronJobsController.triggerRatesSnapshot);

/**
 * @route   GET /api/cron/status
 * @desc    Get status of cron jobs
 * @access  Private
 */
router.get('/status', authenticateToken, cronJobsController.getCronStatus);

export default router;
