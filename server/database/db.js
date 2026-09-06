/**
 * StudyHub — MySQL2 Promise Connection Pool
 * 
 * Uses environment variables (loaded by dotenv in server.js) for all credentials.
 * All models import this pool and use pool.execute() for parameterized queries.
 */

'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASS     || '',
  database:           process.env.DB_NAME     || 'studyhub',
  waitForConnections: true,
  connectionLimit:    parseInt(process.env.DB_POOL_LIMIT || '10', 10),
  queueLimit:         0,
  // Return JS Date objects for DATE/DATETIME columns
  dateStrings:        false,
  // Always use timezone-aware timestamps
  timezone:           '+00:00'
});

/**
 * Test connectivity during startup.
 * Called once from server.js — not blocking on import.
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL connected — host:', process.env.DB_HOST || 'localhost',
                '| db:', process.env.DB_NAME || 'studyhub');
    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('    Check your .env file (DB_HOST, DB_USER, DB_PASS, DB_NAME).');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
