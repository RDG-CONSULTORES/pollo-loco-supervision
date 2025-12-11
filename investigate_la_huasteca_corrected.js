const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function investigateCorrectLaHuasteca() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 INVESTIGACIÓN CORREGIDA: La Huasteca');
    console.log('📊 Dashboard: 88.1% vs Zenput: 85.34% (Diferencia: 2.76%)');
    console.log('=' .repeat(80));

    // 1. Get all La Huasteca records with correct naming
    console.log('\n1️⃣ TODOS LOS REGISTROS DE LA HUASTECA (CORRECCIÓN)');
    const allRecordsQuery = `
      SELECT 
        fecha_supervision,
        porcentaje,
        location_name,
        nombre_normalizado,
        submission_id,
        area_evaluacion,
        numero_sucursal
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'La Huasteca'
      ORDER BY fecha_supervision DESC;
    `;
    
    const allRecordsResult = await client.query(allRecordsQuery);
    
    console.log(`📋 Total de registros La Huasteca: ${allRecordsResult.rows.length}`);
    console.log('\n📅 Últimos 10 registros:');
    allRecordsResult.rows.slice(0, 10).forEach((row, index) => {
      console.log(`${index + 1}. ${row.fecha_supervision.toISOString().split('T')[0]} | ${row.porcentaje}% | ${row.area_evaluacion || 'Sin área'}`);
    });
    
    // 2. Check what period the last supervision (2025-11-11) falls into
    console.log('\n2️⃣ CLASIFICACIÓN DE PERÍODOS');
    const periodClassificationQuery = `
      SELECT 
        fecha_supervision,
        porcentaje,
        CASE 
          WHEN fecha_supervision >= '2025-10-30' THEN 'T4'
          WHEN fecha_supervision >= '2025-08-01' THEN 'T3'
          WHEN fecha_supervision >= '2025-05-01' THEN 'T2'
          ELSE 'T1'
        END as periodo_calculado,
        DATE_PART('day', fecha_supervision - '2025-10-30'::date) as dias_desde_t4
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'La Huasteca'
        AND fecha_supervision >= '2025-10-25'  -- Show records around T4 boundary
      ORDER BY fecha_supervision DESC;
    `;
    
    const periodResult = await client.query(periodClassificationQuery);
    
    console.log('📊 Registros alrededor de T4 (2025-10-30):');
    periodResult.rows.forEach(row => {
      const t4Status = row.periodo_calculado === 'T4' ? '✅ T4' : '❌ ' + row.periodo_calculado;
      console.log(`${t4Status} | ${row.fecha_supervision.toISOString().split('T')[0]} | ${row.porcentaje}% | Días desde T4: ${row.dias_desde_t4}`);
    });
    
    // 3. Manual calculation for T4 period (if any records exist)
    console.log('\n3️⃣ CÁLCULO T4 PERIOD');
    const t4RecordsQuery = `
      SELECT 
        fecha_supervision,
        porcentaje,
        area_evaluacion
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'La Huasteca'
        AND fecha_supervision >= '2025-10-30'
      ORDER BY fecha_supervision;
    `;
    
    const t4RecordsResult = await client.query(t4RecordsQuery);
    
    if (t4RecordsResult.rows.length > 0) {
      console.log(`📋 Registros T4 encontrados: ${t4RecordsResult.rows.length}`);
      
      let totalT4 = 0;
      t4RecordsResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.fecha_supervision.toISOString().split('T')[0]} | ${row.porcentaje}% | ${row.area_evaluacion || 'Sin área'}`);
        totalT4 += parseFloat(row.porcentaje);
      });
      
      const averageT4 = totalT4 / t4RecordsResult.rows.length;
      console.log(`📊 Promedio T4 manual: ${averageT4.toFixed(2)}%`);
      
      // Compare with dashboard and Zenput
      const dashboardDiff = Math.abs(88.1 - averageT4).toFixed(2);
      const zenputDiff = Math.abs(85.34 - averageT4).toFixed(2);
      
      console.log(`📊 Diferencia Dashboard (88.1%): ${dashboardDiff}%`);
      console.log(`📊 Diferencia Zenput (85.34%): ${zenputDiff}%`);
      
    } else {
      console.log('❌ NO HAY REGISTROS EN T4 PARA LA HUASTECA');
      console.log('🚨 PROBLEMA CRÍTICO: Dashboard y Zenput reportan datos que no existen en BD');
    }
    
    // 4. Check what the dashboard might be calculating instead
    console.log('\n4️⃣ ANÁLISIS DE POSIBLES CÁLCULOS ALTERNATIVOS');
    
    // Maybe dashboard is using a different date range or including different records
    const alternativePeriodsQuery = `
      SELECT 
        'Últimos 30 días' as periodo,
        AVG(porcentaje) as promedio,
        COUNT(*) as registros,
        MIN(fecha_supervision) as fecha_min,
        MAX(fecha_supervision) as fecha_max
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'La Huasteca'
        AND fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'Últimos 45 días' as periodo,
        AVG(porcentaje) as promedio,
        COUNT(*) as registros,
        MIN(fecha_supervision) as fecha_min,
        MAX(fecha_supervision) as fecha_max
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'La Huasteca'
        AND fecha_supervision >= CURRENT_DATE - INTERVAL '45 days'
      
      UNION ALL
      
      SELECT 
        'Desde 2025-11-01' as periodo,
        AVG(porcentaje) as promedio,
        COUNT(*) as registros,
        MIN(fecha_supervision) as fecha_min,
        MAX(fecha_supervision) as fecha_max
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'La Huasteca'
        AND fecha_supervision >= '2025-11-01'
      
      UNION ALL
      
      SELECT 
        'Desde 2025-10-01' as periodo,
        AVG(porcentaje) as promedio,
        COUNT(*) as registros,
        MIN(fecha_supervision) as fecha_min,
        MAX(fecha_supervision) as fecha_max
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'La Huasteca'
        AND fecha_supervision >= '2025-10-01';
    `;
    
    const alternativeResult = await client.query(alternativePeriodsQuery);
    
    console.log('📊 Posibles cálculos alternativos:');
    alternativeResult.rows.forEach(row => {
      if (row.registros > 0) {
        const dashboardMatch = Math.abs(88.1 - parseFloat(row.promedio)) < 0.5 ? '🎯' : '  ';
        const zenputMatch = Math.abs(85.34 - parseFloat(row.promedio)) < 0.5 ? '🎯' : '  ';
        console.log(`${dashboardMatch}${zenputMatch} ${row.periodo}: ${parseFloat(row.promedio).toFixed(2)}% (${row.registros} registros)`);
        console.log(`     📅 ${row.fecha_min?.toISOString().split('T')[0]} a ${row.fecha_max?.toISOString().split('T')[0]}`);
      }
    });
    
    // 5. Check if there are records under different normalized names
    console.log('\n5️⃣ VERIFICACIÓN DE OTRAS VARIACIONES');
    const otherVariationsQuery = `
      SELECT 
        nombre_normalizado,
        location_name,
        COUNT(*) as registros,
        AVG(porcentaje) as promedio,
        MAX(fecha_supervision) as ultima_fecha
      FROM supervision_normalized_view 
      WHERE location_name ILIKE '%huasteca%'
         OR nombre_normalizado ILIKE '%huasteca%'
      GROUP BY nombre_normalizado, location_name
      ORDER BY ultima_fecha DESC;
    `;
    
    const otherVariationsResult = await client.query(otherVariationsQuery);
    
    console.log('🔍 Todas las variaciones de Huasteca:');
    otherVariationsResult.rows.forEach(row => {
      console.log(`📍 "${row.nombre_normalizado}" (${row.location_name})`);
      console.log(`   📊 ${row.registros} registros | Promedio: ${parseFloat(row.promedio).toFixed(2)}% | Última: ${row.ultima_fecha?.toISOString().split('T')[0]}`);
    });
    
    // 6. Conclusiones
    console.log('\n6️⃣ CONCLUSIONES Y RECOMENDACIONES');
    console.log('=' .repeat(80));
    
    if (t4RecordsResult.rows.length === 0) {
      console.log('🚨 HALLAZGO CRÍTICO:');
      console.log('   ❌ NO existen registros de La Huasteca en período T4 (2025-10-30+)');
      console.log('   📅 La última supervisión fue 2025-11-11 (debería estar en T4)');
      console.log('   🤔 Dashboard (88.1%) y Zenput (85.34%) reportan datos inexistentes');
      console.log('');
      console.log('📋 POSIBLES CAUSAS:');
      console.log('   1. Error en clasificación de períodos (T4 debería incluir 2025-11-11)');
      console.log('   2. Dashboard/Zenput usan diferente lógica de períodos');
      console.log('   3. Dashboard/Zenput usan diferentes fuentes de datos');
      console.log('   4. Problema de zona horaria en fechas');
      console.log('');
      console.log('⚠️  CONFIABILIDAD: BAJA');
      console.log('   Las diferencias sugieren inconsistencias sistemáticas');
      console.log('   ✅ RECOMENDACIÓN: Verificación manual OBLIGATORIA');
    }
    
  } catch (error) {
    console.error('❌ Error during corrected investigation:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

investigateCorrectLaHuasteca();