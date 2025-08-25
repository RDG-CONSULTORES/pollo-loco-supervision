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

// Complete Dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard-react.html'));
});

// Dashboard redirect for easy access
app.get('/full', (req, res) => {
    res.redirect('/dashboard');
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

// Estados endpoint
app.get('/api/estados', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                estado,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT location_name) as sucursales
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND estado IS NOT NULL
            GROUP BY estado
            ORDER BY AVG(porcentaje) DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Indicadores endpoint
app.get('/api/indicadores', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                area_evaluacion as indicador,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND area_evaluacion IS NOT NULL
            GROUP BY area_evaluacion
            ORDER BY AVG(porcentaje) DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Trimestres endpoint
app.get('/api/trimestres', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                DISTINCT 
                CASE 
                    WHEN EXTRACT(MONTH FROM fecha_supervision) IN (1,2,3) THEN 'Q1 2025'
                    WHEN EXTRACT(MONTH FROM fecha_supervision) IN (4,5,6) THEN 'Q2 2025'
                    WHEN EXTRACT(MONTH FROM fecha_supervision) IN (7,8,9) THEN 'Q3 2025'
                    WHEN EXTRACT(MONTH FROM fecha_supervision) IN (10,11,12) THEN 'Q4 2025'
                END as trimestre,
                COUNT(*) as evaluaciones
            FROM supervision_operativa_detalle 
            WHERE fecha_supervision IS NOT NULL
            GROUP BY trimestre
            ORDER BY trimestre
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Bot test endpoint
app.get('/api/bot/status', (req, res) => {
    res.json({
        status: 'active',
        bot_name: 'EPL Estandarización Operativa',
        telegram_username: '@EPLEstandarizacionBot',
        features: ['AI Agent', 'Real-time data', 'Multi-design webapp'],
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'El Pollo Loco CAS Mini Web App',
        features: {
            database: 'Connected to Neon PostgreSQL',
            bot: 'Telegram Bot Active',
            webapp: '5 Design Variants Available',
            dashboard: 'Complete React Dashboard'
        }
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