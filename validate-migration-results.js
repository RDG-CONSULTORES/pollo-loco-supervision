#!/usr/bin/env node

// 🧪 VALIDACIÓN LOCAL - MIGRACIÓN CALIFICACION_GENERAL_PCT
// Compara resultados método actual vs método nuevo para La Huasteca

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function validateMigration() {
    try {
        console.log('🧪 VALIDACIÓN DE MIGRACIÓN - La Huasteca');
        console.log('=' .repeat(60));
        
        // MÉTODO ACTUAL: supervision_normalized_view (promedio de áreas)
        console.log('\n📊 MÉTODO ACTUAL (supervision_normalized_view):');
        const currentQuery = `
            SELECT 
                'ACTUAL' as metodo,
                nombre_normalizado as sucursal,
                ROUND(AVG(porcentaje)::numeric, 2) as calificacion_promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(*) as registros_areas,
                array_agg(DISTINCT fecha_supervision::date ORDER BY fecha_supervision::date) as fechas
            FROM supervision_normalized_view 
            WHERE nombre_normalizado = 'La Huasteca'
              AND area_tipo = 'area_principal'
              AND fecha_supervision >= '2025-02-01'
            GROUP BY nombre_normalizado
        `;
        
        const currentResult = await pool.query(currentQuery);
        console.log('Resultado ACTUAL:', currentResult.rows[0]);
        
        // MÉTODO NUEVO: supervision_operativa_cas (calificacion_general_pct)
        console.log('\n🆕 MÉTODO NUEVO (supervision_operativa_cas):');
        const newQuery = `
            SELECT 
                'NUEVO' as metodo,
                location_name as sucursal,
                ROUND(AVG(calificacion_general_pct)::numeric, 2) as calificacion_real,
                COUNT(*) as supervisiones,
                1 as tipo_registro,
                array_agg(DISTINCT date_completed::date ORDER BY date_completed::date) as fechas,
                array_agg(calificacion_general_pct ORDER BY date_completed) as calificaciones_individuales
            FROM supervision_operativa_cas 
            WHERE location_name ILIKE '%huasteca%'
              AND date_completed >= '2025-02-01'
            GROUP BY location_name
        `;
        
        const newResult = await pool.query(newQuery);
        console.log('Resultado NUEVO:', newResult.rows);
        
        // ANÁLISIS T4 ESPECÍFICO (La Huasteca 11 noviembre)
        console.log('\n🎯 ANÁLISIS T4 ESPECÍFICO (11 noviembre 2025):');
        
        // T4 Actual (promedio áreas)
        const t4CurrentQuery = `
            SELECT 
                'T4-ACTUAL' as metodo,
                nombre_normalizado,
                fecha_supervision,
                ROUND(AVG(porcentaje)::numeric, 2) as calificacion,
                COUNT(*) as areas
            FROM supervision_normalized_view 
            WHERE nombre_normalizado = 'La Huasteca'
              AND area_tipo = 'area_principal'
              AND fecha_supervision::date = '2025-11-11'
            GROUP BY nombre_normalizado, fecha_supervision
        `;
        
        const t4CurrentResult = await pool.query(t4CurrentQuery);
        console.log('T4 ACTUAL (11-nov):', t4CurrentResult.rows[0]);
        
        // T4 Nuevo (calificacion_general_pct)  
        const t4NewQuery = `
            SELECT 
                'T4-NUEVO' as metodo,
                location_name,
                date_completed,
                calificacion_general_pct as calificacion_real,
                submission_id
            FROM supervision_operativa_cas 
            WHERE location_name ILIKE '%huasteca%'
              AND date_completed::date = '2025-11-11'
        `;
        
        const t4NewResult = await pool.query(t4NewQuery);
        console.log('T4 NUEVO (11-nov):', t4NewResult.rows);
        
        // COMPARACIÓN FINAL
        console.log('\n📋 COMPARACIÓN FINAL:');
        console.log('=' .repeat(60));
        
        const actualCalif = currentResult.rows[0]?.calificacion_promedio || 'NO ENCONTRADO';
        const nuevaCalif = newResult.rows[0]?.calificacion_real || 'NO ENCONTRADO';
        const t4Actual = t4CurrentResult.rows[0]?.calificacion || 'NO ENCONTRADO';
        const t4Nuevo = t4NewResult.rows[0]?.calificacion_real || 'NO ENCONTRADO';
        
        console.log(`MÉTODO ACTUAL (promedio áreas):  ${actualCalif}%`);
        console.log(`MÉTODO NUEVO (calificacion real): ${nuevaCalif}%`);
        console.log(`T4 ACTUAL (11-nov):              ${t4Actual}%`);
        console.log(`T4 NUEVO (11-nov):               ${t4Nuevo}%`);
        
        if (t4Nuevo == 85.34) {
            console.log('\n✅ VALIDACIÓN EXITOSA: T4 muestra 85.34% (Zenput correcto)');
        } else if (t4Actual == 88.11) {
            console.log('\n⚠️ MÉTODO ACTUAL: T4 muestra 88.11% (promedio áreas)');
            console.log('💡 La migración debe cambiar esto a usar calificacion_general_pct');
        } else {
            console.log('\n❌ VALORES INESPERADOS - Revisar datos');
        }
        
        const diferencia = nuevaCalif && actualCalif ? (parseFloat(nuevaCalif) - parseFloat(actualCalif)).toFixed(2) : 'NO CALCULABLE';
        console.log(`\nDIFERENCIA: ${diferencia}% (esperado: ~-2.76%)`);
        
    } catch (error) {
        console.error('❌ Error en validación:', error.message);
    } finally {
        await pool.end();
    }
}

// Ejecutar validación
validateMigration();