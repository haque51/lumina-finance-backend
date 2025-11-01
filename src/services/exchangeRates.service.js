import { supabase } from '../config/database.js';

class ExchangeRatesService {
  /**
   * Get historical exchange rates for a specific month
   * @param {string} userId - User ID
   * @param {string} month - Month in format "YYYY-MM" (e.g., "2025-01")
   * @returns {Object} Exchange rates for the specified month
   */
  async getHistoricalRates(userId, month) {
    // Convert month to last day of month format
    const monthDate = new Date(month + '-01');
    monthDate.setMonth(monthDate.getMonth() + 1);
    monthDate.setDate(0); // Last day of the month
    const monthEndStr = monthDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('exchange_rates_history')
      .select('*')
      .eq('user_id', userId)
      .eq('month', monthEndStr)
      .single();

    if (error) {
      // If no rates found for this month, return null (not an error)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return {
      month: data.month,
      rates: data.rates,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  /**
   * Save exchange rates snapshot for a specific month
   * @param {string} userId - User ID
   * @param {string} month - Month in format "YYYY-MM"
   * @param {Object} rates - Exchange rates object (e.g., {USD: 0.92, BDT: 0.0084, EUR: 1})
   * @returns {Object} Saved exchange rates record
   */
  async saveRatesSnapshot(userId, month, rates) {
    // Convert month to last day of month format
    const monthDate = new Date(month + '-01');
    monthDate.setMonth(monthDate.getMonth() + 1);
    monthDate.setDate(0);
    const monthEndStr = monthDate.toISOString().split('T')[0];

    // Validate that month is not in the future
    const now = new Date();
    if (monthDate > now) {
      throw new Error('Cannot save exchange rates for future months');
    }

    // Validate rates object
    if (!rates || typeof rates !== 'object') {
      throw new Error('Invalid rates object');
    }

    // Check if rates already exist for this month
    const { data: existing } = await supabase
      .from('exchange_rates_history')
      .select('id')
      .eq('user_id', userId)
      .eq('month', monthEndStr)
      .single();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('exchange_rates_history')
        .update({
          rates: rates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('month', monthEndStr)
        .select()
        .single();

      if (error) throw error;

      return {
        month: data.month,
        rates: data.rates,
        created_at: data.created_at,
        updated_at: data.updated_at,
        action: 'updated'
      };
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('exchange_rates_history')
        .insert({
          user_id: userId,
          month: monthEndStr,
          rates: rates
        })
        .select()
        .single();

      if (error) throw error;

      return {
        month: data.month,
        rates: data.rates,
        created_at: data.created_at,
        updated_at: data.updated_at,
        action: 'created'
      };
    }
  }

  /**
   * Get all months with available exchange rate history for a user
   * @param {string} userId - User ID
   * @returns {Array} List of months with available data
   */
  async getAvailableMonths(userId) {
    const { data, error } = await supabase
      .from('exchange_rates_history')
      .select('month')
      .eq('user_id', userId)
      .order('month', { ascending: false });

    if (error) throw error;

    return data.map(record => record.month);
  }

  /**
   * Delete exchange rate history for a specific month
   * @param {string} userId - User ID
   * @param {string} month - Month in format "YYYY-MM"
   * @returns {boolean} Success status
   */
  async deleteRatesForMonth(userId, month) {
    // Convert month to last day of month format
    const monthDate = new Date(month + '-01');
    monthDate.setMonth(monthDate.getMonth() + 1);
    monthDate.setDate(0);
    const monthEndStr = monthDate.toISOString().split('T')[0];

    const { error } = await supabase
      .from('exchange_rates_history')
      .delete()
      .eq('user_id', userId)
      .eq('month', monthEndStr);

    if (error) throw error;

    return true;
  }

  /**
   * Get the most recent historical rates before a given month
   * Useful as fallback when specific month data is not available
   * @param {string} userId - User ID
   * @param {string} month - Month in format "YYYY-MM"
   * @returns {Object} Most recent available rates or null
   */
  async getEarliestAvailableRates(userId, month) {
    const monthDate = new Date(month + '-01');
    monthDate.setMonth(monthDate.getMonth() + 1);
    monthDate.setDate(0);
    const monthEndStr = monthDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('exchange_rates_history')
      .select('*')
      .eq('user_id', userId)
      .lte('month', monthEndStr)
      .order('month', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return {
      month: data.month,
      rates: data.rates,
      created_at: data.created_at
    };
  }
}

export default new ExchangeRatesService();
