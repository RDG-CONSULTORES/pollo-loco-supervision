const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://maps.googleapis.com", "https://cdn.jsdelivr.net", "https://telegram.org"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.mapbox.com", "https://maps.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        },
    },
}));

// Compression middleware
app.use(compression());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// =====================================================
// API ENDPOINTS - DATOS REALES DE supervision_operativa_clean
// =====================================================

// 1. GET /api/locations - Todas las ubicaciones con coordenadas
app.get('/api/locations', async (req, res) => {
  try {
    const { grupo, estado, trimestre } = req.query;
    
    let whereClause = `WHERE latitud IS NOT NULL AND longitud IS NOT NULL`;
    const params = [];
    let paramIndex = 1;
    
    if (grupo) {
      whereClause += ` AND grupo_operativo_limpio = $${paramIndex}`;
      params.push(grupo);
      paramIndex++;
    }
    
    if (estado) {
      whereClause += ` AND estado_normalizado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }
    
    if (trimestre) {
      whereClause += ` AND EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`;
      params.push(parseInt(trimestre));
      paramIndex++;
    }
    
    const query = `
      SELECT 
        location_name as name,
        grupo_operativo_limpio as "group",
        latitud as lat,
        longitud as lng,
        ROUND(AVG(porcentaje), 2) as performance,
        estado_normalizado as state,
        municipio as municipality,
        MAX(fecha_supervision) as last_evaluation,
        COUNT(*) as total_evaluations
      FROM supervision_operativa_clean 
      ${whereClause}
      GROUP BY location_name, grupo_operativo_limpio, latitud, longitud, estado_normalizado, municipio
      ORDER BY performance DESC
    `;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Error fetching locations' });
  }
});

// 2. GET /api/performance/overview - KPIs generales
app.get('/api/performance/overview', async (req, res) => {
  try {
    const { trimestre } = req.query;
    
    let whereClause = `WHERE porcentaje IS NOT NULL`;
    const params = [];
    
    if (trimestre) {
      whereClause += ` AND EXTRACT(QUARTER FROM fecha_supervision) = $1`;
      params.push(parseInt(trimestre));
    }
    
    const query = `
      SELECT 
        ROUND(AVG(porcentaje), 2) as network_performance,
        COUNT(DISTINCT location_name) as total_locations,
        COUNT(DISTINCT grupo_operativo_limpio) as active_groups,
        COUNT(*) as total_evaluations,
        MAX(fecha_supervision) as last_update
      FROM supervision_operativa_clean 
      ${whereClause}
    `;
    
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: 'Error fetching overview' });
  }
});

// 3. GET /api/performance/groups - Performance por grupo
app.get('/api/performance/groups', async (req, res) => {
  try {
    const { trimestre } = req.query;
    
    let whereClause = `WHERE porcentaje IS NOT NULL`;
    const params = [];
    
    if (trimestre) {
      whereClause += ` AND EXTRACT(QUARTER FROM fecha_supervision) = $1`;
      params.push(parseInt(trimestre));
    }
    
    const query = `
      SELECT 
        grupo_operativo_limpio as name,
        ROUND(AVG(porcentaje), 2) as performance,
        COUNT(DISTINCT location_name) as locations,
        COUNT(*) as evaluations,
        ROUND(MIN(porcentaje), 2) as min_score,
        ROUND(MAX(porcentaje), 2) as max_score
      FROM supervision_operativa_clean 
      ${whereClause}
      GROUP BY grupo_operativo_limpio
      ORDER BY performance DESC
    `;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

// 4. GET /api/performance/areas - Performance por área de evaluación
app.get('/api/performance/areas', async (req, res) => {
  try {
    const { grupo, trimestre } = req.query;
    
    let whereClause = `WHERE area_evaluacion IS NOT NULL AND porcentaje IS NOT NULL`;
    const params = [];
    let paramIndex = 1;
    
    if (grupo) {
      whereClause += ` AND grupo_operativo_limpio = $${paramIndex}`;
      params.push(grupo);
      paramIndex++;
    }
    
    if (trimestre) {
      whereClause += ` AND EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`;
      params.push(parseInt(trimestre));
      paramIndex++;
    }
    
    const query = `
      SELECT 
        area_evaluacion as area,
        ROUND(AVG(porcentaje), 2) as performance,
        COUNT(*) as evaluations,
        ROUND(MIN(porcentaje), 2) as min_score,
        ROUND(MAX(porcentaje), 2) as max_score
      FROM supervision_operativa_clean 
      ${whereClause}
      GROUP BY area_evaluacion
      ORDER BY performance ASC
      LIMIT 20
    `;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ error: 'Error fetching areas' });
  }
});

// 5. GET /api/performance/trends - Tendencias trimestrales
app.get('/api/performance/trends', async (req, res) => {
  try {
    const { grupo } = req.query;
    
    let whereClause = `WHERE porcentaje IS NOT NULL AND EXTRACT(YEAR FROM fecha_supervision) = 2025`;
    const params = [];
    
    if (grupo) {
      whereClause += ` AND grupo_operativo_limpio = $1`;
      params.push(grupo);
    }
    
    const query = `
      SELECT 
        EXTRACT(QUARTER FROM fecha_supervision) as quarter,
        ROUND(AVG(porcentaje), 2) as performance,
        COUNT(DISTINCT location_name) as locations,
        COUNT(*) as evaluations
      FROM supervision_operativa_clean 
      ${whereClause}
      GROUP BY EXTRACT(QUARTER FROM fecha_supervision)
      ORDER BY quarter
    `;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Error fetching trends' });
  }
});

// =====================================================
// FILTROS DINÁMICOS
// =====================================================

// GET /api/filters/states - Estados disponibles
app.get('/api/filters/states', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT estado_normalizado as name
      FROM supervision_operativa_clean 
      WHERE estado_normalizado IS NOT NULL
      ORDER BY estado_normalizado
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Error fetching states' });
  }
});

// GET /api/filters/groups - Grupos operativos disponibles
app.get('/api/filters/groups', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT grupo_operativo_limpio as name
      FROM supervision_operativa_clean 
      WHERE grupo_operativo_limpio IS NOT NULL
      ORDER BY grupo_operativo_limpio
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

// GET /api/filters/areas - Áreas de evaluación disponibles
app.get('/api/filters/areas', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT area_evaluacion as name
      FROM supervision_operativa_clean 
      WHERE area_evaluacion IS NOT NULL AND area_evaluacion != ''
      ORDER BY area_evaluacion
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ error: 'Error fetching areas' });
  }
});

// =====================================================
// STATIC FILES & ROUTES
// =====================================================

// Serve main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as server_time');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      server_time: result.rows[0].server_time 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 El Pollo Loco Dashboard Server running on port ${port}`);
  console.log(`📊 Database: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔴 Shutting down server...');
  await pool.end();
  process.exit(0);
});