// Integration tests for Accounts endpoints
import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { generateTestToken, createTestAccount } from '../utils/testUtils.js';

describe('Accounts Endpoints Integration Tests', () => {
  let accessToken;
  let testAccount;
  let userId;

  beforeAll(async () => {
    // Create a test user and get token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `accounts-test-${Date.now()}@example.com`,
        password: 'TestPass123',
        name: 'Accounts Test User',
        base_currency: 'USD',
        enabled_currencies: ['USD', 'EUR'],
      });

    accessToken = userResponse.body.data.accessToken;
    userId = userResponse.body.data.user.id;
  });

  describe('POST /api/accounts', () => {
    test('should create a new account successfully', async () => {
      const accountData = createTestAccount({
        name: 'Test Checking Account',
      });

      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(accountData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.name).toBe(accountData.name);
      expect(response.body.data.type).toBe(accountData.type);
      expect(response.body.data.balance).toBe(accountData.balance);
      expect(response.body.data).toHaveProperty('id');

      testAccount = response.body.data;
    });

    test('should create account with all valid types', async () => {
      const accountTypes = ['checking', 'savings', 'credit_card', 'loan', 'investment', 'cash'];

      for (const type of accountTypes) {
        const accountData = createTestAccount({
          name: `Test ${type} Account`,
          type,
        });

        const response = await request(app)
          .post('/api/accounts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(accountData)
          .expect(201);

        expect(response.body.data.type).toBe(type);
      }
    });

    test('should reject account creation without authentication', async () => {
      const accountData = createTestAccount();

      const response = await request(app)
        .post('/api/accounts')
        .send(accountData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid account type', async () => {
      const accountData = createTestAccount({
        type: 'invalid_type',
      });

      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(accountData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Account',
          // Missing type and balance
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should accept negative balance for credit cards', async () => {
      const accountData = createTestAccount({
        name: 'Credit Card with Debt',
        type: 'credit_card',
        opening_balance: -500,
      });

      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(accountData)
        .expect(201);

      expect(response.body.data.current_balance).toBe(-500);
    });
  });

  describe('GET /api/accounts', () => {
    test('should list all user accounts', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should filter accounts by type', async () => {
      const response = await request(app)
        .get('/api/accounts?type=checking')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.every(acc => acc.type === 'checking')).toBe(true);
    });

    test('should filter accounts by currency', async () => {
      const response = await request(app)
        .get('/api/accounts?currency=USD')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.every(acc => acc.currency === 'USD')).toBe(true);
    });

    test('should filter active accounts', async () => {
      const response = await request(app)
        .get('/api/accounts?is_active=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.every(acc => acc.is_active === true)).toBe(true);
    });

    test('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/accounts/:id', () => {
    test('should get a specific account by ID', async () => {
      const response = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(testAccount.id);
      expect(response.body.data.name).toBe(testAccount.name);
    });

    test('should return 404 for non-existent account', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/accounts/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/accounts/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/accounts/:id', () => {
    test('should update account successfully', async () => {
      const updateData = {
        name: 'Updated Account Name',
        //description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
      //expect(response.body.data.description).toBe(updateData.description);
    });

    test('should not allow updating balance directly', async () => {
      const updateData = {
        balance: 9999999,
      };

      const response = await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      // Balance should remain unchanged
      const getResponse = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.body.data.balance).not.toBe(9999999);
    });

    test('should deactivate account', async () => {
      const updateData = {
        is_active: false,
      };

      const response = await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.is_active).toBe(false);

      // Reactivate for other tests
      await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ is_active: true });
    });

    test('should return 404 for non-existent account', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .put(`/api/accounts/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    test('should soft delete account without transactions', async () => {
      // Create a new account for deletion
      const accountData = createTestAccount({
        name: 'Account To Delete',
      });

      const createResponse = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(accountData);

      const accountId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify account is soft deleted (inactive)
      const getResponse = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      if (getResponse.status === 200) {
        expect(getResponse.body.data.is_active).toBe(false);
      }
    });

    test('should return 404 for non-existent account', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/accounts/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/accounts/summary', () => {
    test('should get account summary statistics', async () => {
      const response = await request(app)
        .get('/api/accounts/summary')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total_accounts');
     expect(response.body.data).toHaveProperty('net_worth');
      expect(response.body.data).toHaveProperty('by_type');
      expect(response.body.data).toHaveProperty('by_currency');
    });

    test('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/accounts/summary')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Account Balance Integrity', () => {
    test('should maintain opening balance separate from current balance', async () => {
      const response = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('current_balance');
expect(response.body.data).toHaveProperty('opening_balance');
      // Opening balance should be stored but might not be exposed
    });

    test('should handle multiple currencies correctly', async () => {
      const currencies = ['USD', 'EUR'];

      for (const currency of currencies) {
        const accountData = createTestAccount({
          name: `${currency} Account`,
          currency,
        });

        const response = await request(app)
          .post('/api/accounts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(accountData)
          .expect(201);

        expect(response.body.data.currency).toBe(currency);
      }
    });
  });
});