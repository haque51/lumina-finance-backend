import cron from 'node-cron';
import { supabase } from '../config/database.js';
import exchangeRatesService from './exchangeRates.service.js';

class CronJobsService {
  /**
   * Fetch real-time exchange rates using external API or service
   * This should be replaced with your actual rate fetching logic
   */
  async fetchRealTimeRates() {
    try {
      // Option 1: Use a free API like exchangerate-api.com
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      const data = await response.json();
      
      // Convert to our format
      const rates = {
        EUR: 1,
        USD: data.rates.USD ? (1 / data.rates.USD) : 0.92,
        BDT: data.rates.BDT ? (1 / data.rates.BDT) : 0.0084,
        GBP: data.rates.GBP ? (1 / data.rates.GBP) : 0.87,
        JPY: data.rates.JPY ? (1 / data.rates.JPY) : 0.0066,
        AUD: data.rates.AUD ? (1 / data.rates.AUD) : 0.60,
        CAD: data.rates.CAD ? (1 / data.rates.CAD) : 0.68,
        CHF: data.rates.CHF ? (1 / data.rates.CHF) : 1.05,
        CNY: data.rates.CNY ? (1 / data.rates.CNY) : 0.13,
        INR: data.rates.INR ? (1 / data.rates.INR) : 0.011,
      };
      
      return rates;
    } catch (error) {
      console.error('Error fetching real-time rates:', error);
      // Fallback to default rates if API fails
      return {
        EUR: 1,
        USD: 0.92,
        BDT: 0.0084,
        GBP: 0.87,
        JPY: 0.0066,
        AUD: 0.60,
        CAD: 0.68,
        CHF: 1.05,
        CNY: 0.13,
        INR: 0.011,
      };
    }
  }

  /**
   * Get unique currencies used by a user from their accounts
   */
  async getUserCurrencies(userId) {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('currency')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) throw error;

    // Get unique currencies
    const currencies = [...new Set(accounts.map(acc => acc.currency))];
    return currencies;
  }

  /**
   * Save monthly exchange rate snapshot for all users
   * This runs automatically on the last day of each month
   */
  async saveMonthlyRatesSnapshot() {
    console.log('🔄 Starting monthly exchange rates snapshot...');
    
    try {
      // Fetch current real-time exchange rates
      const realTimeRates = await this.fetchRealTimeRates();
      console.log('✅ Fetched real-time rates:', realTimeRates);

      // Get all active users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .is('deleted_at', null);

      if (usersError) throw usersError;

      console.log(`📊 Processing ${users.length} users...`);

      // Current month (YYYY-MM format)
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      let successCount = 0;
      let errorCount = 0;

      // Save rates for each user
      for (const user of users) {
        try {
          // Get currencies this user actually uses
          const userCurrencies = await this.getUserCurrencies(user.id);
          
          if (userCurrencies.length === 0) {
            console.log(`⏭️  User ${user.email} has no accounts, skipping...`);
            continue;
          }

          // Build rates object with only user's currencies
          const userRates = {};
          userCurrencies.forEach(currency => {
            userRates[currency] = realTimeRates[currency] || 1;
          });

          // Always include EUR as base
          if (!userRates.EUR) {
            userRates.EUR = 1;
          }

          console.log(`💾 Saving rates for ${user.email}:`, userRates);

          // Save snapshot for this user
          await exchangeRatesService.saveRatesSnapshot(user.id, currentMonth, userRates);
          
          successCount++;
          console.log(`✅ Saved rates for user: ${user.email}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Error saving rates for user ${user.email}:`, error.message);
        }
      }

      console.log(`\n📈 Monthly snapshot complete!`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📅 Month: ${currentMonth}\n`);

      return {
        success: true,
        month: currentMonth,
        totalUsers: users.length,
        successCount,
        errorCount
      };
    } catch (error) {
      console.error('❌ Fatal error in monthly snapshot:', error);
      throw error;
    }
  }

  /**
   * Initialize cron jobs
   */
  initializeCronJobs() {
    console.log('🚀 Initializing cron jobs...');

    // Run on the last day of every month at 11:59 PM
    // Cron format: minute hour day month day-of-week
    // '59 23 28-31 * *' means: at 23:59 on days 28-31 of every month
    // We check if it's actually the last day inside the job
    cron.schedule('59 23 28-31 * *', async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check if tomorrow is a different month (meaning today is the last day)
      if (tomorrow.getMonth() !== now.getMonth()) {
        console.log('📅 Last day of month detected! Running exchange rate snapshot...');
        try {
          await this.saveMonthlyRatesSnapshot();
        } catch (error) {
          console.error('❌ Cron job failed:', error);
        }
      } else {
        console.log('ℹ️  Not the last day of month, skipping snapshot.');
      }
    });

    console.log('✅ Cron job scheduled: Monthly exchange rates snapshot (last day at 23:59)');

    // Optional: Also run at server startup for testing (comment out in production)
    // Uncomment next line to test on server start:
    // this.saveMonthlyRatesSnapshot();
  }

  /**
   * Manual trigger for testing or admin use
   */
  async triggerManualSnapshot() {
    console.log('🔧 Manual snapshot triggered...');
    return await this.saveMonthlyRatesSnapshot();
  }
}

export default new CronJobsService();
