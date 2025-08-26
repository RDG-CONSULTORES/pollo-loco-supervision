// Intelligent Knowledge Base - Complete Database Context for Extreme Intelligence
const { Pool } = require('pg');

class IntelligentKnowledgeBase {
  constructor(pool) {
    this.pool = pool;
    
    // GRUPOS Y SUCURSALES - Conocimiento esencial hardcoded
    this.gruposSucursales = {
      'TEPEYAC': [
        'PINO SUAREZ', 'MATAMOROS', 'SANTA CATARINA', 'FELIX U GOMEZ', 
        'GARCIA', '6 Garcia', '11 Garcia', 'Escobedo Norte', 
        'Treviño', 'Valle Verde'
      ],
      'OGAS': [
        'Juan Carrasco', 'Ave Arturo B', 'OGAS Lincoln', 'OGAS Chapultepec',
        'OGAS San Nicolas', 'OGAS Anahuac', 'OGAS Sendero', 'OGAS Cumbres'
      ],
      'TEC': [
        'TEC Garza Sada', 'TEC Valle', 'TEC Centro', 'TEC Campus',
        'Valle Alto', 'Carretera Nacional', 'Vista Hermosa'
      ],
      'PLOG QUERETARO': [
        'Querétaro Centro', 'Querétaro Norte', 'Querétaro Sur',
        'Corregidora', 'El Marqués'
      ],
      'EFM': [
        'EFM Gonzalitos', 'EFM Las Torres', 'EFM San Jeronimo', 
        'EFM Mitras', 'EFM Universidad'
      ],
      'EXPO': [
        'EXPO Guadalupe', 'EXPO Centro', 'EXPO Sendero', 'EXPO Cumbres',
        'EXPO San Nicolas', 'EXPO Apodaca', 'EXPO Escobedo', 'EXPO Santa',
        'EXPO Juarez', 'EXPO Contry', 'EXPO Linda Vista'
      ],
      'GRUPO SALTILLO': [
        'Saltillo Centro', 'Saltillo Norte', 'Saltillo Boulevard'
      ],
      'CRR': [
        'CRR Monterrey', 'CRR San Pedro', 'CRR Constitución'
      ],
      'PLOG NUEVO LEON': [
        'Ruiz Cortines', 'Miguel Aleman', 'Solidaridad', 
        'Las Puentes', 'Metroplex', 'Citadel'
      ],
      'GRUPO MATAMOROS': [
        'Matamoros Centro', 'Matamoros Norte', 'Matamoros Sur',
        'Matamoros Sendero', 'Matamoros Gran Plaza'
      ]
    };
    
    // COMPLETE REAL DATA CONTEXT - Updated from actual database analysis
    this.businessContext = {
      // Company structure
      company: "El Pollo Loco CAS",
      evaluation_system: "Supervisión Operativa",
      evaluation_frequency: "1 vez por trimestre por sucursal",
      total_areas: 29,
      
      // Performance benchmarks (from real data)
      performance_levels: {
        excellent: { min: 95, description: "Excelente - Liderazgo" },
        good: { min: 85, max: 94.99, description: "Bueno - Estándar esperado" },
        improvement: { min: 70, max: 84.99, description: "Requiere mejora" },
        critical: { max: 69.99, description: "Crítico - Atención inmediata" }
      },
      
      // Real grupos operativos performance ranking (from database)
      grupos_ranking: [
        { name: "OGAS", promedio: 97.55, sucursales: 8, supervisiones: 16, status: "excellent", trend: "leader" },
        { name: "PLOG QUERETARO", promedio: 96.97, sucursales: 4, supervisiones: 4, status: "excellent", trend: "strong" },
        { name: "EPL SO", promedio: 94.37, sucursales: 1, supervisiones: 2, status: "good", trend: "stable" },
        { name: "TEC", promedio: 93.07, sucursales: 4, supervisiones: 7, status: "good", trend: "solid" },
        { name: "TEPEYAC", promedio: 92.66, sucursales: 10, supervisiones: 10, status: "good", trend: "large_group" },
        { name: "GRUPO MATAMOROS", promedio: 90.61, sucursales: 5, supervisiones: 9, status: "good", trend: "stable" },
        { name: "PLOG LAGUNA", promedio: 89.80, sucursales: 6, supervisiones: 6, status: "good", trend: "consistent" },
        { name: "EFM", promedio: 89.69, sucursales: 3, supervisiones: 7, status: "good", trend: "stable" },
        { name: "RAP", promedio: 89.29, sucursales: 3, supervisiones: 4, status: "good", trend: "moderate" },
        { name: "GRUPO RIO BRAVO", promedio: 89.13, sucursales: 1, supervisiones: 2, status: "good", trend: "small" },
        { name: "PLOG NUEVO LEON", promedio: 88.17, sucursales: 6, supervisiones: 16, status: "improvement", trend: "needs_attention" },
        { name: "GRUPO PIEDRAS NEGRAS", promedio: 88.17, sucursales: 1, supervisiones: 2, status: "improvement", trend: "small" },
        { name: "GRUPO CANTERA ROSA (MORELIA)", promedio: 87.80, sucursales: 3, supervisiones: 3, status: "improvement", trend: "limited_data" },
        { name: "EXPO", promedio: 87.49, sucursales: 11, supervisiones: 20, status: "improvement", trend: "large_needs_focus" },
        { name: "OCHTER TAMPICO", promedio: 87.20, sucursales: 4, supervisiones: 4, status: "improvement", trend: "moderate" },
        { name: "GRUPO SABINAS HIDALGO", promedio: 84.46, sucursales: 1, supervisiones: 2, status: "improvement", trend: "small_concern" },
        { name: "GRUPO CENTRITO", promedio: 81.35, sucursales: 1, supervisiones: 4, status: "improvement", trend: "declining" },
        { name: "CRR", promedio: 80.31, sucursales: 3, supervisiones: 5, status: "improvement", trend: "concerning" },
        { name: "GRUPO NUEVO LAREDO (RUELAS)", promedio: 74.56, sucursales: 2, supervisiones: 2, status: "critical", trend: "urgent" },
        { name: "GRUPO SALTILLO", promedio: 72.12, sucursales: 3, supervisiones: 4, status: "critical", trend: "crisis" }
      ],
      
      // Critical areas globally (from real data analysis)
      critical_areas_global: [
        { area: "FREIDORAS", promedio: 70.10, critical_rate: 44.1, priority: "highest", issue: "Equipos freidora requieren mantenimiento constante" },
        { area: "EXTERIOR SUCURSAL", promedio: 71.36, critical_rate: 63.2, priority: "highest", issue: "Imagen externa y limpieza fachada" },
        { area: "FREIDORA DE PAPA", promedio: 71.42, critical_rate: 51.3, priority: "highest", issue: "Mantenimiento especializado papas" },
        { area: "AVISO DE FUNCIONAMIENTO, BITACORAS, CARPETA DE FUMIGACION CONTROL", promedio: 73.73, critical_rate: 32.3, priority: "high", issue: "Documentación y cumplimiento normativo" },
        { area: "ASADORES", promedio: 81.03, critical_rate: 24.9, priority: "medium", issue: "Mantenimiento y limpieza asadores" },
        { area: "CONGELADOR PAPA", promedio: 82.61, critical_rate: 27.0, priority: "medium", issue: "Temperatura y limpieza congeladores" },
        { area: "BAÑO EMPLEADOS", promedio: 83.15, critical_rate: 24.5, priority: "medium", issue: "Higiene y suministros baños personal" },
        { area: "HORNOS", promedio: 84.26, critical_rate: 18.1, priority: "medium", issue: "Calibración y limpieza hornos" }
      ],
      
      // Quarterly performance trends (from real data)
      quarterly_trends: {
        Q1: { supervisiones: 25, sucursales: 27, promedio: 91.67, period: "Ene-Mar 2025", trend: "strong_start" },
        Q2: { supervisiones: 66, sucursales: 63, promedio: 88.88, period: "Abr-Jun 2025", trend: "peak_activity" },
        Q3: { supervisiones: 44, sucursales: 40, promedio: 89.99, period: "Jul-Sep 2025", trend: "current_period" },
        Q4: { supervisiones: 0, sucursales: 0, promedio: 0, period: "Oct-Dec 2025", trend: "future" }
      }
    };
    
    // Intelligence patterns for context-aware responses
    this.intelligencePatterns = {
      // When user asks about performance
      performance_context: {
        excellent: "grupo está en nivel de excelencia y puede servir como benchmark",
        good: "grupo mantiene estándares adecuados con oportunidades de mejora específicas",
        improvement: "grupo requiere plan de acción enfocado en áreas críticas",
        critical: "grupo necesita intervención inmediata con soporte especializado"
      },
      
      // Contextual insights based on group size
      group_size_insights: {
        large: "grupo grande con impacto significativo en resultados generales",
        medium: "grupo de tamaño moderado con oportunidades de escalamiento",
        small: "grupo pequeño que puede beneficiarse de atención personalizada"
      },
      
      // Trend-based recommendations
      trend_recommendations: {
        leader: "mantener prácticas actuales y documentar best practices",
        strong: "evaluar escalabilidad de prácticas exitosas",
        stable: "identificar oportunidades de mejora incremental",
        needs_attention: "revisar procesos operativos y capacitación",
        concerning: "plan de acción inmediato con métricas de seguimiento",
        crisis: "intervención urgente con soporte corporativo"
      }
    };
  }
  
