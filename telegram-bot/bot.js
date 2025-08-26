const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Pool } = require('pg');
const SupervisionAI = require('./ai-intelligence');
const TutorialSystem = require('./tutorial-system');
const RealSupervisionIntelligence = require('./real-data-intelligence');
const IntelligentSupervisionSystem = require('./intelligent-supervision-system');

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

// Initialize AI engines
const aiEngine = new SupervisionAI(pool);
const realDataEngine = new RealSupervisionIntelligence(pool);
const intelligentSystem = new IntelligentSupervisionSystem(pool);

const token = process.env.TELEGRAM_BOT_TOKEN;
// In production, use relative paths for same-server API calls
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'http://localhost:10000/api'  // Internal port in Render
    : (process.env.API_BASE_URL || 'http://localhost:3001/api');
    
const WEBAPP_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

// AI Configuration
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Debug token availability at startup
console.log('🔑 Token Debug at startup:');
console.log(`   CLAUDE_API_KEY exists: ${CLAUDE_API_KEY ? 'YES' : 'NO'}`);
console.log(`   Token length: ${CLAUDE_API_KEY ? CLAUDE_API_KEY.length : 0}`);
console.log(`   Token starts correctly: ${CLAUDE_API_KEY && CLAUDE_API_KEY.startsWith('sk-ant-') ? 'YES' : 'NO'}`);
console.log(`   OPENAI_API_KEY exists: ${OPENAI_API_KEY ? 'YES' : 'NO'}`);
console.log(`   OpenAI token length: ${OPENAI_API_KEY ? OPENAI_API_KEY.length : 0}`);
console.log(`   OpenAI token starts correctly: ${OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-') ? 'YES' : 'NO'}`);
if (CLAUDE_API_KEY) {
  console.log(`   Token first 20 chars: ${CLAUDE_API_KEY.substring(0, 20)}...`);
  console.log(`   Token last 10 chars: ...${CLAUDE_API_KEY.substring(CLAUDE_API_KEY.length - 10)}`);
}
if (OPENAI_API_KEY) {
  console.log(`   OpenAI first 20 chars: ${OPENAI_API_KEY.substring(0, 20)}...`);
  console.log(`   OpenAI last 10 chars: ...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10)}`);
}

if (!token) {
  console.error('❌ Bot token is required! Please set TELEGRAM_BOT_TOKEN in .env file');
  process.exit(1);
}

// Configure bot to avoid conflicts
const bot = new TelegramBot(token, { polling: false });

// Initialize tutorial system AFTER bot is created
const tutorialSystem = new TutorialSystem(bot, aiEngine);

