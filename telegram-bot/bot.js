const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Pool } = require('pg');
const SupervisionAI = require('./ai-intelligence');
const TutorialSystem = require('./tutorial-system');
const RealSupervisionIntelligence = require('./real-data-intelligence');
const IntelligentSupervisionSystem = require('./intelligent-supervision-system');
const IntelligentKnowledgeBase = require('./intelligent-knowledge-base');

// ULTRA INTELLIGENT SYSTEM: OpenAI al máximo
const UltraIntelligentDirector = require('./ultra-intelligent-director');

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

// Initialize database manager with robust connection handling
const { getDatabaseManager } = require('./database-manager');
const dbManager = getDatabaseManager();
const pool = dbManager.getPool();

// Initialize AI engines
const aiEngine = new SupervisionAI(pool);
const realDataEngine = new RealSupervisionIntelligence(pool);
const intelligentSystem = new IntelligentSupervisionSystem(pool);
const knowledgeBase = new IntelligentKnowledgeBase(pool);

// ULTRA INTELLIGENT SYSTEM - OpenAI MAXIMUM POWER
const ultraIntelligentDirector = new UltraIntelligentDirector(pool);

const token = process.env.TELEGRAM_BOT_TOKEN;
// In production, use relative paths for same-server API calls
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'http://localhost:10000/api'  // Internal port in Render
    : (process.env.API_BASE_URL || 'http://localhost:3001/api');
    
const WEBAPP_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

