# 🔐 PLAN DE AUTENTICACIÓN PROFESIONAL - EL POLLO LOCO CAS
## Implementación Mañana - Entregable Dashboard Seguro

### 📋 **ANÁLISIS DE SITUACIÓN ACTUAL**

**Assets Existentes**:
✅ **Telegram Bot**: @EPLEstandarizacionBot ya configurado  
✅ **Dashboard Completo**: Funcionando en Render  
✅ **Base de Datos Zenput**: Correos y contraseñas de directores/gerentes  
✅ **Infraestructura**: PostgreSQL + Render deployment ready  

**Necesidad Crítica**: 
🚨 **Proteger datos sensibles** solo para Directores Operativos autorizados

---

## 🎯 **ESTRATEGIA DE AUTENTICACIÓN RECOMENDADA**

### **OPCIÓN 1: TELEGRAM LOGIN INTEGRATION** (⭐ RECOMENDADA)
**Ventajas**:
- ✅ Integración nativa con bot existente
- ✅ OAuth seguro sin manejar passwords
- ✅ 2FA automático via Telegram 
- ✅ Lista blanca de Telegram IDs
- ✅ Implementación 4-6 horas

### **OPCIÓN 2: EMAIL + TOKEN SYSTEM** (Alternativa)
**Ventajas**:
- ✅ Usa base Zenput existente
- ✅ Tokens JWT temporales
- ✅ Control granular de permisos
- ✅ Audit log completo

---

## ⚡ **PLAN IMPLEMENTACIÓN MAÑANA**

### **FASE 1: PREPARACIÓN (8:00-9:00 AM)** 
```bash
# 1. Crear tabla de usuarios autorizados
CREATE TABLE authorized_users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    position VARCHAR(100), -- 'Director', 'Gerente'
    grupo_operativo VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_access TIMESTAMP
);

# 2. Poblar con datos Zenput existentes
INSERT INTO authorized_users (email, full_name, position, grupo_operativo) 
VALUES 
-- Aquí insertarías los datos de tu lista Zenput
('director1@eplmexico.com', 'Juan Pérez', 'Director', 'OGAS'),
-- ... resto de directores
;
```

### **FASE 2: SISTEMA AUTENTICACIÓN (9:00-11:00 AM)**

#### **A) Telegram Authentication Flow**
```javascript
// telegram-bot/auth-system.js
class TelegramAuth {
    async verifyUser(telegramId) {
        const user = await pool.query(
            'SELECT * FROM authorized_users WHERE telegram_id = $1 AND active = true',
            [telegramId]
        );
        return user.rows[0];
    }

    async linkTelegramAccount(telegramId, email) {
        // Vincular cuenta Telegram con email Zenput
        await pool.query(
            'UPDATE authorized_users SET telegram_id = $1 WHERE email = $2',
            [telegramId, email]
        );
    }

    async generateAccessToken(userId) {
        const token = jwt.sign(
            { userId, authorized: true },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        return token;
    }
}
```

#### **B) Dashboard Protection Middleware**
```javascript
// dashboard-auth-middleware.js
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.query.token ||
                  req.cookies.auth_token;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// Aplicar a rutas sensibles
app.get('/dashboard-ios-ORIGINAL-RESTORED.html', requireAuth);
app.get('/api/*', requireAuth);
```

### **FASE 3: INTEGRACIÓN BOT (11:00-12:00 PM)**

#### **Bot Command: /login**
```javascript
bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    // Verificar si ya está autorizado
    const user = await auth.verifyUser(telegramId);
    if (user) {
        const token = await auth.generateAccessToken(user.id);
        const dashboardUrl = `https://pollo-loco-supervision.onrender.com/dashboard?token=${token}`;
        
        bot.sendMessage(chatId, 
            `✅ Acceso autorizado!\n\n📊 [Abrir Dashboard](${dashboardUrl})`,
            { parse_mode: 'Markdown' }
        );
        return;
    }

    // Proceso de vinculación
    bot.sendMessage(chatId, 
        `🔐 Para acceder al dashboard, necesitas vincular tu cuenta.\n\n` +
        `📧 Envía tu email corporativo registrado en Zenput:`
    );
    
    // Aguardar email
    userStates[chatId] = 'awaiting_email';
});

