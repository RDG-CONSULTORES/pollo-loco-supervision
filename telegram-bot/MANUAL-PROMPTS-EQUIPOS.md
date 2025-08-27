# 📚 MANUAL DE PROMPTS - ANA INTELLIGENT
## Guía Completa para Equipos y Capacitación

---

## 🎯 **¿QUÉ ES ANA?**

Ana es tu asistente inteligente especializado en supervisiones El Pollo Loco con **95%+ precisión**. Entiende lenguaje natural y responde de forma directa con datos primero.

---

## 📊 **TIPOS DE CONSULTAS**

### **1. CONSULTAS BÁSICAS** 🏢

#### **Por Grupo Operativo**
```
✅ "como va [MI GRUPO]"
✅ "[MI GRUPO] este trimestre"
✅ "áreas críticas [MI GRUPO]"
✅ "performance [MI GRUPO]"
✅ "supervisiones [MI GRUPO]"
```

**Resultado esperado:** Datos directos con calificaciones, ranking y estado.

#### **Por Sucursal Específica**
```
✅ "como va [MI SUCURSAL]"
✅ "[MI SUCURSAL] Q3"
✅ "áreas de oportunidad [MI SUCURSAL]"
✅ "calificación [MI SUCURSAL]"
```

**Resultado esperado:** Performance específica de la sucursal con benchmarks.

#### **Por Estado/Región**
```
✅ "supervisiones [MI ESTADO]"
✅ "[MI ESTADO] este trimestre" 
✅ "ranking grupos [MI ESTADO]"
✅ "performance regional [MI ESTADO]"
```

**Resultado esperado:** Datos consolidados por región con contexto de grupos.

---

### **2. CONSULTAS DE RANKING** 📈

#### **Rankings Generales**
```
✅ "ranking grupos Q3"
✅ "top 5 grupos"
✅ "mejores grupos este trimestre"
✅ "listado todos los grupos"
```

#### **Rankings por Categoría**
```
✅ "mejores sucursales [MI GRUPO]"
✅ "top sucursales Q3"
✅ "sucursales perfectas 100%"
✅ "ranking sucursales [MI ESTADO]"
```

**Resultado esperado:** Listados ordenados por performance con calificaciones.

---

### **3. CONSULTAS EJECUTIVAS** 💼

#### **Reportes Consolidados**
```
✅ "reporte estado completo Q3"
✅ "consolidado todos los grupos"
✅ "métricas clave consolidadas"
✅ "estado supervisiones por región"
```

#### **KPIs y Métricas**
```
✅ "indicadores clave trimestre"
✅ "métricas formato ejecutivo"
✅ "dashboard supervisiones Q3"
✅ "resumen ejecutivo performance"
```

#### **Análisis Estratégicos**
```
✅ "análisis riesgo operativo"
✅ "tendencias vs trimestre anterior"
✅ "oportunidades mejora regional"
✅ "áreas críticas consolidadas"
```

**Resultado esperado:** Información estratégica con insights para toma de decisiones.

---

### **4. CONSULTAS DE ANÁLISIS** 🔍

#### **Áreas Críticas**
```
✅ "áreas críticas Q3"
✅ "problemas operativos [REGIÓN]"
✅ "áreas bajo benchmark"
✅ "oportunidades mejora [GRUPO]"
```

#### **Performance y Benchmarks**
```
✅ "grupos sobre objetivo"
✅ "sucursales bajo 85%"
✅ "análisis performance regional"
✅ "comparativo vs benchmarks"
```

#### **Supervisiones y Cobertura**
```
✅ "cuántas supervisiones Q3"
✅ "cobertura supervisiones [REGIÓN]"
✅ "frecuencia evaluaciones [GRUPO]"
✅ "estado supervisiones [PERIODO]"
```

**Resultado esperado:** Análisis detallado con identificación de problemas y oportunidades.

---

### **5. CONSULTAS COMPARATIVAS** ⚖️

#### **Comparaciones Estratégicas**
```
✅ "comparar [GRUPO A] vs [GRUPO B]"
✅ "[MI REGIÓN] vs otras regiones"
✅ "performance Q3 vs Q2"
✅ "tendencias trimestre actual"
```

#### **Benchmarking**
```
✅ "mi grupo vs promedio general"
✅ "posición en ranking nacional"
✅ "comparativo regional performance"
✅ "análisis competitivo [ÁREA]"
```

**Resultado esperado:** Comparaciones objetivas con contexto estratégico.

---

## 🎯 **FORMATOS DE RESPUESTA**

### **Respuesta Estándar** (Mayoría de consultas)
```
🏆 [TÍTULO] Q3 2025
94.5% ⭐⭐ Item Principal
87.2% ⭐ Item Secundario
─────────────────────
💡 /help - Ver más opciones
```

### **Respuesta Ejecutiva** (Con /insights)
```
📊 ANÁLISIS EJECUTIVO Q3 2025
• Líder: [Grupo] con 96.8%
• Riesgo: 3 grupos bajo 85%
• Tendencia: +2.3% vs Q2
• Acción: Reforzar [área específica]
```

