import express from 'express';
import exchangeRatesController from '../controllers/exchangeRates.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/exchange-rates/historical/:month
 * @desc    Get historical exchange rates for a specific month
 * @access  Private
 * @param   month - Month in format YYYY-MM (e.g., 2025-01)
 * @returns Exchange rates object for the specified month
 */
router.get('/historical/:month', authenticateToken, exchangeRatesController.getHistoricalRates);

/**
 * @route   POST /api/exchange-rates/snapshot
 * @desc    Save exchange rates snapshot for a specific month
 * @access  Private
 * @body    { month: "YYYY-MM", rates: { USD: 0.92, BDT: 0.0084, EUR: 1 } }
 * @returns Saved exchange rates record
 */
router.post('/snapshot', authenticateToken, exchangeRatesController.saveRatesSnapshot);

/**
 * @route   GET /api/exchange-rates/available-months
 * @desc    Get list of months with available exchange rate history
 * @access  Private
 * @returns Array of months (dates) with available data
 */
router.get('/available-months', authenticateToken, exchangeRatesController.getAvailableMonths);

/**
 * @route   DELETE /api/exchange-rates/historical/:month
 * @desc    Delete exchange rate history for a specific month
 * @access  Private
 * @param   month - Month in format YYYY-MM (e.g., 2025-01)
 * @returns Success message
 */
router.delete('/historical/:month', authenticateToken, exchangeRatesController.deleteRatesForMonth);

export default router;
