# 🔍 REPORTE DIAGNÓSTICO - DIFERENCIA DE PORCENTAJES

## 📋 RESUMEN EJECUTIVO

**Problema identificado**: Diferencia en el cálculo de porcentajes entre Zenput (88.71%) y nuestro sistema (89.89%) para La Huasteca del 29 de agosto 2025.

**Causa raíz encontrada**: ❌ **ERROR EN EL BACKEND** - El sistema está usando promedio de áreas en lugar del porcentaje directo de la supervisión.

## 📊 ANÁLISIS DETALLADO

### Datos de La Huasteca - 29 Agosto 2025

| Método de Cálculo | Resultado | Fuente |
|------------------|-----------|---------|
| **Zenput** | 88.71% | Sistema oficial |
| **Puntos directos** | 88.71% | 110/124 × 100 |
| **Promedio de áreas** | 89.95% | Promedio de 22 áreas |
| **Nuestro dashboard** | 89.89%* | AVG(porcentaje) backend |

\* *Valor aproximado reportado inicialmente*

### 🔍 Verificación de Cálculos

#### ✅ Cálculo Correcto (Zenput y DB)
```sql
Puntos Obtenidos: 110
Puntos Máximos: 124
Porcentaje: 110 ÷ 124 × 100 = 88.71%
```

#### ❌ Cálculo Incorrecto (Nuestro Backend)
```sql
-- Backend actual usa:
SELECT AVG(porcentaje) FROM areas_evaluacion
-- Resultado: 89.95% (promedio de 22 áreas individuales)
```

## 🚨 PROBLEMAS IDENTIFICADOS EN EL CÓDIGO

### Archivo: `backend/src/services/dataService.js`

**Líneas problemáticas**:
- **Línea 44**: KPIs principales - `AVG(porcentaje)`
- **Línea 91**: Datos por grupo - `AVG(porcentaje)`  
- **Línea 210**: Top/Bottom sucursales - `AVG(porcentaje)`
- **Línea 277**: Datos del mapa - `AVG(porcentaje)`

**Problema**: Todas las consultas calculan promedio de áreas en lugar del porcentaje directo de supervisión.

## 🔧 SOLUCIÓN REQUERIDA

### 1. Filtrar por Calificación General
```sql
-- CORRECTO: Obtener solo la calificación general
SELECT porcentaje 
FROM supervision_operativa_clean
WHERE area_evaluacion = ''  -- Calificación general
  AND porcentaje IS NOT NULL
```

### 2. Usar Vista Específica
```sql
-- ALTERNATIVA: Usar vista de calificaciones generales
SELECT calificacion_general
FROM calificaciones_generales_clean
```

### 3. Modificar Consultas del Backend

**Antes:**
```sql
SELECT AVG(porcentaje) as promedio
FROM supervision_operativa_clean
WHERE grupo_operativo = 'TEPEYAC'
```

**Después:**
```sql
SELECT AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END) as promedio
FROM supervision_operativa_clean
WHERE grupo_operativo = 'TEPEYAC'
  AND area_evaluacion = ''
```

## 📈 IMPACTO DEL ERROR

### Diferencias por Método
- **Error promedio**: +1.24% (usando promedio de áreas vs. porcentaje directo)
- **Rango de error**: Puede variar según la distribución de calificaciones por área
- **Impacto**: Sobrestimación sistemática de calificaciones

### Sucursales Afectadas
- **Todas las sucursales** que aparecen en rankings y estadísticas
- **Especialmente crítico** para sucursales con áreas muy dispares (algunas 100%, otras muy bajas)

## 🎯 RECOMENDACIONES CRÍTICAS

### 1. **INMEDIATO** - Corregir Backend
- [ ] Modificar `dataService.js` para usar calificaciones generales únicamente
- [ ] Filtrar `area_evaluacion = ''` en todas las consultas de porcentajes
- [ ] Probar cambios con datos de La Huasteca para verificar 88.71%

### 2. **VALIDACIÓN** - Verificar Consistencia
- [ ] Ejecutar queries de validación para todas las sucursales
- [ ] Comparar resultados antes/después del fix
- [ ] Documentar diferencias encontradas

### 3. **PREVENCIÓN** - Mejores Prácticas
- [ ] Crear función específica `getSupervisionScore()` 
- [ ] Documentar claramente qué campo contiene la calificación general
- [ ] Implementar tests unitarios para cálculos de porcentajes

## 📋 CHECKLIST PARA LA PRESENTACIÓN

### Para Mañana
- [x] ✅ **Identificada la causa**: Error en cálculo del backend
- [x] ✅ **Confirmado**: Zenput usa método correcto (puntos)
- [x] ✅ **Verificado**: Datos correctos están en la DB (88.71%)
- [ ] 🔧 **Pendiente**: Implementar fix en backend
- [ ] 🧪 **Pendiente**: Validar fix con datos de prueba

### Mensaje Clave
> "La diferencia se debe a un error en nuestro código backend que calcula promedio de áreas individuales (89.95%) en lugar de usar la calificación general de la supervisión (88.71%). Los datos están correctos en la base de datos, solo necesitamos corregir cómo los consultamos."

## 🔍 EVIDENCIA TÉCNICA

### Datos de La Huasteca (29 Ago 2025)
```
Submission ID: 68b1fb1ce127d8325447ac21
Puntos Obtenidos: 110
Puntos Máximos: 124
Porcentaje Directo: 88.71%
Promedio de 22 Áreas: 89.95%
```

### Áreas con Calificación < 100%
1. BAÑO CLIENTES: 75.00%
2. CONSERVADOR PAPA FRITA: 62.50% 
3. EXTERIOR SUCURSAL: 66.67%
4. FREIDORA DE PAPA: 66.67%
5. HORNOS: 81.82%
6. MAQUINA DE HIELO: 50.00%
7. PROCESO MARINADO: 92.86%
8. REFRIGERADORES DE SERVICIO: 83.33%

**Promedio áreas problemáticas**: 72.36%
**Promedio general (incluyendo 100%)**: 89.95%

---

## ✅ CONCLUSIÓN

**El sistema Zenput es correcto (88.71%)**. Nuestro error está en el backend que debe ser corregido para usar la calificación general de supervisión en lugar del promedio de áreas individuales.

La base de datos contiene los valores correctos, solo necesitamos modificar las consultas del backend para filtrar por `area_evaluacion = ''` y obtener la calificación general directa.