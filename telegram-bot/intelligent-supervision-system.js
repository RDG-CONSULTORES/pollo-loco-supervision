// Intelligent Supervision Analysis System - Based on REAL supervision_operativa_detalle structure
const { Pool } = require('pg');

class IntelligentSupervisionSystem {
  constructor(pool) {
    this.pool = pool;
    
    // REAL grupos operativos from database
    this.gruposOperativos = [
      'TEPEYAC', 'OGAS', 'PLOG QUERETARO', 'TEC', 'EXPO', 'PLOG NUEVO LEON',
      'PLOG LAGUNA', 'GRUPO MATAMOROS', 'OCHTER TAMPICO', 'GRUPO SALTILLO',
      'CRR', 'EFM', 'RAP', 'GRUPO CANTERA ROSA (MORELIA)', 'GRUPO CENTRITO'
    ];
    
    // REAL 29 areas de evaluacion from database
    this.areasEvaluacion = [
      'ALMACEN GENERAL', 'ASADORES', 'CONSERVADOR PAPA FRITA', 'EXTERIOR SUCURSAL',
      'TIEMPOS DE SERVICIO', 'FREIDORA DE PAPA', 'BARRA DE SERVICIO', 
      'AVISO DE FUNCIONAMIENTO, BITACORAS, CARPETA DE FUMIGACION CONTROL',
      'REFRIGERADORES DE SERVICIO', 'ALMACEN QUÍMICOS', 'BAÑO CLIENTES',
      'CONGELADOR PAPA', 'MAQUINA DE HIELO', 'ALMACEN JARABES', 'HORNOS',
      'CAJAS DE TOTOPO EMPACADO', 'BARRA DE SALSAS', 'CUARTO FRIO 1',
      'PLANCHA Y MESA DE TRABAJO PARA QUESADILLAS Y BURRITOS', 'COMEDOR',
      'AREA COCINA FRIA/CALIENTE', 'DISPENSADOR DE REFRESCOS', 'LAVADO DE UTENSILIOS',
      'ESTACION DE LAVADO DE MANOS', 'BAÑO DE EMPLEADOS', 'CUARTO FRIO 2',
      'PROCESO MARINADO', 'Area Marinado', 'FREIDORAS'
    ];
    
    // Quarterly periods for 2025
    this.trimesters = {
      'Q1': { start: '2025-01-01', end: '2025-03-31', name: 'Primer Trimestre 2025' },
      'Q2': { start: '2025-04-01', end: '2025-06-30', name: 'Segundo Trimestre 2025' },
      'Q3': { start: '2025-07-01', end: '2025-09-30', name: 'Tercer Trimestre 2025' },
      'Q4': { start: '2025-10-01', end: '2025-12-31', name: 'Cuarto Trimestre 2025' }
    };
  }

  // INTELLIGENT QUESTION ANALYSIS
  async analyzeIntelligentQuestion(question) {
    const lower = question.toLowerCase();
    
    const analysis = {
      intent: this.detectAdvancedIntent(lower),
      entity: this.detectEntity(lower),
      trimester: this.detectTrimester(lower),
      comparison: this.detectComparison(lower),
      quantity: this.detectQuantity(lower),
      areas: this.detectSpecificAreas(lower),
      contextLevel: this.determineContextLevel(lower)
    };
    
    console.log('🧠 Intelligent Analysis:', JSON.stringify(analysis, null, 2));
    return analysis;
  }

