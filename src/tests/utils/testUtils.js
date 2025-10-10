// Test utilities for API testing
import jwt from 'jsonwebtoken';

/**
 * Generate a test JWT token
 */
export const generateTestToken = (userId = 'test-user-id', email = 'test@example.com') => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
    { expiresIn: '1h' }
  );
};

/**
 * Create authorization header with token
 */
export const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Create a test user payload
 */
export const createTestUser = (overrides = {}) => ({
  email: 'testuser@example.com',
  password: 'TestPass123',
  name: 'Test User',
  base_currency: 'USD',
  enabled_currencies: ['USD', 'EUR'],
  ...overrides,
});

/**
 * Create a test account payload
 */
export const createTestAccount = (overrides = {}) => ({
  name: 'Test Checking Account',
  type: 'checking',
  institution: 'Test Bank',        // ✅ Added
  opening_balance: 1000,           // ✅ Changed from "balance"
  currency: 'USD',
  is_active: true,
  ...overrides,
});

/**
 * Create a test transaction payload
 */
export const createTestTransaction = (accountId, overrides = {}) => ({
  account_id: accountId,
  type: 'expense',
  amount: 50.00,
  description: 'Test expense',
  category_id: null,
  date: new Date().toISOString().split('T')[0],
  is_reconciled: false,
  ...overrides,
});

/**
 * Create a test category payload
 */
export const createTestCategory = (overrides = {}) => ({
  name: 'Test Category',
  type: 'expense',
  color: '#FF5733',
  icon: 'shopping-cart',
  parent_id: null,
  ...overrides,
});

/**
 * Create a test budget payload
 */
export const createTestBudget = (categoryId, overrides = {}) => ({
  category_id: categoryId,
  amount: 500,
  month: new Date().toISOString().substring(0, 7), // YYYY-MM format
  ...overrides,
});

/**
 * Create a test goal payload
 */
export const createTestGoal = (overrides = {}) => ({
  name: 'Test Savings Goal',
  target_amount: 5000,
  current_amount: 1000,
  target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  currency: 'USD',
  ...overrides,
});

/**
 * Create a test recurring transaction payload
 */
export const createTestRecurring = (accountId, overrides = {}) => ({
  account_id: accountId,
  type: 'expense',
  amount: 100,
  description: 'Monthly subscription',
  frequency: 'monthly',
  start_date: new Date().toISOString().split('T')[0],
  next_date: new Date().toISOString().split('T')[0],
  is_active: true,
  ...overrides,
});

/**
 * Wait for a specified time (for async operations)
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Expect standard error response structure
 */
export const expectErrorResponse = (response, statusCode, messageContains) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('error');
  if (messageContains) {
    expect(response.body.error.toLowerCase()).toContain(messageContains.toLowerCase());
  }
};

/**
 * Expect standard success response structure
 */
export const expectSuccessResponse = (response, statusCode = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('data');
  return response.body.data;
};

/**
 * Clean test database (mock function - implement based on your DB setup)
 */
export const cleanTestDatabase = async () => {
  // This should be implemented to clean test data between tests
  // For now, it's a placeholder
  console.log('Cleaning test database...');
};