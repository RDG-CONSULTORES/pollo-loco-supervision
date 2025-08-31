const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Connection string:', process.env.DATABASE_URL ? 'DATABASE_URL set' : 'NEON_DATABASE_URL set');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Test KPIs query
    console.log('\n🔍 Testing KPIs query...');
    const kpisResult = await client.query(`
      SELECT 
        ROUND(AVG(porcentaje), 2) as promedio_general,
        COUNT(DISTINCT submission_id) as total_supervisiones,
        COUNT(DISTINCT location_name) as total_sucursales,
        COUNT(DISTINCT estado) as total_estados,
        ROUND(MAX(porcentaje), 2) as max_calificacion,
        ROUND(MIN(porcentaje), 2) as min_calificacion
      FROM supervision_operativa_detalle 
      WHERE porcentaje IS NOT NULL
    `);
    console.log('KPIs result:', kpisResult.rows[0]);
    
    // Test grupos query
    console.log('\n🔍 Testing grupos query...');
    const gruposResult = await client.query(`
      SELECT 
        grupo_operativo,
        ROUND(AVG(porcentaje), 2) as promedio,
        COUNT(DISTINCT submission_id) as supervisiones,
        COUNT(DISTINCT location_name) as sucursales
      FROM supervision_operativa_detalle 
      WHERE porcentaje IS NOT NULL AND grupo_operativo IS NOT NULL
      GROUP BY grupo_operativo
      ORDER BY AVG(porcentaje) DESC
      LIMIT 5
    `);
    console.log('Grupos result (top 5):', gruposResult.rows);
    
    // Test locations query
    console.log('\n🔍 Testing locations query...');
    const locationsResult = await client.query(`
      SELECT COUNT(*) as total 
      FROM supervision_operativa_clean 
      WHERE latitud IS NOT NULL AND longitud IS NOT NULL
    `);
    console.log('Locations with coordinates:', locationsResult.rows[0].total);
    
    // Release client
    client.release();
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testConnection();