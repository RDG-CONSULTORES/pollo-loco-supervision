// =========================================
// TEST ESTRATEGIA HÍBRIDA INTELIGENTE
// Verificar que la nueva lógica funciona correctamente
// =========================================

const AnaIntelligent = require('./ana-intelligent');

// Create Ana instance for testing
const ana = new AnaIntelligent(null);

console.log('🧪 TESTING ESTRATEGIA HÍBRIDA INTELIGENTE\n');

const casosEstrategicos = [
  // === CONVERSIONES ÚNICAS (deben convertir directamente) ===
  {
    categoria: '✅ CONVERSIONES ÚNICAS',
    casos: [
      { input: 'como va tampico', expected: 'OCHTER TAMPICO' },
      { input: 'durango este trimestre', expected: 'PLOG LAGUNA' },
      { input: 'supervisiones sinaloa', expected: 'TEC' },
      { input: 'michoacan como va', expected: 'GRUPO CANTERA ROSA (MORELIA)' },
      { input: 'performance michoacán', expected: 'GRUPO CANTERA ROSA (MORELIA)' }
    ]
  },
  
  // === CONVERSIONES MÚLTIPLES (deben agregar contexto) ===
  {
    categoria: '🔄 UBICACIONES MÚLTIPLES',
    casos: [
      { input: 'como va reynosa', expected: 'reynosa (CRR y RAP)' },
      { input: 'supervisiones nuevo león', expected: 'nuevo león (10 grupos operativos)' },
      { input: 'tamaulipas este trimestre', expected: 'tamaulipas (8 grupos operativos)' },
      { input: 'coahuila ranking', expected: 'coahuila (3 grupos: PIEDRAS NEGRAS, SALTILLO, LAGUNA)' }
    ]
  },
  
  // === SUCURSALES ESPECÍFICAS ===
  {
    categoria: '🏪 SUCURSALES CORREGIDAS',
    casos: [
      { input: 'matamoros Q3', expected: 'Matamoros (TEPEYAC)' }, // Sucursal TEPEYAC en Monterrey
      { input: 'como va matamoros', expected: 'Matamoros (TEPEYAC)' }
    ]
  },
  
  // === CASOS EXISTENTES (deben seguir funcionando) ===
  {
    categoria: '🔄 CASOS EXISTENTES',
    casos: [
      { input: 'como va queretaro', expected: 'PLOG QUERETARO' },
      { input: 'morelia áreas críticas', expected: 'GRUPO CANTERA ROSA (MORELIA)' },
      { input: 'tepeyac este trimestre', expected: 'TEPEYAC Q3 2025' },
      { input: 'las quintas Q3', expected: '31 - Las Quintas Q3 2025' }
    ]
  }
];

let totalTests = 0;
let passedTests = 0;
const failedCases = [];

casosEstrategicos.forEach(categoria => {
  console.log(`📊 ${categoria.categoria}:`);
  
  categoria.casos.forEach((caso, i) => {
    totalTests++;
    console.log(`   ${i+1}. "${caso.input}"`);
    
    const processed = ana.preprocessQuestion(caso.input);
    console.log(`      → "${processed}"`);
    
    // Verificar si contiene lo esperado
    const containsExpected = processed.toLowerCase().includes(caso.expected.toLowerCase());
    
    if (containsExpected) {
      console.log(`      ✅ ÉXITO: Contiene "${caso.expected}"`);
      passedTests++;
    } else {
      console.log(`      ❌ FALLO: Esperaba "${caso.expected}"`);
      failedCases.push({
        input: caso.input,
        expected: caso.expected,
        got: processed,
        categoria: categoria.categoria
      });
    }
    console.log('');
  });
});

// Reporte final
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 REPORTE ESTRATEGIA HÍBRIDA:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Tests pasados: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
console.log(`❌ Tests fallados: ${totalTests - passedTests}/${totalTests} (${Math.round((totalTests - passedTests)/totalTests*100)}%)`);

if (failedCases.length > 0) {
  console.log('\n❌ CASOS FALLADOS:');
  failedCases.forEach(caso => {
    console.log(`   ${caso.categoria}: "${caso.input}"`);
    console.log(`      Esperado: "${caso.expected}"`);
    console.log(`      Obtenido: "${caso.got}"`);
  });
}

if (passedTests === totalTests) {
  console.log('\n🎉 ¡ESTRATEGIA HÍBRIDA FUNCIONANDO PERFECTAMENTE!');
  console.log('✅ Lista para Full Testing');
} else {
  console.log('\n⚠️  Estrategia necesita ajustes antes del Full Testing');
}

console.log('\n🚀 Próximo paso: Full Testing completo con la nueva lógica');