// Intelligent Knowledge Base - Complete Database Context for Extreme Intelligence
const { Pool } = require('pg');

class IntelligentKnowledgeBase {
  constructor(pool) {
    this.pool = pool;
    
    // GRUPOS Y SUCURSALES - INFORMACIÓN REAL DE LA BASE DE DATOS
    this.gruposSucursales = {
      'TEPEYAC': [
        '1 Pino Suarez', '2 Madero', '3 Matamoros', '4 Santa Catarina',
        '5 Felix U. Gomez', '6 Garcia', '7 La Huasteca',
        'Sucursal GC Garcia', 'Sucursal LH La Huasteca', 'Sucursal SC Santa Catarina'
      ],
      'OGAS': [
        '8 Gonzalitos', '9 Anahuac', '10 Barragan', '11 Lincoln',
        '12 Concordia', '13 Escobedo', '14 Aztlan', '15 Ruiz Cortinez'
      ],
      'TEC': [
        '20 Tecnológico', '21 Chapultepec', '22 Satelite', '23 Guasave'
      ],
      'EFM': [
        '17 Romulo Garza', '18 Linda Vista', '19 Valle Soleado'
      ],
      'EXPO': [
        '24 Exposicion', '25 Juarez', '26 Cadereyta', '27 Santiago',
        '28 Guerrero', '29 Pablo Livas', '30 Carrizo', '31 Las Quintas',
        '32 Allende', '33 Eloy Cavazos', '34 Montemorelos'
      ],
      'PLOG QUERETARO': [
        '48 Refugio', '49 Pueblito', '50 Patio', '51 Constituyentes'
      ],
      'PLOG NUEVO LEON': [
        '36 Apodaca Centro', '37 Stiva', '38 Gomez Morin', '39 Lazaro Cardenas',
        '40 Plaza 1500', '41 Vasconcelos'
      ],
      'PLOG LAGUNA': [
        '42 Independencia', '43 Revolucion', '44 Senderos', '45 Triana',
        '46 Campestre', '47 San Antonio'
      ],
      'GRUPO MATAMOROS': [
        '65 Pedro Cardenas', '66 Lauro Villar', '67 Centro (Matamoros)',
        '68 Avenida del Niño', '69 Puerto Rico'
      ],
      'GRUPO SALTILLO': [
        '52 Venustiano Carranza', '54 Ramos Arizpe', '57 Harold R. Pape'
      ],
      'CRR': [
        '73 Anzalduas', '74 Hidalgo (Reynosa)', '75 Libramiento (Reynosa)'
      ],
      'RAP': [
        '76 Aeropuerto (Reynosa)', '77 Boulevard Morelos', '78 Alcala'
      ],
      'OCHTER TAMPICO': [
        '58 Universidad (Tampico)', '59 Plaza 3601', '60 Centro (Tampico)', '61 Aeropuerto (Tampico)'
      ],
      'GRUPO CANTERA ROSA (MORELIA)': [
        '62 Lazaro Cardenas (Morelia)', '63 Madero (Morelia)', '64 Huerta'
      ],
      'GRUPO NUEVO LAREDO (RUELAS)': [
        '80 Guerrero 2 (Ruelas)', '81 Reforma (Ruelas)'
      ],
      'GRUPO PIEDRAS NEGRAS': [
        '70 Coahuila Comidas'
      ],
      'GRUPO RIO BRAVO': [
        '79 Rio Bravo'
      ],
      'GRUPO SABINAS HIDALGO': [
        '72 Sabinas Hidalgo'
      ],
      'GRUPO CENTRITO': [
        '71 Centrito Valle'
      ],
      'EPL SO': [
        '16 Solidaridad'
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
      
      // RANKING REAL DE GRUPOS OPERATIVOS - Actualizado con datos reales
      grupos_ranking: [
        { name: "OGAS", promedio: 97.55, sucursales: 8, status: "excellent", trend: "leader", 
          descripcion: "Líder absoluto con 8 sucursales en Nuevo León" },
        { name: "PLOG QUERETARO", promedio: 96.97, sucursales: 4, status: "excellent", trend: "strong",
          descripcion: "Excelente desempeño en Querétaro con 4 sucursales" },
        { name: "EPL SO", promedio: 94.37, sucursales: 1, status: "good", trend: "stable",
          descripcion: "Sucursal única con alto rendimiento" },
        { name: "TEC", promedio: 93.07, sucursales: 4, status: "good", trend: "solid",
          descripcion: "Grupo sólido con 4 sucursales incluyendo Tecnológico" },
        { name: "TEPEYAC", promedio: 92.66, sucursales: 10, status: "good", trend: "large_group",
          descripcion: "Grupo más grande con 10 sucursales, buen promedio" },
        { name: "GRUPO MATAMOROS", promedio: 90.61, sucursales: 5, status: "good", trend: "stable",
          descripcion: "5 sucursales en Tamaulipas con desempeño estable" },
        { name: "PLOG LAGUNA", promedio: 89.80, sucursales: 6, status: "good", trend: "consistent",
          descripcion: "6 sucursales en La Laguna con consistencia" },
        { name: "EFM", promedio: 89.69, sucursales: 3, status: "good", trend: "stable",
          descripcion: "3 sucursales en Nuevo León con buen desempeño" },
        { name: "RAP", promedio: 89.29, sucursales: 3, status: "good", trend: "moderate",
          descripcion: "3 sucursales en Reynosa con rendimiento moderado" },
        { name: "GRUPO RIO BRAVO", promedio: 89.13, sucursales: 1, status: "good", trend: "small",
          descripcion: "Sucursal única en Río Bravo" },
        { name: "PLOG NUEVO LEON", promedio: 88.17, sucursales: 6, status: "improvement", trend: "needs_attention",
          descripcion: "6 sucursales que requieren atención" },
        { name: "GRUPO PIEDRAS NEGRAS", promedio: 88.17, sucursales: 1, status: "improvement", trend: "small",
          descripcion: "Sucursal única en Coahuila" },
        { name: "GRUPO CANTERA ROSA (MORELIA)", promedio: 87.80, sucursales: 3, status: "improvement", trend: "limited_data",
          descripcion: "3 sucursales en Michoacán" },
        { name: "EXPO", promedio: 87.49, sucursales: 11, status: "improvement", trend: "large_needs_focus",
          descripcion: "Grupo grande con 11 sucursales que necesita enfoque" },
        { name: "OCHTER TAMPICO", promedio: 87.20, sucursales: 4, status: "improvement", trend: "moderate",
          descripcion: "4 sucursales en Tampico" },
        { name: "GRUPO SABINAS HIDALGO", promedio: 84.46, sucursales: 1, status: "improvement", trend: "small_concern",
          descripcion: "Sucursal única que requiere atención" },
        { name: "GRUPO CENTRITO", promedio: 81.35, sucursales: 1, status: "improvement", trend: "declining",
          descripcion: "Sucursal en Valle que necesita mejora" },
        { name: "CRR", promedio: 80.31, sucursales: 3, status: "improvement", trend: "concerning",
          descripcion: "3 sucursales en Reynosa con rendimiento preocupante" },
        { name: "GRUPO NUEVO LAREDO (RUELAS)", promedio: 74.56, sucursales: 2, status: "critical", trend: "urgent",
          descripcion: "2 sucursales en situación crítica" },
        { name: "GRUPO SALTILLO", promedio: 72.12, sucursales: 3, status: "critical", trend: "crisis",
          descripcion: "3 sucursales en Coahuila que requieren intervención urgente" }
      ],
      
      // ÁREAS CRÍTICAS GLOBALES - Análisis real de toda la operación
      critical_areas_global: [
        { area: "FREIDORAS", promedio: 74.63, critical_rate: 44.1, priority: "highest", 
          issue: "Área más crítica - requiere mantenimiento especializado constante",
          recomendacion: "Plan intensivo de mantenimiento preventivo" },
        { area: "EXTERIOR SUCURSAL", promedio: 75.35, critical_rate: 63.2, priority: "highest", 
          issue: "Imagen externa afecta percepción del cliente",
          recomendacion: "Programa de limpieza y mantenimiento de fachadas" },
        { area: "FREIDORA DE PAPA", promedio: 76.09, critical_rate: 51.3, priority: "highest", 
          issue: "Equipamiento crítico para operación de papas",
          recomendacion: "Capacitación técnica especializada" },
        { area: "HORNOS", promedio: 81.03, critical_rate: 18.1, priority: "high", 
          issue: "Equipos principales de cocción",
          recomendacion: "Calibración periódica y limpieza profunda" },
        { area: "MAQUINA DE HIELO", promedio: 88.37, critical_rate: 12.5, priority: "medium", 
          issue: "Mantenimiento preventivo necesario",
          recomendacion: "Programa de limpieza y revisión técnica" },
        { area: "DISPENSADOR DE REFRESCOS", promedio: 88.52, critical_rate: 11.8, priority: "medium", 
          issue: "Equipos de bebidas requieren atención",
          recomendacion: "Limpieza y calibración regular" },
        { area: "ASADORES", promedio: 88.71, critical_rate: 24.9, priority: "medium", 
          issue: "Equipos esenciales para pollo",
          recomendacion: "Mantenimiento y limpieza especializada" },
        { area: "CUARTO FRIO 1", promedio: 88.92, critical_rate: 10.2, priority: "medium", 
          issue: "Control de temperatura crítico",
          recomendacion: "Monitoreo constante de temperatura" }
      ],
      
      // TENDENCIAS TRIMESTRALES REALES 2025
      quarterly_trends: {
        Q1: { supervisiones: 25, sucursales: 27, promedio: 91.67, period: "Ene-Mar 2025", 
              trend: "strong_start", descripcion: "Inicio sólido del año" },
        Q2: { supervisiones: 66, sucursales: 63, promedio: 88.88, period: "Abr-Jun 2025", 
              trend: "peak_activity", descripcion: "Período de máxima actividad" },
        Q3: { supervisiones: 44, sucursales: 40, promedio: 89.99, period: "Jul-Sep 2025", 
              trend: "current_period", descripcion: "Trimestre actual con mejora" },
        Q4: { supervisiones: 0, sucursales: 0, promedio: 0, period: "Oct-Dec 2025", 
              trend: "future", descripcion: "Trimestre futuro por evaluar" }
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
        leader: "🏆 Mantener liderazgo - documentar y replicar mejores prácticas",
        strong: "💪 Escalar prácticas exitosas a otros grupos",
        stable: "📈 Buscar oportunidades de mejora incremental",
        needs_attention: "⚠️ Revisar procesos y reforzar capacitación",
        concerning: "🚨 Plan de acción inmediato con soporte CAS",
        crisis: "🆘 Intervención urgente - soporte corporativo intensivo"
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