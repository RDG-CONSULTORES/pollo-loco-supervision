const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function verificarPromedios() {
    try {
        console.log('🔍 VERIFICANDO PROMEDIOS CON DATOS CORREGIDOS...');
        console.log('');
        
        // Verificar sucursales específicas del mapping
        const sucursalesMapping = [
            '20 - Tecnológico', '21 - Chapultepec', '22 - Satelite', '23 - Guasave', // TEC
            '24 - Exposicion', '25 - Juarez', '26 - Cadereyta', '27 - Santiago', '28 - Guerrero', '29 - Pablo Livas', '30 - Carrizo', '31 - Las Quintas', '32 - Allende', '33 - Eloy Cavazos', '34 - Montemorelos', // EXPO
            '52 - Venustiano Carranza', '54 - Ramos Arizpe', '57 - Harold R. Pape' // GRUPO SALTILLO
        ];
        
        const verificacion = await pool.query(`
            SELECT 
                location_name,
                COUNT(*) as evaluaciones,
                ROUND(AVG(calificacion_general_pct), 2) as promedio,
                MAX(date_completed) as ultima_fecha
            FROM supervision_operativa_cas 
            WHERE location_name = ANY($1)
                AND calificacion_general_pct IS NOT NULL
                AND date_completed >= '2025-02-01'
            GROUP BY location_name
            ORDER BY location_name
        `, [sucursalesMapping]);
        
        console.log('📊 SUCURSALES DEL MAPPING EN BASE DE DATOS:');
        console.log('===============================================');
        
        const found = verificacion.rows.map(row => row.location_name);
        const missing = sucursalesMapping.filter(s => !found.includes(s));
        
        verificacion.rows.forEach(row => {
            console.log(`✅ ${row.location_name}`);
            console.log(`   📈 ${row.evaluaciones} evaluaciones | ${row.promedio}% promedio`);
            console.log(`   📅 Última: ${row.ultima_fecha.toISOString().split('T')[0]}`);
            console.log('');
        });
        
        if (missing.length > 0) {
            console.log('❌ SUCURSALES NO ENCONTRADAS EN CAS:');
            missing.forEach(s => console.log(`   - ${s}`));
        } else {
            console.log('✅ TODAS LAS SUCURSALES DEL MAPPING EXISTEN EN CAS');
        }
        
        // Verificar promedios por grupo
        console.log('\n📊 PROMEDIOS POR GRUPO CORREGIDO:');
        console.log('==================================');
        
        const grupoPromedios = await pool.query(`
            WITH grupo_mapping AS (
                SELECT 
                    location_name,
                    CASE 
                        WHEN location_name IN ('20 - Tecnológico', '21 - Chapultepec', '22 - Satelite', '23 - Guasave') THEN 'TEC'
                        WHEN location_name IN ('24 - Exposicion', '25 - Juarez', '26 - Cadereyta', '27 - Santiago', '28 - Guerrero', '29 - Pablo Livas', '30 - Carrizo', '31 - Las Quintas', '32 - Allende', '33 - Eloy Cavazos', '34 - Montemorelos') THEN 'EXPO'
                        WHEN location_name IN ('52 - Venustiano Carranza', '54 - Ramos Arizpe', '57 - Harold R. Pape') THEN 'GRUPO SALTILLO'
                        ELSE 'OTRO'
                    END as grupo,
                    CASE 
                        WHEN location_name IN ('20 - Tecnológico', '21 - Chapultepec', '22 - Satelite') THEN 'LOCAL'
                        WHEN location_name = '23 - Guasave' THEN 'FORÁNEA'
                        WHEN location_name IN ('24 - Exposicion', '25 - Juarez', '26 - Cadereyta', '27 - Santiago', '29 - Pablo Livas', '31 - Las Quintas', '32 - Allende', '33 - Eloy Cavazos', '34 - Montemorelos') THEN 'LOCAL'
                        WHEN location_name IN ('28 - Guerrero', '30 - Carrizo') THEN 'FORÁNEA'
                        WHEN location_name IN ('52 - Venustiano Carranza', '54 - Ramos Arizpe') THEN 'LOCAL'
                        WHEN location_name = '57 - Harold R. Pape' THEN 'FORÁNEA'
                        ELSE 'OTRO'
                    END as territorial
                FROM supervision_operativa_cas
                WHERE location_name = ANY($1)
            )
            SELECT 
                gm.grupo,
                gm.territorial,
                COUNT(*) as evaluaciones,
                ROUND(AVG(soc.calificacion_general_pct), 2) as promedio,
                COUNT(DISTINCT soc.location_name) as sucursales
            FROM supervision_operativa_cas soc
            JOIN grupo_mapping gm ON soc.location_name = gm.location_name
            WHERE soc.calificacion_general_pct IS NOT NULL
                AND soc.date_completed >= '2025-02-01'
            GROUP BY gm.grupo, gm.territorial
            ORDER BY gm.grupo, gm.territorial
        `, [sucursalesMapping]);
        
        grupoPromedios.rows.forEach(row => {
            console.log(`🏢 ${row.grupo} - ${row.territorial}`);
            console.log(`   📊 ${row.sucursales} sucursales | ${row.evaluaciones} evaluaciones | ${row.promedio}% promedio`);
            console.log('');
        });
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

verificarPromedios();