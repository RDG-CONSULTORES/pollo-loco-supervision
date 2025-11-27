const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function analyzeStructure() {
    try {
        console.log('🔍 ANALIZANDO ESTRUCTURA DE supervision_operativa_clean...');
        
        // 1. Get all columns
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'supervision_operativa_clean'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 TODOS LOS CAMPOS en supervision_operativa_clean:');
        columns.rows.forEach((col, index) => {
            console.log(`${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // 2. Sample data from recent records
        console.log('\n📊 MUESTRA DE DATOS RECIENTES:');
        const sample = await pool.query(`
            SELECT 
                id, submission_id, location_name, fecha_supervision, 
                area_evaluacion, puntos_obtenidos, puntos_maximos, porcentaje,
                grupo_operativo_limpio, estado_normalizado
            FROM supervision_operativa_clean 
            WHERE fecha_supervision >= '2025-11-01'
            ORDER BY fecha_supervision DESC, location_name, area_evaluacion
            LIMIT 20
        `);
        
        sample.rows.forEach(row => {
            console.log(`  ${row.fecha_supervision?.toISOString().split('T')[0]} | ${row.location_name} | ${row.area_evaluacion} | ${row.porcentaje}% | ${row.grupo_operativo_limpio}`);
        });
        
        // 3. Count DISTINCT areas
        console.log('\n📍 ÁREAS DE EVALUACIÓN DISPONIBLES:');
        const areas = await pool.query(`
            SELECT 
                area_evaluacion,
                COUNT(*) as registros,
                COUNT(DISTINCT location_name) as sucursales,
                COUNT(DISTINCT submission_id) as supervisiones_unicas
            FROM supervision_operativa_clean 
            WHERE fecha_supervision >= '2025-11-01'
            GROUP BY area_evaluacion
            ORDER BY area_evaluacion
        `);
        
        areas.rows.forEach((area, index) => {
            console.log(`${index + 1}. ${area.area_evaluacion}: ${area.registros} registros, ${area.supervisiones_unicas} supervisiones únicas`);
        });
        
        // 4. Count REAL supervisiones (by submission_id)
        console.log('\n🎯 CONTEO REAL DE SUPERVISIONES:');
        const realCount = await pool.query(`
            SELECT 
                COUNT(DISTINCT submission_id) as supervisiones_reales,
                COUNT(DISTINCT location_name) as sucursales_con_supervisiones,
                COUNT(*) as registros_totales,
                MIN(fecha_supervision) as fecha_inicio,
                MAX(fecha_supervision) as fecha_fin
            FROM supervision_operativa_clean 
            WHERE fecha_supervision >= '2025-02-01'
        `);
        
        console.log(`📊 DESDE FEBRERO 2025:`);
        console.log(`  Supervisiones reales (submission_id): ${realCount.rows[0].supervisiones_reales}`);
        console.log(`  Sucursales con supervisiones: ${realCount.rows[0].sucursales_con_supervisiones}`);
        console.log(`  Registros totales (por área): ${realCount.rows[0].registros_totales}`);
        console.log(`  Período: ${realCount.rows[0].fecha_inicio?.toISOString().split('T')[0]} a ${realCount.rows[0].fecha_fin?.toISOString().split('T')[0]}`);
        
        // 5. Show structure of ONE complete supervision
        console.log('\n🔬 ESTRUCTURA DE UNA SUPERVISIÓN COMPLETA:');
        const oneSupervisor = await pool.query(`
            SELECT submission_id 
            FROM supervision_operativa_clean 
            WHERE fecha_supervision >= '2025-11-01'
            GROUP BY submission_id
            ORDER BY COUNT(*) DESC
            LIMIT 1
        `);
        
        if (oneSupervisor.rows.length > 0) {
            const oneComplete = await pool.query(`
                SELECT 
                    area_evaluacion, 
                    puntos_obtenidos, 
                    puntos_maximos, 
                    porcentaje,
                    location_name,
                    fecha_supervision
                FROM supervision_operativa_clean 
                WHERE submission_id = $1
                ORDER BY area_evaluacion
            `, [oneSupervisor.rows[0].submission_id]);
            
            console.log(`\nSubmission ID: ${oneSupervisor.rows[0].submission_id}`);
            console.log(`Sucursal: ${oneComplete.rows[0].location_name}`);
            console.log(`Fecha: ${oneComplete.rows[0].fecha_supervision?.toISOString().split('T')[0]}`);
            console.log(`Áreas evaluadas: ${oneComplete.rows.length}`);
            
            oneComplete.rows.forEach((area, index) => {
                console.log(`  ${index + 1}. ${area.area_evaluacion}: ${area.puntos_obtenidos}/${area.puntos_maximos} (${area.porcentaje}%)`);
            });
            
            // Calculate overall average
            const totalPuntos = oneComplete.rows.reduce((sum, area) => sum + area.puntos_obtenidos, 0);
            const totalMaximos = oneComplete.rows.reduce((sum, area) => sum + area.puntos_maximos, 0);
            const promedioGeneral = (totalPuntos / totalMaximos) * 100;
            
            console.log(`\n📈 PROMEDIO GENERAL: ${totalPuntos}/${totalMaximos} = ${promedioGeneral.toFixed(2)}%`);
        }
        
        await pool.end();
        console.log('\n✅ Análisis complete');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

analyzeStructure();