const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function validateSaltilloRenames() {
    try {
        console.log('🔍 VALIDANDO CAMBIOS DE NOMBRE EN GRUPO SALTILLO...');
        
        // 1. MOSTRAR TODAS LAS SUCURSALES DEL GRUPO SALTILLO EN CSV
        console.log('\n📊 SUCURSALES DEL GRUPO SALTILLO EN CSV:');
        
        const saltilloCSV = await pool.query(`
            SELECT numero_sucursal, nombre_sucursal, ciudad, estado
            FROM coordenadas_validadas 
            WHERE grupo_operativo = 'GRUPO SALTILLO'
            ORDER BY numero_sucursal
        `);
        
        console.log(`🏢 ${saltilloCSV.rows.length} sucursales del GRUPO SALTILLO en CSV:`);
        saltilloCSV.rows.forEach(sucursal => {
            console.log(`  #${sucursal.numero_sucursal}: ${sucursal.nombre_sucursal} - ${sucursal.ciudad}, ${sucursal.estado}`);
        });
        
        // 2. BUSCAR SUPERVISIONES DE GRUPO SALTILLO EN EL SISTEMA
        console.log('\n📊 SUPERVISIONES DEL GRUPO SALTILLO EN EL SISTEMA:');
        
        const saltilloSupervisions = await pool.query(`
            SELECT DISTINCT 
                s.location_name,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                MIN(s.fecha_supervision) as primera,
                MAX(s.fecha_supervision) as ultima
            FROM supervision_operativa_clean s
            WHERE s.grupo_operativo_limpio = 'GRUPO SALTILLO'
              AND s.area_evaluacion IS NOT NULL
            GROUP BY s.location_name
            ORDER BY s.location_name
        `);
        
        console.log(`📊 ${saltilloSupervisions.rows.length} location_names con supervisiones de GRUPO SALTILLO:`);
        saltilloSupervisions.rows.forEach(sup => {
            console.log(`\n"${sup.location_name}"`);
            console.log(`   📊 ${sup.supervisiones} supervisiones, ${sup.promedio}% promedio`);
            console.log(`   📅 ${sup.primera?.toISOString().split('T')[0]} → ${sup.ultima?.toISOString().split('T')[0]}`);
        });
        
        // 3. VERIFICAR MAPEO ACTUAL DE GRUPO SALTILLO
        console.log('\n🗺️ MAPEO ACTUAL DEL GRUPO SALTILLO:');
        
        const saltilloMapping = await pool.query(`
            SELECT 
                c.numero_sucursal,
                c.nombre_sucursal as nombre_csv,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                CASE 
                    WHEN COUNT(DISTINCT s.submission_id) > 0 THEN 'MAPEADO'
                    ELSE 'SIN_MAPEAR'
                END as status
            FROM coordenadas_validadas c
            LEFT JOIN supervision_normalized_view s ON c.numero_sucursal = s.numero_sucursal
                AND s.area_tipo = 'area_principal'
                AND s.porcentaje IS NOT NULL
            WHERE c.grupo_operativo = 'GRUPO SALTILLO'
            GROUP BY c.numero_sucursal, c.nombre_sucursal
            ORDER BY c.numero_sucursal
        `);
        
        console.log('📋 Estado del mapeo GRUPO SALTILLO:');
        saltilloMapping.rows.forEach(sucursal => {
            const status = sucursal.supervisiones > 0 ? '✅' : '❌';
            console.log(`${status} #${sucursal.numero_sucursal}: ${sucursal.nombre_csv} (${sucursal.supervisiones || 0} supervisiones)`);
        });
        
        // 4. BUSCAR SUPERVISIONES NO MAPEADAS QUE PODRÍAN SER DE SALTILLO
        console.log('\n🔍 SUPERVISIONES NO MAPEADAS QUE PODRÍAN SER DE SALTILLO:');
        
        const unmappedSaltillo = await pool.query(`
            SELECT DISTINCT 
                s.location_name,
                s.grupo_operativo_limpio,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                MIN(s.fecha_supervision) as primera,
                MAX(s.fecha_supervision) as ultima
            FROM supervision_operativa_clean s
            WHERE (s.grupo_operativo_limpio = 'GRUPO SALTILLO' 
                   OR s.location_name ILIKE '%saltillo%'
                   OR s.location_name ILIKE '%lienzo%'
                   OR s.location_name ILIKE '%charro%'
                   OR s.location_name ILIKE '%ramos%'
                   OR s.location_name ILIKE '%arizpe%'
                   OR s.location_name ILIKE '%carranza%'
                   OR s.location_name ILIKE '%gutierrez%'
                   OR s.location_name ILIKE '%pape%')
              AND s.area_evaluacion IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM supervision_normalized_view snv 
                  WHERE snv.location_name = s.location_name
              )
            GROUP BY s.location_name, s.grupo_operativo_limpio
            ORDER BY COUNT(DISTINCT s.submission_id) DESC
        `);
        
        if (unmappedSaltillo.rows.length > 0) {
            console.log('📊 Supervisiones potenciales de Saltillo NO mapeadas:');
            unmappedSaltillo.rows.forEach(row => {
                console.log(`\n"${row.location_name}" (${row.grupo_operativo_limpio})`);
                console.log(`   📊 ${row.supervisiones} supervisiones, ${row.promedio}% promedio`);
                console.log(`   📅 ${row.primera?.toISOString().split('T')[0]} → ${row.ultima?.toISOString().split('T')[0]}`);
            });
        } else {
            console.log('✅ NO hay supervisiones de Saltillo sin mapear');
        }
        
        // 5. BUSCAR PATRONES ESPECÍFICOS DE NOMBRES ANTIGUOS
        console.log('\n🔍 BUSCANDO PATRONES DE NOMBRES ANTIGUOS EN SALTILLO:');
        
        const oldNamePatterns = await pool.query(`
            SELECT DISTINCT location_name, COUNT(*) as registros
            FROM supervision_operativa_clean 
            WHERE (location_name ILIKE '%lienzo%'
               OR location_name ILIKE '%charro%'
               OR location_name ~ '^5[0-9][^0-9]'  -- Números 50-59 que podrían ser Saltillo
               OR location_name ILIKE '%saltillo%')
              AND area_evaluacion IS NOT NULL
            GROUP BY location_name
            ORDER BY registros DESC
        `);
        
        if (oldNamePatterns.rows.length > 0) {
            console.log('📍 Patrones encontrados:');
            oldNamePatterns.rows.forEach(row => {
                console.log(`   "${row.location_name}": ${row.registros} registros`);
            });
        } else {
            console.log('❌ NO se encontraron patrones de nombres antiguos');
        }
        
        // 6. ANÁLISIS ESPECÍFICO DE NÚMEROS 50-59 (RANGO SALTILLO)
        console.log('\n🔍 ANÁLISIS DE NÚMEROS 50-59 (POSIBLE RANGO SALTILLO):');
        
        const saltilloRange = await pool.query(`
            SELECT DISTINCT location_name, COUNT(*) as registros
            FROM supervision_operativa_clean 
            WHERE location_name ~ '^5[0-9][^0-9]'  -- 50, 51, 52, etc.
              AND area_evaluacion IS NOT NULL
            GROUP BY location_name
            ORDER BY 
                CAST(SUBSTRING(location_name FROM '^([0-9]+)') AS INTEGER)
        `);
        
        if (saltilloRange.rows.length > 0) {
            console.log('📍 Location names en rango 50-59:');
            saltilloRange.rows.forEach(row => {
                console.log(`   "${row.location_name}": ${row.registros} registros`);
            });
        } else {
            console.log('❌ NO se encontraron location_names en rango 50-59');
        }
        
        // 7. RECOMENDACIONES PARA MAPEO MANUAL
        console.log('\n💡 ANÁLISIS Y RECOMENDACIONES:');
        
        const totalSaltilloCSV = saltilloCSV.rows.length;
        const totalMapeadas = saltilloMapping.rows.filter(row => row.supervisiones > 0).length;
        const totalSinMapear = saltilloMapping.rows.filter(row => row.supervisiones == 0).length;
        
        console.log(`📊 ESTADO ACTUAL DEL GRUPO SALTILLO:`);
        console.log(`   🏢 ${totalSaltilloCSV} sucursales en CSV`);
        console.log(`   ✅ ${totalMapeadas} sucursales con supervisiones mapeadas`);
        console.log(`   ❌ ${totalSinMapear} sucursales sin supervisiones`);
        
        console.log(`\n🔧 SUCURSALES DE SALTILLO SIN SUPERVISIONES:`);
        saltilloMapping.rows.filter(row => row.supervisiones == 0).forEach(sucursal => {
            console.log(`   ❌ #${sucursal.numero_sucursal}: ${sucursal.nombre_csv}`);
        });
        
        console.log(`\n💡 PRÓXIMOS PASOS:`);
        console.log(`1. Verificar si las sucursales sin supervisiones tienen nombres antiguos en el sistema`);
        console.log(`2. Crear mapeo manual como hicimos con TEPEYAC`);
        console.log(`3. Conectar al API de Zenput para obtener datos directos`);
        
        await pool.end();
        console.log('\n✅ Validación de cambios de nombre en Saltillo completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

validateSaltilloRenames();