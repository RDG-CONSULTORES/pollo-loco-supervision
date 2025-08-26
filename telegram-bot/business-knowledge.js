// =========================================
// BUSINESS KNOWLEDGE - EL POLLO LOCO CAS
// Conocimiento empresarial pre-cargado estilo Falcon AI
// =========================================

class ElPolloLocoBusinessKnowledge {
  constructor() {
    // GRUPOS OPERATIVOS EXACTOS (20 grupos confirmados)
    this.grupos = {
      'OGAS': { 
        sucursales: 8, 
        promedio_historico: 97.55, 
        ranking: 1,
        estado: 'Nuevo León',
        status: 'LÍDER ABSOLUTO'
      },
      'TEPEYAC': { 
        sucursales: 10, 
        promedio_historico: 92.66, 
        ranking: 2,
        estado: 'Multi-estado',
        status: 'VOLUMEN LÍDER'
      },
      'PLOG QUERETARO': { 
        sucursales: 4, 
        promedio_historico: 91.2, 
        ranking: 3,
        estado: 'Querétaro',
        status: 'ALTA PERFORMANCE'
      },
      'EPL SO': { 
        sucursales: 1, 
        promedio_historico: 94.9, 
        ranking: 4,
        estado: 'Sur',
        status: 'EXCELENCIA INDIVIDUAL'
      },
      'TEC': { 
        sucursales: 3, 
        promedio_historico: 89.5, 
        ranking: 5,
        estado: 'Nuevo León',
        status: 'SÓLIDO'
      },
      'EXPO': { 
        sucursales: 2, 
        promedio_historico: 88.1, 
        ranking: 6,
        estado: 'Multi-estado',
        status: 'ESTABLE'
      },
      'EFM': { 
        sucursales: 3, 
        promedio_historico: 87.8, 
        ranking: 7,
        estado: 'Multi-estado',
        status: 'OPORTUNIDAD'
      },
      'CRR': { 
        sucursales: 2, 
        promedio_historico: 86.5, 
        ranking: 8,
        estado: 'Multi-estado',
        status: 'MEJORANDO'
      },
      'RAP': { 
        sucursales: 4, 
        promedio_historico: 85.2, 
        ranking: 9,
        estado: 'Multi-estado',
        status: 'DESARROLLO'
      },
      'PLOG LAGUNA': { 
        sucursales: 3, 
        promedio_historico: 84.1, 
        ranking: 10,
        estado: 'Coahuila',
        status: 'CRECIMIENTO'
      },
      'GRUPO MATAMOROS': { 
        sucursales: 2, 
        promedio_historico: 83.5, 
        ranking: 11,
        estado: 'Tamaulipas',
        status: 'FRONTERA'
      },
      'GRUPO RIO BRAVO': { 
        sucursales: 2, 
        promedio_historico: 82.8, 
        ranking: 12,
        estado: 'Tamaulipas',
        status: 'POTENCIAL'
      },
      'GRUPO SALTILLO': { 
        sucursales: 3, 
        promedio_historico: 81.9, 
        ranking: 13,
        estado: 'Coahuila',
        status: 'REGIONAL'
      },
      'PLANTA REYNOLDS': { 
        sucursales: 1, 
        promedio_historico: 81.2, 
        ranking: 14,
        estado: 'Tamaulipas',
        status: 'INDUSTRIAL'
      },
      'ADMINISTRACION': { 
        sucursales: 1, 
        promedio_historico: 80.5, 
        ranking: 15,
        estado: 'Corporativo',
        status: 'APOYO'
      }
    };

    // ÁREAS DE EVALUACIÓN CRÍTICAS (29 áreas confirmadas)
    this.areas_criticas = {
      'FREIDORAS': { 
        promedio_general: 74.63, 
        criticidad: 'ALTA', 
        impacto_operacional: 'CRÍTICO',
        mejora_potencial: '15-20 puntos'
      },
      'EXTERIOR SUCURSAL': { 
        promedio_general: 75.35, 
        criticidad: 'ALTA', 
        impacto_operacional: 'IMAGEN',
        mejora_potencial: '12-18 puntos'
      },
      'FREIDORA DE PAPA': { 
        promedio_general: 76.12, 
        criticidad: 'ALTA', 
        impacto_operacional: 'CALIDAD',
        mejora_potencial: '10-15 puntos'
      },
      'HORNOS': { 
        promedio_general: 82.45, 
        criticidad: 'MEDIA', 
        impacto_operacional: 'PRODUCCIÓN',
        mejora_potencial: '8-12 puntos'
      },
      'MAQUINA DE HIELO': { 
        promedio_general: 78.89, 
        criticidad: 'MEDIA', 
        impacto_operacional: 'SERVICIO',
        mejora_potencial: '10-15 puntos'
      },
      'LIMPIEZA': { 
        promedio_general: 85.67, 
        criticidad: 'BAJA', 
        impacto_operacional: 'HYGIENE',
        mejora_potencial: '5-10 puntos'
      },
      'SERVICIO AL CLIENTE': { 
        promedio_general: 87.23, 
        criticidad: 'BAJA', 
        impacto_operacional: 'EXPERIENCIA',
        mejora_potencial: '3-8 puntos'
      }
    };

    // CONTEXTO TRIMESTRAL 2025
    this.trimestres = {
      'Q1': { 
        sucursales_evaluadas: 27, 
        evaluaciones_totales: 2400, 
        promedio: 91.1,
        tendencia: 'BASELINE'
      },
      'Q2': { 
        sucursales_evaluadas: 63, 
        evaluaciones_totales: 5800, 
        promedio: 88.9,
        tendencia: 'DECLIVE'
      },
      'Q3': { 
        sucursales_evaluadas: 14, 
        evaluaciones_totales: 263, 
        promedio: 93.2,
        tendencia: 'RECUPERACIÓN'
      }
    };

    // BENCHMARKS EMPRESARIALES
    this.benchmarks = {
      excelencia: 95.0,
      objetivo: 85.0,
      critico: 75.0,
      total_grupos: 20,
      total_sucursales: 82,
      total_areas: 29
    };

    // COMANDOS ESTILO FALCON AI
    this.comandos_disponibles = [
      '/ranking - Top 10 grupos operativos',
      '/areas_criticas - Áreas que necesitan atención',
      '/q1 /q2 /q3 - Análisis por trimestre',
      '/sucursales_{grupo} - Sucursales por grupo',
      '/oportunidades - Mejores oportunidades CAS'
    ];

    console.log('🧠 Business Knowledge cargado: 20 grupos, 29 áreas, contexto 2025');
  }

