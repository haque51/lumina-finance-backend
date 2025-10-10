// src/services/account.service.js

import { supabase } from '../config/database.js';

class AccountService {
  async createAccount(userId, accountData) {
    try {
      // Validate currency is enabled for user
      const { data: user } = await supabase
        .from('users')
        .select('base_currency, secondary_currencies')
        .eq('id', userId)
        .single();

      const enabledCurrencies = [user.base_currency, ...(user.secondary_currencies || [])];
      if (!enabledCurrencies.includes(accountData.currency)) {
        throw new Error(`Currency ${accountData.currency} is not enabled for this user`);
      }

      // Create account
      const { data: account, error } = await supabase
        .from('accounts')
        .insert({
          user_id: userId,
          name: accountData.name,
          type: accountData.type,
          institution: accountData.institution,
          currency: accountData.currency,
          opening_balance: accountData.opening_balance,
          current_balance: accountData.opening_balance,
          interest_rate: accountData.interest_rate,
          credit_limit: accountData.credit_limit,
          is_active: accountData.is_active !== undefined ? accountData.is_active : true
        })
        .select()
        .single();

      if (error) throw error;

      return account;
    } catch (error) {
      throw error;
    }
  }

  async getAccounts(userId, filters = {}) {
    try {
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.currency) {
        query = query.eq('currency', filters.currency);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data: accounts, error } = await query;

      if (error) throw error;

      return accounts;
    } catch (error) {
      throw error;
    }
  }

  async getAccountById(userId, accountId) {
    try {
      const { data: account, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error || !account) {
        throw new Error('Account not found');
      }

      // Get transaction count
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .or(`account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .is('deleted_at', null);

      return {
        ...account,
        transaction_count: count || 0,
        balance_change: account.current_balance - account.opening_balance
      };
    } catch (error) {
      throw error;
    }
  }

  async updateAccount(userId, accountId, updates) {
    try {
      // Check if account exists
      const { data: existing } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!existing) {
        throw new Error('Account not found');
      }

      // Validate currency if being updated
      if (updates.currency && updates.currency !== existing.currency) {
        const { data: user } = await supabase
          .from('users')
          .select('base_currency, secondary_currencies')
          .eq('id', userId)
          .single();

        const enabledCurrencies = [user.base_currency, ...(user.secondary_currencies || [])];
        if (!enabledCurrencies.includes(updates.currency)) {
          throw new Error(`Currency ${updates.currency} is not enabled for this user`);
        }
      }

      // Update account
      const { data: account, error } = await supabase
        .from('accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return account;
    } catch (error) {
      throw error;
    }
  }

  async deleteAccount(userId, accountId) {
    try {
      // Check if account has transactions
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .or(`account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .is('deleted_at', null);

      if (count > 0) {
        throw new Error(`Cannot delete account with ${count} associated transactions`);
      }

      // Soft delete
      const { error } = await supabase
        .from('accounts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', accountId)
        .eq('user_id', userId);

      if (error) throw error;

      return { message: 'Account deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async getAccountSummary(userId) {
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) throw error;

      const summary = {
        total_accounts: accounts.length,
        active_accounts: accounts.filter(a => a.is_active).length,
        total_assets: accounts.filter(a => a.current_balance > 0).reduce((sum, a) => sum + a.current_balance, 0),
        total_liabilities: Math.abs(accounts.filter(a => a.current_balance < 0).reduce((sum, a) => sum + a.current_balance, 0)),
        net_worth: accounts.reduce((sum, a) => sum + a.current_balance, 0),
        by_type: {}
      };

      // Group by type
      accounts.forEach(account => {
        if (!summary.by_type[account.type]) {
          summary.by_type[account.type] = {
            count: 0,
            total_balance: 0
          };
        }
        summary.by_type[account.type].count++;
        summary.by_type[account.type].total_balance += account.current_balance;
      });

// Group by currency
      const by_currency = {};
      accounts.forEach(account => {
        if (!by_currency[account.currency]) {
          by_currency[account.currency] = {
            count: 0,
            total_balance: 0
          };
        }
        by_currency[account.currency].count++;
        by_currency[account.currency].total_balance += account.current_balance;
      });

      // Add by_currency to summary object
      summary.by_currency = by_currency;

      return summary;
    } catch (error) {
      throw error;
    }
  }
}

export default new AccountService();