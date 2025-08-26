// =========================================
// BOT SIMPLE - RESET TOTAL ARCHITECTURE
// Solo Ana Intelligent + database simple
// =========================================

const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');
const AnaIntelligent = require('./ana-intelligent');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Database connection simple
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Ana Intelligent - SOLO SISTEMA
const ana = new AnaIntelligent(pool);

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ Bot token requerido! Set TELEGRAM_BOT_TOKEN en .env');
  process.exit(1);
}

// Bot configuration
const bot = new TelegramBot(token, { polling: false });

// Solo en development usar polling
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_POLLING === 'true') {
    bot.startPolling();
    console.log('📡 Bot polling habilitado');
} else {
    console.log('📡 Bot en modo webhook');
}

console.log('🤖 Ana Intelligent Bot iniciado - ARQUITECTURA SIMPLE');
console.log('🧠 Sistema: Un solo archivo inteligente');
console.log('⚡ IA: OpenAI GPT-4 Turbo máximo');

// =========================================
// MANEJO DE MENSAJES ULTRA SIMPLE
// =========================================

// Comando /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  const welcomeMessage = `👋 ¡Hola! Soy Ana, tu analista experta de El Pollo Loco

🧠 **NUEVA VERSIÓN ULTRA INTELIGENTE**
Pregúntame cualquier cosa sobre tus datos operativos:

💡 **Ejemplos:**
• "Dame el ranking de grupos"
• "¿Cómo va Tepeyac este trimestre?"  
• "Áreas críticas de OGAS"
• "Configura Tepeyac como mi grupo principal"

🎯 **Comandos rápidos:**
/ranking - Top 5 grupos
/areas - Áreas de oportunidad  
/stats - Estado del sistema

⚡ Ana entiende contexto y genera consultas inteligentes automáticamente`;

  bot.sendMessage(chatId, welcomeMessage);
});

// Comando /ranking
bot.onText(/\/ranking/, async (msg) => {
  const chatId = msg.chat.id;
  const response = await ana.processQuestion("Dame el top 5 ranking de grupos operativos", chatId);
  bot.sendMessage(chatId, response);
});

// Comando /areas
bot.onText(/\/areas/, async (msg) => {
  const chatId = msg.chat.id;  
  const response = await ana.processQuestion("¿Cuáles son las principales áreas críticas?", chatId);
  bot.sendMessage(chatId, response);
});

// Comando /stats  
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const stats = ana.getStats();
  
  const statsMessage = `📊 **Ana Intelligent - Estado del Sistema**

🧠 **Arquitectura:** ${stats.architecture}
🤖 **IA:** ${stats.ai_provider}
💾 **Base de datos:** ${stats.database_integration}
💬 **Conversaciones activas:** ${stats.conversations}
✅ **Status:** ${stats.status}

⚡ Sistema optimizado para máximo rendimiento`;

  bot.sendMessage(chatId, statsMessage);
});

// MANEJO DE MENSAJES GENERAL - TODO A ANA
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  
  // Ignorar comandos (ya manejados arriba)
  if (messageText.startsWith('/')) return;
  
  console.log(`📥 Mensaje de ${chatId}: "${messageText}"`);
  
  try {
    // TODO pasa a Ana Intelligent
    const response = await ana.processQuestion(messageText, chatId);
    
    console.log(`📤 Respuesta para ${chatId}: ${response.substring(0, 100)}...`);
    
    await bot.sendMessage(chatId, response);
    
  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);
    
    const errorMessage = `🔧 Ana está procesando tu consulta

⚡ Intenta:
• Reformular tu pregunta
• /ranking - Ver grupos
• /areas - Áreas críticas

💡 Ana mejora continuamente`;

    bot.sendMessage(chatId, errorMessage);
  }
});

// Manejo de errores
bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

// Manejo de webhook para producción
if (process.env.NODE_ENV === 'production') {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Webhook endpoint
  app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => {
    console.log(`🌐 Webhook server running on port ${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Cerrando bot...');
  if (pool) await pool.end();
  process.exit(0);
});

console.log('🚀 Ana Intelligent Bot COMPLETAMENTE OPERATIVA');