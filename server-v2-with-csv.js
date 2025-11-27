const express = require('express');
const path = require('path');
const fs = require('fs');
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

// Load and parse CSV coordinates
let sucursalesMap = new Map();
let csvData = [];

function loadCSVData() {
    try {
        const csvPath = path.join(__dirname, 'data', 'grupos_operativos_final_corregido.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',');
        
        csvData = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const record = {};
                headers.forEach((header, index) => {
                    record[header.trim()] = values[index]?.trim() || '';
                });
                csvData.push(record);
                
                // Create mapping: número -> datos completos
                sucursalesMap.set(parseInt(record.Numero_Sucursal), {
                    numero: parseInt(record.Numero_Sucursal),
                    nombre: record.Nombre_Sucursal,
                    grupo: record.Grupo_Operativo,
                    ciudad: record.Ciudad,
                    estado: record.Estado,
                    lat: parseFloat(record.Latitude),
                    lng: parseFloat(record.Longitude),
                    location_code: record.Location_Code
                });
            }
        }
        console.log(`✅ CSV loaded: ${csvData.length} sucursales (1-${Math.max(...Array.from(sucursalesMap.keys()))})`);
        console.log(`🗺️ New branches 82-85: ${Array.from(sucursalesMap.keys()).filter(n => n >= 82).join(', ')}`);
    } catch (error) {
        console.error('❌ Error loading CSV:', error);
    }
}

// Load CSV on startup
loadCSVData();

// Helper function to match location names
function findSucursalMatch(locationName) {
    // Extract number from location_name (e.g., "4 - Santa Catarina" -> 4)
    const numberMatch = locationName.match(/^(\d+)/);
    if (numberMatch) {
        const numero = parseInt(numberMatch[1]);
        return sucursalesMap.get(numero);
    }
    
    // Fallback: match by name similarity
    const cleanLocationName = locationName.replace(/^\d+\s*-\s*/, '').toLowerCase();
    for (const sucursal of csvData) {
        if (sucursal.Nombre_Sucursal.toLowerCase().includes(cleanLocationName) ||
            cleanLocationName.includes(sucursal.Nombre_Sucursal.toLowerCase())) {
            return sucursalesMap.get(parseInt(sucursal.Numero_Sucursal));
        }
    }
    return null;
}

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
            service: 'El Pollo Loco Dashboard V2',
            version: '2.0.0',
            database: 'connected',
            csv_sucursales: csvData.length,
            server_time: dbCheck.rows[0].server_time,
            total_records: dbCheck.rows[0].records,
            features: ['dashboard-v2', 'validated-coordinates', 'new-branches-82-85'],
            new_branches: Array.from(sucursalesMap.keys()).filter(n => n >= 82)
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected',
            csv_sucursales: csvData.length,
            error: error.message 
        });
    }
});

// Main dashboard route - serve V2
app.get('/', (req, res) => {
    const dashboardPath = path.join(__dirname, 'dashboard-v2-ios.html');
    console.log('📱 Dashboard V2 requested:', dashboardPath);
    res.sendFile(dashboardPath, (err) => {
        if (err) {
            console.log('⚠️ V2 dashboard not found, serving original dashboard from public/');
            const fallbackPath = path.join(__dirname, 'public', 'dashboard-ios-complete.html');
            res.sendFile(fallbackPath);
        }
    });
});

