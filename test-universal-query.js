const { Pool } = require('pg');

console.log('🧪 TESTING QUERY UNIVERSAL - Todos los grupos');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function testUniversalQuery() {
    try {
        await pool.connect();
        console.log('✅ Conectado\n');

        // QUERY UNIVERSAL - Mismo que usa business-knowledge.js
        const gruposQuery = `
          SELECT 
            grupo_operativo,
            COUNT(DISTINCT location_name) as sucursales,
            ROUND(AVG(porcentaje), 2) as promedio_actual,
            COUNT(*) as evaluaciones
          FROM supervision_operativa_detalle 
          WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025
            AND grupo_operativo IS NOT NULL
          GROUP BY grupo_operativo 
          ORDER BY promedio_actual DESC
        `;

        console.log('📊 EJECUTANDO QUERY UNIVERSAL...');
        const result = await pool.query(gruposQuery);
        
        console.log(`✅ ${result.rows.length} grupos encontrados:\n`);
        
        result.rows.forEach((grupo, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const status = grupo.promedio_actual >= 95 ? '🏆' : grupo.promedio_actual >= 90 ? '✅' : '⚠️';
            
            console.log(`${medal} ${grupo.grupo_operativo} ${status}`);
            console.log(`   Sucursales: ${grupo.sucursales} | Promedio: ${grupo.promedio_actual}% | Evaluaciones: ${grupo.evaluaciones}`);
        });

        console.log('\n🎯 QUERY UNIVERSAL FUNCIONA PARA TODOS LOS GRUPOS!');
        
        // Test específico TEPEYAC
        const tepeyacData = result.rows.find(g => g.grupo_operativo === 'TEPEYAC');
        if (tepeyacData) {
            console.log(`\n✅ TEPEYAC encontrado en query universal:`);
            console.log(`   Sucursales: ${tepeyacData.sucursales} | Promedio: ${tepeyacData.promedio_actual}%`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

testUniversalQuery();