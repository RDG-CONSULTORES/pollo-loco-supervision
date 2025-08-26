// =========================================
// COMPREHENSIVE ANALYZER - ANÁLISIS COMPLETO MULTI-DIMENSIONAL
// Responde consultas complejas con múltiples dimensiones
// =========================================

const EvolutionAnalyzer = require('./evolution-analyzer');

class ComprehensiveAnalyzer {
  constructor(pool, llmManager) {
    this.pool = pool;
    this.llm = llmManager;
    this.evolutionAnalyzer = new EvolutionAnalyzer(pool);
    this.currentQuarter = 3;
    this.currentYear = 2025;
  }

  // ANÁLISIS COMPLETO: Sucursales + Calificaciones + Áreas + Evolución
  async analyzeComprehensiveRequest(question, grupo = null, quarter = null) {
    console.log(`🧠 Análisis comprehensivo iniciado para: "${question}"`);
    
    try {
      // 1. Detectar componentes de la pregunta
      const components = await this.detectQueryComponents(question);
      
      // 2. Determinar grupo y trimestre
      const targetGroup = grupo || components.grupo || 'TEPEYAC';
      const targetQuarter = quarter || components.quarter || this.detectCurrentQuarter(question);
      
      // 3. Ejecutar queries en paralelo
      const [sucursalesData, areasData, evolutionData] = await Promise.all([
        this.getSucursalesCalificaciones(targetGroup, targetQuarter),
        this.getAreasOportunidad(targetGroup, targetQuarter),
        this.evolutionAnalyzer.analyzeGroupEvolution(targetGroup, targetQuarter)
      ]);
      
      // 4. Integrar datos con LLM para respuesta inteligente
      const comprehensiveResponse = await this.generateIntelligentResponse({
        question,
        grupo: targetGroup,
        quarter: targetQuarter,
        sucursales: sucursalesData,
        areas: areasData,
        evolution: evolutionData.data,
        components
      });
      
      return comprehensiveResponse;
      
    } catch (error) {
      console.error('❌ Error en análisis comprehensivo:', error);
      throw error;
    }
  }

  // Detectar componentes de la pregunta usando análisis local
  async detectQueryComponents(question) {
    const lowerQ = question.toLowerCase();
    
    const components = {
      needsSucursales: lowerQ.includes('sucursales') || lowerQ.includes('branches'),
      needsCalificaciones: lowerQ.includes('calificacion') || lowerQ.includes('promedio'),
      needsAreas: lowerQ.includes('areas') || lowerQ.includes('oportunidad') || lowerQ.includes('indicador'),
      needsEvolution: lowerQ.includes('evolucion') || lowerQ.includes('comparativ') || lowerQ.includes('histor'),
      needsTrend: lowerQ.includes('subieron') || lowerQ.includes('bajaron') || lowerQ.includes('cambio'),
      timeframe: this.detectTimeframe(question),
      grupo: this.detectGrupo(question),
      quarter: this.detectQuarter(question)
    };
    
    return components;
  }

  // 1. OBTENER SUCURSALES Y CALIFICACIONES
  async getSucursalesCalificaciones(grupo, quarter) {
    const query = `
      WITH sucursal_data AS (
        SELECT 
          location_name as sucursal,
          COUNT(DISTINCT submission_id) as supervisiones,
          ROUND(AVG(porcentaje), 2) as promedio_actual,
          MIN(porcentaje) as minimo,
          MAX(porcentaje) as maximo,
          COUNT(DISTINCT area_evaluacion) as areas_evaluadas
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo = $1
          AND EXTRACT(YEAR FROM fecha_supervision) = $2
          AND EXTRACT(QUARTER FROM fecha_supervision) = $3
          AND porcentaje IS NOT NULL
        GROUP BY location_name
      ),
      quarter_comparison AS (
        SELECT 
          location_name as sucursal,
          ROUND(AVG(porcentaje), 2) as promedio_anterior
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo = $1
          AND EXTRACT(YEAR FROM fecha_supervision) = $2
          AND EXTRACT(QUARTER FROM fecha_supervision) = CASE 
            WHEN $3 > 1 THEN $3 - 1 
            ELSE 4 
          END
          AND porcentaje IS NOT NULL
        GROUP BY location_name
      )
      SELECT 
        s.*,
        q.promedio_anterior,
        s.promedio_actual - COALESCE(q.promedio_anterior, s.promedio_actual) as cambio,
        CASE 
          WHEN q.promedio_anterior IS NOT NULL AND q.promedio_anterior > 0
          THEN ROUND(((s.promedio_actual - q.promedio_anterior) / q.promedio_anterior * 100), 2)
          ELSE NULL
        END as cambio_porcentual
      FROM sucursal_data s
      LEFT JOIN quarter_comparison q ON s.sucursal = q.sucursal
      ORDER BY s.promedio_actual DESC
    `;
    
    const result = await this.pool.query(query, [grupo, this.currentYear, quarter]);
    
    return result.rows.map(row => ({
      sucursal: row.sucursal,
      promedio: parseFloat(row.promedio_actual),
      supervisiones: parseInt(row.supervisiones),
      cambio: row.cambio ? parseFloat(row.cambio) : null,
      cambioPorcentual: row.cambio_porcentual ? parseFloat(row.cambio_porcentual) : null,
      trend: this.getTrend(row.cambio),
      status: this.getStatus(row.promedio_actual),
      areasEvaluadas: parseInt(row.areas_evaluadas)
    }));
  }

