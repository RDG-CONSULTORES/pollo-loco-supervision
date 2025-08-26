const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Pool } = require('pg');
const SupervisionAI = require('./ai-intelligence');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// In production, use hardcoded values as fallback
if (process.env.NODE_ENV === 'production' && !process.env.TELEGRAM_BOT_TOKEN) {
    const prodConfig = require('../config/production');
    Object.keys(prodConfig).forEach(key => {
        if (!process.env[key]) {
            process.env[key] = prodConfig[key];
        }
    });
}

// Initialize database pool for AI
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialize AI engine
const aiEngine = new SupervisionAI(pool);

const token = process.env.TELEGRAM_BOT_TOKEN;
// In production, use relative paths for same-server API calls
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'http://localhost:10000/api'  // Internal port in Render
    : (process.env.API_BASE_URL || 'http://localhost:3001/api');
    
const WEBAPP_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

// AI Configuration
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!token) {
  console.error('❌ Bot token is required! Please set TELEGRAM_BOT_TOKEN in .env file');
  process.exit(1);
}

// Configure bot to avoid conflicts
const bot = new TelegramBot(token, { polling: false });

// Only start polling in development or if explicitly enabled
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_POLLING === 'true') {
    bot.startPolling();
    console.log('📡 Bot polling enabled');
} else {
    console.log('📡 Bot in webhook mode (polling disabled)');
}

console.log('🤖 EPL Estandarización Operativa Bot started!');

// AI Agent Functions - Enhanced Intelligence
async function queryDatabase(question) {
  try {
    const lowerQuestion = question.toLowerCase();
    let data = {};
    
    // Analyze question for multiple data needs
    const needsGroups = lowerQuestion.includes('grupo') || lowerQuestion.includes('top') || lowerQuestion.includes('mejor');
    const needsEstados = lowerQuestion.includes('estado') || lowerQuestion.includes('región');
    const needsCritical = lowerQuestion.includes('crítico') || lowerQuestion.includes('problema') || lowerQuestion.includes('bajo');
    const needsKPIs = lowerQuestion.includes('promedio') || lowerQuestion.includes('general') || lowerQuestion.includes('kpi');
    const needsTrimestre = lowerQuestion.includes('trimestre') || lowerQuestion.includes('actual') || lowerQuestion.includes('periodo');
    const needsRanking = lowerQuestion.includes('ranking') || lowerQuestion.includes('top') || lowerQuestion.includes('mejores');
    
    // Fetch all relevant data
    const promises = [];
    
    if (needsKPIs || !needsGroups && !needsEstados && !needsCritical) {
      promises.push(
        axios.get(`${API_BASE_URL}/kpis`)
          .then(res => { data.kpis = res.data; })
          .catch(err => console.error('KPIs error:', err))
      );
    }
    
    if (needsGroups || needsRanking) {
      promises.push(
        axios.get(`${API_BASE_URL}/grupos`)
          .then(res => { data.grupos = res.data; })
          .catch(err => console.error('Grupos error:', err))
      );
    }
    
    if (needsEstados) {
      promises.push(
        axios.get(`${API_BASE_URL}/estados`)
          .then(res => { data.estados = res.data; })
          .catch(err => console.error('Estados error:', err))
      );
    }
    
    if (needsCritical) {
      promises.push(
        axios.get(`${API_BASE_URL}/kpis/critical`)
          .then(res => { data.critical = res.data; })
          .catch(err => console.error('Critical error:', err))
      );
    }
    
    if (needsRanking) {
      promises.push(
        axios.get(`${API_BASE_URL}/grupos/ranking?limit=10`)
          .then(res => { data.ranking = res.data.top || res.data; })
          .catch(err => console.error('Ranking error:', err))
      );
    }
    
    await Promise.all(promises);
    return data;
  } catch (error) {
    console.error('Error querying database:', error);
    return null;
  }
}

