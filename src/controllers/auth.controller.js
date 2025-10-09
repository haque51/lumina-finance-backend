// src/controllers/auth.controller.js

import authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      return successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      console.error('Registration error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      console.error('Login error:', error);
      return errorResponse(res, error.message, 401);
    }
  }

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return errorResponse(res, 'Refresh token is required', 400);
      }
      const result = await authService.refreshToken(refreshToken);
      return successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      console.error('Refresh token error:', error);
      return errorResponse(res, error.message, 401);
    }
  }

  async logout(req, res) {
    try {
      await authService.logout(req.user.id);
      return successResponse(res, null, 'Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async changePassword(req, res) {
    try {
      await authService.changePassword(req.user.id, req.body);
      return successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async me(req, res) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      console.error('Get user error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

export default new AuthController();