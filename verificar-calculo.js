const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function verificarCalculoCalificaciones() {
  try {
    console.log('🔍 VERIFICANDO CÓMO SE CALCULAN LAS CALIFICACIONES TOTALES\n');
    
    // Obtener una supervisión completa para analizar
    const sample = await pool.query(`
      SELECT 
        submission_id,
        location_name,
        area_evaluacion,
        puntos_maximos,
        puntos_obtenidos,
        porcentaje,
        ROW_NUMBER() OVER (PARTITION BY submission_id ORDER BY id) as orden
      FROM supervision_operativa_detalle
      WHERE grupo_operativo = 'TEPEYAC'
        AND submission_id = (
          SELECT submission_id 
          FROM supervision_operativa_detalle 
          WHERE grupo_operativo = 'TEPEYAC' 
          LIMIT 1
        )
        AND (
          area_evaluacion = 'PUNTOS MAXIMOS' OR
          (area_evaluacion = '' AND puntos_obtenidos IS NOT NULL) OR
          (area_evaluacion = '' AND porcentaje IS NOT NULL)
        )
      ORDER BY orden
    `);
    
    console.log('📋 REGISTROS CLAVE PARA EL CÁLCULO:');
    sample.rows.forEach(row => {
      const area = row.area_evaluacion || 'VACIA';
      console.log(`${row.orden}. Area: "${area}" | Max: ${row.puntos_maximos} | Obt: ${row.puntos_obtenidos} | %: ${row.porcentaje}`);
    });
    
    // Buscar los registros específicos
    const puntosMaximos = sample.rows.find(row => row.area_evaluacion === 'PUNTOS MAXIMOS');
    const puntosObtenidos = sample.rows.find(row => row.area_evaluacion === '' && row.puntos_obtenidos !== null);
    const porcentajeFinal = sample.rows.find(row => row.area_evaluacion === '' && row.porcentaje !== null);
    
    console.log('\n🧮 ANÁLISIS DEL CÁLCULO:');
    
    if (puntosMaximos) {
      console.log(`Puntos Máximos Totales: ${puntosMaximos.puntos_maximos}`);
    }
    
    if (puntosObtenidos) {
      console.log(`Puntos Obtenidos Totales: ${puntosObtenidos.puntos_obtenidos}`);
    }
    
    if (porcentajeFinal) {
      console.log(`Porcentaje Final Registrado: ${porcentajeFinal.porcentaje}%`);
    }
    
    // Verificar si el cálculo es correcto
    if (puntosMaximos && puntosObtenidos && porcentajeFinal) {
      const calculado = (puntosObtenidos.puntos_obtenidos / puntosMaximos.puntos_maximos * 100);
      console.log(`Porcentaje Calculado: ${calculado.toFixed(2)}%`);
      
      const diferencia = Math.abs(calculado - parseFloat(porcentajeFinal.porcentaje));
      console.log(`Diferencia: ${diferencia.toFixed(2)}%`);
      
      if (diferencia < 0.1) {
        console.log('✅ CONFIRMADO: SE USA SUMA DE PUNTOS (puntos_obtenidos / puntos_maximos * 100)');
      } else {
        console.log('⚠️  HAY DIFERENCIA - posible redondeo diferente o método alternativo');
      }
    }
    
    // Ver todas las áreas individuales para verificar si se usa promedio
    console.log('\n📊 VERIFICANDO SI SE USA PROMEDIO DE ÁREAS:');
    const areas = await pool.query(`
      SELECT 
        area_evaluacion,
        puntos_maximos,
        puntos_obtenidos,
        porcentaje
      FROM supervision_operativa_detalle
      WHERE submission_id = $1
        AND area_evaluacion IS NOT NULL
        AND area_evaluacion != ''
        AND area_evaluacion != 'PUNTOS MAXIMOS'
        AND porcentaje IS NOT NULL
      ORDER BY area_evaluacion
    `, [sample.rows[0].submission_id]);
    
    let sumaPromedios = 0;
    let conteoAreas = 0;
    
    console.log('Áreas individuales:');
    areas.rows.forEach((row, index) => {
      if (index < 5) { // Solo mostrar las primeras 5 para no saturar
        console.log(`  ${row.area_evaluacion}: ${row.porcentaje}%`);
      }
      sumaPromedios += parseFloat(row.porcentaje);
      conteoAreas++;
    });
    
    if (conteoAreas > 5) {
      console.log(`  ... y ${conteoAreas - 5} áreas más`);
    }
    
    const promedioPorcentajes = (sumaPromedios / conteoAreas).toFixed(2);
    console.log(`\nPromedio de todas las áreas: ${promedioPorcentajes}%`);
    
    if (porcentajeFinal) {
      const diferenciaPromedio = Math.abs(parseFloat(promedioPorcentajes) - parseFloat(porcentajeFinal.porcentaje));
      console.log(`Diferencia con calificación final: ${diferenciaPromedio.toFixed(2)}%`);
      
      if (diferenciaPromedio < 0.1) {
        console.log('✅ ALTERNATIVA: Se podría estar usando promedio de áreas');
      }
    }
    
    await pool.end();
    console.log('\n✅ Análisis completado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

verificarCalculoCalificaciones();