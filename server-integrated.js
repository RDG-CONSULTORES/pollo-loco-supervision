const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
// Load environment variables
require('dotenv').config();

// In production, use hardcoded values as fallback
if (process.env.NODE_ENV === 'production' && !process.env.TELEGRAM_BOT_TOKEN) {
    const prodConfig = require('./config/production');
    Object.keys(prodConfig).forEach(key => {
        if (!process.env[key]) {
            process.env[key] = prodConfig[key];
        }
    });
}

const app = express();
const PORT = process.env.PORT || 3000;

// SAFETY SWITCH - Change this to switch between clean view and raw table
const USE_CLEAN_VIEW = process.env.USE_CLEAN_VIEW === 'true' || false;
const DATA_SOURCE = USE_CLEAN_VIEW ? 'supervision_operativa_clean' : 'supervision_operativa_detalle';
console.log(`🔧 Using data source: ${DATA_SOURCE}`);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection with fallback
let dbConnected = false;
pool.connect()
  .then(() => {
    console.log('✅ Connected to Neon PostgreSQL');
    dbConnected = true;
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    console.log('⚠️  Using fallback static data for bot functionality');
    dbConnected = false;
  });

// Handle pool errors to prevent crashes
pool.on('error', (err) => {
    console.error('❌ Database pool error:', err);
    console.log('🔄 Attempting to maintain service with fallback data');
    dbConnected = false;
});

// Handle uncaught exceptions to prevent server crashes
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.log('🔄 Server continuing with fallback data');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    console.log('🔄 Server continuing with fallback data');
});

// Helper function for Período CAS filtering
function buildPeriodoCasCondition(periodoCas, paramIndex) {
    if (!periodoCas || periodoCas === 'all') {
        return { condition: '', params: [] };
    }
    
    const condition = `
        CASE 
            -- FIXED: Locales NL períodos trimestrales con rangos corregidos
            WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO') 
                 AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                 AND fecha_supervision >= '2025-03-12' AND fecha_supervision <= '2025-04-16'
                THEN 'nl_t1'
            WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                 AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                 AND fecha_supervision >= '2025-06-11' AND fecha_supervision <= '2025-08-18'
                THEN 'nl_t2'
            WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                 AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                 AND fecha_supervision >= '2025-08-19' AND fecha_supervision <= '2025-12-31'
                THEN 'nl_t3'
            -- FIXED: Foráneas períodos semestrales con rangos corregidos
            WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                  OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                 AND fecha_supervision >= '2025-04-10' AND fecha_supervision <= '2025-06-09'
                THEN 'for_s1'
            WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                  OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                 AND fecha_supervision >= '2025-07-30' AND fecha_supervision <= '2025-08-15'
                THEN 'for_s2'
            ELSE 'otros'
        END = $${paramIndex}
    `;
    
    return { condition, params: [periodoCas] };
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve dashboard static files
app.use('/dashboard-static', express.static(path.join(__dirname, 'telegram-bot/web-app/public')));
app.use(express.static(path.join(__dirname, 'telegram-bot/web-app/public')));

// Serve static files from root directory (for historico-v2.html)
app.use(express.static(path.join(__dirname)));

// Serve the main dashboard file (explicit route)
app.get('/historico-v2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'historico-v2.html'));
});

// ==================================================
// API ENDPOINTS FOR HISTÓRICO-V2.HTML DASHBOARD
// ==================================================

// API: Historical performance data with group filtering
app.get('/api/historical-performance/:groupId?', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database connection unavailable' });
  }

  try {
    const { groupId } = req.params;
    const { dateRange = '3months', area = 'all' } = req.query;

    // Build date filter - use available data range
    let dateFilter = '';
    switch (dateRange) {
      case '1month':
        dateFilter = `AND fecha_supervision >= CURRENT_DATE - INTERVAL '1 month'`;
        break;
      case '3months':
        dateFilter = `AND fecha_supervision >= CURRENT_DATE - INTERVAL '3 months'`;
        break;
      case '6months':
        dateFilter = `AND fecha_supervision >= CURRENT_DATE - INTERVAL '6 months'`;
        break;
      case 'year':
        dateFilter = `AND fecha_supervision >= CURRENT_DATE - INTERVAL '1 year'`;
        break;
      case 'all':
        dateFilter = ''; // Show all available data
        break;
      default:
        dateFilter = ''; // Show all data by default
    }

    // Build group filter
    let groupFilter = '';
    if (groupId && groupId !== 'all') {
      groupFilter = `AND grupo_operativo_limpio = $1`;
    }

    // Build area filter
    let areaFilter = '';
    if (area && area !== 'all') {
      areaFilter = area === 'general' 
        ? `AND (area_evaluacion = '' OR area_evaluacion IS NULL)`
        : `AND area_evaluacion = '${area}'`;
    }

    // FASE 4: Use CAS periods instead of monthly grouping - SIMPLIFIED with CTE
    const query = `
      WITH periodo_data AS (
        SELECT 
          CASE 
              -- LOCALES NL: períodos trimestrales con rangos corregidos
              WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO') 
                   AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                   AND fecha_supervision >= '2025-03-12' AND fecha_supervision <= '2025-04-16'
                  THEN 'NL-T1'
              WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                   AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                   AND fecha_supervision >= '2025-06-11' AND fecha_supervision <= '2025-08-18'
                  THEN 'NL-T2'
              WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                   AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                   AND fecha_supervision >= '2025-08-19' AND fecha_supervision <= '2025-12-31'
                  THEN 'NL-T3'
              -- FORÁNEAS: períodos semestrales con rangos corregidos
              WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                    OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                   AND fecha_supervision >= '2025-04-10' AND fecha_supervision <= '2025-06-09'
                  THEN 'FOR-S1'
              WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                    OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                   AND fecha_supervision >= '2025-07-30' AND fecha_supervision <= '2025-08-15'
                  THEN 'FOR-S2'
              ELSE 'OTROS'
          END as periodo_cas,
          porcentaje,
          location_name,
          grupo_operativo_limpio as grupo
        FROM supervision_operativa_clean
        WHERE porcentaje IS NOT NULL
          AND grupo_operativo_limpio IS NOT NULL
          AND fecha_supervision IS NOT NULL
          ${groupFilter}
          ${areaFilter}
      )
      SELECT 
        periodo_cas,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_performance,
        COUNT(DISTINCT location_name) as sucursales_evaluadas,
        COUNT(*) as total_evaluaciones,
        grupo
      FROM periodo_data
      WHERE periodo_cas != 'OTROS'
      GROUP BY periodo_cas, grupo
      ORDER BY 
        CASE periodo_cas
            WHEN 'NL-T1' THEN 1
            WHEN 'FOR-S1' THEN 2  
            WHEN 'NL-T2' THEN 3
            WHEN 'FOR-S2' THEN 4
            WHEN 'NL-T3' THEN 5
            ELSE 6
        END
    `;

    const params = groupId && groupId !== 'all' ? [groupId] : [];
    const result = await pool.query(query, params);

    // Transform data for Chart.js format with CAS periods (SAME ORDER as HeatMap)
    const chartData = {
      labels: ['NL-T1', 'FOR-S1', 'NL-T2', 'FOR-S2', 'NL-T3'],
      datasets: []
    };

    if (result.rows.length > 0) {
      // Get unique CAS periods and groups
      const periods = [...new Set(result.rows.map(row => row.periodo_cas))].sort((a, b) => {
        // SAME ORDER as HeatMap: NL-T1, FOR-S1, NL-T2, FOR-S2, NL-T3
        const order = { 'NL-T1': 1, 'FOR-S1': 2, 'NL-T2': 3, 'FOR-S2': 4, 'NL-T3': 5 };
        return (order[a] || 99) - (order[b] || 99);
      });
      const groups = [...new Set(result.rows.map(row => row.grupo))];

      chartData.labels = periods;

      // EPL colors
      const colors = ['#D03B34', '#FFED00', '#F18523', '#6C109F'];

      groups.forEach((group, index) => {
        const groupData = chartData.labels.map(period => {
          const match = result.rows.find(row => 
            row.periodo_cas === period && row.grupo === group
          );
          return match ? parseFloat(match.promedio_performance) : null;
        });

        chartData.datasets.push({
          label: group,
          data: groupData,
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length] + '20',
          borderWidth: 2,
          fill: false,
          spanGaps: true
        });
      });
    }

    res.json({
      success: true,
      data: chartData,
      metadata: {
        totalEvaluations: result.rows.reduce((sum, row) => sum + parseInt(row.total_evaluaciones), 0),
        dateRange,
        groupFilter: groupId || 'all',
        areaFilter: area || 'all'
      }
    });

  } catch (error) {
    console.error('❌ Historical Performance API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching historical data',
      details: error.message 
    });
  }
});

