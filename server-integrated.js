const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect()
  .then(() => console.log('✅ Connected to Neon PostgreSQL'))
  .catch(err => console.error('❌ Database connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Serve design showcase and variants
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'design-showcase.html'));
});

app.get('/design/:variant', (req, res) => {
    const { variant } = req.params;
    const designFiles = {
        '1': 'design-variant-1-corporate.html',
        '2': 'design-variant-2-minimal.html', 
        '3': 'design-variant-3-dark.html',
        '4': 'design-variant-4-modern.html',
        '5': 'design-variant-5-classic.html',
        'corporate': 'design-variant-1-corporate.html',
        'minimal': 'design-variant-2-minimal.html',
        'dark': 'design-variant-3-dark.html',
        'modern': 'design-variant-4-modern.html',
        'classic': 'design-variant-5-classic.html'
    };
    
    const fileName = designFiles[variant];
    if (fileName) {
        res.sendFile(path.join(__dirname, fileName));
    } else {
        res.status(404).json({ error: 'Design variant not found' });
    }
});

// Mini Web App endpoint for Telegram
app.get('/webapp', (req, res) => {
    res.sendFile(path.join(__dirname, 'design-showcase.html'));
});

// API Routes
app.get('/api/kpis', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT submission_id) as total_supervisiones,
                COUNT(DISTINCT location_name) as total_sucursales,
                COUNT(DISTINCT estado) as total_estados,
                ROUND(MAX(porcentaje), 2) as max_calificacion,
                ROUND(MIN(porcentaje), 2) as min_calificacion
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL
        `);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/grupos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                grupo_operativo,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT location_name) as sucursales
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND grupo_operativo IS NOT NULL
            GROUP BY grupo_operativo
            ORDER BY AVG(porcentaje) DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/kpis/critical', async (req, res) => {
    try {
        const threshold = req.query.threshold || 70;
        const result = await pool.query(`
            SELECT 
                area_evaluacion as indicador,
                location_name as sucursal,
                grupo_operativo,
                estado,
                ROUND(AVG(porcentaje), 2) as promedio
            FROM supervision_operativa_detalle 
            WHERE porcentaje < $1 AND porcentaje IS NOT NULL
            GROUP BY area_evaluacion, location_name, grupo_operativo, estado
            ORDER BY AVG(porcentaje) ASC
            LIMIT 20
        `, [threshold]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/grupos/ranking', async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const result = await pool.query(`
            SELECT 
                location_name as sucursal,
                grupo_operativo,
                estado,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL
            GROUP BY location_name, grupo_operativo, estado
            ORDER BY AVG(porcentaje) DESC
            LIMIT $1
        `, [limit]);
        res.json({ top: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'El Pollo Loco CAS Mini Web App'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🍗 El Pollo Loco CAS Mini Web App running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log(`📱 Telegram Web App ready`);
    
    // Start Telegram Bot if in production
    if (process.env.NODE_ENV === 'production' || process.env.START_BOT === 'true') {
        console.log('🤖 Starting Telegram Bot...');
        require('./telegram-bot/bot.js');
    }
});

module.exports = app;