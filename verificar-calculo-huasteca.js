const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function verificarCalculoHuasteca() {
  try {
    console.log('🧮 VERIFICACIÓN EXACTA DEL CÁLCULO - LA HUASTECA\n');
    
    // Datos encontrados en el análisis anterior
    const puntosObtenidos = 110;
    const puntosMaximos = 124;
    const porcentajeRegistrado = 88.71;
    
    console.log('📊 DATOS IDENTIFICADOS:');
    console.log(`  Puntos Obtenidos: ${puntosObtenidos}`);
    console.log(`  Puntos Máximos: ${puntosMaximos}`);
    console.log(`  Porcentaje Registrado: ${porcentajeRegistrado}%\n`);
    
    // Verificación del cálculo por puntos
    console.log('🔢 VERIFICACIÓN CÁLCULO POR PUNTOS:');
    const porcentajeCalculadoPuntos = (puntosObtenidos / puntosMaximos * 100);
    console.log(`  Cálculo: ${puntosObtenidos} ÷ ${puntosMaximos} × 100 = ${porcentajeCalculadoPuntos.toFixed(2)}%`);
    
    const diferenciaPuntos = Math.abs(porcentajeCalculadoPuntos - porcentajeRegistrado);
    console.log(`  Diferencia con registrado: ${diferenciaPuntos.toFixed(2)}%`);
    
    if (diferenciaPuntos < 0.01) {
      console.log('  ✅ EXACTO: Se usa suma de puntos');
    } else if (diferenciaPuntos < 0.1) {
      console.log('  ✅ MUY CERCANO: Se usa suma de puntos con redondeo');
    } else {
      console.log('  ❌ NO COINCIDE: No se usa suma directa de puntos');
    }
    
    // Verificación del cálculo por promedio de áreas
    console.log('\n📊 VERIFICACIÓN CÁLCULO POR PROMEDIO DE ÁREAS:');
    
    // Datos del análisis anterior
    const areas = [
      { nombre: 'ALMACEN GENERAL', porcentaje: 100.00 },
      { nombre: 'ALMACEN JARABES', porcentaje: 100.00 },
      { nombre: 'AREA COCINA FRIA/CALIENTE CALIFICACIÓN', porcentaje: 100.00 },
      { nombre: 'ASADORES', porcentaje: 100.00 },
      { nombre: 'AVISO DE FUNCIONAMIENTO, BITACORAS, CARPETA DE FUMIGACION CONTROL', porcentaje: 100.00 },
      { nombre: 'Area Marinado Calificación Porcentaje %', porcentaje: 100.00 },
      { nombre: 'BARRA DE SALSAS', porcentaje: 100.00 },
      { nombre: 'BARRA DE SERVICIO', porcentaje: 100.00 },
      { nombre: 'BAÑO CLIENTES', porcentaje: 75.00 },
      { nombre: 'COMEDOR AREA COMEDOR', porcentaje: 100.00 },
      { nombre: 'CONGELADOR PAPA', porcentaje: 100.00 },
      { nombre: 'CONSERVADOR PAPA FRITA', porcentaje: 62.50 },
      { nombre: 'CUARTO FRIO 1 CALIFICACION', porcentaje: 100.00 },
      { nombre: 'DISPENSADOR DE REFRESCOS', porcentaje: 100.00 },
      { nombre: 'ESTACION DE LAVADO DE MANOS CALIFICACION %', porcentaje: 100.00 },
      { nombre: 'EXTERIOR SUCURSAL', porcentaje: 66.67 },
      { nombre: 'FREIDORA DE PAPA', porcentaje: 66.67 },
      { nombre: 'HORNOS', porcentaje: 81.82 },
      { nombre: 'MAQUINA DE HIELO', porcentaje: 50.00 },
      { nombre: 'PROCESO MARINADO CALIFICACION', porcentaje: 92.86 },
      { nombre: 'REFRIGERADORES DE SERVICIO', porcentaje: 83.33 },
      { nombre: 'TIEMPOS DE SERVICIO', porcentaje: 100.00 }
    ];
    
    const sumaPorcentajes = areas.reduce((sum, area) => sum + area.porcentaje, 0);
    const promedioAreas = sumaPorcentajes / areas.length;
    
    console.log(`  Total áreas: ${areas.length}`);
    console.log(`  Suma porcentajes: ${sumaPorcentajes.toFixed(2)}%`);
    console.log(`  Promedio: ${promedioAreas.toFixed(2)}%`);
    
    const diferenciaPromedio = Math.abs(promedioAreas - porcentajeRegistrado);
    console.log(`  Diferencia con registrado: ${diferenciaPromedio.toFixed(2)}%`);
    
    if (diferenciaPromedio < 0.01) {
      console.log('  ✅ EXACTO: Se usa promedio de áreas');
    } else if (diferenciaPromedio < 1.5) {
      console.log('  ⚠️  CERCANO: Se usa promedio de áreas con algún ajuste');
    } else {
      console.log('  ❌ NO COINCIDE: No se usa promedio simple de áreas');
    }
    
    // Investigar otros métodos posibles
    console.log('\n🔍 INVESTIGANDO MÉTODOS ALTERNATIVOS:\n');
    
    // Método 1: Promedio ponderado por puntos máximos por área
    console.log('Método 1: Promedio ponderado por puntos máximos');
    console.log('  (Necesitaríamos puntos máximos por área específica)');
    
    // Método 2: Exclusión de ciertas áreas
    const areasCriticas = areas.filter(area => area.porcentaje < 100);
    console.log(`\nMétodo 2: Solo áreas críticas (${areasCriticas.length} áreas)`);
    const sumaCriticas = areasCriticas.reduce((sum, area) => sum + area.porcentaje, 0);
    const promedioCriticas = sumaCriticas / areasCriticas.length;
    console.log(`  Promedio áreas críticas: ${promedioCriticas.toFixed(2)}%`);
    
    // Método 3: Factor de corrección específico de Zenput
    console.log('\nMétodo 3: Factor de corrección');
    const factorCorreccion = porcentajeRegistrado / promedioAreas;
    console.log(`  Factor de corrección necesario: ${factorCorreccion.toFixed(4)}`);
    console.log(`  (${promedioAreas.toFixed(2)}% × ${factorCorreccion.toFixed(4)} = ${porcentajeRegistrado}%)`);
    
    // Verificar si 88.71% corresponde exactamente a 110/124
    console.log('\n🎯 VERIFICACIÓN FINAL:');
    const calculoExacto = (110 / 124 * 100);
    console.log(`  110 ÷ 124 × 100 = ${calculoExacto.toFixed(6)}%`);
    console.log(`  Redondeado a 2 decimales: ${calculoExacto.toFixed(2)}%`);
    
    if (Math.abs(calculoExacto - 88.71) < 0.001) {
      console.log('  ✅ CONFIRMADO: El sistema usa exactamente (puntos_obtenidos / puntos_maximos × 100)');
      console.log('  📋 Conclusión: Zenput y nuestro sistema usan el MISMO método de cálculo');
    } else {
      console.log('  ❓ Hay una pequeña diferencia que podría ser redondeo');
    }
    
    console.log('\n📝 RESUMEN DE HALLAZGOS:');
    console.log('  🔢 Puntos Obtenidos: 110');
    console.log('  🔢 Puntos Máximos: 124');
    console.log(`  📊 Porcentaje por puntos: ${calculoExacto.toFixed(2)}%`);
    console.log(`  📊 Promedio de áreas: ${promedioAreas.toFixed(2)}%`);
    console.log(`  💾 Registrado en sistema: ${porcentajeRegistrado}%`);
    console.log('  🎯 Zenput reporta: 88.71%');
    
    if (Math.abs(calculoExacto - 88.71) < Math.abs(promedioAreas - 88.71)) {
      console.log('\n  ✅ CONCLUSIÓN: Ambos sistemas usan SUMA DE PUNTOS, no promedio de áreas');
      console.log('  📊 La diferencia inicial de 89.89% vs 88.71% puede ser un error de consulta o filtros');
    } else {
      console.log('\n  ⚠️  INCONCLUSO: Revisar métodos de consulta en nuestro sistema');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

verificarCalculoHuasteca();