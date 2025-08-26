// DYNAMIC QUERY ENGINE - Motor de Consultas Dinámicas para Ana Ultra Inteligente
const { Pool } = require('pg');

class DynamicQueryEngine {
  constructor(pool, ultraIntelligence) {
    this.pool = pool;
    this.ultraIntelligence = ultraIntelligence;
    
    // PATRONES DE CONSULTA INTELIGENTES
    this.queryPatterns = {
      // Análisis comparativo
      comparative: {
        keywords: ['mejor', 'peor', 'comparar', 'vs', 'versus', 'diferencia'],
        generator: 'generateComparativeQuery'
      },
      
      // Análisis temporal
      temporal: {
        keywords: ['evolución', 'tendencia', 'cambio', 'progreso', 'historial'],
        generator: 'generateTemporalQuery'
      },
      
      // Análisis geográfico
      geographic: {
        keywords: ['estado', 'región', 'ubicación', 'donde', 'geografia'],
        generator: 'generateGeographicQuery'
      },
      
      // Análisis de desempeño
      performance: {
        keywords: ['desempeño', 'rendimiento', 'calificación', 'puntuación'],
        generator: 'generatePerformanceQuery'
      },
      
      // Análisis de áreas
      areas: {
        keywords: ['área', 'areas', 'oportunidad', 'fortaleza', 'debilidad'],
        generator: 'generateAreaAnalysisQuery'
      },
      
      // Recomendaciones y soporte
      recommendations: {
        keywords: ['recomendación', 'apoyo', 'capacitación', 'mejora', 'plan'],
        generator: 'generateRecommendationQuery'
      }
    };
  }

  // 🧠 PROCESADOR PRINCIPAL DE CONSULTAS
  async processDynamicQuery(question, context = {}) {
    console.log(`🎯 PROCESANDO CONSULTA DINÁMICA: "${question}"`);
    
    try {
      // 1. Analizar la intención de la consulta
      const intent = await this.analyzeQueryIntent(question);
      
      // 2. Extraer entidades (grupos, sucursales, estados, áreas)
      const entities = await this.extractEntities(question);
      
      // 3. Generar consulta SQL dinámica
      const dynamicQuery = await this.generateDynamicSQL(intent, entities, question);
      
      // 4. Ejecutar consulta
      const queryResult = await this.executeDynamicQuery(dynamicQuery);
      
      // 5. Generar respuesta inteligente
      const intelligentResponse = await this.generateIntelligentResponse(
        question, intent, entities, queryResult
      );
      
      return intelligentResponse;
      
    } catch (error) {
      console.error('❌ Error en consulta dinámica:', error);
      return this.generateErrorResponse(question, error);
    }
  }

  async analyzeQueryIntent(question) {
    const lower = question.toLowerCase();
    const detectedPatterns = [];
    
    // Detectar múltiples patrones
    for (const [patternName, pattern] of Object.entries(this.queryPatterns)) {
      for (const keyword of pattern.keywords) {
        if (lower.includes(keyword)) {
          detectedPatterns.push({
            name: patternName,
            keyword: keyword,
            generator: pattern.generator,
            confidence: this.calculateKeywordConfidence(keyword, lower)
          });
        }
      }
    }
    
    // Ordenar por confianza
    detectedPatterns.sort((a, b) => b.confidence - a.confidence);
    
    return {
      primary_intent: detectedPatterns[0]?.name || 'general',
      secondary_intents: detectedPatterns.slice(1, 3),
      patterns: detectedPatterns,
      complexity: this.assessQueryComplexity(lower),
      requires_analysis: this.requiresDeepAnalysis(lower)
    };
  }

