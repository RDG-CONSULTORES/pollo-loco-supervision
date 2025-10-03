# 🍗 El Pollo Loco CAS - Sistema de Supervisión Operativa

Sistema completo de supervisión operativa para El Pollo Loco CAS con Telegram Bot, Mini Web App con 5 diseños y AI Agent integrado.

## 📊 Características

- **🎨 5 Diseños Únicos**: Corporativo, Minimalista, Dark Mode, Moderno y Clásico El Pollo Loco
- **🤖 AI Agent**: Consultas en lenguaje natural integrado en el bot
- **📱 Mini Web App**: Galería de diseños accesible desde Telegram
- **📊 29+ Indicadores** de supervisión operativa
- **🔄 Tiempo Real**: Datos actualizados desde Neon PostgreSQL
- **🗺️ Mapas Interactivos** con GeoJSON y HeatMaps
- **⚡ Deployment Automático** en Render
- **🚀 Bot de Telegram**: @EPLEstandarizacionBot

## 🏗️ Arquitectura

```
pollo-loco-supervision/
├── backend/                    # API Node.js + Express
├── frontend/                   # Dashboard React + TypeScript  
├── telegram-bot/               # Bot con AI Agent
├── design-showcase.html        # Galería de diseños
├── design-variant-*.html       # 5 variantes de diseño
├── server.js                   # Servidor principal
├── render.yaml                 # Configuración de deployment
├── .env.template              # Template de variables
└── README.md                  # Documentación
```

## 🎨 Diseños Disponibles

1. **🏢 Corporativo Elegante** - Azul/púrpura profesional
2. **✨ Minimalista Claro** - Blanco limpio con acentos azules  
3. **🌙 Modo Oscuro Premium** - Tema oscuro con acentos neón
4. **🚀 Moderno Vibrante** - Gradientes multicolor futuristas
5. **🍗 Clásico El Pollo Loco** - Colores corporativos suaves

## 🚀 Deployment en Render

### 1. Configurar Variables de Entorno

En Render, configurar las siguientes variables:

```env
TELEGRAM_BOT_TOKEN=8341799056:AAFvMMPzuplDDsOM07m5ANI5WVCATchBPeY
DATABASE_URL=postgresql://neondb_owner:password@host/database
NODE_ENV=production
PORT=3000
START_BOT=true
RENDER_EXTERNAL_URL=https://your-app-name.onrender.com
```

### 2. Deploy Automático

```bash
# En Render:
# 1. Conectar repositorio Git
# 2. Build Command: npm run install-deps && npm run build
# 3. Start Command: npm start
# 4. El deploy se ejecuta automáticamente
```

## 🛠️ Desarrollo Local

### Instalación Rápida

```bash
# Instalar todas las dependencias
npm run install-deps

# Configurar variables de entorno
cp .env.template .env
# Editar .env con tus credenciales

# Desarrollo (servidor + bot)
npm run dev

# Solo servidor
npm run server

# Solo bot
npm run bot
```

## 📊 Base de Datos

### Estructura Long Format

La tabla principal `supervision_operativa_detalle` contiene:

- **561,868 registros** en formato Long
- **135 supervisiones** únicas
- **79 sucursales** evaluadas

## 📊 Sistema de Reportes
- Reportes HTML profesionales optimizados para Render
- Generación de PDFs desde el navegador (sin Puppeteer)
- Filtros por grupo operativo y período
- Deploy optimizado para contenedores Linux
- **40 indicadores** diferentes
- **3 trimestres** (Q1, Q2, Q3 2025)

### Campos Clave

```sql
- submission_id: Identificador único de supervisión
- location_name: Nombre de la sucursal
- grupo_operativo: Grupo operativo (OGAS, TEC, TEPEYAC, etc.)
- estado: Estado de la República
- area_evaluacion: Indicador/área evaluada
- porcentaje: Calificación obtenida (0-100)
- fecha_supervision: Fecha de la evaluación
- latitud/longitud: Coordenadas geográficas
```

## 🤖 Bot de Telegram: @EPLEstandarizacionBot

### 🧠 AI Agent Integrado

El bot incluye un agente de IA que responde preguntas en lenguaje natural:

- **"¿Cuál es el promedio general?"**
- **"¿Qué sucursales tienen problemas?"**
- **"Muéstrame los mejores grupos"**
- **"¿Cuáles son las áreas críticas?"**

### Comandos Disponibles

