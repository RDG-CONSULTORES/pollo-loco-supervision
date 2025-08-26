const { Pool } = require('pg');

console.log('🧪 TESTING MAPEO DE ÁREAS - Por Grupo y Sucursal');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function testAreaMapping() {
    try {
        await pool.connect();
        console.log('✅ Conectado\n');

        // TEST 1: ÁREAS CRÍTICAS POR GRUPO (TEPEYAC)
        console.log('🏢 TEST 1: ÁREAS CRÍTICAS TEPEYAC');
        const tepeyacCriticasQuery = `
            SELECT 
                area_evaluacion,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                COUNT(DISTINCT location_name) as sucursales
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'TEPEYAC'
              AND EXTRACT(YEAR FROM fecha_supervision) = 2025
              AND porcentaje IS NOT NULL
              AND area_evaluacion IS NOT NULL
              AND TRIM(area_evaluacion) != ''
            GROUP BY area_evaluacion
            HAVING COUNT(*) > 50  -- Suficientes evaluaciones
            ORDER BY promedio ASC
            LIMIT 5
        `;
        
        const tepeyacResult = await pool.query(tepeyacCriticasQuery);
        console.log('🚨 BOTTOM 5 ÁREAS CRÍTICAS TEPEYAC:');
        tepeyacResult.rows.forEach((area, index) => {
            const priority = area.promedio < 75 ? '🔥 CRÍTICO' : area.promedio < 85 ? '⚠️ ALTO' : '📈 MEDIO';
            console.log(`${index + 1}. ${area.area_evaluacion}: ${area.promedio}% ${priority} (${area.sucursales} sucursales)`);
        });

        // TEST 2: TOP ÁREAS POR GRUPO (OGAS)
        console.log('\n🏆 TEST 2: TOP ÁREAS OGAS');
        const ogasTopQuery = `
            SELECT 
                area_evaluacion,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                COUNT(DISTINCT location_name) as sucursales
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'OGAS'
              AND EXTRACT(YEAR FROM fecha_supervision) = 2025
              AND porcentaje IS NOT NULL
              AND area_evaluacion IS NOT NULL
              AND TRIM(area_evaluacion) != ''
            GROUP BY area_evaluacion
            HAVING COUNT(*) > 50
            ORDER BY promedio DESC
            LIMIT 5
        `;
        
        const ogasResult = await pool.query(ogasTopQuery);
        console.log('⭐ TOP 5 MEJORES ÁREAS OGAS:');
        ogasResult.rows.forEach((area, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
            console.log(`${medal} ${area.area_evaluacion}: ${area.promedio}% (${area.sucursales} sucursales)`);
        });

        // TEST 3: ÁREAS CRÍTICAS POR SUCURSAL (Santa Catarina)
        console.log('\n🏪 TEST 3: ÁREAS CRÍTICAS - 4 - Santa Catarina');
        const sucursalQuery = `
            SELECT 
                area_evaluacion,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones
            FROM supervision_operativa_detalle 
            WHERE location_name = '4 - Santa Catarina'
              AND EXTRACT(YEAR FROM fecha_supervision) = 2025
              AND porcentaje IS NOT NULL
              AND area_evaluacion IS NOT NULL
              AND TRIM(area_evaluacion) != ''
            GROUP BY area_evaluacion
            HAVING COUNT(*) > 5  -- Al menos 5 evaluaciones
            ORDER BY promedio ASC
            LIMIT 5
        `;
        
        const sucursalResult = await pool.query(sucursalQuery);
        console.log('🚨 BOTTOM 5 ÁREAS CRÍTICAS - Santa Catarina:');
        sucursalResult.rows.forEach((area, index) => {
            const priority = area.promedio < 75 ? '🔥 CRÍTICO' : area.promedio < 85 ? '⚠️ ALTO' : '📈 MEDIO';
            console.log(`${index + 1}. ${area.area_evaluacion}: ${area.promedio}% ${priority} (${area.evaluaciones} eval)`);
        });

        // TEST 4: DETECCIÓN DE PATRONES
        console.log('\n🔍 TEST 4: DETECCIÓN DE PATRONES');
        const patronesQuery = `
            SELECT 
                'FREIDORAS' as area_focus,
                grupo_operativo,
                ROUND(AVG(porcentaje), 2) as promedio_freidoras,
                COUNT(DISTINCT location_name) as sucursales_afectadas
            FROM supervision_operativa_detalle 
            WHERE area_evaluacion = 'FREIDORAS'
              AND EXTRACT(YEAR FROM fecha_supervision) = 2025
              AND porcentaje IS NOT NULL
            GROUP BY grupo_operativo
            HAVING AVG(porcentaje) < 80  -- Grupos con problemas en FREIDORAS
            ORDER BY promedio_freidoras ASC
            LIMIT 5
        `;
        
        const patronesResult = await pool.query(patronesQuery);
        console.log('🎯 GRUPOS CON PROBLEMAS EN FREIDORAS:');
        patronesResult.rows.forEach(grupo => {
            console.log(`• ${grupo.grupo_operativo}: ${grupo.promedio_freidoras}% (${grupo.sucursales_afectadas} sucursales afectadas)`);
        });

        console.log('\n✅ MAPEO COMPLETO ES TOTALMENTE POSIBLE!');
        console.log('🎯 Ana puede entender:');
        console.log('   • Grupos específicos + áreas');
        console.log('   • Sucursales específicas + indicadores');
        console.log('   • Patrones cruzados y tendencias');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

testAreaMapping();