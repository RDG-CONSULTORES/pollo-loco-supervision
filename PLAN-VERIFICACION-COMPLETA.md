# 🎯 PLAN DE VERIFICACIÓN COMPLETA - Dashboard El Pollo Loco

## 📋 CHECKLIST GENERAL

### ✅ SERVICIOS BASE
- [ ] 1. Servidor corriendo en localhost:3000
- [ ] 2. Health check (/health) responde correctamente
- [ ] 3. Base de datos conectada
- [ ] 4. CSS y JS cargan sin errores

---

## 🔧 SECCIÓN 1: FILTROS
### Verificar TODOS los filtros funcionan correctamente

#### 📍 FILTRO 1: GRUPO OPERATIVO
**Pasos:**
1. [ ] Abrir dashboard en localhost:3000
2. [ ] Verificar que dropdown "Grupo Operativo" carga opciones
3. [ ] Seleccionar "GRUPO SALTILLO"
4. [ ] Click en "Aplicar Filtros"
5. [ ] **VERIFICAR:** KPIs se actualizan
6. [ ] **VERIFICAR:** Gráficas se actualizan
7. [ ] **VERIFICAR:** Ranking sucursales muestra solo GRUPO SALTILLO

**Resultado esperado:** 
- Performance General: ~69.66%
- Sucursales: 5 sucursales del grupo

#### 🗺️ FILTRO 2: ESTADO
**Pasos:**
1. [ ] Limpiar filtros
2. [ ] Seleccionar "Nuevo León" en dropdown Estado
3. [ ] Click en "Aplicar Filtros"
4. [ ] **VERIFICAR:** Solo aparecen sucursales de Nuevo León

#### 📅 FILTRO 3: PERÍODO CAS
**Pasos:**
1. [ ] Limpiar filtros
2. [ ] Seleccionar "NL-T3 (Jul-Dic 2025)" en Período CAS
3. [ ] Click en "Aplicar Filtros"
4. [ ] **VERIFICAR:** KPIs cambian según el período

#### 🔄 FILTRO 4: COMBINACIÓN
**Pasos:**
1. [ ] Seleccionar GRUPO SALTILLO + NL-T3
2. [ ] Click en "Aplicar Filtros"
3. [ ] **VERIFICAR:** Performance: ~70.89%, 2 sucursales

#### 🧹 FILTRO 5: LIMPIAR FILTROS
**Pasos:**
1. [ ] Click en "Limpiar"
2. [ ] **VERIFICAR:** Todos los dropdowns vuelven a "Todos"
3. [ ] **VERIFICAR:** KPIs vuelven a valores generales

---

## 📊 SECCIÓN 2: KPI CARDS
### Verificar las 4 tarjetas principales

#### 📈 KPI 1: PERFORMANCE GENERAL
**Ubicación:** Primer KPI card (ícono chart-line)
**Pasos:**
1. [ ] **SIN FILTROS:** Verificar muestra % general (~89.54%)
2. [ ] **CON GRUPO SALTILLO:** Verificar cambia a ~69.66%
3. [ ] **CON PERÍODO NL-T3:** Verificar se actualiza correctamente

#### 🏪 KPI 2: TOTAL SUCURSALES
**Ubicación:** Segundo KPI card (ícono store)
**Pasos:**
1. [ ] **SIN FILTROS:** Verificar muestra total (~82 sucursales)
2. [ ] **CON FILTRO GRUPO:** Verificar muestra solo sucursales del grupo
3. [ ] **CON FILTRO ESTADO:** Verificar cuenta correcta por estado

#### 👥 KPI 3: GRUPOS ACTIVOS
**Ubicación:** Tercer KPI card (ícono users)
**Pasos:**
1. [ ] **SIN FILTROS:** Verificar muestra total grupos (~20)
2. [ ] **CON FILTROS:** Verificar se actualiza según filtros aplicados

#### 📋 KPI 4: TOTAL EVALUACIONES
**Ubicación:** Cuarto KPI card (ícono clipboard-check)
**Pasos:**
1. [ ] **SIN FILTROS:** Verificar muestra total evaluaciones
2. [ ] **CON FILTROS:** Verificar cuenta solo evaluaciones filtradas

