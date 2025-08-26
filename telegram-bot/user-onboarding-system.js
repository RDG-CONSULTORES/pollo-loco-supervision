// =========================================
// USER ONBOARDING SYSTEM - HÍBRIDO INTELIGENTE
// Setup mínimo + IA que aprende automáticamente
// =========================================

class UserOnboardingSystem {
  constructor(llmManager, contextManager) {
    this.llm = llmManager;
    this.contextManager = contextManager;
    
    // Estados del onboarding
    this.onboardingStates = new Map();
    
    // Grupos disponibles por región
    this.regionGroups = {
      'norte': ['OGAS', 'TEPEYAC', 'GRUPO SALTILLO', 'GRUPO MATAMOROS', 'GRUPO RIO BRAVO'],
      'centro': ['PLOG QUERETARO', 'TEC', 'EPL SO'],
      'occidente': ['EXPO', 'EFM', 'CRR', 'RAP'],
      'centrosur': ['PLOG LAGUNA', 'PLANTA REYNOLDS', 'ADMINISTRACION']
    };
    
    this.allGroups = [
      'OGAS', 'TEPEYAC', 'PLOG QUERETARO', 'EPL SO', 'TEC', 
      'EXPO', 'EFM', 'CRR', 'RAP', 'PLOG LAGUNA',
      'GRUPO MATAMOROS', 'GRUPO RIO BRAVO', 'GRUPO SALTILLO',
      'PLANTA REYNOLDS', 'ADMINISTRACION'
    ];
    
    console.log('👋 User Onboarding System inicializado');
  }

  // MÉTODO PRINCIPAL: Verificar si necesita onboarding
  async checkOnboardingNeeded(chatId, question) {
    const context = this.contextManager.getConversationContext(chatId);
    
    // Si es nuevo usuario Y no está en proceso de onboarding
    if (context.isNewUser && !this.isInOnboarding(chatId)) {
      return await this.startOnboarding(chatId);
    }
    
    // Si está en proceso de onboarding
    if (this.isInOnboarding(chatId)) {
      return await this.processOnboardingStep(chatId, question);
    }
    
    // Si no es nuevo, verificar si necesita actualización de perfil
    if (context.totalInteractions > 0 && context.totalInteractions % 15 === 0) {
      return await this.checkProfileUpdate(chatId, context);
    }
    
    return null; // No necesita onboarding, continuar normal
  }

  // Iniciar onboarding rápido
  async startOnboarding(chatId) {
    this.onboardingStates.set(chatId, {
      step: 1,
      startedAt: new Date(),
      data: {}
    });
    
    return `👋 ¡Hola! Soy Ana, tu analista experta de El Pollo Loco

🎯 **Setup rápido (30 segundos, opcional):**

¿Supervisas algún grupo específico?

✅ **Sí** - Tengo un grupo principal
🔄 **Múltiples** - Manejo varios grupos  
⏭️ **Saltar** - Empezar sin configurar

_Escribe: "si", "múltiples" o "saltar"_`;
  }

  // Procesar pasos del onboarding
  async processOnboardingStep(chatId, answer) {
    const state = this.onboardingStates.get(chatId);
    const lowerAnswer = answer.toLowerCase().trim();
    
    switch (state.step) {
      case 1:
        return await this.processStep1(chatId, lowerAnswer, state);
      case 2:
        return await this.processStep2(chatId, answer, state);
      case 3:
        return await this.processStep3(chatId, lowerAnswer, state);
      default:
        return await this.finishOnboarding(chatId, state);
    }
  }

  // Paso 1: Tipo de usuario
  async processStep1(chatId, answer, state) {
    if (answer.includes('saltar') || answer.includes('skip')) {
      return await this.finishOnboarding(chatId, state, true);
    }
    
    if (answer.includes('si') || answer.includes('sí') || answer.includes('specific')) {
      state.data.userType = 'supervisor';
      state.step = 2;
      
      return `📝 **Perfecto!** ¿Cuál es tu grupo principal?

Escribe el nombre o región:
• "Tepeyac", "OGAS", "Querétaro"
• "Norte", "Monterrey", "Jalisco"  
• O cualquier grupo/ciudad

_Ana entenderá automáticamente_ 🧠`;
    }
    
    if (answer.includes('múltiples') || answer.includes('varios') || answer.includes('multiple')) {
      state.data.userType = 'director';
      state.step = 3;
      
      return `👑 **Entendido!** Como director/gerente multi-grupo:

¿Qué te interesa más?

🚨 **Alertas** - Notificaciones de problemas críticos
📈 **Reportes** - Rankings y comparativos ejecutivos  
🔍 **Análisis** - Deep dive y tendencias detalladas
⚡ **Todo** - Experiencia completa

_Escribe: "alertas", "reportes", "análisis" o "todo"_`;
    }
    
    // Si no entiende, usar IA para procesar
    return await this.processWithAI(chatId, answer, state);
  }

