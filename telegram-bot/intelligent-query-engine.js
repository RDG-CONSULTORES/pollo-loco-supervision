// =========================================
// INTELLIGENT QUERY ENGINE - MOTOR DE CONSULTAS VERDADERAMENTE INTELIGENTE
// Reemplaza dynamic-query-engine.js actual que es fake
// =========================================

class IntelligentQueryEngine {
  constructor(llmManager, databasePool, promptEngine) {
    this.llm = llmManager;
    this.db = databasePool;
    this.prompts = promptEngine;
    
    // Contexto empresarial dinámico
    this.businessContext = {
      company: "El Pollo Loco CAS",
      current_year: 2025,
      active_quarters: ['Q1', 'Q2', 'Q3'],
      total_groups: 20,
      total_branches: 82,
      evaluation_areas: 29,
      benchmark_target: 85,
      
      // Datos de negocio actualizados
      top_performers: {
        groups: ['OGAS', 'PLOG QUERETARO', 'EPL SO'],
        critical_areas: ['FREIDORAS', 'EXTERIOR SUCURSAL', 'FREIDORA DE PAPA']
      },
      
      current_leaders: {
        'OGAS': { performance: 97.55, branches: 8, status: 'leader' },
        'TEPEYAC': { performance: 92.66, branches: 10, status: 'largest_group' }
      }
    };
    
    // Métricas de consulta
    this.queryMetrics = {
      total_queries: 0,
      successful_queries: 0,
      average_response_time: 0,
      sql_generation_success_rate: 0
    };
  }

