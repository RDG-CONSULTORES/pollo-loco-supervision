// Real Data Intelligence System - 100% Based on Actual Supervision Data
const { Pool } = require('pg');

class RealSupervisionIntelligence {
  constructor(pool) {
    this.pool = pool;
    this.realIndicators = [
      'area_marinado_pct', 'proceso_marinado_pct', 'cuarto_frio_1_pct', 'cuarto_frio_2_pct',
      'refrigeradores_servicio_pct', 'congelador_papa_pct', 'area_cocina_pct', 'almacen_jarabes_pct',
      'almacen_general_pct', 'almacen_quimicos_pct', 'maquina_hielo_pct', 'hornos_pct',
      'plancha_mesa_trabajo_pct', 'freidora_papa_pct', 'freidoras_general_pct', 'conservador_papa_pct',
      'asadores_pct', 'cajas_totopo_pct', 'bano_empleados_pct', 'lavado_manos_pct',
      'lavado_utensilios_pct', 'barra_servicio_pct', 'area_comedor_pct', 'bano_clientes_pct',
      'dispensador_refrescos_pct', 'barra_salsas_pct', 'tiempos_servicio_pct', 'exterior_sucursal_pct',
      'documentacion_control_pct'
    ];
    
    this.categoryMapping = {
      'marinado': ['area_marinado_pct', 'proceso_marinado_pct'],
      'refrigeracion': ['cuarto_frio_1_pct', 'cuarto_frio_2_pct', 'refrigeradores_servicio_pct', 'congelador_papa_pct'],
      'cocina': ['area_cocina_pct', 'hornos_pct', 'plancha_mesa_trabajo_pct', 'freidora_papa_pct', 'freidoras_general_pct', 'asadores_pct'],
      'almacen': ['almacen_jarabes_pct', 'almacen_general_pct', 'almacen_quimicos_pct'],
      'higiene': ['bano_empleados_pct', 'lavado_manos_pct', 'lavado_utensilios_pct', 'bano_clientes_pct'],
      'servicio': ['barra_servicio_pct', 'area_comedor_pct', 'dispensador_refrescos_pct', 'barra_salsas_pct', 'tiempos_servicio_pct'],
      'general': ['exterior_sucursal_pct', 'documentacion_control_pct', 'maquina_hielo_pct', 'conservador_papa_pct', 'cajas_totopo_pct']
    };
  }

  async analyzeQuestion(question) {
    const analysis = {
      intent: this.detectIntent(question),
      entity: this.detectEntity(question),
      timeframe: this.detectTimeframe(question),
      quantity: this.detectQuantity(question),
      indicators: this.detectIndicators(question)
    };
    
    console.log('🧠 Question Analysis:', JSON.stringify(analysis, null, 2));
    return analysis;
  }

  detectIntent(question) {
    const lower = question.toLowerCase();
    if (lower.includes('top') || lower.includes('mejor') || lower.includes('ranking')) return 'ranking';
    if (lower.includes('oportunidad') || lower.includes('crítico') || lower.includes('problema') || lower.includes('bajo')) return 'opportunities';
    if (lower.includes('promedio') || lower.includes('general') || lower.includes('kpi')) return 'kpis';
    if (lower.includes('sucursal') && lower.includes('visit')) return 'visits';
    if (lower.includes('compar')) return 'comparison';
    return 'general';
  }

  detectEntity(question) {
    const lower = question.toLowerCase();
    
    // Real sucursales from database
    const realSucursales = ['gómez morin', 'rómulo garza', 'lázaro cárdenas', 'plaza 1500', 'vasconcelos', 
      'aztlan', 'aztlán', 'chapultepec', 'gonzalitos', 'lincoln', 'pueblito', 'escobedo', 'ruiz cortinez', 'pino suárez'];
    
    for (const sucursal of realSucursales) {
      if (lower.includes(sucursal)) return { type: 'sucursal', name: sucursal };
    }
    
    // Check for "grupo" references (actually sucursales in our data)
    if (lower.includes('tepeyac')) return { type: 'sucursal', name: 'tepeyac' };
    if (lower.includes('grupo')) return { type: 'grupo', name: 'general' };
    
    return { type: 'general', name: null };
  }

  detectTimeframe(question) {
    const lower = question.toLowerCase();
    if (lower.includes('trimestre actual') || lower.includes('actual')) return 'current_quarter';
    if (lower.includes('semana')) return 'current_week';
    if (lower.includes('mes')) return 'current_month';
    if (lower.includes('año')) return 'current_year';
    return 'all_time';
  }

  detectQuantity(question) {
    const numbers = question.match(/\d+/g);
    if (numbers) return parseInt(numbers[0]);
    
    const lower = question.toLowerCase();
    if (lower.includes('top 5') || lower.includes('5 ')) return 5;
    if (lower.includes('top 10') || lower.includes('10 ')) return 10;
    if (lower.includes('top 3') || lower.includes('3 ')) return 3;
    
    return 5; // Default
  }

  detectIndicators(question) {
    const lower = question.toLowerCase();
    const detected = [];
    
    if (lower.includes('hornos')) detected.push('hornos_pct');
    if (lower.includes('cocina')) detected.push('area_cocina_pct');
    if (lower.includes('baño') || lower.includes('bano')) detected.push('bano_empleados_pct', 'bano_clientes_pct');
    if (lower.includes('servicio')) detected.push('tiempos_servicio_pct', 'barra_servicio_pct');
    if (lower.includes('marinado')) detected.push('area_marinado_pct', 'proceso_marinado_pct');
    
    return detected.length > 0 ? detected : this.realIndicators;
  }