  // Paso 2: Grupo específico (solo supervisores)
  async processStep2(chatId, answer, state) {
    try {
      const groupDetection = await this.detectGroupWithAI(answer);
      
      if (groupDetection.primaryGroup) {
        state.data.primaryGroup = groupDetection.primaryGroup;
        state.data.region = groupDetection.region;
        state.step = 3;
        
        return `✅ **${groupDetection.primaryGroup}** detectado!

Últimapregunta: ¿Qué te interesa más?

🚨 **Alertas** - Si ${groupDetection.primaryGroup} baja de umbral
📊 **Métricas** - Calificaciones y áreas críticas  
📈 **Evolución** - Tendencias y comparativos
⚡ **Todo** - Experiencia completa

_Escribe: "alertas", "métricas", "evolución" o "todo"_`;
      } else {
        // No detectó grupo, ofrecer lista por región
        return this.showGroupsByRegion(chatId, answer, state);
      }
    } catch (error) {
      console.error('❌ Error en detección de grupo:', error);
      return await this.finishOnboarding(chatId, state, true);
    }
  }

  // Paso 3: Intereses
  async processStep3(chatId, answer, state) {
    const interests = this.detectInterests(answer);
    state.data.interests = interests;
    
    return await this.finishOnboarding(chatId, state);
  }

  // Detectar grupo con IA
  async detectGroupWithAI(userInput) {
    const prompt = `El usuario escribió sobre su grupo: "${userInput}"

Grupos disponibles: ${this.allGroups.join(', ')}

Ciudades/Regiones comunes:
- Monterrey → OGAS, TEPEYAC
- Querétaro → PLOG QUERETARO  
- Jalisco → EXPO, CRR
- Norte → OGAS, TEPEYAC, SALTILLO

Responde SOLO JSON:
{
  "primaryGroup": "NOMBRE_EXACTO_GRUPO | null",
  "region": "norte | centro | occidente | centrosur | null",
  "confidence": 0.95
}`;

    try {
      const result = await this.llm.generate(prompt, {
        preferredProvider: 'gpt-3.5-turbo'
      });
      
      const jsonText = this.cleanJsonResponse(result.response);
      return JSON.parse(jsonText);
    } catch (error) {
      return { primaryGroup: null, region: null, confidence: 0 };
    }
  }

  // Procesar con IA cuando no entendemos
  async processWithAI(chatId, answer, state) {
    try {
      const analysisPrompt = `Usuario respondió: "${answer}" en onboarding.

Contexto: Primera pregunta sobre si supervisa grupo específico.

Determina intent en JSON:
{
  "userType": "supervisor | director | unknown",
  "skipOnboarding": false,
  "needsClarification": false,
  "suggestedResponse": "Respuesta a dar al usuario"
}`;

      const analysis = await this.llm.generate(analysisPrompt, {
        preferredProvider: 'gpt-3.5-turbo'
      });
      
      const data = JSON.parse(this.cleanJsonResponse(analysis.response));
      
      if (data.skipOnboarding) {
        return await this.finishOnboarding(chatId, state, true);
      }
      
      if (data.userType === 'supervisor') {
        state.data.userType = 'supervisor';
        state.step = 2;
      } else if (data.userType === 'director') {
        state.data.userType = 'director'; 
        state.step = 3;
      }
      
      return data.suggestedResponse || "No entendí bien. Intenta: 'si', 'múltiples' o 'saltar'";
      
    } catch (error) {
      return await this.finishOnboarding(chatId, state, true);
    }
  }

  // Mostrar grupos por región si no se detectó automáticamente
  showGroupsByRegion(chatId, answer, state) {
    // Intentar detectar región del input
    const lowerAnswer = answer.toLowerCase();
    let detectedRegion = null;
    
    if (lowerAnswer.includes('norte') || lowerAnswer.includes('monterrey') || lowerAnswer.includes('saltillo')) {
      detectedRegion = 'norte';
    } else if (lowerAnswer.includes('queretaro') || lowerAnswer.includes('querétaro') || lowerAnswer.includes('centro')) {
      detectedRegion = 'centro';
    } else if (lowerAnswer.includes('jalisco') || lowerAnswer.includes('occidente') || lowerAnswer.includes('guadalajara')) {
      detectedRegion = 'occidente';
    }
    
    if (detectedRegion && this.regionGroups[detectedRegion]) {
      const groups = this.regionGroups[detectedRegion];
      return `🌎 **Grupos región ${detectedRegion.toUpperCase()}:**

${groups.map((g, i) => `${i+1}️⃣ ${g}`).join('\n')}

_Escribe el número o nombre del grupo_`;
    }
    
    // Si no detecta región, terminar onboarding
    return this.finishOnboarding(chatId, state, true);
  }

