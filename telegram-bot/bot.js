const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const axios = require('axios');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Initialize Express app FIRST
const app = express();
const port = process.env.PORT || 10000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Security and optimization middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://cdn.jsdelivr.net", "https://telegram.org"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://maps.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        },
    },
}));

app.use(compression());
app.use(express.json());

// Serve dashboard static files
app.use(express.static(path.join(__dirname, 'web-app/public')));

// Initialize bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required!');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

// Import Ana (simplified)
let ana = null;
try {
    const AnaV2Structured = require('./ana-intelligent');
    ana = new AnaV2Structured(pool);
    console.log('✅ Ana V2 loaded successfully');
} catch (error) {
    console.log('⚠️ Ana V2 not available, using fallback');
}

// =====================================================
// WEBHOOK CONFIGURATION
// =====================================================

if (process.env.NODE_ENV === 'production') {
    const webhookUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL || 'https://pollo-loco-supervision-kzxj.onrender.com';
    bot.setWebHook(`${webhookUrl}/webhook`);
    console.log('🔗 Webhook configured:', `${webhookUrl}/webhook`);
}

// =====================================================
// EXPRESS ROUTES
// =====================================================

// Health check
app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query('SELECT NOW() as server_time, COUNT(*) as records FROM supervision_operativa_clean LIMIT 1');
        res.json({ 
            status: 'healthy',
            service: 'El Pollo Loco Bot + Dashboard',
            database: 'connected',
            server_time: dbCheck.rows[0].server_time,
            total_records: dbCheck.rows[0].records,
            features: ['telegram-bot', 'web-dashboard', 'api-endpoints']
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    const indexPath = path.join(__dirname, 'web-app/public/index.html');
    console.log('📊 Dashboard requested, serving:', indexPath);
    res.sendFile(indexPath);
});

// Análisis Histórico route
app.get('/historico', (req, res) => {
    const historicoPath = path.join(__dirname, '../historico-demo-completo.html');
    console.log('📈 Análisis Histórico requested, serving:', historicoPath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(historicoPath)) {
        console.error('❌ File not found:', historicoPath);
        return res.status(404).send('Análisis Histórico no disponible');
    }
    
    res.sendFile(historicoPath);
});

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'El Pollo Loco Supervision System',
        version: '2.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            webhook: '/webhook',
            dashboard: '/dashboard',
            historico: '/historico',
            health: '/health',
            api: '/api/*'
        }
    });
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.status(200).json({ ok: true });
});

// =====================================================
// DASHBOARD API ENDPOINTS
// =====================================================

// GET /api/locations - Ubicaciones con coordenadas
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
        
        console.log('🗺️ Locations query with filters:', { grupo, estado, trimestre });
        const result = await pool.query(query, params);
        console.log(`📍 Found ${result.rows.length} locations`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching locations:', error);
        res.status(500).json({ error: 'Error fetching locations', details: error.message });
    }
});

// GET /api/performance/overview - KPIs generales
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
        console.log('📊 Overview data:', result.rows[0]);
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('❌ Error fetching overview:', error);
        res.status(500).json({ error: 'Error fetching overview', details: error.message });
    }
});

// GET /api/performance/groups - Performance por grupo
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
                COUNT(*) as evaluations
            FROM supervision_operativa_clean 
            ${whereClause}
            GROUP BY grupo_operativo_limpio
            ORDER BY performance DESC
        `;
        
        const result = await pool.query(query, params);
        console.log(`📈 Groups data: ${result.rows.length} groups`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching groups:', error);
        res.status(500).json({ error: 'Error fetching groups', details: error.message });
    }
});

// GET /api/performance/areas - Áreas críticas
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
                COUNT(*) as evaluations
            FROM supervision_operativa_clean 
            ${whereClause}
            GROUP BY area_evaluacion
            ORDER BY performance ASC
            LIMIT 20
        `;
        
        const result = await pool.query(query, params);
        console.log(`🎯 Areas data: ${result.rows.length} areas`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching areas:', error);
        res.status(500).json({ error: 'Error fetching areas', details: error.message });
    }
});

// GET /api/performance/trends - Tendencias trimestrales
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
        console.log(`📈 Trends data: ${result.rows.length} quarters`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching trends:', error);
        res.status(500).json({ error: 'Error fetching trends', details: error.message });
    }
});

