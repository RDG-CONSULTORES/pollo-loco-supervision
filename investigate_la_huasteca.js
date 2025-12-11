const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function investigateLaHuastecaCalculations() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 INVESTIGACIÓN: La Huasteca T4 Period Calculations');
    console.log('📊 Dashboard: 88.1% vs Zenput: 85.34% (Diferencia: 2.76%)');
    console.log('=' .repeat(80));

    // 1. Query all supervision records for La Huasteca in T4 period
    console.log('\n1️⃣ REGISTROS DE SUPERVISIÓN LA HUASTECA - PERÍODO T4');
    const supervisionQuery = `
      SELECT 
        fecha_supervision,
        porcentaje,
        location_name,
        nombre_normalizado,
        submission_id,
        area_evaluacion,
        numero_sucursal,
        CASE 
          WHEN fecha_supervision >= '2025-10-30' THEN 'T4'
          WHEN fecha_supervision >= '2025-08-01' THEN 'T3'
          WHEN fecha_supervision >= '2025-05-01' THEN 'T2'
          ELSE 'T1'
        END as periodo_calculado
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'la-huasteca'
        AND fecha_supervision >= '2025-10-30'
      ORDER BY fecha_supervision DESC;
    `;
    
    const supervisionResult = await client.query(supervisionQuery);
    
    if (supervisionResult.rows.length === 0) {
      console.log('❌ No se encontraron registros para La Huasteca en T4');
      return;
    }
    
    console.log(`📋 Total de registros encontrados: ${supervisionResult.rows.length}`);
    console.log('\nDetalle de registros:');
    
    let totalPorcentaje = 0;
    supervisionResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Fecha: ${row.fecha_supervision.toISOString().split('T')[0]} | Porcentaje: ${row.porcentaje}% | Período: ${row.periodo_calculado} | Área: ${row.area_evaluacion || 'N/A'}`);
      console.log(`   📍 Sucursal: ${row.location_name} | ID: ${row.submission_id}`);
      totalPorcentaje += parseFloat(row.porcentaje);
    });
    
    // 2. Manual average calculation
    console.log('\n2️⃣ CÁLCULO MANUAL DEL PROMEDIO');
    const manualAverage = totalPorcentaje / supervisionResult.rows.length;
    console.log(`📊 Suma total: ${totalPorcentaje.toFixed(2)}`);
    console.log(`📊 Número de registros: ${supervisionResult.rows.length}`);
    console.log(`📊 Promedio manual: ${manualAverage.toFixed(2)}%`);
    
    // 3. Check what the database function returns
    console.log('\n3️⃣ VERIFICACIÓN CON FUNCIÓN DE BASE DE DATOS');
    const dbCalculationQuery = `
      SELECT 
        location_name,
        nombre_normalizado,
        COUNT(*) as total_supervisiones,
        AVG(porcentaje) as promedio_db,
        ROUND(AVG(porcentaje), 2) as promedio_redondeado,
        MIN(fecha_supervision) as fecha_min,
        MAX(fecha_supervision) as fecha_max
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'la-huasteca'
        AND fecha_supervision >= '2025-10-30'
      GROUP BY location_name, nombre_normalizado;
    `;
    
    const dbResult = await client.query(dbCalculationQuery);
    
    if (dbResult.rows.length > 0) {
      const dbRow = dbResult.rows[0];
      console.log(`📊 Promedio BD (AVG): ${parseFloat(dbRow.promedio_db).toFixed(2)}%`);
      console.log(`📊 Promedio BD (ROUND): ${dbRow.promedio_redondeado}%`);
      console.log(`📊 Total supervisiones BD: ${dbRow.total_supervisiones}`);
      console.log(`📊 Período: ${dbRow.fecha_min.toISOString().split('T')[0]} a ${dbRow.fecha_max.toISOString().split('T')[0]}`);
    }
    
    // 4. Check for potential data issues
    console.log('\n4️⃣ ANÁLISIS DE POSIBLES INCONSISTENCIAS');
    
    // Check for duplicate records
    const duplicateQuery = `
      SELECT 
        fecha_supervision,
        COUNT(*) as count
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'la-huasteca'
        AND fecha_supervision >= '2025-10-30'
      GROUP BY fecha_supervision
      HAVING COUNT(*) > 1;
    `;
    
    const duplicateResult = await client.query(duplicateQuery);
    
    if (duplicateResult.rows.length > 0) {
      console.log('⚠️  REGISTROS DUPLICADOS ENCONTRADOS:');
      duplicateResult.rows.forEach(row => {
        console.log(`   Fecha: ${row.fecha_supervision.toISOString().split('T')[0]} - ${row.count} registros`);
      });
    } else {
      console.log('✅ No se encontraron registros duplicados');
    }
    
    // Check for outliers (very high or very low percentages)
    console.log('\n5️⃣ VERIFICACIÓN DE VALORES ATÍPICOS');
    const outliers = supervisionResult.rows.filter(row => 
      parseFloat(row.porcentaje) < 50 || parseFloat(row.porcentaje) > 100
    );
    
    if (outliers.length > 0) {
      console.log('⚠️  VALORES ATÍPICOS ENCONTRADOS:');
      outliers.forEach(row => {
        console.log(`   Fecha: ${row.fecha_supervision.toISOString().split('T')[0]} - Porcentaje: ${row.porcentaje}%`);
      });
    } else {
      console.log('✅ No se encontraron valores atípicos (todos entre 50-100%)');
    }
    
    // 6. Check period boundary logic
    console.log('\n6️⃣ VERIFICACIÓN DE LÓGICA DE PERÍODOS');
    const periodBoundaryQuery = `
      SELECT 
        fecha_supervision,
        porcentaje,
        CASE 
          WHEN fecha_supervision >= '2025-10-30' THEN 'T4'
          WHEN fecha_supervision >= '2025-08-01' THEN 'T3'
          WHEN fecha_supervision >= '2025-05-01' THEN 'T2'
          ELSE 'T1'
        END as periodo,
        DATE_TRUNC('day', fecha_supervision) as fecha_truncada
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'la-huasteca'
        AND fecha_supervision >= '2025-10-28'  -- Include a few days before T4
      ORDER BY fecha_supervision DESC;
    `;
    
    const periodResult = await client.query(periodBoundaryQuery);
    
    console.log('📅 Registros alrededor de la frontera T4 (2025-10-30):');
    periodResult.rows.forEach(row => {
      const isT4 = row.periodo === 'T4' ? '✅' : '❌';
      console.log(`${isT4} ${row.fecha_truncada.toISOString().split('T')[0]} | ${row.porcentaje}% | Período: ${row.periodo}`);
    });
    
    // 7. Summary and recommendations
    console.log('\n7️⃣ RESUMEN Y ANÁLISIS');
    console.log('=' .repeat(80));
    console.log(`📊 Cálculo manual: ${manualAverage.toFixed(2)}%`);
    console.log(`📊 Dashboard reporta: 88.1%`);
    console.log(`📊 Zenput reporta: 85.34%`);
    
    const dashboardDiff = Math.abs(88.1 - manualAverage).toFixed(2);
    const zenputDiff = Math.abs(85.34 - manualAverage).toFixed(2);
    
    console.log(`📊 Diferencia Dashboard vs Manual: ${dashboardDiff}%`);
    console.log(`📊 Diferencia Zenput vs Manual: ${zenputDiff}%`);
    
    if (parseFloat(dashboardDiff) < 0.1) {
      console.log('✅ Dashboard calculation appears CORRECT');
    } else {
      console.log('❌ Dashboard calculation appears INCORRECT');
    }
    
    if (parseFloat(zenputDiff) < 0.1) {
      console.log('✅ Zenput calculation appears CORRECT');
    } else {
      console.log('❌ Zenput calculation appears INCORRECT');
    }
    
    // 8. Check different areas and their averages
    console.log('\n8️⃣ VERIFICACIÓN POR ÁREA DE EVALUACIÓN');
    const areaQuery = `
      SELECT 
        area_evaluacion,
        COUNT(*) as count,
        AVG(porcentaje) as promedio,
        ROUND(AVG(porcentaje), 2) as promedio_redondeado
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'la-huasteca'
        AND fecha_supervision >= '2025-10-30'
      GROUP BY area_evaluacion
      ORDER BY promedio DESC;
    `;
    
    try {
      const areaResult = await client.query(areaQuery);
      console.log('📊 Promedios por área de evaluación:');
      areaResult.rows.forEach(row => {
        console.log(`   ${row.area_evaluacion || 'Sin área'}: ${row.promedio_redondeado}% (${row.count} registros)`);
      });
    } catch (error) {
      console.log('ℹ️  No se pudo verificar por área de evaluación');
    }
    
    // 9. Check what Zenput might be calculating differently
    console.log('\n9️⃣ ANÁLISIS COMPARATIVO CON ZENPUT');
    
    // Check if there are differences in date ranges or areas included
    const zenputAnalysisQuery = `
      SELECT 
        fecha_supervision,
        area_evaluacion,
        porcentaje,
        location_name
      FROM supervision_normalized_view 
      WHERE nombre_normalizado = 'la-huasteca'
        AND fecha_supervision >= '2025-10-30'
      ORDER BY fecha_supervision, area_evaluacion;
    `;
    
    try {
      const zenputAnalysisResult = await client.query(zenputAnalysisQuery);
      
      // Group by date to see if there are multiple entries per date
      const dateGroups = {};
      zenputAnalysisResult.rows.forEach(row => {
        const dateKey = row.fecha_supervision.toISOString().split('T')[0];
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(row);
      });
      
      console.log('📅 Agrupación por fecha:');
      Object.keys(dateGroups).sort().forEach(date => {
        const records = dateGroups[date];
        if (records.length === 1) {
          console.log(`   ${date}: ${records[0].porcentaje}% (${records[0].area_evaluacion || 'Sin área'})`);
        } else {
          console.log(`   ${date}: ${records.length} registros`);
          records.forEach((record, idx) => {
            console.log(`     ${idx + 1}. ${record.porcentaje}% (${record.area_evaluacion || 'Sin área'})`);
          });
          const dateAvg = records.reduce((sum, r) => sum + parseFloat(r.porcentaje), 0) / records.length;
          console.log(`     📊 Promedio fecha: ${dateAvg.toFixed(2)}%`);
        }
      });
      
    } catch (error) {
      console.log('ℹ️  No se pudo realizar análisis comparativo con Zenput');
    }
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the investigation
investigateLaHuastecaCalculations()
  .then(() => {
    console.log('\n🎯 INVESTIGACIÓN COMPLETADA');
  })
  .catch(error => {
    console.error('💥 Error in investigation:', error);
  });