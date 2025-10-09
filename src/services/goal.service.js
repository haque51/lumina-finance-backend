// goal.service.js - Goals Service for Lumina Finance Backend
// Handles business logic for financial goals with progress tracking

import { supabase } from '../config/database.js';

class GoalService {
  /**
   * Create a new financial goal
   */
  async createGoal(userId, goalData) {
    try {
      // Validate linked account if provided
      if (goalData.linked_account_id) {
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id')
          .eq('id', goalData.linked_account_id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (accountError || !account) {
          throw new Error('Linked account not found or does not belong to user');
        }
      }

      // Ensure current_amount doesn't exceed target_amount
      if (goalData.current_amount > goalData.target_amount) {
        throw new Error('Current amount cannot exceed target amount');
      }

      // Create goal
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          user_id: userId,
          name: goalData.name,
          target_amount: goalData.target_amount,
          current_amount: goalData.current_amount || 0,
          target_date: goalData.target_date || null,
          linked_account_id: goalData.linked_account_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Calculate progress for response
      const goalWithProgress = this.calculateProgress(data);
      
      return goalWithProgress;
    } catch (error) {
      throw new Error(`Failed to create goal: ${error.message}`);
    }
  }

  /**
   * Get all goals for a user with optional filtering
   */
  async getAllGoals(userId, filters = {}) {
    try {
      let query = supabase
        .from('goals')
        .select(`
          *,
          accounts:linked_account_id (
            id,
            name,
            type,
            currency
          )
        `)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        // We'll filter by status after fetching since it's calculated
      }

      if (filters.linked_account_id) {
        query = query.eq('linked_account_id', filters.linked_account_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate progress for all goals
      let goalsWithProgress = data.map(goal => this.calculateProgress(goal));

      // Apply status filter if provided
      if (filters.status) {
        if (filters.status === 'completed') {
          goalsWithProgress = goalsWithProgress.filter(g => g.is_complete);
        } else if (filters.status === 'active') {
          goalsWithProgress = goalsWithProgress.filter(g => !g.is_complete);
        }
      }

      return goalsWithProgress;
    } catch (error) {
      throw new Error(`Failed to fetch goals: ${error.message}`);
    }
  }

  /**
   * Get a single goal by ID
   */
  async getGoalById(userId, goalId) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          accounts:linked_account_id (
            id,
            name,
            type,
            currency,
            current_balance
          )
        `)
        .eq('id', goalId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error || !data) {
        throw new Error('Goal not found');
      }

      // Calculate progress
      const goalWithProgress = this.calculateProgress(data);

      return goalWithProgress;
    } catch (error) {
      throw new Error(`Failed to fetch goal: ${error.message}`);
    }
  }

  /**
   * Update a goal
   */
  async updateGoal(userId, goalId, updateData) {
    try {
      // First verify goal exists and belongs to user
      const existingGoal = await this.getGoalById(userId, goalId);

      // Validate linked account if being updated
      if (updateData.linked_account_id !== undefined) {
        if (updateData.linked_account_id !== null) {
          const { data: account, error: accountError } = await supabase
            .from('accounts')
            .select('id')
            .eq('id', updateData.linked_account_id)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .single();

          if (accountError || !account) {
            throw new Error('Linked account not found or does not belong to user');
          }
        }
      }

      // Ensure current_amount doesn't exceed target_amount
      const newCurrentAmount = updateData.current_amount !== undefined 
        ? updateData.current_amount 
        : existingGoal.current_amount;
      const newTargetAmount = updateData.target_amount !== undefined 
        ? updateData.target_amount 
        : existingGoal.target_amount;

      if (newCurrentAmount > newTargetAmount) {
        throw new Error('Current amount cannot exceed target amount');
      }

      // Update goal
      const { data, error } = await supabase
        .from('goals')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select(`
          *,
          accounts:linked_account_id (
            id,
            name,
            type,
            currency
          )
        `)
        .single();

      if (error) throw error;

      // Calculate progress for response
      const goalWithProgress = this.calculateProgress(data);

      return goalWithProgress;
    } catch (error) {
      throw new Error(`Failed to update goal: ${error.message}`);
    }
  }

  /**
   * Delete a goal (soft delete)
   */
  async deleteGoal(userId, goalId) {
    try {
      // Verify goal exists and belongs to user
      await this.getGoalById(userId, goalId);

      // Soft delete
      const { data, error } = await supabase
        .from('goals')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) throw error;

      return { message: 'Goal deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete goal: ${error.message}`);
    }
  }

  /**
   * Calculate goal progress
   * @private
   */
  calculateProgress(goal) {
    const targetAmount = parseFloat(goal.target_amount) || 0;
    const currentAmount = parseFloat(goal.current_amount) || 0;
    
    const remaining = Math.max(0, targetAmount - currentAmount);
    const progressPercentage = targetAmount > 0 
      ? Math.min(100, (currentAmount / targetAmount) * 100)
      : 0;
    const isComplete = currentAmount >= targetAmount;

    // Calculate days until target (if target_date provided)
    let daysUntilTarget = null;
    let isOverdue = false;
    if (goal.target_date) {
      const today = new Date();
      const targetDate = new Date(goal.target_date);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysUntilTarget = diffDays;
      isOverdue = diffDays < 0 && !isComplete;
    }

    return {
      ...goal,
      remaining,
      progress_percentage: parseFloat(progressPercentage.toFixed(2)),
      is_complete: isComplete,
      days_until_target: daysUntilTarget,
      is_overdue: isOverdue,
      status: isComplete ? 'completed' : (isOverdue ? 'overdue' : 'active')
    };
  }
}

export default new GoalService();