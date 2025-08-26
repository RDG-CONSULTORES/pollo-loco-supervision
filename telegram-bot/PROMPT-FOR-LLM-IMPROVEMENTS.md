# 🤖 PROMPT COMPLETO PARA LLM (Claude/ChatGPT) - Mejoras Sistema Ana

## 🎯 CONTEXTO Y PROBLEMA

Soy el desarrollador de un chatbot de Telegram llamado "Ana" para El Pollo Loco que supuestamente es "ultra inteligente" pero está fallando miserablemente.

### ❌ PROBLEMA CRÍTICO ACTUAL:

**Ana responde como una base de datos sin cerebro:**

```
Usuario: "de que tienes capacidades ?"
Ana: "89.5388560370025375 186798 82"

Usuario: "cuantas sucursales tiene tepeyac ?"  
Ana: "TEPEYAC 92.6647923177083333 15360 10"

Usuario: "dame calificaciones este trimestre por grupo Operativo"
Ana: "89.5388560370025375 186798 82"
```

**Está en un loop infinito de respuestas genéricas sin contexto ni inteligencia.**

---

## 📂 ARQUITECTURA TÉCNICA ACTUAL

### **1. Stack Tecnológico:**
- **Backend:** Node.js + Express
- **Bot:** node-telegram-bot-api v0.66.0
- **Base de datos:** PostgreSQL (Neon) con 500K+ registros
- **Deploy:** Vercel con webhook mode
- **APIs LLM:** ❌ NO CONFIGURADAS (este es el problema principal)

### **2. Estructura de Archivos:**

```
telegram-bot/
├── bot.js (Principal - maneja Telegram)
├── agentic-director.js (Fake intelligence - solo if/else)
├── ultra-intelligence-engine.js (Falsa "ultra inteligencia")
├── dynamic-query-engine.js (Queries limitadas por templates)
├── intelligent-knowledge-base.js (Datos hardcoded estáticos)
├── package.json
└── .env (Sin APIs LLM configuradas)
```

### **3. Base de Datos PostgreSQL (Functional):**

**Tabla principal:** `supervision_operativa_detalle`
```sql
-- 500K+ registros reales disponibles
sucursal_clean VARCHAR (82+ sucursales únicas)
grupo_operativo VARCHAR (20 grupos: OGAS, TEPEYAC, TEC, etc.)
area_evaluacion VARCHAR (29 áreas: FREIDORAS, HORNOS, etc.)
porcentaje DECIMAL (Calificaciones 0-100%)
fecha_supervision DATE (2025: Q1, Q2, Q3)
estado VARCHAR (Nuevo León, Tamaulipas, etc.)
```

**Datos de negocio reales disponibles:**
- OGAS: Líder con 97.55%, 8 sucursales
- TEPEYAC: Grupo más grande, 92.66%, 10 sucursales
- Áreas críticas: FREIDORAS (74.63%), EXTERIOR (75.35%)
- Trimestre actual Q3: 89.99% promedio general

---

## 🚨 FALLAS ESPECÍFICAS DEL SISTEMA ACTUAL

### **1. En `agentic-director.js`:**
```javascript
// PROBLEMA: Análisis fake con solo regex
async analyzeRealIntent(question) {
  const lower = question.toLowerCase();
  if (lower.includes('sucursales') && lower.includes('tepeyac')) {
    return { type: 'sucursales_by_grupo', grupo: 'TEPEYAC' };
  }
  // MÁS IF/ELSE BÁSICOS - NO HAY INTELIGENCIA REAL
}

// PROBLEMA: Respuestas de template, no generadas por LLM
generateSucursalesResponse(data) {
  return `🏪 **Sucursales del Grupo ${data.grupo}**\n\nConozco las ${data.length} sucursales...`;
  // PLANTILLA FIJA - NO ES CONVERSACIONAL NI INTELIGENTE
}
```

### **2. En `ultra-intelligence-engine.js`:**
```javascript
// NOMBRE ENGAÑOSO - NO HAY ULTRA INTELIGENCIA
async executeCompleteTraining() {
  await this.trainDatabaseKnowledge(); // Solo SQL básico
  await this.trainTrendsAnalysis();    // Solo queries predefinidas
  // NO HAY ENTRENAMIENTO LLM REAL
  return true; // Mentira - no se entrenó nada inteligente
}
```

### **3. En `dynamic-query-engine.js`:**
```javascript
// PROBLEMA: "Dinámico" pero solo usa templates
analyzeQueryIntent(question) {
  if (question.includes('sucursales')) return { type: 'sucursales' };
  if (question.includes('ranking')) return { type: 'ranking' };
  // NO GENERA SQL DINÁMICO REAL CON LLM
  return { type: 'unknown' };
}
```

---

## 📊 DATOS Y CONTEXTO DE NEGOCIO DISPONIBLES

### **Grupos Operativos (20 total):**
1. **OGAS** - 97.55%, 8 sucursales, Nuevo León (LÍDER)
2. **PLOG QUERETARO** - 96.97%, 4 sucursales, Querétaro
3. **TEPEYAC** - 92.66%, 10 sucursales, Nuevo León (MÁS GRANDE)
4. **EXPO** - 87.49%, 11 sucursales (OPORTUNIDAD GRANDE)
5. **GRUPO SALTILLO** - 72.12%, 3 sucursales (CRÍTICO)

