const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function fixCleanView() {
    try {
        console.log('🔧 RECREANDO view para mapear correctamente con CSV...');
        
        // Drop existing view
        await pool.query('DROP VIEW IF EXISTS supervision_dashboard_view');
        console.log('✅ Old view dropped');
        
        // First, let's see what we have in both tables
        console.log('\n🔍 Analizando datos actuales...');
        
        // Check supervision_operativa_clean structure
        const supervisionSample = await pool.query(`
            SELECT location_name, COUNT(*) as count
            FROM supervision_operativa_clean 
            WHERE fecha_supervision >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY location_name
            ORDER BY count DESC
            LIMIT 10
        `);
        
        console.log('📊 Sample location_names in supervision_operativa_clean:');
        supervisionSample.rows.forEach(row => {
            console.log(`  "${row.location_name}" -> ${row.count} supervisiones`);
        });
        
        // Check coordenadas_validadas
        const coordenadas = await pool.query(`
            SELECT numero_sucursal, nombre_sucursal, grupo_operativo
            FROM coordenadas_validadas 
            ORDER BY numero_sucursal
            LIMIT 10
        `);
        
        console.log('\n📍 Sample coordenadas_validadas:');
        coordenadas.rows.forEach(row => {
            console.log(`  ${row.numero_sucursal}: "${row.nombre_sucursal}" (${row.grupo_operativo})`);
        });
        
        // Test different matching strategies
        console.log('\n🧪 Probando diferentes estrategias de mapeo...');
        
        // Strategy 1: Extract number from start of location_name
        const strategy1 = await pool.query(`
            SELECT 
                COUNT(*) as matches,
                COUNT(DISTINCT s.location_name) as unique_locations
            FROM supervision_operativa_clean s
            JOIN coordenadas_validadas c ON (
                CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END = c.numero_sucursal
            )
            WHERE s.fecha_supervision >= CURRENT_DATE - INTERVAL '90 days'
        `);
        console.log(`🎯 Strategy 1 (number extraction): ${strategy1.rows[0].matches} matches, ${strategy1.rows[0].unique_locations} locations`);
        
        // Strategy 2: Try to match by name similarity
        const strategy2 = await pool.query(`
            SELECT 
                COUNT(*) as matches,
                COUNT(DISTINCT s.location_name) as unique_locations
            FROM supervision_operativa_clean s
            JOIN coordenadas_validadas c ON (
                UPPER(TRIM(s.location_name)) = UPPER(TRIM(c.nombre_sucursal))
                OR s.location_name ILIKE '%' || c.nombre_sucursal || '%'
                OR c.nombre_sucursal ILIKE '%' || s.location_name || '%'
            )
            WHERE s.fecha_supervision >= CURRENT_DATE - INTERVAL '90 days'
        `);
        console.log(`🎯 Strategy 2 (name matching): ${strategy2.rows[0].matches} matches, ${strategy2.rows[0].unique_locations} locations`);
        
        // Let's see which locations are NOT matching
        console.log('\n❌ Location names que NO mapean:');
        const unmatched = await pool.query(`
            SELECT DISTINCT s.location_name, COUNT(*) as count
            FROM supervision_operativa_clean s
            WHERE s.fecha_supervision >= CURRENT_DATE - INTERVAL '90 days'
            AND NOT EXISTS (
                SELECT 1 FROM coordenadas_validadas c 
                WHERE CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END = c.numero_sucursal
            )
            GROUP BY s.location_name
            ORDER BY count DESC
            LIMIT 10
        `);
        
        unmatched.rows.forEach(row => {
            console.log(`  "${row.location_name}" -> ${row.count} supervisiones NO MAPEADAS`);
        });
        
        // Create improved view with better mapping
        console.log('\n🏗️ Creando nueva view mejorada...');
        
        await pool.query(`
            CREATE VIEW supervision_dashboard_view AS
            SELECT 
                s.*,
                -- Coordenadas del CSV validado
                c.numero_sucursal,
                c.nombre_sucursal as nombre_estandarizado,
                c.grupo_operativo,
                c.ciudad as ciudad_validada,
                c.estado as estado_validado,
                c.latitude as lat,
                c.longitude as lng,
                
                -- Indicar fuente de coordenadas
                CASE 
                    WHEN c.numero_sucursal IS NOT NULL THEN 'validated_csv'
                    ELSE 'unmapped'
                END as coordinate_source,
                
                -- Período con fechas de corte correctas T4/S2
                CASE 
                    WHEN s.fecha_supervision >= '2025-10-10' THEN 'T4 Local 2025'
                    WHEN s.fecha_supervision BETWEEN '2025-07-01' AND '2025-09-30' THEN 'T3 Local 2025'
                    WHEN s.fecha_supervision BETWEEN '2025-04-01' AND '2025-06-30' THEN 'T2 Local 2025'
                    WHEN s.fecha_supervision BETWEEN '2025-01-01' AND '2025-03-31' THEN 'T1 Local 2025'
                    WHEN s.fecha_supervision BETWEEN '2024-07-01' AND '2024-10-07' THEN 'S2 Foráneas 2024'
                    WHEN s.fecha_supervision BETWEEN '2024-10-10' AND '2024-12-31' THEN 'T4 Local 2024'
                    ELSE 'Otro período'
                END as periodo_cas,
                
                -- Usar grupo del CSV si está mapeado, sino el de supervisión
                COALESCE(c.grupo_operativo, s.grupo_operativo_limpio) as grupo_final
                
            FROM supervision_operativa_clean s
            LEFT JOIN coordenadas_validadas c ON (
                -- Multiple mapping strategies
                CASE 
                    -- Strategy 1: Extract number from location_name
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER) = c.numero_sucursal
                    -- Strategy 2: Try exact name match
                    WHEN UPPER(TRIM(s.location_name)) = UPPER(TRIM(c.nombre_sucursal)) THEN true
                    -- Strategy 3: Try partial name match
                    WHEN s.location_name ILIKE '%' || c.nombre_sucursal || '%' 
                         OR c.nombre_sucursal ILIKE '%' || s.location_name || '%' THEN true
                    ELSE false
                END
            )
        `);
        
        console.log('✅ Nueva view creada');
        
        // Test new view
        console.log('\n🧪 Testing nueva view...');
        
        const newStats = await pool.query(`
            SELECT 
                coordinate_source,
                COUNT(*) as records,
                COUNT(DISTINCT location_name) as unique_locations,
                COUNT(DISTINCT grupo_final) as unique_groups
            FROM supervision_dashboard_view
            WHERE fecha_supervision >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY coordinate_source
        `);
        
        console.log('📊 Resultados del mapeo:');
        newStats.rows.forEach(row => {
            console.log(`  ${row.coordinate_source}: ${row.records} records, ${row.unique_locations} locations, ${row.unique_groups} groups`);
        });
        
        // Show all 20 groups from CSV
        const allGroups = await pool.query(`
            SELECT 
                c.grupo_operativo,
                COUNT(DISTINCT c.numero_sucursal) as sucursales_csv,
                COUNT(s.id) as supervisiones_mapeadas,
                COUNT(DISTINCT s.location_name) as locations_mapeadas
            FROM coordenadas_validadas c
            LEFT JOIN supervision_dashboard_view s ON c.grupo_operativo = s.grupo_final
                AND s.fecha_supervision >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY c.grupo_operativo
            ORDER BY c.grupo_operativo
        `);
        
        console.log('\n📋 TODOS los 20 grupos operativos del CSV:');
        allGroups.rows.forEach(row => {
            console.log(`  ${row.grupo_operativo}: ${row.sucursales_csv} sucursales, ${row.supervisiones_mapeadas} supervisiones, ${row.locations_mapeadas} locations`);
        });
        
        await pool.end();
        console.log('\n✅ View reconstruction complete');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

fixCleanView();