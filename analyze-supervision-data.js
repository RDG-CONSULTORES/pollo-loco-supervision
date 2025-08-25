const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

async function analyzeSupervisionData() {
  try {
    await client.connect();
    console.log('✅ Conectado a Neon PostgreSQL\n');

    // 1. Estructura detallada de la tabla
    console.log('📊 ESTRUCTURA DE supervision_operativa_detalle:');
    const structureQuery = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'supervision_operativa_detalle'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columnas:');
    structureQuery.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // 2. Estadísticas generales
    console.log('\n📈 ESTADÍSTICAS GENERALES:');
    const statsQuery = await client.query(`
      SELECT 
        COUNT(DISTINCT submission_id) as total_supervisiones,
        COUNT(DISTINCT location_id) as total_sucursales,
        COUNT(DISTINCT area_evaluacion) as total_indicadores,
        COUNT(*) as total_registros
      FROM supervision_operativa_detalle;
    `);
    console.log(statsQuery.rows[0]);

    // 3. Grupos operativos disponibles
    console.log('\n👥 GRUPOS OPERATIVOS:');
    const gruposQuery = await client.query(`
      SELECT DISTINCT grupo_operativo, COUNT(DISTINCT location_id) as sucursales
      FROM supervision_operativa_detalle
      WHERE grupo_operativo IS NOT NULL
      GROUP BY grupo_operativo
      ORDER BY grupo_operativo;
    `);
    gruposQuery.rows.forEach(row => {
      console.log(`  - ${row.grupo_operativo}: ${row.sucursales} sucursales`);
    });

    // 4. Estados disponibles
    console.log('\n📍 ESTADOS:');
    const estadosQuery = await client.query(`
      SELECT DISTINCT estado, COUNT(DISTINCT location_id) as sucursales
      FROM supervision_operativa_detalle
      WHERE estado IS NOT NULL
      GROUP BY estado
      ORDER BY estado;
    `);
    estadosQuery.rows.forEach(row => {
      console.log(`  - ${row.estado}: ${row.sucursales} sucursales`);
    });

    // 5. Indicadores (areas de evaluación)
    console.log('\n📋 INDICADORES/ÁREAS DE EVALUACIÓN:');
    const indicadoresQuery = await client.query(`
      SELECT DISTINCT area_evaluacion, COUNT(*) as registros
      FROM supervision_operativa_detalle
      WHERE area_evaluacion IS NOT NULL
      GROUP BY area_evaluacion
      ORDER BY area_evaluacion;
    `);
    console.log(`Total de indicadores: ${indicadoresQuery.rows.length}`);
    indicadoresQuery.rows.forEach(row => {
      console.log(`  - ${row.area_evaluacion}: ${row.registros} registros`);
    });

    // 6. Análisis temporal
    console.log('\n📅 ANÁLISIS TEMPORAL:');
    const temporalQuery = await client.query(`
      SELECT 
        DATE_TRUNC('quarter', fecha_supervision) as trimestre,
        COUNT(DISTINCT submission_id) as supervisiones,
        COUNT(DISTINCT location_id) as sucursales_evaluadas
      FROM supervision_operativa_detalle
      WHERE fecha_supervision IS NOT NULL
      GROUP BY trimestre
      ORDER BY trimestre DESC
      LIMIT 8;
    `);
    console.log('Últimos trimestres:');
    temporalQuery.rows.forEach(row => {
      console.log(`  - ${row.trimestre ? new Date(row.trimestre).toISOString().substring(0,10) : 'N/A'}: ${row.supervisiones} supervisiones, ${row.sucursales_evaluadas} sucursales`);
    });

    // 7. Promedio de calificaciones por grupo
    console.log('\n🎯 PROMEDIO DE CALIFICACIONES POR GRUPO:');
    const promediosQuery = await client.query(`
      SELECT 
        grupo_operativo,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_general,
        COUNT(DISTINCT submission_id) as total_evaluaciones
      FROM supervision_operativa_detalle
      WHERE grupo_operativo IS NOT NULL AND porcentaje IS NOT NULL
      GROUP BY grupo_operativo
      ORDER BY promedio_general DESC;
    `);
    promediosQuery.rows.forEach(row => {
      console.log(`  - ${row.grupo_operativo}: ${row.promedio_general}% (${row.total_evaluaciones} evaluaciones)`);
    });

    // 8. Top 10 mejores áreas
    console.log('\n✅ TOP 10 MEJORES ÁREAS:');
    const topAreasQuery = await client.query(`
      SELECT 
        area_evaluacion,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio
      FROM supervision_operativa_detalle
      WHERE porcentaje IS NOT NULL
      GROUP BY area_evaluacion
      ORDER BY promedio DESC
      LIMIT 10;
    `);
    topAreasQuery.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.area_evaluacion}: ${row.promedio}%`);
    });

    // 9. Top 10 áreas críticas
    console.log('\n❌ TOP 10 ÁREAS CRÍTICAS:');
    const bottomAreasQuery = await client.query(`
      SELECT 
        area_evaluacion,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio
      FROM supervision_operativa_detalle
      WHERE porcentaje IS NOT NULL
      GROUP BY area_evaluacion
      ORDER BY promedio ASC
      LIMIT 10;
    `);
    bottomAreasQuery.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.area_evaluacion}: ${row.promedio}%`);
    });

    // 10. Verificar datos geográficos
    console.log('\n🗺️ DATOS GEOGRÁFICOS:');
    const geoQuery = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(latitud) as con_latitud,
        COUNT(longitud) as con_longitud,
        COUNT(DISTINCT location_id) as sucursales_con_geo
      FROM supervision_operativa_detalle
      WHERE latitud IS NOT NULL AND longitud IS NOT NULL;
    `);
    console.log(geoQuery.rows[0]);

    // 11. Muestra de datos
    console.log('\n📝 MUESTRA DE DATOS:');
    const sampleQuery = await client.query(`
      SELECT 
        submission_id,
        location_name,
        grupo_operativo,
        estado,
        area_evaluacion,
        porcentaje,
        fecha_supervision
      FROM supervision_operativa_detalle
      LIMIT 5;
    `);
    console.log('Primeros 5 registros:');
    sampleQuery.rows.forEach(row => {
      console.log(row);
    });

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

analyzeSupervisionData();