async function askAI(question, context = null) {
  if (!CLAUDE_API_KEY && !OPENAI_API_KEY) {
    return "🤖 El agente de IA no está configurado. Usa los comandos específicos como /kpis, /grupos, etc.";
  }
  
  try {
    // Get database context if not provided
    if (!context) {
      context = await queryDatabase(question);
    }
    
    const systemPrompt = `Eres un asistente de IA especializado en análisis de datos de supervisión operativa para El Pollo Loco CAS. 
    
Tienes acceso a datos de supervisión operativa que incluyen:
- 135 supervisiones completadas
- 79 sucursales evaluadas  
- 9 estados con presencia
- 38 indicadores diferentes
- Datos organizados por Grupo Operativo, Estado y Trimestre

Responde en español de manera concisa y profesional. Usa emojis apropiados.
Si no tienes datos específicos, indica qué comandos pueden ayudar (/kpis, /grupos, /estados, /criticas, /top10).`;

    // Prepare context data summary
    let contextSummary = '';
    if (context && Array.isArray(context)) {
      contextSummary = `Datos disponibles: ${context.length} registros encontrados.`;
      if (context.length > 0) {
        const sample = context[0];
        contextSummary += ` Ejemplo: ${JSON.stringify(sample)}`;
      }
    } else if (context && typeof context === 'object') {
      contextSummary = `Datos KPI: ${JSON.stringify(context)}`;
    }

    const userPrompt = `Pregunta del usuario: "${question}"
    
Contexto de datos: ${contextSummary}

Por favor responde de manera útil y específica basándote en los datos disponibles.`;

    // Try Claude API first, then OpenAI as fallback
    if (CLAUDE_API_KEY) {
      // Note: This would require proper Claude API integration
      // For now, return a structured response based on the data
      return generateStructuredResponse(question, context);
    } else if (OPENAI_API_KEY) {
      // Note: This would require proper OpenAI API integration
      // For now, return a structured response based on the data
      return generateStructuredResponse(question, context);
    }
    
    return generateStructuredResponse(question, context);
  } catch (error) {
    console.error('AI Error:', error);
    return "🤖 Error al procesar tu pregunta. Intenta usar comandos específicos como /kpis o /grupos.";
  }
}

function generateStructuredResponse(question, context) {
  const lowerQuestion = question.toLowerCase();
  
  // Enhanced responses based on actual data
  if (context && Object.keys(context).length > 0) {
    let response = '';
    
    // Handle trimestre + top grupos query
    if ((lowerQuestion.includes('trimestre') || lowerQuestion.includes('actual')) && 
        (lowerQuestion.includes('grupo') || lowerQuestion.includes('top'))) {
      
      if (context.grupos && context.grupos.length > 0) {
        const topGroups = context.grupos.slice(0, 5);
        response = `📊 **Top 5 Grupos Operativos - Trimestre Actual**\n\n`;
        
        topGroups.forEach((grupo, index) => {
          const emoji = index < 3 ? ['🥇', '🥈', '🥉'][index] : '🏆';
          response += `${emoji} **${grupo.grupo_operativo}**\n`;
          response += `   • Promedio: ${grupo.promedio}%\n`;
          response += `   • Supervisiones: ${grupo.supervisiones}\n`;
          response += `   • Sucursales: ${grupo.sucursales}\n\n`;
        });
        
        if (context.kpis) {
          response += `📈 **Resumen General**:\n`;
          response += `• Total supervisiones: ${context.kpis.total_supervisiones}\n`;
          response += `• Promedio global: ${context.kpis.promedio_general}%\n`;
        }
        
        return response;
      }
    }
    
    // Handle specific queries with real data
    if (lowerQuestion.includes('promedio') && context.kpis) {
      response = `🎯 **Promedio General**: ${context.kpis.promedio_general}%\n\n`;
      response += `📊 **Estadísticas Completas**:\n`;
      response += `• Total supervisiones: ${context.kpis.total_supervisiones}\n`;
      response += `• Sucursales evaluadas: ${context.kpis.total_sucursales}\n`;
      response += `• Estados con presencia: ${context.kpis.total_estados}\n`;
      response += `• Calificación máxima: ${context.kpis.max_calificacion}%\n`;
      response += `• Calificación mínima: ${context.kpis.min_calificacion}%\n`;
      return response;
    }
    
    if ((lowerQuestion.includes('mejor') || lowerQuestion.includes('top')) && context.grupos) {
      const topGroups = context.grupos.slice(0, lowerQuestion.includes('5') ? 5 : 3);
      response = `🏆 **Mejores Grupos Operativos**:\n\n`;
      topGroups.forEach((grupo, index) => {
        const emoji = ['🥇', '🥈', '🥉'][index] || '🏆';
        response += `${emoji} **${grupo.grupo_operativo}**: ${grupo.promedio}% (${grupo.supervisiones} supervisiones)\n`;
      });
      return response;
    }
    
    if (lowerQuestion.includes('crítico') && context.critical) {
      response = `🚨 **Indicadores Críticos (<70%)**:\n\n`;
      const criticalItems = context.critical.slice(0, 5);
      criticalItems.forEach((item, index) => {
        response += `${index + 1}. **${item.indicador}** - ${item.promedio}%\n`;
        response += `   📍 ${item.sucursal} (${item.grupo_operativo})\n`;
        response += `   🗺️ ${item.estado}\n\n`;
      });
      return response;
    }
    
    if (lowerQuestion.includes('estado') && context.estados) {
      const topEstados = context.estados.slice(0, 5);
      response = `📍 **Top Estados por Desempeño**:\n\n`;
      topEstados.forEach((estado, index) => {
        const emoji = ['🥇', '🥈', '🥉'][index] || '📍';
        response += `${emoji} **${estado.estado}**: ${estado.promedio}%\n`;
        response += `   • ${estado.supervisiones} supervisiones\n`;
        response += `   • ${estado.sucursales} sucursales\n\n`;
      });
      return response;
    }
    
    // If we have data but no specific match, provide a summary
    if (context.kpis || context.grupos) {
      return generateIntelligentSummary(context, question);
    }
  }
  
  // Fallback to static responses
  return generateStaticResponse(lowerQuestion);
}

