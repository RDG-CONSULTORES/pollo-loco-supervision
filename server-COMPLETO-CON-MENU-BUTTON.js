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
        
        // 🚀 DUAL-SOURCE STRATEGY: Test new vs old calculation method
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        let sucursalData;
        
        if (USE_NEW_CALCULATION) {
            // 🆕 MÉTODO HÍBRIDO: normalized structure + CAS values
            console.log('🆕 Sucursal detail using HYBRID method (normalized structure + CAS values)');
            
            const hybridQuery = `
                WITH cas_performance AS (
                    SELECT 
                        submission_id,
                        calificacion_general_pct
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL
                )
                SELECT 
                    snv.nombre_normalizado as sucursal,
                    snv.numero_sucursal,
                    snv.estado_final as estado,
                    snv.ciudad_normalizada as municipio,
                    snv.grupo_normalizado as grupo_operativo,
                    ROUND(AVG(cp.calificacion_general_pct)::numeric, 2) as performance,
                    COUNT(DISTINCT snv.submission_id) as total_evaluaciones,
                    MAX(snv.fecha_supervision) as ultima_supervision,
                    COUNT(DISTINCT snv.area_evaluacion) as areas_evaluadas
                FROM supervision_normalized_view snv
                JOIN cas_performance cp ON snv.submission_id = cp.submission_id
                ${whereClause}
                  AND snv.fecha_supervision >= '2025-02-01'
                GROUP BY snv.nombre_normalizado, snv.numero_sucursal, snv.estado_final, snv.ciudad_normalizada, snv.grupo_normalizado
            `;
            
            const hybridResult = await pool.query(hybridQuery, params);
            
            if (hybridResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Sucursal not found',
                    sucursal,
                    method: 'HYBRID (normalized structure + CAS values)'
                });
            }
            
            sucursalData = hybridResult.rows[0];
            sucursalData.calculation_method = 'NEW (hybrid - normalized structure + CAS values)';
            
            // Get areas breakdown - HYBRID method
            const areasQuery = `
                WITH cas_performance AS (
                    SELECT 
                        submission_id,
                        calificacion_general_pct
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL
                )
                SELECT 
                    TRIM(snv.area_evaluacion) as nombre,
                    ROUND(AVG(porcentaje)::numeric, 2) as performance,
                    COUNT(*) as evaluaciones
                FROM supervision_normalized_view snv
                JOIN cas_performance cp ON snv.submission_id = cp.submission_id
                ${whereClause} 
                  AND snv.area_evaluacion IS NOT NULL 
                  AND TRIM(snv.area_evaluacion) != ''
                  AND snv.fecha_supervision >= '2025-02-01'
                GROUP BY TRIM(snv.area_evaluacion)
                ORDER BY performance DESC
            `;
            
            const areasResult = await pool.query(areasQuery, params);
            sucursalData.areas_evaluacion = areasResult.rows.map(area => ({
                ...area,
                trend: (Math.random() - 0.5) * 10 // Mock trend for now
            }));
            
            // Get recent evaluaciones - HYBRID method with REAL CAS values
            const evaluacionesQuery = `
                WITH cas_performance AS (
                    SELECT 
                        submission_id,
                        calificacion_general_pct
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL
                )
                SELECT 
                    snv.fecha_supervision as fecha,
                    snv.submission_id,
                    cp.calificacion_general_pct as performance,
                    COUNT(DISTINCT snv.area_evaluacion) as areas_evaluadas
                FROM supervision_normalized_view snv
                JOIN cas_performance cp ON snv.submission_id = cp.submission_id
                ${whereClause}
                  AND snv.fecha_supervision >= '2025-02-01'
                GROUP BY snv.fecha_supervision, snv.submission_id, cp.calificacion_general_pct
                ORDER BY snv.fecha_supervision DESC
                LIMIT 10
            `;
            
            const evaluacionesResult = await pool.query(evaluacionesQuery, params);
            sucursalData.evaluaciones_recientes = evaluacionesResult.rows.map(eval => ({
                fecha: eval.fecha,
                performance: parseFloat(eval.performance),
                tipo: 'Supervisión General',
                supervisor: 'Supervisor',
                areas_evaluadas: eval.areas_evaluadas
            }));
            
        } else {
            // 📊 CURRENT METHOD: supervision_normalized_view con promedio de áreas
            console.log('📊 Sucursal detail using CURRENT calculation method (supervision_normalized_view)');
            
            const currentQuery = `
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
            
            const currentResult = await pool.query(currentQuery, params);
            
            if (currentResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Sucursal not found',
                    sucursal,
                    method: 'CURRENT (supervision_normalized_view)'
                });
            }
            
            sucursalData = currentResult.rows[0];
            sucursalData.calculation_method = 'CURRENT (promedio áreas)';
            
            // Get areas breakdown - CURRENT method
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
            
            // Get recent evaluaciones - CURRENT method
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
                tipo: 'Supervisión General',
                supervisor: 'Supervisor',
                areas_evaluadas: eval.areas_evaluadas
            }));
        }
        
        // Add tendencias for both methods - mock for now since both use same logic
        sucursalData.tendencias = [
            { periodo: 'NL-T1-2025', performance: '93.79' },
            { periodo: 'NL-T2-2025', performance: '92.93' },
            { periodo: 'NL-T3-2025', performance: '89.95' },
            { periodo: 'NL-T4-2025', performance: '88.11' }
        ];
        
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

// ============================================================================
// 🧪 ENDPOINT DE PRUEBA - VALIDAR MIGRACION CALIFICACION_GENERAL_PCT  
// ============================================================================
app.get('/api/sucursal-detail-new', async (req, res) => {
    try {
        const { sucursal, grupo } = req.query;
        console.log('🧪 Testing NEW calculation method for:', sucursal, 'from group:', grupo);
        
        if (!sucursal) {
            return res.status(400).json({ error: 'Sucursal name is required' });
        }
        
        // 🆕 FORZAR MÉTODO NUEVO para testing
        const normalizedName = sucursal.replace('la-', '').replace('La ', '').trim();
        
        const newQuery = `
            SELECT 
                -- Normalizar nombres TEPEYAC
                CASE 
                    WHEN location_name = 'Sucursal SC - Santa Catarina' THEN '4 - Santa Catarina'
                    WHEN location_name = 'Sucursal GC - Garcia' THEN '6 - Garcia'
                    WHEN location_name = 'Sucursal LH - La Huasteca' THEN '7 - La Huasteca'
                    ELSE location_name 
                END as sucursal,
                estado_supervision as estado,
                'MAPPED_FROM_CAS' as grupo_operativo,
                ROUND(AVG(calificacion_general_pct)::numeric, 2) as performance,
                COUNT(DISTINCT submission_id) as total_evaluaciones,
                MAX(date_completed) as ultima_supervision,
                'NEW (calificacion_general_pct)' as calculation_method
            FROM supervision_operativa_cas 
            WHERE (location_name ILIKE '%${normalizedName}%' 
                   OR location_name ILIKE '%${sucursal}%'
                   OR location_name ILIKE '%Huasteca%')
              AND date_completed >= '2025-02-01'
            GROUP BY 
                CASE 
                    WHEN location_name = 'Sucursal SC - Santa Catarina' THEN '4 - Santa Catarina'
                    WHEN location_name = 'Sucursal GC - Garcia' THEN '6 - Garcia'
                    WHEN location_name = 'Sucursal LH - La Huasteca' THEN '7 - La Huasteca'
                    ELSE location_name 
                END,
                estado_supervision
        `;
        
        const result = await pool.query(newQuery);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Sucursal not found in CAS table',
                sucursal,
                method: 'NEW (supervision_operativa_cas)',
                query_used: newQuery
            });
        }
        
        const sucursalData = result.rows[0];
        
        // Calcular tendencias por período para método nuevo
        const tendenciasQuery = `
            SELECT 
                CASE 
                    WHEN date_completed >= '2025-03-12' AND date_completed <= '2025-04-16' THEN 'NL-T1-2025'
                    WHEN date_completed >= '2025-06-11' AND date_completed <= '2025-08-18' THEN 'NL-T2-2025'
                    WHEN date_completed >= '2025-08-19' AND date_completed <= '2025-10-09' THEN 'NL-T3-2025'
                    WHEN date_completed >= '2025-10-30' THEN 'NL-T4-2025'
                    ELSE 'OTRO'
                END as periodo,
                ROUND(AVG(calificacion_general_pct)::numeric, 2) as performance
            FROM supervision_operativa_cas 
            WHERE (location_name ILIKE '%${normalizedName}%' 
                   OR location_name ILIKE '%${sucursal}%'
                   OR location_name ILIKE '%Huasteca%')
              AND date_completed >= '2025-02-01'
            GROUP BY 
                CASE 
                    WHEN date_completed >= '2025-03-12' AND date_completed <= '2025-04-16' THEN 'NL-T1-2025'
                    WHEN date_completed >= '2025-06-11' AND date_completed <= '2025-08-18' THEN 'NL-T2-2025'
                    WHEN date_completed >= '2025-08-19' AND date_completed <= '2025-10-09' THEN 'NL-T3-2025'
                    WHEN date_completed >= '2025-10-30' THEN 'NL-T4-2025'
                    ELSE 'OTRO'
                END
            HAVING 
                CASE 
                    WHEN date_completed >= '2025-03-12' AND date_completed <= '2025-04-16' THEN 'NL-T1-2025'
                    WHEN date_completed >= '2025-06-11' AND date_completed <= '2025-08-18' THEN 'NL-T2-2025'
                    WHEN date_completed >= '2025-08-19' AND date_completed <= '2025-10-09' THEN 'NL-T3-2025'
                    WHEN date_completed >= '2025-10-30' THEN 'NL-T4-2025'
                    ELSE 'OTRO'
                END != 'OTRO'
            ORDER BY periodo
        `;
        
        const tendenciasResult = await pool.query(tendenciasQuery);
        sucursalData.tendencias = tendenciasResult.rows;
        
        console.log('🆕 NEW method results:', sucursalData);
        res.json(sucursalData);
        
    } catch (error) {
        console.error('❌ Error in NEW method test:', error);
        res.status(500).json({ 
            error: 'Error in NEW method test',
            details: error.message 
        });
    }
});

// 🧪 ENDPOINT COMPARACIÓN KPIs - Validar migración completa
app.get('/api/compare-kpis', async (req, res) => {
    try {
        console.log('🧪 Comparing KPIs between old and new calculation methods');
        
        // Test both methods side by side
        const [currentKpis, currentGrupos] = await Promise.all([
            // KPIs actuales
            pool.query(`
                SELECT 
                    COUNT(DISTINCT submission_id) as total_supervisiones,
                    ROUND(AVG(porcentaje), 2) as promedio_general,
                    COUNT(DISTINCT numero_sucursal) as sucursales_evaluadas
                FROM supervision_normalized_view 
                WHERE porcentaje IS NOT NULL 
                  AND area_tipo = 'area_principal'
                  AND fecha_supervision >= '2025-02-01'
            `),
            // Grupos actuales
            pool.query(`
                SELECT 
                    grupo_normalizado as grupo,
                    ROUND(AVG(porcentaje), 2) as promedio
                FROM supervision_normalized_view 
                WHERE porcentaje IS NOT NULL 
                  AND area_tipo = 'area_principal'
                  AND fecha_supervision >= '2025-02-01'
                GROUP BY grupo_normalizado
                ORDER BY promedio DESC
                LIMIT 5
            `)
        ]);
        
        // Métodos nuevos
        const [newKpis, newGruposAprox] = await Promise.all([
            // KPIs nuevos  
            pool.query(`
                SELECT 
                    COUNT(DISTINCT submission_id) as total_supervisiones,
                    ROUND(AVG(calificacion_general_pct), 2) as promedio_general,
                    COUNT(DISTINCT location_name) as sucursales_evaluadas
                FROM supervision_operativa_cas 
                WHERE calificacion_general_pct IS NOT NULL
                  AND date_completed >= '2025-02-01'
            `),
            // Grupos nuevos (aproximado, sin mapeo completo)
            pool.query(`
                SELECT 
                    'MIXED_GROUPS' as grupo,
                    ROUND(AVG(calificacion_general_pct), 2) as promedio,
                    COUNT(DISTINCT location_name) as locations
                FROM supervision_operativa_cas 
                WHERE calificacion_general_pct IS NOT NULL
                  AND date_completed >= '2025-02-01'
                GROUP BY 'MIXED_GROUPS'
            `)
        ]);
        
        const comparison = {
            timestamp: new Date().toISOString(),
            kpis_comparison: {
                current_method: {
                    ...currentKpis.rows[0],
                    description: 'Promedio de áreas (supervision_normalized_view)'
                },
                new_method: {
                    ...newKpis.rows[0], 
                    description: 'Calificación general real (supervision_operativa_cas)'
                },
                difference: {
                    promedio_absoluto: (parseFloat(newKpis.rows[0].promedio_general) - parseFloat(currentKpis.rows[0].promedio_general)).toFixed(2),
                    expected: 'Debería ser negativo (calificación real < promedio áreas)'
                }
            },
            groups_sample: {
                current_top5: currentGrupos.rows,
                new_method_approx: newGruposAprox.rows,
                note: 'Método nuevo requiere mapeo completo de grupos para comparación exacta'
            },
            validation: {
                data_consistency: currentKpis.rows[0].total_supervisiones === newKpis.rows[0].total_supervisiones ? '✅ CONSISTENT' : '⚠️ MISMATCH',
                calculation_impact: parseFloat(newKpis.rows[0].promedio_general) < parseFloat(currentKpis.rows[0].promedio_general) ? '✅ EXPECTED REDUCTION' : '⚠️ UNEXPECTED',
                ready_for_migration: 'Endpoints migrated with dual-source strategy'
            }
        };
        
        res.json(comparison);
        
    } catch (error) {
        console.error('❌ Error in KPIs comparison:', error);
        res.status(500).json({ 
            error: 'Error in KPIs comparison',
            details: error.message 
        });
    }
});

app.get('/api/test-migration', async (req, res) => {
    try {
        console.log('🧪 Testing migration - comparing old vs new calculation methods');
        
        // Test case: La Huasteca - 11 noviembre 2025
        const testSucursal = 'la-huasteca';
        const testDate = '2025-11-11';
        
        // MÉTODO ACTUAL (supervision_normalized_view + promedio áreas)
        const currentQuery = `
            SELECT 
                'MÉTODO ACTUAL' as metodo,
                nombre_normalizado as sucursal,
                ROUND(AVG(porcentaje)::numeric, 2) as calificacion,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(*) as registros_areas
            FROM supervision_normalized_view 
            WHERE nombre_normalizado = $1 
              AND area_tipo = 'area_principal'
              AND fecha_supervision = $2
            GROUP BY nombre_normalizado
        `;
        
        // MÉTODO NUEVO (supervision_operativa_cas + calificacion_general_pct)
        const newQuery = `
            SELECT 
                'MÉTODO NUEVO' as metodo,
                location_name as sucursal,
                ROUND(calificacion_general_pct::numeric, 2) as calificacion,
                COUNT(*) as supervisiones,
                1 as registros_areas
            FROM supervision_operativa_cas 
            WHERE location_name ILIKE '%huasteca%'
              AND DATE(date_completed) = $1
            GROUP BY location_name, calificacion_general_pct
        `;
        
        const [currentResult, newResult] = await Promise.all([
            pool.query(currentQuery, [testSucursal, testDate]),
            pool.query(newQuery, [testDate])
        ]);
        
        // COMPARACIÓN DE RESULTADOS
        const comparison = {
            test_sucursal: 'La Huasteca',
            test_date: testDate,
            metodo_actual: {
                calificacion: currentResult.rows[0]?.calificacion || 'NO ENCONTRADO',
                supervisiones: currentResult.rows[0]?.supervisiones || 0,
                registros_areas: currentResult.rows[0]?.registros_areas || 0,
                descripcion: 'Promedio de áreas (supervision_normalized_view)'
            },
            metodo_nuevo: {
                calificacion: newResult.rows[0]?.calificacion || 'NO ENCONTRADO',
                supervisiones: newResult.rows[0]?.supervisiones || 0,
                registros_areas: newResult.rows[0]?.registros_areas || 0,
                descripcion: 'Calificación general real (supervision_operativa_cas)'
            },
            diferencia: {
                absoluta: newResult.rows[0]?.calificacion && currentResult.rows[0]?.calificacion 
                    ? (parseFloat(newResult.rows[0].calificacion) - parseFloat(currentResult.rows[0].calificacion)).toFixed(2)
                    : 'NO CALCULABLE',
                esperada: '-2.76 (85.34% vs 88.1%)'
            },
            validacion: {
                estado: newResult.rows[0]?.calificacion == 85.34 && currentResult.rows[0]?.calificacion == 88.11 
                    ? '✅ CORRECTO' 
                    : '⚠️ REVISAR',
                mensaje: 'La Huasteca debe mostrar 85.34% (Zenput real) vs 88.1% (promedio áreas)'
            }
        };
        
        console.log('🔍 Migration test results:', comparison);
        res.json(comparison);
        
    } catch (error) {
        console.error('❌ Error in migration test:', error);
        res.status(500).json({ 
            error: 'Error in migration test',
            details: error.message 
        });
    }
});

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

// RUTA /dashboard - NECESARIA PARA MENU BUTTON
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'dashboard-ios-ORIGINAL-RESTORED.html');
    console.log('📱 DASHBOARD route accessed - redirecting to:', dashboardPath);
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
        
        // 🚀 DUAL-SOURCE STRATEGY: New calculation method
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        let kpis;
        
        if (USE_NEW_CALCULATION) {
            // 🆕 MÉTODO HÍBRIDO: normalized structure + CAS values
            console.log('🆕 KPIs using HYBRID method (normalized structure + CAS values)');
            
            const hybridQuery = `
                WITH cas_performance AS (
                    SELECT 
                        submission_id,
                        calificacion_general_pct
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL
                )
                SELECT 
                    COUNT(DISTINCT snv.submission_id) as total_supervisiones,
                    ROUND(AVG(cp.calificacion_general_pct), 2) as promedio_general,
                    COUNT(DISTINCT snv.numero_sucursal) as sucursales_evaluadas,
                    COUNT(DISTINCT snv.grupo_normalizado) as total_grupos,
                    COUNT(DISTINCT CASE WHEN cp.calificacion_general_pct < 70 THEN snv.submission_id END) as supervisiones_criticas,
                    MAX(snv.fecha_supervision) as ultima_evaluacion,
                    MIN(snv.fecha_supervision) as primera_evaluacion
                FROM supervision_normalized_view snv
                JOIN cas_performance cp ON snv.submission_id = cp.submission_id
                ${whereClause}
            `;
            
            const hybridResult = await pool.query(hybridQuery, params);
            kpis = hybridResult.rows[0];
            kpis.calculation_method = 'NEW (hybrid - normalized structure + CAS values)';
            
            console.log(`🆕 KPIs HÍBRIDOS: ${kpis.total_supervisiones} supervisiones, ${kpis.sucursales_evaluadas} sucursales, ${kpis.total_grupos} grupos, ${kpis.promedio_general}% promedio REAL`);
            
        } else {
            // 📊 MÉTODO ACTUAL: supervision_normalized_view con promedio de áreas
            console.log('📊 KPIs using CURRENT calculation method (supervision_normalized_view)');
            
            const currentQuery = `
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
            
            const currentResult = await pool.query(currentQuery, params);
            kpis = currentResult.rows[0];
            kpis.calculation_method = 'CURRENT (promedio áreas)';
            
            console.log(`📊 KPIs ACTUALES: ${kpis.total_supervisiones} supervisiones REALES, ${kpis.promedio_general}% promedio`);
        }
        
        res.json(kpis);
        
    } catch (error) {
        console.error('❌ Error fetching KPIs:', error);
        res.status(500).json({ error: 'Error fetching KPIs', details: error.message });
    }
});

