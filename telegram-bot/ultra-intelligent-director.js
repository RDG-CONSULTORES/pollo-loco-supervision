// =========================================
// ULTRA INTELLIGENT DIRECTOR - DIRECTOR ULTRA INTELIGENTE CON OpenAI MÁXIMO
// Usa OpenAI al 100% para contexto, análisis, queries y respuestas adaptativas
// =========================================

const LLMManager = require('./llm-manager');
const IntelligentContextManager = require('./intelligent-context-manager');
const IntelligentResponseGenerator = require('./intelligent-response-generator');
const ElPolloLocoBusinessKnowledge = require('./business-knowledge');
const ComprehensiveAnalyzer = require('./comprehensive-analyzer');
const { getDatabaseManager } = require('./database-manager');

class UltraIntelligentDirector {
  constructor(pool) {
    this.dbManager = getDatabaseManager();
    this.pool = this.dbManager.getPool();
    
    // Sistemas de inteligencia de OpenAI
    this.llm = new LLMManager();
    this.contextManager = new IntelligentContextManager(this.llm);
    this.responseGenerator = new IntelligentResponseGenerator(this.llm, this.pool);
    
    // Sistemas híbridos (datos reales + IA)
    this.businessKnowledge = new ElPolloLocoBusinessKnowledge();
    this.comprehensiveAnalyzer = new ComprehensiveAnalyzer(this.pool, this.llm);
    
    // Configuración adaptativa
    this.adaptiveConfig = {
      useAI: {
        forContext: true,      // Usar IA para analizar contexto
        forQueries: true,      // Usar IA para generar queries cuando sea necesario
        forAnalysis: true,     // Usar IA para analizar resultados
        forResponses: true     // Usar IA para generar respuestas
      },
      fallbackToFixed: true,   // Fallback a queries fijos si IA falla
      maxAIAttempts: 2,       // Máximo 2 intentos con IA antes de fallback
      intelligenceLevel: 'maximum'
    };
    
    console.log('🧠⚡ ULTRA INTELLIGENT DIRECTOR inicializado - OpenAI al máximo');
  }

  // MÉTODO PRINCIPAL ULTRA INTELIGENTE
  async processUserQuestion(question, chatId) {
    console.log(`🚀 ULTRA IA procesando: "${question}" (Chat: ${chatId})`);
    
    try {
      // FASE 1: ANÁLISIS DE CONTEXTO CON IA
      const conversationContext = this.contextManager.getConversationContext(chatId);
      const contextData = await this.contextManager.analyzeQuestionContext(
        question, 
        chatId, 
        conversationContext.history
      );
      
      console.log(`🧠 Contexto analizado: Grupo=${contextData.finalGroup}, Tipo=${contextData.queryType}, Confianza=${contextData.confidence}`);
      
      // FASE 2: VERIFICAR COMANDOS RÁPIDOS PRIMERO
      const quickResponse = await this.tryQuickResponse(contextData, question);
      if (quickResponse) {
        console.log('⚡ Respuesta rápida generada');
        return quickResponse;
      }
      
      // FASE 3: OBTENER DATOS (IA + DATOS REALES)
      const queryResults = await this.getIntelligentData(contextData);
      
      // FASE 4: GENERAR RESPUESTA ULTRA INTELIGENTE
      const intelligentResponse = await this.responseGenerator.generateIntelligentResponse(
        contextData,
        queryResults,
        conversationContext
      );
      
      console.log('✅ Respuesta ultra inteligente generada');
      return intelligentResponse;
      
    } catch (error) {
      console.error('❌ Error en procesamiento ultra inteligente:', error);
      return await this.handleIntelligentError(question, chatId, error);
    }
  }

  // Intentar respuesta rápida con datos fijos optimizados
  async tryQuickResponse(contextData, question) {
    const lowerQ = question.toLowerCase();
    
    try {
      // Comandos Falcon AI tradicionales
      if (lowerQ === '/ranking' || lowerQ === '/top10') {
        return await this.businessKnowledge.generateFalconResponse('ranking', this.pool, 5);
      }
      
      if (lowerQ === '/areas_criticas' || lowerQ.includes('areas críticas') && !contextData.finalGroup) {
        return await this.businessKnowledge.generateFalconResponse('areas_criticas', this.pool);
      }
      
      if (lowerQ === '/top_areas') {
        return await this.businessKnowledge.generateFalconResponse('top_areas', this.pool);
      }
      
      // Respuestas específicas de grupo con IA contextual
      if (contextData.finalGroup && contextData.queryType === 'group_summary') {
        return await this.generateGroupSummaryWithAI(contextData);
      }
      
      if (contextData.finalGroup && contextData.queryType === 'areas_criticas') {
        return await this.businessKnowledge.formatAreasCriticasGrupo(contextData.finalGroup, this.pool);
      }
      
      // Consultas comprehensivas con IA completa
      if (contextData.queryType === 'comprehensive') {
        return await this.comprehensiveAnalyzer.analyzeComprehensiveRequest(
          question,
          contextData.finalGroup,
          contextData.quarter
        );
      }
      
      return null; // No hay respuesta rápida, usar IA completa
      
    } catch (error) {
      console.error('❌ Error en respuesta rápida:', error);
      return null;
    }
  }

