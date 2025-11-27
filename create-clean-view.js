const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function createCleanView() {
    try {
        console.log('🏗️ Creating clean view combining real data + validated coordinates...');
        
        // Drop view if exists
        await pool.query('DROP VIEW IF EXISTS supervision_dashboard_view');
        
        // Create comprehensive view
        await pool.query(`
            CREATE VIEW supervision_dashboard_view AS
            SELECT 
                s.id,
                s.submission_id,
                s.location_id,
                s.location_name,
                s.sucursal_clean,
                s.municipio,
                s.estado_normalizado as estado,
                s.grupo_operativo_limpio as grupo,
                s.director_operativo,
                s.supervisor_campo,
                s.fecha_supervision,
                s.area_evaluacion,
                s.puntos_maximos,
                s.puntos_obtenidos,
                s.porcentaje,
                
                -- Use validated coordinates or fallback to original
                COALESCE(c.latitude, s.latitud) as lat,
                COALESCE(c.longitude, s.longitud) as lng,
                
                -- Additional fields for dashboard
                c.numero_sucursal,
                c.nombre_sucursal as nombre_estandarizado,
                c.ciudad as ciudad_validada,
                c.estado as estado_validado,
                
                -- Period calculation (T4 Local starts Oct 10, S2 Foráneas until Oct 7)
                CASE 
                    WHEN s.fecha_supervision >= '2024-10-10' THEN 'T4 Local'
                    WHEN s.fecha_supervision BETWEEN '2024-04-01' AND '2024-10-07' THEN 'S2 Foráneas'
                    WHEN s.fecha_supervision BETWEEN '2024-01-01' AND '2024-03-31' THEN 'T1 Local'
                    WHEN s.fecha_supervision BETWEEN '2024-07-01' AND '2024-09-30' THEN 'T3 Local'
                    ELSE 'Otro'
                END as periodo_cas,
                
                -- Supervision type inference
                CASE 
                    WHEN s.estado_normalizado = 'Nuevo León' THEN 'Local'
                    ELSE 'Foráneas'
                END as tipo_supervision,
                
                -- Coordinate source tracking
                CASE 
                    WHEN c.latitude IS NOT NULL THEN 'validated_csv'
                    ELSE 'original_db'
                END as coordinate_source
                
            FROM supervision_operativa_clean s
            LEFT JOIN coordenadas_validadas c ON (
                -- Try to match by extracting number from location_name
                CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END = c.numero_sucursal
            )
        `);
        
        console.log('✅ View created');
        
        // Test the view
        console.log('\n🧪 Testing view...');
        
        // Check coordinate mapping success
        const mappingResult = await pool.query(`
            SELECT 
                coordinate_source,
                COUNT(*) as records,
                COUNT(DISTINCT location_name) as unique_locations
            FROM supervision_dashboard_view
            GROUP BY coordinate_source
        `);
        
        console.log('\n📊 Coordinate mapping results:');
        mappingResult.rows.forEach(row => {
            console.log(`  ${row.coordinate_source}: ${row.records} records, ${row.unique_locations} locations`);
        });
        
        // Test key locations
        const keyLocationsResult = await pool.query(`
            SELECT DISTINCT
                location_name,
                nombre_estandarizado,
                grupo,
                lat,
                lng,
                coordinate_source
            FROM supervision_dashboard_view 
            WHERE location_name ~ '^(4|6|7|8)' -- Test key locations
            ORDER BY location_name
        `);
        
        console.log('\n📍 Key location coordinate mapping:');
        keyLocationsResult.rows.forEach(row => {
            console.log(`  ${row.location_name} → ${row.nombre_estandarizado} (${row.grupo})`);
            console.log(`    Coordinates: ${row.lat}, ${row.lng} [${row.coordinate_source}]`);
        });
        
        // Test period logic
        const periodResult = await pool.query(`
            SELECT 
                periodo_cas,
                tipo_supervision,
                COUNT(*) as records,
                MIN(fecha_supervision) as fecha_min,
                MAX(fecha_supervision) as fecha_max
            FROM supervision_dashboard_view
            GROUP BY periodo_cas, tipo_supervision
            ORDER BY fecha_max DESC
        `);
        
        console.log('\n📅 Period distribution:');
        periodResult.rows.forEach(row => {
            console.log(`  ${row.periodo_cas} (${row.tipo_supervision}): ${row.records} records`);
            console.log(`    Dates: ${row.fecha_min?.toISOString()?.split('T')[0]} to ${row.fecha_max?.toISOString()?.split('T')[0]}`);
        });
        
        // Test performance by group with new coordinates
        const performanceResult = await pool.query(`
            SELECT 
                grupo,
                COUNT(DISTINCT location_name) as sucursales,
                COUNT(*) as supervisiones,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(CASE WHEN coordinate_source = 'validated_csv' THEN 1 END) as with_validated_coords
            FROM supervision_dashboard_view
            WHERE porcentaje IS NOT NULL
            GROUP BY grupo
            ORDER BY promedio DESC
            LIMIT 10
        `);
        
        console.log('\n🏆 Top performing groups with coordinate status:');
        performanceResult.rows.forEach(row => {
            console.log(`  ${row.grupo}: ${row.sucursales} sucursales, ${row.promedio}% avg, ${row.with_validated_coords} validated coords`);
        });
        
        await pool.end();
        console.log('\n✅ Clean view creation and testing complete');
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

createCleanView();