  // Get sucursales for a specific grupo
  getSucursalesByGrupo(grupoName) {
    const upperName = grupoName.toUpperCase();
    
    // Direct lookup
    if (this.gruposSucursales[upperName]) {
      return this.gruposSucursales[upperName];
    }
    
    // Try partial match
    for (const [grupo, sucursales] of Object.entries(this.gruposSucursales)) {
      if (grupo.includes(upperName) || upperName.includes(grupo)) {
        return sucursales;
      }
    }
    
    return [];
  }
  
  // Get all grupos with their sucursales
  getAllGruposSucursales() {
    return this.gruposSucursales;
  }
  
  // Get contextual intelligence about a grupo
  getGrupoIntelligence(grupoName) {
    const grupo = this.businessContext.grupos_ranking.find(g => 
      g.name.toUpperCase() === grupoName.toUpperCase()
    );
    
    if (!grupo) return null;
    
    const sizeCategory = grupo.sucursales >= 8 ? 'large' : grupo.sucursales >= 4 ? 'medium' : 'small';
    
    return {
      ...grupo,
      performance_context: this.intelligencePatterns.performance_context[grupo.status],
      size_insight: this.intelligencePatterns.group_size_insights[sizeCategory],
      recommendation: this.intelligencePatterns.trend_recommendations[grupo.trend],
      position_in_ranking: this.businessContext.grupos_ranking.findIndex(g => g.name === grupo.name) + 1,
      percentile: ((this.businessContext.grupos_ranking.length - this.businessContext.grupos_ranking.findIndex(g => g.name === grupo.name)) / this.businessContext.grupos_ranking.length * 100).toFixed(0)
    };
  }
  
