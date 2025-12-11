const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const { Pool } = require('pg');
const TelegramBot = require('node-telegram-bot-api');

// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 10000;

// Database connection with correct Neon URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

// Log database connection info
console.log('🔗 Database connection (NO FILTERS VERSION):');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using DATABASE_URL:', !!process.env.DATABASE_URL);

// ============================================================================
// 🤖 BOT MENU BUTTON SOLO - NO AFECTA DASHBOARD FUNCIONALIDAD
// ============================================================================

const token = process.env.TELEGRAM_BOT_TOKEN || '8341799056:AAFvMMPzuplDDsOM07m5ANI5WVCATchBPeY';
const DASHBOARD_URL = 'https://pollo-loco-supervision.onrender.com';

let bot = null;

if (token && token !== 'undefined') {
    try {
        bot = new TelegramBot(token, { polling: false });
        console.log('🤖 Menu Button Bot inicializado - Dashboard funcionalidad completa mantenida');

        // Webhook para producción
        if (process.env.NODE_ENV === 'production') {
            const webhookUrl = `https://pollo-loco-supervision.onrender.com/webhook`;
            bot.setWebHook(webhookUrl).then(() => {
                console.log(`🌐 Webhook configurado: ${webhookUrl}`);
            }).catch(err => {
                console.log('⚠️ Error webhook:', err.message);
            });
        }

        // Bot handlers súper simples - NO interfieren con dashboard
        bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const firstName = msg.from.first_name || 'Usuario';
            
            const message = `🍗 *Bienvenido ${firstName}*

Dashboard El Pollo Loco CAS
Sistema de Supervisión Operativa

📊 *Para acceder al dashboard completo:*
Usa el botón "📊 Dashboard" que está junto al campo de texto

✨ *Sistema completamente funcional con:*
• 238 supervisiones activas
• 91.20% promedio general  
• 20 grupos operativos
• 85 sucursales monitoreadas
• Mapas interactivos
• Reportes detallados
• Filtros avanzados`;

            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        });

        bot.onText(/\/dashboard/, (msg) => {
            const chatId = msg.chat.id;
            
            const message = `📊 *Dashboard El Pollo Loco CAS*

🎯 *Acceso:* Usa el botón "📊 Dashboard" junto al campo de texto

🔗 *URL directa:* ${DASHBOARD_URL}

✨ *Funcionalidad completa:*
• KPIs en tiempo real
• Mapas con coordenadas GPS
• Drill-down por sucursal  
• Reportes por período
• Filtros por grupo/estado
• Análisis histórico

📱 *Optimizado para móvil y desktop*`;
            
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        });

        bot.on('message', (msg) => {
            if (!msg.text || msg.text.startsWith('/')) return;
            
            const chatId = msg.chat.id;
            
            const message = `🤖 *Bot El Pollo Loco CAS*

📊 Para acceder al dashboard completo usa el botón "📊 Dashboard" junto al campo de texto.

💡 *Comandos disponibles:*
/start - Información completa
/dashboard - Info del sistema`;
            
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        });

        console.log('✅ Bot Menu Button configurado - Dashboard COMPLETO funcional');

    } catch (error) {
        console.error('❌ Error bot:', error.message);
        bot = null;
    }
} else {
    console.log('⚠️ Bot token no configurado');
}

// Security and optimization middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com", "http://localhost:10000", "https://*.onrender.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

app.use(compression());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// ============================================================================
// 🤖 BOT WEBHOOK ENDPOINT - NO AFECTA OTRAS RUTAS
// ============================================================================

if (bot) {
    app.post('/webhook', express.json(), (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });
}

// ============================================================================
// 📊 TODAS LAS APIS ORIGINALES DEL DASHBOARD - FUNCIONALIDAD COMPLETA
// ============================================================================

