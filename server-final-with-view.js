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
console.log('🔗 Database connection:');
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
            service: 'El Pollo Loco Dashboard - Final Version',
            version: 'final-with-view',
            database: 'connected_to_neon',
            server_time: dbCheck.rows[0].server_time,
            total_records: dbCheck.rows[0].total_records,
            unique_locations: dbCheck.rows[0].unique_locations,
            validated_coordinates: dbCheck.rows[0].validated_coordinates,
            features: ['real-data', 'validated-coordinates', 'clean-view', 'periods-t4-s2']
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

// Performance Overview API - Clean and simple
app.get('/api/performance/overview', async (req, res) => {
    try {
        console.log('📊 Performance overview requested');
        
        // Current period logic
        const now = new Date();
        const t4LocalStart = new Date(2024, 9, 10); // Oct 10, 2024
        const currentPeriod = now >= t4LocalStart ? 'T4 Local | S2 Foráneas (cerrado)' : 'T3 Local | S2 Foráneas';
        
        // Period filter
        let whereClause = 'WHERE porcentaje IS NOT NULL';
        if (now >= t4LocalStart) {
            whereClause += ` AND (
                (tipo_supervision = 'Local' AND fecha_supervision >= '2024-10-10') OR
                (tipo_supervision = 'Foráneas' AND fecha_supervision BETWEEN '2024-04-01' AND '2024-10-07')
            )`;
        }
        
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
        
        console.log(`📈 Overview: ${overview.total_evaluaciones} evaluaciones, ${overview.sucursales_evaluadas} sucursales`);
        
        res.json({
            ...overview,
            periodo_actual: currentPeriod,
            fecha_corte_t4_local: '2024-10-10',
            fecha_corte_s2_foraneas: '2024-10-07',
            coordinate_coverage: `${overview.with_validated_coords}/${overview.total_evaluaciones} (${(overview.with_validated_coords/overview.total_evaluaciones*100).toFixed(1)}%)`
        });
        
    } catch (error) {
        console.error('❌ Error in performance overview:', error);
        res.status(500).json({ error: 'Error fetching performance data', details: error.message });
    }
});

// Map data API - Using clean view
app.get('/api/mapa', async (req, res) => {
    try {
        const { grupo, estado, periodo_cas } = req.query;
        console.log('🗺️ Map data requested with filters:', { grupo, estado, periodo_cas });
        
        let whereClause = `WHERE lat IS NOT NULL AND lng IS NOT NULL AND porcentaje IS NOT NULL`;
        const params = [];
        let paramIndex = 1;
        
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
        
        if (periodo_cas) {
            whereClause += ` AND periodo_cas = $${paramIndex}`;
            params.push(periodo_cas);
            paramIndex++;
        }
        
        // Apply current period logic if no specific period filter
        if (!periodo_cas) {
            const now = new Date();
            const t4LocalStart = new Date(2024, 9, 10);
            
            if (now >= t4LocalStart) {
                whereClause += ` AND (
                    (tipo_supervision = 'Local' AND fecha_supervision >= '2024-10-10') OR
                    (tipo_supervision = 'Foráneas' AND fecha_supervision BETWEEN '2024-04-01' AND '2024-10-07')
                )`;
            }
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
        
        console.log(`🗺️ Map data: ${result.rows.length} locations`);
        console.log(`✅ Validated coords: ${result.rows.filter(r => r.coordinate_source === 'validated_csv').length}`);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching map data:', error);
        res.status(500).json({ error: 'Error fetching map data', details: error.message });
    }
});

// Historical data API - Using clean view
app.get('/api/historico', async (req, res) => {
    try {
        const { grupo } = req.query;
        console.log('📈 Historical data requested for grupo:', grupo);
        
        let whereClause = `WHERE fecha_supervision >= DATE_TRUNC('year', CURRENT_DATE) AND porcentaje IS NOT NULL`;
        const params = [];
        let paramIndex = 1;
        
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
        console.log(`📊 Historical data: ${result.rows.length} data points`);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching historical data:', error);
        res.status(500).json({ error: 'Error fetching historical data', details: error.message });
    }
});

// Filters API - Using clean view
app.get('/api/filtros', async (req, res) => {
    try {
        console.log('🔍 Filters data requested');
        
        // Get grupos
        const gruposResult = await pool.query(`
            SELECT DISTINCT grupo 
            FROM supervision_dashboard_view 
            WHERE grupo IS NOT NULL 
            ORDER BY grupo
        `);
        
        // Get estados
        const estadosResult = await pool.query(`
            SELECT DISTINCT estado 
            FROM supervision_dashboard_view 
            WHERE estado IS NOT NULL 
            ORDER BY estado
        `);
        
        // Get periods
        const periodosResult = await pool.query(`
            SELECT DISTINCT periodo_cas
            FROM supervision_dashboard_view 
            WHERE periodo_cas IS NOT NULL 
            ORDER BY periodo_cas
        `);
        
        const filters = {
            grupos: gruposResult.rows.map(row => row.grupo),
            estados: estadosResult.rows.map(row => row.estado),
            periodos: periodosResult.rows.map(row => row.periodo_cas)
        };
        
        console.log(`🔍 Filters: ${filters.grupos.length} grupos, ${filters.estados.length} estados, ${filters.periodos.length} periods`);
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
            ORDER BY grupo
        `);
        res.json(result.rows.map(row => row.grupo));
    } catch (error) {
        console.error('❌ Error fetching grupos:', error);
        res.status(500).json({ error: 'Error fetching grupos', details: error.message });
    }
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT location_name) as unique_locations,
                COUNT(DISTINCT grupo) as unique_groups,
                COUNT(CASE WHEN coordinate_source = 'validated_csv' THEN 1 END) as validated_coords,
                MIN(fecha_supervision) as oldest_date,
                MAX(fecha_supervision) as newest_date
            FROM supervision_dashboard_view
        `);
        
        const groupStats = await pool.query(`
            SELECT 
                grupo,
                COUNT(DISTINCT location_name) as sucursales,
                COUNT(*) as supervisiones,
                ROUND(AVG(porcentaje), 2) as promedio_performance
            FROM supervision_dashboard_view
            WHERE porcentaje IS NOT NULL
            GROUP BY grupo
            ORDER BY promedio_performance DESC
        `);
        
        res.json({
            overall_stats: stats.rows[0],
            group_performance: groupStats.rows
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
    console.log(`🚀 El Pollo Loco Dashboard FINAL running on port ${port}`);
    console.log(`🎯 Features: Real data + Validated coordinates + Clean view`);
    console.log(`📊 Using supervision_dashboard_view with 80+ mapped locations`);
    console.log(`🗺️ Periods: T4 Local (Oct 10+) | S2 Foráneas (until Oct 7)`);
});

module.exports = app;