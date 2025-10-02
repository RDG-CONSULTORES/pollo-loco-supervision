const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function desgloseCompletoHuasteca() {
  try {
    console.log('🔍 DESGLOSE COMPLETO - LA HUASTECA (29 AGO 2025)\n');
    
    // Obtener el submission_id específico
    const supervision = await pool.query(`
      SELECT DISTINCT submission_id, location_name
      FROM supervision_operativa_clean
      WHERE location_name ILIKE '%huasteca%'
        AND DATE(fecha_supervision) = '2025-08-29'
      LIMIT 1
    `);
    
    if (supervision.rows.length === 0) {
      console.log('❌ No se encontró la supervisión');
      await pool.end();
      return;
    }
    
    const submissionId = supervision.rows[0].submission_id;
    console.log(`📋 Analizando submission: ${submissionId}`);
    console.log(`🏪 Sucursal: ${supervision.rows[0].location_name}\n`);
    
    // 1. Obtener TODAS las áreas con su puntaje
    const todasLasAreas = await pool.query(`
      SELECT 
        area_evaluacion,
        puntos_maximos,
        puntos_obtenidos,
        porcentaje,
        COUNT(*) as frecuencia
      FROM supervision_operativa_clean
      WHERE submission_id = $1
        AND area_evaluacion IS NOT NULL
        AND area_evaluacion != ''
        AND area_evaluacion != 'PUNTOS MAXIMOS'
        AND porcentaje IS NOT NULL
      GROUP BY area_evaluacion, puntos_maximos, puntos_obtenidos, porcentaje
      ORDER BY area_evaluacion
    `, [submissionId]);
    
    console.log(`📊 TODAS LAS ÁREAS EVALUADAS (${todasLasAreas.rows.length} áreas):\n`);
    
    let sumaPromedios = 0;
    let contadorAreas = 0;
    let areasIncluidas = [];
    let areasExcluidas = [];
    
    todasLasAreas.rows.forEach((area, index) => {
      const porcentaje = parseFloat(area.porcentaje);
      console.log(`${index + 1}. ${area.area_evaluacion}: ${area.porcentaje}% [${area.frecuencia}x]`);
      
      // Evaluar si esta área debería incluirse en el cálculo
      if (porcentaje >= 0 && porcentaje <= 100) {
        sumaPromedios += porcentaje;
        contadorAreas++;
        areasIncluidas.push({
          nombre: area.area_evaluacion,
          porcentaje: porcentaje,
          frecuencia: area.frecuencia
        });
      } else {
        areasExcluidas.push({
          nombre: area.area_evaluacion,
          porcentaje: porcentaje,
          frecuencia: area.frecuencia
        });
      }
    });
    
    // 2. Análisis del cálculo de promedio
    console.log(`\n🧮 ANÁLISIS DEL CÁLCULO:\n`);
    
    const promedioTotal = sumaPromedios / contadorAreas;
    console.log(`📈 Áreas incluidas en el cálculo: ${contadorAreas}`);
    console.log(`📊 Suma total de porcentajes: ${sumaPromedios.toFixed(2)}%`);
    console.log(`🎯 Promedio calculado: ${promedioTotal.toFixed(2)}%`);
    
    // Obtener el porcentaje registrado en el sistema
    const porcentajeRegistrado = await pool.query(`
      SELECT porcentaje
      FROM supervision_operativa_clean
      WHERE submission_id = $1
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
      LIMIT 1
    `, [submissionId]);
    
    if (porcentajeRegistrado.rows.length > 0) {
      const registrado = parseFloat(porcentajeRegistrado.rows[0].porcentaje);
      console.log(`📋 Porcentaje registrado en el sistema: ${registrado}%`);
      console.log(`🔍 Diferencia: ${Math.abs(promedioTotal - registrado).toFixed(2)}%`);
      
      // Buscar exactamente qué áreas se están usando
      console.log(`\n🎯 INTENTANDO ENCONTRAR EL CÁLCULO EXACTO:\n`);
      
      // Probar diferentes combinaciones
      console.log(`Escenario 1: Todas las áreas (${contadorAreas})`);
      console.log(`  Promedio: ${promedioTotal.toFixed(2)}%`);
      console.log(`  Diferencia con sistema: ${Math.abs(promedioTotal - registrado).toFixed(2)}%`);
      
      // Probar excluyendo áreas de 100%
      const areasSin100 = areasIncluidas.filter(area => area.porcentaje < 100);
      if (areasSin100.length > 0) {
        const sumaSin100 = areasSin100.reduce((sum, area) => sum + area.porcentaje, 0);
        const promedioSin100 = sumaSin100 / areasSin100.length;
        console.log(`\nEscenario 2: Sin áreas de 100% (${areasSin100.length} áreas)`);
        console.log(`  Promedio: ${promedioSin100.toFixed(2)}%`);
        console.log(`  Diferencia con sistema: ${Math.abs(promedioSin100 - registrado).toFixed(2)}%`);
      }
      
      // Probar solo áreas con problemas (< 100%)
      const areasConProblemas = areasIncluidas.filter(area => area.porcentaje < 100);
      if (areasConProblemas.length > 0) {
        console.log(`\n🚨 ÁREAS CON CALIFICACIÓN < 100% (${areasConProblemas.length} áreas):`);
        areasConProblemas.forEach((area, index) => {
          console.log(`  ${index + 1}. ${area.nombre}: ${area.porcentaje}%`);
        });
        
        const sumaProblemas = areasConProblemas.reduce((sum, area) => sum + area.porcentaje, 0);
        const promedioProblemas = sumaProblemas / areasConProblemas.length;
        console.log(`  Promedio áreas problemáticas: ${promedioProblemas.toFixed(2)}%`);
      }
      
      // Verificar si hay algún factor de peso o ponderación
      console.log(`\n⚖️ BUSCANDO FACTORES DE PONDERACIÓN:\n`);
      
      // Calcular qué factor de ponderación haría que el cálculo coincida
      const factorNecesario = registrado / promedioTotal;
      console.log(`Factor necesario para coincidencia: ${factorNecesario.toFixed(4)}`);
      
      // Buscar patrones en las frecuencias
      const frecuenciasUnicas = [...new Set(areasIncluidas.map(area => area.frecuencia))];
      console.log(`Frecuencias encontradas: ${frecuenciasUnicas.join(', ')}`);
      
      if (frecuenciasUnicas.length === 1) {
        console.log(`✅ Todas las áreas tienen la misma frecuencia (${frecuenciasUnicas[0]}), no hay ponderación por frecuencia`);
      }
    }
    
    // 3. Comparar con los datos originales de Zenput
    console.log(`\n📱 COMPARACIÓN CON ZENPUT:\n`);
    console.log(`🔢 Zenput reporta: 88.71%`);
    console.log(`🖥️  Nuestro sistema: ${porcentajeRegistrado.rows[0]?.porcentaje || 'N/A'}%`);
    console.log(`🧮 Promedio calculado manualmente: ${promedioTotal.toFixed(2)}%`);
    
    if (porcentajeRegistrado.rows.length > 0) {
      const diferenciaNuestroVsZenput = Math.abs(parseFloat(porcentajeRegistrado.rows[0].porcentaje) - 88.71);
      console.log(`📊 Diferencia nuestro sistema vs Zenput: ${diferenciaNuestroVsZenput.toFixed(2)}%`);
    }
    
    // 4. Buscar registros de puntos máximos y obtenidos
    console.log(`\n📊 BUSCANDO REGISTROS DE PUNTOS:\n`);
    
    const puntosTotales = await pool.query(`
      SELECT 
        area_evaluacion,
        puntos_maximos,
        puntos_obtenidos,
        porcentaje
      FROM supervision_operativa_clean
      WHERE submission_id = $1
        AND (area_evaluacion = 'PUNTOS MAXIMOS' OR 
             (area_evaluacion = '' AND (puntos_maximos IS NOT NULL OR puntos_obtenidos IS NOT NULL)))
      ORDER BY area_evaluacion
    `, [submissionId]);
    
    if (puntosTotales.rows.length > 0) {
      console.log('Registros de puntos encontrados:');
      puntosTotales.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. Area: "${row.area_evaluacion}" | Max: ${row.puntos_maximos} | Obt: ${row.puntos_obtenidos} | %: ${row.porcentaje}`);
      });
    } else {
      console.log('❌ No se encontraron registros de puntos totales');
    }
    
    await pool.end();
    console.log('\n✅ Análisis completo finalizado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

desgloseCompletoHuasteca();