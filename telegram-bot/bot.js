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

// Simplified bot - no Ana integration

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

// Dashboard route - serve mobile-optimized version
app.get('/dashboard', (req, res) => {
    const mobileOptimizedPath = path.join(__dirname, '../public/dashboard-ios-complete.html');
    console.log('📊 Dashboard requested, serving mobile-optimized:', mobileOptimizedPath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(mobileOptimizedPath)) {
        console.error('❌ Mobile dashboard not found:', mobileOptimizedPath);
        // Fallback to original
        const indexPath = path.join(__dirname, 'web-app/public/index.html');
        return res.sendFile(indexPath);
    }
    
    res.sendFile(mobileOptimizedPath);
});

// Solo Dashboard - sin rutas adicionales

// Default route - serve mobile dashboard directly
app.get('/', (req, res) => {
    const mobileOptimizedPath = path.join(__dirname, '../public/dashboard-ios-complete.html');
    console.log('🏠 Root requested, serving mobile-optimized dashboard:', mobileOptimizedPath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(mobileOptimizedPath)) {
        console.error('❌ Mobile dashboard not found:', mobileOptimizedPath);
        return res.json({
            message: 'El Pollo Loco Supervision System',
            version: '2.0',
            status: 'running',
            timestamp: new Date().toISOString(),
            note: 'Mobile dashboard not found - use /dashboard'
        });
    }
    
    res.sendFile(mobileOptimizedPath);
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
                        web_app: { url: `${dashboardUrl}` }
                    }
                ]]
            }
        };
        
        const message = `📊 **Dashboard El Pollo Loco CAS**\n\n¡Sistema completo de supervisión operativa!\n\n• 🗺️ Mapa interactivo (79 sucursales)\n• 📈 Análisis de 135 supervisiones\n• 🎯 Histórico con tendencias\n• 📊 KPIs y métricas en tiempo real\n• 📱 Optimizado para móvil\n\n👆 Toca el botón para abrir`;
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
        
    } catch (error) {
        console.error('Error showing dashboard:', error);
        bot.sendMessage(chatId, '❌ Error al cargar el dashboard. Intenta más tarde.');
    }
});


// Sin keyboard buttons - solo menú button azul


// Basic message handler
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text || '';
    
    // Skip commands only
    if (messageText.startsWith('/')) {
        return;
    }
    
    try {
        // Check for dashboard triggers
        // Auto-respuesta simple - redirigir a dashboard
        return bot.emit('text', msg, [null, '/dashboard']);
        
        // Simple response for any message
        await bot.sendMessage(chatId, '🍗 ¡Hola! Usa el botón Dashboard para acceder al sistema completo de supervisión El Pollo Loco CAS.');
        
    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, 'Hubo un error procesando tu solicitud.');
    }
});

// Start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    const welcomeMessage = `🍗 **¡Bienvenido al Sistema El Pollo Loco CAS!**\n\n` +
                          `📊 **Accede al Dashboard para ver:**\n` +
                          `• Mapas interactivos con 79 sucursales\n` +
                          `• Gráficos de performance en tiempo real\n` +
                          `• Análisis de 135 supervisiones\n` +
                          `• KPIs y métricas operativas\n\n` +
                          `🎯 **Dashboard optimizado para móvil**\n` +
                          `Todo en una sola interfaz intuitiva\n\n` +
                          `👆 Usa el botón azul del menú para acceder`;
    
    // Sin teclado - solo botón azul del menú
    const keyboard = {
        reply_markup: {
            remove_keyboard: true
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