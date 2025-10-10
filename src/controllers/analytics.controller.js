import analyticsService from '../services/analytics.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class AnalyticsController {
  async getDashboard(req, res) {
    try {
      const userId = req.user.id;
      const month = req.query.month || new Date().toISOString().slice(0, 7);

      // Validate month format (YYYY-MM)
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        return errorResponse(res, 'Invalid month format. Use YYYY-MM', 400);
      }

      const data = await analyticsService.getDashboardData(userId, month);
      return successResponse(res, data, 'Dashboard data retrieved successfully');
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return errorResponse(res, error.message);
    }
  }

  async getSpendingByCategory(req, res) {
    try {
      const userId = req.user.id;
      const month = req.query.month || new Date().toISOString().slice(0, 7);
      const type = req.query.type || 'expense';

      // Validate month format
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        return errorResponse(res, 'Invalid month format. Use YYYY-MM', 400);
      }

      // Validate type
      if (!['expense', 'income'].includes(type)) {
        return errorResponse(res, 'Type must be either "expense" or "income"', 400);
      }

      const data = await analyticsService.getSpendingByCategory(userId, month, type);
      return successResponse(res, data, 'Spending by category retrieved successfully');
    } catch (error) {
      console.error('Error getting spending by category:', error);
      return errorResponse(res, error.message);
    }
  }

  async getMonthlyTrends(req, res) {
    try {
      const userId = req.user.id;
      const months = parseInt(req.query.months) || 6;

      // Validate months (1-12)
      if (months < 1 || months > 12) {
        return errorResponse(res, 'Months must be between 1 and 12', 400);
      }

      const data = await analyticsService.getMonthlyTrends(userId, months);
      return successResponse(res, data, 'Monthly trends retrieved successfully');
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      return errorResponse(res, error.message);
    }
  }

  async getNetWorthHistory(req, res) {
    try {
      const userId = req.user.id;
      const period = req.query.period || 'monthly';
      const limit = parseInt(req.query.limit) || 12;

      // Validate period
      if (!['daily', 'weekly', 'monthly'].includes(period)) {
        return errorResponse(res, 'Period must be "daily", "weekly", or "monthly"', 400);
      }

      // Validate limit (1-365)
      if (limit < 1 || limit > 365) {
        return errorResponse(res, 'Limit must be between 1 and 365', 400);
      }

      const data = await analyticsService.getNetWorthHistory(userId, period, limit);
      return successResponse(res, data, 'Net worth history retrieved successfully');
    } catch (error) {
      console.error('Error getting net worth history:', error);
      return errorResponse(res, error.message);
    }
  }
}

export default new AnalyticsController();