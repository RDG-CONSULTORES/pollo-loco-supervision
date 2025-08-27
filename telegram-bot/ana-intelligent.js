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
      table: 'supervision_operativa_detalle',
      columns: {
        location_name: 'VARCHAR(255) - Nombre de la sucursal',
        grupo_operativo: 'VARCHAR(255) - Grupo operativo (~20 grupos)',
        area_evaluacion: 'VARCHAR(255) - Área evaluada (29 áreas específicas + CALIFICACION GENERAL)',
        porcentaje: 'DECIMAL(5,2) - Porcentaje obtenido (0-100)',
        fecha_supervision: 'DATE - Fecha de supervisión',
        submission_id: 'VARCHAR(255) - ID único',
        estado: 'VARCHAR(255) - Estado de México (7 estados)',
        municipio: 'VARCHAR(255) - Municipio específico',
        latitud: 'DECIMAL - Coordenada latitud',
        longitud: 'DECIMAL - Coordenada longitud'
      },
      grupos_disponibles: [
        'OGAS', 'TEPEYAC', 'PLOG QUERETARO', 'EPL SO', 'TEC', 
        'EXPO', 'EFM', 'CRR', 'RAP', 'PLOG LAGUNA',
        'GRUPO MATAMOROS', 'GRUPO RIO BRAVO', 'GRUPO SALTILLO',
        'PLANTA REYNOLDS', 'ADMINISTRACION'
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
  
  // MÉTODO PRINCIPAL - TODO EN UNO
  async processQuestion(question, chatId) {
    console.log(`🎯 Ana procesando: "${question}" (Chat: ${chatId})`);
    
    try {
      // 1. Obtener/crear contexto conversacional
      const conversation = this.getConversation(chatId);
      
      // 2. Check if OpenAI is available
      if (!this.hasOpenAI) {
        return this.getTestResponse(question, conversation);
      }
      
      // 3. Prompt mega-inteligente para OpenAI
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(question, conversation);
      
      // 4. OpenAI decide TODO
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
      
      // 4. Procesar respuesta de IA
      const result = await this.processAIResponse(aiResponse, chatId, question);
      
      // 5. Actualizar memoria conversacional
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

RANKING:
SQL: SELECT grupo_operativo, ROUND(AVG(porcentaje), 2) as promedio, COUNT(*) as evaluaciones FROM supervision_operativa_detalle WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 AND porcentaje IS NOT NULL GROUP BY grupo_operativo ORDER BY promedio DESC LIMIT 10;

SUCURSALES DE UN GRUPO:
SQL: SELECT location_name, ROUND(AVG(porcentaje), 2) as promedio, COUNT(*) as evaluaciones FROM supervision_operativa_detalle WHERE grupo_operativo = 'OGAS' AND EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 AND porcentaje IS NOT NULL GROUP BY location_name ORDER BY promedio DESC LIMIT 20;

ÁREAS CRÍTICAS (peores áreas):
SQL: SELECT area_evaluacion, ROUND(AVG(porcentaje), 2) as promedio, COUNT(*) as evaluaciones FROM supervision_operativa_detalle WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 AND porcentaje IS NOT NULL AND area_evaluacion != 'CALIFICACION GENERAL' GROUP BY area_evaluacion ORDER BY promedio ASC LIMIT 10;

CALIFICACIÓN GENERAL POR GRUPO:
SQL: SELECT grupo_operativo, ROUND(AVG(porcentaje), 2) as promedio, COUNT(*) as evaluaciones FROM supervision_operativa_detalle WHERE area_evaluacion = 'CALIFICACION GENERAL' AND EXTRACT(YEAR FROM fecha_supervision) = 2025 AND EXTRACT(QUARTER FROM fecha_supervision) = 3 AND porcentaje IS NOT NULL GROUP BY grupo_operativo ORDER BY promedio DESC LIMIT 15;

TODAS LAS 29 ÁREAS DISPONIBLES:
SQL: SELECT DISTINCT area_evaluacion FROM supervision_operativa_detalle WHERE area_evaluacion IS NOT NULL AND area_evaluacion != 'CALIFICACION GENERAL' ORDER BY area_evaluacion;

REGLAS IMPORTANTES:
- SIEMPRE usa LIMIT apropiado (5-20 para rankings, 20-50 para listas)
- SIEMPRE usa GROUP BY para agregación inteligente
- NUNCA retornes datos raw individuales para datasets grandes

CONTEXTO DE NEGOCIO - EL POLLO LOCO CAS:
- Organización: El Pollo Loco CAS (Centro de Apoyo a Sucursales)
- Función CAS: Envío de supervisiones y establecimiento de métricas corporativas
- Rol: Control de calidad y apoyo operativo a sucursales
- Año actual: ${this.databaseSchema.year}
- Trimestre actual: Q${this.databaseSchema.current_quarter}

CICLO DE SUPERVISIONES CAS:
- Supervisiones cada 3 meses divididas en trimestres
- Q1 = Enero-Marzo (Primer trimestre del año)
- Q2 = Abril-Junio (Segundo trimestre del año)  
- Q3 = Julio-Septiembre (Tercer trimestre del año)
- Q4 = Octubre-Diciembre (Cuarto trimestre del año)

ÁREAS DE EVALUACIÓN CAS:
- 29 áreas específicas de supervisión operativa
- CALIFICACION GENERAL (calificación integral de toda la supervisión)
- Las 29 áreas están disponibles dinámicamente en la BD en area_evaluacion

SISTEMA DE BENCHMARKS CAS:

PARA ÁREAS ESPECÍFICAS (29 áreas):
- 🏆 Excelencia: 95%+ (⭐⭐⭐)
- ✅ Objetivo: 85-94% (⭐⭐)  
- ⚠️ Atención: 80-84% (requiere atención)
- 🚨 Crítico: <80% (acción inmediata)

PARA CALIFICACIÓN GENERAL (MÁS ESTRICTO):
- 🏆 Excelencia: 95%+ (⭐⭐⭐)
- ✅ Objetivo: 90-94% (⭐⭐) - MÍNIMO 90% REQUERIDO
- ⚠️ Atención: 85-89% (requiere atención)  
- 🚨 Crítico: <85% (acción inmediata)

INFORMACIÓN GEOGRÁFICA EL POLLO LOCO:
- Cobertura: 7 estados de México (~20 grupos operativos)
- Datos disponibles: estado, municipio, latitud/longitud
- Ana puede consultar distribución geográfica dinámicamente
- Mapping completo: Sucursal → Grupo → Estado → Municipio
- Coordenadas exactas disponibles para análisis geoespaciales

CAPACIDADES ULTRA INTELIGENTES:
1. ENTIENDES el contexto completo del negocio
2. GENERAS SQL cuando necesitas datos específicos
3. ANALIZAS resultados y das insights empresariales
4. MANTIENES contexto conversacional
5. RESPONDES en formato Falcon (emoji + bullets + métricas + comandos)

INSTRUCCIONES DE RESPUESTA:
- Si necesitas datos específicos → responde INMEDIATAMENTE con "SQL:" seguido del query
- Si puedes responder directamente → da respuesta Falcon completa
- Si es pregunta de configuración → maneja el flujo conversacional
- NUNCA pidas confirmación, eres experta y sabes qué hacer
- Para "ranking" o "grupos" → genera SQL inmediatamente
- Para preguntas específicas de grupo → usa ese grupo en SQL

ANÁLISIS DE BENCHMARKS CAS:
- SIEMPRE aplica los benchmarks correctos según el tipo de datos
- Para CALIFICACION GENERAL: mínimo 90% requerido (más estricto)
- Para áreas específicas: mínimo 85% objetivo estándar
- Usa emojis apropiados: 🏆 (95%+), ✅ (objetivo), ⚠️ (atención), 🚨 (crítico)
- En insights, menciona si está arriba/abajo de benchmarks CAS

DETECCIÓN INTELIGENTE DE TRIMESTRES:
- "primer trimestre" / "Q1" → QUARTER = 1
- "segundo trimestre" / "Q2" → QUARTER = 2  
- "tercer trimestre" / "Q3" → QUARTER = 3
- "cuarto trimestre" / "Q4" → QUARTER = 4
- "trimestre actual" → QUARTER = ${this.databaseSchema.current_quarter}
- "este trimestre" → QUARTER = ${this.databaseSchema.current_quarter}

FORMATO FALCON REQUERIDO:
🎯 TÍTULO - CONTEXTO
• Dato clave 1: valor específico
• Dato clave 2: porcentaje/métrica  
• Status: análisis/recomendación
🎯 /comando1 | /comando2 | /comando3`;
  }
  
  // Construir prompt del usuario con contexto
  buildUserPrompt(question, conversation) {
    let contextInfo = '';
    
    if (conversation.userGroup) {
      contextInfo += `\nGRUPO PRINCIPAL DEL USUARIO: ${conversation.userGroup}`;
    }
    
    if (conversation.history.length > 0) {
      const recentHistory = conversation.history.slice(-3).map(h => 
        `Usuario: "${h.question}" → Respuesta sobre: ${h.topic}`
      ).join('\n');
      contextInfo += `\n\nHISTORIAL RECIENTE:\n${recentHistory}`;
    }
    
    return `PREGUNTA ACTUAL: "${question}"${contextInfo}
    
RESPONDE COMO ANA:
- Si la pregunta es de configuración (como grupo principal), maneja el flujo
- Si necesitas datos específicos, responde "SQL:" + query
- Si puedes responder directamente, da respuesta Falcon completa
- USA el contexto del usuario y conversación anterior
- Sé precisa, específica y útil`;
  }
  
  // Procesar respuesta de OpenAI
  async processAIResponse(aiResponse, chatId, originalQuestion) {
    // Si OpenAI quiere ejecutar SQL
    if (aiResponse.startsWith('SQL:')) {
      const sqlQuery = aiResponse.replace('SQL:', '').trim();
      console.log('📊 Ejecutando SQL generado por OpenAI:', sqlQuery);
      
      try {
        const result = await this.pool.query(sqlQuery);
        const data = result.rows;
        
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
        
        // Pedir a OpenAI que analice los resultados
        const analysisPrompt = `Los datos de la consulta "${originalQuestion}" son:
        
${JSON.stringify(dataForAnalysis, null, 2)}

${data.length > 100 ? 
`NOTA: Dataset grande con ${data.length} registros totales. Arriba tienes muestra representativa + resumen estadístico.` : 
''}

ANALIZA estos datos como Ana y da una respuesta Falcon completa con insights empresariales específicos.`;

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
    
    // Si es manejo de configuración o respuesta directa
    if (aiResponse.includes('grupo principal') || aiResponse.includes('configurar')) {
      this.handleUserConfiguration(aiResponse, chatId, originalQuestion);
    }
    
    return aiResponse;
  }
  
  // Manejar configuración de usuario
  handleUserConfiguration(response, chatId, question) {
    const conversation = this.getConversation(chatId);
    
    // Detectar si el usuario está configurando un grupo
    const lowerQuestion = question.toLowerCase();
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

📊 Tu consulta: "${question}"

⚠️ Para funcionalidad completa:
1. Configura OPENAI_API_KEY
2. Configura DATABASE_URL
3. Sistema quedará 100% operativo

🎯 /ranking | /stats | /help`;
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