  // Generar resumen de grupo con IA contextual
  async generateGroupSummaryWithAI(contextData) {
    try {
      // Obtener datos básicos del grupo
      const grupoInfo = await this.businessKnowledge.getGrupoInfo(contextData.finalGroup, this.pool);
      
      if (!grupoInfo) {
        return `❌ Grupo ${contextData.finalGroup} no encontrado. Usa /ranking para ver todos los grupos.`;
      }
      
      // Usar IA para enriquecer la respuesta
      const enhancePrompt = `Enriquece este resumen de grupo con insights inteligentes:

DATOS DEL GRUPO:
- Nombre: ${grupoInfo.nombre}
- Sucursales: ${grupoInfo.sucursales}
- Promedio actual: ${grupoInfo.promedio_actual}%
- Ranking: #${grupoInfo.ranking} de ${grupoInfo.total_grupos}
- Status: ${grupoInfo.status}
- Evaluaciones: ${grupoInfo.evaluaciones}

GENERA UNA RESPUESTA FALCON AI que incluya:
1. Emoji apropiado basado en el rendimiento
2. Análisis inteligente del ranking vs promedio
3. Implicaciones del número de evaluaciones
4. Sugerencia de próximos pasos inteligente
5. Comandos relacionados relevantes

Formato Falcon AI (máximo 8 líneas):`;

      const enhancedResult = await this.llm.generate(enhancePrompt, {
        preferredProvider: 'gpt-3.5-turbo'
      });
      
      return this.responseGenerator.formatFalconResponse(enhancedResult.response);
      
    } catch (error) {
      console.error('❌ Error generando resumen con IA:', error);
      // Fallback a respuesta fija
      return await this.businessKnowledge.generateFalconResponse('grupo_info', this.pool, contextData.finalGroup);
    }
  }

  // Obtener datos inteligentes (IA + queries optimizados)
  async getIntelligentData(contextData) {
    try {
      // Para consultas estándar, usar queries optimizados fijos
      if (contextData.queryType === 'areas_criticas' && contextData.finalGroup) {
        return await this.getAreasCriticasData(contextData.finalGroup, contextData.quarter);
      }
      
      if (contextData.queryType === 'calificaciones' && contextData.finalGroup) {
        return await this.getCalificacionesData(contextData.finalGroup, contextData.quarter);
      }
      
      if (contextData.queryType === 'evolution' && contextData.finalGroup) {
        return await this.getEvolutionData(contextData.finalGroup, contextData.quarter);
      }
      
      // Para consultas complejas o específicas, usar IA para generar query
      if (this.adaptiveConfig.useAI.forQueries) {
        return await this.getDataWithAIQuery(contextData);
      }
      
      // Fallback: datos básicos del grupo
      return await this.getBasicGroupData(contextData.finalGroup, contextData.quarter);
      
    } catch (error) {
      console.error('❌ Error obteniendo datos:', error);
      return [];
    }
  }

  // Obtener datos generando query con IA
  async getDataWithAIQuery(contextData) {
    try {
      console.log('🤖 Generando query con IA...');
      
      const businessRequirements = {
        grupo: contextData.finalGroup,
        quarter: contextData.quarter,
        specificRequests: contextData.specificRequests,
        queryType: contextData.queryType,
        needsComparison: contextData.isFollowUp,
        detailLevel: 'summary' // Ajustar basado en perfil de usuario
      };
      
      const aiQuery = await this.responseGenerator.generateIntelligentQuery(
        contextData,
        businessRequirements
      );
      
      if (aiQuery) {
        console.log('🔍 Ejecutando query generado por IA...');
        const result = await this.pool.query(aiQuery);
        return result.rows;
      } else {
        console.log('⚡ Fallback a query básico');
        return await this.getBasicGroupData(contextData.finalGroup, contextData.quarter);
      }
      
    } catch (error) {
      console.error('❌ Error con query IA:', error);
      return await this.getBasicGroupData(contextData.finalGroup, contextData.quarter);
    }
  }

  // Queries optimizados fijos para casos comunes
  async getAreasCriticasData(grupo, quarter) {
    const query = `
      SELECT 
        area_evaluacion,
        ROUND(AVG(porcentaje), 2) as promedio,
        COUNT(*) as evaluaciones,
        COUNT(DISTINCT location_name) as sucursales
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo = $1
        AND EXTRACT(YEAR FROM fecha_supervision) = 2025
        AND EXTRACT(QUARTER FROM fecha_supervision) = $2
        AND porcentaje IS NOT NULL
        AND area_evaluacion IS NOT NULL
      GROUP BY area_evaluacion
      HAVING COUNT(*) > 10
      ORDER BY promedio ASC
      LIMIT 5
    `;
    
    const result = await this.pool.query(query, [grupo, quarter]);
    return result.rows;
  }

