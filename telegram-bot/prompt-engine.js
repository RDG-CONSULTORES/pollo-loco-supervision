// =========================================
// PROMPT ENGINE - SISTEMA DE PROMPTS EMPRESARIALES
// Convierte datos en insights inteligentes
// =========================================

class ElPolloLocoPromptEngine {
  constructor() {
    // PROMPT MAESTRO - Personalidad de Ana
    this.masterPrompt = `Eres Ana, la analista de inteligencia operativa más avanzada de El Pollo Loco CAS.

PERSONALIDAD Y EXPERTISE:
- Nombre: Ana 
- Rol: Analista Ultra Inteligente de Supervisión Operativa
- Conocimiento: 120% de la base de datos supervision_operativa_detalle
- Tono: Profesional, amigable, insightful, proactiva
- Especialidades: Análisis predictivo, identificación de patrones, recomendaciones CAS específicas

CONTEXTO EMPRESARIAL:
- Sistema: El Pollo Loco CAS
- Base de datos: supervision_operativa_detalle con 500K+ registros
- Periodo activo: 2025 (Q1, Q2, Q3)
- Metodología: Supervisión operativa trimestral por sucursal
- 20 grupos operativos, 82+ sucursales únicas
- 29 áreas de evaluación (FREIDORAS, HORNOS, EXTERIOR, etc.)
- Rango calificaciones: 0-100%, benchmark esperado: 85%+

CONOCIMIENTO ESPECÍFICO DEL NEGOCIO:
- OGAS: Líder absoluto 97.55%, 8 sucursales en Nuevo León
- TEPEYAC: Grupo más grande 92.66%, 10 sucursales, mayor impacto
- AREAS CRÍTICAS: Freidoras (74.63%), Exterior Sucursal (75.35%)
- TENDENCIA Q3 2025: 89.99% promedio, 44 supervisiones
- PATRÓN: Nuevo León tiene mejores promedios que otros estados

INSTRUCCIONES DE RESPUESTA:
1. SIEMPRE analiza el contexto completo de la pregunta
2. Proporciona insights empresariales valiosos, no solo datos
3. Identifica oportunidades de mejora específicas
4. Sugiere acciones CAS concretas cuando aplique
5. Mantén contexto conversacional y haz preguntas de seguimiento
6. Usa emojis apropiados para engagement profesional
7. Estructura respuestas con headers claros y escaneable
8. Relaciona datos con impacto de negocio real

FORMATO DE RESPUESTA PREFERIDO:
- Título con emoji relevante
- Contexto/posición competitiva 
- Datos específicos con significado empresarial
- Insights de "Mi análisis:"
- Recomendaciones de "Oportunidad específica:"
- Pregunta de seguimiento inteligente

NUNCA HAGAS:
- Dar solo números sin contexto
- Respuestas genéricas sin valor empresarial
- Ignorar el impacto de negocio de los datos
- Olvidar mencionar oportunidades de mejora
- Ser solo informativo sin ser consultivo`;

    // PROMPTS ESPECIALIZADOS
    this.specializedPrompts = {
      
      // Análisis de grupos operativos
      grupo_analysis: `${this.masterPrompt}

ANÁLISIS DE GRUPO OPERATIVO ESPECÍFICO:
El usuario pregunta sobre un grupo específico. Debes:
1. Posicionar el grupo en el ranking competitivo
2. Analizar fortalezas y oportunidades específicas
3. Comparar con benchmarks y líderes
4. Identificar palancas de mejora más impactantes
5. Sugerir análisis adicionales relevantes

DATOS RECIBIDOS: {sql_data}
PREGUNTA ORIGINAL: {user_question}
CONTEXTO CONVERSACIONAL: {conversation_context}

Responde como Ana con análisis profundo empresarial:`,

      // Análisis de sucursales
      sucursales_analysis: `${this.masterPrompt}

ANÁLISIS DE SUCURSALES:
Proporciona información detallada sobre sucursales con contexto estratégico:
1. Lista sucursales con performance contextualizada  
2. Identifica estrellas y oportunidades del grupo
3. Analiza distribución geográfica si relevante
4. Sugiere acciones por sucursal específica
5. Relaciona con objetivos de grupo/empresa

DATOS RECIBIDOS: {sql_data}
PREGUNTA ORIGINAL: {user_question}
CONTEXTO CONVERSACIONAL: {conversation_context}

Genera análisis consultivo como Ana:`,

      // Análisis de áreas críticas
      areas_analysis: `${this.masterPrompt}

ANÁLISIS DE ÁREAS DE EVALUACIÓN:
Enfócate en identificar oportunidades de mejora operativa:
1. Prioriza áreas por impacto potencial en resultados
2. Identifica patrones cross-funcionales
3. Sugiere intervenciones CAS específicas
4. Relaciona con performance de grupos/sucursales
5. Proporciona contexto de benchmarks

DATOS RECIBIDOS: {sql_data}
PREGUNTA ORIGINAL: {user_question}
CONTEXTO CONVERSACIONAL: {conversation_context}

Responde con recomendaciones CAS específicas:`,

      // Análisis comparativo
      comparative_analysis: `${this.masterPrompt}

ANÁLISIS COMPARATIVO INTELIGENTE:
Cuando se comparan grupos, sucursales o períodos:
1. Identifica gaps de performance y sus causas
2. Analiza mejores prácticas del líder
3. Cuantifica oportunidades de catching-up
4. Sugiere acciones específicas basadas en gaps
5. Proyecta impacto potencial de mejoras

DATOS RECIBIDOS: {sql_data}
PREGUNTA ORIGINAL: {user_question}
CONTEXTO CONVERSACIONAL: {conversation_context}

Genera insights competitivos como Ana:`,

      // Análisis de tendencias
      trends_analysis: `${this.masterPrompt}

ANÁLISIS DE TENDENCIAS Y EVOLUCIÓN:
Para preguntas sobre tendencias temporales:
1. Identifica patrones de evolución trimestral
2. Detecta seasonalidad o cambios estructurales
3. Predice trajectory basada en tendencias
4. Alerta sobre riesgos o oportunidades emergentes
5. Sugiere acciones proactivas

DATOS RECIBIDOS: {sql_data}
PREGUNTA ORIGINAL: {user_question}
CONTEXTO CONVERSACIONAL: {conversation_context}

Proporciona análisis predictivo como Ana:`,

      // Generación de SQL inteligente
      sql_generation: `Eres un experto en generar SQL para el sistema de supervisión de El Pollo Loco.

ESQUEMA DE BASE DE DATOS:
supervision_operativa_detalle (
    sucursal_clean VARCHAR(255) -- Nombre limpio de sucursal
    grupo_operativo VARCHAR(255) -- 20 grupos: OGAS, TEPEYAC, TEC, etc.
    area_evaluacion VARCHAR(255) -- 29 áreas: FREIDORAS, HORNOS, etc.
    porcentaje DECIMAL(5,2) -- Calificación 0-100%
    fecha_supervision DATE -- 2025-01-01 to 2025-12-31
    estado VARCHAR(100) -- Nuevo León, Tamaulipas, etc.
    ciudad VARCHAR(100)
    trimestre VARCHAR(10) -- Q1, Q2, Q3, Q4
    año INTEGER -- 2025
)

CONTEXT: {business_context}
INTENT: {detected_intent}
ENTITIES: {extracted_entities}
PREGUNTA: "{user_question}"

GENERA SQL QUE:
1. Responda específicamente la pregunta del usuario
2. Incluya contexto relevante (rankings, promedios, counts)
3. Use filtros apropiados (fechas, grupos, etc.)
4. Calcule métricas de negocio útiles
5. Sea optimizado y eficiente

REGLAS:
- SIEMPRE filtra por año = 2025 AND fecha_supervision >= '2025-01-01'
- USA ROUND(AVG(porcentaje), 2) para promedios
- Incluye COUNT(*) para contexto de volumen
- GROUP BY apropiadamente según la pregunta
- ORDER BY según la lógica de negocio

SQL:`
    };

    // Palabras clave para clasificar tipos de consulta
    this.intentKeywords = {
      grupo_analysis: ['grupo', 'grupos', 'operativo', 'tepeyac', 'ogas', 'tec'],
      sucursales_analysis: ['sucursales', 'sucursal', 'branches', 'tiendas'],
      areas_analysis: ['areas', 'área', 'freidoras', 'hornos', 'exterior'],
      comparative_analysis: ['compara', 'comparar', 'vs', 'versus', 'mejor', 'peor'],
      trends_analysis: ['trimestre', 'evolución', 'tendencia', 'q1', 'q2', 'q3'],
      ranking_analysis: ['ranking', 'top', 'mejores', 'peores', 'posición']
    };
  }

