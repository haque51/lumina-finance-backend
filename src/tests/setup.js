// Test setup file - runs before all tests
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Global test timeout
jest.setTimeout(10000);

// Console warnings can be noisy in tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // Suppress console warnings during tests (optional)
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test helpers
global.testHelpers = {
  // Create a mock user object
  mockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    base_currency: 'USD',
    enabled_currencies: ['USD', 'EUR'],
    created_at: new Date().toISOString(),
  }),

  // Create mock account
  mockAccount: (userId) => ({
    id: 'test-account-id',
    user_id: userId || 'test-user-id',
    name: 'Test Account',
    type: 'checking',
    balance: 1000,
    currency: 'USD',
    is_active: true,
  }),

  // Create mock transaction
  mockTransaction: (accountId, userId) => ({
    id: 'test-transaction-id',
    user_id: userId || 'test-user-id',
    account_id: accountId || 'test-account-id',
    type: 'expense',
    amount: 50,
    description: 'Test transaction',
    date: new Date().toISOString().split('T')[0],
  }),

  // Create mock category
  mockCategory: (userId) => ({
    id: 'test-category-id',
    user_id: userId || 'test-user-id',
    name: 'Test Category',
    type: 'expense',
    parent_id: null,
  }),
};

// Export for use in tests
export default global.testHelpers;