  detectAdvancedIntent(lower) {
    // ENHANCED: Advanced business question detection
    
    // Areas de oportunidad - enhanced detection
    if (lower.includes('oportunidad') || lower.includes('oportunidades') || lower.includes('mejorar') || lower.includes('áreas a mejorar')) {
      if (lower.includes('grupo')) return 'group_opportunities';
      if (lower.includes('sucursal')) return 'sucursal_opportunities';
      // If entity is grupo but no explicit 'grupo' word, still treat as group
      return 'group_opportunities'; // Default to group opportunities
    }
    
    // ENHANCED: Performance level analysis
    if (lower.includes('crítico') || lower.includes('critico') || lower.includes('críticos')) {
      return 'critical_performance_analysis';
    }
    
    if (lower.includes('excelente') || lower.includes('excelentes') || lower.includes('líderes') || lower.includes('lideres')) {
      return 'excellent_performance_analysis';
    }
    
    // ENHANCED: Business intelligence queries
    if (lower.includes('benchmarks') || lower.includes('benchmark') || lower.includes('estándares') || lower.includes('estandares')) {
      return 'benchmark_analysis';
    }
    
    if (lower.includes('tendencia') || lower.includes('tendencias') || lower.includes('evolución') || lower.includes('evolucion')) {
      return 'trend_analysis';
    }
    
    // ENHANCED: Competitive analysis
    if (lower.includes('competencia') || lower.includes('competitivo') || lower.includes('versus otros')) {
      return 'competitive_analysis';
    }
    
    // Comparativos
    if (lower.includes('compar') || lower.includes('versus') || lower.includes('vs')) {
      if (lower.includes('trimestre')) return 'quarterly_comparison';
      if (lower.includes('grupo')) return 'group_comparison';
      return 'general_comparison';
    }
    
    // Rankings
    if (lower.includes('top') || lower.includes('mejor') || lower.includes('ranking')) {
      if (lower.includes('grupo')) return 'group_ranking';
      if (lower.includes('sucursal')) return 'sucursal_ranking';
      if (lower.includes('area')) return 'area_ranking';
      return 'general_ranking';
    }
    
    // ENHANCED: Business context queries
    if (lower.includes('percentil') || lower.includes('posición') || lower.includes('posicion') || lower.includes('lugar')) {
      return 'position_analysis';
    }
    
    if (lower.includes('distribución') || lower.includes('distribucion') || lower.includes('segmentación')) {
      return 'distribution_analysis';
    }
    
    // Calificaciones específicas
    if (lower.includes('calificación') || lower.includes('calificacion')) {
      if (lower.includes('global') || lower.includes('general')) return 'global_score';
      if (lower.includes('grupo')) return 'group_score';
      if (lower.includes('sucursal')) return 'sucursal_score';
      return 'general_score';
    }
    
    // ENHANCED: Context-aware area analysis
    if (this.areasEvaluacion.some(area => lower.includes(area.toLowerCase().substring(0, 6)))) {
      if (lower.includes('críticas') || lower.includes('problemas')) return 'critical_areas_analysis';
      return 'area_specific_analysis';
    }
    
    return 'general_inquiry';
  }

  detectEntity(lower) {
    // PRIORITY: Detect grupo operativo FIRST (more important than sucursal)
    for (const grupo of this.gruposOperativos) {
      const grupoLower = grupo.toLowerCase();
      if (lower.includes(grupoLower) || 
          (grupo === 'TEPEYAC' && (lower.includes('tepeyac') || lower.includes('grupo tepeyac'))) ||
          (grupo === 'OGAS' && lower.includes('ogas')) ||
          (grupo === 'TEC' && lower.includes('tec')) ||
          (grupo === 'PLOG QUERETARO' && (lower.includes('queretaro') || lower.includes('querétaro')))) {
        console.log(`🎯 DETECTED GRUPO OPERATIVO: ${grupo}`);
        return { type: 'grupo', name: grupo };
      }
    }
    
    // Detect sucursal names from TEPEYAC
    const tepeyacSucursales = ['pino suarez', 'matamoros', 'santa catarina', 'felix u. gomez', 'garcia'];
    for (const sucursal of tepeyacSucursales) {
      if (lower.includes(sucursal)) {
        return { type: 'sucursal', name: sucursal, grupo: 'TEPEYAC' };
      }
    }
    
    // Detect estado
    const estados = ['nuevo león', 'nuevo leon', 'tamaulipas', 'coahuila'];
    for (const estado of estados) {
      if (lower.includes(estado)) {
        return { type: 'estado', name: estado };
      }
    }
    
    return { type: 'general', name: null };
  }

