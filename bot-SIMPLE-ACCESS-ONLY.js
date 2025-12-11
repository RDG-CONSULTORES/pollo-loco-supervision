// 🤖 EL POLLO LOCO CAS - BOT SIMPLE SOLO PARA ACCESO
// Solo botón de menú para acceder al dashboard - SIN IA ni consultas complejas

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Bot Token
const token = process.env.TELEGRAM_BOT_TOKEN || '8341799056:AAFvMMPzuplDDsOM07m5ANI5WVCATchBPeY';

if (!token || token === 'undefined') {
    console.error('❌ TELEGRAM_BOT_TOKEN requerido!');
    process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Bot El Pollo Loco CAS - VERSIÓN SIMPLE iniciado');
console.log('🎯 Función: Solo acceso al dashboard, SIN IA');

// URL del dashboard funcionando
const DASHBOARD_URL = 'https://pollo-loco-supervision.onrender.com';

// ============================================================================
// 🎯 COMANDOS SIMPLES
// ============================================================================

// Comando /start - Bienvenida simple
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Usuario';
    
    const welcomeMessage = `
🍗 *Bienvenido ${firstName}*

Dashboard El Pollo Loco CAS - Sistema de Supervisión Operativa

📊 *Dashboard disponible:*
• 238 supervisiones activas
• 91.20% promedio general  
• 20 grupos operativos
• 85 sucursales monitoreadas

🚀 *Acceso rápido:*
Usa el botón "📊 Dashboard" en el menú o haz click aquí:
[🍗 Abrir Dashboard](${DASHBOARD_URL})

*Comandos disponibles:*
/dashboard - Abrir dashboard
/info - Información del sistema`;

    bot.sendMessage(chatId, welcomeMessage, { 
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: '📊 Abrir Dashboard', url: DASHBOARD_URL }
            ]]
        }
    });
});

// Comando /dashboard - Acceso directo
bot.onText(/\/dashboard/, (msg) => {
    const chatId = msg.chat.id;
    
    const dashboardMessage = `
📊 *Dashboard El Pollo Loco CAS*

✅ Sistema operativo al 100%
🔗 Acceso directo disponible

[🍗 Abrir Dashboard Completo](${DASHBOARD_URL})

📋 *Información actual:*
• KPIs en tiempo real
• Mapas interactivos
• Reportes por grupo operativo
• Historiales de supervisión`;

    bot.sendMessage(chatId, dashboardMessage, { 
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: '📊 Abrir Dashboard', url: DASHBOARD_URL }
            ]]
        }
    });
});

// Comando /info - Información del sistema
bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id;
    
    const infoMessage = `
ℹ️ *Información del Sistema*

🍗 *El Pollo Loco CAS*
Dashboard de Supervisión Operativa

📊 *Estadísticas actuales:*
• Total supervisiones: 238
• Promedio general: 91.20%
• Grupos operativos: 20
• Sucursales: 85

🌐 *URL Dashboard:*
${DASHBOARD_URL}

🤖 *Bot versión:* Simple Access Only
🎯 *Función:* Acceso rápido al dashboard

📱 *Optimizado para dispositivos móviles*`;

    bot.sendMessage(chatId, infoMessage, { 
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: '📊 Ver Dashboard', url: DASHBOARD_URL }
            ]]
        }
    });
});

// ============================================================================
// 🔧 RESPUESTAS AUTOMÁTICAS SIMPLES
// ============================================================================

// Respuesta a cualquier otro mensaje
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Skip si es un comando
    if (!text || text.startsWith('/')) return;

    // Respuesta simple y directa
    const quickResponse = `
🤖 *Bot Simple - Solo Acceso*

Para ver el dashboard usa:
[🍗 Dashboard El Pollo Loco](${DASHBOARD_URL})

Comandos disponibles:
• /dashboard - Acceso directo
• /info - Información del sistema
• /start - Bienvenida`;

    bot.sendMessage(chatId, quickResponse, { 
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: '📊 Abrir Dashboard', url: DASHBOARD_URL }
            ]]
        }
    });
});

// ============================================================================
// 🛠️ ERROR HANDLING Y LOGGING
// ============================================================================

bot.on('polling_error', (error) => {
    console.log('⚠️ Polling error:', error.message);
});

bot.on('error', (error) => {
    console.log('❌ Bot error:', error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Bot detenido gracefully');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Bot terminado gracefully');
    bot.stopPolling();
    process.exit(0);
});

console.log('✅ Bot configurado - Modo: SIMPLE ACCESS ONLY');
console.log('🔗 Dashboard URL:', DASHBOARD_URL);
console.log('📱 Bot URL: https://t.me/EPLEstandarizacionBot');
console.log('🎯 Función: Solo botón de acceso, sin IA ni consultas complejas');