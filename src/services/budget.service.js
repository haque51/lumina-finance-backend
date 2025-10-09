// src/services/budget.service.js

import { supabase } from '../config/database.js';

class BudgetService {
  /**
   * Create a new budget
   */
  async createBudget(userId, budgetData) {
    try {
      // Validate category exists and belongs to user
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id, type')
        .eq('id', budgetData.category_id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (catError || !category) {
        throw new Error('Category not found');
      }

      // Budgets are only for expense categories
      if (category.type !== 'expense') {
        throw new Error('Budgets can only be created for expense categories');
      }

      // Check if budget already exists for this category and month
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('category_id', budgetData.category_id)
        .eq('month', budgetData.month)
        .is('deleted_at', null)
        .single();

      if (existing) {
        throw new Error('Budget already exists for this category and month');
      }

      // Create budget
      const { data: budget, error } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          category_id: budgetData.category_id,
          month: budgetData.month,
          budgeted: budgetData.budgeted
        })
        .select()
        .single();

      if (error) throw error;

      // Get spending for this budget
      const budgetWithSpending = await this.calculateBudgetSpending(userId, budget);

      return budgetWithSpending;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all budgets for a user with optional filtering
   */
  async getBudgets(userId, filters = {}) {
    try {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            type
          )
        `)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('month', { ascending: false });

      // Filter by month if provided
      if (filters.month) {
        query = query.eq('month', filters.month);
      }

      // Filter by category if provided
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      const { data: budgets, error } = await query;

      if (error) throw error;

      // Calculate spending for each budget
      const budgetsWithSpending = await Promise.all(
        budgets.map(budget => this.calculateBudgetSpending(userId, budget))
      );

      return budgetsWithSpending;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single budget by ID
   */
  async getBudgetById(userId, budgetId) {
    try {
      const { data: budget, error } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            type
          )
        `)
        .eq('id', budgetId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error || !budget) {
        throw new Error('Budget not found');
      }

      // Calculate spending
      const budgetWithSpending = await this.calculateBudgetSpending(userId, budget);

      return budgetWithSpending;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a budget
   */
  async updateBudget(userId, budgetId, updates) {
    try {
      // Check if budget exists
      const { data: existing } = await supabase
        .from('budgets')
        .select('id, category_id, month')
        .eq('id', budgetId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!existing) {
        throw new Error('Budget not found');
      }

      // If updating category, validate it
      if (updates.category_id && updates.category_id !== existing.category_id) {
        const { data: category, error: catError } = await supabase
          .from('categories')
          .select('id, type')
          .eq('id', updates.category_id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (catError || !category) {
          throw new Error('Category not found');
        }

        if (category.type !== 'expense') {
          throw new Error('Budgets can only be created for expense categories');
        }

        // Check if budget already exists for new category and month
        const newMonth = updates.month || existing.month;
        const { data: duplicate } = await supabase
          .from('budgets')
          .select('id')
          .eq('user_id', userId)
          .eq('category_id', updates.category_id)
          .eq('month', newMonth)
          .is('deleted_at', null)
          .neq('id', budgetId)
          .single();

        if (duplicate) {
          throw new Error('Budget already exists for this category and month');
        }
      }

      // If updating month, check for duplicates
      if (updates.month && updates.month !== existing.month) {
        const newCategoryId = updates.category_id || existing.category_id;
        const { data: duplicate } = await supabase
          .from('budgets')
          .select('id')
          .eq('user_id', userId)
          .eq('category_id', newCategoryId)
          .eq('month', updates.month)
          .is('deleted_at', null)
          .neq('id', budgetId)
          .single();

        if (duplicate) {
          throw new Error('Budget already exists for this category and month');
        }
      }

      // Update budget
      const { data: budget, error } = await supabase
        .from('budgets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetId)
        .eq('user_id', userId)
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            type
          )
        `)
        .single();

      if (error) throw error;

      // Calculate spending
      const budgetWithSpending = await this.calculateBudgetSpending(userId, budget);

      return budgetWithSpending;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a budget (soft delete)
   */
  async deleteBudget(userId, budgetId) {
    try {
      // Check if budget exists
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('id', budgetId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!existing) {
        throw new Error('Budget not found');
      }

      // Soft delete
      const { error } = await supabase
        .from('budgets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', budgetId)
        .eq('user_id', userId);

      if (error) throw error;

      return { message: 'Budget deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate spending for a budget
   */
  async calculateBudgetSpending(userId, budget) {
    try {
      // Get all expense transactions for this category in this month
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category_id', budget.category_id)
        .eq('type', 'expense')
        .gte('date', `${budget.month}-01`)
        .lt('date', this.getNextMonth(budget.month))
        .is('deleted_at', null);

      if (error) throw error;

      // Calculate total spent (transactions are negative for expenses)
      const spent = Math.abs(
        transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
      );

      // Calculate metrics
      const remaining = budget.budgeted - spent;
      const percentage = budget.budgeted > 0 ? (spent / budget.budgeted) * 100 : 0;
      const isOverBudget = spent > budget.budgeted;

      return {
        ...budget,
        spent: parseFloat(spent.toFixed(2)),
        remaining: parseFloat(remaining.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        is_over_budget: isOverBudget,
        status: isOverBudget ? 'over' : percentage >= 80 ? 'warning' : 'good'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the next month in YYYY-MM format
   */
  getNextMonth(month) {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum, 1); // monthNum is already 1-based, so this goes to next month
    return date.toISOString().slice(0, 10);
  }

  /**
   * Get budget summary for a user
   */
  async getBudgetSummary(userId, month = null) {
    try {
      // Use current month if not provided
      const targetMonth = month || new Date().toISOString().slice(0, 7);

      const budgets = await this.getBudgets(userId, { month: targetMonth });

      const summary = {
        month: targetMonth,
        total_budgeted: budgets.reduce((sum, b) => sum + parseFloat(b.budgeted), 0),
        total_spent: budgets.reduce((sum, b) => sum + b.spent, 0),
        budget_count: budgets.length,
        over_budget_count: budgets.filter(b => b.is_over_budget).length,
        warning_count: budgets.filter(b => b.status === 'warning').length,
        good_count: budgets.filter(b => b.status === 'good').length
      };

      summary.total_remaining = summary.total_budgeted - summary.total_spent;
      summary.overall_percentage = summary.total_budgeted > 0 
        ? (summary.total_spent / summary.total_budgeted) * 100 
        : 0;

      return {
        summary,
        budgets
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new BudgetService();