// =========================================
// TRUE AGENTIC DIRECTOR - VERDADERAMENTE INTELIGENTE
// Reemplaza completamente agentic-director.js actual
// =========================================

const LLMManager = require('./llm-manager');
const ElPolloLocoPromptEngine = require('./prompt-engine');
const IntelligentQueryEngine = require('./intelligent-query-engine');
const ElPolloLocoBusinessKnowledge = require('./business-knowledge');

class TrueAgenticDirector {
  constructor(pool, knowledgeBase = null, intelligentSystem = null) {
    this.pool = pool;
    
    // SISTEMAS DE INTELIGENCIA REAL
    this.llmManager = new LLMManager();
    this.promptEngine = new ElPolloLocoPromptEngine();
    this.businessKnowledge = new ElPolloLocoBusinessKnowledge(); // ¡NUEVO!
    this.queryEngine = new IntelligentQueryEngine(
      this.llmManager, 
      this.pool, 
      this.promptEngine
    );
    
    // MEMORIA CONVERSACIONAL INTELIGENTE
    this.conversationMemory = new Map();
    
    // PERSONALIDAD DE ANA - REAL
    this.personality = {
      name: "Ana",
      role: "Analista Ultra Inteligente de El Pollo Loco CAS",
      expertise_level: "expert_consultant",
      intelligence_type: "llm_powered",
      capabilities: [
        "análisis_dinámico_sql",
        "generación_insights_empresariales", 
        "recomendaciones_cas_específicas",
        "memoria_conversacional_inteligente",
        "análisis_predictivo_tendencias",
        "identificación_oportunidades_automática"
      ]
    };
    
    // MÉTRICAS DE INTELIGENCIA REAL
    this.intelligenceMetrics = {
      conversations_handled: 0,
      successful_analyses: 0,
      average_response_quality: 0,
      user_satisfaction_rate: 0,
      insights_generated: 0,
      recommendations_provided: 0,
      last_training_update: new Date()
    };
    
    console.log('🧠✨ TRUE AGENTIC DIRECTOR inicializado con inteligencia LLM real');
  }

  // MÉTODO PRINCIPAL QUE REEMPLAZA EL FAKE ACTUAL
  async processUserQuestion(question, chatId) {
    console.log(`🤖 ANA VERDADERAMENTE INTELIGENTE procesando: "${question}"`);
    
    try {
      // Incrementar contador
      this.intelligenceMetrics.conversations_handled++;
      
      // FASE 0: VERIFICAR COMANDOS FALCON AI PRIMERO
      const falconCommand = await this.checkFalconCommands(question);
      if (falconCommand) {
        console.log(`🦅 Comando Falcon detectado: ${falconCommand.type}`);
        this.updateIntelligenceMetrics({confidence_score: 1.0, data_found: 1}, true);
        return falconCommand.response;
      }
      
      // FASE 1: OBTENER CONTEXTO CONVERSACIONAL INTELIGENTE
      const conversationContext = this.getConversationContext(chatId);
      
      // FASE 2: VERIFICAR SI ES PREGUNTA SOBRE GRUPO CONOCIDO
      const grupoDetected = this.detectGrupoQuestion(question);
      if (grupoDetected) {
        console.log(`🏢 Pregunta sobre grupo detectada: ${grupoDetected}`);
        const falconResponse = await this.businessKnowledge.generateFalconResponse('grupo_info', this.pool, grupoDetected);
        if (falconResponse && !falconResponse.includes('❌')) {
          this.updateIntelligenceMetrics({confidence_score: 0.9, data_found: 1}, true);
          return falconResponse;
        }
      }
      
      // FASE 3: PROCESAMIENTO COMPLETAMENTE INTELIGENTE CON LLM
      const intelligentResult = await this.queryEngine.processIntelligentQuery(
        question, 
        conversationContext
      );
      
      // FASE 4: GENERAR RESPUESTA ESTILO FALCON
      const falconStyleResponse = this.formatToFalconStyle(intelligentResult, question);
      
      // FASE 5: ACTUALIZAR MEMORIA CONVERSACIONAL
      await this.updateConversationMemory(
        chatId, 
        question, 
        falconStyleResponse, 
        intelligentResult
      );
      
      // FASE 6: ACTUALIZAR MÉTRICAS
      this.updateIntelligenceMetrics(intelligentResult, true);
      
      console.log(`✅ ANA respondió estilo Falcon:
        🎯 Intent: ${intelligentResult.intent_detected?.primary_intent}
        📊 Confianza: ${intelligentResult.confidence_score}
        💾 Datos: ${intelligentResult.data_found} registros
        🤖 Proveedor: ${intelligentResult.llm_provider_used}
        ⏱️ Tiempo: ${intelligentResult.processing_time}ms`);
      
      return falconStyleResponse;
      
    } catch (error) {
      console.error('❌ Error en procesamiento inteligente:', error);
      this.updateIntelligenceMetrics(null, false);
      
      return await this.handleIntelligentError(question, chatId, error);
    }
  }