```
/start - Menú principal con AI Agent
/kpis - Indicadores principales
/grupos [NOMBRE] - Análisis por grupo operativo
/estados [NOMBRE] - Análisis por estado
/criticas [UMBRAL] - Indicadores críticos (<70%)
/top10 - Mejores 10 sucursales
/help - Ayuda completa del AI Agent
```

### 🎨 Mini Web App

- **Galería de diseños**: Elige entre 5 diseños diferentes
- **Dashboard completo**: Acceso directo desde el bot
- **Responsive**: Optimizado para móviles
- **Tiempo real**: Datos actualizados automáticamente

## 📈 KPIs y Métricas

### KPIs Principales

- **Promedio General**: 89.54%
- **Total Supervisiones**: 135
- **Total Sucursales**: 79
- **Estados Cubiertos**: 9

### Top Grupos Operativos

1. **OGAS**: 97.55% (16 evaluaciones)
2. **PLOG QUERETARO**: 96.97% (4 evaluaciones)
3. **EPL SO**: 94.37% (2 evaluaciones)

### Áreas Críticas

1. **FREIDORAS**: 70.10%
2. **EXTERIOR SUCURSAL**: 71.36%
3. **FREIDORA DE PAPA**: 71.42%

## 🗺️ Visualizaciones

### Mapas Interactivos

- **Leaflet** con datos GeoJSON
- **HeatMap** de performance por ubicación
- **Marcadores** coloreados por status (success/warning/danger)

### Gráficos y Charts

- **Bar Charts** para grupos operativos
- **Line Charts** para tendencias temporales
- **KPI Cards** con animaciones glassmorphism

## 🔧 API Endpoints

### Base URL: `http://localhost:3001/api`

```javascript
// KPIs
GET /kpis - KPIs principales
GET /kpis/quarters - Trimestres disponibles
GET /kpis/trends - Tendencias por trimestre
GET /kpis/critical - Indicadores críticos

// Grupos Operativos
GET /grupos - Datos por grupo
GET /grupos/ranking - Top/Bottom sucursales

// Estados
GET /estados - Datos por estado

// Indicadores
GET /indicadores - Lista de indicadores

// Mapas
GET /map/data - Datos GeoJSON
GET /map/heatmap - Datos para HeatMap

// Supervisiones
GET /supervisions - Lista de supervisiones
GET /supervisions/:id - Detalle de supervisión
```

### Filtros Disponibles

Todos los endpoints soportan filtros por:
- `grupo`: Grupo operativo
- `estado`: Estado
- `trimestre`: Trimestre (Q1 2025, Q2 2025, Q3 2025)

## 🎨 Diseño y UX

### Glassmorphism Design

- **Fondos translúcidos** con backdrop-blur
- **Gradientes modernos** en tema El Pollo Loco
- **Animaciones suaves** con Tailwind CSS
- **Responsive design** mobile-first

### Colores Principales

```css
--primary: #E53E3E (Rojo El Pollo Loco)
--secondary: #F6E05E (Amarillo)
--success: #10B981 (Verde)
--warning: #F59E0B (Naranja)
--danger: #EF4444 (Rojo intenso)
```

## 🔐 Configuración

### Variables de Entorno

**Backend (.env)**
```
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=3001
NODE_ENV=development
```

**Telegram Bot (.env)**
```
BOT_TOKEN=your_telegram_bot_token
API_BASE_URL=http://localhost:3001/api
WEBAPP_URL=http://localhost:3000
```

## 📱 Despliegue

### Render (Backend)
```bash
# Conectar repo GitHub
# Auto-deploy configurado
# Variables de entorno en Render Dashboard
```

### Vercel (Frontend)
```bash
vercel --prod
# Variables de entorno:
# REACT_APP_API_URL=https://your-api.render.com/api
```

### Telegram Bot (Render/Railway)
```bash
# Mantener bot 24/7 con keep-alive
# Webhook opcional para mejor performance
```

## 🧪 Testing

```bash
# Backend
npm test

# Frontend
npm test

# API Testing
curl http://localhost:3001/health
```

## 📊 Performance

- **Backend**: Sub-200ms response time
- **Frontend**: <3s carga inicial
- **Bot**: <1s respuesta promedio
- **Database**: Query optimization para Long Format

## 🤝 Contribución

1. Fork el repositorio
2. Crear feature branch
3. Commit cambios
4. Push a la branch
5. Crear Pull Request

## 📄 Licencia

MIT License - El Pollo Loco CAS © 2025

---

**Dashboard desarrollado para El Pollo Loco CAS**  
Supervisión Operativa en Tiempo Real  
🍗 Calidad | Eficiencia | ExcelenciaDeploy trigger: Thu Oct  2 21:40:00 CST 2025
