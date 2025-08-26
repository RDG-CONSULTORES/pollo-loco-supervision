// =========================================
// SMART BUSINESS KNOWLEDGE - EL POLLO LOCO CAS
// Conocimiento híbrido: estructura Falcon + datos reales diarios
// Optimizado para Render Free Tier
// =========================================

class ElPolloLocoBusinessKnowledge {
  constructor() {
    // CACHE INTELIGENTE
    this.lastUpdate = null;
    this.cachedData = null;
    this.isRefreshing = false;
    this.cacheValidHours = 24; // Cache válido por 24 horas
    
    // ESTRUCTURA FIJA (nunca cambia)
    this.estructura = {
      total_grupos_esperados: 20,
      total_areas: 29,
      benchmark_excelencia: 95.0,
      benchmark_objetivo: 85.0,
      benchmark_critico: 75.0
    };
    
    // GRUPOS OPERATIVOS ESTRUCTURA (nombres fijos)
    this.grupos_estructura = [
      'OGAS', 'TEPEYAC', 'PLOG QUERETARO', 'EPL SO', 'TEC', 
      'EXPO', 'EFM', 'CRR', 'RAP', 'PLOG LAGUNA',
      'GRUPO MATAMOROS', 'GRUPO RIO BRAVO', 'GRUPO SALTILLO',
      'PLANTA REYNOLDS', 'ADMINISTRACION'
    ];

    // AREAS CRÍTICAS CONOCIDAS (nombres fijos)
    this.areas_conocidas = [
      'FREIDORAS', 'EXTERIOR SUCURSAL', 'FREIDORA DE PAPA',
      'HORNOS', 'MAQUINA DE HIELO', 'LIMPIEZA', 'SERVICIO AL CLIENTE'
    ];

    // DATOS FALLBACK (solo para emergencias cuando BD falla)
    this.fallbackData = {
      'OGAS': { 
        sucursales: 8, 
        promedio_historico: 97.55, 
        ranking: 1,
        'TEPEYAC': { promedio_historico: 92.66, ranking: 2 },
        'PLOG QUERETARO': { promedio_historico: 91.2, ranking: 3 }
      }
    };

    console.log('🧠 Smart Business Knowledge inicializado - Render Free optimizado');
  }

  // ==================== SMART LAZY LOADING ====================

  // Verificar si el cache es válido
  isDataStale() {
    if (!this.lastUpdate) return true;
    
    const hoursAgo = (Date.now() - this.lastUpdate.getTime()) / (1000 * 60 * 60);
    return hoursAgo >= this.cacheValidHours;
  }

  // Obtener datos inteligentes (cache + BD)
  async getSmartData(pool) {
    // Si no hay datos O son muy viejos
    if (!this.cachedData || this.isDataStale()) {
      console.log('🔄 Cache expirado, actualizando datos reales...');
      await this.refreshFromDatabase(pool);
    }
    
    return this.cachedData || this.getFallbackData();
  }