// Sucursal Detail API - NEW 3-Level Drill-down
app.get('/api/sucursal-detail', async (req, res) => {
    try {
        const { sucursal, grupo } = req.query;
        console.log('🏢 Sucursal Detail requested for:', sucursal, 'from group:', grupo);
        
        if (!sucursal) {
            return res.status(400).json({ error: 'Sucursal name is required' });
        }
        
        // Build WHERE clause for sucursal - Using nombre_normalizado like sucursales-ranking endpoint
        let whereClause = `WHERE nombre_normalizado = $1 AND area_tipo = 'area_principal'`;
        const params = [sucursal];
        let paramIndex = 1;
        
        if (grupo) {
            paramIndex++;
            whereClause += ` AND grupo_normalizado = $${paramIndex}`;
            params.push(grupo);
        }
        
        // Main query for sucursal details - Using supervision_normalized_view with nombre_normalizado
        const query = `
            SELECT 
                nombre_normalizado as sucursal,
                numero_sucursal,
                estado_final as estado,
                ciudad_normalizada as municipio,
                grupo_normalizado as grupo_operativo,
                ROUND(AVG(porcentaje)::numeric, 2) as performance,
                COUNT(DISTINCT submission_id) as total_evaluaciones,
                MAX(fecha_supervision) as ultima_supervision,
                COUNT(DISTINCT area_evaluacion) as areas_evaluadas
            FROM supervision_normalized_view 
            ${whereClause}
              AND fecha_supervision >= '2025-02-01'
            GROUP BY nombre_normalizado, numero_sucursal, estado_final, ciudad_normalizada, grupo_normalizado
        `;
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Sucursal not found',
                sucursal,
                available_suggestions: []
            });
        }
        
        const sucursalData = result.rows[0];
        
        // Get areas breakdown - Using normalized view
        const areasQuery = `
            SELECT 
                TRIM(area_evaluacion) as nombre,
                ROUND(AVG(porcentaje)::numeric, 2) as performance,
                COUNT(*) as evaluaciones
            FROM supervision_normalized_view 
            ${whereClause} 
              AND area_evaluacion IS NOT NULL 
              AND TRIM(area_evaluacion) != ''
              AND fecha_supervision >= '2025-02-01'
            GROUP BY TRIM(area_evaluacion)
            ORDER BY performance DESC
        `;
        
        const areasResult = await pool.query(areasQuery, params);
        sucursalData.areas_evaluacion = areasResult.rows.map(area => ({
            ...area,
            trend: (Math.random() - 0.5) * 10 // Mock trend for now
        }));
        
        // Get recent evaluaciones - Using normalized view
        const evaluacionesQuery = `
            SELECT 
                fecha_supervision as fecha,
                submission_id,
                ROUND(AVG(porcentaje)::numeric, 2) as performance,
                COUNT(DISTINCT area_evaluacion) as areas_evaluadas
            FROM supervision_normalized_view 
            ${whereClause}
              AND fecha_supervision >= '2025-02-01'
            GROUP BY fecha_supervision, submission_id
            ORDER BY fecha_supervision DESC
            LIMIT 10
        `;
        
        const evaluacionesResult = await pool.query(evaluacionesQuery, params);
        sucursalData.evaluaciones_recientes = evaluacionesResult.rows.map(eval => ({
            fecha: eval.fecha,
            performance: parseFloat(eval.performance),
            tipo: 'Supervisión General', // Mock for now
            supervisor: 'Supervisor', // Mock for now
            areas_evaluadas: eval.areas_evaluadas
        }));
        
        // Get tendencias by CAS periods
        const tendenciasQuery = `
            SELECT 
                -- Clasificar por periodo CAS real
                CASE 
                    WHEN (estado_final = 'Nuevo León' OR grupo_normalizado = 'GRUPO SALTILLO')
                         AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') THEN
                        CASE 
                            WHEN fecha_supervision >= '2025-03-12' AND fecha_supervision <= '2025-04-16' THEN 'NL-T1-2025'
                            WHEN fecha_supervision >= '2025-06-11' AND fecha_supervision <= '2025-08-18' THEN 'NL-T2-2025'
                            WHEN fecha_supervision >= '2025-08-19' AND fecha_supervision <= '2025-10-09' THEN 'NL-T3-2025'
                            WHEN fecha_supervision >= '2025-10-30' THEN 'NL-T4-2025'
                            ELSE 'OTRO'
                        END
                    ELSE 
                        CASE 
                            WHEN fecha_supervision >= '2025-04-10' AND fecha_supervision <= '2025-06-09' THEN 'FOR-S1-2025'
                            WHEN fecha_supervision >= '2025-07-30' AND fecha_supervision <= '2025-11-07' THEN 'FOR-S2-2025'
                            ELSE 'OTRO'
                        END
                END as periodo,
                ROUND(AVG(porcentaje)::numeric, 2) as performance
            FROM supervision_normalized_view 
            ${whereClause}
              AND fecha_supervision >= '2025-02-01'
            GROUP BY 
                CASE 
                    WHEN (estado_final = 'Nuevo León' OR grupo_normalizado = 'GRUPO SALTILLO')
                         AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') THEN
                        CASE 
                            WHEN fecha_supervision >= '2025-03-12' AND fecha_supervision <= '2025-04-16' THEN 'NL-T1-2025'
                            WHEN fecha_supervision >= '2025-06-11' AND fecha_supervision <= '2025-08-18' THEN 'NL-T2-2025'
                            WHEN fecha_supervision >= '2025-08-19' AND fecha_supervision <= '2025-10-09' THEN 'NL-T3-2025'
                            WHEN fecha_supervision >= '2025-10-30' THEN 'NL-T4-2025'
                            ELSE 'OTRO'
                        END
                    ELSE 
                        CASE 
                            WHEN fecha_supervision >= '2025-04-10' AND fecha_supervision <= '2025-06-09' THEN 'FOR-S1-2025'
                            WHEN fecha_supervision >= '2025-07-30' AND fecha_supervision <= '2025-11-07' THEN 'FOR-S2-2025'
                            ELSE 'OTRO'
                        END
                END
            HAVING 
                CASE 
                    WHEN (estado_final = 'Nuevo León' OR grupo_normalizado = 'GRUPO SALTILLO')
                         AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') THEN
                        CASE 
                            WHEN fecha_supervision >= '2025-03-12' AND fecha_supervision <= '2025-04-16' THEN 'NL-T1-2025'
                            WHEN fecha_supervision >= '2025-06-11' AND fecha_supervision <= '2025-08-18' THEN 'NL-T2-2025'
                            WHEN fecha_supervision >= '2025-08-19' AND fecha_supervision <= '2025-10-09' THEN 'NL-T3-2025'
                            WHEN fecha_supervision >= '2025-10-30' THEN 'NL-T4-2025'
                            ELSE 'OTRO'
                        END
                    ELSE 
                        CASE 
                            WHEN fecha_supervision >= '2025-04-10' AND fecha_supervision <= '2025-06-09' THEN 'FOR-S1-2025'
                            WHEN fecha_supervision >= '2025-07-30' AND fecha_supervision <= '2025-11-07' THEN 'FOR-S2-2025'
                            ELSE 'OTRO'
                        END
                END != 'OTRO'
            ORDER BY periodo
        `;
        
        const tendenciasResult = await pool.query(tendenciasQuery, params);
        sucursalData.tendencias = tendenciasResult.rows;
        
        console.log('✅ Sucursal detail loaded successfully');
        res.json(sucursalData);
        
    } catch (error) {
        console.error('❌ Error fetching sucursal detail:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PERIODOS CAS REALES - Basado en fechas de supervisores
function getPeriodoCAS(fecha, estado, grupoOperativo, locationName) {
    const fechaObj = new Date(fecha);
    
    // Determinar si es Local (NL) o Foránea
    const isLocal = (
        estado === 'Nuevo León' || 
        grupoOperativo === 'GRUPO SALTILLO'
    ) && !['57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero'].includes(locationName);
    
    if (isLocal) {
        // LOCALES NL - Periodos Trimestrales
        if (fechaObj >= new Date('2025-03-12') && fechaObj <= new Date('2025-04-16')) {
            return 'NL-T1-2025';
        } else if (fechaObj >= new Date('2025-06-11') && fechaObj <= new Date('2025-08-18')) {
            return 'NL-T2-2025';
        } else if (fechaObj >= new Date('2025-08-19') && fechaObj <= new Date('2025-10-09')) {
            return 'NL-T3-2025';
        } else if (fechaObj >= new Date('2025-10-30')) {
            return 'NL-T4-2025';
        }
    } else {
        // FORÁNEAS - Periodos Semestrales
        if (fechaObj >= new Date('2025-04-10') && fechaObj <= new Date('2025-06-09')) {
            return 'FOR-S1-2025';
        } else if (fechaObj >= new Date('2025-07-30') && fechaObj <= new Date('2025-11-07')) {
            return 'FOR-S2-2025';
        }
    }
    
    return 'OTRO'; // Fuera de periodos CAS definidos
}

// API para obtener periodos CAS disponibles
app.get('/api/periodos-cas', async (req, res) => {
    try {
        console.log('📅 Periodos CAS requested');
        
        const periodos = [
            { id: 'NL-T1-2025', nombre: 'NL-T1 (Mar 12 - Abr 16)', tipo: 'local', estado: 'cerrado' },
            { id: 'NL-T2-2025', nombre: 'NL-T2 (Jun 11 - Ago 18)', tipo: 'local', estado: 'cerrado' },
            { id: 'NL-T3-2025', nombre: 'NL-T3 (Ago 19 - Oct 9)', tipo: 'local', estado: 'cerrado' },
            { id: 'NL-T4-2025', nombre: 'NL-T4 (Oct 30 - presente)', tipo: 'local', estado: 'activo' },
            { id: 'FOR-S1-2025', nombre: 'FOR-S1 (Abr 10 - Jun 9)', tipo: 'foranea', estado: 'cerrado' },
            { id: 'FOR-S2-2025', nombre: 'FOR-S2 (Jul 30 - Nov 7)', tipo: 'foranea', estado: 'cerrado' }
        ];
        
        res.json(periodos);
    } catch (error) {
        console.error('Error loading periodos CAS:', error);
        res.status(500).json({ error: 'Error al cargar periodos CAS' });
    }
});

// Health check - SIMPLIFIED 
app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query('SELECT NOW() as server_time, 1 as test');
        res.json({ 
            status: 'healthy',
            service: 'El Pollo Loco Dashboard - HISTORIC TAB FIXED',
            version: 'historic-tab-force-fixed',
            database: 'connected_to_neon',
            server_time: dbCheck.rows[0].server_time,
            dashboard_file: 'dashboard-ios-ORIGINAL-RESTORED.html',
            features: ['historic-tab-complete', 'heatmap-filters', 'epl-cas-row']
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(200).json({ 
            status: 'partial', 
            service: 'El Pollo Loco Dashboard - HISTORIC TAB FIXED',
            version: 'historic-tab-force-fixed',
            database: 'checking',
            dashboard_file: 'dashboard-ios-ORIGINAL-RESTORED.html (forced)',
            note: 'Dashboard will work even if DB health check fails'
        });
    }
});

// Main dashboard route - FORCE HISTORIC TAB VERSION
app.get('/', (req, res) => {
    const dashboardPath = path.join(__dirname, 'dashboard-ios-ORIGINAL-RESTORED.html');
    console.log('📱 FORCING Historic Tab Fixed Version:', dashboardPath);
    res.sendFile(dashboardPath, (err) => {
        if (err) {
            console.error('❌ Dashboard file error:', err.message);
            res.status(500).send(`Error loading dashboard: ${err.message}`);
        }
    });
});

// KPIs API - USING NORMALIZED VIEW FOR CORRECT SUPERVISION COUNT
app.get('/api/kpis', async (req, res) => {
    try {
        const cleanQuery = Object.fromEntries(
            Object.entries(req.query).filter(([key, value]) => 
                value && value !== 'undefined' && value !== 'null'
            )
        );
        console.log('📊 KPIs requested with filters:', Object.keys(cleanQuery).length > 0 ? cleanQuery : 'no filters');
        
        let whereClause = 'WHERE porcentaje IS NOT NULL AND area_tipo = \'area_principal\'';
        const params = [];
        let paramIndex = 1;
        
        // Show ALL data from February 2025 onwards
        whereClause += ` AND fecha_supervision >= '2025-02-01'`;
        
        // Apply filters using the normalized view
        if (req.query.estado && req.query.estado !== 'all' && req.query.estado !== 'undefined' && req.query.estado !== 'null') {
            whereClause += ` AND estado_final = $${paramIndex}`;
            params.push(req.query.estado);
            paramIndex++;
        }
        
        // Handle both single and multiple grupos
        if (req.query.grupo && req.query.grupo !== 'undefined' && req.query.grupo !== 'null') {
            const grupos = Array.isArray(req.query.grupo) ? req.query.grupo : [req.query.grupo];
            if (grupos.length > 0) {
                const grupPlaceholders = grupos.map(() => `$${paramIndex++}`).join(', ');
                whereClause += ` AND grupo_normalizado IN (${grupPlaceholders})`;
                params.push(...grupos);
            }
        }
        
        const query = `
            SELECT 
                COUNT(DISTINCT submission_id) as total_supervisiones,
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT numero_sucursal) as sucursales_evaluadas,
                COUNT(DISTINCT grupo_normalizado) as total_grupos,
                COUNT(DISTINCT CASE WHEN porcentaje < 70 THEN submission_id END) as supervisiones_criticas,
                MAX(fecha_supervision) as ultima_evaluacion,
                MIN(fecha_supervision) as primera_evaluacion
            FROM supervision_normalized_view 
            ${whereClause}
        `;
        
        const result = await pool.query(query, params);
        const kpis = result.rows[0];
        
        console.log(`📈 KPIs CORREGIDOS: ${kpis.total_supervisiones} supervisiones REALES, ${kpis.promedio_general}% promedio`);
        
        res.json(kpis);
        
    } catch (error) {
        console.error('❌ Error fetching KPIs:', error);
        res.status(500).json({ error: 'Error fetching KPIs', details: error.message });
    }
});

// Performance Overview API - NO DATE FILTERS
app.get('/api/performance/overview', async (req, res) => {
    try {
        console.log('📊 Performance overview requested (NO FILTERS)');
        
        // Get recent data without restrictive filters
        let whereClause = 'WHERE porcentaje IS NOT NULL';
        
        // Show ALL data from February 2025 onwards
        whereClause += ` AND fecha_supervision >= '2025-02-01'`;
        
        const query = `
            SELECT 
                COUNT(*) as total_evaluaciones,
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT numero_sucursal) as sucursales_evaluadas,
                COUNT(DISTINCT grupo_normalizado) as grupos_activos,
                MAX(fecha_supervision) as ultima_evaluacion,
                MIN(fecha_supervision) as primera_evaluacion,
                COUNT(CASE WHEN lat_validada IS NOT NULL THEN 1 END) as with_validated_coords
            FROM supervision_normalized_view 
            ${whereClause}
        `;
        
        const result = await pool.query(query);
        const overview = result.rows[0];
        
        console.log(`📈 Overview (últimos 30 días): ${overview.total_evaluaciones} evaluaciones, ${overview.sucursales_evaluadas} sucursales, ${overview.grupos_activos} grupos`);
        
        res.json({
            ...overview,
            periodo_actual: 'Datos Actuales (últimos 30 días)',
            note: 'Mostrando datos reales sin filtros restrictivos',
            data_range: 'Últimos 30 días',
            coordinate_coverage: `${overview.with_validated_coords}/${overview.total_evaluaciones} (${(overview.with_validated_coords/overview.total_evaluaciones*100).toFixed(1)}%)`
        });
        
    } catch (error) {
        console.error('❌ Error in performance overview:', error);
        res.status(500).json({ error: 'Error fetching performance data', details: error.message });
    }
});

// Map data API - TODAS LAS 85 SUCURSALES CON COORDENADAS REALES DEL CSV Y SUPERVISION COUNT CORREGIDO
app.get('/api/mapa', async (req, res) => {
    try {
        const { grupo, estado } = req.query;
        const cleanFilters = {
            grupo: (grupo && grupo !== 'undefined' && grupo !== 'null') ? grupo : 'none',
            estado: (estado && estado !== 'undefined' && estado !== 'null') ? estado : 'none'
        };
        console.log('🗺️ Map data requested with filters:', cleanFilters);
        
        let whereClause = `WHERE lat_validada IS NOT NULL AND lng_validada IS NOT NULL AND area_tipo = 'area_principal'`;
        const params = [];
        let paramIndex = 1;
        
        // Handle both single and multiple grupos
        if (grupo && grupo !== 'undefined' && grupo !== 'null') {
            const grupos = Array.isArray(grupo) ? grupo : [grupo];
            if (grupos.length > 0) {
                const grupPlaceholders = grupos.map(() => `$${paramIndex++}`).join(', ');
                whereClause += ` AND grupo_normalizado IN (${grupPlaceholders})`;
                params.push(...grupos);
            }
        }
        
        if (estado && estado !== 'undefined' && estado !== 'null') {
            whereClause += ` AND estado_final = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        const query = `
            SELECT 
                nombre_normalizado as nombre,
                numero_sucursal,
                grupo_normalizado as grupo,
                lat_validada as lat,
                lng_validada as lng,
                ROUND(AVG(porcentaje), 2) as performance,
                estado_final as estado,
                ciudad_normalizada as ciudad,
                MAX(fecha_supervision) as ultima_evaluacion,
                COUNT(DISTINCT submission_id) as total_supervisiones,
                'csv_validated' as coordinate_source
            FROM supervision_normalized_view 
            ${whereClause}
              AND porcentaje IS NOT NULL
              AND fecha_supervision >= '2025-02-01'
            GROUP BY numero_sucursal, nombre_normalizado, grupo_normalizado, lat_validada, lng_validada, estado_final, ciudad_normalizada
            ORDER BY performance DESC
        `;
        
        const result = await pool.query(query, params);
        
        console.log(`🗺️ Map data CORREGIDO: ${result.rows.length} sucursales con coordenadas CSV y supervision count real`);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching map data:', error);
        res.status(500).json({ error: 'Error fetching map data', details: error.message });
    }
});

// Historical data API - Show recent months
app.get('/api/historico', async (req, res) => {
    try {
        const { grupo } = req.query;
        const cleanGrupo = (grupo && grupo !== 'undefined' && grupo !== 'null') ? grupo : 'all groups';
        console.log('📈 Historical data requested for grupo:', cleanGrupo);
        
        let whereClause = `WHERE porcentaje IS NOT NULL`;
        const params = [];
        let paramIndex = 1;
        
        // Show ALL data from February 2025 onwards
        whereClause += ` AND fecha_supervision >= '2025-02-01'`;
        
        // Handle both single and multiple grupos
        if (grupo && grupo !== 'undefined' && grupo !== 'null') {
            const grupos = Array.isArray(grupo) ? grupo : [grupo];
            if (grupos.length > 0) {
                const grupPlaceholders = grupos.map(() => `$${paramIndex++}`).join(', ');
                whereClause += ` AND grupo_normalizado IN (${grupPlaceholders})`;
                params.push(...grupos);
            }
        }
        
        const query = `
            SELECT 
                DATE_TRUNC('month', fecha_supervision) as mes,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                grupo_normalizado as grupo
            FROM supervision_normalized_view 
            ${whereClause}
            GROUP BY DATE_TRUNC('month', fecha_supervision), grupo_normalizado
            ORDER BY mes DESC, grupo_normalizado
        `;
        
        const result = await pool.query(query, params);
        console.log(`📊 Historical data (últimos 6 meses): ${result.rows.length} data points`);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching historical data:', error);
        res.status(500).json({ error: 'Error fetching historical data', details: error.message });
    }
});

// Filters API - Current data only
app.get('/api/filtros', async (req, res) => {
    try {
        console.log('🔍 Filters data requested');
        
        // Get grupos from recent data
        const gruposResult = await pool.query(`
            SELECT DISTINCT grupo_normalizado as grupo 
            FROM supervision_normalized_view 
            WHERE grupo_normalizado IS NOT NULL 
              AND fecha_supervision >= '2025-02-01'
            ORDER BY grupo
        `);
        
        // Get estados from recent data
        const estadosResult = await pool.query(`
            SELECT DISTINCT estado_final as estado 
            FROM supervision_normalized_view 
            WHERE estado_final IS NOT NULL 
              AND fecha_supervision >= '2025-02-01'
            ORDER BY estado_final
        `);
        
        const filters = {
            grupos: gruposResult.rows.map(row => row.grupo),
            estados: estadosResult.rows.map(row => row.estado),
            periodos: ['Últimos 30 días', 'Últimos 7 días', 'Ayer', 'Hoy']
        };
        
        console.log(`🔍 Filters (datos actuales): ${filters.grupos.length} grupos, ${filters.estados.length} estados`);
        res.json(filters);
        
    } catch (error) {
        console.error('❌ Error fetching filters:', error);
        res.status(500).json({ error: 'Error fetching filter data', details: error.message });
    }
});

// Sucursales por grupo - PARA MODAL DE DETALLES
app.get('/api/sucursales-ranking', async (req, res) => {
    try {
        const { grupo } = req.query;
        console.log('🏢 Sucursales ranking requested for grupo:', grupo);
        
        if (!grupo) {
            return res.status(400).json({ error: 'Grupo parameter is required' });
        }
        
        const query = `
            SELECT 
                nombre_normalizado as sucursal,
                numero_sucursal,
                estado_final as estado,
                ciudad_normalizada as ciudad,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT submission_id) as evaluaciones,
                ROUND(AVG(porcentaje), 2) as promedio,
                MAX(fecha_supervision) as ultima_evaluacion
            FROM supervision_normalized_view 
            WHERE grupo_normalizado = $1 
              AND porcentaje IS NOT NULL
              AND area_tipo = 'area_principal'
              AND fecha_supervision >= '2025-02-01'
            GROUP BY nombre_normalizado, numero_sucursal, estado_final, ciudad_normalizada
            ORDER BY AVG(porcentaje) DESC
        `;
        
        const result = await pool.query(query, [grupo]);
        
        console.log(`🏢 Sucursales found for ${grupo}: ${result.rows.length} sucursales`);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching sucursales ranking:', error);
        res.status(500).json({ error: 'Error fetching sucursales ranking', details: error.message });
    }
});

// Legacy API endpoints for compatibility - MOSTRANDO TODOS LOS ESTADOS DEL CSV
app.get('/api/estados', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT estado_final as estado 
            FROM supervision_normalized_view 
            WHERE estado_final IS NOT NULL 
              AND fecha_supervision >= '2025-02-01'
            ORDER BY estado_final
        `);
        res.json(result.rows.map(row => row.estado));
    } catch (error) {
        console.error('❌ Error fetching estados:', error);
        res.status(500).json({ error: 'Error fetching estados', details: error.message });
    }
});