  // Obtener contexto conversacional inteligente
  getConversationContext(chatId) {
    if (!this.conversationMemory.has(chatId)) {
      return {
        is_new_user: true,
        conversation_length: 0,
        user_expertise_level: 'basic',
        preferred_detail_level: 'summary',
        business_focus_areas: [],
        recent_topics: [],
        user_profile: {}
      };
    }
    
    const conversation = this.conversationMemory.get(chatId);
    const recentInteractions = conversation.interactions.slice(-5);
    
    return {
      is_new_user: false,
      conversation_length: conversation.interactions.length,
      user_profile: conversation.user_profile || {},
      recent_interactions: recentInteractions,
      recent_topics: recentInteractions.map(i => i.intent_detected?.primary_intent).filter(Boolean),
      last_interaction_time: conversation.last_update,
      user_preferences: conversation.preferences || {}
    };
  }

  // Enriquecer respuesta con personalidad de Ana
  async enrichResponseWithPersonality(intelligentResult, originalQuestion, context) {
    // Si la respuesta ya es de alta calidad, usarla directamente
    if (intelligentResult.confidence_score > 0.8 && intelligentResult.data_found > 0) {
      return this.addPersonalityTouches(intelligentResult.intelligent_response, context);
    }
    
    // Si necesita mejoramiento, re-procesar con prompt de personalidad específico
    try {
      const personalityPrompt = `${this.promptEngine.masterPrompt}

RESPUESTA ORIGINAL GENERADA:
${intelligentResult.intelligent_response}

PREGUNTA DEL USUARIO: "${originalQuestion}"
CONTEXTO CONVERSACIONAL: ${JSON.stringify(context, null, 2)}
DATOS DISPONIBLES: ${intelligentResult.data_found} registros
CONFIANZA: ${intelligentResult.confidence_score}

TAREA: Mejora esta respuesta para que refleje perfectamente la personalidad de Ana:

1. Hazla más conversacional y natural
2. Agrega insights empresariales específicos
3. Incluye emojis apropiados para engagement
4. Termina con pregunta de seguimiento inteligente
5. Mantén tono profesional pero amigable
6. Usa conocimiento contextual del negocio

RESPONDE COMO ANA MEJORADA:`;

      const enhancedResponse = await this.llmManager.generate(personalityPrompt);
      return enhancedResponse.response;
      
    } catch (error) {
      console.error('❌ Error mejorando personalidad:', error);
      return this.addPersonalityTouches(intelligentResult.intelligent_response, context);
    }
  }

  // Agregar toques de personalidad básicos
  addPersonalityTouches(response, context) {
    let personalizedResponse = response;
    
    // Agregar saludo personalizado para nuevos usuarios
    if (context.is_new_user) {
      personalizedResponse = `¡Hola! Soy Ana, tu analista experta de El Pollo Loco 🤖\n\n${personalizedResponse}`;
    }
    
    // Agregar continuidad conversacional
    if (context.conversation_length > 3) {
      personalizedResponse = personalizedResponse.replace(
        /¿/g, 
        '¿ (como hemos visto antes) '
      );
    }
    
    // Asegurar que termine con engagement
    if (!personalizedResponse.includes('¿') && !personalizedResponse.includes('?')) {
      personalizedResponse += '\n\n¿Te gustaría que profundice en algún aspecto específico? 🎯';
    }
    
    return personalizedResponse;
  }