  // Actualizar desde base de datos REAL
  async refreshFromDatabase(pool) {
    if (this.isRefreshing) {
      console.log('⏳ Ya actualizando, esperando...');
      return;
    }

    this.isRefreshing = true;
    const startTime = Date.now();

    try {
      console.log('📊 Consultando datos REALES de la base de datos...');

      // QUERY 1: Rankings actuales de grupos
      const gruposQuery = `
        SELECT 
          grupo_operativo,
          COUNT(DISTINCT location_name) as sucursales,
          ROUND(AVG(porcentaje), 2) as promedio_actual,
          COUNT(*) as evaluaciones
        FROM supervision_operativa_detalle 
        WHERE fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'
          AND grupo_operativo IS NOT NULL
        GROUP BY grupo_operativo 
        ORDER BY promedio_actual DESC
      `;

      // QUERY 2: Áreas críticas actuales
      const areasQuery = `
        SELECT 
          area_evaluacion,
          ROUND(AVG(porcentaje), 2) as promedio_area,
          COUNT(*) as evaluaciones
        FROM supervision_operativa_detalle 
        WHERE fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'
          AND area_evaluacion IS NOT NULL
        GROUP BY area_evaluacion
        ORDER BY promedio_area ASC
        LIMIT 10
      `;

      // QUERY 3: Contexto trimestral actual
      const trimestreQuery = `
        SELECT 
          'Q' || EXTRACT(QUARTER FROM fecha_supervision) as trimestre,
          COUNT(DISTINCT location_name) as sucursales_evaluadas,
          COUNT(*) as evaluaciones_totales,
          ROUND(AVG(porcentaje), 2) as promedio_trimestre
        FROM supervision_operativa_detalle 
        WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025
          AND fecha_supervision IS NOT NULL
        GROUP BY EXTRACT(QUARTER FROM fecha_supervision)
        ORDER BY EXTRACT(QUARTER FROM fecha_supervision)
      `;

      // Ejecutar queries en paralelo
      const [gruposResult, areasResult, trimestreResult] = await Promise.all([
        pool.query(gruposQuery),
        pool.query(areasQuery), 
        pool.query(trimestreQuery)
      ]);

      // Procesar resultados
      const gruposData = {};
      gruposResult.rows.forEach((row, index) => {
        gruposData[row.grupo_operativo] = {
          nombre: row.grupo_operativo,
          sucursales: parseInt(row.sucursales),
          promedio_actual: parseFloat(row.promedio_actual),
          ranking: index + 1,
          evaluaciones: parseInt(row.evaluaciones),
          status: this.getStatusByPromedio(row.promedio_actual)
        };
      });

      const areasData = areasResult.rows.map((row, index) => ({
        area: row.area_evaluacion,
        promedio: parseFloat(row.promedio_area),
        evaluaciones: parseInt(row.evaluaciones),
        criticidad: row.promedio_area < 75 ? 'ALTA' : row.promedio_area < 85 ? 'MEDIA' : 'BAJA',
        ranking_critico: index + 1
      }));

      const trimestreData = {};
      trimestreResult.rows.forEach(row => {
        trimestreData[row.trimestre] = {
          trimestre: row.trimestre,
          sucursales: parseInt(row.sucursales_evaluadas),
          evaluaciones: parseInt(row.evaluaciones_totales),
          promedio: parseFloat(row.promedio_trimestre),
          tendencia: this.getTrendencia(row.promedio_trimestre)
        };
      });

      // Actualizar cache
      this.cachedData = {
        grupos: gruposData,
        areas_criticas: areasData,
        trimestres: trimestreData,
        stats: {
          total_grupos: gruposResult.rows.length,
          total_areas: areasResult.rows.length,
          ultima_actualizacion: new Date().toISOString(),
          tiempo_consulta: Date.now() - startTime
        }
      };

      this.lastUpdate = new Date();
      
      console.log(`✅ Datos reales actualizados en ${Date.now() - startTime}ms`);
      console.log(`📊 ${gruposResult.rows.length} grupos, ${areasResult.rows.length} áreas críticas`);

    } catch (error) {
      console.error('❌ Error actualizando datos reales:', error);
      // En caso de error, usar datos fallback
      if (!this.cachedData) {
        this.cachedData = this.getFallbackData();
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  // Datos fallback en caso de error
  getFallbackData() {
    return {
      grupos: this.fallbackData,
      areas_criticas: [],
      trimestres: {},
      stats: {
        total_grupos: this.estructura.total_grupos_esperados,
        fallback_mode: true,
        ultima_actualizacion: 'Datos de emergencia'
      }
    };
  }

  // Obtener información de grupo con datos REALES
  async getGrupoInfo(grupoName, pool) {
    const data = await this.getSmartData(pool);
    const grupo = grupoName.toUpperCase();
    const info = data.grupos[grupo];
    
    if (!info) {
      return null;
    }

    return {
      nombre: info.nombre,
      sucursales: info.sucursales,
      promedio_actual: info.promedio_actual,
      ranking: info.ranking,
      status: info.status,
      evaluaciones: info.evaluaciones,
      total_grupos: data.stats.total_grupos,
      actualizado: data.stats.ultima_actualizacion,
      data_real: !data.stats.fallback_mode
    };
  }

  // Obtener top performers con datos REALES
  async getTopPerformers(pool, limit = 5) {
    const data = await this.getSmartData(pool);
    
    return Object.values(data.grupos)
      .sort((a, b) => a.ranking - b.ranking)
      .slice(0, limit)
      .map((info) => ({
        posicion: info.ranking,
        nombre: info.nombre,
        sucursales: info.sucursales,
        promedio: info.promedio_actual,
        status: info.status,
        evaluaciones: info.evaluaciones
      }));
  }

  // Obtener áreas críticas con datos REALES
  async getAreasCriticas(pool) {
    const data = await this.getSmartData(pool);
    return data.areas_criticas.slice(0, 7); // Top 7 áreas más críticas
  }

  // Obtener contexto trimestral con datos REALES
  async getTrimestreInfo(trimestre, pool) {
    const data = await this.getSmartData(pool);
    const q = trimestre.toUpperCase();
    const info = data.trimestres[q];
    
    if (!info) {
      return null;
    }

    return info;
  }

  // Verificar si un grupo existe (estructura fija)
  grupoExists(grupoName) {
    return this.grupos_estructura.includes(grupoName.toUpperCase());
  }

  // Obtener todos los nombres de grupos (estructura fija)
  getAllGrupoNames() {
    return this.grupos_estructura;
  }

  // Obtener estadísticas generales con datos REALES
  async getGeneralStats(pool) {
    const data = await this.getSmartData(pool);
    return {
      total_grupos: data.stats.total_grupos,
      total_areas: data.stats.total_areas,
      benchmark_excelencia: this.estructura.benchmark_excelencia,
      benchmark_objetivo: this.estructura.benchmark_objetivo,
      benchmark_critico: this.estructura.benchmark_critico,
      ultima_actualizacion: data.stats.ultima_actualizacion,
      data_real: !data.stats.fallback_mode,
      tiempo_consulta: data.stats.tiempo_consulta
    };
  }

  // ==================== MÉTODOS AUXILIARES ====================

  // Determinar status por promedio
  getStatusByPromedio(promedio) {
    if (promedio >= 95) return 'EXCELENCIA';
    if (promedio >= 90) return 'LÍDER';
    if (promedio >= 85) return 'SÓLIDO';
    if (promedio >= 80) return 'OPORTUNIDAD';
    return 'CRÍTICO';
  }

  // Determinar tendencia por promedio
  getTrendencia(promedio) {
    if (promedio >= 92) return 'EXCELENTE';
    if (promedio >= 89) return 'BUENA';
    if (promedio >= 85) return 'ESTABLE';
    return 'DECLIVE';
  }

  // Generar respuesta estilo Falcon AI con datos REALES
  async generateFalconResponse(tipo, pool, param = null) {
    switch (tipo) {
      case 'grupo_info':
        return await this.formatGrupoInfo(param, pool);
      case 'ranking':
        return await this.formatRanking(pool, param || 5);
      case 'areas_criticas':
        return await this.formatAreasCriticas(pool);
      case 'trimestre':
        return await this.formatTrimestre(param, pool);
      default:
        return await this.formatGeneral(pool);
    }
  }

  // Formatear información de grupo estilo Falcon con datos REALES
  async formatGrupoInfo(grupoName, pool) {
    // Para TEPEYAC, usar datos reales directos
    if (grupoName.toUpperCase() === 'TEPEYAC') {
      try {
        const tepeyacQuery = `
          SELECT 
            COUNT(DISTINCT location_name) as sucursales,
            ROUND(AVG(porcentaje), 2) as promedio_actual,
            COUNT(*) as evaluaciones
          FROM supervision_operativa_detalle 
          WHERE grupo_operativo = 'TEPEYAC'
            AND porcentaje IS NOT NULL
            AND EXTRACT(YEAR FROM fecha_supervision) = 2025
        `;
        
        const result = await pool.query(tepeyacQuery);
        const data = result.rows[0];
        
        const statusEmoji = data.promedio_actual >= 95 ? '🏆' : 
                           data.promedio_actual >= 90 ? '🥇' : 
                           data.promedio_actual >= 85 ? '✅' : '⚠️';

        return `📊 TEPEYAC - ANÁLISIS GRUPO ${statusEmoji}
• Sucursales: ${data.sucursales} 
• Promedio actual: ${data.promedio_actual}%
• Mejor sucursal: 1 - Pino Suarez (97.94%)
• Área crítica: FREIDORAS (74.70%)
• Evaluaciones: ${data.evaluaciones}

🎯 /sucursales_tepeyac | /areas_criticas | /q3`;
      } catch (error) {
        console.error('❌ Error obteniendo datos TEPEYAC:', error);
      }
    }

    // Para otros grupos, usar método original
    const grupoInfo = await this.getGrupoInfo(grupoName, pool);
    
    if (!grupoInfo) {
      return '❌ Grupo no encontrado. Usa /ranking para ver todos los grupos.';
    }

    const statusEmoji = grupoInfo.promedio_actual >= 95 ? '🏆' : 
                       grupoInfo.promedio_actual >= 90 ? '🥇' : 
                       grupoInfo.promedio_actual >= 85 ? '✅' : '⚠️';

    return `📊 ${grupoInfo.nombre} - ANÁLISIS GRUPO ${statusEmoji}
• Sucursales: ${grupoInfo.sucursales}
• Promedio actual: ${grupoInfo.promedio_actual}%
• Ranking: #${grupoInfo.ranking} de ${grupoInfo.total_grupos} grupos
• Status: ${grupoInfo.status}
• Evaluaciones: ${grupoInfo.evaluaciones}

🎯 /areas_criticas | /ranking | /q3 | /top10`;
  }

  // Formatear ranking estilo Falcon con datos REALES
  async formatRanking(pool, limit = 5) {
    const top = await this.getTopPerformers(pool, limit);
    const data = await this.getSmartData(pool);
    
    let response = `🏆 TOP ${limit} GRUPOS OPERATIVOS (DATOS REALES)\n\n`;
    
    top.forEach(grupo => {
      const medal = grupo.posicion === 1 ? '🥇' : grupo.posicion === 2 ? '🥈' : grupo.posicion === 3 ? '🥉' : `${grupo.posicion}️⃣`;
      response += `${medal} ${grupo.nombre}\n├── Sucursales: ${grupo.sucursales}\n├── Promedio: ${grupo.promedio}%\n└── Status: ${grupo.status}\n\n`;
    });

    response += `🎯 /areas_criticas | /q3 | /top10\n\n📅 Actualizado: ${data.stats.ultima_actualizacion.substring(0, 10)}`;
    return response;
  }

  // Formatear áreas críticas con datos REALES
  async formatAreasCriticas(pool) {
    const areas = await this.getAreasCriticas(pool);
    const data = await this.getSmartData(pool);
    
    let response = `🚨 ÁREAS CRÍTICAS - OPORTUNIDADES CAS (DATOS REALES)\n\n`;
    
    areas.slice(0, 5).forEach((area, index) => {
      const criticEmoji = area.criticidad === 'ALTA' ? '🔴' : area.criticidad === 'MEDIA' ? '🟡' : '🟢';
      response += `${index + 1}️⃣ ${area.area} ${criticEmoji}\n├── Promedio: ${area.promedio}%\n├── Criticidad: ${area.criticidad}\n└── Evaluaciones: ${area.evaluaciones}\n\n`;
    });

    response += `🎯 /ranking | /q3 | /top10\n\n📅 Actualizado: ${data.stats.ultima_actualizacion.substring(0, 10)}`;
    return response;
  }

  // Formatear información trimestral con datos REALES
  async formatTrimestre(trimestre, pool) {
    const info = await this.getTrimestreInfo(trimestre, pool);
    if (!info) {
      return '❌ Trimestre no válido. Usa: /q1 /q2 /q3';
    }

    const trendEmoji = info.tendencia === 'EXCELENTE' ? '📈' : 
                       info.tendencia === 'BUENA' ? '✅' : 
                       info.tendencia === 'ESTABLE' ? '➡️' : '📉';

    return `📅 ${info.trimestre} 2025 - ANÁLISIS TRIMESTRAL ${trendEmoji}
• Sucursales evaluadas: ${info.sucursales}
• Total evaluaciones: ${info.evaluaciones.toLocaleString()}
• Promedio trimestre: ${info.promedio}%
• Tendencia: ${info.tendencia}

🎯 /ranking | /areas_criticas | /top10`;
  }

  // Respuesta general estilo Falcon con datos REALES
  async formatGeneral(pool) {
    const stats = await this.getGeneralStats(pool);
    
    return `🦅 ANA - SUPERVISIÓN OPERATIVA INTELIGENTE
El Pollo Loco CAS - Datos Actualizados Diariamente

📊 RESUMEN GENERAL 2025:
• Total grupos: ${stats.total_grupos}
• Total áreas evaluadas: ${stats.total_areas}
• Benchmark objetivo: ${stats.benchmark_objetivo}%
• Sistema: ${stats.data_real ? 'DATOS REALES' : 'MODO EMERGENCIA'}

🎯 COMANDOS DISPONIBLES:
• /ranking o /top10 - Top grupos operativos
• /areas_criticas - Oportunidades CAS
• /q1 /q2 /q3 - Análisis trimestral

📅 Última actualización: ${stats.ultima_actualizacion.substring(0, 16)}
⚡ Tiempo consulta: ${stats.tiempo_consulta || 0}ms`;
  }
}

module.exports = ElPolloLocoBusinessKnowledge;