// AI Configuration - Solo OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Debug token availability at startup
console.log('🔑 OpenAI Token Status:');
console.log(`   OPENAI_API_KEY exists: ${OPENAI_API_KEY ? 'YES' : 'NO'}`);
console.log(`   Token length: ${OPENAI_API_KEY ? OPENAI_API_KEY.length : 0}`);
console.log(`   Token starts correctly: ${OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-') ? 'YES' : 'NO'}`);
if (OPENAI_API_KEY && OPENAI_API_KEY.length > 20) {
  console.log(`   OpenAI first 20 chars: ${OPENAI_API_KEY.substring(0, 20)}...`);
  console.log(`   OpenAI last 10 chars: ...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10)}`);
} else if (OPENAI_API_KEY) {
  console.log(`   OpenAI token: [TOO_SHORT_${OPENAI_API_KEY.length}_CHARS]`);
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
console.log('🧠 ANA ULTRA INTELIGENTE iniciándose...');
console.log('📊 Base de datos: supervision_operativa_detalle');
console.log('🎯 Conocimiento objetivo: 120% de toda la operación');
console.log('⚡ Sistema de consultas: DINÁMICO (sin límites)');
console.log('🤖 Personalidad: Ana - Analista experta de El Pollo Loco');

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

async function askAI(question, context = null, chatId = null) {
  try {
    console.log(`🧠 ANA ULTRA INTELIGENTE Processing: "${question}"`);
    
    // PRIORIDAD 1: USAR ANA ULTRA INTELIGENTE (120% conocimiento)
    if (chatId) {
      console.log(`🚀 Delegando a ANA ULTRA INTELIGENTE para chat ${chatId}`);
      const anaResponse = await ultraIntelligentDirector.processUserQuestion(question, chatId);
      
      if (anaResponse && anaResponse.length > 10) {
        console.log(`✅ ANA ULTRA INTELIGENTE generó respuesta completa`);
        return anaResponse;
      }
    }
    
    console.log(`🔄 Fallback a sistema inteligente tradicional...`);
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
        // ENHANCED: Add business context and intelligence
        intelligentData.businessContext = knowledgeBase.getGrupoIntelligence(grupoName);
        intelligentData.comparativeContext = knowledgeBase.generateComparativeContext(grupoName);
        console.log(`📊 Group opportunities retrieved for ${grupoName}:`, intelligentData.opportunities.length);
        break;
        
      case 'sucursal_opportunities':
        const sucursalName = analysis.entity.name;
        intelligentData = await intelligentSystem.getSucursalOpportunities(sucursalName, analysis.quantity);
        // ENHANCED: Add area intelligence for opportunity context
        if (intelligentData.opportunities) {
          intelligentData.opportunities = intelligentData.opportunities.map(opp => ({
            ...opp,
            areaIntelligence: knowledgeBase.getAreaIntelligence(opp.area),
            performanceInsight: knowledgeBase.getPerformanceInsights(opp.porcentaje)
          }));
        }
        console.log(`🏪 Sucursal opportunities retrieved for ${sucursalName}:`, intelligentData.opportunities.length);
        break;
        
      case 'quarterly_comparison':
        const grupo = analysis.entity.name || 'TEPEYAC';
        const current = analysis.trimester === 'all' ? intelligentSystem.getCurrentTrimester() : analysis.trimester;
        const previous = intelligentSystem.getPreviousTrimester();
        intelligentData = await intelligentSystem.getQuarterlyComparison(grupo, current, previous);
        // ENHANCED: Add quarterly intelligence and business context
        intelligentData.quarterlyIntelligence = knowledgeBase.getQuarterlyIntelligence(current);
        intelligentData.businessContext = knowledgeBase.getGrupoIntelligence(grupo);
        console.log(`📈 Quarterly comparison retrieved for ${grupo}`);
        break;
        
      case 'group_ranking':
      case 'general_ranking':
        intelligentData = await intelligentSystem.getTopGrupos(analysis.trimester, analysis.quantity);
        // ENHANCED: Add business context for each grupo in ranking
        if (intelligentData.ranking) {
          intelligentData.ranking = intelligentData.ranking.map(grupo => ({
            ...grupo,
            businessIntelligence: knowledgeBase.getGrupoIntelligence(grupo.grupo),
            performanceInsight: knowledgeBase.getPerformanceInsights(grupo.promedio)
          }));
        }
        intelligentData.quarterlyContext = knowledgeBase.getQuarterlyIntelligence(analysis.trimester);
        console.log(`🏆 Ranking retrieved:`, intelligentData.ranking.length, 'grupos');
        break;
        
      // ENHANCED: Advanced business intelligence intents
      case 'critical_performance_analysis':
      case 'excellent_performance_analysis':
      case 'benchmark_analysis':
      case 'position_analysis':
      case 'distribution_analysis':
        intelligentData = await intelligentSystem.getTopGrupos(analysis.trimester, 20); // Get all grupos for analysis
        if (intelligentData.ranking) {
          intelligentData.ranking = intelligentData.ranking.map(grupo => ({
            ...grupo,
            businessIntelligence: knowledgeBase.getGrupoIntelligence(grupo.grupo),
            performanceInsight: knowledgeBase.getPerformanceInsights(grupo.promedio)
          }));
          
          // Filter based on specific analysis type
          if (analysis.intent === 'critical_performance_analysis') {
            intelligentData.ranking = intelligentData.ranking.filter(g => g.performanceInsight?.level === 'critical');
          } else if (analysis.intent === 'excellent_performance_analysis') {
            intelligentData.ranking = intelligentData.ranking.filter(g => g.performanceInsight?.level === 'excellent');
          }
        }
        intelligentData.quarterlyContext = knowledgeBase.getQuarterlyIntelligence(analysis.trimester);
        intelligentData.analysisType = analysis.intent;
        console.log(`📈 Advanced analysis retrieved for intent: ${analysis.intent}`);
        break;
        
      case 'trend_analysis':
      case 'competitive_analysis':
        // Get quarterly comparison for trend analysis
        const trendGrupo = analysis.entity.name || 'OGAS'; // Default to top performer
        const currentQ = analysis.trimester === 'all' ? intelligentSystem.getCurrentTrimester() : analysis.trimester;
        const previousQ = intelligentSystem.getPreviousTrimester();
        intelligentData = await intelligentSystem.getQuarterlyComparison(trendGrupo, currentQ, previousQ);
        intelligentData.businessContext = knowledgeBase.getGrupoIntelligence(trendGrupo);
        intelligentData.quarterlyIntelligence = knowledgeBase.getQuarterlyIntelligence(currentQ);
        intelligentData.comparativeContext = knowledgeBase.generateComparativeContext(trendGrupo);
        intelligentData.analysisType = analysis.intent;
        console.log(`📊 Trend/competitive analysis retrieved for ${trendGrupo}`);
        break;
        
      default:
        // For other intents, use general context with quarterly intelligence
        intelligentData = await queryDatabase(question);
        intelligentData.quarterlyContext = knowledgeBase.getQuarterlyIntelligence(intelligentSystem.getCurrentTrimester());
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
  // ENHANCED: Build context with business intelligence and real data
  const enhancedContext = {
    available_indicators: [
      'Marinado', 'Cuartos Fríos', 'Área Cocina', 'Hornos', 'Freidoras',
      'Baños Empleados', 'Lavado Manos', 'Servicio', 'Almacén', 'Higiene'
    ],
    date_range: 'Q1-Q3 2025 (135 supervisiones)',
    real_grupos_operativos: [
      'OGAS', 'PLOG QUERETARO', 'TEPEYAC', 'TEC', 'EXPO', 'GRUPO MATAMOROS',
      'PLOG LAGUNA', 'EFM', 'RAP', 'GRUPO SALTILLO'
    ],
    performance_benchmarks: {
      excellent: '95%+', good: '85-94%', improvement: '70-84%', critical: '<70%'
    },
    quarterly_periods: {
      Q1: 'Ene-Mar 2025', Q2: 'Abr-Jun 2025', Q3: 'Jul-Sep 2025 (actual)'
    }
  };

  let prompt = `SISTEMA DE SUPERVISIÓN EL POLLO LOCO CAS - ANÁLISIS INTELIGENTE
Eres el EXPERTO ANALISTA más inteligente de El Pollo Loco. Tienes conocimiento COMPLETO del negocio.

PREGUNTA: "${question}"

CONTEXTO EMPRESARIAL:
${JSON.stringify(enhancedContext, null, 2)}

DATOS DE ANÁLISIS:
${JSON.stringify(context, null, 2)}

INTELIGENCIA DE NEGOCIO DISPONIBLE:
- Conoces TODOS los 20 grupos operativos y su ranking real
- Entiendes las 29 áreas de evaluación y cuáles son críticas
- Comprendes los benchmarks de desempeño y niveles críticos
- Sabes el contexto trimestral y tendencias por período

REGLAS DE INTELIGENCIA EXTREMA:
1. Si dice "top 5" → muestra EXACTAMENTE 5 con contexto empresarial
2. Usa businessContext y comparativeContext para insights avanzados
3. Menciona posición en ranking corporativo cuando sea relevante
4. Incluye benchmarks de performance y nivel de criticidad
5. Proporciona contexto trimestral inteligente
6. NUNCA inventes datos - solo usa datos reales proporcionados
7. Siempre incluye insights empresariales basados en performance real

FORMATO INTELIGENTE:
🎯 [TÍTULO CON CONTEXTO EMPRESARIAL]
[Lista numerada con datos exactos + contexto de negocio]
📊 [Posición/Ranking/Benchmark cuando aplique]
💡 [Insight empresarial profundo basado en datos reales]

Máximo 800 caracteres para respuestas complejas.`;

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
        
      // ENHANCED: Advanced business intelligence responses
      case 'critical_performance_analysis':
        return generateCriticalAnalysisResponse(intelligentData, analysis);
        
      case 'excellent_performance_analysis':
        return generateExcellentAnalysisResponse(intelligentData, analysis);
        
      case 'benchmark_analysis':
      case 'position_analysis':
      case 'distribution_analysis':
        return generateAdvancedAnalysisResponse(intelligentData, analysis);
        
      case 'trend_analysis':
      case 'competitive_analysis':
        return generateTrendAnalysisResponse(intelligentData, analysis);
        
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
  response += `📅 **Período**: ${data.trimester}\n`;
  
  // ENHANCED: Add business context intelligence
  if (data.businessContext) {
    const ctx = data.businessContext;
    response += `📊 **Posición**: #${ctx.position_in_ranking} de 20 grupos (Percentil ${ctx.percentile})\n`;
    response += `⚡ **Promedio General**: ${ctx.promedio}% - ${ctx.status.toUpperCase()}\n`;
    response += `🏢 **Tamaño**: ${ctx.sucursales} sucursales, ${ctx.supervisiones} supervisiones\n\n`;
  }
  
  data.opportunities.forEach((opp, index) => {
    const emoji = index === 0 ? '🔴' : index === 1 ? '🟡' : '🟠';
    response += `${emoji} **${index + 1}. ${opp.area}**\n`;
    response += `   📊 Promedio: ${opp.promedio}%\n`;
    response += `   📈 Rango: ${opp.rango}\n`;
    response += `   📋 Evaluaciones: ${opp.evaluaciones}\n\n`;
  });
  
  // ENHANCED: Add intelligent business insights
  const worstArea = data.opportunities[0];
  if (data.businessContext) {
    const ctx = data.businessContext;
    response += `💡 **Análisis Inteligente**:\n`;
    response += `• **Área crítica**: ${worstArea.area} (${worstArea.promedio}%)\n`;
    response += `• **Contexto empresarial**: ${ctx.performance_context}\n`;
    response += `• **Recomendación**: ${ctx.recommendation}\n`;
    
    // Add competitive context if available
    if (data.comparativeContext && data.comparativeContext.competitive_context) {
      const competitors = data.comparativeContext.competitive_context.slice(0, 2);
      response += `• **Competencia directa**: `;
      competitors.forEach(comp => {
        response += `${comp.name} (${comp.gap > 0 ? '+' : ''}${comp.gap}%) `;
      });
    }
  } else {
    response += `💡 **Insight**: El área más crítica es **${worstArea.area}** con ${worstArea.promedio}%. `;
    response += `Requiere atención inmediata para mejorar el desempeño del grupo.`;
  }
  
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
  response += `📅 **Período**: ${data.trimester}\n`;
  
  // ENHANCED: Add quarterly context intelligence
  if (data.quarterlyContext) {
    const qCtx = data.quarterlyContext;
    response += `📊 **Contexto Trimestral**: ${qCtx.supervisiones} supervisiones, ${qCtx.coverage} cobertura\n`;
    response += `⚡ **Promedio General**: ${qCtx.promedio}% - Nivel ${qCtx.benchmark}\n\n`;
  }
  
  data.ranking.forEach(grupo => {
    const medal = grupo.position === 1 ? '🥇' : grupo.position === 2 ? '🥈' : grupo.position === 3 ? '🥉' : '🏆';
    response += `${medal} **${grupo.position}°. ${grupo.grupo}**\n`;
    response += `   📊 Promedio: ${grupo.promedio}%`;
    
    // ENHANCED: Add performance classification from business intelligence
    if (grupo.performanceInsight) {
      const perf = grupo.performanceInsight;
      response += ` (${perf.level.toUpperCase()})\n`;
      response += `   🎯 ${perf.benchmark}\n`;
    } else {
      response += `\n`;
    }
    
    // ENHANCED: Add business intelligence context
    if (grupo.businessIntelligence) {
      const bCtx = grupo.businessIntelligence;
      response += `   🏢 ${grupo.sucursales} sucursales (${bCtx.trend})\n`;
      response += `   📈 Percentil ${bCtx.percentile} corporativo\n\n`;
    } else {
      response += `   🏪 ${grupo.sucursales} sucursales (${grupo.supervisiones} supervisiones)\n\n`;
    }
  });
  
  // ENHANCED: Intelligent business insights
  const leader = data.ranking[0];
  const gap = parseFloat(leader.promedio) - parseFloat(data.ranking[1]?.promedio || 0);
  response += `💡 **Análisis Empresarial**:\n`;
  response += `• **Líder**: ${leader.grupo} con ${gap.toFixed(1)} puntos de ventaja (${leader.promedio}%)\n`;
  
  if (leader.businessIntelligence) {
    response += `• **Contexto**: ${leader.businessIntelligence.performance_context}\n`;
    response += `• **Estrategia**: ${leader.businessIntelligence.recommendation}`;
  }
  
  // Add performance distribution insight
  const excellent = data.ranking.filter(g => g.performanceInsight?.level === 'excellent').length;
  const critical = data.ranking.filter(g => g.performanceInsight?.level === 'critical').length;
  
  if (excellent > 0 || critical > 0) {
    response += `\n• **Distribución**: ${excellent} excelentes, ${critical} críticos de ${data.ranking.length} grupos`;
  }
  
  return response;
}

function generateGeneralIntelligentResponse(data, analysis) {
  // ENHANCED: Generate intelligent response based on available data and context
  let response = `🧠 **ANÁLISIS INTELIGENTE - EL POLLO LOCO CAS**\n\n`;
  
  // Add quarterly context if available
  if (data && data.quarterlyContext) {
    const qCtx = data.quarterlyContext;
    response += `📊 **Contexto Actual (${qCtx.period})**:\n`;
    response += `• Actividad: ${qCtx.activity_level} (${qCtx.supervisiones} supervisiones)\n`;
    response += `• Cobertura: ${qCtx.coverage}\n`;
    response += `• Desempeño general: ${qCtx.benchmark} (${qCtx.promedio}%)\n\n`;
  }
  
  // Add available business intelligence
  response += `🎯 **Sistema Inteligente Disponible**:\n`;
  response += `• **20 Grupos Operativos** con ranking completo\n`;
  response += `• **29 Áreas de Evaluación** con criticidad identificada\n`;
  response += `• **Análisis Trimestral** Q1-Q4 2025\n`;
  response += `• **Benchmarks Empresariales** y contexto competitivo\n\n`;
  
  // Add specific query examples based on detected intent
  response += `💡 **Consultas Inteligentes que puedes hacer**:\n`;
  
  if (analysis.entity && analysis.entity.type === 'grupo') {
    response += `• "¿Cuáles son las áreas de oportunidad de ${analysis.entity.name}?"\n`;
    response += `• "¿Cómo se compara ${analysis.entity.name} con otros grupos?"\n`;
  } else {
    response += `• "¿Cuáles son las áreas de oportunidad del grupo OGAS?"\n`;
    response += `• "Dame el top 5 de grupos en Q3"\n`;
  }
  
  response += `• "¿Cómo cambió TEPEYAC entre Q2 y Q3?"\n`;
  response += `• "¿Qué grupos están en nivel crítico?"\n`;
  response += `• "¿Cuáles son los grupos con mejor desempeño?"\n\n`;
  
  response += `🔧 **Para consultas específicas, menciona**:\n`;
  response += `• Grupo: TEPEYAC, OGAS, TEC, EXPO, etc.\n`;
  response += `• Trimestre: Q1, Q2, Q3, Q4\n`;
  response += `• Tipo: oportunidades, ranking, comparativo`;
  
  return response;
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




// Comando /start with deduplication
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const messageId = `${chatId}_start_${msg.message_id}`;
  
  // Deduplication for /start
  if (messageCache.has(messageId)) {
    console.log(`🔄 Duplicate /start ignored: ${messageId}`);
    return;
  }
  messageCache.set(messageId, true);
  const welcomeMessage = `🍗 **EPL Estandarización Operativa**

¡Bienvenido al sistema de supervisión operativa inteligente!

🧠 **NUEVA: Ana - Tu Analista Ultra Inteligente**
• Conocimiento completo al 120% de la base de datos
• Consultas dinámicas ilimitadas sobre supervisiones
• Análisis de tendencias y recomendaciones CAS
• Respuestas naturales en español mexicano

🎯 **Funcionalidades principales:**
• Dashboard interactivo con 5 diseños
• Análisis en tiempo real de supervisiones
• Base de datos con 561,868 registros
• Sistema de entrenamiento inteligente

🗣️ **Habla con Ana naturalmente:**
• "¿Cuáles sucursales de TEPEYAC han evolucionado mejor?"
• "¿Qué oportunidades tiene el grupo OGAS?"
• "¿Qué grupos necesitan más apoyo del CAS?"
• "Analiza la evolución de las freidoras por trimestre"
• "¿Cuáles son las mejores prácticas de los líderes?"

💡 **Comandos especiales:**
• /ana - Ver estado de Ana Ultra Inteligente
• /retrain - Reentrenar Ana (si es necesario)

**Simplemente escribe tu pregunta** o usa los comandos:`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎨 Dashboard (Elige tu diseño)', web_app: { url: WEBAPP_URL } }
        ],
        [
          { text: '🧠 Estado de Ana', callback_data: 'ana_status' },
          { text: '🚨 Críticas', callback_data: 'criticas' }
        ],
        [
          { text: '📊 KPIs Rápidos', callback_data: 'kpis' },
          { text: '🏆 Top 10', callback_data: 'top10' }
        ],
        [
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

// Comando /ana - Estado de Ana Ultra Inteligente
bot.onText(/\/ana/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const status = ultraIntelligentDirector.getIntelligenceStats();
    const trainingTime = status.last_training ? new Date(status.last_training).toLocaleString('es-MX') : 'Nunca';
    
    const anaStatus = `🧠 **ANA - ANALISTA ULTRA INTELIGENTE**

🎯 **Estado actual:**
• Entrenamiento: ${status.training_complete ? '✅ COMPLETO' : status.is_training ? '🔄 EN PROCESO' : '❌ PENDIENTE'}
• Nivel de inteligencia: ${status.intelligence_type || 'LLM_POWERED'}
• Conocimiento de BD: ${status.database_knowledge}
• Consultas dinámicas: ${status.dynamic_queries_enabled ? '✅ ACTIVAS' : '❌ INACTIVAS'}

📅 **Último entrenamiento:** ${trainingTime}

🎭 **Mi personalidad:**
• Nombre: Ana
• Rol: Tu analista experta de El Pollo Loco
• Especialidad: Supervisión operativa
• Idioma: Español mexicano

🚀 **Mis capacidades avanzadas:**
• 📊 Análisis dinámico completo de cualquier consulta
• 📈 Tendencias predictivas y patrones históricos
• 💡 Recomendaciones CAS inteligentes
• 🔍 Consultas ilimitadas a la base de datos
• 🏢 Contexto empresarial completo

💬 **Ejemplos de lo que puedo hacer:**
• "¿Cuáles sucursales de TEPEYAC han evolucionado mejor?"
• "¿Qué tendencias ves en OGAS durante Q3?"
• "¿Qué grupos necesitan más apoyo del CAS?"
• "Analiza la evolución de FREIDORAS en todos los grupos"
• "¿Cuáles son las mejores prácticas de los grupos líderes?"

${!status.training_complete ? '\n⚠️ **Nota:** Estoy terminando mi entrenamiento. ¡Pronto tendré conocimiento completo!' : '\n🎉 **¡Estoy lista!** Pregúntame cualquier cosa sobre supervisiones operativas.'}`;

    bot.sendMessage(chatId, anaStatus);
  } catch (error) {
    console.error('Error en comando /ana:', error);
    bot.sendMessage(chatId, '🤖 Error al obtener el estado de Ana. Intenta más tarde.');
  }
});

// Comando /retrain - Forzar reentrenamiento de Ana (solo para debugging)
bot.onText(/\/retrain/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    bot.sendMessage(chatId, '🔄 **Iniciando reentrenamiento completo de Ana...**\n\nEsto puede tomar unos momentos...');
    
    const newStatus = await ultraIntelligentDirector.forceIntelligenceBoost();
    
    const retrainMessage = `✅ **Reentrenamiento completado!**

🧠 **Nuevo estado de Ana:**
• Entrenamiento: ${newStatus.training_complete ? '✅ COMPLETO' : '❌ FALLA'}
• Conocimiento BD: ${newStatus.database_knowledge}
• Capacidades: ${newStatus.capabilities.length} módulos activos

🎉 **Ana ahora conoce al 120% toda la operación de El Pollo Loco!**`;

    bot.sendMessage(chatId, retrainMessage);
  } catch (error) {
    console.error('Error en reentrenamiento:', error);
    bot.sendMessage(chatId, '❌ Error durante el reentrenamiento. Revisa los logs del sistema.');
  }
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
    case 'ana_status':
      // Show Ana Ultra Intelligence status
      try {
        const status = ultraIntelligentDirector.getIntelligenceStats();
        const trainingTime = status.last_training ? new Date(status.last_training).toLocaleString('es-MX') : 'Nunca';
        
        const statusMessage = `🧠 **ANA - ESTADO ULTRA INTELIGENTE**

${status.training_complete ? '🟢 **ACTIVA Y LISTA**' : status.is_training ? '🟡 **ENTRENÁNDOSE...**' : '🔴 **PENDIENTE**'}

📊 **Métricas:**
• Conocimiento BD: ${status.database_knowledge}
• Consultas dinámicas: ${status.dynamic_queries_enabled ? 'ACTIVAS' : 'INACTIVAS'}
• Última actualización: ${trainingTime}

🎯 **Lo que puedo hacer:**
• Análisis completo de supervisiones
• Tendencias y predicciones
• Recomendaciones CAS personalizadas
• Consultas ilimitadas de BD

💬 **Pruébame con:**
"¿Qué sucursales de TEPEYAC van mejor?"
"¿Cuáles son las oportunidades de OGAS?"
"¿Qué grupos necesitan más apoyo?"

${status.training_complete ? '🎉 ¡Pregúntame cualquier cosa!' : '⏳ Terminando entrenamiento...'}`;

        bot.sendMessage(chatId, statusMessage);
      } catch (error) {
        bot.sendMessage(chatId, '❌ Error al obtener estado de Ana.');
      }
      break;
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
      
      console.log(`🚀 PROCESSING QUESTION: "${question}"`);
      
      // Use AGENTIC SYSTEM for natural responses
      const response = await askAI(question, null, chatId);
      
      // Send without markdown to avoid parsing errors
      bot.sendMessage(chatId, response);
      
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

// ENHANCED: Advanced business intelligence response functions

function generateCriticalAnalysisResponse(data, analysis) {
  if (!data.ranking || data.ranking.length === 0) {
    return `📊 **ANÁLISIS DE GRUPOS CRÍTICOS**\n❌ No se encontraron grupos en nivel crítico en ${data.trimester}.`;
  }
  
  let response = `🚨 **ANÁLISIS DE GRUPOS CRÍTICOS - ${data.trimester}**\n\n`;
  
  if (data.quarterlyContext) {
    response += `📊 **Contexto**: ${data.quarterlyContext.supervisiones} supervisiones, promedio general ${data.quarterlyContext.promedio}%\n\n`;
  }
  
  response += `🔴 **Grupos en Situación Crítica (<70%)**:\n`;
  data.ranking.forEach((grupo, index) => {
    response += `${index + 1}. **${grupo.grupo}** - ${grupo.promedio}%\n`;
    if (grupo.businessIntelligence) {
      response += `   📍 Posición: #${grupo.businessIntelligence.position_in_ranking} de 20\n`;
      response += `   🏢 ${grupo.sucursales} sucursales (${grupo.businessIntelligence.trend})\n`;
      response += `   ⚠️ ${grupo.businessIntelligence.performance_context}\n\n`;
    }
  });
  
  response += `💡 **Análisis Empresarial**:\n`;
  response += `• **Grupos críticos**: ${data.ranking.length} requieren intervención inmediata\n`;
  response += `• **Impacto**: Riesgo operativo significativo en la red\n`;
  response += `• **Acción requerida**: Plan de mejora urgente con soporte corporativo`;
  
  return response;
}

function generateExcellentAnalysisResponse(data, analysis) {
  if (!data.ranking || data.ranking.length === 0) {
    return `📊 **ANÁLISIS DE GRUPOS EXCELENTES**\n❌ No se encontraron grupos en nivel excelente en ${data.trimester}.`;
  }
  
  let response = `🏆 **GRUPOS DE EXCELENCIA - ${data.trimester}**\n\n`;
  
  if (data.quarterlyContext) {
    response += `📊 **Contexto**: ${data.quarterlyContext.supervisiones} supervisiones, promedio general ${data.quarterlyContext.promedio}%\n\n`;
  }
  
  response += `🥇 **Grupos de Elite (95%+)**:\n`;
  data.ranking.forEach((grupo, index) => {
    response += `${index + 1}. **${grupo.grupo}** - ${grupo.promedio}%\n`;
    if (grupo.businessIntelligence) {
      response += `   📍 Posición: #${grupo.businessIntelligence.position_in_ranking} de 20 (Percentil ${grupo.businessIntelligence.percentile})\n`;
      response += `   🏢 ${grupo.sucursales} sucursales (${grupo.businessIntelligence.trend})\n`;
      response += `   ⭐ ${grupo.businessIntelligence.performance_context}\n\n`;
    }
  });
  
  response += `💡 **Análisis de Liderazgo**:\n`;
  response += `• **Grupos excelentes**: ${data.ranking.length} lideran los estándares de calidad\n`;
  response += `• **Best practices**: Modelos a replicar en otros grupos\n`;
  response += `• **Estrategia**: ${data.ranking[0]?.businessIntelligence?.recommendation || 'Mantener y documentar prácticas'}`;
  
  return response;
}

function generateAdvancedAnalysisResponse(data, analysis) {
  if (!data.ranking || data.ranking.length === 0) {
    return `📊 **ANÁLISIS AVANZADO**\n❌ No se encontraron datos para el análisis en ${data.trimester}.`;
  }
  
  let response = `📈 **ANÁLISIS EMPRESARIAL AVANZADO - ${data.trimester}**\n\n`;
  
  // Performance distribution
  const excellent = data.ranking.filter(g => g.performanceInsight?.level === 'excellent').length;
  const good = data.ranking.filter(g => g.performanceInsight?.level === 'good').length;
  const improvement = data.ranking.filter(g => g.performanceInsight?.level === 'improvement').length;
  const critical = data.ranking.filter(g => g.performanceInsight?.level === 'critical').length;
  
  response += `📊 **Distribución de Desempeño**:\n`;
  response += `🥇 Excelente (95%+): ${excellent} grupos\n`;
  response += `🏆 Bueno (85-94%): ${good} grupos\n`;
  response += `⚠️ Mejora (70-84%): ${improvement} grupos\n`;
  response += `🚨 Crítico (<70%): ${critical} grupos\n\n`;
  
  // Quartile analysis
  const sortedScores = data.ranking.map(g => parseFloat(g.promedio)).sort((a, b) => b - a);
  const q1 = sortedScores[Math.floor(sortedScores.length * 0.25)];
  const median = sortedScores[Math.floor(sortedScores.length * 0.5)];
  const q3 = sortedScores[Math.floor(sortedScores.length * 0.75)];
  
  response += `📈 **Análisis Estadístico**:\n`;
  response += `• Q1 (Top 25%): ${q1}%+\n`;
  response += `• Mediana: ${median}%\n`;
  response += `• Q3 (Bottom 25%): ${q3}%\n\n`;
  
  if (data.quarterlyContext) {
    response += `📊 **Contexto Trimestral**:\n`;
    response += `• Actividad: ${data.quarterlyContext.activity_level}\n`;
    response += `• Benchmark general: ${data.quarterlyContext.benchmark}\n\n`;
  }
  
  response += `💡 **Insights Empresariales**:\n`;
  response += `• **Concentración**: ${((excellent + good) / data.ranking.length * 100).toFixed(0)}% en niveles adecuados\n`;
  response += `• **Riesgo**: ${((improvement + critical) / data.ranking.length * 100).toFixed(0)}% requiere atención\n`;
  response += `• **Variabilidad**: Rango de ${Math.min(...sortedScores).toFixed(1)}% a ${Math.max(...sortedScores).toFixed(1)}%`;
  
  return response;
}

function generateTrendAnalysisResponse(data, analysis) {
  if (!data.comparison) {
    return `📊 **ANÁLISIS DE TENDENCIAS**\n❌ No se encontraron datos comparativos para el análisis.`;
  }
  
  let response = `📈 **ANÁLISIS DE TENDENCIAS Y COMPETITIVIDAD**\n\n`;
  
  const comp = data.comparison;
  const change = parseFloat(comp.change.points);
  const trendEmoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
  
  response += `🎯 **Grupo**: ${data.grupo}\n`;
  if (data.businessContext) {
    response += `📍 **Posición Actual**: #${data.businessContext.position_in_ranking} de 20 (Percentil ${data.businessContext.percentile})\n`;
    response += `⚡ **Status**: ${data.businessContext.status.toUpperCase()}\n\n`;
  }
  
  response += `${trendEmoji} **Evolución Trimestral**:\n`;
  response += `• **${comp.previous.trimester}**: ${comp.previous.promedio}%\n`;
  response += `• **${comp.current.trimester}**: ${comp.current.promedio}%\n`;
  response += `• **Cambio**: ${comp.change.points} puntos (${comp.change.trend})\n`;
  response += `• **Variación**: ${comp.change.percentage}%\n\n`;
  
  if (data.comparativeContext?.competitive_context) {
    response += `🏆 **Contexto Competitivo**:\n`;
    data.comparativeContext.competitive_context.slice(0, 3).forEach(competitor => {
      const position = competitor.status === 'superior' ? '▲' : '▼';
      response += `• ${competitor.name}: ${position} ${Math.abs(parseFloat(competitor.gap))} puntos\n`;
    });
    response += `\n`;
  }
  
  response += `💡 **Análisis Inteligente**:\n`;
  if (data.businessContext) {
    response += `• **Contexto**: ${data.businessContext.performance_context}\n`;
    response += `• **Recomendación**: ${data.businessContext.recommendation}\n`;
  }
  
  if (change > 2) {
    response += `• **Tendencia**: Mejora significativa (+${change} puntos)`;
  } else if (change < -2) {
    response += `• **Tendencia**: Declive preocupante (${change} puntos)`;
  } else {
    response += `• **Tendencia**: Desempeño estable`;
  }
  
  return response;
}

console.log('✅ Bot is running! Send /start to begin.');

// Export bot for webhook usage
module.exports = bot;