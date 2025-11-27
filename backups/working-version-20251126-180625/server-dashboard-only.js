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
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'"],
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
        const dbCheck = await pool.query('SELECT NOW() as server_time, COUNT(*) as records FROM supervision_operativa_clean LIMIT 1');
        res.json({ 
            status: 'healthy',
            service: 'El Pollo Loco Dashboard',
            database: 'connected',
            server_time: dbCheck.rows[0].server_time,
            total_records: dbCheck.rows[0].records,
            features: ['dashboard-ios-mobile']
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// Main dashboard route - serve mobile optimized
app.get('/', (req, res) => {
    const dashboardPath = path.join(__dirname, 'public', 'dashboard-ios-complete.html');
    console.log('📱 Dashboard requested:', dashboardPath);
    res.sendFile(dashboardPath);
});

// Alternative routes for dashboard
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'public', 'dashboard-ios-complete.html');
    res.sendFile(dashboardPath);
});

app.get('/dashboard-ios-complete', (req, res) => {
    const dashboardPath = path.join(__dirname, 'public', 'dashboard-ios-complete.html');
    res.sendFile(dashboardPath);
});

// =====================================================
// DASHBOARD API ENDPOINTS
// =====================================================

// GET /api/performance/overview - KPIs generales
app.get('/api/performance/overview', async (req, res) => {
    try {
        const { trimestre, periodo_cas } = req.query;
        
        let whereClause = `WHERE porcentaje IS NOT NULL`;
        const params = [];
        let paramIndex = 1;
        
        if (trimestre) {
            whereClause += ` AND EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`;
            params.push(parseInt(trimestre));
            paramIndex++;
        }
        
        if (periodo_cas) {
            whereClause += ` AND periodo_cas = $${paramIndex}`;
            params.push(periodo_cas);
            paramIndex++;
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

// GET /api/performance/grupos - Performance por grupo
app.get('/api/performance/grupos', async (req, res) => {
    try {
        const { trimestre, periodo_cas } = req.query;
        
        let whereClause = `WHERE porcentaje IS NOT NULL`;
        const params = [];
        let paramIndex = 1;
        
        if (trimestre) {
            whereClause += ` AND EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`;
            params.push(parseInt(trimestre));
            paramIndex++;
        }
        
        if (periodo_cas) {
            whereClause += ` AND periodo_cas = $${paramIndex}`;
            params.push(periodo_cas);
            paramIndex++;
        }
        
        const query = `
            SELECT 
                grupo_operativo_limpio as grupo,
                ROUND(AVG(porcentaje), 2) as performance,
                COUNT(DISTINCT location_name) as sucursales,
                COUNT(*) as evaluaciones
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

// GET /api/mapa - Datos para el mapa
app.get('/api/mapa', async (req, res) => {
    try {
        const { grupo, estado, periodo_cas } = req.query;
        
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
        
        if (periodo_cas) {
            whereClause += ` AND periodo_cas = $${paramIndex}`;
            params.push(periodo_cas);
            paramIndex++;
        }
        
        const query = `
            SELECT 
                location_name as nombre,
                grupo_operativo_limpio as grupo,
                latitud as lat,
                longitud as lng,
                ROUND(AVG(porcentaje), 2) as performance,
                estado_normalizado as estado,
                municipio,
                MAX(fecha_supervision) as ultima_evaluacion,
                COUNT(*) as total_evaluaciones
            FROM supervision_operativa_clean 
            ${whereClause}
            GROUP BY location_name, grupo_operativo_limpio, latitud, longitud, estado_normalizado, municipio
            ORDER BY performance DESC
        `;
        
        const result = await pool.query(query, params);
        console.log(`🗺️ Map data: ${result.rows.length} locations`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching map data:', error);
        res.status(500).json({ error: 'Error fetching map data', details: error.message });
    }
});

// GET /api/historico - Datos históricos por período
app.get('/api/historico', async (req, res) => {
    try {
        const { grupo } = req.query;
        
        let whereClause = `WHERE porcentaje IS NOT NULL`;
        const params = [];
        
        if (grupo) {
            whereClause += ` AND grupo_operativo_limpio = $1`;
            params.push(grupo);
        }
        
        const query = `
            SELECT 
                periodo_cas,
                grupo_operativo_limpio as grupo,
                ROUND(AVG(porcentaje), 2) as performance,
                COUNT(DISTINCT location_name) as sucursales,
                COUNT(*) as evaluaciones
            FROM supervision_operativa_clean 
            ${whereClause}
            GROUP BY periodo_cas, grupo_operativo_limpio
            ORDER BY periodo_cas, performance DESC
        `;
        
        const result = await pool.query(query, params);
        console.log(`📈 Historic data: ${result.rows.length} records`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error fetching historic data:', error);
        res.status(500).json({ error: 'Error fetching historic data', details: error.message });
    }
});

// GET /api/filtros - Filtros disponibles
app.get('/api/filtros', async (req, res) => {
    try {
        const queries = {
            grupos: `SELECT DISTINCT grupo_operativo_limpio as valor FROM supervision_operativa_clean WHERE grupo_operativo_limpio IS NOT NULL ORDER BY grupo_operativo_limpio`,
            estados: `SELECT DISTINCT estado_normalizado as valor FROM supervision_operativa_clean WHERE estado_normalizado IS NOT NULL ORDER BY estado_normalizado`,
            periodos: `SELECT DISTINCT periodo_cas as valor FROM supervision_operativa_clean WHERE periodo_cas IS NOT NULL ORDER BY periodo_cas DESC`
        };
        
        const results = {};
        for (const [key, query] of Object.entries(queries)) {
            const result = await pool.query(query);
            results[key] = result.rows.map(row => row.valor);
        }
        
        console.log('🔍 Filters loaded:', Object.keys(results));
        res.json(results);
        
    } catch (error) {
        console.error('❌ Error fetching filters:', error);
        res.status(500).json({ error: 'Error fetching filters', details: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 El Pollo Loco Dashboard running on port ${port}`);
    console.log(`📱 Dashboard: https://pollo-loco-supervision.onrender.com`);
    console.log(`🔍 Health: https://pollo-loco-supervision.onrender.com/health`);
    console.log(`💾 Database: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔴 Shutting down server...');
    await pool.end();
    process.exit(0);
});

module.exports = app;