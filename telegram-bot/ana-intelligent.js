// =========================================
// ANA V2 - SISTEMA ESTRUCTURADO CON CONTEXTO
// Inspirado en Falcon AI + Mejoras personalizadas
// =========================================

const OpenAI = require('openai');

class AnaV2Structured {
  constructor(pool) {
    this.pool = pool;
    
    // Initialize OpenAI
    this.hasOpenAI = !!process.env.OPENAI_API_KEY;
    if (this.hasOpenAI) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    // Contexto de usuarios (en memoria - luego BD)
    this.userContexts = new Map();
    
    // Cache para datos en vivo (5 minutos)
    this.dataCache = new Map();
    this.cacheTime = 5 * 60 * 1000; // 5 minutos
    
    // Grupos operativos disponibles
    this.gruposDisponibles = [
      'OGAS', 'TEPEYAC', 'PLOG QUERETARO', 'EPL SO', 'TEC', 
      'EXPO', 'EFM', 'CRR', 'RAP', 'PLOG LAGUNA',
      'GRUPO MATAMOROS', 'GRUPO RIO BRAVO', 'GRUPO SALTILLO',
      'PLOG NUEVO LEON', 'OCHTER TAMPICO', 'GRUPO CANTERA ROSA (MORELIA)',
      'GRUPO CENTRITO', 'GRUPO NUEVO LAREDO (RUELAS)', 'GRUPO SABINAS HIDALGO',
      'GRUPO PIEDRAS NEGRAS'
    ];
    
    console.log('🚀 Ana V2 Structured inicializada - Sistema híbrido con contexto');
  }
  
  // ===========================================
  // FASE 1: SISTEMA DE CONTEXTO
  // ===========================================
  
  // Punto de entrada principal
  async processMessage(message, chatId) {
    console.log(`📝 Ana V2 procesando: "${message}" (Chat: ${chatId})`);
    
    // Verificar si es usuario nuevo o necesita onboarding
    const userContext = this.getUserContext(chatId);
    
    if (!userContext.grupoOperativo || message.toLowerCase().includes('/start')) {
      return this.handleOnboarding(message, chatId);
    }
    
    // Usuario ya tiene contexto - procesar normalmente
    return this.processWithContext(message, chatId, userContext);
  }
  
  // ===========================================
  // FASE 3: SISTEMA DE MENÚS HÍBRIDO
  // ===========================================
  
  // Procesar mensaje con contexto existente
  async processWithContext(message, chatId, userContext) {
    const input = message.trim();
    
    // Agregar al historial
    this.addToHistory(chatId, input);
    
    // 1. COMANDOS ESPECIALES
    if (input.toLowerCase().includes('/start') || input === 'menu' || input === 'menú') {
      return this.getDashboardPersonalizado(userContext);
    }
    
    if (input === '6' || input.toLowerCase().includes('cambiar grupo') || input.toLowerCase().includes('cambiar contexto')) {
      // Resetear contexto para nuevo onboarding
      userContext.onboardingStep = null;
      userContext.grupoOperativo = null; 
      userContext.rol = null;
      this.updateUserContext(chatId, userContext);
      return this.handleOnboarding('/start', chatId);
    }
    
    // 2. NAVEGACIÓN POR NÚMEROS (menú)
    const menuResponse = await this.handleMenuNavigation(input, userContext);
    if (menuResponse) {
      return menuResponse;
    }
    
    // 3. COMANDOS FALCON AI LEGACY
    const falconResponse = await this.handleFalconCommands(input, userContext);
    if (falconResponse) {
      return falconResponse;
    }
    
    // 4. LENGUAJE NATURAL DIRECTO
    const naturalResponse = await this.handleNaturalLanguage(input, userContext);
    if (naturalResponse) {
      return naturalResponse;
    }
    
    // 5. FALLBACK - No se entendió
    return this.getHelpMessage(userContext);
  }
  
  // Navegación por números del menú
  async handleMenuNavigation(input, userContext) {
    const numero = input.trim();
    const { grupoOperativo, rol } = userContext;
    
    // Mapeo de opciones según contexto
    const menuMap = this.getMenuMapping(grupoOperativo, rol);
    
    if (menuMap[numero]) {
      const accion = menuMap[numero];
      return await this.executeMenuAction(accion, userContext);
    }
    
    return null; // No es navegación por menú
  }
  
  // Obtener mapeo de menú según contexto
  getMenuMapping(grupo, rol) {
    if (grupo === 'EPL CAS') {
      // Menú EPL CAS por rol
      if (rol === 'directivo') {
        return {
          '1': 'ranking_completo',
          '2': 'areas_criticas_marca', 
          '3': 'tendencias_anuales',
          '4': 'analisis_regional',
          '5': 'benchmarks_kpis'
        };
      } else if (rol === 'gerente') {
        return {
          '1': 'mi_region',
          '2': 'areas_criticas',
          '3': 'ranking_grupos', 
          '4': 'comparar_regiones',
          '5': 'tendencias'
        };
      } else {
        return {
          '1': 'estado_marca',
          '2': 'benchmarks',
          '3': 'mi_seguimiento',
          '4': 'mejores_practicas',
          '5': 'areas_criticas'
        };
      }
    } else {
      // Menú grupo específico por rol
      if (rol === 'directivo') {
        return {
          '1': 'mi_performance',
          '2': 'mis_sucursales',
          '3': 'areas_criticas',
          '4': 'vs_otros_grupos',
          '5': 'tendencias'
        };
      } else if (rol === 'gerente') {
        return {
          '1': 'performance_detalle', 
          '2': 'ranking_sucursales',
          '3': 'areas_oportunidad',
          '4': 'benchmarks',
          '5': 'comparar'
        };
      } else {
        return {
          '1': 'como_vamos',
          '2': 'mis_sucursales',
          '3': 'problemas',
          '4': 'areas_criticas',
          '5': 'seguimiento'
        };
      }
    }
  }
  
  // Mensaje de ayuda contextual
  getHelpMessage(userContext) {
    const { grupoOperativo, rol } = userContext;
    
    return `🤖 No entendí tu mensaje. Aquí tienes opciones:

📱 **NAVEGACIÓN RÁPIDA:**
• Escribe 1, 2, 3, 4, 5 para usar el menú
• Escribe "menu" para volver al dashboard

💬 **LENGUAJE NATURAL:**
• "como vamos" - Performance actual
• "ranking" - Posiciones y comparación  
• "areas criticas" - Problemas identificados
• "sucursales" - Ranking de tiendas

⚡ **COMANDOS FALCON:**
• /q3, /q2, /q1 - Análisis por trimestre
• /areas - Áreas críticas
• /ranking - Rankings completos

🎯 **CONTEXTO ACTUAL:**
Grupo: ${grupoOperativo}
Rol: ${rol}

💡 Escribe "cambiar grupo" para cambiar contexto`;
  }
  
