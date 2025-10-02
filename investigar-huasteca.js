const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function investigarHuasteca() {
  try {
    console.log('🔍 INVESTIGANDO LA HUASTECA - 29 DE AGOSTO 2025\n');
    
    // 1. Buscar todas las supervisiones de La Huasteca en esa fecha
    console.log('1️⃣ BUSCANDO SUPERVISIONES DE LA HUASTECA EL 29 DE AGOSTO 2025...\n');
    
    const supervisiones = await pool.query(`
      SELECT DISTINCT
        submission_id,
        location_name,
        grupo_operativo_limpio,
        fecha_supervision,
        COUNT(*) as total_registros
      FROM supervision_operativa_clean
      WHERE location_name ILIKE '%huasteca%'
        AND DATE(fecha_supervision) = '2025-08-29'
      GROUP BY submission_id, location_name, grupo_operativo_limpio, fecha_supervision
      ORDER BY submission_id
    `);
    
    if (supervisiones.rows.length === 0) {
      console.log('❌ NO se encontraron supervisiones de La Huasteca para el 29 de agosto 2025');
      
      // Buscar fechas cercanas
      console.log('\n🔍 Buscando fechas cercanas...');
      const fechasCercanas = await pool.query(`
        SELECT DISTINCT
          fecha_supervision,
          location_name,
          COUNT(*) as registros
        FROM supervision_operativa_clean
        WHERE location_name ILIKE '%huasteca%'
          AND DATE(fecha_supervision) BETWEEN '2025-08-25' AND '2025-09-05'
        GROUP BY fecha_supervision, location_name
        ORDER BY fecha_supervision DESC
      `);
      
      console.log('Fechas disponibles para La Huasteca:');
      fechasCercanas.rows.forEach(row => {
        console.log(`  ${row.fecha_supervision}: ${row.location_name} (${row.registros} registros)`);
      });
      
      await pool.end();
      return;
    }
    
    console.log(`✅ Se encontraron ${supervisiones.rows.length} supervisión(es):`);
    supervisiones.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.location_name} | Grupo: ${row.grupo_operativo_limpio} | Registros: ${row.total_registros}`);
    });
    
    // 2. Para cada supervisión, obtener el desglose completo
    for (const supervision of supervisiones.rows) {
      console.log(`\n\n2️⃣ DESGLOSE DETALLADO: ${supervision.location_name} (${supervision.submission_id})\n`);
      
      // Obtener el registro de calificación general
      const calificacionGeneral = await pool.query(`
        SELECT 
          puntos_maximos,
          puntos_obtenidos,
          porcentaje,
          area_evaluacion
        FROM supervision_operativa_clean
        WHERE submission_id = $1
          AND (area_evaluacion = '' OR area_evaluacion = 'PUNTOS MAXIMOS')
          AND porcentaje IS NOT NULL
        ORDER BY area_evaluacion DESC
      `, [supervision.submission_id]);
      
      console.log('📊 CALIFICACIÓN GENERAL:');
      if (calificacionGeneral.rows.length > 0) {
        const cal = calificacionGeneral.rows[0];
        console.log(`  Puntos Máximos: ${cal.puntos_maximos || 'N/A'}`);
        console.log(`  Puntos Obtenidos: ${cal.puntos_obtenidos || 'N/A'}`);
        console.log(`  Porcentaje: ${cal.porcentaje}%`);
        
        // Verificar el cálculo
        if (cal.puntos_maximos && cal.puntos_obtenidos) {
          const calculado = (cal.puntos_obtenidos / cal.puntos_maximos * 100);
          console.log(`  Porcentaje Calculado: ${calculado.toFixed(2)}%`);
          const diferencia = Math.abs(calculado - parseFloat(cal.porcentaje));
          console.log(`  Diferencia: ${diferencia.toFixed(2)}%`);
        }
      } else {
        console.log('  ❌ No se encontró calificación general');
      }
      
      // Obtener todas las áreas evaluadas
      const areas = await pool.query(`
        SELECT 
          area_evaluacion,
          puntos_maximos,
          puntos_obtenidos,
          porcentaje,
          COUNT(*) as veces_registrada
        FROM supervision_operativa_clean
        WHERE submission_id = $1
          AND area_evaluacion IS NOT NULL
          AND area_evaluacion != ''
          AND area_evaluacion != 'PUNTOS MAXIMOS'
          AND porcentaje IS NOT NULL
        GROUP BY area_evaluacion, puntos_maximos, puntos_obtenidos, porcentaje
        ORDER BY area_evaluacion
      `, [supervision.submission_id]);
      
      console.log(`\n📋 ÁREAS EVALUADAS (${areas.rows.length} áreas):`);
      
      let sumaPromedios = 0;
      let totalPuntosMaximos = 0;
      let totalPuntosObtenidos = 0;
      
      areas.rows.forEach((area, index) => {
        if (index < 10) { // Mostrar solo las primeras 10 para no saturar
          console.log(`  ${area.area_evaluacion}: ${area.porcentaje}% (${area.puntos_obtenidos}/${area.puntos_maximos}) [${area.veces_registrada}x]`);
        }
        sumaPromedios += parseFloat(area.porcentaje);
        totalPuntosMaximos += parseInt(area.puntos_maximos || 0);
        totalPuntosObtenidos += parseInt(area.puntos_obtenidos || 0);
      });
      
      if (areas.rows.length > 10) {
        console.log(`  ... y ${areas.rows.length - 10} áreas más`);
      }
      
      // Análisis de los métodos de cálculo
      console.log(`\n🧮 ANÁLISIS DE MÉTODOS DE CÁLCULO:`);
      
      // Método 1: Promedio de porcentajes de áreas
      const promedioPorcentajes = (sumaPromedios / areas.rows.length).toFixed(2);
      console.log(`  Método 1 - Promedio de áreas: ${promedioPorcentajes}%`);
      
      // Método 2: Suma de puntos
      const porcentajeSumaPuntos = totalPuntosMaximos > 0 ? 
        (totalPuntosObtenidos / totalPuntosMaximos * 100).toFixed(2) : 0;
      console.log(`  Método 2 - Suma de puntos: ${porcentajeSumaPuntos}% (${totalPuntosObtenidos}/${totalPuntosMaximos})`);
      
      // Comparar con el porcentaje registrado
      if (calificacionGeneral.rows.length > 0) {
        const porcentajeRegistrado = parseFloat(calificacionGeneral.rows[0].porcentaje);
        console.log(`  Porcentaje registrado: ${porcentajeRegistrado}%`);
        
        const diferencia1 = Math.abs(parseFloat(promedioPorcentajes) - porcentajeRegistrado);
        const diferencia2 = Math.abs(parseFloat(porcentajeSumaPuntos) - porcentajeRegistrado);
        
        console.log(`  Diferencia método 1: ${diferencia1.toFixed(2)}%`);
        console.log(`  Diferencia método 2: ${diferencia2.toFixed(2)}%`);
        
        if (diferencia1 < diferencia2) {
          console.log(`  ✅ Parece usar PROMEDIO DE ÁREAS`);
        } else {
          console.log(`  ✅ Parece usar SUMA DE PUNTOS`);
        }
      }
      
      // Buscar áreas con valores inusuales
      const areasInusuales = areas.rows.filter(area => 
        parseFloat(area.porcentaje) < 50 || parseFloat(area.porcentaje) > 100
      );
      
      if (areasInusuales.length > 0) {
        console.log(`\n⚠️  ÁREAS CON VALORES INUSUALES:`);
        areasInusuales.forEach(area => {
          console.log(`  ${area.area_evaluacion}: ${area.porcentaje}%`);
        });
      }
    }
    
    // 3. Comparar con datos de otras sucursales del mismo día/período
    console.log(`\n\n3️⃣ COMPARACIÓN CON OTRAS SUCURSALES DEL MISMO PERÍODO\n`);
    
    const otrasSupervisionesDelDia = await pool.query(`
      SELECT DISTINCT
        location_name,
        grupo_operativo_limpio,
        porcentaje
      FROM supervision_operativa_clean
      WHERE DATE(fecha_supervision) = '2025-08-29'
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
        AND location_name NOT ILIKE '%huasteca%'
      ORDER BY porcentaje DESC
      LIMIT 10
    `);
    
    console.log('📊 Top 10 supervisiones del 29 de agosto 2025:');
    otrasSupervisionesDelDia.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.location_name}: ${row.porcentaje}% (${row.grupo_operativo_limpio})`);
    });
    
    await pool.end();
    console.log('\n✅ Investigación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

investigarHuasteca();