### **Áreas Críticas Globales:**
1. **FREIDORAS** - 74.63% (Más crítica)
2. **EXTERIOR SUCURSAL** - 75.35%
3. **FREIDORA DE PAPA** - 76.09%
4. **HORNOS** - 81.03%

### **Performance Trimestral 2025:**
- Q1: 91.67% (25 supervisiones)
- Q2: 88.88% (66 supervisiones) 
- Q3: 89.99% (44 supervisiones) - Actual

---

## 🎯 LO QUE NECESITO QUE ME PROPORCIONES

### **1. ARQUITECTURA LLM REAL**
- Cómo integrar OpenAI GPT-4 y/o Claude
- Sistema de fallback entre proveedores
- Configuración de parámetros (temperature, tokens, etc.)
- Manejo de costos y límites

### **2. SISTEMA DE PROMPTS EMPRESARIALES**
- Prompt maestro para personalidad de Ana
- Prompts especializados por tipo de consulta
- Context-aware prompts que usen historial
- Prompts para generar SQL dinámico

### **3. MOTOR DE ANÁLISIS INTELIGENTE**
- Conversión de datos SQL a insights de negocio
- Análisis comparative y tendencial automático
- Identificación de patrones y anomalías
- Generación de recomendaciones específicas

### **4. PERSONALIDAD CONVERSACIONAL**
- Ana como analista experta de El Pollo Loco
- Tono profesional pero amigable
- Capacidad de hacer preguntas de seguimiento
- Memoria conversacional inteligente

### **5. CÓDIGO ESPECÍFICO**
- Reemplazo completo de métodos fake actuales
- Integración real con APIs LLM
- Manejo de errores y fallbacks
- Optimización de performance

---

## 💡 EJEMPLO DE LO QUE QUEREMOS VS LO QUE TENEMOS

### **❌ RESPUESTA ACTUAL (MAL):**
```
Usuario: "¿Cuántas sucursales tiene TEPEYAC?"
Ana: "TEPEYAC 92.6647923177083333 15360 10"
```

### **✅ RESPUESTA DESEADA (INTELIGENTE):**
```
Usuario: "¿Cuántas sucursales tiene TEPEYAC?"
Ana: "🏪 **TEPEYAC - Tu Grupo Estratégico Más Grande**

TEPEYAC opera **10 sucursales** distribuidas estratégicamente, siendo nuestro grupo operativo más grande por volumen.

📊 **Posición competitiva:**
• Ranking: #5 de 20 grupos (Top 25%)  
• Performance: 92.66% (Nivel BUENO - sobre el benchmark de 85%)
• Impacto: Mayor influencia en resultados generales por su tamaño

🌟 **Sucursales destacadas:**
• **Pino Suárez**: 97.94% (⭐ Estrella del grupo)
• **Madero**: 94.2% (Sólido performance)
• **Matamoros**: 91.8% (Oportunidad de mejora)

💡 **Mi análisis:** TEPEYAC está bien posicionado pero tiene potencial oro. Si mejoramos las 3 sucursales con menor performance en solo 5 puntos promedio, el grupo subiría al Top 3 nacional.

🎯 **Oportunidad específica:** El área "Freidoras" promedia 78% en el grupo - con capacitación intensiva podríamos ganar 4 puntos generales.

¿Te gustaría que diseñe un plan de mejora específico para TEPEYAC o prefieres compararlo con OGAS para identificar mejores prácticas? 🚀"
```

---

## 🔧 REQUERIMIENTOS TÉCNICOS ESPECÍFICOS

### **Variables de entorno que necesito configurar:**
```bash
OPENAI_API_KEY=sk-proj-xxx
CLAUDE_API_KEY=sk-ant-xxx
DEFAULT_LLM_PROVIDER=gpt-4-turbo
MAX_TOKENS_PER_RESPONSE=2048
LLM_TEMPERATURE=0.7
DAILY_TOKEN_LIMIT=100000
```

### **Dependencias que debo agregar al package.json:**
- openai (para OpenAI)
- @anthropic-ai/sdk (para Claude)
- Otras que recomienden

### **Funciones específicas que necesito reemplazar:**
1. `processUserQuestion()` - Lógica principal
2. `analyzeRealIntent()` - Análisis de intención 
3. `generateNaturalResponse()` - Generación de respuestas
4. `processDynamicQuery()` - Queries dinámicas
5. Toda la lógica "inteligente" fake actual

---

## 🎯 ENTREGABLES ESPERADOS

**Por favor proporcióname código específico para:**

1. **LLMManager class** - Manejo de múltiples proveedores
2. **PromptEngine class** - Sistema de prompts empresariales  
3. **IntelligentAnalyzer class** - Conversión datos→insights
4. **TrueAgenticDirector class** - Reemplazo del actual
5. **ConversationMemory class** - Memoria inteligente
6. **Instrucciones paso a paso** - Para implementación

**Formato:** Código JavaScript funcional que pueda copy-paste e implementar inmediatamente.

**Objetivo:** Que Ana pase de responder "89.5388560370025375 186798 82" a generar análisis inteligentes como una consultora experta real.

---

## 🚀 CONTEXTO DE URGENCIA

Este sistema está en producción y los usuarios están frustrados. Necesito soluciones **técnicas específicas y funcionales** que pueda implementar en las próximas 48 horas.

**NO necesito:** Teoría general sobre LLMs
**SÍ necesito:** Código específico, configuraciones exactas, y pasos de implementación

¿Puedes ayudarme a convertir Ana en un verdadero asistente inteligente?