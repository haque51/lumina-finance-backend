// recurring.service.js - Recurring Transactions Service for Lumina Finance Backend
// Handles business logic for recurring transactions

import { supabase } from '../config/database.js';
import transactionService from './transaction.service.js';

class RecurringService {
  /**
   * Create a new recurring transaction
   */
  async createRecurring(userId, recurringData) {
    try {
      // Validate account exists and belongs to user
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id, currency')
        .eq('id', recurringData.account_id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (accountError || !account) {
        throw new Error('Account not found or does not belong to user');
      }

      // Validate category if provided
      if (recurringData.category_id) {
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('id, type')
          .eq('id', recurringData.category_id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (categoryError || !category) {
          throw new Error('Category not found or does not belong to user');
        }

        // Validate category type matches transaction type
        if (category.type !== recurringData.type) {
          throw new Error(`Category type (${category.type}) must match transaction type (${recurringData.type})`);
        }
      }

      // Validate currency matches account
      const currency = recurringData.currency || account.currency;
      if (currency !== account.currency) {
        throw new Error(`Currency ${currency} does not match account currency ${account.currency}`);
      }

      // Validate frequency
      const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
      if (!validFrequencies.includes(recurringData.frequency)) {
        throw new Error(`Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`);
      }

      // Validate interval
      const interval = recurringData.interval || 1;
      if (interval < 1) {
        throw new Error('Interval must be at least 1');
      }

      // Validate dates
      if (recurringData.end_date && recurringData.start_date) {
        const startDate = new Date(recurringData.start_date);
        const endDate = new Date(recurringData.end_date);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }

      // Create recurring transaction
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([{
          user_id: userId,
          name: recurringData.name,
          account_id: recurringData.account_id,
          type: recurringData.type,
          payee: recurringData.payee || null,
          category_id: recurringData.category_id || null,
          amount: parseFloat(recurringData.amount),
          currency: currency,
          frequency: recurringData.frequency,
          interval: interval,
          start_date: recurringData.start_date,
          end_date: recurringData.end_date || null,
          last_processed: null,
          is_active: recurringData.is_active !== undefined ? recurringData.is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Add next due date
      const recurringWithNextDue = this.calculateNextDue(data);
      
      return recurringWithNextDue;
    } catch (error) {
      throw new Error(`Failed to create recurring transaction: ${error.message}`);
    }
  }

  /**
   * Get all recurring transactions for a user with optional filtering
   */
  async getAllRecurring(userId, filters = {}) {
    try {
      let query = supabase
        .from('recurring_transactions')
        .select(`
          *,
          accounts:account_id (
            id,
            name,
            type,
            currency
          ),
          categories:category_id (
            id,
            name,
            type,
            icon
          )
        `)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active === 'true');
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      if (filters.frequency) {
        query = query.eq('frequency', filters.frequency);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate next due date for all recurring transactions
      const recurringWithNextDue = data.map(rec => this.calculateNextDue(rec));

      return recurringWithNextDue;
    } catch (error) {
      throw new Error(`Failed to fetch recurring transactions: ${error.message}`);
    }
  }

  /**
   * Get a single recurring transaction by ID
   */
  async getRecurringById(userId, recurringId) {
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          accounts:account_id (
            id,
            name,
            type,
            currency,
            current_balance
          ),
          categories:category_id (
            id,
            name,
            type,
            icon
          )
        `)
        .eq('id', recurringId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error || !data) {
        throw new Error('Recurring transaction not found');
      }

      // Calculate next due date
      const recurringWithNextDue = this.calculateNextDue(data);

      return recurringWithNextDue;
    } catch (error) {
      throw new Error(`Failed to fetch recurring transaction: ${error.message}`);
    }
  }

  /**
   * Update a recurring transaction
   */
  async updateRecurring(userId, recurringId, updateData) {
    try {
      // First verify recurring exists and belongs to user
      const existingRecurring = await this.getRecurringById(userId, recurringId);

      // Validate account if being updated
      if (updateData.account_id !== undefined) {
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id, currency')
          .eq('id', updateData.account_id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (accountError || !account) {
          throw new Error('Account not found or does not belong to user');
        }
      }

      // Validate category if being updated
      if (updateData.category_id !== undefined && updateData.category_id !== null) {
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('id, type')
          .eq('id', updateData.category_id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (categoryError || !category) {
          throw new Error('Category not found or does not belong to user');
        }

        // Validate category type
        const transactionType = updateData.type || existingRecurring.type;
        if (category.type !== transactionType) {
          throw new Error(`Category type must match transaction type`);
        }
      }

      // Validate frequency if being updated
      if (updateData.frequency !== undefined) {
        const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
        if (!validFrequencies.includes(updateData.frequency)) {
          throw new Error(`Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`);
        }
      }

      // Validate dates if being updated
      if (updateData.end_date || updateData.start_date) {
        const startDate = new Date(updateData.start_date || existingRecurring.start_date);
        const endDate = new Date(updateData.end_date || existingRecurring.end_date);
        if (updateData.end_date && endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }

      // Update recurring transaction
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', recurringId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select(`
          *,
          accounts:account_id (
            id,
            name,
            type,
            currency
          ),
          categories:category_id (
            id,
            name,
            type,
            icon
          )
        `)
        .single();

      if (error) throw error;

      // Calculate next due date
      const recurringWithNextDue = this.calculateNextDue(data);

      return recurringWithNextDue;
    } catch (error) {
      throw new Error(`Failed to update recurring transaction: ${error.message}`);
    }
  }

  /**
   * Delete a recurring transaction (soft delete)
   */
  async deleteRecurring(userId, recurringId) {
    try {
      // Verify recurring exists and belongs to user
      await this.getRecurringById(userId, recurringId);

      // Soft delete
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recurringId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) throw error;

      return { message: 'Recurring transaction deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete recurring transaction: ${error.message}`);
    }
  }

  /**
   * Process a recurring transaction (create actual transaction)
   */
  async processRecurring(userId, recurringId) {
    try {
      // Get recurring transaction
      const recurring = await this.getRecurringById(userId, recurringId);

      // Check if active
      if (!recurring.is_active) {
        throw new Error('Cannot process inactive recurring transaction');
      }

      // Check if end date has passed
      if (recurring.end_date) {
        const endDate = new Date(recurring.end_date);
        const today = new Date();
        if (today > endDate) {
          throw new Error('Recurring transaction end date has passed');
        }
      }

      // Prepare transaction data
      const transactionData = {
        date: new Date().toISOString().split('T')[0],
        type: recurring.type,
        account_id: recurring.account_id,
        payee: recurring.payee || `Recurring: ${recurring.name}`,
        category_id: recurring.category_id,
        amount: recurring.amount,
        currency: recurring.currency,
        memo: `Recurring: ${recurring.name}`
      };

      // Create the actual transaction using transaction service
      // This will automatically handle balance updates
      const transaction = await transactionService.createTransaction(userId, transactionData);

      // Update last_processed date
      await supabase
        .from('recurring_transactions')
        .update({
          last_processed: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', recurringId)
        .eq('user_id', userId);

      return {
        message: 'Recurring transaction processed successfully',
        recurring_transaction: recurring,
        created_transaction: transaction
      };
    } catch (error) {
      throw new Error(`Failed to process recurring transaction: ${error.message}`);
    }
  }

  /**
   * Calculate next due date for a recurring transaction
   * @private
   */
  calculateNextDue(recurring) {
    if (!recurring.is_active) {
      return { ...recurring, next_due_date: null, is_due: false };
    }

    const startDate = new Date(recurring.start_date);
    const lastProcessed = recurring.last_processed ? new Date(recurring.last_processed) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the base date (last processed or start date)
    const baseDate = lastProcessed || startDate;

    let nextDue = new Date(baseDate);
    const interval = recurring.interval || 1;

    // Calculate next due based on frequency
    switch (recurring.frequency) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + interval);
        break;
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + (interval * 7));
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + interval);
        break;
      case 'yearly':
        nextDue.setFullYear(nextDue.getFullYear() + interval);
        break;
    }

    // If we have an end date, check if next due is after it
    if (recurring.end_date) {
      const endDate = new Date(recurring.end_date);
      if (nextDue > endDate) {
        return { ...recurring, next_due_date: null, is_due: false, status: 'ended' };
      }
    }

    // Check if it's due
    const isDue = nextDue <= today;

    return {
      ...recurring,
      next_due_date: nextDue.toISOString().split('T')[0],
      is_due: isDue,
      status: isDue ? 'due' : 'scheduled'
    };
  }
}

export default new RecurringService();