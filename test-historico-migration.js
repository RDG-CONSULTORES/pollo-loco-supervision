#!/usr/bin/env node

// 🧪 TEST MIGRACIÓN ENDPOINT /api/historico
// Valida que el endpoint muestre valores reales individuales para La Huasteca

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function testHistoricoMigration() {
    try {
        console.log('🧪 TESTING MIGRACIÓN /api/historico');
        console.log('=' .repeat(60));
        
        // TEST 1: MÉTODO ACTUAL vs MÉTODO NUEVO - GRUPO SUMMARY
        console.log('\n📊 TEST 1: GRUPO SUMMARY (método actual vs nuevo)');
        
        // Test grupo TEPEYAC - método actual (promedio áreas)
        const currentGroupQuery = `
            SELECT 
                DATE_TRUNC('month', fecha_supervision) as mes,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                grupo_normalizado as grupo
            FROM supervision_normalized_view 
            WHERE grupo_normalizado = 'TEPEYAC'
              AND porcentaje IS NOT NULL
              AND fecha_supervision >= '2025-02-01'
            GROUP BY DATE_TRUNC('month', fecha_supervision), grupo_normalizado
            ORDER BY mes DESC
        `;
        
        const currentResult = await pool.query(currentGroupQuery);
        console.log('ACTUAL (promedio áreas) - TEPEYAC:');
        currentResult.rows.slice(0, 3).forEach((row, i) => {
            console.log(`  ${i+1}. ${row.mes.toDateString().substring(4, 7)}: ${row.promedio}% (${row.evaluaciones} eval)`);
        });
        
        // Test grupo TEPEYAC - método nuevo (calificacion_general_pct)
        const newGroupQuery = `
            WITH cas_performance AS (
                SELECT 
                    submission_id,
                    calificacion_general_pct
                FROM supervision_operativa_cas 
                WHERE calificacion_general_pct IS NOT NULL
            )
            SELECT 
                DATE_TRUNC('month', snv.fecha_supervision) as mes,
                ROUND(AVG(cp.calificacion_general_pct), 2) as promedio,
                COUNT(DISTINCT snv.submission_id) as evaluaciones,
                snv.grupo_normalizado as grupo
            FROM supervision_normalized_view snv
            JOIN cas_performance cp ON snv.submission_id = cp.submission_id
            WHERE snv.grupo_normalizado = 'TEPEYAC'
              AND snv.porcentaje IS NOT NULL 
              AND snv.area_tipo = 'area_principal'
              AND snv.fecha_supervision >= '2025-02-01'
            GROUP BY DATE_TRUNC('month', snv.fecha_supervision), snv.grupo_normalizado
            ORDER BY mes DESC
        `;
        
        const newResult = await pool.query(newGroupQuery);
        console.log('\nNUEVO (calificacion_general_pct) - TEPEYAC:');
        newResult.rows.slice(0, 3).forEach((row, i) => {
            console.log(`  ${i+1}. ${row.mes.toDateString().substring(4, 7)}: ${row.promedio}% (${row.evaluaciones} eval)`);
        });
        
        // TEST 2: INDIVIDUAL SUCURSAL - La Huasteca (CRÍTICO)
        console.log('\n🎯 TEST 2: INDIVIDUAL SUCURSAL - La Huasteca');
        console.log('Este es el test CRÍTICO que debe mostrar valores reales: 85.34%, 88.71%, etc.');
        
        // Método actual (promedio áreas)
        const currentSucQuery = `
            SELECT 
                fecha_supervision as fecha,
                ROUND(AVG(porcentaje), 2) as calificacion_promedio,
                submission_id,
                nombre_normalizado as sucursal,
                'PROMEDIO_AREAS' as tipo
            FROM supervision_normalized_view 
            WHERE nombre_normalizado = 'La Huasteca'
              AND porcentaje IS NOT NULL
              AND area_tipo = 'area_principal'
              AND fecha_supervision >= '2025-02-01'
            GROUP BY fecha_supervision, submission_id, nombre_normalizado
            ORDER BY fecha_supervision DESC
            LIMIT 5
        `;
        
        const currentSucResult = await pool.query(currentSucQuery);
        console.log('\nMÉTODO ACTUAL (promedio áreas) - La Huasteca:');
        currentSucResult.rows.forEach((row, i) => {
            console.log(`  ${i+1}. ${row.fecha.toDateString()}: ${row.calificacion_promedio}% [PROMEDIO]`);
        });
        
        // Método nuevo (calificacion_general_pct) - VALORES REALES
        const newSucQuery = `
            WITH cas_performance AS (
                SELECT 
                    submission_id,
                    calificacion_general_pct
                FROM supervision_operativa_cas 
                WHERE calificacion_general_pct IS NOT NULL
            )
            SELECT 
                snv.fecha_supervision as fecha,
                cp.calificacion_general_pct as calificacion_real,
                snv.submission_id,
                snv.nombre_normalizado as sucursal,
                'REAL' as tipo
            FROM supervision_normalized_view snv
            JOIN cas_performance cp ON snv.submission_id = cp.submission_id
            WHERE snv.nombre_normalizado = 'La Huasteca'
              AND snv.porcentaje IS NOT NULL
              AND snv.area_tipo = 'area_principal'
              AND snv.fecha_supervision >= '2025-02-01'
            GROUP BY snv.fecha_supervision, cp.calificacion_general_pct, snv.submission_id, snv.nombre_normalizado
            ORDER BY snv.fecha_supervision DESC
            LIMIT 5
        `;
        
        const newSucResult = await pool.query(newSucQuery);
        console.log('\nMÉTODO NUEVO (calificacion_general_pct) - La Huasteca:');
        newSucResult.rows.forEach((row, i) => {
            console.log(`  ${i+1}. ${row.fecha.toDateString()}: ${row.calificacion_real}% [REAL ZENPUT] ✨`);
        });
        
        // VALIDACIÓN ESPECÍFICA - 11 de noviembre 85.34%
        console.log('\n🔍 VALIDACIÓN ESPECÍFICA - 11 noviembre 2025:');
        const validationQuery = `
            WITH cas_performance AS (
                SELECT 
                    submission_id,
                    calificacion_general_pct
                FROM supervision_operativa_cas 
                WHERE calificacion_general_pct IS NOT NULL
            )
            SELECT 
                snv.fecha_supervision as fecha,
                cp.calificacion_general_pct as calificacion_real,
                snv.submission_id,
                snv.nombre_normalizado as sucursal
            FROM supervision_normalized_view snv
            JOIN cas_performance cp ON snv.submission_id = cp.submission_id
            WHERE snv.nombre_normalizado = 'La Huasteca'
              AND snv.fecha_supervision::date = '2025-11-11'
              AND snv.area_tipo = 'area_principal'
        `;
        
        const validationResult = await pool.query(validationQuery);
        if (validationResult.rows.length > 0) {
            const novResult = validationResult.rows[0];
            console.log(`📅 11-noviembre: ${novResult.calificacion_real}%`);
            
            if (novResult.calificacion_real == 85.34) {
                console.log('✅ PERFECTO: Muestra 85.34% (valor Zenput correcto)');
            } else {
                console.log(`⚠️ REVISAR: Esperado 85.34%, obtuvo ${novResult.calificacion_real}%`);
            }
        } else {
            console.log('❌ NO ENCONTRADO: 11 de noviembre en La Huasteca');
        }
        
        // TEST 3: COMPARACIÓN RESUMIDA
        console.log('\n📋 COMPARACIÓN RESUMIDA:');
        console.log('=' .repeat(60));
        
        const currentAvg = currentSucResult.rows.length > 0 ? 
            (currentSucResult.rows.reduce((sum, r) => sum + parseFloat(r.calificacion_promedio), 0) / currentSucResult.rows.length).toFixed(2) : 
            'NO DATA';
            
        const newAvg = newSucResult.rows.length > 0 ? 
            (newSucResult.rows.reduce((sum, r) => sum + parseFloat(r.calificacion_real), 0) / newSucResult.rows.length).toFixed(2) : 
            'NO DATA';
        
        console.log(`MÉTODO ACTUAL (promedio áreas):  ${currentAvg}%`);
        console.log(`MÉTODO NUEVO (valores reales):   ${newAvg}%`);
        console.log(`DIFERENCIA:                      ${(parseFloat(newAvg) - parseFloat(currentAvg)).toFixed(2)}%`);
        
        console.log('\n🚀 RESULTADOS ESPERADOS EN ENDPOINT:');
        console.log('1. Grupos: Promedios mensuales usando calificacion_general_pct');
        console.log('2. Sucursal individual: Valores reales 85.34%, 88.71%, 92.97%, 91.91%');
        console.log('3. Usuario satisfecho: "están usando en realidad los datos de calificacion_general"');
        
    } catch (error) {
        console.error('❌ Error en testing:', error.message);
    } finally {
        await pool.end();
    }
}

// Ejecutar test
testHistoricoMigration();