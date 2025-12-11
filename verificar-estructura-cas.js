const { Pool } = require('pg');

console.log('🔍 VERIFICAR ESTRUCTURA DE SUPERVISION_OPERATIVA_CAS');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function verificarEstructuraCas() {
    try {
        await pool.connect();
        console.log('✅ Conectado a la base de datos\n');

        // 1. VERIFICAR ESTRUCTURA DE LA TABLA
        console.log('📊 ESTRUCTURA DE SUPERVISION_OPERATIVA_CAS');
        const query1 = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'supervision_operativa_cas'
            ORDER BY ordinal_position
        `;
        
        const result1 = await pool.query(query1);
        console.log(`✅ Columnas en supervision_operativa_cas:`);
        result1.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // 2. MUESTRA DE DATOS
        console.log('\n📋 MUESTRA DE DATOS:');
        const query2 = `
            SELECT *
            FROM supervision_operativa_cas 
            LIMIT 3
        `;
        
        const result2 = await pool.query(query2);
        console.log(`✅ Primeros 3 registros:`);
        result2.rows.forEach((row, index) => {
            console.log(`\nRegistro ${index + 1}:`);
            Object.keys(row).forEach(key => {
                console.log(`  ${key}: ${row[key]}`);
            });
        });

        // 3. BUSCAR LA HUASTECA ESPECÍFICAMENTE
        console.log('\n🎯 BUSCAR LA HUASTECA EN CAS:');
        const query3 = `
            SELECT DISTINCT 
                location_name,
                COUNT(*) as total_records
            FROM supervision_operativa_cas 
            WHERE location_name ILIKE '%huasteca%'
            GROUP BY location_name
            ORDER BY location_name
        `;
        
        const result3 = await pool.query(query3);
        console.log(`✅ ${result3.rows.length} registros de La Huasteca encontrados:`);
        result3.rows.forEach(row => {
            console.log(`  - "${row.location_name}": ${row.total_records} registros`);
        });

        // 4. BUSCAR TODAS LAS SUCURSALES QUE CONTENGAN NÚMEROS
        console.log('\n🔢 TODAS LAS SUCURSALES CON NÚMEROS EN CAS:');
        const query4 = `
            SELECT DISTINCT 
                location_name,
                COUNT(*) as total_records
            FROM supervision_operativa_cas 
            WHERE location_name ~ '^[0-9]+'
            GROUP BY location_name
            ORDER BY location_name
        `;
        
        const result4 = await pool.query(query4);
        console.log(`✅ ${result4.rows.length} sucursales con números encontradas:`);
        result4.rows.forEach(row => {
            console.log(`  - "${row.location_name}": ${row.total_records} registros`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

verificarEstructuraCas();