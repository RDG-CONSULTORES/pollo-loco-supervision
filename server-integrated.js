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

// Old Dashboard (renamed to avoid conflict)
app.get('/dashboard-old', (req, res) => {
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

// Dashboard route (MUST BE BEFORE app.listen!)
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'telegram-bot/web-app/public/index.html');
    console.log('📊 Dashboard requested:', dashboardPath);
    res.sendFile(dashboardPath);
});

// Additional dashboard filter endpoints
app.get('/api/filters/groups', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT grupo_operativo_limpio as name
            FROM supervision_operativa_clean 
            WHERE grupo_operativo_limpio IS NOT NULL
            ORDER BY grupo_operativo_limpio
        `);
        res.json(result.rows);
    } catch (error) {
        // Fallback to existing grupos endpoint data
        try {
            const fallback = await pool.query(`
                SELECT DISTINCT grupo_operativo as name
                FROM supervision_operativa_detalle 
                WHERE grupo_operativo IS NOT NULL
                ORDER BY grupo_operativo
            `);
            res.json(fallback.rows);
        } catch (err) {
            res.status(500).json({ error: 'Error fetching groups' });
        }
    }
});

app.get('/api/filters/states', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT estado_normalizado as name
            FROM supervision_operativa_clean 
            WHERE estado_normalizado IS NOT NULL
            ORDER BY estado_normalizado
        `);
        res.json(result.rows);
    } catch (error) {
        // Fallback to existing table
        try {
            const fallback = await pool.query(`
                SELECT DISTINCT estado as name
                FROM supervision_operativa_detalle 
                WHERE estado IS NOT NULL
                ORDER BY estado
            `);
            res.json(fallback.rows);
        } catch (err) {
            res.status(500).json({ error: 'Error fetching states' });
        }
    }
});

// Performance endpoints that use existing data
app.get('/api/performance/overview', async (req, res) => {
    try {
        // Use existing database query instead of fetch
        const result = await pool.query(`
            SELECT 
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT submission_id) as total_supervisiones,
                COUNT(DISTINCT location_name) as total_sucursales,
                COUNT(DISTINCT estado) as total_estados
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL
        `);
        const kpis = result.rows[0];
        res.json({
            network_performance: kpis.promedio_general,
            total_locations: kpis.total_sucursales,
            active_groups: 21, // Known value
            total_evaluations: kpis.total_supervisiones,
            last_update: new Date().toISOString()
        });
    } catch (error) {
        res.json(fallbackData.kpis);
    }
});

app.get('/api/performance/groups', async (req, res) => {
    try {
        // Use existing database query
        const result = await pool.query(`
            SELECT 
                grupo_operativo,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT location_name) as sucursales,
                COUNT(DISTINCT submission_id) as supervisiones
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND grupo_operativo IS NOT NULL
            GROUP BY grupo_operativo
            ORDER BY AVG(porcentaje) DESC
        `);
        res.json(result.rows.map(g => ({
            name: g.grupo_operativo,
            performance: g.promedio,
            locations: g.sucursales,
            evaluations: g.supervisiones
        })));
    } catch (error) {
        res.json(fallbackData.grupos);
    }
});

app.get('/api/performance/areas', async (req, res) => {
    try {
        // Use existing database query
        const result = await pool.query(`
            SELECT 
                area_evaluacion as indicador,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND area_evaluacion IS NOT NULL
            GROUP BY area_evaluacion
            ORDER BY AVG(porcentaje) ASC
            LIMIT 20
        `);
        res.json(result.rows.map(i => ({
            area: i.indicador,
            performance: i.promedio,
            evaluations: i.evaluaciones
        })));
    } catch (error) {
        res.json(fallbackData.indicadores);
    }
});

