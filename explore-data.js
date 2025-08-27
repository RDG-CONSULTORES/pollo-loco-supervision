// Exploración de datos El Pollo Loco
const { Pool } = require('pg');

// Using current DATABASE_URL 
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function explorePolloLocoData() {
  try {
    console.log('🔍 EXPLORANDO ESTRUCTURA DE DATOS EL POLLO LOCO\n');
    
    // 1. Ver estructura completa de columnas
    console.log('📋 1. ESTRUCTURA DE COLUMNAS:');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'supervision_operativa_detalle'
      ORDER BY ordinal_position
    `);
    
    columns.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    // 2. Verificar grupos operativos
    console.log('\n👥 2. GRUPOS OPERATIVOS DISPONIBLES:');
    const grupos = await pool.query(`
      SELECT DISTINCT grupo_operativo, COUNT(*) as registros
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo IS NOT NULL
      GROUP BY grupo_operativo
      ORDER BY grupo_operativo
    `);
    
    grupos.rows.forEach(row => {
      console.log(`   - ${row.grupo_operativo}: ${row.registros} registros`);
    });
    
    // 3. Verificar CALIFICACION GENERAL (PUNTOS MAXIMOS)
    console.log('\n🎯 3. VERIFICANDO CALIFICACIÓN GENERAL:');
    
    // Buscar en diferentes variaciones
    console.log('   Buscando "PUNTOS MAXIMOS" y calculando porcentaje:');
    const puntosMax = await pool.query(`
      SELECT 
        location_name, 
        grupo_operativo, 
        porcentaje,
        puntos_maximos, 
        puntos_obtenidos,
        CASE 
          WHEN puntos_maximos > 0 THEN ROUND((puntos_obtenidos::numeric / puntos_maximos::numeric) * 100, 2)
          ELSE NULL
        END as porcentaje_calculado,
        fecha_supervision
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion = 'PUNTOS MAXIMOS'
        AND puntos_maximos IS NOT NULL
        AND puntos_obtenidos IS NOT NULL
      ORDER BY fecha_supervision DESC
      LIMIT 10
    `);
    
    if (puntosMax.rows.length > 0) {
      puntosMax.rows.forEach(row => {
        console.log(`   ${row.location_name} | ${row.grupo_operativo}: porcentaje=${row.porcentaje}% calculado=${row.porcentaje_calculado}% (${row.puntos_obtenidos}/${row.puntos_maximos})`);
      });
    } else {
      console.log('   ❌ No encontrado como "PUNTOS MAXIMOS"');
    }
    
    // Investigar más sobre PUNTOS MAXIMOS
    console.log('\n   Investigando registros de PUNTOS MAXIMOS:');
    const investigacion = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN porcentaje IS NOT NULL THEN 1 END) as con_porcentaje,
        COUNT(CASE WHEN puntos_maximos IS NOT NULL THEN 1 END) as con_puntos_max,
        COUNT(CASE WHEN puntos_obtenidos IS NOT NULL THEN 1 END) as con_puntos_obt
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion = 'PUNTOS MAXIMOS'
    `);
    
    console.log(`   Total registros: ${investigacion.rows[0].total}`);
    console.log(`   Con porcentaje: ${investigacion.rows[0].con_porcentaje}`);
    console.log(`   Con puntos_maximos: ${investigacion.rows[0].con_puntos_max}`);
    console.log(`   Con puntos_obtenidos: ${investigacion.rows[0].con_puntos_obt}`);
    
    // Ver la secuencia correcta: PUNTOS MAXIMOS → Vacio (puntos totales) → Vacio (porcentaje)
    console.log('\n   Verificando secuencia PUNTOS MAXIMOS → Totales → Porcentaje:');
    const secuencia = await pool.query(`
      SELECT 
        submission_id,
        location_name,
        grupo_operativo,
        area_evaluacion,
        puntos_maximos,
        puntos_obtenidos,
        porcentaje,
        ROW_NUMBER() OVER (PARTITION BY submission_id ORDER BY id) as orden
      FROM supervision_operativa_detalle
      WHERE submission_id IN (
        SELECT DISTINCT submission_id 
        FROM supervision_operativa_detalle 
        WHERE area_evaluacion = 'PUNTOS MAXIMOS'
        LIMIT 3
      )
      AND (area_evaluacion = 'PUNTOS MAXIMOS' OR area_evaluacion = '' OR area_evaluacion IS NULL)
      ORDER BY submission_id, orden
    `);
    
    console.log('\n   Mostrando registros ordenados:');
    let currentSubmission = null;
    secuencia.rows.forEach(row => {
      if (row.submission_id !== currentSubmission) {
        console.log(`\n   === ${row.location_name} (${row.grupo_operativo}) - ${row.submission_id} ===`);
        currentSubmission = row.submission_id;
      }
      console.log(`   ${row.orden}. area="${row.area_evaluacion}" | puntos_max=${row.puntos_maximos} | puntos_obt=${row.puntos_obtenidos} | porcentaje=${row.porcentaje}%`);
    });
    
    // Buscar otras variaciones
    console.log('\n   Buscando variaciones de CALIFICACION GENERAL:');
    const variations = await pool.query(`
      SELECT DISTINCT area_evaluacion, COUNT(*) as count
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion LIKE '%GENERAL%' 
         OR area_evaluacion LIKE '%TOTAL%'
         OR area_evaluacion LIKE '%PUNTOS%'
         OR area_evaluacion LIKE '%CALIFICACION%'
      GROUP BY area_evaluacion
      ORDER BY count DESC
    `);
    
    if (variations.rows.length > 0) {
      variations.rows.forEach(row => {
        console.log(`   "${row.area_evaluacion}": ${row.count} registros`);
      });
    }
    
    // 4. Áreas de evaluación (sin duplicados, sin nulls, sin PUNTOS MAXIMOS)
    console.log('\n📊 4. ÁREAS DE EVALUACIÓN REALES (29):');
    const areas = await pool.query(`
      SELECT DISTINCT area_evaluacion, COUNT(*) as evaluaciones
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion IS NOT NULL 
        AND area_evaluacion != 'PUNTOS MAXIMOS'
        AND area_evaluacion != ''
        AND porcentaje IS NOT NULL
      GROUP BY area_evaluacion
      ORDER BY area_evaluacion
    `);
    
    areas.rows.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.area_evaluacion} (${row.evaluaciones} evaluaciones)`);
    });
    console.log(`   TOTAL: ${areas.rows.length} áreas\n`);
    
    // 2. Verificar CALIFICACION GENERAL
    console.log('🎯 2. VERIFICANDO CALIFICACIÓN GENERAL:');
    const generalExists = await pool.query(`
      SELECT COUNT(*) as count
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion = 'CALIFICACION GENERAL'
    `);
    
    if (parseInt(generalExists.rows[0].count) > 0) {
      console.log('   ✅ CALIFICACION GENERAL existe');
      
      const generalSample = await pool.query(`
        SELECT location_name, grupo_operativo, porcentaje
        FROM supervision_operativa_detalle 
        WHERE area_evaluacion = 'CALIFICACION GENERAL'
        LIMIT 3
      `);
      
      generalSample.rows.forEach(row => {
        console.log(`   ${row.location_name} (${row.grupo_operativo}): ${row.porcentaje}%`);
      });
    } else {
      console.log('   ❌ CALIFICACION GENERAL no encontrada');
    }
    
    // 3. Distribución de calificaciones por área
    console.log('\n📈 3. DISTRIBUCIÓN POR ÁREA (bottom 10):');
    const distribution = await pool.query(`
      SELECT 
        area_evaluacion,
        ROUND(AVG(porcentaje), 2) as promedio,
        ROUND(MIN(porcentaje), 2) as minimo,
        ROUND(MAX(porcentaje), 2) as maximo,
        COUNT(*) as registros
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion IS NOT NULL 
        AND porcentaje IS NOT NULL
        AND area_evaluacion != 'CALIFICACION GENERAL'
      GROUP BY area_evaluacion
      ORDER BY promedio ASC
      LIMIT 10
    `);
    
    distribution.rows.forEach(row => {
      const emoji = row.promedio >= 90 ? '🏆' : row.promedio >= 85 ? '✅' : row.promedio >= 80 ? '⚠️' : '🚨';
      console.log(`   ${emoji} ${row.area_evaluacion}: ${row.promedio}% (${row.minimo}%-${row.maximo}%) [${row.registros} registros]`);
    });
    
    // 4. Top 5 áreas
    console.log('\n🏆 4. TOP 5 ÁREAS:');
    const topAreas = await pool.query(`
      SELECT 
        area_evaluacion,
        ROUND(AVG(porcentaje), 2) as promedio
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion IS NOT NULL 
        AND porcentaje IS NOT NULL
        AND area_evaluacion != 'CALIFICACION GENERAL'
      GROUP BY area_evaluacion
      ORDER BY promedio DESC
      LIMIT 5
    `);
    
    topAreas.rows.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.area_evaluacion}: ${row.promedio}%`);
    });
    
    // 5. Estructura de tabla sample
    console.log('\n📊 5. MUESTRA DE ESTRUCTURA:');
    const sample = await pool.query(`
      SELECT location_name, grupo_operativo, area_evaluacion, porcentaje, fecha_supervision
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion IS NOT NULL
      ORDER BY fecha_supervision DESC
      LIMIT 5
    `);
    
    sample.rows.forEach(row => {
      console.log(`   ${row.location_name} | ${row.grupo_operativo} | ${row.area_evaluacion} | ${row.porcentaje}% | ${row.fecha_supervision.toISOString().split('T')[0]}`);
    });
    
    await pool.end();
    console.log('\n✅ Exploración completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Nueva función para obtener calificaciones de TEPEYAC Q3 2025
async function obtenerCalificacionesTepeyac() {
  try {
    console.log('\n\n🎯 CALIFICACIONES GRUPO TEPEYAC - Q3 2025 (TRIMESTRE ACTUAL)\n');
    
    const result = await pool.query(`
      SELECT DISTINCT
        location_name as sucursal,
        porcentaje as calificacion_general,
        fecha_supervision
      FROM supervision_operativa_detalle
      WHERE grupo_operativo = 'TEPEYAC'
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
        AND EXTRACT(YEAR FROM fecha_supervision) = 2025
        AND EXTRACT(QUARTER FROM fecha_supervision) = 3
      ORDER BY porcentaje DESC, location_name
    `);
    
    console.log(`📊 Total sucursales supervisadas: ${result.rows.length}\n`);
    
    result.rows.forEach((row, i) => {
      const emoji = row.calificacion_general >= 95 ? '🏆' : 
                    row.calificacion_general >= 90 ? '✅' : 
                    row.calificacion_general >= 85 ? '⚠️' : '🚨';
      
      console.log(`${i+1}. ${row.sucursal}: ${row.calificacion_general}% ${emoji} (${new Date(row.fecha_supervision).toISOString().split('T')[0]})`);
    });
    
    // Calcular promedio del grupo
    const promedio = result.rows.reduce((sum, row) => sum + parseFloat(row.calificacion_general), 0) / result.rows.length;
    console.log(`\n📈 Promedio Grupo TEPEYAC Q3: ${promedio.toFixed(2)}%`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Nueva función para obtener áreas de oportunidad
async function areasOportunidadTepeyac() {
  try {
    console.log('\n\n🚨 ÁREAS DE OPORTUNIDAD - TEPEYAC Q3 2025\n');
    
    // Obtener las 3 sucursales de TEPEYAC
    const sucursales = ['1 - Pino Suarez', '2 - Madero', '5 - Felix U. Gomez'];
    
    for (const sucursal of sucursales) {
      console.log(`\n📍 ${sucursal}:`);
      
      const areas = await pool.query(`
        SELECT 
          area_evaluacion,
          porcentaje
        FROM supervision_operativa_detalle
        WHERE location_name = $1
          AND grupo_operativo = 'TEPEYAC'
          AND area_evaluacion != ''
          AND area_evaluacion != 'PUNTOS MAXIMOS'
          AND porcentaje IS NOT NULL
          AND porcentaje < 85
          AND EXTRACT(YEAR FROM fecha_supervision) = 2025
          AND EXTRACT(QUARTER FROM fecha_supervision) = 3
        ORDER BY porcentaje ASC
        LIMIT 5
      `, [sucursal]);
      
      if (areas.rows.length === 0) {
        console.log('   ✅ Sin áreas críticas (<85%)');
      } else {
        areas.rows.forEach(row => {
          const emoji = row.porcentaje < 80 ? '🚨' : '⚠️';
          console.log(`   ${emoji} ${row.area_evaluacion}: ${row.porcentaje}%`);
        });
      }
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Comentar la exploración general y ejecutar funciones específicas
// explorePolloLocoData();
// obtenerCalificacionesTepeyac();
areasOportunidadTepeyac();