// Sistema de Tutorial Interactivo para El Pollo Loco Bot
// Capacitación progresiva para usuarios

class TutorialSystem {
    constructor(bot, aiEngine) {
        this.bot = bot;
        this.aiEngine = aiEngine;
        this.userProgress = new Map();
    }

    // Comando /tutorial - Inicia capacitación interactiva
    async startTutorial(chatId, userName = '') {
        const welcomeTutorial = `🎓 **TUTORIAL INTERACTIVO**
        
¡Hola ${userName}! Te voy a enseñar a usar el sistema paso a paso.

📚 **Módulos de aprendizaje:**

1️⃣ **Básico** - Comandos esenciales
2️⃣ **Consultas** - Hacer preguntas inteligentes  
3️⃣ **Dashboard** - Usar la aplicación web
4️⃣ **Avanzado** - Análisis complejos
5️⃣ **Práctica** - Ejercicios guiados

¿Por dónde quieres empezar?`;

        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '1️⃣ Básico', callback_data: 'tutorial_basic' },
                        { text: '2️⃣ Consultas', callback_data: 'tutorial_queries' }
                    ],
                    [
                        { text: '3️⃣ Dashboard', callback_data: 'tutorial_dashboard' },
                        { text: '4️⃣ Avanzado', callback_data: 'tutorial_advanced' }
                    ],
                    [
                        { text: '5️⃣ Práctica', callback_data: 'tutorial_practice' },
                        { text: '📋 Mi progreso', callback_data: 'tutorial_progress' }
                    ]
                ]
            }
        };

        await this.bot.sendMessage(chatId, welcomeTutorial, keyboard);
        this.initializeUserProgress(chatId);
    }

    // Módulo 1: Comandos Básicos
    async sendBasicTutorial(chatId) {
        const tutorial = `📚 **MÓDULO 1: COMANDOS BÁSICOS**

🎯 **Comandos principales que debes conocer:**

**/kpis** - Ver indicadores principales
• Promedio general
• Total de supervisiones
• Sucursales evaluadas

**/grupos** - Ranking de grupos operativos
• Desempeño por grupo
• Comparaciones

**/top10** - Las 10 mejores sucursales

🔄 **Vamos a practicar:**
Escribe /kpis y veamos qué información obtienes.

💡 *Tip: Puedes hacer click en los comandos azules para ejecutarlos*`;

        await this.bot.sendMessage(chatId, tutorial, { parse_mode: 'Markdown' });
        this.updateProgress(chatId, 'basic', 'started');
    }

    // Módulo 2: Consultas Inteligentes
    async sendQueriesTutorial(chatId) {
        const tutorial = `🧠 **MÓDULO 2: PREGUNTAS INTELIGENTES**

✨ **El bot entiende lenguaje natural. Ejemplos:**

📊 **Preguntas sobre promedios:**
• "¿Cuál es el promedio general?"
• "¿Cómo está el promedio de esta semana?"

🏆 **Preguntas sobre rankings:**
• "Muéstrame los top 5 grupos"
• "¿Cuáles son las mejores sucursales?"

⚠️ **Preguntas sobre problemas:**
• "¿Qué sucursales tienen problemas?"
• "¿Cuáles son los indicadores críticos?"

🔍 **Preguntas de comparación:**
• "Compara grupos vs estados"
• "¿Qué grupo es el mejor?"

🔄 **Ejercicio práctico:**
Intenta preguntar: "¿Cuáles son los top 3 grupos?"`;

        await this.bot.sendMessage(chatId, tutorial, { parse_mode: 'Markdown' });
        
        // Ejemplo interactivo
        setTimeout(() => {
            this.bot.sendMessage(chatId, `💬 **Ejemplo de respuesta:**
            
🥇 OGAS: 97.6%
🥈 PLOG QUERÉTARO: 97.0%  
🥉 TEC: 93.1%

¿Ves? ¡Es muy fácil! Ahora intenta tú.`);
        }, 3000);
        
        this.updateProgress(chatId, 'queries', 'started');
    }

    // Módulo 3: Dashboard Web
    async sendDashboardTutorial(chatId) {
        const tutorial = `🖥️ **MÓDULO 3: DASHBOARD WEB**

📱 **Acceso al Dashboard:**

1. Usa el comando /dashboard
2. Click en "🎨 Mini Web App"
3. Elige tu diseño favorito

🎨 **5 Diseños disponibles:**
• **Corporativo**: Elegante azul/púrpura
• **Minimalista**: Limpio y claro
• **Dark Mode**: Fácil para la vista
• **Moderno**: Colorido y vibrante
• **Clásico**: Colores El Pollo Loco

📊 **Funcionalidades del Dashboard:**
• KPIs en tiempo real
• Gráficos interactivos
• Filtros por grupo/estado
• Rankings actualizados

🔄 **Pruébalo ahora:**`;

        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎨 Abrir Dashboard', web_app: { url: 'https://pollo-loco-supervision.onrender.com' }}],
                    [{ text: '✅ Ya lo probé', callback_data: 'tutorial_dashboard_complete' }]
                ]
            }
        };

        await this.bot.sendMessage(chatId, tutorial, keyboard);
        this.updateProgress(chatId, 'dashboard', 'started');
    }

    // Módulo 4: Funciones Avanzadas
    async sendAdvancedTutorial(chatId) {
        const tutorial = `🚀 **MÓDULO 4: ANÁLISIS AVANZADOS**

📈 **Análisis por período de tiempo:**
• "¿Cómo estuvo el promedio esta semana?"
• "Muéstrame los resultados del mes"
• "¿Cuál es el desempeño del trimestre?"

🔍 **Análisis específicos:**
• "¿Qué grupo tiene más supervisiones?"
• "¿Cuál estado tiene el menor promedio?"
• "Muéstrame sucursales con calificación menor a 80"

💡 **Recomendaciones inteligentes:**
• "¿Qué áreas necesitan mejorar?"
• "Dame recomendaciones"
• "¿Dónde debemos enfocarnos?"

📊 **Comparaciones complejas:**
• "Compara OGAS vs TEC"
• "¿Cómo está Nuevo León vs Jalisco?"
• "Tendencia de los últimos 3 meses"

🎯 **Comando secreto:**
Si escribes "ayuda" el bot te sugiere preguntas relevantes basadas en los datos actuales.`;

        await this.bot.sendMessage(chatId, tutorial, { parse_mode: 'Markdown' });
        this.updateProgress(chatId, 'advanced', 'started');
    }

    // Módulo 5: Práctica Guiada
    async sendPracticeTutorial(chatId) {
        this.userProgress.get(chatId).practiceMode = true;
        
        const exercises = [
            {
                instruction: "🎯 **Ejercicio 1**: Encuentra el promedio general\nEscribe una pregunta para conocer el promedio.",
                expectedKeywords: ['promedio', 'general', 'kpi'],
                successResponse: "¡Excelente! El promedio general es un KPI fundamental."
            },
            {
                instruction: "🎯 **Ejercicio 2**: Identifica los mejores grupos\nPregunta por los top 5 grupos operativos.",
                expectedKeywords: ['top', 'grupos', 'mejores', '5'],
                successResponse: "¡Muy bien! Ya sabes cómo identificar a los mejores."
            },
            {
                instruction: "🎯 **Ejercicio 3**: Encuentra problemas\nPregunta sobre áreas críticas o problemas.",
                expectedKeywords: ['crítico', 'problema', 'bajo', 'peor'],
                successResponse: "¡Perfecto! Identificar problemas es clave para mejorar."
            }
        ];

        const currentExercise = this.userProgress.get(chatId).currentExercise || 0;
        
        if (currentExercise < exercises.length) {
            await this.bot.sendMessage(chatId, exercises[currentExercise].instruction, { parse_mode: 'Markdown' });
            this.userProgress.get(chatId).expectedExercise = exercises[currentExercise];
        } else {
            await this.sendCertificate(chatId);
        }
    }

    // Certificado de finalización
    async sendCertificate(chatId) {
        const certificate = `🏆 **¡FELICITACIONES!**

Has completado el tutorial de El Pollo Loco CAS Bot.

📜 **CERTIFICADO DE CAPACITACIÓN**
━━━━━━━━━━━━━━━━━━━━━
✅ Comandos básicos
✅ Consultas inteligentes  
✅ Uso del dashboard
✅ Análisis avanzados
✅ Práctica completada

🎓 **Nivel alcanzado**: EXPERTO

📊 **Ahora puedes:**
• Analizar datos de supervisión
• Identificar áreas de mejora
• Generar reportes instantáneos
• Tomar decisiones basadas en datos

💪 ¡Estás listo para mejorar la operación!`;

        await this.bot.sendMessage(chatId, certificate, { parse_mode: 'Markdown' });
        this.updateProgress(chatId, 'completed', true);
    }

    // Sistema de progreso
    initializeUserProgress(chatId) {
        this.userProgress.set(chatId, {
            basic: false,
            queries: false,
            dashboard: false,
            advanced: false,
            practice: false,
            currentExercise: 0,
            completed: false
        });
    }

    updateProgress(chatId, module, status) {
        if (this.userProgress.has(chatId)) {
            this.userProgress.get(chatId)[module] = status;
        }
    }

    getProgress(chatId) {
        const progress = this.userProgress.get(chatId) || {};
        const completed = Object.values(progress).filter(v => v === true).length;
        const total = 5;
        
        return `📊 **Tu progreso**: ${completed}/${total} módulos completados

${progress.basic ? '✅' : '⭕'} Comandos básicos
${progress.queries ? '✅' : '⭕'} Consultas inteligentes
${progress.dashboard ? '✅' : '⭕'} Dashboard web
${progress.advanced ? '✅' : '⭕'} Análisis avanzados
${progress.practice ? '✅' : '⭕'} Práctica

${completed === total ? '🏆 ¡Tutorial completado!' : '💪 ¡Sigue aprendiendo!'}`;
    }

    // Validar respuestas en modo práctica
    validatePracticeResponse(chatId, message) {
        const progress = this.userProgress.get(chatId);
        if (!progress || !progress.practiceMode) return false;

        const exercise = progress.expectedExercise;
        if (!exercise) return false;

        const messageWords = message.toLowerCase().split(' ');
        const hasKeywords = exercise.expectedKeywords.some(keyword => 
            messageWords.some(word => word.includes(keyword))
        );

        if (hasKeywords) {
            this.bot.sendMessage(chatId, exercise.successResponse);
            progress.currentExercise = (progress.currentExercise || 0) + 1;
            
            // Continue to next exercise
            setTimeout(() => this.sendPracticeTutorial(chatId), 2000);
            return true;
        }

        return false;
    }
}

module.exports = TutorialSystem;