const { Pool } = require('pg');

console.log('🔍 VERIFICAR NOMBRES EXACTOS LA HUASTECA - DUAL SOURCE');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function verificarNombresHuasteca() {
    try {
        await pool.connect();
        console.log('✅ Conectado a la base de datos\n');

        // 1. NOMBRES EN SUPERVISION_NORMALIZED_VIEW (TEPEYAC)
        console.log('📊 NOMBRES EN SUPERVISION_NORMALIZED_VIEW (TEPEYAC)');
        const query1 = `
            SELECT DISTINCT 
                nombre_normalizado,
                location_name,
                COUNT(DISTINCT submission_id) as supervisiones,
                MIN(fecha_supervision) as primera_fecha,
                MAX(fecha_supervision) as ultima_fecha
            FROM supervision_normalized_view 
            WHERE grupo_normalizado = 'TEPEYAC'
              AND area_tipo = 'area_principal'
            GROUP BY nombre_normalizado, location_name
            ORDER BY nombre_normalizado
        `;
        
        const result1 = await pool.query(query1);
        console.log(`✅ ${result1.rows.length} sucursales encontradas en supervision_normalized_view:`);
        result1.rows.forEach(row => {
            console.log(`  - nombre_normalizado: "${row.nombre_normalizado}"`);
            console.log(`    location_name: "${row.location_name}"`);
            console.log(`    supervisiones: ${row.supervisiones}`);
            console.log(`    período: ${row.primera_fecha} → ${row.ultima_fecha}\n`);
        });

        // 2. NOMBRES EN SUPERVISION_OPERATIVA_CAS (La Huasteca específicamente)
        console.log('🎯 NOMBRES EN SUPERVISION_OPERATIVA_CAS (LA HUASTECA)');
        const query2 = `
            SELECT DISTINCT 
                location_name,
                COUNT(*) as total_records,
                ROUND(AVG(score), 2) as promedio_score,
                MIN(fecha) as primera_fecha,
                MAX(fecha) as ultima_fecha
            FROM supervision_operativa_cas 
            WHERE location_name ILIKE '%huasteca%'
            GROUP BY location_name
            ORDER BY location_name
        `;
        
        const result2 = await pool.query(query2);
        console.log(`✅ ${result2.rows.length} registros de La Huasteca en supervision_operativa_cas:`);
        result2.rows.forEach(row => {
            console.log(`  - location_name: "${row.location_name}"`);
            console.log(`    total_records: ${row.total_records}`);
            console.log(`    promedio_score: ${row.promedio_score}%`);
            console.log(`    período: ${row.primera_fecha} → ${row.ultima_fecha}\n`);
        });

        // 3. TODAS LAS SUCURSALES TEPEYAC EN CAS
        console.log('🔍 TODAS LAS SUCURSALES TEPEYAC EN SUPERVISION_OPERATIVA_CAS');
        const query3 = `
            SELECT DISTINCT 
                location_name,
                COUNT(*) as total_records,
                ROUND(AVG(score), 2) as promedio_score
            FROM supervision_operativa_cas 
            WHERE location_name IN (
                '1 - Pino Suarez',
                '2 - Madero', 
                '3 - Matamoros',
                '4 - Santa Catarina',
                '5 - Felix U. Gomez',
                '6 - Garcia',
                '7 - La Huasteca',
                'Sucursal LH - La Huasteca',
                'Sucursal GC - Garcia',
                'Sucursal SC - Santa Catarina'
            )
            GROUP BY location_name
            ORDER BY location_name
        `;
        
        const result3 = await pool.query(query3);
        console.log(`✅ ${result3.rows.length} sucursales TEPEYAC encontradas en supervision_operativa_cas:`);
        result3.rows.forEach(row => {
            console.log(`  - "${row.location_name}": ${row.promedio_score}% (${row.total_records} registros)`);
        });

        // 4. VERIFICAR PARÁMETROS EXACTOS PARA ENDPOINT
        console.log('\n🎯 PARÁMETROS EXACTOS PARA ENDPOINT:');
        console.log('Para supervision_normalized_view (TEPEYAC):');
        const huastecaNormalized = result1.rows.filter(row => 
            row.nombre_normalizado.toLowerCase().includes('huasteca') ||
            row.location_name.toLowerCase().includes('huasteca')
        );
        
        huastecaNormalized.forEach(row => {
            console.log(`✅ /api/sucursal-detail?sucursal=${encodeURIComponent(row.nombre_normalizado)}`);
            console.log(`   → nombre_normalizado: "${row.nombre_normalizado}"`);
            console.log(`   → location_name: "${row.location_name}"`);
        });

        console.log('\nPara supervision_operativa_cas:');
        result2.rows.forEach(row => {
            console.log(`✅ /api/sucursal-detail?sucursal=${encodeURIComponent(row.location_name)}`);
            console.log(`   → location_name: "${row.location_name}"`);
            console.log(`   → score promedio: ${row.promedio_score}%`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

verificarNombresHuasteca();