// src/services/transaction.service.js

import { supabase } from '../config/database.js';

class TransactionService {
  async createTransaction(userId, transactionData) {
    try {
      if (transactionData.type === 'transfer') {
        return await this.createTransfer(userId, transactionData);
      }

      // Validate account and currency
      const { data: account } = await supabase
        .from('accounts')
        .select('currency')
        .eq('id', transactionData.account_id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!account) {
        throw new Error('Account not found');
      }

      if (account.currency !== transactionData.currency) {
        throw new Error('Transaction currency must match account currency');
      }

      // Ensure amount sign matches type
      let amount = parseFloat(transactionData.amount);
      if (transactionData.type === 'expense' && amount > 0) {
        amount = -Math.abs(amount);
      } else if (transactionData.type === 'income' && amount < 0) {
        amount = Math.abs(amount);
      }

      // Create transaction
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          date: transactionData.date,
          type: transactionData.type,
          account_id: transactionData.account_id,
          payee: transactionData.payee,
          category_id: transactionData.category_id,
          amount: amount,
          currency: transactionData.currency,
          memo: transactionData.memo
        })
        .select()
        .single();

      if (error) throw error;

      // Update account balance
      await this.updateAccountBalance(userId, transactionData.account_id, amount);

      return transaction;
    } catch (error) {
      throw error;
    }
  }

  async createTransfer(userId, transferData) {
    try {
      // Validate both accounts
      const { data: fromAccount } = await supabase
        .from('accounts')
        .select('currency')
        .eq('id', transferData.from_account_id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      const { data: toAccount } = await supabase
        .from('accounts')
        .select('currency')
        .eq('id', transferData.to_account_id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!fromAccount || !toAccount) {
        throw new Error('One or both accounts not found');
      }

      const amount = Math.abs(parseFloat(transferData.amount));

      // Create transfer transaction
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          date: transferData.date,
          type: 'transfer',
          from_account_id: transferData.from_account_id,
          to_account_id: transferData.to_account_id,
          amount: amount,
          currency: transferData.currency,
          memo: transferData.memo
        })
        .select()
        .single();

      if (error) throw error;

      // Update both account balances
      await this.updateAccountBalance(userId, transferData.from_account_id, -amount);
      await this.updateAccountBalance(userId, transferData.to_account_id, amount);

      return transaction;
    } catch (error) {
      throw error;
    }
  }

  async getTransactions(userId, filters = {}, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.account_id) {
        query = query.or(`account_id.eq.${filters.account_id},from_account_id.eq.${filters.account_id},to_account_id.eq.${filters.account_id}`);
      }

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.start_date) {
        query = query.gte('date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('date', filters.end_date);
      }

      if (filters.min_amount) {
        query = query.gte('amount', filters.min_amount);
      }

      if (filters.max_amount) {
        query = query.lte('amount', filters.max_amount);
      }

      if (filters.search) {
        query = query.or(`payee.ilike.%${filters.search}%,memo.ilike.%${filters.search}%`);
      }

      // Apply pagination and sorting
      query = query
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: transactions, error, count } = await query;

      if (error) throw error;

      return {
        transactions,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async getTransactionById(userId, transactionId) {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error || !transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error) {
      throw error;
    }
  }

  async updateTransaction(userId, transactionId, updates) {
    try {
      // Get existing transaction
      const { data: existing } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!existing) {
        throw new Error('Transaction not found');
      }

     // Revert old balance changes
      if (existing.type === 'transfer') {
        await this.updateAccountBalance(userId, existing.from_account_id, existing.amount);
        await this.updateAccountBalance(userId, existing.to_account_id, -existing.amount);
      } else {
        await this.updateAccountBalance(userId, existing.account_id, -existing.amount);
      }

      // Apply new values
      const newAmount = updates.amount !== undefined ? parseFloat(updates.amount) : existing.amount;
      const finalAmount = existing.type === 'expense' && newAmount > 0 ? -Math.abs(newAmount) :
                         existing.type === 'income' && newAmount < 0 ? Math.abs(newAmount) : newAmount;

      // Update transaction
      const { data: transaction, error } = await supabase
        .from('transactions')
        .update({
          ...updates,
          amount: finalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Apply new balance changes
      if (transaction.type === 'transfer') {
        await this.updateAccountBalance(userId, transaction.from_account_id, -transaction.amount);
        await this.updateAccountBalance(userId, transaction.to_account_id, transaction.amount);
      } else {
        await this.updateAccountBalance(userId, transaction.account_id, transaction.amount);
      }

      return transaction;
    } catch (error) {
      throw error;
    }
  }

  async deleteTransaction(userId, transactionId) {
    try {
      // Get transaction to revert balance
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Revert balance changes
      if (transaction.type === 'transfer') {
        await this.updateAccountBalance(userId, transaction.from_account_id, transaction.amount);
        await this.updateAccountBalance(userId, transaction.to_account_id, -transaction.amount);
      } else {
        await this.updateAccountBalance(userId, transaction.account_id, -transaction.amount);
      }

      // Soft delete
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', transactionId)
        .eq('user_id', userId);

      if (error) throw error;

      return { message: 'Transaction deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async toggleReconciliation(userId, transactionId) {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('is_reconciled')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const { data: updated, error } = await supabase
        .from('transactions')
        .update({
          is_reconciled: !transaction.is_reconciled,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async bulkImport(userId, transactions) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const txn of transactions) {
        try {
          await this.createTransaction(userId, txn);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            transaction: txn,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

 async updateAccountBalance(userId, accountId, amountChange) {
    try {
      const { data: account } = await supabase
        .from('accounts')
        .select('current_balance, type')  // ← Changed: added 'type'
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (!account) return;

      // ← NEW: For debt accounts (loans, credit cards), balance works inversely:
      // ← NEW: - When money comes IN (payment), balance DECREASES (debt is reduced)
      // ← NEW: - When money goes OUT (borrowing), balance INCREASES (debt grows)
      const isDebtAccount = account.type === 'loan' || account.type === 'credit_card';
      const adjustedAmountChange = isDebtAccount ? -parseFloat(amountChange) : parseFloat(amountChange);

      const newBalance = parseFloat(account.current_balance) + adjustedAmountChange;  // ← Changed: uses adjustedAmountChange

      await supabase
        .from('accounts')
        .update({
          current_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating account balance:', error);
    }
  }
}
export default new TransactionService();
