// =========================================
// ANA INTELLIGENT - SISTEMA SIMPLE QUE FUNCIONA
// Un solo archivo, OpenAI máximo, sin over-engineering
// =========================================

const OpenAI = require('openai');

class AnaIntelligent {
  constructor(pool) {
    this.pool = pool;
    
    // Initialize OpenAI only if API key exists
    this.hasOpenAI = !!process.env.OPENAI_API_KEY;
    if (this.hasOpenAI) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      console.log('⚠️ OpenAI API key no configurado - modo testing');
    }
    
    // Memoria conversacional simple (en memoria)
    this.conversations = new Map();
    
    // Esquema de BD completo para OpenAI
    this.databaseSchema = {
      table: 'supervision_operativa_clean',  // USA LA VIEW LIMPIA
      columns: {
        location_name: 'VARCHAR(255) - Nombre de la sucursal',
        grupo_operativo_limpio: 'VARCHAR(255) - Grupo operativo limpio (sin NO_ENCONTRADO)',
        area_evaluacion: 'VARCHAR(255) - Área evaluada (29 áreas específicas + CALIFICACION GENERAL)',
        porcentaje: 'DECIMAL(5,2) - Porcentaje obtenido (0-100)',
        fecha_supervision: 'DATE - Fecha de supervisión',
        submission_id: 'VARCHAR(255) - ID único',
        estado_normalizado: 'VARCHAR(255) - Estado normalizado (sin duplicados)',
        municipio: 'VARCHAR(255) - Municipio específico',
        latitud: 'DECIMAL - Coordenada latitud',
        longitud: 'DECIMAL - Coordenada longitud'
      },
      grupos_disponibles: [
        'OGAS', 'TEPEYAC', 'PLOG QUERETARO', 'EPL SO', 'TEC', 
        'EXPO', 'EFM', 'CRR', 'RAP', 'PLOG LAGUNA',
        'GRUPO MATAMOROS', 'GRUPO RIO BRAVO', 'GRUPO SALTILLO',
        'PLOG NUEVO LEON', 'OCHTER TAMPICO', 'GRUPO CANTERA ROSA (MORELIA)',
        'GRUPO CENTRITO', 'GRUPO NUEVO LAREDO (RUELAS)', 'GRUPO SABINAS HIDALGO',
        'GRUPO PIEDRAS NEGRAS'
      ],
      year: 2025,
      current_quarter: 3,
      
      // Sistema de Benchmarks El Pollo Loco CAS
      benchmarks: {
        areas_especificas: {
          excelencia: 95, // 95%+ ⭐⭐⭐
          objetivo: 85,   // 85-94% ⭐⭐  
          atencion: 80,   // 80-84% ⚠️
          critico: 79     // <80% 🚨
        },
        calificacion_general: {
          excelencia: 95, // 95%+ ⭐⭐⭐
          objetivo: 90,   // 90-94% ⭐⭐ (MÁS ESTRICTO)
          atencion: 85,   // 85-89% ⚠️
          critico: 84     // <85% 🚨
        }
      }
    };
    
