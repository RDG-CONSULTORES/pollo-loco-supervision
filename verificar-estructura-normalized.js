const { Pool } = require('pg');

console.log('🔍 VERIFICAR ESTRUCTURA SUPERVISION_NORMALIZED_VIEW');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function verificarEstructuraNormalized() {
    try {
        await pool.connect();
        console.log('✅ Conectado a la base de datos\n');

        // 1. VERIFICAR ESTRUCTURA DE LA VISTA
        console.log('📊 ESTRUCTURA DE SUPERVISION_NORMALIZED_VIEW');
        const query1 = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'supervision_normalized_view'
            ORDER BY ordinal_position
        `;
        
        const result1 = await pool.query(query1);
        console.log(`✅ Columnas en supervision_normalized_view:`);
        result1.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // 2. MUESTRA DE DATOS DE LA HUASTECA
        console.log('\n📋 MUESTRA DE DATOS LA HUASTECA:');
        const query2 = `
            SELECT *
            FROM supervision_normalized_view 
            WHERE (nombre_normalizado ILIKE '%huasteca%' OR location_name ILIKE '%huasteca%')
            LIMIT 2
        `;
        
        const result2 = await pool.query(query2);
        console.log(`✅ ${result2.rows.length} registros de muestra:`);
        result2.rows.forEach((row, index) => {
            console.log(`\nRegistro ${index + 1}:`);
            Object.keys(row).forEach(key => {
                if (key.includes('porcentaje') || key.includes('pct') || key.includes('score') || key.includes('calificacion')) {
                    console.log(`  🎯 ${key}: ${row[key]}`);
                } else if (['nombre_normalizado', 'location_name', 'submission_id', 'area_evaluacion'].includes(key)) {
                    console.log(`  📝 ${key}: ${row[key]}`);
                }
            });
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

verificarEstructuraNormalized();