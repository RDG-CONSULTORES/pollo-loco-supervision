// Enhanced AI Intelligence Module for El Pollo Loco Bot
// Sistema de inteligencia contextual basado en datos reales

class SupervisionAI {
    constructor(pool) {
        this.pool = pool;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    // Análisis inteligente de preguntas
    async analyzeAndRespond(question) {
        const analysis = this.analyzeQuestion(question);
        const data = await this.fetchRelevantData(analysis);
        return this.generateIntelligentResponse(question, analysis, data);
    }

    // Análisis semántico de la pregunta
    analyzeQuestion(question) {
        const lower = question.toLowerCase();
        const analysis = {
            timeframe: this.detectTimeframe(lower),
            metrics: this.detectMetrics(lower),
            entities: this.detectEntities(lower),
            intent: this.detectIntent(lower),
            quantity: this.detectQuantity(lower)
        };
        return analysis;
    }

    detectTimeframe(text) {
        if (text.includes('hoy') || text.includes('actual')) return 'current';
        if (text.includes('ayer')) return 'yesterday';
        if (text.includes('semana')) return 'week';
        if (text.includes('mes')) return 'month';
        if (text.includes('trimestre')) return 'quarter';
        if (text.includes('año')) return 'year';
        return 'all';
    }

    detectMetrics(text) {
        const metrics = [];
        if (text.includes('promedio') || text.includes('media')) metrics.push('average');
        if (text.includes('total') || text.includes('suma')) metrics.push('total');
        if (text.includes('máximo') || text.includes('mejor')) metrics.push('max');
        if (text.includes('mínimo') || text.includes('peor')) metrics.push('min');
        if (text.includes('tendencia') || text.includes('evolución')) metrics.push('trend');
        return metrics;
    }

    detectEntities(text) {
        const entities = [];
        if (text.includes('grupo') || text.includes('grupos')) entities.push('grupo');
        if (text.includes('sucursal') || text.includes('tienda')) entities.push('sucursal');
        if (text.includes('estado') || text.includes('región')) entities.push('estado');
        if (text.includes('indicador') || text.includes('área')) entities.push('indicador');
        if (text.includes('supervisor')) entities.push('supervisor');
        return entities;
    }

    detectIntent(text) {
        if (text.includes('cuál') || text.includes('cuáles')) return 'query';
        if (text.includes('cómo') || text.includes('como')) return 'explanation';
        if (text.includes('por qué') || text.includes('porque')) return 'reasoning';
        if (text.includes('comparar') || text.includes('versus')) return 'comparison';
        if (text.includes('mejorar') || text.includes('recomenda')) return 'recommendation';
        return 'general';
    }

    detectQuantity(text) {
        const match = text.match(/\d+/);
        if (match) return parseInt(match[0]);
        if (text.includes('top')) {
            const topMatch = text.match(/top\s*(\d+)/i);
            return topMatch ? parseInt(topMatch[1]) : 10;
        }
        return null;
    }

    // Obtener datos relevantes basados en el análisis
    async fetchRelevantData(analysis) {
        const data = {};
        
        try {
            // Datos básicos siempre útiles
            const kpisPromise = this.getCachedOrFetch('kpis', this.getKPIs.bind(this));
            
            // Datos según entidades detectadas
            const promises = [kpisPromise];
            
            if (analysis.entities.includes('grupo')) {
                promises.push(this.getCachedOrFetch('grupos', this.getGrupos.bind(this)));
            }
            
            if (analysis.entities.includes('estado')) {
                promises.push(this.getCachedOrFetch('estados', this.getEstados.bind(this)));
            }
            
            if (analysis.entities.includes('sucursal') || analysis.quantity) {
                promises.push(this.getCachedOrFetch('ranking', () => this.getRanking(analysis.quantity || 10)));
            }
            
            if (analysis.entities.includes('indicador') || analysis.metrics.includes('min')) {
                promises.push(this.getCachedOrFetch('indicadores', this.getIndicadores.bind(this)));
                promises.push(this.getCachedOrFetch('critical', this.getCritical.bind(this)));
            }
            
            if (analysis.timeframe !== 'all') {
                promises.push(this.getTimeframeData(analysis.timeframe));
            }
            
            const results = await Promise.all(promises);
            
            // Organizar resultados
            data.kpis = results[0];
            if (analysis.entities.includes('grupo')) data.grupos = results[1];
            if (analysis.entities.includes('estado')) data.estados = results[promises.length > 2 ? 2 : 1];
            if (analysis.entities.includes('sucursal')) data.ranking = results[promises.length - 1];
            if (analysis.entities.includes('indicador')) {
                data.indicadores = results[promises.length - 2];
                data.critical = results[promises.length - 1];
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    // Cache inteligente
    getCachedOrFetch(key, fetchFunction) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        return fetchFunction().then(data => {
            this.cache.set(key, { data, timestamp: Date.now() });
            return data;
        });
    }

    // Queries optimizadas
    async getKPIs() {
        const result = await this.pool.query(`
            SELECT 
                ROUND(AVG(porcentaje), 2) as promedio_general,
                COUNT(DISTINCT submission_id) as total_supervisiones,
                COUNT(DISTINCT location_name) as total_sucursales,
                COUNT(DISTINCT estado) as total_estados,
                COUNT(DISTINCT grupo_operativo) as total_grupos,
                ROUND(MAX(porcentaje), 2) as max_calificacion,
                ROUND(MIN(porcentaje), 2) as min_calificacion,
                ROUND(STDDEV(porcentaje), 2) as desviacion_estandar
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL
        `);
        return result.rows[0];
    }

    async getGrupos() {
        const result = await this.pool.query(`
            SELECT 
                grupo_operativo,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT location_name) as sucursales,
                ROUND(MIN(porcentaje), 2) as min_score,
                ROUND(MAX(porcentaje), 2) as max_score
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND grupo_operativo IS NOT NULL
            GROUP BY grupo_operativo
            ORDER BY AVG(porcentaje) DESC
        `);
        return result.rows;
    }

    async getEstados() {
        const result = await this.pool.query(`
            SELECT 
                estado,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                COUNT(DISTINCT location_name) as sucursales,
                COUNT(DISTINCT grupo_operativo) as grupos
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND estado IS NOT NULL
            GROUP BY estado
            ORDER BY AVG(porcentaje) DESC
        `);
        return result.rows;
    }

    async getRanking(limit = 10) {
        const result = await this.pool.query(`
            SELECT 
                location_name as sucursal,
                grupo_operativo,
                estado,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(DISTINCT submission_id) as supervisiones,
                ROUND(MIN(porcentaje), 2) as min_score,
                ROUND(MAX(porcentaje), 2) as max_score
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL
            GROUP BY location_name, grupo_operativo, estado
            ORDER BY AVG(porcentaje) DESC
            LIMIT $1
        `, [limit]);
        return result.rows;
    }

    async getIndicadores() {
        const result = await this.pool.query(`
            SELECT 
                area_evaluacion as indicador,
                ROUND(AVG(porcentaje), 2) as promedio,
                COUNT(*) as evaluaciones,
                COUNT(DISTINCT location_name) as sucursales_evaluadas
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND area_evaluacion IS NOT NULL
            GROUP BY area_evaluacion
            ORDER BY AVG(porcentaje) ASC
            LIMIT 20
        `);
        return result.rows;
    }

    async getCritical(threshold = 70) {
        const result = await this.pool.query(`
            SELECT 
                area_evaluacion as indicador,
                location_name as sucursal,
                grupo_operativo,
                estado,
                ROUND(AVG(porcentaje), 2) as promedio
            FROM supervision_operativa_detalle 
            WHERE porcentaje < $1 AND porcentaje IS NOT NULL
            GROUP BY area_evaluacion, location_name, grupo_operativo, estado
            ORDER BY AVG(porcentaje) ASC
            LIMIT 20
        `, [threshold]);
        return result.rows;
    }

    async getTimeframeData(timeframe) {
        let dateFilter = '';
        const now = new Date();
        
        switch(timeframe) {
            case 'current':
            case 'today':
                dateFilter = `DATE(fecha_supervision) = CURRENT_DATE`;
                break;
            case 'yesterday':
                dateFilter = `DATE(fecha_supervision) = CURRENT_DATE - INTERVAL '1 day'`;
                break;
            case 'week':
                dateFilter = `fecha_supervision >= CURRENT_DATE - INTERVAL '7 days'`;
                break;
            case 'month':
                dateFilter = `fecha_supervision >= CURRENT_DATE - INTERVAL '30 days'`;
                break;
            case 'quarter':
                dateFilter = `EXTRACT(QUARTER FROM fecha_supervision) = EXTRACT(QUARTER FROM CURRENT_DATE) 
                             AND EXTRACT(YEAR FROM fecha_supervision) = EXTRACT(YEAR FROM CURRENT_DATE)`;
                break;
        }
        
        if (!dateFilter) return null;
        
        const result = await this.pool.query(`
            SELECT 
                COUNT(DISTINCT submission_id) as supervisiones_periodo,
                ROUND(AVG(porcentaje), 2) as promedio_periodo,
                COUNT(DISTINCT location_name) as sucursales_periodo
            FROM supervision_operativa_detalle 
            WHERE porcentaje IS NOT NULL AND ${dateFilter}
        `);
        return result.rows[0];
    }

    // Generar respuesta inteligente
    generateIntelligentResponse(question, analysis, data) {
        if (!data || Object.keys(data).length === 0) {
            return this.generateFallbackResponse();
        }

        let response = '';
        
        // Respuestas específicas según el análisis
        if (analysis.entities.includes('grupo') && analysis.quantity) {
            response = this.generateTopGroupsResponse(data, analysis);
        } else if (analysis.intent === 'comparison') {
            response = this.generateComparisonResponse(data, analysis);
        } else if (analysis.metrics.includes('trend')) {
            response = this.generateTrendResponse(data, analysis);
        } else if (analysis.intent === 'recommendation') {
            response = this.generateRecommendationResponse(data, analysis);
        } else {
            response = this.generateGeneralResponse(question, data, analysis);
        }
        
        // Agregar contexto temporal si aplica
        if (analysis.timeframe !== 'all' && data.timeframe) {
            response += `\n\n📅 **Período**: ${this.getTimeframeLabel(analysis.timeframe)}\n`;
            response += `• Supervisiones: ${data.timeframe.supervisiones_periodo}\n`;
            response += `• Promedio: ${data.timeframe.promedio_periodo}%`;
        }
        
        return response;
    }

    generateTopGroupsResponse(data, analysis) {
        const limit = analysis.quantity || 5;
        let response = `📊 **Top ${limit} Grupos Operativos**\n\n`;
        
        if (data.grupos) {
            const topGroups = data.grupos.slice(0, limit);
            topGroups.forEach((grupo, index) => {
                const emoji = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
                response += `${emoji} **${grupo.grupo_operativo}**\n`;
                response += `   • Promedio: ${grupo.promedio}%\n`;
                response += `   • Supervisiones: ${grupo.supervisiones}\n`;
                response += `   • Sucursales: ${grupo.sucursales}\n`;
                response += `   • Rango: ${grupo.min_score}% - ${grupo.max_score}%\n\n`;
            });
            
            // Insights adicionales
            if (data.kpis) {
                response += `\n📈 **Contexto General**:\n`;
                response += `• Promedio global: ${data.kpis.promedio_general}%\n`;
                response += `• Total grupos evaluados: ${data.kpis.total_grupos}\n`;
                
                const bestGroup = topGroups[0];
                const diff = (parseFloat(bestGroup.promedio) - parseFloat(data.kpis.promedio_general)).toFixed(2);
                response += `• El mejor grupo supera el promedio por: ${diff}%`;
            }
        }
        
        return response;
    }

    generateComparisonResponse(data, analysis) {
        let response = `📊 **Análisis Comparativo**\n\n`;
        
        if (data.grupos && data.estados) {
            response += `**Grupos Operativos vs Estados**\n\n`;
            response += `🏆 Mejor Grupo: ${data.grupos[0].grupo_operativo} (${data.grupos[0].promedio}%)\n`;
            response += `🏆 Mejor Estado: ${data.estados[0].estado} (${data.estados[0].promedio}%)\n\n`;
            
            response += `📈 **Dispersión de Rendimiento**:\n`;
            const grupoRange = this.calculateRange(data.grupos.map(g => parseFloat(g.promedio)));
            const estadoRange = this.calculateRange(data.estados.map(e => parseFloat(e.promedio)));
            
            response += `• Grupos: ${grupoRange.min}% - ${grupoRange.max}% (Δ ${grupoRange.range}%)\n`;
            response += `• Estados: ${estadoRange.min}% - ${estadoRange.max}% (Δ ${estadoRange.range}%)\n`;
        }
        
        return response;
    }

    generateRecommendationResponse(data, analysis) {
        let response = `💡 **Recomendaciones Basadas en Datos**\n\n`;
        
        if (data.critical && data.critical.length > 0) {
            response += `🚨 **Áreas Críticas que Requieren Atención**:\n\n`;
            const criticalByIndicador = this.groupBy(data.critical, 'indicador');
            
            Object.entries(criticalByIndicador).slice(0, 3).forEach(([indicador, items]) => {
                response += `**${indicador}** (${items.length} sucursales afectadas)\n`;
                response += `• Promedio: ${this.calculateAverage(items.map(i => parseFloat(i.promedio)))}%\n`;
                response += `• Sucursales: ${items.slice(0, 3).map(i => i.sucursal).join(', ')}\n\n`;
            });
        }
        
        if (data.indicadores) {
            const worstIndicators = data.indicadores.slice(0, 3);
            response += `📋 **Indicadores con Mayor Oportunidad de Mejora**:\n`;
            worstIndicators.forEach((ind, index) => {
                response += `${index + 1}. ${ind.indicador}: ${ind.promedio}% (${ind.sucursales_evaluadas} sucursales)\n`;
            });
        }
        
        return response;
    }

    generateGeneralResponse(question, data, analysis) {
        let response = `🤖 **Análisis Inteligente**\n\n`;
        
        // Respuesta adaptada según los datos disponibles
        if (data.kpis) {
            response += `📊 **Resumen Ejecutivo**:\n`;
            response += `• Promedio General: ${data.kpis.promedio_general}%\n`;
            response += `• Supervisiones Totales: ${data.kpis.total_supervisiones}\n`;
            response += `• Sucursales Evaluadas: ${data.kpis.total_sucursales}\n`;
            response += `• Estados con Presencia: ${data.kpis.total_estados}\n\n`;
        }
        
        if (data.grupos && data.grupos.length > 0) {
            response += `🏆 **Top 3 Grupos**:\n`;
            data.grupos.slice(0, 3).forEach((g, i) => {
                response += `${i + 1}. ${g.grupo_operativo}: ${g.promedio}%\n`;
            });
            response += `\n`;
        }
        
        if (data.critical && data.critical.length > 0) {
            response += `⚠️ **Alertas**: ${data.critical.length} áreas críticas detectadas\n`;
            response += `• Más crítico: ${data.critical[0].indicador} (${data.critical[0].promedio}%)\n`;
        }
        
        return response;
    }

    // Utilidades
    calculateRange(values) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        return { min, max, range: (max - min).toFixed(2) };
    }

    calculateAverage(values) {
        const sum = values.reduce((a, b) => a + b, 0);
        return (sum / values.length).toFixed(2);
    }

    groupBy(array, key) {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    }

    getTimeframeLabel(timeframe) {
        const labels = {
            current: 'Hoy',
            yesterday: 'Ayer',
            week: 'Últimos 7 días',
            month: 'Últimos 30 días',
            quarter: 'Trimestre actual',
            year: 'Año actual'
        };
        return labels[timeframe] || 'Todo el período';
    }

    generateFallbackResponse() {
        return `🤖 No pude obtener los datos en este momento. 

Intenta preguntas como:
• "¿Cuáles son los top 5 grupos del trimestre actual?"
• "¿Qué sucursales tienen problemas críticos?"
• "Compara el desempeño de grupos vs estados"
• "¿Qué áreas necesitan mejorar?"`;
    }
}

module.exports = SupervisionAI;