  // Ejecutar acciones del menú y comandos
  async executeMenuAction(accion, userContext) {
    const { grupoOperativo } = userContext;
    
    switch (accion) {
      case 'ranking_completo':
        return await this.getRankingCompleto();
        
      case 'areas_criticas_marca':
      case 'areas_criticas':
        return await this.getAreasCriticas(grupoOperativo);
        
      case 'mi_performance':
      case 'como_vamos':
      case 'performance_detalle':
        return await this.getPerformanceDetalle(grupoOperativo);
        
      case 'mis_sucursales':
      case 'ranking_sucursales':
        return await this.getRankingSucursales(grupoOperativo);
        
      case 'estado_marca':
        return await this.getEstadoMarca();
        
      case 'tendencias':
      case 'tendencias_anuales':
        return await this.getTendencias(grupoOperativo);
        
      case 'benchmarks':
      case 'benchmarks_kpis':
        return await this.getBenchmarks(grupoOperativo);
        
      // Nuevas acciones específicas
      case 'analisis_regional':
        return await this.getAnalisisRegional();
        
      case 'mi_region':
        return await this.getMiRegion(userContext);
        
      case 'ranking_grupos':
        return await this.getRankingGrupos();
        
      case 'comparar_regiones':
        return await this.getCompararRegiones();
        
      case 'vs_otros_grupos':
        return await this.getVsOtrosGrupos(grupoOperativo);
        
      case 'areas_oportunidad':
        return await this.getAreasOportunidad(grupoOperativo);
        
      case 'comparar':
        return await this.getComparar(grupoOperativo);
        
      case 'problemas':
        return await this.getProblemas(grupoOperativo);
        
      case 'seguimiento':
        return await this.getSeguimiento(grupoOperativo);
        
      case 'mejores_practicas':
        return await this.getMejoresPracticas();
        
      case 'mi_seguimiento':
        return await this.getMiSeguimiento(userContext);
        
      default:
        return `🔧 Función "${accion}" en desarrollo\n\n💡 Usa el menú principal para navegar`;
    }
  }
  
  // Comandos Falcon AI legacy
  async handleFalconCommands(input, userContext) {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('/q3')) {
      return await this.getAnalysisQ3(userContext.grupoOperativo);
    }
    
    if (lowerInput.includes('/q2')) {
      return await this.getAnalysisQ2(userContext.grupoOperativo);
    }
    
    if (lowerInput.includes('/q1')) {
      return await this.getAnalysisQ1(userContext.grupoOperativo);
    }
    
    if (lowerInput.includes('/areas')) {
      return await this.getAreasCriticas(userContext.grupoOperativo);
    }
    
    if (lowerInput.includes('/ranking')) {
      if (userContext.grupoOperativo === 'EPL CAS') {
        return await this.getRankingCompleto();
      } else {
        return await this.getRankingSucursales(userContext.grupoOperativo);
      }
    }
    
    if (lowerInput.includes('/trimestre')) {
      return await this.getComparativoTrimestres(userContext.grupoOperativo);
    }
    
