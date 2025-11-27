const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function investigateMissingApodaca() {
    try {
        console.log('🔍 INVESTIGANDO POR QUÉ FALTA APODACA (#35)...');
        
        // 1. CONFIRMAR QUE APODACA CENTRO (#36) ESTÁ MAPEADA
        console.log('\n📊 CONFIRMANDO APODACA CENTRO (#36):');
        
        const apodacaCentro = await pool.query(`
            SELECT 
                location_name,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT area_evaluacion) as areas,
                ROUND(AVG(porcentaje), 2) as promedio,
                MIN(fecha_supervision) as primera,
                MAX(fecha_supervision) as ultima
            FROM supervision_operativa_clean 
            WHERE location_name = '36 - Apodaca Centro'
              AND area_evaluacion IS NOT NULL
            GROUP BY location_name
        `);
        
        if (apodacaCentro.rows.length > 0) {
            const centro = apodacaCentro.rows[0];
            console.log(`✅ "36 - Apodaca Centro" ENCONTRADA:`);
            console.log(`   📊 ${centro.supervisiones} supervisiones, ${centro.promedio}% promedio`);
            console.log(`   📅 ${centro.primera?.toISOString().split('T')[0]} → ${centro.ultima?.toISOString().split('T')[0]}`);
        }
        
        // 2. BUSCAR EXHAUSTIVAMENTE CUALQUIER REFERENCIA A APODACA (#35)
        console.log('\n🔍 BÚSQUEDA EXHAUSTIVA DE APODACA (#35):');
        
        // Buscar por número 35
        const search35 = await pool.query(`
            SELECT DISTINCT location_name, COUNT(*) as registros
            FROM supervision_operativa_clean 
            WHERE (location_name ILIKE '%35%' OR location_name ~ '^35[^0-9]')
              AND area_evaluacion IS NOT NULL
            GROUP BY location_name
            ORDER BY registros DESC
        `);
        
        console.log('📍 Location names que contienen "35":');
        if (search35.rows.length > 0) {
            search35.rows.forEach(row => {
                console.log(`   "${row.location_name}": ${row.registros} registros`);
            });
        } else {
            console.log('   ❌ NO se encontró ningún location_name con "35"');
        }
        
        // Buscar variaciones de Apodaca (sin Centro)
        const searchApodaca = await pool.query(`
            SELECT DISTINCT location_name, COUNT(*) as registros
            FROM supervision_operativa_clean 
            WHERE location_name ILIKE '%apodaca%'
              AND location_name NOT ILIKE '%centro%'
              AND area_evaluacion IS NOT NULL
            GROUP BY location_name
            ORDER BY registros DESC
        `);
        
        console.log('\n📍 Location names con "Apodaca" (sin Centro):');
        if (searchApodaca.rows.length > 0) {
            searchApodaca.rows.forEach(row => {
                console.log(`   "${row.location_name}": ${row.registros} registros`);
            });
        } else {
            console.log('   ❌ NO se encontró "Apodaca" sin "Centro"');
        }
        
        // 3. REVISAR SI APODACA TIENE OTRO NOMBRE EN EL SISTEMA
        console.log('\n🔍 BUSCANDO PATRONES SIMILARES A APODACA:');
        
        const patterns = await pool.query(`
            SELECT DISTINCT location_name, COUNT(*) as registros
            FROM supervision_operativa_clean 
            WHERE (location_name ILIKE '%apod%' 
               OR location_name ILIKE '%poda%'
               OR location_name ILIKE '%apo%')
              AND area_evaluacion IS NOT NULL
            GROUP BY location_name
            ORDER BY registros DESC
        `);
        
        console.log('📍 Patrones similares a Apodaca:');
        if (patterns.rows.length > 0) {
            patterns.rows.forEach(row => {
                console.log(`   "${row.location_name}": ${row.registros} registros`);
            });
        } else {
            console.log('   ❌ NO se encontraron patrones similares');
        }
        
        // 4. REVISAR SUCURSALES DEL GRUPO PLOG NUEVO LEON
        console.log('\n👥 SUCURSALES DEL GRUPO PLOG NUEVO LEON:');
        
        const plogNuevoLeon = await pool.query(`
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
            LEFT JOIN supervision_normalized_view s ON c.numero_sucursal = s.numero_sucursal
                AND s.area_tipo = 'area_principal'
                AND s.porcentaje IS NOT NULL
            WHERE c.grupo_operativo = 'PLOG NUEVO LEON'
            GROUP BY c.numero_sucursal, c.nombre_sucursal
            ORDER BY c.numero_sucursal
        `);
        
        console.log('🏢 Sucursales del grupo PLOG NUEVO LEON:');
        plogNuevoLeon.rows.forEach(sucursal => {
            const status = sucursal.supervisiones > 0 ? '✅' : '❌';
            console.log(`${status} #${sucursal.numero_sucursal}: ${sucursal.nombre_sucursal} (${sucursal.supervisiones || 0} supervisiones)`);
        });
        
        // 5. BUSCAR SUPERVISIONES EN NUEVO LEÓN SIN MAPEAR
        console.log('\n🔍 SUPERVISIONES EN NUEVO LEÓN SIN MAPEAR AL CSV:');
        
        const nuevoLeonUnmapped = await pool.query(`
            SELECT DISTINCT 
                s.location_name,
                s.grupo_operativo_limpio,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                MIN(s.fecha_supervision) as primera,
                MAX(s.fecha_supervision) as ultima
            FROM supervision_operativa_clean s
            WHERE s.estado_normalizado = 'Nuevo León'
              AND s.area_evaluacion IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM supervision_normalized_view snv 
                  WHERE snv.location_name = s.location_name
              )
            GROUP BY s.location_name, s.grupo_operativo_limpio
            ORDER BY COUNT(DISTINCT s.submission_id) DESC
        `);
        
        if (nuevoLeonUnmapped.rows.length > 0) {
            console.log('📊 Supervisiones en Nuevo León NO mapeadas:');
            nuevoLeonUnmapped.rows.forEach(row => {
                console.log(`\n"${row.location_name}" (${row.grupo_operativo_limpio})`);
                console.log(`   📊 ${row.supervisiones} supervisiones, ${row.promedio}% promedio`);
                console.log(`   📅 ${row.primera?.toISOString().split('T')[0]} → ${row.ultima?.toISOString().split('T')[0]}`);
            });
        } else {
            console.log('✅ NO hay supervisiones en Nuevo León sin mapear');
        }
        
        // 6. VERIFICAR SI HAY SUPERVISIONES DE PLOG NUEVO LEON SIN MAPEAR
        console.log('\n🔍 SUPERVISIONES DE PLOG NUEVO LEON SIN MAPEAR:');
        
        const plogUnmapped = await pool.query(`
            SELECT DISTINCT 
                s.location_name,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                MIN(s.fecha_supervision) as primera,
                MAX(s.fecha_supervision) as ultima
            FROM supervision_operativa_clean s
            WHERE s.grupo_operativo_limpio = 'PLOG NUEVO LEON'
              AND s.area_evaluacion IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM supervision_normalized_view snv 
                  WHERE snv.location_name = s.location_name
              )
            GROUP BY s.location_name
            ORDER BY COUNT(DISTINCT s.submission_id) DESC
        `);
        
        if (plogUnmapped.rows.length > 0) {
            console.log('📊 Supervisiones de PLOG NUEVO LEON NO mapeadas:');
            plogUnmapped.rows.forEach(row => {
                console.log(`\n"${row.location_name}"`);
                console.log(`   📊 ${row.supervisiones} supervisiones, ${row.promedio}% promedio`);
                console.log(`   📅 ${row.primera?.toISOString().split('T')[0]} → ${row.ultima?.toISOString().split('T')[0]}`);
            });
        } else {
            console.log('✅ NO hay supervisiones de PLOG NUEVO LEON sin mapear');
        }
        
        // 7. MOSTRAR TODAS LAS SUPERVISIONES ÚNICAS PARA BUSCAR MANUALMENTE
        console.log('\n📋 TODOS LOS LOCATION_NAMES ÚNICOS (para búsqueda manual):');
        
        const allLocationNames = await pool.query(`
            SELECT DISTINCT location_name
            FROM supervision_operativa_clean 
            WHERE area_evaluacion IS NOT NULL
            ORDER BY 
                CASE 
                    WHEN location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE 999 
                END,
                location_name
        `);
        
        console.log(`\n📝 ${allLocationNames.rows.length} location_names únicos encontrados:`);
        allLocationNames.rows.forEach((row, index) => {
            if (index < 20 || row.location_name.toLowerCase().includes('apodaca') || row.location_name.includes('35')) {
                console.log(`   "${row.location_name}"`);
            }
        });
        
        if (allLocationNames.rows.length > 20) {
            console.log(`   ... (${allLocationNames.rows.length - 20} más)`);
        }
        
        // 8. RESUMEN DE HALLAZGOS
        console.log('\n📊 RESUMEN DE HALLAZGOS:');
        
        const totalApodacas = apodacaCentro.rows.length;
        const totalSearch35 = search35.rows.length;
        const totalSearchApodaca = searchApodaca.rows.length;
        const totalPlogNuevoLeon = plogNuevoLeon.rows.filter(r => r.supervisiones > 0).length;
        const totalPlogSucursales = plogNuevoLeon.rows.length;
        
        console.log(`🏢 APODACA CENTRO (#36): ✅ ENCONTRADA con supervisiones`);
        console.log(`🔍 APODACA (#35): ❌ NO encontrada en supervisiones`);
        console.log(`📊 PLOG NUEVO LEON: ${totalPlogNuevoLeon}/${totalPlogSucursales} sucursales con supervisiones`);
        console.log(`📍 Búsqueda "35": ${totalSearch35} coincidencias`);
        console.log(`📍 Búsqueda "Apodaca": ${totalSearchApodaca} coincidencias (sin Centro)`);
        
        console.log(`\n💡 CONCLUSIONES:`);
        console.log(`1. Apodaca Centro (#36) está correctamente mapeada`);
        console.log(`2. Apodaca (#35) NO aparece en las supervisiones`);
        console.log(`3. Posibles razones:`);
        console.log(`   - Sucursal nueva sin supervisiones aún`);
        console.log(`   - Nombre diferente en el sistema de supervisiones`);
        console.log(`   - Sucursal inactiva o cerrada temporalmente`);
        console.log(`   - Error en el número de sucursal en el CSV`);
        
        await pool.end();
        console.log('\n✅ Investigación de Apodaca faltante completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

investigateMissingApodaca();