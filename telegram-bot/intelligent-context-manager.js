// =========================================
// INTELLIGENT CONTEXT MANAGER - MEMORIA CONVERSACIONAL ULTRA INTELIGENTE
// Usa OpenAI para mantener contexto y memoria de conversaciones
// =========================================

class IntelligentContextManager {
  constructor(llmManager) {
    this.llm = llmManager;
    
    // Memoria conversacional por chat
    this.conversations = new Map();
    
    // Contexto empresarial dinámico
    this.businessContext = {
      groups: ['OGAS', 'TEPEYAC', 'PLOG QUERETARO', 'EPL SO', 'TEC', 'EXPO', 'EFM', 'CRR', 'RAP', 'PLOG LAGUNA', 'GRUPO MATAMOROS', 'GRUPO RIO BRAVO', 'GRUPO SALTILLO'],
      currentQuarter: 3,
      currentYear: 2025,
      lastMentionedGroup: null,
      commonPatterns: new Map()
    };
    
    console.log('🧠 Intelligent Context Manager inicializado');
  }

  // MÉTODO PRINCIPAL: Analizar contexto de la pregunta usando IA
  async analyzeQuestionContext(question, chatId, conversationHistory = []) {
    try {
      const contextPrompt = this.buildContextAnalysisPrompt(question, chatId, conversationHistory);
      
      const analysis = await this.llm.generate(contextPrompt, {
        preferredProvider: 'gpt-3.5-turbo', // Más rápido para contexto
        timeout: 10000
      });
      
      // Parsear respuesta JSON
      let contextData;
      try {
        const jsonText = this.cleanJsonResponse(analysis.response);
        contextData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('❌ Error parseando contexto:', parseError);
        return this.getFallbackContext(question, chatId);
      }
      
      // Actualizar memoria conversacional
      await this.updateConversationMemory(chatId, question, contextData);
      
      return contextData;
      
    } catch (error) {
      console.error('❌ Error analizando contexto:', error);
      return this.getFallbackContext(question, chatId);
    }
  }

  // Construir prompt para análisis de contexto
  buildContextAnalysisPrompt(question, chatId, conversationHistory) {
    const recentHistory = conversationHistory.slice(-5).map(h => 
      `Usuario: "${h.question}" | Grupo detectado: ${h.detectedGroup || 'N/A'}`
    ).join('\n');

    // Obtener perfil de usuario si existe
    const conversation = this.conversations.get(chatId);
    const userProfile = conversation?.userProfile || {};
    const primaryGroup = userProfile.primaryGroup || null;

    return `Eres un analista experto de El Pollo Loco. Analiza esta pregunta en contexto conversacional.

PREGUNTA ACTUAL: "${question}"

PERFIL DE USUARIO:
- Grupo principal configurado: ${primaryGroup || 'No configurado'}
- Tipo de usuario: ${userProfile.userType || 'general'}
- Intereses: ${userProfile.interests?.join(', ') || 'general'}

HISTORIAL CONVERSACIONAL RECIENTE:
${recentHistory || 'Primera interacción'}

GRUPOS DISPONIBLES: ${this.businessContext.groups.join(', ')}

ANÁLISIS REQUERIDO:
1. ¿Qué grupo operativo específico menciona o implica?
2. ¿Usa pronombres como "sus", "de ellos" que refieren al grupo anterior?
3. Si la pregunta es ambigua ("¿cómo vamos?", "areas críticas"), usar el grupo principal configurado
4. ¿Qué tipo de información solicita exactamente?
5. ¿Qué nivel de detalle necesita?
6. ¿Es una consulta de seguimiento o nueva?

REGLAS DE DECISIÓN:
- Si pregunta menciona grupo específico → usar ese grupo
- Si pregunta usa contexto ("sus áreas") → usar grupo del historial reciente
- Si pregunta es ambigua ("¿cómo vamos?") → usar grupo principal configurado
- Solo usar grupos del historial si NO hay grupo principal configurado

Responde SOLO en JSON válido:
{
  "detectedGroup": "NOMBRE_EXACTO_GRUPO | null",
  "groupFromContext": "GRUPO_DEL_CONTEXTO_ANTERIOR | null", 
  "primaryGroup": "${primaryGroup || 'null'}",
  "finalGroup": "GRUPO_DEFINITIVO_A_USAR",
  "queryType": "group_summary | areas_criticas | calificaciones | evolution | comprehensive",
  "confidence": 0.95,
  "needsContext": true,
  "isFollowUp": false,
  "specificRequests": ["sucursales", "calificaciones", "areas"],
  "responseStyle": "detailed | summary | falcon_structured",
  "quarter": 3,
  "reasoning": "Breve explicación de la decisión"
}`;
  }