---

## 🗺️ SECCIÓN 3: MAPA INTERACTIVO
### Tab "Mapa Interactivo"

#### 🌍 MAPA BASE
**Pasos:**
1. [ ] Click en tab "Mapa Interactivo"
2. [ ] **VERIFICAR:** Mapa carga (OpenStreetMap)
3. [ ] **VERIFICAR:** Marcadores aparecen en el mapa
4. [ ] **VERIFICAR:** Colores de marcadores según performance:
   - Verde: ≥90% (Excelente)
   - Azul: 80-89% (Buena)
   - Amarillo: 70-79% (Regular)
   - Rojo: <70% (Crítica)

#### 🎯 INTERACCIÓN MAPA
**Pasos:**
1. [ ] **HOVER:** Verificar tooltip aparece al pasar mouse
2. [ ] **CLICK:** Verificar popup con detalles de sucursal
3. [ ] **ZOOM:** Verificar zoom in/out funciona
4. [ ] **FILTROS:** Aplicar filtro y verificar marcadores se actualizan

---

## 📊 SECCIÓN 4: GRÁFICAS Y CHARTS

### 📈 TAB "PERFORMANCE POR GRUPO"

#### 🏆 GRÁFICA 1: RANKING GRUPOS OPERATIVOS
**Ubicación:** Tab "Performance por Grupo" - Primera gráfica
**Pasos:**
1. [ ] Click en tab "Performance por Grupo"
2. [ ] **VERIFICAR:** Gráfica de barras carga
3. [ ] **VERIFICAR:** Grupos ordenados por performance (mayor a menor)
4. [ ] **VERIFICAR:** Línea meta al 90% visible
5. [ ] **CON FILTROS:** Verificar gráfica se actualiza

#### 🏪 GRÁFICA 2: RANKING SUCURSALES (TOP 20)
**Ubicación:** Tab "Performance por Grupo" - Segunda gráfica
**Pasos:**
1. [ ] **VERIFICAR:** Gráfica ranking sucursales carga
2. [ ] **VERIFICAR:** Muestra top 20 sucursales
3. [ ] **VERIFICAR:** Barras coloreadas según performance
4. [ ] **CON FILTRO GRUPO:** Verificar muestra solo sucursales del grupo
5. [ ] **CON FILTRO PERÍODO:** Verificar ranking se actualiza

---

### 📋 TAB "ÁREAS DE OPORTUNIDAD"

#### 🔥 MAPA DE CALOR
**Ubicación:** Tab "Áreas de Oportunidad" - Heat Map
**Pasos:**
1. [ ] Click en tab "Áreas de Oportunidad"
2. [ ] **VERIFICAR:** Mapa de calor 29 áreas carga
3. [ ] **VERIFICAR:** Colores según performance:
   - Verde: ≥90%
   - Azul: 80-89%
   - Amarillo: 70-79%
   - Rojo: <70%
4. [ ] **VERIFICAR:** Leyenda de colores visible
5. [ ] **CON FILTROS:** Verificar heat map se actualiza

#### 📊 GRÁFICA 3: RANKING ÁREAS (29 INDICADORES)
**Ubicación:** Tab "Áreas de Oportunidad" - Gráfica de barras
**Pasos:**
1. [ ] **VERIFICAR:** Gráfica ranking 29 áreas carga
2. [ ] **VERIFICAR:** Áreas ordenadas por performance
3. [ ] **VERIFICAR:** Línea meta 90% visible
4. [ ] **VERIFICAR:** Colores según rangos de performance
5. [ ] **CON FILTROS:** Verificar gráfica se actualiza

---

### 📈 TAB "HISTÓRICO"

#### 📊 GRÁFICA 4: EVOLUCIÓN HISTÓRICA
**Ubicación:** Tab "Histórico" - Línea de tiempo
**Pasos:**
1. [ ] Click en tab "Histórico"
2. [ ] **VERIFICAR:** Gráfica de líneas carga
3. [ ] **VERIFICAR:** Muestra evolución por trimestre
4. [ ] **VERIFICAR:** Línea meta 90% visible
5. [ ] **VERIFICAR:** Puntos de datos son clickeables
6. [ ] **CON FILTROS:** Verificar tendencia se actualiza

