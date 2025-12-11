const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function investigarEstructura() {
  try {
    console.log('🔍 INVESTIGANDO ESTRUCTURA DE LA BASE DE DATOS\n');
    
    // 1. VER TODAS LAS TABLAS Y VISTAS DISPONIBLES
    console.log('1️⃣ TABLAS Y VISTAS DISPONIBLES...\n');
    
    const tablasYVistas = await pool.query(`
      SELECT 
        table_name, 
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND (table_name LIKE '%supervision%' OR table_name LIKE '%huasteca%')
      ORDER BY table_type, table_name
    `);
    
    console.log('📋 Tablas y vistas encontradas:');
    tablasYVistas.rows.forEach(row => {
      console.log(`  ${row.table_type}: ${row.table_name}`);
    });
    
    // 2. VER LA ESTRUCTURA ESPECÍFICA DE supervision_normalized_view
    console.log('\n2️⃣ ESTRUCTURA DE supervision_normalized_view...\n');
    
    const estructuraNorm = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'supervision_normalized_view'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Campos en supervision_normalized_view:');
    estructuraNorm.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
    // 3. VER LA ESTRUCTURA DE supervision_operativa_clean
    console.log('\n3️⃣ ESTRUCTURA DE supervision_operativa_clean...\n');
    
    const estructuraOriginal = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'supervision_operativa_clean'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Campos en supervision_operativa_clean:');
    estructuraOriginal.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
    // 4. BUSCAR DATOS DE LA HUASTECA DEL 11 DE NOVIEMBRE
    console.log('\n4️⃣ DATOS REALES DE LA HUASTECA - 11 NOVIEMBRE...\n');
    
    const datosHuasteca = await pool.query(`
      SELECT *
      FROM supervision_operativa_clean
      WHERE location_name ILIKE '%huasteca%' 
        AND DATE(fecha_supervision) = '2025-11-11'
      LIMIT 3
    `);
    
    console.log(`✅ Encontrados ${datosHuasteca.rows.length} registros de muestra`);
    
    if (datosHuasteca.rows.length > 0) {
      console.log('\n📊 PRIMER REGISTRO COMPLETO:');
      const primerRegistro = datosHuasteca.rows[0];
      Object.keys(primerRegistro).forEach(key => {
        console.log(`  ${key}: ${primerRegistro[key]}`);
      });
      
      // 5. BUSCAR ESPECÍFICAMENTE EL 85.34%
      console.log('\n5️⃣ BUSCANDO EL VALOR 85.34%...\n');
      
      const valor8534 = await pool.query(`
        SELECT *
        FROM supervision_operativa_clean
        WHERE location_name ILIKE '%huasteca%' 
          AND DATE(fecha_supervision) = '2025-11-11'
          AND ABS(porcentaje - 85.34) < 0.1
      `);
      
      if (valor8534.rows.length > 0) {
        console.log('🎯 ENCONTRADO EL VALOR 85.34%:');
        valor8534.rows.forEach(row => {
          console.log(`  Área: ${row.area_evaluacion || 'GENERAL/TOTAL'}`);
          console.log(`  Porcentaje exacto: ${row.porcentaje}%`);
          console.log(`  Puntos: ${row.puntos_obtenidos}/${row.puntos_maximos}`);
          console.log(`  Submission ID: ${row.submission_id}`);
          console.log('  ---');
        });
      } else {
        console.log('❌ No se encontró exactamente 85.34%');
        
        // Buscar valores cercanos
        const valoresCercanos = await pool.query(`
          SELECT area_evaluacion, porcentaje, puntos_obtenidos, puntos_maximos, submission_id
          FROM supervision_operativa_clean
          WHERE location_name ILIKE '%huasteca%' 
            AND DATE(fecha_supervision) = '2025-11-11'
            AND porcentaje IS NOT NULL
          ORDER BY ABS(porcentaje - 85.34)
          LIMIT 10
        `);
        
        console.log('📊 Los 10 valores más cercanos a 85.34%:');
        valoresCercanos.rows.forEach((row, index) => {
          const diff = Math.abs(parseFloat(row.porcentaje) - 85.34);
          console.log(`  ${index + 1}. ${row.area_evaluacion || 'GENERAL'}: ${row.porcentaje}% (diff: ${diff.toFixed(2)}%)`);
        });
      }
      
      // 6. ANÁLISIS COMPLETO DE TODAS LAS ÁREAS
      console.log('\n6️⃣ ANÁLISIS COMPLETO DE ÁREAS...\n');
      
      const todasAreas = await pool.query(`
        SELECT 
          area_evaluacion,
          porcentaje,
          puntos_obtenidos,
          puntos_maximos,
          COUNT(*) as registros
        FROM supervision_operativa_clean
        WHERE location_name ILIKE '%huasteca%' 
          AND DATE(fecha_supervision) = '2025-11-11'
          AND porcentaje IS NOT NULL
        GROUP BY area_evaluacion, porcentaje, puntos_obtenidos, puntos_maximos
        ORDER BY 
          CASE WHEN area_evaluacion = '' OR area_evaluacion IS NULL THEN 0 ELSE 1 END,
          area_evaluacion
      `);
      
      console.log(`📋 TODAS LAS ÁREAS (${todasAreas.rows.length}):`);
      
      let sumaPromedios = 0;
      let contador = 0;
      let totalPuntosMaximos = 0;
      let totalPuntosObtenidos = 0;
      
      todasAreas.rows.forEach((area, index) => {
        const esGeneral = !area.area_evaluacion || area.area_evaluacion === '';
        console.log(`  ${index + 1}. ${area.area_evaluacion || 'GENERAL/TOTAL'}: ${area.porcentaje}% (${area.puntos_obtenidos}/${area.puntos_maximos}) ${esGeneral ? '[GENERAL]' : ''}`);
        
        // Solo sumar áreas individuales para el promedio
        if (!esGeneral && area.area_evaluacion !== 'PUNTOS MAXIMOS') {
          sumaPromedios += parseFloat(area.porcentaje);
          contador++;
        }
        
        totalPuntosMaximos += parseInt(area.puntos_maximos || 0);
        totalPuntosObtenidos += parseInt(area.puntos_obtenidos || 0);
      });
      
      if (contador > 0) {
        const promedioPorcentajes = sumaPromedios / contador;
        const porcentajeSumaPuntos = totalPuntosMaximos > 0 ? 
          (totalPuntosObtenidos / totalPuntosMaximos * 100) : 0;
        
        console.log(`\n🧮 CÁLCULOS:`);
        console.log(`  Áreas individuales: ${contador}`);
        console.log(`  Promedio de áreas: ${promedioPorcentajes.toFixed(2)}%`);
        console.log(`  Suma de puntos: ${porcentajeSumaPuntos.toFixed(2)}% (${totalPuntosObtenidos}/${totalPuntosMaximos})`);
        
        // Verificar cuál está más cerca del 88.1%
        const diff1 = Math.abs(promedioPorcentajes - 88.1);
        const diff2 = Math.abs(porcentajeSumaPuntos - 88.1);
        
        console.log(`\n📊 COMPARACIÓN CON 88.1%:`);
        console.log(`  Diferencia promedio áreas: ${diff1.toFixed(2)}%`);
        console.log(`  Diferencia suma puntos: ${diff2.toFixed(2)}%`);
        
        if (diff1 < 1) {
          console.log(`  🎯 EL 88.1% VIENE DEL PROMEDIO DE ÁREAS`);
        } else if (diff2 < 1) {
          console.log(`  🎯 EL 88.1% VIENE DE LA SUMA DE PUNTOS`);
        }
      }
    }
    
    await pool.end();
    console.log('\n✅ Investigación de estructura completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
  }
}

investigarEstructura();