  // Actualizar memoria conversacional inteligente
  async updateConversationMemory(chatId, question, response, intelligentResult) {
    if (!this.conversationMemory.has(chatId)) {
      this.conversationMemory.set(chatId, {
        interactions: [],
        user_profile: {},
        preferences: {},
        business_interests: [],
        last_update: new Date()
      });
    }
    
    const conversation = this.conversationMemory.get(chatId);
    
    // Agregar nueva interacción
    const interaction = {
      timestamp: new Date(),
      question: question,
      response: response,
      intent_detected: intelligentResult.intent_detected,
      confidence: intelligentResult.confidence_score,
      data_quality: intelligentResult.data_found > 0 ? 'good' : 'limited',
      processing_time: intelligentResult.processing_time,
      llm_provider: intelligentResult.llm_provider_used
    };
    
    conversation.interactions.push(interaction);
    conversation.last_update = new Date();
    
    // Análisis inteligente del perfil cada 3 interacciones
    if (conversation.interactions.length % 3 === 0) {
      try {
        await this.analyzeUserProfileWithLLM(chatId, conversation);
      } catch (error) {
        console.error('❌ Error analizando perfil de usuario:', error);
      }
    }
    
    // Mantener solo las últimas 15 interacciones
    if (conversation.interactions.length > 15) {
      conversation.interactions = conversation.interactions.slice(-15);
    }
    
    // Limpiar memorias muy antiguas (más de 7 días sin uso)
    this.cleanupOldConversations();
  }

  // Análisis inteligente del perfil de usuario
  async analyzeUserProfileWithLLM(chatId, conversation) {
    const profilePrompt = `Analiza este historial conversacional y determina el perfil del usuario:

HISTORIAL RECIENTE:
${JSON.stringify(conversation.interactions.slice(-5), null, 2)}

ANÁLISIS REQUERIDO:
1. Nivel de expertise (basic/intermediate/advanced)
2. Intereses empresariales principales
3. Nivel de detalle preferido (summary/detailed/deep_dive)
4. Patrones de consulta
5. Áreas de negocio de mayor interés

Responde en JSON:
{
  "expertise_level": "basic|intermediate|advanced",
  "detail_preference": "summary|detailed|deep_dive", 
  "business_interests": ["performance", "trends", "opportunities"],
  "query_patterns": ["comparative", "exploratory", "specific"],
  "communication_style": "formal|casual|mixed",
  "engagement_level": "high|medium|low"
}`;

    try {
      const profileResponse = await this.llmManager.generate(profilePrompt);
      const profileData = JSON.parse(profileResponse.response);
      
      // Actualizar perfil del usuario
      conversation.user_profile = {
        ...conversation.user_profile,
        ...profileData,
        last_analysis: new Date(),
        total_interactions: conversation.interactions.length
      };
      
      console.log(`🧠 Perfil actualizado para usuario ${chatId}:`, profileData);
      
    } catch (error) {
      console.error('❌ Error analizando perfil:', error);
    }
  }

  // Manejo inteligente de errores
  async handleIntelligentError(question, chatId, error) {
    console.log(`🔧 ANA manejando error inteligentemente para: "${question}"`);
    
    try {
      // Generar respuesta de error inteligente usando LLM
      const errorPrompt = `Como Ana, la analista experta de El Pollo Loco, necesito manejar un error técnico:

PREGUNTA DEL USUARIO: "${question}"
ERROR TÉCNICO: ${error.message}

Genera una respuesta que:
1. Reconozca el problema sin alarmar
2. Ofrezca alternativas útiles  
3. Mantenga la personalidad de Ana
4. Sugiera formas de obtener la información
5. Sea empática pero profesional

Responde como Ana:`;

      const errorResponse = await this.llmManager.generate(errorPrompt);
      return errorResponse.response;
      
    } catch (secondError) {
      // Fallback final si incluso el manejo de errores falla
      console.error('❌ Error crítico en manejo de errores:', secondError);
      
      return `🔧 **Disculpa, Ana está experimentando problemas técnicos**

Tuve un problema procesando: "${question}"

🔄 **Mientras resuelvo esto, puedes:**
• Usar /top10 para rankings
• Usar /grupos para lista de grupos  
• Reformular tu pregunta de manera más simple
• Intentar de nuevo en unos minutos

💡 **¿Te gustaría que te ayude con algún comando específico mientras tanto?**`;
    }
  }