// Performance Overview API - Enhanced with new date logic
app.get('/api/performance/overview', async (req, res) => {
    try {
        console.log('📊 Performance overview requested');
        
        // 📅 FECHAS DE CORTE ACTUALIZADAS
        // T4 LOCAL: Inicia 10 octubre 2024 (después del 9 oct que fue último día T3)
        // S2 FORÁNEAS: Termina 7 octubre 2024 (últimas supervisiones lunes 6 y martes 7 oct)
        const now = new Date();
        const currentYear = 2024; // Fixed year for 2024 cycle
        const t4LocalStart = new Date(2024, 9, 10);  // Oct 10, 2024
        const s2ForaneasEnd = new Date(2024, 9, 7);   // Oct 7, 2024
        
        let periodoFilter = '';
        let currentPeriod = '';
        
        if (now >= t4LocalStart) {
            // Current period: T4 for Local, S2 ended for Foráneas
            periodoFilter = ` AND (
                (tipo_supervision = 'Local' AND fecha_supervision >= '2024-10-10') OR
                (tipo_supervision = 'Foráneas' AND fecha_supervision BETWEEN '2024-04-01' AND '2024-10-07')
            )`;
            currentPeriod = 'T4 Local | S2 Foráneas (cerrado)';
        } else {
            // Previous periods
            periodoFilter = ` AND fecha_supervision <= '2024-10-09'`;
            currentPeriod = 'T3 Local | S2 Foráneas';
        }
        
        const query = `
            SELECT 
                COUNT(*) as total_evaluaciones,
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT location_name) as sucursales_evaluadas,
                COUNT(DISTINCT grupo_operativo_limpio) as grupos_activos,
                MAX(fecha_supervision) as ultima_evaluacion,
                MIN(fecha_supervision) as primera_evaluacion
            FROM supervision_operativa_clean 
            WHERE fecha_supervision >= '${currentYear}-01-01'${periodoFilter}
        `;
        
        const result = await pool.query(query);
        const overview = result.rows[0];
        
        console.log(`📈 Overview: ${overview.total_evaluaciones} evaluaciones, ${overview.sucursales_evaluadas} sucursales`);
        res.json({
            ...overview,
            periodo_actual: currentPeriod,
            fecha_corte_t4_local: '2024-10-10',
            fecha_corte_s2_foraneas: '2024-10-07',
            csv_sucursales_disponibles: csvData.length,
            nuevas_sucursales: Array.from(sucursalesMap.keys()).filter(n => n >= 82)
        });
        
    } catch (error) {
        console.error('❌ Error in performance overview:', error);
        res.status(500).json({ error: 'Error fetching performance data', details: error.message });
    }
});

// Map data API - Enhanced with CSV coordinates
app.get('/api/mapa', async (req, res) => {
    try {
        const { grupo, estado, periodo_cas } = req.query;
        console.log('🗺️ Map data requested with filters:', { grupo, estado, periodo_cas });
        
        let whereClause = `WHERE 1=1`;
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
        
        // Updated date logic for T4 Local and S2 Foráneas
        const now = new Date();
        const t4LocalStart = new Date(2024, 9, 10);  // Oct 10, 2024
        
        if (now >= t4LocalStart) {
            // T4 Local (from Oct 10) and S2 Foráneas (until Oct 7)
            whereClause += ` AND (
                (tipo_supervision = 'Local' AND fecha_supervision >= '2024-10-10') OR
                (tipo_supervision = 'Foráneas' AND fecha_supervision BETWEEN '2024-04-01' AND '2024-10-07')
            )`;
        } else {
            // Previous periods
            whereClause += ` AND fecha_supervision <= '2024-10-09'`;
        }
        
        const query = `
            SELECT 
                location_name,
                grupo_operativo_limpio as grupo,
                ROUND(AVG(porcentaje), 2) as performance,
                estado_normalizado as estado,
                municipio,
                MAX(fecha_supervision) as ultima_evaluacion,
                COUNT(*) as total_evaluaciones
            FROM supervision_operativa_clean 
            ${whereClause}
            GROUP BY location_name, grupo_operativo_limpio, estado_normalizado, municipio
            ORDER BY performance DESC
        `;
        
        const result = await pool.query(query, params);
        
        // Enhance with CSV coordinates
        const enhancedResults = result.rows.map(row => {
            const sucursalMatch = findSucursalMatch(row.location_name);
            
            if (sucursalMatch) {
                return {
                    nombre: sucursalMatch.nombre,  // Use CSV name
                    numero: sucursalMatch.numero,
                    grupo: row.grupo,
                    lat: sucursalMatch.lat,        // CSV coordinates
                    lng: sucursalMatch.lng,        // CSV coordinates  
                    performance: row.performance,
                    estado: sucursalMatch.estado,  // CSV state
                    municipio: sucursalMatch.ciudad, // CSV city
                    ultima_evaluacion: row.ultima_evaluacion,
                    total_evaluaciones: row.total_evaluaciones,
                    source: 'csv_validated'
                };
            } else {
                console.warn(`⚠️ No CSV match for: ${row.location_name}`);
                return {
                    nombre: row.location_name,
                    grupo: row.grupo,
                    lat: null,
                    lng: null,
                    performance: row.performance,
                    estado: row.estado,
                    municipio: row.municipio,
                    ultima_evaluacion: row.ultima_evaluacion,
                    total_evaluaciones: row.total_evaluaciones,
                    source: 'db_fallback'
                };
            }
        }).filter(item => item.lat !== null && item.lng !== null);
        
        console.log(`🗺️ Map data: ${enhancedResults.length} locations with valid coordinates`);
        console.log(`✅ CSV matches: ${enhancedResults.filter(r => r.source === 'csv_validated').length}`);
        console.log(`⚠️ Fallbacks: ${enhancedResults.filter(r => r.source === 'db_fallback').length}`);
        
        res.json(enhancedResults);
        
    } catch (error) {
        console.error('❌ Error fetching map data:', error);
        res.status(500).json({ error: 'Error fetching map data', details: error.message });
    }
});

