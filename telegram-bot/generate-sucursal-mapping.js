// =========================================
// GENERADOR DE MAPEO COMPLETO DE SUCURSALES
// Para detección sin número/prefijo
// =========================================

const fs = require('fs');
const csv = require('csv-parse/sync');

// Leer CSV
const csvContent = fs.readFileSync('sucursales-el-pollo-loco.csv', 'utf-8');
const records = csv.parse(csvContent, {
  columns: true,
  skip_empty_lines: true
});

// Generar mapeo
const sucursalMapping = {};

records.forEach(record => {
  const sucursalCompleta = record.Sucursal;
  
  // Extraer nombre limpio
  let nombreLimpio = sucursalCompleta;
  
  // Si tiene formato "XX - Nombre"
  if (sucursalCompleta.includes(' - ')) {
    nombreLimpio = sucursalCompleta.split(' - ')[1];
  } 
  // Si tiene formato "Sucursal XX - Nombre"
  else if (sucursalCompleta.startsWith('Sucursal ')) {
    nombreLimpio = sucursalCompleta.replace('Sucursal ', '').split(' - ')[1] || sucursalCompleta.replace('Sucursal ', '');
  }
  
  // Limpiar paréntesis y espacios extra
  nombreLimpio = nombreLimpio
    .replace(/\s*\([^)]*\)\s*/g, '') // Quitar paréntesis y contenido
    .trim()
    .toLowerCase();
  
  // Guardar mapeo
  if (nombreLimpio && !sucursalMapping[nombreLimpio]) {
    sucursalMapping[nombreLimpio] = sucursalCompleta;
  }
  
  // También mapear variaciones comunes
  // Ej: "harold r. pape" → "harold pape"
  const nombreSimplificado = nombreLimpio
    .replace(/\s+r\.\s+/g, ' ')
    .replace(/\s+u\.\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (nombreSimplificado !== nombreLimpio && !sucursalMapping[nombreSimplificado]) {
    sucursalMapping[nombreSimplificado] = sucursalCompleta;
  }
});

// Generar código JavaScript
console.log('// MAPEO COMPLETO DE SUCURSALES');
console.log(`// Total: ${Object.keys(sucursalMapping).length} sucursales mapeadas\n`);

console.log('const sucursalMapping = {');
Object.entries(sucursalMapping)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([key, value], index, array) => {
    const comma = index < array.length - 1 ? ',' : '';
    console.log(`  '${key}': '${value}'${comma}`);
  });
console.log('};\n');

// Mostrar ejemplos
console.log('// EJEMPLOS DE USO:');
console.log('// "triana" → "45 - Triana"');
console.log('// "senderos" → "44 - Senderos"');
console.log('// "harold pape" → "57 - Harold R. Pape"');
console.log('// "pino suarez" → "1 - Pino Suarez"');