  async getCurrentQuarterData() {
    try {
      // Q3 2025 (Jul-Sep) since current date is Aug 22, 2025
      const currentQuarter = await this.pool.query(`
        SELECT 
          location_name,
          COUNT(*) as supervisiones,
          AVG(calificacion_general_pct) as promedio,
          MIN(submitted_at) as primera_supervision,
          MAX(submitted_at) as ultima_supervision
        FROM supervision_operativa_cas 
        WHERE submitted_at >= '2025-07-01' AND submitted_at < '2025-10-01'
        GROUP BY location_name
        ORDER BY promedio DESC;
      `);
      
      return currentQuarter.rows;
    } catch (error) {
      console.error('❌ Current quarter error:', error);
      return [];
    }
  }

  async getOpportunityAreas(sucursalName = null, limit = 5) {
    try {
      let query = `
        SELECT location_name,
               hornos_pct, area_cocina_pct, bano_empleados_pct, 
               tiempos_servicio_pct, area_marinado_pct,
               bano_clientes_pct, lavado_manos_pct, almacen_general_pct,
               exterior_sucursal_pct, documentacion_control_pct,
               submitted_at
        FROM supervision_operativa_cas 
      `;
      
      if (sucursalName) {
        query += ` WHERE LOWER(location_name) LIKE LOWER('%${sucursalName}%')`;
      }
      
      query += ` ORDER BY submitted_at DESC LIMIT 20`;
      
      const result = await this.pool.query(query);
      
      if (result.rows.length === 0) {
        return { areas: [], message: `No se encontraron datos para ${sucursalName || 'la consulta especificada'}` };
      }
      
      // Calculate averages and find lowest scoring areas
      const areas = [];
      const indicators = this.realIndicators;
      
      for (const indicator of indicators) {
        const values = result.rows
          .map(row => row[indicator])
          .filter(val => val !== null && val !== undefined);
        
        if (values.length > 0) {
          const avg = values.reduce((sum, val) => sum + parseFloat(val), 0) / values.length;
          areas.push({
            indicator: indicator.replace('_pct', '').replace('_', ' '),
            promedio: avg.toFixed(2),
            indicador_db: indicator
          });
        }
      }
      
      // Sort by lowest scores (opportunities)
      areas.sort((a, b) => parseFloat(a.promedio) - parseFloat(b.promedio));
      
      return {
        areas: areas.slice(0, limit),
        sucursal: result.rows[0]?.location_name,
        fechas: {
          desde: result.rows[result.rows.length - 1]?.submitted_at,
          hasta: result.rows[0]?.submitted_at
        }
      };
      
    } catch (error) {
      console.error('❌ Opportunity areas error:', error);
      return { areas: [], message: 'Error al obtener áreas de oportunidad' };
    }
  }

  async getTopPerformers(limit = 5, timeframe = 'current_quarter') {
    try {
      let dateFilter = '';
      
      switch (timeframe) {
        case 'current_quarter':
          dateFilter = "submitted_at >= '2025-07-01' AND submitted_at < '2025-10-01'";
          break;
        case 'current_month':
          dateFilter = "submitted_at >= '2025-08-01'";
          break;
        default:
          dateFilter = "submitted_at >= '2025-03-01'"; // All available data
      }
      
      const query = `
        SELECT 
          location_name,
          COUNT(*) as supervisiones,
          AVG(calificacion_general_pct) as promedio,
          MAX(submitted_at) as ultima_supervision
        FROM supervision_operativa_cas 
        WHERE ${dateFilter}
        GROUP BY location_name
        HAVING COUNT(*) >= 1
        ORDER BY promedio DESC
        LIMIT ${limit};
      `;
      
      const result = await this.pool.query(query);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Top performers error:', error);
      return [];
    }
  }

  // ANTI-HALLUCINATION: Only return data that exists in database
  validateResponse(data) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return "❌ No se encontraron datos para esta consulta específica. Intenta con comandos como /kpis o /grupos.";
    }
    return null; // Data is valid
  }

  // Validate that sucursal exists in real data
  async validateSucursal(sucursalName) {
    try {
      const result = await this.pool.query(`
        SELECT DISTINCT location_name 
        FROM supervision_operativa_cas 
        WHERE LOWER(location_name) LIKE LOWER('%${sucursalName}%')
        LIMIT 1;
      `);
      
      return result.rows.length > 0 ? result.rows[0].location_name : null;
    } catch (error) {
      console.error('❌ Sucursal validation error:', error);
      return null;
    }
  }

  // Get real trimester data (Q3 2025: Jul-Sep)
  async getCurrentTrimesterFilter() {
    return {
      start: '2025-07-01',
      end: '2025-10-01',
      name: 'Q3 2025'
    };
  }

  // Validate response contains only real indicators
  validateIndicators(response) {
    const forbiddenTerms = [
      'atención al cliente', 'control de inventario', 'atención cliente',
      'inventario', 'servicio al cliente', 'customer service'
    ];
    
    const lower = response.toLowerCase();
    for (const term of forbiddenTerms) {
      if (lower.includes(term)) {
        console.log(`⚠️ HALLUCINATION DETECTED: Response contains forbidden term "${term}"`);
        return false;
      }
    }
    
    return true;
  }
}

module.exports = RealSupervisionIntelligence;