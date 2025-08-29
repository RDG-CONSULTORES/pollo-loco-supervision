const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function desgloseSucursalesQ3() {
  try {
    console.log('📊 DESGLOSE DETALLADO SUPERVISIONES Q3 2025\n');
    console.log('════════════════════════════════════════════════════════════════════════════════════════');
    
    // Obtener todas las supervisiones con calificación general
    const supervisiones = await pool.query(`
      SELECT DISTINCT
        location_name,
        grupo_operativo_limpio as grupo,
        fecha_supervision,
        porcentaje as calificacion_general,
        EXTRACT(DAY FROM fecha_supervision) as dia,
        EXTRACT(MONTH FROM fecha_supervision) as mes,
        CASE 
          WHEN EXTRACT(MONTH FROM fecha_supervision) = 7 THEN 'JUL'
          WHEN EXTRACT(MONTH FROM fecha_supervision) = 8 THEN 'AGO'
          WHEN EXTRACT(MONTH FROM fecha_supervision) = 9 THEN 'SEP'
        END as mes_nombre
      FROM supervision_operativa_clean
      WHERE fecha_supervision >= '2025-07-01'
        AND fecha_supervision <= '2025-09-30'
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
      ORDER BY fecha_supervision DESC, grupo, location_name
    `);
    
    console.log(`TOTAL: ${supervisiones.rows.length} SUPERVISIONES CON CALIFICACIÓN\n`);
    
    // Agrupar por mes
    let mesActual = null;
    let contadorMes = 0;
    
    supervisiones.rows.forEach((row, i) => {
      // Encabezado de mes cuando cambia
      if (row.mes_nombre !== mesActual) {
        if (mesActual !== null) {
          console.log(`\nSubtotal ${mesActual}: ${contadorMes} supervisiones\n`);
        }
        console.log(`\n════════════════ ${row.mes_nombre} 2025 ════════════════\n`);
        console.log('No. | FECHA      | CALIFICACIÓN | SUCURSAL                          | GRUPO');
        console.log('────┼────────────┼──────────────┼───────────────────────────────────┼──────────────────');
        mesActual = row.mes_nombre;
        contadorMes = 0;
      }
      
      contadorMes++;
      
      // Formato de fecha
      const fecha = `${row.dia.toString().padStart(2,'0')}-${row.mes_nombre}-25`;
      
      // Determinar emoji según calificación
      const emoji = row.calificacion_general >= 95 ? '🏆' :
                    row.calificacion_general >= 90 ? '⭐' :
                    row.calificacion_general >= 85 ? '✅' :
                    row.calificacion_general >= 80 ? '⚠️' : '🚨';
      
      // Formato de línea
      const numero = (i + 1).toString().padEnd(3);
      const fechaStr = fecha.padEnd(11);
      const calif = `${row.calificacion_general}% ${emoji}`.padEnd(13);
      const sucursal = row.location_name.padEnd(34);
      
      console.log(`${numero}| ${fechaStr}| ${calif}| ${sucursal}| ${row.grupo}`);
    });
    
    if (mesActual !== null) {
      console.log(`\nSubtotal ${mesActual}: ${contadorMes} supervisiones\n`);
    }
    
    // Resumen estadístico
    console.log('\n════════════════════════════════════════════════════════════════════════════════════════');
    console.log('📈 RESUMEN ESTADÍSTICO Q3 2025\n');
    
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT submission_id) as total_supervisiones,
        COUNT(DISTINCT location_name) as sucursales_unicas,
        ROUND(AVG(porcentaje), 2) as promedio_general,
        ROUND(MAX(porcentaje), 2) as calificacion_maxima,
        ROUND(MIN(porcentaje), 2) as calificacion_minima,
        COUNT(CASE WHEN porcentaje >= 95 THEN 1 END) as excelencia,
        COUNT(CASE WHEN porcentaje >= 90 AND porcentaje < 95 THEN 1 END) as objetivo,
        COUNT(CASE WHEN porcentaje >= 85 AND porcentaje < 90 THEN 1 END) as aceptable,
        COUNT(CASE WHEN porcentaje >= 80 AND porcentaje < 85 THEN 1 END) as atencion,
        COUNT(CASE WHEN porcentaje < 80 THEN 1 END) as critico
      FROM supervision_operativa_clean
      WHERE fecha_supervision >= '2025-07-01'
        AND fecha_supervision <= '2025-09-30'
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
    `);
    
    const s = stats.rows[0];
    console.log(`📊 Total supervisiones: ${s.total_supervisiones}`);
    console.log(`🏢 Sucursales únicas: ${s.sucursales_unicas}`);
    console.log(`📈 Promedio general Q3: ${s.promedio_general}%`);
    console.log(`🏆 Calificación máxima: ${s.calificacion_maxima}%`);
    console.log(`🚨 Calificación mínima: ${s.calificacion_minima}%\n`);
    
    console.log('DISTRIBUCIÓN DE CALIFICACIONES:');
    console.log(`🏆 Excelencia (95%+): ${s.excelencia} supervisiones`);
    console.log(`⭐ Objetivo (90-94%): ${s.objetivo} supervisiones`);
    console.log(`✅ Aceptable (85-89%): ${s.aceptable} supervisiones`);
    console.log(`⚠️ Atención (80-84%): ${s.atencion} supervisiones`);
    console.log(`🚨 Crítico (<80%): ${s.critico} supervisiones`);
    
    // Top 10 mejores y peores
    console.log('\n\n🏆 TOP 10 MEJORES CALIFICACIONES Q3:');
    const mejores = await pool.query(`
      SELECT location_name, grupo_operativo_limpio as grupo, porcentaje, fecha_supervision
      FROM supervision_operativa_clean
      WHERE fecha_supervision >= '2025-07-01'
        AND fecha_supervision <= '2025-09-30'
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
      ORDER BY porcentaje DESC, fecha_supervision DESC
      LIMIT 10
    `);
    
    mejores.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.porcentaje}% - ${row.location_name} (${row.grupo}) - ${row.fecha_supervision.toISOString().split('T')[0]}`);
    });
    
    console.log('\n\n🚨 BOTTOM 10 CALIFICACIONES MÁS BAJAS Q3:');
    const peores = await pool.query(`
      SELECT location_name, grupo_operativo_limpio as grupo, porcentaje, fecha_supervision
      FROM supervision_operativa_clean
      WHERE fecha_supervision >= '2025-07-01'
        AND fecha_supervision <= '2025-09-30'
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
      ORDER BY porcentaje ASC, fecha_supervision DESC
      LIMIT 10
    `);
    
    peores.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.porcentaje}% - ${row.location_name} (${row.grupo}) - ${row.fecha_supervision.toISOString().split('T')[0]}`);
    });
    
    await pool.end();
    console.log('\n🎯 DESGLOSE COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

desgloseSucursalesQ3();