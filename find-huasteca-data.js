const { Pool } = require('pg');
require('dotenv').config();

async function findHuastecaData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 BÚSQUEDA ESPECÍFICA DE LA HUASTECA - NOVIEMBRE 2025');
    console.log('='.repeat(80));

    // Buscar en todas las tablas principales con diferentes variaciones del nombre
    const searchVariations = [
      'la-huasteca',
      'la huasteca',
      'huasteca',
      'La Huasteca',
      'LA HUASTECA',
      '%huasteca%'
    ];

    const dateVariations = [
      '2025-11-11',
      '2025-11-10',
      '2025-11-12',
      '11/11/2025',
      '2025/11/11'
    ];

    // 1. Buscar en supervision_operativa_clean
    console.log('\n🏗️ BÚSQUEDA EN supervision_operativa_clean:');
    for (const nameVar of searchVariations) {
      for (const dateVar of dateVariations) {
        const query = `
          SELECT 
            location_name,
            sucursal_clean,
            fecha_supervision,
            area_evaluacion,
            porcentaje
          FROM supervision_operativa_clean
          WHERE location_name ILIKE $1
            AND fecha_supervision::date = $2::date
          ORDER BY area_evaluacion
          LIMIT 10;
        `;
        
        try {
          const result = await pool.query(query, [nameVar, dateVar]);
          if (result.rows.length > 0) {
            console.log(`\n✅ Encontrados ${result.rows.length} registros con "${nameVar}" y fecha "${dateVar}":`);
            result.rows.forEach((row, i) => {
              console.log(`  ${i+1}. ${row.location_name} (${row.sucursal_clean})`);
              console.log(`     📅 ${row.fecha_supervision}`);
              console.log(`     📊 Área: "${row.area_evaluacion}" - ${row.porcentaje}%`);
            });
            break;
          }
        } catch (error) {
          console.log(`  ❌ Error con "${nameVar}" y "${dateVar}": ${error.message}`);
        }
      }
    }

    // 2. Buscar registros sin área (posible calificación general)
    console.log('\n🎯 BÚSQUEDA DE REGISTROS SIN ÁREA (CALIFICACIÓN GENERAL):');
    const noAreaQuery = `
      SELECT 
        location_name,
        sucursal_clean,
        fecha_supervision,
        area_evaluacion,
        porcentaje,
        puntos_obtenidos,
        puntos_maximos
      FROM supervision_operativa_clean
      WHERE location_name ILIKE '%huasteca%'
        AND (area_evaluacion IS NULL OR area_evaluacion = '' OR TRIM(area_evaluacion) = '')
      ORDER BY fecha_supervision DESC
      LIMIT 10;
    `;
    
    const noAreaResult = await pool.query(noAreaQuery);
    if (noAreaResult.rows.length > 0) {
      console.log(`\n✅ Encontrados ${noAreaResult.rows.length} registros SIN ÁREA (posible calificación general):`);
      noAreaResult.rows.forEach((row, i) => {
        console.log(`  ${i+1}. ${row.location_name}`);
        console.log(`     📅 ${row.fecha_supervision}`);
        console.log(`     📊 Área: "${row.area_evaluacion}" (VACÍA)`);
        console.log(`     🎯 Porcentaje: ${row.porcentaje}% (${row.puntos_obtenidos}/${row.puntos_maximos})`);
      });
    } else {
      console.log('❌ No se encontraron registros sin área');
    }

    // 3. Buscar en supervision_operativa_cas (tabla más reciente)
    console.log('\n🏗️ BÚSQUEDA EN supervision_operativa_cas:');
    const casQuery = `
      SELECT 
        location_name,
        submitted_at,
        calificacion_general_pct,
        area_marinado_pct,
        proceso_marinado_pct,
        cuarto_frio_1_pct
      FROM supervision_operativa_cas
      WHERE location_name ILIKE '%huasteca%'
      ORDER BY submitted_at DESC
      LIMIT 5;
    `;
    
    try {
      const casResult = await pool.query(casQuery);
      if (casResult.rows.length > 0) {
        console.log(`\n✅ Encontrados ${casResult.rows.length} registros en supervision_operativa_cas:`);
        casResult.rows.forEach((row, i) => {
          console.log(`  ${i+1}. ${row.location_name}`);
          console.log(`     📅 ${row.submitted_at}`);
          console.log(`     🎯 CALIFICACIÓN GENERAL: ${row.calificacion_general_pct}%`);
          console.log(`     📊 Marinado: ${row.area_marinado_pct}%`);
          console.log(`     📊 Proceso Marinado: ${row.proceso_marinado_pct}%`);
          console.log(`     📊 Cuarto Frío 1: ${row.cuarto_frio_1_pct}%`);
        });
      } else {
        console.log('❌ No se encontraron registros en supervision_operativa_cas');
      }
    } catch (error) {
      console.log(`❌ Error consultando supervision_operativa_cas: ${error.message}`);
    }

    // 4. Estructura del campo calificacion_general_pct
    console.log('\n📋 ANÁLISIS DEL CAMPO calificacion_general_pct:');
    try {
      const generalQuery = `
        SELECT 
          location_name,
          submitted_at::date as fecha,
          calificacion_general_pct,
          COUNT(*) OVER() as total_registros
        FROM supervision_operativa_cas
        WHERE calificacion_general_pct IS NOT NULL
        ORDER BY submitted_at DESC
        LIMIT 10;
      `;
      
      const generalResult = await pool.query(generalQuery);
      if (generalResult.rows.length > 0) {
        console.log(`\n✅ Campo calificacion_general_pct disponible en ${generalResult.rows[0].total_registros} registros:`);
        generalResult.rows.forEach((row, i) => {
          console.log(`  ${i+1}. ${row.location_name} - ${row.fecha} - ${row.calificacion_general_pct}%`);
        });
      } else {
        console.log('❌ No hay datos en calificacion_general_pct');
      }
    } catch (error) {
      console.log(`❌ Error analizando calificacion_general_pct: ${error.message}`);
    }

    console.log('\n✅ BÚSQUEDA COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar búsqueda
findHuastecaData().catch(console.error);