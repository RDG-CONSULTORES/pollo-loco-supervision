// AGENTIC DIRECTOR - Coordinador Inteligente de Conversaciones
const { Pool } = require('pg');
const UltraIntelligenceEngine = require('./ultra-intelligence-engine');
const DynamicQueryEngine = require('./dynamic-query-engine');

class AgenticDirector {
  constructor(pool, knowledgeBase, intelligentSystem) {
    this.pool = pool;
    this.knowledgeBase = knowledgeBase;
    this.intelligentSystem = intelligentSystem;
    
    // ULTRA INTELLIGENCE SYSTEM - Ana 120% knowledge
    this.ultraIntelligence = new UltraIntelligenceEngine(pool);
    this.dynamicQuery = new DynamicQueryEngine(pool, this.ultraIntelligence);
    this.isTraining = false;
    this.trainingComplete = false;
    
    // MEMORY CONVERSACIONAL
    this.conversationMemory = new Map();
    
    // PERSONALITY ENGINE - ENHANCED
    this.personality = {
      name: "Ana",
      role: "Tu analista experta ultra-inteligente de El Pollo Loco",
      tone: "amigable_profesional",
      expertise: "supervision_operativa",
      language: "español_mexicano",
      intelligence_level: "ultra_advanced",
      database_knowledge: "120%",
      capabilities: [
        "análisis_dinámico_completo",
        "tendencias_predictivas", 
        "recomendaciones_cas_inteligentes",
        "consultas_ilimitadas_bd",
        "contexto_empresarial_completo"
      ]
    };
    
    // Initialize ultra intelligence on startup
    this.initializeUltraIntelligence();
  }

  async initializeUltraIntelligence() {
    if (this.trainingComplete) return;
    
    try {
      console.log('🚀 INICIANDO SISTEMA ULTRA INTELIGENTE ANA...');
      this.isTraining = true;
      
      // Train Ana with complete database knowledge
      await this.ultraIntelligence.executeCompleteTraining();
      
      this.trainingComplete = true;
      this.isTraining = false;
      
      console.log('✅ ANA ULTRA INTELIGENTE LISTA - 120% conocimiento de la base de datos');
    } catch (error) {
      console.error('❌ Error inicializando ultra inteligencia:', error);
      this.isTraining = false;
    }
  }

  async processUserQuestion(question, chatId) {
    console.log(`🧠 ANA ULTRA INTELIGENTE procesando: "${question}"`);
    
    // Wait for training if still in progress
    if (this.isTraining) {
      return "🧠 Un momento... Ana se está entrenando para conocer al 120% toda la base de datos. Esto solo toma unos segundos...";
    }
    
    // Use DYNAMIC QUERY ENGINE for unlimited database queries
    try {
      // 1. ANÁLISIS ULTRA INTELIGENTE con Dynamic Query Engine
      console.log('🎯 Usando Dynamic Query Engine para consulta ilimitada');
      const dynamicResponse = await this.dynamicQuery.processDynamicQuery(question, { chatId });
      
      // 2. GUARDAR EN MEMORIA
      this.saveConversationMemory(chatId, question, dynamicResponse, { type: 'dynamic_query' });
      
      return dynamicResponse;
      
    } catch (error) {
      console.error('❌ Error en consulta dinámica, usando fallback:', error);
      
      // FALLBACK: Use original AGENTIC system
      return await this.processFallbackQuestion(question, chatId);
    }
  }
  
  async processFallbackQuestion(question, chatId) {
    console.log(`🔄 FALLBACK AGENTIC procesando: "${question}"`);
    
    // 1. ANALIZAR INTENT REAL
    const realIntent = await this.analyzeRealIntent(question);
    console.log(`🎯 Intent Real Detectado:`, realIntent);
    
    // 2. OBTENER DATOS ESPECÍFICOS
    const specificData = await this.getSpecificData(realIntent);
    
    // 3. GENERAR RESPUESTA NATURAL
    const naturalResponse = await this.generateNaturalResponse(realIntent, specificData, question);
    
    // 4. GUARDAR EN MEMORIA
    this.saveConversationMemory(chatId, question, naturalResponse, realIntent);
    
    return naturalResponse;
  }