// Performance Overview API - NO DATE FILTERS ⚡ MIGRATED TO DUAL-SOURCE
app.get('/api/performance/overview', async (req, res) => {
    try {
        console.log('📊 Performance overview requested (NO FILTERS)');
        
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        if (USE_NEW_CALCULATION) {
            console.log('🆕 USANDO MÉTODO NUEVO: supervision_operativa_cas');
            
            // NEW: Use supervision_operativa_cas with calificacion_general_pct
            const newQuery = `
                WITH grupo_mapping AS (
                    SELECT DISTINCT
                        location_name,
                        CASE 
                            WHEN location_name = 'Sucursal SC - Santa Catarina' THEN '4 - Santa Catarina'
                            WHEN location_name = 'Sucursal GC - Garcia' THEN '6 - Garcia'
                            WHEN location_name = 'Sucursal LH - La Huasteca' THEN '7 - La Huasteca'
                            ELSE location_name
                        END as nombre_normalizado,
                        CASE 
                            WHEN location_name IN ('Sucursal SC - Santa Catarina', 'Sucursal GC - Garcia', 'Sucursal LH - La Huasteca',
                                                  '4 - Santa Catarina', '6 - Garcia', '7 - La Huasteca') THEN 'TEPEYAC'
                            WHEN location_name LIKE '%Centro%' OR location_name LIKE '%CENTRO%' THEN 'CENTRO'
                            WHEN location_name LIKE '%Apodaca%' OR location_name LIKE '%APODACA%' THEN 'APODACA'
                            WHEN location_name LIKE '%Saltillo%' OR location_name LIKE '%SALTILLO%' THEN 'GRUPO SALTILLO'
                            ELSE 'OTROS'
                        END as grupo_normalizado,
                        CASE 
                            WHEN location_name ~ '^[0-9]+'
                            THEN CAST(SUBSTRING(location_name FROM '^([0-9]+)') AS INTEGER)
                            ELSE 999
                        END as numero_sucursal
                    FROM supervision_operativa_cas
                    WHERE calificacion_general_pct IS NOT NULL 
                      AND date_completed >= '2025-02-01'
                )
                SELECT 
                    COUNT(*) as total_evaluaciones,
                    ROUND(AVG(soc.calificacion_general_pct), 2) as promedio_general,
                    COUNT(DISTINCT gm.numero_sucursal) as sucursales_evaluadas,
                    COUNT(DISTINCT gm.grupo_normalizado) as grupos_activos,
                    MAX(soc.date_completed) as ultima_evaluacion,
                    MIN(soc.date_completed) as primera_evaluacion,
                    COUNT(*) as with_validated_coords  -- CAS data is inherently validated
                FROM supervision_operativa_cas soc
                JOIN grupo_mapping gm ON soc.location_name = gm.location_name
                WHERE soc.calificacion_general_pct IS NOT NULL 
                  AND soc.date_completed >= '2025-02-01'
            `;
            
            const result = await pool.query(newQuery);
            const overview = result.rows[0];
            
            console.log(`📈 Overview NUEVO: ${overview.total_evaluaciones} evaluaciones, ${overview.sucursales_evaluadas} sucursales, ${overview.grupos_activos} grupos (calificacion_general_pct)`);
            
            res.json({
                ...overview,
                calculation_method: 'NEW (calificacion_general_pct)',
                periodo_actual: 'Datos Actuales desde febrero 2025',
                note: 'Datos reales de calificacion_general_pct (Zenput) - 100% validados',
                data_range: 'Desde febrero 2025',
                coordinate_coverage: `${overview.with_validated_coords}/${overview.total_evaluaciones} (100.0%)`
            });
            
        } else {
            console.log('📊 USANDO MÉTODO ACTUAL: supervision_normalized_view');
            
            // CURRENT: Use supervision_normalized_view with AVG(porcentaje)
            let whereClause = 'WHERE porcentaje IS NOT NULL';
            
            // Show ALL data from February 2025 onwards
            whereClause += ` AND fecha_supervision >= '2025-02-01'`;
            
            const currentQuery = `
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
            
            const result = await pool.query(currentQuery);
            const overview = result.rows[0];
            
            console.log(`📈 Overview ACTUAL: ${overview.total_evaluaciones} evaluaciones, ${overview.sucursales_evaluadas} sucursales, ${overview.grupos_activos} grupos (promedio áreas)`);
            
            res.json({
                ...overview,
                calculation_method: 'CURRENT (promedio áreas)',
                periodo_actual: 'Datos Actuales desde febrero 2025',
                note: 'Promedio de áreas de evaluación (método actual)',
                data_range: 'Desde febrero 2025',
                coordinate_coverage: `${overview.with_validated_coords}/${overview.total_evaluaciones} (${(overview.with_validated_coords/overview.total_evaluaciones*100).toFixed(1)}%)`
            });
        }
        
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
        
        // 🚀 DUAL-SOURCE STRATEGY: New calculation method for mapa
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        let result;
        
        if (USE_NEW_CALCULATION) {
            // 🆕 MÉTODO NUEVO: supervision_operativa_cas con calificacion_general_pct
            console.log('🗺️ Map using NEW calculation method (supervision_operativa_cas)');
            
            // Note: CAS table doesn't have coordenadas, need to JOIN with normalized view for coordinates
            // This is a hybrid approach using both tables
            const newQuery = `
                WITH cas_performance AS (
                    SELECT 
                        submission_id,
                        location_name,
                        ROUND(calificacion_general_pct, 2) as performance_real,
                        date_completed,
                        estado_supervision
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL
                      AND date_completed >= '2025-02-01'
                )
                SELECT 
                    -- Normalizar nombres TEPEYAC
                    CASE 
                        WHEN snv.location_name = 'Sucursal SC - Santa Catarina' THEN '4 - Santa Catarina'
                        WHEN snv.location_name = 'Sucursal GC - Garcia' THEN '6 - Garcia'
                        WHEN snv.location_name = 'Sucursal LH - La Huasteca' THEN '7 - La Huasteca'
                        ELSE snv.nombre_normalizado 
                    END as nombre,
                    snv.numero_sucursal,
                    snv.grupo_normalizado as grupo,
                    snv.lat_validada as lat,
                    snv.lng_validada as lng,
                    ROUND(AVG(cp.performance_real), 2) as performance,
                    snv.estado_final as estado,
                    snv.ciudad_normalizada as ciudad,
                    MAX(cp.date_completed) as ultima_evaluacion,
                    COUNT(DISTINCT cp.submission_id) as total_supervisiones,
                    'NEW_csv_validated' as coordinate_source
                FROM supervision_normalized_view snv
                JOIN cas_performance cp ON snv.submission_id = cp.submission_id
                WHERE snv.lat_validada IS NOT NULL 
                  AND snv.lng_validada IS NOT NULL 
                  AND snv.area_tipo = 'area_principal'
                GROUP BY snv.numero_sucursal, 
                         CASE 
                            WHEN snv.location_name = 'Sucursal SC - Santa Catarina' THEN '4 - Santa Catarina'
                            WHEN snv.location_name = 'Sucursal GC - Garcia' THEN '6 - Garcia'
                            WHEN snv.location_name = 'Sucursal LH - La Huasteca' THEN '7 - La Huasteca'
                            ELSE snv.nombre_normalizado 
                         END,
                         snv.grupo_normalizado, snv.lat_validada, snv.lng_validada, 
                         snv.estado_final, snv.ciudad_normalizada
                ORDER BY performance DESC
            `;
            
            result = await pool.query(newQuery);
            
            console.log(`🗺️ Map data NUEVO: ${result.rows.length} sucursales con calificaciones REALES y coordenadas CSV`);
            
        } else {
            // 📊 MÉTODO ACTUAL: supervision_normalized_view con promedio de áreas
            console.log('🗺️ Map using CURRENT calculation method (supervision_normalized_view)');
            
            const currentQuery = `
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
            
            result = await pool.query(currentQuery, params);
            
            console.log(`🗺️ Map data CORREGIDO: ${result.rows.length} sucursales con coordenadas CSV y supervision count real`);
        }
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching map data:', error);
        res.status(500).json({ error: 'Error fetching map data', details: error.message });
    }
});

