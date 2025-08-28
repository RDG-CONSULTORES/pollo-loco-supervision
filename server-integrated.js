const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
// Load environment variables
require('dotenv').config();

// In production, use hardcoded values as fallback
if (process.env.NODE_ENV === 'production' && !process.env.TELEGRAM_BOT_TOKEN) {
    const prodConfig = require('./config/production');
    Object.keys(prodConfig).forEach(key => {
        if (!process.env[key]) {
            process.env[key] = prodConfig[key];
        }
    });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection with fallback
let dbConnected = false;
pool.connect()
  .then(() => {
    console.log('✅ Connected to Neon PostgreSQL');
    dbConnected = true;
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    console.log('⚠️  Using fallback static data for bot functionality');
    dbConnected = false;
  });

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

// Fallback data
const fallbackData = {
    kpis: {
        promedio_general: "89.54",
        total_supervisiones: 135,
        total_sucursales: 79,
        total_estados: 9,
        max_calificacion: "100.00",
        min_calificacion: "45.20"
    },
    grupos: [
        { grupo_operativo: "OGAS", promedio: "97.60", supervisiones: 16, sucursales: 8 },
        { grupo_operativo: "PLOG QUERÉTARO", promedio: "97.00", supervisiones: 4, sucursales: 4 },
        { grupo_operativo: "TEC", promedio: "93.10", supervisiones: 8, sucursales: 4 }
    ],
    critical: [
        { indicador: "FREIDORAS", sucursal: "Sucursal Centro", grupo_operativo: "OGAS", estado: "Nuevo León", promedio: "70.10" },
        { indicador: "EXTERIOR SUCURSAL", sucursal: "Plaza Norte", grupo_operativo: "TEC", estado: "Jalisco", promedio: "71.40" }
    ],
    ranking: [
        { sucursal: "Sucursal Elite", grupo_operativo: "OGAS", estado: "Nuevo León", promedio: "98.50", supervisiones: 3 },
        { sucursal: "Plaza Premium", grupo_operativo: "PLOG QUERÉTARO", estado: "Querétaro", promedio: "97.80", supervisiones: 2 },
        { sucursal: "Centro Comercial", grupo_operativo: "TEC", estado: "Jalisco", promedio: "96.20", supervisiones: 4 },
        { sucursal: "Plaza Norte", grupo_operativo: "OGAS", estado: "CDMX", promedio: "95.80", supervisiones: 2 },
        { sucursal: "Sucursal Sur", grupo_operativo: "TEC", estado: "Nuevo León", promedio: "94.60", supervisiones: 3 }
    ],
    estados: [
        { estado: "Nuevo León", promedio: "96.80", supervisiones: 45, sucursales: 25 },
        { estado: "Querétaro", promedio: "95.40", supervisiones: 28, sucursales: 18 },
        { estado: "Jalisco", promedio: "93.70", supervisiones: 32, sucursales: 20 },
        { estado: "CDMX", promedio: "91.20", supervisiones: 30, sucursales: 16 }
    ],
    indicadores: [
        { indicador: "LIMPIEZA GENERAL", promedio: "94.50", evaluaciones: 89 },
        { indicador: "SERVICIO AL CLIENTE", promedio: "92.80", evaluaciones: 76 },
        { indicador: "COCINA", promedio: "91.30", evaluaciones: 82 },
        { indicador: "FREIDORAS", promedio: "88.70", evaluaciones: 67 },
        { indicador: "EXTERIOR SUCURSAL", promedio: "85.40", evaluaciones: 54 }
    ]
};

// API Routes
app.get('/api/kpis', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.kpis);
    }
    
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
        res.json(fallbackData.kpis);
    }
});

app.get('/api/grupos', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.grupos);
    }
    
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
        res.json(fallbackData.grupos);
    }
});

app.get('/api/kpis/critical', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.critical);
    }
    
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
        res.json(fallbackData.critical);
    }
});

app.get('/api/grupos/ranking', async (req, res) => {
    if (!dbConnected) {
        const limit = req.query.limit || 10;
        return res.json({ top: fallbackData.ranking.slice(0, limit) });
    }
    
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
        const limit = req.query.limit || 10;
        res.json({ top: fallbackData.ranking.slice(0, limit) });
    }
});

// Estados endpoint
app.get('/api/estados', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.estados);
    }
    
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
        res.json(fallbackData.estados);
    }
});

// Indicadores endpoint
app.get('/api/indicadores', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.indicadores);
    }
    
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
        res.json(fallbackData.indicadores);
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
        database_status: dbConnected ? 'Connected to Neon PostgreSQL' : 'Using fallback data',
        features: {
            database: dbConnected ? 'Connected to Neon PostgreSQL' : 'Fallback data active',
            bot: 'Telegram Bot Active',
            webapp: '5 Design Variants Available',
            dashboard: 'Complete React Dashboard'
        }
    });
});

// Webhook endpoint for Telegram
app.post('/webhook', (req, res) => {
    if (process.env.NODE_ENV === 'production' && global.telegramBot) {
        global.telegramBot.processUpdate(req.body);
    }
    res.sendStatus(200);
});

// Start server
app.listen(PORT, async () => {
    console.log(`🍗 El Pollo Loco CAS Mini Web App running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log(`📱 Telegram Web App ready`);
    
    // Start Telegram Bot if in production
    if (process.env.NODE_ENV === 'production' || process.env.START_BOT === 'true') {
        console.log('🤖 Starting Telegram Bot...');
        
        // Import bot (ya no necesitamos webhook manual)
        global.telegramBot = require('./telegram-bot/bot.js');
        
        // Set webhook in production usando setWebHook method
        if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL && process.env.TELEGRAM_BOT_TOKEN) {
            const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/webhook`;
            console.log(`🔗 Setting webhook to: ${webhookUrl}`);
            
            try {
                // Use Telegram Bot API directly
                const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: webhookUrl })
                });
                const result = await response.json();
                
                if (result.ok) {
                    console.log('✅ Webhook set successfully');
                } else {
                    console.error('❌ Webhook error:', result.description);
                }
            } catch (error) {
                console.error('❌ Error setting webhook:', error.message);
            }
        }
    }
});

module.exports = app;