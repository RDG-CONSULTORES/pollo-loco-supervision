// =========================================
// INTELLIGENT RESPONSE GENERATOR - GENERADOR DE RESPUESTAS ULTRA INTELIGENTES
// Usa OpenAI para analizar datos y generar insights empresariales adaptativos
// =========================================

class IntelligentResponseGenerator {
  constructor(llmManager, pool) {
    this.llm = llmManager;
    this.pool = pool;
    
    // Templates de prompts optimizados
    this.promptTemplates = {
      dataAnalysis: this.getDataAnalysisTemplate(),
      insightGeneration: this.getInsightGenerationTemplate(),
      recommendation: this.getRecommendationTemplate(),
      adaptive: this.getAdaptiveTemplate()
    };
    
    console.log('🎯 Intelligent Response Generator inicializado');
  }

  // MÉTODO PRINCIPAL: Generar respuesta inteligente adaptativa
  async generateIntelligentResponse(contextData, queryResults, conversationContext) {
    try {
      console.log(`🧠 Generando respuesta inteligente para ${contextData.queryType} - Grupo: ${contextData.finalGroup}`);
      
      // Fase 1: Analizar los datos con IA
      const dataAnalysis = await this.analyzeDataWithAI(queryResults, contextData);
      
      // Fase 2: Generar insights empresariales
      const businessInsights = await this.generateBusinessInsights(dataAnalysis, contextData);
      
      // Fase 3: Crear respuesta adaptativa final
      const adaptiveResponse = await this.createAdaptiveResponse({
        contextData,
        dataAnalysis,
        businessInsights,
        conversationContext,
        queryResults
      });
      
      return adaptiveResponse;
      
    } catch (error) {
      console.error('❌ Error generando respuesta inteligente:', error);
      return this.generateFallbackResponse(contextData, queryResults);
    }
  }

  // Analizar datos con OpenAI
  async analyzeDataWithAI(queryResults, contextData) {
    const analysisPrompt = `Eres Ana, analista experta de El Pollo Loco. Analiza estos datos REALES:

CONTEXTO:
- Grupo: ${contextData.finalGroup}
- Tipo de consulta: ${contextData.queryType}
- Trimestre: Q${contextData.quarter} 2025

DATOS OBTENIDOS:
${JSON.stringify(queryResults, null, 2)}

ANÁLISIS REQUERIDO:
1. Patrones significativos en los datos
2. Tendencias importantes (positivas/negativas)  
3. Comparación con benchmarks (95% excelente, 85% objetivo, <75% crítico)
4. Identificación de outliers o anomalías
5. Correlaciones entre variables

Responde en JSON:
{
  "summary": "Resumen ejecutivo en 1-2 líneas",
  "keyMetrics": {
    "bestPerformer": "Nombre del mejor elemento",
    "worstPerformer": "Nombre del peor elemento", 
    "averageScore": 85.5,
    "totalItems": 10
  },
  "trends": [
    {
      "type": "positive | negative | neutral",
      "description": "Descripción del trend",
      "impact": "alto | medio | bajo"
    }
  ],
  "anomalies": ["Lista de anomalías detectadas"],
  "businessImplications": "Qué significa esto para el negocio"
}`;

    try {
      const analysis = await this.llm.generate(analysisPrompt, {
        preferredProvider: 'gpt-4-turbo' // Usar el mejor modelo para análisis
      });
      
      return JSON.parse(this.cleanJsonResponse(analysis.response));
      
    } catch (error) {
      console.error('❌ Error en análisis de datos:', error);
      return this.getFallbackAnalysis(queryResults);
    }
  }