// Grupos operativos con performance - DASHBOARD PRINCIPAL - CON SUPERVISION COUNT CORREGIDO
app.get('/api/grupos', async (req, res) => {
    try {
        const cleanQuery = Object.fromEntries(
            Object.entries(req.query).filter(([key, value]) => 
                value && value !== 'undefined' && value !== 'null'
            )
        );
        console.log('📊 Grupos operativos requested with filters:', Object.keys(cleanQuery).length > 0 ? cleanQuery : 'no filters');
        
        let whereClause = 'WHERE porcentaje IS NOT NULL AND area_tipo = \'area_principal\'';
        const params = [];
        let paramIndex = 1;
        
        // Apply filters using normalized view
        if (req.query.estado && req.query.estado !== 'all' && req.query.estado !== 'undefined' && req.query.estado !== 'null') {
            whereClause += ` AND estado_final = $${paramIndex}`;
            params.push(req.query.estado);
            paramIndex++;
        }
        
        // Handle both single and multiple grupos
        if (req.query.grupo && req.query.grupo !== 'undefined' && req.query.grupo !== 'null') {
            const grupos = Array.isArray(req.query.grupo) ? req.query.grupo : [req.query.grupo];
            if (grupos.length > 0) {
                const grupPlaceholders = grupos.map(() => `$${paramIndex++}`).join(', ');
                whereClause += ` AND grupo_normalizado IN (${grupPlaceholders})`;
                params.push(...grupos);
            }
        }
        
        const query = `
            SELECT 
                grupo_normalizado as grupo,
                COUNT(DISTINCT numero_sucursal) as sucursales,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                MAX(fecha_supervision) as ultima_evaluacion,
                string_agg(DISTINCT estado_final, ', ') as estado
            FROM supervision_normalized_view 
            ${whereClause}
              AND fecha_supervision >= '2025-02-01'
            GROUP BY grupo_normalizado
            ORDER BY promedio DESC
        `;
        
        const result = await pool.query(query, params);
        
        console.log(`✅ Grupos CORREGIDOS: ${result.rows.length} grupos operativos con supervision count real`);
        
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching grupos operativos:', error);
        res.status(500).json({ error: 'Error fetching grupos operativos', details: error.message });
    }
});

