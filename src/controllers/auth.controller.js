const authService = require('../services/auth.service');
const { successResponse, errorResponse, createdResponse } = require('../utils/responses');
const { validateRegister, validateLogin, validateChangePassword } = require('../utils/validators');

const authController = {
  register: async (req, res, next) => {
    try {
      const { error, value } = validateRegister(req.body);
      if (error) {
        return errorResponse(res, error.message, 400, error.details);
      }

      const result = await authService.register(value);
      
      return createdResponse(res, {
        message: 'Registration successful',
        ...result
      });
    } catch (error) {
      if (error.message === 'Email already exists') {
        return errorResponse(res, error.message, 409);
      }
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { error, value } = validateLogin(req.body);
      if (error) {
        return errorResponse(res, error.message, 400, error.details);
      }

      const result = await authService.login(value.email, value.password);
      
      return successResponse(res, {
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      if (error.message.includes('Invalid')) {
        return errorResponse(res, 'Invalid email or password', 401);
      }
      next(error);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return errorResponse(res, 'Refresh token required', 400);
      }

      const result = await authService.refreshToken(refreshToken);
      
      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }
  },

  logout: async (req, res, next) => {
    try {
      await supabase.auth.signOut();
      
      return successResponse(res, { 
        message: 'Logout successful' 
      });
    } catch (error) {
      next(error);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const { error, value } = validateChangePassword(req.body);
      if (error) {
        return errorResponse(res, error.message, 400, error.details);
      }

      await authService.changePassword(
        req.user.id,
        value.currentPassword,
        value.newPassword
      );
      
      return successResponse(res, { 
        message: 'Password changed successfully' 
      });
    } catch (error) {
      if (error.message === 'Current password is incorrect') {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  },

  getCurrentUser: async (req, res, next) => {
    try {
      return successResponse(res, { 
        user: req.user 
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
