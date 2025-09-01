const express = require('express');
const router = express.Router();
const dataServiceFixed = require('../services/dataServiceFixed');

// GET /api/indicadores - Obtener lista de indicadores con promedios
router.get('/', async (req, res) => {
  try {
    const filters = {
      grupo: req.query.grupo,
      estado: req.query.estado,
      trimestre: req.query.trimestre
    };
    
    const indicadores = await dataServiceFixed.getIndicadores(filters);
    res.json(indicadores);
  } catch (error) {
    console.error('Error fetching indicadores:', error);
    res.status(500).json({ error: 'Error al obtener indicadores' });
  }
});

module.exports = router;