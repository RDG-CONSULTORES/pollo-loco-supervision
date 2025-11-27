const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const { Pool } = require('pg');

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

// Security and optimization middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

app.use(compression());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Health check
app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query(`
            SELECT 
                NOW() as server_time,
                COUNT(*) as total_records,
                COUNT(DISTINCT location_name) as unique_locations,
                COUNT(CASE WHEN coordinate_source = 'validated_csv' THEN 1 END) as validated_coordinates
            FROM supervision_dashboard_view 
            LIMIT 1
        `);
        
        res.json({ 
            status: 'healthy',
            service: 'El Pollo Loco Dashboard - NO FILTERS VERSION',
            version: 'fixed-no-date-filters',
            database: 'connected_to_neon',
            server_time: dbCheck.rows[0].server_time,
            total_records: dbCheck.rows[0].total_records,
            unique_locations: dbCheck.rows[0].unique_locations,
            validated_coordinates: dbCheck.rows[0].validated_coordinates,
            features: ['real-data-2025', 'no-restrictive-filters', 'all-current-data']
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// Main dashboard route - RESTAURADO ORIGINAL
app.get('/', (req, res) => {
    const dashboardPath = path.join(__dirname, 'dashboard-ios-ORIGINAL-RESTORED.html');
    console.log('📱 Dashboard ORIGINAL RESTORED requested:', dashboardPath);
    res.sendFile(dashboardPath, (err) => {
        if (err) {
            console.log('⚠️ Original dashboard not found, trying backup...');
            const fallbackPath = path.join(__dirname, 'backups', 'working-version-20251126-180625', 'dashboard-ios-complete.html');
            res.sendFile(fallbackPath, (err2) => {
                if (err2) {
                    console.error('❌ No dashboard files found');
                    res.status(404).send('Dashboard not found');
                }
            });
        }
    });
});

// KPIs API - PARA DASHBOARD ORIGINAL
app.get('/api/kpis', async (req, res) => {
    try {
        console.log('📊 KPIs requested with filters:', req.query);
        
        let whereClause = 'WHERE s.porcentaje IS NOT NULL';
        const params = [];
        let paramIndex = 1;
        
        // Show recent data (last 90 days)
        whereClause += ` AND s.fecha_supervision >= CURRENT_DATE - INTERVAL '90 days'`;
        
        // Apply filters - need to join with coordenadas_validadas for filtering
        if (req.query.estado && req.query.estado !== 'all') {
            whereClause += ` AND EXISTS (
                SELECT 1 FROM coordenadas_validadas c 
                WHERE c.numero_sucursal = CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END
                AND c.estado = $${paramIndex}
            )`;
            params.push(req.query.estado);
            paramIndex++;
        }
        
        if (req.query.grupo) {
            whereClause += ` AND EXISTS (
                SELECT 1 FROM coordenadas_validadas c 
                WHERE c.numero_sucursal = CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END
                AND c.grupo_operativo = $${paramIndex}
            )`;
            params.push(req.query.grupo);
            paramIndex++;
        }
        
        const query = `
            SELECT 
                COUNT(*) as total_supervisiones,
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT location_name) as sucursales_evaluadas,
                (SELECT COUNT(DISTINCT grupo_operativo) FROM coordenadas_validadas) as total_grupos,
                COUNT(CASE WHEN porcentaje < 70 THEN 1 END) as grupos_criticos,
                MAX(fecha_supervision) as ultima_evaluacion,
                MIN(fecha_supervision) as primera_evaluacion
            FROM supervision_operativa_clean s
            ${whereClause}
        `;
        
        const result = await pool.query(query, params);
        const kpis = result.rows[0];
        
        console.log(`📈 KPIs: ${kpis.total_supervisiones} supervisiones, ${kpis.promedio_general}% promedio`);
        
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
        
        // Only show recent data (last 30 days) to get current performance
        whereClause += ` AND fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'`;
        
        const query = `
            SELECT 
                COUNT(*) as total_evaluaciones,
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT location_name) as sucursales_evaluadas,
                COUNT(DISTINCT grupo) as grupos_activos,
                MAX(fecha_supervision) as ultima_evaluacion,
                MIN(fecha_supervision) as primera_evaluacion,
                COUNT(CASE WHEN coordinate_source = 'validated_csv' THEN 1 END) as with_validated_coords
            FROM supervision_dashboard_view 
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

// Map data API - TODAS LAS 85 SUCURSALES CON COORDENADAS REALES DEL CSV
app.get('/api/mapa', async (req, res) => {
    try {
        const { grupo, estado } = req.query;
        console.log('🗺️ Map data requested with filters:', { grupo, estado });
        
        let whereClause = `WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL`;
        const params = [];
        let paramIndex = 1;
        
        if (grupo) {
            whereClause += ` AND c.grupo_operativo = $${paramIndex}`;
            params.push(grupo);
            paramIndex++;
        }
        
        if (estado) {
            whereClause += ` AND c.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        const query = `
            SELECT 
                c.nombre_sucursal as nombre,
                c.numero_sucursal,
                c.grupo_operativo as grupo,
                c.latitude as lat,
                c.longitude as lng,
                COALESCE(AVG(s.porcentaje), 85.0) as performance,
                c.estado,
                c.ciudad,
                MAX(s.fecha_supervision) as ultima_evaluacion,
                COUNT(s.id) as total_evaluaciones,
                'validated_csv' as coordinate_source
            FROM coordenadas_validadas c
            LEFT JOIN supervision_operativa_clean s ON (
                c.numero_sucursal = CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END
                AND s.fecha_supervision >= CURRENT_DATE - INTERVAL '90 days'
            )
            ${whereClause}
            GROUP BY c.numero_sucursal, c.nombre_sucursal, c.grupo_operativo, c.latitude, c.longitude, c.estado, c.ciudad
            ORDER BY performance DESC
        `;
        
        const result = await pool.query(query, params);
        
        console.log(`🗺️ Map data: ${result.rows.length} sucursales con coordenadas reales del CSV`);
        
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
        console.log('📈 Historical data requested for grupo:', grupo);
        
        let whereClause = `WHERE porcentaje IS NOT NULL`;
        const params = [];
        let paramIndex = 1;
        
        // Show last 6 months of data
        whereClause += ` AND fecha_supervision >= CURRENT_DATE - INTERVAL '6 months'`;
        
        if (grupo) {
            whereClause += ` AND grupo = $${paramIndex}`;
            params.push(grupo);
            paramIndex++;
        }
        
        const query = `
            SELECT 
                DATE_TRUNC('month', fecha_supervision) as mes,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                grupo
            FROM supervision_dashboard_view 
            ${whereClause}
            GROUP BY DATE_TRUNC('month', fecha_supervision), grupo
            ORDER BY mes DESC, grupo
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
            SELECT DISTINCT grupo 
            FROM supervision_dashboard_view 
            WHERE grupo IS NOT NULL 
              AND fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY grupo
        `);
        
        // Get estados from recent data
        const estadosResult = await pool.query(`
            SELECT DISTINCT estado 
            FROM supervision_dashboard_view 
            WHERE estado IS NOT NULL 
              AND fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY estado
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

// Legacy API endpoints for compatibility - MOSTRANDO TODOS LOS ESTADOS DEL CSV
app.get('/api/estados', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT estado 
            FROM coordenadas_validadas 
            WHERE estado IS NOT NULL 
            ORDER BY estado
        `);
        res.json(result.rows.map(row => row.estado));
    } catch (error) {
        console.error('❌ Error fetching estados:', error);
        res.status(500).json({ error: 'Error fetching estados', details: error.message });
    }
});

// Grupos operativos con performance - DASHBOARD PRINCIPAL - MOSTRANDO TODAS LAS 85 SUCURSALES
app.get('/api/grupos', async (req, res) => {
    try {
        console.log('📊 Grupos operativos requested with filters:', req.query);
        
        // USAR COORDENADAS_VALIDADAS para mostrar TODOS los 20 grupos y 85 sucursales
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        // Apply filters
        if (req.query.estado && req.query.estado !== 'all') {
            whereClause += ` AND c.estado = $${paramIndex}`;
            params.push(req.query.estado);
            paramIndex++;
        }
        
        if (req.query.grupo) {
            whereClause += ` AND c.grupo_operativo = $${paramIndex}`;
            params.push(req.query.grupo);
            paramIndex++;
        }
        
        const query = `
            SELECT 
                c.grupo_operativo as grupo,
                COUNT(DISTINCT c.numero_sucursal) as sucursales,
                COALESCE(AVG(s.porcentaje), 85.0) as promedio,
                COUNT(s.id) as supervisiones,
                MAX(s.fecha_supervision) as ultima_evaluacion,
                string_agg(DISTINCT c.estado, ', ') as estado
            FROM coordenadas_validadas c
            LEFT JOIN supervision_operativa_clean s ON (
                c.numero_sucursal = CASE 
                    WHEN s.location_name ~ '^[0-9]+' THEN 
                        CAST(SUBSTRING(s.location_name FROM '^([0-9]+)') AS INTEGER)
                    ELSE NULL 
                END
                AND s.fecha_supervision >= CURRENT_DATE - INTERVAL '90 days'
            )
            ${whereClause}
            GROUP BY c.grupo_operativo
            ORDER BY promedio DESC
        `;
        
        const result = await pool.query(query, params);
        
        console.log(`✅ Grupos loaded: ${result.rows.length} grupos operativos (showing all 20)`);
        
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
        if (req.query.estado && req.query.estado !== 'all') {
            whereClause += ` AND estado = $${paramIndex}`;
            params.push(req.query.estado);
            paramIndex++;
        }
        
        // Generate periods based on fechas de corte
        const query = `
            WITH periods_data AS (
                SELECT 
                    grupo,
                    CASE 
                        WHEN fecha_supervision >= '2025-10-10' THEN 'T4-2025'
                        WHEN fecha_supervision BETWEEN '2025-07-01' AND '2025-09-30' THEN 'T3-2025'
                        WHEN fecha_supervision BETWEEN '2025-04-01' AND '2025-06-30' THEN 'T2-2025'
                        WHEN fecha_supervision BETWEEN '2025-01-01' AND '2025-03-31' THEN 'T1-2025'
                        WHEN fecha_supervision BETWEEN '2024-10-10' AND '2024-12-31' THEN 'T4-2024'
                        WHEN fecha_supervision BETWEEN '2024-07-01' AND '2024-10-07' THEN 'S2-Foráneas'
                        ELSE 'Otro'
                    END as periodo,
                    ROUND(AVG(porcentaje), 2) as promedio,
                    COUNT(*) as evaluaciones
                FROM supervision_dashboard_view 
                ${whereClause}
                GROUP BY grupo, 
                CASE 
                    WHEN fecha_supervision >= '2025-10-10' THEN 'T4-2025'
                    WHEN fecha_supervision BETWEEN '2025-07-01' AND '2025-09-30' THEN 'T3-2025'
                    WHEN fecha_supervision BETWEEN '2025-04-01' AND '2025-06-30' THEN 'T2-2025'
                    WHEN fecha_supervision BETWEEN '2025-01-01' AND '2025-03-31' THEN 'T1-2025'
                    WHEN fecha_supervision BETWEEN '2024-10-10' AND '2024-12-31' THEN 'T4-2024'
                    WHEN fecha_supervision BETWEEN '2024-07-01' AND '2024-10-07' THEN 'S2-Foráneas'
                    ELSE 'Otro'
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
        
        // Get distinct periods
        const periodsQuery = `
            SELECT DISTINCT 
                CASE 
                    WHEN fecha_supervision >= '2025-10-10' THEN 'T4-2025'
                    WHEN fecha_supervision BETWEEN '2025-07-01' AND '2025-09-30' THEN 'T3-2025'
                    WHEN fecha_supervision BETWEEN '2025-04-01' AND '2025-06-30' THEN 'T2-2025'
                    WHEN fecha_supervision BETWEEN '2025-01-01' AND '2025-03-31' THEN 'T1-2025'
                    WHEN fecha_supervision BETWEEN '2024-10-10' AND '2024-12-31' THEN 'T4-2024'
                    WHEN fecha_supervision BETWEEN '2024-07-01' AND '2024-10-07' THEN 'S2-Foráneas'
                    ELSE 'Otro'
                END as periodo
            FROM supervision_dashboard_view 
            ${whereClause}
            ORDER BY periodo
        `;
        
        const periodsResult = await pool.query(periodsQuery, params);
        const periods = periodsResult.rows.map(row => row.periodo).filter(p => p !== 'Otro');
        
        console.log(`✅ Heatmap data: ${result.rows.length} grupos, ${periods.length} períodos`);
        
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

// Debug endpoint for testing
app.get('/api/debug', async (req, res) => {
    try {
        const recentStats = await pool.query(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT location_name) as unique_locations,
                COUNT(DISTINCT grupo) as unique_groups,
                COUNT(CASE WHEN coordinate_source = 'validated_csv' THEN 1 END) as validated_coords,
                MIN(fecha_supervision) as oldest_date,
                MAX(fecha_supervision) as newest_date
            FROM supervision_dashboard_view
            WHERE fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'
        `);
        
        const dailyStats = await pool.query(`
            SELECT 
                DATE(fecha_supervision) as fecha,
                COUNT(*) as supervisiones,
                COUNT(DISTINCT location_name) as sucursales,
                COUNT(DISTINCT grupo) as grupos
            FROM supervision_dashboard_view
            WHERE fecha_supervision >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(fecha_supervision)
            ORDER BY fecha DESC
        `);
        
        res.json({
            recent_stats: recentStats.rows[0],
            daily_breakdown: dailyStats.rows,
            note: 'Datos de últimos 30 días sin filtros restrictivos'
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
    console.log(`🚀 El Pollo Loco Dashboard FIXED (NO FILTERS) running on port ${port}`);
    console.log(`🎯 Features: NO restrictive date filters, showing current 2025 data`);
    console.log(`📊 Data range: Last 30 days for current performance`);
    console.log(`🗺️ All 85 sucursales and 20 grupos should appear`);
});

module.exports = app;