  // 2. OBTENER ÁREAS DE OPORTUNIDAD
  async getAreasOportunidad(grupo, quarter) {
    const query = `
      SELECT 
        area_evaluacion,
        ROUND(AVG(porcentaje), 2) as promedio,
        COUNT(*) as evaluaciones,
        COUNT(DISTINCT location_name) as sucursales_afectadas,
        STRING_AGG(DISTINCT 
          CASE 
            WHEN porcentaje < 75 THEN location_name 
            ELSE NULL 
          END, ', '
        ) as sucursales_criticas
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo = $1
        AND EXTRACT(YEAR FROM fecha_supervision) = $2
        AND EXTRACT(QUARTER FROM fecha_supervision) = $3
        AND porcentaje IS NOT NULL
        AND area_evaluacion IS NOT NULL
        AND TRIM(area_evaluacion) != ''
      GROUP BY area_evaluacion
      HAVING AVG(porcentaje) < 85
      ORDER BY promedio ASC
      LIMIT 10
    `;
    
    const result = await this.pool.query(query, [grupo, this.currentYear, quarter]);
    
    return result.rows.map(row => ({
      area: row.area_evaluacion,
      promedio: parseFloat(row.promedio),
      evaluaciones: parseInt(row.evaluaciones),
      sucursalesAfectadas: parseInt(row.sucursales_afectadas),
      sucursalesCriticas: row.sucursales_criticas ? row.sucursales_criticas.split(', ') : [],
      criticidad: row.promedio < 75 ? 'CRÍTICO' : 'ALTO',
      prioridad: row.promedio < 70 ? 'URGENTE' : row.promedio < 75 ? 'ALTA' : 'MEDIA'
    }));
  }

  // 3. GENERAR RESPUESTA INTELIGENTE CON LLM
  async generateIntelligentResponse(data) {
    // Para consultas complejas, usar formato estructurado directo
    if (data.components.needsSucursales && data.components.needsCalificaciones && data.components.needsAreas) {
      return this.generateStructuredComprehensiveResponse(data);
    }
    
    // Para otras consultas, usar LLM para formato inteligente
    const prompt = `Como Ana, analista experta de El Pollo Loco, genera una respuesta estilo Falcon AI para esta consulta:

PREGUNTA: "${data.question}"

DATOS DISPONIBLES:
- Grupo: ${data.grupo}
- Trimestre: Q${data.quarter} ${this.currentYear}
- Sucursales supervisadas: ${data.sucursales.length}
- Áreas críticas identificadas: ${data.areas.length}

SUCURSALES Y CALIFICACIONES:
${JSON.stringify(data.sucursales.slice(0, 10), null, 2)}

ÁREAS DE OPORTUNIDAD:
${JSON.stringify(data.areas.slice(0, 5), null, 2)}

EVOLUCIÓN TRIMESTRAL:
${JSON.stringify(data.evolution.quarterlyEvolution, null, 2)}

FORMATO OBLIGATORIO:
- Usa emojis apropiados (🏢📊🚨📈📉)
- Datos concisos y específicos
- Incluye cambios porcentuales
- Máximo 20 líneas
- Termina con comandos relacionados

RESPONDE:`;

    try {
      const llmResponse = await this.llm.generate(prompt);
      return llmResponse.response;
    } catch (error) {
      console.error('❌ Error generando respuesta LLM:', error);
      return this.generateStructuredComprehensiveResponse(data);
    }
  }