  detectTrimester(lower) {
    if (lower.includes('trimestre actual') || lower.includes('actual')) {
      return this.getCurrentTrimester();
    }
    
    if (lower.includes('q1') || lower.includes('primer trimestre')) return 'Q1';
    if (lower.includes('q2') || lower.includes('segundo trimestre')) return 'Q2';  
    if (lower.includes('q3') || lower.includes('tercer trimestre')) return 'Q3';
    if (lower.includes('q4') || lower.includes('cuarto trimestre')) return 'Q4';
    
    if (lower.includes('trimestre pasado') || lower.includes('anterior')) {
      return this.getPreviousTrimester();
    }
    
    return 'all';
  }

  detectComparison(lower) {
    if (lower.includes('subieron') || lower.includes('subió')) return 'improvement';
    if (lower.includes('bajaron') || lower.includes('bajó')) return 'decline';
    if (lower.includes('comparado') || lower.includes('versus')) return 'comparison';
    return null;
  }

  detectQuantity(lower) {
    const matches = lower.match(/top\s*(\d+)|(\d+)\s*top/);
    if (matches) return parseInt(matches[1] || matches[2]);
    
    if (lower.includes('top 5')) return 5;
    if (lower.includes('top 10')) return 10;
    if (lower.includes('top 3')) return 3;
    
    return 5; // Default
  }

  detectSpecificAreas(lower) {
    const detectedAreas = [];
    
    for (const area of this.areasEvaluacion) {
      const areaWords = area.toLowerCase().split(' ');
      if (areaWords.some(word => word.length > 4 && lower.includes(word))) {
        detectedAreas.push(area);
      }
    }
    
    return detectedAreas.length > 0 ? detectedAreas : null;
  }

  determineContextLevel(lower) {
    if (lower.includes('detallado') || lower.includes('completo') || lower.includes('análisis')) return 'detailed';
    if (lower.includes('resumen') || lower.includes('general')) return 'summary';
    return 'standard';
  }

