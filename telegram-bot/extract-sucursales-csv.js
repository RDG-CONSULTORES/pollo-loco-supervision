// =========================================
// EXTRACTOR DE SUCURSALES A CSV
// Desde supervision_operativa_clean
// =========================================

const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function extractToCSV() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: false
  });
  
  console.log('🔍 EXTRAYENDO DATOS DE SUCURSALES...\n');
  
  try {
    // Query para obtener datos únicos de cada sucursal
    const query = `
      SELECT DISTINCT 
        grupo_operativo_limpio as "Grupo Operativo",
        location_name as "Sucursal",
        estado_normalizado as "Estado",
        municipio as "Municipio"
      FROM supervision_operativa_clean
      WHERE grupo_operativo_limpio IS NOT NULL
        AND location_name IS NOT NULL
      ORDER BY 
        grupo_operativo_limpio,
        estado_normalizado,
        municipio,
        location_name
    `;
    
    console.log('📊 Ejecutando query...');
    const result = await pool.query(query);
    
    console.log(`✅ Encontradas: ${result.rows.length} sucursales únicas\n`);
    
    // Crear CSV header
    let csvContent = 'Grupo Operativo,Sucursal,Estado,Municipio\n';
    
    // Agregar filas
    result.rows.forEach(row => {
      // Escapar comas en los valores
      const grupo = row['Grupo Operativo'].replace(/,/g, ';');
      const sucursal = row['Sucursal'].replace(/,/g, ';');
      const estado = row['Estado'] || '';
      const municipio = row['Municipio'] || '';
      
      csvContent += `"${grupo}","${sucursal}","${estado}","${municipio}"\n`;
    });
    
    // Guardar archivo
    const fileName = 'sucursales-el-pollo-loco.csv';
    fs.writeFileSync(fileName, csvContent);
    
    console.log(`📁 Archivo guardado: ${fileName}`);
    
    // Estadísticas
    const stats = result.rows.reduce((acc, row) => {
      const grupo = row['Grupo Operativo'];
      if (!acc[grupo]) acc[grupo] = 0;
      acc[grupo]++;
      return acc;
    }, {});
    
    console.log('\n📊 RESUMEN POR GRUPO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([grupo, count]) => {
        console.log(`${grupo}: ${count} sucursales`);
      });
    
    // Resumen por estado
    const stateStats = result.rows.reduce((acc, row) => {
      const estado = row['Estado'] || 'No especificado';
      if (!acc[estado]) acc[estado] = 0;
      acc[estado]++;
      return acc;
    }, {});
    
    console.log('\n📍 RESUMEN POR ESTADO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.entries(stateStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([estado, count]) => {
        console.log(`${estado}: ${count} sucursales`);
      });
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

extractToCSV();