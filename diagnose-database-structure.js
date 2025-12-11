const { Pool } = require('pg');
require('dotenv').config();

async function diagnoseDatabaseStructure() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 DIAGNÓSTICO COMPLETO DE ESTRUCTURA DE BASE DE DATOS');
    console.log('='.repeat(80));

    // 1. LISTAR TODAS LAS TABLAS RELACIONADAS CON SUPERVISIÓN
    console.log('\n📊 1. TABLAS RELACIONADAS CON SUPERVISIÓN:');
    const tablesQuery = `
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%supervision%' OR table_name LIKE '%normalized%')
      ORDER BY table_name;
    `;
    const tables = await pool.query(tablesQuery);
    
    tables.rows.forEach(table => {
      console.log(`  ✓ ${table.table_name} (${table.table_type})`);
    });

    // 2. MOSTRAR ESTRUCTURA COMPLETA DE CADA TABLA
    for (const table of tables.rows) {
      const tableName = table.table_name;
      console.log(`\n🏗️ 2. ESTRUCTURA COMPLETA: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(80));
      
      const structureQuery = `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;
      const structure = await pool.query(structureQuery, [tableName]);
      
      console.log('\n| # | Campo | Tipo | Longitud | Null | Default |');
      console.log('|---|-------|------|----------|------|---------|');
      structure.rows.forEach(col => {
        const length = col.character_maximum_length || '';
        const nullable = col.is_nullable === 'YES' ? 'Sí' : 'No';
        const defaultVal = col.column_default || '';
        console.log(`| ${col.ordinal_position} | ${col.column_name} | ${col.data_type} | ${length} | ${nullable} | ${defaultVal} |`);
      });

      // Contar registros totales
      const countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
      const count = await pool.query(countQuery);
      console.log(`\n📈 Total de registros: ${count.rows[0].total.toLocaleString()}`);
    }

    // 3. EJEMPLOS DE DATOS DE LA HUASTECA 11 NOVIEMBRE - TODOS LOS CAMPOS
    console.log('\n🔍 3. EJEMPLOS DE LA HUASTECA 11 NOVIEMBRE - TODOS LOS CAMPOS:');
    console.log('-'.repeat(80));
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      
      // Primero verificar si existe la columna nombre_normalizado
      const hasNormalizedName = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'nombre_normalizado'
      `, [tableName]);
      
      if (hasNormalizedName.rows.length > 0) {
        console.log(`\n📋 Datos de ${tableName} para La Huasteca 11 noviembre:`);
        
        const dataQuery = `
          SELECT * 
          FROM ${tableName} 
          WHERE nombre_normalizado = 'la-huasteca' 
            AND fecha_supervision = '2025-11-11'
          LIMIT 10;
        `;
        
        try {
          const data = await pool.query(dataQuery);
          
          if (data.rows.length > 0) {
            console.log(`\n✅ Encontrados ${data.rows.length} registros:`);
            
            data.rows.forEach((row, index) => {
              console.log(`\n--- REGISTRO ${index + 1} ---`);
              Object.keys(row).forEach(key => {
                const value = row[key] === null ? 'NULL' : row[key];
                console.log(`${key}: ${value}`);
              });
            });
          } else {
            console.log('❌ No se encontraron registros para La Huasteca 11 noviembre');
          }
        } catch (error) {
          console.log(`❌ Error consultando ${tableName}: ${error.message}`);
        }
      }
    }

    // 4. IDENTIFICAR PATRONES DE CALIFICACIÓN GENERAL
    console.log('\n🎯 4. ANÁLISIS DE PATRONES DE CALIFICACIÓN GENERAL:');
    console.log('-'.repeat(80));
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      console.log(`\n📊 Analizando ${tableName}:`);
      
      // Verificar registros con area_evaluacion vacío o null
      const emptyAreaQuery = `
        SELECT 
          COUNT(*) as total_sin_area,
          COUNT(DISTINCT location_name) as sucursales_sin_area,
          MIN(fecha_supervision) as fecha_min,
          MAX(fecha_supervision) as fecha_max
        FROM ${tableName}
        WHERE area_evaluacion IS NULL OR area_evaluacion = '' OR TRIM(area_evaluacion) = ''
      `;
      
      try {
        const emptyArea = await pool.query(emptyAreaQuery);
        const result = emptyArea.rows[0];
        
        console.log(`  • Registros sin área: ${result.total_sin_area}`);
        console.log(`  • Sucursales sin área: ${result.sucursales_sin_area}`);
        console.log(`  • Rango fechas: ${result.fecha_min} - ${result.fecha_max}`);
      } catch (error) {
        console.log(`  ❌ Error analizando áreas vacías: ${error.message}`);
      }
      
      // Verificar diferentes tipos de áreas
      const areasQuery = `
        SELECT 
          area_evaluacion,
          COUNT(*) as total_registros,
          COUNT(DISTINCT location_name) as sucursales,
          ROUND(AVG(porcentaje::numeric), 2) as promedio_porcentaje
        FROM ${tableName}
        WHERE area_evaluacion IS NOT NULL
        GROUP BY area_evaluacion
        ORDER BY total_registros DESC
        LIMIT 10;
      `;
      
      try {
        const areas = await pool.query(areasQuery);
        
        console.log(`\n  📋 Áreas de evaluación encontradas:`);
        areas.rows.forEach(area => {
          console.log(`    - "${area.area_evaluacion}": ${area.total_registros} registros, ${area.sucursales} sucursales, ${area.promedio_porcentaje}% promedio`);
        });
      } catch (error) {
        console.log(`  ❌ Error analizando áreas: ${error.message}`);
      }
    }

    console.log('\n✅ DIAGNÓSTICO COMPLETO FINALIZADO');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar diagnóstico
diagnoseDatabaseStructure().catch(console.error);