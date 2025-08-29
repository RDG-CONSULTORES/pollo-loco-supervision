// =====================================================
// SERVIDOR PRINCIPAL - EL POLLO LOCO DASHBOARD + BOT
// Garantiza que Express funcione sin interferencia de Ana
// =====================================================

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const { Pool } = require('pg');

// Load environment
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

console.log('🚀 Starting El Pollo Loco Server...');

// Initialize Express FIRST
const app = express();
const port = process.env.PORT || 10000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected:', res.rows[0].now);
    }
});

// Security middleware
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

console.log('📁 Static files served from:', path.join(__dirname, 'web-app/public'));

// =====================================================
// BASIC ROUTES
// =====================================================

// Health check
app.get('/health', async (req, res) => {
    try {
        const dbResult = await pool.query('SELECT NOW() as time, COUNT(*) as records FROM supervision_operativa_clean LIMIT 1');
        res.json({ 
            status: 'healthy',
            service: 'El Pollo Loco Dashboard + Bot',
            database: 'connected',
            timestamp: dbResult.rows[0].time,
            total_records: dbResult.rows[0].records,
            version: '2.0'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            database: 'disconnected',
            error: error.message 
        });
    }
});

// Dashboard
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'web-app/public/index.html');
    console.log('📊 Dashboard requested:', dashboardPath);
    res.sendFile(dashboardPath);
});

// Root
app.get('/', (req, res) => {
    res.json({
        message: 'El Pollo Loco Supervision System',
        version: '2.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            dashboard: '/dashboard',
            health: '/health',
            test: '/test.html',
            api: '/api/*'
        }
    });
});

// =====================================================
// API ENDPOINTS
// =====================================================

// Locations with filters
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
        console.log(`📍 API /locations: Found ${result.rows.length} locations`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ API /locations error:', error.message);
        res.status(500).json({ error: 'Error fetching locations' });
    }
});

// Performance overview
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
        console.log('📊 API /overview: Success');
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('❌ API /overview error:', error.message);
        res.status(500).json({ error: 'Error fetching overview' });
    }
});

// Groups performance
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
        console.log(`📈 API /groups: Found ${result.rows.length} groups`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ API /groups error:', error.message);
        res.status(500).json({ error: 'Error fetching groups' });
    }
});

// Areas performance
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
        console.log(`🎯 API /areas: Found ${result.rows.length} areas`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ API /areas error:', error.message);
        res.status(500).json({ error: 'Error fetching areas' });
    }
});

// Trends
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
        console.log(`📈 API /trends: Found ${result.rows.length} quarters`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ API /trends error:', error.message);
        res.status(500).json({ error: 'Error fetching trends' });
    }
});

// Filter endpoints
app.get('/api/filters/groups', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT grupo_operativo_limpio as name
            FROM supervision_operativa_clean 
            WHERE grupo_operativo_limpio IS NOT NULL
            ORDER BY grupo_operativo_limpio
        `);
        
        console.log(`🔍 API /filters/groups: Found ${result.rows.length} groups`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ API /filters/groups error:', error.message);
        res.status(500).json({ error: 'Error fetching groups filter' });
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
        
        console.log(`🔍 API /filters/states: Found ${result.rows.length} states`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ API /filters/states error:', error.message);
        res.status(500).json({ error: 'Error fetching states filter' });
    }
});

// =====================================================
// TELEGRAM BOT (OPCIONAL)
// =====================================================

let bot = null;
try {
    const TelegramBot = require('node-telegram-bot-api');
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (token) {
        bot = new TelegramBot(token, { polling: false });
        
        // Webhook
        app.post('/webhook', (req, res) => {
            bot.processUpdate(req.body);
            res.status(200).json({ ok: true });
        });
        
        // Dashboard command
        bot.onText(/\/dashboard/, async (msg) => {
            const chatId = msg.chat.id;
            const dashboardUrl = process.env.RENDER_EXTERNAL_URL || 'https://pollo-loco-supervision-kzxj.onrender.com';
            
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [[{
                        text: "📊 Ver Dashboard Interactivo",
                        web_app: { url: `${dashboardUrl}/dashboard` }
                    }]]
                }
            };
            
            await bot.sendMessage(chatId, 
                '📊 **Dashboard Interactivo**\n\n¡Explora datos con gráficos, mapas y filtros!\n\n👆 Toca el botón para abrir',
                { parse_mode: 'Markdown', ...keyboard }
            );
        });
        
        // Set webhook in production
        if (process.env.NODE_ENV === 'production') {
            const webhookUrl = process.env.RENDER_EXTERNAL_URL || 'https://pollo-loco-supervision-kzxj.onrender.com';
            bot.setWebHook(`${webhookUrl}/webhook`);
            console.log('🤖 Telegram webhook configured');
        }
        
        console.log('✅ Telegram bot initialized');
    } else {
        console.log('⚠️ No Telegram token, bot disabled');
    }
} catch (error) {
    console.log('⚠️ Telegram bot not available:', error.message);
}

// =====================================================
// START SERVER (only if run directly, not when imported)
// =====================================================

if (require.main === module) {
    app.listen(port, () => {
        console.log(`\n🚀 El Pollo Loco Server running on port ${port}`);
        console.log(`📊 Dashboard: https://pollo-loco-supervision-kzxj.onrender.com/dashboard`);
        console.log(`🔍 Health: https://pollo-loco-supervision-kzxj.onrender.com/health`);
        console.log(`🧪 Test APIs: https://pollo-loco-supervision-kzxj.onrender.com/test.html`);
        console.log(`\n🎯 Features available:`);
        console.log('   - Interactive dashboard with real data');
        console.log('   - 82 locations with coordinates');
        console.log('   - Dynamic filters and charts');
        console.log('   - API endpoints for all data');
        if (bot) console.log('   - Telegram bot integration');
        console.log('\n✅ Server ready!');
    });
} else {
    console.log('📱 Server module loaded, not starting listener (imported mode)');
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔴 Shutting down...');
    await pool.end();
    process.exit(0);
});

module.exports = app;