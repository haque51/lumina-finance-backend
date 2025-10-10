// Integration tests for Auth endpoints
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { generateTestToken, createTestUser } from '../utils/testUtils.js';

describe('Auth Endpoints Integration Tests', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = createTestUser({
        email: `test${Date.now()}@example.com`,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');

      testUser = response.body.data.user;
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    test('should reject duplicate email', async () => {
      const userData = createTestUser({
        email: testUser.email, // Use same email
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid email format', async () => {
      const userData = createTestUser({
        email: 'notanemail',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('validation');
    });

    test('should reject weak password', async () => {
      const userData = createTestUser({
        email: `test${Date.now()}@example.com`,
        password: 'weak',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('validation');
    });

    test('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          // Missing password and name
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid currency code', async () => {
      const userData = createTestUser({
        email: `test${Date.now()}@example.com`,
        base_currency: 'INVALID',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPass123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    test('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('invalid');
    });

    test('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(typeof response.body.data.accessToken).toBe('string');
    });

    test('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid.token.here',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('token');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/change-password', () => {
    test('should change password with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'TestPass123',
          newPassword: 'NewTestPass456',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('password');

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'NewTestPass456',
        })
        .expect(200);

      expect(loginResponse.body.data).toHaveProperty('accessToken');

      // Change back to original password for other tests
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .send({
          currentPassword: 'NewTestPass456',
          newPassword: 'TestPass123',
        })
        .expect(200);
    });

    test('should reject incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewTestPass456',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'TestPass123',
          newPassword: 'weak',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'TestPass123',
          newPassword: 'NewTestPass456',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authentication Edge Cases', () => {
test.skip('should handle concurrent login requests', async () => {
  // Use a unique email for each test run
  const validEmail = `test-concurrent-${Date.now()}@example.com`;
  const validPassword = 'TestPass123';
  
  // Register the user first
  await request(app)
    .post('/api/auth/register')
    .send({
      email: validEmail,
      password: validPassword,
      name: 'Concurrent Test User',
      base_currency: 'USD'
    });

  const loginRequests = Array(5).fill().map(() =>
    request(app)
      .post('/api/auth/login')
      .send({
        email: validEmail,
        password: validPassword
      })
  );

  const results = await Promise.all(loginRequests);
  
  // At least one request should succeed
  const successfulRequests = results.filter(r => r.status === 200);
  expect(successfulRequests.length).toBeGreaterThanOrEqual(1);
  
  // All successful requests should have tokens
  successfulRequests.forEach(response => {
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
  });
  
  // Failed requests (if any) should return 401
  const failedRequests = results.filter(r => r.status !== 200);
  failedRequests.forEach(response => {
    expect(response.status).toBe(401);
  });
});

    test('should sanitize user data in all responses', async () => {
      const endpoints = [
        { method: 'post', path: '/api/auth/login', body: { email: testUser.email, password: 'TestPass123' } },
        { method: 'get', path: '/api/auth/me', headers: { Authorization: `Bearer ${accessToken}` } },
      ];

      for (const endpoint of endpoints) {
        const req = request(app)[endpoint.method](endpoint.path);
        
        if (endpoint.headers) {
          Object.entries(endpoint.headers).forEach(([key, value]) => {
            req.set(key, value);
          });
        }
        
        if (endpoint.body) {
          req.send(endpoint.body);
        }

        const response = await req;
        
        if (response.status === 200) {
          expect(response.body.data.user || response.body.data).not.toHaveProperty('password');
        }
      }
    });
  });
});