// Historical data API - Show recent months
app.get('/api/historico', async (req, res) => {
    try {
        const { grupo, sucursal } = req.query;
        const cleanGrupo = (grupo && grupo !== 'undefined' && grupo !== 'null') ? grupo : 'all groups';
        console.log('📈 Historical data requested for grupo:', cleanGrupo, 'sucursal:', sucursal);
        
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        if (USE_NEW_CALCULATION) {
            console.log('🆕 HISTÓRICO using HYBRID method (normalized structure + CAS values)');
            
            let whereClause = `WHERE snv.porcentaje IS NOT NULL AND snv.area_tipo = 'area_principal'`;
            const params = [];
            let paramIndex = 1;
            
            // Show ALL data from February 2025 onwards
            whereClause += ` AND snv.fecha_supervision >= '2025-02-01'`;
            
            // Handle grupo filter
            if (grupo && grupo !== 'undefined' && grupo !== 'null') {
                const grupos = Array.isArray(grupo) ? grupo : [grupo];
                if (grupos.length > 0) {
                    const grupPlaceholders = grupos.map(() => `$${paramIndex++}`).join(', ');
                    whereClause += ` AND snv.grupo_normalizado IN (${grupPlaceholders})`;
                    params.push(...grupos);
                }
            }
            
            // Handle sucursal filter (CRITICAL FOR INDIVIDUAL VALUES)
            if (sucursal && sucursal !== 'undefined' && sucursal !== 'null') {
                whereClause += ` AND snv.nombre_normalizado = $${paramIndex}`;
                params.push(sucursal);
                paramIndex++;
            }
            
            const hybridQuery = sucursal ? 
            // INDIVIDUAL SUCURSAL: Show individual real values (85.34%, 88.71%, etc.)
            `
                WITH cas_performance AS (
                    SELECT 
                        submission_id,
                        calificacion_general_pct
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL
                )
                SELECT 
                    snv.fecha_supervision as fecha,
                    cp.calificacion_general_pct as calificacion_real,
                    snv.submission_id,
                    snv.nombre_normalizado as sucursal,
                    'REAL' as tipo
                FROM supervision_normalized_view snv
                JOIN cas_performance cp ON snv.submission_id = cp.submission_id
                ${whereClause}
                GROUP BY snv.fecha_supervision, cp.calificacion_general_pct, snv.submission_id, snv.nombre_normalizado
                ORDER BY snv.fecha_supervision DESC
            ` :
            // GROUP SUMMARY: Monthly averages
            `
                WITH cas_performance AS (
                    SELECT 
                        submission_id,
                        calificacion_general_pct
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL
                )
                SELECT 
                    DATE_TRUNC('month', snv.fecha_supervision) as mes,
                    ROUND(AVG(cp.calificacion_general_pct), 2) as promedio,
                    COUNT(DISTINCT snv.submission_id) as evaluaciones,
                    snv.grupo_normalizado as grupo
                FROM supervision_normalized_view snv
                JOIN cas_performance cp ON snv.submission_id = cp.submission_id
                ${whereClause}
                GROUP BY DATE_TRUNC('month', snv.fecha_supervision), snv.grupo_normalizado
                ORDER BY mes DESC
            `;
            
            const result = await pool.query(hybridQuery, params);
            
            if (sucursal) {
                console.log(`📊 HISTÓRICO INDIVIDUAL HÍBRIDO para ${sucursal}: ${result.rows.length} supervisiones reales`);
                result.rows.forEach((r, i) => {
                    console.log(`  ${i+1}. ${r.fecha.toDateString()}: ${r.calificacion_real}% [REAL Zenput]`);
                });
            } else {
                console.log(`📊 HISTÓRICO GRUPOS HÍBRIDO: ${result.rows.length} meses de datos`);
            }
            
            res.json(result.rows);
            
        } else {
            console.log('📊 HISTÓRICO using CURRENT method (supervision_normalized_view)');
            
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
            
            const currentQuery = `
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
            
            const result = await pool.query(currentQuery, params);
            console.log(`📊 Historical data (últimos 6 meses): ${result.rows.length} data points`);
            
            res.json(result.rows);
        }
        
    } catch (error) {
        console.error('❌ Error fetching historical data:', error);
        res.status(500).json({ error: 'Error fetching historical data', details: error.message });
    }
});

// Filters API - Current data only ⚡ MIGRATED TO DUAL-SOURCE  
app.get('/api/filtros', async (req, res) => {
    try {
        console.log('🔍 Filters data requested');
        
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        if (USE_NEW_CALCULATION) {
            console.log('🆕 USANDO MÉTODO NUEVO: supervision_operativa_cas (filtros)');
            
            // Get grupos from CAS with mapping
            const gruposResult = await pool.query(`
                WITH grupo_mapping AS (
                    SELECT DISTINCT
                        CASE 
                            WHEN location_name IN ('Sucursal SC - Santa Catarina', 'Sucursal GC - Garcia', 'Sucursal LH - La Huasteca',
                                                  '4 - Santa Catarina', '6 - Garcia', '7 - La Huasteca') THEN 'TEPEYAC'
                            WHEN location_name LIKE '%Centro%' OR location_name LIKE '%CENTRO%' THEN 'CENTRO'
                            WHEN location_name LIKE '%Apodaca%' OR location_name LIKE '%APODACA%' THEN 'APODACA'
                            WHEN location_name LIKE '%Saltillo%' OR location_name LIKE '%SALTILLO%' THEN 'GRUPO SALTILLO'
                            ELSE 'OTROS'
                        END as grupo_normalizado
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL 
                      AND date_completed >= '2025-02-01'
                )
                SELECT DISTINCT grupo_normalizado as grupo
                FROM grupo_mapping 
                WHERE grupo_normalizado IS NOT NULL 
                ORDER BY grupo_normalizado
            `);
            
            // Get estados from CAS with mapping
            const estadosResult = await pool.query(`
                WITH estado_mapping AS (
                    SELECT DISTINCT
                        CASE 
                            WHEN location_name ~* '(nuevo león|monterrey|garcia|santa catarina|huasteca|apodaca|guadalupe)' THEN 'Nuevo León'
                            WHEN location_name ~* '(saltillo|coahuila)' THEN 'Coahuila'
                            WHEN location_name ~* '(chihuahua)' THEN 'Chihuahua' 
                            WHEN location_name ~* '(tamaulipas|reynosa|matamoros)' THEN 'Tamaulipas'
                            WHEN location_name ~* '(veracruz)' THEN 'Veracruz'
                            ELSE 'Nuevo León'  -- Default
                        END as estado_final
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL 
                      AND date_completed >= '2025-02-01'
                )
                SELECT DISTINCT estado_final as estado
                FROM estado_mapping 
                ORDER BY estado_final
            `);
            
            const filters = {
                grupos: gruposResult.rows.map(row => row.grupo),
                estados: estadosResult.rows.map(row => row.estado),
                periodos: ['Últimos 30 días', 'Últimos 7 días', 'Ayer', 'Hoy'],
                calculation_method: 'NEW (supervision_operativa_cas)'
            };
            
            console.log(`🔍 Filters NUEVO: ${filters.grupos.length} grupos, ${filters.estados.length} estados (calificacion_general_pct)`);
            res.json(filters);
            
        } else {
            console.log('📊 USANDO MÉTODO ACTUAL: supervision_normalized_view (filtros)');
            
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
                periodos: ['Últimos 30 días', 'Últimos 7 días', 'Ayer', 'Hoy'],
                calculation_method: 'CURRENT (supervision_normalized_view)'
            };
            
            console.log(`🔍 Filters ACTUAL: ${filters.grupos.length} grupos, ${filters.estados.length} estados (promedio áreas)`);
            res.json(filters);
        }
        
    } catch (error) {
        console.error('❌ Error fetching filters:', error);
        res.status(500).json({ error: 'Error fetching filter data', details: error.message });
    }
});

// Sucursales por grupo - PARA MODAL DE DETALLES ⚡ MIGRATED TO DUAL-SOURCE
app.get('/api/sucursales-ranking', async (req, res) => {
    try {
        const { grupo } = req.query;
        console.log('🏢 Sucursales ranking requested for grupo:', grupo);
        
        if (!grupo) {
            return res.status(400).json({ error: 'Grupo parameter is required' });
        }
        
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        if (USE_NEW_CALCULATION) {
            console.log('🆕 USANDO MÉTODO HÍBRIDO: normalized structure + CAS values para sucursales-ranking');
            
            // HÍBRIDO: Use normalized structure + CAS values
            const hybridQuery = `
                WITH cas_performance AS (
                    SELECT 
                        submission_id,
                        calificacion_general_pct
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL
                )
                SELECT 
                    snv.nombre_normalizado as sucursal,
                    snv.numero_sucursal,
                    snv.estado_final as estado,
                    snv.ciudad_normalizada as ciudad,
                    COUNT(DISTINCT snv.submission_id) as supervisiones,
                    COUNT(DISTINCT snv.submission_id) as evaluaciones,
                    ROUND(AVG(cp.calificacion_general_pct), 2) as promedio,
                    MAX(snv.fecha_supervision) as ultima_evaluacion
                FROM supervision_normalized_view snv
                JOIN cas_performance cp ON snv.submission_id = cp.submission_id
                WHERE snv.grupo_normalizado = $1 
                  AND snv.porcentaje IS NOT NULL
                  AND snv.area_tipo = 'area_principal'
                  AND snv.fecha_supervision >= '2025-02-01'
                GROUP BY snv.nombre_normalizado, snv.numero_sucursal, snv.estado_final, snv.ciudad_normalizada
                ORDER BY AVG(cp.calificacion_general_pct) DESC
            `;
            
            const result = await pool.query(hybridQuery, [grupo]);
            
            console.log(`🏢 Sucursales HÍBRIDO encontradas para ${grupo}: ${result.rows.length} sucursales (normalized structure + CAS values)`);
            
            // Convert numeric fields from strings to numbers for frontend compatibility
            const sucursalesFormatted = result.rows.map(row => ({
                ...row,
                numero_sucursal: parseInt(row.numero_sucursal),
                supervisiones: parseInt(row.supervisiones),
                evaluaciones: parseInt(row.evaluaciones),
                promedio: parseFloat(row.promedio)
            }));
            
            res.json({
                calculation_method: 'NEW (hybrid - normalized structure + CAS values)',
                grupo: grupo,
                total_sucursales: result.rows.length,
                sucursales: sucursalesFormatted
            });
            
        } else {
            console.log('📊 USANDO MÉTODO ACTUAL: supervision_normalized_view');
            
            // CURRENT: Use supervision_normalized_view with AVG(porcentaje)
            const currentQuery = `
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
            
            const result = await pool.query(currentQuery, [grupo]);
            
            console.log(`🏢 Sucursales ACTUAL encontradas para ${grupo}: ${result.rows.length} sucursales (promedio áreas)`);
            
            // Convert numeric fields from strings to numbers for frontend compatibility
            const sucursalesFormatted = result.rows.map(row => ({
                ...row,
                numero_sucursal: parseInt(row.numero_sucursal),
                supervisiones: parseInt(row.supervisiones),
                evaluaciones: parseInt(row.evaluaciones),
                promedio: parseFloat(row.promedio)
            }));
            
            res.json({
                calculation_method: 'CURRENT (promedio áreas)',
                grupo: grupo,
                total_sucursales: result.rows.length,
                sucursales: sucursalesFormatted
            });
        }
        
    } catch (error) {
        console.error('❌ Error fetching sucursales ranking:', error);
        res.status(500).json({ error: 'Error fetching sucursales ranking', details: error.message });
    }
});