// GET /api/filters/groups - Grupos disponibles
app.get('/api/filters/groups', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT grupo_operativo_limpio as name
            FROM supervision_operativa_clean 
            WHERE grupo_operativo_limpio IS NOT NULL
            ORDER BY grupo_operativo_limpio
        `;
        
        const result = await pool.query(query);
        console.log(`🔍 Filter groups: ${result.rows.length} available`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching filter groups:', error);
        res.status(500).json({ error: 'Error fetching groups', details: error.message });
    }
});

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
        console.log(`🔍 Filter states: ${result.rows.length} available`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching filter states:', error);
        res.status(500).json({ error: 'Error fetching states', details: error.message });
    }
});

// =====================================================
// TELEGRAM BOT HANDLERS
// =====================================================

// Dashboard command
bot.onText(/\/dashboard/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const dashboardUrl = process.env.RENDER_EXTERNAL_URL || 'https://pollo-loco-supervision-kzxj.onrender.com';
        
        const keyboard = {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "📊 Ver Dashboard Interactivo",
                        web_app: { url: `${dashboardUrl}/dashboard` }
                    }
                ]]
            }
        };
        
        const message = `📊 **Dashboard Interactivo Disponible**\n\n¡Explora todos los datos de supervisión con gráficos interactivos, mapas y filtros dinámicos!\n\n• 🗺️ Mapa con 82 sucursales\n• 📈 Gráficos de performance\n• 🔍 Filtros dinámicos\n• 📊 KPIs en tiempo real\n\n👆 Toca el botón para abrir`;
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
        
    } catch (error) {
        console.error('Error showing dashboard:', error);
        bot.sendMessage(chatId, '❌ Error al cargar el dashboard. Intenta más tarde.');
    }
});

// Análisis Histórico command
bot.onText(/\/historico/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const dashboardUrl = process.env.RENDER_EXTERNAL_URL || 'https://pollo-loco-supervision-kzxj.onrender.com';
        
        const keyboard = {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "📈 Ver Análisis Histórico",
                        web_app: { url: `${dashboardUrl}/historico` }
                    }
                ]]
            }
        };
        
        const message = `📈 **Análisis Histórico Disponible**\n\n¡Explora la evolución histórica con 6 perspectivas diferentes!\n\n• 🧠 Vista Inteligente\n• ⚖️ Análisis Comparativo\n• 🗺️ Mapa de Calor\n• ⏰ Evolución Temporal\n• 💡 Insights & Tendencias\n• 📱 Vista Móvil\n\n👆 Toca el botón para abrir`;
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
        
    } catch (error) {
        console.error('Error showing histórico:', error);
        bot.sendMessage(chatId, '❌ Error al cargar el análisis histórico. Intenta más tarde.');
    }
});

// Keyboard button handlers
bot.onText(/📊 Dashboard/, async (msg) => {
    console.log('📊 Dashboard button pressed');
    return bot.emit('text', msg, [null, '/dashboard']);
});

bot.onText(/📈 Análisis Histórico/, async (msg) => {
    console.log('📈 Análisis Histórico button pressed');
    return bot.emit('text', msg, [null, '/historico']);
});

bot.onText(/❓ Ayuda/, async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `📚 **Ayuda - El Pollo Loco Bot**\n\n` +
                       `🔹 **Botones disponibles:**\n` +
                       `📊 Dashboard - Mapas interactivos y gráficos\n` +
                       `📈 Análisis Histórico - 6 perspectivas de evolución\n` +
                       `❓ Ayuda - Esta información\n` +
                       `💬 Chat con Ana - Conversación libre\n\n` +
                       `🔹 **Comandos de texto:**\n` +
                       `/start - Mostrar menú principal\n` +
                       `/dashboard - Abrir dashboard\n` +
                       `/historico - Abrir análisis histórico\n\n` +
                       `💡 **También puedes preguntarme directamente sobre cualquier tema de supervisión.**`;
    
    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

bot.onText(/💬 Chat con Ana/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, '💬 **Modo Chat Activado**\n\n¡Hola! Ahora puedes preguntarme cualquier cosa sobre:\n\n• Performance de grupos\n• Análisis de sucursales\n• Comparaciones y tendencias\n• Datos específicos\n\n¿En qué te puedo ayudar? 🤖');
});

// Basic message handler
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text || '';
    
    // Skip commands and keyboard buttons
    if (messageText.startsWith('/') || 
        messageText.includes('📊') || 
        messageText.includes('📈') || 
        messageText.includes('❓') || 
        messageText.includes('💬')) {
        return;
    }
    
    try {
        // Check for dashboard triggers
        const dashboardTriggers = ['dashboard', 'mapa', 'gráfico', 'visual', 'interactivo', 'ubicación'];
        if (dashboardTriggers.some(trigger => messageText.toLowerCase().includes(trigger))) {
            return bot.emit('text', msg, [null, '/dashboard']);
        }
        
        // Use Ana if available
        if (ana) {
            const response = await ana.processMessage(messageText, chatId);
            await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(chatId, '🤖 Hola! Usa los botones de abajo para navegar o pregúntame directamente.');
        }
        
    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, 'Hubo un error procesando tu solicitud.');
    }
});

// Start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    const welcomeMessage = `🤖 **¡Hola! Soy Ana, tu analista de El Pollo Loco**\n\n` +
                          `📊 **Usa los botones de abajo para navegar:**\n` +
                          `• Dashboard - Mapas y gráficos interactivos\n` +
                          `• Análisis Histórico - 6 visualizaciones diferentes\n` +
                          `• Ayuda - Lista de comandos\n\n` +
                          `💡 **También puedes preguntarme sobre:**\n` +
                          `• Performance de grupos operativos\n` +
                          `• Análisis de sucursales\n` +
                          `• Tendencias y comparaciones\n\n` +
                          `¡Pregúntame lo que necesites! 🚀`;
    
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📊 Dashboard', '📈 Análisis Histórico'],
                ['❓ Ayuda', '💬 Chat con Ana']
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
            persistent: true
        }
    };
    
    await bot.sendMessage(chatId, welcomeMessage, { 
        parse_mode: 'Markdown',
        ...keyboard 
    });
});

// =====================================================
// START EXPRESS SERVER
// =====================================================

app.listen(port, () => {
    console.log(`🚀 El Pollo Loco Server running on port ${port}`);
    console.log(`📊 Dashboard: https://pollo-loco-supervision-kzxj.onrender.com/dashboard`);
    console.log(`🔍 Health: https://pollo-loco-supervision-kzxj.onrender.com/health`);
    console.log(`🤖 Telegram webhook configured`);
    console.log(`💾 Database: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔴 Shutting down server...');
    await pool.end();
    process.exit(0);
});

module.exports = app;