const express = require('express');
const router = express.Router();
const dataServiceFixed = require('../services/dataServiceFixed');

// GET /api/map/data - Obtener datos para el mapa
router.get('/data', async (req, res) => {
  try {
    const filters = {
      grupo: req.query.grupo,
      estado: req.query.estado,
      trimestre: req.query.trimestre
    };
    
    const mapData = await dataServiceFixed.getMapData(filters);
    
    // Formatear para GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: mapData.map(location => ({
        type: 'Feature',
        properties: {
          location_id: location.location_id,
          sucursal: location.sucursal,
          grupo_operativo: location.grupo_operativo,
          estado: location.estado,
          municipio: location.municipio,
          promedio: location.promedio,
          areas_evaluadas: location.areas_evaluadas,
          total_supervisiones: location.total_supervisiones,
          status: location.status
        },
        geometry: {
          type: 'Point',
          coordinates: [location.longitud, location.latitud]
        }
      }))
    };
    
    res.json(geojson);
  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({ error: 'Error al obtener datos del mapa' });
  }
});

// GET /api/map/heatmap - Obtener datos para heatmap
router.get('/heatmap', async (req, res) => {
  try {
    const filters = {
      grupo: req.query.grupo,
      estado: req.query.estado,
      trimestre: req.query.trimestre
    };
    
    const mapData = await dataServiceFixed.getMapData(filters);
    
    // Formatear para heatmap (latitud, longitud, intensidad)
    const heatmapData = mapData.map(location => ({
      lat: location.latitud,
      lng: location.longitud,
      intensity: location.promedio / 100, // Normalizar a 0-1
      sucursal: location.sucursal,
      promedio: location.promedio
    }));
    
    res.json(heatmapData);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Error al obtener datos del heatmap' });
  }
});

module.exports = router;