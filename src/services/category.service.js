// src/services/category.service.js

import { supabase } from '../config/database.js';

class CategoryService {
  async createCategory(userId, categoryData) {
    try {
      // Validate parent category if provided
      if (categoryData.parent_id) {
        const { data: parent } = await supabase
          .from('categories')
          .select('type')
          .eq('id', categoryData.parent_id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (!parent) {
          throw new Error('Parent category not found');
        }

        if (parent.type !== categoryData.type) {
          throw new Error('Parent category type must match child category type');
        }
      }

      // Create category
      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: categoryData.name,
          type: categoryData.type,
          parent_id: categoryData.parent_id || null,
          icon: categoryData.icon || '📁'
        })
        .select()
        .single();

      if (error) throw error;

      return category;
    } catch (error) {
      throw error;
    }
  }

  async getCategories(userId, filters = {}) {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      const { data: categories, error } = await query;

      if (error) throw error;

      // Build hierarchy
      const categoryMap = new Map();
      const rootCategories = [];

      categories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, subcategories: [] });
      });

      categories.forEach(cat => {
        const category = categoryMap.get(cat.id);
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.subcategories.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      return rootCategories;
    } catch (error) {
      throw error;
    }
  }

  async getCategoryById(userId, categoryId) {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error || !category) {
        throw new Error('Category not found');
      }

      // Get subcategories
      const { data: subcategories } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', categoryId)
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Get transaction count
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .is('deleted_at', null);

      return {
        ...category,
        subcategories: subcategories || [],
        transaction_count: count || 0
      };
    } catch (error) {
      throw error;
    }
  }

  async updateCategory(userId, categoryId, updates) {
    try {
      // Check if category exists
      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!existing) {
        throw new Error('Category not found');
      }

      // Validate parent if being updated
      if (updates.parent_id !== undefined) {
        if (updates.parent_id === categoryId) {
          throw new Error('Category cannot be its own parent');
        }

        if (updates.parent_id) {
          const { data: parent } = await supabase
            .from('categories')
            .select('type, parent_id')
            .eq('id', updates.parent_id)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .single();

          if (!parent) {
            throw new Error('Parent category not found');
          }

          if (parent.type !== existing.type) {
            throw new Error('Parent category type must match');
          }

          // Check for circular reference
          if (await this.wouldCreateCircularReference(userId, categoryId, updates.parent_id)) {
            throw new Error('This would create a circular reference');
          }
        }
      }

      // Update category
      const { data: category, error } = await supabase
        .from('categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return category;
    } catch (error) {
      throw error;
    }
  }

  async deleteCategory(userId, categoryId) {
    try {
      // Check if category has subcategories
      const { data: subcategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryId)
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (subcategories && subcategories.length > 0) {
        throw new Error('Cannot delete category with subcategories');
      }

      // Check if category has transactions
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .is('deleted_at', null);

      if (count > 0) {
        throw new Error(`Cannot delete category with ${count} associated transactions`);
      }

      // Soft delete
      const { error } = await supabase
        .from('categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', categoryId)
        .eq('user_id', userId);

      if (error) throw error;

      return { message: 'Category deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async getCategorySpending(userId, categoryId) {
    try {
      const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!category) {
        throw new Error('Category not found');
      }

      // Get transactions for this category
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, date')
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      if (error) throw error;

      const totalSpent = Math.abs(transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0));

      // Group by month
      const byMonth = {};
      transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        if (!byMonth[month]) {
          byMonth[month] = 0;
        }
        byMonth[month] += Math.abs(parseFloat(t.amount));
      });

      return {
        category,
        total_spent: totalSpent,
        transaction_count: transactions.length,
        by_month: byMonth
      };
    } catch (error) {
      throw error;
    }
  }

  async wouldCreateCircularReference(userId, categoryId, newParentId) {
    let currentId = newParentId;
    const visited = new Set();

    while (currentId) {
      if (currentId === categoryId) {
        return true;
      }

      if (visited.has(currentId)) {
        return true;
      }

      visited.add(currentId);

      const { data } = await supabase
        .from('categories')
        .select('parent_id')
        .eq('id', currentId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      currentId = data?.parent_id;
    }

    return false;
  }
}

export default new CategoryService();