const express = require('express');
const router = express.Router();
const dataServiceFixed = require('../services/dataServiceFixed');

// GET /api/estados - Obtener datos por estado
router.get('/', async (req, res) => {
  try {
    const filters = {
      grupo: req.query.grupo,
      trimestre: req.query.trimestre
    };
    
    const estados = await dataServiceFixed.getDataByEstado(filters);
    res.json(estados);
  } catch (error) {
    console.error('Error fetching estados:', error);
    res.status(500).json({ error: 'Error al obtener estados' });
  }
});

module.exports = router;