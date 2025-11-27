const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function analyzeCompleteCoverage() {
    try {
        console.log('🔍 ANALIZANDO COBERTURA COMPLETA DE SUPERVISIONES EN NEON...');
        
        // 1. RESUMEN TOTAL DE TODAS LAS 219 SUPERVISIONES
        console.log('\n📊 RESUMEN TOTAL DE LAS 219 SUPERVISIONES:');
        const totalSummary = await pool.query(`
            SELECT 
                COUNT(DISTINCT submission_id) as total_supervisiones,
                COUNT(DISTINCT location_name) as sucursales_con_supervisiones,
                COUNT(DISTINCT area_evaluacion) as areas_evaluacion_total,
                COUNT(*) as registros_totales,
                MIN(fecha_supervision) as primera_supervision,
                MAX(fecha_supervision) as ultima_supervision,
                DATE_PART('day', MAX(fecha_supervision) - MIN(fecha_supervision)) as dias_periodo
            FROM supervision_operativa_clean 
            WHERE area_evaluacion IS NOT NULL 
              AND TRIM(area_evaluacion) != ''
        `);
        
        const total = totalSummary.rows[0];
        console.log(`📈 TOTAL: ${total.total_supervisiones} supervisiones reales`);
        console.log(`🏢 SUCURSALES: ${total.sucursales_con_supervisiones} sucursales han sido supervisadas`);
        console.log(`📋 ÁREAS: ${total.areas_evaluacion_total} áreas de evaluación diferentes`);
        console.log(`📄 REGISTROS: ${total.registros_totales} registros individuales por área`);
        console.log(`📅 PERÍODO: ${total.primera_supervision?.toISOString().split('T')[0]} → ${total.ultima_supervision?.toISOString().split('T')[0]} (${total.dias_periodo} días)`);
        
        // 2. MAPEO CON LAS 85 SUCURSALES DEL CSV
        console.log('\n🗺️ MAPEO CON LAS 85 SUCURSALES DEL CSV:');
        const mappingCoverage = await pool.query(`
            SELECT 
                -- Del CSV
                c.numero_sucursal,
                c.nombre_sucursal,
                c.grupo_operativo,
                c.estado as estado_csv,
                c.ciudad as ciudad_csv,
                
                -- De supervisiones
                COUNT(DISTINCT s.submission_id) as supervisiones_realizadas,
                COUNT(DISTINCT s.area_evaluacion) as areas_evaluadas,
                ROUND(AVG(s.porcentaje), 2) as promedio_general,
                MIN(s.fecha_supervision) as primera_supervision_sucursal,
                MAX(s.fecha_supervision) as ultima_supervision_sucursal,
                
                -- Status de mapeo
                CASE 
                    WHEN COUNT(DISTINCT s.submission_id) > 0 THEN 'CON_SUPERVISIONES'
                    ELSE 'SIN_SUPERVISIONES'
                END as status_supervision
                
            FROM coordenadas_validadas c
            LEFT JOIN supervision_operativa_clean s ON (
                CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END = c.numero_sucursal
            )
            WHERE s.area_evaluacion IS NOT NULL 
               OR c.numero_sucursal IS NOT NULL  -- Incluir todas las sucursales del CSV
            GROUP BY c.numero_sucursal, c.nombre_sucursal, c.grupo_operativo, c.estado, c.ciudad
            ORDER BY c.numero_sucursal
        `);
        
        const conSupervision = mappingCoverage.rows.filter(row => row.supervisiones_realizadas > 0).length;
        const sinSupervision = mappingCoverage.rows.filter(row => row.supervisiones_realizadas == 0).length;
        
        console.log(`✅ MAPEADAS CON SUPERVISIONES: ${conSupervision} sucursales`);
        console.log(`❌ SIN SUPERVISIONES: ${sinSupervision} sucursales`);
        console.log(`📊 TOTAL EN CSV: ${mappingCoverage.rows.length} sucursales`);
        
        // 3. ANÁLISIS POR GRUPO OPERATIVO
        console.log('\n👥 ANÁLISIS POR GRUPO OPERATIVO (LOS 20 GRUPOS):');
        const grupoAnalysis = await pool.query(`
            SELECT 
                c.grupo_operativo,
                COUNT(DISTINCT c.numero_sucursal) as sucursales_en_grupo,
                COUNT(DISTINCT s.submission_id) as supervisiones_realizadas,
                COUNT(DISTINCT CASE WHEN s.submission_id IS NOT NULL THEN c.numero_sucursal END) as sucursales_supervisadas,
                ROUND(AVG(s.porcentaje), 2) as promedio_grupo,
                COUNT(DISTINCT s.area_evaluacion) as areas_evaluadas,
                MIN(s.fecha_supervision) as primera_supervision_grupo,
                MAX(s.fecha_supervision) as ultima_supervision_grupo
            FROM coordenadas_validadas c
            LEFT JOIN supervision_operativa_clean s ON (
                CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END = c.numero_sucursal
                AND s.area_evaluacion IS NOT NULL
            )
            GROUP BY c.grupo_operativo
            ORDER BY COUNT(DISTINCT s.submission_id) DESC
        `);
        
        grupoAnalysis.rows.forEach((grupo, index) => {
            const cobertura = ((grupo.sucursales_supervisadas || 0) / grupo.sucursales_en_grupo * 100).toFixed(1);
            console.log(`\n${index + 1}. ${grupo.grupo_operativo}:`);
            console.log(`   🏢 ${grupo.sucursales_en_grupo} sucursales en el grupo`);
            console.log(`   ✅ ${grupo.sucursales_supervisadas || 0} sucursales supervisadas (${cobertura}% cobertura)`);
            console.log(`   📊 ${grupo.supervisiones_realizadas || 0} supervisiones realizadas`);
            console.log(`   📈 ${grupo.promedio_grupo || 'N/A'}% promedio del grupo`);
            if (grupo.primera_supervision_grupo) {
                console.log(`   📅 ${grupo.primera_supervision_grupo?.toISOString().split('T')[0]} → ${grupo.ultima_supervision_grupo?.toISOString().split('T')[0]}`);
            }
        });
        
        // 4. SUCURSALES SIN SUPERVISIONES (LAS QUE FALTAN)
        console.log('\n❌ SUCURSALES DEL CSV SIN SUPERVISIONES:');
        const faltantes = mappingCoverage.rows.filter(row => row.supervisiones_realizadas == 0);
        if (faltantes.length > 0) {
            faltantes.forEach((sucursal, index) => {
                console.log(`${index + 1}. #${sucursal.numero_sucursal} ${sucursal.nombre_sucursal} (${sucursal.grupo_operativo}) - ${sucursal.estado_csv}`);
            });
        } else {
            console.log('🎉 ¡TODAS las sucursales del CSV tienen supervisiones!');
        }
        
        // 5. SUPERVISIONES NO MAPEADAS (LAS QUE NO COINCIDEN CON EL CSV)
        console.log('\n⚠️ SUPERVISIONES NO MAPEADAS AL CSV:');
        const noMapeadas = await pool.query(`
            SELECT DISTINCT 
                s.location_name,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                COUNT(DISTINCT s.area_evaluacion) as areas,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                MIN(s.fecha_supervision) as primera,
                MAX(s.fecha_supervision) as ultima
            FROM supervision_operativa_clean s
            WHERE s.area_evaluacion IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM coordenadas_validadas c 
                  WHERE CASE 
                      WHEN s.location_name ~ '^[0-9]+' THEN 
                          CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                      ELSE NULL 
                  END = c.numero_sucursal
              )
            GROUP BY s.location_name
            ORDER BY COUNT(DISTINCT s.submission_id) DESC
        `);
        
        if (noMapeadas.rows.length > 0) {
            console.log(`⚠️ ${noMapeadas.rows.length} location_names NO MAPEADOS al CSV:`);
            noMapeadas.rows.forEach((loc, index) => {
                console.log(`${index + 1}. "${loc.location_name}": ${loc.supervisiones} supervisiones, ${loc.promedio}% promedio`);
            });
        } else {
            console.log('🎉 ¡TODAS las supervisiones están mapeadas al CSV!');
        }
        
        // 6. ANÁLISIS TEMPORAL - SUPERVISIONES POR MES
        console.log('\n📅 DISTRIBUCIÓN TEMPORAL DE LAS 219 SUPERVISIONES:');
        const temporal = await pool.query(`
            SELECT 
                DATE_TRUNC('month', fecha_supervision) as mes,
                COUNT(DISTINCT submission_id) as supervisiones_mes,
                COUNT(DISTINCT location_name) as sucursales_mes,
                COUNT(DISTINCT 
                    CASE 
                        WHEN location_name ~ '^[0-9]+' THEN 
                            CAST(SUBSTRING(location_name FROM '^([0-9]+)') AS INTEGER)
                        ELSE NULL 
                    END
                ) as sucursales_csv_mes
            FROM supervision_operativa_clean 
            WHERE area_evaluacion IS NOT NULL
            GROUP BY DATE_TRUNC('month', fecha_supervision)
            ORDER BY mes
        `);
        
        temporal.rows.forEach(row => {
            const mesNombre = row.mes.toISOString().split('T')[0].substring(0, 7);
            console.log(`📆 ${mesNombre}: ${row.supervisiones_mes} supervisiones, ${row.sucursales_mes} sucursales, ${row.sucursales_csv_mes} mapeadas al CSV`);
        });
        
        // 7. RECOMENDACIONES PARA EL SIGUIENTE PASO
        console.log('\n🎯 RECOMENDACIONES PARA EL SIGUIENTE PASO:');
        
        const totalSupervisionesEncontradas = totalSummary.rows[0].total_supervisiones;
        const totalSucursalesCSV = mappingCoverage.rows.length;
        const sucursalesConSupervision = conSupervision;
        const porcentajeCobertura = (sucursalesConSupervision / totalSucursalesCSV * 100).toFixed(1);
        
        console.log(`📊 ESTADO ACTUAL:`);
        console.log(`   ✅ ${totalSupervisionesEncontradas} supervisiones totales identificadas`);
        console.log(`   🗺️ ${sucursalesConSupervision}/${totalSucursalesCSV} sucursales del CSV con supervisiones (${porcentajeCobertura}% cobertura)`);
        console.log(`   📋 29 áreas de evaluación principales identificadas`);
        
        console.log(`\n🚀 PRÓXIMOS PASOS RECOMENDADOS:`);
        console.log(`   1. ✅ COMPLETADO: Mapeo de las 29 áreas con estructura CSV`);
        console.log(`   2. ✅ COMPLETADO: APIs corregidos para mostrar conteos reales`);
        console.log(`   3. 🔄 EN PROCESO: Dashboard funcionando con datos normalizados`);
        console.log(`   4. 📈 SIGUIENTE: Implementar filtros de período (T4/S2) en dashboard`);
        console.log(`   5. 🎯 SIGUIENTE: Dashboard de análisis por grupo operativo`);
        console.log(`   6. 📊 SIGUIENTE: Reportes detallados por sucursal y área`);
        
        if (sinSupervision > 0) {
            console.log(`\n⚠️ ATENCIÓN: ${sinSupervision} sucursales del CSV aún sin supervisiones`);
            console.log(`   - Estas son sucursales válidas pero que no han sido supervisadas`);
            console.log(`   - O tienen location_names que no coinciden con el patrón numérico`);
        }
        
        if (noMapeadas.rows.length > 0) {
            console.log(`\n⚠️ ATENCIÓN: ${noMapeadas.rows.length} location_names no mapeados al CSV`);
            console.log(`   - Estas supervisiones existen pero no coinciden con ninguna sucursal del CSV`);
            console.log(`   - Pueden ser sucursales cerradas, renombradas o con datos incorrectos`);
        }
        
        await pool.end();
        console.log('\n✅ Análisis completo de cobertura finalizado');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

analyzeCompleteCoverage();