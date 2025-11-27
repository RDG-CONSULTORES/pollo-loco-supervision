const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function createNormalizedView() {
    try {
        console.log('🏗️ Creating supervision_normalized_view for production...');
        
        // Drop existing views if they exist
        await pool.query('DROP VIEW IF EXISTS supervision_normalized_view CASCADE');
        
        // Create the normalized view that correctly maps supervisions to CSV coordinates
        await pool.query(`
            CREATE VIEW supervision_normalized_view AS
            WITH area_mapping AS (
                SELECT DISTINCT
                    submission_id,
                    location_name,
                    fecha_supervision,
                    grupo_operativo_limpio,
                    estado_normalizado,
                    municipio,
                    porcentaje,
                    area_evaluacion,
                    -- Extract number from location_name for mapping
                    CASE 
                        WHEN location_name ~ '^[0-9]+' THEN 
                            CAST(SUBSTRING(location_name FROM '^([0-9]+)') AS INTEGER)
                        ELSE NULL 
                    END as numero_extraido,
                    -- Classify area types
                    CASE 
                        WHEN area_evaluacion IS NULL OR area_evaluacion = '' OR area_evaluacion = 'PUNTOS MAXIMOS' THEN 'area_general'
                        ELSE 'area_principal'
                    END as area_tipo
                FROM supervision_operativa_clean
                WHERE porcentaje IS NOT NULL
            ),
            coordinate_mapping AS (
                SELECT 
                    am.*,
                    -- Manual mapping for renamed branches
                    CASE 
                        WHEN am.location_name = 'Sucursal GC - Garcia' THEN 6
                        WHEN am.location_name = 'Sucursal LH - La Huasteca' THEN 7 
                        WHEN am.location_name = 'Sucursal SC - Santa Catarina' THEN 4
                        ELSE am.numero_extraido
                    END as numero_final,
                    -- Get CSV coordinates
                    c.numero_sucursal,
                    c.nombre_sucursal,
                    c.grupo_operativo as grupo_csv,
                    c.ciudad as ciudad_csv, 
                    c.estado as estado_csv,
                    c.latitude as lat_validada,
                    c.longitude as lng_validada
                FROM area_mapping am
                LEFT JOIN coordenadas_validadas c ON (
                    CASE 
                        WHEN am.location_name = 'Sucursal GC - Garcia' THEN 6
                        WHEN am.location_name = 'Sucursal LH - La Huasteca' THEN 7 
                        WHEN am.location_name = 'Sucursal SC - Santa Catarina' THEN 4
                        ELSE am.numero_extraido
                    END = c.numero_sucursal
                )
            )
            SELECT 
                cm.submission_id,
                cm.location_name,
                cm.fecha_supervision,
                cm.grupo_operativo_limpio as grupo_original,
                cm.estado_normalizado,
                cm.municipio,
                cm.porcentaje,
                cm.area_evaluacion,
                cm.area_tipo,
                
                -- Use CSV data when available, fallback to original
                COALESCE(cm.numero_sucursal, cm.numero_final) as numero_sucursal,
                COALESCE(cm.nombre_sucursal, cm.location_name) as nombre_normalizado,
                COALESCE(cm.grupo_csv, cm.grupo_operativo_limpio) as grupo_normalizado,
                COALESCE(cm.ciudad_csv, cm.municipio) as ciudad_normalizada,
                COALESCE(cm.estado_csv, cm.estado_normalizado) as estado_final,
                cm.lat_validada,
                cm.lng_validada,
                
                -- Track mapping status
                CASE 
                    WHEN cm.lat_validada IS NOT NULL THEN 'mapped_to_csv'
                    ELSE 'no_csv_match'
                END as mapping_status
                
            FROM coordinate_mapping cm
        `);
        
        console.log('✅ supervision_normalized_view created successfully');
        
        // Test the view
        const testResult = await pool.query(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT submission_id) as real_supervisiones,
                COUNT(DISTINCT numero_sucursal) as sucursales_mapeadas,
                COUNT(DISTINCT grupo_normalizado) as grupos,
                COUNT(CASE WHEN mapping_status = 'mapped_to_csv' THEN 1 END) as csv_mapped,
                MAX(fecha_supervision) as latest_date,
                MIN(fecha_supervision) as earliest_date
            FROM supervision_normalized_view
            WHERE area_tipo = 'area_principal'
        `);
        
        const stats = testResult.rows[0];
        console.log('\n📊 PRODUCTION VIEW STATISTICS:');
        console.log(`   📈 Total records: ${stats.total_records}`);
        console.log(`   📊 Real supervisions: ${stats.real_supervisiones}`);
        console.log(`   🏢 Mapped locations: ${stats.sucursales_mapeadas}`);
        console.log(`   👥 Groups: ${stats.grupos}`);
        console.log(`   ✅ CSV mapped: ${stats.csv_mapped}`);
        console.log(`   📅 Date range: ${stats.earliest_date?.toISOString()?.split('T')[0]} → ${stats.latest_date?.toISOString()?.split('T')[0]}`);
        
        // Test KPI calculation like the server does
        const kpiTest = await pool.query(`
            SELECT 
                COUNT(DISTINCT submission_id) as total_supervisiones,
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT numero_sucursal) as sucursales_evaluadas,
                COUNT(DISTINCT grupo_normalizado) as total_grupos
            FROM supervision_normalized_view 
            WHERE porcentaje IS NOT NULL 
              AND area_tipo = 'area_principal'
              AND fecha_supervision >= '2025-02-01'
        `);
        
        const kpis = kpiTest.rows[0];
        console.log('\n🎯 PRODUCTION KPI TEST:');
        console.log(`   📊 Total supervisions: ${kpis.total_supervisiones} (should be 219)`);
        console.log(`   📈 Average: ${kpis.promedio_general}%`);
        console.log(`   🏢 Locations: ${kpis.sucursales_evaluadas}`);
        console.log(`   👥 Groups: ${kpis.total_grupos}`);
        
        await pool.end();
        console.log('\n✅ Production normalized view creation completed');
        
    } catch (error) {
        console.error('❌ Error creating normalized view:', error);
        await pool.end();
    }
}

createNormalizedView();