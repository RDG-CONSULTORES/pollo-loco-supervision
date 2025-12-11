const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function exploreData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 EXPLORACIÓN COMPLETA DE DATOS');
    console.log('=' .repeat(80));

    // 1. Check what normalized names exist that might match "La Huasteca"
    console.log('\n1️⃣ BÚSQUEDA DE VARIACIONES DE "LA HUASTECA"');
    
    const huastecaVariationsQuery = `
      SELECT DISTINCT 
        nombre_normalizado,
        location_name,
        COUNT(*) as registros,
        MAX(fecha_supervision) as ultima_supervision
      FROM supervision_normalized_view 
      WHERE nombre_normalizado ILIKE '%huasteca%' 
         OR location_name ILIKE '%huasteca%'
         OR nombre_normalizado ILIKE '%huaste%'
         OR location_name ILIKE '%huaste%'
      GROUP BY nombre_normalizado, location_name
      ORDER BY registros DESC;
    `;
    
    const huastecaResult = await client.query(huastecaVariationsQuery);
    
    if (huastecaResult.rows.length > 0) {
      console.log('✅ Variaciones encontradas:');
      huastecaResult.rows.forEach(row => {
        console.log(`   📍 ${row.nombre_normalizado} (${row.location_name})`);
        console.log(`      Registros: ${row.registros} | Última supervisión: ${row.ultima_supervision?.toISOString().split('T')[0] || 'N/A'}`);
      });
    } else {
      console.log('❌ No se encontraron variaciones con "huasteca"');
    }
    
    // 2. Check all unique normalized names to see what exists
    console.log('\n2️⃣ MUESTRA DE NOMBRES NORMALIZADOS DISPONIBLES');
    const allNamesQuery = `
      SELECT DISTINCT 
        nombre_normalizado,
        location_name,
        COUNT(*) as registros
      FROM supervision_normalized_view 
      GROUP BY nombre_normalizado, location_name
      ORDER BY registros DESC
      LIMIT 20;
    `;
    
    const allNamesResult = await client.query(allNamesQuery);
    console.log('📋 Top 20 sucursales por número de registros:');
    allNamesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nombre_normalizado} (${row.location_name}) - ${row.registros} registros`);
    });
    
    // 3. Check date ranges in the database
    console.log('\n3️⃣ RANGO DE FECHAS DISPONIBLES');
    const dateRangeQuery = `
      SELECT 
        MIN(fecha_supervision) as fecha_min,
        MAX(fecha_supervision) as fecha_max,
        COUNT(*) as total_registros,
        COUNT(DISTINCT nombre_normalizado) as sucursales_unicas
      FROM supervision_normalized_view;
    `;
    
    const dateRangeResult = await client.query(dateRangeQuery);
    if (dateRangeResult.rows.length > 0) {
      const range = dateRangeResult.rows[0];
      console.log(`📅 Período disponible: ${range.fecha_min?.toISOString().split('T')[0]} a ${range.fecha_max?.toISOString().split('T')[0]}`);
      console.log(`📊 Total registros: ${range.total_registros}`);
      console.log(`📊 Sucursales únicas: ${range.sucursales_unicas}`);
    }
    
    // 4. Check recent records (T4 period)
    console.log('\n4️⃣ REGISTROS EN PERÍODO T4 (2025-10-30 en adelante)');
    const t4Query = `
      SELECT 
        nombre_normalizado,
        location_name,
        COUNT(*) as registros,
        AVG(porcentaje) as promedio,
        MAX(fecha_supervision) as ultima_fecha
      FROM supervision_normalized_view 
      WHERE fecha_supervision >= '2025-10-30'
      GROUP BY nombre_normalizado, location_name
      ORDER BY registros DESC
      LIMIT 15;
    `;
    
    const t4Result = await client.query(t4Query);
    if (t4Result.rows.length > 0) {
      console.log('📋 Sucursales con registros en T4:');
      t4Result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.nombre_normalizado} (${row.location_name})`);
        console.log(`   📊 ${row.registros} registros | Promedio: ${parseFloat(row.promedio).toFixed(2)}% | Última: ${row.ultima_fecha?.toISOString().split('T')[0]}`);
      });
    } else {
      console.log('❌ No se encontraron registros en período T4');
    }
    
    // 5. Search for names containing parts of "La Huasteca"
    console.log('\n5️⃣ BÚSQUEDA AMPLIA POR PALABRAS CLAVE');
    const keywordSearch = `
      SELECT DISTINCT 
        nombre_normalizado,
        location_name,
        COUNT(*) as registros
      FROM supervision_normalized_view 
      WHERE location_name ILIKE '%la%' AND location_name ILIKE '%huast%'
         OR nombre_normalizado ILIKE '%la%' AND nombre_normalizado ILIKE '%huast%'
      GROUP BY nombre_normalizado, location_name
      ORDER BY registros DESC;
    `;
    
    const keywordResult = await client.query(keywordSearch);
    if (keywordResult.rows.length > 0) {
      console.log('🔍 Búsqueda por palabras clave "la" + "huast":');
      keywordResult.rows.forEach(row => {
        console.log(`   📍 ${row.nombre_normalizado} (${row.location_name}) - ${row.registros} registros`);
      });
    } else {
      console.log('❌ No se encontraron coincidencias con palabras clave');
    }
    
    // 6. Check if the issue is with the date format or timezone
    console.log('\n6️⃣ VERIFICACIÓN DE FECHAS RECIENTES');
    const recentDatesQuery = `
      SELECT DISTINCT 
        DATE(fecha_supervision) as fecha_date,
        COUNT(*) as registros
      FROM supervision_normalized_view 
      WHERE fecha_supervision >= '2025-10-01'
      GROUP BY DATE(fecha_supervision)
      ORDER BY fecha_date DESC
      LIMIT 10;
    `;
    
    const recentDatesResult = await client.query(recentDatesQuery);
    if (recentDatesResult.rows.length > 0) {
      console.log('📅 Fechas más recientes en la base de datos:');
      recentDatesResult.rows.forEach(row => {
        console.log(`   ${row.fecha_date} - ${row.registros} registros`);
      });
    }
    
    // 7. Check for exact location name matches
    console.log('\n7️⃣ BÚSQUEDA POR LOCATION_NAME EXACTO');
    const exactLocationQuery = `
      SELECT DISTINCT location_name, COUNT(*) as registros
      FROM supervision_normalized_view 
      GROUP BY location_name
      HAVING location_name ILIKE '%huasteca%' OR location_name ILIKE '%la huasteca%'
      ORDER BY registros DESC;
    `;
    
    const exactLocationResult = await client.query(exactLocationQuery);
    if (exactLocationResult.rows.length > 0) {
      console.log('🎯 Coincidencias exactas en location_name:');
      exactLocationResult.rows.forEach(row => {
        console.log(`   "${row.location_name}" - ${row.registros} registros`);
      });
    } else {
      console.log('❌ No hay coincidencias exactas en location_name');
    }
    
  } catch (error) {
    console.error('❌ Error during exploration:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

exploreData();