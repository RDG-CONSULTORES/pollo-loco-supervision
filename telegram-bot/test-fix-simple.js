// =========================================
// TEST FIX SIMPLE - 2 CAMBIOS ÚNICOS
// 1. OCHTER/TAMPICO mapping
// 2. Respuestas más cortas
// =========================================

const AnaIntelligent = require('./ana-intelligent');

// Create Ana instance for testing
const ana = new AnaIntelligent(null);

console.log('⚡ TEST FIX SIMPLE - 2 CAMBIOS ÚNICOS\n');

// === TEST 1: OCHTER/TAMPICO MAPPING ===
console.log('🔧 TEST 1: OCHTER/TAMPICO MAPPING');

const tampicoCases = [
  'como va tampico',
  'tampico este trimestre', 
  'ochter performance',
  'dame las calificaciones de ochter',
  'grupo ochter tampico'
];

tampicoCases.forEach((caso, i) => {
  console.log(`${i+1}. "${caso}"`);
  const processed = ana.preprocessQuestion(caso);
  console.log(`   → "${processed}"`);
  
  // Verificar que detecta OCHTER TAMPICO
  if (processed.includes('OCHTER TAMPICO')) {
    console.log('   ✅ DETECTA: OCHTER TAMPICO');
  } else {
    console.log('   ❌ NO DETECTA: OCHTER TAMPICO');
  }
  console.log('');
});

// === VERIFICACIÓN DE NO-REGRESIÓN ===
console.log('🔍 VERIFICACIÓN: CASOS EXISTENTES NO AFECTADOS');

const casosExistentes = [
  'como va tepeyac',
  'las quintas Q3',
  'ogas performance', 
  'reynosa grupos'
];

casosExistentes.forEach((caso, i) => {
  console.log(`${i+1}. "${caso}"`);
  const processed = ana.preprocessQuestion(caso);
  console.log(`   → "${processed}"`);
  
  // Verificar que siguen funcionando
  let works = false;
  if (caso.includes('tepeyac') && processed.includes('TEPEYAC')) works = true;
  if (caso.includes('quintas') && processed.includes('31 - Las Quintas')) works = true; 
  if (caso.includes('ogas') && processed.includes('OGAS')) works = true;
  if (caso.includes('reynosa') && processed.includes('reynosa (CRR y RAP)')) works = true;
  
  console.log(`   ${works ? '✅' : '❌'} ${works ? 'Funcionando' : 'Regresión'}`);
  console.log('');
});

// === REPORTE FINAL ===
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 REPORTE FIX SIMPLE:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n🔧 CAMBIOS APLICADOS:');
console.log('✅ 1. Mapping OCHTER/TAMPICO agregado');
console.log('✅ 2. Prompt "MÁXIMO 5 LÍNEAS" reforzado');

console.log('\n🎯 OBJETIVO:');
console.log('• Respuestas cortas y directas');
console.log('• OCHTER detectado correctamente');
console.log('• Casos existentes funcionando');

console.log('\n🚀 PRÓXIMO: Testing con usuario real');
console.log('Ana debería dar respuestas más cortas ahora');