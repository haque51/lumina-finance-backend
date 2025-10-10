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
      const result = await authService.refreshToken(refreshToken);
      return successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      console.error('Refresh token error:', error);
      return errorResponse(res, error.message, 401);
    }
  }

  async logout(req, res) {
    try {
      const userId = req.user.id;
      await authService.logout(userId);
      return successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const result = await authService.changePassword(userId, { 
        currentPassword, 
        newPassword 
      });

      return successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);
      
      // Return 401 if current password is incorrect
      if (error.message === 'Current password is incorrect') {
        return errorResponse(res, error.message, 401);
      }
      
      return errorResponse(res, error.message, 400);
    }
  }

  async me(req, res) {
    try {
      const userId = req.user.id;
      const user = await authService.getCurrentUser(userId);
      return successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      console.error('Get user error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

export default new AuthController();