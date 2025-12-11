# 🤖 Configuración BotFather para @EPLEstandarizacionBot

## 1. Comandos del Bot

Usar `/setcommands` con @BotFather y copiar este texto:

```
start - Iniciar el bot
login - Autenticarse y obtener acceso al dashboard  
dashboard - Ver dashboard (requiere login)
whoami - Ver información de usuario
logout - Cerrar sesión
```

## 2. Descripción del Bot

Usar `/setdescription`:

```
🍗 Dashboard El Pollo Loco CAS - Sistema Seguro

Sistema de supervisión operativa con autenticación corporativa.

🔐 Características:
• 79 sucursales monitoreadas
• 135 supervisiones analizadas 
• Mapas interactivos en tiempo real
• KPIs y métricas operativas
• Acceso restringido a personal autorizado

🔑 Usa /login para acceder al dashboard seguro.
```

## 3. Descripción Corta

Usar `/setabouttext`:

```
🍗 Dashboard El Pollo Loco CAS - Sistema seguro de supervisión operativa. Acceso restringido a personal autorizado. Usa /login para acceder.
```

## 4. Foto de Perfil

Subir una imagen relacionada con El Pollo Loco CAS (logo, imagen corporativa).

## 5. Configurar Menu Button

Usar `/setmenubutton`:

**Text**: `📊 Dashboard`
**URL**: `https://pollo-loco-supervision.onrender.com/dashboard-ios-complete`

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