  // MÉTODO PRINCIPAL - Procesamiento inteligente completo
  async processIntelligentQuery(question, chatContext = {}) {
    console.log(`🧠 INTELLIGENT QUERY ENGINE procesando: "${question}"`);
    
    const startTime = Date.now();
    this.queryMetrics.total_queries++;
    
    try {
      // FASE 1: ANÁLISIS DE INTENT CON LLM
      console.log('📊 Fase 1: Analizando intent con LLM...');
      const intentAnalysis = await this.analyzeIntentWithLLM(question, chatContext);
      
      // FASE 2: GENERACIÓN DE SQL DINÁMICO CON LLM
      console.log('💻 Fase 2: Generando SQL dinámico...');
      const sqlQuery = await this.generateDynamicSQL(question, intentAnalysis, chatContext);
      
      // FASE 3: EJECUCIÓN DE CONSULTA
      console.log('⚡ Fase 3: Ejecutando consulta...');
      const queryResults = await this.executeQuery(sqlQuery);
      
      // FASE 4: ANÁLISIS INTELIGENTE CON LLM
      console.log('🎯 Fase 4: Generando análisis inteligente...');
      const intelligentAnalysis = await this.generateIntelligentResponse(
        question, intentAnalysis, queryResults, chatContext
      );
      
      // FASE 5: MÉTRICAS Y RESULTADO FINAL
      const processingTime = Date.now() - startTime;
      this.updateQueryMetrics(processingTime, true);
      
      const result = {
        // Respuesta principal
        intelligent_response: intelligentAnalysis.response,
        
        // Metadata del procesamiento
        intent_detected: intentAnalysis,
        sql_executed: sqlQuery,
        data_found: queryResults.rows.length,
        processing_time: processingTime,
        llm_provider_used: intelligentAnalysis.provider,
        confidence_score: intentAnalysis.confidence,
        
        // Sugerencias de seguimiento
        follow_up_suggestions: intelligentAnalysis.follow_up_suggestions || [],
        
        // Contexto para próximas consultas
        business_insights: intelligentAnalysis.business_insights || {},
        
        success: true
      };
      
      console.log(`✅ Query procesada exitosamente:
        📈 Confianza: ${intentAnalysis.confidence}
        🎯 Intent: ${intentAnalysis.primary_intent}
        💾 Datos: ${queryResults.rows.length} registros
        ⏱️ Tiempo: ${processingTime}ms
        🤖 Provider: ${intelligentAnalysis.provider}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en procesamiento inteligente:', error);
      this.updateQueryMetrics(Date.now() - startTime, false);
      
      // Fallback inteligente
      return await this.generateFallbackResponse(question, error, chatContext);
    }
  }

  // FASE 1: Análisis de intent verdaderamente inteligente
  async analyzeIntentWithLLM(question, context) {
    const intentPrompt = `Analiza esta pregunta empresarial y clasifica el intent para El Pollo Loco:

PREGUNTA: "${question}"
CONTEXTO CONVERSACIONAL: ${JSON.stringify(context, null, 2)}
CONTEXTO EMPRESARIAL: ${JSON.stringify(this.businessContext, null, 2)}

Clasifica el intent y extrae información relevante:

POSIBLES INTENTS:
1. grupo_analysis - Análisis de grupos operativos específicos
2. sucursales_info - Información sobre sucursales
3. performance_comparison - Comparaciones de rendimiento
4. areas_evaluation - Análisis de áreas críticas
5. trends_analysis - Análisis de tendencias temporales
6. ranking_queries - Rankings y posicionamiento
7. opportunities_identification - Identificación de oportunidades
8. general_inquiry - Consulta general

EXTRAE TAMBIÉN:
- Entidades mencionadas (grupos, sucursales, áreas, números)
- Tipo de análisis requerido
- Nivel de detalle esperado
- Contexto temporal (trimestre, año)

Responde EXACTAMENTE en este formato JSON:
{
  "primary_intent": "intent_name",
  "confidence": 0.95,
  "entities": {
    "grupos": ["TEPEYAC", "OGAS"],
    "areas": ["FREIDORAS"],
    "numeros": [10, 5],
    "trimestres": ["Q3"]
  },
  "analysis_type": "detailed|summary|comparative",
  "temporal_context": "Q3_2025|YTD_2025|historical",
  "expected_response": "performance_analysis|list_with_context|comparative_insights",
  "business_priority": "high|medium|low"
}`;

    try {
      const response = await this.llm.generate(intentPrompt);
      
      // Limpiar respuesta de markdown
      let jsonText = response.response.trim();
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }
      
      const intentData = JSON.parse(jsonText);
      
      // Validate and enrich intent data
      intentData.processing_timestamp = new Date().toISOString();
      intentData.llm_provider = response.provider;
      
      return intentData;
      
    } catch (error) {
      console.error('❌ Error en análisis de intent:', error);
      
      // Fallback usando prompt engine local
      const localIntent = this.prompts.detectQueryType(question, context);
      const localEntities = this.prompts.extractEntities(question);
      
      return {
        primary_intent: localIntent.type,
        confidence: localIntent.confidence,
        entities: localEntities,
        analysis_type: "summary",
        temporal_context: "current",
        expected_response: "general_analysis",
        business_priority: "medium",
        fallback_used: true
      };
    }
  }

  // FASE 2: Generación de SQL verdaderamente dinámico
  async generateDynamicSQL(question, intentAnalysis, context) {
    const sqlPrompt = this.prompts.buildSQLPrompt(
      question,
      this.businessContext,
      intentAnalysis,
      intentAnalysis.entities
    );

    try {
      const response = await this.llm.generate(sqlPrompt);
      let sqlQuery = response.response.trim();
      
      // Limpiar el SQL de markdown o texto extra
      if (sqlQuery.includes('```')) {
        sqlQuery = sqlQuery.split('```')[1] || sqlQuery.split('```')[0];
        sqlQuery = sqlQuery.replace(/^sql\n?/i, '').trim();
      }
      
      // Validar que es SQL válido básico
      if (!sqlQuery.toLowerCase().includes('select')) {
        throw new Error('SQL generado no válido');
      }
      
      console.log('📝 SQL generado:', sqlQuery);
      
      return {
        sql: sqlQuery,
        generated_by: 'llm',
        provider: response.provider,
        confidence: intentAnalysis.confidence,
        generation_time: response.response_time
      };
      
    } catch (error) {
      console.error('❌ Error generando SQL:', error);
      
      // Fallback con queries predefinidas seguras
      return this.generateFallbackSQL(intentAnalysis, question);
    }
  }

