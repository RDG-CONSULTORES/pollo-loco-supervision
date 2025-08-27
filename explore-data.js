// Exploración de datos El Pollo Loco
const { Pool } = require('pg');

// Using current DATABASE_URL 
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function explorePolloLocoData() {
  try {
    console.log('🔍 EXPLORANDO ESTRUCTURA DE DATOS EL POLLO LOCO\n');
    
    // 1. Ver estructura completa de columnas
    console.log('📋 1. ESTRUCTURA DE COLUMNAS:');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'supervision_operativa_detalle'
      ORDER BY ordinal_position
    `);
    
    columns.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    // 2. Verificar grupos operativos
    console.log('\n👥 2. GRUPOS OPERATIVOS DISPONIBLES:');
    const grupos = await pool.query(`
      SELECT DISTINCT grupo_operativo, COUNT(*) as registros
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo IS NOT NULL
      GROUP BY grupo_operativo
      ORDER BY grupo_operativo
    `);
    
    grupos.rows.forEach(row => {
      console.log(`   - ${row.grupo_operativo}: ${row.registros} registros`);
    });
    
    // 3. Verificar CALIFICACION GENERAL (PUNTOS MAXIMOS)
    console.log('\n🎯 3. VERIFICANDO CALIFICACIÓN GENERAL:');
    
    // Buscar en diferentes variaciones
    console.log('   Buscando "PUNTOS MAXIMOS" y calculando porcentaje:');
    const puntosMax = await pool.query(`
      SELECT 
        location_name, 
        grupo_operativo, 
        porcentaje,
        puntos_maximos, 
        puntos_obtenidos,
        CASE 
          WHEN puntos_maximos > 0 THEN ROUND((puntos_obtenidos::numeric / puntos_maximos::numeric) * 100, 2)
          ELSE NULL
        END as porcentaje_calculado,
        fecha_supervision
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion = 'PUNTOS MAXIMOS'
        AND puntos_maximos IS NOT NULL
        AND puntos_obtenidos IS NOT NULL
      ORDER BY fecha_supervision DESC
      LIMIT 10
    `);
    
    if (puntosMax.rows.length > 0) {
      puntosMax.rows.forEach(row => {
        console.log(`   ${row.location_name} | ${row.grupo_operativo}: porcentaje=${row.porcentaje}% calculado=${row.porcentaje_calculado}% (${row.puntos_obtenidos}/${row.puntos_maximos})`);
      });
    } else {
      console.log('   ❌ No encontrado como "PUNTOS MAXIMOS"');
    }
    
    // Investigar más sobre PUNTOS MAXIMOS
    console.log('\n   Investigando registros de PUNTOS MAXIMOS:');
    const investigacion = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN porcentaje IS NOT NULL THEN 1 END) as con_porcentaje,
        COUNT(CASE WHEN puntos_maximos IS NOT NULL THEN 1 END) as con_puntos_max,
        COUNT(CASE WHEN puntos_obtenidos IS NOT NULL THEN 1 END) as con_puntos_obt
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion = 'PUNTOS MAXIMOS'
    `);
    
    console.log(`   Total registros: ${investigacion.rows[0].total}`);
    console.log(`   Con porcentaje: ${investigacion.rows[0].con_porcentaje}`);
    console.log(`   Con puntos_maximos: ${investigacion.rows[0].con_puntos_max}`);
    console.log(`   Con puntos_obtenidos: ${investigacion.rows[0].con_puntos_obt}`);
    
    // Ver la secuencia correcta: PUNTOS MAXIMOS → Vacio (puntos totales) → Vacio (porcentaje)
    console.log('\n   Verificando secuencia PUNTOS MAXIMOS → Totales → Porcentaje:');
    const secuencia = await pool.query(`
      SELECT 
        submission_id,
        location_name,
        grupo_operativo,
        area_evaluacion,
        puntos_maximos,
        puntos_obtenidos,
        porcentaje,
        ROW_NUMBER() OVER (PARTITION BY submission_id ORDER BY id) as orden
      FROM supervision_operativa_detalle
      WHERE submission_id IN (
        SELECT DISTINCT submission_id 
        FROM supervision_operativa_detalle 
        WHERE area_evaluacion = 'PUNTOS MAXIMOS'
        LIMIT 3
      )
      AND (area_evaluacion = 'PUNTOS MAXIMOS' OR area_evaluacion = '' OR area_evaluacion IS NULL)
      ORDER BY submission_id, orden
    `);
    
    console.log('\n   Mostrando registros ordenados:');
    let currentSubmission = null;
    secuencia.rows.forEach(row => {
      if (row.submission_id !== currentSubmission) {
        console.log(`\n   === ${row.location_name} (${row.grupo_operativo}) - ${row.submission_id} ===`);
        currentSubmission = row.submission_id;
      }
      console.log(`   ${row.orden}. area="${row.area_evaluacion}" | puntos_max=${row.puntos_maximos} | puntos_obt=${row.puntos_obtenidos} | porcentaje=${row.porcentaje}%`);
    });
    
    // Buscar otras variaciones
    console.log('\n   Buscando variaciones de CALIFICACION GENERAL:');
    const variations = await pool.query(`
      SELECT DISTINCT area_evaluacion, COUNT(*) as count
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion LIKE '%GENERAL%' 
         OR area_evaluacion LIKE '%TOTAL%'
         OR area_evaluacion LIKE '%PUNTOS%'
         OR area_evaluacion LIKE '%CALIFICACION%'
      GROUP BY area_evaluacion
      ORDER BY count DESC
    `);
    
    if (variations.rows.length > 0) {
      variations.rows.forEach(row => {
        console.log(`   "${row.area_evaluacion}": ${row.count} registros`);
      });
    }
    
    // 4. Áreas de evaluación (sin duplicados, sin nulls, sin PUNTOS MAXIMOS)
    console.log('\n📊 4. ÁREAS DE EVALUACIÓN REALES (29):');
    const areas = await pool.query(`
      SELECT DISTINCT area_evaluacion, COUNT(*) as evaluaciones
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion IS NOT NULL 
        AND area_evaluacion != 'PUNTOS MAXIMOS'
        AND area_evaluacion != ''
        AND porcentaje IS NOT NULL
      GROUP BY area_evaluacion
      ORDER BY area_evaluacion
    `);
    
    areas.rows.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.area_evaluacion} (${row.evaluaciones} evaluaciones)`);
    });
    console.log(`   TOTAL: ${areas.rows.length} áreas\n`);
    
    // 2. Verificar CALIFICACION GENERAL
    console.log('🎯 2. VERIFICANDO CALIFICACIÓN GENERAL:');
    const generalExists = await pool.query(`
      SELECT COUNT(*) as count
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion = 'CALIFICACION GENERAL'
    `);
    
    if (parseInt(generalExists.rows[0].count) > 0) {
      console.log('   ✅ CALIFICACION GENERAL existe');
      
      const generalSample = await pool.query(`
        SELECT location_name, grupo_operativo, porcentaje
        FROM supervision_operativa_detalle 
        WHERE area_evaluacion = 'CALIFICACION GENERAL'
        LIMIT 3
      `);
      
      generalSample.rows.forEach(row => {
        console.log(`   ${row.location_name} (${row.grupo_operativo}): ${row.porcentaje}%`);
      });
    } else {
      console.log('   ❌ CALIFICACION GENERAL no encontrada');
    }
    
    // 3. Distribución de calificaciones por área
    console.log('\n📈 3. DISTRIBUCIÓN POR ÁREA (bottom 10):');
    const distribution = await pool.query(`
      SELECT 
        area_evaluacion,
        ROUND(AVG(porcentaje), 2) as promedio,
        ROUND(MIN(porcentaje), 2) as minimo,
        ROUND(MAX(porcentaje), 2) as maximo,
        COUNT(*) as registros
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion IS NOT NULL 
        AND porcentaje IS NOT NULL
        AND area_evaluacion != 'CALIFICACION GENERAL'
      GROUP BY area_evaluacion
      ORDER BY promedio ASC
      LIMIT 10
    `);
    
    distribution.rows.forEach(row => {
      const emoji = row.promedio >= 90 ? '🏆' : row.promedio >= 85 ? '✅' : row.promedio >= 80 ? '⚠️' : '🚨';
      console.log(`   ${emoji} ${row.area_evaluacion}: ${row.promedio}% (${row.minimo}%-${row.maximo}%) [${row.registros} registros]`);
    });
    
    // 4. Top 5 áreas
    console.log('\n🏆 4. TOP 5 ÁREAS:');
    const topAreas = await pool.query(`
      SELECT 
        area_evaluacion,
        ROUND(AVG(porcentaje), 2) as promedio
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion IS NOT NULL 
        AND porcentaje IS NOT NULL
        AND area_evaluacion != 'CALIFICACION GENERAL'
      GROUP BY area_evaluacion
      ORDER BY promedio DESC
      LIMIT 5
    `);
    
    topAreas.rows.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.area_evaluacion}: ${row.promedio}%`);
    });
    
    // 5. Estructura de tabla sample
    console.log('\n📊 5. MUESTRA DE ESTRUCTURA:');
    const sample = await pool.query(`
      SELECT location_name, grupo_operativo, area_evaluacion, porcentaje, fecha_supervision
      FROM supervision_operativa_detalle 
      WHERE area_evaluacion IS NOT NULL
      ORDER BY fecha_supervision DESC
      LIMIT 5
    `);
    
    sample.rows.forEach(row => {
      console.log(`   ${row.location_name} | ${row.grupo_operativo} | ${row.area_evaluacion} | ${row.porcentaje}% | ${row.fecha_supervision.toISOString().split('T')[0]}`);
    });
    
    await pool.end();
    console.log('\n✅ Exploración completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Nueva función para obtener calificaciones de TEPEYAC Q3 2025
async function obtenerCalificacionesTepeyac() {
  try {
    console.log('\n\n🎯 CALIFICACIONES GRUPO TEPEYAC - Q3 2025 (TRIMESTRE ACTUAL)\n');
    
    const result = await pool.query(`
      SELECT DISTINCT
        location_name as sucursal,
        porcentaje as calificacion_general,
        fecha_supervision
      FROM supervision_operativa_detalle
      WHERE grupo_operativo = 'TEPEYAC'
        AND area_evaluacion = ''
        AND porcentaje IS NOT NULL
        AND EXTRACT(YEAR FROM fecha_supervision) = 2025
        AND EXTRACT(QUARTER FROM fecha_supervision) = 3
      ORDER BY porcentaje DESC, location_name
    `);
    
    console.log(`📊 Total sucursales supervisadas: ${result.rows.length}\n`);
    
    result.rows.forEach((row, i) => {
      const emoji = row.calificacion_general >= 95 ? '🏆' : 
                    row.calificacion_general >= 90 ? '✅' : 
                    row.calificacion_general >= 85 ? '⚠️' : '🚨';
      
      console.log(`${i+1}. ${row.sucursal}: ${row.calificacion_general}% ${emoji} (${new Date(row.fecha_supervision).toISOString().split('T')[0]})`);
    });
    
    // Calcular promedio del grupo
    const promedio = result.rows.reduce((sum, row) => sum + parseFloat(row.calificacion_general), 0) / result.rows.length;
    console.log(`\n📈 Promedio Grupo TEPEYAC Q3: ${promedio.toFixed(2)}%`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Nueva función para obtener áreas de oportunidad
async function areasOportunidadTepeyac() {
  try {
    console.log('\n\n🚨 ÁREAS DE OPORTUNIDAD - TEPEYAC Q3 2025\n');
    
    // Obtener las 3 sucursales de TEPEYAC
    const sucursales = ['1 - Pino Suarez', '2 - Madero', '5 - Felix U. Gomez'];
    
    for (const sucursal of sucursales) {
      console.log(`\n📍 ${sucursal}:`);
      
      const areas = await pool.query(`
        SELECT 
          area_evaluacion,
          porcentaje
        FROM supervision_operativa_detalle
        WHERE location_name = $1
          AND grupo_operativo = 'TEPEYAC'
          AND area_evaluacion != ''
          AND area_evaluacion != 'PUNTOS MAXIMOS'
          AND porcentaje IS NOT NULL
          AND porcentaje < 85
          AND EXTRACT(YEAR FROM fecha_supervision) = 2025
          AND EXTRACT(QUARTER FROM fecha_supervision) = 3
        ORDER BY porcentaje ASC
        LIMIT 5
      `, [sucursal]);
      
      if (areas.rows.length === 0) {
        console.log('   ✅ Sin áreas críticas (<85%)');
      } else {
        areas.rows.forEach(row => {
          const emoji = row.porcentaje < 80 ? '🚨' : '⚠️';
          console.log(`   ${emoji} ${row.area_evaluacion}: ${row.porcentaje}%`);
        });
      }
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Función para verificar grupo CRR vs RAP
async function verificarGruposCRR_RAP() {
  try {
    console.log('🔍 VERIFICANDO GRUPOS CRR vs RAP\n');
    
    // 1. Verificar que grupos existen
    console.log('1. GRUPOS DISPONIBLES:');
    const grupos = await pool.query(`
      SELECT DISTINCT grupo_operativo, COUNT(*) as registros
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo IN ('CRR', 'RAP')
      GROUP BY grupo_operativo
      ORDER BY grupo_operativo
    `);
    
    grupos.rows.forEach(row => {
      console.log(`   ${row.grupo_operativo}: ${row.registros} registros`);
    });
    
    // 2. Ver sucursales de cada grupo
    console.log('\n2. SUCURSALES POR GRUPO:');
    
    for (const grupo of ['CRR', 'RAP']) {
      console.log(`\n   GRUPO ${grupo}:`);
      
      const sucursales = await pool.query(`
        SELECT DISTINCT location_name, COUNT(*) as evaluaciones
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo = $1
        GROUP BY location_name
        ORDER BY location_name
        LIMIT 5
      `, [grupo]);
      
      sucursales.rows.forEach(row => {
        console.log(`     • ${row.location_name} (${row.evaluaciones} evaluaciones)`);
      });
    }
    
    // 3. Verificar si "77 - Boulevard Morelos" existe y en qué grupo
    console.log('\n3. VERIFICANDO "77 - Boulevard Morelos":');
    const boulevard = await pool.query(`
      SELECT DISTINCT grupo_operativo, COUNT(*) as registros
      FROM supervision_operativa_detalle 
      WHERE location_name ILIKE '%Boulevard Morelos%'
      GROUP BY grupo_operativo
    `);
    
    if (boulevard.rows.length > 0) {
      boulevard.rows.forEach(row => {
        console.log(`   "${row.grupo_operativo}": ${row.registros} registros`);
      });
    } else {
      console.log('   ❌ No encontrada "Boulevard Morelos"');
      
      // Buscar variaciones
      console.log('\n   Buscando variaciones de "Boulevard":');
      const variaciones = await pool.query(`
        SELECT DISTINCT location_name, grupo_operativo
        FROM supervision_operativa_detalle 
        WHERE location_name ILIKE '%boulevard%'
        ORDER BY location_name
        LIMIT 10
      `);
      
      variaciones.rows.forEach(row => {
        console.log(`     • "${row.location_name}" → ${row.grupo_operativo}`);
      });
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Función para verificar Cantera Rosa
async function verificarCanteraRosa() {
  try {
    console.log('🔍 VERIFICANDO GRUPO CANTERA ROSA\n');
    
    // 1. Buscar todas las variaciones de Cantera Rosa
    console.log('1. BUSCANDO VARIACIONES DE "CANTERA ROSA":');
    const variaciones = await pool.query(`
      SELECT DISTINCT grupo_operativo, COUNT(*) as registros
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo ILIKE '%CANTERA%'
         OR grupo_operativo ILIKE '%ROSA%'
         OR grupo_operativo ILIKE '%MORELIA%'
      GROUP BY grupo_operativo
      ORDER BY grupo_operativo
    `);
    
    variaciones.rows.forEach(row => {
      console.log(`   "${row.grupo_operativo}": ${row.registros} registros`);
    });
    
    // 2. Buscar por ubicación en Michoacán/Morelia
    console.log('\n2. SUCURSALES EN MICHOACÁN/MORELIA:');
    const michoacan = await pool.query(`
      SELECT DISTINCT 
        location_name, 
        grupo_operativo, 
        estado,
        municipio,
        COUNT(*) as evaluaciones
      FROM supervision_operativa_detalle 
      WHERE estado ILIKE '%michoacan%'
         OR estado ILIKE '%michoacán%'
         OR municipio ILIKE '%morelia%'
      GROUP BY location_name, grupo_operativo, estado, municipio
      ORDER BY location_name
    `);
    
    if (michoacan.rows.length > 0) {
      michoacan.rows.forEach(row => {
        console.log(`   • ${row.location_name} | ${row.grupo_operativo} | ${row.estado}, ${row.municipio} (${row.evaluaciones} evaluaciones)`);
      });
    } else {
      console.log('   ❌ No se encontraron sucursales en Michoacán/Morelia');
      
      // Buscar estados disponibles
      console.log('\n   ESTADOS DISPONIBLES:');
      const estados = await pool.query(`
        SELECT DISTINCT estado, COUNT(*) as sucursales
        FROM supervision_operativa_detalle 
        WHERE estado IS NOT NULL AND estado != ''
        GROUP BY estado
        ORDER BY estado
      `);
      
      estados.rows.forEach(row => {
        console.log(`     - ${row.estado}: ${row.sucursales} registros`);
      });
    }
    
    // 3. Ver si existe el grupo exacto
    console.log('\n3. GRUPO EXACTO:');
    const exacto = await pool.query(`
      SELECT DISTINCT grupo_operativo, COUNT(*) as registros
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo = 'GRUPO CANTERA ROSA (MORELIA)'
      GROUP BY grupo_operativo
    `);
    
    if (exacto.rows.length > 0) {
      console.log(`   ✅ Encontrado: "${exacto.rows[0].grupo_operativo}" con ${exacto.rows[0].registros} registros`);
      
      // Mostrar sucursales del grupo
      const sucursales = await pool.query(`
        SELECT DISTINCT location_name, COUNT(*) as evaluaciones
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo = 'GRUPO CANTERA ROSA (MORELIA)'
        GROUP BY location_name
        ORDER BY location_name
        LIMIT 10
      `);
      
      console.log('\n   SUCURSALES DEL GRUPO:');
      sucursales.rows.forEach(row => {
        console.log(`     • ${row.location_name} (${row.evaluaciones} evaluaciones)`);
      });
    } else {
      console.log('   ❌ No encontrado grupo exacto');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Función para analizar coordenadas y mapeo geográfico
async function analizarCoordenadasParaMapeo() {
  try {
    console.log('🗺️ ANÁLISIS DE COORDENADAS PARA MAPEO AUTOMÁTICO\n');
    
    // 1. Ver registros SIN mapeo que tienen coordenadas
    console.log('1. REGISTROS SIN MAPEO CON COORDENADAS:');
    const sinMapeoConCoordenadas = await pool.query(`
      SELECT 
        location_name,
        estado,
        municipio,
        latitud,
        longitud,
        COUNT(*) as registros
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo IN ('NO_ENCONTRADO', 'SIN_MAPEO')
        AND latitud IS NOT NULL 
        AND longitud IS NOT NULL
      GROUP BY location_name, estado, municipio, latitud, longitud
      ORDER BY registros DESC
      LIMIT 10
    `);
    
    sinMapeoConCoordenadas.rows.forEach(row => {
      console.log(`   ${row.location_name} | ${row.estado}, ${row.municipio}`);
      console.log(`     Coords: ${row.latitud}, ${row.longitud} | ${row.registros} registros\n`);
    });
    
    // 2. Ver coordenadas de grupos CONOCIDOS para comparar
    console.log('2. COORDENADAS DE GRUPOS CONOCIDOS (para mapeo):');
    const gruposConocidos = ['TEPEYAC', 'OGAS', 'RAP', 'CRR', 'GRUPO CANTERA ROSA (MORELIA)'];
    
    for (const grupo of gruposConocidos) {
      const coordenadas = await pool.query(`
        SELECT 
          location_name,
          estado, 
          municipio,
          ROUND(AVG(latitud::numeric), 6) as lat_promedio,
          ROUND(AVG(longitud::numeric), 6) as lng_promedio,
          COUNT(DISTINCT location_name) as sucursales
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo = $1
          AND latitud IS NOT NULL 
          AND longitud IS NOT NULL
        GROUP BY location_name, estado, municipio
        ORDER BY location_name
        LIMIT 3
      `, [grupo]);
      
      if (coordenadas.rows.length > 0) {
        console.log(`\n   ${grupo}:`);
        coordenadas.rows.forEach(row => {
          console.log(`     ${row.location_name} | ${row.estado}, ${row.municipio}`);
          console.log(`     Coords: ${row.lat_promedio}, ${row.lng_promedio}`);
        });
      }
    }
    
    // 3. Buscar clusters de coordenadas similares
    console.log('\n3. ANÁLISIS DE PROXIMIDAD GEOGRÁFICA:');
    const proximidad = await pool.query(`
      WITH coords_conocidos AS (
        SELECT DISTINCT
          grupo_operativo,
          location_name,
          latitud::numeric as lat,
          longitud::numeric as lng
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo NOT IN ('NO_ENCONTRADO', 'SIN_MAPEO', '')
          AND latitud IS NOT NULL 
          AND longitud IS NOT NULL
          AND grupo_operativo IS NOT NULL
      ),
      coords_sin_mapeo AS (
        SELECT DISTINCT
          location_name as sin_mapeo_nombre,
          estado,
          municipio,
          latitud::numeric as lat_sin_mapeo,
          longitud::numeric as lng_sin_mapeo
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo IN ('NO_ENCONTRADO', 'SIN_MAPEO')
          AND latitud IS NOT NULL 
          AND longitud IS NOT NULL
      )
      SELECT 
        sin_mapeo_nombre,
        estado,
        municipio,
        lat_sin_mapeo,
        lng_sin_mapeo,
        grupo_operativo as grupo_cercano,
        location_name as sucursal_cercana,
        ROUND(
          SQRT(
            POWER(lat - lat_sin_mapeo, 2) + 
            POWER(lng - lng_sin_mapeo, 2)
          ), 6
        ) as distancia_aproximada
      FROM coords_sin_mapeo
      CROSS JOIN coords_conocidos
      WHERE SQRT(
        POWER(lat - lat_sin_mapeo, 2) + 
        POWER(lng - lng_sin_mapeo, 2)
      ) < 0.1  -- Aproximadamente 11km
      ORDER BY sin_mapeo_nombre, distancia_aproximada
      LIMIT 15
    `);
    
    console.log('   SUCURSALES SIN MAPEO CERCA DE GRUPOS CONOCIDOS:');
    proximidad.rows.forEach(row => {
      console.log(`   ${row.sin_mapeo_nombre} (${row.estado}) → ${row.grupo_cercano}`);
      console.log(`     Cerca de: ${row.sucursal_cercana} | Distancia: ${row.distancia_aproximada}`);
    });
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Función para confirmar mapeo con el usuario
async function confirmarMapeoConUsuario() {
  try {
    console.log('🔍 SUCURSALES SIN MAPEO - CONFIRMACIÓN REQUERIDA\n');
    
    // Obtener las principales sucursales sin mapeo
    const sucursalesSinMapeo = await pool.query(`
      SELECT 
        location_name,
        estado,
        municipio,
        latitud,
        longitud,
        COUNT(*) as total_registros
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo IN ('NO_ENCONTRADO', 'SIN_MAPEO')
        AND latitud IS NOT NULL 
        AND longitud IS NOT NULL
      GROUP BY location_name, estado, municipio, latitud, longitud
      ORDER BY total_registros DESC
      LIMIT 15
    `);
    
    console.log('📋 SUCURSALES QUE REQUIEREN CONFIRMACIÓN:\n');
    
    sucursalesSinMapeo.rows.forEach((row, i) => {
      console.log(`${i+1}. 📍 ${row.location_name}`);
      console.log(`   📍 Ubicación: ${row.estado}, ${row.municipio}`);
      console.log(`   🗺️ Coordenadas: ${row.latitud}, ${row.longitud}`);
      console.log(`   📊 Registros: ${row.total_registros}`);
      console.log(`   ❓ ¿A qué GRUPO OPERATIVO pertenece?\n`);
    });
    
    console.log('🎯 GRUPOS DISPONIBLES PARA ASIGNAR:');
    const gruposDisponibles = [
      'TEPEYAC', 'OGAS', 'RAP', 'CRR', 'EXPO', 'TEC', 
      'GRUPO CANTERA ROSA (MORELIA)', 'PLOG NUEVO LEON', 
      'PLOG QUERETARO', 'PLOG LAGUNA', 'EFM',
      'GRUPO SALTILLO', 'GRUPO MATAMOROS', 'GRUPO RIO BRAVO'
    ];
    
    gruposDisponibles.forEach((grupo, i) => {
      console.log(`   ${i+1}. ${grupo}`);
    });
    
    console.log('\n💡 Por favor confirma a qué grupo pertenece cada sucursal');
    console.log('   Ejemplo: "76 - Aeropuerto (Reynosa) → RAP"');
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar confirmación con usuario
confirmarMapeoConUsuario();