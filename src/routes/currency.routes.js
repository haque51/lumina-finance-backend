import express from 'express';
import currencyController from '../controllers/currency.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/currency/rates - Get all exchange rates
router.get('/rates', currencyController.getExchangeRates);

// PUT /api/currency/rates/:currency - Update exchange rate for a currency
// Body: { rate: number }
router.put('/rates/:currency', currencyController.updateExchangeRate);

// POST /api/currency/convert - Convert amount between currencies
// Body: { amount: number, from: string, to: string }
router.post('/convert', currencyController.convertCurrency);

// DELETE /api/currency/rates/:currency - Delete exchange rate (admin only)
router.delete('/rates/:currency', currencyController.deleteExchangeRate);

export default router;