  // Obtener información rápida de un grupo
  getGrupoInfo(grupoName) {
    const grupo = grupoName.toUpperCase();
    const info = this.grupos[grupo];
    
    if (!info) {
      return null;
    }

    return {
      nombre: grupo,
      sucursales: info.sucursales,
      promedio_historico: info.promedio_historico,
      ranking: info.ranking,
      estado: info.estado,
      status: info.status,
      total_grupos: this.benchmarks.total_grupos
    };
  }

  // Obtener top performers
  getTopPerformers(limit = 5) {
    return Object.entries(this.grupos)
      .sort((a, b) => a[1].ranking - b[1].ranking)
      .slice(0, limit)
      .map(([nombre, info], index) => ({
        posicion: index + 1,
        nombre: nombre,
        sucursales: info.sucursales,
        promedio: info.promedio_historico,
        status: info.status
      }));
  }

  // Obtener áreas críticas
  getAreasCriticas() {
    return Object.entries(this.areas_criticas)
      .sort((a, b) => a[1].promedio_general - b[1].promedio_general)
      .map(([area, info]) => ({
        area: area,
        promedio: info.promedio_general,
        criticidad: info.criticidad,
        impacto: info.impacto_operacional,
        potencial_mejora: info.mejora_potencial
      }));
  }

  // Obtener contexto trimestral
  getTrimestreInfo(trimestre) {
    const q = trimestre.toUpperCase();
    const info = this.trimestres[q];
    
    if (!info) {
      return null;
    }

    return {
      trimestre: q,
      sucursales: info.sucursales_evaluadas,
      evaluaciones: info.evaluaciones_totales,
      promedio: info.promedio,
      tendencia: info.tendencia
    };
  }

  // Verificar si un grupo existe
  grupoExists(grupoName) {
    return this.grupos.hasOwnProperty(grupoName.toUpperCase());
  }

  // Obtener todos los nombres de grupos
  getAllGrupoNames() {
    return Object.keys(this.grupos);
  }