  async extractEntities(question) {
    const lower = question.toLowerCase();
    const entities = {
      grupos: [],
      sucursales: [],
      estados: [],
      areas: [],
      trimestres: [],
      metrics: []
    };

    // Extraer grupos operativos (todos los 20)
    const allGrupos = [
      'OGAS', 'PLOG QUERETARO', 'EPL SO', 'TEC', 'TEPEYAC', 'GRUPO MATAMOROS',
      'PLOG LAGUNA', 'EFM', 'RAP', 'GRUPO RIO BRAVO', 'PLOG NUEVO LEON',
      'GRUPO PIEDRAS NEGRAS', 'GRUPO CANTERA ROSA (MORELIA)', 'EXPO',
      'OCHTER TAMPICO', 'GRUPO SABINAS HIDALGO', 'GRUPO CENTRITO', 'CRR',
      'GRUPO NUEVO LAREDO (RUELAS)', 'GRUPO SALTILLO'
    ];

    for (const grupo of allGrupos) {
      if (lower.includes(grupo.toLowerCase()) || 
          this.fuzzyMatch(grupo, question)) {
        entities.grupos.push(grupo);
      }
    }

    // Extraer trimestres
    const trimestres = ['Q1', 'Q2', 'Q3', 'Q4'];
    for (const trimestre of trimestres) {
      if (lower.includes(trimestre.toLowerCase()) || 
          lower.includes(`${trimestre.substring(1)} trimestre`)) {
        entities.trimestres.push(trimestre);
      }
    }

    // Extraer estados
    const estados = ['nuevo león', 'tamaulipas', 'coahuila', 'michoacán', 'querétaro'];
    for (const estado of estados) {
      if (lower.includes(estado)) {
        entities.estados.push(estado);
      }
    }

    // Extraer métricas solicitadas
    const metrics = [
      { keywords: ['promedio', 'calificación'], metric: 'promedio' },
      { keywords: ['mejor', 'máximo'], metric: 'maximo' },
      { keywords: ['peor', 'mínimo'], metric: 'minimo' },
      { keywords: ['tendencia', 'evolución'], metric: 'tendencia' },
      { keywords: ['ranking', 'posición'], metric: 'ranking' }
    ];

    for (const metricDef of metrics) {
      for (const keyword of metricDef.keywords) {
        if (lower.includes(keyword)) {
          entities.metrics.push(metricDef.metric);
          break;
        }
      }
    }

    return entities;
  }

  async generateDynamicSQL(intent, entities, originalQuestion) {
    console.log(`🔧 Generando SQL dinámico para intent: ${intent.primary_intent}`);
    
    // Base query structure
    let query = {
      select: [],
      from: 'supervision_operativa_detalle',
      where: [],
      groupBy: [],
      orderBy: [],
      having: [],
      limit: null
    };

    // Construir SELECT basado en entidades y intent
    if (entities.grupos.length > 0) {
      query.select.push('grupo_operativo');
      query.groupBy.push('grupo_operativo');
    }

    if (entities.estados.length > 0 || intent.primary_intent === 'geographic') {
      query.select.push('estado');
      query.groupBy.push('estado');
    }

    // Agregar métricas basadas en intent
    switch (intent.primary_intent) {
      case 'performance':
        query.select.push(
          'AVG(porcentaje) as promedio',
          'MIN(porcentaje) as minimo', 
          'MAX(porcentaje) as maximo',
          'COUNT(*) as evaluaciones',
          'COUNT(DISTINCT sucursal_clean) as sucursales'
        );
        break;
        
      case 'temporal':
        query.select.push(
          'EXTRACT(QUARTER FROM fecha_supervision) as quarter',
          'EXTRACT(YEAR FROM fecha_supervision) as year',
          'AVG(porcentaje) as promedio',
          'COUNT(*) as evaluaciones'
        );
        query.groupBy.push('quarter', 'year');
        query.orderBy.push('year', 'quarter');
        break;
        
      case 'areas':
        query.select.push(
          'area_evaluacion',
          'AVG(porcentaje) as promedio',
          'COUNT(*) as evaluaciones'
        );
        query.groupBy.push('area_evaluacion');
        query.orderBy.push('promedio ASC'); // Oportunidades primero
        break;
        
      case 'comparative':
        query.select.push(
          'AVG(porcentaje) as promedio',
          'STDDEV(porcentaje) as variabilidad',
          'COUNT(DISTINCT sucursal_clean) as sucursales'
        );
        break;
        
      default:
        query.select.push(
          'AVG(porcentaje) as promedio',
          'COUNT(*) as evaluaciones',
          'COUNT(DISTINCT sucursal_clean) as sucursales'
        );
    }

    // Construir WHERE clauses
    query.where.push("porcentaje IS NOT NULL");

    if (entities.grupos.length > 0) {
      const gruposStr = entities.grupos.map(g => `'${g}'`).join(',');
      query.where.push(`grupo_operativo IN (${gruposStr})`);
    }

    if (entities.estados.length > 0) {
      const estadosStr = entities.estados.map(e => `'${e}'`).join(',');
      query.where.push(`LOWER(estado) IN (${estadosStr})`);
    }

    if (entities.trimestres.length > 0) {
      const quarterConditions = entities.trimestres.map(q => {
        const quarterNum = q.substring(1);
        return `EXTRACT(QUARTER FROM fecha_supervision) = ${quarterNum}`;
      }).join(' OR ');
      query.where.push(`(${quarterConditions})`);
    }

    // Construir query final
    const finalQuery = this.buildSQLString(query);
    
    console.log('📝 Query generado:', finalQuery);
    return finalQuery;
  }