  // Limpiar respuesta JSON del LLM
  cleanJsonResponse(response) {
    let jsonText = response.trim();
    
    // Remover markdown
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }
    
    // Limpiar caracteres extraños
    jsonText = jsonText.replace(/[\u0000-\u0019]+/g, '');
    
    return jsonText;
  }

  // Actualizar memoria conversacional
  async updateConversationMemory(chatId, question, contextData) {
    if (!this.conversations.has(chatId)) {
      this.conversations.set(chatId, {
        history: [],
        lastGroup: null,
        userProfile: {
          expertise: 'basic',
          preferredDetail: 'summary',
          frequentGroups: []
        },
        lastUpdate: new Date()
      });
    }
    
    const conversation = this.conversations.get(chatId);
    
    // Agregar interacción actual
    conversation.history.push({
      timestamp: new Date(),
      question: question,
      detectedGroup: contextData.finalGroup,
      queryType: contextData.queryType,
      confidence: contextData.confidence
    });
    
    // Actualizar último grupo mencionado
    if (contextData.finalGroup) {
      conversation.lastGroup = contextData.finalGroup;
      this.businessContext.lastMentionedGroup = contextData.finalGroup;
      
      // Tracking de grupos frecuentes
      const groupIndex = conversation.userProfile.frequentGroups.findIndex(g => g.name === contextData.finalGroup);
      if (groupIndex >= 0) {
        conversation.userProfile.frequentGroups[groupIndex].count++;
      } else {
        conversation.userProfile.frequentGroups.push({
          name: contextData.finalGroup,
          count: 1
        });
      }
    }
    
    // Mantener solo últimas 15 interacciones
    if (conversation.history.length > 15) {
      conversation.history = conversation.history.slice(-15);
    }
    
    conversation.lastUpdate = new Date();
    
    // Analizar perfil de usuario cada 5 interacciones
    if (conversation.history.length % 5 === 0) {
      await this.analyzeUserProfile(chatId, conversation);
    }
  }

  // Analizar perfil de usuario con IA
  async analyzeUserProfile(chatId, conversation) {
    try {
      const profilePrompt = `Analiza este historial de usuario y determina su perfil:

HISTORIAL (últimas 10 interacciones):
${conversation.history.slice(-10).map(h => 
  `• "${h.question}" (Grupo: ${h.detectedGroup}, Tipo: ${h.queryType})`
).join('\n')}

GRUPOS MÁS CONSULTADOS:
${conversation.userProfile.frequentGroups.sort((a, b) => b.count - a.count).slice(0, 5).map(g => 
  `${g.name}: ${g.count} veces`
).join(', ')}

Determina en JSON:
{
  "expertise": "basic | intermediate | advanced",
  "preferredDetail": "summary | detailed | comprehensive", 
  "primaryInterests": ["performance", "areas_criticas", "evolution"],
  "communicationStyle": "formal | casual | mixed",
  "responsePreference": "quick | thorough | analytical"
}`;

      const profileResult = await this.llm.generate(profilePrompt, {
        preferredProvider: 'gpt-3.5-turbo'
      });
      
      const profileData = JSON.parse(this.cleanJsonResponse(profileResult.response));
      conversation.userProfile = { ...conversation.userProfile, ...profileData };
      
      console.log(`🧠 Perfil actualizado para chat ${chatId}:`, profileData);
      
    } catch (error) {
      console.error('❌ Error analizando perfil:', error);
    }
  }

  // Obtener contexto de fallback si la IA falla
  getFallbackContext(question, chatId = null) {
    const lowerQ = question.toLowerCase();
    
    // Obtener grupo principal del perfil de usuario si está disponible
    let primaryGroup = null;
    if (chatId && this.conversations.has(chatId)) {
      const conversation = this.conversations.get(chatId);
      primaryGroup = conversation.userProfile?.primaryGroup || null;
    }
    
    // Detectar grupo por palabras clave
    let detectedGroup = null;
    for (const group of this.businessContext.groups) {
      if (lowerQ.includes(group.toLowerCase())) {
        detectedGroup = group;
        break;
      }
    }
    
    // Detectar tipo de consulta
    let queryType = 'group_summary';
    if (lowerQ.includes('areas') && (lowerQ.includes('critica') || lowerQ.includes('oportunidad'))) {
      queryType = 'areas_criticas';
    } else if (lowerQ.includes('calificacion') || lowerQ.includes('promedio')) {
      queryType = 'calificaciones';
    } else if (lowerQ.includes('evolucion') || lowerQ.includes('comparativ')) {
      queryType = 'evolution';
    } else if (lowerQ.includes('sucursales') && lowerQ.includes('areas')) {
      queryType = 'comprehensive';
    }
    
    // Determinar grupo final con prioridad al perfil configurado
    let finalGroup = detectedGroup || primaryGroup || this.businessContext.lastMentionedGroup || 'TEPEYAC';
    
    return {
      detectedGroup: detectedGroup,
      groupFromContext: this.businessContext.lastMentionedGroup,
      primaryGroup: primaryGroup,
      finalGroup: finalGroup,
      queryType: queryType,
      confidence: detectedGroup ? 0.9 : (primaryGroup ? 0.8 : 0.7),
      needsContext: true,
      isFollowUp: !detectedGroup && this.businessContext.lastMentionedGroup,
      specificRequests: this.extractSpecificRequests(lowerQ),
      responseStyle: 'falcon_structured',
      quarter: this.businessContext.currentQuarter,
      reasoning: detectedGroup ? 'Grupo detectado por palabra clave' : 
                 primaryGroup ? 'Usando grupo principal del perfil' : 
                 'Fallback a grupo por defecto'
    };
  }

  // Extraer solicitudes específicas de la pregunta
  extractSpecificRequests(lowerQuestion) {
    const requests = [];
    if (lowerQuestion.includes('sucursales')) requests.push('sucursales');
    if (lowerQuestion.includes('calificacion') || lowerQuestion.includes('promedio')) requests.push('calificaciones');
    if (lowerQuestion.includes('areas') || lowerQuestion.includes('oportunidad')) requests.push('areas');
    if (lowerQuestion.includes('evolucion') || lowerQuestion.includes('comparativ')) requests.push('evolution');
    return requests;
  }

  // Obtener contexto de conversación para un chat
  getConversationContext(chatId) {
    if (!this.conversations.has(chatId)) {
      return {
        isNewUser: true,
        lastGroup: null,
        userProfile: { expertise: 'basic', preferredDetail: 'summary' },
        history: []
      };
    }
    
    const conversation = this.conversations.get(chatId);
    return {
      isNewUser: false,
      lastGroup: conversation.lastGroup,
      userProfile: conversation.userProfile,
      history: conversation.history.slice(-5),
      totalInteractions: conversation.history.length
    };
  }

  // Limpiar conversaciones antiguas (>7 días)
  cleanupOldConversations() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let cleaned = 0;
    
    for (const [chatId, conversation] of this.conversations.entries()) {
      if (conversation.lastUpdate < sevenDaysAgo) {
        this.conversations.delete(chatId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} conversaciones antiguas limpiadas`);
    }
  }

  // Estadísticas del contexto
  getContextStats() {
    return {
      activeConversations: this.conversations.size,
      totalGroups: this.businessContext.groups.length,
      currentQuarter: `Q${this.businessContext.currentQuarter} ${this.businessContext.currentYear}`,
      lastMentionedGroup: this.businessContext.lastMentionedGroup,
      memoryUsage: 'Optimal'
    };
  }
}

module.exports = IntelligentContextManager;