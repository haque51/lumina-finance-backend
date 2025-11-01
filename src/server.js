// src/server.js

import dotenv from 'dotenv';
import app from './app.js';
import { supabase } from './config/database.js';
import cronJobsService from './services/cronJobs.service.js';

// Load environment variables FIRST
dotenv.config();

const PORT = process.env.PORT || 3000;

// Test database connection
async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.warn('Database connection warning:', error.message);
    } else {
      console.log('✅ Database connected successfully');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  await testDatabaseConnection();
  
  // Initialize cron jobs AFTER env vars are loaded and DB is tested
  cronJobsService.initializeCronJobs();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});