  getCurrentTrimester() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    
    if (month >= 1 && month <= 3) return 'Q1';
    if (month >= 4 && month <= 6) return 'Q2';
    if (month >= 7 && month <= 9) return 'Q3';
    return 'Q4';
  }

  getPreviousTrimester() {
    const current = this.getCurrentTrimester();
    const quarters = ['Q4', 'Q1', 'Q2', 'Q3']; // Previous quarter mapping
    return quarters[quarters.indexOf(current)];
  }

  // INTELLIGENT DATA RETRIEVAL METHODS

  // Get areas de oportunidad for a grupo operativo in specific trimester
  async getGroupOpportunities(grupoName, trimester = 'Q3', limit = 5) {
    try {
      // Handle 'all' trimester case
      if (trimester === 'all') {
        trimester = this.getCurrentTrimester();
      }
      
      const period = this.trimesters[trimester];
      if (!period) {
        console.log(`⚠️ Invalid trimester: ${trimester}, using current`);
        trimester = this.getCurrentTrimester();
        period = this.trimesters[trimester];
      }
      
      const query = `
        SELECT 
          area_evaluacion,
          COUNT(*) as evaluaciones,
          AVG(porcentaje) as promedio,
          MIN(porcentaje) as minimo,
          MAX(porcentaje) as maximo,
          STDDEV(porcentaje) as desviacion
        FROM supervision_operativa_detalle
        WHERE grupo_operativo = $1
          AND fecha_supervision >= $2 
          AND fecha_supervision <= $3
          AND porcentaje IS NOT NULL
          AND area_evaluacion IS NOT NULL
          AND area_evaluacion != ''
        GROUP BY area_evaluacion
        HAVING COUNT(*) >= 3  -- At least 3 evaluations for statistical significance
        ORDER BY promedio ASC  -- Opportunities = lowest scores
        LIMIT $4;
      `;
      
      const result = await this.pool.query(query, [grupoName, period.start, period.end, limit]);
      
      return {
        grupo: grupoName,
        trimester: period.name,
        opportunities: result.rows.map(row => ({
          area: row.area_evaluacion,
          promedio: parseFloat(row.promedio).toFixed(2),
          evaluaciones: parseInt(row.evaluaciones),
          rango: `${parseFloat(row.minimo).toFixed(1)}% - ${parseFloat(row.maximo).toFixed(1)}%`,
          variabilidad: parseFloat(row.desviacion).toFixed(2)
        })),
        analysis_date: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Group opportunities error:', error);
      return { grupo: grupoName, opportunities: [], error: error.message };
    }
  }

  // Get areas de oportunidad for specific sucursal in recent supervision
  async getSucursalOpportunities(sucursalName, limit = 5) {
    try {
      // Get most recent supervision for this sucursal
      const recentQuery = `
        SELECT DISTINCT fecha_supervision, submission_id
        FROM supervision_operativa_detalle
        WHERE LOWER(sucursal_clean) LIKE LOWER('%' || $1 || '%')
        ORDER BY fecha_supervision DESC
        LIMIT 1;
      `;
      
      const recentResult = await this.pool.query(recentQuery, [sucursalName]);
      
      if (recentResult.rows.length === 0) {
        return { sucursal: sucursalName, opportunities: [], error: 'Sucursal no encontrada' };
      }
      
      const lastSupervision = recentResult.rows[0];
      
      // Get all areas for that supervision
      const areasQuery = `
        SELECT 
          sucursal_clean,
          grupo_operativo,
          estado,
          fecha_supervision,
          area_evaluacion,
          porcentaje
        FROM supervision_operativa_detalle
        WHERE submission_id = $1
          AND porcentaje IS NOT NULL
          AND area_evaluacion IS NOT NULL
          AND area_evaluacion != ''
        ORDER BY porcentaje ASC
        LIMIT $2;
      `;
      
      const areasResult = await this.pool.query(areasQuery, [lastSupervision.submission_id, limit]);
      
      return {
        sucursal: areasResult.rows[0]?.sucursal_clean || sucursalName,
        grupo: areasResult.rows[0]?.grupo_operativo,
        estado: areasResult.rows[0]?.estado,
        fecha_supervision: lastSupervision.fecha_supervision,
        opportunities: areasResult.rows.map(row => ({
          area: row.area_evaluacion,
          porcentaje: parseFloat(row.porcentaje).toFixed(2)
        }))
      };
    } catch (error) {
      console.error('❌ Sucursal opportunities error:', error);
      return { sucursal: sucursalName, opportunities: [], error: error.message };
    }
  }

  // Get quarterly comparison for grupo operativo
  async getQuarterlyComparison(grupoName, currentQ = 'Q3', previousQ = 'Q2') {
    try {
      const currentPeriod = this.trimesters[currentQ];
      const previousPeriod = this.trimesters[previousQ];
      
      const comparisonQuery = `
        WITH quarterly_data AS (
          SELECT 
            CASE 
              WHEN fecha_supervision >= $2 AND fecha_supervision <= $3 THEN 'current'
              WHEN fecha_supervision >= $4 AND fecha_supervision <= $5 THEN 'previous'
            END as periodo,
            AVG(porcentaje) as promedio_general,
            COUNT(DISTINCT sucursal_clean) as sucursales_evaluadas,
            COUNT(DISTINCT submission_id) as supervisiones_totales
          FROM supervision_operativa_detalle
          WHERE grupo_operativo = $1
            AND ((fecha_supervision >= $2 AND fecha_supervision <= $3) 
                OR (fecha_supervision >= $4 AND fecha_supervision <= $5))
            AND porcentaje IS NOT NULL
          GROUP BY periodo
        )
        SELECT * FROM quarterly_data;
      `;
      
      const result = await this.pool.query(comparisonQuery, [
        grupoName, currentPeriod.start, currentPeriod.end, 
        previousPeriod.start, previousPeriod.end
      ]);
      
      const currentData = result.rows.find(r => r.periodo === 'current') || {};
      const previousData = result.rows.find(r => r.periodo === 'previous') || {};
      
      const currentAvg = parseFloat(currentData.promedio_general) || 0;
      const previousAvg = parseFloat(previousData.promedio_general) || 0;
      const change = currentAvg - previousAvg;
      
      return {
        grupo: grupoName,
        comparison: {
          current: {
            trimester: currentPeriod.name,
            promedio: currentAvg.toFixed(2),
            sucursales: parseInt(currentData.sucursales_evaluadas) || 0,
            supervisiones: parseInt(currentData.supervisiones_totales) || 0
          },
          previous: {
            trimester: previousPeriod.name,
            promedio: previousAvg.toFixed(2),
            sucursales: parseInt(previousData.sucursales_evaluadas) || 0,
            supervisiones: parseInt(previousData.supervisiones_totales) || 0
          },
          change: {
            points: change.toFixed(2),
            percentage: previousAvg > 0 ? ((change / previousAvg) * 100).toFixed(2) : 0,
            trend: change > 0 ? 'mejora' : change < 0 ? 'declive' : 'estable'
          }
        }
      };
    } catch (error) {
      console.error('❌ Quarterly comparison error:', error);
      return { grupo: grupoName, comparison: {}, error: error.message };
    }
  }

  // Get top performing grupos by trimester
  async getTopGrupos(trimester = 'Q3', limit = 5) {
    try {
      const period = this.trimesters[trimester];
      
      const query = `
        SELECT 
          grupo_operativo,
          AVG(porcentaje) as promedio,
          COUNT(DISTINCT sucursal_clean) as sucursales,
          COUNT(DISTINCT submission_id) as supervisiones,
          COUNT(*) as evaluaciones_totales
        FROM supervision_operativa_detalle
        WHERE fecha_supervision >= $1 
          AND fecha_supervision <= $2
          AND porcentaje IS NOT NULL
          AND grupo_operativo IS NOT NULL
          AND grupo_operativo != 'NO_ENCONTRADO'
          AND grupo_operativo != 'SIN_MAPEO'
        GROUP BY grupo_operativo
        HAVING COUNT(DISTINCT sucursal_clean) >= 2  -- At least 2 sucursales
        ORDER BY promedio DESC
        LIMIT $3;
      `;
      
      const result = await this.pool.query(query, [period.start, period.end, limit]);
      
      return {
        trimester: period.name,
        ranking: result.rows.map((row, index) => ({
          position: index + 1,
          grupo: row.grupo_operativo,
          promedio: parseFloat(row.promedio).toFixed(2),
          sucursales: parseInt(row.sucursales),
          supervisiones: parseInt(row.supervisiones),
          evaluaciones: parseInt(row.evaluaciones_totales)
        }))
      };
    } catch (error) {
      console.error('❌ Top grupos error:', error);
      return { ranking: [], error: error.message };
    }
  }

  // Validate if entity exists in database
  async validateEntity(type, name) {
    try {
      let query, params;
      
      switch (type) {
        case 'grupo':
          query = 'SELECT DISTINCT grupo_operativo FROM supervision_operativa_detalle WHERE UPPER(grupo_operativo) = UPPER($1) LIMIT 1';
          params = [name];
          break;
        case 'sucursal':
          query = 'SELECT DISTINCT sucursal_clean FROM supervision_operativa_detalle WHERE LOWER(sucursal_clean) LIKE LOWER($1) LIMIT 1';
          params = [`%${name}%`];
          break;
        case 'estado':
          query = 'SELECT DISTINCT estado FROM supervision_operativa_detalle WHERE LOWER(estado) LIKE LOWER($1) LIMIT 1';
          params = [`%${name}%`];
          break;
        default:
          return null;
      }
      
      const result = await this.pool.query(query, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('❌ Entity validation error:', error);
      return null;
    }
  }
}

module.exports = IntelligentSupervisionSystem;