  async analyzeRealIntent(question) {
    const lower = question.toLowerCase();
    
    // DETECCIÓN ESPECÍFICA DE SUCURSALES POR GRUPO
    if (lower.includes('sucursales') && (lower.includes('tepeyac') || lower.includes('ogas') || lower.includes('tec'))) {
      const grupoDetected = this.extractGrupoName(lower);
      return {
        type: 'sucursales_by_grupo',
        grupo: grupoDetected,
        needs_evolution: lower.includes('evolución') || lower.includes('evolucion') || lower.includes('trimestre'),
        wants_specific: true,
        context: 'user_wants_branch_details'
      };
    }
    
    // DETECCIÓN DE ÁREAS DE OPORTUNIDAD
    if (lower.includes('oportunidad') || lower.includes('areas') || lower.includes('mejorar')) {
      const grupoDetected = this.extractGrupoName(lower);
      return {
        type: 'areas_oportunidad',
        grupo: grupoDetected,
        wants_specific: true,
        context: 'improvement_focus'
      };
    }
    
    // DETECCIÓN DE RANKINGS
    if (lower.includes('top') || lower.includes('ranking') || lower.includes('mejor')) {
      const quantity = this.extractQuantity(lower);
      return {
        type: 'ranking_grupos',
        quantity: quantity,
        wants_comparison: true,
        context: 'performance_comparison'
      };
    }
    
    // DETECCIÓN DE ESTADO/UBICACIÓN
    if (lower.includes('estado') || lower.includes('donde esta') || lower.includes('ubicación') || lower.includes('ubicacion')) {
      const grupoDetected = this.extractGrupoName(lower);
      return {
        type: 'grupo_location',
        grupo: grupoDetected,
        wants_location: true,
        context: 'location_inquiry'
      };
    }
    
    // DETECCIÓN DE CALIFICACIONES/DESEMPEÑO
    if (lower.includes('calificacion') || lower.includes('calificación') || lower.includes('desempeño') || lower.includes('desempeno')) {
      const grupoDetected = this.extractGrupoName(lower);
      return {
        type: 'grupo_performance',
        grupo: grupoDetected,
        wants_scores: true,
        context: 'performance_inquiry'
      };
    }
    
    return {
      type: 'general_inquiry',
      context: 'needs_clarification'
    };
  }
  
