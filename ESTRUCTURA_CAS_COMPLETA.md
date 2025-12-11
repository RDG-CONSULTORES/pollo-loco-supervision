# ESTRUCTURA COMPLETA CAS - EL POLLO LOCO

**Documento de Referencia Completo sobre Períodos CAS y Clasificación de Sucursales**

## 📅 PERÍODOS CAS DEFINIDOS

### 🏠 SUCURSALES LOCALES (Nuevo León + GRUPO SALTILLO)

**Períodos Trimestrales:**
- **T1**: 12 Mar 2025 - 16 Abr 2025 (`NL-T1-2025`) - CERRADO
- **T2**: 11 Jun 2025 - 18 Ago 2025 (`NL-T2-2025`) - CERRADO  
- **T3**: 19 Ago 2025 - 09 Oct 2025 (`NL-T3-2025`) - CERRADO
- **T4**: 30 Oct 2025 - presente (`NL-T4-2025`) - ⭐ **ACTIVO**

### 🌍 SUCURSALES FORÁNEAS (Resto de Estados)

**Períodos Semestrales:**
- **S1**: 10 Abr 2025 - 09 Jun 2025 (`FOR-S1-2025`) - CERRADO
- **S2**: 30 Jul 2025 - 07 Nov 2025 (`FOR-S2-2025`) - CERRADO

---

## 🎯 LÓGICA DE CLASIFICACIÓN CAS

### Código de la Función `getPeriodoCAS()`

```javascript
function getPeriodoCAS(fecha, estado, grupoOperativo, locationName) {
    const fechaObj = new Date(fecha);
    
    // Determinar si es Local (NL) o Foránea
    const isLocal = (
        estado === 'Nuevo León' || 
        grupoOperativo === 'GRUPO SALTILLO'
    ) && !['57 - Harold R. Pape', '30 - Carrizo', '28 - Guerrero'].includes(locationName);
    
    if (isLocal) {
        // LOCALES NL - Periodos Trimestrales
        if (fechaObj >= new Date('2025-03-12') && fechaObj <= new Date('2025-04-16')) {
            return 'NL-T1-2025';
        } else if (fechaObj >= new Date('2025-06-11') && fechaObj <= new Date('2025-08-18')) {
            return 'NL-T2-2025';
        } else if (fechaObj >= new Date('2025-08-19') && fechaObj <= new Date('2025-10-09')) {
            return 'NL-T3-2025';
        } else if (fechaObj >= new Date('2025-10-30')) {
            return 'NL-T4-2025';
        }
    } else {
        // FORÁNEAS - Periodos Semestrales
        if (fechaObj >= new Date('2025-04-10') && fechaObj <= new Date('2025-06-09')) {
            return 'FOR-S1-2025';
        } else if (fechaObj >= new Date('2025-07-30') && fechaObj <= new Date('2025-11-07')) {
            return 'FOR-S2-2025';
        }
    }
    
    return 'OTRO'; // Fuera de periodos CAS definidos
}
```

### Reglas de Clasificación

**SUCURSAL ES LOCAL SI:**
1. `estado === 'Nuevo León'` **OR** `grupoOperativo === 'GRUPO SALTILLO'`
2. **Y NO está en la lista de excepciones especiales**

**EXCEPCIONES ESPECIALES (SIEMPRE FORÁNEAS):**
- `57 - Harold R. Pape` (GRUPO SALTILLO → FORÁNEA)
- `30 - Carrizo` (EXPO → FORÁNEA)
- `28 - Guerrero` (EXPO → FORÁNEA)

---

## 🏢 TODOS LOS GRUPOS OPERATIVOS

**Total:** 22 grupos operativos

### Grupos 100% LOCALES (Nuevo León únicamente)

1. **TEPEYAC** - 10 sucursales
   - Estados: Nuevo León
   - Sucursales: 1 - Pino Suarez, 2 - Madero, 3 - Matamoros, 4 - Santa Catarina, 5 - Felix U. Gomez, 6 - Garcia, 7 - La Huasteca, Sucursal GC - Garcia, Sucursal LH - La Huasteca, Sucursal SC - Santa Catarina

2. **OGAS** - 8 sucursales
   - Estados: Nuevo León
   - Sucursales: 10 - Barragan, 11 - Lincoln, 12 - Concordia, 13 - Escobedo, 14 - Aztlan, 15 - Ruiz Cortinez, 8 - Gonzalitos, 9 - Anahuac

3. **PLOG NUEVO LEON** - 6 sucursales
   - Estados: Nuevo León
   - Sucursales: 36 - Apodaca Centro, 37 - Stiva, 38 - Gomez Morin, 39 - Lazaro Cardenas, 40 - Plaza 1500, 41 - Vasconcelos

4. **EFM** - 3 sucursales
   - Estados: Nuevo León
   - Sucursales: 17 - Romulo Garza, 18 - Linda Vista, 19 - Valle Soleado

5. **EPL SO** - 1 sucursal
   - Estados: Nuevo León
   - Sucursales: 16 - Solidaridad

6. **GRUPO CENTRITO** - 1 sucursal
   - Estados: Nuevo León
   - Sucursales: 71 - Centrito Valle

7. **GRUPO SABINAS HIDALGO** - 1 sucursal
   - Estados: Nuevo León
   - Sucursales: 72 - Sabinas Hidalgo

8. **SIN_MAPEO** - 1 sucursal
   - Estados: Nuevo León
   - Sucursales: Sucursal SC - Santa Catarina

### Grupos 100% FORÁNEOS

9. **GRUPO MATAMOROS** - 5 sucursales
   - Estados: Tamaulipas
   - Sucursales: 65 - Pedro Cardenas, 66 - Lauro Villar, 67 - Centro (Matamoros), 68 - Avenida del Niño, 69 - Puerto Rico

10. **OCHTER TAMPICO** - 4 sucursales
    - Estados: Tamaulipas
    - Sucursales: 58 - Universidad (Tampico), 59 - Plaza 3601, 60 - Centro (Tampico), 61 - Aeropuerto (Tampico)

11. **PLOG QUERETARO** - 4 sucursales
    - Estados: Querétaro
    - Sucursales: 48 - Refugio, 49 - Pueblito, 50 - Patio, 51 - Constituyentes

12. **PLOG LAGUNA** - 6 sucursales
    - Estados: Coahuila, Coahuila de Zaragoza, Durango
    - Sucursales: 42 - Independencia, 43 - Revolucion, 44 - Senderos, 45 - Triana, 46 - Campestre, 47 - San Antonio

13. **GRUPO CANTERA ROSA (MORELIA)** - 3 sucursales
    - Estados: Michoacán, Michoacán de Ocampo
    - Sucursales: 62 - Lazaro Cardenas (Morelia), 63 - Madero (Morelia), 64 - Huerta

14. **CRR** - 3 sucursales
    - Estados: Tamaulipas
    - Sucursales: 73 - Anzalduas, 74 - Hidalgo (Reynosa), 75 - Libramiento (Reynosa)

15. **RAP** - 3 sucursales
    - Estados: Tamaulipas
    - Sucursales: 76 - Aeropuerto (Reynosa), 77 - Boulevard Morelos, 78 - Alcala

16. **GRUPO NUEVO LAREDO (RUELAS)** - 2 sucursales
    - Estados: Tamaulipas
    - Sucursales: 80 - Guerrero 2 (Ruelas), 81 - Reforma (Ruelas)

17. **GRUPO PIEDRAS NEGRAS** - 1 sucursal
    - Estados: Coahuila, Coahuila de Zaragoza
    - Sucursales: 70 - Coahuila Comidas

18. **GRUPO RIO BRAVO** - 1 sucursal
    - Estados: Tamaulipas
    - Sucursales: 79 - Rio Bravo

### Grupos MIXTOS (Local + Foráneo)

19. **GRUPO SALTILLO** - 3 sucursales ⚠️ EXCEPCIÓN ESPECIAL
    - Estados: Coahuila, Coahuila de Zaragoza
    - **Clasificación CAS**: LOCAL (por regla especial)
    - **EXCEPCIÓN**: 57 - Harold R. Pape → FORÁNEA
    - Sucursales LOCALES: 52 - Venustiano Carranza, 54 - Ramos Arizpe
    - Sucursales FORÁNEAS: 57 - Harold R. Pape

20. **EXPO** - 11 sucursales
    - Estados: Nuevo León, Tamaulipas
    - **LOCALES (9)**: 24 - Exposicion, 25 - Juarez, 26 - Cadereyta, 27 - Santiago, 29 - Pablo Livas, 31 - Las Quintas, 32 - Allende, 33 - Eloy Cavazos, 34 - Montemorelos
    - **FORÁNEAS (2)**: 28 - Guerrero, 30 - Carrizo ⚠️ EXCEPCIONES ESPECIALES

21. **TEC** - 4 sucursales
    - Estados: Nuevo León, Sinaloa
    - **LOCALES (3)**: 20 - Tecnológico, 21 - Chapultepec, 22 - Satelite
    - **FORÁNEAS (1)**: 23 - Guasave

22. **NO_ENCONTRADO** - 23 sucursales (grupo de mapeo incompleto)
    - Estados: Coahuila de Zaragoza, Nuevo León, Tamaulipas
    - **LOCALES (9)**: 24 - Exposicion, 25 - Juarez, 26 - Cadereyta, 27 - Santiago, 29 - Pablo Livas, 31 - Las Quintas, 32 - Allende, 33 - Eloy Cavazos, 34 - Montemorelos
    - **FORÁNEAS (14)**: 28 - Guerrero, 30 - Carrizo, 52 - Venustiano Carranza, 53 - Lienzo Charro, 54 - Ramos Arizpe, 55 - Eulalio Gutierrez, 56 - Luis Echeverria, 57 - Harold R. Pape, 73 - Anzalduas, 74 - Hidalgo (Reynosa), 75 - Libramiento (Reynosa), 76 - Aeropuerto (Reynosa), 77 - Boulevard Morelos, 78 - Alcala

---

## ⚠️ EXCEPCIONES ESPECIALES

El sistema tiene 3 excepciones hardcodeadas que anulan la clasificación normal:

### 1. **57 - Harold R. Pape**
- **Grupo Operativo**: GRUPO SALTILLO  
- **Estado**: Coahuila
- **Clasificación Normal**: LOCAL (por ser GRUPO SALTILLO)
- **Clasificación Real**: **FORÁNEA** (excepción especial)

### 2. **30 - Carrizo**  
- **Grupo Operativo**: EXPO
- **Estado**: Tamaulipas
- **Clasificación Normal**: FORÁNEA (por estar en Tamaulipas)
- **Clasificación Real**: **FORÁNEA** (confirmada por excepción)

### 3. **28 - Guerrero**
- **Grupo Operativo**: EXPO  
- **Estado**: Tamaulipas
- **Clasificación Normal**: FORÁNEA (por estar en Tamaulipas)
- **Clasificación Real**: **FORÁNEA** (confirmada por excepción)

---

## 📊 RESUMEN ESTADÍSTICO

### Por Clasificación CAS
- **GRUPOS 100% LOCALES**: 8 grupos
- **GRUPOS 100% FORÁNEOS**: 10 grupos  
- **GRUPOS MIXTOS**: 4 grupos (GRUPO SALTILLO, EXPO, TEC, NO_ENCONTRADO)

### Por Estados
- **Nuevo León**: Mayoritariamente LOCAL (excepto 2 sucursales de EXPO que son FORÁNEAS)
- **Coahuila/Coahuila de Zaragoza**: GRUPO SALTILLO = LOCAL (excepto 57 - Harold R. Pape)
- **Tamaulipas**: Todos FORÁNEOS
- **Otros Estados**: Todos FORÁNEOS (Querétaro, Durango, Michoacán, Sinaloa)

### Distribución de Sucursales
- **Total de sucursales en sistema**: ~100+
- **Sucursales LOCALES**: ~60 sucursales (Nuevo León + GRUPO SALTILLO - excepciones)
- **Sucursales FORÁNEAS**: ~40 sucursales (resto de estados + excepciones)

---

## 💻 IMPLEMENTACIÓN TÉCNICA

### Endpoint API Períodos CAS
```javascript
app.get('/api/periodos-cas', async (req, res) => {
    const periodos = [
        { id: 'NL-T1-2025', nombre: 'NL-T1 (Mar 12 - Abr 16)', tipo: 'local', estado: 'cerrado' },
        { id: 'NL-T2-2025', nombre: 'NL-T2 (Jun 11 - Ago 18)', tipo: 'local', estado: 'cerrado' },
        { id: 'NL-T3-2025', nombre: 'NL-T3 (Ago 19 - Oct 9)', tipo: 'local', estado: 'cerrado' },
        { id: 'NL-T4-2025', nombre: 'NL-T4 (Oct 30 - presente)', tipo: 'local', estado: 'activo' },
        { id: 'FOR-S1-2025', nombre: 'FOR-S1 (Abr 10 - Jun 9)', tipo: 'foranea', estado: 'cerrado' },
        { id: 'FOR-S2-2025', nombre: 'FOR-S2 (Jul 30 - Nov 7)', tipo: 'foranea', estado: 'cerrado' }
    ];
    res.json(periodos);
});
```

### Base de Datos
- **Tabla Principal**: `supervision_operativa_detalle`
- **Vista Limpia**: `supervision_operativa_detalle_clean` (si existe)
- **Campos Clave**: `location_name`, `estado`, `grupo_operativo`, `fecha_supervision`

---

## 🔧 USO DEL SISTEMA

### Para Determinar Período CAS de una Supervisión
1. Obtener: `fecha_supervision`, `estado`, `grupo_operativo`, `location_name`
2. Llamar: `getPeriodoCAS(fecha, estado, grupoOperativo, locationName)`  
3. Resultado: Código del período (`NL-T1-2025`, `FOR-S1-2025`, etc.) o `OTRO`

### Para Filtrar Dashboard
- **Período Local Activo**: `NL-T4-2025`
- **Período Foráneo Cerrado**: `FOR-S2-2025`  
- **Filtros de Grupo**: Usar los 22 grupos operativos listados
- **Excepciones**: Siempre validar las 3 sucursales especiales

---

*Documento generado automáticamente del análisis completo del sistema CAS*  
*Última actualización: Diciembre 2024*