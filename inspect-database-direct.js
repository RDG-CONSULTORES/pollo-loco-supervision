const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:1hLdOZPLDwii@ep-crimson-pond-a5l7mzwx.us-east-2.aws.neon.tech/neondb?sslmode=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function inspectDatabase() {
    try {
        console.log('🚨 INSPECCIÓN DIRECTA DE BASE DE DATOS - INICIANDO');
        console.log('==================================================');
        
        // 1. Check for demo data contamination
        console.log('1. 🔍 Buscando datos DEMO/TEST/ERROR...');
        const demoQuery = `
            SELECT DISTINCT 
                grupo_operativo_limpio, 
                location_name,
                COUNT(*) as registros
            FROM supervision_operativa_clean 
            WHERE grupo_operativo_limpio ILIKE '%DEMO%' 
               OR location_name ILIKE '%DEMO%'
               OR grupo_operativo_limpio ILIKE '%ERROR%'
               OR location_name ILIKE '%ERROR%'
               OR grupo_operativo_limpio ILIKE '%TEST%'
               OR location_name ILIKE '%TEST%'
            GROUP BY grupo_operativo_limpio, location_name
            ORDER BY grupo_operativo_limpio, location_name
        `;
        
        const demoResult = await pool.query(demoQuery);
        
        if (demoResult.rows.length > 0) {
            console.log('❌ DATOS DEMO/TEST ENCONTRADOS:');
            demoResult.rows.forEach(row => {
                console.log(`   - ${row.grupo_operativo_limpio} | ${row.location_name} | ${row.registros} registros`);
            });
        } else {
            console.log('✅ No se encontraron datos demo/test');
        }
        
        // 2. VERIFICAR TABLA REAL vs VIEW
        console.log('\n2. 🎯 COMPARANDO TABLA REAL vs VIEW...');
        
        // First: Check REAL TABLE structure
        console.log('\n📋 TABLA REAL (supervision_operativa_detalle) - Estructura:');
        try {
            const structureQuery = `
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'supervision_operativa_detalle' 
                ORDER BY ordinal_position
                LIMIT 20
            `;
            const structureResult = await pool.query(structureQuery);
            console.log('   📋 Primeras 20 columnas:');
            structureResult.rows.forEach(row => {
                console.log(`   - ${row.column_name}: ${row.data_type}`);
            });
        } catch (error) {
            console.log(`   ❌ Error obteniendo estructura: ${error.message}`);
        }

        // Try different column names for grupo operativo
        console.log('\n📋 BUSCANDO DATOS DE HOY en tabla real (diferentes nombres de columna):');
        const possibleGroupColumns = ['grupo_operativo', 'grupo_operativo_limpio', 'group_name', 'operational_group'];
        
        for (const groupCol of possibleGroupColumns) {
            try {
                const testQuery = `
                    SELECT 
                        location_name,
                        fecha_supervision,
                        ${groupCol}
                    FROM supervision_operativa_detalle
                    WHERE fecha_supervision::date = CURRENT_DATE
                    LIMIT 5
                `;
                const testResult = await pool.query(testQuery);
                console.log(`   ✅ Columna ${groupCol} encontrada - ${testResult.rows.length} registros de hoy:`);
                testResult.rows.forEach(row => {
                    const fecha = new Date(row.fecha_supervision).toISOString().substring(0,16);
                    console.log(`     - ${row.location_name} | ${fecha} | ${row[groupCol]}`);
                });
                break; // Found working column
            } catch (error) {
                console.log(`   ❌ Columna ${groupCol} no existe`);
            }
        }
        
        // Second: Check VIEW (supervision_operativa_clean)
        console.log('\n📊 VIEW (supervision_operativa_clean):');
        const viewQuery = `
            SELECT 
                location_name,
                fecha_supervision,
                area_evaluacion,
                porcentaje,
                submission_id
            FROM supervision_operativa_clean
            WHERE grupo_operativo_limpio = 'GRUPO SALTILLO'
            AND location_name ILIKE '%Eulalio%'
            ORDER BY fecha_supervision DESC
            LIMIT 10
        `;
        
        const viewResult = await pool.query(viewQuery);
        console.log(`   ✅ Encontrados ${viewResult.rows.length} registros en view:`);
        viewResult.rows.forEach(row => {
            const fecha = new Date(row.fecha_supervision).toISOString().substring(0,16);
            console.log(`   - ${fecha} | ${row.area_evaluacion || 'GENERAL'} | ${row.porcentaje}% | ID: ${row.submission_id}`);
        });
        
        // Third: Check TODAY'S data in REAL TABLE
        console.log('\n📅 DATOS DE HOY en tabla REAL:');
        const todayRealQuery = `
            SELECT 
                location_name,
                fecha_supervision,
                area_evaluacion,
                porcentaje,
                submission_id
            FROM supervision_operativa_detalle
            WHERE grupo_operativo_limpio = 'GRUPO SALTILLO'
            AND fecha_supervision::date = CURRENT_DATE
            ORDER BY fecha_supervision DESC, location_name
        `;
        
        try {
            const todayRealResult = await pool.query(todayRealQuery);
            console.log(`   ✅ Encontrados ${todayRealResult.rows.length} registros de hoy en tabla real:`);
            if (todayRealResult.rows.length > 0) {
                todayRealResult.rows.forEach(row => {
                    const fecha = new Date(row.fecha_supervision).toISOString().substring(0,16);
                    console.log(`   - ${row.location_name} | ${fecha} | ${row.area_evaluacion || 'GENERAL'} | ${row.porcentaje}%`);
                });
            } else {
                console.log('   ❌ No se encontraron datos de hoy en tabla real');
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        // Then: Check today's data specifically
        const todayQuery = `
            SELECT 
                location_name,
                fecha_supervision,
                area_evaluacion,
                porcentaje,
                submission_id
            FROM supervision_operativa_clean
            WHERE grupo_operativo_limpio = 'GRUPO SALTILLO'
            AND fecha_supervision::date = CURRENT_DATE
            ORDER BY fecha_supervision DESC, location_name
        `;
        
        const todayResult = await pool.query(todayQuery);
        console.log('\n📅 SUPERVISIONES DE HOY (GRUPO SALTILLO):');
        if (todayResult.rows.length > 0) {
            todayResult.rows.forEach(row => {
                const fecha = new Date(row.fecha_supervision).toISOString().substring(0,16);
                console.log(`   - ${row.location_name} | ${fecha} | ${row.area_evaluacion || 'GENERAL'} | ${row.porcentaje}%`);
            });
        } else {
            console.log('   ❌ No se encontraron supervisiones de hoy');
        }

        const saltilloQuery = `
            SELECT 
                location_name,
                COUNT(DISTINCT submission_id) as supervisiones,
                ROUND(AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)::numeric, 2) as promedio,
                MAX(fecha_supervision) as ultima_supervision
            FROM supervision_operativa_clean
            WHERE grupo_operativo_limpio = 'GRUPO SALTILLO'
            AND area_evaluacion = ''
            GROUP BY location_name
            ORDER BY location_name
        `;
        
        const saltilloResult = await pool.query(saltilloQuery);
        
        if (saltilloResult.rows.length > 0) {
            console.log(`✅ GRUPO SALTILLO - ${saltilloResult.rows.length} sucursales encontradas:`);
            saltilloResult.rows.forEach(row => {
                const fecha = row.ultima_supervision ? new Date(row.ultima_supervision).toISOString().substring(0,10) : 'N/A';
                console.log(`   - ${row.location_name}: ${row.promedio}% (${row.supervisiones} supervisiones, última: ${fecha})`);
            });
        } else {
            console.log('❌ No se encontraron datos para GRUPO SALTILLO');
        }
        
        // 3. Check total database stats
        console.log('\n3. 📊 Estadísticas generales de la base de datos...');
        const statsQuery = `
            SELECT 
                COUNT(*) as total_registros,
                COUNT(DISTINCT grupo_operativo_limpio) as grupos_unicos,
                COUNT(DISTINCT location_name) as sucursales_unicas,
                COUNT(DISTINCT submission_id) as supervisiones_unicas,
                MIN(fecha_supervision::date) as fecha_minima,
                MAX(fecha_supervision::date) as fecha_maxima
            FROM supervision_operativa_clean
        `;
        
        const statsResult = await pool.query(statsQuery);
        const stats = statsResult.rows[0];
        
        console.log('📈 ESTADÍSTICAS GENERALES:');
        console.log(`   - Total registros: ${stats.total_registros}`);
        console.log(`   - Grupos únicos: ${stats.grupos_unicos}`);
        console.log(`   - Sucursales únicas: ${stats.sucursales_unicas}`);
        console.log(`   - Supervisiones únicas: ${stats.supervisiones_unicas}`);
        console.log(`   - Fecha mínima: ${stats.fecha_minima}`);
        console.log(`   - Fecha máxima: ${stats.fecha_maxima}`);
        
        // 4. Test the problematic query
        console.log('\n4. 🔧 Probando consulta problemática...');
        const problematicQuery = `
            SELECT 
                location_name as sucursal,
                grupo_operativo_limpio as grupo_operativo,
                ROUND(AVG(porcentaje)::numeric, 2) as promedio
            FROM supervision_operativa_clean
            WHERE grupo_operativo_limpio = 'GRUPO SALTILLO'
            AND porcentaje IS NOT NULL 
            AND area_evaluacion = ''
            GROUP BY location_name, grupo_operativo_limpio
            ORDER BY promedio DESC
        `;
        
        const problematicResult = await pool.query(problematicQuery);
        
        console.log(`🔧 CONSULTA PROBLEMÁTICA - ${problematicResult.rows.length} resultados:`);
        problematicResult.rows.forEach(row => {
            console.log(`   - ${row.sucursal}: ${row.promedio}% (${row.grupo_operativo})`);
        });
        
        // 5. FINAL RECOMMENDATION
        console.log('\n==================================================');
        if (demoResult.rows.length > 0) {
            console.log('🚨 RECOMENDACIÓN: ELIMINAR DATOS DEMO INMEDIATAMENTE');
            console.log('   Ejecutar: DELETE FROM supervision_operativa_clean WHERE grupo_operativo_limpio ILIKE \'%DEMO%\' OR location_name ILIKE \'%DEMO%\';');
        } else if (saltilloResult.rows.length === 0) {
            console.log('❌ PROBLEMA: No hay datos reales para GRUPO SALTILLO');
        } else {
            console.log('✅ BASE DE DATOS LIMPIA - Problema debe estar en el endpoint');
        }
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error en inspección:', error.message);
        await pool.end();
        process.exit(1);
    }
}

inspectDatabase();