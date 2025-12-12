#!/usr/bin/env node

// Diagnóstico completo de los popups del mapa
// El problema: /api/analisis-critico devuelve error 500

const BASE_URL = 'https://pollo-loco-supervision.onrender.com';

async function diagnoseMapPopups() {
    console.log('DIAGNÓSTICO DE POPUPS DEL MAPA');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. Verificar que el mapa básico funcione
    console.log('1. VERIFICACIÓN DEL MAPA BÁSICO');
    console.log('-'.repeat(40));
    
    try {
        const mapaResponse = await fetch(`${BASE_URL}/api/mapa`);
        console.log(`Status: ${mapaResponse.status} ${mapaResponse.statusText}`);
        
        if (mapaResponse.ok) {
            const mapaData = await mapaResponse.json();
            console.log(`✅ Mapa OK: ${mapaData.length} puntos`);
            
            if (mapaData.length > 0) {
                const sample = mapaData[0];
                console.log('\nEstructura de datos del mapa:');
                console.log(JSON.stringify(sample, null, 2));
            }
        } else {
            console.log('❌ Error en mapa básico');
            return;
        }
    } catch (error) {
        console.log('❌ Exception en mapa:', error.message);
        return;
    }
    
    console.log('\n2. TESTING ENDPOINT /api/analisis-critico');
    console.log('-'.repeat(40));
    
    // 2. Probar el endpoint problemático con diferentes parámetros
    const testCases = [
        {
            name: 'Caso del log (Coahuila Comidas)',
            params: {
                tipo: 'sucursal',
                id: 'Coahuila Comidas',
                estado: 'Coahuila',
                grupo: 'GRUPO PIEDRAS NEGRAS'
            }
        },
        {
            name: 'Caso simple (sin grupo)',
            params: {
                tipo: 'sucursal',
                id: 'Coahuila Comidas',
                estado: 'Coahuila'
            }
        },
        {
            name: 'Caso mínimo (solo tipo)',
            params: {
                tipo: 'sucursal'
            }
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\\nTesting: ${testCase.name}`);
        
        const queryString = new URLSearchParams(testCase.params).toString();
        const url = `${BASE_URL}/api/analisis-critico?${queryString}`;
        console.log(`URL: ${url}`);
        
        try {
            const response = await fetch(url);
            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Respuesta exitosa:', typeof data, Array.isArray(data) ? `Array(${data.length})` : 'Object');
            } else {
                const errorText = await response.text();
                console.log('❌ Error response:', errorText.substring(0, 200) + '...');
            }
        } catch (error) {
            console.log('❌ Exception:', error.message);
        }
        
        // Pequeña pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\\n3. ANÁLISIS DEL PROBLEMA');
    console.log('-'.repeat(40));
    
    console.log('El problema está en el endpoint /api/analisis-critico que:');
    console.log('- Se llama para enriquecer los popups del mapa');
    console.log('- Devuelve error 500 (error del servidor)'); 
    console.log('- Causa que los popups se cuelguen o no muestren datos');
    
    console.log('\\n4. POSIBLES CAUSAS');
    console.log('-'.repeat(40));
    
    console.log('- Query SQL mal formada o con columnas inexistentes');
    console.log('- Parámetros con caracteres especiales no escapados');
    console.log('- Tabla o vista no disponible en la base de datos');
    console.log('- Timeout en la consulta por ser muy pesada');
    
    console.log('\\n5. SOLUCIONES RECOMENDADAS');
    console.log('-'.repeat(40));
    
    console.log('A. INMEDIATA - Deshabilitar enriquecimiento de popups');
    console.log('   - Los popups mostrarían datos básicos sin análisis crítico');
    console.log('   - Evita que se cuelguen y permite usar el mapa normalmente');
    
    console.log('\\nB. PERMANENTE - Arreglar el endpoint');
    console.log('   - Revisar y corregir la query SQL en server.js');
    console.log('   - Validar parámetros de entrada');
    console.log('   - Agregar manejo de errores');
    
    console.log('\\n' + '='.repeat(60));
}

diagnoseMapPopups().catch(console.error);