  // Generar insights empresariales con IA
  async generateBusinessInsights(dataAnalysis, contextData) {
    const insightPrompt = `Basado en este análisis de datos, genera insights empresariales específicos para El Pollo Loco:

ANÁLISIS PREVIO:
${JSON.stringify(dataAnalysis, null, 2)}

CONTEXTO EMPRESARIAL:
- Grupo operativo: ${contextData.finalGroup}
- Industria: Fast food / Pollo
- Métrica objetivo: 85%+ operacional
- Período: Q${contextData.quarter} 2025

GENERA INSIGHTS ESPECÍFICOS:
1. Oportunidades de mejora inmediatas
2. Riesgos operacionales identificados
3. Best practices a replicar
4. Recomendaciones de acción priorizadas
5. Predicciones para próximo trimestre

Responde en JSON:
{
  "opportunities": [
    {
      "area": "Área específica",
      "impact": "alto | medio | bajo",
      "effort": "bajo | medio | alto", 
      "description": "Descripción de la oportunidad",
      "expectedGain": "Ganancia esperada"
    }
  ],
  "risks": [
    {
      "risk": "Descripción del riesgo",
      "probability": "alta | media | baja",
      "impact": "crítico | alto | medio",
      "mitigation": "Cómo mitigarlo"
    }
  ],
  "bestPractices": [
    {
      "practice": "Práctica exitosa identificada",
      "location": "Dónde se aplica",
      "replicability": "Fácil de replicar a otros grupos"
    }
  ],
  "recommendations": [
    {
      "priority": "urgente | alta | media",
      "action": "Acción específica recomendada", 
      "timeline": "inmediato | 1-2 semanas | 1 mes",
      "owner": "Quién debería ejecutarlo"
    }
  ],
  "predictions": {
    "nextQuarter": "Predicción para Q4",
    "confidence": "alta | media | baja",
    "factors": ["Factores que influyen en la predicción"]
  }
}`;

    try {
      const insights = await this.llm.generate(insightPrompt, {
        preferredProvider: 'gpt-4-turbo'
      });
      
      return JSON.parse(this.cleanJsonResponse(insights.response));
      
    } catch (error) {
      console.error('❌ Error generando insights:', error);
      return this.getFallbackInsights();
    }
  }

  // Crear respuesta adaptativa final
  async createAdaptiveResponse({ contextData, dataAnalysis, businessInsights, conversationContext, queryResults }) {
    const responsePrompt = `Genera una respuesta perfecta estilo Ana (Falcon AI) usando toda esta inteligencia:

CONTEXTO DE USUARIO:
- Experiencia: ${conversationContext.userProfile?.expertise || 'basic'}
- Estilo preferido: ${conversationContext.userProfile?.responsePreference || 'thorough'}
- Es seguimiento: ${contextData.isFollowUp}
- Interacciones previas: ${conversationContext.totalInteractions || 0}

ANÁLISIS DE DATOS:
${JSON.stringify(dataAnalysis, null, 2)}

INSIGHTS EMPRESARIALES:
${JSON.stringify(businessInsights, null, 2)}

CONTEXTO ORIGINAL:
- Grupo: ${contextData.finalGroup}
- Consulta: ${contextData.queryType}
- Solicitudes específicas: ${contextData.specificRequests.join(', ')}

ESTILO FALCON AI REQUERIDO:
- Emoji inicial apropiado
- Título descriptivo
- Bullets con datos clave (• símbolo)
- Métricas específicas con porcentajes
- Status/iconos visuales (🏆✅⚠️🔥)
- Sección de recomendaciones si aplica
- Comandos relacionados al final (🎯)
- Máximo 20 líneas total

GENERA LA RESPUESTA FINAL:`;

    try {
      const response = await this.llm.generate(responsePrompt, {
        preferredProvider: 'gpt-4-turbo'
      });
      
      return this.formatFalconResponse(response.response);
      
    } catch (error) {
      console.error('❌ Error generando respuesta adaptativa:', error);
      return this.generateFallbackResponse(contextData, queryResults);
    }
  }