    return null; // No es comando Falcon
  }
  
  // Lenguaje natural directo
  async handleNaturalLanguage(input, userContext) {
    const lowerInput = input.toLowerCase();
    const { grupoOperativo } = userContext;
    
    // Patrones de lenguaje natural
    if (lowerInput.includes('como va') || lowerInput.includes('performance')) {
      return await this.getPerformanceDetalle(grupoOperativo);
    }
    
    if (lowerInput.includes('ranking') || lowerInput.includes('posicion')) {
      if (grupoOperativo === 'EPL CAS') {
        return await this.getRankingCompleto();
      } else {
        return await this.getRankingSucursales(grupoOperativo);
      }
    }
    
    if (lowerInput.includes('areas') && (lowerInput.includes('criticas') || lowerInput.includes('problemas'))) {
      return await this.getAreasCriticas(grupoOperativo);
    }
    
    if (lowerInput.includes('sucursales') || lowerInput.includes('tiendas')) {
      return await this.getRankingSucursales(grupoOperativo);
    }
    
    if (lowerInput.includes('tendencias') || lowerInput.includes('trimestre')) {
      return await this.getTendencias(grupoOperativo);
    }
    
    if (lowerInput.includes('benchmark') || lowerInput.includes('objetivo')) {
      return await this.getBenchmarks(grupoOperativo);
    }
    
    return null; // No se reconoció patrón
  }
  
  // Onboarding - Selección de grupo y rol
  handleOnboarding(message, chatId) {
    const userContext = this.getUserContext(chatId);
    
    // Paso 1: Bienvenida y selección de grupo
    if (!userContext.onboardingStep || message.toLowerCase().includes('/start')) {
      userContext.onboardingStep = 'seleccionar_grupo';
      this.updateUserContext(chatId, userContext);
      
      return this.getMenuSeleccionGrupo();
    }
    
    // Paso 2: Procesar selección de grupo
    if (userContext.onboardingStep === 'seleccionar_grupo') {
      const grupoSeleccionado = this.parseGrupoSelection(message);
      
      if (!grupoSeleccionado) {
        return '❌ Selección no válida. Por favor elige un número del menú o escribe el nombre del grupo.';
      }
      
      userContext.grupoOperativo = grupoSeleccionado;
      userContext.onboardingStep = 'seleccionar_rol';
      this.updateUserContext(chatId, userContext);
      
      return this.getMenuSeleccionRol(grupoSeleccionado);
    }
    
    // Paso 3: Procesar selección de rol y completar onboarding
    if (userContext.onboardingStep === 'seleccionar_rol') {
      const rol = this.parseRolSelection(message);
      
      if (!rol) {
        return '❌ Rol no válido. Selecciona: 1 (Supervisor), 2 (Gerente), 3 (Directivo)';
      }
      
      userContext.rol = rol;
      userContext.onboardingStep = 'completado';
      userContext.fechaRegistro = new Date();
      this.updateUserContext(chatId, userContext);
      
      return this.getDashboardPersonalizado(userContext);
    }
  }
  
  // Menú de selección de grupo operativo
  getMenuSeleccionGrupo() {
    let menu = `👋 ¡Hola! Soy Ana, tu asistente de supervisiones El Pollo Loco

🏢 GRUPOS OPERATIVOS:
`;
    
    // Mostrar grupos en formato compacto
    this.gruposDisponibles.forEach((grupo, index) => {
      const numero = (index + 1).toString().padStart(2, '0');
      menu += `${numero}️⃣ ${grupo}\n`;
    });
    
    menu += `
🎯 CORPORATIVO:
22⃣ EPL CAS - Toda la Marca
└─ Análisis consolidado completo
└─ KPIs corporativos  
└─ Vista directiva general

💡 Selecciona tu opción escribiendo el número o el nombre...`;
    
    return menu;
  }
  
  // Menú de selección de rol
  getMenuSeleccionRol(grupo) {
    return `✅ Perfecto! Has seleccionado: ${grupo}

👤 Ahora, ¿cuál es tu rol?

1️⃣ Supervisor
└─ Vista operativa de tu grupo
└─ Métricas de sucursales
└─ Seguimiento diario

2️⃣ Gerente  
└─ Análisis comparativo
└─ Tendencias y benchmarks
└─ Reportes consolidados

3️⃣ Directivo
└─ KPIs estratégicos  
└─ Análisis corporativo
└─ Dashboard ejecutivo

💡 Selecciona 1, 2 o 3...`;
  }
  
  // Parsear selección de grupo
  parseGrupoSelection(message) {
    const input = message.trim();
    
    // Por número
    const numeroMatch = input.match(/^(\d+)/);
    if (numeroMatch) {
      const numero = parseInt(numeroMatch[1]);
      
      // EPL CAS
      if (numero === 22) {
        return 'EPL CAS';
      }
      
      // Grupos normales  
      if (numero >= 1 && numero <= this.gruposDisponibles.length) {
        return this.gruposDisponibles[numero - 1];
      }
    }
    
    // Por nombre (buscar coincidencia)
    const inputUpper = input.toUpperCase();
    
    // Buscar EPL CAS
    if (inputUpper.includes('EPL') || inputUpper.includes('CAS') || inputUpper.includes('MARCA')) {
      return 'EPL CAS';
    }
    
    // Buscar grupo por nombre
    for (const grupo of this.gruposDisponibles) {
      if (inputUpper.includes(grupo.split(' ')[0]) || // Primera palabra
          inputUpper.includes(grupo)) { // Nombre completo
        return grupo;
      }
    }
    
    return null;
  }
  
  // Parsear selección de rol
  parseRolSelection(message) {
    const input = message.trim().toLowerCase();
    
    if (input.includes('1') || input.includes('supervisor')) {
      return 'supervisor';
    }
    if (input.includes('2') || input.includes('gerente')) {
      return 'gerente';
    }
    if (input.includes('3') || input.includes('directivo')) {
      return 'directivo';
    }
    
    return null;
  }
  
  // ===========================================
  // GESTIÓN DE CONTEXTO
  // ===========================================
  
  // Obtener contexto de usuario
  getUserContext(chatId) {
    if (!this.userContexts.has(chatId)) {
      this.userContexts.set(chatId, {
        grupoOperativo: null,
        rol: null,
        onboardingStep: null,
        ultimasConsultas: [],
        preferencias: {
          formatoCompacto: true,
          mostrarBenchmarks: true
        },
        fechaRegistro: null,
        ultimaActividad: new Date()
      });
    }
    
    const context = this.userContexts.get(chatId);
    context.ultimaActividad = new Date();
    return context;
  }
  
  // Actualizar contexto de usuario
  updateUserContext(chatId, context) {
    this.userContexts.set(chatId, context);
  }
  
  // Agregar consulta al historial
  addToHistory(chatId, consulta) {
    const context = this.getUserContext(chatId);
    context.ultimasConsultas.unshift(consulta);
    
    // Mantener solo las últimas 10
    if (context.ultimasConsultas.length > 10) {
      context.ultimasConsultas = context.ultimasConsultas.slice(0, 10);
    }
    
    this.updateUserContext(chatId, context);
  }
  
  // ===========================================
  // FASE 2: DASHBOARD PERSONALIZADO
  // ===========================================
  
  // Generar dashboard personalizado según contexto
  async getDashboardPersonalizado(userContext) {
    const { grupoOperativo, rol } = userContext;
    
    try {
      if (grupoOperativo === 'EPL CAS') {
        return await this.getDashboardEPLCAS(rol);
      } else {
        return await this.getDashboardGrupo(grupoOperativo, rol);
      }
    } catch (error) {
      console.error('Error generando dashboard:', error);
      return this.getDashboardFallback(grupoOperativo, rol);
    }
  }
  
  // Dashboard EPL CAS (corporativo)
  async getDashboardEPLCAS(rol) {
    // Obtener datos consolidados (con cache)
    const data = await this.getDataConsolidada();
    
    let dashboard = `🏆 EPL CAS - DASHBOARD CORPORATIVO Q3 2025

📊 ESTADO GENERAL DE LA MARCA:
• Performance promedio: ${data.promedioGeneral}% ${this.getEmoji(data.promedioGeneral)}
• Grupos en excelencia (95%+): ${data.gruposExcelencia}/${data.totalGrupos} (${Math.round(data.gruposExcelencia/data.totalGrupos*100)}%)  
• Grupos en objetivo (85%+): ${data.gruposObjetivo}/${data.totalGrupos} (${Math.round(data.gruposObjetivo/data.totalGrupos*100)}%)
• Grupos críticos (<85%): ${data.gruposCriticos}/${data.totalGrupos} (${Math.round(data.gruposCriticos/data.totalGrupos*100)}%)

🎯 TOP 5 GRUPOS:`;
    
    data.top5.forEach((grupo, i) => {
      dashboard += `\n${i+1}️⃣ ${grupo.porcentaje}% ${this.getEmoji(grupo.porcentaje)} ${grupo.nombre}`;
    });
    
    if (data.gruposCriticos > 0) {
      dashboard += `\n\n🚨 GRUPOS EN ATENCIÓN:`;
      data.gruposCriticosDetalle.forEach(grupo => {
        dashboard += `\n• ${grupo.porcentaje}% 🚨 ${grupo.nombre}`;
      });
    }
    
    dashboard += `\n\n📈 ACCIONES ${rol.toUpperCase()}:`;
    
    if (rol === 'directivo') {
      dashboard += `
1️⃣ Ranking completo     4️⃣ Análisis regional
2️⃣ Áreas críticas marca 5️⃣ Benchmarks KPIs
3️⃣ Tendencias anuales   6️⃣ Cambiar contexto`;
    } else if (rol === 'gerente') {
      dashboard += `
1️⃣ Mi región           4️⃣ Comparar regiones  
2️⃣ Áreas críticas      5️⃣ Tendencias
3️⃣ Ranking grupos      6️⃣ Cambiar contexto`;
    } else {
      dashboard += `
1️⃣ Estado marca        4️⃣ Mejores prácticas
2️⃣ Benchmarks          5️⃣ Áreas críticas  
3️⃣ Mi seguimiento      6️⃣ Cambiar contexto`;
    }
    
    return dashboard;
  }
  
  // Dashboard de grupo específico  
  async getDashboardGrupo(grupo, rol) {
    // Obtener datos del grupo (con cache)
    const data = await this.getDataGrupo(grupo);
    
    let dashboard = `🏆 ${grupo.toUpperCase()} - DASHBOARD Q3 2025

📊 TU GRUPO:
• Performance: ${data.performance}% ${this.getEmoji(data.performance)}
• Ranking: ${data.ranking}/${data.totalGrupos} grupos`;
    
    if (data.sucursales > 0) {
      dashboard += `\n• Sucursales supervisadas: ${data.sucursales}`;
    }
    
    // Contexto vs marca
    const diferencia = data.performance - data.promedioMarca;
    const signo = diferencia >= 0 ? '+' : '';
    dashboard += `\n• vs Promedio marca: ${signo}${diferencia.toFixed(1)}% ${diferencia >= 0 ? '📈' : '📉'}`;
    
    // Estado del grupo
    if (data.performance >= 95) {
      dashboard += `\n• Status: 🏆 Excelencia corporativa`;
    } else if (data.performance >= 90) {
      dashboard += `\n• Status: ✅ Objetivo corporativo`;
    } else if (data.performance >= 85) {
      dashboard += `\n• Status: ⚠️ Requiere atención`;
    } else {
      dashboard += `\n• Status: 🚨 Acción inmediata`;
    }
    
    dashboard += `\n\n🎯 ACCIONES ${rol.toUpperCase()}:`;
    
    if (rol === 'directivo') {
      dashboard += `
1️⃣ Mi performance      4️⃣ vs Otros grupos
2️⃣ Mis sucursales      5️⃣ Tendencias  
3️⃣ Áreas críticas      6️⃣ Cambiar grupo`;
    } else if (rol === 'gerente') {
      dashboard += `
1️⃣ Performance detalle 4️⃣ Benchmarks
2️⃣ Ranking sucursales  5️⃣ Comparar
3️⃣ Áreas oportunidad   6️⃣ Cambiar grupo`;
    } else {
      dashboard += `
1️⃣ Como vamos          4️⃣ Áreas críticas
2️⃣ Mis sucursales      5️⃣ Seguimiento
3️⃣ Problemas           6️⃣ Cambiar grupo`;
    }
    
    return dashboard;
  }
  
  // ===========================================
  // UTILIDADES
  // ===========================================
  
  // Obtener emoji según performance
  getEmoji(porcentaje) {
    if (porcentaje >= 95) return '⭐⭐⭐';
    if (porcentaje >= 90) return '⭐⭐';  
    if (porcentaje >= 85) return '⭐';
    return '🚨';
  }
  
  // Dashboard fallback en caso de error
  getDashboardFallback(grupo, rol) {
    return `🏆 ${grupo} - DASHBOARD Q3 2025

⚠️ Datos actualizándose...

🎯 OPCIONES DISPONIBLES:
1️⃣ Reintentar dashboard
2️⃣ Ver menú básico  
3️⃣ Cambiar grupo
4️⃣ Ayuda

💡 Los datos se actualizan cada 5 minutos`;
  }
  
  // ===========================================
  // FASE 5: DATOS EN VIVO CON CACHE  
  // ===========================================
  
  // Obtener datos consolidados con cache
  async getDataConsolidada() {
    const cacheKey = 'consolidada_q3';
    
    // Verificar cache
    if (this.isValidCache(cacheKey)) {
      return this.dataCache.get(cacheKey).data;
    }
    
    try {
      // Query consolidada de todos los grupos
      const query = `
        WITH grupo_stats AS (
          SELECT 
            grupo_operativo_limpio as grupo,
            ROUND(AVG(porcentaje), 2) as promedio,
            COUNT(DISTINCT location_name) as sucursales
          FROM supervision_operativa_clean 
          WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
            AND grupo_operativo_limpio IS NOT NULL
          GROUP BY grupo_operativo_limpio
        )
        SELECT 
          grupo,
          promedio,
          sucursales,
          CASE 
            WHEN promedio >= 95 THEN 'excelencia'
            WHEN promedio >= 85 THEN 'objetivo'  
            ELSE 'critico'
          END as categoria
        FROM grupo_stats
        ORDER BY promedio DESC
      `;
      
      const result = await this.pool.query(query);
      const grupos = result.rows;
      
      // Procesar datos
      const data = {
        totalGrupos: grupos.length,
        promedioGeneral: Math.round(grupos.reduce((sum, g) => sum + g.promedio, 0) / grupos.length),
        gruposExcelencia: grupos.filter(g => g.categoria === 'excelencia').length,
        gruposObjetivo: grupos.filter(g => g.categoria === 'objetivo').length, 
        gruposCriticos: grupos.filter(g => g.categoria === 'critico').length,
        top5: grupos.slice(0, 5).map(g => ({
          nombre: g.grupo,
          porcentaje: g.promedio
        })),
        gruposCriticosDetalle: grupos.filter(g => g.categoria === 'critico').map(g => ({
          nombre: g.grupo,
          porcentaje: g.promedio  
        }))
      };
      
      // Guardar en cache
      this.setCache(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('Error obteniendo datos consolidados:', error);
      return this.getDataConsolidadaFallback();
    }
  }
  
  // Obtener datos de grupo específico
  async getDataGrupo(grupo) {
    const cacheKey = `grupo_${grupo}_q3`;
    
    // Verificar cache
    if (this.isValidCache(cacheKey)) {
      return this.dataCache.get(cacheKey).data;
    }
    
    try {
      // Query del grupo + contexto general
      const query = `
        WITH grupo_data AS (
          SELECT 
            ROUND(AVG(porcentaje), 2) as performance,
            COUNT(DISTINCT location_name) as sucursales
          FROM supervision_operativa_clean 
          WHERE grupo_operativo_limpio = $1
            AND EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
        ),
        all_groups AS (
          SELECT 
            grupo_operativo_limpio,
            ROUND(AVG(porcentaje), 2) as promedio
          FROM supervision_operativa_clean 
          WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
          GROUP BY grupo_operativo_limpio
          ORDER BY promedio DESC
        ),
        ranking AS (
          SELECT 
            grupo_operativo_limpio,
            ROW_NUMBER() OVER (ORDER BY AVG(porcentaje) DESC) as rank
          FROM supervision_operativa_clean 
          WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
          GROUP BY grupo_operativo_limpio
        )
        SELECT 
          g.performance,
          g.sucursales,
          r.rank as ranking,
          (SELECT COUNT(*) FROM all_groups) as total_grupos,
          (SELECT ROUND(AVG(promedio), 2) FROM all_groups) as promedio_marca
        FROM grupo_data g
        CROSS JOIN ranking r
        WHERE r.grupo_operativo_limpio = $1
      `;
      
      const result = await this.pool.query(query, [grupo]);
      
      if (result.rows.length === 0) {
        throw new Error(`No data found for grupo: ${grupo}`);
      }
      
      const data = {
        performance: result.rows[0].performance || 0,
        sucursales: result.rows[0].sucursales || 0,
        ranking: result.rows[0].ranking || 0,
        totalGrupos: result.rows[0].total_grupos || 21,
        promedioMarca: result.rows[0].promedio_marca || 89
      };
      
      // Guardar en cache
      this.setCache(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error(`Error obteniendo datos de grupo ${grupo}:`, error);
      return this.getDataGrupoFallback();
    }
  }
  
  // ===========================================
  // FASE 4: RESPUESTAS PRE-FORMATEADAS
  // ===========================================
  
  // Ranking completo - EPL CAS
  async getRankingCompleto() {
    const cacheKey = 'ranking_completo_q3';
    
    if (this.isValidCache(cacheKey)) {
      return this.dataCache.get(cacheKey).data;
    }
    
    try {
      const query = `
        SELECT 
          grupo_operativo_limpio as grupo,
          ROUND(AVG(porcentaje), 2) as performance,
          COUNT(DISTINCT location_name) as sucursales,
          CASE 
            WHEN AVG(porcentaje) >= 95 THEN '⭐⭐⭐'
            WHEN AVG(porcentaje) >= 90 THEN '⭐⭐'
            WHEN AVG(porcentaje) >= 85 THEN '⭐'
            ELSE '🚨'
          END as status
        FROM supervision_operativa_clean 
        WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
          AND EXTRACT(QUARTER FROM fecha_supervision) = 3
          AND porcentaje IS NOT NULL
        GROUP BY grupo_operativo_limpio
        ORDER BY AVG(porcentaje) DESC
      `;
      
      const result = await this.pool.query(query);
      const grupos = result.rows;
      
      let ranking = `🏆 RANKING COMPLETO Q3 2025\n\n📊 TOP GRUPOS OPERATIVOS:\n`;
      
      grupos.forEach((grupo, i) => {
        const pos = (i + 1).toString().padStart(2, '0');
        ranking += `${pos}. ${grupo.performance}% ${grupo.status} ${grupo.grupo}\n`;
        ranking += `    └─ ${grupo.sucursales} sucursales\n`;
      });
      
      // Estadísticas rápidas
      const excelencia = grupos.filter(g => g.performance >= 95).length;
      const objetivo = grupos.filter(g => g.performance >= 85).length;
      const criticos = grupos.filter(g => g.performance < 85).length;
      
      ranking += `\n📈 RESUMEN:\n`;
      ranking += `• Excelencia (95%+): ${excelencia}/${grupos.length}\n`;
      ranking += `• En objetivo (85%+): ${objetivo}/${grupos.length}\n`;
      ranking += `• Críticos (<85%): ${criticos}/${grupos.length}`;
      
      this.setCache(cacheKey, ranking);
      return ranking;
      
    } catch (error) {
      console.error('Error en getRankingCompleto:', error);
      return '❌ Error obteniendo ranking. Intenta más tarde.';
    }
  }
  
  // Áreas críticas
  async getAreasCriticas(grupo) {
    const cacheKey = `areas_criticas_${grupo}_q3`;
    
    if (this.isValidCache(cacheKey)) {
      return this.dataCache.get(cacheKey).data;
    }
    
    try {
      let whereClause = '';
      let params = [];
      
      if (grupo && grupo !== 'EPL CAS') {
        whereClause = 'AND grupo_operativo_limpio = $1';
        params.push(grupo);
      }
      
      const query = `
        SELECT 
          area_evaluacion,
          ROUND(AVG(porcentaje), 2) as promedio,
          COUNT(*) as evaluaciones,
          CASE 
            WHEN AVG(porcentaje) >= 95 THEN '⭐⭐⭐'
            WHEN AVG(porcentaje) >= 85 THEN '⭐⭐'
            WHEN AVG(porcentaje) >= 80 THEN '⚠️'
            ELSE '🚨'
          END as status
        FROM supervision_operativa_clean 
        WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
          AND EXTRACT(QUARTER FROM fecha_supervision) = 3
          AND porcentaje IS NOT NULL
          AND area_evaluacion != 'CALIFICACION GENERAL'
          ${whereClause}
        GROUP BY area_evaluacion
        HAVING AVG(porcentaje) < 85
        ORDER BY AVG(porcentaje) ASC
        LIMIT 10
      `;
      
      const result = await this.pool.query(query, params);
      const areas = result.rows;
      
      if (areas.length === 0) {
        return `✅ ${grupo === 'EPL CAS' ? 'TODA LA MARCA' : grupo}\n\n🎉 ¡Sin áreas críticas detectadas!\nTodas las áreas están en objetivo (85%+)`;
      }
      
      let response = `🚨 ÁREAS CRÍTICAS ${grupo === 'EPL CAS' ? 'MARCA' : grupo.toUpperCase()}\n\n`;
      
      areas.forEach((area, i) => {
        response += `${i + 1}. ${area.promedio}% ${area.status} ${area.area_evaluacion}\n`;
        response += `   └─ ${area.evaluaciones} evaluaciones\n`;
      });
      
      response += `\n⚡ ACCIÓN REQUERIDA:\n`;
      response += `• Enfocar supervisiones en estas ${areas.length} áreas\n`;
      response += `• Meta: llevar todas a 85%+ en Q4`;
      
      this.setCache(cacheKey, response);
      return response;
      
    } catch (error) {
      console.error('Error en getAreasCriticas:', error);
      return '❌ Error obteniendo áreas críticas. Intenta más tarde.';
    }
  }
  
  // Performance detalle
  async getPerformanceDetalle(grupo) {
    const cacheKey = `performance_${grupo}_q3`;
    
    if (this.isValidCache(cacheKey)) {
      return this.dataCache.get(cacheKey).data;
    }
    
    try {
      const query = `
        WITH grupo_performance AS (
          SELECT 
            ROUND(AVG(porcentaje), 2) as performance_actual,
            COUNT(DISTINCT location_name) as sucursales,
            COUNT(*) as evaluaciones_totales
          FROM supervision_operativa_clean 
          WHERE grupo_operativo_limpio = $1
            AND EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
        ),
        comparativo AS (
          SELECT ROUND(AVG(porcentaje), 2) as promedio_marca
          FROM supervision_operativa_clean 
          WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
        ),
        ranking AS (
          SELECT 
            grupo_operativo_limpio,
            ROW_NUMBER() OVER (ORDER BY AVG(porcentaje) DESC) as posicion
          FROM supervision_operativa_clean 
          WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
          GROUP BY grupo_operativo_limpio
        )
        SELECT 
          gp.performance_actual,
          gp.sucursales,
          gp.evaluaciones_totales,
          c.promedio_marca,
          r.posicion,
          (SELECT COUNT(DISTINCT grupo_operativo_limpio) FROM supervision_operativa_clean 
           WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
           AND EXTRACT(QUARTER FROM fecha_supervision) = 3) as total_grupos
        FROM grupo_performance gp
        CROSS JOIN comparativo c
        CROSS JOIN ranking r
        WHERE r.grupo_operativo_limpio = $1
      `;
      
      const result = await this.pool.query(query, [grupo]);
      
      if (result.rows.length === 0) {
        return `❌ No se encontraron datos para ${grupo}`;
      }
      
      const data = result.rows[0];
      const diferencia = data.performance_actual - data.promedio_marca;
      const signo = diferencia >= 0 ? '+' : '';
      
      let status = '🚨';
      if (data.performance_actual >= 95) status = '⭐⭐⭐';
      else if (data.performance_actual >= 90) status = '⭐⭐';
      else if (data.performance_actual >= 85) status = '⭐';
      
      let response = `📊 PERFORMANCE ${grupo.toUpperCase()} Q3\n\n`;
      response += `🎯 RESULTADO ACTUAL:\n`;
      response += `• Performance: ${data.performance_actual}% ${status}\n`;
      response += `• Ranking: ${data.posicion}/${data.total_grupos} grupos\n`;
      response += `• vs Marca: ${signo}${diferencia.toFixed(1)}% ${diferencia >= 0 ? '📈' : '📉'}\n`;
      response += `• Sucursales: ${data.sucursales}\n`;
      response += `• Evaluaciones: ${data.evaluaciones_totales}\n\n`;
      
      // Status y recomendación
      if (data.performance_actual >= 95) {
        response += `🏆 EXCELENCIA CORPORATIVA\n`;
        response += `Mantener estándares actuales`;
      } else if (data.performance_actual >= 90) {
        response += `✅ OBJETIVO CORPORATIVO\n`;
        response += `Meta: alcanzar 95% para excelencia`;
      } else if (data.performance_actual >= 85) {
        response += `⚠️ REQUIERE ATENCIÓN\n`;
        response += `Meta: superar 90% este trimestre`;
      } else {
        response += `🚨 ACCIÓN INMEDIATA\n`;
        response += `Crítico: implementar plan correctivo`;
      }
      
      this.setCache(cacheKey, response);
      return response;
      
    } catch (error) {
      console.error('Error en getPerformanceDetalle:', error);
      return '❌ Error obteniendo performance. Intenta más tarde.';
    }
  }
  
  // Ranking de sucursales
  async getRankingSucursales(grupo) {
    const cacheKey = `sucursales_${grupo}_q3`;
    
    if (this.isValidCache(cacheKey)) {
      return this.dataCache.get(cacheKey).data;
    }
    
    try {
      const query = `
        SELECT 
          location_name,
          ROUND(AVG(porcentaje), 2) as performance,
          COUNT(*) as evaluaciones,
          CASE 
            WHEN AVG(porcentaje) >= 95 THEN '⭐⭐⭐'
            WHEN AVG(porcentaje) >= 90 THEN '⭐⭐'
            WHEN AVG(porcentaje) >= 85 THEN '⭐'
            ELSE '🚨'
          END as status
        FROM supervision_operativa_clean 
        WHERE grupo_operativo_limpio = $1
          AND EXTRACT(YEAR FROM fecha_supervision) = 2025 
          AND EXTRACT(QUARTER FROM fecha_supervision) = 3
          AND porcentaje IS NOT NULL
        GROUP BY location_name
        ORDER BY AVG(porcentaje) DESC
      `;
      
      const result = await this.pool.query(query, [grupo]);
      const sucursales = result.rows;
      
      if (sucursales.length === 0) {
        return `❌ No se encontraron sucursales para ${grupo}`;
      }
      
      let response = `🏪 SUCURSALES ${grupo.toUpperCase()} Q3\n\n`;
      
      // Top 5 y Bottom 3
      const top5 = sucursales.slice(0, 5);
      const bottom3 = sucursales.slice(-3).reverse();
      
      response += `🏆 TOP SUCURSALES:\n`;
      top5.forEach((suc, i) => {
        response += `${i + 1}. ${suc.performance}% ${suc.status} ${suc.location_name}\n`;
      });
      
      if (bottom3.length > 0) {
        response += `\n🚨 REQUIEREN ATENCIÓN:\n`;
        bottom3.forEach((suc, i) => {
          response += `${i + 1}. ${suc.performance}% ${suc.status} ${suc.location_name}\n`;
        });
      }
      
      // Estadísticas
      const excelencia = sucursales.filter(s => s.performance >= 95).length;
      const objetivo = sucursales.filter(s => s.performance >= 85).length;
      
      response += `\n📈 ESTADÍSTICAS:\n`;
      response += `• Total sucursales: ${sucursales.length}\n`;
      response += `• En excelencia: ${excelencia}\n`;
      response += `• En objetivo: ${objetivo}\n`;
      response += `• Críticas: ${sucursales.length - objetivo}`;
      
      this.setCache(cacheKey, response);
      return response;
      
    } catch (error) {
      console.error('Error en getRankingSucursales:', error);
      return '❌ Error obteniendo ranking sucursales. Intenta más tarde.';
    }
  }
  
  // Estado de la marca (EPL CAS)
  async getEstadoMarca() {
    const cacheKey = 'estado_marca_q3';
    
    if (this.isValidCache(cacheKey)) {
      return this.dataCache.get(cacheKey).data;
    }
    
    try {
      const query = `
        WITH marca_stats AS (
          SELECT 
            COUNT(DISTINCT grupo_operativo_limpio) as total_grupos,
            COUNT(DISTINCT location_name) as total_sucursales,
            COUNT(*) as total_evaluaciones,
            ROUND(AVG(porcentaje), 2) as performance_marca
          FROM supervision_operativa_clean 
          WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
        ),
        categorias AS (
          SELECT 
            grupo_operativo_limpio,
            AVG(porcentaje) as performance
          FROM supervision_operativa_clean 
          WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
          GROUP BY grupo_operativo_limpio
        )
        SELECT 
          ms.*,
          COUNT(CASE WHEN c.performance >= 95 THEN 1 END) as grupos_excelencia,
          COUNT(CASE WHEN c.performance >= 85 AND c.performance < 95 THEN 1 END) as grupos_objetivo,
          COUNT(CASE WHEN c.performance < 85 THEN 1 END) as grupos_criticos
        FROM marca_stats ms
        CROSS JOIN categorias c
        GROUP BY ms.total_grupos, ms.total_sucursales, ms.total_evaluaciones, ms.performance_marca
      `;
      
      const result = await this.pool.query(query);
      const data = result.rows[0];
      
      let status = '🚨';
      if (data.performance_marca >= 95) status = '⭐⭐⭐';
      else if (data.performance_marca >= 90) status = '⭐⭐';
      else if (data.performance_marca >= 85) status = '⭐';
      
      let response = `🏢 ESTADO DE LA MARCA Q3 2025\n\n`;
      response += `📊 PERFORMANCE GLOBAL:\n`;
      response += `• Performance marca: ${data.performance_marca}% ${status}\n`;
      response += `• Total grupos: ${data.total_grupos}\n`;
      response += `• Total sucursales: ${data.total_sucursales}\n`;
      response += `• Evaluaciones Q3: ${data.total_evaluaciones}\n\n`;
      
      response += `🎯 DISTRIBUCIÓN GRUPOS:\n`;
      response += `• Excelencia (95%+): ${data.grupos_excelencia} grupos\n`;
      response += `• Objetivo (85-94%): ${data.grupos_objetivo} grupos\n`;
      response += `• Críticos (<85%): ${data.grupos_criticos} grupos\n\n`;
      
      // Meta corporativa
      const pctExcelencia = (data.grupos_excelencia / data.total_grupos * 100).toFixed(1);
      response += `🎯 META CORPORATIVA:\n`;
      response += `• ${pctExcelencia}% grupos en excelencia\n`;
      response += `• Objetivo Q4: 80% grupos en excelencia`;
      
      this.setCache(cacheKey, response);
      return response;
      
    } catch (error) {
      console.error('Error en getEstadoMarca:', error);
      return '❌ Error obteniendo estado marca. Intenta más tarde.';
    }
  }
  
  // Tendencias
  async getTendencias(grupo) {
    const cacheKey = `tendencias_${grupo}_q3`;
    
    if (this.isValidCache(cacheKey)) {
      return this.dataCache.get(cacheKey).data;
    }
    
    try {
      let whereClause = '';
      let params = [];
      
      if (grupo && grupo !== 'EPL CAS') {
        whereClause = 'AND grupo_operativo_limpio = $1';
        params.push(grupo);
      }
      
      const query = `
        SELECT 
          EXTRACT(MONTH FROM fecha_supervision) as mes,
          ROUND(AVG(porcentaje), 2) as performance
        FROM supervision_operativa_clean 
        WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
          AND EXTRACT(QUARTER FROM fecha_supervision) = 3
          AND porcentaje IS NOT NULL
          ${whereClause}
        GROUP BY EXTRACT(MONTH FROM fecha_supervision)
        ORDER BY mes
      `;
      
      const result = await this.pool.query(query, params);
      const tendencias = result.rows;
      
      if (tendencias.length === 0) {
        return `❌ No hay datos de tendencias para ${grupo}`;
      }
      
      const meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      let response = `📈 TENDENCIAS ${grupo === 'EPL CAS' ? 'MARCA' : grupo.toUpperCase()} Q3\n\n`;
      
      tendencias.forEach(t => {
        const mes = meses[t.mes];
        let trend = '';
        if (t.performance >= 95) trend = '⭐⭐⭐';
        else if (t.performance >= 90) trend = '⭐⭐';
        else if (t.performance >= 85) trend = '⭐';
        else trend = '🚨';
        
        response += `📅 ${mes} 2025: ${t.performance}% ${trend}\n`;
      });
      
      // Análisis de tendencia
      if (tendencias.length >= 2) {
        const primero = tendencias[0].performance;
        const ultimo = tendencias[tendencias.length - 1].performance;
        const diferencia = ultimo - primero;
        const direccion = diferencia > 0 ? '📈' : diferencia < 0 ? '📉' : '➡️';
        
        response += `\n🎯 ANÁLISIS:\n`;
        response += `• Tendencia Q3: ${direccion} ${diferencia > 0 ? '+' : ''}${diferencia.toFixed(1)}%\n`;
        
        if (diferencia > 2) {
          response += `✅ Mejora sostenida - mantener estrategia`;
        } else if (diferencia < -2) {
          response += `⚠️ Deterioro - revisar causas`;
        } else {
          response += `➡️ Estable - buscar oportunidades mejora`;
        }
      }
      
      this.setCache(cacheKey, response);
      return response;
      
    } catch (error) {
      console.error('Error en getTendencias:', error);
      return '❌ Error obteniendo tendencias. Intenta más tarde.';
    }
  }
  
  // Benchmarks
  async getBenchmarks(grupo) {
    const cacheKey = `benchmarks_${grupo}_q3`;
    
    if (this.isValidCache(cacheKey)) {
      return this.dataCache.get(cacheKey).data;
    }
    
    try {
      const query = `
        WITH grupo_performance AS (
          SELECT AVG(porcentaje) as performance
          FROM supervision_operativa_clean 
          WHERE grupo_operativo_limpio = $1
            AND EXTRACT(YEAR FROM fecha_supervision) = 2025 
            AND EXTRACT(QUARTER FROM fecha_supervision) = 3
            AND porcentaje IS NOT NULL
        ),
        benchmarks AS (
          SELECT 
            ROUND(AVG(porcentaje), 2) as promedio_marca,
            ROUND(MAX(porcentaje), 2) as mejor_marca,
            ROUND(MIN(porcentaje), 2) as menor_marca
          FROM (
            SELECT grupo_operativo_limpio, AVG(porcentaje) as porcentaje
            FROM supervision_operativa_clean 
            WHERE EXTRACT(YEAR FROM fecha_supervision) = 2025 
              AND EXTRACT(QUARTER FROM fecha_supervision) = 3
              AND porcentaje IS NOT NULL
            GROUP BY grupo_operativo_limpio
          ) subq
        )
        SELECT 
          ROUND(gp.performance, 2) as mi_performance,
          b.promedio_marca,
          b.mejor_marca,
          b.menor_marca
        FROM grupo_performance gp
        CROSS JOIN benchmarks b
      `;
      
      const result = await this.pool.query(query, [grupo]);
      
      if (result.rows.length === 0) {
        return `❌ No se encontraron benchmarks para ${grupo}`;
      }
      
      const data = result.rows[0];
      
      let response = `🎯 BENCHMARKS ${grupo.toUpperCase()} Q3\n\n`;
      
      // Mi posición
      let miStatus = '🚨';
      if (data.mi_performance >= 95) miStatus = '⭐⭐⭐';
      else if (data.mi_performance >= 90) miStatus = '⭐⭐';
      else if (data.mi_performance >= 85) miStatus = '⭐';
      
      response += `📊 MI POSICIÓN:\n`;
      response += `• Mi performance: ${data.mi_performance}% ${miStatus}\n\n`;
      
      // Referencias corporativas
      response += `🏢 REFERENCIAS CORPORATIVAS:\n`;
      response += `• Promedio marca: ${data.promedio_marca}%\n`;
      response += `• Mejor grupo: ${data.mejor_marca}%\n`;
      response += `• Menor grupo: ${data.menor_marca}%\n\n`;
      
      // Objetivos
      response += `🎯 OBJETIVOS CORPORATIVOS:\n`;
      response += `• Excelencia: 95%+ ⭐⭐⭐\n`;
      response += `• Objetivo: 90%+ ⭐⭐\n`;
      response += `• Mínimo: 85%+ ⭐\n\n`;
      
      // Gap analysis
      const gapExcelencia = 95 - data.mi_performance;
      const gapObjetivo = 90 - data.mi_performance;
      
      response += `📈 BRECHAS:\n`;
      if (data.mi_performance >= 95) {
        response += `✅ En excelencia corporativa`;
      } else if (data.mi_performance >= 90) {
        response += `• Excelencia: +${gapExcelencia.toFixed(1)}% para ⭐⭐⭐`;
      } else {
        response += `• Objetivo: +${gapObjetivo.toFixed(1)}% para ⭐⭐\n`;
        response += `• Excelencia: +${gapExcelencia.toFixed(1)}% para ⭐⭐⭐`;
      }
      
      this.setCache(cacheKey, response);
      return response;
      
    } catch (error) {
      console.error('Error en getBenchmarks:', error);
      return '❌ Error obteniendo benchmarks. Intenta más tarde.';
    }
  }
  
  // Funciones adicionales simplificadas para completar el sistema
  async getAnalisisRegional() {
    return '📍 ANÁLISIS REGIONAL - En desarrollo\n\n💡 Próximamente: análisis por estados y regiones';
  }
  
  async getMiRegion(userContext) {
    return `📍 MI REGIÓN - ${userContext.grupoOperativo}\n\n💡 En desarrollo: análisis regional específico`;
  }
  
  async getRankingGrupos() {
    return await this.getRankingCompleto();
  }
  
  async getCompararRegiones() {
    return '📊 COMPARAR REGIONES - En desarrollo\n\n💡 Próximamente: comparativo regional';
  }
  
  async getVsOtrosGrupos(grupo) {
    return await this.getPerformanceDetalle(grupo);
  }
  
  async getAreasOportunidad(grupo) {
    return await this.getAreasCriticas(grupo);
  }
  
  async getComparar(grupo) {
    return await this.getBenchmarks(grupo);
  }
  
  async getProblemas(grupo) {
    return await this.getAreasCriticas(grupo);
  }
  
  async getSeguimiento(grupo) {
    return await this.getTendencias(grupo);
  }
  
  async getMejoresPracticas() {
    return '🏆 MEJORES PRÁCTICAS - En desarrollo\n\n💡 Próximamente: guías y casos de éxito';
  }
  
  async getMiSeguimiento(userContext) {
    return await this.getTendencias(userContext.grupoOperativo);
  }
  
  // Funciones para comandos Falcon AI legacy
  async getAnalysisQ3(grupo) {
    return await this.getPerformanceDetalle(grupo);
  }
  
  async getAnalysisQ2(grupo) {
    return `📊 ANÁLISIS Q2 ${grupo} - En desarrollo\n\n💡 Datos históricos próximamente disponibles`;
  }
  
  async getAnalysisQ1(grupo) {
    return `📊 ANÁLISIS Q1 ${grupo} - En desarrollo\n\n💡 Datos históricos próximamente disponibles`;
  }
  
  async getComparativoTrimestres(grupo) {
    return `📈 COMPARATIVO TRIMESTRES ${grupo} - En desarrollo\n\n💡 Análisis temporal próximamente`;
  }
  
  // ===========================================
  // SISTEMA DE CACHE
  // ===========================================
  
  // Verificar si cache es válido
  isValidCache(key) {
    if (!this.dataCache.has(key)) return false;
    
    const cached = this.dataCache.get(key);
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTime;
  }
  
  // Guardar en cache
  setCache(key, data) {
    this.dataCache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }
  
  // Datos fallback consolidados
  getDataConsolidadaFallback() {
    return {
      totalGrupos: 21,
      promedioGeneral: 89,
      gruposExcelencia: 3,
      gruposObjetivo: 15,
      gruposCriticos: 3,
      top5: [
        { nombre: 'OGAS', porcentaje: 98.04 },
        { nombre: 'TEPEYAC', porcentaje: 96.84 },
        { nombre: 'GRUPO PIEDRAS NEGRAS', porcentaje: 94.90 },
        { nombre: 'EPL SO', porcentaje: 93.77 },
        { nombre: 'TEC', porcentaje: 93.60 }
      ],
      gruposCriticosDetalle: [
        { nombre: 'GRUPO SALTILLO', porcentaje: 61.79 },
        { nombre: 'GRUPO SABINAS HIDALGO', porcentaje: 84.76 },
        { nombre: 'GRUPO MATAMOROS', porcentaje: 84.55 }
      ]
    };
  }
  
  // Datos fallback grupo
  getDataGrupoFallback() {
    return {
      performance: 89.2,
      sucursales: 5,
      ranking: 10,
      totalGrupos: 21,
      promedioMarca: 89.2
    };
  }
}

module.exports = AnaV2Structured;