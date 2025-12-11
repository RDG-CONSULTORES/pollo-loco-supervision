const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function verifyApodacaSupervisions() {
    try {
        console.log('🔍 VERIFICACIÓN ESPECÍFICA: SUPERVISIONES DE LAS 3 SUCURSALES DE APODACA');
        console.log('='.repeat(80));
        
        // Información del CSV para referencia
        const apodacaSucursales = [
            { numero: 35, nombre: 'Apodaca', grupo: 'PLOG NUEVO LEON', location_code: '2247034' },
            { numero: 36, nombre: 'Apodaca Centro', grupo: 'PLOG NUEVO LEON', location_code: '2247035' },
            { numero: 40, nombre: 'Plaza 1500', grupo: 'PLOG NUEVO LEON', location_code: '2247039' }
        ];
        
        console.log('\n📋 SUCURSALES APODACA SEGÚN CSV:');
        apodacaSucursales.forEach(suc => {
            console.log(`   #${suc.numero}: ${suc.nombre} (${suc.grupo}) - Code: ${suc.location_code}`);
        });
        
        // 1. VERIFICAR SUPERVISIONES POR NÚMERO DE SUCURSAL
        console.log('\n🔍 1. BÚSQUEDA POR NÚMERO DE SUCURSAL:');
        
        for (const sucursal of apodacaSucursales) {
            console.log(`\n--- SUCURSAL #${sucursal.numero}: ${sucursal.nombre} ---`);
            
            const query = `
                SELECT 
                    location_name,
                    COUNT(DISTINCT submission_id) as total_supervisiones,
                    COUNT(*) as total_registros,
                    MIN(fecha_supervision) as primera_evaluacion,
                    MAX(fecha_supervision) as ultima_evaluacion,
                    ROUND(AVG(porcentaje), 2) as promedio_general,
                    COUNT(DISTINCT area_evaluacion) as areas_evaluadas,
                    grupo_operativo_limpio
                FROM supervision_operativa_clean
                WHERE CASE 
                        WHEN location_name ~ '^[0-9]+' THEN 
                            CAST(SUBSTRING(location_name FROM '^([0-9]+)') AS INTEGER)
                        ELSE NULL 
                    END = $1
                  AND area_evaluacion IS NOT NULL
                GROUP BY location_name, grupo_operativo_limpio
                ORDER BY total_supervisiones DESC;
            `;
            
            const result = await pool.query(query, [sucursal.numero]);
            
            if (result.rows.length > 0) {
                result.rows.forEach(row => {
                    console.log(`   ✅ ENCONTRADA: "${row.location_name}"`);
                    console.log(`      📊 ${row.total_supervisiones} supervisiones (${row.total_registros} registros)`);
                    console.log(`      📅 ${row.primera_evaluacion?.toISOString().split('T')[0]} → ${row.ultima_evaluacion?.toISOString().split('T')[0]}`);
                    console.log(`      📈 Promedio: ${row.promedio_general}% (${row.areas_evaluadas} áreas)`);
                    console.log(`      👥 Grupo: ${row.grupo_operativo_limpio}`);
                });
            } else {
                console.log(`   ❌ NO ENCONTRADA en supervisiones`);
            }
        }
        
        // 2. VERIFICAR POR NOMBRE (BÚSQUEDA FLEXIBLE)
        console.log('\n🔍 2. BÚSQUEDA POR NOMBRE (FLEXIBLE):');
        
        const searchTerms = ['apodaca', 'plaza 1500', 'plaza1500'];
        
        for (const term of searchTerms) {
            console.log(`\n--- Buscando "${term}" ---`);
            
            const query = `
                SELECT 
                    location_name,
                    COUNT(DISTINCT submission_id) as total_supervisiones,
                    ROUND(AVG(porcentaje), 2) as promedio,
                    grupo_operativo_limpio,
                    MIN(fecha_supervision) as primera,
                    MAX(fecha_supervision) as ultima
                FROM supervision_operativa_clean
                WHERE LOWER(location_name) LIKE LOWER($1)
                  AND area_evaluacion IS NOT NULL
                GROUP BY location_name, grupo_operativo_limpio
                ORDER BY total_supervisiones DESC;
            `;
            
            const result = await pool.query(query, [`%${term}%`]);
            
            if (result.rows.length > 0) {
                result.rows.forEach(row => {
                    console.log(`   📍 "${row.location_name}" (${row.grupo_operativo_limpio})`);
                    console.log(`      📊 ${row.total_supervisiones} supervisiones, ${row.promedio}% promedio`);
                    console.log(`      📅 ${row.primera?.toISOString().split('T')[0]} → ${row.ultima?.toISOString().split('T')[0]}`);
                });
            } else {
                console.log(`   ❌ No se encontraron resultados para "${term}"`);
            }
        }
        
        // 3. VERIFICAR GRUPO PLOG NUEVO LEON COMPLETO
        console.log('\n🔍 3. ANÁLISIS COMPLETO DEL GRUPO "PLOG NUEVO LEON":');
        
        const plogQuery = `
            SELECT 
                c.numero_sucursal,
                c.nombre_sucursal,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                CASE 
                    WHEN COUNT(DISTINCT s.submission_id) > 0 THEN 'CON_SUPERVISIONES'
                    ELSE 'SIN_SUPERVISIONES'
                END as status
            FROM coordenadas_validadas c
            LEFT JOIN supervision_operativa_clean s ON (
                CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END = c.numero_sucursal
                AND s.area_evaluacion IS NOT NULL
            )
            WHERE c.grupo_operativo = 'PLOG NUEVO LEON'
            GROUP BY c.numero_sucursal, c.nombre_sucursal
            ORDER BY c.numero_sucursal;
        `;
        
        const plogResult = await pool.query(plogQuery);
        
        console.log('\n👥 SUCURSALES DEL GRUPO PLOG NUEVO LEON:');
        plogResult.rows.forEach(row => {
            const status = row.supervisiones > 0 ? '✅' : '❌';
            const supervisiones = row.supervisiones || 0;
            const promedio = row.promedio || 'N/A';
            
            console.log(`${status} #${row.numero_sucursal}: ${row.nombre_sucursal} (${supervisiones} supervisiones, ${promedio}% promedio)`);
            
            // Marcar específicamente las 3 de Apodaca
            if ([35, 36, 40].includes(row.numero_sucursal)) {
                console.log(`    🎯 ← SUCURSAL DE APODACA`);
            }
        });
        
        // 4. SUPERVISIONES SIN MAPEAR DEL GRUPO
        console.log('\n🔍 4. SUPERVISIONES DE PLOG NUEVO LEON NO MAPEADAS:');
        
        const unmappedQuery = `
            SELECT DISTINCT 
                s.location_name,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                ROUND(AVG(s.porcentaje), 2) as promedio
            FROM supervision_operativa_clean s
            WHERE s.grupo_operativo_limpio = 'PLOG NUEVO LEON'
              AND s.area_evaluacion IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM coordenadas_validadas c
                  WHERE CASE 
                        WHEN s.location_name ~ '^[0-9]+' THEN 
                            CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                        ELSE NULL 
                    END = c.numero_sucursal
              )
            GROUP BY s.location_name
            ORDER BY supervisiones DESC;
        `;
        
        const unmappedResult = await pool.query(unmappedQuery);
        
        if (unmappedResult.rows.length > 0) {
            console.log('\n⚠️ SUPERVISIONES NO MAPEADAS EN PLOG NUEVO LEON:');
            unmappedResult.rows.forEach(row => {
                console.log(`   📍 "${row.location_name}": ${row.supervisiones} supervisiones (${row.promedio}%)`);
            });
        } else {
            console.log('\n✅ Todas las supervisiones de PLOG NUEVO LEON están mapeadas');
        }
        
        // 5. RESUMEN Y DIAGNÓSTICO
        console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
        console.log('='.repeat(50));
        
        const sucursalesConSupervision = plogResult.rows.filter(row => row.supervisiones > 0);
        const sucursalesSinSupervision = plogResult.rows.filter(row => row.supervisiones === 0);
        
        console.log(`🏢 GRUPO PLOG NUEVO LEON: ${plogResult.rows.length} sucursales total`);
        console.log(`✅ CON SUPERVISIONES: ${sucursalesConSupervision.length} sucursales`);
        console.log(`❌ SIN SUPERVISIONES: ${sucursalesSinSupervision.length} sucursales`);
        
        // Verificar específicamente las 3 de Apodaca
        console.log('\n🎯 ESTADO ESPECÍFICO DE LAS 3 APODACA:');
        const apodacaStatus = plogResult.rows.filter(row => [35, 36, 40].includes(row.numero_sucursal));
        
        apodacaStatus.forEach(suc => {
            const status = suc.supervisiones > 0 ? '✅ OPERATIVA' : '❌ SIN SUPERVISIONES';
            console.log(`   #${suc.numero_sucursal} ${suc.nombre_sucursal}: ${status}`);
            if (suc.supervisiones > 0) {
                console.log(`      📊 ${suc.supervisiones} supervisiones, ${suc.promedio}% promedio`);
            }
        });
        
        // 6. CONCLUSIÓN Y RECOMENDACIÓN
        console.log('\n💡 CONCLUSIÓN Y RECOMENDACIÓN:');
        console.log('='.repeat(50));
        
        const apodacaOperativas = apodacaStatus.filter(s => s.supervisiones > 0).length;
        const totalApodaca = apodacaStatus.length;
        
        if (apodacaOperativas === totalApodaca) {
            console.log('✅ TODAS LAS SUCURSALES DE APODACA ESTÁN OPERATIVAS');
            console.log('🚀 SEGURO PROCEDER CON LA MIGRACIÓN DE CALIFICACIONES');
        } else if (apodacaOperativas > 0) {
            console.log(`⚠️ SOLO ${apodacaOperativas}/${totalApodaca} SUCURSALES DE APODACA TIENEN SUPERVISIONES`);
            console.log('🔍 REVISAR SUCURSALES SIN SUPERVISIONES ANTES DE MIGRACIÓN');
            
            const sinSupervision = apodacaStatus.filter(s => s.supervisiones === 0);
            sinSupervision.forEach(suc => {
                console.log(`   ❌ #${suc.numero_sucursal} ${suc.nombre_sucursal}: Verificar si está activa`);
            });
        } else {
            console.log('❌ NINGUNA SUCURSAL DE APODACA TIENE SUPERVISIONES');
            console.log('🛑 NO PROCEDER CON MIGRACIÓN HASTA RESOLVER MAPEO');
        }
        
        await pool.end();
        console.log('\n✅ Verificación de Apodaca completada');
        
    } catch (error) {
        console.error('❌ Error en verificación:', error);
        await pool.end();
    }
}

verifyApodacaSupervisions();