#!/usr/bin/env node

// Debug timing específico para popups

const BASE_URL = 'https://pollo-loco-supervision.onrender.com';

async function debugPopupTiming() {
    console.log('DEBUG TIMING DE POPUPS');
    console.log('='.repeat(50));
    
    const testCases = [
        'Coahuila Comidas',
        'Harold R. Pape', 
        'Senderos'
    ];
    
    for (const sucursal of testCases) {
        console.log(`\nTesting: ${sucursal}`);
        console.log('-'.repeat(30));
        
        const url = `${BASE_URL}/api/analisis-critico?tipo=sucursal&id=${encodeURIComponent(sucursal)}&estado=Coahuila`;
        
        // Test without timeout
        console.log('1. Sin timeout...');
        const start1 = Date.now();
        try {
            const response1 = await fetch(url);
            const time1 = Date.now() - start1;
            console.log(`   Status: ${response1.status}, Time: ${time1}ms`);
            if (response1.ok) {
                const data = await response1.json();
                console.log(`   Success: ${data.success}, Method: ${data.metadata?.calculation_method}`);
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
        
        // Test with 3s timeout (like frontend)
        console.log('2. Con timeout 3s...');
        const start2 = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response2 = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const time2 = Date.now() - start2;
            console.log(`   Status: ${response2.status}, Time: ${time2}ms`);
        } catch (error) {
            const time2 = Date.now() - start2;
            console.log(`   Error after ${time2}ms: ${error.message}`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

debugPopupTiming().catch(console.error);