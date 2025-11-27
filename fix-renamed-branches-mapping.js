const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function fixRenamedBranchesMapping() {
    try {
        console.log('🔧 CORRIGIENDO MAPEO DE SUCURSALES RENOMBRADAS...');
        
        // 1. IDENTIFICAR LAS 3 SUCURSALES EN EL CSV QUE CORRESPONDEN
        console.log('\n🔍 BUSCANDO GARCÍA, LA HUASTECA Y SANTA CATARINA EN CSV:');
        
        const csvBranches = await pool.query(`
            SELECT numero_sucursal, nombre_sucursal, grupo_operativo, ciudad, estado
            FROM coordenadas_validadas 
            WHERE nombre_sucursal ILIKE '%garcia%' 
               OR nombre_sucursal ILIKE '%huasteca%' 
               OR nombre_sucursal ILIKE '%santa catarina%'
            ORDER BY numero_sucursal
        `);
        
        console.log('📍 Sucursales encontradas en CSV:');
        csvBranches.rows.forEach(branch => {
            console.log(`  #${branch.numero_sucursal}: ${branch.nombre_sucursal} (${branch.grupo_operativo}) - ${branch.ciudad}, ${branch.estado}`);
        });
        
        // 2. MOSTRAR LAS SUPERVISIONES NO MAPEADAS
        console.log('\n📊 SUPERVISIONES NO MAPEADAS (nombres antiguos):');
        
        const unmappedSupervisions = await pool.query(`
            SELECT 
                location_name,
                COUNT(DISTINCT submission_id) as supervisiones,
                ROUND(AVG(porcentaje), 2) as promedio,
                MIN(fecha_supervision) as primera,
                MAX(fecha_supervision) as ultima,
                estado_normalizado,
                grupo_operativo_limpio
            FROM supervision_operativa_clean 
            WHERE location_name IN (
                'Sucursal GC - Garcia', 
                'Sucursal LH - La Huasteca', 
                'Sucursal SC - Santa Catarina'
            )
            AND area_evaluacion IS NOT NULL
            GROUP BY location_name, estado_normalizado, grupo_operativo_limpio
            ORDER BY location_name
        `);
        
        unmappedSupervisions.rows.forEach(sup => {
            console.log(`\n"${sup.location_name}"`);
            console.log(`  📊 ${sup.supervisiones} supervisiones, ${sup.promedio}% promedio`);
            console.log(`  📍 ${sup.estado_normalizado} - ${sup.grupo_operativo_limpio}`);
            console.log(`  📅 ${sup.primera?.toISOString().split('T')[0]} → ${sup.ultima?.toISOString().split('T')[0]}`);
        });
        
        // 3. CREAR MAPEO MANUAL PARA ESTAS 3 SUCURSALES
        console.log('\n🗺️ CREANDO MAPEO PARA SUCURSALES RENOMBRADAS:');
        
        // Primero eliminar la view actual
        await pool.query('DROP VIEW IF EXISTS supervision_normalized_view');
        
        // Crear nueva view con mapeo manual para las sucursales renombradas
        await pool.query(`
            CREATE VIEW supervision_normalized_view AS
            SELECT 
                s.id,
                s.submission_id,
                s.location_name,
                s.fecha_supervision,
                s.area_evaluacion,
                s.puntos_obtenidos,
                s.puntos_maximos,
                s.porcentaje,
                
                -- Datos normalizados del CSV con mapeo manual para renombradas
                COALESCE(c.numero_sucursal, manual_map.numero_sucursal) as numero_sucursal,
                COALESCE(c.nombre_sucursal, manual_map.nombre_sucursal) as nombre_normalizado,
                COALESCE(c.grupo_operativo, manual_map.grupo_operativo) as grupo_normalizado,
                COALESCE(c.ciudad, manual_map.ciudad) as ciudad_normalizada,
                COALESCE(c.estado, manual_map.estado) as estado_normalizado,
                COALESCE(c.latitude, manual_map.latitude) as lat_validada,
                COALESCE(c.longitude, manual_map.longitude) as lng_validada,
                
                -- Indicadores de calidad
                CASE 
                    WHEN c.numero_sucursal IS NOT NULL THEN 'mapped_to_csv'
                    WHEN manual_map.numero_sucursal IS NOT NULL THEN 'manual_mapped'
                    ELSE 'unmapped'
                END as mapping_status,
                
                -- Clasificación de área principal
                CASE 
                    WHEN s.area_evaluacion IN (
                        'ALMACEN GENERAL', 'ALMACEN QUÍMICOS', 'ASADORES', 
                        'AVISO DE FUNCIONAMIENTO, BITACORAS, CARPETA DE FUMIGACION CONTROL',
                        'AREA COCINA FRIA/CALIENTE', 'BARRA DE SERVICIO', 'COMEDOR',
                        'CONGELADOR PAPA', 'CUARTO FRIO 1', 'EXTERIOR SUCURSAL',
                        'FREIDORA DE PAPA', 'REFRIGERADORES DE SERVICIO', 'TIEMPOS DE SERVICIO',
                        'BARRA DE SALSAS', 'BAÑO CLIENTES', 'DISPENSADOR DE REFRESCOS',
                        'ESTACION DE LAVADO DE MANOS', 'MAQUINA DE HIELO', 'CONSERVADOR PAPA FRITA',
                        'ALMACEN JARABES', 'AREA COCINA FRIA/CALIENTE  CALIFICACIÓN',
                        'Area Marinado', 'Area Marinado Calificación Porcentaje %',
                        'COMEDOR AREA COMEDOR', 'CUARTO FRIO 1 CALIFICACION',
                        'ESTACION DE LAVADO DE MANOS CALIFICACION %', 'DISPENSADOR REFRESCOS',
                        'BAÑO DE EMPLEADOS', 'CAJAS DE TOTOPO EMPACADO'
                    ) THEN 'area_principal'
                    ELSE 'area_secundaria'
                END as area_tipo,
                
                -- Períodos con fechas de corte correctas
                CASE 
                    WHEN s.fecha_supervision >= '2025-10-10' THEN 'T4-2025'
                    WHEN s.fecha_supervision BETWEEN '2025-07-01' AND '2025-09-30' THEN 'T3-2025'
                    WHEN s.fecha_supervision BETWEEN '2025-04-01' AND '2025-06-30' THEN 'T2-2025'
                    WHEN s.fecha_supervision BETWEEN '2025-01-01' AND '2025-03-31' THEN 'T1-2025'
                    WHEN s.fecha_supervision BETWEEN '2024-07-01' AND '2024-10-07' THEN 'S2-Foráneas'
                    WHEN s.fecha_supervision >= '2024-10-10' THEN 'T4-2024'
                    ELSE 'Otro'
                END as periodo_supervision
                
            FROM supervision_operativa_clean s
            LEFT JOIN coordenadas_validadas c ON (
                -- Mapeo por número de sucursal extraído del location_name
                CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END = c.numero_sucursal
            )
            LEFT JOIN (
                -- Mapeo manual para sucursales renombradas
                SELECT 
                    'Sucursal GC - Garcia' as old_name,
                    cv.numero_sucursal,
                    cv.nombre_sucursal,
                    cv.grupo_operativo,
                    cv.ciudad,
                    cv.estado,
                    cv.latitude,
                    cv.longitude
                FROM coordenadas_validadas cv 
                WHERE cv.nombre_sucursal ILIKE '%garcia%'
                
                UNION ALL
                
                SELECT 
                    'Sucursal LH - La Huasteca' as old_name,
                    cv.numero_sucursal,
                    cv.nombre_sucursal,
                    cv.grupo_operativo,
                    cv.ciudad,
                    cv.estado,
                    cv.latitude,
                    cv.longitude
                FROM coordenadas_validadas cv 
                WHERE cv.nombre_sucursal ILIKE '%huasteca%'
                
                UNION ALL
                
                SELECT 
                    'Sucursal SC - Santa Catarina' as old_name,
                    cv.numero_sucursal,
                    cv.nombre_sucursal,
                    cv.grupo_operativo,
                    cv.ciudad,
                    cv.estado,
                    cv.latitude,
                    cv.longitude
                FROM coordenadas_validadas cv 
                WHERE cv.nombre_sucursal ILIKE '%santa catarina%'
            ) manual_map ON s.location_name = manual_map.old_name
            
            WHERE s.fecha_supervision >= '2025-02-01'
              AND s.area_evaluacion IS NOT NULL
              AND TRIM(s.area_evaluacion) != ''
        `);
        
        console.log('✅ View normalizada actualizada con mapeo manual');
        
        // 4. PROBAR EL NUEVO MAPEO
        console.log('\n🧪 PROBANDO NUEVO MAPEO:');
        
        const mappingTest = await pool.query(`
            SELECT 
                mapping_status,
                COUNT(*) as registros,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT numero_sucursal) as sucursales_mapeadas
            FROM supervision_normalized_view
            GROUP BY mapping_status
            ORDER BY mapping_status
        `);
        
        console.log('📊 RESULTADOS DEL MAPEO:');
        mappingTest.rows.forEach(row => {
            console.log(`  ${row.mapping_status}: ${row.registros} registros, ${row.supervisiones} supervisiones, ${row.sucursales_mapeadas} sucursales`);
        });
        
        // 5. VERIFICAR LAS 3 SUCURSALES ESPECÍFICAS
        console.log('\n✅ VERIFICANDO LAS 3 SUCURSALES RENOMBRADAS:');
        
        const verifyRenamed = await pool.query(`
            SELECT 
                location_name,
                nombre_normalizado,
                numero_sucursal,
                grupo_normalizado,
                COUNT(DISTINCT submission_id) as supervisiones,
                ROUND(AVG(porcentaje), 2) as promedio,
                mapping_status
            FROM supervision_normalized_view
            WHERE location_name IN (
                'Sucursal GC - Garcia', 
                'Sucursal LH - La Huasteca', 
                'Sucursal SC - Santa Catarina'
            )
            AND area_tipo = 'area_principal'
            AND porcentaje IS NOT NULL
            GROUP BY location_name, nombre_normalizado, numero_sucursal, grupo_normalizado, mapping_status
            ORDER BY location_name
        `);
        
        verifyRenamed.rows.forEach(branch => {
            console.log(`\n"${branch.location_name}" → #${branch.numero_sucursal} ${branch.nombre_normalizado}`);
            console.log(`  👥 ${branch.grupo_normalizado}`);
            console.log(`  📊 ${branch.supervisiones} supervisiones, ${branch.promedio}% promedio`);
            console.log(`  🗺️ Status: ${branch.mapping_status}`);
        });
        
        // 6. RESUMEN FINAL DE COBERTURA
        console.log('\n📈 RESUMEN FINAL DE COBERTURA:');
        
        const finalCoverage = await pool.query(`
            SELECT 
                COUNT(DISTINCT numero_sucursal) as sucursales_mapeadas_total,
                COUNT(DISTINCT submission_id) as supervisiones_totales,
                COUNT(DISTINCT CASE WHEN mapping_status = 'mapped_to_csv' THEN numero_sucursal END) as sucursales_automaticas,
                COUNT(DISTINCT CASE WHEN mapping_status = 'manual_mapped' THEN numero_sucursal END) as sucursales_manuales,
                COUNT(DISTINCT CASE WHEN mapping_status = 'unmapped' THEN submission_id END) as supervisiones_sin_mapear
            FROM supervision_normalized_view
            WHERE area_tipo = 'area_principal'
              AND porcentaje IS NOT NULL
        `);
        
        const coverage = finalCoverage.rows[0];
        console.log(`✅ COBERTURA TOTAL: ${coverage.sucursales_mapeadas_total} sucursales mapeadas`);
        console.log(`   🔄 ${coverage.sucursales_automaticas} sucursales automáticas`);
        console.log(`   🗺️ ${coverage.sucursales_manuales} sucursales mapeadas manualmente`);
        console.log(`   📊 ${coverage.supervisiones_totales} supervisiones totales`);
        console.log(`   ❌ ${coverage.supervisiones_sin_mapear} supervisiones sin mapear`);
        
        // 7. VERIFICAR TODAS LAS SUCURSALES DEL CSV
        console.log('\n🔍 VERIFICACIÓN FINAL - TODAS LAS 85 SUCURSALES DEL CSV:');
        
        const allCSVCoverage = await pool.query(`
            SELECT 
                c.numero_sucursal,
                c.nombre_sucursal,
                c.grupo_operativo,
                c.estado,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                CASE 
                    WHEN COUNT(DISTINCT s.submission_id) > 0 THEN 'CON_SUPERVISIONES'
                    ELSE 'SIN_SUPERVISIONES'
                END as status
            FROM coordenadas_validadas c
            LEFT JOIN supervision_normalized_view s ON c.numero_sucursal = s.numero_sucursal
                AND s.area_tipo = 'area_principal'
                AND s.porcentaje IS NOT NULL
            GROUP BY c.numero_sucursal, c.nombre_sucursal, c.grupo_operativo, c.estado
            ORDER BY 
                CASE WHEN COUNT(DISTINCT s.submission_id) = 0 THEN 1 ELSE 2 END,
                c.numero_sucursal
        `);
        
        const conSupervisionTotal = allCSVCoverage.rows.filter(row => row.supervisiones > 0).length;
        const sinSupervisionTotal = allCSVCoverage.rows.filter(row => row.supervisiones == 0).length;
        
        console.log(`📊 RESULTADO FINAL: ${conSupervisionTotal}/85 sucursales CON supervisiones`);
        console.log(`❌ ${sinSupervisionTotal} sucursales SIN supervisiones:`);
        
        allCSVCoverage.rows.filter(row => row.supervisiones == 0).forEach((sucursal, index) => {
            console.log(`${index + 1}. #${sucursal.numero_sucursal} ${sucursal.nombre_sucursal} (${sucursal.grupo_operativo}) - ${sucursal.estado}`);
        });
        
        await pool.end();
        console.log('\n✅ Corrección de mapeo de sucursales renombradas completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

fixRenamedBranchesMapping();