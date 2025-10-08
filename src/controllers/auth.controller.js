// src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/responses');

class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { name, email, password, baseCurrency, secondaryCurrencies } = req.body;
      
      const result = await authService.register({
        name,
        email,
        password,
        baseCurrency,
        secondaryCurrencies
      });

      return successResponse(
        res,
        result,
        'User registered successfully',
        201
      );
    } catch (error) {
      console.error('Registration error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);

      return successResponse(
        res,
        result,
        'Login successful'
      );
    } catch (error) {
      console.error('Login error:', error);
      return errorResponse(res, error.message, 401);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return errorResponse(res, 'Refresh token is required', 400);
      }

      const result = await authService.refreshToken(refreshToken);

      return successResponse(
        res,
        result,
        'Token refreshed successfully'
      );
    } catch (error) {
      console.error('Refresh token error:', error);
      return errorResponse(res, error.message, 401);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      const userId = req.user.id;
      
      await authService.logout(userId);

      return successResponse(
        res,
        null,
        'Logout successful'
      );
    } catch (error) {
      console.error('Logout error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Change user password
   * POST /api/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);

      return successResponse(
        res,
        null,
        'Password changed successfully'
      );
    } catch (error) {
      console.error('Change password error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await authService.getUserById(userId);

      return successResponse(
        res,
        user,
        'User retrieved successfully'
      );
    } catch (error) {
      console.error('Get user error:', error);
      return errorResponse(res, error.message, 404);
    }
  }
}

module.exports = new AuthController();