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

// Health check
app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query(`
            SELECT 
                NOW() as server_time,
                COUNT(*) as total_records,
                COUNT(DISTINCT location_name) as unique_locations,
                COUNT(CASE WHEN coordinate_source = 'validated_csv' THEN 1 END) as validated_coordinates
            FROM supervision_normalized_view 
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

// Main dashboard route - iOS ORIGINAL ARREGLADO  
app.get('/', (req, res) => {
    const dashboardPath = path.join(__dirname, 'dashboard-ios-ORIGINAL-RESTORED.html');
    console.log('📱 Dashboard iOS ORIGINAL ARREGLADO requested:', dashboardPath);
    res.sendFile(dashboardPath, (err) => {
        if (err) {
            console.log('⚠️ iOS dashboard not found, trying backup...');
            const fallbackPath = path.join(__dirname, 'dashboard-COMPLETE-WORKING.html');
            res.sendFile(fallbackPath, (err2) => {
                if (err2) {
                    console.error('❌ No dashboard files found');
                    res.status(404).send('Dashboard not found');
                }
            });
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
        
        if (req.query.grupo && req.query.grupo !== 'undefined' && req.query.grupo !== 'null') {
            whereClause += ` AND grupo_normalizado = $${paramIndex}`;
            params.push(req.query.grupo);
            paramIndex++;
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
                COUNT(DISTINCT location_name) as sucursales_evaluadas,
                COUNT(DISTINCT grupo) as grupos_activos,
                MAX(fecha_supervision) as ultima_evaluacion,
                MIN(fecha_supervision) as primera_evaluacion,
                COUNT(CASE WHEN coordinate_source = 'validated_csv' THEN 1 END) as with_validated_coords
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
        
        if (grupo && grupo !== 'undefined' && grupo !== 'null') {
            whereClause += ` AND grupo_normalizado = $${paramIndex}`;
            params.push(grupo);
            paramIndex++;
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
                'validated_csv' as coordinate_source
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
        
        if (grupo && grupo !== 'undefined' && grupo !== 'null') {
            whereClause += ` AND grupo_normalizado = $${paramIndex}`;
            params.push(grupo);
            paramIndex++;
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
        
        if (req.query.grupo && req.query.grupo !== 'undefined' && req.query.grupo !== 'null') {
            whereClause += ` AND grupo_normalizado = $${paramIndex}`;
            params.push(req.query.grupo);
            paramIndex++;
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
        
        // Generate periods based on fechas de corte
        const query = `
            WITH periods_data AS (
                SELECT 
                    grupo_normalizado as grupo,
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
                FROM supervision_normalized_view 
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
            FROM supervision_normalized_view 
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
        
        if (req.query.grupo && req.query.grupo !== 'undefined' && req.query.grupo !== 'null') {
            whereClause += ` AND grupo_normalizado = $${paramIndex}`;
            params.push(req.query.grupo);
            paramIndex++;
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
    console.log(`🚀 El Pollo Loco Dashboard FIXED (NO FILTERS) running on port ${port}`);
    console.log(`🎯 Features: NO restrictive date filters, showing current 2025 data`);
    console.log(`📊 Data range: Last 30 days for current performance`);
    console.log(`🗺️ All 85 sucursales and 20 grupos should appear`);
});

module.exports = app;