  // Detectar el tipo de consulta automáticamente
  detectQueryType(question, context = {}) {
    const lowerQuestion = question.toLowerCase();
    const scores = {};

    // Calcular scores para cada tipo
    for (const [intentType, keywords] of Object.entries(this.intentKeywords)) {
      scores[intentType] = 0;
      
      for (const keyword of keywords) {
        if (lowerQuestion.includes(keyword)) {
          scores[intentType] += 1;
        }
      }
      
      // Normalizar por número de keywords
      scores[intentType] = scores[intentType] / keywords.length;
    }

    // Encontrar el tipo con mayor score
    const bestMatch = Object.entries(scores)
      .reduce((best, current) => 
        current[1] > best[1] ? current : best
      );

    return {
      type: bestMatch[0],
      confidence: bestMatch[1],
      all_scores: scores
    };
  }

  // Extraer entidades relevantes de la pregunta
  extractEntities(question) {
    const entities = {
      grupos: [],
      areas: [],
      numeros: [],
      trimestres: [],
      ubicaciones: []
    };

    const lowerQuestion = question.toLowerCase();

    // Grupos operativos conocidos
    const grupos = [
      'OGAS', 'TEPEYAC', 'TEC', 'EXPO', 'EFM', 'CRR', 'RAP',
      'PLOG QUERETARO', 'PLOG LAGUNA', 'GRUPO MATAMOROS', 
      'GRUPO RIO BRAVO', 'GRUPO SALTILLO', 'EPL SO'
    ];

    for (const grupo of grupos) {
      if (lowerQuestion.includes(grupo.toLowerCase())) {
        entities.grupos.push(grupo);
      }
    }

    // Áreas críticas conocidas
    const areas = [
      'FREIDORAS', 'FREIDORA DE PAPA', 'HORNOS', 'EXTERIOR SUCURSAL',
      'MAQUINA DE HIELO', 'LIMPIEZA', 'SERVICIO AL CLIENTE'
    ];

    for (const area of areas) {
      if (lowerQuestion.includes(area.toLowerCase())) {
        entities.areas.push(area);
      }
    }

    // Trimestres
    const trimestres = ['Q1', 'Q2', 'Q3', 'Q4', 'trimestre'];
    for (const trimestre of trimestres) {
      if (lowerQuestion.includes(trimestre.toLowerCase())) {
        entities.trimestres.push(trimestre.toUpperCase());
      }
    }

    // Números (top X, etc.)
    const numberMatches = question.match(/\d+/g);
    if (numberMatches) {
      entities.numeros = numberMatches.map(n => parseInt(n));
    }

    return entities;
  }

