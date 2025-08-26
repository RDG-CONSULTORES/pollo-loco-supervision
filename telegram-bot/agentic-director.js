// AGENTIC DIRECTOR - Coordinador Inteligente de Conversaciones
const { Pool } = require('pg');

class AgenticDirector {
  constructor(pool, knowledgeBase, intelligentSystem) {
    this.pool = pool;
    this.knowledgeBase = knowledgeBase;
    this.intelligentSystem = intelligentSystem;
    
    // MEMORY CONVERSACIONAL
    this.conversationMemory = new Map();
    
    // PERSONALITY ENGINE
    this.personality = {
      name: "Ana",
      role: "Tu analista experta de El Pollo Loco",
      tone: "amigable_profesional",
      expertise: "supervision_operativa",
      language: "español_mexicano"
    };
  }

  async processUserQuestion(question, chatId) {
    console.log(`🧠 AGENTE DIRECTOR procesando: "${question}"`);
    
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
    
    return {
      type: 'general_inquiry',
      context: 'needs_clarification'
    };
  }
  
  extractGrupoName(text) {
    const grupos = ['TEPEYAC', 'OGAS', 'TEC', 'EXPO', 'PLOG QUERETARO', 'GRUPO MATAMOROS'];
    for (const grupo of grupos) {
      if (text.includes(grupo.toLowerCase()) || text.includes(grupo)) {
        return grupo;
      }
    }
    // Detecciones específicas
    if (text.includes('tepeyac')) return 'TEPEYAC';
    if (text.includes('ogas')) return 'OGAS';
    if (text.includes('tec')) return 'TEC';
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

  async generateNaturalResponse(intent, data, originalQuestion) {
    switch (intent.type) {
      case 'sucursales_by_grupo':
        return this.generateSucursalesResponse(data, originalQuestion);
        
      case 'areas_oportunidad':
        return this.generateOpportunidadesResponse(data);
        
      case 'ranking_grupos':
        return this.generateRankingResponse(data);
        
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

  generateHelpResponse(originalQuestion) {
    return `🤔 **¡Hola! Soy Ana, tu analista experta de El Pollo Loco**

No estoy segura de entender exactamente lo que necesitas con: "${originalQuestion}"

**¿Te refieres a algo como esto?** 
• "¿Cuáles son las sucursales de TEPEYAC y cómo han evolucionado?"
• "¿Qué oportunidades de mejora tiene OGAS?"  
• "¿Dame el top 5 de grupos este trimestre?"

¡Pregúntame lo que necesites! Conozco todos los grupos, sucursales, y su desempeño 😊`;
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
      success: true
    });
    
    // Mantener solo las últimas 10 interacciones
    if (conversation.length > 10) {
      conversation.shift();
    }
    
    console.log(`💾 Memoria guardada para chat ${chatId}: ${conversation.length} interacciones`);
  }
}

module.exports = AgenticDirector;