// 🤖 EL POLLO LOCO CAS - TELEGRAM BOT LIMPIO CON AUTENTICACIÓN
// Sistema profesional sin conflictos de keyboard/menu

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { TelegramAuth, requireAuth, authLimiter } = require('./auth-system');

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

// Initialize bot TOKEN
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required!');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

// Inicializar sistema de autenticación
const auth = new TelegramAuth();

// Estado para manejo de conversaciones (registro)
const userStates = {};

// =====================================================
// WEBHOOK CONFIGURATION
// =====================================================

if (process.env.NODE_ENV === 'production') {
    const webhookUrl = process.env.RENDER_EXTERNAL_URL || 'https://pollo-loco-supervision.onrender.com';
    bot.setWebHook(`${webhookUrl}/webhook`);
    console.log('🔗 Webhook configured:', `${webhookUrl}/webhook`);
}

// =====================================================
// EXPRESS ROUTES - SOLO ESENCIALES
// =====================================================

// Health check
app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query('SELECT NOW() as server_time, COUNT(*) as records FROM authorized_users LIMIT 1');
        res.json({ 
            status: 'healthy',
            service: 'El Pollo Loco Bot + Dashboard con Autenticación',
            database: 'connected',
            server_time: dbCheck.rows[0].server_time,
            authorized_users: dbCheck.rows[0].records,
            features: ['telegram-auth-bot', 'secure-dashboard', 'jwt-tokens', 'audit-logs']
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// Login page - página simple para redirección
app.get('/login', (req, res) => {
    const loginHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>El Pollo Loco CAS - Acceso</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
                background: #F2F2F7;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                color: #000;
            }
            .login-container {
                background: white;
                border-radius: 12px;
                padding: 32px;
                text-align: center;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                max-width: 400px;
            }
            .logo { font-size: 48px; margin-bottom: 16px; }
            h1 { margin-bottom: 8px; font-weight: 600; }
            p { color: #666; margin-bottom: 24px; line-height: 1.5; }
            .telegram-btn {
                background: #007AFF;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                text-decoration: none;
                display: inline-block;
                margin-top: 16px;
            }
            .status { 
                background: #34C759; 
                color: white; 
                padding: 8px 12px; 
                border-radius: 6px; 
                font-size: 14px; 
                margin-bottom: 16px;
                display: inline-block;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo">🍗</div>
            <div class="status">✅ Sistema Seguro Activo</div>
            <h1>El Pollo Loco CAS</h1>
            <p>Sistema de Supervisión Operativa</p>
            <p><strong>Acceso restringido</strong><br>Solo para personal autorizado</p>
            <a href="https://t.me/EPLEstandarizacionBot" class="telegram-btn">
                🔐 Iniciar Sesión con Telegram
            </a>
            <p style="font-size: 14px; margin-top: 24px; color: #999;">
                Usa el comando <strong>/login</strong> en el bot para obtener acceso
            </p>
        </div>
    </body>
    </html>`;
    
    res.send(loginHtml);
});

// Dashboard route - PROTEGIDO con autenticación
app.get('/dashboard', requireAuth, (req, res) => {
    const dashboardPath = path.join(__dirname, '../dashboard-ios-ORIGINAL-RESTORED.html');
    console.log('📊 Dashboard access granted:', req.user.email);
    
    // Log access
    auth.logAccess(req.user.userId, 'dashboard_access', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    
    // Verificar que el archivo existe
    const fs = require('fs');
    if (!fs.existsSync(dashboardPath)) {
        console.error('❌ Dashboard not found:', dashboardPath);
        return res.status(404).json({ 
            error: 'Dashboard no disponible',
            message: 'Contacte al administrador del sistema'
        });
    }
    
    res.sendFile(dashboardPath);
});

// Default route - redirigir a login
app.get('/', (req, res) => {
    console.log('🏠 Root requested, redirecting to login');
    res.redirect('/login');
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.status(200).json({ ok: true });
});

// API Auth endpoints con rate limiting
app.use('/api/auth', authLimiter);

// PROTEGER TODAS LAS RUTAS API
app.use('/api', requireAuth);

// API ENDPOINTS - COPIADOS DEL SISTEMA ORIGINAL
// GET /api/locations - Ubicaciones con coordenadas
app.get('/api/locations', async (req, res) => {
    try {
        const { grupo, estado, trimestre } = req.query;
        
        let whereClause = `WHERE latitud IS NOT NULL AND longitud IS NOT NULL`;
        const params = [];
        let paramIndex = 1;
        
        if (grupo) {
            whereClause += ` AND grupo_operativo_limpio = $\${paramIndex}`;
            params.push(grupo);
            paramIndex++;
        }
        
        if (estado) {
            whereClause += ` AND estado_normalizado = $\${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        if (trimestre) {
            whereClause += ` AND EXTRACT(QUARTER FROM fecha_supervision) = $\${paramIndex}`;
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
            \${whereClause}
            GROUP BY location_name, grupo_operativo_limpio, latitud, longitud, estado_normalizado, municipio
            ORDER BY performance DESC
        `;
        
        console.log('🗺️ Locations query with filters:', { grupo, estado, trimestre });
        const result = await pool.query(query, params);
        console.log(`📍 Found \${result.rows.length} locations`);
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
            \${whereClause}
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
            \${whereClause}
            GROUP BY grupo_operativo_limpio
            ORDER BY performance DESC
        `;
        
        const result = await pool.query(query, params);
        console.log(`📈 Groups data: \${result.rows.length} groups`);
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
            whereClause += ` AND grupo_operativo_limpio = $\${paramIndex}`;
            params.push(grupo);
            paramIndex++;
        }
        
        if (trimestre) {
            whereClause += ` AND EXTRACT(QUARTER FROM fecha_supervision) = $\${paramIndex}`;
            params.push(parseInt(trimestre));
            paramIndex++;
        }
        
        const query = `
            SELECT 
                area_evaluacion as area,
                ROUND(AVG(porcentaje), 2) as performance,
                COUNT(*) as evaluations
            FROM supervision_operativa_clean 
            \${whereClause}
            GROUP BY area_evaluacion
            ORDER BY performance ASC
            LIMIT 20
        `;
        
        const result = await pool.query(query, params);
        console.log(`🎯 Areas data: \${result.rows.length} areas`);
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
            \${whereClause}
            GROUP BY EXTRACT(QUARTER FROM fecha_supervision)
            ORDER BY quarter
        `;
        
        const result = await pool.query(query, params);
        console.log(`📈 Trends data: \${result.rows.length} quarters`);
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
        console.log(`🔍 Filter groups: \${result.rows.length} available`);
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
        console.log(`🔍 Filter states: \${result.rows.length} available`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching filter states:', error);
        res.status(500).json({ error: 'Error fetching states', details: error.message });
    }
});

// =====================================================
// TELEGRAM BOT HANDLERS - SISTEMA LIMPIO
// =====================================================

// 🔐 LOGIN COMMAND - Sistema de autenticación
bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const telegramData = {
        username: msg.from.username,
        first_name: msg.from.first_name,
        last_name: msg.from.last_name
    };

    try {
        console.log(`🔐 Login attempt from user: \${telegramId} (\${msg.from.first_name})`);

        // Verificar si ya está autorizado
        const user = await auth.verifyUser(telegramId);
        if (user) {
            const token = await auth.generateAccessToken(user);
            const dashboardUrl = process.env.RENDER_EXTERNAL_URL || 'https://pollo-loco-supervision.onrender.com';
            const authUrl = `\${dashboardUrl}/dashboard?token=\${token}`;
            
            // MENSAJE SIMPLE SIN KEYBOARDS CONFLICTIVOS
            await bot.sendMessage(chatId, 
                `✅ **Acceso autorizado - \${user.full_name}**\\n\\n` +
                `👔 **Posición:** \${user.position}\\n` +
                `🏢 **Grupo:** \${user.grupo_operativo}\\n\\n` +
                `🔑 **Token generado** (válido 24h)\\n` +
                `📊 **Dashboard:** Acceso completo autorizado\\n\\n` +
                `🔗 **Enlace de acceso:**\\n\${authUrl}\\n\\n` +
                `💡 **Tip:** Guarda este enlace para acceso rápido`,
                { parse_mode: 'Markdown' }
            );
            
            await auth.logAccess(user.id, 'login_success', {
                telegram_id: telegramId,
                telegram_username: telegramData.username
            });
            
            return;
        }

        // Proceso de vinculación para usuarios nuevos
        await bot.sendMessage(chatId, 
            `🔐 **Sistema de Autenticación El Pollo Loco CAS**\\n\\n` +
            `Para acceder al dashboard, necesitas vincular tu cuenta Telegram.\\n\\n` +
            `📧 **Envía tu email corporativo** registrado en el sistema:\\n` +
            `*Ejemplos:* \\n` +
            `• roberto@eplmexico.com\\n` +
            `• director@ogas.com.mx\\n` +
            `• gerente@tepeyac.com\\n\\n` +
            `⚠️ Solo emails pre-autorizados pueden acceder`,
            { parse_mode: 'Markdown' }
        );
        
        // Establecer estado de espera de email
        userStates[chatId] = { 
            state: 'awaiting_email', 
            telegram_id: telegramId,
            telegram_data: telegramData,
            timestamp: Date.now()
        };
        
    } catch (error) {
        console.error('❌ Error in login command:', error);
        await bot.sendMessage(chatId, 
            '❌ Error en el sistema de autenticación. Intenta más tarde.'
        );
    }
});

// 👤 WHOAMI COMMAND - Ver información del usuario
bot.onText(/\/whoami/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
        const user = await auth.verifyUser(telegramId);
        if (user) {
            const userInfo = await auth.getUserInfo(user.id);
            
            await bot.sendMessage(chatId, 
                `👤 **Información de Usuario**\\n\\n` +
                `📧 **Email:** \${user.email}\\n` +
                `👔 **Posición:** \${user.position}\\n` +
                `🏢 **Grupo Operativo:** \${user.grupo_operativo}\\n` +
                `📅 **Último acceso:** \${userInfo.last_access ? new Date(userInfo.last_access).toLocaleString('es-MX') : 'Nunca'}\\n` +
                `📊 **Total accesos:** \${userInfo.total_accesses || 0}\\n` +
                `🔑 **Tokens activos:** \${userInfo.active_tokens_count || 0}\\n\\n` +
                `✅ **Estado:** Autorizado - Acceso completo\\n` +
                `🎯 **Permisos:** Dashboard, Histórico, Exportar, Todos los grupos`,
                { parse_mode: 'Markdown' }
            );
        } else {
            await bot.sendMessage(chatId, 
                `❌ **No tienes acceso autorizado**\\n\\n` +
                `Usa /login para vincular tu cuenta corporativa`,
                { parse_mode: 'Markdown' }
            );
        }
    } catch (error) {
        console.error('❌ Error in whoami command:', error);
        await bot.sendMessage(chatId, '❌ Error obteniendo información del usuario');
    }
});

// 🔓 LOGOUT COMMAND - Cerrar sesión
bot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
        const user = await auth.verifyUser(telegramId);
        if (user) {
            await auth.revokeUserTokens(user.id);
            await auth.logAccess(user.id, 'logout', {
                telegram_id: telegramId,
                revoked_at: new Date().toISOString()
            });
            
            await bot.sendMessage(chatId,
                `🔓 **Sesión cerrada exitosamente**\\n\\n` +
                `Todos tus tokens han sido revocados.\\n` +
                `Usa /login para acceder nuevamente.`,
                { parse_mode: 'Markdown' }
            );
        } else {
            await bot.sendMessage(chatId, 
                '❌ No tienes sesión activa'
            );
        }
    } catch (error) {
        console.error('❌ Error in logout command:', error);
        await bot.sendMessage(chatId, '❌ Error cerrando sesión');
    }
});

// 📊 DASHBOARD COMMAND - Acceso rápido al dashboard
bot.onText(/\/dashboard/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        // Redirigir al comando login
        await bot.sendMessage(chatId,
            `📊 **Acceso al Dashboard**\\n\\n` +
            `Para acceder al dashboard, usa:\\n` +
            `/login - Autenticarse y obtener acceso`,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error('Error in dashboard command:', error);
        await bot.sendMessage(chatId, '❌ Error accediendo al dashboard. Usa /login');
    }
});

// Manejo de mensajes de email para vinculación
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text || '';
    const state = userStates[chatId];
    
    // Skip commands
    if (messageText.startsWith('/')) {
        return;
    }
    
    try {
        // Proceso de vinculación de email
        if (state && state.state === 'awaiting_email') {
            const email = messageText.trim().toLowerCase();
            
            // Validar formato de email
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!emailRegex.test(email)) {
                await bot.sendMessage(chatId, 
                    '❌ **Formato de email inválido**\\n\\n' +
                    'Envía un email válido, ej: usuario@dominio.com',
                    { parse_mode: 'Markdown' }
                );
                return;
            }
            
            // Verificar si el email está autorizado
            const authorizedUser = await auth.checkEmailAuthorized(email);
            if (authorizedUser) {
                // Vincular cuenta
                const linkedUser = await auth.linkTelegramAccount(
                    state.telegram_id, 
                    email, 
                    state.telegram_data
                );
                
                if (linkedUser) {
                    delete userStates[chatId];
                    
                    await bot.sendMessage(chatId, 
                        `✅ **Cuenta vinculada exitosamente**\\n\\n` +
                        `🎉 ¡Bienvenido \${linkedUser.full_name}!\\n` +
                        `👔 **Posición:** \${linkedUser.position}\\n` +
                        `🏢 **Grupo:** \${linkedUser.grupo_operativo}\\n\\n` +
                        `📊 **Tu cuenta tiene acceso completo al dashboard**\\n\\n` +
                        `Usa /login para obtener acceso`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    await bot.sendMessage(chatId, 
                        '❌ Error vinculando la cuenta. Intenta más tarde.'
                    );
                }
            } else {
                await bot.sendMessage(chatId, 
                    `❌ **Email no autorizado**\\n\\n` +
                    `El email *\${email}* no está en la lista de usuarios autorizados.\\n\\n` +
                    `📞 **Contacta al administrador del sistema** para solicitar acceso.`,
                    { parse_mode: 'Markdown' }
                );
                delete userStates[chatId];
            }
            return;
        }

        // Respuesta por defecto para mensajes no relacionados con autenticación
        await bot.sendMessage(chatId, 
            `🍗 **El Pollo Loco CAS Dashboard**\\n\\n` +
            `Sistema de supervisión operativa seguro\\n\\n` +
            `🔐 Usa /login para acceder\\n` +
            `👤 Usa /whoami para ver tu información\\n` +
            `📊 Usa /dashboard para ir al panel`
        );
        
    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, 'Error procesando tu solicitud.');
    }
});

// Start command - Bienvenida con sistema de autenticación
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    
    try {
        // Limpiar cualquier keyboard persistente
        await bot.sendMessage(chatId, "🧹 Preparando sistema...", {
            reply_markup: { remove_keyboard: true }
        });
        
        // Verificar si el usuario ya está autorizado
        const user = await auth.verifyUser(telegramId);
        
        setTimeout(async () => {
            if (user) {
                // Usuario autorizado - mensaje de bienvenida personalizado
                const welcomeMessage = 
                    `🍗 **¡Bienvenido de vuelta, \${user.full_name}!**\\n\\n` +
                    `✅ **Tu cuenta está vinculada y autorizada**\\n` +
                    `👔 **Posición:** \${user.position}\\n` +
                    `🏢 **Grupo:** \${user.grupo_operativo}\\n\\n` +
                    `📊 **Dashboard El Pollo Loco CAS:**\\n` +
                    `• Mapas interactivos (79 sucursales)\\n` +
                    `• Análisis de 135 supervisiones\\n` +
                    `• KPIs y métricas en tiempo real\\n` +
                    `• Histórico con tendencias\\n\\n` +
                    `🔐 **Comandos disponibles:**\\n` +
                    `/login - Obtener acceso al dashboard\\n` +
                    `/whoami - Ver tu información\\n` +
                    `/logout - Cerrar sesión`;
                    
                await bot.sendMessage(chatId, welcomeMessage, { 
                    parse_mode: 'Markdown',
                    reply_markup: { remove_keyboard: true }
                });
            } else {
                // Usuario no autorizado - proceso de registro
                const welcomeMessage = 
                    `🍗 **¡Bienvenido al Sistema El Pollo Loco CAS!**\\n\\n` +
                    `🔐 **Sistema de Supervisión Operativa Seguro**\\n\\n` +
                    `📊 **Accede al Dashboard para ver:**\\n` +
                    `• Mapas interactivos con 79 sucursales\\n` +
                    `• Gráficos de performance en tiempo real\\n` +
                    `• Análisis de 135 supervisiones\\n` +
                    `• KPIs y métricas operativas\\n\\n` +
                    `⚠️ **Acceso restringido a personal autorizado**\\n\\n` +
                    `🔑 **Para acceder:**\\n` +
                    `/login - Vincular tu cuenta corporativa\\n\\n` +
                    `📧 **Nota:** Solo emails pre-autorizados del sistema`;
                    
                await bot.sendMessage(chatId, welcomeMessage, { 
                    parse_mode: 'Markdown',
                    reply_markup: { remove_keyboard: true }
                });
            }
        }, 500);
        
    } catch (error) {
        console.error('Error in start command:', error);
        await bot.sendMessage(chatId, 
            '🍗 ¡Bienvenido al Sistema El Pollo Loco CAS!\\n\\n' +
            'Usa /login para acceder al dashboard seguro.'
        );
    }
});

// =====================================================
// START EXPRESS SERVER
// =====================================================

// Cleanup expired tokens every hour
setInterval(async () => {
    try {
        const cleaned = await auth.cleanupExpiredTokens();
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up \${cleaned} expired tokens`);
        }
    } catch (error) {
        console.error('Error cleaning up tokens:', error);
    }
}, 60 * 60 * 1000); // 1 hour

app.listen(port, () => {
    console.log(`🚀 El Pollo Loco CAS Server running on port \${port}`);
    console.log(`📊 Dashboard: \${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + port}/dashboard`);
    console.log(`🔐 Login: \${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + port}/login`);
    console.log(`🔍 Health: \${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + port}/health`);
    console.log(`🤖 Telegram webhook configured`);
    console.log(`💾 Database: \${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
    console.log(`👥 Authorized users: 22 (3 CAS Team + 19 Directors)`);
    console.log(`🔑 Authentication: JWT tokens with 24h expiry`);
    console.log(`📋 Features: Secure login, Dashboard protection, Audit logs`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\\n🔴 Shutting down server...');
    await pool.end();
    process.exit(0);
});

module.exports = app;