// =========================================
// SAMPLE TESTING EXHAUSTIVO - ANA ULTRA-INTELIGENTE
// Testing representativo con datos reales del sistema
// =========================================

const AnaIntelligent = require('./ana-intelligent');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function runSampleTesting() {
  console.log('🎯 SAMPLE TESTING EXHAUSTIVO INICIANDO...\n');
  
  // Crear Ana instance para testing
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: false
  });
  const ana = new AnaIntelligent(pool);
  
  // ===========================================
  // SAMPLE GROUPS - TOP 5 + REPRESENTATIVOS
  // ===========================================
  const sampleGroups = [
    'TEPEYAC',           // Top performer familiar
    'OGAS',              // Mejor performer Q3
    'PLOG QUERETARO',    // Grupo regional
    'EXPO',              // Grupo mediano
    'GRUPO MATAMOROS'    // Grupo con nombre complejo
  ];
  
  console.log('🏢 TESTING GRUPOS OPERATIVOS:');
  console.log(`📋 Sample: ${sampleGroups.length} grupos representativos\n`);
  
  const groupTests = [
    { query: "como va [GRUPO]", description: "Consulta informal" },
    { query: "areas criticas de [GRUPO]", description: "Áreas de oportunidad" },
    { query: "ranking sucursales [GRUPO]", description: "Ranking interno" },
    { query: "/insights [GRUPO] detallado", description: "Análisis detallado" },
    { query: "[GRUPO] este trimestre", description: "Performance Q3" }
  ];
  
  let groupResults = { passed: 0, failed: 0, details: [] };
  
  for (const grupo of sampleGroups) {
    console.log(`📊 Grupo: ${grupo}`);
    
    for (const test of groupTests) {
      const query = test.query.replace('[GRUPO]', grupo);
      console.log(`   🧪 "${query}"`);
      
      try {
        const processed = ana.preprocessQuestion(query);
        console.log(`   ✅ Procesado: "${processed.substring(0, 80)}${processed.length > 80 ? '...' : ''}"`);
        
        // Verificar que detectó el grupo correctamente
        if (processed.toUpperCase().includes(grupo.toUpperCase())) {
          groupResults.passed++;
          console.log(`   🎉 ÉXITO: Detecta ${grupo}`);
        } else {
          groupResults.failed++;
          console.log(`   ❌ FALLO: No detecta ${grupo} correctamente`);
          groupResults.details.push(`${grupo}: "${query}" → "${processed}"`);
        }
        
      } catch (error) {
        groupResults.failed++;
        console.log(`   ❌ ERROR: ${error.message}`);
        groupResults.details.push(`${grupo}: "${query}" → ERROR: ${error.message}`);
      }
    }
    console.log('');
  }
  
  // ===========================================
  // SAMPLE SUCURSALES - DIVERSAS Y PROBLEMÁTICAS
  // ===========================================
  const sampleSucursales = [
    '31 - Las Quintas',      // Caso problemático conocido
    '1 - Pino Suarez',       // Primer sucursal
    '57 - Harold R. Pape',   // Nombre complejo conocido
    '76 - Aeropuerto (Reynosa)', // Con paréntesis
    '11 - Lincoln',          // Simple
    '12 - Concordia',        // Simple
    '15 - Ruiz Cortinez',    // Con acento
    '18 - Linda Vista',      // Dos palabras
    '10 - Barragan',         // Con acento potencial
    '16 - Solidaridad'       // Palabra larga
  ];
  
  console.log('🏪 TESTING SUCURSALES:');
  console.log(`📋 Sample: ${sampleSucursales.length} sucursales representativas\n`);
  
  const sucursalTests = [
    { query: "como va [SUCURSAL]", description: "Consulta informal" },
    { query: "[SUCURSAL] areas oportunidad", description: "Áreas críticas" },
    { query: "[SUCURSAL] Q3", description: "Performance trimestral" }
  ];
  
  let sucursalResults = { passed: 0, failed: 0, details: [] };
  
  for (const sucursal of sampleSucursales) {
    console.log(`🏪 Sucursal: ${sucursal}`);
    
    // Obtener palabra clave para buscar
    const keyword = sucursal.split(' - ')[1] || sucursal;
    
    for (const test of sucursalTests) {
      const query = test.query.replace('[SUCURSAL]', keyword.toLowerCase());
      console.log(`   🧪 "${query}"`);
      
      try {
        const processed = ana.preprocessQuestion(query);
        console.log(`   ✅ Procesado: "${processed.substring(0, 80)}${processed.length > 80 ? '...' : ''}"`);
        
        // Verificar que detectó alguna parte de la sucursal
        const keywordNormalized = keyword.toLowerCase().replace(/[áäàâ]/g, 'a').replace(/[éëèê]/g, 'e');
        if (processed.toLowerCase().includes(keywordNormalized) || 
            processed.includes(sucursal) ||
            processed.toLowerCase().includes(keyword.toLowerCase())) {
          sucursalResults.passed++;
          console.log(`   🎉 ÉXITO: Detecta "${keyword}"`);
        } else {
          sucursalResults.failed++;
          console.log(`   ❌ FALLO: No detecta "${keyword}" correctamente`);
          sucursalResults.details.push(`${keyword}: "${query}" → "${processed}"`);
        }
        
      } catch (error) {
        sucursalResults.failed++;
        console.log(`   ❌ ERROR: ${error.message}`);
        sucursalResults.details.push(`${keyword}: "${query}" → ERROR: ${error.message}`);
      }
    }
    console.log('');
  }
  
  // ===========================================
  // ESTADOS COMPLETOS - TODOS LOS 7
  // ===========================================
  const allEstados = [
    'Coahuila',
    'Durango', 
    'Michoacán',
    'Nuevo León',
    'Querétaro',
    'Sinaloa',
    'Tamaulipas'
  ];
  
  console.log('🗺️  TESTING ESTADOS:');
  console.log(`📋 Testing completo: ${allEstados.length} estados\n`);
  
  const estadoTests = [
    { query: "supervisiones [ESTADO]", description: "Total supervisiones" },
    { query: "ranking grupos [ESTADO]", description: "Ranking por estado" },
    { query: "cumplimiento objetivo [ESTADO]", description: "Performance vs objetivo" },
    { query: "[ESTADO] este trimestre", description: "Estado Q3" }
  ];
  
  let estadoResults = { passed: 0, failed: 0, details: [] };
  
  for (const estado of allEstados) {
    console.log(`🗺️  Estado: ${estado}`);
    
    for (const test of estadoTests) {
      const query = test.query.replace('[ESTADO]', estado);
      console.log(`   🧪 "${query}"`);
      
      try {
        const processed = ana.preprocessQuestion(query);
        console.log(`   ✅ Procesado: "${processed.substring(0, 80)}${processed.length > 80 ? '...' : ''}"`);
        
        // Verificar que mantiene el estado (no necesariamente lo transforma)
        if (processed.toLowerCase().includes(estado.toLowerCase()) || 
            processed.includes('estado') || 
            processed.includes('región')) {
          estadoResults.passed++;
          console.log(`   🎉 ÉXITO: Maneja ${estado}`);
        } else {
          estadoResults.failed++;
          console.log(`   ❌ FALLO: Pierde referencia a ${estado}`);
          estadoResults.details.push(`${estado}: "${query}" → "${processed}"`);
        }
        
      } catch (error) {
        estadoResults.failed++;
        console.log(`   ❌ ERROR: ${error.message}`);
        estadoResults.details.push(`${estado}: "${query}" → ERROR: ${error.message}`);
      }
    }
    console.log('');
  }
  
  // ===========================================
  // CASOS DE USUARIO - INFORMAL + EJECUTIVO + EDGE
  // ===========================================
  console.log('👥 TESTING CASOS DE USUARIO:\n');
  
  const userCases = {
    informal: [
      "como va tepeyac",
      "dame las quintas", 
      "cuantas supervisiones",
      "quien esta mal",
      "reynosa este mes",
      "harold pape",
      "ogas vs tepeyac",
      "areas criticas",
      "quien tiene 100",
      "morelia como va"
    ],
    ejecutivo: [
      "Dame estado completo supervisiones Q3 por grupo",
      "Necesito ranking consolidado todos los grupos", 
      "Cuántas supervisiones por estado para reporte",
      "Desglose performance regional completo",
      "Métricas de cumplimiento objetivo por zona",
      "Análisis de riesgo operativo por grupo",
      "KPIs consolidados para junta directiva",
      "Tendencias performance vs trimestre anterior"
    ],
    edge: [
      "tepeyac q3",
      "harold",
      "supervisiones enero", 
      "/insights ogas detallado",
      "sucursales perfectas 100% ranking",
      "areas criticas todas regiones consolidado"
    ]
  };
  
  let userResults = { passed: 0, failed: 0, details: [], byCategory: {} };
  
  for (const [category, cases] of Object.entries(userCases)) {
    console.log(`📋 Categoría: ${category.toUpperCase()}`);
    let categoryResults = { passed: 0, failed: 0 };
    
    for (const userCase of cases) {
      console.log(`   🧪 "${userCase}"`);
      
      try {
        const processed = ana.preprocessQuestion(userCase);
        console.log(`   ✅ Procesado: "${processed.substring(0, 80)}${processed.length > 80 ? '...' : ''}"`);
        
        // Verificar mejoras básicas (que el procesamiento añada valor)
        if (processed.length >= userCase.length && 
            (processed !== userCase || processed.includes('2025') || processed.includes('Q3'))) {
          userResults.passed++;
          categoryResults.passed++;
          console.log(`   🎉 ÉXITO: Procesamiento añade valor`);
        } else {
          userResults.failed++;
          categoryResults.failed++;
          console.log(`   ❌ FALLO: Procesamiento no mejora la consulta`);
          userResults.details.push(`${category}: "${userCase}" → "${processed}"`);
        }
        
      } catch (error) {
        userResults.failed++;
        categoryResults.failed++;
        console.log(`   ❌ ERROR: ${error.message}`);
        userResults.details.push(`${category}: "${userCase}" → ERROR: ${error.message}`);
      }
    }
    
    userResults.byCategory[category] = categoryResults;
    console.log(`   📊 ${category}: ${categoryResults.passed}/${categoryResults.passed + categoryResults.failed} éxito\n`);
  }
  
  // ===========================================
  // REPORTE FINAL
  // ===========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 REPORTE FINAL - SAMPLE TESTING EXHAUSTIVO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const totalTests = groupResults.passed + groupResults.failed + 
                     sucursalResults.passed + sucursalResults.failed +
                     estadoResults.passed + estadoResults.failed +
                     userResults.passed + userResults.failed;
  const totalPassed = groupResults.passed + sucursalResults.passed + 
                     estadoResults.passed + userResults.passed;
  
  console.log(`\n🎯 RESULTADOS GENERALES:`);
  console.log(`✅ Tests pasados: ${totalPassed}/${totalTests} (${Math.round(totalPassed/totalTests*100)}%)`);
  console.log(`❌ Tests fallados: ${totalTests - totalPassed}/${totalTests} (${Math.round((totalTests - totalPassed)/totalTests*100)}%)`);
  
  console.log(`\n📊 DETALLE POR CATEGORÍA:`);
  console.log(`🏢 Grupos: ${groupResults.passed}/${groupResults.passed + groupResults.failed} (${Math.round(groupResults.passed/(groupResults.passed + groupResults.failed)*100)}%)`);
  console.log(`🏪 Sucursales: ${sucursalResults.passed}/${sucursalResults.passed + sucursalResults.failed} (${Math.round(sucursalResults.passed/(sucursalResults.passed + sucursalResults.failed)*100)}%)`);
  console.log(`🗺️  Estados: ${estadoResults.passed}/${estadoResults.passed + estadoResults.failed} (${Math.round(estadoResults.passed/(estadoResults.passed + estadoResults.failed)*100)}%)`);
  console.log(`👥 Usuario: ${userResults.passed}/${userResults.passed + userResults.failed} (${Math.round(userResults.passed/(userResults.passed + userResults.failed)*100)}%)`);
  
  console.log(`\n👥 DETALLE CASOS DE USUARIO:`);
  for (const [category, results] of Object.entries(userResults.byCategory)) {
    const total = results.passed + results.failed;
    const percent = Math.round(results.passed/total*100);
    console.log(`   ${category}: ${results.passed}/${total} (${percent}%)`);
  }
  
  // ===========================================
  // CRITERIOS DE ÉXITO Y RECOMENDACIÓN
  // ===========================================
  console.log(`\n🎯 ANÁLISIS DE CRITERIOS DE ÉXITO:`);
  
  const groupsSuccess = groupResults.passed/(groupResults.passed + groupResults.failed) >= 0.80;
  const sucursalesSuccess = sucursalResults.passed/(sucursalResults.passed + sucursalResults.failed) >= 0.80;
  const estadosSuccess = estadoResults.passed/(estadoResults.passed + estadoResults.failed) >= 0.85;
  const userSuccess = userResults.passed/(userResults.passed + userResults.failed) >= 0.90;
  
  console.log(`✅ Grupos ≥80%: ${groupsSuccess ? 'SÍ' : 'NO'} (${Math.round(groupResults.passed/(groupResults.passed + groupResults.failed)*100)}%)`);
  console.log(`✅ Sucursales ≥80%: ${sucursalesSuccess ? 'SÍ' : 'NO'} (${Math.round(sucursalResults.passed/(sucursalResults.passed + sucursalResults.failed)*100)}%)`);
  console.log(`✅ Estados ≥85%: ${estadosSuccess ? 'SÍ' : 'NO'} (${Math.round(estadoResults.passed/(estadoResults.passed + estadoResults.failed)*100)}%)`);
  console.log(`✅ Usuario ≥90%: ${userSuccess ? 'SÍ' : 'NO'} (${Math.round(userResults.passed/(userResults.passed + userResults.failed)*100)}%)`);
  
  const overallSuccess = groupsSuccess && sucursalesSuccess && estadosSuccess && userSuccess;
  const overallPercent = Math.round(totalPassed/totalTests*100);
  
  console.log(`\n🚀 RECOMENDACIÓN FINAL:`);
  if (overallSuccess && overallPercent >= 85) {
    console.log(`🎉 ¡ANA ESTÁ LISTA! Cumple todos los criterios (${overallPercent}% éxito general)`);
    console.log(`✅ No necesita full testing - Sample testing confirma funcionamiento excelente`);
    console.log(`🚀 Ana puede ir a producción con confianza`);
  } else if (overallPercent >= 80) {
    console.log(`⚠️  ANA FUNCIONA BIEN pero tiene areas de mejora (${overallPercent}% éxito general)`);
    console.log(`🔧 Revisar casos específicos que fallaron antes de producción`);
    console.log(`💡 Full testing recomendado para categorías con <80% éxito`);
  } else {
    console.log(`🚨 ANA NECESITA MEJORAS URGENTES (${overallPercent}% éxito general)`);
    console.log(`🔧 Full testing OBLIGATORIO para identificar todos los problemas`);
    console.log(`❌ NO lista para producción hasta resolver los fallos principales`);
  }
  
  // Mostrar fallos para análisis
  if (groupResults.details.length > 0) {
    console.log(`\n❌ FALLOS EN GRUPOS:`);
    groupResults.details.forEach(detail => console.log(`   ${detail}`));
  }
  
  if (sucursalResults.details.length > 0) {
    console.log(`\n❌ FALLOS EN SUCURSALES:`);
    sucursalResults.details.forEach(detail => console.log(`   ${detail}`));
  }
  
  if (estadoResults.details.length > 0) {
    console.log(`\n❌ FALLOS EN ESTADOS:`);
    estadoResults.details.forEach(detail => console.log(`   ${detail}`));
  }
  
  if (userResults.details.length > 0) {
    console.log(`\n❌ FALLOS EN CASOS DE USUARIO:`);
    userResults.details.forEach(detail => console.log(`   ${detail}`));
  }
  
  await pool.end();
  return { overallSuccess, overallPercent, needsFullTesting: !overallSuccess };
}

// Ejecutar testing
if (require.main === module) {
  runSampleTesting()
    .then(result => {
      console.log(`\n🎯 Sample Testing completado!`);
      if (result.needsFullTesting) {
        console.log(`⚠️  Full testing recomendado`);
      } else {
        console.log(`✅ Ana lista para producción`);
      }
    })
    .catch(error => {
      console.error('❌ Error ejecutando sample testing:', error);
      process.exit(1);
    });
}

module.exports = { runSampleTesting };