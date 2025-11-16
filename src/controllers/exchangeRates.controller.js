import exchangeRatesService from '../services/exchangeRates.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class ExchangeRatesController {
  /**
   * GET /api/exchange-rates/historical/:month
   * Get historical exchange rates for a specific month
   */
  async getHistoricalRates(req, res) {
    try {
      const { month } = req.params;
      const userId = req.user.id;

      // Validate month format (YYYY-MM)
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        return errorResponse(res, 'Invalid month format. Use YYYY-MM (e.g., 2025-01)', 400);
      }

      const rates = await exchangeRatesService.getHistoricalRates(userId, month);

      if (!rates) {
        // Try to get earliest available rates as fallback
        const fallbackRates = await exchangeRatesService.getEarliestAvailableRates(userId, month);

        if (!fallbackRates) {
          return errorResponse(res, `No exchange rates found for ${month} or earlier`, 404);
        }

        return successResponse(res, {
          ...fallbackRates,
          isFallback: true,
          message: `No rates found for ${month}. Returning earliest available rates from ${fallbackRates.month}`
        });
      }

      return successResponse(res, rates);
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      return errorResponse(res, 'Failed to fetch historical exchange rates', 500);
    }
  }

  /**
   * POST /api/exchange-rates/snapshot
   * Save current exchange rates as a snapshot for a specific month
   */
  async saveRatesSnapshot(req, res) {
    try {
      const { month, rates } = req.body;
      const userId = req.user.id;

      // Validate month format
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        return errorResponse(res, 'Invalid month format. Use YYYY-MM (e.g., 2025-01)', 400);
      }

      // Validate rates object
      if (!rates || typeof rates !== 'object' || Object.keys(rates).length === 0) {
        return errorResponse(res, 'Rates object is required and must contain at least one currency', 400);
      }

      // Validate that all rates are numbers
      for (const [currency, rate] of Object.entries(rates)) {
        if (typeof rate !== 'number' || rate <= 0) {
          return errorResponse(res, `Invalid rate for ${currency}. Must be a positive number`, 400);
        }
      }

      const savedRates = await exchangeRatesService.saveRatesSnapshot(userId, month, rates);

      return successResponse(res, savedRates, savedRates.action === 'created' ? 201 : 200);
    } catch (error) {
      console.error('Error saving rates snapshot:', error);

      if (error.message.includes('Cannot save exchange rates for future months')) {
        return errorResponse(res, error.message, 400);
      }

      return errorResponse(res, 'Failed to save exchange rates snapshot', 500);
    }
  }

  /**
   * GET /api/exchange-rates/available-months
   * Get list of months with available exchange rate history
   */
  async getAvailableMonths(req, res) {
    try {
      const userId = req.user.id;

      const months = await exchangeRatesService.getAvailableMonths(userId);

      return successResponse(res, {
        months,
        count: months.length
      });
    } catch (error) {
      console.error('Error fetching available months:', error);
      return errorResponse(res, 'Failed to fetch available months', 500);
    }
  }

  /**
   * DELETE /api/exchange-rates/historical/:month
   * Delete exchange rate history for a specific month
   */
  async deleteRatesForMonth(req, res) {
    try {
      const { month } = req.params;
      const userId = req.user.id;

      // Validate month format
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        return errorResponse(res, 'Invalid month format. Use YYYY-MM (e.g., 2025-01)', 400);
      }

      await exchangeRatesService.deleteRatesForMonth(userId, month);

      return successResponse(res, {
        message: `Exchange rates for ${month} deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting rates:', error);
      return errorResponse(res, 'Failed to delete exchange rates', 500);
    }
  }
}

export default new ExchangeRatesController();