  // Formatear respuesta estilo Falcon
  formatFalconResponse(response) {
    let formatted = response.trim();
    
    // Asegurar que empiece con emoji
    if (!/^[🔥🏆📊🎯⚠️🚨📈📉✅❌🏢💡🔍]/.test(formatted)) {
      formatted = '📊 ' + formatted;
    }
    
    // Limpiar markdown
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '$1');
    formatted = formatted.replace(/\*(.*?)\*/g, '$1');
    formatted = formatted.replace(/```[^`]*```/g, '');
    
    // Asegurar comandos al final si no los tiene
    if (!formatted.includes('🎯')) {
      formatted += '\n\n🎯 /ranking | /areas_criticas | /evolution';
    }
    
    return formatted;
  }

  // Generar query inteligente con OpenAI
  async generateIntelligentQuery(contextData, businessRequirements) {
    const queryPrompt = `Genera un query SQL optimizado para PostgreSQL basado en estos requerimientos:

CONTEXTO:
- Tabla principal: supervision_operativa_detalle
- Columnas: location_name, grupo_operativo, area_evaluacion, porcentaje, fecha_supervision, submission_id
- Grupo objetivo: ${contextData.finalGroup}
- Trimestre: Q${contextData.quarter} 2025
- Tipo de consulta: ${contextData.queryType}

ESQUEMA DE TABLA:
- location_name VARCHAR(255) -- Nombre de sucursal
- grupo_operativo VARCHAR(255) -- Grupo operativo (20 grupos)  
- area_evaluacion VARCHAR(255) -- Área evaluada (~30 áreas)
- porcentaje DECIMAL(5,2) -- Porcentaje obtenido (0-100)
- fecha_supervision DATE -- Fecha de supervisión
- submission_id VARCHAR(255) -- ID único de supervisión

REQUERIMIENTOS ESPECÍFICOS:
${JSON.stringify(businessRequirements, null, 2)}

REGLAS DEL QUERY:
1. Usar EXTRACT(QUARTER FROM fecha_supervision) para trimestres
2. Usar EXTRACT(YEAR FROM fecha_supervision) = 2025
3. Filtrar porcentaje IS NOT NULL
4. Usar ROUND(AVG(porcentaje), 2) para promedios
5. Incluir COUNT(*) como evaluaciones cuando sea relevante
6. Usar GROUP BY apropiado
7. ORDER BY relevante para el contexto

GENERA SOLO EL QUERY SQL:`;

    try {
      const queryResult = await this.llm.generate(queryPrompt, {
        preferredProvider: 'gpt-3.5-turbo' // Más rápido para queries
      });
      
      return this.cleanSqlQuery(queryResult.response);
      
    } catch (error) {
      console.error('❌ Error generando query:', error);
      return null;
    }
  }

  // Limpiar query SQL generado
  cleanSqlQuery(sqlText) {
    let query = sqlText.trim();
    
    // Remover markdown
    if (query.includes('```sql')) {
      query = query.split('```sql')[1].split('```')[0].trim();
    } else if (query.includes('```')) {
      query = query.split('```')[1].split('```')[0].trim();
    }
    
    // Remover comentarios explicativos
    query = query.replace(/--.*$/gm, '').trim();
    
    return query;
  }

  // Limpiar respuesta JSON
  cleanJsonResponse(response) {
    let jsonText = response.trim();
    
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }
    
    return jsonText.replace(/[\u0000-\u0019]+/g, '');
  }

  // Templates de prompts
  getDataAnalysisTemplate() {
    return 'Analiza estos datos empresariales y identifica patrones clave...';
  }

  getInsightGenerationTemplate() {
    return 'Genera insights empresariales específicos basados en análisis...';
  }

  getRecommendationTemplate() {
    return 'Crea recomendaciones de acción priorizadas...';
  }

  getAdaptiveTemplate() {
    return 'Adapta la respuesta al perfil y contexto del usuario...';
  }

  // Respuestas de fallback
  getFallbackAnalysis(queryResults) {
    return {
      summary: 'Datos procesados correctamente',
      keyMetrics: { totalItems: queryResults.length || 0 },
      trends: [],
      anomalies: [],
      businessImplications: 'Análisis disponible con datos actuales'
    };
  }

  getFallbackInsights() {
    return {
      opportunities: [],
      risks: [],
      bestPractices: [],
      recommendations: [],
      predictions: { nextQuarter: 'Estable', confidence: 'media', factors: [] }
    };
  }

  generateFallbackResponse(contextData, queryResults) {
    const grupo = contextData.finalGroup || 'GRUPO';
    const items = queryResults.length || 0;
    
    return `📊 ${grupo} - ANÁLISIS ${contextData.queryType.toUpperCase()}

• Datos procesados: ${items} registros
• Trimestre: Q${contextData.quarter} 2025
• Status: Información disponible

🎯 /ranking | /areas_criticas | /evolution`;
  }
}

module.exports = IntelligentResponseGenerator;