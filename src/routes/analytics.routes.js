import express from 'express';
import analyticsController from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/analytics/dashboard - Get dashboard analytics
// Query params: month (optional, format: YYYY-MM)
router.get('/dashboard', analyticsController.getDashboard);

// GET /api/analytics/spending-by-category - Get spending by category
// Query params: month (optional, format: YYYY-MM), type (optional, expense/income)
router.get('/spending-by-category', analyticsController.getSpendingByCategory);

// GET /api/analytics/monthly-trends - Get monthly trends
// Query params: months (optional, default 6, max 12)
router.get('/monthly-trends', analyticsController.getMonthlyTrends);

// GET /api/analytics/net-worth-history - Get net worth history
// Query params: period (optional, daily/weekly/monthly), limit (optional, default 12, max 365)
router.get('/net-worth-history', analyticsController.getNetWorthHistory);

export default router;