// Message deduplication cache
const messageCache = new Map();

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
  try {
    console.log(`🧠 Processing with INTELLIGENT SUPERVISION SYSTEM: "${question}"`);
    
    // Use Intelligent Supervision System for advanced analysis
    const analysis = await intelligentSystem.analyzeIntelligentQuestion(question);
    
    let intelligentData = null;
    
    // Route to specific intelligent methods based on intent
    switch (analysis.intent) {
      case 'group_opportunities':
        const grupoName = analysis.entity.name;
        intelligentData = await intelligentSystem.getGroupOpportunities(
          grupoName, analysis.trimester, analysis.quantity
        );
        console.log(`📊 Group opportunities retrieved for ${grupoName}:`, intelligentData.opportunities.length);
        break;
        
      case 'sucursal_opportunities':
        const sucursalName = analysis.entity.name;
        intelligentData = await intelligentSystem.getSucursalOpportunities(sucursalName, analysis.quantity);
        console.log(`🏪 Sucursal opportunities retrieved for ${sucursalName}:`, intelligentData.opportunities.length);
        break;
        
      case 'quarterly_comparison':
        const grupo = analysis.entity.name || 'TEPEYAC'; // Default to TEPEYAC if not specified
        const current = analysis.trimester === 'all' ? intelligentSystem.getCurrentTrimester() : analysis.trimester;
        const previous = intelligentSystem.getPreviousTrimester();
        intelligentData = await intelligentSystem.getQuarterlyComparison(grupo, current, previous);
        console.log(`📈 Quarterly comparison retrieved for ${grupo}`);
        break;
        
      case 'group_ranking':
      case 'general_ranking':
        intelligentData = await intelligentSystem.getTopGrupos(analysis.trimester, analysis.quantity);
        console.log(`🏆 Ranking retrieved:`, intelligentData.ranking.length, 'grupos');
        break;
        
      default:
        // For other intents, use general context
        intelligentData = await queryDatabase(question);
        console.log(`🔍 General data retrieved for intent: ${analysis.intent}`);
    }
    
    // Validate entity exists if specified
    if (analysis.entity.name && analysis.entity.type !== 'general') {
      const entityExists = await intelligentSystem.validateEntity(analysis.entity.type, analysis.entity.name);
      if (!entityExists) {
        return `❌ No se encontró ${analysis.entity.type} "${analysis.entity.name}". Verifica el nombre e intenta nuevamente.`;
      }
    }
    
    // Try OpenAI API with intelligent data
    if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-')) {
      try {
        console.log('🎯 Attempting OpenAI API with intelligent data...');
        const aiResponse = await callOpenAI(question, intelligentData);
        
        // ANTI-HALLUCINATION: Validate AI response
        if (realDataEngine.validateIndicators(aiResponse)) {
          console.log('✅ AI response validated - no hallucination detected');
          return aiResponse;
        } else {
          console.log('⚠️ HALLUCINATION DETECTED in AI response - using intelligent fallback');
          return await generateIntelligentResponse(question, intelligentData, analysis);
        }
      } catch (openaiError) {
        console.log('⚠️ OpenAI failed, using intelligent structured response...');
      }
    }
    
    // Fallback to intelligent structured response
    console.log('🔄 Using intelligent structured response...');
    return await generateIntelligentResponse(question, intelligentData, analysis);
    
  } catch (error) {
    console.error('🚨 Intelligent System Error:', error);
    return "🤖 Error en el sistema inteligente. Los datos podrían no estar disponibles para el período especificado.";
  }
}

