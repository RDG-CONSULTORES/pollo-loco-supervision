const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function sampleDataAnalysis() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📊 SAMPLE DATA FROM supervision_operativa_clean');
    console.log('='.repeat(60));
    
    // Get table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'supervision_operativa_clean'
      ORDER BY ordinal_position;
    `;
    const structure = await pool.query(structureQuery);
    
    console.log('\n🏗️ TABLE STRUCTURE:');
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Get sample data
    const sampleQuery = `
      SELECT 
        location_name,
        grupo_operativo_limpio,
        area_evaluacion,
        porcentaje,
        fecha_supervision,
        estado_normalizado,
        municipio,
        latitud,
        longitud
      FROM supervision_operativa_clean 
      WHERE latitud IS NOT NULL 
        AND longitud IS NOT NULL
        AND porcentaje IS NOT NULL
      LIMIT 10;
    `;
    const sample = await pool.query(sampleQuery);
    
    console.log('\n📍 SAMPLE DATA WITH COORDINATES:');
    sample.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.location_name} (${row.grupo_operativo_limpio})`);
      console.log(`   📍 ${row.estado_normalizado}, ${row.municipio}`);
      console.log(`   🗺️ Lat: ${row.latitud}, Lng: ${row.longitud}`);
      console.log(`   📊 ${row.area_evaluacion}: ${row.porcentaje}%`);
      console.log(`   📅 ${row.fecha_supervision}\n`);
    });
    
    // Geographic coverage
    const geoQuery = `
      SELECT 
        estado_normalizado,
        municipio,
        COUNT(DISTINCT location_name) as sucursales,
        COUNT(CASE WHEN latitud IS NOT NULL AND longitud IS NOT NULL THEN 1 END) as con_coordenadas,
        ROUND(AVG(porcentaje), 2) as promedio_performance
      FROM supervision_operativa_clean
      WHERE estado_normalizado IS NOT NULL
      GROUP BY estado_normalizado, municipio
      ORDER BY estado_normalizado, municipio;
    `;
    const geoData = await pool.query(geoQuery);
    
    console.log('\n🗺️ GEOGRAPHIC COVERAGE:');
    let currentState = '';
    geoData.rows.forEach(row => {
      if (row.estado_normalizado !== currentState) {
        currentState = row.estado_normalizado;
        console.log(`\n📍 ${currentState}:`);
      }
      console.log(`   • ${row.municipio}: ${row.sucursales} sucursales, ${row.con_coordenadas} con coordenadas, ${row.promedio_performance}% avg`);
    });
    
    // Performance metrics by quarter
    const timeQuery = `
      SELECT 
        EXTRACT(QUARTER FROM fecha_supervision) as trimestre,
        COUNT(*) as total_evaluaciones,
        COUNT(DISTINCT location_name) as sucursales_evaluadas,
        COUNT(DISTINCT grupo_operativo_limpio) as grupos_activos,
        ROUND(AVG(porcentaje), 2) as promedio_performance,
        COUNT(DISTINCT area_evaluacion) as areas_evaluadas
      FROM supervision_operativa_clean
      WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025
      GROUP BY EXTRACT(QUARTER FROM fecha_supervision)
      ORDER BY trimestre;
    `;
    const timeData = await pool.query(timeQuery);
    
    console.log('\n📅 QUARTERLY PERFORMANCE DATA:');
    timeData.rows.forEach(row => {
      console.log(`Q${row.trimestre} 2025:`);
      console.log(`   📊 ${row.total_evaluaciones} evaluaciones`);
      console.log(`   🏪 ${row.sucursales_evaluadas} sucursales evaluadas`);
      console.log(`   👥 ${row.grupos_activos} grupos activos`);
      console.log(`   📈 ${row.promedio_performance}% promedio performance`);
      console.log(`   📋 ${row.areas_evaluadas} áreas evaluadas\n`);
    });

    // Areas evaluation analysis
    const areasQuery = `
      SELECT 
        area_evaluacion,
        COUNT(*) as evaluaciones,
        ROUND(AVG(porcentaje), 2) as promedio,
        ROUND(MIN(porcentaje), 2) as minimo,
        ROUND(MAX(porcentaje), 2) as maximo
      FROM supervision_operativa_clean
      WHERE area_evaluacion IS NOT NULL 
        AND area_evaluacion != ''
        AND porcentaje IS NOT NULL
        AND EXTRACT(YEAR FROM fecha_supervision) = 2025
      GROUP BY area_evaluacion
      ORDER BY promedio DESC
      LIMIT 10;
    `;
    const areasData = await pool.query(areasQuery);
    
    console.log('\n📋 TOP PERFORMANCE AREAS:');
    areasData.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.area_evaluacion}`);
      console.log(`   📊 Promedio: ${row.promedio}% (${row.evaluaciones} evaluaciones)`);
      console.log(`   📈 Rango: ${row.minimo}% - ${row.maximo}%\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

sampleDataAnalysis();