// API: Get operational groups for slider
app.get('/api/operational-groups', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database connection unavailable' });
  }

  try {
    // FASE 1: Define the complete list of 20 known operational groups
    const knownGroups = [
      'CRR', 'EFM', 'EPL SO', 'EXPO', 'GRUPO CANTERA ROSA (MORELIA)',
      'GRUPO CENTRITO', 'GRUPO MATAMOROS', 'GRUPO NUEVO LAREDO (RUELAS)',
      'GRUPO PIEDRAS NEGRAS', 'GRUPO RIO BRAVO', 'GRUPO SABINAS HIDALGO',
      'GRUPO SALTILLO', 'OCHTER TAMPICO', 'OGAS', 'PLOG LAGUNA',
      'PLOG NUEVO LEON', 'PLOG QUERETARO', 'RAP', 'TEC', 'TEPEYAC'
    ];
    
    console.log(`📋 Expected operational groups: ${knownGroups.length}`);
    
    // Get ALL unique groups from database to compare
    const allGroupsQuery = `
      SELECT DISTINCT grupo_operativo_limpio as name
      FROM supervision_operativa_clean
      WHERE grupo_operativo_limpio IS NOT NULL
        AND grupo_operativo_limpio != ''
      ORDER BY grupo_operativo_limpio
    `;
    
    const allGroupsResult = await pool.query(allGroupsQuery);
    console.log(`📊 Found ${allGroupsResult.rows.length} total unique groups in database`);
    
    // Log any groups in database that are not in our known list
    const dbGroups = allGroupsResult.rows.map(row => row.name);
    const unknownGroups = dbGroups.filter(group => !knownGroups.includes(group));
    const missingGroups = knownGroups.filter(group => !dbGroups.includes(group));
    
    if (unknownGroups.length > 0) {
      console.log(`🔍 Unknown groups found in database:`, unknownGroups);
    }
    if (missingGroups.length > 0) {
      console.log(`⚠️  Missing groups from database:`, missingGroups);
    }
    
    // Then get performance data with a wider time range to include all groups
    const query = `
      SELECT 
        grupo_operativo_limpio as name,
        COUNT(DISTINCT location_name) as total_sucursales,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_performance,
        COUNT(*) as total_evaluaciones
      FROM supervision_operativa_clean
      WHERE grupo_operativo_limpio IS NOT NULL
        AND porcentaje IS NOT NULL
        -- Expanded to 6 months to capture more groups
        AND fecha_supervision >= NOW() - INTERVAL '6 months'
      GROUP BY grupo_operativo_limpio
      ORDER BY promedio_performance DESC
    `;

    const result = await pool.query(query);
    
    // Merge results to ensure all groups are included
    const performanceMap = new Map();
    result.rows.forEach(row => {
      performanceMap.set(row.name, row);
    });
    
    // ENSURE ALL 20 KNOWN GROUPS ARE INCLUDED, even without recent data
    const allGroups = knownGroups.map(groupName => {
      const perfData = performanceMap.get(groupName);
      return perfData || {
        name: groupName,
        total_sucursales: 0,
        promedio_performance: null,
        total_evaluaciones: 0
      };
    });
    
    // Add any additional groups found in database but not in our known list
    dbGroups.forEach(dbGroup => {
      if (!knownGroups.includes(dbGroup)) {
        const perfData = performanceMap.get(dbGroup);
        if (perfData) {
          allGroups.push(perfData);
        }
      }
    });
    
    // Map to match the expected format - now including ALL groups
    const groups = allGroups
      .filter(row => row.name) // Filter out any null names
      .sort((a, b) => {
        // Sort by performance (nulls at the end)
        if (a.promedio_performance === null) return 1;
        if (b.promedio_performance === null) return -1;
        return b.promedio_performance - a.promedio_performance;
      })
      .map((row, index) => {
        // EPL colors rotation - expanded for more groups
        const colors = [
          '#D03B34', '#FFED00', '#F18523', '#6C109F',
          '#0984e3', '#00b894', '#fdcb6e', '#e17055',
          '#74b9ff', '#a29bfe', '#fd79a8', '#55a3ff',
          '#ff7675', '#dfe6e9', '#636e72', '#2d3436',
          '#00cec9', '#6c5ce7', '#e84393', '#ffeaa7'
        ];
        return {
          id: row.name,
          name: row.name,
          color: colors[index % colors.length],
          totalSucursales: parseInt(row.total_sucursales) || 0,
          promedioPerformance: row.promedio_performance || 'N/A',
          totalEvaluaciones: parseInt(row.total_evaluaciones) || 0
        };
      });

    console.log(`✅ Returning ${groups.length} operational groups (including those without recent data)`);
    
    res.json({
      success: true,
      data: groups,
      totalGroups: groups.length
    });

  } catch (error) {
    console.error('❌ Operational Groups API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching operational groups',
      details: error.message 
    });
  }
});

// API: Heatmap data for geographic visualization
app.get('/api/heatmap-data/:groupId?', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database connection unavailable' });
  }

  try {
    const { groupId } = req.params;
    let groupFilter = '';
    
    if (groupId && groupId !== 'all') {
      groupFilter = `AND grupo_operativo_limpio = $1`;
    }

    const query = `
      SELECT 
        location_name,
        estado_normalizado as estado,
        municipio,
        latitud::numeric as lat,
        longitud::numeric as lng,
        grupo_operativo_limpio as grupo,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_performance,
        COUNT(*) as total_evaluaciones,
        CASE 
          WHEN AVG(porcentaje) >= 90 THEN 'excellent'
          WHEN AVG(porcentaje) >= 80 THEN 'good'
          WHEN AVG(porcentaje) >= 70 THEN 'warning'
          ELSE 'critical'
        END as status_level
      FROM supervision_operativa_clean
      WHERE latitud IS NOT NULL 
        AND longitud IS NOT NULL 
        AND porcentaje IS NOT NULL
        AND grupo_operativo_limpio IS NOT NULL
        AND fecha_supervision IS NOT NULL
        ${groupFilter}
      GROUP BY location_name, estado_normalizado, municipio, latitud, longitud, grupo_operativo_limpio
      ORDER BY promedio_performance DESC
    `;

    const params = groupId && groupId !== 'all' ? [groupId] : [];
    const result = await pool.query(query, params);

    // Transform for heatmap visualization
    const heatmapData = result.rows.map(row => ({
      location: row.location_name,
      coordinates: [parseFloat(row.lat), parseFloat(row.lng)],
      performance: parseFloat(row.promedio_performance),
      grupo: row.grupo,
      estado: row.estado,
      municipio: row.municipio,
      evaluaciones: row.total_evaluaciones,
      status: row.status_level,
      // Intensity for heatmap (normalized 0-1)
      intensity: Math.max(0.1, parseFloat(row.promedio_performance) / 100)
    }));

    res.json({
      success: true,
      data: heatmapData,
      metadata: {
        totalLocations: heatmapData.length,
        groupFilter: groupId || 'all',
        avgPerformance: heatmapData.length > 0 
          ? (heatmapData.reduce((sum, item) => sum + item.performance, 0) / heatmapData.length).toFixed(2)
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Heatmap API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching heatmap data',
      details: error.message 
    });
  }
});