// Historical data API - Enhanced with new date logic
app.get('/api/historico', async (req, res) => {
    try {
        const { grupo } = req.query;
        console.log('📈 Historical data requested for grupo:', grupo);
        
        let whereClause = `WHERE fecha_supervision >= DATE_TRUNC('year', CURRENT_DATE)`;
        const params = [];
        let paramIndex = 1;
        
        if (grupo) {
            whereClause += ` AND grupo_operativo_limpio = $${paramIndex}`;
            params.push(grupo);
            paramIndex++;
        }
        
        // Updated date logic for T4 Local and S2 Foráneas
        const now = new Date();
        const t4LocalStart = new Date(2024, 9, 10);  // Oct 10, 2024
        
        if (now >= t4LocalStart) {
            // T4 Local (from Oct 10) and S2 Foráneas (until Oct 7)
            whereClause += ` AND (
                (tipo_supervision = 'Local' AND fecha_supervision >= '2024-10-10') OR
                (tipo_supervision = 'Foráneas' AND fecha_supervision BETWEEN '2024-04-01' AND '2024-10-07')
            )`;
        } else {
            // Previous periods
            whereClause += ` AND fecha_supervision <= '2024-10-09'`;
        }
        
        const query = `
            SELECT 
                DATE_TRUNC('month', fecha_supervision) as mes,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                grupo_operativo_limpio as grupo
            FROM supervision_operativa_clean 
            ${whereClause}
            GROUP BY DATE_TRUNC('month', fecha_supervision), grupo_operativo_limpio
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

// Filters API - Enhanced with CSV data
app.get('/api/filtros', async (req, res) => {
    try {
        console.log('🔍 Filters data requested');
        
        // Get grupos from CSV (more complete)
        const gruposFromCSV = [...new Set(csvData.map(row => row.Grupo_Operativo))].sort();
        
        // Get estados from database (for active supervision data)
        const estadosQuery = `
            SELECT DISTINCT estado_normalizado as estado 
            FROM supervision_operativa_clean 
            WHERE estado_normalizado IS NOT NULL 
            ORDER BY estado_normalizado
        `;
        const estadosResult = await pool.query(estadosQuery);
        
        const periodos = ['T1 2024', 'T2 2024', 'T3 2024', 'T4 2024', 'S1 2024', 'S2 2024'];
        
        const filters = {
            grupos: gruposFromCSV,
            estados: estadosResult.rows.map(row => row.estado),
            periodos: periodos,
            sucursales_total: csvData.length,
            nuevas_sucursales: Array.from(sucursalesMap.keys()).filter(n => n >= 82)
        };
        
        console.log(`🔍 Filters: ${filters.grupos.length} grupos, ${filters.estados.length} estados`);
        res.json(filters);
        
    } catch (error) {
        console.error('❌ Error fetching filters:', error);
        res.status(500).json({ error: 'Error fetching filter data', details: error.message });
    }
});

// CSV data endpoint for debugging
app.get('/api/csv-data', (req, res) => {
    res.json({
        total_sucursales: csvData.length,
        sucursales_range: `1-${Math.max(...Array.from(sucursalesMap.keys()))}`,
        new_branches: Array.from(sucursalesMap.keys()).filter(n => n >= 82).map(n => {
            const s = sucursalesMap.get(n);
            return { numero: n, nombre: s.nombre, grupo: s.grupo, estado: s.estado };
        }),
        sample: csvData.slice(0, 3)
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 El Pollo Loco Dashboard V2 running on port ${port}`);
    console.log(`📊 CSV loaded: ${csvData.length} sucursales`);
    console.log(`🆕 New branches: ${Array.from(sucursalesMap.keys()).filter(n => n >= 82).join(', ')}`);
    console.log(`🗺️ Features: validated coordinates, standardized names, T4/S2 dates`);
});

module.exports = app;