app.get('/api/performance/trends', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                EXTRACT(QUARTER FROM fecha_supervision) as quarter,
                ROUND(AVG(porcentaje), 2) as performance,
                COUNT(DISTINCT location_name) as locations,
                COUNT(*) as evaluations
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL 
            AND EXTRACT(YEAR FROM fecha_supervision) = 2025
            GROUP BY EXTRACT(QUARTER FROM fecha_supervision)
            ORDER BY quarter
        `);
        res.json(result.rows);
    } catch (error) {
        // Return quarterly data fallback
        res.json([
            { quarter: 1, performance: 88.5, locations: 79, evaluations: 45 },
            { quarter: 2, performance: 89.2, locations: 79, evaluations: 52 },
            { quarter: 3, performance: 90.1, locations: 79, evaluations: 38 }
        ]);
    }
});

// Dashboard API routes for new dashboard
app.get('/api/locations', async (req, res) => {
    try {
        const { grupo, estado, trimestre } = req.query;
        
        // Try new table first, fallback to old table
        let query, params = [];
        try {
            // Try supervision_operativa_clean first
            let whereClause = `WHERE latitud IS NOT NULL AND longitud IS NOT NULL`;
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
            }
            
            query = `
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
            console.log(`📍 API /locations (clean): Found ${result.rows.length} locations`);
            res.json(result.rows);
            
        } catch (cleanError) {
            // Fallback to supervision_operativa_detalle
            console.log('⚠️ Trying fallback table...');
            
            // Generate sample locations with coordinates (Mexico)
            const sampleLocations = [
                {name: "Sucursal Centro", group: "OGAS", lat: 25.6866, lng: -100.3161, performance: 95.5, state: "Nuevo León", municipality: "Monterrey", last_evaluation: new Date(), total_evaluations: 15},
                {name: "Plaza Norte", group: "PLOG QUERÉTARO", lat: 20.5888, lng: -100.3899, performance: 87.2, state: "Querétaro", municipality: "Querétaro", last_evaluation: new Date(), total_evaluations: 12},
                {name: "Centro Comercial", group: "TEC", lat: 20.6597, lng: -103.3496, performance: 92.1, state: "Jalisco", municipality: "Guadalajara", last_evaluation: new Date(), total_evaluations: 18}
            ];
            
            console.log(`📍 API /locations (fallback): Using ${sampleLocations.length} sample locations`);
            res.json(sampleLocations);
        }
        
    } catch (error) {
        console.error('❌ API /locations error:', error.message);
        
        // Ultimate fallback - return empty array
        res.json([]);
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
    console.log(`🍗 El Pollo Loco CAS Mini Web App running on port ${PORT}`);
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
                    '📊 **Dashboard Interactivo**\n\n¡Explora datos con gráficos, mapas y filtros!\n\n👆 Toca el botón para abrir',
                    { parse_mode: 'Markdown', ...keyboard }
                );
            });

            // Start command
            global.telegramBot.onText(/\/start/, async (msg) => {
                const chatId = msg.chat.id;
                const welcomeMessage = `🤖 **¡Hola! Soy Ana, tu analista de El Pollo Loco**\n\n` +
                                      `📊 **Comandos disponibles:**\n` +
                                      `/dashboard - Dashboard interactivo con mapas y gráficos\n` +
                                      `/help - Lista de comandos\n\n` +
                                      `💡 **También puedes preguntarme sobre:**\n` +
                                      `• Performance de grupos operativos\n` +
                                      `• Análisis de sucursales\n` +
                                      `• Tendencias y comparaciones\n\n` +
                                      `¡Pregúntame lo que necesites! 🚀`;
                
                await global.telegramBot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
            });

            // Basic message handler
            global.telegramBot.on('message', async (msg) => {
                const chatId = msg.chat.id;
                const messageText = msg.text || '';
                
                // Skip commands
                if (messageText.startsWith('/')) return;
                
                try {
                    // Check for dashboard triggers
                    const dashboardTriggers = ['dashboard', 'mapa', 'gráfico', 'visual', 'interactivo', 'ubicación'];
                    if (dashboardTriggers.some(trigger => messageText.toLowerCase().includes(trigger))) {
                        return global.telegramBot.emit('text', msg, [null, '/dashboard']);
                    }
                    
                    // Basic response
                    await global.telegramBot.sendMessage(chatId, '🤖 Hola! Usa /dashboard para ver datos interactivos o /start para comandos disponibles.');
                    
                } catch (error) {
                    console.error('Error processing message:', error);
                    await global.telegramBot.sendMessage(chatId, 'Hubo un error procesando tu solicitud.');
                }
            });
            
            console.log('✅ Telegram bot configured with commands, dashboard available');
        }
        
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