#### 📋 CARDS TENDENCIAS
**Ubicación:** Tab "Histórico" - Cards superiores
**Pasos:**
1. [ ] **VERIFICAR:** 3 cards de tendencias cargan
2. [ ] **VERIFICAR:** Muestran Performance Actual, Tendencia, Meta
3. [ ] **VERIFICAR:** Íconos y colores correctos
4. [ ] **CON FILTROS:** Verificar valores se actualizan

---

## 🔧 SECCIÓN 5: FUNCIONALIDADES ADICIONALES

#### 📄 GENERACIÓN DE REPORTES
**Pasos:**
1. [ ] Click en botón "Generar Reporte" (header)
2. [ ] **VERIFICAR:** Modal o nueva ventana abre
3. [ ] **VERIFICAR:** PDF se genera correctamente
4. [ ] **VERIFICAR:** Contiene datos filtrados actuales

#### 🕒 ÚLTIMA ACTUALIZACIÓN
**Pasos:**
1. [ ] **VERIFICAR:** Timestamp "Última actualización" visible
2. [ ] **VERIFICAR:** Formato fecha correcto
3. [ ] **VERIFICAR:** Se actualiza al aplicar filtros

#### 📱 RESPONSIVIDAD
**Pasos:**
1. [ ] **VERIFICAR:** Dashboard funciona en móvil (responsive)
2. [ ] **VERIFICAR:** Gráficas se ajustan a pantalla pequeña
3. [ ] **VERIFICAR:** Filtros son usables en móvil

---

## ⚠️ SECCIÓN 6: PROBLEMAS CONOCIDOS

### 🚨 ISSUES IDENTIFICADOS:
1. **❌ MAPA:** `/api/map/data` retorna array vacío
2. **⚠️ PERÍODO:** Filtro trimestre deshabilitado (usa Período CAS)

### 🔧 WORKAROUNDS:
1. **MAPA:** Verificar si muestra datos estáticos o carga desde otro endpoint
2. **TRIMESTRE:** Usar solo Período CAS para filtrado temporal

---

## ✅ CRITERIOS DE ÉXITO

### 🎯 DASHBOARD APROBADO SI:
- [ ] **FILTROS:** Todos los filtros funcionan y actualizan datos
- [ ] **KPIs:** Las 4 tarjetas se actualizan correctamente
- [ ] **GRÁFICAS:** 4 gráficas principales cargan y responden a filtros
- [ ] **NAVEGACIÓN:** 4 tabs funcionan sin errores
- [ ] **DATOS:** Información es consistente entre secciones
- [ ] **PERFORMANCE:** Dashboard carga en <5 segundos
- [ ] **RESPONSIVE:** Funciona en móvil y desktop

### 🚨 DASHBOARD RECHAZADO SI:
- [ ] **CRÍTICO:** Algún KPI no se actualiza con filtros
- [ ] **CRÍTICO:** Gráfica principal no carga
- [ ] **CRÍTICO:** Filtros no afectan los datos
- [ ] **CRÍTICO:** Errores JavaScript en consola
- [ ] **CRÍTICO:** Datos inconsistentes entre secciones

---

## 📝 REPORTE FINAL

**Fecha verificación:** _______________
**Verificado por:** _______________

### RESUMEN EJECUTIVO:
- **KPIs funcionando:** ___/4
- **Filtros funcionando:** ___/4  
- **Gráficas funcionando:** ___/4
- **Funcionalidades adicionales:** ___/3

### ESTADO GENERAL:
- [ ] ✅ **APROBADO** - Listo para presentación
- [ ] ⚠️ **APROBADO CON OBSERVACIONES** - Funciona pero tiene issues menores
- [ ] ❌ **RECHAZADO** - Requiere correcciones antes de presentar

### NOTAS ADICIONALES:
_____________________________________
_____________________________________
_____________________________________