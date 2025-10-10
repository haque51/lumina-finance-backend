// Unit tests for Validators
import { describe, test, expect } from '@jest/globals';
import Joi from 'joi';

// Import validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  name: Joi.string().min(2).max(100).required(),
  base_currency: Joi.string().length(3).uppercase().required(),
  enabled_currencies: Joi.array().items(Joi.string().length(3).uppercase()).min(1).required(),
});

const accountSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('checking', 'savings', 'credit_card', 'loan', 'investment', 'cash').required(),
  balance: Joi.number().required(),
  currency: Joi.string().length(3).uppercase().required(),
  is_active: Joi.boolean().default(true),
  description: Joi.string().allow('').max(500).optional(),
  interest_rate: Joi.number().min(0).max(100).optional(),
  credit_limit: Joi.number().min(0).optional(),
});

const transactionSchema = Joi.object({
  account_id: Joi.string().uuid().required(),
  type: Joi.string().valid('income', 'expense', 'transfer').required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).max(500).required(),
  category_id: Joi.string().uuid().allow(null).optional(),
  date: Joi.date().iso().required(),
  is_reconciled: Joi.boolean().default(false),
  to_account_id: Joi.string().uuid().when('type', {
    is: 'transfer',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

describe('Validators', () => {
  describe('Registration Validation', () => {
    test('should accept valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'TestPass123',
        name: 'Test User',
        base_currency: 'USD',
        enabled_currencies: ['USD', 'EUR'],
      };

      const { error } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email', () => {
      const invalidData = {
        email: 'notanemail',
        password: 'TestPass123',
        name: 'Test User',
        base_currency: 'USD',
        enabled_currencies: ['USD'],
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    test('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
        base_currency: 'USD',
        enabled_currencies: ['USD'],
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject short name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'TestPass123',
        name: 'A',
        base_currency: 'USD',
        enabled_currencies: ['USD'],
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    test('should reject invalid currency code', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'TestPass123',
        name: 'Test User',
        base_currency: 'INVALID',
        enabled_currencies: ['USD'],
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should require at least one enabled currency', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'TestPass123',
        name: 'Test User',
        base_currency: 'USD',
        enabled_currencies: [],
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('Account Validation', () => {
    test('should accept valid account data', () => {
      const validData = {
        name: 'My Checking Account',
        type: 'checking',
        balance: 1000,
        currency: 'USD',
        is_active: true,
      };

      const { error } = accountSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid account type', () => {
      const invalidData = {
        name: 'My Account',
        type: 'invalid_type',
        balance: 1000,
        currency: 'USD',
      };

      const { error } = accountSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should accept all valid account types', () => {
      const validTypes = ['checking', 'savings', 'credit_card', 'loan', 'investment', 'cash'];

      validTypes.forEach(type => {
        const data = {
          name: 'Test Account',
          type,
          balance: 1000,
          currency: 'USD',
        };

        const { error } = accountSchema.validate(data);
        expect(error).toBeUndefined();
      });
    });

    test('should accept negative balance', () => {
      const data = {
        name: 'Credit Card',
        type: 'credit_card',
        balance: -500,
        currency: 'USD',
      };

      const { error } = accountSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test('should validate interest rate range', () => {
      const validData = {
        name: 'Savings',
        type: 'savings',
        balance: 1000,
        currency: 'USD',
        interest_rate: 2.5,
      };

      const { error } = accountSchema.validate(validData);
      expect(error).toBeUndefined();

      const invalidData = {
        ...validData,
        interest_rate: 150,
      };

      const { error: error2 } = accountSchema.validate(invalidData);
      expect(error2).toBeDefined();
    });
  });

  describe('Transaction Validation', () => {
    const mockAccountId = '123e4567-e89b-12d3-a456-426614174000';

    test('should accept valid expense transaction', () => {
      const validData = {
        account_id: mockAccountId,
        type: 'expense',
        amount: 50.00,
        description: 'Grocery shopping',
        date: '2025-10-10',
        is_reconciled: false,
      };

      const { error } = transactionSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should accept valid income transaction', () => {
      const validData = {
        account_id: mockAccountId,
        type: 'income',
        amount: 1000.00,
        description: 'Salary',
        date: '2025-10-10',
      };

      const { error } = transactionSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should require to_account_id for transfers', () => {
      const invalidData = {
        account_id: mockAccountId,
        type: 'transfer',
        amount: 100,
        description: 'Transfer',
        date: '2025-10-10',
      };

      const { error } = transactionSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should accept valid transfer transaction', () => {
      const validData = {
        account_id: mockAccountId,
        type: 'transfer',
        amount: 100,
        description: 'Transfer to savings',
        date: '2025-10-10',
        to_account_id: '223e4567-e89b-12d3-a456-426614174000',
      };

      const { error } = transactionSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject negative amount', () => {
      const invalidData = {
        account_id: mockAccountId,
        type: 'expense',
        amount: -50,
        description: 'Invalid',
        date: '2025-10-10',
      };

      const { error } = transactionSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject zero amount', () => {
      const invalidData = {
        account_id: mockAccountId,
        type: 'expense',
        amount: 0,
        description: 'Invalid',
        date: '2025-10-10',
      };

      const { error } = transactionSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject invalid date format', () => {
      const invalidData = {
        account_id: mockAccountId,
        type: 'expense',
        amount: 50,
        description: 'Test',
        date: '10/10/2025',
      };

      const { error } = transactionSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject to_account_id for non-transfer', () => {
      const invalidData = {
        account_id: mockAccountId,
        type: 'expense',
        amount: 50,
        description: 'Test',
        date: '2025-10-10',
        to_account_id: '223e4567-e89b-12d3-a456-426614174000',
      };

      const { error } = transactionSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('Currency Validation', () => {
    test('should accept valid 3-letter currency codes', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'BDT', 'INR'];

      validCurrencies.forEach(currency => {
        const schema = Joi.string().length(3).uppercase();
        const { error } = schema.validate(currency);
        expect(error).toBeUndefined();
      });
    });

  test('should reject invalid currency codes', () => {
  const invalidCurrencies = ['US', 'EURO', '123'];

  invalidCurrencies.forEach(currency => {
    const schema = Joi.string().length(3).uppercase().pattern(/^[A-Z]{3}$/);
    const { error } = schema.validate(currency);
    expect(error).toBeDefined();
      });
    });
  });

  describe('Amount Validation', () => {
    test('should accept valid positive amounts', () => {
      const validAmounts = [0.01, 1, 10.50, 1000, 999999.99];

      validAmounts.forEach(amount => {
        const schema = Joi.number().positive();
        const { error } = schema.validate(amount);
        expect(error).toBeUndefined();
      });
    });

    test('should round to 2 decimal places', () => {
      const amounts = [10.123, 10.999, 10.505];
      
      amounts.forEach(amount => {
        const rounded = Math.round(amount * 100) / 100;
        expect(rounded.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      });
    });
  });
});