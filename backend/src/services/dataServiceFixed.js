const pool = require('../config/database');

class DataService {
  // Función helper para manejo de errores
  async executeQuery(queryFn, fallbackData = []) {
    try {
      return await queryFn();
    } catch (error) {
      console.error('Database query error:', error.message);
      return fallbackData;
    }
  }

  // Obtener trimestres disponibles
  async getAvailableQuarters() {
    return this.executeQuery(async () => {
      const query = `
        SELECT DISTINCT
          'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) as trimestre,
          EXTRACT(YEAR FROM fecha_supervision) as año,
          EXTRACT(QUARTER FROM fecha_supervision) as trimestre_num
        FROM supervision_operativa_clean
        WHERE fecha_supervision IS NOT NULL
        ORDER BY año DESC, trimestre_num DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    }, []);
  }

  // Obtener KPIs principales
  async getMainKPIs(filters = {}) {
    return this.executeQuery(async () => {
      let whereClause = 'WHERE porcentaje IS NOT NULL';
      const params = [];
      let paramCount = 0;

      if (filters.grupo) {
        params.push(filters.grupo);
        whereClause += ` AND grupo_operativo_limpio = $${++paramCount}`;
      }
      
      if (filters.estado) {
        params.push(filters.estado);
        whereClause += ` AND estado_normalizado = $${++paramCount}`;
      }
      
      if (filters.trimestre) {
        whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
        params.push(filters.trimestre);
      }

      const query = `
        SELECT 
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN area_evaluacion = '' THEN 1 ELSE 0 END) > 0 
              THEN AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)
              ELSE AVG(porcentaje) 
            END::numeric, 2
          ) as promedio_general,
          COUNT(DISTINCT submission_id) as total_supervisiones,
          COUNT(DISTINCT location_id) as total_sucursales,
          COUNT(DISTINCT grupo_operativo_limpio) as total_grupos,
          COUNT(DISTINCT estado_normalizado) as total_estados,
          ROUND(MIN(porcentaje)::numeric, 2) as min_calificacion,
          ROUND(MAX(porcentaje)::numeric, 2) as max_calificacion
        FROM supervision_operativa_clean
        ${whereClause}
      `;
      
      const result = await pool.query(query, params);
      return result.rows[0];
    }, {
      promedio_general: 0,
      total_supervisiones: 0,
      total_sucursales: 0,
      total_grupos: 0,
      total_estados: 0,
      min_calificacion: 0,
      max_calificacion: 0
    });
  }

  // Obtener datos por grupo operativo
  async getDataByGrupo(filters = {}) {
    return this.executeQuery(async () => {
      let whereClause = 'WHERE grupo_operativo_limpio IS NOT NULL AND porcentaje IS NOT NULL';
      const params = [];
      let paramCount = 0;
      
      if (filters.estado) {
        params.push(filters.estado);
        whereClause += ` AND estado_normalizado = $${++paramCount}`;
      }
      
      if (filters.trimestre) {
        whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
        params.push(filters.trimestre);
      }

      const query = `
        SELECT 
          grupo_operativo_limpio as grupo_operativo,
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN area_evaluacion = '' THEN 1 ELSE 0 END) > 0 
              THEN AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)
              ELSE AVG(porcentaje) 
            END::numeric, 2
          ) as promedio,
          COUNT(DISTINCT submission_id) as supervisiones,
          COUNT(DISTINCT location_id) as sucursales
        FROM supervision_operativa_clean
        ${whereClause}
        GROUP BY grupo_operativo_limpio
        ORDER BY promedio DESC
      `;
      
      const result = await pool.query(query, params);
      return result.rows;
    }, []);
  }

  // Obtener datos por estado
  async getDataByEstado(filters = {}) {
    return this.executeQuery(async () => {
      let whereClause = 'WHERE estado_normalizado IS NOT NULL AND porcentaje IS NOT NULL';
      const params = [];
      let paramCount = 0;
      
      if (filters.grupo) {
        params.push(filters.grupo);
        whereClause += ` AND grupo_operativo_limpio = $${++paramCount}`;
      }
      
      if (filters.trimestre) {
        whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
        params.push(filters.trimestre);
      }

      const query = `
        SELECT 
          estado_normalizado as estado,
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN area_evaluacion = '' THEN 1 ELSE 0 END) > 0 
              THEN AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)
              ELSE AVG(porcentaje) 
            END::numeric, 2
          ) as promedio,
          COUNT(DISTINCT submission_id) as supervisiones,
          COUNT(DISTINCT location_id) as sucursales
        FROM supervision_operativa_clean
        ${whereClause}
        GROUP BY estado_normalizado
        ORDER BY promedio DESC
      `;
      
      const result = await pool.query(query, params);
      return result.rows;
    }, []);
  }

  // Obtener indicadores con sus promedios
  async getIndicadores(filters = {}) {
    return this.executeQuery(async () => {
      let whereClause = `WHERE area_evaluacion IS NOT NULL 
                         AND TRIM(area_evaluacion) != ''
                         AND area_evaluacion NOT LIKE '%PUNTOS%'
                         AND porcentaje IS NOT NULL`;
      const params = [];
      let paramCount = 0;
      
      if (filters.grupo) {
        params.push(filters.grupo);
        whereClause += ` AND grupo_operativo_limpio = $${++paramCount}`;
      }
      
      if (filters.estado) {
        params.push(filters.estado);
        whereClause += ` AND estado_normalizado = $${++paramCount}`;
      }
      
      if (filters.trimestre) {
        whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
        params.push(filters.trimestre);
      }

      const query = `
        SELECT 
          TRIM(area_evaluacion) as indicador,
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN area_evaluacion = '' THEN 1 ELSE 0 END) > 0 
              THEN AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)
              ELSE AVG(porcentaje) 
            END::numeric, 2
          ) as promedio,
          COUNT(*) as evaluaciones,
          CASE 
            WHEN AVG(porcentaje) >= 90 THEN 'success'
            WHEN AVG(porcentaje) >= 70 THEN 'warning'
            ELSE 'danger'
          END as status
        FROM supervision_operativa_clean
        ${whereClause}
        GROUP BY TRIM(area_evaluacion)
        ORDER BY promedio DESC
      `;
      
      const result = await pool.query(query, params);
      return result.rows;
    }, []);
  }

  // Obtener datos para mapa
  async getMapData(filters = {}) {
    return this.executeQuery(async () => {
      let whereClause = 'WHERE latitud IS NOT NULL AND longitud IS NOT NULL AND porcentaje IS NOT NULL';
      const params = [];
      let paramCount = 0;
      
      if (filters.grupo) {
        params.push(filters.grupo);
        whereClause += ` AND grupo_operativo_limpio = $${++paramCount}`;
      }
      
      if (filters.estado) {
        params.push(filters.estado);
        whereClause += ` AND estado_normalizado = $${++paramCount}`;
      }
      
      if (filters.trimestre) {
        whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
        params.push(filters.trimestre);
      }

      const query = `
        SELECT 
          location_id,
          location_name as sucursal,
          grupo_operativo_limpio as grupo_operativo,
          estado_normalizado as estado,
          municipio,
          latitud::float,
          longitud::float,
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN area_evaluacion = '' THEN 1 ELSE 0 END) > 0 
              THEN AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)
              ELSE AVG(porcentaje) 
            END::numeric, 2
          ) as promedio,
          COUNT(DISTINCT area_evaluacion) as areas_evaluadas,
          COUNT(DISTINCT submission_id) as total_supervisiones,
          CASE 
            WHEN AVG(porcentaje) >= 90 THEN 'success'
            WHEN AVG(porcentaje) >= 70 THEN 'warning'
            ELSE 'danger'
          END as status
        FROM supervision_operativa_clean
        ${whereClause}
        GROUP BY location_id, location_name, grupo_operativo_limpio, estado_normalizado, municipio, latitud, longitud
        HAVING COUNT(DISTINCT area_evaluacion) > 5
      `;
      
      const result = await pool.query(query, params);
      return result.rows;
    }, []);
  }

  // Obtener tendencias por trimestre
  async getTrends(filters = {}) {
    return this.executeQuery(async () => {
      let whereClause = 'WHERE fecha_supervision IS NOT NULL AND porcentaje IS NOT NULL';
      const params = [];
      let paramCount = 0;
      
      if (filters.grupo) {
        params.push(filters.grupo);
        whereClause += ` AND grupo_operativo_limpio = $${++paramCount}`;
      }
      
      if (filters.estado) {
        params.push(filters.estado);
        whereClause += ` AND estado_normalizado = $${++paramCount}`;
      }

      const query = `
        SELECT 
          'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) as trimestre,
          EXTRACT(YEAR FROM fecha_supervision) as año,
          EXTRACT(QUARTER FROM fecha_supervision) as trimestre_num,
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN area_evaluacion = '' THEN 1 ELSE 0 END) > 0 
              THEN AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)
              ELSE AVG(porcentaje) 
            END::numeric, 2
          ) as promedio,
          COUNT(DISTINCT submission_id) as supervisiones,
          COUNT(DISTINCT location_id) as sucursales
        FROM supervision_operativa_clean
        ${whereClause}
        GROUP BY año, trimestre_num
        ORDER BY año DESC, trimestre_num DESC
        LIMIT 8
      `;
      
      const result = await pool.query(query, params);
      return result.rows.reverse(); // Para mostrar en orden cronológico
    }, []);
  }

  // Obtener indicadores críticos
  async getCriticalIndicators(filters = {}, threshold = 70) {
    return this.executeQuery(async () => {
      let whereClause = `WHERE area_evaluacion IS NOT NULL 
                         AND TRIM(area_evaluacion) != ''
                         AND area_evaluacion NOT LIKE '%PUNTOS%'
                         AND porcentaje IS NOT NULL`;
      const params = [threshold];
      let paramCount = 1;
      
      if (filters.grupo) {
        params.push(filters.grupo);
        whereClause += ` AND grupo_operativo_limpio = $${++paramCount}`;
      }
      
      if (filters.estado) {
        params.push(filters.estado);
        whereClause += ` AND estado_normalizado = $${++paramCount}`;
      }
      
      if (filters.trimestre) {
        whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
        params.push(filters.trimestre);
      }

      const query = `
        SELECT 
          TRIM(area_evaluacion) as indicador,
          location_name as sucursal,
          grupo_operativo_limpio as grupo_operativo,
          estado_normalizado as estado,
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN area_evaluacion = '' THEN 1 ELSE 0 END) > 0 
              THEN AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)
              ELSE AVG(porcentaje) 
            END::numeric, 2
          ) as promedio,
          COUNT(*) as evaluaciones
        FROM supervision_operativa_clean
        ${whereClause}
        GROUP BY TRIM(area_evaluacion), location_name, grupo_operativo_limpio, estado_normalizado
        HAVING AVG(porcentaje) < $1
        ORDER BY promedio ASC
        LIMIT 50
      `;
      
      const result = await pool.query(query, params);
      return result.rows;
    }, []);
  }

  // Funciones adicionales que faltan
  async getTopBottomSucursales(filters = {}, limit = 10) {
    return this.executeQuery(async () => {
      let whereClause = 'WHERE porcentaje IS NOT NULL';
      const params = [];
      let paramCount = 0;
      
      if (filters.grupo) {
        params.push(filters.grupo);
        whereClause += ` AND grupo_operativo_limpio = $${++paramCount}`;
      }
      
      if (filters.estado) {
        params.push(filters.estado);
        whereClause += ` AND estado_normalizado = $${++paramCount}`;
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
          grupo_operativo_limpio as grupo_operativo,
          estado_normalizado as estado,
          municipio,
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN area_evaluacion = '' THEN 1 ELSE 0 END) > 0 
              THEN AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)
              ELSE AVG(porcentaje) 
            END::numeric, 2
          ) as promedio,
          COUNT(DISTINCT area_evaluacion) as areas_evaluadas
        FROM supervision_operativa_clean
        ${whereClause}
        GROUP BY location_name, grupo_operativo_limpio, estado_normalizado, municipio
        HAVING COUNT(DISTINCT area_evaluacion) > 10
        ORDER BY promedio DESC
        LIMIT ${limitParam}
      `;
      
      const bottomQuery = `
        SELECT 
          location_name as sucursal,
          grupo_operativo_limpio as grupo_operativo,
          estado_normalizado as estado,
          municipio,
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN area_evaluacion = '' THEN 1 ELSE 0 END) > 0 
              THEN AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END)
              ELSE AVG(porcentaje) 
            END::numeric, 2
          ) as promedio,
          COUNT(DISTINCT area_evaluacion) as areas_evaluadas
        FROM supervision_operativa_clean
        ${whereClause}
        GROUP BY location_name, grupo_operativo_limpio, estado_normalizado, municipio
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
    }, { top: [], bottom: [] });
  }
}

module.exports = new DataService();