// src/app.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Import middleware
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/accounts.routes.js';
import transactionRoutes from './routes/transactions.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import budgetRoutes from './routes/budgets.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import recurringRoutes from './routes/recurring.routes.js';

import analyticsRoutes from './routes/analytics.routes.js';
import currencyRoutes from './routes/currency.routes.js';
import exchangeRatesRoutes from './routes/exchangeRates.routes.js';  // ADD THIS LINE
import cronJobsRoutes from './routes/cronJobs.routes.js';  // ADD THIS LINE
const app = express();
// Trust proxy - Required for Render, Railway, Heroku, etc.
// This allows Express to read X-Forwarded-* headers from reverse proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('dev'));

// Basic route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Lumina Finance API v1.0',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      accounts: '/api/accounts',
      transactions: '/api/transactions',
      categories: '/api/categories',
      budgets: '/api/budgets',
      goals: '/api/goals',
      recurring: '/api/recurring',
      analytics: '/api/analytics',
      currency: '/api/currency',
      exchangeRates: '/api/exchange-rates',  // ADD THIS LINE
      cron: '/api/cron'  // ADD THIS LINE
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes - ALL routes must come BEFORE error handler
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalsRoutes);           // ✅ CORRECT! Before error handler
app.use('/api/recurring', recurringRoutes);   // ✅ CORRECT! Before error handler
app.use('/api/analytics', analyticsRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/exchange-rates', exchangeRatesRoutes);  // ADD THIS LINE
app.use('/api/cron', cronJobsRoutes);  // ADD THIS LINE
// Error handling middleware (MUST BE LAST)
app.use(errorHandler);

export default app;
