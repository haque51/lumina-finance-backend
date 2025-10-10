import { supabase } from '../config/database.js';

class AnalyticsService {
  async getDashboardData(userId, month) {
    const startDate = `${month}-01`;
    const endDate = new Date(month + '-01');
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get all transactions for the month
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('date', startDate)
      .lt('date', endDateStr);

    if (txError) throw txError;

    // Calculate income and expenses
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = Math.abs(
      transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    );

    const savings = income - expenses;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(2) : 0;

    // Get net worth
    const { data: accounts, error: accError } = await supabase
      .from('accounts')
      .select('current_balance')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (accError) throw accError;

    const netWorth = accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);

    // Get top spending categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (catError) throw catError;

    const categorySpending = categories.map(cat => {
      const spent = Math.abs(
        transactions
          .filter(t => t.category_id === cat.id && t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      );

      return {
        category_id: cat.id,
        category_name: cat.name,
        spent,
        budget: 0,
        percentage: 0
      };
    }).filter(c => c.spent > 0);

    // Get budgets for the month
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .is('deleted_at', null);

    if (budgetError) throw budgetError;

    // Add budget info to category spending
    categorySpending.forEach(cat => {
      const budget = budgets.find(b => b.category_id === cat.category_id);
      if (budget) {
        cat.budget = parseFloat(budget.amount);
        cat.percentage = cat.budget > 0 ? ((cat.spent / cat.budget) * 100).toFixed(2) : 0;
      }
    });

    // Sort by spent amount and get top 5
    const topCategories = categorySpending
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    // Get recent transactions (last 10)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Budget summary
    const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalSpent = categorySpending.reduce((sum, c) => sum + c.spent, 0);
    const budgetPercentage = totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(2) : 0;

    // Goals summary
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (goalsError) throw goalsError;

    const completedGoals = goals.filter(g => parseFloat(g.current_amount) >= parseFloat(g.target_amount)).length;
    const inProgressGoals = goals.filter(g => parseFloat(g.current_amount) < parseFloat(g.target_amount)).length;

    // Accounts by type
    const { data: allAccounts, error: allAccError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (allAccError) throw allAccError;

    const accountsByType = {};
    allAccounts.forEach(acc => {
      if (!accountsByType[acc.type]) {
        accountsByType[acc.type] = { count: 0, total_balance: 0 };
      }
      accountsByType[acc.type].count++;
      accountsByType[acc.type].total_balance += parseFloat(acc.current_balance);
    });

    const accountsSummary = Object.keys(accountsByType).map(type => ({
      type,
      count: accountsByType[type].count,
      total_balance: accountsByType[type].total_balance
    }));

    return {
      period: month,
      income: parseFloat(income.toFixed(2)),
      expenses: parseFloat(expenses.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      savings_rate: parseFloat(savingsRate),
      net_worth: parseFloat(netWorth.toFixed(2)),
      top_categories: topCategories,
      recent_transactions: recentTransactions,
      budgets_summary: {
        total_budgeted: parseFloat(totalBudgeted.toFixed(2)),
        total_spent: parseFloat(totalSpent.toFixed(2)),
        percentage: parseFloat(budgetPercentage)
      },
      goals_summary: {
        total_goals: goals.length,
        completed: completedGoals,
        in_progress: inProgressGoals
      },
      accounts_by_type: accountsSummary
    };
  }

  async getSpendingByCategory(userId, month, type = 'expense') {
    const startDate = `${month}-01`;
    const endDate = new Date(month + '-01');
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get transactions for the month
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .is('deleted_at', null)
      .gte('date', startDate)
      .lt('date', endDateStr);

    if (txError) throw txError;

    // Get categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .is('deleted_at', null);

    if (catError) throw catError;

    // Calculate total amount
    const totalAmount = Math.abs(
      transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
    );

    // Group by category
    const categoryData = categories.map(cat => {
      const categoryTransactions = transactions.filter(t => t.category_id === cat.id);
      const amount = Math.abs(
        categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
      );
      const percentage = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(2) : 0;

      // Get subcategories
      const subcategories = categories.filter(sc => sc.parent_id === cat.id);
      const subcategoryData = subcategories.map(subcat => {
        const subAmount = Math.abs(
          transactions
            .filter(t => t.category_id === subcat.id)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        );
        const subPercentage = totalAmount > 0 ? ((subAmount / totalAmount) * 100).toFixed(2) : 0;

        return {
          id: subcat.id,
          name: subcat.name,
          amount: parseFloat(subAmount.toFixed(2)),
          percentage: parseFloat(subPercentage),
          transaction_count: transactions.filter(t => t.category_id === subcat.id).length
        };
      }).filter(sc => sc.amount > 0);

      return {
        id: cat.id,
        name: cat.name,
        amount: parseFloat(amount.toFixed(2)),
        percentage: parseFloat(percentage),
        transaction_count: categoryTransactions.length,
        subcategories: subcategoryData
      };
    })
    .filter(c => !c.parent_id && c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

    return {
      month,
      type,
      total_amount: parseFloat(totalAmount.toFixed(2)),
      categories: categoryData
    };
  }

  async getMonthlyTrends(userId, months = 6) {
    const trends = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().slice(0, 7);

      const startDate = `${month}-01`;
      const endDate = new Date(month + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get transactions for the month
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('date', startDate)
        .lt('date', endDateStr);

      if (error) throw error;

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expenses = Math.abs(
        transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      );

      const savings = income - expenses;
      const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(2) : 0;

      // Get net worth at end of month
      const { data: accounts, error: accError } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (accError) throw accError;

      const netWorth = accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);

      trends.push({
        month,
        month_name: date.toLocaleString('default', { month: 'short' }),
        income: parseFloat(income.toFixed(2)),
        expenses: parseFloat(expenses.toFixed(2)),
        savings: parseFloat(savings.toFixed(2)),
        savings_rate: parseFloat(savingsRate),
        net_worth: parseFloat(netWorth.toFixed(2))
      });
    }

    return trends;
  }

  async getNetWorthHistory(userId, period = 'monthly', limit = 12) {
    const history = [];
    const currentDate = new Date();

    let intervalDays;
    switch (period) {
      case 'daily':
        intervalDays = 1;
        break;
      case 'weekly':
        intervalDays = 7;
        break;
      case 'monthly':
      default:
        intervalDays = 30;
        break;
    }

    // Get current accounts
    const { data: accounts, error: accError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (accError) throw accError;

    for (let i = limit - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - (i * intervalDays));
      const dateStr = date.toISOString().split('T')[0];

      // Calculate net worth (in a real app, you'd track historical balances)
      // For now, we'll use current balance as an approximation
      const netWorth = accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);

      // Calculate assets and liabilities
      const assets = accounts
        .filter(acc => parseFloat(acc.current_balance) > 0)
        .reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);

      const liabilities = Math.abs(
        accounts
          .filter(acc => parseFloat(acc.current_balance) < 0)
          .reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0)
      );

      history.push({
        date: dateStr,
        net_worth: parseFloat(netWorth.toFixed(2)),
        assets: parseFloat(assets.toFixed(2)),
        liabilities: parseFloat(liabilities.toFixed(2))
      });
    }

    return {
      period,
      limit,
      data: history
    };
  }
}

export default new AnalyticsService();