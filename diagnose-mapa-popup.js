#!/usr/bin/env node

// 🗺️ DIAGNÓSTICO ESPECÍFICO - MAPA POPUP FUNCTIONALITY
// Análisis del flujo completo: /api/mapa → click → /api/analisis-critico

const BASE_URL = 'https://pollo-loco-supervision.onrender.com';

async function testMapaFlow() {
    console.log('🗺️ DIAGNÓSTICO COMPLETO - MAPA POPUP FUNCTIONALITY');
    console.log('=' .repeat(80));
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    
    try {
        // STEP 1: Cargar datos del mapa
        console.log('\n📍 === STEP 1: CARGA INICIAL MAPA ===');
        const mapaResponse = await fetch(`${BASE_URL}/api/mapa`);
        const mapaData = await mapaResponse.json();
        
        if (!mapaResponse.ok) {
            console.log(`❌ Error cargando mapa: ${mapaData.error}`);
            return;
        }
        
        console.log(`✅ Mapa cargado: ${mapaData.length} sucursales`);
        
        // Buscar test cases específicos
        const testCases = [
            'La Huasteca', 
            'Coahuila Comidas', 
            'Pino Suarez',
            'Garcia'
        ];
        
        console.log('\n🎯 === ANÁLISIS DE SUCURSALES ===');
        
        for (const sucursalName of testCases) {
            const sucursal = mapaData.find(s => 
                s.nombre?.toLowerCase().includes(sucursalName.toLowerCase()) ||
                s.sucursal?.toLowerCase().includes(sucursalName.toLowerCase())
            );
            
            if (!sucursal) {
                console.log(`❌ ${sucursalName}: No encontrada en mapa`);
                continue;
            }
            
            console.log(`\n🏢 === TESTING: ${sucursal.nombre} ===`);
            console.log(`📍 Coordenadas: ${sucursal.lat}, ${sucursal.lng}`);
            console.log(`📊 Performance inicial: ${sucursal.performance}%`);
            console.log(`🏛️ Grupo: ${sucursal.grupo}`);
            console.log(`📍 Estado: ${sucursal.estado}`);
            
            // STEP 2: Simular click en popup - llamar analisis-critico
            console.log(`\n🎯 STEP 2: POPUP ENRICHMENT`);
            
            const popupUrl = `${BASE_URL}/api/analisis-critico?tipo=sucursal&id=${encodeURIComponent(sucursal.nombre)}&estado=${encodeURIComponent(sucursal.estado)}&grupo=${encodeURIComponent(sucursal.grupo)}`;
            console.log(`🔗 URL: ${popupUrl}`);
            
            try {
                const popupResponse = await fetch(popupUrl);
                const popupData = await popupResponse.json();
                
                if (!popupResponse.ok) {
                    console.log(`   ❌ Error popup: ${popupData.error}`);
                    continue;
                }
                
                console.log(`   ✅ Popup loaded: ${popupData.metadata.calculation_method}`);
                console.log(`   📊 Performance popup: ${popupData.performance_general.actual}% (${popupData.metadata.data_source})`);
                console.log(`   📅 Período: ${popupData.periodos.actual}`);
                console.log(`   📅 Última supervisión: ${popupData.ultima_supervision}`);
                console.log(`   🎯 Áreas críticas: ${popupData.areas_criticas.length}`);
                
                // ANÁLISIS DE CONSISTENCIA
                const performanceDiff = Math.abs(sucursal.performance - popupData.performance_general.actual);
                if (performanceDiff > 0.5) {
                    console.log(`   ⚠️ DISCREPANCIA: Mapa ${sucursal.performance}% vs Popup ${popupData.performance_general.actual}% (diff: ${performanceDiff.toFixed(2)})`);
                } else {
                    console.log(`   ✅ CONSISTENTE: Performance matches within 0.5%`);
                }
                
                // VALIDACIÓN ESPECÍFICA LA HUASTECA
                if (sucursalName === 'La Huasteca') {
                    console.log(`\n🎯 === VALIDACIÓN ESPECÍFICA LA HUASTECA ===`);
                    if (popupData.performance_general.actual === 85.34) {
                        console.log(`   ✅ PERFECTO: La Huasteca muestra 85.34% (valor CAS correcto)`);
                    } else if (popupData.performance_general.actual === 88.11) {
                        console.log(`   ❌ ERROR: La Huasteca muestra 88.11% (valor área promedio viejo)`);
                    } else {
                        console.log(`   ⚠️ VALOR INESPERADO: La Huasteca muestra ${popupData.performance_general.actual}%`);
                    }
                }
                
                // Check for CAS periods
                if (popupData.periodos.actual.includes('-T') || popupData.periodos.actual.includes('-S')) {
                    console.log(`   ✅ PERÍODO CAS: ${popupData.periodos.actual}`);
                } else {
                    console.log(`   ⚠️ PERÍODO GENÉRICO: ${popupData.periodos.actual} (no es período CAS específico)`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error popup: ${error.message}`);
            }
        }
        
        console.log('\n📊 === ANÁLISIS GENERAL ===');
        console.log(`✅ Total sucursales en mapa: ${mapaData.length}`);
        
        // Estadísticas del mapa
        const performances = mapaData.map(s => s.performance).filter(p => p);
        const promedio = (performances.reduce((a, b) => a + b, 0) / performances.length).toFixed(2);
        const minimo = Math.min(...performances);
        const maximo = Math.max(...performances);
        
        console.log(`📈 Performance range: ${minimo}% - ${maximo}%`);
        console.log(`📊 Promedio general: ${promedio}%`);
        
        // Coordenadas válidas
        const conCoordenadas = mapaData.filter(s => s.lat && s.lng).length;
        console.log(`📍 Sucursales con coordenadas: ${conCoordenadas}/${mapaData.length}`);
        
        console.log('\n💡 === RECOMENDACIONES ===');
        if (conCoordenadas < mapaData.length) {
            console.log('🔧 Verificar sucursales sin coordenadas');
        }
        
        console.log('🚀 Para optimizar performance:');
        console.log('  1. Implementar caching en /api/analisis-critico');
        console.log('  2. Pre-cargar datos críticos en /api/mapa');
        console.log('  3. Considerar unified endpoint para mapa + popup data');
        
        console.log('\n🏁 === DIAGNÓSTICO MAPA COMPLETADO ===');
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

// Ejecutar diagnóstico
testMapaFlow().catch(console.error);