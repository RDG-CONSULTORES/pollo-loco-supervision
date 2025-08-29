// =========================================
// DISCOVERY AUTOMÁTICO - ANA TESTING EXHAUSTIVO
// Extrae todas las entidades reales del sistema
// =========================================

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function discoverAllEntities() {
  // Conexión directa para testing
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: false  // Sin SSL para testing local
  });
  
  console.log('🔍 DISCOVERY: Extrayendo todas las entidades del sistema...\n');
  
  try {
    // 1. GRUPOS OPERATIVOS REALES
    console.log('📊 Grupos Operativos:');
    const gruposQuery = `
      SELECT DISTINCT grupo_operativo_limpio 
      FROM supervision_operativa_clean 
      WHERE grupo_operativo_limpio IS NOT NULL 
      ORDER BY grupo_operativo_limpio
    `;
    const grupos = await pool.query(gruposQuery);
    console.log(`✅ Encontrados: ${grupos.rows.length} grupos`);
    grupos.rows.forEach((g, i) => console.log(`   ${i+1}. ${g.grupo_operativo_limpio}`));
    
    // 2. SUCURSALES REALES
    console.log('\n🏪 Sucursales:');
    const sucursalesQuery = `
      SELECT DISTINCT location_name 
      FROM supervision_operativa_clean 
      WHERE location_name IS NOT NULL 
      ORDER BY location_name
    `;
    const sucursales = await pool.query(sucursalesQuery);
    console.log(`✅ Encontradas: ${sucursales.rows.length} sucursales`);
    console.log('   Primeras 10:');
    sucursales.rows.slice(0, 10).forEach((s, i) => console.log(`   ${i+1}. ${s.location_name}`));
    if (sucursales.rows.length > 10) {
      console.log(`   ... y ${sucursales.rows.length - 10} más`);
    }
    
    // 3. ESTADOS REALES
    console.log('\n🗺️  Estados:');
    const estadosQuery = `
      SELECT DISTINCT estado_normalizado, COUNT(*) as supervisiones
      FROM supervision_operativa_clean 
      WHERE estado_normalizado IS NOT NULL 
      GROUP BY estado_normalizado 
      ORDER BY estado_normalizado
    `;
    const estados = await pool.query(estadosQuery);
    console.log(`✅ Encontrados: ${estados.rows.length} estados`);
    estados.rows.forEach((e, i) => console.log(`   ${i+1}. ${e.estado_normalizado} (${e.supervisiones} supervisiones)`));
    
    // 4. DATOS POR TRIMESTRE
    console.log('\n📅 Disponibilidad por Trimestre:');
    const trimestresQuery = `
      SELECT EXTRACT(QUARTER FROM fecha_supervision) as trimestre, 
             COUNT(*) as total_supervisiones,
             COUNT(DISTINCT location_name) as sucursales_distintas,
             COUNT(DISTINCT grupo_operativo_limpio) as grupos_distintos
      FROM supervision_operativa_clean 
      WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025
      GROUP BY EXTRACT(QUARTER FROM fecha_supervision) 
      ORDER BY trimestre
    `;
    const trimestres = await pool.query(trimestresQuery);
    trimestres.rows.forEach(t => {
      console.log(`   Q${t.trimestre} 2025: ${t.total_supervisiones} supervisiones, ${t.sucursales_distintas} sucursales, ${t.grupos_distintos} grupos`);
    });
    
    // 5. TOP PERFORMERS Y BOTTOM PERFORMERS PARA SAMPLE
    console.log('\n🏆 Top 5 Grupos (para sample testing):');
    const topGruposQuery = `
      SELECT grupo_operativo_limpio, 
             ROUND(AVG(porcentaje), 2) as promedio,
             COUNT(*) as evaluaciones
      FROM supervision_operativa_clean 
      WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
        AND EXTRACT(QUARTER FROM fecha_supervision) = 3
        AND porcentaje IS NOT NULL
      GROUP BY grupo_operativo_limpio 
      ORDER BY promedio DESC 
      LIMIT 5
    `;
    const topGrupos = await pool.query(topGruposQuery);
    topGrupos.rows.forEach((g, i) => console.log(`   ${i+1}. ${g.grupo_operativo_limpio}: ${g.promedio}% (${g.evaluaciones} eval)`));
    
    // 6. SAMPLE DE SUCURSALES DIVERSO
    console.log('\n🎯 Sample Sucursales (representativo):');
    const sampleSucursalesQuery = `
      SELECT DISTINCT s.location_name, s.grupo_operativo_limpio, s.estado_normalizado
      FROM supervision_operativa_clean s
      WHERE s.location_name IN (
        SELECT location_name 
        FROM supervision_operativa_clean 
        WHERE location_name ILIKE '%quintas%' 
           OR location_name ILIKE '%pino%suarez%'
           OR location_name ILIKE '%harold%pape%' 
           OR location_name ILIKE '%aeropuerto%'
           OR location_name ILIKE '%centro%'
           OR location_name ILIKE '%plaza%'
           OR location_name ILIKE '%norte%'
           OR location_name ILIKE '%sur%'
        LIMIT 10
      )
      ORDER BY s.location_name
    `;
    const sampleSucursales = await pool.query(sampleSucursalesQuery);
    sampleSucursales.rows.forEach((s, i) => console.log(`   ${i+1}. ${s.location_name} (${s.grupo_operativo_limpio}, ${s.estado_normalizado})`));
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RESUMEN DISCOVERY:');
    console.log(`✅ Grupos Operativos: ${grupos.rows.length}`);
    console.log(`✅ Sucursales: ${sucursales.rows.length}`);
    console.log(`✅ Estados: ${estados.rows.length}`);
    console.log(`✅ Trimestres con datos: ${trimestres.rows.length}`);
    
    // Retornar datos para testing
    return {
      grupos: grupos.rows.map(g => g.grupo_operativo_limpio),
      sucursales: sucursales.rows.map(s => s.location_name),
      estados: estados.rows.map(e => e.estado_normalizado),
      trimestres: trimestres.rows,
      topGrupos: topGrupos.rows.map(g => g.grupo_operativo_limpio),
      sampleSucursales: sampleSucursales.rows.map(s => s.location_name)
    };
    
  } catch (error) {
    console.error('❌ Error en discovery:', error.message);
    return null;
  } finally {
    await pool.end();
  }
}

// Ejecutar discovery
if (require.main === module) {
  discoverAllEntities()
    .then(data => {
      if (data) {
        console.log('\n🎯 Discovery completado exitosamente!');
        console.log('📊 Datos listos para sample testing');
      }
    })
    .catch(error => {
      console.error('❌ Error ejecutando discovery:', error);
      process.exit(1);
    });
}

module.exports = { discoverAllEntities };