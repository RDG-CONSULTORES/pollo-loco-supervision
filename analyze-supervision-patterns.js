const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function analyzeSupervisionPatterns() {
    try {
        console.log('🔍 ANALIZANDO PATRONES DE SUPERVISIÓN LOCALES VS FORÁNEAS...');
        
        // 1. CLASIFICAR SUCURSALES LOCALES VS FORÁNEAS
        console.log('\n📊 CLASIFICACIÓN LOCALES VS FORÁNEAS:');
        
        const classification = await pool.query(`
            SELECT 
                numero_sucursal,
                nombre_sucursal,
                grupo_operativo,
                estado,
                ciudad,
                CASE 
                    WHEN estado IN ('Nuevo León') OR ciudad ILIKE '%saltillo%' OR grupo_operativo ILIKE '%saltillo%' THEN 'LOCAL'
                    ELSE 'FORÁNEA'
                END as tipo_sucursal
            FROM coordenadas_validadas
            ORDER BY 
                CASE WHEN estado IN ('Nuevo León') OR ciudad ILIKE '%saltillo%' OR grupo_operativo ILIKE '%saltillo%' THEN 1 ELSE 2 END,
                numero_sucursal
        `);
        
        const locales = classification.rows.filter(row => row.tipo_sucursal === 'LOCAL');
        const foraneas = classification.rows.filter(row => row.tipo_sucursal === 'FORÁNEA');
        
        console.log(`🏠 LOCALES (cada 3 meses): ${locales.length} sucursales`);
        console.log(`🌎 FORÁNEAS (cada 6 meses): ${foraneas.length} sucursales`);
        
        // 2. ANALIZAR APODACA ESPECÍFICAMENTE
        console.log('\n🔍 ANÁLISIS ESPECÍFICO DE APODACA:');
        
        // Buscar todas las posibles coincidencias de Apodaca
        const apodacaSearch = await pool.query(`
            SELECT DISTINCT location_name, COUNT(*) as registros
            FROM supervision_operativa_clean 
            WHERE location_name ILIKE '%apodaca%' 
               OR location_name ILIKE '%35%'
               OR location_name ~ '35[^0-9]'
            GROUP BY location_name
            ORDER BY registros DESC
        `);
        
        console.log('📍 Búsqueda de Apodaca en location_name:');
        if (apodacaSearch.rows.length > 0) {
            apodacaSearch.rows.forEach(row => {
                console.log(`   "${row.location_name}": ${row.registros} registros`);
            });
        } else {
            console.log('   ❌ NO se encontró ninguna coincidencia para Apodaca');
        }
        
        // Buscar por patrones similares
        const similarNames = await pool.query(`
            SELECT DISTINCT location_name, COUNT(*) as registros
            FROM supervision_operativa_clean 
            WHERE location_name ~ '^3[0-9]'  -- Números que empiecen con 3
            GROUP BY location_name
            ORDER BY location_name
        `);
        
        console.log('\n📍 Location names que empiezan con 3:');
        similarNames.rows.forEach(row => {
            console.log(`   "${row.location_name}": ${row.registros} registros`);
        });
        
        // 3. ANÁLISIS DE FRECUENCIA DE SUPERVISIÓN POR TIPO
        console.log('\n📅 ANÁLISIS DE FRECUENCIA DE SUPERVISIÓN:');
        
        const frequencyAnalysis = await pool.query(`
            WITH supervision_data AS (
                SELECT 
                    c.numero_sucursal,
                    c.nombre_sucursal,
                    c.grupo_operativo,
                    c.estado,
                    CASE 
                        WHEN c.estado IN ('Nuevo León') OR c.ciudad ILIKE '%saltillo%' OR c.grupo_operativo ILIKE '%saltillo%' THEN 'LOCAL'
                        ELSE 'FORÁNEA'
                    END as tipo_sucursal,
                    COUNT(DISTINCT s.submission_id) as total_supervisiones,
                    MIN(s.fecha_supervision) as primera_supervision,
                    MAX(s.fecha_supervision) as ultima_supervision,
                    EXTRACT(EPOCH FROM (MAX(s.fecha_supervision) - MIN(s.fecha_supervision))) / (24*60*60) as dias_periodo,
                    ROUND(AVG(s.porcentaje), 2) as promedio_sucursal
                FROM coordenadas_validadas c
                LEFT JOIN supervision_operativa_clean s ON (
                    CASE 
                        WHEN s.location_name ~ '^[0-9]+' THEN 
                            CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                        ELSE NULL 
                    END = c.numero_sucursal
                    AND s.area_evaluacion IS NOT NULL
                )
                GROUP BY c.numero_sucursal, c.nombre_sucursal, c.grupo_operativo, c.estado, c.ciudad
            )
            SELECT 
                tipo_sucursal,
                COUNT(*) as total_sucursales,
                COUNT(CASE WHEN total_supervisiones > 0 THEN 1 END) as con_supervisiones,
                AVG(total_supervisiones) as promedio_supervisiones,
                AVG(CASE WHEN total_supervisiones > 0 THEN dias_periodo END) as promedio_dias_periodo,
                AVG(CASE WHEN total_supervisiones > 0 THEN promedio_sucursal END) as promedio_performance
            FROM supervision_data
            GROUP BY tipo_sucursal
        `);
        
        frequencyAnalysis.rows.forEach(row => {
            const frecuenciaEsperada = row.tipo_sucursal === 'LOCAL' ? 'cada 3 meses (90 días)' : 'cada 6 meses (180 días)';
            const frecuenciaReal = row.promedio_dias_periodo ? Math.round(row.promedio_dias_periodo / row.promedio_supervisiones) : 'N/A';
            
            console.log(`\n${row.tipo_sucursal}:`);
            console.log(`   📊 ${row.con_supervisiones}/${row.total_sucursales} sucursales con supervisiones`);
            console.log(`   📈 ${Number(row.promedio_supervisiones).toFixed(1)} supervisiones promedio por sucursal`);
            console.log(`   ⏱️ Frecuencia esperada: ${frecuenciaEsperada}`);
            console.log(`   ⏱️ Frecuencia real: ${frecuenciaReal} días promedio entre supervisiones`);
            console.log(`   🎯 Performance promedio: ${Number(row.promedio_performance || 0).toFixed(1)}%`);
        });
        
        // 4. SUCURSALES LOCALES CON POCAS SUPERVISIONES
        console.log('\n⚠️ SUCURSALES LOCALES QUE DEBERÍAN TENER MÁS SUPERVISIONES:');
        
        const localesConPocas = await pool.query(`
            WITH supervision_data AS (
                SELECT 
                    c.numero_sucursal,
                    c.nombre_sucursal,
                    c.grupo_operativo,
                    c.estado,
                    COUNT(DISTINCT s.submission_id) as total_supervisiones,
                    MIN(s.fecha_supervision) as primera_supervision,
                    MAX(s.fecha_supervision) as ultima_supervision,
                    ROUND(AVG(s.porcentaje), 2) as promedio_sucursal
                FROM coordenadas_validadas c
                LEFT JOIN supervision_operativa_clean s ON (
                    CASE 
                        WHEN s.location_name ~ '^[0-9]+' THEN 
                            CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                        ELSE NULL 
                    END = c.numero_sucursal
                    AND s.area_evaluacion IS NOT NULL
                )
                WHERE c.estado IN ('Nuevo León') OR c.ciudad ILIKE '%saltillo%' OR c.grupo_operativo ILIKE '%saltillo%'
                GROUP BY c.numero_sucursal, c.nombre_sucursal, c.grupo_operativo, c.estado
            )
            SELECT *,
                CASE 
                    WHEN total_supervisiones = 0 THEN 'SIN_SUPERVISIONES'
                    WHEN total_supervisiones < 3 THEN 'POCAS_SUPERVISIONES'
                    ELSE 'SUPERVISIONES_ADECUADAS'
                END as status_supervision
            FROM supervision_data
            WHERE total_supervisiones < 3  -- Menos de 3 supervisiones (cada 3 meses desde marzo = al menos 3)
            ORDER BY total_supervisiones, numero_sucursal
        `);
        
        console.log(`⚠️ ${localesConPocas.rows.length} sucursales locales con menos de 3 supervisiones:`);
        localesConPocas.rows.forEach((sucursal, index) => {
            console.log(`\n${index + 1}. #${sucursal.numero_sucursal} ${sucursal.nombre_sucursal} (${sucursal.grupo_operativo})`);
            console.log(`   📊 ${sucursal.total_supervisiones} supervisiones`);
            console.log(`   🎯 ${sucursal.promedio_sucursal || 'N/A'}% promedio`);
            if (sucursal.primera_supervision) {
                console.log(`   📅 ${sucursal.primera_supervision?.toISOString().split('T')[0]} → ${sucursal.ultima_supervision?.toISOString().split('T')[0]}`);
            }
        });
        
        // 5. BUSCAR PATRONES DE LOCATION_NAME PARA APODACA
        console.log('\n🔍 BÚSQUEDA EXHAUSTIVA DE APODACA:');
        
        // Buscar todos los location_names únicos para ver patrones
        const allLocationNames = await pool.query(`
            SELECT DISTINCT location_name
            FROM supervision_operativa_clean 
            WHERE area_evaluacion IS NOT NULL
            ORDER BY location_name
        `);
        
        console.log(`\n📋 TOTAL DE ${allLocationNames.rows.length} location_names únicos encontrados`);
        
        // Buscar nombres que podrían ser Apodaca
        const possibleApodaca = allLocationNames.rows.filter(row => 
            row.location_name.toLowerCase().includes('apodaca') ||
            row.location_name.includes('35') ||
            row.location_name.toLowerCase().includes('apod') ||
            row.location_name.toLowerCase().includes('poda')
        );
        
        if (possibleApodaca.length > 0) {
            console.log('\n🎯 Posibles coincidencias para Apodaca:');
            possibleApodaca.forEach(row => {
                console.log(`   "${row.location_name}"`);
            });
        } else {
            console.log('\n❌ NO se encontraron patrones que coincidan con Apodaca');
            
            // Mostrar algunos location_names para ver el patrón
            console.log('\n📝 Ejemplos de location_names para entender el patrón:');
            allLocationNames.rows.slice(0, 20).forEach(row => {
                console.log(`   "${row.location_name}"`);
            });
        }
        
        // 6. VERIFICAR SI HAY SUPERVISIONES SIN MAPEAR QUE PODRÍAN SER APODACA
        console.log('\n🔍 SUPERVISIONES NO MAPEADAS QUE PODRÍAN SER SUCURSALES FALTANTES:');
        
        const unmappedSupervisions = await pool.query(`
            SELECT 
                s.location_name,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                COUNT(DISTINCT s.area_evaluacion) as areas,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                MIN(s.fecha_supervision) as primera,
                MAX(s.fecha_supervision) as ultima,
                s.estado_normalizado,
                s.grupo_operativo_limpio
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
            GROUP BY s.location_name, s.estado_normalizado, s.grupo_operativo_limpio
            ORDER BY COUNT(DISTINCT s.submission_id) DESC
        `);
        
        if (unmappedSupervisions.rows.length > 0) {
            console.log(`\n📊 ${unmappedSupervisions.rows.length} supervisiones no mapeadas:`);
            unmappedSupervisions.rows.forEach((sup, index) => {
                console.log(`\n${index + 1}. "${sup.location_name}"`);
                console.log(`   📊 ${sup.supervisiones} supervisiones, ${sup.promedio}% promedio`);
                console.log(`   📍 ${sup.estado_normalizado} - ${sup.grupo_operativo_limpio}`);
                console.log(`   📅 ${sup.primera?.toISOString().split('T')[0]} → ${sup.ultima?.toISOString().split('T')[0]}`);
            });
        }
        
        await pool.end();
        console.log('\n✅ Análisis de patrones de supervisión completado');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

analyzeSupervisionPatterns();