  buildSQLString(query) {
    let sql = `SELECT ${query.select.join(', ')} FROM ${query.from}`;
    
    if (query.where.length > 0) {
      sql += ` WHERE ${query.where.join(' AND ')}`;
    }
    
    if (query.groupBy.length > 0) {
      sql += ` GROUP BY ${query.groupBy.join(', ')}`;
    }
    
    if (query.having.length > 0) {
      sql += ` HAVING ${query.having.join(' AND ')}`;
    }
    
    if (query.orderBy.length > 0) {
      sql += ` ORDER BY ${query.orderBy.join(', ')}`;
    }
    
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }
    
    return sql;
  }

  async executeDynamicQuery(sqlQuery) {
    try {
      const result = await this.pool.query(sqlQuery);
      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        query: sqlQuery
      };
    } catch (error) {
      console.error('❌ Error ejecutando query dinámico:', error);
      return {
        success: false,
        error: error.message,
        query: sqlQuery
      };
    }
  }

  async generateIntelligentResponse(question, intent, entities, queryResult) {
    if (!queryResult.success) {
      return `🤔 No pude procesar esa consulta específica. ${queryResult.error}`;
    }

    if (queryResult.rows.length === 0) {
      return this.generateNoDataResponse(question, entities);
    }

    // Generar respuesta basada en intent
    switch (intent.primary_intent) {
      case 'performance':
        return this.generatePerformanceResponse(question, entities, queryResult.rows);
      case 'temporal':
        return this.generateTemporalResponse(question, entities, queryResult.rows);
      case 'geographic':
        return this.generateGeographicResponse(question, entities, queryResult.rows);
      case 'areas':
        return this.generateAreaAnalysisResponse(question, entities, queryResult.rows);
      case 'comparative':
        return this.generateComparativeResponse(question, entities, queryResult.rows);
      default:
        return this.generateGeneralResponse(question, entities, queryResult.rows);
    }
  }

  generatePerformanceResponse(question, entities, data) {
    let response = `📊 **Análisis de Desempeño**\n\n`;
    
    if (entities.grupos.length > 0) {
      response += `🎯 **Grupos analizados:** ${entities.grupos.join(', ')}\n\n`;
    }

    data.forEach((row, index) => {
      response += `**${index + 1}. ${row.grupo_operativo || 'Grupo'}**\n`;
      response += `   📈 Promedio: ${parseFloat(row.promedio || 0).toFixed(2)}%\n`;
      if (row.sucursales) {
        response += `   🏪 Sucursales: ${row.sucursales}\n`;
      }
      if (row.evaluaciones) {
        response += `   📋 Evaluaciones: ${row.evaluaciones}\n`;
      }
      response += `\n`;
    });

    // Agregar insights inteligentes
    if (data.length > 1) {
      const mejor = data.reduce((prev, current) => 
        parseFloat(prev.promedio) > parseFloat(current.promedio) ? prev : current
      );
      const peor = data.reduce((prev, current) => 
        parseFloat(prev.promedio) < parseFloat(current.promedio) ? prev : current
      );
      
      response += `💡 **Mi análisis:**\n`;
      response += `• **Mejor desempeño:** ${mejor.grupo_operativo} (${parseFloat(mejor.promedio).toFixed(2)}%)\n`;
      response += `• **Necesita apoyo:** ${peor.grupo_operativo} (${parseFloat(peor.promedio).toFixed(2)}%)\n`;
      
      const gap = parseFloat(mejor.promedio) - parseFloat(peor.promedio);
      response += `• **Brecha de desempeño:** ${gap.toFixed(2)} puntos\n`;
    }

    return response;
  }

  generateTemporalResponse(question, entities, data) {
    let response = `📈 **Análisis de Evolución Temporal**\n\n`;
    
    if (entities.grupos.length > 0) {
      response += `🎯 **Grupo:** ${entities.grupos[0]}\n\n`;
    }

    response += `📅 **Evolución por trimestre:**\n`;
    data.forEach(row => {
      const quarterName = `Q${row.quarter} ${row.year}`;
      response += `• **${quarterName}**: ${parseFloat(row.promedio || 0).toFixed(2)}% (${row.evaluaciones} evaluaciones)\n`;
    });

    // Calcular tendencia
    if (data.length >= 2) {
      const primero = data[0];
      const ultimo = data[data.length - 1];
      const cambio = parseFloat(ultimo.promedio) - parseFloat(primero.promedio);
      
      response += `\n💡 **Tendencia detectada:**\n`;
      if (cambio > 2) {
        response += `📈 **Mejora significativa** de ${cambio.toFixed(2)} puntos`;
      } else if (cambio > 0) {
        response += `📈 **Mejora moderada** de ${cambio.toFixed(2)} puntos`;
      } else if (cambio < -2) {
        response += `📉 **Declive preocupante** de ${Math.abs(cambio).toFixed(2)} puntos`;
      } else {
        response += `➡️ **Desempeño estable** (${cambio.toFixed(2)} puntos de cambio)`;
      }
    }

    return response;
  }

  generateGeographicResponse(question, entities, data) {
    let response = `📍 **Análisis Geográfico**\n\n`;
    
    response += `🗺️ **Desempeño por estado:**\n`;
    data.forEach((row, index) => {
      response += `**${index + 1}. ${row.estado}**\n`;
      response += `   📊 Promedio: ${parseFloat(row.promedio || 0).toFixed(2)}%\n`;
      if (row.sucursales) {
        response += `   🏪 Sucursales: ${row.sucursales}\n`;
      }
      response += `\n`;
    });

    return response;
  }

  generateAreaAnalysisResponse(question, entities, data) {
    let response = `🎯 **Análisis de Áreas**\n\n`;
    
    if (question.toLowerCase().includes('oportunidad')) {
      response += `🔍 **Principales áreas de oportunidad:**\n`;
    } else {
      response += `📊 **Análisis por área de evaluación:**\n`;
    }

    data.slice(0, 10).forEach((row, index) => {
      const emoji = index < 3 ? '🔴' : index < 6 ? '🟡' : '🟢';
      response += `${emoji} **${row.area_evaluacion}**\n`;
      response += `   📈 Promedio: ${parseFloat(row.promedio || 0).toFixed(2)}%\n`;
      response += `   📋 Evaluaciones: ${row.evaluaciones}\n\n`;
    });

    return response;
  }

  generateComparativeResponse(question, entities, data) {
    let response = `⚖️ **Análisis Comparativo**\n\n`;
    
    data.forEach((row, index) => {
      response += `**${row.grupo_operativo || `Elemento ${index + 1}`}**\n`;
      response += `   📊 Promedio: ${parseFloat(row.promedio || 0).toFixed(2)}%\n`;
      if (row.variabilidad) {
        response += `   📈 Consistencia: ${parseFloat(row.variabilidad).toFixed(2)} (${parseFloat(row.variabilidad) < 5 ? 'muy consistente' : 'variable'})\n`;
      }
      response += `\n`;
    });

    return response;
  }

  generateGeneralResponse(question, entities, data) {
    let response = `🤖 **Análisis General**\n\n`;
    
    response += `📋 **Resultados encontrados:** ${data.length}\n\n`;
    
    data.slice(0, 5).forEach((row, index) => {
      response += `**${index + 1}.** `;
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'number') {
          response += `${key}: ${parseFloat(row[key]).toFixed(2)} `;
        } else {
          response += `${row[key]} `;
        }
      });
      response += `\n`;
    });

    return response;
  }

  generateNoDataResponse(question, entities) {
    return `🤔 No encontré datos específicos para esa consulta.

**Criterios buscados:**
${entities.grupos.length > 0 ? `• Grupos: ${entities.grupos.join(', ')}\n` : ''}
${entities.estados.length > 0 ? `• Estados: ${entities.estados.join(', ')}\n` : ''}
${entities.trimestres.length > 0 ? `• Trimestres: ${entities.trimestres.join(', ')}\n` : ''}

¿Podrías reformular la pregunta o probar con otros criterios? 😊`;
  }

  generateErrorResponse(question, error) {
    return `🚨 Ocurrió un error procesando tu consulta: "${question}"

Error técnico: ${error.message}

Por favor intenta reformular la pregunta o contacta al administrador del sistema.`;
  }

  // UTILIDADES
  fuzzyMatch(target, text) {
    const similarity = this.calculateSimilarity(target.toLowerCase(), text.toLowerCase());
    return similarity > 0.8;
  }

  calculateSimilarity(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }
    
    return 1 - track[str2.length][str1.length] / Math.max(str1.length, str2.length);
  }

  calculateKeywordConfidence(keyword, text) {
    const occurrences = (text.match(new RegExp(keyword, 'gi')) || []).length;
    const proximity = text.indexOf(keyword);
    return (occurrences * 0.7) + (proximity === -1 ? 0 : (1 - proximity / text.length) * 0.3);
  }

  assessQueryComplexity(text) {
    let complexity = 0;
    
    if (text.includes('comparar') || text.includes('vs')) complexity += 2;
    if (text.includes('evolución') || text.includes('tendencia')) complexity += 2;
    if (text.includes('mejor') && text.includes('peor')) complexity += 1;
    if ((text.match(/\b(y|o|pero|además)\b/g) || []).length > 0) complexity += 1;
    
    return complexity > 3 ? 'high' : complexity > 1 ? 'medium' : 'low';
  }

  requiresDeepAnalysis(text) {
    const deepKeywords = ['análisis', 'profundo', 'detallado', 'recomendación', 'estrategia'];
    return deepKeywords.some(keyword => text.includes(keyword));
  }
}

module.exports = DynamicQueryEngine;