  // Detectar intereses del usuario
  detectInterests(answer) {
    const lowerAnswer = answer.toLowerCase();
    const interests = [];
    
    if (lowerAnswer.includes('alert') || lowerAnswer.includes('problema')) {
      interests.push('alerts');
    }
    if (lowerAnswer.includes('report') || lowerAnswer.includes('ranking') || lowerAnswer.includes('comparativ')) {
      interests.push('reports');
    }
    if (lowerAnswer.includes('análisis') || lowerAnswer.includes('analysis') || lowerAnswer.includes('deep')) {
      interests.push('analysis');
    }
    if (lowerAnswer.includes('métrica') || lowerAnswer.includes('calificacion') || lowerAnswer.includes('areas')) {
      interests.push('metrics');
    }
    if (lowerAnswer.includes('evolución') || lowerAnswer.includes('evolution') || lowerAnswer.includes('tendencia')) {
      interests.push('evolution');
    }
    if (lowerAnswer.includes('todo') || lowerAnswer.includes('completo') || lowerAnswer.includes('all')) {
      interests.push('all');
    }
    
    return interests.length > 0 ? interests : ['general'];
  }

  // Finalizar onboarding
  async finishOnboarding(chatId, state, skipped = false) {
    this.onboardingStates.delete(chatId);
    
    if (skipped) {
      return `⏭️ **¡Perfecto!** Sin problema.

🤖 **Ana se adaptará a ti automáticamente** mientras la uses.

🚀 **Empecemos!** Prueba:
• "Dame el ranking de grupos"
• "¿Cómo va Tepeyac este trimestre?"
• "Áreas críticas generales"

_Ana recordará tus preferencias_ 🧠`;
    }
    
    // Guardar perfil completo
    const profile = {
      userType: state.data.userType || 'general',
      primaryGroup: state.data.primaryGroup || null,
      region: state.data.region || null,
      interests: state.data.interests || ['general'],
      onboardingCompleted: true,
      setupDate: new Date()
    };
    
    // Actualizar contexto del usuario
    const conversation = this.contextManager.conversations.get(chatId) || {
      history: [],
      lastGroup: null,
      userProfile: {},
      lastUpdate: new Date()
    };
    
    conversation.userProfile = { ...conversation.userProfile, ...profile };
    this.contextManager.conversations.set(chatId, conversation);
    
    let welcomeMessage = `✅ **¡Setup completado!**\n\n`;
    
    if (profile.userType === 'supervisor' && profile.primaryGroup) {
      welcomeMessage += `🏢 **Tu grupo:** ${profile.primaryGroup}\n`;
      welcomeMessage += `🎯 **Ana enfocará en ${profile.primaryGroup} automáticamente**\n\n`;
      welcomeMessage += `🚀 **Prueba:**\n• "¿Cómo vamos?"\n• "Áreas críticas"\n• "Mis sucursales"\n\n`;
    } else if (profile.userType === 'director') {
      welcomeMessage += `👑 **Perfil:** Director Multi-Grupo\n`;
      welcomeMessage += `📊 **Ana te dará comparativos y rankings**\n\n`;
      welcomeMessage += `🚀 **Prueba:**\n• "Ranking general"\n• "¿Qué grupos necesitan atención?"\n• "Evolución trimestral"\n\n`;
    }
    
    welcomeMessage += `🧠 _Ana aprende de tus consultas y mejora automáticamente_`;
    
    return welcomeMessage;
  }

  // Verificar si necesita actualización de perfil
  async checkProfileUpdate(chatId, context) {
    if (!context.userProfile.onboardingCompleted) return null;
    
    // Analizar patrones de uso
    const recentGroups = context.history.slice(-10)
      .map(h => h.detectedGroup)
      .filter(g => g)
      .reduce((acc, group) => {
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {});
    
    const mostUsedGroup = Object.keys(recentGroups)
      .sort((a, b) => recentGroups[b] - recentGroups[a])[0];
    
    // Si cambió de grupo principal significativamente
    if (mostUsedGroup && 
        mostUsedGroup !== context.userProfile.primaryGroup && 
        recentGroups[mostUsedGroup] > 5) {
      
      return `🔍 **Ana aprendió algo nuevo:**

He notado que preguntas mucho sobre **${mostUsedGroup}** últimamente.

¿Te configuro como tu nuevo grupo principal?

✅ **Sí** - ${mostUsedGroup} es mi enfoque ahora
📋 **No** - Mantener configuración actual
🔄 **Ambos** - ${context.userProfile.primaryGroup} y ${mostUsedGroup}

_Esto me ayuda a darte mejores respuestas automáticamente_`;
    }
    
    return null;
  }

  // Helpers
  isInOnboarding(chatId) {
    return this.onboardingStates.has(chatId);
  }
  
  cleanJsonResponse(response) {
    let jsonText = response.trim();
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }
    return jsonText;
  }

  // Estadísticas del sistema
  getOnboardingStats() {
    return {
      activeOnboardings: this.onboardingStates.size,
      totalGroups: this.allGroups.length,
      regionGroups: Object.keys(this.regionGroups).length
    };
  }
}

module.exports = UserOnboardingSystem;