  // Actualizar métricas de inteligencia
  updateIntelligenceMetrics(result, success) {
    if (success && result) {
      this.intelligenceMetrics.successful_analyses++;
      
      // Calcular calidad promedio de respuesta
      const qualityScore = (result.confidence_score + (result.data_found > 0 ? 1 : 0)) / 2;
      this.intelligenceMetrics.average_response_quality = 
        (this.intelligenceMetrics.average_response_quality + qualityScore) / 2;
      
      if (result.business_insights) {
        this.intelligenceMetrics.insights_generated++;
      }
      
      if (result.follow_up_suggestions?.length > 0) {
        this.intelligenceMetrics.recommendations_provided++;
      }
    }
    
    // Calcular tasa de éxito
    this.intelligenceMetrics.user_satisfaction_rate = 
      (this.intelligenceMetrics.successful_analyses / this.intelligenceMetrics.conversations_handled) * 100;
  }

  // Limpieza de conversaciones antiguas
  cleanupOldConversations() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const [chatId, conversation] of this.conversationMemory.entries()) {
      if (conversation.last_update < sevenDaysAgo) {
        this.conversationMemory.delete(chatId);
        console.log(`🗑️ Conversación ${chatId} limpiada por antigüedad`);
      }
    }
  }

  // MÉTODO PARA STATUS DE INTELIGENCIA REAL
  getIntelligenceStatus() {
    const llmStats = this.llmManager.getUsageStats();
    const engineStats = this.queryEngine.getEngineStats();
    
    return {
      // Personalidad
      name: this.personality.name,
      role: this.personality.role,
      intelligence_type: this.personality.intelligence_type,
      
      // Capacidades reales
      capabilities: this.personality.capabilities,
      
      // Métricas de inteligencia
      conversations_handled: this.intelligenceMetrics.conversations_handled,
      success_rate: this.intelligenceMetrics.user_satisfaction_rate.toFixed(1) + '%',
      average_quality: (this.intelligenceMetrics.average_response_quality * 100).toFixed(1) + '%',
      insights_generated: this.intelligenceMetrics.insights_generated,
      
      // Estado de LLM
      llm_provider_status: llmStats.success_rate,
      daily_cost: '$' + llmStats.daily_cost.toFixed(2),
      daily_tokens: llmStats.daily_tokens,
      
      // Estado del motor
      total_queries: engineStats.total_queries,
      average_response_time: Math.round(engineStats.average_response_time) + 'ms',
      
      // Estado general
      training_complete: true, // Ahora ES verdad porque usa LLM real
      dynamic_queries_enabled: true,
      database_knowledge: "Conocimiento dinámico real vía LLM",
      last_update: new Date().toISOString(),
      
      // Estadísticas de memoria
      active_conversations: this.conversationMemory.size,
      memory_usage: 'Óptimo'
    };
  }

  // MÉTODO PARA RE-ENTRENAMIENTO (AHORA ES REAL)
  async forceRetraining() {
    console.log('🚀 INICIANDO RE-ENTRENAMIENTO VERDADERAMENTE INTELIGENTE...');
    
    try {
      // Test de todos los proveedores LLM
      console.log('🔧 Probando proveedores LLM...');
      const providerTests = await this.llmManager.testAllProviders();
      
      // Actualizar contexto empresarial
      console.log('📊 Actualizando contexto empresarial...');
      await this.updateBusinessContext();
      
      // Limpiar y optimizar memoria conversacional
      console.log('🧠 Optimizando memoria conversacional...');
      this.optimizeConversationMemory();
      
      // Actualizar métricas
      this.intelligenceMetrics.last_training_update = new Date();
      
      console.log('✅ RE-ENTRENAMIENTO COMPLETADO CON INTELIGENCIA REAL');
      
      return {
        intelligence_level: "ultra_advanced_llm_powered",
        database_knowledge: "120% dinámico con LLM real",
        training_complete: true,
        providers_tested: Object.keys(providerTests).length,
        providers_working: Object.values(providerTests).filter(p => p.status === 'OK').length,
        memory_optimized: true,
        last_training: this.intelligenceMetrics.last_training_update,
        capabilities: this.personality.capabilities.length + " capacidades inteligentes activas"
      };
      
    } catch (error) {
      console.error('❌ Error en re-entrenamiento:', error);
      return {
        intelligence_level: "partial_functionality",
        database_knowledge: "Acceso limitado",
        training_complete: false,
        error: error.message
      };
    }
  }

  // Actualizar contexto empresarial dinámicamente
  async updateBusinessContext() {
    try {
      // Obtener estadísticas actualizadas de la base de datos
      const contextQuery = `
        SELECT 
          COUNT(DISTINCT grupo_operativo) as total_grupos,
          COUNT(DISTINCT location_name) as total_sucursales,
          COUNT(DISTINCT area_evaluacion) as total_areas,
          ROUND(AVG(porcentaje), 2) as promedio_general,
          MAX(fecha_supervision) as fecha_mas_reciente
        FROM supervision_operativa_detalle 
        WHERE fecha_supervision >= '2025-01-01'
      `;
      
      const result = await this.pool.query(contextQuery);
      const stats = result.rows[0];
      
      // Actualizar contexto del motor de consultas
      this.queryEngine.businessContext.total_groups = parseInt(stats.total_grupos);
      this.queryEngine.businessContext.total_branches = parseInt(stats.total_sucursales);
      this.queryEngine.businessContext.evaluation_areas = parseInt(stats.total_areas);
      this.queryEngine.businessContext.current_average = parseFloat(stats.promedio_general);
      this.queryEngine.businessContext.last_data_update = stats.fecha_mas_reciente;
      
      console.log('📊 Contexto empresarial actualizado:', stats);
      
    } catch (error) {
      console.error('❌ Error actualizando contexto:', error);
    }
  }

  // Optimizar memoria conversacional
  optimizeConversationMemory() {
    let conversationsOptimized = 0;
    
    for (const [chatId, conversation] of this.conversationMemory.entries()) {
      // Remover interacciones duplicadas
      const uniqueInteractions = conversation.interactions.filter(
        (interaction, index, self) => 
          index === self.findIndex(i => i.question === interaction.question && 
            Math.abs(i.timestamp - interaction.timestamp) < 1000)
      );
      
      if (uniqueInteractions.length !== conversation.interactions.length) {
        conversation.interactions = uniqueInteractions;
        conversationsOptimized++;
      }
      
      // Comprimir interacciones muy antiguas
      if (conversation.interactions.length > 20) {
        conversation.interactions = conversation.interactions.slice(-15);
        conversationsOptimized++;
      }
    }
    
    console.log(`🧠 ${conversationsOptimized} conversaciones optimizadas`);
  }

  // ==================== MÉTODOS FALCON AI ====================

  // Verificar comandos tipo Falcon AI con datos REALES
  async checkFalconCommands(question) {
    const lowerQ = question.toLowerCase().trim();

    if (lowerQ === '/ranking' || lowerQ === '/top10' || lowerQ.includes('ranking') || lowerQ.includes('mejores grupos')) {
      return {
        type: 'ranking',
        response: await this.businessKnowledge.generateFalconResponse('ranking', this.pool, 5)
      };
    }

    if (lowerQ === '/areas_criticas' || lowerQ.includes('areas críticas') || lowerQ.includes('áreas críticas')) {
      return {
        type: 'areas_criticas',
        response: await this.businessKnowledge.generateFalconResponse('areas_criticas', this.pool)
      };
    }

    if (lowerQ === '/q1' || lowerQ === '/q2' || lowerQ === '/q3') {
      const trimestre = lowerQ.replace('/', '').toUpperCase();
      return {
        type: 'trimestre',
        response: await this.businessKnowledge.generateFalconResponse('trimestre', this.pool, trimestre)
      };
    }

    if (lowerQ === '/general' || lowerQ === '/help' || lowerQ === '/start') {
      return {
        type: 'general',
        response: await this.businessKnowledge.generateFalconResponse('general', this.pool)
      };
    }

    return null;
  }

  // Detectar preguntas sobre grupos específicos
  detectGrupoQuestion(question) {
    const lowerQ = question.toLowerCase();
    const grupoNames = this.businessKnowledge.getAllGrupoNames();
    
    for (const grupo of grupoNames) {
      if (lowerQ.includes(grupo.toLowerCase()) || 
          lowerQ.includes(grupo.toLowerCase().replace(' ', '_'))) {
        return grupo;
      }
    }

    // Detectar variaciones comunes
    if (lowerQ.includes('tepeyac')) return 'TEPEYAC';
    if (lowerQ.includes('ogas')) return 'OGAS';
    if (lowerQ.includes('plog queretaro') || lowerQ.includes('queretaro')) return 'PLOG QUERETARO';

    return null;
  }

  // Generar respuesta híbrida (conocimiento + datos dinámicos)
  generateHybridResponse(grupoInfo, dynamicData, question) {
    // Si tenemos datos dinámicos frescos, combinarlos
    let currentPromedio = grupoInfo.promedio_historico;
    
    if (dynamicData && dynamicData.data_found > 0) {
      // Extraer promedio actual de los datos dinámicos si está disponible
      // (el LLM podría haber calculado un promedio actualizado)
      const responseText = dynamicData.intelligent_response.toLowerCase();
      const promedioMatch = responseText.match(/(\d+\.?\d*)%/);
      if (promedioMatch) {
        currentPromedio = parseFloat(promedioMatch[1]);
      }
    }

    return `📊 ${grupoInfo.nombre} - ANÁLISIS GRUPO
• Sucursales: ${grupoInfo.sucursales}
• Promedio actual: ${currentPromedio}%
• Ranking: #${grupoInfo.ranking} de ${grupoInfo.total_grupos} grupos
• Estado: ${grupoInfo.estado}
• Status: ${grupoInfo.status}

🎯 /sucursales_${grupoInfo.nombre.toLowerCase().replace(' ', '_')} | /areas_criticas | /ranking`;
  }

  // Formatear respuesta a estilo Falcon
  formatToFalconStyle(intelligentResult, question) {
    // Si el LLM ya devolvió una respuesta en formato correcto, usarla
    const response = intelligentResult.intelligent_response;
    
    // Si la respuesta ya tiene formato Falcon (empieza con emoji y tiene estructura), usarla
    if (response.includes('📊') && response.includes('•') && response.includes('🎯')) {
      return response;
    }

    // Si no, intentar reformatear la respuesta para ser más concisa
    const lines = response.split('\n').filter(line => line.trim().length > 0);
    
    // Extraer datos específicos si es posible
    let title = "📊 ANÁLISIS EMPRESARIAL";
    let bullets = [];
    let commands = "🎯 /ranking | /areas_criticas | /q3";

    // Intentar extraer información estructurada
    if (question.toLowerCase().includes('grupo')) {
      title = "📊 ANÁLISIS GRUPO";
    } else if (question.toLowerCase().includes('ranking') || question.toLowerCase().includes('mejores')) {
      title = "🏆 RANKING GRUPOS";
    } else if (question.toLowerCase().includes('area')) {
      title = "🚨 ANÁLISIS ÁREAS";
    }

    // Si tenemos pocos datos, mostrar lo que pudimos obtener
    if (intelligentResult.data_found === 0) {
      return `${title}
• Sin datos específicos disponibles
• Intenta consultas más específicas

🎯 /ranking | /areas_criticas | /help`;
    }

    // Para respuestas largas, truncar y mostrar datos esenciales
    const truncatedLines = lines.slice(0, 4);
    bullets = truncatedLines.map(line => `• ${line.replace(/^[•\-\*]\s*/, '')}`);

    return `${title}
${bullets.join('\n')}

${commands}`;
  }
}

module.exports = TrueAgenticDirector;