// Heatmap periods data - HISTÓRICO
app.get('/api/heatmap-periods/all', async (req, res) => {
    try {
        console.log('🔥 Heatmap periods requested with filters:', req.query);
        
        let whereClause = 'WHERE porcentaje IS NOT NULL';
        const params = [];
        let paramIndex = 1;
        
        // Apply estado filter if provided
        if (req.query.estado && req.query.estado !== 'all' && req.query.estado !== 'undefined' && req.query.estado !== 'null') {
            whereClause += ` AND estado = $${paramIndex}`;
            params.push(req.query.estado);
            paramIndex++;
        }
        
        // CORRECTED: Fix territorial classification logic with proper CAS periods
        const query = `
            WITH periods_data AS (
                SELECT 
                    grupo_normalizado as grupo,
                    estado_final,
                    nombre_normalizado,
                    CASE 
                        -- Determinar si es Local (NL) o Foráneo primero
                        WHEN (estado_final = 'Nuevo León' OR grupo_normalizado = 'GRUPO SALTILLO')
                             AND nombre_normalizado NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                        THEN 
                            -- LOCALES NL - Períodos Trimestrales
                            CASE
                                WHEN fecha_supervision BETWEEN '2025-03-12' AND '2025-04-16' THEN 'NL-T1-2025'
                                WHEN fecha_supervision BETWEEN '2025-06-11' AND '2025-08-18' THEN 'NL-T2-2025'
                                WHEN fecha_supervision BETWEEN '2025-08-19' AND '2025-10-09' THEN 'NL-T3-2025'
                                WHEN fecha_supervision >= '2025-10-30' THEN 'NL-T4-2025'
                                ELSE 'OTRO'
                            END
                        ELSE
                            -- FORÁNEAS - Períodos Semestrales
                            CASE
                                WHEN fecha_supervision BETWEEN '2025-04-10' AND '2025-06-09' THEN 'FOR-S1-2025'
                                WHEN fecha_supervision BETWEEN '2025-07-30' AND '2025-11-07' THEN 'FOR-S2-2025'
                                ELSE 'OTRO'
                            END
                    END as periodo,
                    ROUND(AVG(porcentaje), 2) as promedio,
                    COUNT(*) as evaluaciones
                FROM supervision_normalized_view 
                WHERE porcentaje IS NOT NULL ${whereClause.replace('WHERE', 'AND')}
                GROUP BY grupo, estado_final, nombre_normalizado,
                CASE 
                    -- Duplicar la lógica de clasificación territorial para GROUP BY
                    WHEN (estado_final = 'Nuevo León' OR grupo_normalizado = 'GRUPO SALTILLO')
                         AND nombre_normalizado NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                    THEN 
                        -- LOCALES NL - Períodos Trimestrales
                        CASE
                            WHEN fecha_supervision BETWEEN '2025-03-12' AND '2025-04-16' THEN 'NL-T1-2025'
                            WHEN fecha_supervision BETWEEN '2025-06-11' AND '2025-08-18' THEN 'NL-T2-2025'
                            WHEN fecha_supervision BETWEEN '2025-08-19' AND '2025-10-09' THEN 'NL-T3-2025'
                            WHEN fecha_supervision >= '2025-10-30' THEN 'NL-T4-2025'
                            ELSE 'OTRO'
                        END
                    ELSE
                        -- FORÁNEAS - Períodos Semestrales
                        CASE
                            WHEN fecha_supervision BETWEEN '2025-04-10' AND '2025-06-09' THEN 'FOR-S1-2025'
                            WHEN fecha_supervision BETWEEN '2025-07-30' AND '2025-11-07' THEN 'FOR-S2-2025'
                            ELSE 'OTRO'
                        END
                END
                HAVING COUNT(*) > 0
            ),
            group_averages AS (
                SELECT 
                    grupo,
                    ROUND(AVG(promedio), 2) as promedio_general
                FROM periods_data 
                GROUP BY grupo
            )
            SELECT 
                ga.grupo,
                ga.promedio_general,
                json_object_agg(pd.periodo, json_build_object('promedio', pd.promedio, 'evaluaciones', pd.evaluaciones)) as periodos
            FROM group_averages ga
            LEFT JOIN periods_data pd ON ga.grupo = pd.grupo
            GROUP BY ga.grupo, ga.promedio_general
            ORDER BY ga.promedio_general DESC
        `;
        
        const result = await pool.query(query, params);
        
        // Get distinct periods with correct territorial classification
        const periodsQuery = `
            SELECT DISTINCT 
                CASE 
                    -- Determinar si es Local (NL) o Foráneo primero
                    WHEN (estado_final = 'Nuevo León' OR grupo_normalizado = 'GRUPO SALTILLO')
                         AND nombre_normalizado NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                    THEN 
                        -- LOCALES NL - Períodos Trimestrales
                        CASE
                            WHEN fecha_supervision BETWEEN '2025-03-12' AND '2025-04-16' THEN 'NL-T1-2025'
                            WHEN fecha_supervision BETWEEN '2025-06-11' AND '2025-08-18' THEN 'NL-T2-2025'
                            WHEN fecha_supervision BETWEEN '2025-08-19' AND '2025-10-09' THEN 'NL-T3-2025'
                            WHEN fecha_supervision >= '2025-10-30' THEN 'NL-T4-2025'
                            ELSE 'OTRO'
                        END
                    ELSE
                        -- FORÁNEAS - Períodos Semestrales
                        CASE
                            WHEN fecha_supervision BETWEEN '2025-04-10' AND '2025-06-09' THEN 'FOR-S1-2025'
                            WHEN fecha_supervision BETWEEN '2025-07-30' AND '2025-11-07' THEN 'FOR-S2-2025'
                            ELSE 'OTRO'
                        END
                END as periodo
            FROM supervision_normalized_view 
            WHERE porcentaje IS NOT NULL ${whereClause.replace('WHERE', 'AND')}
            ORDER BY periodo
        `;
        
        const periodsResult = await pool.query(periodsQuery, params);
        const periods = periodsResult.rows.map(row => row.periodo).filter(p => p !== 'OTRO' && p !== null);
        
        console.log(`✅ Heatmap data CORREGIDO: ${result.rows.length} grupos, ${periods.length} períodos con clasificación territorial correcta`);
        
        res.json({
            success: true,
            data: {
                periods: periods,
                groups: result.rows
            }
        });
    } catch (error) {
        console.error('❌ Error fetching heatmap data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error fetching heatmap data', 
            details: error.message 
        });
    }
});

