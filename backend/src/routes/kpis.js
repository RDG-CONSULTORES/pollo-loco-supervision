const express = require('express');
const router = express.Router();
const dataService = require('../services/dataServiceFixed');

// GET /api/kpis - Obtener KPIs principales
router.get('/', async (req, res) => {
  try {
    const filters = {
      grupo: req.query.grupo,
      estado: req.query.estado,
      trimestre: req.query.trimestre
    };
    
    const kpis = await dataService.getMainKPIs(filters);
    res.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Error al obtener KPIs' });
  }
});

// GET /api/kpis/quarters - Obtener trimestres disponibles
router.get('/quarters', async (req, res) => {
  try {
    const quarters = await dataService.getAvailableQuarters();
    res.json(quarters);
  } catch (error) {
    console.error('Error fetching quarters:', error);
    res.status(500).json({ error: 'Error al obtener trimestres' });
  }
});

// GET /api/kpis/trends - Obtener tendencias
router.get('/trends', async (req, res) => {
  try {
    const filters = {
      grupo: req.query.grupo,
      estado: req.query.estado
    };
    
    const trends = await dataService.getTrends(filters);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Error al obtener tendencias' });
  }
});

// GET /api/kpis/critical - Obtener indicadores críticos
router.get('/critical', async (req, res) => {
  try {
    const filters = {
      grupo: req.query.grupo,
      estado: req.query.estado,
      trimestre: req.query.trimestre
    };
    const threshold = req.query.threshold || 70;
    
    const criticalIndicators = await dataService.getCriticalIndicators(filters, threshold);
    res.json(criticalIndicators);
  } catch (error) {
    console.error('Error fetching critical indicators:', error);
    res.status(500).json({ error: 'Error al obtener indicadores críticos' });
  }
});

module.exports = router;