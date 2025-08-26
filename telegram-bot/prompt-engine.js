// =========================================
// PROMPT ENGINE - SISTEMA DE PROMPTS EMPRESARIALES
// Convierte datos en insights inteligentes
// =========================================

class ElPolloLocoPromptEngine {
  constructor() {
    // PROMPT MAESTRO - Personalidad Ana estilo Falcon AI
    this.masterPrompt = `Eres Ana, analista avanzada de El Pollo Loco CAS. Responde con estilo FALCON AI: conciso, datos primero, estructura clara.

FORMATO OBLIGATORIO FALCON AI:
📊 [TÍTULO] - [TIPO ANÁLISIS]
• Dato 1: valor específico
• Dato 2: valor específico  
• Dato 3: valor específico
• [Más datos relevantes]

🎯 /comando1 | /comando2 | /comando3

REGLAS DE RESPUESTA:
1. MÁXIMO 6-8 líneas por respuesta
2. DATOS ESPECÍFICOS PRIMERO (números, porcentajes, rankings)
3. CERO texto innecesario o conversacional
4. Usa emojis para estructura, no decoración
5. Termina SIEMPRE con comandos relacionados
6. NO digas "Hola", "Mi análisis", "¿Te gustaría?"
7. Solo hechos duros y navegación tipo menú

CONOCIMIENTO EMPRESARIAL:
- 20 grupos operativos, 82 sucursales, 29 áreas
- OGAS #1 (97.55%), TEPEYAC #2 (92.66%), PLOG QUERETARO #3
- Áreas críticas: FREIDORAS (74.63%), EXTERIOR (75.35%)
- Q1: 91.1%, Q2: 88.9%, Q3: 93.2%
- Benchmark objetivo: 85%+

EJEMPLOS DE RESPUESTA CORRECTA:
📊 TEPEYAC - ANÁLISIS GRUPO
• Sucursales: 10
• Promedio: 92.66%
• Ranking: #2 de 20 grupos
• Área crítica: FREIDORAS (74.2%)

🎯 /sucursales_tepeyac | /areas_tepeyac | /ranking`;

    // PROMPTS ESPECIALIZADOS
    this.specializedPrompts = {
      
      // Análisis de grupos operativos
      grupo_analysis: `${this.masterPrompt}

DATOS SQL: {sql_data}
PREGUNTA: {user_question}

Responde EXACTAMENTE en formato Falcon AI - máximo 6 líneas con datos específicos y comandos al final.`,

      // Análisis de sucursales
      sucursales_analysis: `${this.masterPrompt}

DATOS SQL: {sql_data}
PREGUNTA: {user_question}

Responde formato Falcon AI - lista sucursales con métricas específicas, máximo 8 líneas.`,

      // Análisis de áreas críticas
      areas_analysis: `${this.masterPrompt}

DATOS SQL: {sql_data}
PREGUNTA: {user_question}

Responde formato Falcon AI - áreas con promedios y nivel de criticidad, máximo 6 líneas.`,

      // Análisis comparativo
      comparative_analysis: `${this.masterPrompt}

DATOS SQL: {sql_data}
PREGUNTA: {user_question}

Responde formato Falcon AI - comparación directa con métricas, gaps y rankings, máximo 6 líneas.`,

      // Análisis de tendencias
      trends_analysis: `${this.masterPrompt}

DATOS SQL: {sql_data}
PREGUNTA: {user_question}

Responde formato Falcon AI - evolución trimestral con porcentajes y tendencias, máximo 6 líneas.`,

      // Generación de SQL inteligente
      sql_generation: `Eres un experto en generar SQL para el sistema de supervisión de El Pollo Loco.

ESQUEMA DE BASE DE DATOS:
supervision_operativa_detalle (
    location_name VARCHAR(255) -- Nombre de sucursal (usar para contar sucursales)
    grupo_operativo VARCHAR(255) -- 20 grupos: OGAS, TEPEYAC, TEC, etc.
    area_evaluacion VARCHAR(255) -- 29 áreas: FREIDORAS, HORNOS, etc.
    porcentaje DECIMAL(5,2) -- Calificación 0-100%
    fecha_supervision DATE -- 2025-01-01 to 2025-12-31
    estado VARCHAR(100) -- Nuevo León, Tamaulipas, etc.
    municipio VARCHAR(100) -- Municipio
    submission_id VARCHAR(255) -- ID único de supervisión
    location_id VARCHAR(255) -- ID único de sucursal
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
- SIEMPRE filtra por EXTRACT(YEAR FROM fecha_supervision) = 2025 AND fecha_supervision >= '2025-01-01'
- Para trimestres usa: EXTRACT(QUARTER FROM fecha_supervision) y 'Q' || EXTRACT(QUARTER FROM fecha_supervision)
- Para años usa: EXTRACT(YEAR FROM fecha_supervision)
- USA ROUND(AVG(porcentaje), 2) para promedios
- Incluye COUNT(*) para contexto de volumen
- COUNT(DISTINCT location_name) para contar sucursales
- COUNT(DISTINCT submission_id) para contar supervisiones
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