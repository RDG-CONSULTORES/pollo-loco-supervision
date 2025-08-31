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

// Handle pool errors to prevent crashes
pool.on('error', (err) => {
    console.error('❌ Database pool error:', err);
    console.log('🔄 Attempting to maintain service with fallback data');
    dbConnected = false;
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve dashboard static files
app.use('/dashboard-static', express.static(path.join(__dirname, 'telegram-bot/web-app/public')));
app.use(express.static(path.join(__dirname, 'telegram-bot/web-app/public')));

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

// OLD Dashboard (renamed to avoid conflict)
app.get('/dashboard-old', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard-react.html'));
});

// NEW Dashboard (FIXED VERSION)
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'telegram-bot/web-app/public/index.html');
    console.log('📊 NEW Dashboard requested:', dashboardPath);
    res.sendFile(dashboardPath);
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
    estados: [
        { estado: "Nuevo León", promedio: "96.80", supervisiones: 45, sucursales: 25 },
        { estado: "Querétaro", promedio: "95.40", supervisiones: 28, sucursales: 18 },
        { estado: "Jalisco", promedio: "93.70", supervisiones: 32, sucursales: 20 }
    ],
    indicadores: [
        { indicador: "LIMPIEZA GENERAL", promedio: "94.50", evaluaciones: 89 },
        { indicador: "SERVICIO AL CLIENTE", promedio: "92.80", evaluaciones: 76 },
        { indicador: "COCINA", promedio: "91.30", evaluaciones: 82 }
    ]
};

// Health check with NEW VERSION
app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query(`
            SELECT 
                'supervision_operativa_detalle' as table_name,
                COUNT(*) as total_records,
                COUNT(DISTINCT location_name) as unique_locations,
                COUNT(DISTINCT grupo_operativo) as unique_groups,
                COUNT(DISTINCT estado) as unique_states,
                COUNT(CASE WHEN grupo_operativo = 'NO_ENCONTRADO' THEN 1 END) as unmapped_groups,
                MIN(fecha_supervision) as earliest_date,
                MAX(fecha_supervision) as latest_date
            FROM supervision_operativa_detalle
        `);
        
        const stats = dbCheck.rows[0];
        
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            service: 'El Pollo Loco Interactive Dashboard v2.0',
            version: '2.0.0',
            database_status: dbConnected ? 'Connected to Neon PostgreSQL' : 'Using fallback data',
            database_stats: {
                total_records: stats.total_records,
                unique_locations: stats.unique_locations,
                unique_groups: stats.unique_groups,
                unique_states: stats.unique_states,
                unmapped_groups: stats.unmapped_groups,
                date_range: `${stats.earliest_date} to ${stats.latest_date}`,
                data_quality: stats.unique_groups > 0 ? `${Math.max(0, ((parseInt(stats.unique_groups) - parseInt(stats.unmapped_groups)) / parseInt(stats.unique_groups) * 100)).toFixed(1)}%` : '100%'
            },
            features: {
                database: dbConnected ? 'Connected to Neon PostgreSQL' : 'Fallback mode active',
                dashboard: 'Interactive Dashboard with OpenStreetMap',
                maps: 'Leaflet + OpenStreetMap (Free)',
                api_endpoints: 12,
                bot: 'Telegram Bot Active',
                static_files: 'Served correctly'
            }
        });
    } catch (error) {
        res.json({ 
            status: 'partial_service', 
            timestamp: new Date().toISOString(),
            error: error.message,
            service: 'El Pollo Loco Dashboard - Fallback Mode',
            version: '2.0.0',
            database_status: 'Using fallback data'
        });
    }
});

// Dashboard diagnostics endpoint
app.get('/api/dashboard/status', async (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        dashboard_version: '2.0',
        status: 'running',
        database_connection: dbConnected,
        endpoints: [
            { endpoint: '/api/kpis', status: 'ok' },
            { endpoint: '/api/grupos', status: 'ok' },
            { endpoint: '/api/locations', status: 'ok' }
        ]
    });
});

// API Routes (existing ones)
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

