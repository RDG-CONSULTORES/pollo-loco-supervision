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

// Main dashboard route
app.get('/', (req, res) => {
    const dashboardPath = path.join(__dirname, 'dashboard-v2-ios.html');
    console.log('📱 Dashboard requested:', dashboardPath);
    res.sendFile(dashboardPath, (err) => {
        if (err) {
            console.log('⚠️ V2 dashboard not found, serving from public/');
            const fallbackPath = path.join(__dirname, 'public', 'dashboard-ios-complete.html');
            res.sendFile(fallbackPath);
        }
    });
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

// Map data API - NO RESTRICTIVE FILTERS
app.get('/api/mapa', async (req, res) => {
    try {
        const { grupo, estado } = req.query;
        console.log('🗺️ Map data requested with filters:', { grupo, estado });
        
        let whereClause = `WHERE lat IS NOT NULL AND lng IS NOT NULL AND porcentaje IS NOT NULL`;
        const params = [];
        let paramIndex = 1;
        
        // Show recent data (last 30 days)
        whereClause += ` AND fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'`;
        
        if (grupo) {
            whereClause += ` AND grupo = $${paramIndex}`;
            params.push(grupo);
            paramIndex++;
        }
        
        if (estado) {
            whereClause += ` AND estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        const query = `
            SELECT 
                COALESCE(nombre_estandarizado, location_name) as nombre,
                numero_sucursal,
                grupo,
                lat,
                lng,
                ROUND(AVG(porcentaje), 2) as performance,
                estado,
                COALESCE(ciudad_validada, municipio) as ciudad,
                MAX(fecha_supervision) as ultima_evaluacion,
                COUNT(*) as total_evaluaciones,
                coordinate_source
            FROM supervision_dashboard_view 
            ${whereClause}
            GROUP BY COALESCE(nombre_estandarizado, location_name), numero_sucursal, grupo, lat, lng, estado, COALESCE(ciudad_validada, municipio), coordinate_source
            ORDER BY performance DESC
        `;
        
        const result = await pool.query(query, params);
        
        console.log(`🗺️ Map data (últimos 30 días): ${result.rows.length} locations`);
        console.log(`✅ Validated coords: ${result.rows.filter(r => r.coordinate_source === 'validated_csv').length}`);
        
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

// Legacy API endpoints for compatibility
app.get('/api/estados', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT estado 
            FROM supervision_dashboard_view 
            WHERE estado IS NOT NULL 
              AND fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY estado
        `);
        res.json(result.rows.map(row => row.estado));
    } catch (error) {
        console.error('❌ Error fetching estados:', error);
        res.status(500).json({ error: 'Error fetching estados', details: error.message });
    }
});

app.get('/api/grupos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT grupo 
            FROM supervision_dashboard_view 
            WHERE grupo IS NOT NULL 
              AND fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY grupo
        `);
        res.json(result.rows.map(row => row.grupo));
    } catch (error) {
        console.error('❌ Error fetching grupos:', error);
        res.status(500).json({ error: 'Error fetching grupos', details: error.message });
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