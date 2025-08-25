const pool = require('../config/database');

class DataService {
  // Obtener trimestres disponibles
  async getAvailableQuarters() {
    const query = `
      SELECT DISTINCT
        'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) as trimestre,
        EXTRACT(YEAR FROM fecha_supervision) as año,
        EXTRACT(QUARTER FROM fecha_supervision) as trimestre_num
      FROM supervision_operativa_detalle
      WHERE fecha_supervision IS NOT NULL
      ORDER BY año DESC, trimestre_num DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener KPIs principales
  async getMainKPIs(filters = {}) {
    let whereClause = 'WHERE porcentaje IS NOT NULL';
    const params = [];
    let paramCount = 0;

    if (filters.grupo) {
      params.push(filters.grupo);
      whereClause += ` AND grupo_operativo = $${++paramCount}`;
    }
    
    if (filters.estado) {
      params.push(filters.estado);
      whereClause += ` AND estado = $${++paramCount}`;
    }
    
    if (filters.trimestre) {
      whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
      params.push(filters.trimestre);
    }

    const query = `
      SELECT 
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_general,
        COUNT(DISTINCT submission_id) as total_supervisiones,
        COUNT(DISTINCT location_id) as total_sucursales,
        COUNT(DISTINCT grupo_operativo) as total_grupos,
        COUNT(DISTINCT estado) as total_estados,
        ROUND(MIN(porcentaje)::numeric, 2) as min_calificacion,
        ROUND(MAX(porcentaje)::numeric, 2) as max_calificacion
      FROM supervision_operativa_detalle
      ${whereClause}
    `;
    
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Obtener datos por grupo operativo
  async getDataByGrupo(filters = {}) {
    let whereClause = 'WHERE grupo_operativo IS NOT NULL AND porcentaje IS NOT NULL';
    const params = [];
    let paramCount = 0;
    
    if (filters.estado) {
      params.push(filters.estado);
      whereClause += ` AND estado = $${++paramCount}`;
    }
    
    if (filters.trimestre) {
      whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
      params.push(filters.trimestre);
    }

    const query = `
      SELECT 
        grupo_operativo,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio,
        COUNT(DISTINCT submission_id) as supervisiones,
        COUNT(DISTINCT location_id) as sucursales
      FROM supervision_operativa_detalle
      ${whereClause}
      GROUP BY grupo_operativo
      ORDER BY promedio DESC
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Obtener datos por estado
  async getDataByEstado(filters = {}) {
    let whereClause = 'WHERE estado IS NOT NULL AND porcentaje IS NOT NULL';
    const params = [];
    let paramCount = 0;
    
    if (filters.grupo) {
      params.push(filters.grupo);
      whereClause += ` AND grupo_operativo = $${++paramCount}`;
    }
    
    if (filters.trimestre) {
      whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
      params.push(filters.trimestre);
    }

    const query = `
      SELECT 
        estado,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio,
        COUNT(DISTINCT submission_id) as supervisiones,
        COUNT(DISTINCT location_id) as sucursales
      FROM supervision_operativa_detalle
      ${whereClause}
      GROUP BY estado
      ORDER BY promedio DESC
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Obtener indicadores con sus promedios
  async getIndicadores(filters = {}) {
    let whereClause = `WHERE area_evaluacion IS NOT NULL 
                       AND TRIM(area_evaluacion) != ''
                       AND area_evaluacion NOT LIKE '%PUNTOS%'
                       AND porcentaje IS NOT NULL`;
    const params = [];
    let paramCount = 0;
    
    if (filters.grupo) {
      params.push(filters.grupo);
      whereClause += ` AND grupo_operativo = $${++paramCount}`;
    }
    
    if (filters.estado) {
      params.push(filters.estado);
      whereClause += ` AND estado = $${++paramCount}`;
    }
    
    if (filters.trimestre) {
      whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
      params.push(filters.trimestre);
    }

    const query = `
      SELECT 
        TRIM(area_evaluacion) as indicador,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio,
        COUNT(*) as evaluaciones,
        CASE 
          WHEN AVG(porcentaje) >= 90 THEN 'success'
          WHEN AVG(porcentaje) >= 70 THEN 'warning'
          ELSE 'danger'
        END as status
      FROM supervision_operativa_detalle
      ${whereClause}
      GROUP BY TRIM(area_evaluacion)
      ORDER BY promedio DESC
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Obtener top mejores y peores sucursales
  async getTopBottomSucursales(filters = {}, limit = 10) {
    let whereClause = 'WHERE porcentaje IS NOT NULL';
    const params = [];
    let paramCount = 0;
    
    if (filters.grupo) {
      params.push(filters.grupo);
      whereClause += ` AND grupo_operativo = $${++paramCount}`;
    }
    
    if (filters.estado) {
      params.push(filters.estado);
      whereClause += ` AND estado = $${++paramCount}`;
    }
    
    if (filters.trimestre) {
      whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
      params.push(filters.trimestre);
    }

    params.push(limit);
    const limitParam = `$${++paramCount}`;

    const topQuery = `
      SELECT 
        location_name as sucursal,
        grupo_operativo,
        estado,
        municipio,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio,
        COUNT(DISTINCT area_evaluacion) as areas_evaluadas
      FROM supervision_operativa_detalle
      ${whereClause}
      GROUP BY location_name, grupo_operativo, estado, municipio
      HAVING COUNT(DISTINCT area_evaluacion) > 10
      ORDER BY promedio DESC
      LIMIT ${limitParam}
    `;
    
    const bottomQuery = `
      SELECT 
        location_name as sucursal,
        grupo_operativo,
        estado,
        municipio,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio,
        COUNT(DISTINCT area_evaluacion) as areas_evaluadas
      FROM supervision_operativa_detalle
      ${whereClause}
      GROUP BY location_name, grupo_operativo, estado, municipio
      HAVING COUNT(DISTINCT area_evaluacion) > 10
      ORDER BY promedio ASC
      LIMIT ${limitParam}
    `;
    
    const [topResult, bottomResult] = await Promise.all([
      pool.query(topQuery, params),
      pool.query(bottomQuery, params)
    ]);
    
    return {
      top: topResult.rows,
      bottom: bottomResult.rows
    };
  }

  // Obtener datos para mapa
  async getMapData(filters = {}) {
    let whereClause = 'WHERE latitud IS NOT NULL AND longitud IS NOT NULL AND porcentaje IS NOT NULL';
    const params = [];
    let paramCount = 0;
    
    if (filters.grupo) {
      params.push(filters.grupo);
      whereClause += ` AND grupo_operativo = $${++paramCount}`;
    }
    
    if (filters.estado) {
      params.push(filters.estado);
      whereClause += ` AND estado = $${++paramCount}`;
    }
    
    if (filters.trimestre) {
      whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
      params.push(filters.trimestre);
    }

    const query = `
      SELECT 
        location_id,
        location_name as sucursal,
        grupo_operativo,
        estado,
        municipio,
        latitud::float,
        longitud::float,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio,
        COUNT(DISTINCT area_evaluacion) as areas_evaluadas,
        COUNT(DISTINCT submission_id) as total_supervisiones,
        CASE 
          WHEN AVG(porcentaje) >= 90 THEN 'success'
          WHEN AVG(porcentaje) >= 70 THEN 'warning'
          ELSE 'danger'
        END as status
      FROM supervision_operativa_detalle
      ${whereClause}
      GROUP BY location_id, location_name, grupo_operativo, estado, municipio, latitud, longitud
      HAVING COUNT(DISTINCT area_evaluacion) > 5
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Obtener tendencias por trimestre
  async getTrends(filters = {}) {
    let whereClause = 'WHERE fecha_supervision IS NOT NULL AND porcentaje IS NOT NULL';
    const params = [];
    let paramCount = 0;
    
    if (filters.grupo) {
      params.push(filters.grupo);
      whereClause += ` AND grupo_operativo = $${++paramCount}`;
    }
    
    if (filters.estado) {
      params.push(filters.estado);
      whereClause += ` AND estado = $${++paramCount}`;
    }

    const query = `
      SELECT 
        'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) as trimestre,
        EXTRACT(YEAR FROM fecha_supervision) as año,
        EXTRACT(QUARTER FROM fecha_supervision) as trimestre_num,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio,
        COUNT(DISTINCT submission_id) as supervisiones,
        COUNT(DISTINCT location_id) as sucursales
      FROM supervision_operativa_detalle
      ${whereClause}
      GROUP BY año, trimestre_num
      ORDER BY año DESC, trimestre_num DESC
      LIMIT 8
    `;
    
    const result = await pool.query(query, params);
    return result.rows.reverse(); // Para mostrar en orden cronológico
  }

  // Obtener indicadores críticos
  async getCriticalIndicators(filters = {}, threshold = 70) {
    let whereClause = `WHERE area_evaluacion IS NOT NULL 
                       AND TRIM(area_evaluacion) != ''
                       AND area_evaluacion NOT LIKE '%PUNTOS%'
                       AND porcentaje IS NOT NULL`;
    const params = [threshold];
    let paramCount = 1;
    
    if (filters.grupo) {
      params.push(filters.grupo);
      whereClause += ` AND grupo_operativo = $${++paramCount}`;
    }
    
    if (filters.estado) {
      params.push(filters.estado);
      whereClause += ` AND estado = $${++paramCount}`;
    }
    
    if (filters.trimestre) {
      whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
      params.push(filters.trimestre);
    }

    const query = `
      SELECT 
        TRIM(area_evaluacion) as indicador,
        location_name as sucursal,
        grupo_operativo,
        estado,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio,
        COUNT(*) as evaluaciones
      FROM supervision_operativa_detalle
      ${whereClause}
      GROUP BY TRIM(area_evaluacion), location_name, grupo_operativo, estado
      HAVING AVG(porcentaje) < $1
      ORDER BY promedio ASC
      LIMIT 50
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = new DataService();