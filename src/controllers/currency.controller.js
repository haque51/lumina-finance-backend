import currencyService from '../services/currency.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class CurrencyController {
  async getExchangeRates(req, res) {
    try {
      const userId = req.user.id;
      const data = await currencyService.getExchangeRates(userId);
      return successResponse(res, data, 'Exchange rates retrieved successfully');
    } catch (error) {
      console.error('Error getting exchange rates:', error);
      return errorResponse(res, error.message);
    }
  }

  async updateExchangeRate(req, res) {
    try {
      const { currency } = req.params;
      const { rate } = req.body;

      // Validate rate
      if (!rate || rate <= 0) {
        return errorResponse(res, 'Rate must be a positive number', 400);
      }

      const data = await currencyService.updateExchangeRate(currency.toUpperCase(), parseFloat(rate));
      
      const statusCode = data.action === 'created' ? 201 : 200;
      const message = data.action === 'created' 
        ? 'Exchange rate created successfully' 
        : 'Exchange rate updated successfully';

      return successResponse(res, data, message, statusCode);
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      return errorResponse(res, error.message);
    }
  }

  async convertCurrency(req, res) {
    try {
      const userId = req.user.id;
      const { amount, from, to } = req.body;

      // Validate input
      if (!amount || amount <= 0) {
        return errorResponse(res, 'Amount must be a positive number', 400);
      }

      if (!from || !to) {
        return errorResponse(res, 'Both "from" and "to" currencies are required', 400);
      }

      const data = await currencyService.convertCurrency(
        userId,
        parseFloat(amount),
        from.toUpperCase(),
        to.toUpperCase()
      );

      return successResponse(res, data, 'Currency converted successfully');
    } catch (error) {
      console.error('Error converting currency:', error);
      return errorResponse(res, error.message);
    }
  }

  async deleteExchangeRate(req, res) {
    try {
      const { currency } = req.params;
      const data = await currencyService.deleteExchangeRate(currency.toUpperCase());
      return successResponse(res, data, 'Exchange rate deleted successfully');
    } catch (error) {
      console.error('Error deleting exchange rate:', error);
      return errorResponse(res, error.message);
    }
  }
}

export default new CurrencyController();