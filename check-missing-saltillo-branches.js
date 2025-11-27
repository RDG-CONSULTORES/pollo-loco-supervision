const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function checkMissingSaltilloBranches() {
    try {
        console.log('🔍 VERIFICANDO SUCURSALES FALTANTES DE SALTILLO...');
        
        // 1. ANALIZAR "51 - Constituyentes" y "50 - Patio"
        console.log('\n📊 ANÁLISIS DE SUCURSALES FALTANTES:');
        
        const missingBranches = await pool.query(`
            SELECT 
                s.location_name,
                s.grupo_operativo_limpio,
                s.estado_normalizado,
                COUNT(DISTINCT s.submission_id) as supervisiones,
                COUNT(DISTINCT s.area_evaluacion) as areas_evaluadas,
                ROUND(AVG(s.porcentaje), 2) as promedio,
                MIN(s.fecha_supervision) as primera_supervision,
                MAX(s.fecha_supervision) as ultima_supervision
            FROM supervision_operativa_clean s
            WHERE s.location_name IN ('50 - Patio', '51 - Constituyentes')
              AND s.area_evaluacion IS NOT NULL
            GROUP BY s.location_name, s.grupo_operativo_limpio, s.estado_normalizado
            ORDER BY s.location_name
        `);
        
        missingBranches.rows.forEach(branch => {
            console.log(`\n📍 "${branch.location_name}"`);
            console.log(`   👥 Grupo: ${branch.grupo_operativo_limpio}`);
            console.log(`   📍 Estado: ${branch.estado_normalizado}`);
            console.log(`   📊 ${branch.supervisiones} supervisiones, ${branch.promedio}% promedio`);
            console.log(`   📋 ${branch.areas_evaluadas} áreas evaluadas`);
            console.log(`   📅 ${branch.primera_supervision?.toISOString().split('T')[0]} → ${branch.ultima_supervision?.toISOString().split('T')[0]}`);
        });
        
        // 2. VERIFICAR SI ESTÁN EN COAHUILA (SALTILLO)
        console.log('\n🗺️ VERIFICANDO UBICACIÓN GEOGRÁFICA:');
        
        const locationCheck = await pool.query(`
            SELECT DISTINCT 
                location_name,
                estado_normalizado,
                municipio,
                grupo_operativo_limpio
            FROM supervision_operativa_clean 
            WHERE location_name IN ('50 - Patio', '51 - Constituyentes')
              AND area_evaluacion IS NOT NULL
        `);
        
        locationCheck.rows.forEach(loc => {
            const isCoahuila = loc.estado_normalizado?.toLowerCase().includes('coahuila');
            const isSaltillo = loc.municipio?.toLowerCase().includes('saltillo') || 
                             loc.grupo_operativo_limpio?.toLowerCase().includes('saltillo');
            
            console.log(`\n📍 "${loc.location_name}"`);
            console.log(`   🏛️ Estado: ${loc.estado_normalizado}`);
            console.log(`   🏙️ Municipio: ${loc.municipio || 'N/A'}`);
            console.log(`   👥 Grupo: ${loc.grupo_operativo_limpio}`);
            console.log(`   ✅ Es Coahuila: ${isCoahuila ? 'SÍ' : 'NO'}`);
            console.log(`   ✅ Es Saltillo: ${isSaltillo ? 'SÍ' : 'NO'}`);
        });
        
        // 3. COMPARAR CON SUCURSALES CONOCIDAS DE SALTILLO
        console.log('\n📊 COMPARACIÓN CON SUCURSALES CONOCIDAS DE SALTILLO:');
        
        const knownSaltillo = await pool.query(`
            SELECT DISTINCT 
                location_name,
                estado_normalizado,
                municipio,
                COUNT(DISTINCT submission_id) as supervisiones
            FROM supervision_operativa_clean 
            WHERE grupo_operativo_limpio = 'GRUPO SALTILLO'
              AND area_evaluacion IS NOT NULL
            GROUP BY location_name, estado_normalizado, municipio
            ORDER BY location_name
        `);
        
        console.log('🏢 Sucursales conocidas del GRUPO SALTILLO:');
        knownSaltillo.rows.forEach(branch => {
            console.log(`   "${branch.location_name}" - ${branch.estado_normalizado}, ${branch.municipio || 'N/A'} (${branch.supervisiones} supervisiones)`);
        });
        
        // 4. BUSCAR OTRAS SUCURSALES EN RANGO 50-59
        console.log('\n🔍 OTRAS SUCURSALES EN RANGO 50-59:');
        
        const range5059 = await pool.query(`
            SELECT 
                location_name,
                grupo_operativo_limpio,
                estado_normalizado,
                COUNT(DISTINCT submission_id) as supervisiones
            FROM supervision_operativa_clean 
            WHERE location_name ~ '^5[0-9][^0-9]'
              AND area_evaluacion IS NOT NULL
            GROUP BY location_name, grupo_operativo_limpio, estado_normalizado
            ORDER BY CAST(SUBSTRING(location_name FROM '^([0-9]+)') AS INTEGER)
        `);
        
        console.log('📊 Sucursales en rango 50-59:');
        range5059.rows.forEach(branch => {
            const isInCSV = ['52', '53', '54', '55', '56', '57'].some(num => 
                branch.location_name.startsWith(num + ' ')
            );
            const status = isInCSV ? '✅ EN CSV' : '❓ NO EN CSV';
            
            console.log(`   ${status} "${branch.location_name}" - ${branch.grupo_operativo_limpio}, ${branch.estado_normalizado} (${branch.supervisiones} sup.)`);
        });
        
        // 5. PROPUESTA DE NUEVAS SUCURSALES PARA EL CSV
        console.log('\n💡 PROPUESTA DE ACTUALIZACIÓN DEL CSV:');
        
        const shouldBeInCSV = range5059.rows.filter(branch => 
            !['52', '53', '54', '55', '56', '57'].some(num => 
                branch.location_name.startsWith(num + ' ')
            )
        );
        
        if (shouldBeInCSV.length > 0) {
            console.log(`\n🆕 ${shouldBeInCSV.length} sucursales que deberían agregarse al CSV:`);
            
            shouldBeInCSV.forEach((branch, index) => {
                console.log(`\n${index + 1}. "${branch.location_name}"`);
                console.log(`   👥 Grupo: ${branch.grupo_operativo_limpio}`);
                console.log(`   📍 Estado: ${branch.estado_normalizado}`);
                console.log(`   📊 ${branch.supervisiones} supervisiones registradas`);
                
                // Sugerir número de sucursal basado en el location_name
                const numberMatch = branch.location_name.match(/^(\d+)/);
                const suggestedNumber = numberMatch ? numberMatch[1] : 'TBD';
                console.log(`   💡 Número sugerido en CSV: #${suggestedNumber}`);
            });
        } else {
            console.log('✅ No se encontraron sucursales adicionales que agregar al CSV');
        }
        
        // 6. RESUMEN DE COBERTURA ACTUALIZADA
        console.log('\n📈 RESUMEN DE COBERTURA ACTUALIZADA:');
        
        const currentCSVCount = 85; // Sucursales actuales en CSV
        const activeBranchesWithSupervisions = await pool.query(`
            SELECT COUNT(DISTINCT location_name) as total
            FROM supervision_operativa_clean 
            WHERE area_evaluacion IS NOT NULL
              AND location_name NOT IN ('Sucursal GC - Garcia', 'Sucursal LH - La Huasteca', 'Sucursal SC - Santa Catarina')
        `);
        
        const totalActive = activeBranchesWithSupervisions.rows[0].total;
        const currentMapped = 80; // Según nuestro análisis anterior
        const potentialNew = shouldBeInCSV.length;
        
        console.log(`📊 ESTADO ACTUAL:`);
        console.log(`   🏢 ${currentCSVCount} sucursales en CSV`);
        console.log(`   ✅ ${currentMapped} sucursales con supervisiones mapeadas`);
        console.log(`   📊 ${totalActive} sucursales activas en sistema de supervisiones`);
        console.log(`   🆕 ${potentialNew} sucursales adicionales encontradas`);
        
        const newCoveragePercentage = ((currentMapped + potentialNew) / (currentCSVCount + potentialNew) * 100).toFixed(1);
        console.log(`   📈 Cobertura potencial: ${newCoveragePercentage}% si agregamos las faltantes`);
        
        await pool.end();
        console.log('\n✅ Verificación de sucursales faltantes completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

checkMissingSaltilloBranches();