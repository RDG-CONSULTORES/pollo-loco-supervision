#!/usr/bin/env node

// Script para esperar a que el deploy esté listo y probar el fix

const BASE_URL = 'https://pollo-loco-supervision.onrender.com';

async function waitAndTestFix() {
    console.log('ESPERANDO DEPLOY Y TESTING FIX');
    console.log('='.repeat(50));
    
    const maxRetries = 20; // 5 minutos máximo
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        console.log(`\nIntento ${retryCount + 1}/${maxRetries}...`);
        
        try {
            // Test the problematic endpoint
            const url = `${BASE_URL}/api/analisis-critico?tipo=sucursal&id=Coahuila Comidas&estado=Coahuila&grupo=GRUPO PIEDRAS NEGRAS`;
            
            const response = await fetch(url);
            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                console.log('✅ ¡FIX EXITOSO! El endpoint ahora funciona');
                
                const data = await response.json();
                console.log('\nRespuesta del servidor:');
                console.log(JSON.stringify(data, null, 2));
                
                console.log('\n✅ LOS POPUPS DEL MAPA DEBERÍAN FUNCIONAR CORRECTAMENTE AHORA');
                return;
                
            } else if (response.status === 500) {
                const errorText = await response.text();
                if (!errorText.includes('calculateCASPeriod is not defined')) {
                    console.log('⚠️ Error 500 diferente, el deploy puede estar funcionando');
                    console.log('Error:', errorText.substring(0, 100) + '...');
                } else {
                    console.log('❌ Aún el error anterior, esperando deploy...');
                }
            }
            
        } catch (error) {
            console.log('❌ Error de conexión:', error.message);
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
            console.log('Esperando 15 segundos antes del siguiente intento...');
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }
    
    console.log('\n❌ Timeout alcanzado. El deploy puede tardar más de lo esperado.');
    console.log('Puedes probar manualmente el endpoint en unos minutos.');
}

waitAndTestFix().catch(console.error);