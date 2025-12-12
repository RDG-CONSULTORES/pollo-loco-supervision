const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function verifyServerMapping() {
    try {
        console.log('🔍 VERIFICANDO LÓGICA DEL SERVER PARA MAPEO DE GRUPOS...');
        console.log('');
        
        const query = await pool.query(`
            SELECT 
                location_name,
                CASE 
                    WHEN location_name IN ('Sucursal SC - Santa Catarina', 'Sucursal GC - Garcia', 'Sucursal LH - La Huasteca') THEN 'TEPEYAC'
                    WHEN location_name LIKE '%Centro%' OR location_name LIKE '%CENTRO%' THEN 'CENTRO'
                    WHEN location_name LIKE '%Apodaca%' OR location_name LIKE '%APODACA%' THEN 'APODACA'
                    WHEN location_name LIKE '%Saltillo%' OR location_name LIKE '%SALTILLO%' THEN 'GRUPO SALTILLO'
                    ELSE 'OTROS'
                END as grupo_normalizado,
                CASE 
                    WHEN location_name ~* '(nuevo león|monterrey|garcia|santa catarina|huasteca|apodaca|guadalupe)' THEN 'Nuevo León'
                    WHEN location_name ~* '(saltillo|coahuila)' THEN 'Coahuila'
                    WHEN location_name ~* '(chihuahua)' THEN 'Chihuahua' 
                    WHEN location_name ~* '(tamaulipas|reynosa|matamoros)' THEN 'Tamaulipas'
                    WHEN location_name ~* '(veracruz)' THEN 'Veracruz'
                    ELSE 'Nuevo León'
                END as estado_final,
                COUNT(*) as evaluaciones
            FROM supervision_operativa_cas
            WHERE location_name IS NOT NULL
            GROUP BY location_name,
                CASE 
                    WHEN location_name IN ('Sucursal SC - Santa Catarina', 'Sucursal GC - Garcia', 'Sucursal LH - La Huasteca') THEN 'TEPEYAC'
                    WHEN location_name LIKE '%Centro%' OR location_name LIKE '%CENTRO%' THEN 'CENTRO'
                    WHEN location_name LIKE '%Apodaca%' OR location_name LIKE '%APODACA%' THEN 'APODACA'
                    WHEN location_name LIKE '%Saltillo%' OR location_name LIKE '%SALTILLO%' THEN 'GRUPO SALTILLO'
                    ELSE 'OTROS'
                END,
                CASE 
                    WHEN location_name ~* '(nuevo león|monterrey|garcia|santa catarina|huasteca|apodaca|guadalupe)' THEN 'Nuevo León'
                    WHEN location_name ~* '(saltillo|coahuila)' THEN 'Coahuila'
                    WHEN location_name ~* '(chihuahua)' THEN 'Chihuahua' 
                    WHEN location_name ~* '(tamaulipas|reynosa|matamoros)' THEN 'Tamaulipas'
                    WHEN location_name ~* '(veracruz)' THEN 'Veracruz'
                    ELSE 'Nuevo León'
                END
            ORDER BY grupo_normalizado, estado_final, location_name
        `);
        
        let currentGroup = '';
        
        query.rows.forEach(row => {
            if (row.grupo_normalizado !== currentGroup) {
                currentGroup = row.grupo_normalizado;
                console.log(`\n🏢 GRUPO: ${currentGroup}`);
                console.log('----------------------------------------');
            }
            console.log(`   📍 ${row.location_name} (${row.estado_final}) - ${row.evaluaciones} evaluaciones`);
        });
        
        // Mostrar resumen por grupo
        console.log('\n📊 RESUMEN POR GRUPO:');
        console.log('=======================');
        
        const resumen = await pool.query(`
            SELECT 
                CASE 
                    WHEN location_name IN ('Sucursal SC - Santa Catarina', 'Sucursal GC - Garcia', 'Sucursal LH - La Huasteca') THEN 'TEPEYAC'
                    WHEN location_name LIKE '%Centro%' OR location_name LIKE '%CENTRO%' THEN 'CENTRO'
                    WHEN location_name LIKE '%Apodaca%' OR location_name LIKE '%APODACA%' THEN 'APODACA'
                    WHEN location_name LIKE '%Saltillo%' OR location_name LIKE '%SALTILLO%' THEN 'GRUPO SALTILLO'
                    ELSE 'OTROS'
                END as grupo_normalizado,
                COUNT(DISTINCT location_name) as sucursales_unicas,
                COUNT(*) as total_evaluaciones,
                ROUND(AVG(calificacion_general_pct), 2) as promedio_grupo
            FROM supervision_operativa_cas
            WHERE location_name IS NOT NULL 
                AND calificacion_general_pct IS NOT NULL
            GROUP BY CASE 
                WHEN location_name IN ('Sucursal SC - Santa Catarina', 'Sucursal GC - Garcia', 'Sucursal LH - La Huasteca') THEN 'TEPEYAC'
                WHEN location_name LIKE '%Centro%' OR location_name LIKE '%CENTRO%' THEN 'CENTRO'
                WHEN location_name LIKE '%Apodaca%' OR location_name LIKE '%APODACA%' THEN 'APODACA'
                WHEN location_name LIKE '%Saltillo%' OR location_name LIKE '%SALTILLO%' THEN 'GRUPO SALTILLO'
                ELSE 'OTROS'
            END
            ORDER BY COUNT(*) DESC
        `);
        
        resumen.rows.forEach(row => {
            console.log(`📊 ${row.grupo_normalizado}: ${row.sucursales_unicas} sucursales, ${row.total_evaluaciones} evaluaciones, ${row.promedio_grupo}% promedio`);
        });
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

verifyServerMapping();