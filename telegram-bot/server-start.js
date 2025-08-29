// =====================================================
// SERVER STARTUP SCRIPT - ENSURES EXPRESS STARTS
// =====================================================

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

// Import the bot (but don't start it until Express is ready)
process.env.DELAY_BOT_START = 'true';
const bot = require('./bot');

const app = express();
const port = process.env.PORT || 10000;

// Security and optimization middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://cdn.jsdelivr.net", "https://telegram.org"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://maps.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        },
    },
}));

app.use(compression());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'web-app/public')));

// Basic routes
app.get('/', (req, res) => {
    res.json({
        message: 'El Pollo Loco Supervision System',
        version: '2.0',
        status: 'running',
        endpoints: {
            webhook: '/webhook',
            dashboard: '/dashboard',
            health: '/health',
            api: '/api/*'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'El Pollo Loco Bot + Dashboard',
        timestamp: new Date().toISOString()
    });
});

app.get('/dashboard', (req, res) => {
    const indexPath = path.join(__dirname, 'web-app/public/index.html');
    console.log('📊 Serving dashboard from:', indexPath);
    res.sendFile(indexPath);
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Express server running on port ${port}`);
    console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
    console.log(`🔍 Health: http://localhost:${port}/health`);
    
    // Now start the bot integrations
    console.log('🤖 Initializing bot integrations...');
});

module.exports = app;