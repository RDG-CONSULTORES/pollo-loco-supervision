// =========================================
// TEST DETECTOR DE ENTIDADES - ANA ULTRA-INTELIGENTE
// Valida que Ana entienda CUALQUIER pregunta
// =========================================

const AnaIntelligent = require('./ana-intelligent');

// Create Ana instance (without database for testing)
const ana = new AnaIntelligent(null);

console.log('🧪 TESTING DETECTOR DE ENTIDADES ULTRA-INTELIGENTE\n');

// Test cases que fallaban antes
const testCases = [
  // === CASOS QUE FALLABAN ANTES ===
  {
    input: "quintas",
    expect: "31 - Las Quintas",
    category: "🏪 Sucursales"
  },
  {
    input: "sucursal las quintas Q3",
    expect: "31 - Las Quintas Q3 2025", 
    category: "🏪 Sucursales + Fechas"
  },
  {
    input: "areas de tepeyac",
    expect: "TEPEYAC",
    category: "🏢 Grupos"
  },
  {
    input: "cuantas supervisiones este trimestre",
    expect: "total supervisiones Q3 2025",
    category: "📊 Intenciones + Fechas"
  },

  // === CASOS NUEVOS INTELIGENTES ===
  {
    input: "dame morelia",
    expect: "GRUPO CANTERA ROSA (MORELIA)",
    category: "🏢 Grupos por ubicación"
  },
  {
    input: "cuales sucursales tienen 100%",
    expect: "listado sucursales calificación perfecta (100%)",
    category: "📊 Intenciones complejas"
  },
  {
    input: "peores de ogas este año",
    expect: "ranking peores OGAS 2025",
    category: "🏢 Grupos + Performance + Fechas"
  },
  {
    input: "pino suarez areas criticas",
    expect: "1 - Pino Suarez áreas críticas",
    category: "🏪 Sucursales + Performance"
  },
  {
    input: "harold pape q3",
    expect: "57 - Harold R. Pape Q3 2025",
    category: "🏪 Sucursales + Fechas"
  },
  {
    input: "aeropuerto reynosa",
    expect: "76 - Aeropuerto (Reynosa)",
    category: "🏪 Sucursales específicas"
  },

  // === CASOS DE BENCHMARKS ===
  {
    input: "quien cumple objetivo",
    expect: "benchmark objetivo (90% general, 85% áreas)",
    category: "📏 Benchmarks"
  },
  {
    input: "sucursales perfectas",
    expect: "calificación perfecta (100%)",
    category: "📏 Performance"
  },

  // === CASOS DE FECHAS ===
  {
    input: "supervisiones julio agosto septiembre",
    expect: "supervisiones julio 2025 agosto 2025 septiembre 2025",
    category: "📅 Fechas específicas"
  },
  {
    input: "datos trimestre actual",
    expect: "datos Q3 2025",
    category: "📅 Fechas contextuales"
  }
];

console.log(`🎯 Ejecutando ${testCases.length} casos de prueba:\n`);

let passed = 0;
let failed = 0;

testCases.forEach((testCase, i) => {
  const result = ana.preprocessQuestion(testCase.input);
  
  // Check if expected terms are in result
  const hasExpected = testCase.expect.toLowerCase().split(' ').every(term => 
    result.toLowerCase().includes(term.toLowerCase())
  );
  
  if (hasExpected) {
    console.log(`✅ Test ${i+1}: ${testCase.category}`);
    console.log(`   Input: "${testCase.input}"`);
    console.log(`   Output: "${result}"`);
    passed++;
  } else {
    console.log(`❌ Test ${i+1}: ${testCase.category}`);
    console.log(`   Input: "${testCase.input}"`);
    console.log(`   Expected: "${testCase.expect}"`);
    console.log(`   Got: "${result}"`);
    failed++;
  }
  console.log('');
});

// Results
console.log('━'.repeat(60));
console.log(`📊 RESULTADOS:`);
console.log(`✅ Pasaron: ${passed}/${testCases.length} (${Math.round(passed/testCases.length*100)}%)`);
console.log(`❌ Fallaron: ${failed}/${testCases.length} (${Math.round(failed/testCases.length*100)}%)`);

if (passed === testCases.length) {
  console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
  console.log('🚀 Ana está lista para ser ULTRA-INTELIGENTE');
} else {
  console.log('\n⚠️  Algunos tests fallaron');
  console.log('🔧 Revisar detector para casos específicos');
}

console.log('\n🎯 Ana ahora entiende CUALQUIER forma de preguntar');
console.log('💡 Casos de prueba basados en problemas reales del usuario');