// API: Performance areas for analysis
app.get('/api/performance-areas/:groupId?', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database connection unavailable' });
  }

  try {
    const { groupId } = req.params;
    let groupFilter = '';
    
    if (groupId && groupId !== 'all') {
      groupFilter = `AND grupo_operativo_limpio = $1`;
    }

    const query = `
      SELECT 
        area_evaluacion,
        ROUND(AVG(porcentaje)::numeric, 2) as promedio_performance,
        COUNT(*) as total_evaluaciones,
        COUNT(DISTINCT location_name) as sucursales_evaluadas,
        ROUND(MIN(porcentaje)::numeric, 2) as min_performance,
        ROUND(MAX(porcentaje)::numeric, 2) as max_performance
      FROM supervision_operativa_clean
      WHERE area_evaluacion IS NOT NULL 
        AND area_evaluacion != ''
        AND area_evaluacion NOT LIKE '%PUNTOS%'
        AND porcentaje IS NOT NULL
        AND grupo_operativo_limpio IS NOT NULL
        AND fecha_supervision IS NOT NULL
        ${groupFilter}
      GROUP BY area_evaluacion
      ORDER BY promedio_performance DESC
      LIMIT 20
    `;

    const params = groupId && groupId !== 'all' ? [groupId] : [];
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        area: row.area_evaluacion,
        promedio: parseFloat(row.promedio_performance),
        evaluaciones: row.total_evaluaciones,
        sucursales: row.sucursales_evaluadas,
        rango: {
          min: parseFloat(row.min_performance),
          max: parseFloat(row.max_performance)
        }
      }))
    });

  } catch (error) {
    console.error('❌ Performance Areas API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching performance areas',
      details: error.message 
    });
  }
});

// Serve design showcase and variants
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'design-showcase.html'));
});

app.get('/design/:variant', (req, res) => {
    const { variant } = req.params;
    const designFiles = {
        '1': 'design-variant-1-corporate.html',
        '2': 'design-variant-2-minimal.html', 
        '3': 'design-variant-3-dark.html',
        '4': 'design-variant-4-modern.html',
        '5': 'design-variant-5-classic.html',
        'corporate': 'design-variant-1-corporate.html',
        'minimal': 'design-variant-2-minimal.html',
        'dark': 'design-variant-3-dark.html',
        'modern': 'design-variant-4-modern.html',
        'classic': 'design-variant-5-classic.html'
    };
    
    const fileName = designFiles[variant];
    if (fileName) {
        res.sendFile(path.join(__dirname, fileName));
    } else {
        res.status(404).json({ error: 'Design variant not found' });
    }
});

// Mini Web App endpoint for Telegram
app.get('/webapp', (req, res) => {
    res.sendFile(path.join(__dirname, 'design-showcase.html'));
});

// OLD Dashboard (renamed to avoid conflict)
app.get('/dashboard-old', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard-react.html'));
});

// NEW Dashboard (FIXED VERSION)
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'telegram-bot/web-app/public/index.html');
    console.log('📊 NEW Dashboard requested:', dashboardPath);
    res.sendFile(dashboardPath);
});

// Análisis Histórico route
app.get('/historico', (req, res) => {
    const historicoPath = path.join(__dirname, 'historico-demo-completo.html');
    console.log('📈 Análisis Histórico requested, serving:', historicoPath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(historicoPath)) {
        console.error('❌ File not found:', historicoPath);
        return res.status(404).send('Análisis Histórico no disponible');
    }
    
    res.sendFile(historicoPath);
});

// Dashboard redirect for easy access
app.get('/full', (req, res) => {
    res.redirect('/dashboard');
});

// Fallback data
const fallbackData = {
    kpis: {
        promedio_general: "89.54",
        total_supervisiones: 135,
        total_sucursales: 79,
        total_estados: 9,
        max_calificacion: "100.00",
        min_calificacion: "45.20"
    },
    grupos: [
        { grupo_operativo: "OGAS", promedio: "97.60", supervisiones: 16, sucursales: 8 },
        { grupo_operativo: "PLOG QUERÉTARO", promedio: "97.00", supervisiones: 4, sucursales: 4 },
        { grupo_operativo: "TEC", promedio: "93.10", supervisiones: 8, sucursales: 4 }
    ],
    estados: [
        { estado: "Nuevo León", promedio: "96.80", supervisiones: 45, sucursales: 25 },
        { estado: "Querétaro", promedio: "95.40", supervisiones: 28, sucursales: 18 },
        { estado: "Jalisco", promedio: "93.70", supervisiones: 32, sucursales: 20 }
    ],
    indicadores: [
        { indicador: "LIMPIEZA GENERAL", promedio: "94.50", evaluaciones: 89 },
        { indicador: "SERVICIO AL CLIENTE", promedio: "92.80", evaluaciones: 76 },
        { indicador: "COCINA", promedio: "91.30", evaluaciones: 82 }
    ]
};

// Health check with NEW VERSION
app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query(`
            SELECT 
                'supervision_operativa_clean' as table_name,
                COUNT(*) as total_records,
                COUNT(DISTINCT location_name) as unique_locations,
                COUNT(DISTINCT grupo_operativo_limpio) as unique_groups,
                COUNT(DISTINCT estado_normalizado) as unique_states,
                COUNT(CASE WHEN grupo_operativo_limpio = 'NO_ENCONTRADO' THEN 1 END) as unmapped_groups,
                MIN(fecha_supervision) as earliest_date,
                MAX(fecha_supervision) as latest_date
            FROM supervision_operativa_clean
        `);
        
        const stats = dbCheck.rows[0];
        
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            service: 'El Pollo Loco Interactive Dashboard v2.0',
            version: '2.0.0',
            database_status: dbConnected ? 'Connected to Neon PostgreSQL' : 'Using fallback data',
            database_stats: {
                total_records: stats.total_records,
                unique_locations: stats.unique_locations,
                unique_groups: stats.unique_groups,
                unique_states: stats.unique_states,
                unmapped_groups: stats.unmapped_groups,
                date_range: `${stats.earliest_date} to ${stats.latest_date}`,
                data_quality: stats.unique_groups > 0 ? `${Math.max(0, ((parseInt(stats.unique_groups) - parseInt(stats.unmapped_groups)) / parseInt(stats.unique_groups) * 100)).toFixed(1)}%` : '100%'
            },
            features: {
                database: dbConnected ? 'Connected to Neon PostgreSQL' : 'Fallback mode active',
                dashboard: 'Interactive Dashboard with OpenStreetMap',
                maps: 'Leaflet + OpenStreetMap (Free)',
                api_endpoints: 12,
                bot: 'Telegram Bot Active',
                static_files: 'Served correctly'
            }
        });
    } catch (error) {
        res.json({ 
            status: 'partial_service', 
            timestamp: new Date().toISOString(),
            error: error.message,
            service: 'El Pollo Loco Dashboard - Fallback Mode',
            version: '2.0.0',
            database_status: 'Using fallback data'
        });
    }
});

// Dashboard diagnostics endpoint
app.get('/api/dashboard/status', async (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        dashboard_version: '2.0',
        status: 'running',
        database_connection: dbConnected,
        endpoints: [
            { endpoint: '/api/kpis', status: 'ok' },
            { endpoint: '/api/grupos', status: 'ok' },
            { endpoint: '/api/locations', status: 'ok' }
        ]
    });
});

// API Routes (existing ones)
app.get('/api/kpis', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.kpis);
    }
    
    try {
        const { grupo, estado, trimestre, periodoCas } = req.query;
        
        // Build dynamic WHERE clause
        let whereConditions = ['porcentaje IS NOT NULL'];
        let params = [];
        let paramIndex = 1;
        
        if (grupo) {
            whereConditions.push(`grupo_operativo_limpio = $${paramIndex}`);
            params.push(grupo);
            paramIndex++;
        }
        if (estado) {
            whereConditions.push(`estado_normalizado = $${paramIndex}`);
            params.push(estado);
            paramIndex++;
        }
        if (trimestre) {
            whereConditions.push(`EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`);
            params.push(parseInt(trimestre));
            paramIndex++;
        }
        
        // Filtro Período CAS (tiene prioridad sobre trimestre estándar)
        if (periodoCas && periodoCas !== 'all') {
            whereConditions.push(`
                CASE 
                    -- Locales: períodos trimestrales NL
                    WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO') 
                         AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                         AND fecha_supervision >= '2025-03-12' AND fecha_supervision <= '2025-04-30'
                        THEN 'nl_t1'
                    WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                         AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                         AND fecha_supervision >= '2025-05-01' AND fecha_supervision <= '2025-12-31'
                        THEN 'nl_t2'
                    WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                         AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                         AND fecha_supervision >= '2025-07-01'
                        THEN 'nl_t3'
                    -- Foráneas: períodos semestrales
                    WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                          OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                         AND fecha_supervision >= '2025-03-12' AND fecha_supervision <= '2025-06-30'
                        THEN 'for_s1'
                    WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                          OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                         AND fecha_supervision >= '2025-07-01' AND fecha_supervision <= '2025-12-31'
                        THEN 'for_s2'
                    ELSE 'otros'
                END = $${paramIndex}
            `);
            params.push(periodoCas);
            paramIndex++;
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        const query = `
            SELECT 
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT submission_id) as total_supervisiones,
                COUNT(DISTINCT location_name) as total_sucursales,
                COUNT(DISTINCT estado_normalizado) as total_estados,
                COUNT(DISTINCT grupo_operativo_limpio) as total_grupos,
                ROUND(MAX(porcentaje), 2) as max_calificacion,
                ROUND(MIN(porcentaje), 2) as min_calificacion
            FROM supervision_operativa_clean 
            WHERE ${whereClause}
        `;
        
        console.log(`📊 API /kpis: Executing with ${params.length} filters`);
        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
        res.json(fallbackData.kpis);
    }
});

