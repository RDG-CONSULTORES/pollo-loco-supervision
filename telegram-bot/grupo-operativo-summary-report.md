# Grupo Operativo - Sucursales Mapping Report

## Summary

Based on the `supervision_operativa_detalle` table analysis, we found **22 distinct grupos operativos** managing a total of **81 unique sucursales**.

## Key Findings

### 1. Largest Groups by Number of Sucursales
- **EXPO**: 11 sucursales
- **TEPEYAC**: 10 sucursales (includes some variant names)
- **OGAS**: 8 sucursales
- **PLOG LAGUNA**: 6 sucursales
- **PLOG NUEVO LEON**: 6 sucursales

### 2. Largest Groups by Total Records
- **EXPO**: 76,604 records
- **OGAS**: 75,729 records
- **PLOG NUEVO LEON**: 48,004 records
- **TEPEYAC**: 46,156 records
- **PLOG LAGUNA**: 37,164 records

### 3. Single-Sucursal Groups
Several grupos operativos manage only one sucursal:
- **EPL SO**: 16 Solidaridad
- **GRUPO CENTRITO**: 71 Centrito Valle
- **GRUPO PIEDRAS NEGRAS**: 70 Coahuila Comidas
- **GRUPO RIO BRAVO**: 79 Rio Bravo
- **GRUPO SABINAS HIDALGO**: 72 Sabinas Hidalgo

### 4. Data Quality Issues

#### NO_ENCONTRADO Group
- Contains 22 sucursales with 41,861 records
- These are sucursales where the grupo operativo was not properly identified
- Many of these sucursales actually appear in other groups (duplicates)

#### Notable Duplicates Found
- Sucursales 73-78 appear in both CRR/RAP and NO_ENCONTRADO
- Sucursales 24-34 appear in both EXPO and NO_ENCONTRADO
- Sucursales 52, 54, 57 appear in both GRUPO SALTILLO and NO_ENCONTRADO

### 5. Regional Groups

#### Nuevo León Based
- **OGAS**: 8 sucursales (Monterrey area)
- **PLOG NUEVO LEON**: 6 sucursales (Apodaca, Monterrey)
- **TEC**: 4 sucursales (Monterrey area)
- **EFM**: 3 sucursales
- **EPL SO**: 1 sucursal

#### Tamaulipas Based
- **GRUPO MATAMOROS**: 5 sucursales (Matamoros)
- **OCHTER TAMPICO**: 4 sucursales (Tampico)
- **CRR**: 3 sucursales (Reynosa)
- **RAP**: 3 sucursales (Reynosa)
- **GRUPO NUEVO LAREDO (RUELAS)**: 2 sucursales (Nuevo Laredo)
- **GRUPO RIO BRAVO**: 1 sucursal

#### Other States
- **PLOG LAGUNA**: 6 sucursales (Torreón, Coahuila)
- **PLOG QUERETARO**: 4 sucursales (Querétaro)
- **GRUPO CANTERA ROSA (MORELIA)**: 3 sucursales (Michoacán)
- **GRUPO SALTILLO**: 3 sucursales (Saltillo, Coahuila)
- **GRUPO PIEDRAS NEGRAS**: 1 sucursal (Coahuila)

## Recommendations

1. **Data Cleanup**: Address the NO_ENCONTRADO group by properly assigning these sucursales to their correct grupos operativos.

2. **Standardization**: Some sucursales have variant names (e.g., "Sucursal SC Santa Catarina" vs "4 Santa Catarina"). These should be standardized.

3. **Group Consolidation**: Consider if smaller single-sucursal groups should be consolidated under regional management.

4. **Performance Monitoring**: Groups with significantly different record counts may indicate varying levels of activity or data collection practices that should be investigated.

## Usage in Knowledge Base

This mapping should be used as the authoritative source for:
- Identifying which sucursales belong to which grupo operativo
- Understanding regional coverage and management structure
- Filtering and aggregating data by grupo operativo
- Routing queries and reports to the appropriate management level