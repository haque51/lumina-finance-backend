// src/services/auth.service.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database.js';

class AuthService {
  async register(userData) {
    try {
      const { email, password, name } = userData;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      });

      if (authError) throw authError;

      // Insert user into our users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name: name || email.split('@')[0],
          base_currency: 'EUR',
          secondary_currencies: ['USD', 'BDT']
        })
        .select()
        .single();

      if (userError) throw userError;

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw error;
    }
  }

  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw new Error('Invalid credentials');

      // Get user from our table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) throw userError;

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error) throw new Error('Invalid refresh token');

      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId) {
    try {
      await supabase.auth.signOut();
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;

      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { message: 'Password changed successfully' };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return this.sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
  }

  sanitizeUser(user) {
    const { ...sanitized } = user;
    return sanitized;
  }
}

export default new AuthService();