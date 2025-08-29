# Database Analysis for Interactive Web App Design

## 📊 Database Overview

The `supervision_operativa_clean` PostgreSQL table contains comprehensive operational supervision data for El Pollo Loco locations across Mexico, with **584,820 total evaluations** from **Q1-Q3 2025**.

## 🏗️ Table Structure

| Field | Type | Description | Usage for Web App |
|-------|------|-------------|------------------|
| `location_name` | VARCHAR | Store name/number | Primary identifier for map pins |
| `grupo_operativo_limpio` | VARCHAR | Operational group | Filter & grouping dimension |
| `area_evaluacion` | VARCHAR | Evaluation area (40+ types) | Performance breakdown charts |
| `porcentaje` | NUMERIC | Performance score (0-100%) | Color coding & KPIs |
| `fecha_supervision` | TIMESTAMP | Supervision date | Time series analysis |
| `estado_normalizado` | VARCHAR | Normalized state name | Geographic aggregation |
| `municipio` | VARCHAR | Municipality | Detailed location info |
| `latitud` | NUMERIC | Latitude coordinate | Map positioning |
| `longitud` | NUMERIC | Longitude coordinate | Map positioning |

## 🗺️ Geographic Coverage

### States with Locations
- **Nuevo León**: 39 locations (59.6% of total) - Primary market
- **Tamaulipas**: 20 locations (30.5%) - Second largest
- **Coahuila**: 9 locations (13.7%)
- **Querétaro**: 4 locations (6.1%)
- **Michoacán**: 3 locations (4.6%)
- **Durango**: 2 locations (3.1%)
- **Sinaloa**: 1 location (1.5%)

### Coordinate Data Quality
- **All locations have complete latitude/longitude data**
- Coordinates are accurate for precise map pin placement
- Geographic distribution spans northern Mexico

## 👥 Operational Groups (21 Total)

### Top Performing Groups (Q3 2025)
1. **OGAS**: 98.06% avg (7 locations, Monterrey metro)
2. **TEPEYAC**: 96.84% avg (4 locations, largest network)
3. **GRUPO PIEDRAS NEGRAS**: 94.90% avg (1 location)
4. **EPL SO**: 93.77% avg (1 location)
5. **TEC**: 92.43% avg (4 locations)

### Geographic Distribution
- **Nuevo León dominant**: OGAS, TEPEYAC, TEC, EXPO, EFM
- **Border markets**: GRUPO MATAMOROS, CRR, GRUPO NUEVO LAREDO
- **Regional expansion**: PLOG QUERETARO, GRUPO CANTERA ROSA

## 📅 Time Period Analysis

### Quarterly Data Availability

| Quarter | Evaluations | Locations | Active Groups | Avg Performance |
|---------|-------------|-----------|---------------|-----------------|
| **Q1 2025** | 95,848 | 25 | 7 | 91.67% |
| **Q2 2025** | 383,929 | 63 | 20 | 88.88% |
| **Q3 2025** | 105,043 | 45 | 16 | 89.87% |

### Key Insights
- **Q2 most comprehensive**: 4x more evaluations than Q1/Q3
- **Q1 highest performance**: 91.67% average
- **Seasonal patterns**: Performance dips in Q2 (88.88%)

## 📊 Performance Metrics Structure

### Evaluation Areas (40+ categories)
**Perfect Performers (100% avg)**:
- ALMACEN QUÍMICOS (6,941 evaluations)
- CAJAS DE TOTOPO EMPACADO (5,841 evaluations)
- LAVADO DE UTENSILIOS (4,537 evaluations)
- TIEMPOS DE SERVICIO (7,491 evaluations)

**High Performers (95-99%)**:
- BARRA DE SALSAS: 99.29%
- COMEDOR AREA COMEDOR: 99.06%
- PROCESO MARINADO: 97.75%
- REFRIGERADORES DE SERVICIO: 95.85%

### Score Distribution
- **Range**: 50-100% (wide performance spread)
- **Average**: ~89% across all areas
- **High performers**: Consistent 95%+ in operational areas
- **Improvement opportunities**: Equipment maintenance, cleanliness

## 🎯 Recommended Web App Features

### 1. Interactive Maps
**Pin Map Implementation**:
```javascript
// Sample data structure for map pins
{
  locationName: "29 - Pablo Livas",
  grupo: "EXPO", 
  coordinates: [25.6583, -100.1849],
  performance: 89.5,
  lastEvaluation: "2025-06-16",
  state: "Nuevo León",
  municipality: "Guadalupe"
}
```

**GeoJSON State Maps**:
- Aggregate performance by state
- Color coding: Green (95%+), Yellow (85-95%), Red (<85%)
- Click to drill down to municipality level

### 2. Performance Dashboards

**KPI Cards**:
- Overall network performance (current: ~89%)
- Top performing group (OGAS: 98.06%)
- Locations evaluated this quarter
- Areas needing attention

**Time Series Charts**:
- Quarterly performance trends
- Seasonal performance patterns
- Group performance evolution

### 3. Interactive Filters

**Geographic Filters**:
- State dropdown (7 states)
- Municipality selection
- Operational group (21 groups)

**Time Filters**:
- Quarter selector (Q1, Q2, Q3 2025)
- Date range picker for detailed analysis
- Comparison modes (QoQ, YoY)

**Performance Filters**:
- Score ranges (0-50%, 50-85%, 85-95%, 95%+)
- Evaluation areas (40+ categories)
- Improvement opportunities filter

### 4. Data Visualizations

**Performance Heatmaps**:
- State-level performance intensity
- Operational group comparison matrix
- Evaluation area performance grid

**Trend Analysis**:
- Line charts for quarterly performance
- Bar charts for group comparisons
- Scatter plots for location performance

**Drill-Down Capabilities**:
- Click state → view municipalities
- Click group → view locations
- Click location → view detailed scores

## 🔌 API Endpoints Design

### Geographic Data
```
GET /api/locations - All locations with coordinates
GET /api/states - State-level aggregated performance
GET /api/municipalities/:state - Municipality performance
```

### Performance Data  
```
GET /api/performance/overview - Network-wide KPIs
GET /api/performance/groups - Operational group performance
GET /api/performance/trends/:period - Time series data
```

### Filter Endpoints
```
GET /api/filters/states - Available states
GET /api/filters/groups - Available operational groups
GET /api/filters/areas - Available evaluation areas
```

## 📈 Key Business Metrics

### Network Performance
- **584,820 total evaluations** across 3 quarters
- **82 unique locations** with complete geographic data
- **21 operational groups** with varying performance levels
- **40+ evaluation areas** for comprehensive assessment

### Quality Indicators
- **100% location coverage** with coordinates
- **Consistent evaluation methodology** across all locations
- **Granular area-specific scoring** enables targeted improvements
- **Quarterly evaluation cycles** provide trend analysis

## 🚀 Implementation Recommendations

### Technology Stack
- **Frontend**: React/Vue with Mapbox/Leaflet for maps
- **Backend**: Node.js with PostgreSQL connection
- **Visualization**: Chart.js/D3.js for interactive charts
- **State Management**: Redux/Vuex for filter states

### Database Optimization
- Index on `estado_normalizado`, `grupo_operativo_limpio`, `fecha_supervision`
- Consider materialized views for aggregated quarterly data
- Cache frequently accessed geographic aggregations

### User Experience
- **Mobile-responsive design** for field managers
- **Progressive loading** for large datasets
- **Export capabilities** for reports and presentations
- **Real-time updates** when new data is available

This comprehensive analysis provides the foundation for creating a powerful, interactive dashboard that leverages all available data dimensions for actionable operational insights.