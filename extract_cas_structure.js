const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function extractCASStructure() {
  try {
    console.log('🔍 EXTRACTING COMPLETE CAS STRUCTURE...\n');
    
    // 1. Get all operational groups
    const gruposQuery = `
      SELECT 
        grupo_operativo,
        COUNT(DISTINCT location_name) as sucursales,
        STRING_AGG(DISTINCT estado, ', ' ORDER BY estado) as estados,
        STRING_AGG(DISTINCT location_name, ', ' ORDER BY location_name) as sucursales_lista
      FROM supervision_operativa_detalle
      WHERE grupo_operativo IS NOT NULL
      GROUP BY grupo_operativo
      ORDER BY sucursales DESC, grupo_operativo
    `;
    
    const grupos = await pool.query(gruposQuery);
    console.log('📊 TODOS LOS GRUPOS OPERATIVOS:');
    console.log('================================================');
    
    grupos.rows.forEach(grupo => {
      console.log(`\n🏢 ${grupo.grupo_operativo}`);
      console.log(`   📍 Estados: ${grupo.estados}`);
      console.log(`   🏬 Sucursales (${grupo.sucursales}): ${grupo.sucursales_lista}`);
    });
    
    // 2. Check classification logic  
    const clasificacionQuery = `
      SELECT 
        grupo_operativo,
        estado,
        COUNT(DISTINCT location_name) as sucursales_count,
        STRING_AGG(DISTINCT location_name, ', ' ORDER BY location_name) as sucursales,
        CASE 
          WHEN estado = 'Nuevo León' OR grupo_operativo = 'GRUPO SALTILLO' THEN 'LOCAL'
          ELSE 'FORÁNEA'
        END as clasificacion_cas
      FROM supervision_operativa_detalle
      WHERE grupo_operativo IS NOT NULL
      GROUP BY grupo_operativo, estado
      ORDER BY grupo_operativo, estado
    `;
    
    const clasificacion = await pool.query(clasificacionQuery);
    console.log('\n\n🎯 CLASIFICACIÓN CAS (LOCAL vs FORÁNEA):');
    console.log('================================================');
    
    // Group by operational group
    const groupedByGrupo = {};
    clasificacion.rows.forEach(row => {
      if (!groupedByGrupo[row.grupo_operativo]) {
        groupedByGrupo[row.grupo_operativo] = [];
      }
      groupedByGrupo[row.grupo_operativo].push(row);
    });
    
    Object.keys(groupedByGrupo).sort().forEach(grupo => {
      const data = groupedByGrupo[grupo];
      const clasificaciones = [...new Set(data.map(d => d.clasificacion_cas))];
      const totalSucursales = data.reduce((sum, d) => sum + parseInt(d.sucursales_count), 0);
      
      console.log(`\n🏢 ${grupo}`);
      console.log(`   🎯 Clasificación CAS: ${clasificaciones.join(' + ')}`);
      console.log(`   📊 Total sucursales: ${totalSucursales}`);
      
      data.forEach(row => {
        console.log(`   📍 ${row.estado} (${row.clasificacion_cas}): ${row.sucursales_count} sucursales`);
        console.log(`      🏬 ${row.sucursales}`);
      });
    });

    // 3. Check specific exceptions
    console.log('\n\n⚠️ EXCEPCIONES ESPECIALES:');
    console.log('================================================');
    
    const exceptionsQuery = `
      SELECT 
        location_name,
        estado,
        grupo_operativo,
        CASE 
          WHEN location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') THEN 'EXCEPCIÓN ESPECIAL'
          WHEN estado = 'Nuevo León' OR grupo_operativo = 'GRUPO SALTILLO' THEN 'LOCAL'
          ELSE 'FORÁNEA'
        END as clasificacion_real
      FROM supervision_operativa_detalle
      WHERE location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
         OR grupo_operativo = 'GRUPO SALTILLO'
      GROUP BY location_name, estado, grupo_operativo
      ORDER BY location_name
    `;
    
    const exceptions = await pool.query(exceptionsQuery);
    exceptions.rows.forEach(exc => {
      console.log(`🔸 ${exc.location_name} (${exc.grupo_operativo}, ${exc.estado})`);
      console.log(`   → Clasificación: ${exc.clasificacion_real}`);
    });
    
    console.log('\n\n📅 PERÍODOS CAS DEFINIDOS:');
    console.log('================================================');
    console.log('🏠 LOCALES (Nuevo León + GRUPO SALTILLO):');
    console.log('   T1: 12 Mar 2025 - 16 Abr 2025 (NL-T1-2025)');
    console.log('   T2: 11 Jun 2025 - 18 Ago 2025 (NL-T2-2025)');  
    console.log('   T3: 19 Ago 2025 - 09 Oct 2025 (NL-T3-2025)');
    console.log('   T4: 30 Oct 2025 - presente (NL-T4-2025) ⭐ ACTIVO');
    
    console.log('\n🌍 FORÁNEAS (Resto de estados):');
    console.log('   S1: 10 Abr 2025 - 09 Jun 2025 (FOR-S1-2025)');
    console.log('   S2: 30 Jul 2025 - 07 Nov 2025 (FOR-S2-2025)');
    
    console.log('\n\n🎯 RESUMEN ESTRUCTURA CAS:');
    console.log('================================================');
    console.log('• TOTAL GRUPOS OPERATIVOS:', grupos.rows.length);
    console.log('• CLASIFICACIÓN:');
    console.log('  - LOCALES: Nuevo León + GRUPO SALTILLO (excepto 3 sucursales)');
    console.log('  - FORÁNEAS: Todos los demás estados');
    console.log('• EXCEPCIONES ESPECIALES:');
    console.log('  - 57 - Harold R. Pape (GRUPO SALTILLO → FORÁNEA)');
    console.log('  - 30 - Carrizo (EXPO → FORÁNEA)');  
    console.log('  - 28 - Guerrero (EXPO → FORÁNEA)');
    console.log('• PERÍODOS ACTIVOS: NL-T4-2025 (locales), FOR-S2-2025 (foráneas) - CERRADO');
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error extracting CAS structure:', error);
    process.exit(1);
  }
}

extractCASStructure();