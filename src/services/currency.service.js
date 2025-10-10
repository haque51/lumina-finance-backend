import { supabase } from '../config/database.js';

class CurrencyService {
async getExchangeRates(userId) {
  // For now, use EUR as base currency
  const baseCurrency = 'EUR';

  // Get all exchange rates for EUR base currency
  const { data: rates, error: ratesError } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', baseCurrency)
    .order('target_currency', { ascending: true });

  if (ratesError) throw ratesError;

  return {
    base_currency: baseCurrency,
    rates: rates.map(r => ({
      currency: r.target_currency,
      rate: parseFloat(r.rate),
      updated_at: r.updated_at
    }))
  };
}

async updateExchangeRate(currency, rate) {
  // Validate currency code
  const validCurrencies = ['EUR', 'USD', 'BDT', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];
  if (!validCurrencies.includes(currency)) {
    throw new Error(`Invalid currency code: ${currency}`);
  }

  // For now, assume EUR as base
  const baseCurrency = 'EUR';

  // Check if rate exists
  const { data: existing, error: checkError } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', baseCurrency)
    .eq('target_currency', currency);

  if (checkError) throw checkError;

  if (existing && existing.length > 0) {
    // Update existing rate
    const { error } = await supabase
      .from('exchange_rates')
      .update({
        rate: rate,
        updated_at: new Date().toISOString()
      })
      .eq('base_currency', baseCurrency)
      .eq('target_currency', currency);

    if (error) throw error;

    // Fetch the updated record
    const { data: updated, error: fetchError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', baseCurrency)
      .eq('target_currency', currency)
      .limit(1);

    if (fetchError) throw fetchError;

    return {
      currency: updated[0].target_currency,
      rate: parseFloat(updated[0].rate),
      updated_at: updated[0].updated_at,
      action: 'updated'
    };
  } else {
    // Insert new rate
    const { error } = await supabase
      .from('exchange_rates')
      .insert({
        base_currency: baseCurrency,
        target_currency: currency,
        rate: rate,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Fetch the created record
    const { data: created, error: fetchError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', baseCurrency)
      .eq('target_currency', currency)
      .limit(1);

    if (fetchError) throw fetchError;

    return {
      currency: created[0].target_currency,
      rate: parseFloat(created[0].rate),
      updated_at: created[0].updated_at,
      action: 'created'
    };
  }
}

async convertCurrency(userId, amount, fromCurrency, toCurrency) {
  // Use EUR as base currency (all your rates are EUR-based)
  const baseCurrency = 'EUR';

  // If converting to/from same currency, return original amount
  if (fromCurrency === toCurrency) {
    return {
      original_amount: parseFloat(amount.toFixed(2)),
      original_currency: fromCurrency,
      converted_amount: parseFloat(amount.toFixed(2)),
      converted_currency: toCurrency,
      exchange_rate: 1.0,
      base_currency: baseCurrency,
      converted_at: new Date().toISOString()
    };
  }

  // Get all exchange rates for base currency
  const { data: rates, error: ratesError } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', baseCurrency);

  if (ratesError) throw ratesError;

  // Build rates map
  const ratesMap = {};
  ratesMap[baseCurrency] = 1.0; // Base currency rate is always 1

  rates.forEach(r => {
    ratesMap[r.target_currency] = parseFloat(r.rate);
  });

  // Check if currencies exist
  if (!ratesMap[fromCurrency]) {
    throw new Error(`Exchange rate not found for currency: ${fromCurrency}`);
  }
  if (!ratesMap[toCurrency]) {
    throw new Error(`Exchange rate not found for currency: ${toCurrency}`);
  }

  // Convert: amount * (toRate / fromRate)
  const fromRate = ratesMap[fromCurrency];
  const toRate = ratesMap[toCurrency];
  const exchangeRate = toRate / fromRate;
  const convertedAmount = amount * exchangeRate;

  return {
    original_amount: parseFloat(amount.toFixed(2)),
    original_currency: fromCurrency,
    converted_amount: parseFloat(convertedAmount.toFixed(2)),
    converted_currency: toCurrency,
    exchange_rate: parseFloat(exchangeRate.toFixed(6)),
    base_currency: baseCurrency,
    converted_at: new Date().toISOString()
  };
}

  async deleteExchangeRate(currency) {
    const baseCurrency = 'EUR'; // Assume EUR as base

    const { error } = await supabase
      .from('exchange_rates')
      .delete()
      .eq('base_currency', baseCurrency)
      .eq('target_currency', currency);

    if (error) throw error;

    return {
      currency,
      action: 'deleted'
    };
  }
}

export default new CurrencyService();