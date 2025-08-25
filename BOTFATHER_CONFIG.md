# 🤖 Configuración BotFather para @EPLEstandarizacionBot

## 1. Comandos del Bot

Usar `/setcommands` con @BotFather y copiar este texto:

```
kpis - Ver indicadores principales del sistema
grupos - Análisis detallado por grupo operativo
estados - Análisis por estado de la República
criticas - Mostrar indicadores críticos (<70%)
top10 - Ranking de las mejores 10 sucursales
help - Guía completa del AI Agent y comandos
```

## 2. Descripción del Bot

Usar `/setdescription`:

```
🍗 EPL Estandarización Operativa

Sistema inteligente de supervisión operativa para El Pollo Loco CAS.

✨ Características:
• AI Agent para consultas en lenguaje natural
• Dashboard con 5 diseños únicos
• Análisis de 135 supervisiones y 79 sucursales
• Datos en tiempo real desde Neon PostgreSQL

🤖 Solo pregúntame lo que necesites saber sobre las supervisiones.
```

## 3. Descripción Corta

Usar `/setabouttext`:

```
🍗 Sistema de Supervisión Operativa El Pollo Loco CAS con AI Agent integrado.

🎯 Análisis inteligente de 135 supervisiones en 79 sucursales.
📊 Dashboard interactivo con 5 diseños únicos.
🤖 Pregúntame cualquier cosa sobre los datos.
```

## 4. Foto de Perfil

Subir una imagen relacionada con El Pollo Loco CAS (logo, imagen corporativa).

## 5. Configurar Menu Button

Usar `/setmenubutton`:

**Text**: `🎨 Dashboard`
**URL**: `https://pollo-loco-supervision.onrender.com`

## 6. Configurar Domain

Usar `/setdomain`:

```
pollo-loco-supervision.onrender.com
```

## 7. Configuraciones Adicionales

### Privacidad
Usar `/setprivacy`:
```
Disabled
```
(Para permitir que el bot lea todos los mensajes y funcione como AI Agent)

### Join Groups
Usar `/setjoingroups`:
```
Disabled
```
(Bot para uso individual, no grupos)

### Inline Mode (Opcional)
Usar `/setinline`:
```
Buscar datos de supervisión...
```

## 8. Webhook (Para Producción)

```bash
# Configurar webhook después del deployment
curl -X POST "https://api.telegram.org/bot8341799056:AAFvMMPzuplDDsOM07m5ANI5WVCATchBPeY/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://pollo-loco-supervision.onrender.com/webhook"}'
```

## 9. Verificar Configuración

Usar `/mybots` → Seleccionar bot → `Bot Settings` para revisar toda la configuración.

## 10. Testing

1. Buscar `@EPLEstandarizacionBot` en Telegram
2. Enviar `/start`
3. Probar AI Agent con: "¿Cuál es el promedio general?"
4. Probar Mini Web App desde el botón del menú
5. Verificar que todos los comandos funcionen correctamente

## URL del Bot

https://t.me/EPLEstandarizacionBot

---

**Token**: `8341799056:AAFvMMPzuplDDsOM07m5ANI5WVCATchBPeY` 
(Mantener seguro, solo para desarrollo)