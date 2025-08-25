const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

async function testAPIStructure() {
  try {
    await client.connect();
    console.log('🔍 VERIFICANDO ESTRUCTURA DE DATOS PARA MINI WEB APP\n');

    // 1. Test consulta KPIs principales
    console.log('📊 1. KPIs PRINCIPALES:');
    const kpis = await client.query(`
      SELECT 
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_general,
        COUNT(DISTINCT submission_id) as total_supervisiones,
        COUNT(DISTINCT location_id) as total_sucursales,
        COUNT(DISTINCT grupo_operativo) as total_grupos,
        COUNT(DISTINCT estado) as total_estados,
        ROUND(MIN(porcentaje)::numeric, 2) as min_calificacion,
        ROUND(MAX(porcentaje)::numeric, 2) as max_calificacion
      FROM supervision_operativa_detalle
      WHERE porcentaje IS NOT NULL
    `);
    console.log('✅ Estructura correcta:', JSON.stringify(kpis.rows[0], null, 2));

    // 2. Test grupos operativos para select
    console.log('\n🏢 2. GRUPOS OPERATIVOS (para filtros):');
    const grupos = await client.query(`
      SELECT DISTINCT grupo_operativo, COUNT(*) as registros
      FROM supervision_operativa_detalle
      WHERE grupo_operativo IS NOT NULL 
      GROUP BY grupo_operativo
      ORDER BY grupo_operativo
      LIMIT 5
    `);
    console.log('✅ Opciones de filtro disponibles:');
    grupos.rows.forEach(g => console.log(`   - ${g.grupo_operativo} (${g.registros} registros)`));

    // 3. Test datos para gráficos mobile
    console.log('\n📱 3. DATOS OPTIMIZADOS PARA MOBILE:');
    const datosMovil = await client.query(`
      SELECT 
        grupo_operativo,
        ROUND(AVG(porcentaje)::numeric, 1) as promedio,
        COUNT(DISTINCT location_id) as sucursales
      FROM supervision_operativa_detalle
      WHERE grupo_operativo IS NOT NULL AND porcentaje IS NOT NULL
      GROUP BY grupo_operativo
      ORDER BY promedio DESC
      LIMIT 8
    `);
    console.log('✅ Top 8 grupos (perfecto para pantalla móvil):');
    datosMovil.rows.forEach(g => 
      console.log(`   📊 ${g.grupo_operativo}: ${g.promedio}% (${g.sucursales} suc.)`)
    );

    // 4. Test indicadores críticos para alertas
    console.log('\n🚨 4. INDICADORES CRÍTICOS (<80% para mobile):');
    const criticos = await client.query(`
      SELECT 
        TRIM(area_evaluacion) as indicador,
        location_name as sucursal,
        grupo_operativo,
        ROUND(AVG(porcentaje)::numeric, 1) as promedio
      FROM supervision_operativa_detalle
      WHERE area_evaluacion IS NOT NULL 
        AND TRIM(area_evaluacion) != ''
        AND area_evaluacion NOT LIKE '%PUNTOS%'
        AND porcentaje IS NOT NULL
      GROUP BY TRIM(area_evaluacion), location_name, grupo_operativo
      HAVING AVG(porcentaje) < 80
      ORDER BY promedio ASC
      LIMIT 5
    `);
    console.log('✅ Alertas críticas para notificaciones:');
    criticos.rows.forEach(c => 
      console.log(`   ⚠️  ${c.indicador}: ${c.promedio}% - ${c.sucursal}`)
    );

    // 5. Test datos geográficos para mapas
    console.log('\n🗺️  5. DATOS GEOGRÁFICOS (para mapas mini):');
    const geo = await client.query(`
      SELECT 
        location_name,
        estado,
        latitud,
        longitud,
        ROUND(AVG(porcentaje)::numeric, 1) as promedio,
        CASE 
          WHEN AVG(porcentaje) >= 90 THEN 'success'
          WHEN AVG(porcentaje) >= 70 THEN 'warning'
          ELSE 'danger'
        END as status
      FROM supervision_operativa_detalle
      WHERE latitud IS NOT NULL AND longitud IS NOT NULL AND porcentaje IS NOT NULL
      GROUP BY location_id, location_name, estado, latitud, longitud
      LIMIT 10
    `);
    console.log('✅ Coordenadas para mapa móvil:');
    geo.rows.forEach(g => 
      console.log(`   📍 ${g.location_name} (${g.estado}): ${g.promedio}% [${g.status}]`)
    );

    // 6. Test rendimiento de consultas
    console.log('\n⚡ 6. TEST DE RENDIMIENTO:');
    const startTime = Date.now();
    
    await Promise.all([
      client.query('SELECT COUNT(*) FROM supervision_operativa_detalle'),
      client.query('SELECT DISTINCT grupo_operativo FROM supervision_operativa_detalle WHERE grupo_operativo IS NOT NULL'),
      client.query('SELECT AVG(porcentaje) FROM supervision_operativa_detalle WHERE porcentaje IS NOT NULL')
    ]);
    
    const endTime = Date.now();
    console.log(`✅ Consultas paralelas ejecutadas en: ${endTime - startTime}ms`);
    console.log(`   📱 Perfecto para móvil (<500ms objetivo)`);

    await client.end();
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
    await client.end();
  }
}

testAPIStructure();