app.get('/api/grupos', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.grupos);
    }
    
    try {
        const { grupo, estado, trimestre, periodoCas } = req.query;
        
        // Build WHERE conditions
        let whereConditions = ['porcentaje IS NOT NULL', 'grupo_operativo_limpio IS NOT NULL'];
        let params = [];
        let paramIndex = 1;
        
        // Add existing filters
        if (grupo) {
            whereConditions.push(`grupo_operativo_limpio = $${paramIndex}`);
            params.push(grupo);
            paramIndex++;
        }
        
        if (estado) {
            whereConditions.push(`estado_normalizado = $${paramIndex}`);
            params.push(estado);
            paramIndex++;
        }
        
        if (trimestre) {
            whereConditions.push(`EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`);
            params.push(trimestre);
            paramIndex++;
        }
        
        // Add Período CAS filter
        if (periodoCas && periodoCas !== 'all') {
            const periodoCasCondition = buildPeriodoCasCondition(periodoCas, paramIndex);
            if (periodoCasCondition.condition) {
                whereConditions.push(periodoCasCondition.condition);
                params.push(...periodoCasCondition.params);
                paramIndex += periodoCasCondition.params.length;
            }
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        const result = await pool.query(`
            SELECT 
                grupo_operativo_limpio as grupo_operativo,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT location_name) as sucursales
            FROM supervision_operativa_clean 
            WHERE ${whereClause}
            GROUP BY grupo_operativo_limpio
            ORDER BY AVG(porcentaje) DESC
        `, params);
        
        console.log(`👥 API /grupos: Found ${result.rows.length} groups with filters:`, { grupo, estado, trimestre, periodoCas });
        res.json(result.rows);
    } catch (error) {
        console.error('❌ API /grupos error:', error);
        res.json(fallbackData.grupos);
    }
});

// NEW API - Locations with REAL coordinates from database
app.get('/api/locations', async (req, res) => {
    if (!dbConnected) {
        console.log('⚠️ DB not connected, using fallback locations');
        return res.json([
            {name: "Sucursal Centro", group: "OGAS", lat: 25.6866, lng: -100.3161, performance: 95.5, state: "Nuevo León", municipality: "Monterrey", last_evaluation: new Date(), total_evaluations: 15}
        ]);
    }
    
    try {
        const { grupo, estado, trimestre, periodoCas } = req.query;
        
        // Build dynamic WHERE clause
        let whereConditions = ['porcentaje IS NOT NULL'];
        let params = [];
        let paramIndex = 1;
        
        if (grupo) {
            whereConditions.push(`grupo_operativo_limpio = $${paramIndex}`);
            params.push(grupo);
            paramIndex++;
        }
        if (estado) {
            whereConditions.push(`estado_normalizado = $${paramIndex}`);
            params.push(estado);
            paramIndex++;
        }
        if (trimestre) {
            whereConditions.push(`EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`);
            params.push(parseInt(trimestre));
            paramIndex++;
        }
        
        // Add Período CAS filter
        if (periodoCas && periodoCas !== 'all') {
            const periodoCasCondition = buildPeriodoCasCondition(periodoCas, paramIndex);
            if (periodoCasCondition.condition) {
                whereConditions.push(periodoCasCondition.condition);
                params.push(...periodoCasCondition.params);
                paramIndex += periodoCasCondition.params.length;
            }
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        const query = `
            WITH location_data AS (
                SELECT 
                    location_name,
                    -- Usar grupo operativo limpio (ya está mapeado)
                    MIN(grupo_operativo_limpio) as grupo_operativo,
                    -- Estado ya está normalizado en la clean view
                    MIN(estado_normalizado) as estado,
                    MIN(municipio) as municipio,
                    AVG(CAST(latitud AS FLOAT)) as lat,
                    AVG(CAST(longitud AS FLOAT)) as lng,
                    ROUND(AVG(porcentaje), 2) as performance,
                    MAX(fecha_supervision) as last_evaluation,
                    COUNT(DISTINCT submission_id) as total_evaluations
                FROM supervision_operativa_clean
                WHERE ${whereClause}
                  AND latitud IS NOT NULL 
                  AND longitud IS NOT NULL
                GROUP BY location_name
            )
            SELECT 
                location_name as name,
                grupo_operativo as "group",
                lat,
                lng,
                performance,
                estado as state,
                municipio as municipality,
                last_evaluation,
                total_evaluations
            FROM location_data
            ORDER BY performance DESC
            LIMIT 100
        `;
        
        console.log(`📍 API /locations: Executing query with ${params.length} params`);
        const result = await pool.query(query, params);
        
        console.log(`✅ API /locations: Found ${result.rows.length} real locations`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ API /locations error:', error.message);
        res.json([]);
    }
});

// Additional APIs for dashboard - ESTADOS REALES
app.get('/api/estados', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.estados || []);
    }
    
    const { grupo, estado, trimestre, periodoCas } = req.query;
    
    try {
        let whereConditions = ['porcentaje IS NOT NULL', 'estado_normalizado IS NOT NULL'];
        let params = [];
        let paramIndex = 1;
        
        // Add existing filters
        if (grupo) {
            whereConditions.push(`grupo_operativo_limpio = $${paramIndex}`);
            params.push(grupo);
            paramIndex++;
        }
        
        if (trimestre) {
            whereConditions.push(`EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`);
            params.push(trimestre);
            paramIndex++;
        }
        
        // Add Período CAS filter
        if (periodoCas && periodoCas !== 'all') {
            const periodoCasCondition = buildPeriodoCasCondition(periodoCas, paramIndex);
            if (periodoCasCondition.condition) {
                whereConditions.push(periodoCasCondition.condition);
                params.push(...periodoCasCondition.params);
                paramIndex += periodoCasCondition.params.length;
            }
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const result = await pool.query(`
            SELECT 
                estado_normalizado as estado,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT location_name) as sucursales
            FROM supervision_operativa_clean 
            ${whereClause}
            GROUP BY estado_normalizado
            ORDER BY AVG(porcentaje) DESC
        `, params);
        
        console.log(`📊 API /estados: Found ${result.rows.length} states with filters:`, { grupo, estado, trimestre, periodoCas });
        res.json(result.rows);
    } catch (error) {
        console.error('❌ API /estados error:', error);
        res.json(fallbackData.estados || []);
    }
});