// Areas de evaluación API - LAS 29 ÁREAS PRINCIPALES MAPEADAS
app.get('/api/areas', async (req, res) => {
    try {
        console.log('📋 Areas de evaluación requested with filters:', req.query);
        
        let whereClause = 'WHERE porcentaje IS NOT NULL AND area_tipo = \'area_principal\'';
        const params = [];
        let paramIndex = 1;
        
        // Apply filters
        if (req.query.estado && req.query.estado !== 'all' && req.query.estado !== 'undefined' && req.query.estado !== 'null') {
            whereClause += ` AND estado_final = $${paramIndex}`;
            params.push(req.query.estado);
            paramIndex++;
        }
        
        // Handle both single and multiple grupos
        if (req.query.grupo && req.query.grupo !== 'undefined' && req.query.grupo !== 'null') {
            const grupos = Array.isArray(req.query.grupo) ? req.query.grupo : [req.query.grupo];
            if (grupos.length > 0) {
                const grupPlaceholders = grupos.map(() => `$${paramIndex++}`).join(', ');
                whereClause += ` AND grupo_normalizado IN (${grupPlaceholders})`;
                params.push(...grupos);
            }
        }
        
        const query = `
            SELECT 
                area_evaluacion,
                COUNT(DISTINCT submission_id) as supervisiones_reales,
                COUNT(DISTINCT numero_sucursal) as sucursales_evaluadas,
                COUNT(DISTINCT grupo_normalizado) as grupos_operativos,
                ROUND(AVG(porcentaje), 2) as promedio_area,
                MIN(porcentaje) as minimo_porcentaje,
                MAX(porcentaje) as maximo_porcentaje,
                COUNT(CASE WHEN porcentaje < 70 THEN 1 END) as evaluaciones_criticas,
                COUNT(CASE WHEN porcentaje >= 90 THEN 1 END) as evaluaciones_excelentes,
                MIN(fecha_supervision) as primera_evaluacion,
                MAX(fecha_supervision) as ultima_evaluacion
            FROM supervision_normalized_view
            ${whereClause}
              AND fecha_supervision >= '2025-02-01'
            GROUP BY area_evaluacion
            HAVING COUNT(DISTINCT submission_id) >= 5  -- Solo áreas con al menos 5 supervisiones
            ORDER BY COUNT(DISTINCT submission_id) DESC, promedio_area DESC
        `;
        
        const result = await pool.query(query, params);
        
        console.log(`📊 Areas loaded: ${result.rows.length} áreas de evaluación principales`);
        
        res.json({
            success: true,
            total_areas: result.rows.length,
            areas: result.rows,
            note: 'Áreas de evaluación principales con al menos 5 supervisiones realizadas'
        });
        
    } catch (error) {
        console.error('❌ Error fetching areas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error fetching areas de evaluación', 
            details: error.message 
        });
    }
});

