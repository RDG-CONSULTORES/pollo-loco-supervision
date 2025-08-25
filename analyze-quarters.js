const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

async function analyzeQuarters() {
  try {
    await client.connect();
    console.log('✅ Conectado a Neon PostgreSQL\n');

    // 1. Análisis de trimestres disponibles
    console.log('📅 ANÁLISIS DE TRIMESTRES:');
    const quartersQuery = await client.query(`
      SELECT 
        EXTRACT(YEAR FROM fecha_supervision) as año,
        EXTRACT(QUARTER FROM fecha_supervision) as trimestre_num,
        'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) as trimestre,
        COUNT(DISTINCT submission_id) as supervisiones,
        COUNT(DISTINCT location_id) as sucursales,
        MIN(fecha_supervision) as fecha_inicio,
        MAX(fecha_supervision) as fecha_fin
      FROM supervision_operativa_detalle
      WHERE fecha_supervision IS NOT NULL
      GROUP BY año, trimestre_num
      ORDER BY año DESC, trimestre_num DESC
      LIMIT 10;
    `);
    
    console.log('Trimestres disponibles:');
    quartersQuery.rows.forEach(row => {
      console.log(`  - ${row.trimestre}: ${row.supervisiones} supervisiones, ${row.sucursales} sucursales`);
      console.log(`    Periodo: ${new Date(row.fecha_inicio).toLocaleDateString()} - ${new Date(row.fecha_fin).toLocaleDateString()}`);
    });

    // 2. Indicadores únicos (limpieza de nombres)
    console.log('\n📊 INDICADORES ÚNICOS (29+):');
    const indicadoresQuery = await client.query(`
      SELECT DISTINCT 
        TRIM(area_evaluacion) as indicador,
        COUNT(*) as frecuencia
      FROM supervision_operativa_detalle
      WHERE area_evaluacion IS NOT NULL 
        AND TRIM(area_evaluacion) != ''
        AND area_evaluacion NOT LIKE '%PUNTOS%'
      GROUP BY TRIM(area_evaluacion)
      ORDER BY indicador;
    `);
    
    console.log(`Total de indicadores únicos: ${indicadoresQuery.rows.length}`);
    indicadoresQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.indicador}`);
    });

    // 3. Top 10 mejores sucursales (promedio general)
    console.log('\n🏆 TOP 10 MEJORES SUCURSALES:');
    const topSucursalesQuery = await client.query(`
      SELECT 
        location_name,
        grupo_operativo,
        estado,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_general,
        COUNT(DISTINCT area_evaluacion) as areas_evaluadas
      FROM supervision_operativa_detalle
      WHERE porcentaje IS NOT NULL
      GROUP BY location_name, grupo_operativo, estado
      HAVING COUNT(DISTINCT area_evaluacion) > 10
      ORDER BY promedio_general DESC
      LIMIT 10;
    `);
    
    topSucursalesQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.location_name} (${row.grupo_operativo} - ${row.estado}): ${row.promedio_general}%`);
    });

    // 4. Bottom 10 sucursales críticas
    console.log('\n🚨 BOTTOM 10 SUCURSALES CRÍTICAS:');
    const bottomSucursalesQuery = await client.query(`
      SELECT 
        location_name,
        grupo_operativo,
        estado,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_general,
        COUNT(DISTINCT area_evaluacion) as areas_evaluadas
      FROM supervision_operativa_detalle
      WHERE porcentaje IS NOT NULL
      GROUP BY location_name, grupo_operativo, estado
      HAVING COUNT(DISTINCT area_evaluacion) > 10
      ORDER BY promedio_general ASC
      LIMIT 10;
    `);
    
    bottomSucursalesQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.location_name} (${row.grupo_operativo} - ${row.estado}): ${row.promedio_general}%`);
    });

    // 5. Distribución geográfica por estado
    console.log('\n🗺️ DISTRIBUCIÓN GEOGRÁFICA:');
    const geoDistQuery = await client.query(`
      SELECT 
        estado,
        COUNT(DISTINCT location_id) as sucursales,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_estado,
        COUNT(DISTINCT submission_id) as total_supervisiones
      FROM supervision_operativa_detalle
      WHERE estado IS NOT NULL AND porcentaje IS NOT NULL
      GROUP BY estado
      ORDER BY sucursales DESC;
    `);
    
    geoDistQuery.rows.forEach(row => {
      console.log(`  - ${row.estado}: ${row.sucursales} sucursales, ${row.promedio_estado}% promedio (${row.total_supervisiones} supervisiones)`);
    });

    // 6. Último trimestre disponible para filtros
    console.log('\n🔍 ÚLTIMO TRIMESTRE DISPONIBLE:');
    const lastQuarterQuery = await client.query(`
      SELECT 
        MAX(fecha_supervision) as ultima_fecha,
        'Q' || EXTRACT(QUARTER FROM MAX(fecha_supervision)) || ' ' || EXTRACT(YEAR FROM MAX(fecha_supervision)) as ultimo_trimestre
      FROM supervision_operativa_detalle
      WHERE fecha_supervision IS NOT NULL;
    `);
    
    console.log(`  - Última supervisión: ${new Date(lastQuarterQuery.rows[0].ultima_fecha).toLocaleDateString()}`);
    console.log(`  - Último trimestre: ${lastQuarterQuery.rows[0].ultimo_trimestre}`);

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

analyzeQuarters();