const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function investigarDiferenciaDashboard() {
  try {
    console.log('🔍 INVESTIGANDO DIFERENCIA DASHBOARD - LA HUASTECA\n');
    
    console.log('1️⃣ VERIFICANDO TODAS LAS QUERIES POSIBLES PARA LA HUASTECA DEL 29 AGO 2025:\n');
    
    // Query 1: Desde la vista limpia con área vacía (método más común)
    console.log('Query 1: Vista limpia, área vacía');
    const query1 = await pool.query(`
      SELECT 
        location_name,
        porcentaje,
        submission_id,
        fecha_supervision
      FROM supervision_operativa_clean
      WHERE location_name ILIKE '%huasteca%'
        AND DATE(fecha_supervision) = '2025-08-29'
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
    `);
    
    console.log(`  Resultados: ${query1.rows.length} registros`);
    query1.rows.forEach((row, index) => {
      console.log(`    ${index + 1}. ${row.location_name}: ${row.porcentaje}% (${row.submission_id})`);
    });
    
    // Query 2: Desde la vista de calificaciones generales
    console.log('\nQuery 2: Vista calificaciones_generales_clean');
    const query2 = await pool.query(`
      SELECT 
        location_name,
        calificacion_general as porcentaje,
        fecha_supervision
      FROM calificaciones_generales_clean
      WHERE location_name ILIKE '%huasteca%'
        AND DATE(fecha_supervision) = '2025-08-29'
    `);
    
    console.log(`  Resultados: ${query2.rows.length} registros`);
    query2.rows.forEach((row, index) => {
      console.log(`    ${index + 1}. ${row.location_name}: ${row.porcentaje}%`);
    });
    
    // Query 3: Calculando promedio de áreas
    console.log('\nQuery 3: Calculando promedio de áreas manualmente');
    const query3 = await pool.query(`
      SELECT 
        location_name,
        AVG(porcentaje) as promedio_areas,
        COUNT(*) as total_areas,
        submission_id
      FROM supervision_operativa_clean
      WHERE location_name ILIKE '%huasteca%'
        AND DATE(fecha_supervision) = '2025-08-29'
        AND area_evaluacion IS NOT NULL
        AND area_evaluacion != ''
        AND area_evaluacion != 'PUNTOS MAXIMOS'
        AND porcentaje IS NOT NULL
      GROUP BY location_name, submission_id
    `);
    
    console.log(`  Resultados: ${query3.rows.length} registros`);
    query3.rows.forEach((row, index) => {
      console.log(`    ${index + 1}. ${row.location_name}: ${parseFloat(row.promedio_areas).toFixed(2)}% (${row.total_areas} áreas)`);
    });
    
    // Query 4: Usando tabla original
    console.log('\nQuery 4: Tabla original supervision_operativa_detalle');
    const query4 = await pool.query(`
      SELECT 
        location_name,
        porcentaje,
        area_evaluacion,
        submission_id
      FROM supervision_operativa_detalle
      WHERE location_name ILIKE '%huasteca%'
        AND DATE(fecha_supervision) = '2025-08-29'
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
      LIMIT 5
    `);
    
    console.log(`  Resultados: ${query4.rows.length} registros`);
    query4.rows.forEach((row, index) => {
      console.log(`    ${index + 1}. ${row.location_name}: ${row.porcentaje}%`);
    });
    
    // Query 5: Verificar si hay múltiples submissions
    console.log('\nQuery 5: Verificando múltiples submissions');
    const query5 = await pool.query(`
      SELECT DISTINCT
        submission_id,
        location_name,
        DATE(fecha_supervision) as fecha,
        COUNT(*) as registros_por_submission
      FROM supervision_operativa_clean
      WHERE location_name ILIKE '%huasteca%'
        AND DATE(fecha_supervision) = '2025-08-29'
      GROUP BY submission_id, location_name, DATE(fecha_supervision)
      ORDER BY submission_id
    `);
    
    console.log(`  Submissions únicos: ${query5.rows.length}`);
    query5.rows.forEach((row, index) => {
      console.log(`    ${index + 1}. ${row.submission_id}: ${row.location_name} (${row.registros_por_submission} registros)`);
    });
    
    console.log('\n2️⃣ INVESTIGANDO POSIBLES FUENTES DE 89.89%:\n');
    
    // Buscar 89.89% en toda la base de datos
    console.log('Buscando porcentaje 89.89% en la base de datos...');
    const buscar8989 = await pool.query(`
      SELECT 
        location_name,
        area_evaluacion,
        porcentaje,
        fecha_supervision,
        submission_id
      FROM supervision_operativa_clean
      WHERE porcentaje::text LIKE '89.89%'
         OR porcentaje BETWEEN 89.88 AND 89.90
      ORDER BY fecha_supervision DESC
    `);
    
    console.log(`  Registros con 89.89%: ${buscar8989.rows.length}`);
    buscar8989.rows.forEach((row, index) => {
      console.log(`    ${index + 1}. ${row.location_name} (${row.area_evaluacion}): ${row.porcentaje}% - ${row.fecha_supervision}`);
    });
    
    // Verificar si hay data de La Huasteca en otras fechas con 89.89%
    console.log('\nBuscando 89.89% específicamente para La Huasteca...');
    const huasteca8989 = await pool.query(`
      SELECT 
        location_name,
        area_evaluacion,
        porcentaje,
        DATE(fecha_supervision) as fecha,
        submission_id
      FROM supervision_operativa_clean
      WHERE location_name ILIKE '%huasteca%'
        AND (porcentaje::text LIKE '89.89%' OR porcentaje BETWEEN 89.88 AND 89.90)
      ORDER BY fecha_supervision DESC
    `);
    
    console.log(`  La Huasteca con 89.89%: ${huasteca8989.rows.length} registros`);
    huasteca8989.rows.forEach((row, index) => {
      console.log(`    ${index + 1}. ${row.location_name}: ${row.porcentaje}% - ${row.fecha} (${row.area_evaluacion})`);
    });
    
    console.log('\n3️⃣ VERIFICANDO CÁLCULOS ALTERNATIVOS:\n');
    
    // Ver si 89.89% viene de un cálculo con datos diferentes
    console.log('Calculando porcentajes con diferentes métodos...');
    
    // Método con redondeo diferente
    const puntosObtenidos = 110;
    const puntosMaximos = 124;
    
    console.log('Diferentes redondeos:');
    console.log(`  Sin redondeo: ${(puntosObtenidos / puntosMaximos * 100).toFixed(6)}%`);
    console.log(`  1 decimal: ${(puntosObtenidos / puntosMaximos * 100).toFixed(1)}%`);
    console.log(`  2 decimales: ${(puntosObtenidos / puntosMaximos * 100).toFixed(2)}%`);
    console.log(`  3 decimales: ${(puntosObtenidos / puntosMaximos * 100).toFixed(3)}%`);
    
    // Ver si 89.89% viene de datos con puntos diferentes
    console.log('\n¿Qué puntos darían 89.89%?');
    const puntosNecesarios = (89.89 * 124 / 100);
    console.log(`  Para 89.89% con 124 puntos máximos se necesitan: ${puntosNecesarios.toFixed(2)} puntos`);
    
    // Buscar registros con estos puntos
    const buscarPuntosAlternativos = await pool.query(`
      SELECT DISTINCT
        puntos_obtenidos,
        puntos_maximos,
        (puntos_obtenidos::float / puntos_maximos::float * 100) as porcentaje_calculado,
        location_name,
        DATE(fecha_supervision) as fecha
      FROM supervision_operativa_clean
      WHERE location_name ILIKE '%huasteca%'
        AND puntos_obtenidos IS NOT NULL
        AND puntos_maximos IS NOT NULL
        AND DATE(fecha_supervision) = '2025-08-29'
    `);
    
    console.log('\nRegistros con puntos diferentes:');
    buscarPuntosAlternativos.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.puntos_obtenidos}/${row.puntos_maximos} = ${parseFloat(row.porcentaje_calculado).toFixed(2)}%`);
    });
    
    console.log('\n4️⃣ VERIFICANDO CONSULTAS DEL BACKEND:\n');
    
    // Simular la consulta que podría estar usando el dashboard
    console.log('Simulando consulta típica del dashboard...');
    const dashboardQuery = await pool.query(`
      SELECT 
        s.location_name,
        s.grupo_operativo_limpio,
        AVG(CASE WHEN s.area_evaluacion = '' THEN s.porcentaje END) as porcentaje_directo,
        AVG(CASE WHEN s.area_evaluacion != '' AND s.area_evaluacion != 'PUNTOS MAXIMOS' THEN s.porcentaje END) as promedio_areas
      FROM supervision_operativa_clean s
      WHERE s.location_name ILIKE '%huasteca%'
        AND DATE(s.fecha_supervision) = '2025-08-29'
      GROUP BY s.location_name, s.grupo_operativo_limpio
    `);
    
    console.log('Resultado simulación dashboard:');
    dashboardQuery.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.location_name}:`);
      console.log(`     Porcentaje directo: ${row.porcentaje_directo}%`);
      console.log(`     Promedio áreas: ${parseFloat(row.promedio_areas || 0).toFixed(2)}%`);
    });
    
    await pool.end();
    console.log('\n✅ Investigación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

investigarDiferenciaDashboard();