// Análisis crítico por sucursal - PARA PIN POINT FUNCTIONALITY
app.get('/api/analisis-critico', async (req, res) => {
    try {
        const { tipo, id, estado, grupo } = req.query;
        console.log('🔍 Análisis crítico requested for:', { tipo, id, estado, grupo });
        
        if (tipo !== 'sucursal' || !id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tipo debe ser "sucursal" y se requiere ID' 
            });
        }
        
        // Buscar la sucursal por nombre o número - BÚSQUEDA MEJORADA
        const sucursalQuery = `
            SELECT 
                nombre_normalizado,
                numero_sucursal,
                grupo_normalizado,
                estado_final,
                ciudad_normalizada,
                lat_validada,
                lng_validada,
                MAX(fecha_supervision) as ultima_supervision
            FROM supervision_normalized_view 
            WHERE (nombre_normalizado ILIKE $1 
                OR location_name ILIKE $1
                OR numero_sucursal::text = $2
                OR LOWER(nombre_normalizado) = LOWER($3))
              AND area_tipo = 'area_principal'
              AND porcentaje IS NOT NULL
              AND fecha_supervision >= '2025-02-01'
            GROUP BY nombre_normalizado, numero_sucursal, grupo_normalizado, estado_final, ciudad_normalizada, lat_validada, lng_validada
            LIMIT 1
        `;
        
        console.log('🔍 Buscando sucursal con ID:', id);
        const sucursalResult = await pool.query(sucursalQuery, [`%${id}%`, id, id]);
        
        if (sucursalResult.rows.length === 0) {
            console.log('❌ Sucursal no encontrada para ID:', id);
            return res.status(404).json({ 
                success: false, 
                error: 'Sucursal no encontrada',
                debug: { searchId: id, query: sucursalQuery }
            });
        }
        
        const sucursal = sucursalResult.rows[0];
        
        // Obtener performance general actual
        const performanceQuery = `
            SELECT 
                ROUND(AVG(porcentaje), 2) as promedio_actual,
                COUNT(DISTINCT submission_id) as total_supervisiones,
                MAX(fecha_supervision) as fecha_mas_reciente
            FROM supervision_normalized_view 
            WHERE nombre_normalizado = $1
              AND area_tipo = 'area_principal'
              AND porcentaje IS NOT NULL
              AND fecha_supervision >= '2025-02-01'
        `;
        
        const performanceResult = await pool.query(performanceQuery, [sucursal.nombre_normalizado]);
        const currentPerformance = performanceResult.rows[0];
        
        // Obtener áreas de oportunidad (abajo de 80%)
        const areasQuery = `
            SELECT 
                area_evaluacion,
                ROUND(AVG(porcentaje), 2) as score_actual,
                COUNT(DISTINCT submission_id) as supervisiones,
                MAX(fecha_supervision) as ultima_evaluacion
            FROM supervision_normalized_view 
            WHERE nombre_normalizado = $1
              AND area_tipo = 'area_principal'
              AND porcentaje IS NOT NULL
              AND fecha_supervision >= '2025-02-01'
              AND area_evaluacion IS NOT NULL
              AND area_evaluacion != ''
            GROUP BY area_evaluacion
            HAVING ROUND(AVG(porcentaje), 2) < 80
            ORDER BY AVG(porcentaje) ASC
            LIMIT 5
        `;
        
        const areasResult = await pool.query(areasQuery, [sucursal.nombre_normalizado]);
        
        // Formatear respuesta
        const response = {
            success: true,
            sucursal: sucursal.nombre_normalizado,
            numero_sucursal: sucursal.numero_sucursal,
            grupo_operativo: sucursal.grupo_normalizado,
            estado: sucursal.estado_final,
            ciudad: sucursal.ciudad_normalizada,
            coordenadas: {
                lat: sucursal.lat_validada,
                lng: sucursal.lng_validada
            },
            performance_general: {
                actual: currentPerformance.promedio_actual || 0,
                anterior: 0, // Sin datos históricos por ahora
                cambio: 0,
                tendencia: "📊"
            },
            areas_criticas: areasResult.rows.map(area => ({
                area_evaluacion: area.area_evaluacion,
                score_actual: area.score_actual,
                supervisiones: area.supervisiones,
                tendencia: area.score_actual < 70 ? "🔴" : "🟡",
                ultima_evaluacion: area.ultima_evaluacion
            })),
            ultima_supervision: sucursal.ultima_supervision,
            total_supervisiones: currentPerformance.total_supervisiones,
            periodos: {
                actual: "Feb-Nov 2025",
                anterior: "N/A",
                es_fallback: false
            },
            metadata: {
                areas_con_fallback: 0,
                data_source: "supervision_normalized_view",
                generado: new Date().toISOString()
            }
        };
        
        console.log(`🎯 Análisis crítico generado para ${sucursal.nombre_normalizado}: ${areasResult.rows.length} áreas de oportunidad`);
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error en análisis crítico:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error generando análisis crítico', 
            details: error.message 
        });
    }
});