  extractGrupoName(text) {
    // TODOS LOS 20 GRUPOS OPERATIVOS de la base de conocimiento
    const grupos = [
      'OGAS', 'PLOG QUERETARO', 'EPL SO', 'TEC', 'TEPEYAC', 'GRUPO MATAMOROS',
      'PLOG LAGUNA', 'EFM', 'RAP', 'GRUPO RIO BRAVO', 'PLOG NUEVO LEON',
      'GRUPO PIEDRAS NEGRAS', 'GRUPO CANTERA ROSA (MORELIA)', 'EXPO',
      'OCHTER TAMPICO', 'GRUPO SABINAS HIDALGO', 'GRUPO CENTRITO', 'CRR',
      'GRUPO NUEVO LAREDO (RUELAS)', 'GRUPO SALTILLO'
    ];
    
    // Búsqueda exacta primero
    for (const grupo of grupos) {
      if (text.includes(grupo.toLowerCase()) || text.includes(grupo)) {
        return grupo;
      }
    }
    
    // Detecciones específicas por palabras clave
    const lower = text.toLowerCase();
    
    // Grupos con nombres únicos
    if (lower.includes('ogas')) return 'OGAS';
    if (lower.includes('tepeyac')) return 'TEPEYAC';
    if (lower.includes('tec') && !lower.includes('ochter')) return 'TEC';
    if (lower.includes('expo')) return 'EXPO';
    if (lower.includes('efm')) return 'EFM';
    if (lower.includes('rap') && !lower.includes('rap') === false) return 'RAP';
    if (lower.includes('crr')) return 'CRR';
    
    // Grupos con "PLOG"
    if (lower.includes('queretaro') || lower.includes('querétaro')) return 'PLOG QUERETARO';
    if (lower.includes('laguna')) return 'PLOG LAGUNA';
    if (lower.includes('nuevo leon') || lower.includes('nuevo león')) return 'PLOG NUEVO LEON';
    
    // Grupos con "GRUPO"
    if (lower.includes('matamoros') && lower.includes('grupo')) return 'GRUPO MATAMOROS';
    if (lower.includes('saltillo')) return 'GRUPO SALTILLO';
    if (lower.includes('centrito')) return 'GRUPO CENTRITO';
    if (lower.includes('rio bravo')) return 'GRUPO RIO BRAVO';
    if (lower.includes('piedras negras')) return 'GRUPO PIEDRAS NEGRAS';
    if (lower.includes('nuevo laredo') || lower.includes('ruelas')) return 'GRUPO NUEVO LAREDO (RUELAS)';
    if (lower.includes('sabinas hidalgo')) return 'GRUPO SABINAS HIDALGO';
    if (lower.includes('cantera rosa') || lower.includes('morelia')) return 'GRUPO CANTERA ROSA (MORELIA)';
    
    // Grupos con nombres únicos adicionales
    if (lower.includes('ochter') || lower.includes('tampico')) return 'OCHTER TAMPICO';
    if (lower.includes('epl so')) return 'EPL SO';
    
    // Fallback - palabras sueltas comunes
    if (lower.includes('matamoros') && !lower.includes('grupo')) return 'GRUPO MATAMOROS';
    
    console.log(`⚠️ No se detectó grupo en: "${text}"`);
    return null;
  }
  
  extractQuantity(text) {
    const match = text.match(/top\s*(\d+)|(\d+)\s*mejores/);
    if (match) return parseInt(match[1] || match[2]);
    return 5; // Default
  }

  async getSpecificData(intent) {
    switch (intent.type) {
      case 'sucursales_by_grupo':
        return await this.getSucursalesByGrupo(intent.grupo, intent.needs_evolution);
        
      case 'areas_oportunidad':
        return await this.getAreasOportunidad(intent.grupo);
        
      case 'ranking_grupos':
        return await this.getRankingData(intent.quantity);
        
      case 'grupo_location':
        return await this.getGrupoLocation(intent.grupo);
        
      case 'grupo_performance':
        return await this.getGrupoPerformance(intent.grupo);
        
      default:
        return { message: 'Necesito más contexto para ayudarte mejor' };
    }
  }

