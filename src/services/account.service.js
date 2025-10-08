const { supabase } = require('../config/database');

class AccountService {
  /**
   * Create a new account for the authenticated user
   */
  async createAccount(userId, accountData) {
    try {
      // Validate currency is enabled for user
      const { data: userData } = await supabase
        .from('users')
        .select('base_currency, secondary_currencies')
        .eq('id', userId)
        .single();

      if (!userData) {
        throw new Error('User not found');
      }

      // Check if currency is valid
      const enabledCurrencies = [userData.base_currency, ...(userData.secondary_currencies || [])];
      if (!enabledCurrencies.includes(accountData.currency)) {
        throw new Error(`Currency ${accountData.currency} is not enabled for your account`);
      }

      // Create account with opening balance = current balance
      const newAccount = {
        user_id: userId,
        name: accountData.name,
        type: accountData.type,
        institution: accountData.institution || null,
        currency: accountData.currency,
        opening_balance: accountData.opening_balance || 0,
        current_balance: accountData.opening_balance || 0,
        interest_rate: accountData.interest_rate || null,
        credit_limit: accountData.credit_limit || null,
        is_active: accountData.is_active !== undefined ? accountData.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('accounts')
        .insert([newAccount])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }

  /**
   * Get all accounts for the authenticated user with optional filters
   */
  async getAccounts(userId, filters = {}) {
    try {
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.currency) {
        query = query.eq('currency', filters.currency);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate additional stats for each account
      const accountsWithStats = await Promise.all(
        data.map(async (account) => {
          // Get transaction count
          const { count: transactionCount } = await supabase
            .from('transactions')
            .select('id', { count: 'exact', head: true })
            .or(`account_id.eq.${account.id},from_account_id.eq.${account.id},to_account_id.eq.${account.id}`)
            .is('deleted_at', null);

          return {
            ...account,
            transaction_count: transactionCount || 0,
            balance_change: account.current_balance - account.opening_balance
          };
        })
      );

      return accountsWithStats;
    } catch (error) {
      throw new Error(`Failed to get accounts: ${error.message}`);
    }
  }

  /**
   * Get a single account by ID
   */
  async getAccountById(userId, accountId) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Account not found');
        }
        throw error;
      }

      // Get transaction count
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .or(`account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .is('deleted_at', null);

      // Get recent transactions
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('id, date, type, payee, amount, currency')
        .or(`account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(5);

      return {
        ...data,
        transaction_count: transactionCount || 0,
        balance_change: data.current_balance - data.opening_balance,
        recent_transactions: recentTransactions || []
      };
    } catch (error) {
      throw new Error(`Failed to get account: ${error.message}`);
    }
  }

  /**
   * Update an account
   */
  async updateAccount(userId, accountId, updateData) {
    try {
      // Check if account exists and belongs to user
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!existingAccount) {
        throw new Error('Account not found or access denied');
      }

      // If currency is being changed, validate it
      if (updateData.currency && updateData.currency !== existingAccount.currency) {
        const { data: userData } = await supabase
          .from('users')
          .select('base_currency, secondary_currencies')
          .eq('id', userId)
          .single();

        const enabledCurrencies = [userData.base_currency, ...(userData.secondary_currencies || [])];
        if (!enabledCurrencies.includes(updateData.currency)) {
          throw new Error(`Currency ${updateData.currency} is not enabled for your account`);
        }
      }

      // Prepare update data
      const updatedFields = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be updated directly
      delete updatedFields.id;
      delete updatedFields.user_id;
      delete updatedFields.created_at;
      delete updatedFields.deleted_at;

      const { data, error } = await supabase
        .from('accounts')
        .update(updatedFields)
        .eq('id', accountId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error(`Failed to update account: ${error.message}`);
    }
  }

  /**
   * Delete an account (transaction-safe)
   */
  async deleteAccount(userId, accountId) {
    try {
      // Check if account exists and belongs to user
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!existingAccount) {
        throw new Error('Account not found or access denied');
      }

      // Check for associated transactions
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .or(`account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .is('deleted_at', null);

      if (transactionCount > 0) {
        throw new Error(
          `Cannot delete account with ${transactionCount} associated transactions. ` +
          `Please delete or reassign transactions first.`
        );
      }

      // Soft delete the account
      const { data, error } = await supabase
        .from('accounts')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', accountId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { message: 'Account deleted successfully', account: data };
    } catch (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  /**
   * Get account summary statistics
   */
  async getAccountSummary(userId) {
    try {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('type, current_balance, currency')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (!accounts) {
        return {
          total_accounts: 0,
          net_worth: 0,
          total_assets: 0,
          total_liabilities: 0,
          by_type: {}
        };
      }

      const summary = {
        total_accounts: accounts.length,
        net_worth: accounts.reduce((sum, acc) => sum + acc.current_balance, 0),
        total_assets: accounts
          .filter(acc => acc.current_balance > 0)
          .reduce((sum, acc) => sum + acc.current_balance, 0),
        total_liabilities: Math.abs(
          accounts
            .filter(acc => acc.current_balance < 0)
            .reduce((sum, acc) => sum + acc.current_balance, 0)
        ),
        by_type: {}
      };

      // Group by type
      accounts.forEach(acc => {
        if (!summary.by_type[acc.type]) {
          summary.by_type[acc.type] = {
            count: 0,
            total_balance: 0
          };
        }
        summary.by_type[acc.type].count++;
        summary.by_type[acc.type].total_balance += acc.current_balance;
      });

      return summary;
    } catch (error) {
      throw new Error(`Failed to get account summary: ${error.message}`);
    }
  }
}

module.exports = new AccountService();