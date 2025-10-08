// src/services/transaction.service.js
const { supabase } = require('../config/database');

class TransactionService {
  /**
   * Create a new transaction and update account balance(s)
   */
  async createTransaction(userId, transactionData) {
    const {
      date,
      type,
      accountId,
      fromAccountId,
      toAccountId,
      payee,
      categoryId,
      amount,
      currency,
      memo
    } = transactionData;

    // Validate transaction type
    if (!['income', 'expense', 'transfer'].includes(type)) {
      throw new Error('Invalid transaction type. Must be income, expense, or transfer');
    }

    // For transfer transactions
    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        throw new Error('Transfer transactions require both fromAccountId and toAccountId');
      }

      if (fromAccountId === toAccountId) {
        throw new Error('Cannot transfer to the same account');
      }

      // Validate both accounts exist and belong to user
      const { data: fromAccount, error: fromError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', fromAccountId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (fromError || !fromAccount) {
        throw new Error('Source account not found or does not belong to user');
      }

      const { data: toAccount, error: toError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', toAccountId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (toError || !toAccount) {
        throw new Error('Destination account not found or does not belong to user');
      }

      // Validate currencies match (for now - future: support conversion)
      if (fromAccount.currency !== toAccount.currency) {
        throw new Error('Transfer between different currencies not yet supported');
      }

      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          date,
          type,
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount: Math.abs(amount),
          currency: fromAccount.currency,
          memo: memo || `Transfer from ${fromAccount.name} to ${toAccount.name}`
        })
        .select()
        .single();

      if (txError) throw txError;

      // Update both account balances
      const transferAmount = Math.abs(amount);

      // Debit from source account
      const { error: fromUpdateError } = await supabase
        .from('accounts')
        .update({
          current_balance: fromAccount.current_balance - transferAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', fromAccountId);

      if (fromUpdateError) throw fromUpdateError;

      // Credit to destination account
      const { error: toUpdateError } = await supabase
        .from('accounts')
        .update({
          current_balance: toAccount.current_balance + transferAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', toAccountId);

      if (toUpdateError) throw toUpdateError;

      return transaction;
    }

    // For income/expense transactions
    if (!accountId) {
      throw new Error('accountId is required for income/expense transactions');
    }

    // Validate account exists and belongs to user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found or does not belong to user');
    }

    // Validate currency matches account
    if (currency && currency !== account.currency) {
      throw new Error(`Transaction currency (${currency}) must match account currency (${account.currency})`);
    }

    // Validate category if provided
    if (categoryId) {
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', categoryId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (catError || !category) {
        throw new Error('Category not found or does not belong to user');
      }
    }

    // Create transaction
    const transactionAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        date,
        type,
        account_id: accountId,
        payee,
        category_id: categoryId,
        amount: transactionAmount,
        currency: account.currency,
        memo,
        is_reconciled: false
      })
      .select()
      .single();

    if (txError) throw txError;

    // Update account balance
    const { error: balanceError } = await supabase
      .from('accounts')
      .update({
        current_balance: account.current_balance + transactionAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);

    if (balanceError) throw balanceError;

    return transaction;
  }

  /**
   * Get all transactions for a user with pagination and filters
   * FIXED: Removed problematic account relationship, fetch separately if needed
   */
  async getTransactions(userId, filters = {}) {
    const {
      page = 1,
      limit = 50,
      type,
      accountId,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      isReconciled
    } = filters;

    const offset = (page - 1) * limit;

    // Build query - removed account relationship to avoid ambiguity
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (type) query = query.eq('type', type);
    if (accountId) {
      query = query.or(`account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);
    }
    if (categoryId) query = query.eq('category_id', categoryId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (minAmount) query = query.gte('amount', minAmount);
    if (maxAmount) query = query.lte('amount', maxAmount);
    if (search) query = query.or(`payee.ilike.%${search}%,memo.ilike.%${search}%`);
    if (isReconciled !== undefined) query = query.eq('is_reconciled', isReconciled);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      transactions: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get a single transaction by ID
   * FIXED: Removed problematic relationships
   */
  async getTransactionById(userId, transactionId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Transaction not found');

    return data;
  }

  /**
   * Update a transaction and recalculate balances
   */
  async updateTransaction(userId, transactionId, updateData) {
    // Get existing transaction
    const { data: oldTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !oldTransaction) {
      throw new Error('Transaction not found');
    }

    const {
      date,
      type,
      accountId,
      fromAccountId,
      toAccountId,
      payee,
      categoryId,
      amount,
      currency,
      memo
    } = updateData;

    // Revert old transaction balance changes
    await this.revertTransactionBalance(oldTransaction);

    // Handle transfer transaction update
    if (type === 'transfer' || oldTransaction.type === 'transfer') {
      if (type === 'transfer') {
        if (!fromAccountId || !toAccountId) {
          throw new Error('Transfer transactions require both fromAccountId and toAccountId');
        }

        // Validate accounts
        const { data: fromAccount } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', fromAccountId)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        const { data: toAccount } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', toAccountId)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (!fromAccount || !toAccount) {
          throw new Error('One or both accounts not found');
        }

        // Update transaction
        const { data: updatedTx, error: updateError } = await supabase
          .from('transactions')
          .update({
            date: date || oldTransaction.date,
            type: 'transfer',
            from_account_id: fromAccountId,
            to_account_id: toAccountId,
            amount: Math.abs(amount || oldTransaction.amount),
            currency: fromAccount.currency,
            memo: memo || oldTransaction.memo,
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Apply new balance changes
        const transferAmount = Math.abs(amount || oldTransaction.amount);

        await supabase
          .from('accounts')
          .update({
            current_balance: fromAccount.current_balance - transferAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', fromAccountId);

        await supabase
          .from('accounts')
          .update({
            current_balance: toAccount.current_balance + transferAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', toAccountId);

        return updatedTx;
      }
    }

    // Handle income/expense update
    const targetAccountId = accountId || oldTransaction.account_id;

    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', targetAccountId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    // Validate category if changed
    if (categoryId) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('id', categoryId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!category) {
        throw new Error('Category not found');
      }
    }

    const newType = type || oldTransaction.type;
    const newAmount = amount !== undefined ? amount : Math.abs(oldTransaction.amount);
    const transactionAmount = newType === 'expense' ? -Math.abs(newAmount) : Math.abs(newAmount);

    // Update transaction
    const { data: updatedTx, error: updateError } = await supabase
      .from('transactions')
      .update({
        date: date || oldTransaction.date,
        type: newType,
        account_id: targetAccountId,
        payee: payee || oldTransaction.payee,
        category_id: categoryId !== undefined ? categoryId : oldTransaction.category_id,
        amount: transactionAmount,
        currency: currency || oldTransaction.currency,
        memo: memo !== undefined ? memo : oldTransaction.memo,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Apply new balance
    await supabase
      .from('accounts')
      .update({
        current_balance: account.current_balance + transactionAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetAccountId);

    return updatedTx;
  }

  /**
   * Delete a transaction (soft delete) and revert balance
   */
  async deleteTransaction(userId, transactionId) {
    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !transaction) {
      throw new Error('Transaction not found');
    }

    // Revert balance changes
    await this.revertTransactionBalance(transaction);

    // Soft delete
    const { error: deleteError } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', transactionId);

    if (deleteError) throw deleteError;

    return { message: 'Transaction deleted successfully' };
  }

  /**
   * Helper: Revert transaction balance changes
   */
  async revertTransactionBalance(transaction) {
    if (transaction.type === 'transfer') {
      // Get both accounts
      const { data: fromAccount } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('id', transaction.from_account_id)
        .single();

      const { data: toAccount } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('id', transaction.to_account_id)
        .single();

      if (fromAccount && toAccount) {
        // Reverse: Add back to source, subtract from destination
        await supabase
          .from('accounts')
          .update({
            current_balance: fromAccount.current_balance + transaction.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.from_account_id);

        await supabase
          .from('accounts')
          .update({
            current_balance: toAccount.current_balance - transaction.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.to_account_id);
      }
    } else {
      // Income/Expense: subtract the transaction amount
      const { data: account } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('id', transaction.account_id)
        .single();

      if (account) {
        await supabase
          .from('accounts')
          .update({
            current_balance: account.current_balance - transaction.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.account_id);
      }
    }
  }

  /**
   * Toggle reconciliation status
   */
  async toggleReconciliation(userId, transactionId) {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('is_reconciled')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (!transaction) throw new Error('Transaction not found');

    const { data, error } = await supabase
      .from('transactions')
      .update({
        is_reconciled: !transaction.is_reconciled,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Bulk create transactions (for imports)
   */
  async bulkCreateTransactions(userId, transactionsData) {
    const results = {
      successful: [],
      failed: []
    };

    for (const txData of transactionsData) {
      try {
        const transaction = await this.createTransaction(userId, txData);
        results.successful.push(transaction);
      } catch (error) {
        results.failed.push({
          data: txData,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new TransactionService();