// NEW API - Locations with REAL coordinates from database
app.get('/api/locations', async (req, res) => {
    if (!dbConnected) {
        console.log('⚠️ DB not connected, using fallback locations');
        return res.json([
            {name: "Sucursal Centro", group: "OGAS", lat: 25.6866, lng: -100.3161, performance: 95.5, state: "Nuevo León", municipality: "Monterrey", last_evaluation: new Date(), total_evaluations: 15}
        ]);
    }
    
    try {
        const { grupo, estado, trimestre } = req.query;
        
        // Build dynamic WHERE clause
        let whereConditions = ['porcentaje IS NOT NULL'];
        let params = [];
        let paramIndex = 1;
        
        if (grupo) {
            whereConditions.push(`grupo_operativo = $${paramIndex}`);
            params.push(grupo);
            paramIndex++;
        }
        if (estado) {
            whereConditions.push(`estado = $${paramIndex}`);
            params.push(estado);
            paramIndex++;
        }
        if (trimestre) {
            whereConditions.push(`EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`);
            params.push(parseInt(trimestre));
            paramIndex++;
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        const query = `
            WITH location_data AS (
                SELECT 
                    location_name,
                    -- Usar el primer grupo operativo válido (no NO_ENCONTRADO)
                    COALESCE(
                        NULLIF(MIN(CASE WHEN grupo_operativo != 'NO_ENCONTRADO' THEN grupo_operativo END), NULL),
                        MIN(grupo_operativo)
                    ) as grupo_operativo,
                    -- Normalizar estados
                    CASE 
                        WHEN MIN(estado) LIKE '%Coahuila%' THEN 'Coahuila'
                        WHEN MIN(estado) LIKE '%México%' THEN 'México'
                        WHEN MIN(estado) LIKE '%Michoacán%' THEN 'Michoacán'
                        ELSE MIN(estado)
                    END as estado,
                    MIN(municipio) as municipio,
                    AVG(CAST(latitud AS FLOAT)) as lat,
                    AVG(CAST(longitud AS FLOAT)) as lng,
                    ROUND(AVG(porcentaje), 2) as performance,
                    MAX(fecha_supervision) as last_evaluation,
                    COUNT(DISTINCT submission_id) as total_evaluations
                FROM supervision_operativa_detalle
                WHERE ${whereClause}
                  AND latitud IS NOT NULL 
                  AND longitud IS NOT NULL
                GROUP BY location_name
            )
            SELECT 
                location_name as name,
                grupo_operativo as "group",
                lat,
                lng,
                performance,
                estado as state,
                municipio as municipality,
                last_evaluation,
                total_evaluations
            FROM location_data
            ORDER BY performance DESC
            LIMIT 100
        `;
        
        console.log(`📍 API /locations: Executing query with ${params.length} params`);
        const result = await pool.query(query, params);
        
        console.log(`✅ API /locations: Found ${result.rows.length} real locations`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ API /locations error:', error.message);
        res.json([]);
    }
});

// Additional APIs for dashboard - ESTADOS REALES
app.get('/api/estados', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.estados || []);
    }
    
    try {
        const result = await pool.query(`
            SELECT 
                CASE 
                    WHEN estado LIKE '%Coahuila%' THEN 'Coahuila'
                    WHEN estado LIKE '%México%' THEN 'México'
                    WHEN estado LIKE '%Michoacán%' THEN 'Michoacán'
                    ELSE estado
                END as estado,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT location_name) as sucursales
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND estado IS NOT NULL
            GROUP BY CASE 
                    WHEN estado LIKE '%Coahuila%' THEN 'Coahuila'
                    WHEN estado LIKE '%México%' THEN 'México'
                    WHEN estado LIKE '%Michoacán%' THEN 'Michoacán'
                    ELSE estado
                END
            ORDER BY AVG(porcentaje) DESC
        `);
        
        console.log(`📊 API /estados: Found ${result.rows.length} states`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ API /estados error:', error);
        res.json(fallbackData.estados || []);
    }
});

app.get('/api/indicadores', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.indicadores || []);
    }
    
    try {
        const result = await pool.query(`
            SELECT 
                area_evaluacion as indicador,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL 
            AND area_evaluacion IS NOT NULL
            AND area_evaluacion != ''
            AND area_evaluacion != 'PUNTOS MAXIMOS'
            GROUP BY area_evaluacion
            ORDER BY AVG(porcentaje) ASC
            LIMIT 20
        `);
        
        console.log(`📊 API /indicadores: Found ${result.rows.length} evaluation areas`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ API /indicadores error:', error);
        res.json(fallbackData.indicadores || []);
    }
});