function generateIntelligentSummary(data, question) {
  let summary = `🤖 **Análisis Inteligente**\n\n`;
  
  if (data.kpis) {
    summary += `📊 **KPIs Principales**:\n`;
    summary += `• Promedio general: ${data.kpis.promedio_general}%\n`;
    summary += `• Total supervisiones: ${data.kpis.total_supervisiones}\n\n`;
  }
  
  if (data.grupos && data.grupos.length > 0) {
    summary += `🏆 **Mejores Grupos**:\n`;
    data.grupos.slice(0, 3).forEach((g, i) => {
      summary += `${i + 1}. ${g.grupo_operativo}: ${g.promedio}%\n`;
    });
    summary += `\n`;
  }
  
  summary += `💡 **Sugerencia**: Pregúntame algo más específico como:\n`;
  summary += `• "¿Cuáles son los top 5 grupos del trimestre actual?"\n`;
  summary += `• "¿Qué sucursales tienen problemas críticos?"\n`;
  summary += `• "¿Cuál es el desempeño por estado?"\n`;
  
  return summary;
}

function generateStaticResponse(lowerQuestion) {
  // Keep existing static responses as fallback
  if (lowerQuestion.includes('promedio') || lowerQuestion.includes('general')) {
    return `🎯 **Promedio General**: 89.54%\n\n📊 Basado en 135 supervisiones en 79 sucursales.\nUsa /kpis para más detalles.`;
  }
  
  if (lowerQuestion.includes('mejor') || lowerQuestion.includes('top')) {
    return `🏆 **Mejores Grupos**:\n• OGAS: 97.6%\n• PLOG QUERÉTARO: 97.0%\n• TEC: 93.1%\n\nUsa /top10 para ranking completo.`;
  }
  
  // Default response
  return `🤖 Puedo ayudarte con información sobre:\n\n📊 **/kpis** - Indicadores principales\n🏢 **/grupos** - Análisis por grupo\n📍 **/estados** - Análisis por estado\n🚨 **/criticas** - Indicadores críticos\n🏆 **/top10** - Mejores sucursales\n\n¿Sobre qué te gustaría saber más?`;
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `🍗 **EPL Estandarización Operativa**

¡Bienvenido al sistema de supervisión operativa inteligente!

🎯 **Funcionalidades principales:**
• Dashboard interactivo con 5 diseños
• Análisis en tiempo real de supervisiones
• 🧠 **AI Avanzado** con comprensión contextual
• Base de datos con 561,868 registros

🤖 **Ejemplos de preguntas inteligentes:**
• "¿Cuáles son los top 5 grupos del trimestre actual?"
• "Compara el desempeño de grupos vs estados"
• "¿Qué sucursales tienen problemas críticos?"
• "Dame recomendaciones para mejorar"
• "¿Cómo está el promedio de esta semana?"

💡 **Simplemente escribe tu pregunta** o usa los comandos:`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎨 Dashboard (Elige tu diseño)', web_app: { url: WEBAPP_URL } }
        ],
        [
          { text: '📊 KPIs Rápidos', callback_data: 'kpis' },
          { text: '🚨 Críticas', callback_data: 'criticas' }
        ],
        [
          { text: '🏆 Top 10', callback_data: 'top10' },
          { text: '❓ Ayuda', callback_data: 'help' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, welcomeMessage, keyboard);
});