// Manejar respuesta de email
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const state = userStates[chatId];
    
    if (state === 'awaiting_email') {
        const email = msg.text.trim();
        
        // Verificar email en base autorizada
        const authorized = await checkEmailAuthorized(email);
        if (authorized) {
            await auth.linkTelegramAccount(msg.from.id, email);
            delete userStates[chatId];
            
            bot.sendMessage(chatId, 
                `✅ Cuenta vinculada exitosamente!\n\n` +
                `Usa /dashboard para acceder al sistema.`
            );
        } else {
            bot.sendMessage(chatId, 
                `❌ Email no autorizado.\n\n` +
                `Contacta al administrador del sistema.`
            );
            delete userStates[chatId];
        }
    }
});
```

### **FASE 4: SEGURIDAD AVANZADA (12:00-1:00 PM)**

#### **Audit Log System**
```javascript
// audit-logger.js
async function logAccess(userId, action, details = {}) {
    await pool.query(
        `INSERT INTO access_logs 
         (user_id, action, ip_address, user_agent, details, timestamp)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, action, details.ip, details.userAgent, JSON.stringify(details)]
    );
}

// Uso en middleware
function auditMiddleware(req, res, next) {
    res.on('finish', () => {
        if (req.user) {
            logAccess(req.user.userId, 'dashboard_access', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.path,
                method: req.method,
                statusCode: res.statusCode
            });
        }
    });
    next();
}
```

#### **Rate Limiting & Security**
```javascript
const rateLimit = require('express-rate-limit');

// Rate limiting para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 intentos por IP
    message: { error: 'Demasiados intentos de login' }
});

// Rate limiting para API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per 15 minutes
    message: { error: 'Límite de requests excedido' }
});

app.use('/login', loginLimiter);
app.use('/api', apiLimiter);
```

---

## 🛡️ **CONFIGURACIÓN NIVELES DE ACCESO**

### **ROLES Y PERMISOS**

```javascript
const ROLES = {
    DIRECTOR: {
        canView: ['dashboard', 'all-groups', 'historical-data'],
        canExport: true,
        canViewSensitive: true
    },
    GERENTE: {
        canView: ['dashboard', 'own-group', 'limited-historical'],
        canExport: false,
        canViewSensitive: false
    },
    SUPERVISOR: {
        canView: ['dashboard', 'own-branches'],
        canExport: false,
        canViewSensitive: false
    }
};

// Middleware de autorización por rol
function requireRole(allowedRoles) {
    return async (req, res, next) => {
        const user = await getUserById(req.user.userId);
        if (allowedRoles.includes(user.position)) {
            next();
        } else {
            res.status(403).json({ error: 'Acceso denegado' });
        }
    };
}

// Uso en rutas
app.get('/api/sensitive-data', requireAuth, requireRole(['Director']), (req, res) => {
    // Solo directores pueden acceder
});
```

---

## 📱 **IMPLEMENTACIÓN EN TELEGRAM**

### **Menu Button Seguro**
```javascript
// Actualizar menu button con autenticación
await bot.setChatMenuButton({
    chat_id: chatId,
    menu_button: {
        type: 'web_app',
        text: '📊 Dashboard Seguro',
        web_app: {
            url: `https://pollo-loco-supervision.onrender.com/secure-dashboard?telegram_id=${telegramId}`
        }
    }
});
```

### **Commands Adicionales**
```javascript
// /whoami - Verificar status
bot.onText(/\/whoami/, async (msg) => {
    const user = await auth.verifyUser(msg.from.id);
    if (user) {
        bot.sendMessage(msg.chat.id, 
            `👤 **Tu información:**\n\n` +
            `📧 ${user.email}\n` +
            `👔 ${user.position}\n` +
            `🏢 ${user.grupo_operativo}\n` +
            `📅 Último acceso: ${user.last_access}`,
            { parse_mode: 'Markdown' }
        );
    } else {
        bot.sendMessage(msg.chat.id, '❌ No tienes acceso autorizado');
    }
});

// /logout - Revocar acceso
bot.onText(/\/logout/, async (msg) => {
    await revokeUserTokens(msg.from.id);
    bot.sendMessage(msg.chat.id, '🔓 Has cerrado sesión exitosamente');
});
```

---

## 🚀 **CRONOGRAMA DE IMPLEMENTACIÓN**

### **DÍA 1 (MAÑANA) - CORE SECURITY**
- **8:00-9:00**: Setup base datos usuarios autorizados
- **9:00-11:00**: Sistema autenticación Telegram 
- **11:00-12:00**: Integración bot + middleware
- **12:00-1:00**: Testing y audit logs
- **2:00-3:00**: Deploy a producción
- **3:00-4:00**: Testing con usuarios reales

### **ENTREGABLE MAÑANA**:
✅ Dashboard protegido con login Telegram  
✅ Solo directores autorizados pueden acceder  
✅ Audit logs de todos los accesos  
✅ Rate limiting y protecciones  
✅ Menu button seguro en bot  

---

## 💡 **VENTAJAS DE ESTA SOLUCIÓN**

### **SEGURIDAD**
- 🔐 2FA nativo via Telegram
- 📱 No passwords que hackear
- 🕵️ Audit trail completo
- ⚡ Tokens JWT con expiración

### **UX/UI**  
- 🚀 Un-click access desde Telegram
- 📊 Dashboard embebido en WebApp
- 🔄 Auto-login seamless
- 📱 Mobile-first design

### **ADMINISTRACIÓN**
- 👥 Control granular de usuarios
- 📈 Analytics de uso
- 🚨 Alertas de accesos sospechosos
- 💼 Gestión de roles empresariales

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **DATOS ZENPUT**
```sql
-- Migración segura de datos Zenput
-- Nunca almacenar passwords en plaintext
-- Solo emails y roles para whitelist
INSERT INTO authorized_users (email, full_name, position, grupo_operativo) 
SELECT email, nombre, cargo, grupo 
FROM zenput_users 
WHERE cargo IN ('Director', 'Gerente Operativo');
```

### **BACKUP PLAN**
- 🔑 Admin token de emergencia
- 📧 Recovery via email backup
- 🆔 Telegram ID whitelist manual
- 📞 Soporte telefónico para urgencias

---

## 🎯 **RESULTADO FINAL**

**Dashboard Profesional Seguro**:
- ✅ Acceso solo para personal autorizado
- ✅ Integración perfecta con Telegram
- ✅ Audit trail empresarial completo
- ✅ Escalable para futuras funcionalidades
- ✅ Compliance con mejores prácticas de seguridad

**¿Aprobado para implementar mañana?** 🚀

---

## 📞 **SIGUIENTE PASO INMEDIATO**

**Necesito de ti**:
1. 📋 Lista de emails Zenput (Excel/CSV)
2. 🏢 Confirmación de roles (Director/Gerente/Supervisor)
3. 👥 Telegram usernames si los conoces
4. ✅ Aprobación para proceder

**Tiempo estimado**: 6 horas implementación completa
**Entregable**: Dashboard seguro funcionando mañana por la tarde