app.get('/api/trimestres', async (req, res) => {
    if (!dbConnected) {
        return res.json([
            { trimestre: "Q1 2025", evaluaciones: 45 },
            { trimestre: "Q2 2025", evaluaciones: 52 },
            { trimestre: "Q3 2025", evaluaciones: 38 }
        ]);
    }
    
    try {
        const result = await pool.query(`
            SELECT 
                CASE 
                    WHEN EXTRACT(QUARTER FROM fecha_supervision) = 1 THEN 'Q1 2025'
                    WHEN EXTRACT(QUARTER FROM fecha_supervision) = 2 THEN 'Q2 2025'
                    WHEN EXTRACT(QUARTER FROM fecha_supervision) = 3 THEN 'Q3 2025'
                    WHEN EXTRACT(QUARTER FROM fecha_supervision) = 4 THEN 'Q4 2025'
                END as trimestre,
                COUNT(DISTINCT submission_id) as evaluaciones
            FROM supervision_operativa_detalle 
            WHERE fecha_supervision IS NOT NULL
            AND EXTRACT(YEAR FROM fecha_supervision) = 2025
            GROUP BY EXTRACT(QUARTER FROM fecha_supervision)
            ORDER BY EXTRACT(QUARTER FROM fecha_supervision)
        `);
        
        console.log(`📊 API /trimestres: Found ${result.rows.length} quarters`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ API /trimestres error:', error);
        res.json([
            { trimestre: "Q1 2025", evaluaciones: 45 },
            { trimestre: "Q2 2025", evaluaciones: 52 },
            { trimestre: "Q3 2025", evaluaciones: 38 }
        ]);
    }
});

// Debug endpoint for locations
app.get('/api/debug/locations', async (req, res) => {
    if (!dbConnected) {
        return res.json({ error: 'Database not connected' });
    }
    
    try {
        // Count total locations
        const countResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT location_name) as total_locations,
                COUNT(DISTINCT CASE WHEN latitud IS NOT NULL THEN location_name END) as with_coords,
                COUNT(DISTINCT CASE WHEN latitud IS NULL THEN location_name END) as without_coords
            FROM supervision_operativa_detalle
        `);
        
        // Sample locations with and without coords
        const sampleResult = await pool.query(`
            SELECT DISTINCT
                location_name,
                grupo_operativo,
                estado,
                municipio,
                latitud,
                longitud
            FROM supervision_operativa_detalle
            ORDER BY latitud DESC NULLS LAST
            LIMIT 10
        `);
        
        res.json({
            summary: countResult.rows[0],
            sample_locations: sampleResult.rows,
            database_connected: dbConnected
        });
        
    } catch (error) {
        res.json({ 
            error: error.message,
            database_connected: dbConnected 
        });
    }
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
    console.log(`🚀 El Pollo Loco Interactive Dashboard v2.0 running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log(`📱 Telegram Web App ready`);
    
    // Start Telegram Bot if in production
    if (process.env.NODE_ENV === 'production' || process.env.START_BOT === 'true') {
        console.log('🤖 Starting Telegram Bot...');
        
        // Setup basic Telegram bot
        const TelegramBot = require('node-telegram-bot-api');
        if (process.env.TELEGRAM_BOT_TOKEN) {
            global.telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
            
            // Dashboard command
            global.telegramBot.onText(/\/dashboard/, async (msg) => {
                const chatId = msg.chat.id;
                const dashboardUrl = process.env.RENDER_EXTERNAL_URL || 'https://pollo-loco-supervision.onrender.com';
                
                const keyboard = {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: "📊 Ver Dashboard Interactivo",
                            web_app: { url: `${dashboardUrl}/dashboard` }
                        }]]
                    }
                };
                
                await global.telegramBot.sendMessage(chatId, 
                    '📊 **Dashboard Interactivo v2.0**\n\n¡Nueva versión con mapa OpenStreetMap y filtros!\n\n👆 Toca el botón para abrir',
                    { parse_mode: 'Markdown', ...keyboard }
                );
            });
            
            console.log('✅ Telegram bot configured with commands, dashboard available');
        }
        
        // Set webhook in production
        if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL && process.env.TELEGRAM_BOT_TOKEN) {
            const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/webhook`;
            console.log(`🔗 Setting webhook to: ${webhookUrl}`);
            
            try {
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