const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function mapAreasWithCSV() {
    try {
        console.log('🗺️ MAPEANDO LAS 29 ÁREAS DE EVALUACIÓN CON DATOS DEL CSV...');
        
        // 1. Obtener todas las áreas de evaluación distintas
        console.log('\n📋 ÁREAS DE EVALUACIÓN ENCONTRADAS EN supervision_operativa_clean:');
        const areas = await pool.query(`
            SELECT DISTINCT 
                area_evaluacion,
                COUNT(*) as registros_totales,
                COUNT(DISTINCT submission_id) as supervisiones_unicas,
                COUNT(DISTINCT location_name) as sucursales_evaluadas,
                ROUND(AVG(porcentaje), 2) as promedio_general
            FROM supervision_operativa_clean 
            WHERE area_evaluacion IS NOT NULL 
              AND TRIM(area_evaluacion) != ''
              AND fecha_supervision >= '2025-02-01'
            GROUP BY area_evaluacion
            ORDER BY area_evaluacion
        `);
        
        console.log(`\n📊 TOTAL DE ÁREAS ENCONTRADAS: ${areas.rows.length}`);
        areas.rows.forEach((area, index) => {
            console.log(`${index + 1}. "${area.area_evaluacion}"`);
            console.log(`   📈 ${area.registros_totales} registros, ${area.supervisiones_unicas} supervisiones, ${area.sucursales_evaluadas} sucursales, ${area.promedio_general}% promedio`);
        });
        
        // 2. Identificar las 29 áreas principales (las más evaluadas)
        console.log('\n🎯 TOP 29 ÁREAS PRINCIPALES DE EVALUACIÓN:');
        const mainAreas = await pool.query(`
            SELECT DISTINCT 
                area_evaluacion,
                COUNT(*) as total_registros,
                COUNT(DISTINCT submission_id) as total_supervisiones,
                COUNT(DISTINCT location_name) as total_sucursales,
                ROUND(AVG(porcentaje), 2) as promedio_area
            FROM supervision_operativa_clean 
            WHERE area_evaluacion IS NOT NULL 
              AND TRIM(area_evaluacion) != ''
              AND fecha_supervision >= '2025-02-01'
              AND porcentaje IS NOT NULL
            GROUP BY area_evaluacion
            HAVING COUNT(DISTINCT submission_id) >= 10  -- Solo áreas evaluadas en al menos 10 supervisiones
            ORDER BY COUNT(DISTINCT submission_id) DESC, COUNT(*) DESC
            LIMIT 29
        `);
        
        console.log(`\n🏆 LAS 29 ÁREAS MÁS EVALUADAS:`);
        mainAreas.rows.forEach((area, index) => {
            console.log(`${index + 1}. "${area.area_evaluacion}"`);
            console.log(`   📊 ${area.total_supervisiones} supervisiones | ${area.total_sucursales} sucursales | ${area.promedio_area}% promedio`);
        });
        
        // 3. Crear view normalizada que mapee correctamente con el CSV
        console.log('\n🏗️ CREANDO VIEW NORMALIZADA CON CSV...');
        
        // Primero eliminar view existente
        await pool.query('DROP VIEW IF EXISTS supervision_normalized_view');
        
        // Crear nueva view normalizada
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
                
                -- Datos normalizados del CSV
                c.numero_sucursal,
                c.nombre_sucursal as nombre_normalizado,
                c.grupo_operativo as grupo_normalizado,
                c.ciudad as ciudad_normalizada,
                c.estado as estado_normalizado,
                c.latitude as lat_validada,
                c.longitude as lng_validada,
                
                -- Indicadores de calidad
                CASE 
                    WHEN c.numero_sucursal IS NOT NULL THEN 'mapped_to_csv'
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
            WHERE s.fecha_supervision >= '2025-02-01'
              AND s.area_evaluacion IS NOT NULL
              AND TRIM(s.area_evaluacion) != ''
        `);
        
        console.log('✅ View normalizada creada');
        
        // 4. Probar la nueva view normalizada
        console.log('\n🧪 PROBANDO VIEW NORMALIZADA...');
        
        const viewStats = await pool.query(`
            SELECT 
                mapping_status,
                COUNT(*) as registros,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT location_name) as sucursales_originales,
                COUNT(DISTINCT numero_sucursal) as sucursales_mapeadas
            FROM supervision_normalized_view
            GROUP BY mapping_status
        `);
        
        console.log('📊 ESTADÍSTICAS DE MAPEO:');
        viewStats.rows.forEach(row => {
            console.log(`  ${row.mapping_status}: ${row.registros} registros, ${row.supervisiones} supervisiones`);
            console.log(`    ${row.sucursales_originales} sucursales originales → ${row.sucursales_mapeadas} sucursales mapeadas`);
        });
        
        // 5. Mostrar las 29 áreas principales normalizadas
        console.log('\n🎯 LAS 29 ÁREAS PRINCIPALES CON DATOS NORMALIZADOS:');
        const normalizedAreas = await pool.query(`
            SELECT 
                area_evaluacion,
                COUNT(DISTINCT submission_id) as supervisiones_reales,
                COUNT(DISTINCT numero_sucursal) as sucursales_csv_mapeadas,
                COUNT(DISTINCT grupo_normalizado) as grupos_operativos,
                ROUND(AVG(porcentaje), 2) as promedio_normalizado,
                MIN(fecha_supervision) as primera_evaluacion,
                MAX(fecha_supervision) as ultima_evaluacion
            FROM supervision_normalized_view
            WHERE area_tipo = 'area_principal'
              AND porcentaje IS NOT NULL
            GROUP BY area_evaluacion
            ORDER BY COUNT(DISTINCT submission_id) DESC
            LIMIT 29
        `);
        
        normalizedAreas.rows.forEach((area, index) => {
            console.log(`\n${index + 1}. "${area.area_evaluacion}"`);
            console.log(`   📊 ${area.supervisiones_reales} supervisiones reales`);
            console.log(`   🏢 ${area.sucursales_csv_mapeadas} sucursales del CSV mapeadas`);
            console.log(`   👥 ${area.grupos_operativos} grupos operativos`);
            console.log(`   📈 ${area.promedio_normalizado}% promedio normalizado`);
            console.log(`   📅 ${area.primera_evaluacion?.toISOString().split('T')[0]} → ${area.ultima_evaluacion?.toISOString().split('T')[0]}`);
        });
        
        // 6. Verificar mapeo con sucursales del CSV
        console.log('\n🔍 VERIFICANDO MAPEO CON SUCURSALES DEL CSV (85 sucursales):');
        const csvMapping = await pool.query(`
            SELECT 
                c.numero_sucursal,
                c.nombre_sucursal,
                c.grupo_operativo,
                c.estado,
                COUNT(DISTINCT s.submission_id) as supervisiones_realizadas,
                COUNT(DISTINCT s.area_evaluacion) as areas_evaluadas,
                ROUND(AVG(s.porcentaje), 2) as promedio_general_sucursal
            FROM coordenadas_validadas c
            LEFT JOIN supervision_normalized_view s ON c.numero_sucursal = s.numero_sucursal
                AND s.porcentaje IS NOT NULL
            GROUP BY c.numero_sucursal, c.nombre_sucursal, c.grupo_operativo, c.estado
            ORDER BY c.numero_sucursal
        `);
        
        const conSupervision = csvMapping.rows.filter(row => row.supervisiones_realizadas > 0).length;
        const sinSupervision = csvMapping.rows.filter(row => row.supervisiones_realizadas == 0).length;
        
        console.log(`\n📈 RESUMEN DE MAPEO CSV:`);
        console.log(`  ✅ ${conSupervision} sucursales CON supervisiones mapeadas`);
        console.log(`  ❌ ${sinSupervision} sucursales SIN supervisiones`);
        console.log(`  📊 Total: ${csvMapping.rows.length} sucursales en CSV`);
        
        // Mostrar algunas sucursales mapeadas
        console.log(`\n🏆 TOP 10 SUCURSALES CON MÁS SUPERVISIONES:`);
        csvMapping.rows
            .filter(row => row.supervisiones_realizadas > 0)
            .sort((a, b) => b.supervisiones_realizadas - a.supervisiones_realizadas)
            .slice(0, 10)
            .forEach((sucursal, index) => {
                console.log(`${index + 1}. #${sucursal.numero_sucursal} ${sucursal.nombre_sucursal} (${sucursal.grupo_operativo})`);
                console.log(`   📊 ${sucursal.supervisiones_realizadas} supervisiones | ${sucursal.areas_evaluadas} áreas | ${sucursal.promedio_general_sucursal}% promedio`);
            });
        
        await pool.end();
        console.log('\n✅ Mapeo de áreas con CSV completado');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

mapAreasWithCSV();