  // FASE 3: Ejecución segura de consulta
  async executeQuery(queryData) {
    try {
      console.log('🔍 Ejecutando query:', queryData.sql);
      
      // Timeout de seguridad para queries complejas
      const queryPromise = this.db.query(queryData.sql);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 15000)
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      console.log(`✅ Query ejecutada: ${result.rowCount} filas obtenidas`);
      
      return {
        rows: result.rows,
        row_count: result.rowCount,
        execution_time: Date.now(),
        success: true
      };
      
    } catch (error) {
      console.error('❌ Error ejecutando query:', error);
      
      // Si el SQL falla, usar query segura básica
      const safeQuery = `
        SELECT 
          COUNT(*) as total_registros,
          COUNT(DISTINCT grupo_operativo) as total_grupos,
          COUNT(DISTINCT sucursal_clean) as total_sucursales,
          ROUND(AVG(porcentaje), 2) as promedio_general
        FROM supervision_operativa_detalle 
        WHERE fecha_supervision >= '2025-01-01'
      `;
      
      const safeResult = await this.db.query(safeQuery);
      
      return {
        rows: safeResult.rows,
        row_count: safeResult.rowCount,
        execution_time: Date.now(),
        success: false,
        fallback_used: true,
        original_error: error.message
      };
    }
  }

  // FASE 4: Generación de respuesta verdaderamente inteligente
  async generateIntelligentResponse(question, intentAnalysis, queryResults, context) {
    // Seleccionar prompt especializado según el tipo de consulta
    const promptType = this.mapIntentToPromptType(intentAnalysis.primary_intent);
    
    const analysisPrompt = this.prompts.buildAnalysisPrompt(
      promptType,
      question,
      queryResults.rows,
      context
    );

    try {
      const response = await this.llm.generate(analysisPrompt);
      
      // Generar sugerencias de seguimiento
      const followUpPrompt = this.prompts.generateFollowUpPrompt(
        question,
        response.response,
        context.user_profile || {}
      );
      
      const followUpResponse = await this.llm.generate(followUpPrompt);
      const followUpSuggestions = followUpResponse.response
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3); // Máximo 3 sugerencias
      
      return {
        response: response.response,
        provider: response.provider,
        tokens_used: response.tokens_used,
        cost: response.cost,
        follow_up_suggestions: followUpSuggestions,
        business_insights: {
          intent_matched: intentAnalysis.primary_intent,
          data_quality: queryResults.row_count > 0 ? 'good' : 'limited',
          confidence: intentAnalysis.confidence
        }
      };
      
    } catch (error) {
      console.error('❌ Error generando respuesta inteligente:', error);
      
      // Fallback con respuesta estructurada básica
      return this.generateStructuredFallback(question, queryResults, intentAnalysis);
    }
  }

  // Mapear intents a tipos de prompt
  mapIntentToPromptType(intent) {
    const mapping = {
      'grupo_analysis': 'grupo_analysis',
      'sucursales_info': 'sucursales_analysis',
      'performance_comparison': 'comparative_analysis',
      'areas_evaluation': 'areas_analysis',
      'trends_analysis': 'trends_analysis',
      'ranking_queries': 'comparative_analysis',
      'opportunities_identification': 'areas_analysis',
      'general_inquiry': 'grupo_analysis'
    };
    
    return mapping[intent] || 'grupo_analysis';
  }

  // SQL fallback seguro
  generateFallbackSQL(intentAnalysis, question) {
    const lowerQuestion = question.toLowerCase();
    let sql;
    
    if (lowerQuestion.includes('sucursales') && intentAnalysis.entities.grupos.length > 0) {
      sql = `SELECT DISTINCT sucursal_clean, grupo_operativo, estado 
             FROM supervision_operativa_detalle 
             WHERE UPPER(grupo_operativo) = UPPER('${intentAnalysis.entities.grupos[0]}')
             AND fecha_supervision >= '2025-01-01'
             ORDER BY sucursal_clean`;
    } else if (lowerQuestion.includes('grupo') || lowerQuestion.includes('ranking')) {
      sql = `SELECT grupo_operativo, 
                    COUNT(DISTINCT sucursal_clean) as sucursales,
                    ROUND(AVG(porcentaje), 2) as promedio,
                    COUNT(*) as evaluaciones
             FROM supervision_operativa_detalle 
             WHERE fecha_supervision >= '2025-01-01'
             GROUP BY grupo_operativo 
             ORDER BY promedio DESC`;
    } else {
      sql = `SELECT AVG(porcentaje) as promedio_general, 
                    COUNT(*) as total_evaluaciones,
                    COUNT(DISTINCT sucursal_clean) as sucursales_activas
             FROM supervision_operativa_detalle 
             WHERE fecha_supervision >= '2025-01-01'`;
    }
    
    return {
      sql: sql,
      generated_by: 'fallback',
      confidence: 0.7,
      generation_time: 0
    };
  }

  // Respuesta fallback estructurada
  generateStructuredFallback(question, queryResults, intentAnalysis) {
    let response = `🤖 **Análisis Básico Disponible**\n\n`;
    
    if (queryResults.row_count > 0) {
      response += `📊 **Datos encontrados:** ${queryResults.row_count} registros\n\n`;
      
      // Mostrar primeros resultados con contexto básico
      queryResults.rows.slice(0, 3).forEach((row, index) => {
        response += `**${index + 1}.** `;
        response += Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
        response += '\n\n';
      });
    } else {
      response += `❌ No encontré datos específicos para tu consulta: "${question}"\n\n`;
    }
    
    response += `💡 **Sugerencia:** Intenta preguntas más específicas como:
• "¿Cuántas sucursales tiene TEPEYAC?"
• "¿Cuál es el ranking de grupos operativos?"
• "¿Qué áreas necesitan mejora?"`;
    
    return {
      response: response,
      provider: 'fallback',
      tokens_used: 0,
      cost: 0,
      follow_up_suggestions: [
        "¿Cuáles son los grupos operativos con mejor performance?",
        "¿Qué sucursales necesitan atención inmediata?",
        "¿Cómo ha evolucionado el promedio este trimestre?"
      ]
    };
  }

  // Generar respuesta de fallback para errores críticos
  async generateFallbackResponse(question, error, context) {
    return {
      intelligent_response: `🔧 **Sistema en Mantenimiento**

Disculpa, estoy experimentando problemas técnicos procesando tu consulta: "${question}"

**Error técnico:** ${error.message}

🔄 **Mientras tanto, puedes usar:**
• /top10 - Rankings actuales
• /grupos - Lista de grupos operativos  
• /help - Comandos disponibles

💡 **O intenta reformular tu pregunta de manera más simple.**

¿Te gustaría que te ayude con algún comando específico?`,
      
      intent_detected: { primary_intent: 'error_fallback', confidence: 0 },
      sql_executed: { sql: 'ERROR', generated_by: 'none' },
      data_found: 0,
      processing_time: Date.now(),
      success: false,
      error: error.message
    };
  }

  // Actualizar métricas de consulta
  updateQueryMetrics(processingTime, success) {
    if (success) {
      this.queryMetrics.successful_queries++;
    }
    
    this.queryMetrics.average_response_time = 
      (this.queryMetrics.average_response_time + processingTime) / 2;
    
    this.queryMetrics.sql_generation_success_rate = 
      (this.queryMetrics.successful_queries / this.queryMetrics.total_queries) * 100;
  }

  // Obtener estadísticas del motor
  getEngineStats() {
    return {
      ...this.queryMetrics,
      business_context: this.businessContext,
      last_update: new Date().toISOString()
    };
  }
}

module.exports = IntelligentQueryEngine;