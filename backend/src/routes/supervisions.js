const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/supervisions - Obtener supervisiones con filtros
router.get('/', async (req, res) => {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (req.query.grupo) {
      params.push(req.query.grupo);
      whereClause += ` AND grupo_operativo = $${++paramCount}`;
    }
    
    if (req.query.estado) {
      params.push(req.query.estado);
      whereClause += ` AND estado = $${++paramCount}`;
    }
    
    if (req.query.trimestre) {
      whereClause += ` AND 'Q' || EXTRACT(QUARTER FROM fecha_supervision) || ' ' || EXTRACT(YEAR FROM fecha_supervision) = $${++paramCount}`;
      params.push(req.query.trimestre);
    }
    
    if (req.query.location_id) {
      params.push(req.query.location_id);
      whereClause += ` AND location_id = $${++paramCount}`;
    }

    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    params.push(limit);
    params.push(offset);

    const query = `
      SELECT 
        submission_id,
        location_id,
        location_name,
        sucursal_clean,
        municipio,
        estado,
        latitud,
        longitud,
        grupo_operativo,
        director_operativo,
        supervisor_campo,
        fecha_supervision,
        area_evaluacion,
        puntos_maximos,
        puntos_obtenidos,
        porcentaje,
        metodo_mapeo,
        confianza_mapeo
      FROM supervision_operativa_detalle
      ${whereClause}
      ORDER BY fecha_supervision DESC, location_name, area_evaluacion
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const result = await pool.query(query, params);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM supervision_operativa_detalle
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    
    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching supervisions:', error);
    res.status(500).json({ error: 'Error al obtener supervisiones' });
  }
});

// GET /api/supervisions/:submission_id - Obtener detalle de una supervisión
router.get('/:submission_id', async (req, res) => {
  try {
    const { submission_id } = req.params;
    
    const query = `
      SELECT 
        submission_id,
        location_id,
        location_name,
        sucursal_clean,
        municipio,
        estado,
        latitud,
        longitud,
        grupo_operativo,
        director_operativo,
        supervisor_campo,
        fecha_supervision,
        area_evaluacion,
        puntos_maximos,
        puntos_obtenidos,
        porcentaje
      FROM supervision_operativa_detalle
      WHERE submission_id = $1
      ORDER BY area_evaluacion
    `;
    
    const result = await pool.query(query, [submission_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supervisión no encontrada' });
    }
    
    // Agrupar por información general y áreas evaluadas
    const supervision = {
      submission_id: result.rows[0].submission_id,
      location_id: result.rows[0].location_id,
      location_name: result.rows[0].location_name,
      sucursal_clean: result.rows[0].sucursal_clean,
      municipio: result.rows[0].municipio,
      estado: result.rows[0].estado,
      latitud: result.rows[0].latitud,
      longitud: result.rows[0].longitud,
      grupo_operativo: result.rows[0].grupo_operativo,
      director_operativo: result.rows[0].director_operativo,
      supervisor_campo: result.rows[0].supervisor_campo,
      fecha_supervision: result.rows[0].fecha_supervision,
      areas_evaluadas: result.rows.map(row => ({
        area: row.area_evaluacion,
        puntos_maximos: row.puntos_maximos,
        puntos_obtenidos: row.puntos_obtenidos,
        porcentaje: row.porcentaje
      }))
    };
    
    res.json(supervision);
  } catch (error) {
    console.error('Error fetching supervision detail:', error);
    res.status(500).json({ error: 'Error al obtener detalle de supervisión' });
  }
});

module.exports = router;