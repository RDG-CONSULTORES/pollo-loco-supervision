// =====================================================
// INTEGRACIÓN WEB APP CON TELEGRAM BOT ANA
// Permite a Ana mostrar botón del dashboard y procesar datos
// =====================================================

const express = require('express');
const { Pool } = require('pg');

class WebAppIntegration {
    constructor(bot, pool) {
        this.bot = bot;
        this.pool = pool;
        
        // URL base de la web app (configurar según deployment)
        this.webAppUrl = process.env.WEBAPP_URL || 'https://pollo-loco-dashboard.render.com';
        
        console.log('🌐 Web App Integration inicializada:', this.webAppUrl);
    }

    // =====================================================
    // COMANDOS DE ANA PARA MOSTRAR DASHBOARD
    // =====================================================

    // Comando principal para mostrar dashboard
    getWebAppKeyboard(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const url = queryParams ? `${this.webAppUrl}?${queryParams}` : this.webAppUrl;
        
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "📊 Ver Dashboard Interactivo",
                            web_app: { url }
                        }
                    ],
                    [
                        {
                            text: "📍 Ver Mapa de Sucursales",
                            web_app: { url: `${this.webAppUrl}?tab=mapa` }
                        }
                    ],
                    [
                        {
                            text: "📈 Ver Análisis de Performance",
                            web_app: { url: `${this.webAppUrl}?tab=grupos` }
                        }
                    ]
                ]
            }
        };
    }

    // Respuesta de Ana con dashboard contextual
    async sendDashboardResponse(chatId, message, context = {}) {
        const baseResponse = `🤖 **Ana - Dashboard Interactivo**\n\n${message}`;
        
        // Determinar filtros basados en contexto
        const filters = this.extractFilters(context);
        const keyboard = this.getWebAppKeyboard(filters);
        
        await this.bot.sendMessage(chatId, baseResponse, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }

    // Extraer filtros del contexto de conversación
    extractFilters(context) {
        const filters = {};
        
        if (context.grupoOperativo) {
            filters.grupo = context.grupoOperativo;
        }
        
        if (context.trimestre) {
            filters.trimestre = context.trimestre;
        }
        
        return filters;
    }

    // =====================================================
    // RESPUESTAS INTELIGENTES CON DASHBOARD
    // =====================================================

    // Respuesta para análisis de grupos
    async respondGroupAnalysis(chatId, grupo) {
        const message = `📊 **Análisis de ${grupo}**\n\nAquí tienes el dashboard interactivo filtrado específicamente para ${grupo}. Puedes ver:\n\n• 📍 Ubicación de todas las sucursales\n• 📈 Performance detallado por áreas\n• 🎯 Comparación con otros grupos\n• 📅 Tendencias trimestrales\n\n¡Explora los datos con filtros dinámicos!`;
        
        await this.sendDashboardResponse(chatId, message, { grupoOperativo: grupo });
    }

    // Respuesta para análisis de performance general
    async respondPerformanceAnalysis(chatId) {
        const message = `📈 **Análisis de Performance General**\n\n¡Perfecto! He preparado el dashboard completo con todos los KPIs principales:\n\n• 🏆 Rankings de grupos operativos\n• 🎯 Áreas de oportunidad identificadas\n• 📊 Métricas de red completas\n• 🗺️ Vista geográfica de todas las ubicaciones\n\nUsa los filtros para hacer análisis más específicos.`;
        
        await this.sendDashboardResponse(chatId, message);
    }

    // Respuesta para análisis de sucursales específicas
    async respondLocationAnalysis(chatId, filters = {}) {
        let message = `🏪 **Análisis de Sucursales**\n\n`;
        
        if (filters.estado) {
            message += `Análisis específico para **${filters.estado}**.\n\n`;
        }
        
        message += `El dashboard te permite:\n\n• 📍 Ver ubicaciones exactas en el mapa\n• 📊 Comparar performance entre sucursales\n• 🎯 Identificar oportunidades por zona\n• 📈 Analizar tendencias geográficas`;
        
        await this.sendDashboardResponse(chatId, message, filters);
    }

    // =====================================================
    // PROCESAMIENTO DE DATOS FROM WEB APP
    // =====================================================

    // Manejar datos enviados desde la web app
    async handleWebAppData(data, chatId) {
        try {
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            
            switch (parsedData.action) {
                case 'request_report':
                    await this.generateReport(chatId, parsedData);
                    break;
                    
                case 'share_filters':
                    await this.shareFilteredAnalysis(chatId, parsedData);
                    break;
                    
                case 'export_data':
                    await this.exportAnalysis(chatId, parsedData);
                    break;
                    
                default:
                    console.log('📱 Unknown web app action:', parsedData.action);
            }
            
        } catch (error) {
            console.error('❌ Error procesando datos de web app:', error);
            await this.bot.sendMessage(chatId, '🤖 Hubo un error procesando tu solicitud del dashboard.');
        }
    }

    // Generar reporte basado en datos del dashboard
    async generateReport(chatId, data) {
        const { stats } = data;
        
        const report = `📊 **Reporte Generado desde Dashboard**\n\n` +
                      `🏪 **Sucursales analizadas:** ${stats.locations}\n` +
                      `👥 **Grupos operativos:** ${stats.groups}\n` +
                      `📈 **Performance promedio:** ${stats.performance}%\n\n` +
                      `✨ **Insight de Ana:** ${this.generateInsight(stats.performance)}\n\n` +
                      `🎯 ¿Te gustaría que profundice en algún grupo específico o área de oportunidad?`;
        
        await this.bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
    }

    // Compartir análisis filtrado
    async shareFilteredAnalysis(chatId, data) {
        const { filters } = data;
        const activeFilters = Object.entries(filters).filter(([key, value]) => value);
        
        if (activeFilters.length === 0) {
            await this.bot.sendMessage(chatId, '📊 Vista general de toda la red - ¡análisis completo disponible!');
            return;
        }
        
        const filterDescription = activeFilters.map(([key, value]) => {
            switch (key) {
                case 'grupo': return `👥 Grupo: ${value}`;
                case 'estado': return `📍 Estado: ${value}`;
                case 'trimestre': return `📅 Trimestre: Q${value} 2025`;
                default: return `${key}: ${value}`;
            }
        }).join('\n');
        
        const message = `🔍 **Análisis Filtrado Compartido**\n\n${filterDescription}\n\n¿Te gustaría que haga un análisis más profundo de estos resultados específicos?`;
        
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    // Generar insight automático basado en performance
    generateInsight(performance) {
        if (performance >= 95) {
            return "¡Excelente! La red está operando en niveles óptimos. Considera replicar estas mejores prácticas.";
        } else if (performance >= 90) {
            return "Muy buen rendimiento general. Hay oportunidades específicas para llegar a la excelencia.";
        } else if (performance >= 85) {
            return "Performance sólido con margen de mejora. Identifica las áreas críticas para optimización.";
        } else {
            return "Se requiere atención inmediata. Concentra esfuerzos en las sucursales y áreas de menor rendimiento.";
        }
    }

    // =====================================================
    // MÉTODOS PARA INTEGRAR CON ANA INTELLIGENT
    // =====================================================

    // Detectar si una pregunta debería mostrar dashboard
    shouldShowDashboard(question) {
        const dashboardTriggers = [
            'dashboard', 'mapa', 'gráfico', 'visual', 'interactivo',
            'ubicación', 'coordenadas', 'geográfico',
            'comparar', 'análisis', 'tendencia', 'evolución',
            'filtrar', 'explorar', 'investigar'
        ];
        
        return dashboardTriggers.some(trigger => 
            question.toLowerCase().includes(trigger)
        );
    }

    // Enriquecer respuesta de Ana con dashboard
    async enrichResponseWithDashboard(originalResponse, context, chatId) {
        // Si la respuesta ya incluye análisis numérico, ofrecer dashboard
        if (this.hasNumericData(originalResponse) || this.shouldShowDashboard(context.originalQuestion)) {
            
            const enrichedResponse = originalResponse + 
                `\n\n💡 **¡Tip de Ana!** Para una exploración más profunda e interactiva de estos datos, usa el dashboard:`;
            
            await this.sendDashboardResponse(chatId, enrichedResponse, context);
            return true;
        }
        
        return false;
    }

    // Detectar si la respuesta contiene datos numéricos
    hasNumericData(response) {
        const numericPatterns = [
            /\d+%/g,           // Porcentajes
            /\d+\.\d+/g,       // Decimales
            /\d+ sucursales?/gi, // Sucursales
            /\d+ grupos?/gi,    // Grupos
            /promedio/gi,      // Promedios
            /(top|mejor|peor)/gi // Rankings
        ];
        
        return numericPatterns.some(pattern => pattern.test(response));
    }
}

module.exports = WebAppIntegration;