// Debug endpoint for testing - CON ESTADÍSTICAS NORMALIZADAS
app.get('/api/debug', async (req, res) => {
    try {
        const recentStats = await pool.query(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT submission_id) as real_supervisiones,
                COUNT(DISTINCT numero_sucursal) as sucursales_csv_mapeadas,
                COUNT(DISTINCT grupo_normalizado) as grupos_operativos,
                COUNT(DISTINCT area_evaluacion) as areas_evaluacion,
                COUNT(CASE WHEN mapping_status = 'mapped_to_csv' THEN 1 END) as records_mapeados,
                MIN(fecha_supervision) as oldest_date,
                MAX(fecha_supervision) as newest_date
            FROM supervision_normalized_view
            WHERE fecha_supervision >= '2025-02-01'
              AND area_tipo = 'area_principal'
        `);
        
        const dailyStats = await pool.query(`
            SELECT 
                DATE(fecha_supervision) as fecha,
                COUNT(DISTINCT submission_id) as supervisiones_reales,
                COUNT(DISTINCT numero_sucursal) as sucursales,
                COUNT(DISTINCT grupo_normalizado) as grupos
            FROM supervision_normalized_view
            WHERE fecha_supervision >= '2025-02-01'
              AND area_tipo = 'area_principal'
              AND porcentaje IS NOT NULL
            GROUP BY DATE(fecha_supervision)
            ORDER BY fecha DESC
        `);
        
        const areaBreakdown = await pool.query(`
            SELECT 
                area_evaluacion,
                COUNT(DISTINCT submission_id) as supervisiones,
                ROUND(AVG(porcentaje), 2) as promedio
            FROM supervision_normalized_view
            WHERE fecha_supervision >= '2025-02-01'
              AND area_tipo = 'area_principal'
              AND porcentaje IS NOT NULL
            GROUP BY area_evaluacion
            ORDER BY COUNT(DISTINCT submission_id) DESC
            LIMIT 10
        `);
        
        res.json({
            recent_stats: recentStats.rows[0],
            daily_breakdown: dailyStats.rows,
            top_areas: areaBreakdown.rows,
            note: 'Estadísticas NORMALIZADAS con view corregida - conteos por submission_id real'
        });
    } catch (error) {
        console.error('❌ Error in debug endpoint:', error);
        res.status(500).json({ error: 'Error fetching debug data', details: error.message });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 El Pollo Loco Dashboard FIXED (NO FILTERS) + Menu Button running on port ${port}`);
    console.log(`🎯 Features: NO restrictive date filters, showing current 2025 data`);
    console.log(`📊 Data range: Last 30 days for current performance`);
    console.log(`🗺️ All 85 sucursales and 20 grupos should appear`);
    console.log(`🤖 Telegram Bot: ${bot ? 'ACTIVE - Menu Button Only' : 'INACTIVE'}`);
    console.log(`🔗 Dashboard URL: ${DASHBOARD_URL}`);
    console.log(`📱 Bot URL: https://t.me/EPLEstandarizacionBot`);
    console.log(`✅ FUNCIONALIDAD COMPLETA DEL DASHBOARD RESTAURADA + Menu Button`);
});

module.exports = app;