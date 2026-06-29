const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runMigrations() {
  console.log('🔄 Checking database status...');
  try {
    // Check if the chat_sessions table already exists
    const checkRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chat_sessions'
      );
    `);
    
    const tableExists = checkRes.rows[0].exists;
    if (tableExists) {
      console.log('✨ Database tables already exist. Skipping migrations.');
      return;
    }

    console.log('🔄 Table "chat_sessions" not found. Running database migrations...');
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Run the schema
    await pool.query(schemaSql);
    console.log('✅ Database migration successful!');
  } catch (err) {
    console.error('❌ Database migration failed:', err);
    throw err;
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