// Comando /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
🆘 Ayuda - El Pollo Loco Supervision Bot

📋 Comandos principales:
• /start - Menú principal
• /dashboard - Dashboard completo
• /kpis - Ver KPIs principales
• /grupos [NOMBRE] - Info de grupo específico
• /estados [NOMBRE] - Info de estado específico
• /criticas - Indicadores bajo 70%
• /top10 - Mejores 10 sucursales
• /alertas - Configurar notificaciones

🎯 Ejemplos de uso:
• /grupos OGAS
• /estados Nuevo León
• /criticas 60 (umbral personalizado)

📱 También puedes usar la aplicación web integrada desde el menú principal.
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

// Comando /kpis
bot.onText(/\/kpis/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    bot.sendMessage(chatId, '📊 Obteniendo KPIs...');
    
    const response = await axios.get(`${API_BASE_URL}/kpis`);
    const kpis = response.data;
    
    const message = `
📊 KPIs Principales - El Pollo Loco CAS

🎯 Promedio General: ${kpis.promedio_general}%
👥 Total Supervisiones: ${kpis.total_supervisiones}
🏢 Sucursales Evaluadas: ${kpis.total_sucursales}
📍 Estados con Presencia: ${kpis.total_estados}
🔺 Calificación Máxima: ${kpis.max_calificacion}%
🔻 Calificación Mínima: ${kpis.min_calificacion}%

📈 Actualizado: ${new Date().toLocaleString('es-MX')}
    `;
    
    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    bot.sendMessage(chatId, '❌ Error al obtener KPIs. Intenta más tarde.');
  }
});

// Comando /estados
bot.onText(/\/estados(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const estadoFilter = match ? match[1] : null;
  
  try {
    bot.sendMessage(chatId, '📍 Obteniendo datos por estado...');
    
    const response = await axios.get(`${API_BASE_URL}/estados`);
    const estados = response.data;
    
    if (estadoFilter) {
      const estado = estados.find(e => e.estado.toLowerCase().includes(estadoFilter.toLowerCase()));
      if (estado) {
        const message = `📍 **Estado: ${estado.estado}**

📊 Promedio: **${estado.promedio}%**
👥 Supervisiones: **${estado.supervisiones}**
🏪 Sucursales: **${estado.sucursales}**

📈 Actualizado: ${new Date().toLocaleString('es-MX')}`;
        
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, `❌ No se encontró el estado "${estadoFilter}"`);
      }
    } else {
      let message = '📍 **Ranking por Estados:**\n\n';
      estados.slice(0, 10).forEach((estado, index) => {
        const emoji = index < 3 ? ['🥇', '🥈', '🥉'][index] : '📍';
        message += `${emoji} **${estado.estado}**\n`;
        message += `   📊 ${estado.promedio}% (${estado.supervisiones} sup.)\n\n`;
      });
      
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error fetching estados:', error);
    bot.sendMessage(chatId, '❌ Error al obtener datos de estados. Intenta más tarde.');
  }
});

// Comando /grupos
bot.onText(/\/grupos(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const grupoFilter = match ? match[1] : null;
  
  try {
    bot.sendMessage(chatId, '🏢 Obteniendo datos de grupos...');
    
    const response = await axios.get(`${API_BASE_URL}/grupos`);
    const grupos = response.data;
    
    if (grupoFilter) {
      const grupo = grupos.find(g => g.grupo_operativo.toLowerCase().includes(grupoFilter.toLowerCase()));
      if (grupo) {
        const message = `
🏢 Grupo Operativo: ${grupo.grupo_operativo}

📊 Promedio: ${grupo.promedio}%
👥 Supervisiones: ${grupo.supervisiones}
🏪 Sucursales: ${grupo.sucursales}

📈 Actualizado: ${new Date().toLocaleString('es-MX')}
        `;
        bot.sendMessage(chatId, message);
      } else {
        bot.sendMessage(chatId, `❌ No se encontró el grupo "${grupoFilter}"`);
      }
    } else {
      let message = '🏢 Ranking de Grupos Operativos:\n\n';
      grupos.slice(0, 10).forEach((grupo, index) => {
        const emoji = index < 3 ? ['🥇', '🥈', '🥉'][index] : '🏢';
        message += `${emoji} ${grupo.grupo_operativo}\n`;
        message += `   📊 ${grupo.promedio}% (${grupo.supervisiones} sup.)\n\n`;
      });
      
      bot.sendMessage(chatId, message);
    }
  } catch (error) {
    console.error('Error fetching grupos:', error);
    bot.sendMessage(chatId, '❌ Error al obtener datos de grupos. Intenta más tarde.');
  }
});

