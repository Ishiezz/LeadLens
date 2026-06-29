require('dotenv').config();
const app = require('./app');
const { runMigrations } = require('./utils/migrate');

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Auto-run migrations on startup if tables are missing
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`\n🚀 LeadLens API running on port ${PORT}`);
      console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
