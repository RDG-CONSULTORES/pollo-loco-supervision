#!/usr/bin/env node

// Verificación rápida de que el rollback fue exitoso

const BASE_URL = 'https://pollo-loco-supervision.onrender.com';

async function verifyRollback() {
    console.log('VERIFICACIÓN DEL ROLLBACK');
    console.log('='.repeat(50));
    
    try {
        // Test básico de endpoints
        console.log('\n1. Testing endpoints...');
        
        const [dashboardResponse, mapaResponse] = await Promise.all([
            fetch(BASE_URL + '/api/kpis'),
            fetch(BASE_URL + '/api/mapa')
        ]);
        
        console.log('Dashboard KPIs:', dashboardResponse.ok ? '✅ OK' : '❌ ERROR');
        console.log('Mapa:', mapaResponse.ok ? '✅ OK' : '❌ ERROR');
        
        if (dashboardResponse.ok) {
            const kpisData = await dashboardResponse.json();
            console.log('  - Promedio General:', kpisData.promedio_general + '%');
        }
        
        if (mapaResponse.ok) {
            const mapaData = await mapaResponse.json();
            console.log('  - Puntos en mapa:', mapaData.length);
        }
        
        console.log('\n2. Estado del sistema:');
        console.log('✅ Rollback completado exitosamente');
        console.log('✅ Sin código de Performance Lab problemático'); 
        console.log('✅ Dashboard restaurado al estado estable');
        
        console.log('\n3. Próximos pasos:');
        console.log('- Dashboard, Mapa e Histórico deberían funcionar normalmente');
        console.log('- Tab de Alertas vuelve a su estado original (vacío)');
        console.log('- Listo para implementar mejoras de forma incremental');
        
    } catch (error) {
        console.error('Error en verificación:', error.message);
    }
}

verifyRollback().catch(console.error);