### **No Hay Datos**
```
🚨 [GRUPO/ÁREA] Q3 2025 - Sin supervisiones
📊 [GRUPO/ÁREA] Q2 2025 - Últimos datos:
89.3% ⭐⭐ Última evaluación
⚠️ Datos de Q2 (último disponible)
```

---

## 🧠 **INTELIGENCIA ADAPTATIVA**

### **Ana Entiende Automáticamente:**

#### **Variaciones de Nombres**
```
"queretaro" = "qro" = "Querétaro" → PLOG QUERETARO
"nuevo leon" = "nl" = "Nuevo León" → PLOG NUEVO LEON
"tepeyac" = "tepy" → TEPEYAC
```

#### **Contexto Temporal**
```
"este trimestre" = "Q3" = "trimestre actual" = Q3 2025
"trimestre anterior" = Q2 2025
"año actual" = 2025
```

#### **Términos Operativos**
```
"calificaciones" = "porcentajes" = "performance"
"supervisiones" = "evaluaciones" = "revisiones"
"áreas críticas" = "problemas" = "oportunidades"
```

### **Fallback Automático**
- Si Q3 sin datos → busca Q2 automáticamente
- Si sucursal no existe → sugiere similares
- Si grupo no encontrado → verifica estado/ciudad

---

## ⚡ **COMANDOS ESPECIALES**

### **Comandos de Ayuda**
```
/help           → Ayuda rápida por categorías
/ejemplos       → Ejemplos de prompts por tipo
/comandos       → Lista completa de comandos
```

### **Comandos de Análisis**
```
/insights [tema] → Análisis detallado específico
/areas          → Áreas críticas consolidadas
/ranking        → Rankings actualizados
/stats          → Estadísticas generales
```

### **Comandos de Formato**
```
/simple         → Respuestas ultra-cortas
/ejecutivo      → Formato para directivos
/detallado      → Información completa
```

---

## 🎯 **MEJORES PRÁCTICAS**

### **Para Obtener Mejores Resultados:**

#### **SÉ ESPECÍFICO**
```
❌ "como va todo"
✅ "como va mi grupo este trimestre"
✅ "performance sucursales [MI GRUPO]"
```

#### **USA CONTEXTO TEMPORAL**
```
✅ "[MI GRUPO] Q3"
✅ "tendencias vs trimestre anterior"
✅ "comparativo últimos 2 trimestres"
```

#### **APROVECHA LA INTELIGENCIA**
```
✅ "problemas operativos críticos"
✅ "oportunidades mejora [ÁREA]"
✅ "sucursales que necesitan atención"
```

### **Para Reportes Ejecutivos:**
```
✅ Usa /insights al final
✅ Solicita "formato ejecutivo"
✅ Pide "consolidado" para múltiples datos
```

---

## 📱 **INTEGRACIÓN TELEGRAM**

### **Uso en Grupos**
- Menciona @ana_bot para activar
- Respuestas optimizadas para móvil
- Formato visual con emoticons

### **Uso Individual**
- Conversación natural directa
- Memoria de contexto en sesión
- Comandos de ayuda disponibles

---

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Si Ana No Entiende:**
```
✅ Sé más específico con nombres
✅ Usa términos del manual
✅ Verifica ortografía de grupos/sucursales
✅ Usa /help para ver opciones
```

### **Si No Hay Datos:**
```
- Ana buscará automáticamente en Q2
- Te informará si no existe información
- Sugerirá alternativas cuando sea posible
```

### **Si Respuesta Muy Larga:**
```
✅ Usa /simple para respuestas cortas
✅ Solicita "datos básicos únicamente"
✅ Evita /insights si no necesitas análisis
```

---

## 📊 **BENCHMARKS Y ESCALAS**

### **Sistema de Calificación**
- **⭐⭐⭐ Excelencia:** 95%+ 
- **⭐⭐ Objetivo:** 85-94% (90-94% calificación general)
- **⭐ Atención:** 80-84% (85-89% calificación general)
- **🚨 Crítico:** <80% (<85% calificación general)

### **Interpretación de Resultados**
- **Verde (95%+):** Performance sobresaliente
- **Amarillo (85-94%):** En objetivo, oportunidad de mejora
- **Naranja (80-84%):** Requiere atención
- **Rojo (<80%):** Acción inmediata necesaria

---

## 🎓 **CAPACITACIÓN RECOMENDADA**

### **Para Supervisores:**
1. Consultas básicas por grupo/sucursal
2. Identificación áreas críticas
3. Uso de /insights para análisis

### **Para Gerentes Regionales:**
1. Consultas comparativas regionales
2. Rankings y benchmarking  
3. Reportes ejecutivos consolidados

### **Para Directivos:**
1. Dashboard ejecutivo con /insights
2. Análisis estratégicos y tendencias
3. Métricas consolidadas formato directivo

---

*Ana v2.0 - Manual Completo | El Pollo Loco CAS 2025*
*Actualización: Diciembre 2024*