const { supabase } = require('../config/database');

class CategoryService {
  /**
   * Create a new category
   */
  async createCategory(userId, categoryData) {
    const { name, type, parent_id, icon } = categoryData;

    // If parent_id provided, validate parent exists and is same type
    if (parent_id) {
      const { data: parent, error: parentError } = await supabase
        .from('categories')
        .select('id, type, user_id')
        .eq('id', parent_id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (parentError || !parent) {
        throw new Error('Parent category not found');
      }

      if (parent.type !== type) {
        throw new Error('Parent category must be same type (income/expense)');
      }
    }

    // Create category
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: userId,
          name,
          type,
          parent_id: parent_id || null,
          icon: icon || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all categories for a user with hierarchy
   */
  async getCategories(userId, filters = {}) {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parent_id);
      }
    }

    // Order by name
    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Build hierarchy
    const categories = this._buildHierarchy(data);

    return categories;
  }

  /**
   * Get single category by ID
   */
  async getCategoryById(userId, categoryId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new Error('Category not found');
    }

    // Get transaction count
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .is('deleted_at', null);

    // Get subcategories count
    const { count: subcategoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', categoryId)
      .is('deleted_at', null);

    // Get parent category if exists
    let parent = null;
    if (data.parent_id) {
      const { data: parentData } = await supabase
        .from('categories')
        .select('id, name, icon, type')
        .eq('id', data.parent_id)
        .single();
      parent = parentData;
    }

    return {
      ...data,
      transaction_count: count || 0,
      subcategories_count: subcategoriesCount || 0,
      parent,
    };
  }

  /**
   * Update category
   */
  async updateCategory(userId, categoryId, updateData) {
    // Verify category exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existing) {
      throw new Error('Category not found');
    }

    // If updating parent_id, validate it
    if (updateData.parent_id !== undefined && updateData.parent_id !== null) {
      // Cannot set self as parent
      if (updateData.parent_id === categoryId) {
        throw new Error('Category cannot be its own parent');
      }

      // Validate parent exists and is same type
      const { data: parent, error: parentError } = await supabase
        .from('categories')
        .select('id, type')
        .eq('id', updateData.parent_id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (parentError || !parent) {
        throw new Error('Parent category not found');
      }

      const targetType = updateData.type || existing.type;
      if (parent.type !== targetType) {
        throw new Error('Parent category must be same type (income/expense)');
      }

      // Check for circular reference (parent cannot be a child of this category)
      const isCircular = await this._checkCircularReference(
        userId,
        categoryId,
        updateData.parent_id
      );
      if (isCircular) {
        throw new Error('Circular parent-child reference detected');
      }
    }

    // If changing type, check if subcategories exist
    if (updateData.type && updateData.type !== existing.type) {
      const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', categoryId)
        .is('deleted_at', null);

      if (count > 0) {
        throw new Error('Cannot change type of category with subcategories');
      }
    }

    // Update category
    const { data, error } = await supabase
      .from('categories')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(userId, categoryId) {
    // Verify category exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existing) {
      throw new Error('Category not found');
    }

    // Check if category has transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('category_id', categoryId)
      .is('deleted_at', null);

    if (transactions && transactions.length > 0) {
      throw new Error(
        `Cannot delete category with ${transactions.length} associated transactions`
      );
    }

    // Check if category has subcategories
    const { data: subcategories } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', categoryId)
      .is('deleted_at', null);

    if (subcategories && subcategories.length > 0) {
      throw new Error(
        `Cannot delete category with ${subcategories.length} subcategories`
      );
    }

    // Soft delete
    const { data, error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }

    return { message: 'Category deleted successfully' };
  }

  /**
   * Get category spending statistics
   */
  async getCategorySpending(userId, categoryId, dateRange = {}) {
    // Verify category exists
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (catError || !category) {
      throw new Error('Category not found');
    }

    // Build query for transactions
    let query = supabase
      .from('transactions')
      .select('amount, date, payee')
      .eq('category_id', categoryId)
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Apply date filters
    if (dateRange.start_date) {
      query = query.gte('date', dateRange.start_date);
    }
    if (dateRange.end_date) {
      query = query.lte('date', dateRange.end_date);
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch spending data: ${error.message}`);
    }

    // Calculate statistics
    const totalAmount = transactions.reduce(
      (sum, txn) => sum + Math.abs(txn.amount),
      0
    );
    const transactionCount = transactions.length;
    const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;

    // Get monthly breakdown
    const monthlyBreakdown = this._getMonthlyBreakdown(transactions);

    return {
      category,
      total_amount: totalAmount,
      transaction_count: transactionCount,
      average_amount: averageAmount,
      monthly_breakdown: monthlyBreakdown,
      date_range: {
        start: dateRange.start_date || null,
        end: dateRange.end_date || null,
      },
    };
  }

  /**
   * Build category hierarchy
   */
  _buildHierarchy(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, subcategories: [] });
    });

    // Second pass: build hierarchy
    categories.forEach((cat) => {
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.subcategories.push(categoryMap.get(cat.id));
        }
      } else {
        rootCategories.push(categoryMap.get(cat.id));
      }
    });

    return rootCategories;
  }

  /**
   * Check for circular reference in parent-child relationship
   */
  async _checkCircularReference(userId, categoryId, newParentId) {
    let currentId = newParentId;
    const visited = new Set([categoryId]);

    while (currentId) {
      if (visited.has(currentId)) {
        return true; // Circular reference detected
      }

      visited.add(currentId);

      const { data } = await supabase
        .from('categories')
        .select('parent_id')
        .eq('id', currentId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (!data || !data.parent_id) {
        break;
      }

      currentId = data.parent_id;
    }

    return false;
  }

  /**
   * Get monthly spending breakdown
   */
  _getMonthlyBreakdown(transactions) {
    const breakdown = {};

    transactions.forEach((txn) => {
      const month = txn.date.substring(0, 7); // YYYY-MM
      if (!breakdown[month]) {
        breakdown[month] = {
          month,
          total: 0,
          count: 0,
        };
      }
      breakdown[month].total += Math.abs(txn.amount);
      breakdown[month].count += 1;
    });

    return Object.values(breakdown).sort((a, b) => b.month.localeCompare(a.month));
  }
}

module.exports = new CategoryService();