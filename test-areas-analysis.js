const { Pool } = require('pg');

console.log('📊 ANÁLISIS DE ÁREAS - Top vs Oportunidades');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function analyzeAreas() {
    try {
        await pool.connect();
        console.log('✅ Conectado\n');

        // TOP 10 MEJORES ÁREAS
        console.log('🏆 TOP 10 MEJORES ÁREAS/INDICADORES:');
        const topQuery = `
            SELECT 
                area_evaluacion,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                COUNT(DISTINCT grupo_operativo) as grupos
            FROM supervision_operativa_detalle 
            WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025
              AND porcentaje IS NOT NULL
              AND area_evaluacion IS NOT NULL
              AND TRIM(area_evaluacion) != ''
            GROUP BY area_evaluacion
            HAVING COUNT(*) > 1000  -- Solo áreas con suficientes evaluaciones
            ORDER BY promedio DESC
            LIMIT 10
        `;
        
        const topResult = await pool.query(topQuery);
        topResult.rows.forEach((area, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
            console.log(`${medal} ${area.area_evaluacion}: ${area.promedio}% (${area.evaluaciones} evaluaciones, ${area.grupos} grupos)`);
        });

        // BOTTOM 10 ÁREAS DE OPORTUNIDAD  
        console.log('\n🚨 TOP 10 ÁREAS DE OPORTUNIDAD (Críticas para mejorar):');
        const bottomQuery = `
            SELECT 
                area_evaluacion,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                COUNT(DISTINCT grupo_operativo) as grupos
            FROM supervision_operativa_detalle 
            WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025
              AND porcentaje IS NOT NULL
              AND area_evaluacion IS NOT NULL
              AND TRIM(area_evaluacion) != ''
            GROUP BY area_evaluacion
            HAVING COUNT(*) > 1000  -- Solo áreas con suficientes evaluaciones
            ORDER BY promedio ASC
            LIMIT 10
        `;
        
        const bottomResult = await pool.query(bottomQuery);
        bottomResult.rows.forEach((area, index) => {
            const priority = area.promedio < 75 ? '🔥 CRÍTICO' : area.promedio < 85 ? '⚠️ ALTO' : '📈 MEDIO';
            console.log(`${index + 1}. ${area.area_evaluacion}: ${area.promedio}% ${priority}`);
            console.log(`   └── ${area.evaluaciones} evaluaciones en ${area.grupos} grupos`);
        });

        // ANÁLISIS ESPECÍFICO TEPEYAC
        console.log('\n🏢 TEPEYAC - ÁREAS DE OPORTUNIDAD ESPECÍFICAS:');
        const tepeyacQuery = `
            SELECT 
                area_evaluacion,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'TEPEYAC'
              AND EXTRACT(YEAR FROM fecha_supervision) = 2025
              AND porcentaje IS NOT NULL
              AND area_evaluacion IS NOT NULL
              AND TRIM(area_evaluacion) != ''
            GROUP BY area_evaluacion
            HAVING AVG(porcentaje) < 85  -- Áreas bajo objetivo
            ORDER BY promedio ASC
            LIMIT 5
        `;
        
        const tepeyacResult = await pool.query(tepeyacQuery);
        if (tepeyacResult.rows.length > 0) {
            tepeyacResult.rows.forEach((area, index) => {
                const urgency = area.promedio < 75 ? '🚨 URGENTE' : area.promedio < 80 ? '⚠️ ALTA' : '📈 MEDIA';
                console.log(`${index + 1}. ${area.area_evaluacion}: ${area.promedio}% ${urgency}`);
            });
        } else {
            console.log('✅ TEPEYAC no tiene áreas críticas bajo 85%');
        }

        // RECOMENDACIONES AUTOMÁTICAS
        console.log('\n💡 RECOMENDACIONES AUTOMÁTICAS:');
        const criticalAreas = bottomResult.rows.filter(a => a.promedio < 75);
        if (criticalAreas.length > 0) {
            console.log(`🎯 ENFOCAR en ${criticalAreas.length} áreas críticas (<75%):`);
            criticalAreas.forEach(area => {
                console.log(`   • ${area.area_evaluacion}: Plan de mejora inmediato`);
            });
        }

        const improvementAreas = bottomResult.rows.filter(a => a.promedio >= 75 && a.promedio < 85);
        if (improvementAreas.length > 0) {
            console.log(`📈 MEJORAR ${improvementAreas.length} áreas oportunidad (75-85%):`);
            improvementAreas.forEach(area => {
                console.log(`   • ${area.area_evaluacion}: Capacitación refuerzo`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

analyzeAreas();