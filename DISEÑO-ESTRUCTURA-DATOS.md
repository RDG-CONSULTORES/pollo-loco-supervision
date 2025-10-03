# 🏗️ DISEÑO ESTRUCTURA DE DATOS - El Pollo Loco CAS

## 📊 JERARQUÍA DE DATOS PROPUESTA

```
🏢 NIVEL 1: GRUPOS OPERATIVOS (20 grupos)
├── 📊 Calificación General
├── 📈 Desglose por Trimestres (Q1, Q2, Q3 2025)
├── 🗺️ Clasificación NL vs Foráneas
└── 🏪 NIVEL 2: SUCURSALES (Locations)
    ├── 📍 Información geográfica
    ├── 📊 Performance individual
    ├── 📈 Tendencias temporales
    └── 🎯 Áreas de oportunidad (29 indicadores)
```

---

## 🎯 DIMENSIONES DE ANÁLISIS

### 1. 📏 DIMENSIÓN ORGANIZACIONAL
```yaml
Grupos Operativos:
  - OGAS (Nuevo León)
  - TEPEYAC (Nuevo León)
  - EXPO (Multi-estado)
  - GRUPO SALTILLO (Coahuila)
  - TEC (Multi-estado)
  - PLOG QUERETARO (Querétaro)
  - EFM (Nuevo León)
  - [... 13 grupos más]

Sucursales por Grupo:
  - Cada grupo tiene N sucursales
  - Cada sucursal pertenece a UN grupo
  - Identificación única por location_name
```

### 2. 🗺️ DIMENSIÓN GEOGRÁFICA
```yaml
Clasificación Territorial:
  Locales (NL):
    - Nuevo León (excepto 3 foráneas)
    - GRUPO SALTILLO (aunque esté en Coahuila)
    - Períodos: NL-T1, NL-T2, NL-T3 (trimestrales)
  
  Foráneas:
    - Estados: Coahuila, Tamaulipas, Querétaro, etc.
    - Sucursales específicas: 57-Harold R. Pape, 30-Carrizo, 28-Guerrero
    - Períodos: FOR-S1, FOR-S2 (semestrales)
```

### 3. ⏰ DIMENSIÓN TEMPORAL
```yaml
Períodos CAS:
  NL-T1: Mar 12 - Abr 30, 2025 (Locales)
  NL-T2: May 01 - Dic 31, 2025 (Locales)  
  NL-T3: Jul 01 - Dic 31, 2025 (Locales)
  FOR-S1: Mar 12 - Jun 30, 2025 (Foráneas)
  FOR-S2: Jul 01 - Dic 31, 2025 (Foráneas)

Trimestres Estándar:
  Q1 2025: Ene - Mar
  Q2 2025: Abr - Jun
  Q3 2025: Jul - Sep
```

### 4. 📊 DIMENSIÓN PERFORMANCE
```yaml
Métricas por Nivel:
  Grupo Operativo:
    - Promedio general (area_evaluacion = '')
    - Número de sucursales
    - Total supervisiones
    - Rango (min-max performance)
  
  Sucursal:
    - Performance individual
    - Número de evaluaciones
    - Última supervisión
    - Tendencia temporal
  
  Indicador:
    - 29 áreas de evaluación específicas
    - Performance por área
    - Ranking de criticidad
```

---

## 📋 ESTRUCTURA REPORTE PROPUESTO

### 📑 SECCIÓN 1: RESUMEN EJECUTIVO
```yaml
KPIs Generales:
  - Promedio sistema: XX.XX%
  - Total grupos: 20
  - Total sucursales: 82
  - Total supervisiones: 169
  - Período analizado: Mar-Oct 2025
```

### 📑 SECCIÓN 2: RANKING GRUPOS OPERATIVOS
```yaml
Por cada grupo mostrar:
  Información Base:
    - Nombre del grupo
    - Promedio general
    - Número de sucursales
    - Total supervisiones
    - Estado(s) donde opera
  
  Desglose Temporal:
    - Performance Q1 2025
    - Performance Q2 2025  
    - Performance Q3 2025
    - Tendencia (↑↓→)
  
  Clasificación Territorial:
    - Performance en NL (si aplica)
    - Performance Foráneas (si aplica)
    - Períodos CAS específicos
  
  Ranking:
    - Posición en ranking general
    - Estatus (Excelente/Bueno/Regular/Crítico)
    - Comparativa vs promedio sistema
```

