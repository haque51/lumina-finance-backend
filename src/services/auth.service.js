const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const authService = {
  register: async ({ email, password, name }) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .is('deleted_at', null)
        .single();

      if (existingUser) {
        throw new Error('Email already exists');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        console.error('Supabase Auth error:', authError);
        throw new Error('Failed to create authentication account');
      }

      const { data: user, error: dbError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          name,
          base_currency: 'EUR',
          secondary_currencies: ['USD', 'BDT'],
          theme: 'light',
          monthly_income_goal: 5000,
          monthly_savings_goal: 1000,
          auto_backup: true
        }])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to create user profile');
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Invalid email or password');
      }

      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .is('deleted_at', null)
        .single();

      if (dbError || !user) {
        console.error('Database error:', dbError);
        throw new Error('User not found');
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .is('deleted_at', null)
        .single();

      if (error || !user) {
        throw new Error('Invalid refresh token');
      }

      const accessToken = generateAccessToken(user.id);

      return {
        accessToken,
        user: sanitizeUser(user)
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new Error('Invalid or expired refresh token');
    }
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw new Error('Failed to update password');
      }

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
};

function generateAccessToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
}

function sanitizeUser(user) {
  const {
    created_at,
    updated_at,
    deleted_at,
    ...sanitized
  } = user;

  return {
    id: sanitized.id,
    email: sanitized.email,
    name: sanitized.name,
    theme: sanitized.theme,
    baseCurrency: sanitized.base_currency,
    secondaryCurrencies: sanitized.secondary_currencies || [],
    monthlyIncomeGoal: sanitized.monthly_income_goal,
    monthlySavingsGoal: sanitized.monthly_savings_goal,
    defaultAccountId: sanitized.default_account_id,
    autoBackup: sanitized.auto_backup
  };
}

module.exports = authService;