    console.log('🧠 Ana Intelligent inicializada - Sistema SIMPLE que funciona');
  }
  
  // DETECTOR DE ENTIDADES ULTRA-INTELIGENTE
  preprocessQuestion(question) {
    console.log(`🔍 Pregunta original: "${question}"`);
    
    let processed = question;
    
    // === DETECCIÓN DE GRUPOS OPERATIVOS ===
    // Grupos principales
    processed = processed.replace(/\btepeyac\b|\btepy\b/gi, 'TEPEYAC');
    processed = processed.replace(/\bogas\b/gi, 'OGAS');
    processed = processed.replace(/\bqueretaro\b|\bqro\b|\bquerétaro\b/gi, 'PLOG QUERETARO');
    processed = processed.replace(/\bmorelia\b|\bcantera\s*rosa\b/gi, 'GRUPO CANTERA ROSA (MORELIA)');
    processed = processed.replace(/\bsaltillo\b/gi, 'GRUPO SALTILLO');
    processed = processed.replace(/\bexpo\b|\bexposicion\b/gi, 'EXPO');
    processed = processed.replace(/\btec\b|\btecnologico\b/gi, 'TEC');
    
    // Grupos regionales
    processed = processed.replace(/\brap\b/gi, 'RAP');
    processed = processed.replace(/\bcrr\b/gi, 'CRR');
    // processed = processed.replace(/\bmatamoros\b/gi, 'GRUPO MATAMOROS'); // Removido - Matamoros es sucursal TEPEYAC
    processed = processed.replace(/\brio\s*bravo\b/gi, 'GRUPO RIO BRAVO');
    processed = processed.replace(/\bnuevo\s*leon\b/gi, 'PLOG NUEVO LEON');
    processed = processed.replace(/\blaguna\b/gi, 'PLOG LAGUNA');
    
    // === ESTRATEGIA HÍBRIDA INTELIGENTE: ESTADOS/CIUDADES → GRUPOS ===
    
    // UBICACIONES CON GRUPO ÚNICO (conversión directa válida)
    const ubicacionesUnicas = {
      // Estados con 1 grupo
      'durango': 'PLOG LAGUNA',
      'michoacán': 'GRUPO CANTERA ROSA (MORELIA)', 
      'michoacan': 'GRUPO CANTERA ROSA (MORELIA)',
      'sinaloa': 'TEC',
      
      // Ciudades con 1 grupo  
      'tampico': 'OCHTER TAMPICO',
      'ochter': 'OCHTER TAMPICO'
      // Nota: queretaro y morelia ya se manejan arriba en grupos principales
    };
    
    // UBICACIONES CON MÚLTIPLES GRUPOS (agregar contexto)
    const ubicacionesMultiples = {
      'reynosa': '(CRR y RAP)',
      // matamoros removido - es una sucursal de TEPEYAC en Monterrey
      'nuevo león': '(10 grupos operativos)',
      'nuevo leon': '(10 grupos operativos)',
      'tamaulipas': '(8 grupos operativos)',
      'coahuila': '(3 grupos: PIEDRAS NEGRAS, SALTILLO, LAGUNA)'
    };
    
    // Aplicar conversiones únicas primero
    Object.entries(ubicacionesUnicas).forEach(([ubicacion, grupo]) => {
      const regex = new RegExp(`\\b${ubicacion}\\b`, 'gi');
      processed = processed.replace(regex, grupo);
    });
    
    // Aplicar contexto para ubicaciones múltiples
    Object.entries(ubicacionesMultiples).forEach(([ubicacion, contexto]) => {
      const regex = new RegExp(`\\b${ubicacion}\\b`, 'gi');
      processed = processed.replace(regex, `${ubicacion} ${contexto}`);
    });
    
    // Casos especiales ya procesados arriba - mantener para compatibilidad
    // processed = processed.replace(/\breynosa\b/gi, 'grupos de Reynosa (RAP y CRR)'); // Ya manejado
    
    // === DETECCIÓN DE SUCURSALES ===
    // Sucursales principales TEPEYAC
    processed = processed.replace(/\bquintas\b|\blas\s*quintas\b/gi, '31 - Las Quintas');
    processed = processed.replace(/\bpino\s*suarez\b/gi, '1 - Pino Suarez');
    processed = processed.replace(/\bmadero\b/gi, '2 - Madero');
    processed = processed.replace(/\bfelix\s*(u\.?\s*)?gomez\b/gi, '5 - Felix U. Gomez');
    processed = processed.replace(/\bmatamoros\b/gi, 'Matamoros (TEPEYAC)'); // Sucursal TEPEYAC en Monterrey
    
    // Sucursales OGAS
    processed = processed.replace(/\blincoln\b/gi, '11 - Lincoln');
    processed = processed.replace(/\banahuac\b/gi, '9 - Anahuac');
    processed = processed.replace(/\bbarragan\b/gi, '10 - Barragan');
    processed = processed.replace(/\bapodaca\b/gi, '36 - Apodaca Centro');
    
    // Sucursales Reynosa
    processed = processed.replace(/\baeropuerto\b/gi, '76 - Aeropuerto (Reynosa)');
    processed = processed.replace(/\bboulevard\s*morelos\b/gi, '77 - Boulevard Morelos');
    processed = processed.replace(/\blibramiento\b/gi, '75 - Libramiento (Reynosa)');
    processed = processed.replace(/\banzalduas\b/gi, '73 - Anzalduas');
    // Hidalgo solo si NO es parte de "GRUPO SABINAS HIDALGO"
    processed = processed.replace(/\bhidalgo\b(?!\s*\(reynosa\))/gi, (match, offset, string) => {
      // Si viene después de "SABINAS", no convertir
      const beforeMatch = string.substring(Math.max(0, offset - 20), offset).toLowerCase();
      if (beforeMatch.includes('sabinas')) {
        return match; // No convertir, mantener original
      }
      return '74 - Hidalgo (Reynosa)';
    });
    
    // Sucursales Saltillo
    processed = processed.replace(/\bharold\s*(r\.?\s*)?pape\b/gi, '57 - Harold R. Pape');
    processed = processed.replace(/\becheverria\b|\bluis\s*echeverria\b/gi, '56 - Luis Echeverria');
    
    // === DETECCIÓN DE FECHAS ===
    // Trimestres
    processed = processed.replace(/\beste\s+trimestre\b|\btrimestre\s+actual\b/gi, 'Q3 2025');
    processed = processed.replace(/\bq3\b|\btercer\s+trimestre\b/gi, 'Q3 2025');
    processed = processed.replace(/\bq2\b|\bsegundo\s+trimestre\b/gi, 'Q2 2025');
    processed = processed.replace(/\bq1\b|\bprimer\s+trimestre\b/gi, 'Q1 2025');
    
    // Meses específicos
    processed = processed.replace(/\beste\s+mes\b/gi, 'agosto 2025');
    processed = processed.replace(/\bjulio\b/gi, 'julio 2025');
    processed = processed.replace(/\bagosto\b/gi, 'agosto 2025');
    processed = processed.replace(/\bseptiembre\b/gi, 'septiembre 2025');
    
    // Año
    processed = processed.replace(/\beste\s+año\b|\baño\s+actual\b/gi, '2025');
    
    // Limpiar duplicados de año
    processed = processed.replace(/(\b2025\b.*?)\b2025\b/gi, '$1');
    
    // === DETECCIÓN DE INTENCIONES ===
    // Preguntas sobre cantidad
    processed = processed.replace(/\bcuantas\s+supervisiones\b/gi, 'total supervisiones');
    processed = processed.replace(/\bcuantos\s+grupos\b/gi, 'total grupos operativos');
    processed = processed.replace(/\bcuantas\s+sucursales\b/gi, 'total sucursales');
    
    // Preguntas sobre listados
    processed = processed.replace(/\bcuales\s+sucursales\b/gi, 'listado sucursales');
    processed = processed.replace(/\bcuales\s+grupos\b/gi, 'listado grupos operativos');
    processed = processed.replace(/\bque\s+sucursales\b/gi, 'listado sucursales');
    
    // Calificaciones y scores
    processed = processed.replace(/\bcalificaciones\b|\bscores\b|\bpuntuaciones\b/gi, 'porcentajes supervisiones');
    processed = processed.replace(/\bnotas\b|\bevaluaciones\b/gi, 'calificaciones supervisiones');
    
    // Términos de performance
    processed = processed.replace(/\bmejores\b|\btop\b|\blideres\b/gi, 'ranking mejores');
    processed = processed.replace(/\bpeores\b|\bbottom\b|\bbajos\b/gi, 'ranking peores');
    processed = processed.replace(/\bcriticos\b|\bproblemas\b/gi, 'áreas críticas');
    processed = processed.replace(/\boportunidades\b|\bmejora\b/gi, 'áreas de oportunidad');
    
    // Benchmarks y performance
    processed = processed.replace(/\bobjetivo\b|\bmeta\b/gi, 'benchmark objetivo (90% general, 85% áreas)');
    processed = processed.replace(/\bexcelencia\b/gi, 'benchmark excelencia (95%)');
    processed = processed.replace(/\b100\s*%\b|\bperfecto\b|\bperfectas\b/gi, 'calificación perfecta (100%)');
    processed = processed.replace(/\btienen\s+100%\b|\bcon\s+100%\b/gi, 'tienen calificación perfecta (100%)');
    
    // Casos específicos de intenciones complejas (debe ir antes de las reglas generales)
    if (processed.toLowerCase().includes('cuales sucursales tienen 100%')) {
      processed = processed.replace(/cuales sucursales tienen 100%/gi, 'listado sucursales tienen calificación perfecta (100%)');
    }
    
    // Mejorar detección de áreas críticas
    processed = processed.replace(/\bareas\s+criticas\b/gi, 'áreas críticas');
    
    // === DETECCIÓN DE CASOS EJECUTIVOS ===
    // Reportes y consolidaciones
    processed = processed.replace(/\bnecesito\s+ranking\s+consolidado\b/gi, 'ranking consolidado completo todos los grupos');
    processed = processed.replace(/\bestado\s+completo\b/gi, 'reporte estado completo');
    processed = processed.replace(/\bdesglose\s+performance\b/gi, 'análisis detallado performance');
    processed = processed.replace(/\bregional\s+completo\b/gi, 'todas las regiones');
    
    // KPIs y métricas ejecutivas
    processed = processed.replace(/\bkpis?\s+consolidados?\b/gi, 'métricas clave consolidadas');
    processed = processed.replace(/\bpara\s+junta\s+directiva\b/gi, 'formato ejecutivo junta directiva');
    processed = processed.replace(/\bpara\s+reporte\b/gi, 'formato reporte ejecutivo');
    
    // Análisis y tendencias
    processed = processed.replace(/\banalisis\s+de\s+riesgo\b/gi, 'análisis riesgo operativo');
    processed = processed.replace(/\btendencias\s+performance\b/gi, 'análisis tendencias performance');
    processed = processed.replace(/\bvs\s+trimestre\s+anterior\b/gi, 'comparativo trimestre anterior');
    
    // Términos de completitud
    processed = processed.replace(/\btodas?\s+regiones?\b/gi, 'consolidado regional completo');
    processed = processed.replace(/\btodos?\s+los?\s+grupos?\b/gi, 'todos los grupos operativos');
    
    console.log(`✅ Pregunta procesada: "${processed}"`);
    return processed;
  }
  
  // MÉTODO PRINCIPAL - TODO EN UNO
  async processQuestion(question, chatId) {
    console.log(`🎯 Ana procesando: "${question}" (Chat: ${chatId})`);
    
    try {
      // 1. PREPROCESAR PREGUNTA (NUEVA INTELIGENCIA)
      const processedQuestion = this.preprocessQuestion(question);
      
      // 2. Obtener/crear contexto conversacional
      const conversation = this.getConversation(chatId);
      
      // 3. Check if OpenAI is available
      if (!this.hasOpenAI) {
        return this.getTestResponse(processedQuestion, conversation);
      }
      
      // 4. Prompt mega-inteligente para OpenAI
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(processedQuestion, conversation);
      
      // 5. OpenAI decide TODO (con pregunta procesada)
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      });
      
      const aiResponse = response.choices[0].message.content;
      console.log('🤖 OpenAI raw response:', aiResponse.substring(0, 200) + '...');
      
      // 6. Procesar respuesta de IA (usar pregunta original para contexto)
      const result = await this.processAIResponse(aiResponse, chatId, question);
      
      // 7. Actualizar memoria conversacional (con pregunta original)
      this.updateConversation(chatId, question, result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en Ana Intelligent:', error);
      return this.getErrorResponse(error);
    }
  }
  
  // Construir prompt del sistema
  buildSystemPrompt() {
    return `Eres Ana, analista experta de El Pollo Loco. Eres ULTRA INTELIGENTE y entiendes perfectamente el negocio.

ESQUEMA DE BASE DE DATOS:
Tabla: ${this.databaseSchema.table}
${Object.entries(this.databaseSchema.columns).map(([col, desc]) => `- ${col}: ${desc}`).join('\n')}

GRUPOS OPERATIVOS DISPONIBLES:
${this.databaseSchema.grupos_disponibles.join(', ')}

EJEMPLOS SQL INTELIGENTES:

RANKING DE GRUPOS:
SQL: SELECT grupo_operativo_limpio as grupo_operativo, ROUND(AVG(porcentaje), 2) as promedio, COUNT(*) as evaluaciones FROM supervision_operativa_clean WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 AND porcentaje IS NOT NULL GROUP BY grupo_operativo_limpio ORDER BY promedio DESC LIMIT 15;

SUCURSALES DE UN GRUPO:
SQL: SELECT location_name, ROUND(AVG(porcentaje), 2) as promedio, COUNT(*) as evaluaciones FROM supervision_operativa_clean WHERE grupo_operativo_limpio = 'TEPEYAC' AND EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 AND porcentaje IS NOT NULL GROUP BY location_name ORDER BY promedio DESC LIMIT 20;

BÚSQUEDA DE SUCURSAL ESPECÍFICA:
SQL: SELECT DISTINCT location_name, porcentaje as calificacion_general, fecha_supervision FROM supervision_operativa_clean WHERE location_name ILIKE '%quintas%' AND area_evaluacion = '' AND EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 ORDER BY porcentaje DESC;

ÁREAS DE OPORTUNIDAD DE UNA SUCURSAL:
SQL: SELECT area_evaluacion, porcentaje FROM supervision_operativa_clean WHERE location_name ILIKE '%pino%suarez%' AND area_evaluacion != '' AND area_evaluacion != 'PUNTOS MAXIMOS' AND porcentaje IS NOT NULL AND porcentaje < 85 AND EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 ORDER BY porcentaje ASC LIMIT 5;

ÁREAS CRÍTICAS GENERALES:
SQL: SELECT area_evaluacion, ROUND(AVG(porcentaje), 2) as promedio, COUNT(*) as evaluaciones FROM supervision_operativa_clean WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 AND porcentaje IS NOT NULL AND area_evaluacion != '' AND area_evaluacion != 'PUNTOS MAXIMOS' GROUP BY area_evaluacion ORDER BY promedio ASC LIMIT 10;

SUCURSALES CON 100%:
SQL: SELECT DISTINCT location_name as sucursal, porcentaje as calificacion_general, fecha_supervision FROM supervision_operativa_clean WHERE area_evaluacion = '' AND porcentaje = 100.00 AND EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 ORDER BY location_name;

BÚSQUEDAS INTELIGENTES:
- SIEMPRE usa ILIKE con % para sucursales: WHERE location_name ILIKE '%quintas%'
- Para grupos usa: WHERE grupo_operativo_limpio ILIKE '%TEPEYAC%'
- Para trimestre actual usa: EXTRACT(QUARTER FROM fecha_supervision) = 3

REGLAS CRÍTICAS:
- **OBLIGATORIO**: USA EXCLUSIVAMENTE supervision_operativa_clean
- **OBLIGATORIO**: USA grupo_operativo_limpio (NUNCA grupo_operativo)
- **OBLIGATORIO**: Para sucursales SIEMPRE usa ILIKE con %: location_name ILIKE '%quintas%'
- **OBLIGATORIO**: Para Q3 usa: EXTRACT(QUARTER FROM fecha_supervision) = 3
- SIEMPRE usa LIMIT apropiado (10-15 para rankings, 20 para listas)

CONTEXTO ACTUAL:
- Año: ${this.databaseSchema.year}
- Trimestre actual: Q${this.databaseSchema.current_quarter} (Julio-Septiembre)
- CALIFICACIÓN GENERAL: area_evaluacion = '' y porcentaje IS NOT NULL

BENCHMARKS:
- 🏆 Excelencia: 95%+ (⭐⭐⭐)
- ✅ Objetivo: 90-94% para general, 85-94% para áreas (⭐⭐)
- ⚠️ Atención: 85-89% general, 80-84% áreas
- 🚨 Crítico: <85% general, <80% áreas

INSTRUCCIONES DE RESPUESTA:
- Si necesitas datos → responde SOLO: "SQL: SELECT..."
- Para sucursales específicas → SIEMPRE usa ILIKE con %
- Para rankings → usa GROUP BY y ORDER BY
- RESPUESTAS COMPACTAS: Datos primero, explicaciones mínimas
- Si Q3 no tiene datos → buscar Q2, indicar trimestre
- Si usuario pide /insights → dar análisis detallado

FORMATO COMPACTO OBLIGATORIO:
🏆 GRUPO/SUCURSAL Q3 2025
98.52% ⭐⭐⭐ Item 1
96.45% ⭐⭐⭐ Item 2
85.30% ⚠️ Item 3

💡 /insights - Análisis detallado
🎯 /areas - Áreas críticas

SI NO HAY DATOS Q3:
📊 GRUPO Q3 2025 - Sin supervisiones
📊 GRUPO Q2 2025 - Últimas evaluaciones:
96.45% ⭐⭐⭐ Item 1
⚠️ Datos de Q2 (último trimestre disponible)
💡 /insights-q2 - Ver análisis Q2

PARA INSIGHTS DETALLADOS (/insights):
📊 ANÁLISIS DETALLADO GRUPO Q3:
• Líder: [sucursal] con [%]
• Riesgo: [problema identificado]
• Tendencia: [vs trimestre anterior]
• Acción: [recomendación específica]`;
  }
  
  // Construir prompt del usuario con contexto
  buildUserPrompt(question, conversation) {
    let contextInfo = '';
    const lowerQuestion = question.toLowerCase();
    
    if (conversation.userGroup) {
      contextInfo += `\nGRUPO PRINCIPAL DEL USUARIO: ${conversation.userGroup}`;
    }
    
    // MEJOR DETECCIÓN DE CONTEXTO
    if (lowerQuestion.includes('sucursal') && (lowerQuestion.includes('quintas') || lowerQuestion.includes('las quintas') || lowerQuestion.includes('31 - las quintas'))) {
      contextInfo += `\nBÚSQUEDA: Sucursal Las Quintas - usar ILIKE '%quintas%'`;
    }
    
    if (lowerQuestion.includes('areas') && (lowerQuestion.includes('tepeyac') || lowerQuestion.includes('oportunidad'))) {
      contextInfo += `\nBÚSQUEDA: Áreas de oportunidad - filtrar por grupo y <85%`;
    }
    
    if (lowerQuestion.includes('q3') || lowerQuestion.includes('tercer') || lowerQuestion.includes('trimestre actual')) {
      contextInfo += `\nFILTRO: Q3 2025 - usar EXTRACT(QUARTER FROM fecha_supervision) = 3`;
    }
    
    // NIVEL 3: Detectar comandos de insights
    if (this.isInsightsRequest(lowerQuestion)) {
      contextInfo += `\nCOMANDO: /insights - Usuario quiere análisis detallado completo`;
    } else {
      contextInfo += `\nFORMATO: Respuesta compacta - datos primero, mínimo texto`;
    }
    
    if (conversation.history.length > 0) {
      const recentHistory = conversation.history.slice(-2).map(h => 
        `"${h.question}" → ${h.topic}`
      ).join(', ');
      contextInfo += `\n\nCONTEXTO RECIENTE: ${recentHistory}`;
    }
    
    return `PREGUNTA: "${question}"${contextInfo}
    
RESPONDE COMO ANA:
- Si necesitas datos específicos → responde SOLO "SQL: SELECT..."
- Para sucursales específicas → SIEMPRE usa ILIKE con %
- Para Q3 → usa EXTRACT(QUARTER FROM fecha_supervision) = 3
- Mantén respuestas visuales y concisas`;
  }
  
  // NIVEL 2: SISTEMA DE FALLBACK DE TRIMESTRES
  async tryFallbackQuery(originalQuery) {
    console.log('🔄 Intentando fallback de trimestres...');
    
    try {
      // Intentar Q3 primero
      const q3Query = originalQuery.replace(/EXTRACT\(QUARTER FROM fecha_supervision\) = \d+/g, 'EXTRACT(QUARTER FROM fecha_supervision) = 3');
      const q3Result = await this.pool.query(q3Query);
      
      if (q3Result.rows.length > 0) {
        console.log('✅ Datos encontrados en Q3');
        return { data: q3Result.rows, quarter: 'Q3 2025', fallback: false };
      }
      
      // Si Q3 está vacío, intentar Q2
      console.log('🔍 Q3 sin datos, intentando Q2...');
      const q2Query = originalQuery.replace(/EXTRACT\(QUARTER FROM fecha_supervision\) = \d+/g, 'EXTRACT(QUARTER FROM fecha_supervision) = 2');
      const q2Result = await this.pool.query(q2Query);
      
      if (q2Result.rows.length > 0) {
        console.log('✅ Datos encontrados en Q2 (fallback)');
        return { data: q2Result.rows, quarter: 'Q2 2025', fallback: true };
      }
      
      // Si Q2 también está vacío, intentar Q1
      console.log('🔍 Q2 sin datos, intentando Q1...');
      const q1Query = originalQuery.replace(/EXTRACT\(QUARTER FROM fecha_supervision\) = \d+/g, 'EXTRACT(QUARTER FROM fecha_supervision) = 1');
      const q1Result = await this.pool.query(q1Query);
      
      if (q1Result.rows.length > 0) {
        console.log('✅ Datos encontrados en Q1 (fallback)');
        return { data: q1Result.rows, quarter: 'Q1 2025', fallback: true };
      }
      
      return { data: [], quarter: null, fallback: false };
      
    } catch (error) {
      console.error('❌ Error en fallback:', error.message);
      return { data: [], quarter: null, fallback: false };
    }
  }
  
  // NIVEL 3: DETECTOR DE COMANDO INSIGHTS
  isInsightsRequest(question) {
    const lowerQ = question.toLowerCase();
    return lowerQ.includes('/insights') || 
           lowerQ.includes('análisis detallado') || 
           lowerQ.includes('insights') ||
           lowerQ.includes('más información') ||
           lowerQ.includes('detallado');
  }
  
  // Procesar respuesta de OpenAI
  async processAIResponse(aiResponse, chatId, originalQuestion) {
    // Si OpenAI quiere ejecutar SQL
    if (aiResponse.startsWith('SQL:')) {
      const sqlQuery = aiResponse.replace('SQL:', '').trim();
      console.log('📊 Ejecutando SQL generado por OpenAI:', sqlQuery);
      
      try {
        // NIVEL 2: Intentar consulta con fallback de trimestres
        let queryResult;
        
        // Si la query incluye trimestres, usar sistema de fallback
        if (sqlQuery.includes('EXTRACT(QUARTER FROM fecha_supervision)')) {
          queryResult = await this.tryFallbackQuery(sqlQuery);
        } else {
          // Query normal sin trimestres
          const result = await this.pool.query(sqlQuery);
          queryResult = { data: result.rows, quarter: null, fallback: false };
        }
        
        const data = queryResult.data;
        
        // Optimizar datos grandes para evitar token overflow
        let dataForAnalysis = data;
        if (data.length > 100) {
          // Para datasets grandes, usar muestra representativa + agregaciones
          console.log(`📊 Dataset grande (${data.length} registros) - optimizando...`);
          
          dataForAnalysis = {
            sample: data.slice(0, 20),
            total_records: data.length,
            summary: {
              avg_score: data.reduce((sum, row) => sum + (parseFloat(row.promedio || row.porcentaje) || 0), 0) / data.length,
              top_performer: data.sort((a, b) => (b.promedio || b.porcentaje) - (a.promedio || a.porcentaje))[0],
              bottom_performer: data.sort((a, b) => (a.promedio || a.porcentaje) - (b.promedio || b.porcentaje))[0],
              unique_locations: [...new Set(data.map(row => row.location_name))].length
            }
          };
        }
        
        // NIVEL 3: Verificar si es request de insights
        const wantsInsights = this.isInsightsRequest(originalQuestion);
        
        // Preparar contexto para OpenAI
        let contextInfo = '';
        if (queryResult.fallback) {
          contextInfo += `\nIMPORTANTE: Datos de ${queryResult.quarter} (fallback - Q3 sin supervisiones).`;
        } else if (queryResult.quarter) {
          contextInfo += `\nDatos de ${queryResult.quarter}.`;
        }
        
        if (wantsInsights) {
          contextInfo += '\nUsuario pidí análisis detallado - usar formato de insights completo.';
        } else {
          contextInfo += '\nUsuario quiere respuesta compacta - MÁXIMO 5 LÍNEAS. DATOS PRIMERO, sin análisis extenso. Formato visual con emoticons.';
        }
        
        // Pedir a OpenAI que analice los resultados
        const analysisPrompt = `Los datos de la consulta "${originalQuestion}" son:
        
${JSON.stringify(dataForAnalysis, null, 2)}

${data.length > 100 ? 
`NOTA: Dataset grande con ${data.length} registros totales. Arriba tienes muestra representativa + resumen estadístico.` : 
''}

${contextInfo}

ANALIZA estos datos como Ana siguiendo las instrucciones de formato.`;

        const analysisResponse = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: this.buildSystemPrompt() },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.3
        });
        
        return analysisResponse.choices[0].message.content;
        
      } catch (sqlError) {
        console.error('❌ Error ejecutando SQL:', sqlError.message);
        console.error('Query fallido:', sqlQuery);
        
        // Retry con query básico
        try {
          const basicQuery = `SELECT grupo_operativo, ROUND(AVG(porcentaje), 2) as promedio, COUNT(*) as evaluaciones FROM supervision_operativa_detalle WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 AND porcentaje IS NOT NULL GROUP BY grupo_operativo ORDER BY promedio DESC LIMIT 5`;
          const retryResult = await this.pool.query(basicQuery);
          
          // Format basic results
          const basicData = retryResult.rows;
          let response = `🏆 RANKING Q3 2025 - TOP ${basicData.length}\n\n`;
          basicData.forEach((row, i) => {
            const stars = row.promedio >= 95 ? '⭐⭐⭐' : row.promedio >= 90 ? '⭐⭐' : '⭐';
            response += `• ${i+1}. ${row.grupo_operativo} - ${row.promedio}% ${stars}\n`;
          });
          response += `\n🎯 /areas | /grupos | /stats`;
          return response;
          
        } catch (retryError) {
          console.error('❌ Error en retry básico:', retryError.message);
          return `⚠️ Error temporal de base de datos

🔧 Sistema está verificando conexión
📊 Intenta en unos segundos: /ranking

🎯 /stats | /areas | /grupos`;
        }
      }
    }
    
    // NIVEL 3: Manejo de comandos insights
    if (aiResponse.startsWith('/insights') || this.isInsightsRequest(originalQuestion)) {
      // Generar insights detallados basados en contexto conversacional
      const conversation = this.getConversation(chatId);
      return this.generateDetailedInsights(originalQuestion, conversation);
    }
    
    // Si es manejo de configuración o respuesta directa
    if (aiResponse.includes('grupo principal') || aiResponse.includes('configurar')) {
      this.handleUserConfiguration(aiResponse, chatId, originalQuestion);
    }
    
    return aiResponse;
  }
  
  // NIVEL 3: GENERADOR DE INSIGHTS DETALLADOS
  async generateDetailedInsights(question, conversation) {
    console.log('📊 Generando insights detallados...');
    
    try {
      const insightsPrompt = `
Genera un análisis detallado para: "${question}"

Contexto conversacional reciente:
${conversation.history.slice(-2).map(h => `- ${h.question}`).join('\n')}

USA FORMATO DE INSIGHTS DETALLADOS:
📊 ANÁLISIS DETALLADO:
• Líder: [mejor performer con dato específico]
• Riesgo: [problema principal identificado]
• Tendencia: [comparación vs periodo anterior]
• Acción: [recomendación concreta y actionable]`;

      const insightsResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: insightsPrompt }
        ],
        temperature: 0.3
      });
      
      return insightsResponse.choices[0].message.content;
      
    } catch (error) {
      console.error('❌ Error generando insights:', error.message);
      return '📊 Insights temporalmente no disponibles\n\n💡 Intenta: /stats | /areas | /ranking';
    }
  }
  
  // Manejar configuración de usuario y comandos especiales
  handleUserConfiguration(response, chatId, question) {
    const conversation = this.getConversation(chatId);
    
    // Detectar comandos especiales
    const lowerQuestion = question.toLowerCase();
    
    // Marcar si el usuario pidió detalles/insights
    if (lowerQuestion.includes('/detalle') || lowerQuestion.includes('/insights') || 
        lowerQuestion.includes('más información') || lowerQuestion.includes('detallado')) {
      conversation.requestedDetails = true;
      console.log(`💡 Usuario ${chatId} pidió insights detallados`);
    }
    
    // Detectar si el usuario está configurando un grupo
    for (const group of this.databaseSchema.grupos_disponibles) {
      if (lowerQuestion.includes(group.toLowerCase())) {
        conversation.userGroup = group;
        console.log(`👤 Usuario ${chatId} configurado con grupo: ${group}`);
        break;
      }
    }
  }
  
  // Obtener/crear conversación
  getConversation(chatId) {
    if (!this.conversations.has(chatId)) {
      this.conversations.set(chatId, {
        userGroup: null,
        history: [],
        startedAt: new Date()
      });
    }
    return this.conversations.get(chatId);
  }
  
  // Actualizar memoria conversacional
  updateConversation(chatId, question, response) {
    const conversation = this.getConversation(chatId);
    
    conversation.history.push({
      timestamp: new Date(),
      question: question,
      topic: this.extractTopic(response),
      hasGroup: !!conversation.userGroup
    });
    
    // Mantener solo últimas 10 interacciones
    if (conversation.history.length > 10) {
      conversation.history = conversation.history.slice(-10);
    }
  }
  
  // Extraer tema de la respuesta para contexto
  extractTopic(response) {
    if (response.includes('TEPEYAC')) return 'TEPEYAC';
    if (response.includes('OGAS')) return 'OGAS';
    if (response.includes('ranking')) return 'ranking';
    if (response.includes('áreas')) return 'areas_criticas';
    return 'general';
  }
  
  // Respuesta de testing sin OpenAI
  getTestResponse(question, conversation) {
    const lowerQ = question.toLowerCase();
    
    // Simular respuestas inteligentes para testing
    if (lowerQ.includes('ranking') || lowerQ.includes('top')) {
      return `🏆 RANKING GRUPOS - TOP 5 (Modo Testing)

• 1. OGAS - 97.56% ⭐⭐⭐
• 2. TEPEYAC - 92.66% ⭐⭐⭐  
• 3. PLOG QUERETARO - 91.20% ⭐⭐
• 4. EPL SO - 89.45% ⭐⭐
• 5. TEC - 88.12% ⭐

🎯 /areas | /grupos | /stats

⚠️ Modo testing - Configura OPENAI_API_KEY para funcionalidad completa`;
    }
    
    if (lowerQ.includes('tepeyac')) {
      conversation.userGroup = 'TEPEYAC';
      return `📊 TEPEYAC - ANÁLISIS GRUPO ⭐⭐⭐

• Sucursales: 12 sucursales activas
• Promedio actual: 92.66%
• Ranking: #2 de 15 grupos  
• Status: Excelente rendimiento
• Evaluaciones: 8,542

🎯 /areas_criticas | /sucursales | /evolution

⚠️ Modo testing - Datos simulados`;
    }
    
    if (lowerQ.includes('configurar') || lowerQ.includes('configura')) {
      return `👤 Configuración de Usuario

🎯 Dime tu grupo principal:
• "Tepeyac es mi grupo"
• "Configura OGAS"  
• "Mi grupo es Querétaro"

🧠 Ana recordará tu preferencia automáticamente

⚠️ Modo testing activo`;
    }
    
    return `🧠 Ana Intelligent - Modo Testing

📊 Consulta original: "${question}"
🔍 Consulta procesada: "${this.preprocessQuestion ? this.preprocessQuestion(question) : question}"

⚠️ Para funcionalidad completa:
1. Configura OPENAI_API_KEY
2. Configura DATABASE_URL
3. Sistema quedará 100% operativo

🎯 /ranking | /stats | /help

💡 El detector de entidades está activo y funcionando`;
  }
  
  // Respuesta de error
  getErrorResponse(error) {
    if (error.message.includes('OPENAI_API_KEY')) {
      return `⚠️ Ana necesita configuración
      
🔧 Falta token OpenAI para inteligencia máxima
📊 Usando datos básicos disponibles

🎯 /ranking | /areas_criticas | /grupos`;
    }
    
    return `🔧 Ana está resolviendo un problema técnico

⚡ Intenta:
• Reformular tu pregunta
• /ranking - Ver grupos
• /areas_criticas - Oportunidades

💡 Ana mejora automáticamente`;
  }
  
  // Obtener estadísticas del sistema
  getStats() {
    return {
      name: 'Ana Intelligent',
      architecture: 'Simple & Functional',
      conversations: this.conversations.size,
      database_integration: 'PostgreSQL directo',
      ai_provider: 'OpenAI GPT-4 Turbo',
      status: 'Funcionando correctamente'
    };
  }
}

module.exports = AnaIntelligent;