### 📑 SECCIÓN 3: DESGLOSE POR SUCURSALES
```yaml
Por cada grupo, mostrar sus sucursales:
  Información Sucursal:
    - Nombre y número de sucursal
    - Estado y municipio
    - Coordenadas (lat/lng)
    - Performance individual
    - Número de evaluaciones
  
  Análisis Temporal:
    - Performance por trimestre
    - Última supervisión
    - Frecuencia de evaluaciones
  
  Contexto:
    - Ranking dentro del grupo
    - Comparativa vs promedio grupo
    - Áreas más críticas (top 3)
```

### 📑 SECCIÓN 4: ANÁLISIS TERRITORIAL
```yaml
Nuevo León vs Foráneas:
  Locales (NL):
    - Grupos que operan en NL
    - Promedio general NL
    - Distribución por períodos T1/T2/T3
    - Top/Bottom performers NL
  
  Foráneas:
    - Estados de operación
    - Promedio general Foráneas
    - Distribución por períodos S1/S2
    - Análisis por estado
```

### 📑 SECCIÓN 5: ALERTAS Y RECOMENDACIONES
```yaml
Grupos Críticos (<70%):
  - Lista de grupos bajo meta
  - Sucursales más problemáticas
  - Áreas de mayor oportunidad
  
Grupos Excelentes (≥90%):
  - Mejores prácticas identificadas
  - Sucursales modelo
  - Estrategias replicables
```

---

## 🔍 CONSULTAS SQL REQUERIDAS

### 1. 📊 GRUPOS OPERATIVOS - GENERAL
```sql
SELECT 
    grupo_operativo_limpio as grupo,
    ROUND(AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END), 2) as promedio_general,
    COUNT(DISTINCT location_name) as sucursales,
    COUNT(DISTINCT submission_id) as supervisiones,
    COUNT(DISTINCT estado_normalizado) as estados,
    ROUND(MIN(CASE WHEN area_evaluacion = '' THEN porcentaje END), 2) as min_performance,
    ROUND(MAX(CASE WHEN area_evaluacion = '' THEN porcentaje END), 2) as max_performance,
    STRING_AGG(DISTINCT estado_normalizado, ', ') as estados_operacion
FROM supervision_operativa_clean 
WHERE area_evaluacion = ''
GROUP BY grupo_operativo_limpio
ORDER BY promedio_general DESC;
```

### 2. 📈 GRUPOS POR TRIMESTRE
```sql
SELECT 
    grupo_operativo_limpio as grupo,
    EXTRACT(QUARTER FROM fecha_supervision) as trimestre,
    ROUND(AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END), 2) as promedio_trimestre,
    COUNT(DISTINCT submission_id) as supervisiones_trimestre
FROM supervision_operativa_clean 
WHERE area_evaluacion = ''
GROUP BY grupo_operativo_limpio, EXTRACT(QUARTER FROM fecha_supervision)
ORDER BY grupo, trimestre;
```

### 3. 🗺️ GRUPOS NL vs FORÁNEAS
```sql
SELECT 
    grupo_operativo_limpio as grupo,
    CASE 
        WHEN (estado_normalizado = 'Nuevo León' OR grupo_operativo_limpio = 'GRUPO SALTILLO')
             AND location_name NOT IN ('57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero')
        THEN 'Locales (NL)'
        ELSE 'Foráneas'
    END as clasificacion,
    ROUND(AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END), 2) as promedio,
    COUNT(DISTINCT location_name) as sucursales
FROM supervision_operativa_clean 
WHERE area_evaluacion = ''
GROUP BY grupo_operativo_limpio, clasificacion
ORDER BY grupo, clasificacion;
```

