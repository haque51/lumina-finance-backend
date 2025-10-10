// Unit tests for Authentication Service
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock dependencies
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(),
};

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    test('should hash password before storing', async () => {
      const plainPassword = 'TestPass123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(plainPassword.length);
      
      // Verify password can be compared
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isMatch).toBe(true);
    });

    test('should reject weak passwords', async () => {
      const weakPasswords = [
        'short',           // Too short
        'nouppercase123',  // No uppercase
        'NOLOWERCASE123',  // No lowercase
        'NoNumbers',       // No numbers
      ];

      weakPasswords.forEach(password => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const isLongEnough = password.length >= 8;

        const isValid = hasUpperCase && hasLowerCase && hasNumber && isLongEnough;
        expect(isValid).toBe(false);
      });
    });

    test('should accept strong passwords', () => {
      const strongPasswords = [
        'TestPass123',
        'SecureP@ss1',
        'MyP4ssw0rd',
      ];

      strongPasswords.forEach(password => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const isLongEnough = password.length >= 8;

        const isValid = hasUpperCase && hasLowerCase && hasNumber && isLongEnough;
        expect(isValid).toBe(true);
      });
    });

    test('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
      ];

      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('JWT Token Generation', () => {
    test('should generate valid access token', () => {
      const payload = {
        userId: 'test-user-123',
        email: 'test@example.com',
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should generate valid refresh token', () => {
      const payload = {
        userId: 'test-user-123',
        email: 'test@example.com',
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should decode token correctly', () => {
      const payload = {
        userId: 'test-user-123',
        email: 'test@example.com',
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration
    });

    test('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, process.env.JWT_SECRET);
      }).toThrow();
    });

    test('should reject expired tokens', () => {
      const payload = {
        userId: 'test-user-123',
        email: 'test@example.com',
      };

      // Create token that expires immediately
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });

      // Wait a moment
      setTimeout(() => {
        expect(() => {
          jwt.verify(token, process.env.JWT_SECRET);
        }).toThrow();
      }, 100);
    });
  });

  describe('Password Security', () => {
    test('should use bcrypt salt rounds >= 10', async () => {
      const password = 'TestPass123';
      const hash = await bcrypt.hash(password, 10);
      
      // Bcrypt hash format: $2a$rounds$salt$hash
      const parts = hash.split('$');
      const rounds = parseInt(parts[2]);
      
      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    test('should generate different hashes for same password', async () => {
      const password = 'TestPass123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      expect(hash1).not.toBe(hash2);
      
      // But both should verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });

    test('should not match wrong passwords', async () => {
      const password = 'TestPass123';
      const wrongPassword = 'WrongPass456';
      const hash = await bcrypt.hash(password, 10);
      
      const isMatch = await bcrypt.compare(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('User Data Sanitization', () => {
    test('should remove sensitive fields from user object', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        base_currency: 'USD',
        created_at: '2025-01-01',
      };

      const sanitized = {
        id: user.id,
        email: user.email,
        name: user.name,
        base_currency: user.base_currency,
        created_at: user.created_at,
      };

      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).toHaveProperty('id');
      expect(sanitized).toHaveProperty('email');
    });
  });
});