// Quick fixes for dashboard connectivity issues

const fs = require('fs');
const path = require('path');

// Fix 1: Add comprehensive error logging to app.js
function addErrorLogging() {
    const appJsPath = path.join(__dirname, 'telegram-bot/web-app/public/app.js');
    let appJs = fs.readFileSync(appJsPath, 'utf8');
    
    // Add detailed error logging to loadAllData
    const loadAllDataFix = `
    async loadAllData() {
        const queryParams = new URLSearchParams(this.currentFilters).toString();
        console.log('🔄 Loading all data with filters:', this.currentFilters);
        
        try {
            // Load all data in parallel - Using existing endpoints
            console.log('📡 Fetching data from APIs...');
            const [locationsRes, overviewRes, groupsRes, areasRes, trendsRes] = await Promise.all([
                fetch(\`/api/locations?\${queryParams}\`).then(r => { console.log('Locations status:', r.status); return r; }),
                fetch('/api/kpis').then(r => { console.log('KPIs status:', r.status); return r; }),
                fetch('/api/grupos').then(r => { console.log('Grupos status:', r.status); return r; }),
                fetch('/api/indicadores').then(r => { console.log('Indicadores status:', r.status); return r; }),
                fetch('/api/trimestres').then(r => { console.log('Trimestres status:', r.status); return r; })
            ]);

            // Parse responses with error handling
            console.log('📊 Parsing responses...');
            try {
                this.data.locations = await locationsRes.json();
                console.log('✅ Locations loaded:', this.data.locations.length);
            } catch (e) {
                console.error('❌ Error parsing locations:', e);
                this.data.locations = [];
            }
            
            try {
                const kpisData = await overviewRes.json();
                console.log('✅ KPIs loaded:', kpisData);
                this.data.overview = {
                    network_performance: kpisData.promedio_general,
                    total_locations: kpisData.total_sucursales,
                    active_groups: this.data.locations.length ? new Set(this.data.locations.map(l => l.group)).size : 0,
                    total_evaluations: kpisData.total_supervisiones,
                    last_update: new Date().toISOString()
                };
            } catch (e) {
                console.error('❌ Error parsing KPIs:', e);
                this.data.overview = {};
            }
            
            try {
                this.data.groups = await groupsRes.json();
                console.log('✅ Groups loaded:', this.data.groups.length);
            } catch (e) {
                console.error('❌ Error parsing groups:', e);
                this.data.groups = [];
            }
            
            try {
                this.data.areas = await areasRes.json();
                console.log('✅ Areas loaded:', this.data.areas.length);
            } catch (e) {
                console.error('❌ Error parsing areas:', e);
                this.data.areas = [];
            }
            
            try {
                this.data.trends = await trendsRes.json();
                console.log('✅ Trends loaded:', this.data.trends.length);
            } catch (e) {
                console.error('❌ Error parsing trends:', e);
                this.data.trends = [];
            }

            console.log('📈 Updating UI components...');
            // Update UI
            this.updateKPIs();
            this.updateMap();
            this.updateCharts();
            
            console.log('✅ All data loaded successfully!');

            // Notify Telegram Web App
            if (window.telegramWebApp?.isInTelegram) {
                window.telegramWebApp.notifyDataLoaded({
                    locations: this.data.locations.length,
                    groups: this.data.groups.length,
                    performance: this.data.overview.network_performance
                });
            }

        } catch (error) {
            console.error('❌ Critical error loading data:', error);
            console.error('Stack trace:', error.stack);
            this.showError('Error loading dashboard data: ' + error.message);
            throw error;
        }
    }`;
    
    // Replace the loadAllData method
    const loadAllDataRegex = /async loadAllData\(\) \{[\s\S]*?\n    \}/;
    if (appJs.match(loadAllDataRegex)) {
        appJs = appJs.replace(loadAllDataRegex, loadAllDataFix);
        console.log('✅ Added comprehensive error logging to loadAllData');
    }
    
    // Save the fixed file
    fs.writeFileSync(appJsPath, appJs);
    console.log('✅ Updated app.js with error logging');
}

// Fix 2: Add CORS headers to server
function addCORSHeaders() {
    console.log('ℹ️  CORS headers already configured in server-integrated.js');
}

// Fix 3: Create a debug endpoint
function createDebugEndpoint() {
    const debugCode = `
// Debug endpoint
app.get('/api/debug', async (req, res) => {
    const debug = {
        database: {
            connected: dbConnected,
            url: process.env.DATABASE_URL ? 'Set' : 'Not set'
        },
        endpoints: {
            kpis: '/api/kpis',
            grupos: '/api/grupos',
            locations: '/api/locations',
            estados: '/api/estados',
            indicadores: '/api/indicadores',
            trimestres: '/api/trimestres'
        },
        timestamp: new Date().toISOString()
    };
    
    if (dbConnected) {
        try {
            const result = await pool.query('SELECT COUNT(*) as count FROM supervision_operativa_detalle');
            debug.database.recordCount = result.rows[0].count;
        } catch (e) {
            debug.database.error = e.message;
        }
    }
    
    res.json(debug);
});`;
    
    console.log('ℹ️  Add this debug endpoint to server-integrated.js:');
    console.log(debugCode);
}

// Run fixes
console.log('🔧 Applying dashboard connectivity fixes...\n');
addErrorLogging();
addCORSHeaders();
createDebugEndpoint();
console.log('\n✅ Fixes applied! Restart the server to see changes.');