# El Pollo Loco - Dashboard Operativo Interactivo

## 🚀 Descripción

Dashboard web interactivo para visualización y análisis de datos operativos de El Pollo Loco. Integrado con base de datos real de `supervision_operativa_clean` y optimizado como Telegram Mini App.

## ✨ Características

### 📊 **Visualización de Datos**
- **KPIs en Tiempo Real**: Performance general, sucursales evaluadas, grupos activos
- **Mapas Interactivos**: 82 sucursales con coordenadas reales
- **Gráficos Dinámicos**: Rankings, áreas de oportunidad, tendencias trimestrales
- **Filtros Inteligentes**: Por grupo operativo, estado, trimestre

### 📱 **Telegram Mini App**
- **Integración Nativa**: Botones desde el bot Ana
- **Haptic Feedback**: Retroalimentación táctil en iOS/Android
- **Tema Adaptativo**: Se adapta al tema oscuro/claro de Telegram
- **Optimizado para Móvil**: Interfaz touch-friendly

### 🗺️ **Mapas con Coordenadas Reales**
- **82 Sucursales Mapeadas**: Todas con lat/lng precisas
- **Marcadores Coloridos**: Por nivel de performance
- **Info Windows**: Detalles completos al hacer click
- **Filtros Geográficos**: Por estado y municipio

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js + Express
- **Base de Datos**: PostgreSQL (Neon Cloud)
- **Mapas**: Google Maps API / Mapbox GL
- **Gráficos**: Chart.js
- **Deployment**: Render (auto-deploy)

## 🔧 Instalación Local

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd telegram-bot/web-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Iniciar servidor
npm run dev  # Desarrollo
npm start    # Producción
```

## 🌐 Deploy en Render

### Automático (Recomendado)

1. **Fork este repositorio**
2. **Conectar con Render**: Dashboard → New Web Service
3. **Configurar**:
   - Repository: `tu-usuario/pollo-loco-supervision`
   - Branch: `main`
   - Root Directory: `telegram-bot/web-app`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Variables de Entorno en Render**:
   ```
   NODE_ENV=production
   DATABASE_URL=tu_neon_database_url
   NEON_DATABASE_URL=tu_neon_database_url
   GOOGLE_MAPS_API_KEY=tu_google_maps_key (opcional)
   ```

### Manual

```bash
# Render CLI deployment
render-cli deploy --service-id your-service-id
```

## 🔗 URLs de Producción

- **Dashboard Principal**: `https://pollo-loco-dashboard.render.com/`
- **Health Check**: `https://pollo-loco-dashboard.render.com/health`
- **API Endpoints**: `https://pollo-loco-dashboard.render.com/api/`

## 📱 Integración con Telegram Bot

### Configuración en Ana

```javascript
// En ana-intelligent.js
const WebAppIntegration = require('./web-app-integration');
const webAppIntegration = new WebAppIntegration(bot, pool);

// Mostrar dashboard contextual
await webAppIntegration.respondGroupAnalysis(chatId, 'TEPEYAC');
```

### Botones Dinámicos

Ana puede mostrar botones contextuales que abren el dashboard filtrado:

- **Análisis General**: Dashboard completo
- **Grupo Específico**: Filtrado por grupo operativo
- **Vista Geográfica**: Mapa de sucursales
- **Tendencias**: Análisis temporal

## 📊 Estructura de APIs

### Endpoints Principales

```
GET /api/locations              # Sucursales con coordenadas
GET /api/performance/overview   # KPIs generales
GET /api/performance/groups     # Performance por grupo
GET /api/performance/areas      # Áreas de evaluación
GET /api/performance/trends     # Tendencias trimestrales
```

### Filtros Disponibles

```
GET /api/filters/states    # Estados disponibles
GET /api/filters/groups    # Grupos operativos
GET /api/filters/areas     # Áreas de evaluación
```

### Parámetros de Query

- `grupo`: Filtrar por grupo operativo
- `estado`: Filtrar por estado
- `trimestre`: Filtrar por trimestre (1, 2, 3)

## 🗺️ Configuración de Mapas

### Google Maps (Recomendado)

1. **Obtener API Key**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Habilitar APIs**: Maps JavaScript API, Places API
3. **Configurar en `.env`**: `GOOGLE_MAPS_API_KEY=tu_key`
4. **Descomentar en HTML**: Línea del script de Google Maps

### Mapbox (Alternativa)

1. **Obtener Token**: [Mapbox](https://account.mapbox.com/)
2. **Configurar**: `MAPBOX_TOKEN=tu_token`
3. **Modificar app.js**: Cambiar a Mapbox GL

## 📈 Performance y Optimización

### Métricas de Rendimiento

- **Tiempo de Carga**: < 3 segundos
- **Bundle Size**: < 2MB total
- **Mobile Performance**: Optimizado touch
- **Database Queries**: Indexadas y cacheadas

### Optimizaciones Implementadas

- **Lazy Loading**: Gráficos solo en tabs activos
- **Data Caching**: Cache de 5 minutos en frontend
- **SQL Optimized**: Queries con índices apropiados
- **Mobile-First**: Responsive design

## 🔒 Seguridad

- **CORS**: Configurado para Telegram
- **SQL Injection**: Consultas parametrizadas
- **Rate Limiting**: Próxima implementación
- **HTTPS**: Forzado en producción

## 🧪 Testing

```bash
# Health check
curl https://pollo-loco-dashboard.render.com/health

# API test
curl https://pollo-loco-dashboard.render.com/api/performance/overview

# Local testing
npm test  # (próximamente)
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de Base de Datos**
   - Verificar `DATABASE_URL` en variables de entorno
   - Confirmar conectividad SSL con Neon

2. **Mapas No Cargan**
   - Verificar `GOOGLE_MAPS_API_KEY`
   - Revisar cuotas en Google Cloud Console

3. **Telegram Integration Falla**
   - Confirmar `WEBAPP_URL` correcto
   - Verificar certificado SSL válido

### Logs de Debug

```bash
# Render logs
render logs --service-id your-service-id

# Local logs
DEBUG=* npm start
```

## 📧 Soporte

Para soporte técnico:
- **Issues**: GitHub Issues del proyecto
- **Email**: tu-email@dominio.com
- **Documentación**: [Wiki del proyecto]

## 🔄 Roadmap

- [ ] Autenticación de usuarios
- [ ] Exportar reportes PDF
- [ ] Alertas en tiempo real
- [ ] Dashboard customizable
- [ ] API pública documentada

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2025  
**Estado**: ✅ Producción