app.get('/api/indicadores', async (req, res) => {
    if (!dbConnected) {
        return res.json(fallbackData.indicadores || []);
    }
    
    const { grupo, estado, trimestre, periodoCas } = req.query;
    
    try {
        let whereConditions = [
            'porcentaje IS NOT NULL', 
            'area_evaluacion IS NOT NULL',
            'area_evaluacion != \'\' ',
            'area_evaluacion != \'PUNTOS MAXIMOS\''
        ];
        let params = [];
        let paramIndex = 1;
        
        // Add existing filters
        if (grupo) {
            whereConditions.push(`grupo_operativo_limpio = $${paramIndex}`);
            params.push(grupo);
            paramIndex++;
        }
        
        if (estado) {
            whereConditions.push(`estado_normalizado = $${paramIndex}`);
            params.push(estado);
            paramIndex++;
        }
        
        if (trimestre) {
            whereConditions.push(`EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`);
            params.push(trimestre);
            paramIndex++;
        }
        
        // Add Período CAS filter
        if (periodoCas && periodoCas !== 'all') {
            const periodoCasCondition = buildPeriodoCasCondition(periodoCas, paramIndex);
            if (periodoCasCondition.condition) {
                whereConditions.push(periodoCasCondition.condition);
                params.push(...periodoCasCondition.params);
                paramIndex += periodoCasCondition.params.length;
            }
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const result = await pool.query(`
            SELECT 
                area_evaluacion as indicador,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                -- NEW: Add color classification for heat map
                CASE 
                    WHEN AVG(porcentaje) >= 90 THEN 'excellent'
                    WHEN AVG(porcentaje) >= 80 THEN 'good'
                    WHEN AVG(porcentaje) >= 70 THEN 'regular'
                    ELSE 'critical'
                END as color_category,
                -- NEW: Add rank for better ordering
                RANK() OVER (ORDER BY AVG(porcentaje) DESC) as rank_position
            FROM supervision_operativa_clean 
            ${whereClause}
            GROUP BY area_evaluacion
            ORDER BY AVG(porcentaje) DESC
            -- REMOVED LIMIT to get all 29 areas for new visualizations
        `, params);
        
        console.log(`📊 API /indicadores: Found ${result.rows.length} evaluation areas with filters:`, { grupo, estado, trimestre, periodoCas });
        res.json(result.rows);
    } catch (error) {
        console.error('❌ API /indicadores error:', error);
        res.json(fallbackData.indicadores || []);
    }
});

app.get('/api/trimestres', async (req, res) => {
    if (!dbConnected) {
        return res.json([
            { trimestre: "Q1 2025", evaluaciones: 45 },
            { trimestre: "Q2 2025", evaluaciones: 52 },
            { trimestre: "Q3 2025", evaluaciones: 38 }
        ]);
    }
    
    const { grupo, estado, periodoCas } = req.query;
    
    try {
        let whereConditions = ['fecha_supervision IS NOT NULL', 'EXTRACT(YEAR FROM fecha_supervision) = 2025'];
        let params = [];
        let paramIndex = 1;
        
        // Add existing filters
        if (grupo) {
            whereConditions.push(`grupo_operativo_limpio = $${paramIndex}`);
            params.push(grupo);
            paramIndex++;
        }
        
        if (estado) {
            whereConditions.push(`estado_normalizado = $${paramIndex}`);
            params.push(estado);
            paramIndex++;
        }
        
        // Add Período CAS filter
        if (periodoCas && periodoCas !== 'all') {
            const periodoCasCondition = buildPeriodoCasCondition(periodoCas, paramIndex);
            if (periodoCasCondition.condition) {
                whereConditions.push(periodoCasCondition.condition);
                params.push(...periodoCasCondition.params);
                paramIndex += periodoCasCondition.params.length;
            }
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const result = await pool.query(`
            SELECT 
                CASE 
                    WHEN EXTRACT(QUARTER FROM fecha_supervision) = 1 THEN 'Q1 2025'
                    WHEN EXTRACT(QUARTER FROM fecha_supervision) = 2 THEN 'Q2 2025'
                    WHEN EXTRACT(QUARTER FROM fecha_supervision) = 3 THEN 'Q3 2025'
                    WHEN EXTRACT(QUARTER FROM fecha_supervision) = 4 THEN 'Q4 2025'
                END as trimestre,
                COUNT(DISTINCT submission_id) as evaluaciones
            FROM supervision_operativa_clean 
            ${whereClause}
            GROUP BY EXTRACT(QUARTER FROM fecha_supervision)
            ORDER BY EXTRACT(QUARTER FROM fecha_supervision)
        `, params);
        
        console.log(`📊 API /trimestres: Found ${result.rows.length} quarters with filters:`, { grupo, estado, periodoCas });
        res.json(result.rows);
    } catch (error) {
        console.error('❌ API /trimestres error:', error);
        res.json([
            { trimestre: "Q1 2025", evaluaciones: 45 },
            { trimestre: "Q2 2025", evaluaciones: 52 },
            { trimestre: "Q3 2025", evaluaciones: 38 }
        ]);
    }
});

// Test endpoint for clean view (SAFE - doesn't break anything)
app.get('/api/test/clean', async (req, res) => {
    if (!dbConnected) {
        return res.json({ error: 'Database not connected' });
    }
    
    try {
        // Test if clean view exists
        const testQuery = await pool.query(`
            SELECT COUNT(*) as total
            FROM supervision_operativa_clean
            LIMIT 1
        `).catch(err => ({ error: err.message }));
        
        if (testQuery.error) {
            return res.json({ 
                clean_view_exists: false,
                error: 'Clean view not found',
                message: 'supervision_operativa_clean view does not exist',
                recommendation: 'Create the view first'
            });
        }
        
        // If view exists, get sample data
        const sampleData = await pool.query(`
            SELECT 
                location_name,
                grupo_operativo_limpio,
                estado_normalizado,
                municipio,
                latitud,
                longitud,
                COUNT(*) OVER() as total_locations
            FROM supervision_operativa_clean
            WHERE grupo_operativo_limpio != 'REQUIERE_MAPEO_MANUAL'
            ORDER BY location_name
            LIMIT 5
        `);
        
        res.json({
            clean_view_exists: true,
            total_locations: sampleData.rows[0]?.total_locations || 0,
            sample_data: sampleData.rows,
            message: 'Clean view is available and working'
        });
        
    } catch (error) {
        res.json({ 
            error: error.message,
            clean_view_exists: false 
        });
    }
});

// Debug endpoint for locations
app.get('/api/debug/locations', async (req, res) => {
    if (!dbConnected) {
        return res.json({ error: 'Database not connected' });
    }
    
    try {
        // Count total locations
        const countResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT location_name) as total_locations,
                COUNT(DISTINCT CASE WHEN latitud IS NOT NULL THEN location_name END) as with_coords,
                COUNT(DISTINCT CASE WHEN latitud IS NULL THEN location_name END) as without_coords
            FROM supervision_operativa_clean
        `);
        
        // Sample locations with and without coords
        const sampleResult = await pool.query(`
            SELECT DISTINCT
                location_name,
                grupo_operativo_limpio,
                estado_normalizado,
                municipio,
                latitud,
                longitud
            FROM supervision_operativa_clean
            ORDER BY latitud DESC NULLS LAST
            LIMIT 10
        `);
        
        res.json({
            summary: countResult.rows[0],
            sample_locations: sampleResult.rows,
            database_connected: dbConnected
        });
        
    } catch (error) {
        res.json({ 
            error: error.message,
            database_connected: dbConnected 
        });
    }
});

// =====================================================
// PERÍODOS CAS - Nuevo filtro personalizado
// =====================================================
app.get('/api/periodos-cas', async (req, res) => {
    if (!dbConnected) {
        return res.json([
            { periodo: "all", nombre: "Todos los períodos", count: 0 },
            { periodo: "nl_t1", nombre: "NL 1er Trimestre (12 Mar - 16 Abr)", count: 0 },
            { periodo: "nl_t2", nombre: "NL 2do Trimestre (11 Jun - 18 Ago)", count: 0 },
            { periodo: "nl_t3", nombre: "NL 3er Trimestre (19 Ago - actual)", count: 0 },
            { periodo: "for_s1", nombre: "Foráneas 1er Semestre (10 Abr - 9 Jun)", count: 0 },
            { periodo: "for_s2", nombre: "Foráneas 2do Semestre (30 Jul - 15 Ago)", count: 0 }
        ]);
    }

    try {
        const result = await pool.query(`
            WITH periodos_cas AS (
                SELECT 
                    location_name,
                    grupo_operativo_limpio,
                    estado_normalizado,
                    fecha_supervision,
                    -- FIXED: Asignar período CAS con rangos de fechas corregidos
                    CASE 
                        -- Locales NL: períodos trimestrales corregidos
                        WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO') 
                             AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                             AND fecha_supervision >= '2025-03-12' AND fecha_supervision <= '2025-04-16'
                            THEN 'nl_t1'
                        WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                             AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                             AND fecha_supervision >= '2025-06-11' AND fecha_supervision <= '2025-08-18'
                            THEN 'nl_t2'
                        WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                             AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                             AND fecha_supervision >= '2025-08-19' AND fecha_supervision <= '2025-12-31'
                            THEN 'nl_t3'
                        -- Foráneas: períodos semestrales corregidos
                        WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                              OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                             AND fecha_supervision >= '2025-04-10' AND fecha_supervision <= '2025-06-09'
                            THEN 'for_s1'
                        WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                              OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                             AND fecha_supervision >= '2025-07-30' AND fecha_supervision <= '2025-08-15'
                            THEN 'for_s2'
                        ELSE 'otros'
                    END as periodo_cas
                FROM supervision_operativa_clean
                WHERE fecha_supervision IS NOT NULL
            ),
            periodos_counts AS (
                SELECT 
                    'all' as periodo,
                    'Todos los períodos' as nombre,
                    COUNT(*) as count,
                    1 as sort_order
                FROM periodos_cas
                
                UNION ALL
                
                SELECT 
                    'nl_t1' as periodo,
                    'NL 1er Trimestre (12 Mar - 16 Abr)' as nombre,
                    COUNT(*) as count,
                    2 as sort_order
                FROM periodos_cas WHERE periodo_cas = 'nl_t1'
                
                UNION ALL
                
                SELECT 
                    'nl_t2' as periodo,
                    'NL 2do Trimestre (11 Jun - 18 Ago)' as nombre,
                    COUNT(*) as count,
                    3 as sort_order
                FROM periodos_cas WHERE periodo_cas = 'nl_t2'
                
                UNION ALL
                
                SELECT 
                    'nl_t3' as periodo,
                    'NL 3er Trimestre (19 Ago - actual)' as nombre,
                    COUNT(*) as count,
                    4 as sort_order
                FROM periodos_cas WHERE periodo_cas = 'nl_t3'
                
                UNION ALL
                
                SELECT 
                    'for_s1' as periodo,
                    'Foráneas 1er Semestre (10 Abr - 9 Jun)' as nombre,
                    COUNT(*) as count,
                    5 as sort_order
                FROM periodos_cas WHERE periodo_cas = 'for_s1'
                
                UNION ALL
                
                SELECT 
                    'for_s2' as periodo,
                    'Foráneas 2do Semestre (30 Jul - 15 Ago)' as nombre,
                    COUNT(*) as count,
                    6 as sort_order
                FROM periodos_cas WHERE periodo_cas = 'for_s2'
            )
            SELECT periodo, nombre, count
            FROM periodos_counts
            ORDER BY sort_order
        `);
        
        console.log(`📅 API /periodos-cas: Found ${result.rows.length} períodos CAS`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ API /periodos-cas error:', error);
        res.json([
            { periodo: "all", nombre: "Todos los períodos", count: 0 },
            { periodo: "nl_t1", nombre: "NL 1er Trimestre (12 Mar - 16 Abr)", count: 0 },
            { periodo: "nl_t2", nombre: "NL 2do Trimestre (11 Jun - 18 Ago)", count: 0 },
            { periodo: "nl_t3", nombre: "NL 3er Trimestre (19 Ago - actual)", count: 0 },
            { periodo: "for_s1", nombre: "Foráneas 1er Semestre (10 Abr - 9 Jun)", count: 0 },
            { periodo: "for_s2", nombre: "Foráneas 2do Semestre (30 Jul - 15 Ago)", count: 0 }
        ]);
    }
});

// =====================================================
// SUCURSALES RANKING - Nueva gráfica de barras
// =====================================================
app.get('/api/sucursales-ranking', async (req, res) => {
    if (!dbConnected) {
        return res.json([
            { sucursal: "Demo Sucursal 1", grupo_operativo: "GRUPO DEMO", estado: "Nuevo León", promedio: 92.5, evaluaciones: 15 },
            { sucursal: "Demo Sucursal 2", grupo_operativo: "GRUPO DEMO", estado: "Nuevo León", promedio: 88.3, evaluaciones: 12 }
        ]);
    }
    
    const { grupo, estado, trimestre, periodoCas, limit = 20 } = req.query;
    
    try {
        let whereConditions = [
            'porcentaje IS NOT NULL', 
            'location_name IS NOT NULL',
            'grupo_operativo_limpio IS NOT NULL'
        ];
        let params = [];
        let paramIndex = 1;
        
        // Add existing filters
        if (grupo) {
            whereConditions.push(`grupo_operativo_limpio = $${paramIndex}`);
            params.push(grupo);
            paramIndex++;
        }
        
        if (estado) {
            whereConditions.push(`estado_normalizado = $${paramIndex}`);
            params.push(estado);
            paramIndex++;
        }
        
        if (trimestre) {
            whereConditions.push(`EXTRACT(QUARTER FROM fecha_supervision) = $${paramIndex}`);
            params.push(trimestre);
            paramIndex++;
        }
        
        // Add Período CAS filter
        if (periodoCas && periodoCas !== 'all') {
            const periodoCasCondition = buildPeriodoCasCondition(periodoCas, paramIndex);
            if (periodoCasCondition.condition) {
                whereConditions.push(periodoCasCondition.condition);
                params.push(...periodoCasCondition.params);
                paramIndex += periodoCasCondition.params.length;
            }
        }
        
        // Add limit parameter
        params.push(parseInt(limit) || 20);
        const limitParam = `$${paramIndex}`;
        
        const whereClause = whereConditions.join(' AND ');
        
        const result = await pool.query(`
            SELECT 
                location_name as sucursal,
                grupo_operativo_limpio as grupo_operativo,
                estado_normalizado as estado,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as evaluaciones
            FROM supervision_operativa_clean 
            WHERE ${whereClause}
            GROUP BY location_name, grupo_operativo_limpio, estado_normalizado
            HAVING COUNT(DISTINCT area_evaluacion) >= 5
            ORDER BY AVG(porcentaje) DESC
            LIMIT ${limitParam}
        `, params);
        
        console.log(`🏪 API /sucursales-ranking: Found ${result.rows.length} sucursales with filters:`, { grupo, estado, trimestre, periodoCas, limit });
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ API /sucursales-ranking error:', error);
        res.json([
            { sucursal: "Error - Sucursal Demo", grupo_operativo: "GRUPO DEMO", estado: "Nuevo León", promedio: 85.0, evaluaciones: 10 }
        ]);
    }
});

// Webhook endpoint for Telegram - MOVED TO AFTER BOT INITIALIZATION

// =====================================================
// DATE RANGE ANALYSIS - Check what dates we actually have
// =====================================================
app.get('/api/date-analysis', async (req, res) => {
    if (!dbConnected) {
        return res.json({ error: 'Database not connected' });
    }

    try {
        const query = `
            SELECT 
                MIN(fecha_supervision) as fecha_minima,
                MAX(fecha_supervision) as fecha_maxima,
                COUNT(DISTINCT DATE_TRUNC('month', fecha_supervision)) as meses_unicos,
                COUNT(DISTINCT DATE_TRUNC('year', fecha_supervision)) as anos_unicos,
                COUNT(*) as total_registros
            FROM ${DATA_SOURCE}
            WHERE fecha_supervision IS NOT NULL
        `;
        
        const result = await pool.query(query);
        
        // Get monthly distribution
        const monthlyQuery = `
            SELECT 
                DATE_TRUNC('month', fecha_supervision) as mes,
                COUNT(*) as registros,
                COUNT(DISTINCT grupo_operativo_limpio) as grupos
            FROM ${DATA_SOURCE}
            WHERE fecha_supervision IS NOT NULL
            GROUP BY DATE_TRUNC('month', fecha_supervision)
            ORDER BY mes
            LIMIT 20
        `;
        
        const monthlyResult = await pool.query(monthlyQuery);
        
        res.json({
            dateRange: result.rows[0],
            monthlyDistribution: monthlyResult.rows
        });

    } catch (error) {
        console.error('Date Analysis Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// HEATMAP CAS PERIODS - For historico-v2.html with real CAS periods
// =====================================================
app.get('/api/heatmap-periods/:groupId?', async (req, res) => {
    if (!dbConnected) {
        return res.json({
            success: false,
            error: 'Database connection unavailable',
            data: []
        });
    }

    try {
        const { groupId } = req.params;
        let groupFilter = '';
        
        if (groupId && groupId !== 'all') {
            groupFilter = `AND grupo_operativo_limpio = $1`;
        }

        // Get data grouped by CAS periods using CORRECTED date logic
        const query = `
            WITH periodos_cas AS (
                SELECT 
                    grupo_operativo_limpio,
                    location_name,
                    estado_normalizado,
                    fecha_supervision,
                    porcentaje,
                    -- FIXED: Asignar período CAS con rangos de fechas corregidos
                    CASE 
                        -- Locales NL: períodos trimestrales corregidos
                        WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO') 
                             AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                             AND fecha_supervision >= '2025-03-12' AND fecha_supervision <= '2025-04-16'
                            THEN 'nl_t1'
                        WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                             AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                             AND fecha_supervision >= '2025-06-11' AND fecha_supervision <= '2025-08-18'
                            THEN 'nl_t2'
                        WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
                             AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                             AND fecha_supervision >= '2025-08-19' AND fecha_supervision <= '2025-12-31'
                            THEN 'nl_t3'
                        -- Foráneas: períodos semestrales corregidos  
                        WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero') 
                              OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                             AND fecha_supervision >= '2025-04-10' AND fecha_supervision <= '2025-06-09'
                            THEN 'for_s1'
                        WHEN (location_name IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
                              OR (estado_normalizado != 'Nuevo León' AND grupo_operativo_limpio != 'GRUPO SALTILLO'))
                             AND fecha_supervision >= '2025-07-30' AND fecha_supervision <= '2025-08-15'
                            THEN 'for_s2'
                        ELSE 'otros'
                    END as periodo_cas
                FROM supervision_operativa_clean
                WHERE porcentaje IS NOT NULL 
                    AND grupo_operativo_limpio IS NOT NULL
                    AND fecha_supervision IS NOT NULL
                    ${groupFilter}
            )
            SELECT 
                grupo_operativo_limpio as grupo,
                periodo_cas,
                ROUND(AVG(porcentaje)::numeric, 2) as promedio,
                COUNT(*) as evaluaciones,
                COUNT(DISTINCT location_name) as sucursales
            FROM periodos_cas
            WHERE periodo_cas IS NOT NULL AND periodo_cas != 'otros'
            GROUP BY grupo_operativo_limpio, periodo_cas
            ORDER BY grupo_operativo_limpio, periodo_cas
        `;

        const params = groupId && groupId !== 'all' ? [groupId] : [];
        const result = await pool.query(query, params);

        // Define CAS periods in the correct order
        const casPeriodsOrder = ['nl_t1', 'for_s1', 'nl_t2', 'for_s2', 'nl_t3'];
        
        // Group results by grupo and create period columns
        const groupedData = {};

        result.rows.forEach(row => {
            const grupo = row.grupo;
            const periodo = row.periodo_cas;
            
            if (!groupedData[grupo]) {
                groupedData[grupo] = {};
            }
            
            groupedData[grupo][periodo] = {
                promedio: parseFloat(row.promedio),
                evaluaciones: row.evaluaciones,
                sucursales: row.sucursales
            };
        });

        // Get all groups and calculate their overall averages using Dashboard methodology
        const allGroupsQuery = `
            SELECT 
                grupo_operativo_limpio as grupo,
                ROUND(AVG(porcentaje)::numeric, 2) as promedio_general
            FROM supervision_operativa_clean
            WHERE grupo_operativo_limpio IS NOT NULL
              AND porcentaje IS NOT NULL
            GROUP BY grupo_operativo_limpio
        `;
        
        const allGroupsResult = await pool.query(allGroupsQuery);
        const groupOverallAverages = {};
        
        allGroupsResult.rows.forEach(row => {
            groupOverallAverages[row.grupo] = parseFloat(row.promedio_general);
        });

        // Include ALL groups from overall averages, not just those with CAS period data
        const allGroups = new Set([...Object.keys(groupedData), ...Object.keys(groupOverallAverages)]);
        
        // Format data for heatmap table
        const heatmapRows = Array.from(allGroups).map(grupo => {
            const periodos = groupedData[grupo] || {};
            const row = {
                grupo,
                periodos: {},
                promedio_general: groupOverallAverages[grupo] || 0  // Use Dashboard methodology
            };

            casPeriodsOrder.forEach(periodo => {
                if (periodos[periodo]) {
                    row.periodos[periodo] = periodos[periodo];
                } else {
                    row.periodos[periodo] = null;
                }
            });

            return row;
        });

        res.json({
            success: true,
            data: {
                periods: casPeriodsOrder, // CAS periods in order
                groups: heatmapRows,
                totalGroups: heatmapRows.length,
                periodLabels: {
                    'nl_t1': 'NL-T1',
                    'for_s1': 'FOR-S1', 
                    'nl_t2': 'NL-T2',
                    'for_s2': 'FOR-S2',
                    'nl_t3': 'NL-T3'
                }
            }
        });

    } catch (error) {
        console.error('❌ Heatmap CAS Periods API Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error fetching heatmap CAS periods data',
            details: error.message 
        });
    }
});

// TEST ENDPOINT - Remove after debugging
app.get('/api/test-periods', async (req, res) => {
    if (!dbConnected) {
        return res.json({ error: 'DB not connected' });
    }
    
    try {
        const query = `
            SELECT 
                MIN(fecha_supervision) as fecha_min,
                MAX(fecha_supervision) as fecha_max,
                COUNT(*) as total_records,
                estado_normalizado,
                grupo_operativo_limpio,
                location_name
            FROM supervision_operativa_clean
            WHERE porcentaje IS NOT NULL 
            GROUP BY estado_normalizado, grupo_operativo_limpio, location_name
            ORDER BY estado_normalizado, grupo_operativo_limpio
            LIMIT 10
        `;
        
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 El Pollo Loco Interactive Dashboard v2.0 running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log(`📱 Telegram Web App ready`);
    
    // Start Telegram Bot if in production
    if (process.env.NODE_ENV === 'production' || process.env.START_BOT === 'true') {
        console.log('🤖 Starting Telegram Bot...');
        
        // Setup basic Telegram bot
        const TelegramBot = require('node-telegram-bot-api');
        if (process.env.TELEGRAM_BOT_TOKEN) {
            global.telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
            
            // Dashboard command - with fallback inline keyboard
            global.telegramBot.onText(/\/dashboard/, async (msg) => {
                const chatId = msg.chat.id;
                const dashboardUrl = 'https://pollo-loco-supervision.onrender.com';
                
                console.log(`📊 Dashboard command received from chat ${chatId}`);
                
                try {
                    // Check if Menu Button should work or provide inline keyboard as backup
                    const keyboard = {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: "📊 Abrir Dashboard",
                                web_app: { url: `${dashboardUrl}/dashboard` }
                            }]]
                        }
                    };
                    
                    await global.telegramBot.sendMessage(chatId, 
                        '📊 **Dashboard Interactivo v2.0**\n\n🔹 **Opción 1:** Usa el botón azul "Dashboard" junto al campo de texto\n🔹 **Opción 2:** Usa el botón de abajo ⬇️',
                        { parse_mode: 'Markdown', ...keyboard }
                    );
                    
                    console.log('✅ Dashboard message with fallback keyboard sent successfully');
                } catch (error) {
                    console.error('❌ Error sending dashboard message:', error);
                    await global.telegramBot.sendMessage(chatId, 'Error al mostrar información del dashboard.');
                }
            });

            // Análisis Histórico command
            global.telegramBot.onText(/\/historico/, async (msg) => {
                const chatId = msg.chat.id;
                const dashboardUrl = 'https://pollo-loco-supervision.onrender.com';
                
                console.log(`📈 Histórico command received from chat ${chatId}`);
                
                try {
                    const keyboard = {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: "📈 Ver Análisis Histórico",
                                web_app: { url: `${dashboardUrl}/historico` }
                            }]]
                        }
                    };
                    
                    await global.telegramBot.sendMessage(chatId, 
                        '📈 **Análisis Histórico Disponible**\n\n¡Explora la evolución histórica con 6 perspectivas diferentes!\n\n• 🧠 Vista Inteligente\n• ⚖️ Análisis Comparativo\n• 🗺️ Mapa de Calor\n• ⏰ Evolución Temporal\n• 💡 Insights & Tendencias\n• 📱 Vista Móvil\n\n👆 Toca el botón para abrir',
                        { parse_mode: 'Markdown', ...keyboard }
                    );
                    
                    console.log('✅ Histórico message sent successfully');
                } catch (error) {
                    console.error('❌ Error sending histórico message:', error);
                    await global.telegramBot.sendMessage(chatId, 'Error al mostrar información del análisis histórico.');
                }
            });
            
            // Start command with individual Menu Button setup
            global.telegramBot.onText(/\/start/, async (msg) => {
                const chatId = msg.chat.id;
                const userName = msg.from.first_name || msg.from.username || 'Usuario';
                
                console.log(`👋 /start command from user ${userName} (${chatId})`);
                
                // Set Menu Button for this specific user using DIRECT Telegram API
                try {
                    const dashboardUrl = 'https://pollo-loco-supervision.onrender.com';
                    
                    console.log(`🔧 Setting individual Menu Button for user ${userName} (${chatId}) using direct API`);
                    
                    // DIRECT API CALL to Telegram (bypass node-telegram-bot-api bug)
                    const apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setChatMenuButton`;
                    const payload = {
                        chat_id: chatId,
                        menu_button: JSON.stringify({
                            type: 'web_app',
                            text: 'Dashboard',
                            web_app: { url: `${dashboardUrl}/dashboard` }
                        })
                    };
                    
                    console.log('🌐 Direct API payload:', JSON.stringify(payload, null, 2));
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    const result = await response.json();
                    console.log('📡 Telegram API response:', JSON.stringify(result, null, 2));
                    
                    if (result.ok) {
                        console.log(`✅ Menu Button SUCCESSFULLY configured for user ${userName} via direct API`);
                    } else {
                        console.error(`❌ Direct API failed:`, result.description);
                        throw new Error(result.description);
                    }
                    
                    // Send welcome message with keyboard buttons
                    const welcomeMessage = `🤖 **¡Hola ${userName}! Soy Ana, tu analista de El Pollo Loco**\n\n` +
                                          `📊 **Usa los botones de abajo para navegar:**\n` +
                                          `• Dashboard - Mapas y gráficos interactivos\n` +
                                          `• Análisis Histórico - 6 visualizaciones diferentes\n` +
                                          `• Ayuda - Lista de comandos\n\n` +
                                          `💡 **También puedes preguntarme sobre:**\n` +
                                          `• Performance de grupos operativos\n` +
                                          `• Análisis de sucursales\n` +
                                          `• Tendencias y comparaciones\n\n` +
                                          `¡Pregúntame lo que necesites! 🚀`;
                    
                    const keyboard = {
                        reply_markup: {
                            keyboard: [
                                ['📊 Dashboard', '📈 Análisis Histórico'],
                                ['❓ Ayuda', '💬 Chat con Ana']
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: false,
                            persistent: true
                        }
                    };
                    
                    await global.telegramBot.sendMessage(chatId, welcomeMessage, { 
                        parse_mode: 'Markdown',
                        ...keyboard 
                    });
                } catch (error) {
                    console.error(`❌ Error setting Menu Button for user ${userName}:`, error.message);
                    
                    // Fallback message if Menu Button fails
                    await global.telegramBot.sendMessage(chatId, 
                        `¡Hola ${userName}! Soy el bot de El Pollo Loco.\n\n📊 **Dashboard Operativo disponible:**\n• Usa /dashboard para acceder al dashboard\n• (Menu Button en configuración...)`,
                        { parse_mode: 'Markdown' }
                    );
                }
            });
            
            // Keyboard button handlers
            global.telegramBot.onText(/📊 Dashboard/, async (msg) => {
                console.log('📊 Dashboard button pressed');
                return global.telegramBot.emit('text', msg, [null, '/dashboard']);
            });

            global.telegramBot.onText(/📈 Análisis Histórico/, async (msg) => {
                const chatId = msg.chat.id;
                const dashboardUrl = 'https://pollo-loco-supervision.onrender.com';
                
                console.log('📈 Análisis Histórico button pressed - Opening WebApp directly');
                
                try {
                    const keyboard = {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: "🚀 ABRIR ANÁLISIS HISTÓRICO 🚀",
                                web_app: { url: `${dashboardUrl}/historico` }
                            }]]
                        }
                    };
                    
                    await global.telegramBot.sendMessage(chatId, 
                        '📈 **Análisis Histórico - 6 Visualizaciones**\n\n👆 **TOCA EL BOTÓN DE ABAJO PARA ABRIR** 👆',
                        { parse_mode: 'Markdown', ...keyboard }
                    );
                } catch (error) {
                    console.error('❌ Error opening histórico WebApp:', error);
                    await global.telegramBot.sendMessage(chatId, 'Error al abrir el análisis histórico.');
                }
            });

            global.telegramBot.onText(/❓ Ayuda/, async (msg) => {
                const chatId = msg.chat.id;
                const helpMessage = `📚 **Ayuda - El Pollo Loco Bot**\n\n` +
                                   `🔹 **Botones disponibles:**\n` +
                                   `📊 Dashboard - Mapas interactivos y gráficos\n` +
                                   `📈 Análisis Histórico - 6 perspectivas de evolución\n` +
                                   `❓ Ayuda - Esta información\n` +
                                   `💬 Chat con Ana - Conversación libre\n\n` +
                                   `🔹 **Comandos de texto:**\n` +
                                   `/start - Mostrar menú principal\n` +
                                   `/dashboard - Abrir dashboard\n` +
                                   `/historico - Abrir análisis histórico\n\n` +
                                   `💡 **También puedes preguntarme directamente sobre cualquier tema de supervisión.**`;
                
                await global.telegramBot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
            });

            global.telegramBot.onText(/💬 Chat con Ana/, async (msg) => {
                const chatId = msg.chat.id;
                await global.telegramBot.sendMessage(chatId, '💬 **Modo Chat Activado**\n\n¡Hola! Ahora puedes preguntarme cualquier cosa sobre:\n\n• Performance de grupos\n• Análisis de sucursales\n• Comparaciones y tendencias\n• Datos específicos\n\n¿En qué te puedo ayudar? 🤖');
            });
            
            // Basic message handler
            global.telegramBot.on('message', async (msg) => {
                const chatId = msg.chat.id;
                const text = msg.text || '';
                
                // Skip commands and keyboard buttons
                if (text.startsWith('/') || 
                    text.includes('📊') || 
                    text.includes('📈') || 
                    text.includes('❓') || 
                    text.includes('💬')) {
                    return;
                }
                
                // Default response
                await global.telegramBot.sendMessage(chatId, 
                    'Usa los botones de abajo para navegar o pregúntame directamente sobre supervisión.'
                );
            });
            
            // Set Menu Button for all users (global default) using DIRECT API
            try {
                const dashboardUrl = 'https://pollo-loco-supervision.onrender.com';
                
                console.log('🔧 Setting global Menu Button using direct Telegram API');
                
                // DIRECT API CALL to Telegram (bypass node-telegram-bot-api)
                const apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setChatMenuButton`;
                const payload = {
                    // No chat_id = applies to all users by default
                    menu_button: JSON.stringify({
                        type: 'web_app',
                        text: 'Dashboard',
                        web_app: { url: `${dashboardUrl}/dashboard` }
                    })
                };
                
                console.log('🌐 Global Menu Button payload:', JSON.stringify(payload, null, 2));
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                console.log('📡 Global Menu Button API response:', JSON.stringify(result, null, 2));
                
                if (result.ok) {
                    console.log('✅ Global Menu Button configured successfully via direct API');
                } else {
                    console.error('❌ Global Menu Button failed:', result.description);
                    throw new Error(result.description);
                }
            } catch (error) {
                console.error('❌ Error setting global Menu Button:', error.message);
                console.log('🔄 Menu Button failed, individual setup will be used in /start');
            }
            
            console.log('✅ Telegram bot configured with commands, dashboard available');
            
            // Add webhook endpoint AFTER bot initialization
            app.post('/webhook', (req, res) => {
                console.log('🔗 Webhook received:', req.body.message ? `Message from ${req.body.message.from.id}` : 'Update');
                if (global.telegramBot) {
                    global.telegramBot.processUpdate(req.body);
                } else {
                    console.error('❌ No bot instance available for webhook');
                }
                res.status(200).json({ ok: true });
            });
            
            console.log('🔗 Webhook endpoint /webhook registered');
        }
        
        // Set webhook in production
        if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_BOT_TOKEN) {
            const webhookUrl = 'https://pollo-loco-supervision.onrender.com/webhook';
            console.log(`🔗 Setting webhook to: ${webhookUrl}`);
            
            try {
                const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: webhookUrl })
                });
                const result = await response.json();
                
                if (result.ok) {
                    console.log('✅ Webhook set successfully');
                } else {
                    console.error('❌ Webhook error:', result.description);
                }
            } catch (error) {
                console.error('❌ Error setting webhook:', error.message);
            }
        }
    }
});

module.exports = app;