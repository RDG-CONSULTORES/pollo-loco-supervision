const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Configuración para reconnexión automática en Render
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('⚠️ PostgreSQL pool error:', err.message);
  // NO matar el servidor - solo loggear el error
  // Render maneja las reconexiones automáticamente
});

module.exports = pool;