  // Obtener estadísticas generales
  getGeneralStats() {
    return {
      total_grupos: this.benchmarks.total_grupos,
      total_sucursales: this.benchmarks.total_sucursales,
      total_areas: this.benchmarks.total_areas,
      benchmark_excelencia: this.benchmarks.excelencia,
      benchmark_objetivo: this.benchmarks.objetivo,
      benchmark_critico: this.benchmarks.critico
    };
  }

  // Generar respuesta estilo Falcon AI
  generateFalconResponse(tipo, data) {
    switch (tipo) {
      case 'grupo_info':
        return this.formatGrupoInfo(data);
      case 'ranking':
        return this.formatRanking(data);
      case 'areas_criticas':
        return this.formatAreasCriticas();
      case 'trimestre':
        return this.formatTrimestre(data);
      default:
        return this.formatGeneral();
    }
  }

  // Formatear información de grupo estilo Falcon
  formatGrupoInfo(grupoInfo) {
    if (!grupoInfo) {
      return '❌ Grupo no encontrado. Usa /ranking para ver todos los grupos.';
    }

    return `📊 ${grupoInfo.nombre} - ANÁLISIS GRUPO
• Sucursales: ${grupoInfo.sucursales}
• Promedio histórico: ${grupoInfo.promedio_historico}%
• Ranking: #${grupoInfo.ranking} de ${grupoInfo.total_grupos} grupos
• Estado: ${grupoInfo.estado}
• Status: ${grupoInfo.status}

🎯 /sucursales_${grupoInfo.nombre.toLowerCase()} | /areas_${grupoInfo.nombre.toLowerCase()} | /ranking`;
  }

  // Formatear ranking estilo Falcon
  formatRanking(limit = 5) {
    const top = this.getTopPerformers(limit);
    let response = `🏆 TOP ${limit} GRUPOS OPERATIVOS\n\n`;
    
    top.forEach(grupo => {
      const medal = grupo.posicion === 1 ? '🥇' : grupo.posicion === 2 ? '🥈' : grupo.posicion === 3 ? '🥉' : `${grupo.posicion}️⃣`;
      response += `${medal} ${grupo.nombre}\n├── Sucursales: ${grupo.sucursales}\n└── Promedio: ${grupo.promedio}%\n\n`;
    });

    response += `🎯 /areas_criticas | /oportunidades | /q3`;
    return response;
  }

  // Formatear áreas críticas
  formatAreasCriticas() {
    const areas = this.getAreasCriticas();
    let response = `🚨 ÁREAS CRÍTICAS - OPORTUNIDADES CAS\n\n`;
    
    areas.slice(0, 5).forEach((area, index) => {
      response += `${index + 1}️⃣ ${area.area}\n├── Promedio: ${area.promedio}%\n├── Criticidad: ${area.criticidad}\n└── Potencial: ${area.potencial_mejora}\n\n`;
    });

    response += `🎯 /ranking | /q3 | /oportunidades`;
    return response;
  }

  // Formatear información trimestral
  formatTrimestre(trimestre) {
    const info = this.getTrimestreInfo(trimestre);
    if (!info) {
      return '❌ Trimestre no válido. Usa: /q1 /q2 /q3';
    }

    return `📅 ${info.trimestre} 2025 - ANÁLISIS TRIMESTRAL
• Sucursales evaluadas: ${info.sucursales}
• Total evaluaciones: ${info.evaluaciones.toLocaleString()}
• Promedio trimestre: ${info.promedio}%
• Tendencia: ${info.tendencia}

🎯 /ranking | /areas_criticas | /q${info.trimestre.charAt(1)}`;
  }

  // Respuesta general estilo Falcon
  formatGeneral() {
    const stats = this.getGeneralStats();
    
    return `🦅 FALCON AI - SUPERVISIÓN OPERATIVA
El Pollo Loco CAS - Análisis Empresarial

📊 RESUMEN GENERAL 2025:
• Total grupos: ${stats.total_grupos}
• Total sucursales: ${stats.total_sucursales}
• Total áreas: ${stats.total_areas}
• Benchmark objetivo: ${stats.benchmark_objetivo}%

🎯 COMANDOS DISPONIBLES:
• /ranking - Top grupos operativos
• /areas_criticas - Oportunidades CAS
• /q1 /q2 /q3 - Análisis trimestral
• /oportunidades - Mejores acciones

📅 Última actualización: ${new Date().toLocaleString('es-MX')}`;
  }
}

module.exports = ElPolloLocoBusinessKnowledge;