// Comando /criticas
bot.onText(/\/criticas(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const threshold = match ? parseInt(match[1]) : 70;
  
  try {
    bot.sendMessage(chatId, `🚨 Buscando indicadores críticos (<${threshold}%)...`);
    
    const response = await axios.get(`${API_BASE_URL}/kpis/critical`, {
      params: { threshold }
    });
    const criticals = response.data;
    
    if (criticals.length === 0) {
      bot.sendMessage(chatId, `✅ ¡Excelente! No hay indicadores críticos bajo ${threshold}%`);
      return;
    }
    
    let message = `🚨 Indicadores Críticos (<${threshold}%):\n\n`;
    criticals.slice(0, 10).forEach((item, index) => {
      message += `${index + 1}. ${item.indicador}\n`;
      message += `   🏪 ${item.sucursal} (${item.grupo_operativo})\n`;
      message += `   📊 ${item.promedio}% - ${item.estado}\n\n`;
    });
    
    if (criticals.length > 10) {
      message += `... y ${criticals.length - 10} más.\n`;
    }
    
    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching critical indicators:', error);
    bot.sendMessage(chatId, '❌ Error al obtener indicadores críticos. Intenta más tarde.');
  }
});

// Comando /top10
bot.onText(/\/top10/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    bot.sendMessage(chatId, '🏆 Obteniendo mejores sucursales...');
    
    const response = await axios.get(`${API_BASE_URL}/grupos/ranking`, {
      params: { limit: 10 }
    });
    const ranking = response.data;
    
    let message = '🏆 TOP 10 MEJORES SUCURSALES:\n\n';
    ranking.top.forEach((sucursal, index) => {
      const emoji = ['🥇', '🥈', '🥉'][index] || '🏆';
      message += `${emoji} ${sucursal.sucursal}\n`;
      message += `   📊 ${sucursal.promedio}% - ${sucursal.grupo_operativo}\n`;
      message += `   📍 ${sucursal.estado}\n\n`;
    });
    
    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching top 10:', error);
    bot.sendMessage(chatId, '❌ Error al obtener top 10. Intenta más tarde.');
  }
});

// Comando /dashboard
bot.onText(/\/dashboard/, (msg) => {
  const chatId = msg.chat.id;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎨 Mini Web App (5 Diseños)', web_app: { url: WEBAPP_URL } }
        ],
        [
          { text: '📊 Dashboard Completo', url: `${WEBAPP_URL}/dashboard` }
        ],
        [
          { text: '📈 KPIs Rápidos', callback_data: 'kpis' },
          { text: '📋 Resumen', callback_data: 'resumen' }
        ]
      ]
    }
  };
  
  const message = `📊 **Dashboard de Supervisión Operativa**

🎨 **Mini Web App**: 5 diseños únicos para elegir
📊 **Dashboard Completo**: React con gráficos y filtros
📱 **Optimizado para móviles**

¿Qué prefieres usar?`;
  
  bot.sendMessage(chatId, message, keyboard);
});

