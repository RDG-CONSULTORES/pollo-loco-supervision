const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// GET /api/indicadores - Obtener lista de indicadores con promedios
router.get('/', async (req, res) => {
  try {
    const filters = {
      grupo: req.query.grupo,
      estado: req.query.estado,
      trimestre: req.query.trimestre
    };
    
    const indicadores = await dataService.getIndicadores(filters);
    res.json(indicadores);
  } catch (error) {
    console.error('Error fetching indicadores:', error);
    res.status(500).json({ error: 'Error al obtener indicadores' });
  }
});

module.exports = router;