// Debug script to check EXPO score from database
const { Pool } = require('pg');
require('dotenv').config();

// Database connection using connection string (same as server)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function debugExpoScore() {
  try {
    console.log('🔍 Debugging EXPO score calculation...\n');
    
    // 1. Check individual Montemorelos records
    console.log('1. Individual Montemorelos scores:');
    const monteQuery = `
      SELECT 
        location_name,
        fecha_supervision,
        area_evaluacion,
        porcentaje,
        grupo_operativo_limpio
      FROM supervision_operativa_clean
      WHERE location_name LIKE '%Montemorelos%'
        AND fecha_supervision >= NOW() - INTERVAL '6 months'
      ORDER BY fecha_supervision DESC, area_evaluacion
    `;
    
    const monteResult = await pool.query(monteQuery);
    console.log(`Found ${monteResult.rows.length} Montemorelos records:`);
    monteResult.rows.forEach(row => {
      console.log(`  ${row.fecha_supervision.toISOString().split('T')[0]} | ${row.area_evaluacion} | ${row.porcentaje}% | ${row.grupo_operativo_limpio}`);
    });
    
    // 2. Calculate average for Montemorelos specifically
    const avgMonteQuery = `
      SELECT 
        location_name,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_montemorelos,
        COUNT(*) as total_evaluaciones
      FROM supervision_operativa_clean
      WHERE location_name LIKE '%Montemorelos%'
        AND fecha_supervision >= NOW() - INTERVAL '6 months'
        AND porcentaje IS NOT NULL
      GROUP BY location_name
    `;
    
    const avgMonteResult = await pool.query(avgMonteQuery);
    console.log('\n2. Montemorelos average:');
    avgMonteResult.rows.forEach(row => {
      console.log(`  ${row.location_name}: ${row.promedio_montemorelos}% (${row.total_evaluaciones} evaluations)`);
    });
    
    // 3. Check EXPO group calculation (same as operational-groups API)
    console.log('\n3. EXPO group calculation (from operational-groups API):');
    const expoQuery = `
      SELECT 
        grupo_operativo_limpio as name,
        COUNT(DISTINCT location_name) as total_sucursales,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_performance,
        COUNT(*) as total_evaluaciones
      FROM supervision_operativa_clean
      WHERE grupo_operativo_limpio = 'EXPO'
        AND porcentaje IS NOT NULL
        AND fecha_supervision >= NOW() - INTERVAL '6 months'
      GROUP BY grupo_operativo_limpio
    `;
    
    const expoResult = await pool.query(expoQuery);
    console.log('EXPO group stats:');
    expoResult.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.promedio_performance}% (${row.total_sucursales} locations, ${row.total_evaluaciones} evaluations)`);
    });
    
    // 4. Check all EXPO locations
    console.log('\n4. All EXPO locations:');
    const expoLocationsQuery = `
      SELECT 
        location_name,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_location,
        COUNT(*) as evaluaciones
      FROM supervision_operativa_clean
      WHERE grupo_operativo_limpio = 'EXPO'
        AND porcentaje IS NOT NULL
        AND fecha_supervision >= NOW() - INTERVAL '6 months'
      GROUP BY location_name
      ORDER BY promedio_location DESC
    `;
    
    const expoLocationsResult = await pool.query(expoLocationsQuery);
    expoLocationsResult.rows.forEach(row => {
      console.log(`  ${row.location_name}: ${row.promedio_location}% (${row.evaluaciones} evaluations)`);
    });
    
    // 5. Check exact calculation breakdown
    console.log('\n5. Calculation breakdown for EXPO:');
    const breakdownQuery = `
      SELECT 
        location_name,
        porcentaje
      FROM supervision_operativa_clean
      WHERE grupo_operativo_limpio = 'EXPO'
        AND porcentaje IS NOT NULL
        AND fecha_supervision >= NOW() - INTERVAL '6 months'
      ORDER BY location_name, porcentaje
    `;
    
    const breakdownResult = await pool.query(breakdownQuery);
    console.log(`Total records for average calculation: ${breakdownResult.rows.length}`);
    
    // Filter out null values for accurate calculation
    const validRecords = breakdownResult.rows.filter(row => row.porcentaje !== null);
    console.log(`Valid records (non-null): ${validRecords.length}`);
    
    // Manual calculation
    const sum = validRecords.reduce((acc, row) => acc + parseFloat(row.porcentaje), 0);
    const avg = sum / validRecords.length;
    console.log(`Manual calculation: ${sum} / ${validRecords.length} = ${avg.toFixed(6)}`);
    console.log(`Rounded to 2 decimals: ${Math.round(avg * 100) / 100}`);
    console.log(`Frontend display (toFixed(1)): ${avg.toFixed(1)}%`);
    
    // Show sample breakdown
    console.log('\nSample valid records (first 20):');
    validRecords.slice(0, 20).forEach(row => {
      console.log(`  ${row.location_name}: ${row.porcentaje}%`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugExpoScore();