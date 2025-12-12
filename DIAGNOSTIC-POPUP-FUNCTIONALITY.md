# DIAGNÓSTICO COMPLETO: FUNCIONALIDAD DE POPUPS DEL MAPA

## 📋 ESTADO ACTUAL
- ❌ **Popups básicos**: Funcionando con datos limitados
- ❌ **Enriquecimiento**: Deshabilitado temporalmente 
- ❌ **Endpoint problema**: `/api/analisis-critico` devuelve Error 500

## 🎯 FUNCIONALIDAD COMPLETA ORIGINAL

### 1. ESTRUCTURA DEL POPUP
Los popups tienen **2 fases de carga**:

#### **FASE 1: Popup Básico (Inmediato)**
```html
📍 [Nombre Sucursal]
[Estado] • [Grupo Operativo]

🎯 Performance General: [X]%
📊 Cargando tendencia...

🔍 Cargando áreas críticas...
📅 Cargando fecha...
```

#### **FASE 2: Popup Enriquecido (Al hacer click)**
Se dispara `enrichTooltipContent()` que llama `/api/analisis-critico` y actualiza:

1. **Performance Actualizado**: 
   - Valor real de CAS en lugar del básico
   - Color actualizado según performance real

2. **Tendencia CAS**:
   ```
   📈 +2.3 pts vs NL-T3-2025 (87.2%)
   📊 Período: NL-T4-2025
   ```

3. **Áreas Críticas (Top 3 <80%)**:
   ```
   🎯 Áreas de Oportunidad (<80%):
   1. Proceso Operativo: 75.5% 📉
   2. Servicio al Cliente: 78.2% 📈  
   3. Limpieza y Mantenimiento: 69.8% 📉
   ```

4. **Fecha de Supervisión**:
   ```
   📅 Última supervisión: 15 nov 2024
   ```

### 2. DATOS QUE DEBE DEVOLVER `/api/analisis-critico`

```json
{
  "success": true,
  "sucursal": "Coahuila Comidas",
  "numero_sucursal": 45,
  "grupo_operativo": "GRUPO PIEDRAS NEGRAS",
  "estado": "Coahuila",
  "performance_general": {
    "actual": 85.7,
    "anterior": 83.4, 
    "cambio": 2.3,
    "tendencia": "📈"
  },
  "periodos": {
    "actual": "NL-T4-2025",
    "anterior": "NL-T3-2025",
    "es_fallback": false
  },
  "areas_criticas": [
    {
      "area_evaluacion": "Proceso Operativo",
      "score_actual": 75.5,
      "tendencia": "📉",
      "nota": null
    },
    {
      "area_evaluacion": "Servicio al Cliente", 
      "score_actual": 78.2,
      "tendencia": "📈",
      "nota": null
    }
  ],
  "ultima_supervision": "2025-11-15T10:30:00.000Z",
  "metadata": {
    "areas_con_fallback": 0,
    "method": "NEW (CAS)"
  }
}
```

### 3. LÓGICA DE ACTUALIZACIÓN

#### **Actualización de Performance**:
```javascript
// Se actualiza el elemento con ID: performance-${uniqueId}
const actualPerformance = data.performance_general.actual; // 85.7
const performanceColor = actualPerformance >= 90 ? '#27ae60' : 
                        actualPerformance >= 80 ? '#3498db' : 
                        actualPerformance >= 70 ? '#f39c12' : '#e74c3c';

element.innerHTML = `🎯 Performance General: ${actualPerformance}%`;
element.style.color = performanceColor;
```

#### **Actualización de Tendencia**:
```javascript
// Se actualiza el elemento con ID: tendencia-${uniqueId}
const cambio = data.performance_general.cambio; // 2.3
tendenciaElement.innerHTML = `
    ${data.performance_general.tendencia} ${cambio > 0 ? '+' : ''}${cambio} pts vs ${data.periodos.anterior} (${anterior}%)
`;
```

#### **Actualización de Áreas Críticas**:
```javascript
// Se actualiza el elemento con ID: areas-criticas-${uniqueId}
const areasHTML = data.areas_criticas.slice(0, 3).map((area, index) => {
    return `<div style="margin: 2px 0; font-size: 12px;">
        ${index + 1}. ${area.area_evaluacion.substring(0, 20)}...: 
        <span style="color: #e74c3c; font-weight: 600;">${area.score_actual}%</span>
        <span style="color: #666;">${area.tendencia}</span>
    </div>`;
}).join('');
```

### 4. PROBLEMA TÉCNICO ACTUAL

#### **Error Root Cause**:
```
Error: calculateCASPeriod is not defined
Línea: 2441 en server-COMPLETO-CON-MENU-BUTTON.js
```

#### **Función Faltante**:
```javascript
function determineCASPeriod(dateString) {
    if (!dateString) return 'SIN-PERIODO';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (year === 2025) {
        if (month >= 1 && month <= 3) return 'NL-T1-2025';
        if (month >= 4 && month <= 6) return 'NL-T2-2025'; 
        if (month >= 7 && month <= 9) return 'NL-T3-2025';
        if (month >= 10 && month <= 12) return 'NL-T4-2025';
    }
    
    return 'PERIODO-' + year + '-Q' + Math.ceil(month / 3);
}
```

## 🔧 PLAN DE REPARACIÓN

### **PASO 1: Arreglar Servidor** ✅ (Ya implementado)
- [x] Agregar función `determineCASPeriod`
- [x] Corregir referencia en línea 2441

### **PASO 2: Reactivar Frontend**
- [ ] Descomentar llamada a `/api/analisis-critico` 
- [ ] Remover datos mock temporales
- [ ] Verificar funcionamiento completo

### **PASO 3: Testing Completo**
- [ ] Probar popup básico
- [ ] Probar enriquecimiento al click
- [ ] Verificar todos los campos se actualicen
- [ ] Testing cross-browser

## 🎯 VALOR DE NEGOCIO

### **Información Crítica que Proveen**:
1. **Performance Real CAS**: Datos actualizados vs básicos del mapa
2. **Tendencia Histórica**: Comparación vs período anterior 
3. **Áreas de Oportunidad**: Top 3 aspectos a mejorar (<80%)
4. **Contexto Temporal**: Cuándo fue la última supervisión

### **Para Qué Se Usa**:
- **Managers**: Identificar sucursales problemáticas rápidamente
- **Operaciones**: Saber exactamente qué áreas necesitan atención
- **Análisis**: Entender tendencias y evolución del performance
- **Toma de Decisiones**: Datos precisos para acciones correctivas

## ⚡ RECOMENDACIÓN

**PRIORIDAD ALTA**: Los popups enriquecidos son críticos para el valor del dashboard. 

**ACCIÓN RECOMENDADA**: 
1. Esperar 5-10 minutos a que deploy del servidor esté activo
2. Reactivar llamada a API en frontend  
3. Testing inmediato de funcionalidad completa
4. Rollback rápido si hay problemas

**IMPACTO**: Sin popups enriquecidos, el mapa pierde ~70% de su valor analítico.