// Claude API Integration
async function callClaudeAPI(question, context) {
  console.log('🚀 Starting Claude API call...');
  console.log(`📝 Question: "${question}"`);
  console.log(`🔑 Using token: ${CLAUDE_API_KEY ? CLAUDE_API_KEY.substring(0, 20) + '...' + CLAUDE_API_KEY.substring(CLAUDE_API_KEY.length - 10) : 'NO TOKEN'}`);
  
  try {
    const prompt = createIntelligentPrompt(question, context);
    console.log(`📄 Prompt length: ${prompt.length} characters`);
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${CLAUDE_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    console.log('✅ Claude API response received successfully!');
    console.log(`📏 Response length: ${response.data.content[0].text.length} characters`);
    
    return response.data.content[0].text;
  } catch (error) {
    console.error('❌ Claude API ERROR:');
    console.error('   Status:', error.response?.status);
    console.error('   Headers:', error.response?.headers);
    console.error('   Data:', error.response?.data);
    console.error('   Message:', error.message);
    console.log('🔄 Falling back to pattern matching...');
    return "🤖 Error de conexión con Claude AI. Intentando con sistema de datos reales...";
  }
}

// OpenAI API Integration  
async function callOpenAI(question, context) {
  console.log('🚀 Starting OpenAI API call...');
  console.log(`📝 Question: "${question}"`);
  console.log(`🔑 Using OpenAI token: ${OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 20) + '...' + OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10) : 'NO TOKEN'}`);
  
  try {
    const prompt = createIntelligentPrompt(question, context);
    console.log(`📄 OpenAI Prompt length: ${prompt.length} characters`);
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system', 
          content: 'Eres un experto analista de El Pollo Loco CAS. SOLO usa datos reales proporcionados. NUNCA inventes datos. Si no tienes información específica, dilo claramente.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ OpenAI API response received successfully!');
    console.log(`📏 OpenAI Response length: ${response.data.choices[0].message.content.length} characters`);
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('❌ OpenAI API ERROR:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);
    console.error('   Message:', error.message);
    console.log('🔄 Falling back to real data response...');
    return "🤖 Error de conexión con AI. Los datos podrían no estar disponibles temporalmente.";
  }
}

function createIntelligentPrompt(question, context) {
  // Build context with ONLY real data
  const realContext = {
    available_indicators: [
      'Marinado', 'Cuartos Fríos', 'Área Cocina', 'Hornos', 'Freidoras',
      'Baños Empleados', 'Lavado Manos', 'Servicio', 'Almacén', 'Higiene'
    ],
    date_range: 'Mar 12, 2025 - Aug 22, 2025 (135 supervisiones)',
    real_sucursales: [
      'Gómez Morin', 'Rómulo Garza', 'Lázaro Cárdenas', 'Plaza 1500', 'Vasconcelos',
      'Aztlan', 'Chapultepec', 'Gonzalitos', 'Lincoln', 'Pueblito', 'Escobedo'
    ]
  };

  let prompt = `SISTEMA DE SUPERVISIÓN EL POLLO LOCO CAS
Eres experto analista. SOLO usa datos reales proporcionados. NUNCA inventes.

PREGUNTA: "${question}"

CONTEXTO REAL:
${JSON.stringify(realContext, null, 2)}

DATOS DE CONSULTA:
${JSON.stringify(context, null, 2)}

REGLAS ESTRICTAS:
1. Si dice "top 5" → muestra EXACTAMENTE 5
2. Solo sucursales reales de la lista
3. Solo fechas 2025 (Mar-Aug)
4. Solo indicadores que existen en DB
5. Si no hay datos → "No disponible en período especificado"
6. NUNCA menciones "atención cliente" ni "inventario"

FORMATO:
🎯 [TÍTULO]
[Lista numerada con datos exactos]
💡 [Insight basado solo en datos reales]

Máximo 500 caracteres.`;

  return prompt;
}

async function generateIntelligentResponse(question, intelligentData, analysis) {
  try {
    console.log(`🎯 Generating INTELLIGENT response for intent: ${analysis.intent}`);
    
    switch (analysis.intent) {
      case 'group_opportunities':
        return generateGroupOpportunitiesResponse(intelligentData, analysis);
        
      case 'sucursal_opportunities':
        return generateSucursalOpportunitiesResponse(intelligentData, analysis);
        
      case 'quarterly_comparison':
        return generateQuarterlyComparisonResponse(intelligentData, analysis);
        
      case 'group_ranking':
      case 'general_ranking':
        return generateRankingResponse(intelligentData, analysis);
        
      default:
        return generateGeneralIntelligentResponse(intelligentData, analysis);
    }
  } catch (error) {
    console.error('❌ Intelligent response generation error:', error);
    return "🤖 Error al generar respuesta inteligente. Intenta reformular tu pregunta.";
  }
}

function generateGroupOpportunitiesResponse(data, analysis) {
  if (!data.opportunities || data.opportunities.length === 0) {
    return `❌ No se encontraron áreas de oportunidad para el grupo **${data.grupo}** en ${data.trimester}.`;
  }
  
  let response = `🎯 **ÁREAS DE OPORTUNIDAD - ${data.grupo.toUpperCase()}**\n`;
  response += `📅 **Período**: ${data.trimester}\n\n`;
  
  data.opportunities.forEach((opp, index) => {
    const emoji = index === 0 ? '🔴' : index === 1 ? '🟡' : '🟠';
    response += `${emoji} **${index + 1}. ${opp.area}**\n`;
    response += `   📊 Promedio: ${opp.promedio}%\n`;
    response += `   📈 Rango: ${opp.rango}\n`;
    response += `   📋 Evaluaciones: ${opp.evaluaciones}\n\n`;
  });
  
  // Add intelligent insight
  const worstArea = data.opportunities[0];
  response += `💡 **Insight**: El área más crítica es **${worstArea.area}** con ${worstArea.promedio}%. `;
  response += `Requiere atención inmediata para mejorar el desempeño del grupo.`;
  
  return response;
}

function generateSucursalOpportunitiesResponse(data, analysis) {
  if (!data.opportunities || data.opportunities.length === 0) {
    return `❌ No se encontraron datos de supervisión reciente para **${data.sucursal}**.`;
  }
  
  const fechaSupervision = new Date(data.fecha_supervision).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  
  let response = `🏪 **ÁREAS DE OPORTUNIDAD - ${data.sucursal.toUpperCase()}**\n`;
  response += `🏢 **Grupo**: ${data.grupo}\n`;
  response += `📍 **Estado**: ${data.estado}\n`;
  response += `📅 **Última Supervisión**: ${fechaSupervision}\n\n`;
  
  data.opportunities.forEach((opp, index) => {
    const emoji = index === 0 ? '🔴' : index === 1 ? '🟡' : index === 2 ? '🟠' : '⚪';
    response += `${emoji} **${index + 1}. ${opp.area}**: ${opp.porcentaje}%\n`;
  });
  
  // Add intelligent recommendations
  const criticalCount = data.opportunities.filter(o => parseFloat(o.porcentaje) < 70).length;
  response += `\n💡 **Análisis**: ${criticalCount} áreas requieren atención inmediata (< 70%). `;
  response += `Priorizar intervención en **${data.opportunities[0].area}**.`;
  
  return response;
}

function generateQuarterlyComparisonResponse(data, analysis) {
  if (!data.comparison || !data.comparison.current) {
    return `❌ No se encontraron datos suficientes para comparar trimestres del grupo **${data.grupo}**.`;
  }
  
  const comp = data.comparison;
  const trendEmoji = comp.change.trend === 'mejora' ? '📈' : comp.change.trend === 'declive' ? '📉' : '➡️';
  
  let response = `📊 **COMPARATIVO TRIMESTRAL - ${data.grupo.toUpperCase()}**\n\n`;
  
  response += `🗓️ **${comp.current.trimester}**:\n`;
  response += `   📊 Promedio: ${comp.current.promedio}%\n`;
  response += `   🏪 Sucursales: ${comp.current.sucursales}\n`;
  response += `   📋 Supervisiones: ${comp.current.supervisiones}\n\n`;
  
  response += `🗓️ **${comp.previous.trimester}**:\n`;
  response += `   📊 Promedio: ${comp.previous.promedio}%\n`;
  response += `   🏪 Sucursales: ${comp.previous.sucursales}\n`;
  response += `   📋 Supervisiones: ${comp.previous.supervisiones}\n\n`;
  
  response += `${trendEmoji} **CAMBIO**: ${comp.change.points > 0 ? '+' : ''}${comp.change.points} puntos `;
  response += `(${comp.change.percentage > 0 ? '+' : ''}${comp.change.percentage}%)\n`;
  
  // Intelligent analysis
  const changeValue = parseFloat(comp.change.points);
  if (changeValue > 2) {
    response += `\n🎉 **Excelente mejora!** El grupo muestra una tendencia muy positiva.`;
  } else if (changeValue > 0) {
    response += `\n✅ **Mejora moderada.** El grupo mantiene una tendencia positiva.`;
  } else if (changeValue < -2) {
    response += `\n🚨 **Declive significativo.** Requiere análisis de causas y plan de acción inmediato.`;
  } else if (changeValue < 0) {
    response += `\n⚠️ **Ligero declive.** Monitorear de cerca y identificar áreas de mejora.`;
  } else {
    response += `\n➡️ **Desempeño estable.** Mantener estrategias actuales.`;
  }
  
  return response;
}

function generateRankingResponse(data, analysis) {
  if (!data.ranking || data.ranking.length === 0) {
    return `❌ No se encontraron datos de ranking para ${data.trimester}.`;
  }
  
  let response = `🏆 **RANKING GRUPOS OPERATIVOS**\n`;
  response += `📅 **Período**: ${data.trimester}\n\n`;
  
  data.ranking.forEach(grupo => {
    const medal = grupo.position === 1 ? '🥇' : grupo.position === 2 ? '🥈' : grupo.position === 3 ? '🥉' : '🏆';
    response += `${medal} **${grupo.position}°. ${grupo.grupo}**\n`;
    response += `   📊 Promedio: ${grupo.promedio}%\n`;
    response += `   🏪 ${grupo.sucursales} sucursales (${grupo.supervisiones} supervisiones)\n\n`;
  });
  
  // Intelligent insights
  const leader = data.ranking[0];
  const gap = parseFloat(leader.promedio) - parseFloat(data.ranking[1]?.promedio || 0);
  response += `💡 **Insight**: **${leader.grupo}** lidera con ${gap.toFixed(1)} puntos de ventaja. `;
  response += `Promedio de liderazgo: ${leader.promedio}%`;
  
  return response;
}

function generateGeneralIntelligentResponse(data, analysis) {
  return "🤖 Pregunta procesada por sistema inteligente. Para mejores resultados, especifica:\n" +
         "• Grupo operativo (TEPEYAC, OGAS, TEC, etc.)\n" +
         "• Sucursal específica\n" +
         "• Trimestre (Q1, Q2, Q3, Q4)\n" +
         "• Tipo de análisis (oportunidades, comparativo, ranking)";
}

async function generateRealDataResponse(question, realData, analysis) {
  try {
    console.log('🎯 Generating response with REAL data only');
    
    if (analysis.intent === 'opportunities') {
      if (!realData.areas || realData.areas.length === 0) {
        return `❌ No se encontraron áreas de oportunidad${realData.sucursal ? ` para ${realData.sucursal}` : ''} en el período especificado.`;
      }
      
      let response = `🎯 **ÁREAS DE OPORTUNIDAD${realData.sucursal ? ` - ${realData.sucursal.toUpperCase()}` : ''}**\n\n`;
      
      realData.areas.forEach((area, index) => {
        response += `${index + 1}. **${area.indicator.toUpperCase()}**: ${area.promedio}%\n`;
      });
      
      if (realData.fechas) {
        response += `\n📅 Período: ${new Date(realData.fechas.desde).toLocaleDateString('es-MX')} - ${new Date(realData.fechas.hasta).toLocaleDateString('es-MX')}`;
      }
      
      return response;
    }
    
    if (analysis.intent === 'ranking' && Array.isArray(realData)) {
      if (realData.length === 0) {
        return `❌ No se encontraron datos de ranking para el período especificado.`;
      }
      
      let response = `🏆 **TOP ${Math.min(realData.length, analysis.quantity)} SUCURSALES - TRIMESTRE ACTUAL**\n\n`;
      
      realData.slice(0, analysis.quantity).forEach((item, index) => {
        const emoji = index < 3 ? ['🥇', '🥈', '🥉'][index] : '🏆';
        response += `${emoji} **${item.location_name}**: ${parseFloat(item.promedio).toFixed(1)}%\n`;
        response += `   📊 ${item.supervisiones} supervisiones\n`;
        response += `   📅 Última: ${new Date(item.ultima_supervision).toLocaleDateString('es-MX')}\n\n`;
      });
      
      return response;
    }
    
    // General case - use existing context but validate it's real
    return generateValidatedResponse(question, realData);
    
  } catch (error) {
    console.error('❌ Real data response error:', error);
    return "🤖 Error al generar respuesta con datos reales. Intenta un comando específico como /kpis.";
  }
}

function generateValidatedResponse(question, context) {
  // Only use data that actually exists in our API responses
  if (context && typeof context === 'object') {
    if (context.promedio_general) {
      return `📊 **Promedio General**: ${context.promedio_general}%\n` +
             `👥 **Total Supervisiones**: ${context.total_supervisiones}\n` +
             `🏢 **Sucursales Evaluadas**: ${context.total_sucursales}`;
    }
  }
  
  return "🤖 Para obtener información específica, usa comandos como:\n" +
         "• /kpis - Indicadores principales\n" +
         "• /grupos - Info por grupos\n" +
         "• /estados - Info por estados";
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

// Comando /tutorial - Sistema de capacitación
bot.onText(/\/tutorial/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || '';
  await tutorialSystem.startTutorial(chatId, userName);
});

// Comando /ayuda_avanzada - Ayuda contextual inteligente
bot.onText(/\/ayuda_avanzada/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Obtener datos actuales para sugerencias contextuales
    const kpis = await axios.get(`${API_BASE_URL}/kpis`);
    const grupos = await axios.get(`${API_BASE_URL}/grupos`);
    
    const suggestions = `🧠 **SUGERENCIAS INTELIGENTES**
    
Basado en los datos actuales, puedes preguntar:

📊 **Sobre el promedio actual (${kpis.data.promedio_general}%)**:
• "¿Cómo está el promedio comparado con el mes pasado?"
• "¿Qué grupos están arriba del promedio?"

🏆 **Sobre el mejor grupo (${grupos.data[0]?.grupo_operativo})**:
• "¿Por qué ${grupos.data[0]?.grupo_operativo} es el mejor?"
• "¿Qué hace diferente a ${grupos.data[0]?.grupo_operativo}?"

⚠️ **Para identificar problemas**:
• "¿Qué sucursales necesitan atención urgente?"
• "¿Cuáles son los peores indicadores?"

🔍 **Análisis comparativo**:
• "Compara los 3 mejores vs los 3 peores grupos"
• "¿Cómo varía el desempeño por estado?"

💡 **Para recomendaciones**:
• "¿En qué debemos enfocarnos esta semana?"
• "Dame un plan de acción para mejorar"`;

    bot.sendMessage(chatId, suggestions, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '🤖 Error al generar sugerencias. Intenta más tarde.');
  }
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
  
  // Tutorial callbacks
  if (data.startsWith('tutorial_')) {
    switch (data) {
      case 'tutorial_basic':
        await tutorialSystem.sendBasicTutorial(chatId);
        break;
      case 'tutorial_queries':
        await tutorialSystem.sendQueriesTutorial(chatId);
        break;
      case 'tutorial_dashboard':
        await tutorialSystem.sendDashboardTutorial(chatId);
        break;
      case 'tutorial_advanced':
        await tutorialSystem.sendAdvancedTutorial(chatId);
        break;
      case 'tutorial_practice':
        await tutorialSystem.sendPracticeTutorial(chatId);
        break;
      case 'tutorial_progress':
        bot.sendMessage(chatId, tutorialSystem.getProgress(chatId), { parse_mode: 'Markdown' });
        break;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    return;
  }
  
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
    const messageId = `${chatId}_${msg.message_id}`;
    
    // Deduplication check
    if (messageCache.has(messageId)) {
      console.log(`🔄 Duplicate message ignored: ${messageId}`);
      return;
    }
    messageCache.set(messageId, true);
    
    // Clean old cache entries (keep last 100)
    if (messageCache.size > 100) {
      const firstKey = messageCache.keys().next().value;
      messageCache.delete(firstKey);
    }
    
    console.log(`📨 New message received: "${question}" (ID: ${messageId})`);
    console.log(`🔍 About to check AI API availability...`);
    
    try {
      // Check if user is in tutorial practice mode
      if (tutorialSystem.validatePracticeResponse(chatId, question)) {
        return; // Tutorial system handled the response
      }
      
      // Send typing indicator
      bot.sendChatAction(chatId, 'typing');
      
      // Log API key availability for debugging
      console.log(`🔍 Claude API Key available: ${CLAUDE_API_KEY ? 'YES' : 'NO'}`);
      console.log(`🔍 Token starts with sk-ant: ${CLAUDE_API_KEY && CLAUDE_API_KEY.startsWith('sk-ant-') ? 'YES' : 'NO'}`);
      
      // Use Claude AI for intelligent responses
      const response = await askAI(question);
      
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      
      // Log for analysis
      console.log(`AI Query processed: "${question}"`);
    } catch (error) {
      console.error('AI Agent error:', error);
      
      // Fallback to basic response with real data
      try {
        const context = await queryDatabase(question);
        let response = '🤖 No se pudo procesar tu pregunta con IA, pero aquí tienes algunos datos relevantes:\n\n';
        
        if (context && context.kpis) {
          response += `📊 **KPIs Generales**:\n`;
          response += `• Promedio general: ${context.kpis.promedio_general}%\n`;
          response += `• Total supervisiones: ${context.kpis.total_supervisiones}\n\n`;
        }
        
        if (context && context.grupos && context.grupos.length > 0) {
          response += `🏆 **Top 3 Grupos**:\n`;
          context.grupos.slice(0, 3).forEach((grupo, index) => {
            const emoji = ['🥇', '🥈', '🥉'][index];
            response += `${emoji} ${grupo.grupo_operativo}: ${grupo.promedio}%\n`;
          });
        }
        
        response += '\n💡 Intenta usar comandos específicos como /kpis, /grupos, /estados para obtener información más detallada.';
        
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