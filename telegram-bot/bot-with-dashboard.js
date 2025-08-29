const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

// Import existing bot configuration
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Pool } = require('pg');
const AnaV2Structured = require('./ana-intelligent');
const WebAppIntegration = require('./web-app-integration');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Initialize Express app for both webhook and dashboard
const app = express();
const port = process.env.PORT || 10000;

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

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { 
    polling: process.env.NODE_ENV !== 'production',
    webHook: process.env.NODE_ENV === 'production'
});

// Initialize Ana and Web App Integration
const ana = new AnaV2Structured(pool);
const webAppIntegration = new WebAppIntegration(bot, pool);

// In production, set webhook
if (process.env.NODE_ENV === 'production') {
    const webhookUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL;
    bot.setWebHook(`${webhookUrl}/webhook`);
    console.log('🔗 Webhook configurado:', `${webhookUrl}/webhook`);
}

// =====================================================
// TELEGRAM WEBHOOK ENDPOINT
// =====================================================
app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.status(200).json({ ok: true });
});

// =====================================================
// DASHBOARD STATIC FILES
// =====================================================
app.use(express.static(path.join(__dirname, 'web-app/public')));

// =====================================================
// DASHBOARD API ENDPOINTS
// =====================================================

// GET /api/locations - Todas las ubicaciones con coordenadas
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
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching overview:', error);
        res.status(500).json({ error: 'Error fetching overview' });
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
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Error fetching groups' });
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
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({ error: 'Error fetching trends' });
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
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Error fetching groups' });
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
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching states:', error);
        res.status(500).json({ error: 'Error fetching states' });
    }
});

// =====================================================
// BOT COMMANDS
// =====================================================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text || '';
    
    try {
        // Check if message asks for dashboard
        if (webAppIntegration.shouldShowDashboard(messageText)) {
            await webAppIntegration.sendDashboardResponse(chatId, 
                '¡Aquí está el dashboard interactivo con todos los datos de supervisión!', {});
            return;
        }
        
        // Process with Ana
        const response = await ana.processMessage(messageText, chatId);
        
        // Check if we should enrich with dashboard
        const enriched = await webAppIntegration.enrichResponseWithDashboard(response, 
            { originalQuestion: messageText }, chatId);
        
        if (!enriched) {
            await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }
        
    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, 'Hubo un error procesando tu solicitud.');
    }
});

// Dashboard command
bot.onText(/\/dashboard/, async (msg) => {
    const chatId = msg.chat.id;
    await webAppIntegration.respondPerformanceAnalysis(chatId);
});

// =====================================================
// HEALTH CHECK & DEFAULT ROUTES
// =====================================================

// Health check for both bot and dashboard
app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query('SELECT NOW() as server_time');
        res.json({ 
            status: 'healthy',
            service: 'El Pollo Loco Bot + Dashboard',
            database: 'connected',
            server_time: dbCheck.rows[0].server_time,
            features: ['telegram-bot', 'web-dashboard', 'api-endpoints']
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            error: error.message 
        });
    }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-app/public/index.html'));
});

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'El Pollo Loco Supervision System',
        version: '2.0',
        endpoints: {
            webhook: '/webhook',
            dashboard: '/dashboard',
            health: '/health',
            api: '/api/*'
        }
    });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(port, () => {
    console.log(`🚀 El Pollo Loco Bot + Dashboard Server running on port ${port}`);
    console.log(`📊 Dashboard available at: ${process.env.RENDER_EXTERNAL_URL}/dashboard`);
    console.log(`🤖 Telegram bot active with webhook`);
    console.log(`💾 Database: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔴 Shutting down server...');
    await pool.end();
    process.exit(0);
});