#!/usr/bin/env node
/**
 * Verificación específica de datos de HOY (2025-10-02)
 * Para investigar por qué no aparecen datos de Eulalio Gutierrez con 60.98%
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:1hLdOZPLDwii@ep-crimson-pond-a5l7mzwx.us-east-2.aws.neon.tech/neondb?sslmode=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkTodaysData() {
    try {
        console.log('🔍 VERIFICACIÓN ESPECÍFICA - DATOS DE HOY');
        console.log('==========================================');
        
        const today = new Date().toISOString().substring(0, 10);
        console.log(`📅 Fecha de hoy: ${today}`);
        
        // 1. Verificar estructura de tablas
        console.log('\n1. 📋 VERIFICANDO ESTRUCTURA DE TABLAS...');
        
        // Verificar si supervision_operativa_detalle existe
        const tableExistsQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'supervision_operativa_detalle'
            )
        `;
        const tableExists = await pool.query(tableExistsQuery);
        console.log(`   ✅ Tabla supervision_operativa_detalle existe: ${tableExists.rows[0].exists}`);
        
        // 2. Buscar datos de HOY en tabla DETALLE
        console.log('\n2. 🔎 BUSCANDO DATOS DE HOY EN TABLA DETALLE...');
        
        const todayDetailQuery = `
            SELECT 
                location_name,
                fecha_supervision,
                area_evaluacion,
                porcentaje,
                submission_id,
                grupo_operativo
            FROM supervision_operativa_detalle
            WHERE fecha_supervision::date = $1
            ORDER BY fecha_supervision DESC, location_name
        `;
        
        const todayDetailResult = await pool.query(todayDetailQuery, [today]);
        console.log(`   📊 Registros encontrados en tabla DETALLE: ${todayDetailResult.rows.length}`);
        
        if (todayDetailResult.rows.length > 0) {
            console.log('   🎯 DATOS DE HOY EN TABLA DETALLE:');
            todayDetailResult.rows.forEach((row, idx) => {
                if (idx < 10) { // Mostrar solo primeros 10
                    const fecha = new Date(row.fecha_supervision).toISOString().substring(0, 16);
                    console.log(`     - ${row.location_name} | ${fecha} | ${row.area_evaluacion || 'GENERAL'} | ${row.porcentaje}% | ${row.grupo_operativo}`);
                }
            });
            if (todayDetailResult.rows.length > 10) {
                console.log(`     ... y ${todayDetailResult.rows.length - 10} más`);
            }
        } else {
            console.log('   ❌ NO se encontraron datos de hoy en tabla DETALLE');
        }
        
        // 3. Buscar datos de HOY en VIEW CLEAN
        console.log('\n3. 🔎 BUSCANDO DATOS DE HOY EN VIEW CLEAN...');
        
        const todayViewQuery = `
            SELECT 
                location_name,
                fecha_supervision,
                area_evaluacion,
                porcentaje,
                submission_id,
                grupo_operativo_limpio
            FROM supervision_operativa_clean
            WHERE fecha_supervision::date = $1
            ORDER BY fecha_supervision DESC, location_name
        `;
        
        const todayViewResult = await pool.query(todayViewQuery, [today]);
        console.log(`   📊 Registros encontrados en VIEW CLEAN: ${todayViewResult.rows.length}`);
        
        if (todayViewResult.rows.length > 0) {
            console.log('   🎯 DATOS DE HOY EN VIEW CLEAN:');
            todayViewResult.rows.forEach((row, idx) => {
                if (idx < 10) { // Mostrar solo primeros 10
                    const fecha = new Date(row.fecha_supervision).toISOString().substring(0, 16);
                    console.log(`     - ${row.location_name} | ${fecha} | ${row.area_evaluacion || 'GENERAL'} | ${row.porcentaje}% | ${row.grupo_operativo_limpio}`);
                }
            });
            if (todayViewResult.rows.length > 10) {
                console.log(`     ... y ${todayViewResult.rows.length - 10} más`);
            }
        } else {
            console.log('   ❌ NO se encontraron datos de hoy en VIEW CLEAN');
        }
        
        // 4. Buscar específicamente Eulalio Gutierrez hoy
        console.log('\n4. 🎯 BUSCANDO ESPECÍFICAMENTE EULALIO GUTIERREZ HOY...');
        
        const eulalioTodayQuery = `
            SELECT 
                location_name,
                fecha_supervision,
                area_evaluacion,
                porcentaje,
                submission_id,
                grupo_operativo_limpio
            FROM supervision_operativa_clean
            WHERE location_name ILIKE '%eulalio%'
            AND fecha_supervision::date = $1
            ORDER BY fecha_supervision DESC
        `;
        
        const eulalioTodayResult = await pool.query(eulalioTodayQuery, [today]);
        console.log(`   📊 Eulalio Gutierrez HOY: ${eulalioTodayResult.rows.length} registros`);
        
        if (eulalioTodayResult.rows.length > 0) {
            console.log('   🎯 EULALIO GUTIERREZ - DATOS DE HOY:');
            eulalioTodayResult.rows.forEach(row => {
                const fecha = new Date(row.fecha_supervision).toISOString().substring(0, 16);
                console.log(`     - ${fecha} | ${row.area_evaluacion || 'GENERAL'} | ${row.porcentaje}% | ID: ${row.submission_id}`);
            });
        } else {
            console.log('   ❌ NO se encontraron datos de Eulalio Gutierrez para hoy');
        }
        
        // 5. Verificar última fecha de Eulalio Gutierrez
        console.log('\n5. 📅 ÚLTIMA SUPERVISIÓN DE EULALIO GUTIERREZ...');
        
        const eulalioLatestQuery = `
            SELECT 
                location_name,
                fecha_supervision,
                area_evaluacion,
                porcentaje,
                submission_id,
                grupo_operativo_limpio
            FROM supervision_operativa_clean
            WHERE location_name ILIKE '%eulalio%'
            ORDER BY fecha_supervision DESC
            LIMIT 10
        `;
        
        const eulalioLatestResult = await pool.query(eulalioLatestQuery);
        console.log(`   📊 Últimas supervisiones de Eulalio Gutierrez:`);
        
        eulalioLatestResult.rows.forEach(row => {
            const fecha = new Date(row.fecha_supervision).toISOString().substring(0, 16);
            console.log(`     - ${fecha} | ${row.area_evaluacion || 'GENERAL'} | ${row.porcentaje}% | ID: ${row.submission_id}`);
        });
        
        // 6. Verificar datos recientes (últimos 3 días)
        console.log('\n6. 📆 DATOS RECIENTES (ÚLTIMOS 3 DÍAS)...');
        
        const recentQuery = `
            SELECT 
                location_name,
                fecha_supervision::date as fecha,
                COUNT(*) as registros,
                AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END) as promedio_general
            FROM supervision_operativa_clean
            WHERE fecha_supervision >= CURRENT_DATE - INTERVAL '3 days'
            GROUP BY location_name, fecha_supervision::date
            ORDER BY fecha_supervision::date DESC, location_name
        `;
        
        const recentResult = await pool.query(recentQuery);
        console.log(`   📊 Supervisiones de los últimos 3 días (${recentResult.rows.length} grupos):`);
        
        recentResult.rows.forEach(row => {
            console.log(`     - ${row.location_name} | ${row.fecha} | ${row.registros} registros | ${row.promedio_general || 'N/A'}% promedio`);
        });
        
        // 7. CONCLUSIÓN
        console.log('\n==========================================');
        console.log('🎯 CONCLUSIÓN:');
        
        if (todayDetailResult.rows.length === 0 && todayViewResult.rows.length === 0) {
            console.log('❌ NO hay datos de hoy (2025-10-02) en ninguna tabla');
            console.log('📋 Posibles causas:');
            console.log('   1. ETL no se ha ejecutado hoy');
            console.log('   2. ETL falló al procesar datos de hoy');
            console.log('   3. Datos de hoy aún no han sido enviados desde Zenput');
            console.log('   4. Problema de conectividad en ETL');
        } else if (todayDetailResult.rows.length > 0 && todayViewResult.rows.length === 0) {
            console.log('⚠️  Datos en tabla DETALLE pero NO en VIEW CLEAN');
            console.log('📋 Posible causa: View no está actualizado o tiene filtros');
        } else {
            console.log('✅ Datos de hoy encontrados correctamente');
        }
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error en verificación:', error.message);
        await pool.end();
        process.exit(1);
    }
}

checkTodaysData();