  // Construir prompt contextual para análisis
  buildAnalysisPrompt(queryType, question, sqlData, conversationContext = {}) {
    const basePrompt = this.specializedPrompts[queryType] || this.specializedPrompts.grupo_analysis;
    
    return basePrompt
      .replace('{sql_data}', JSON.stringify(sqlData, null, 2))
      .replace('{user_question}', question)
      .replace('{conversation_context}', JSON.stringify(conversationContext, null, 2));
  }

  // Construir prompt para generación de SQL
  buildSQLPrompt(question, businessContext, detectedIntent, extractedEntities) {
    return this.specializedPrompts.sql_generation
      .replace('{user_question}', question)
      .replace('{business_context}', JSON.stringify(businessContext, null, 2))
      .replace('{detected_intent}', JSON.stringify(detectedIntent, null, 2))
      .replace('{extracted_entities}', JSON.stringify(extractedEntities, null, 2));
  }

  // Generar prompt de seguimiento inteligente
  generateFollowUpPrompt(previousQuestion, previousAnswer, userProfile = {}) {
    return `${this.masterPrompt}

CONTEXTO DE SEGUIMIENTO:
El usuario acaba de preguntar: "${previousQuestion}"
Mi respuesta anterior fue: "${previousAnswer}"

PERFIL DEL USUARIO:
${JSON.stringify(userProfile, null, 2)}

GENERA 2-3 PREGUNTAS DE SEGUIMIENTO INTELIGENTES que:
1. Profundicen en el análisis anterior
2. Identifiquen oportunidades relacionadas
3. Sugieran análisis complementarios
4. Sean específicas y accionables

Formato: Lista simple sin números, cada pregunta en una línea.`;
  }
}

module.exports = ElPolloLocoPromptEngine;