  // Respuesta estructurada comprehensiva (fallback o preferida)
  generateStructuredComprehensiveResponse(data) {
    const q = data.quarter;
    let response = `📅 ${data.grupo} Q${q} 2025 - REPORTE COMPLETO\n\n`;
    
    // Sección 1: Sucursales supervisadas
    response += `🏢 SUCURSALES SUPERVISADAS (${data.sucursales.length}):\n`;
    const topSucursales = data.sucursales.slice(0, 5);
    topSucursales.forEach((s, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}️⃣`;
      const trend = s.cambioPorcentual > 0 ? '📈' : s.cambioPorcentual < 0 ? '📉' : '➡️';
      response += `${medal} ${s.sucursal}: ${s.promedio}% ${trend}`;
      if (s.cambioPorcentual) {
        response += ` (${s.cambioPorcentual > 0 ? '+' : ''}${s.cambioPorcentual}%)`;
      }
      response += '\n';
    });
    
    if (data.sucursales.length > 5) {
      response += `   ...y ${data.sucursales.length - 5} más\n`;
    }
    
    // Sección 2: Áreas de oportunidad
    response += `\n🚨 ÁREAS DE OPORTUNIDAD Q${q}:\n`;
    data.areas.slice(0, 3).forEach((a, i) => {
      const icon = a.criticidad === 'CRÍTICO' ? '🔥' : '⚠️';
      response += `${i+1}. ${a.area}: ${a.promedio}% ${icon}\n`;
      response += `   └── ${a.sucursalesAfectadas} sucursales afectadas\n`;
    });
    
    // Sección 3: Evolución trimestral
    if (data.evolution && data.evolution.insights) {
      response += `\n📊 EVOLUCIÓN 2025:\n`;
      data.evolution.quarterlyEvolution.forEach(q => {
        const icon = q.trend.includes('MEJORA') ? '✅' : q.trend.includes('CAÍDA') ? '🔴' : '➡️';
        response += `${q.quarter}: ${q.promedio}% ${icon}\n`;
      });
      
      // Predicción Q4
      if (data.evolution.insights.predictions?.expectedAverage) {
        response += `🔮 Predicción Q4: ${data.evolution.insights.predictions.expectedAverage}%\n`;
      }
    }
    
    // Recomendaciones
    response += `\n💡 RECOMENDACIÓN:\n`;
    const topArea = data.areas[0];
    if (topArea) {
      response += `Priorizar ${topArea.area} en las ${topArea.sucursalesAfectadas} sucursales\n`;
    }
    
    response += `\n🎯 /plan_mejora_${data.grupo.toLowerCase()} | /detalle_q${q}_${data.grupo.toLowerCase()} | /evolution`;
    
    return response;
  }

  // HELPERS
  detectTimeframe(question) {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('este trimestre') || lowerQ.includes('trimestre actual')) {
      return 'current_quarter';
    }
    if (lowerQ.includes('este año') || lowerQ.includes('2025')) {
      return 'current_year';
    }
    return 'current_quarter';
  }

  detectGrupo(question) {
    const grupos = [
      'TEPEYAC', 'OGAS', 'PLOG QUERETARO', 'EPL SO', 'TEC', 
      'EXPO', 'EFM', 'CRR', 'RAP', 'PLOG LAGUNA'
    ];
    
    const lowerQ = question.toLowerCase();
    for (const grupo of grupos) {
      if (lowerQ.includes(grupo.toLowerCase())) {
        return grupo;
      }
    }
    return null;
  }

  detectQuarter(question) {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('q1') || lowerQ.includes('primer trimestre')) return 1;
    if (lowerQ.includes('q2') || lowerQ.includes('segundo trimestre')) return 2;
    if (lowerQ.includes('q3') || lowerQ.includes('tercer trimestre')) return 3;
    if (lowerQ.includes('q4') || lowerQ.includes('cuarto trimestre')) return 4;
    return null;
  }

  detectCurrentQuarter(question) {
    const quarter = this.detectQuarter(question);
    if (quarter) return quarter;
    
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('este trimestre') || lowerQ.includes('trimestre actual')) {
      return this.currentQuarter;
    }
    return this.currentQuarter;
  }

  getTrend(change) {
    if (!change || change === 0) return '➡️';
    return change > 0 ? '📈' : '📉';
  }

  getStatus(promedio) {
    if (promedio >= 95) return '⭐ EXCELENTE';
    if (promedio >= 90) return '✅ MUY BUENA';
    if (promedio >= 85) return '👍 BUENA';
    if (promedio >= 80) return '📊 REGULAR';
    return '⚠️ NECESITA MEJORA';
  }
}

module.exports = ComprehensiveAnalyzer;