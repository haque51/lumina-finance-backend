const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('🔌 Testing database...');
    await testConnection();

    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 Lumina Finance API Started!');
      console.log('='.repeat(50));
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
      console.log('='.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