### 4. 🏪 SUCURSALES POR GRUPO
```sql
SELECT 
    grupo_operativo_limpio as grupo,
    location_name as sucursal,
    estado_normalizado as estado,
    municipio,
    latitud,
    longitud,
    ROUND(AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END), 2) as performance,
    COUNT(DISTINCT submission_id) as evaluaciones,
    MAX(fecha_supervision) as ultima_supervision
FROM supervision_operativa_clean 
WHERE area_evaluacion = ''
GROUP BY grupo_operativo_limpio, location_name, estado_normalizado, municipio, latitud, longitud
ORDER BY grupo, performance DESC;
```

---

## ⚡ OPTIMIZACIONES RECOMENDADAS

### 1. 📊 VISTAS MATERIALIZADAS
```sql
-- Vista para cálculos frecuentes de grupos
CREATE MATERIALIZED VIEW grupos_performance_summary AS
SELECT 
    grupo_operativo_limpio,
    promedio_general,
    total_sucursales,
    total_supervisiones,
    ranking
FROM [consulta optimizada];

-- Refresh automático cada hora
REFRESH MATERIALIZED VIEW grupos_performance_summary;
```

### 2. 🔄 CACHE ESTRATÉGICO
```javascript
// Cache en memoria para consultas frecuentes
const cache = {
    grupos_general: { data: null, timestamp: null, ttl: 300000 }, // 5 min
    grupos_trimestres: { data: null, timestamp: null, ttl: 600000 }, // 10 min
    sucursales_detalle: { data: null, timestamp: null, ttl: 180000 } // 3 min
};
```

### 3. 📱 PAGINACIÓN INTELIGENTE
```javascript
// Para sucursales por grupo (evitar cargar 82 de una vez)
const paginateResults = (data, page = 1, limit = 20) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    return {
        data: data.slice(startIndex, endIndex),
        pagination: {
            current_page: page,
            total_pages: Math.ceil(data.length / limit),
            total_records: data.length,
            has_next: endIndex < data.length,
            has_prev: page > 1
        }
    };
};
```

---

## 🎯 MÉTRICAS DE CALIDAD

### ✅ CRITERIOS DE VALIDACIÓN
```yaml
Consistencia de Datos:
  - Suma de sucursales por grupo = 82 total
  - Suma de supervisiones por grupo = 169 total
  - No debe haber promedios NULL en grupos activos
  - Fechas dentro del rango Mar-Oct 2025

Integridad Referencial:
  - Cada sucursal pertenece a exactamente 1 grupo
  - Cada supervisión tiene ubicación válida
  - Coordenadas válidas para sucursales activas
  - Estados normalizados consistentes

Performance Queries:
  - Consulta grupos: <200ms
  - Consulta sucursales: <500ms
  - Consulta detalle trimestres: <300ms
  - Total tiempo carga dashboard: <2s
```

### 🔍 ALERTAS AUTOMÁTICAS
```yaml
Datos Inconsistentes:
  - Grupos sin sucursales asignadas
  - Sucursales sin coordenadas
  - Supervisiones sin calificación general
  - Fechas fuera de rango esperado

Performance Issues:
  - Consultas >1s tiempo respuesta
  - Memoria usage >80%
  - Errores en cache
  - Fallo en conexión BD
```

---

## 📋 CHECKLIST IMPLEMENTACIÓN

### ✅ FASE 1: ESTRUCTURA BASE
- [ ] Implementar consultas SQL optimizadas
- [ ] Crear endpoints para cada nivel jerárquico
- [ ] Validar consistencia de datos
- [ ] Implementar cache básico

### ✅ FASE 2: FEATURES AVANZADAS
- [ ] Agregar filtros temporales
- [ ] Implementar paginación
- [ ] Crear vistas materializadas
- [ ] Optimizar performance

### ✅ FASE 3: VALIDACIÓN
- [ ] Verificar todos los totales
- [ ] Validar cálculos por trimestre
- [ ] Confirmar clasificación NL/Foráneas
- [ ] Testing de todos los endpoints

---

**🎯 OBJETIVO**: Tener una estructura de datos completamente verificada y consistente que permita análisis jerárquico desde grupos hasta sucursales individuales, con dimensiones temporales y geográficas claras.

**⏱️ TIEMPO ESTIMADO**: 2-3 horas para implementación completa y verificación.