  async getCalificacionesData(grupo, quarter) {
    const query = `
      SELECT 
        location_name,
        ROUND(AVG(porcentaje), 2) as promedio,
        COUNT(*) as evaluaciones
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo = $1
        AND EXTRACT(YEAR FROM fecha_supervision) = 2025
        AND EXTRACT(QUARTER FROM fecha_supervision) = $2
        AND porcentaje IS NOT NULL
      GROUP BY location_name
      ORDER BY promedio DESC
    `;
    
    const result = await this.pool.query(query, [grupo, quarter]);
    return result.rows;
  }

  async getEvolutionData(grupo, quarter) {
    // Usar el EvolutionAnalyzer existente
    const EvolutionAnalyzer = require('./evolution-analyzer');
    const analyzer = new EvolutionAnalyzer(this.pool);
    const evolution = await analyzer.analyzeGroupEvolution(grupo);
    return evolution.success ? evolution.data : [];
  }

  async getBasicGroupData(grupo, quarter) {
    const query = `
      SELECT 
        COUNT(DISTINCT location_name) as sucursales,
        ROUND(AVG(porcentaje), 2) as promedio_actual,
        COUNT(*) as evaluaciones
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo = $1
        AND EXTRACT(YEAR FROM fecha_supervision) = 2025
        AND porcentaje IS NOT NULL
    `;
    
    const result = await this.pool.query(query, [grupo]);
    return result.rows;
  }

  // Manejo inteligente de errores con IA
  async handleIntelligentError(question, chatId, error) {
    try {
      const errorPrompt = `Como Ana, la analista experta, maneja este error técnico de manera inteligente:

PREGUNTA DEL USUARIO: "${question}"
ERROR TÉCNICO: ${error.message}
CHAT ID: ${chatId}

Genera una respuesta que:
1. Sea empática pero profesional
2. No alarme al usuario
3. Ofrezca alternativas específicas
4. Mantenga la personalidad de Ana
5. Sugiera comandos que sí funcionan

Respuesta en estilo Falcon AI (máximo 6 líneas):`;

      const errorResponse = await this.llm.generate(errorPrompt, {
        preferredProvider: 'gpt-3.5-turbo'
      });
      
      return this.responseGenerator.formatFalconResponse(errorResponse.response);
      
    } catch (secondError) {
      console.error('❌ Error crítico en manejo de errores:', secondError);
      return `🔧 Ana está resolviendo un problema técnico

⚡ Mientras tanto, puedes usar:
• /ranking - Top grupos operativos
• /areas_criticas - Áreas de oportunidad
• /q3 - Análisis trimestral

💡 Intenta reformular tu pregunta o usa un comando específico`;
    }
  }

  // Obtener estadísticas de inteligencia
  getIntelligenceStats() {
    const llmStats = this.llm.getUsageStats();
    const contextStats = this.contextManager.getContextStats();
    
    return {
      name: 'Ana Ultra Inteligente',
      intelligence_type: 'OpenAI_Powered_Maximum',
      
      // Capacidades IA
      ai_capabilities: {
        contextAnalysis: this.adaptiveConfig.useAI.forContext,
        queryGeneration: this.adaptiveConfig.useAI.forQueries,
        dataAnalysis: this.adaptiveConfig.useAI.forAnalysis,
        adaptiveResponses: this.adaptiveConfig.useAI.forResponses
      },
      
      // Métricas LLM
      llm_usage: {
        provider: llmStats.current_provider,
        dailyTokens: llmStats.daily_tokens,
        dailyCost: '$' + llmStats.daily_cost.toFixed(2),
        successRate: llmStats.success_rate,
        totalRequests: llmStats.total_requests
      },
      
      // Contexto conversacional
      context_intelligence: {
        activeConversations: contextStats.activeConversations,
        currentQuarter: contextStats.currentQuarter,
        lastGroup: contextStats.lastMentionedGroup
      },
      
      // Estado general
      system_status: 'Ultra Inteligente - OpenAI Máximo',
      database_integration: 'Datos reales PostgreSQL',
      adaptive_level: this.adaptiveConfig.intelligenceLevel,
      last_update: new Date().toISOString()
    };
  }

  // Forzar re-entrenamiento y optimización
  async forceIntelligenceBoost() {
    console.log('🚀 Iniciando boost de inteligencia...');
    
    try {
      // Test de proveedores OpenAI
      const providerTests = await this.llm.testAllProviders();
      
      // Limpiar conversaciones antiguas
      this.contextManager.cleanupOldConversations();
      
      // Optimizar configuración adaptativa
      this.adaptiveConfig.intelligenceLevel = 'maximum';
      
      console.log('✅ Boost de inteligencia completado');
      
      return {
        intelligence_boost: 'Completado',
        providers_working: Object.values(providerTests).filter(p => p.status === 'OK').length,
        memory_optimized: true,
        adaptive_config: this.adaptiveConfig,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error en boost de inteligencia:', error);
      return {
        intelligence_boost: 'Error',
        error: error.message
      };
    }
  }
}

module.exports = UltraIntelligentDirector;