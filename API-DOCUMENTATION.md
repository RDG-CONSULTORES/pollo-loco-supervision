# 📊 API Documentation - Histórico v2.0 Dashboard

**Status**: ✅ PRODUCTION READY - Connected to Neon PostgreSQL

## Overview

Complete API structure for the Historical Analysis Dashboard, connected to live Neon PostgreSQL database with real-time supervision data from 80+ Pollo Loco locations.

---

## 🔗 API Endpoints

### 1. **GET** `/api/operational-groups`
**Purpose**: Get all operational groups for the circular slider

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "OGAS",
      "name": "OGAS", 
      "color": "#D03B34",
      "totalSucursales": "8",
      "promedioPerformance": "98.22",
      "totalEvaluaciones": "14487"
    }
  ]
}
```

**Status**: ✅ **TESTED & WORKING** - Returns 16 active groups with EPL branding colors

---

### 2. **GET** `/api/historical-performance/:groupId?`
**Purpose**: Historical performance data for Chart.js line charts

**Parameters**:
- `groupId` (optional): Filter by specific group or 'all'
- `dateRange` (query): '1month', '3months', '6months', 'year' (default: 3months)
- `area` (query): Filter by evaluation area or 'all'

**Response**:
```json
{
  "success": true,
  "data": {
    "labels": ["2025-05-19", "2025-05-26", "2025-06-02"],
    "datasets": [{
      "label": "TEPEYAC",
      "data": [93.12, 94.25, 92.87],
      "borderColor": "#D03B34",
      "backgroundColor": "#D03B3420",
      "borderWidth": 2,
      "fill": false,
      "spanGaps": true
    }]
  },
  "metadata": {
    "totalEvaluations": 13466,
    "dateRange": "3months",
    "groupFilter": "TEPEYAC",
    "areaFilter": "all"
  }
}
```

**Status**: ✅ **TESTED & WORKING** - Chart.js ready format with spanGaps for nulls

---

### 3. **GET** `/api/heatmap-data/:groupId?`
**Purpose**: Geographic heatmap data with coordinates and performance levels

**Parameters**:
- `groupId` (optional): Filter by specific group or 'all'

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "location": "4 - Santa Catarina",
      "coordinates": [25.6746041, -100.4445887],
      "performance": 93.44,
      "grupo": "TEPEYAC",
      "estado": "Nuevo León",
      "municipio": "Santa Catarina", 
      "evaluaciones": 6135,
      "status": "excellent",
      "intensity": 0.93
    }
  ],
  "metadata": {
    "totalLocations": 8,
    "groupFilter": "OGAS",
    "avgPerformance": "98.31"
  }
}
```

**Status**: ✅ **TESTED & WORKING** - Ready for mapping libraries (Leaflet, Google Maps)

---

### 4. **GET** `/api/performance-areas/:groupId?`  
**Purpose**: Performance analysis by evaluation areas

**Parameters**:
- `groupId` (optional): Filter by specific group or 'all'

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "area": "ALMACEN QUÍMICOS",
      "promedio": 100.0,
      "evaluaciones": 7470,
      "sucursales": 45,
      "rango": {
        "min": 100.0,
        "max": 100.0
      }
    }
  ]
}
```

**Status**: ✅ **TESTED & WORKING** - Returns top 20 performance areas

---

## 🗄️ Database Integration

### Data Source: `supervision_operativa_clean` (Neon PostgreSQL)
- **Total Records**: 630K+ evaluations
- **Time Range**: 2025 data (Q1-Q3)
- **Geographic Coverage**: 6+ states, 25+ municipalities  
- **Groups**: 20 operational groups with clean mapping
- **Areas**: 40+ evaluation areas

### Database Connection
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

---

## 🎨 Frontend Integration

### Dashboard Features Connected:
- ✅ **Circular Slider**: Real operational groups with EPL colors
- ✅ **Historical Charts**: Chart.js with spanGaps for null handling
- ✅ **Group Filtering**: Dynamic data loading per group selection
- ✅ **Performance Metrics**: Live calculation from database
- ✅ **Error Handling**: Graceful fallbacks and user notifications

### Key JavaScript Functions:
```javascript
// Load real data on initialization
app.loadRealData()

// Dynamic group data loading  
app.loadGroupData(groupId)

// Real-time chart updates
app.updateHistoricalChart()

// Live slider rendering
app.renderGroupSlider()
```

---

## ⚡ Performance & Reliability

### Database Performance:
- **Response Time**: <200ms average
- **Concurrent Queries**: Parallel API calls supported
- **Data Freshness**: Real-time from active supervision operations

### Error Handling:
- **Database Unavailable**: Fallback to static data with user notification
- **API Timeouts**: 5-second error messages with auto-hide
- **Invalid Groups**: Graceful 404 handling with fallback to 'all'

### Caching Strategy:
- **Client-Side**: Browser caching for static assets
- **Database**: Neon's built-in query optimization
- **API**: No server-side caching (real-time data priority)

---

## 🔒 Security & Compliance

### Data Protection:
- **SSL/TLS**: Enforced for database connections
- **Input Validation**: SQL injection protection via parameterized queries
- **CORS**: Configured for dashboard domain
- **Rate Limiting**: Neon's built-in protection

### Environment Variables:
```bash
DATABASE_URL=postgresql://neondb_owner:***@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
USE_CLEAN_VIEW=true
PORT=3000
```

---

## 🚀 Deployment Status

### Production Server: 
- **URL**: https://pollo-loco-supervision.onrender.com
- **Status**: ✅ LIVE & OPERATIONAL
- **Dashboard**: https://pollo-loco-supervision.onrender.com/historico-v2.html

### Local Development:
- **Server**: `node server-integrated.js` (Port 3000)
- **Dashboard**: http://localhost:3000/historico-v2.html
- **API Testing**: All endpoints tested and functional

---

## ✅ Project Completion Checklist

- [x] **Database Connection**: Live Neon PostgreSQL integration
- [x] **API Development**: 4 robust endpoints with error handling  
- [x] **Frontend Integration**: Dynamic data loading and visualization
- [x] **Performance Testing**: Sub-200ms response times verified
- [x] **Error Handling**: Graceful fallbacks and user notifications
- [x] **Production Deployment**: Live on Render with HTTPS
- [x] **Documentation**: Complete API specification
- [x] **Data Validation**: 630K+ records with geographic coordinates
- [x] **Visual Integration**: EPL branding colors and professional design

---

## 📞 Support & Maintenance

### Monitoring:
- Database health via Neon dashboard
- Server metrics via Render monitoring  
- Error logging via console and browser dev tools

### Future Enhancements:
- Real-time WebSocket updates
- Advanced heatmap visualization
- Performance benchmarking dashboard
- Automated data quality monitoring

**PROJECT STATUS: 🎯 COMPLETE & PRODUCTION READY**

All APIs are connected to live Neon PostgreSQL database with double-checked functionality. The dashboard is fully operational with real-time data from 80+ Pollo Loco locations.