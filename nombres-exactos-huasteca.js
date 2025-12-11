const { Pool } = require('pg');

console.log('🎯 NOMBRES EXACTOS LA HUASTECA - PARA TESTING ENDPOINT');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function obtenerNombresExactos() {
    try {
        await pool.connect();
        console.log('✅ Conectado a la base de datos\n');

        console.log('='.repeat(60));
        console.log('🏪 SUCURSALES LA HUASTECA - DATOS PARA TESTING');
        console.log('='.repeat(60));

        // 1. SUPERVISION_NORMALIZED_VIEW (SOURCE 1)
        console.log('\n📊 SOURCE 1: SUPERVISION_NORMALIZED_VIEW');
        const query1 = `
            SELECT DISTINCT 
                nombre_normalizado,
                location_name,
                COUNT(DISTINCT submission_id) as supervisiones,
                ROUND(AVG(porcentaje), 2) as promedio_porcentaje
            FROM supervision_normalized_view 
            WHERE grupo_normalizado = 'TEPEYAC'
              AND area_tipo = 'area_principal'
              AND (nombre_normalizado ILIKE '%huasteca%' OR location_name ILIKE '%huasteca%')
            GROUP BY nombre_normalizado, location_name
            ORDER BY nombre_normalizado
        `;
        
        const result1 = await pool.query(query1);
        console.log(`✅ ${result1.rows.length} registros encontrados:`);
        result1.rows.forEach((row, index) => {
            console.log(`\n${index + 1}. 📝 PARA ENDPOINT:`);
            console.log(`   URL: /api/sucursal-detail?sucursal=${encodeURIComponent(row.nombre_normalizado)}`);
            console.log(`   nombre_normalizado: "${row.nombre_normalizado}"`);
            console.log(`   location_name: "${row.location_name}"`);
            console.log(`   supervisiones: ${row.supervisiones}`);
            console.log(`   promedio: ${row.promedio_porcentaje}%`);
        });

        // 2. SUPERVISION_OPERATIVA_CAS (SOURCE 2)
        console.log('\n📊 SOURCE 2: SUPERVISION_OPERATIVA_CAS');
        const query2 = `
            SELECT DISTINCT 
                location_name,
                COUNT(*) as total_records,
                ROUND(AVG(calificacion_general_pct), 2) as promedio_calificacion,
                MIN(submitted_at::date) as primera_fecha,
                MAX(submitted_at::date) as ultima_fecha
            FROM supervision_operativa_cas 
            WHERE location_name ILIKE '%huasteca%'
            GROUP BY location_name
            ORDER BY location_name
        `;
        
        const result2 = await pool.query(query2);
        console.log(`✅ ${result2.rows.length} registros encontrados:`);
        result2.rows.forEach((row, index) => {
            console.log(`\n${index + 1}. 📝 PARA ENDPOINT:`);
            console.log(`   URL: /api/sucursal-detail?sucursal=${encodeURIComponent(row.location_name)}`);
            console.log(`   location_name: "${row.location_name}"`);
            console.log(`   total_records: ${row.total_records}`);
            console.log(`   promedio_calificacion: ${row.promedio_calificacion}%`);
            console.log(`   período: ${row.primera_fecha} → ${row.ultima_fecha}`);
        });

        // 3. EJEMPLO DE VALIDACIÓN DUAL-SOURCE
        console.log('\n🎯 VALIDACIÓN DUAL-SOURCE ESPERADA:');
        console.log('Para poder probar que el endpoint devuelve datos de ambas fuentes:');
        
        if (result1.rows.length > 0 && result2.rows.length > 0) {
            console.log('\n✅ CASO DE PRUEBA ÓPTIMO:');
            console.log(`📍 Usar: "La Huasteca" (nombre_normalizado)`);
            console.log(`📍 Esperado SOURCE 1: ${result1.rows[0].promedio_porcentaje}%`);
            console.log(`📍 Esperado SOURCE 2: ${result2.rows.find(r => r.location_name.includes('Huasteca'))?.promedio_calificacion}%`);
            console.log(`📍 URL TEST: /api/sucursal-detail?sucursal=${encodeURIComponent('La Huasteca')}`);
        }

        // 4. TODAS LAS OPCIONES POSIBLES
        console.log('\n📋 TODAS LAS OPCIONES DE PRUEBA:');
        console.log('\nDesde supervision_normalized_view:');
        result1.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. sucursal="${row.nombre_normalizado}"`);
        });
        
        console.log('\nDesde supervision_operativa_cas:');
        result2.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. sucursal="${row.location_name}"`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('🚀 LISTO PARA TESTING DEL ENDPOINT DUAL-SOURCE');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

obtenerNombresExactos();