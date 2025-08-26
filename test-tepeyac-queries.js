const { Pool } = require('pg');

console.log('🔍 TESTING TEPEYAC QUERIES - DEBUGGING PROFUNDO');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function testTepeyacQueries() {
    try {
        await pool.connect();
        console.log('✅ Conectado a la base de datos\n');

        // QUERY 1: Sucursales TEPEYAC básicas
        console.log('📊 QUERY 1: Sucursales básicas de TEPEYAC');
        const query1 = `
            SELECT DISTINCT 
                location_name,
                sucursal_clean,
                estado,
                municipio
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'TEPEYAC'
            ORDER BY location_name
        `;
        
        const result1 = await pool.query(query1);
        console.log(`✅ ${result1.rows.length} sucursales encontradas:`);
        result1.rows.forEach(row => {
            console.log(`  - ${row.location_name} (${row.sucursal_clean}) - ${row.municipio}, ${row.estado}`);
        });

        // QUERY 2: Promedios por sucursal TEPEYAC
        console.log('\n📈 QUERY 2: Promedios por sucursal TEPEYAC');
        const query2 = `
            SELECT 
                location_name,
                COUNT(*) as evaluaciones,
                ROUND(AVG(porcentaje), 2) as promedio,
                MIN(porcentaje) as peor_calificacion,
                MAX(porcentaje) as mejor_calificacion
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'TEPEYAC'
              AND porcentaje IS NOT NULL
              AND EXTRACT(YEAR FROM fecha_supervision) = 2025
            GROUP BY location_name
            ORDER BY promedio DESC
        `;
        
        const result2 = await pool.query(query2);
        console.log(`✅ Promedios calculados:`);
        result2.rows.forEach(row => {
            console.log(`  - ${row.location_name}: ${row.promedio}% (${row.evaluaciones} evaluaciones)`);
        });

        // QUERY 3: Áreas críticas TEPEYAC
        console.log('\n🚨 QUERY 3: Áreas críticas TEPEYAC');
        const query3 = `
            SELECT 
                area_evaluacion,
                COUNT(*) as evaluaciones,
                ROUND(AVG(porcentaje), 2) as promedio_area
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'TEPEYAC'
              AND porcentaje IS NOT NULL
              AND area_evaluacion IS NOT NULL
              AND TRIM(area_evaluacion) != ''
              AND EXTRACT(YEAR FROM fecha_supervision) = 2025
            GROUP BY area_evaluacion
            HAVING AVG(porcentaje) < 85
            ORDER BY promedio_area ASC
            LIMIT 5
        `;
        
        const result3 = await pool.query(query3);
        console.log(`✅ ${result3.rows.length} áreas críticas encontradas:`);
        result3.rows.forEach(row => {
            console.log(`  - ${row.area_evaluacion}: ${row.promedio_area}%`);
        });

        // QUERY 4: Contexto trimestral
        console.log('\n📅 QUERY 4: Análisis trimestral TEPEYAC 2025');
        const query4 = `
            SELECT 
                'Q' || EXTRACT(QUARTER FROM fecha_supervision) as trimestre,
                COUNT(DISTINCT location_name) as sucursales_evaluadas,
                COUNT(*) as evaluaciones_totales,
                ROUND(AVG(porcentaje), 2) as promedio_trimestre
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'TEPEYAC'
              AND EXTRACT(YEAR FROM fecha_supervision) = 2025
              AND porcentaje IS NOT NULL
            GROUP BY EXTRACT(QUARTER FROM fecha_supervision)
            ORDER BY EXTRACT(QUARTER FROM fecha_supervision)
        `;
        
        const result4 = await pool.query(query4);
        console.log(`✅ Análisis trimestral:`);
        result4.rows.forEach(row => {
            console.log(`  - ${row.trimestre}: ${row.promedio_trimestre}% (${row.sucursales_evaluadas} sucursales, ${row.evaluaciones_totales} evaluaciones)`);
        });

        // QUERY 5: Detalle por sucursal y área crítica
        console.log('\n🔍 QUERY 5: Detalle de áreas críticas por sucursal');
        const query5 = `
            SELECT 
                location_name,
                area_evaluacion,
                ROUND(AVG(porcentaje), 2) as promedio_area,
                COUNT(*) as evaluaciones
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'TEPEYAC'
              AND porcentaje IS NOT NULL
              AND area_evaluacion IN ('FREIDORAS', 'EXTERIOR SUCURSAL', 'FREIDORA DE PAPA')
              AND EXTRACT(YEAR FROM fecha_supervision) = 2025
            GROUP BY location_name, area_evaluacion
            ORDER BY promedio_area ASC
            LIMIT 10
        `;
        
        const result5 = await pool.query(query5);
        console.log(`✅ Detalle áreas críticas:`);
        result5.rows.forEach(row => {
            console.log(`  - ${row.location_name} - ${row.area_evaluacion}: ${row.promedio_area}%`);
        });

        console.log('\n🎯 TODAS LAS QUERIES FUNCIONAN PERFECTAMENTE!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

testTepeyacQueries();