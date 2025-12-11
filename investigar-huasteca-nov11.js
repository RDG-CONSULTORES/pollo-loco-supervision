const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function investigarHuastecaNov11() {
  try {
    console.log('🔍 INVESTIGANDO LA HUASTECA - 11 DE NOVIEMBRE 2025 (Período T4)\n');
    
    // 1. VERIFICAR QUE EXISTE LA VISTA
    console.log('1️⃣ VERIFICANDO QUE EXISTE LA VISTA supervision_normalized_view...\n');
    
    try {
      const vistaExists = await pool.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.views 
        WHERE table_name = 'supervision_normalized_view'
      `);
      console.log(`✅ Vista supervision_normalized_view ${vistaExists.rows[0].count > 0 ? 'EXISTE' : 'NO EXISTE'}`);
      
      if (vistaExists.rows[0].count === 0) {
        console.log('❌ La vista no existe. Verificando tabla original supervision_operativa_clean...\n');
        const tablaExists = await pool.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = 'supervision_operativa_clean'
        `);
        
        if (tablaExists.rows[0].count > 0) {
          console.log('✅ Usando tabla supervision_operativa_clean como fallback');
        } else {
          console.log('❌ Ni la vista ni la tabla existen');
          await pool.end();
          return;
        }
      }
    } catch (error) {
      console.log('⚠️ Error verificando vista, continuando con tabla original...');
    }

    // 2. MOSTRAR ESTRUCTURA COMPLETA DE CAMPOS
    console.log('\n2️⃣ ESTRUCTURA DE CAMPOS DISPONIBLES...\n');
    
    const estructura = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name IN ('supervision_normalized_view', 'supervision_operativa_clean')
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('📋 CAMPOS DISPONIBLES:');
    estructura.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });

    // 3. BUSCAR REGISTROS EXACTOS DE LA HUASTECA DEL 11 DE NOVIEMBRE
    console.log('\n3️⃣ BUSCANDO REGISTROS DE LA HUASTECA DEL 11 DE NOVIEMBRE 2025...\n');
    
    // Primero intentar con la vista normalizada
    let tableName = 'supervision_normalized_view';
    let resultados;
    
    try {
      resultados = await pool.query(`
        SELECT *
        FROM ${tableName}
        WHERE nombre_normalizado = 'la-huasteca' 
          AND DATE(fecha_supervision) = '2025-11-11'
        ORDER BY submission_id, area_evaluacion
      `);
    } catch (error) {
      console.log('⚠️ Error con vista normalizada, usando tabla original...');
      tableName = 'supervision_operativa_clean';
      resultados = await pool.query(`
        SELECT *
        FROM ${tableName}
        WHERE location_name ILIKE '%huasteca%' 
          AND DATE(fecha_supervision) = '2025-11-11'
        ORDER BY submission_id, area_evaluacion
      `);
    }
    
    if (resultados.rows.length === 0) {
      console.log('❌ NO se encontraron registros de La Huasteca para el 11 de noviembre 2025');
      
      // Buscar fechas cercanas
      console.log('\n🔍 Buscando fechas cercanas en noviembre 2025...');
      const fechasCercanas = await pool.query(`
        SELECT DISTINCT
          fecha_supervision,
          location_name,
          COUNT(*) as registros
        FROM ${tableName}
        WHERE location_name ILIKE '%huasteca%'
          AND DATE(fecha_supervision) BETWEEN '2025-11-01' AND '2025-11-30'
        GROUP BY fecha_supervision, location_name
        ORDER BY fecha_supervision DESC
      `);
      
      console.log('📅 Fechas disponibles para La Huasteca en noviembre 2025:');
      fechasCercanas.rows.forEach(row => {
        console.log(`  ${row.fecha_supervision}: ${row.location_name} (${row.registros} registros)`);
      });
      
      // Buscar también el período T4 completo
      console.log('\n🔍 Buscando todo el período T4 (desde 30 oct 2024)...');
      const periodoT4 = await pool.query(`
        SELECT DISTINCT
          fecha_supervision,
          location_name,
          COUNT(*) as registros
        FROM ${tableName}
        WHERE location_name ILIKE '%huasteca%'
          AND DATE(fecha_supervision) >= '2024-10-30'
        GROUP BY fecha_supervision, location_name
        ORDER BY fecha_supervision DESC
        LIMIT 20
      `);
      
      console.log('📅 Últimas 20 fechas de La Huasteca en período T4:');
      periodoT4.rows.forEach(row => {
        console.log(`  ${row.fecha_supervision}: ${row.location_name} (${row.registros} registros)`);
      });
      
      await pool.end();
      return;
    }
    
    console.log(`✅ Se encontraron ${resultados.rows.length} registros para La Huasteca el 11 de noviembre 2025`);
    
    // 4. MOSTRAR TODA LA ESTRUCTURA DE DATOS PARA ESA SUPERVISIÓN
    console.log('\n4️⃣ ESTRUCTURA COMPLETA DE DATOS ENCONTRADOS...\n');
    
    // Obtener submission_ids únicos
    const submissionIds = [...new Set(resultados.rows.map(row => row.submission_id))];
    console.log(`📊 Submission IDs encontrados: ${submissionIds.join(', ')}`);
    
    for (const submissionId of submissionIds) {
      console.log(`\n\n=== DESGLOSE COMPLETO SUBMISSION_ID: ${submissionId} ===\n`);
      
      const registrosSubmission = resultados.rows.filter(row => row.submission_id === submissionId);
      
      // Mostrar TODOS los campos del primer registro para entender la estructura
      console.log('📋 ESTRUCTURA COMPLETA (primer registro):');
      const primerRegistro = registrosSubmission[0];
      Object.keys(primerRegistro).forEach(key => {
        console.log(`  ${key}: ${primerRegistro[key]}`);
      });
      
      // 5. BUSCAR ESPECÍFICAMENTE EL VALOR 85.34%
      console.log('\n5️⃣ BUSCANDO VALOR 85.34%...\n');
      
      const valor8534 = registrosSubmission.filter(row => {
        const porcentaje = parseFloat(row.porcentaje);
        return Math.abs(porcentaje - 85.34) < 0.01; // Tolerancia de 0.01%
      });
      
      if (valor8534.length > 0) {
        console.log('🎯 ENCONTRADO EL VALOR 85.34%:');
        valor8534.forEach(row => {
          console.log(`  Área: ${row.area_evaluacion || 'N/A'}`);
          console.log(`  Porcentaje: ${row.porcentaje}%`);
          console.log(`  Puntos: ${row.puntos_obtenidos}/${row.puntos_maximos}`);
          console.log(`  Submission ID: ${row.submission_id}`);
          console.log('  ---');
        });
      } else {
        console.log('❌ NO se encontró el valor exacto 85.34%');
        console.log('🔍 Valores cercanos a 85.34%:');
        
        const valoresCercanos = registrosSubmission
          .map(row => ({...row, diff: Math.abs(parseFloat(row.porcentaje) - 85.34)}))
          .filter(row => row.diff < 5) // Diferencia menor a 5%
          .sort((a, b) => a.diff - b.diff)
          .slice(0, 5);
        
        valoresCercanos.forEach(row => {
          console.log(`  ${row.area_evaluacion || 'General'}: ${row.porcentaje}% (diff: ${row.diff.toFixed(2)}%)`);
        });
      }
      
      // 6. IDENTIFICAR CALIFICACIÓN GENERAL VS ÁREAS INDIVIDUALES
      console.log('\n6️⃣ IDENTIFICANDO CALIFICACIÓN GENERAL VS ÁREAS...\n');
      
      // Buscar registro de calificación general
      const calificacionGeneral = registrosSubmission.filter(row => 
        !row.area_evaluacion || 
        row.area_evaluacion === '' || 
        row.area_evaluacion === 'PUNTOS MAXIMOS' ||
        row.area_evaluacion === 'GENERAL' ||
        row.area_evaluacion === 'TOTAL'
      );
      
      console.log('📊 CALIFICACIÓN GENERAL:');
      if (calificacionGeneral.length > 0) {
        calificacionGeneral.forEach(cal => {
          console.log(`  Porcentaje: ${cal.porcentaje}%`);
          console.log(`  Puntos: ${cal.puntos_obtenidos}/${cal.puntos_maximos}`);
          console.log(`  Área: "${cal.area_evaluacion || 'VACÍA'}"`);
          console.log(`  Es este 85.34%? ${Math.abs(parseFloat(cal.porcentaje) - 85.34) < 0.01 ? '🎯 SÍ' : '❌ NO'}`);
        });
      } else {
        console.log('  ❌ No se encontró registro de calificación general');
      }
      
      // Obtener todas las áreas individuales
      const areasIndividuales = registrosSubmission.filter(row => 
        row.area_evaluacion && 
        row.area_evaluacion !== '' && 
        row.area_evaluacion !== 'PUNTOS MAXIMOS' &&
        row.area_evaluacion !== 'GENERAL' &&
        row.area_evaluacion !== 'TOTAL' &&
        row.porcentaje !== null
      );
      
      console.log(`\n📋 ÁREAS INDIVIDUALES (${areasIndividuales.length} áreas):`);
      
      let sumaPromedios = 0;
      let totalPuntosMaximos = 0;
      let totalPuntosObtenidos = 0;
      
      areasIndividuales.forEach((area, index) => {
        console.log(`  ${index + 1}. ${area.area_evaluacion}: ${area.porcentaje}% (${area.puntos_obtenidos}/${area.puntos_maximos})`);
        sumaPromedios += parseFloat(area.porcentaje);
        totalPuntosMaximos += parseInt(area.puntos_maximos || 0);
        totalPuntosObtenidos += parseInt(area.puntos_obtenidos || 0);
      });
      
      // 7. ANALIZAR CÓMO SE GENERA EL 88.1%
      console.log('\n7️⃣ ANÁLISIS DEL CÁLCULO ACTUAL (88.1%)...\n');
      
      if (areasIndividuales.length > 0) {
        // Método 1: Promedio de porcentajes de áreas
        const promedioPorcentajes = (sumaPromedios / areasIndividuales.length);
        console.log(`🧮 Método 1 - Promedio de áreas: ${promedioPorcentajes.toFixed(2)}%`);
        
        // Método 2: Suma de puntos
        const porcentajeSumaPuntos = totalPuntosMaximos > 0 ? 
          (totalPuntosObtenidos / totalPuntosMaximos * 100) : 0;
        console.log(`🧮 Método 2 - Suma de puntos: ${porcentajeSumaPuntos.toFixed(2)}% (${totalPuntosObtenidos}/${totalPuntosMaximos})`);
        
        // Verificar cuál método da 88.1%
        const diferencia1 = Math.abs(promedioPorcentajes - 88.1);
        const diferencia2 = Math.abs(porcentajeSumaPuntos - 88.1);
        
        console.log(`📊 Comparación con 88.1% (valor del dashboard):`);
        console.log(`  Diferencia método 1: ${diferencia1.toFixed(2)}%`);
        console.log(`  Diferencia método 2: ${diferencia2.toFixed(2)}%`);
        
        if (diferencia1 < 1) {
          console.log(`  🎯 El 88.1% parece venir del PROMEDIO DE ÁREAS`);
        } else if (diferencia2 < 1) {
          console.log(`  🎯 El 88.1% parece venir de la SUMA DE PUNTOS`);
        } else {
          console.log(`  ❓ El 88.1% no coincide con ningún método obvio`);
        }
        
        // Comparar con calificación general (85.34%)
        if (calificacionGeneral.length > 0) {
          const porcentajeGeneral = parseFloat(calificacionGeneral[0].porcentaje);
          console.log(`\n📊 Comparación con calificación general (${porcentajeGeneral}%):`);
          console.log(`  Diferencia con promedio áreas: ${Math.abs(promedioPorcentajes - porcentajeGeneral).toFixed(2)}%`);
          console.log(`  Diferencia con suma puntos: ${Math.abs(porcentajeSumaPuntos - porcentajeGeneral).toFixed(2)}%`);
          
          console.log(`\n💡 CONCLUSIÓN:`);
          console.log(`  ✅ El valor real de Zenput es: ${porcentajeGeneral}%`);
          console.log(`  ❌ El dashboard está mostrando: 88.1%`);
          console.log(`  🚨 Diferencia: ${Math.abs(88.1 - porcentajeGeneral).toFixed(2)}%`);
          
          if (Math.abs(promedioPorcentajes - 88.1) < 1) {
            console.log(`  🔧 PROBLEMA: El dashboard está usando el promedio de áreas en lugar de la calificación general`);
          }
        }
      }
    }
    
    // 8. BUSCAR OTROS VALORES PARA CONFIRMAR PATRÓN
    console.log('\n8️⃣ BUSCANDO OTROS REGISTROS DEL PERÍODO T4 PARA CONFIRMAR PATRÓN...\n');
    
    const otrosRegistrosT4 = await pool.query(`
      SELECT DISTINCT
        location_name,
        fecha_supervision,
        submission_id,
        porcentaje,
        area_evaluacion
      FROM ${tableName}
      WHERE location_name ILIKE '%huasteca%'
        AND DATE(fecha_supervision) >= '2024-10-30'
        AND (area_evaluacion = '' OR area_evaluacion IS NULL OR area_evaluacion = 'PUNTOS MAXIMOS')
        AND porcentaje IS NOT NULL
      ORDER BY fecha_supervision DESC
      LIMIT 10
    `);
    
    console.log('📅 Otros registros de calificación general de La Huasteca en T4:');
    otrosRegistrosT4.rows.forEach(row => {
      console.log(`  ${row.fecha_supervision}: ${row.porcentaje}% (${row.area_evaluacion || 'General'}) - ID: ${row.submission_id}`);
    });
    
    await pool.end();
    console.log('\n✅ Investigación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
  }
}

investigarHuastecaNov11();