// Callback queries
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = message.chat.id;
  
  switch (data) {
    case 'kpis':
      // Execute the KPIs command directly
      try {
        bot.sendMessage(chatId, '📊 Obteniendo KPIs...');
        const response = await axios.get(`${API_BASE_URL}/kpis`);
        const kpis = response.data;
        
        const message = `📊 **KPIs Principales**

🎯 Promedio General: **${kpis.promedio_general}%**
👥 Total Supervisiones: **${kpis.total_supervisiones}**
🏢 Sucursales Evaluadas: **${kpis.total_sucursales}**
📍 Estados: **${kpis.total_estados}**
🔺 Calificación Máxima: **${kpis.max_calificacion}%**
🔻 Calificación Mínima: **${kpis.min_calificacion}%**

📈 Actualizado: ${new Date().toLocaleString('es-MX')}`;
        
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        bot.sendMessage(chatId, '❌ Error al obtener KPIs. Intenta más tarde.');
      }
      break;
    case 'grupos':
      bot.sendMessage(chatId, '/grupos');
      break;
    case 'criticas':
      // Execute the critical indicators command directly
      try {
        bot.sendMessage(chatId, '🚨 Buscando indicadores críticos...');
        const response = await axios.get(`${API_BASE_URL}/kpis/critical`, { params: { threshold: 70 } });
        const criticals = response.data;
        
        if (criticals.length === 0) {
          bot.sendMessage(chatId, '✅ ¡Excelente! No hay indicadores críticos bajo 70%');
          return;
        }
        
        let message = '🚨 **Indicadores Críticos (<70%):**\n\n';
        criticals.slice(0, 5).forEach((item, index) => {
          message += `${index + 1}. **${item.indicador}**\n`;
          message += `   🏪 ${item.sucursal} (${item.grupo_operativo})\n`;
          message += `   📊 **${item.promedio}%** - ${item.estado}\n\n`;
        });
        
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        bot.sendMessage(chatId, '❌ Error al obtener indicadores críticos.');
      }
      break;
    case 'top10':
      bot.sendMessage(chatId, '/top10');
      break;
    case 'help':
      const helpMessage = `🆘 **EPL Estandarización Operativa - Ayuda**

🤖 **AI Agent**: Solo escribe tu pregunta en lenguaje natural
   • "¿Cuál es el promedio general?"
   • "¿Qué sucursales tienen problemas?"
   • "Muéstrame el top 5"

📊 **Comandos rápidos:**
   • /kpis - Ver indicadores principales
   • /grupos [nombre] - Info de grupo específico
   • /estados [nombre] - Info por estado
   • /criticas [umbral] - Indicadores críticos
   • /top10 - Mejores sucursales

🎨 **Dashboard Web**: Accede al botón del menú principal para ver el dashboard completo con 5 diseños diferentes.

💡 **Tip**: ¡Solo pregúntame lo que necesites!`;
      
      bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
      break;
    case 'resumen':
      try {
        const [kpis, grupos, ranking] = await Promise.all([
          axios.get(`${API_BASE_URL}/kpis`),
          axios.get(`${API_BASE_URL}/grupos`),
          axios.get(`${API_BASE_URL}/grupos/ranking`, { params: { limit: 3 } })
        ]);
        
        const resumen = `
📊 RESUMEN EJECUTIVO - El Pollo Loco CAS

🎯 KPIs Principales:
• Promedio General: ${kpis.data.promedio_general}%
• Supervisiones: ${kpis.data.total_supervisiones}
• Sucursales: ${kpis.data.total_sucursales}

🏆 Top 3 Sucursales:
${ranking.data.top.slice(0, 3).map((s, i) => 
  `${['🥇', '🥈', '🥉'][i]} ${s.sucursal} - ${s.promedio}%`
).join('\n')}

🏢 Mejor Grupo: ${grupos.data[0]?.grupo_operativo} (${grupos.data[0]?.promedio}%)

📈 Actualizado: ${new Date().toLocaleString('es-MX')}
        `;
        
        bot.sendMessage(chatId, resumen);
      } catch (error) {
        bot.sendMessage(chatId, '❌ Error al generar resumen');
      }
      break;
  }
  
  bot.answerCallbackQuery(callbackQuery.id);
});

// AI Agent - Handle any text message that's not a command
bot.on('message', async (msg) => {
  // Skip if it's a command or not a text message
  if (msg.text && !msg.text.startsWith('/') && msg.chat.type !== 'group') {
    const chatId = msg.chat.id;
    const question = msg.text;
    
    try {
      // Send typing indicator
      bot.sendChatAction(chatId, 'typing');
      
      // Use new AI engine for intelligent responses
      const response = await aiEngine.analyzeAndRespond(question);
      
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      
      // Log for analysis
      console.log(`AI Query processed: "${question}"`);
    } catch (error) {
      console.error('AI Agent error:', error);
      
      // Fallback to simple response system
      try {
        const context = await queryDatabase(question);
        const response = generateStructuredResponse(question, context);
        bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      } catch (fallbackError) {
        bot.sendMessage(chatId, '🤖 Error al procesar tu pregunta. Intenta usar comandos específicos como /kpis.');
      }
    }
  }
});

// Error handling
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('✅ Bot is running! Send /start to begin.');

// Export bot for webhook usage
module.exports = bot;