  async getSucursalesByGrupo(grupoName, needsEvolution) {
    try {
      console.log(`🏪 Buscando sucursales del grupo: ${grupoName}`);
      
      const query = `
        SELECT DISTINCT 
          sucursal_clean,
          grupo_operativo,
          estado,
          DATE_TRUNC('quarter', fecha_supervision) as quarter,
          EXTRACT(QUARTER FROM fecha_supervision) as quarter_num,
          EXTRACT(YEAR FROM fecha_supervision) as year,
          COUNT(*) as supervisiones,
          AVG(porcentaje) as promedio
        FROM supervision_operativa_detalle
        WHERE UPPER(grupo_operativo) = UPPER($1)
          AND fecha_supervision >= '2025-01-01'
          AND porcentaje IS NOT NULL
        GROUP BY sucursal_clean, grupo_operativo, estado, quarter, quarter_num, year
        ORDER BY year, quarter_num, sucursal_clean;
      `;
      
      const result = await this.pool.query(query, [grupoName]);
      
      if (result.rows.length === 0) {
        return {
          found: false,
          grupo: grupoName,
          message: `No encontré datos de supervisión para el grupo ${grupoName} en 2025`
        };
      }
      
      // Organizar por sucursal y trimestre
      const sucursalesData = {};
      
      result.rows.forEach(row => {
        const sucursal = row.sucursal_clean;
        if (!sucursalesData[sucursal]) {
          sucursalesData[sucursal] = {
            nombre: sucursal,
            estado: row.estado,
            trimestres: {}
          };
        }
        
        const quarterKey = `Q${row.quarter_num}_${row.year}`;
        sucursalesData[sucursal].trimestres[quarterKey] = {
          quarter: `Q${row.quarter_num}`,
          year: row.year,
          supervisiones: parseInt(row.supervisiones),
          promedio: parseFloat(row.promedio).toFixed(2)
        };
      });
      
      return {
        found: true,
        grupo: grupoName,
        sucursales: Object.values(sucursalesData),
        total_sucursales: Object.keys(sucursalesData).length,
        needs_evolution: needsEvolution
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo sucursales:', error);
      return {
        found: false,
        error: error.message,
        grupo: grupoName
      };
    }
  }

  async getAreasOportunidad(grupoName) {
    return await this.intelligentSystem.getGroupOpportunities(grupoName, 'Q3', 5);
  }

  async getRankingData(quantity) {
    return await this.intelligentSystem.getTopGrupos('Q3', quantity);
  }

  async getGrupoLocation(grupoName) {
    if (!grupoName) {
      return { 
        found: false, 
        message: 'No especificaste qué grupo te interesa. ¿Cuál grupo buscas?' 
      };
    }

    try {
      console.log(`📍 Buscando ubicación del grupo: ${grupoName}`);
      
      const query = `
        SELECT DISTINCT 
          grupo_operativo,
          estado,
          COUNT(DISTINCT sucursal_clean) as sucursales_count,
          AVG(porcentaje) as promedio_general
        FROM supervision_operativa_detalle
        WHERE UPPER(grupo_operativo) = UPPER($1)
          AND fecha_supervision >= '2025-01-01'
          AND porcentaje IS NOT NULL
        GROUP BY grupo_operativo, estado
        ORDER BY estado;
      `;
      
      const result = await this.pool.query(query, [grupoName]);
      
      if (result.rows.length === 0) {
        return {
          found: false,
          grupo: grupoName,
          message: `No encontré datos de ubicación para el grupo ${grupoName}`
        };
      }
      
      return {
        found: true,
        grupo: grupoName,
        estados: result.rows.map(row => ({
          estado: row.estado,
          sucursales: parseInt(row.sucursales_count),
          promedio: parseFloat(row.promedio_general).toFixed(2)
        })),
        total_estados: result.rows.length
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      return {
        found: false,
        error: error.message,
        grupo: grupoName
      };
    }
  }

  async getGrupoPerformance(grupoName) {
    if (!grupoName) {
      return { 
        found: false, 
        message: 'No especificaste qué grupo te interesa. ¿Cuál grupo quieres analizar?' 
      };
    }

    try {
      console.log(`📊 Analizando desempeño del grupo: ${grupoName}`);
      
      // Obtener datos de oportunidades (que incluye contexto de negocio)
      const opportunities = await this.intelligentSystem.getGroupOpportunities(grupoName, 'Q3', 3);
      
      // Obtener contexto de negocio
      const businessContext = this.knowledgeBase.getGrupoIntelligence(grupoName);
      
      return {
        found: true,
        grupo: grupoName,
        opportunities: opportunities.opportunities || [],
        businessContext: businessContext,
        performance_data: opportunities
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo desempeño:', error);
      return {
        found: false,
        error: error.message,
        grupo: grupoName
      };
    }
  }

  async generateNaturalResponse(intent, data, originalQuestion) {
    switch (intent.type) {
      case 'sucursales_by_grupo':
        return this.generateSucursalesResponse(data, originalQuestion);
        
      case 'areas_oportunidad':
        return this.generateOpportunidadesResponse(data);
        
      case 'ranking_grupos':
        return this.generateRankingResponse(data);
        
      case 'grupo_location':
        return this.generateLocationResponse(data, originalQuestion);
        
      case 'grupo_performance':
        return this.generatePerformanceResponse(data, originalQuestion);
        
      default:
        return this.generateHelpResponse(originalQuestion);
    }
  }

  generateSucursalesResponse(data, originalQuestion) {
    if (!data.found) {
      return `🤔 Disculpa, pero no pude encontrar datos específicos de supervisión para el grupo **${data.grupo}** en 2025.

¿Te refieres a algún otro grupo? Los que tengo con más datos son:
• OGAS (nuestro grupo estrella)
• TEPEYAC (grupo grande con buena cobertura) 
• TEC (rendimiento sólido)

¡Pregúntame por cualquiera de estos! 😊`;
    }

    let response = `🏪 **Sucursales del Grupo ${data.grupo.toUpperCase()}**\n\n`;
    response += `¡Perfecto! Te muestro las **${data.total_sucursales} sucursales** de ${data.grupo} con su evolución:\n\n`;
    
    data.sucursales.forEach((sucursal, index) => {
      response += `**${index + 1}. ${sucursal.nombre}** (${sucursal.estado})\n`;
      
      // Mostrar evolución por trimestre
      const quarters = ['Q1_2025', 'Q2_2025', 'Q3_2025'];
      const evolution = [];
      
      quarters.forEach(q => {
        if (sucursal.trimestres[q]) {
          const t = sucursal.trimestres[q];
          evolution.push(`${t.quarter}: ${t.promedio}% (${t.supervisiones} sup.)`);
        } else {
          evolution.push(`${q.substring(0,2)}: Sin datos`);
        }
      });
      
      response += `   ${evolution.join(' • ')}\n\n`;
    });
    
    response += `💡 **Mi análisis:** ${data.grupo} tiene una red de ${data.total_sucursales} sucursales activas. `;
    
    // Agregar insights específicos
    const conDatos = data.sucursales.filter(s => Object.keys(s.trimestres).length > 0).length;
    const sinDatos = data.total_sucursales - conDatos;
    
    if (sinDatos > 0) {
      response += `Noto que ${sinDatos} sucursales aún no tienen supervisiones en algunos trimestres - podríamos enfocar ahí las próximas evaluaciones.`;
    } else {
      response += `¡Excelente cobertura de supervisiones en toda la red!`;
    }
    
    response += `\n\n¿Te gustaría que analice alguna sucursal específica o comparemos el desempeño entre ellas? 🤔`;
    
    return response;
  }

  generateOpportunidadesResponse(data) {
    if (!data.opportunities || data.opportunities.length === 0) {
      return `🤔 No encontré áreas de oportunidad específicas para **${data.grupo}** en este período.

Esto podría significar que:
• El grupo está funcionando muy bien ✨
• No hay datos suficientes para el análisis
• Necesitamos revisar un trimestre diferente

¿Te gustaría que verifique otro período o grupo? 😊`;
    }

    let response = `🎯 **Oportunidades de Mejora para ${data.grupo.toUpperCase()}**\n\n`;
    response += `Como tu analista, identifiqué estas áreas donde ${data.grupo} puede brillar aún más:\n\n`;
    
    data.opportunities.forEach((opp, index) => {
      const emoji = index === 0 ? '🔴' : index === 1 ? '🟡' : '🟠';
      response += `${emoji} **${opp.area}**\n`;
      response += `   📊 Promedio actual: ${opp.promedio}%\n`;
      response += `   📈 Rango: ${opp.rango}\n`;
      response += `   📋 Basado en ${opp.evaluaciones} evaluaciones\n\n`;
    });
    
    const worst = data.opportunities[0];
    response += `💡 **Mi recomendación:** Enfocaría el primer esfuerzo en **${worst.area}** `;
    response += `porque con ${worst.promedio}% tiene el mayor potencial de mejora. `;
    response += `Con solo subir 5-10 puntos ahí, el impacto general será significativo.\n\n`;
    response += `¿Te ayudo a crear un plan de acción específico para estas áreas? 🚀`;
    
    return response;
  }

  generateRankingResponse(data) {
    if (!data.ranking || data.ranking.length === 0) {
      return `🤔 No pude obtener el ranking actual. ¡Déjame revisar la base de datos!

¿Podrías preguntarme en unos minutos? O si prefieres, puedo ayudarte con algo específico de algún grupo en particular 😊`;
    }

    let response = `🏆 **Top ${data.ranking.length} Grupos - Mi Ranking Actualizado**\n\n`;
    response += `¡Aquí tienes nuestros grupos estrella! Como tu analista, esto es lo que veo:\n\n`;
    
    data.ranking.forEach((grupo, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆';
      const trend = grupo.promedio >= 95 ? '🔥' : grupo.promedio >= 90 ? '✨' : grupo.promedio >= 85 ? '👍' : '⚠️';
      
      response += `${medal} **${grupo.grupo}** ${trend}\n`;
      response += `   📊 ${grupo.promedio}% promedio\n`;
      response += `   🏪 ${grupo.sucursales} sucursales evaluadas\n\n`;
    });
    
    const leader = data.ranking[0];
    const gap = parseFloat(leader.promedio) - parseFloat(data.ranking[1]?.promedio || 0);
    
    response += `💡 **Mi análisis rápido:**\n`;
    response += `• **${leader.grupo}** domina con ${gap.toFixed(1)} puntos de ventaja\n`;
    
    const excellent = data.ranking.filter(g => parseFloat(g.promedio) >= 95).length;
    const good = data.ranking.filter(g => parseFloat(g.promedio) >= 85 && parseFloat(g.promedio) < 95).length;
    
    response += `• ${excellent} grupos en nivel excelente (95%+)\n`;
    response += `• ${good} grupos en nivel bueno (85-94%)\n\n`;
    response += `¿Te interesa que profundice en algún grupo específico? 🤔`;
    
    return response;
  }

  generateLocationResponse(data, originalQuestion) {
    if (!data.found) {
      return `🤔 No pude encontrar información de ubicación para **${data.grupo}**.

Esto podría ser porque:
• El nombre no está exactamente como está en la base de datos
• No hay datos de supervisión recientes para este grupo
• ¿Te refieres a otro grupo similar?

Los grupos que tengo con más información son: OGAS, TEPEYAC, TEC, EXPO, EFM, CRR, GRUPO SALTILLO 😊`;
    }

    let response = `📍 **Ubicación del Grupo ${data.grupo.toUpperCase()}**\n\n`;
    response += `¡Perfecto! Te muestro dónde opera **${data.grupo}**:\n\n`;
    
    data.estados.forEach((estado, index) => {
      response += `**${index + 1}. ${estado.estado}**\n`;
      response += `   🏪 ${estado.sucursales} sucursales\n`;
      response += `   📊 Promedio: ${estado.promedio}%\n\n`;
    });
    
    response += `💡 **Mi análisis:** ${data.grupo} opera en ${data.total_estados} estado${data.total_estados > 1 ? 's' : ''} `;
    
    if (data.total_estados === 1) {
      response += `concentrando toda su operación en ${data.estados[0].estado}.`;
    } else {
      const mejorEstado = data.estados.reduce((prev, current) => 
        parseFloat(prev.promedio) > parseFloat(current.promedio) ? prev : current
      );
      response += `siendo ${mejorEstado.estado} su mejor desempeño con ${mejorEstado.promedio}%.`;
    }
    
    response += `\n\n¿Te gustaría que analice el desempeño específico de algún estado o veamos qué sucursales tiene ${data.grupo}? 🤔`;
    
    return response;
  }

  generatePerformanceResponse(data, originalQuestion) {
    if (!data.found) {
      return `🤔 No pude obtener el análisis de desempeño para **${data.grupo}**.

¿Te refieres a alguno de estos grupos?
• OGAS (nuestro líder)
• TEPEYAC (grupo grande)
• TEC (rendimiento sólido)
• EXPO, EFM, CRR, GRUPO SALTILLO

¡Pregúntame por cualquiera! 😊`;
    }

    let response = `📊 **Desempeño del Grupo ${data.grupo.toUpperCase()}**\n\n`;
    
    if (data.businessContext) {
      const ctx = data.businessContext;
      response += `🎯 **Posición en el ranking:** #${ctx.position_in_ranking} de 20 grupos\n`;
      response += `⭐ **Percentil:** ${ctx.percentile} (${ctx.status.toUpperCase()})\n`;
      response += `📈 **Promedio general:** ${ctx.promedio}%\n`;
      response += `🏢 **Red:** ${ctx.sucursales} sucursales, ${ctx.supervisiones} supervisiones\n\n`;
      
      response += `💼 **Contexto empresarial:** ${ctx.performance_context}\n\n`;
    }
    
    if (data.opportunities && data.opportunities.length > 0) {
      response += `🎯 **Sus principales oportunidades:**\n`;
      data.opportunities.slice(0, 3).forEach((opp, index) => {
        const emoji = index === 0 ? '🔴' : index === 1 ? '🟡' : '🟠';
        response += `${emoji} **${opp.area}**: ${opp.promedio}%\n`;
      });
      response += `\n`;
    }
    
    if (data.businessContext) {
      response += `💡 **Mi recomendación:** ${data.businessContext.recommendation}\n\n`;
    }
    
    response += `¿Te interesa que profundice en algún área específica o comparemos ${data.grupo} con otros grupos? 🚀`;
    
    return response;
  }

  generateHelpResponse(originalQuestion) {
    return `🤔 **¡Hola! Soy Ana, tu analista experta de El Pollo Loco**

No estoy segura de entender exactamente lo que necesitas con: "${originalQuestion}"

**¿Te refieres a algo como esto?** 
• "¿Cuáles son las sucursales de TEPEYAC y cómo han evolucionado?"
• "¿Qué oportunidades de mejora tiene OGAS?"  
• "¿Dame el top 5 de grupos este trimestre?"
• "¿El grupo EFM dónde está ubicado?"
• "¿Cuáles son las calificaciones del grupo CRR?"

**Grupos que conozco muy bien:**
OGAS, TEPEYAC, TEC, EXPO, EFM, CRR, GRUPO SALTILLO, PLOG QUERETARO, RAP, y muchos más...

¡Pregúntame lo que necesites! 😊`;
  }

  // ULTRA INTELLIGENCE STATUS CHECK
  getIntelligenceStatus() {
    return {
      training_complete: this.trainingComplete,
      is_training: this.isTraining,
      intelligence_level: this.personality.intelligence_level,
      database_knowledge: this.personality.database_knowledge,
      last_training: this.ultraIntelligence.lastTrainingUpdate,
      dynamic_queries_enabled: true,
      capabilities: this.personality.capabilities
    };
  }
  
  // FORCE RETRAINING (if needed)
  async forceRetraining() {
    console.log('🔄 FORZANDO REENTRENAMIENTO DE ANA...');
    this.trainingComplete = false;
    await this.initializeUltraIntelligence();
    return this.getIntelligenceStatus();
  }

  saveConversationMemory(chatId, question, response, intent) {
    if (!this.conversationMemory.has(chatId)) {
      this.conversationMemory.set(chatId, []);
    }
    
    const conversation = this.conversationMemory.get(chatId);
    conversation.push({
      timestamp: new Date(),
      question: question,
      response: response,
      intent: intent,
      success: true,
      intelligence_used: this.trainingComplete ? 'ultra_intelligence' : 'fallback_agentic'
    });
    
    // Mantener solo las últimas 15 interacciones (más memoria para ultra inteligencia)
    if (conversation.length > 15) {
      conversation.shift();
    }
    
    console.log(`💾 Memoria ANA guardada para chat ${chatId}: ${conversation.length} interacciones (Ultra: ${this.trainingComplete})`);
  }
}

module.exports = AgenticDirector;