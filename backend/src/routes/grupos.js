const express = require('express');
const router = express.Router();
const dataServiceFixed = require('../services/dataServiceFixed');

// GET /api/grupos - Obtener datos por grupo operativo
router.get('/', async (req, res) => {
  try {
    const filters = {
      estado: req.query.estado,
      trimestre: req.query.trimestre
    };
    
    const grupos = await dataServiceFixed.getDataByGrupo(filters);
    res.json(grupos);
  } catch (error) {
    console.error('Error fetching grupos:', error);
    res.status(500).json({ error: 'Error al obtener grupos operativos' });
  }
});

// GET /api/grupos/ranking - Obtener ranking de sucursales
router.get('/ranking', async (req, res) => {
  try {
    const filters = {
      grupo: req.query.grupo,
      estado: req.query.estado,
      trimestre: req.query.trimestre
    };
    const limit = parseInt(req.query.limit) || 10;
    
    const ranking = await dataServiceFixed.getTopBottomSucursales(filters, limit);
    res.json(ranking);
  } catch (error) {
    console.error('Error fetching ranking:', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

module.exports = router;