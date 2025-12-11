const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function investigarDirecto() {
  try {
    console.log('🔍 INVESTIGACIÓN DIRECTA DE LA HUASTECA - 11 NOVIEMBRE 2025\n');
    
    // 1. BUSCAR POR CUALQUIER VARIACIÓN DEL NOMBRE
    console.log('1️⃣ BUSCANDO POR TODAS LAS VARIACIONES DE "HUASTECA"...\n');
    
    const resultados = await pool.query(`
      SELECT 
        submission_id,
        location_name,
        nombre_normalizado,
        area_evaluacion,
        porcentaje,
        puntos_obtenidos,
        puntos_maximos,
        fecha_supervision
      FROM supervision_normalized_view
      WHERE location_name ILIKE '%huasteca%' 
        AND DATE(fecha_supervision) = '2025-11-11'
      ORDER BY submission_id, area_evaluacion
    `);
    
    console.log(`✅ Encontrados ${resultados.rows.length} registros`);
    
    if (resultados.rows.length === 0) {
      console.log('❌ No hay datos del 11 de noviembre');
      await pool.end();
      return;
    }
    
    // 2. MOSTRAR PRIMEROS REGISTROS PARA ENTENDER LA ESTRUCTURA
    console.log('\n2️⃣ PRIMEROS 5 REGISTROS PARA ENTENDER ESTRUCTURA...\n');
    
    resultados.rows.slice(0, 5).forEach((row, index) => {
      console.log(`Registro ${index + 1}:`);
      console.log(`  Submission ID: ${row.submission_id}`);
      console.log(`  Location: ${row.location_name}`);
      console.log(`  Normalizado: ${row.nombre_normalizado}`);
      console.log(`  Área: ${row.area_evaluacion}`);
      console.log(`  Porcentaje: ${row.porcentaje}%`);
      console.log(`  Puntos: ${row.puntos_obtenidos}/${row.puntos_maximos}`);
      console.log(`  Fecha: ${row.fecha_supervision}`);
      console.log('  ---');
    });
    
    // 3. BUSCAR ESPECÍFICAMENTE EL 85.34%
    console.log('\n3️⃣ BUSCANDO EL VALOR 85.34%...\n');
    
    const valor8534 = resultados.rows.filter(row => {
      if (!row.porcentaje) return false;
      const porcentaje = parseFloat(row.porcentaje);
      return Math.abs(porcentaje - 85.34) < 0.1; // Tolerancia de 0.1%
    });
    
    if (valor8534.length > 0) {
      console.log('🎯 ENCONTRADO EL VALOR 85.34%:');
      valor8534.forEach(row => {
        console.log(`  Área: ${row.area_evaluacion || 'GENERAL/TOTAL'}`);
        console.log(`  Porcentaje exacto: ${row.porcentaje}%`);
        console.log(`  Puntos: ${row.puntos_obtenidos}/${row.puntos_maximos}`);
        console.log(`  Submission ID: ${row.submission_id}`);
        console.log('  ✅ ESTE ES EL VALOR REAL DE ZENPUT');
        console.log('  ---');
      });
    } else {
      console.log('❌ No se encontró exactamente 85.34%');
    }
    
    // 4. BUSCAR VALORES CERCANOS
    console.log('\n4️⃣ VALORES CERCANOS A 85.34%...\n');
    
    const valoresCercanos = resultados.rows
      .filter(row => row.porcentaje !== null)
      .map(row => ({
        ...row, 
        porcentajeNum: parseFloat(row.porcentaje),
        diff: Math.abs(parseFloat(row.porcentaje) - 85.34)
      }))
      .filter(row => row.diff < 10) // Diferencia menor a 10%
      .sort((a, b) => a.diff - b.diff);
    
    console.log('📊 Los 10 valores más cercanos a 85.34%:');
    valoresCercanos.slice(0, 10).forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.area_evaluacion || 'GENERAL'}: ${row.porcentaje}% (diff: ${row.diff.toFixed(2)}%)`);
    });
    
    // 5. ANALIZAR CÓMO SE PODRÍA CALCULAR 88.1%
    console.log('\n5️⃣ ANÁLISIS PARA ENTENDER EL 88.1%...\n');
    
    // Obtener áreas individuales (excluyendo totales)
    const areasIndividuales = resultados.rows.filter(row => 
      row.area_evaluacion && 
      row.area_evaluacion !== '' && 
      row.area_evaluacion !== 'PUNTOS MAXIMOS' &&
      row.area_evaluacion !== 'GENERAL' &&
      row.area_evaluacion !== 'TOTAL' &&
      !row.area_evaluacion.includes('TOTAL') &&
      row.porcentaje !== null
    );
    
    console.log(`📋 Encontradas ${areasIndividuales.length} áreas individuales:`);
    
    let sumaPromedios = 0;
    let totalPuntosMaximos = 0;
    let totalPuntosObtenidos = 0;
    
    areasIndividuales.forEach((area, index) => {
      if (index < 15) { // Mostrar las primeras 15
        console.log(`  ${index + 1}. ${area.area_evaluacion}: ${area.porcentaje}%`);
      }
      sumaPromedios += parseFloat(area.porcentaje);
      totalPuntosMaximos += parseInt(area.puntos_maximos || 0);
      totalPuntosObtenidos += parseInt(area.puntos_obtenidos || 0);
    });
    
    if (areasIndividuales.length > 15) {
      console.log(`  ... y ${areasIndividuales.length - 15} áreas más`);
    }
    
    // Calcular promedios
    const promedioPorcentajes = sumaPromedios / areasIndividuales.length;
    const porcentajeSumaPuntos = totalPuntosMaximos > 0 ? 
      (totalPuntosObtenidos / totalPuntosMaximos * 100) : 0;
    
    console.log(`\n🧮 MÉTODOS DE CÁLCULO:`);
    console.log(`  Método 1 - Promedio de áreas: ${promedioPorcentajes.toFixed(2)}%`);
    console.log(`  Método 2 - Suma de puntos: ${porcentajeSumaPuntos.toFixed(2)}%`);
    
    // Verificar cuál está más cerca del 88.1%
    const diff1 = Math.abs(promedioPorcentajes - 88.1);
    const diff2 = Math.abs(porcentajeSumaPuntos - 88.1);
    
    console.log(`\n📊 COMPARACIÓN CON 88.1% (valor del dashboard):`);
    console.log(`  Diferencia método 1: ${diff1.toFixed(2)}%`);
    console.log(`  Diferencia método 2: ${diff2.toFixed(2)}%`);
    
    if (diff1 < 1) {
      console.log(`  🎯 EL 88.1% VIENE DEL PROMEDIO DE ÁREAS`);
      console.log(`  🚨 PROBLEMA IDENTIFICADO: Se está usando promedio en lugar de valor real`);
    } else if (diff2 < 1) {
      console.log(`  🎯 EL 88.1% VIENE DE LA SUMA DE PUNTOS`);
      console.log(`  🚨 PROBLEMA IDENTIFICADO: Se está usando suma en lugar de valor real`);
    }
    
    // 6. BUSCAR EL REGISTRO DE CALIFICACIÓN GENERAL
    console.log('\n6️⃣ BUSCANDO CALIFICACIÓN GENERAL/TOTAL...\n');
    
    const calificacionGeneral = resultados.rows.filter(row => 
      !row.area_evaluacion || 
      row.area_evaluacion === '' || 
      row.area_evaluacion === 'PUNTOS MAXIMOS' ||
      row.area_evaluacion === 'GENERAL' ||
      row.area_evaluacion === 'TOTAL' ||
      row.area_evaluacion.includes('TOTAL')
    );
    
    console.log(`📊 REGISTROS DE CALIFICACIÓN GENERAL (${calificacionGeneral.length}):`);
    calificacionGeneral.forEach((cal, index) => {
      console.log(`  ${index + 1}. Área: "${cal.area_evaluacion || 'VACÍA'}"`);
      console.log(`     Porcentaje: ${cal.porcentaje}%`);
      console.log(`     Puntos: ${cal.puntos_obtenidos}/${cal.puntos_maximos}`);
      console.log(`     ¿Es 85.34%?: ${Math.abs(parseFloat(cal.porcentaje) - 85.34) < 0.1 ? '🎯 SÍ' : '❌ NO'}`);
    });
    
    // 7. CONCLUSIONES
    console.log('\n7️⃣ CONCLUSIONES...\n');
    
    const valorReal85 = valor8534.length > 0 ? parseFloat(valor8534[0].porcentaje) : null;
    
    if (valorReal85) {
      console.log(`✅ VALOR REAL ZENPUT: ${valorReal85}%`);
      console.log(`❌ VALOR DASHBOARD: 88.1%`);
      console.log(`🚨 DIFERENCIA: ${Math.abs(88.1 - valorReal85).toFixed(2)}%`);
      
      if (diff1 < diff2 && diff1 < 1) {
        console.log(`🔧 PROBLEMA: El dashboard usa promedio de áreas (${promedioPorcentajes.toFixed(2)}%) en lugar del valor real (${valorReal85}%)`);
        console.log(`💡 SOLUCIÓN: Usar el campo de calificación general en lugar de promediar áreas individuales`);
      }
    }
    
    // 8. MOSTRAR TODOS LOS SUBMISSION IDs ÚNICOS
    console.log('\n8️⃣ SUBMISSION IDs ÚNICOS...\n');
    
    const submissionIds = [...new Set(resultados.rows.map(row => row.submission_id))];
    console.log(`📊 Submission IDs encontrados: ${submissionIds.join(', ')}`);
    console.log(`Total supervisiones: ${submissionIds.length}`);
    
    await pool.end();
    console.log('\n✅ Investigación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
  }
}

investigarDirecto();