// Bot Diagnostic Script
console.log('🔍 DIAGNÓSTICO DEL BOT DE TELEGRAM\n');

// Test API endpoints
const axios = require('axios');

async function testEndpoints() {
    const endpoints = [
        'https://pollo-loco-supervision.onrender.com/api/kpis',
        'https://pollo-loco-supervision.onrender.com/api/grupos',
        'https://pollo-loco-supervision.onrender.com/api/estados',
        'https://pollo-loco-supervision.onrender.com/api/bot/status'
    ];

    console.log('📋 PROBANDO ENDPOINTS:\n');
    
    for (const url of endpoints) {
        try {
            const response = await axios.get(url, { timeout: 5000 });
            console.log(`✅ ${url}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
        } catch (error) {
            console.log(`❌ ${url}`);
            console.log(`   Error: ${error.message}`);
        }
        console.log('');
    }
}

testEndpoints();