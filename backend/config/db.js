const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blog_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Quick connectivity check on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL database:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
    console.error('   Check your .env DB_* values and that MySQL is running.');
  }
})();

module.exports = pool;