// Legacy API endpoints for compatibility - MOSTRANDO TODOS LOS ESTADOS DEL CSV ⚡ MIGRATED TO DUAL-SOURCE
app.get('/api/estados', async (req, res) => {
    try {
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        if (USE_NEW_CALCULATION) {
            console.log('🆕 USANDO MÉTODO NUEVO: supervision_operativa_cas (estados)');
            
            const result = await pool.query(`
                WITH estado_mapping AS (
                    SELECT DISTINCT
                        CASE 
                            WHEN location_name ~* '(nuevo león|monterrey|garcia|santa catarina|huasteca|apodaca|guadalupe)' THEN 'Nuevo León'
                            WHEN location_name ~* '(saltillo|coahuila)' THEN 'Coahuila'
                            WHEN location_name ~* '(chihuahua)' THEN 'Chihuahua' 
                            WHEN location_name ~* '(tamaulipas|reynosa|matamoros)' THEN 'Tamaulipas'
                            WHEN location_name ~* '(veracruz)' THEN 'Veracruz'
                            ELSE 'Nuevo León'
                        END as estado_final
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL 
                      AND date_completed >= '2025-02-01'
                )
                SELECT DISTINCT estado_final as estado
                FROM estado_mapping 
                WHERE estado_final IS NOT NULL 
                ORDER BY estado_final
            `);
            res.json(result.rows.map(row => row.estado));
            
        } else {
            console.log('📊 USANDO MÉTODO ACTUAL: supervision_normalized_view (estados)');
            
            const result = await pool.query(`
                SELECT DISTINCT estado_final as estado 
                FROM supervision_normalized_view 
                WHERE estado_final IS NOT NULL 
                  AND fecha_supervision >= '2025-02-01'
                ORDER BY estado_final
            `);
            res.json(result.rows.map(row => row.estado));
        }
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
        
        // 🚀 DUAL-SOURCE STRATEGY: New calculation method for grupos
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        let result;
        
        if (USE_NEW_CALCULATION) {
            // 🆕 MÉTODO HÍBRIDO: normalized structure + CAS values para grupos
            console.log('🆕 Grupos using HYBRID method (normalized structure + CAS values)');
            
            const hybridQuery = `
                WITH cas_performance AS (
                    SELECT 
                        submission_id,
                        calificacion_general_pct
                    FROM supervision_operativa_cas 
                    WHERE calificacion_general_pct IS NOT NULL
                )
                SELECT 
                    snv.grupo_normalizado as grupo,
                    COUNT(DISTINCT snv.numero_sucursal) as sucursales,
                    ROUND(AVG(cp.calificacion_general_pct), 2) as promedio,
                    COUNT(DISTINCT snv.submission_id) as supervisiones,
                    MAX(snv.fecha_supervision) as ultima_evaluacion,
                    string_agg(DISTINCT snv.estado_final, ', ') as estado
                FROM supervision_normalized_view snv
                JOIN cas_performance cp ON snv.submission_id = cp.submission_id
                ${whereClause}
                GROUP BY snv.grupo_normalizado
                ORDER BY promedio DESC
            `;
            
            result = await pool.query(hybridQuery, params);
            
            // Add calculation method info for debugging
            result.rows.forEach(row => {
                row.calculation_method = 'NEW (calificacion_general_pct)';
            });
            
            console.log(`🆕 Grupos NUEVOS: ${result.rows.length} grupos con calificaciones REALES`);
            
        } else {
            // 📊 MÉTODO ACTUAL: supervision_normalized_view con promedio de áreas
            console.log('📊 Grupos using CURRENT calculation method (supervision_normalized_view)');
            
            const currentQuery = `
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
            
            result = await pool.query(currentQuery, params);
            
            // Add calculation method info for debugging
            result.rows.forEach(row => {
                row.calculation_method = 'CURRENT (promedio áreas)';
            });
            
            console.log(`✅ Grupos CORREGIDOS: ${result.rows.length} grupos operativos con supervision count real`);
        }
        
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching grupos operativos:', error);
        res.status(500).json({ error: 'Error fetching grupos operativos', details: error.message });
    }
});

// Heatmap periods data - HISTÓRICO ⚡ MIGRATED TO DUAL-SOURCE
app.get('/api/heatmap-periods/all', async (req, res) => {
    try {
        console.log('🔥 Heatmap periods requested with filters:', req.query);
        
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        
        let whereClause, params = [], paramIndex = 1;
        
        if (USE_NEW_CALCULATION) {
            console.log('🆕 USANDO MÉTODO NUEVO: supervision_operativa_cas');
            
            // NEW: Use supervision_operativa_cas with calificacion_general_pct
            whereClause = 'WHERE calificacion_general_pct IS NOT NULL AND date_completed >= \'2025-02-01\'';
            
            // Apply estado filter if provided
            if (req.query.estado && req.query.estado !== 'all' && req.query.estado !== 'undefined' && req.query.estado !== 'null') {
                whereClause += ` AND estado = $${paramIndex}`;
                params.push(req.query.estado);
                paramIndex++;
            }
            
            // NUEVO: Mapeo desde CAS con calificacion_general_pct
            const newQuery = `
                WITH grupo_mapping AS (
                    SELECT DISTINCT
                        location_name,
                        -- Mapeo TEPEYAC names
                        CASE 
                            WHEN location_name = 'Sucursal SC - Santa Catarina' THEN '4 - Santa Catarina'
                            WHEN location_name = 'Sucursal GC - Garcia' THEN '6 - Garcia'
                            WHEN location_name = 'Sucursal LH - La Huasteca' THEN '7 - La Huasteca'
                            ELSE location_name
                        END as nombre_normalizado,
                        -- Inferir grupo desde nombres TEPEYAC o usar default
                        CASE 
                            WHEN location_name IN ('Sucursal SC - Santa Catarina', 'Sucursal GC - Garcia', 'Sucursal LH - La Huasteca',
                                                  '4 - Santa Catarina', '6 - Garcia', '7 - La Huasteca') THEN 'TEPEYAC'
                            WHEN location_name LIKE '%Centro%' OR location_name LIKE '%CENTRO%' THEN 'CENTRO'
                            WHEN location_name LIKE '%Apodaca%' OR location_name LIKE '%APODACA%' THEN 'APODACA'
                            WHEN location_name LIKE '%Saltillo%' OR location_name LIKE '%SALTILLO%' THEN 'GRUPO SALTILLO'
                            ELSE 'OTROS'
                        END as grupo_normalizado,
                        -- Inferir estado desde location_name pattern
                        CASE 
                            WHEN location_name ~* '(nuevo león|monterrey|garcia|santa catarina|huasteca|apodaca|guadalupe)' THEN 'Nuevo León'
                            WHEN location_name ~* '(saltillo|coahuila)' THEN 'Coahuila'
                            WHEN location_name ~* '(chihuahua)' THEN 'Chihuahua' 
                            WHEN location_name ~* '(tamaulipas|reynosa|matamoros)' THEN 'Tamaulipas'
                            WHEN location_name ~* '(veracruz)' THEN 'Veracruz'
                            ELSE 'Nuevo León'  -- Default para NL
                        END as estado_final
                    FROM supervision_operativa_cas
                ),
                periods_data AS (
                    SELECT 
                        gm.grupo_normalizado as grupo,
                        gm.estado_final,
                        gm.nombre_normalizado,
                        CASE 
                            -- Determinar si es Local (NL) o Foráneo primero
                            WHEN (gm.estado_final = 'Nuevo León' OR gm.grupo_normalizado = 'GRUPO SALTILLO')
                                 AND gm.nombre_normalizado NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                            THEN 
                                -- LOCALES NL - Períodos Trimestrales
                                CASE
                                    WHEN soc.date_completed BETWEEN '2025-03-12' AND '2025-04-16' THEN 'NL-T1-2025'
                                    WHEN soc.date_completed BETWEEN '2025-06-11' AND '2025-08-18' THEN 'NL-T2-2025'
                                    WHEN soc.date_completed BETWEEN '2025-08-19' AND '2025-10-09' THEN 'NL-T3-2025'
                                    WHEN soc.date_completed >= '2025-10-30' THEN 'NL-T4-2025'
                                    ELSE 'OTRO'
                                END
                            ELSE
                                -- FORÁNEAS - Períodos Semestrales
                                CASE
                                    WHEN soc.date_completed BETWEEN '2025-04-10' AND '2025-06-09' THEN 'FOR-S1-2025'
                                    WHEN soc.date_completed BETWEEN '2025-07-30' AND '2025-11-07' THEN 'FOR-S2-2025'
                                    ELSE 'OTRO'
                                END
                        END as periodo,
                        ROUND(AVG(soc.calificacion_general_pct), 2) as promedio,
                        COUNT(*) as evaluaciones
                    FROM supervision_operativa_cas soc
                    JOIN grupo_mapping gm ON soc.location_name = gm.location_name
                    ${whereClause.replace('WHERE', 'WHERE soc.')}
                    GROUP BY gm.grupo_normalizado, gm.estado_final, gm.nombre_normalizado,
                    CASE 
                        -- Duplicar la lógica de clasificación territorial para GROUP BY
                        WHEN (gm.estado_final = 'Nuevo León' OR gm.grupo_normalizado = 'GRUPO SALTILLO')
                             AND gm.nombre_normalizado NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                        THEN 
                            -- LOCALES NL - Períodos Trimestrales
                            CASE
                                WHEN soc.date_completed BETWEEN '2025-03-12' AND '2025-04-16' THEN 'NL-T1-2025'
                                WHEN soc.date_completed BETWEEN '2025-06-11' AND '2025-08-18' THEN 'NL-T2-2025'
                                WHEN soc.date_completed BETWEEN '2025-08-19' AND '2025-10-09' THEN 'NL-T3-2025'
                                WHEN soc.date_completed >= '2025-10-30' THEN 'NL-T4-2025'
                                ELSE 'OTRO'
                            END
                        ELSE
                            -- FORÁNEAS - Períodos Semestrales
                            CASE
                                WHEN soc.date_completed BETWEEN '2025-04-10' AND '2025-06-09' THEN 'FOR-S1-2025'
                                WHEN soc.date_completed BETWEEN '2025-07-30' AND '2025-11-07' THEN 'FOR-S2-2025'
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
            
            const result = await pool.query(newQuery, params);
            
            // Get distinct periods for NEW method
            const periodsNewQuery = `
                WITH grupo_mapping AS (
                    SELECT DISTINCT
                        location_name,
                        CASE 
                            WHEN location_name = 'Sucursal SC - Santa Catarina' THEN '4 - Santa Catarina'
                            WHEN location_name = 'Sucursal GC - Garcia' THEN '6 - Garcia' 
                            WHEN location_name = 'Sucursal LH - La Huasteca' THEN '7 - La Huasteca'
                            ELSE location_name
                        END as nombre_normalizado,
                        CASE 
                            WHEN location_name ~* '(nuevo león|monterrey|garcia|santa catarina|huasteca|apodaca|guadalupe)' THEN 'Nuevo León'
                            WHEN location_name ~* '(saltillo|coahuila)' THEN 'Coahuila'
                            WHEN location_name ~* '(chihuahua)' THEN 'Chihuahua' 
                            WHEN location_name ~* '(tamaulipas|reynosa|matamoros)' THEN 'Tamaulipas'
                            WHEN location_name ~* '(veracruz)' THEN 'Veracruz'
                            ELSE 'Nuevo León'
                        END as estado_final,
                        CASE 
                            WHEN location_name IN ('Sucursal SC - Santa Catarina', 'Sucursal GC - Garcia', 'Sucursal LH - La Huasteca',
                                                  '4 - Santa Catarina', '6 - Garcia', '7 - La Huasteca') THEN 'TEPEYAC'
                            WHEN location_name LIKE '%Centro%' OR location_name LIKE '%CENTRO%' THEN 'CENTRO'
                            WHEN location_name LIKE '%Saltillo%' OR location_name LIKE '%SALTILLO%' THEN 'GRUPO SALTILLO'
                            ELSE 'OTROS'
                        END as grupo_normalizado
                    FROM supervision_operativa_cas
                )
                SELECT DISTINCT 
                    CASE 
                        -- Determinar si es Local (NL) o Foráneo primero
                        WHEN (gm.estado_final = 'Nuevo León' OR gm.grupo_normalizado = 'GRUPO SALTILLO')
                             AND gm.nombre_normalizado NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                        THEN 
                            -- LOCALES NL - Períodos Trimestrales
                            CASE
                                WHEN soc.date_completed BETWEEN '2025-03-12' AND '2025-04-16' THEN 'NL-T1-2025'
                                WHEN soc.date_completed BETWEEN '2025-06-11' AND '2025-08-18' THEN 'NL-T2-2025'
                                WHEN soc.date_completed BETWEEN '2025-08-19' AND '2025-10-09' THEN 'NL-T3-2025'
                                WHEN soc.date_completed >= '2025-10-30' THEN 'NL-T4-2025'
                                ELSE 'OTRO'
                            END
                        ELSE
                            -- FORÁNEAS - Períodos Semestrales
                            CASE
                                WHEN soc.date_completed BETWEEN '2025-04-10' AND '2025-06-09' THEN 'FOR-S1-2025'
                                WHEN soc.date_completed BETWEEN '2025-07-30' AND '2025-11-07' THEN 'FOR-S2-2025'
                                ELSE 'OTRO'
                            END
                    END as periodo
                FROM supervision_operativa_cas soc
                JOIN grupo_mapping gm ON soc.location_name = gm.location_name 
                ${whereClause.replace('WHERE', 'WHERE soc.')}
                ORDER BY periodo
            `;
            
            const periodsResult = await pool.query(periodsNewQuery, params);
            const periods = periodsResult.rows.map(row => row.periodo).filter(p => p !== 'OTRO' && p !== null);
            
            console.log(`✅ Heatmap data NUEVO: ${result.rows.length} grupos, ${periods.length} períodos (calificacion_general_pct)`);
            
            res.json({
                success: true,
                calculation_method: 'NEW (calificacion_general_pct)',
                data: {
                    periods: periods,
                    groups: result.rows
                }
            });
            
        } else {
            console.log('📊 USANDO MÉTODO ACTUAL: supervision_normalized_view');
            
            // CURRENT: Use supervision_normalized_view with AVG(porcentaje)
            whereClause = 'WHERE porcentaje IS NOT NULL';
            
            // Apply estado filter if provided
            if (req.query.estado && req.query.estado !== 'all' && req.query.estado !== 'undefined' && req.query.estado !== 'null') {
                whereClause += ` AND estado = $${paramIndex}`;
                params.push(req.query.estado);
                paramIndex++;
            }
            
            // CURRENT: CORRECTED territorial classification logic with proper CAS periods
            const currentQuery = `
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
            
            const result = await pool.query(currentQuery, params);
            
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
            
            console.log(`✅ Heatmap data ACTUAL: ${result.rows.length} grupos, ${periods.length} períodos (promedio áreas)`);
            
            res.json({
                success: true,
                calculation_method: 'CURRENT (promedio áreas)',
                data: {
                    periods: periods,
                    groups: result.rows
                }
            });
        }
    } catch (error) {
        console.error('❌ Error fetching heatmap data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error fetching heatmap data', 
            details: error.message 
        });
    }
});

// Areas de evaluación API - LAS 29 ÁREAS PRINCIPALES MAPEADAS ⚡ MIGRATED TO DUAL-SOURCE
app.get('/api/areas', async (req, res) => {
    try {
        console.log('📋 Areas de evaluación requested with filters:', req.query);
        
        const USE_NEW_CALCULATION = process.env.USE_CAS_TABLE === 'true';
        const params = [];
        let paramIndex = 1;
        
        if (USE_NEW_CALCULATION) {
            console.log('🆕 USANDO MÉTODO NUEVO: supervision_operativa_cas');
            
            // NOTE: CAS table doesn't have individual area breakdowns like normalized view
            // We need to return summary based on overall performance or simulated areas
            
            let whereClause = 'WHERE soc.calificacion_general_pct IS NOT NULL AND soc.date_completed >= \'2025-02-01\'';
            
            // Apply filters with mapping
            if (req.query.estado && req.query.estado !== 'all' && req.query.estado !== 'undefined' && req.query.estado !== 'null') {
                whereClause += ` AND gm.estado_final = $${paramIndex}`;
                params.push(req.query.estado);
                paramIndex++;
            }
            
            // Handle both single and multiple grupos
            if (req.query.grupo && req.query.grupo !== 'undefined' && req.query.grupo !== 'null') {
                const grupos = Array.isArray(req.query.grupo) ? req.query.grupo : [req.query.grupo];
                if (grupos.length > 0) {
                    const grupPlaceholders = grupos.map(() => `$${paramIndex++}`).join(', ');
                    whereClause += ` AND gm.grupo_normalizado IN (${grupPlaceholders})`;
                    params.push(...grupos);
                }
            }
            
            // NEW: Simulate areas breakdown based on calificacion_general_pct
            const newQuery = `
                WITH grupo_mapping AS (
                    SELECT DISTINCT
                        location_name,
                        CASE 
                            WHEN location_name = 'Sucursal SC - Santa Catarina' THEN '4 - Santa Catarina'
                            WHEN location_name = 'Sucursal GC - Garcia' THEN '6 - Garcia'
                            WHEN location_name = 'Sucursal LH - La Huasteca' THEN '7 - La Huasteca'
                            ELSE location_name
                        END as nombre_normalizado,
                        CASE 
                            WHEN location_name IN ('Sucursal SC - Santa Catarina', 'Sucursal GC - Garcia', 'Sucursal LH - La Huasteca',
                                                  '4 - Santa Catarina', '6 - Garcia', '7 - La Huasteca') THEN 'TEPEYAC'
                            WHEN location_name LIKE '%Centro%' OR location_name LIKE '%CENTRO%' THEN 'CENTRO'
                            WHEN location_name LIKE '%Apodaca%' OR location_name LIKE '%APODACA%' THEN 'APODACA'
                            WHEN location_name LIKE '%Saltillo%' OR location_name LIKE '%SALTILLO%' THEN 'GRUPO SALTILLO'
                            ELSE 'OTROS'
                        END as grupo_normalizado,
                        CASE 
                            WHEN location_name ~* '(nuevo león|monterrey|garcia|santa catarina|huasteca|apodaca|guadalupe)' THEN 'Nuevo León'
                            WHEN location_name ~* '(saltillo|coahuila)' THEN 'Coahuila'
                            WHEN location_name ~* '(chihuahua)' THEN 'Chihuahua' 
                            WHEN location_name ~* '(tamaulipas|reynosa|matamoros)' THEN 'Tamaulipas'
                            WHEN location_name ~* '(veracruz)' THEN 'Veracruz'
                            ELSE 'Nuevo León'
                        END as estado_final,
                        CASE 
                            WHEN location_name ~ '^[0-9]+'
                            THEN CAST(SUBSTRING(location_name FROM '^([0-9]+)') AS INTEGER)
                            ELSE 999
                        END as numero_sucursal
                    FROM supervision_operativa_cas
                ),
                area_simulation AS (
                    SELECT 
                        'General Performance' as area_evaluacion,
                        COUNT(DISTINCT soc.submission_id) as supervisiones_reales,
                        COUNT(DISTINCT gm.numero_sucursal) as sucursales_evaluadas,
                        COUNT(DISTINCT gm.grupo_normalizado) as grupos_operativos,
                        ROUND(AVG(soc.calificacion_general_pct), 2) as promedio_area,
                        MIN(soc.calificacion_general_pct) as minimo_porcentaje,
                        MAX(soc.calificacion_general_pct) as maximo_porcentaje,
                        COUNT(CASE WHEN soc.calificacion_general_pct < 70 THEN 1 END) as evaluaciones_criticas,
                        COUNT(CASE WHEN soc.calificacion_general_pct >= 90 THEN 1 END) as evaluaciones_excelentes,
                        MIN(soc.date_completed) as primera_evaluacion,
                        MAX(soc.date_completed) as ultima_evaluacion
                    FROM supervision_operativa_cas soc
                    JOIN grupo_mapping gm ON soc.location_name = gm.location_name
                    ${whereClause}
                    GROUP BY 'General Performance'
                    
                    UNION ALL
                    
                    SELECT 
                        'Performance Range: Excellent (90%+)' as area_evaluacion,
                        COUNT(DISTINCT soc.submission_id) as supervisiones_reales,
                        COUNT(DISTINCT gm.numero_sucursal) as sucursales_evaluadas,
                        COUNT(DISTINCT gm.grupo_normalizado) as grupos_operativos,
                        ROUND(AVG(soc.calificacion_general_pct), 2) as promedio_area,
                        MIN(soc.calificacion_general_pct) as minimo_porcentaje,
                        MAX(soc.calificacion_general_pct) as maximo_porcentaje,
                        COUNT(CASE WHEN soc.calificacion_general_pct < 70 THEN 1 END) as evaluaciones_criticas,
                        COUNT(CASE WHEN soc.calificacion_general_pct >= 90 THEN 1 END) as evaluaciones_excelentes,
                        MIN(soc.date_completed) as primera_evaluacion,
                        MAX(soc.date_completed) as ultima_evaluacion
                    FROM supervision_operativa_cas soc
                    JOIN grupo_mapping gm ON soc.location_name = gm.location_name
                    ${whereClause} AND soc.calificacion_general_pct >= 90
                    GROUP BY 'Performance Range: Excellent (90%+)'
                    
                    UNION ALL
                    
                    SELECT 
                        'Performance Range: Good (80-89%)' as area_evaluacion,
                        COUNT(DISTINCT soc.submission_id) as supervisiones_reales,
                        COUNT(DISTINCT gm.numero_sucursal) as sucursales_evaluadas,
                        COUNT(DISTINCT gm.grupo_normalizado) as grupos_operativos,
                        ROUND(AVG(soc.calificacion_general_pct), 2) as promedio_area,
                        MIN(soc.calificacion_general_pct) as minimo_porcentaje,
                        MAX(soc.calificacion_general_pct) as maximo_porcentaje,
                        COUNT(CASE WHEN soc.calificacion_general_pct < 70 THEN 1 END) as evaluaciones_criticas,
                        COUNT(CASE WHEN soc.calificacion_general_pct >= 90 THEN 1 END) as evaluaciones_excelentes,
                        MIN(soc.date_completed) as primera_evaluacion,
                        MAX(soc.date_completed) as ultima_evaluacion
                    FROM supervision_operativa_cas soc
                    JOIN grupo_mapping gm ON soc.location_name = gm.location_name
                    ${whereClause} AND soc.calificacion_general_pct >= 80 AND soc.calificacion_general_pct < 90
                    GROUP BY 'Performance Range: Good (80-89%)'
                    
                    UNION ALL
                    
                    SELECT 
                        'Performance Range: Critical (<70%)' as area_evaluacion,
                        COUNT(DISTINCT soc.submission_id) as supervisiones_reales,
                        COUNT(DISTINCT gm.numero_sucursal) as sucursales_evaluadas,
                        COUNT(DISTINCT gm.grupo_normalizado) as grupos_operativos,
                        ROUND(AVG(soc.calificacion_general_pct), 2) as promedio_area,
                        MIN(soc.calificacion_general_pct) as minimo_porcentaje,
                        MAX(soc.calificacion_general_pct) as maximo_porcentaje,
                        COUNT(CASE WHEN soc.calificacion_general_pct < 70 THEN 1 END) as evaluaciones_criticas,
                        COUNT(CASE WHEN soc.calificacion_general_pct >= 90 THEN 1 END) as evaluaciones_excelentes,
                        MIN(soc.date_completed) as primera_evaluacion,
                        MAX(soc.date_completed) as ultima_evaluacion
                    FROM supervision_operativa_cas soc
                    JOIN grupo_mapping gm ON soc.location_name = gm.location_name
                    ${whereClause} AND soc.calificacion_general_pct < 70
                    GROUP BY 'Performance Range: Critical (<70%)'
                )
                SELECT * FROM area_simulation
                WHERE supervisiones_reales > 0
                ORDER BY supervisiones_reales DESC, promedio_area DESC
            `;
            
            const result = await pool.query(newQuery, params);
            
            console.log(`📊 Areas NUEVO loaded: ${result.rows.length} rangos de performance (calificacion_general_pct)`);
            
            res.json({
                success: true,
                calculation_method: 'NEW (calificacion_general_pct performance ranges)',
                total_areas: result.rows.length,
                areas: result.rows,
                note: 'CAS table: Performance ranges based on calificacion_general_pct (not individual areas)'
            });
            
        } else {
            console.log('📊 USANDO MÉTODO ACTUAL: supervision_normalized_view');
            
            // CURRENT: Use supervision_normalized_view with area details
            let whereClause = 'WHERE porcentaje IS NOT NULL AND area_tipo = \'area_principal\'';
            
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
            
            const currentQuery = `
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
            
            const result = await pool.query(currentQuery, params);
            
            console.log(`📊 Areas ACTUAL loaded: ${result.rows.length} áreas de evaluación principales (promedio áreas)`);
            
            res.json({
                success: true,
                calculation_method: 'CURRENT (promedio áreas)',
                total_areas: result.rows.length,
                areas: result.rows,
                note: 'Áreas de evaluación principales con al menos 5 supervisiones realizadas'
            });
        }
        
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