  // Get intelligent insights about performance level
  getPerformanceInsights(percentage) {
    const perf = parseFloat(percentage);
    
    if (perf >= 95) {
      return {
        level: "excellent",
        message: "Desempeño de excelencia - Top tier",
        action: "Documentar y replicar best practices",
        benchmark: "Nivel de liderazgo sectorial"
      };
    } else if (perf >= 85) {
      return {
        level: "good", 
        message: "Desempeño sólido dentro de estándares",
        action: "Identificar oportunidades de optimización",
        benchmark: "Cumple expectativas corporativas"
      };
    } else if (perf >= 70) {
      return {
        level: "improvement",
        message: "Requiere plan de mejora enfocado", 
        action: "Plan de acción con métricas específicas",
        benchmark: "Por debajo del estándar esperado"
      };
    } else {
      return {
        level: "critical",
        message: "Situación crítica - Intervención urgente",
        action: "Soporte inmediato y monitoreo estrecho",
        benchmark: "Riesgo operativo significativo"
      };
    }
  }
  
  // Get contextual information about areas
  getAreaIntelligence(areaName) {
    const area = this.businessContext.critical_areas_global.find(a => 
      a.area.toLowerCase().includes(areaName.toLowerCase()) ||
      areaName.toLowerCase().includes(a.area.toLowerCase().split(' ')[0])
    );
    
    return area ? {
      ...area,
      context: `Área identificada como ${area.priority} prioridad a nivel corporativo`,
      global_ranking: this.businessContext.critical_areas_global.findIndex(a => a.area === area.area) + 1,
      impact: area.critical_rate > 40 ? "alto" : area.critical_rate > 25 ? "medio" : "moderado"
    } : null;
  }
  
  // Generate intelligent comparative context
  generateComparativeContext(grupo1, grupo2 = null) {
    const g1Intel = this.getGrupoIntelligence(grupo1);
    if (!g1Intel) return null;
    
    const context = {
      grupo: g1Intel,
      market_position: `Posición ${g1Intel.position_in_ranking} de ${this.businessContext.grupos_ranking.length} grupos`,
      percentile: `Percentil ${g1Intel.percentile}`,
      performance_context: g1Intel.performance_context
    };
    
    // Add competitors if requested
    if (grupo2) {
      const g2Intel = this.getGrupoIntelligence(grupo2);
      if (g2Intel) {
        context.comparison = {
          competitor: g2Intel,
          gap: (g1Intel.promedio - g2Intel.promedio).toFixed(2),
          position_diff: g2Intel.position_in_ranking - g1Intel.position_in_ranking
        };
      }
    } else {
      // Add automatic competitive context (closest performers)
      const position = g1Intel.position_in_ranking;
      const competitors = this.businessContext.grupos_ranking.filter((g, i) => 
        Math.abs(i + 1 - position) <= 2 && g.name !== g1Intel.name
      );
      
      context.competitive_context = competitors.map(c => ({
        name: c.name,
        gap: (g1Intel.promedio - c.promedio).toFixed(2),
        status: c.promedio > g1Intel.promedio ? "superior" : "inferior"
      }));
    }
    
    return context;
  }
  
  // Get quarterly intelligence  
  getQuarterlyIntelligence(quarter = 'Q3') {
    const qData = this.businessContext.quarterly_trends[quarter];
    if (!qData) return null;
    
    return {
      ...qData,
      activity_level: qData.supervisiones > 50 ? "alta" : qData.supervisiones > 25 ? "media" : "baja",
      coverage: ((qData.sucursales / 82) * 100).toFixed(1) + "% de sucursales evaluadas",
      benchmark: qData.promedio > 90 ? "excelente" : qData.promedio > 85 ? "bueno" : "necesita mejora"
    };
  }
}

module.exports = IntelligentKnowledgeBase;