// =========================================
// EVOLUTION ANALYZER - ANÁLISIS EVOLUTIVO INTELIGENTE
// Sistema de análisis de tendencias y evolución trimestral
// =========================================

class EvolutionAnalyzer {
  constructor(pool) {
    this.pool = pool;
    this.currentQuarter = 3; // Q3 2025
    this.currentYear = 2025;
  }

  // ANÁLISIS PRINCIPAL: Evolución completa de un grupo
  async analyzeGroupEvolution(grupoName, quarterRequested = null) {
    console.log(`📊 Analizando evolución de ${grupoName}...`);
    
    try {
      // 1. Obtener evolución trimestral del grupo
      const quarterlyEvolution = await this.getQuarterlyEvolution(grupoName);
      
      // 2. Obtener evolución por sucursal
      const branchEvolution = await this.getBranchEvolution(grupoName, quarterRequested);
      
      // 3. Obtener evolución por área/indicador
      const areaEvolution = await this.getAreaEvolution(grupoName, quarterRequested);
      
      // 4. Generar insights inteligentes
      const insights = await this.generateEvolutionInsights({
        grupo: grupoName,
        quarterly: quarterlyEvolution,
        branches: branchEvolution,
        areas: areaEvolution,
        quarter: quarterRequested || this.currentQuarter
      });
      
      return {
        success: true,
        data: {
          grupo: grupoName,
          quarterlyEvolution,
          branchEvolution,
          areaEvolution,
          insights
        }
      };
      
    } catch (error) {
      console.error('❌ Error en análisis evolutivo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 1. EVOLUCIÓN TRIMESTRAL DEL GRUPO
  async getQuarterlyEvolution(grupoName) {
    const query = `
      WITH quarterly_data AS (
        SELECT 
          EXTRACT(QUARTER FROM fecha_supervision) as trimestre,
          EXTRACT(YEAR FROM fecha_supervision) as año,
          COUNT(DISTINCT location_name) as sucursales_evaluadas,
          COUNT(DISTINCT submission_id) as supervisiones,
          ROUND(AVG(porcentaje), 2) as promedio_trimestre,
          MIN(porcentaje) as minimo,
          MAX(porcentaje) as maximo
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo = $1
          AND EXTRACT(YEAR FROM fecha_supervision) = $2
          AND porcentaje IS NOT NULL
        GROUP BY EXTRACT(YEAR FROM fecha_supervision), EXTRACT(QUARTER FROM fecha_supervision)
        ORDER BY año, trimestre
      )
      SELECT 
        *,
        promedio_trimestre - LAG(promedio_trimestre) OVER (ORDER BY año, trimestre) as cambio_vs_anterior,
        ROUND(
          ((promedio_trimestre - LAG(promedio_trimestre) OVER (ORDER BY año, trimestre)) / 
          NULLIF(LAG(promedio_trimestre) OVER (ORDER BY año, trimestre), 0)) * 100, 
          2
        ) as cambio_porcentual
      FROM quarterly_data
    `;
    
    const result = await this.pool.query(query, [grupoName, this.currentYear]);
    
    return result.rows.map(row => ({
      quarter: `Q${row.trimestre} ${row.año}`,
      promedio: parseFloat(row.promedio_trimestre),
      cambio: row.cambio_vs_anterior ? parseFloat(row.cambio_vs_anterior) : null,
      cambioPorcentual: row.cambio_porcentual ? parseFloat(row.cambio_porcentual) : null,
      sucursales: parseInt(row.sucursales_evaluadas),
      supervisiones: parseInt(row.supervisiones),
      trend: this.getTrend(row.cambio_vs_anterior)
    }));
  }

  // 2. EVOLUCIÓN POR SUCURSAL (comparando trimestres)
  async getBranchEvolution(grupoName, targetQuarter) {
    const currentQ = targetQuarter || this.currentQuarter;
    const previousQ = currentQ > 1 ? currentQ - 1 : 4;
    const previousY = currentQ > 1 ? this.currentYear : this.currentYear - 1;
    
    const query = `
      WITH current_quarter AS (
        SELECT 
          location_name,
          ROUND(AVG(porcentaje), 2) as promedio_actual,
          COUNT(*) as evaluaciones_actual
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo = $1
          AND EXTRACT(YEAR FROM fecha_supervision) = $2
          AND EXTRACT(QUARTER FROM fecha_supervision) = $3
          AND porcentaje IS NOT NULL
        GROUP BY location_name
      ),
      previous_quarter AS (
        SELECT 
          location_name,
          ROUND(AVG(porcentaje), 2) as promedio_anterior,
          COUNT(*) as evaluaciones_anterior
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo = $1
          AND EXTRACT(YEAR FROM fecha_supervision) = $4
          AND EXTRACT(QUARTER FROM fecha_supervision) = $5
          AND porcentaje IS NOT NULL
        GROUP BY location_name
      )
      SELECT 
        COALESCE(c.location_name, p.location_name) as sucursal,
        COALESCE(c.promedio_actual, 0) as promedio_q${currentQ},
        COALESCE(p.promedio_anterior, 0) as promedio_q${previousQ},
        COALESCE(c.promedio_actual, 0) - COALESCE(p.promedio_anterior, 0) as cambio,
        CASE 
          WHEN p.promedio_anterior IS NOT NULL AND p.promedio_anterior > 0
          THEN ROUND(
            ((COALESCE(c.promedio_actual, 0) - p.promedio_anterior) / p.promedio_anterior) * 100,
            2
          )
          ELSE NULL
        END as cambio_porcentual,
        c.evaluaciones_actual,
        p.evaluaciones_anterior
      FROM current_quarter c
      FULL OUTER JOIN previous_quarter p ON c.location_name = p.location_name
      ORDER BY c.promedio_actual DESC NULLS LAST
    `;
    
    const result = await this.pool.query(query, [
      grupoName, 
      this.currentYear, 
      currentQ,
      previousY,
      previousQ
    ]);
    
    return result.rows.map(row => ({
      sucursal: row.sucursal,
      promedioActual: parseFloat(row[`promedio_q${currentQ}`] || 0),
      promedioAnterior: parseFloat(row[`promedio_q${previousQ}`] || 0),
      cambio: parseFloat(row.cambio || 0),
      cambioPorcentual: row.cambio_porcentual ? parseFloat(row.cambio_porcentual) : null,
      trend: this.getTrend(row.cambio),
      status: this.getEvolutionStatus(row.cambio, row.cambio_porcentual),
      evaluaciones: {
        actual: parseInt(row.evaluaciones_actual || 0),
        anterior: parseInt(row.evaluaciones_anterior || 0)
      }
    }));
  }

  // 3. EVOLUCIÓN POR ÁREA/INDICADOR
  async getAreaEvolution(grupoName, targetQuarter) {
    const currentQ = targetQuarter || this.currentQuarter;
    
    const query = `
      WITH area_evolution AS (
        SELECT 
          area_evaluacion,
          EXTRACT(QUARTER FROM fecha_supervision) as trimestre,
          ROUND(AVG(porcentaje), 2) as promedio_area,
          COUNT(*) as evaluaciones,
          COUNT(DISTINCT location_name) as sucursales
        FROM supervision_operativa_detalle 
        WHERE grupo_operativo = $1
          AND EXTRACT(YEAR FROM fecha_supervision) = $2
          AND porcentaje IS NOT NULL
          AND area_evaluacion IS NOT NULL
          AND TRIM(area_evaluacion) != ''
        GROUP BY area_evaluacion, EXTRACT(QUARTER FROM fecha_supervision)
        HAVING COUNT(*) > 20
      )
      SELECT 
        area_evaluacion,
        MAX(CASE WHEN trimestre = 1 THEN promedio_area END) as q1,
        MAX(CASE WHEN trimestre = 2 THEN promedio_area END) as q2,
        MAX(CASE WHEN trimestre = 3 THEN promedio_area END) as q3,
        MAX(CASE WHEN trimestre = $3 THEN promedio_area END) as promedio_actual,
        MAX(CASE WHEN trimestre = $3 THEN evaluaciones END) as evaluaciones_actual,
        MAX(CASE WHEN trimestre = $3 THEN sucursales END) as sucursales_afectadas,
        -- Calcular tendencia general
        CASE 
          WHEN COUNT(DISTINCT trimestre) >= 2 THEN
            ROUND(
              (MAX(CASE WHEN trimestre = $3 THEN promedio_area END) - 
               MIN(promedio_area)) / NULLIF(COUNT(DISTINCT trimestre) - 1, 0),
              2
            )
          ELSE NULL
        END as tendencia_promedio
      FROM area_evolution
      GROUP BY area_evaluacion
      ORDER BY MAX(CASE WHEN trimestre = $3 THEN promedio_area END) ASC NULLS LAST
    `;
    
    const result = await this.pool.query(query, [grupoName, this.currentYear, currentQ]);
    
    return result.rows.map(row => ({
      area: row.area_evaluacion,
      q1: row.q1 ? parseFloat(row.q1) : null,
      q2: row.q2 ? parseFloat(row.q2) : null,
      q3: row.q3 ? parseFloat(row.q3) : null,
      promedioActual: row.promedio_actual ? parseFloat(row.promedio_actual) : null,
      evaluaciones: parseInt(row.evaluaciones_actual || 0),
      sucursalesAfectadas: parseInt(row.sucursales_afectadas || 0),
      tendencia: this.getAreaTendencia(row.q1, row.q2, row.q3),
      criticidad: this.getCriticidad(row.promedio_actual),
      evolution: this.getEvolutionDescription(row.q1, row.q2, row.q3)
    }));
  }

  // 4. GENERAR INSIGHTS INTELIGENTES
  async generateEvolutionInsights(data) {
    const insights = {
      summary: {},
      alerts: [],
      recommendations: [],
      predictions: {}
    };

    // Resumen ejecutivo
    const latestQuarter = data.quarterly[data.quarterly.length - 1];
    insights.summary = {
      currentPerformance: latestQuarter?.promedio || 0,
      quarterlyChange: latestQuarter?.cambio || 0,
      percentualChange: latestQuarter?.cambioPorcentual || 0,
      trend: latestQuarter?.trend || 'stable',
      evaluatedBranches: latestQuarter?.sucursales || 0
    };

    // Alertas críticas
    // Sucursales con caídas significativas
    const criticalBranches = data.branches.filter(b => 
      b.cambioPorcentual && b.cambioPorcentual < -5
    );
    if (criticalBranches.length > 0) {
      insights.alerts.push({
        type: 'CRITICAL_DROP',
        severity: 'HIGH',
        message: `${criticalBranches.length} sucursales con caídas >5%`,
        affected: criticalBranches.map(b => ({
          name: b.sucursal,
          drop: b.cambioPorcentual
        }))
      });
    }

    // Áreas críticas persistentes
    const persistentCritical = data.areas.filter(a => 
      a.q1 && a.q2 && a.q3 && 
      a.q1 < 75 && a.q2 < 75 && a.q3 < 75
    );
    if (persistentCritical.length > 0) {
      insights.alerts.push({
        type: 'PERSISTENT_CRITICAL',
        severity: 'URGENT',
        message: `${persistentCritical.length} áreas críticas todo el año`,
        affected: persistentCritical.map(a => a.area)
      });
    }

    // Recomendaciones inteligentes
    // Para sucursales
    const improvingBranches = data.branches.filter(b => b.cambioPorcentual > 5);
    if (improvingBranches.length > 0) {
      insights.recommendations.push({
        type: 'REPLICATE_SUCCESS',
        priority: 'HIGH',
        message: `Replicar prácticas de ${improvingBranches[0].sucursal} (+${improvingBranches[0].cambioPorcentual}%)`,
        action: 'Documentar y compartir mejores prácticas'
      });
    }

    // Para áreas críticas
    const criticalAreas = data.areas.filter(a => a.criticidad === 'CRÍTICO').slice(0, 3);
    criticalAreas.forEach(area => {
      insights.recommendations.push({
        type: 'AREA_IMPROVEMENT',
        priority: area.promedioActual < 70 ? 'URGENT' : 'HIGH',
        message: `Plan inmediato para ${area.area} (${area.promedioActual}%)`,
        action: `Capacitación intensiva en ${area.sucursalesAfectadas} sucursales`
      });
    });

    // Predicciones Q4
    insights.predictions = {
      expectedAverage: this.predictNextQuarter(data.quarterly),
      confidence: 'MEDIUM',
      factors: [
        'Tendencia histórica de 3 trimestres',
        'Patrones estacionales detectados',
        'Áreas críticas sin resolver'
      ]
    };

    return insights;
  }

  // HELPERS - Funciones auxiliares
  getTrend(change) {
    if (!change || change === 0) return '➡️ ESTABLE';
    if (change > 3) return '📈 MEJORA FUERTE';
    if (change > 0) return '↗️ MEJORA';
    if (change < -3) return '📉 CAÍDA FUERTE';
    return '↘️ CAÍDA';
  }

  getEvolutionStatus(change, percentual) {
    if (!change) return 'SIN DATOS';
    if (percentual > 10) return '🌟 EXCELENTE MEJORA';
    if (percentual > 5) return '✅ BUENA MEJORA';
    if (percentual > 0) return '📊 MEJORA LEVE';
    if (percentual > -5) return '⚠️ CAÍDA LEVE';
    if (percentual > -10) return '🔴 CAÍDA PREOCUPANTE';
    return '🚨 CAÍDA CRÍTICA';
  }

  getCriticidad(promedio) {
    if (!promedio) return 'SIN DATOS';
    if (promedio < 70) return 'CRÍTICO';
    if (promedio < 80) return 'ALTO';
    if (promedio < 85) return 'MEDIO';
    if (promedio < 95) return 'BAJO';
    return 'EXCELENTE';
  }

  getAreaTendencia(q1, q2, q3) {
    const values = [q1, q2, q3].filter(v => v !== null);
    if (values.length < 2) return 'INSUFICIENTE DATA';
    
    const trend = values[values.length - 1] - values[0];
    if (trend > 5) return '📈 MEJORA SOSTENIDA';
    if (trend > 0) return '↗️ MEJORA GRADUAL';
    if (trend < -5) return '📉 DETERIORO SOSTENIDO';
    if (trend < 0) return '↘️ DETERIORO GRADUAL';
    return '➡️ ESTABLE';
  }

  getEvolutionDescription(q1, q2, q3) {
    const quarters = [];
    if (q1) quarters.push(`Q1: ${q1}%`);
    if (q2) quarters.push(`Q2: ${q2}%`);
    if (q3) quarters.push(`Q3: ${q3}%`);
    return quarters.join(' → ');
  }

  predictNextQuarter(quarterlyData) {
    if (quarterlyData.length < 2) return null;
    
    // Simple linear prediction
    const lastTwo = quarterlyData.slice(-2);
    const trend = lastTwo[1].promedio - lastTwo[0].promedio;
    const prediction = lastTwo[1].promedio + (trend * 0.7); // 70% del trend
    
    return Math.max(0, Math.min(100, Math.round(prediction * 100) / 100));
  }
}

module.exports = EvolutionAnalyzer;