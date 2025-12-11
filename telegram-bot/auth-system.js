// 🔐 SISTEMA DE AUTENTICACIÓN EL POLLO LOCO CAS
// Sistema simplificado: Acceso completo para todos los usuarios autorizados

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const crypto = require('crypto');

// Database connection - usar misma configuración que bot.js
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class TelegramAuth {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || 'epl-cas-dashboard-secret-2025';
        this.TOKEN_EXPIRY = '24h'; // 24 horas de sesión
    }

    /**
     * Verificar si el usuario está autorizado por Telegram ID
     */
    async verifyUser(telegramId) {
        try {
            const result = await pool.query(
                'SELECT * FROM authorized_users WHERE telegram_id = $1 AND active = true',
                [telegramId]
            );
            
            if (result.rows.length > 0) {
                // Actualizar último acceso
                await this.updateLastAccess(result.rows[0].id);
                return result.rows[0];
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error verifying user:', error);
            return null;
        }
    }

    /**
     * Verificar si un email está en la lista autorizada
     */
    async checkEmailAuthorized(email) {
        try {
            const result = await pool.query(
                'SELECT * FROM authorized_users WHERE email = $1 AND active = true',
                [email.toLowerCase()]
            );
            
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('❌ Error checking email:', error);
            return null;
        }
    }

    /**
     * Vincular cuenta de Telegram con email
     */
    async linkTelegramAccount(telegramId, email, telegramData = {}) {
        try {
            const result = await pool.query(
                `UPDATE authorized_users 
                 SET telegram_id = $1, last_access = NOW()
                 WHERE email = $2 AND active = true
                 RETURNING *`,
                [telegramId, email.toLowerCase()]
            );

            if (result.rows.length > 0) {
                // Log successful linking
                await this.logAccess(result.rows[0].id, 'account_linked', {
                    telegram_username: telegramData.username || null,
                    first_name: telegramData.first_name || null,
                    last_name: telegramData.last_name || null
                });

                return result.rows[0];
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error linking account:', error);
            return null;
        }
    }

    /**
     * Generar token de acceso JWT
     */
    async generateAccessToken(user) {
        try {
            const payload = {
                userId: user.id,
                email: user.email,
                fullName: user.full_name,
                position: user.position,
                grupoOperativo: user.grupo_operativo,
                authorized: true,
                // Según directiva: acceso completo para todos
                permissions: {
                    canViewDashboard: true,
                    canViewHistorical: true,
                    canViewAllGroups: true,
                    canExport: true,
                    canViewSensitive: true // Acceso completo por orden del director general
                },
                iat: Math.floor(Date.now() / 1000)
            };

            const token = jwt.sign(payload, this.JWT_SECRET, { 
                expiresIn: this.TOKEN_EXPIRY,
                issuer: 'epl-cas-dashboard',
                audience: 'epl-users'
            });

            // Opcional: Guardar hash del token para revocación
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            await pool.query(
                `INSERT INTO active_tokens (user_id, token_hash, expires_at) 
                 VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
                [user.id, tokenHash]
            );

            // Log token generation
            await this.logAccess(user.id, 'token_generated', {
                expires_in: this.TOKEN_EXPIRY,
                permissions: payload.permissions
            });

            return token;
        } catch (error) {
            console.error('❌ Error generating token:', error);
            return null;
        }
    }

    /**
     * Verificar token JWT
     */
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET, {
                issuer: 'epl-cas-dashboard',
                audience: 'epl-users'
            });

            // Verificar que el usuario siga activo
            const user = await pool.query(
                'SELECT * FROM authorized_users WHERE id = $1 AND active = true',
                [decoded.userId]
            );

            if (user.rows.length === 0) {
                throw new Error('User no longer active');
            }

            return decoded;
        } catch (error) {
            console.error('❌ Error verifying token:', error);
            return null;
        }
    }

    /**
     * Revocar todos los tokens de un usuario
     */
    async revokeUserTokens(userId) {
        try {
            await pool.query(
                'UPDATE active_tokens SET revoked = true WHERE user_id = $1',
                [userId]
            );

            await this.logAccess(userId, 'tokens_revoked', {
                revoked_at: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('❌ Error revoking tokens:', error);
            return false;
        }
    }

    /**
     * Limpiar tokens expirados
     */
    async cleanupExpiredTokens() {
        try {
            const result = await pool.query(
                'DELETE FROM active_tokens WHERE expires_at < NOW() OR revoked = true RETURNING COUNT(*)'
            );
            
            console.log(`🧹 Cleaned up ${result.rowCount || 0} expired tokens`);
            return result.rowCount || 0;
        } catch (error) {
            console.error('❌ Error cleaning up tokens:', error);
            return 0;
        }
    }

    /**
     * Actualizar último acceso
     */
    async updateLastAccess(userId) {
        try {
            await pool.query(
                'UPDATE authorized_users SET last_access = NOW(), access_count = access_count + 1 WHERE id = $1',
                [userId]
            );
        } catch (error) {
            console.error('❌ Error updating last access:', error);
        }
    }

    /**
     * Log de accesos y eventos de seguridad
     */
    async logAccess(userId, action, details = {}) {
        try {
            await pool.query(
                `INSERT INTO access_logs (user_id, action, details, timestamp)
                 VALUES ($1, $2, $3, NOW())`,
                [userId, action, JSON.stringify(details)]
            );
        } catch (error) {
            console.error('❌ Error logging access:', error);
        }
    }

    /**
     * Obtener estadísticas de uso
     */
    async getUsageStats() {
        try {
            const stats = await pool.query(`
                SELECT 
                    COUNT(DISTINCT au.id) as total_authorized_users,
                    COUNT(DISTINCT au.id) FILTER (WHERE au.telegram_id IS NOT NULL) as linked_users,
                    COUNT(al.id) FILTER (WHERE al.timestamp > NOW() - INTERVAL '24 hours') as accesses_24h,
                    COUNT(at.id) FILTER (WHERE at.expires_at > NOW() AND at.revoked = false) as active_tokens
                FROM authorized_users au
                LEFT JOIN access_logs al ON au.id = al.user_id  
                LEFT JOIN active_tokens at ON au.id = at.user_id
            `);

            return stats.rows[0];
        } catch (error) {
            console.error('❌ Error getting usage stats:', error);
            return null;
        }
    }

    /**
     * Obtener información completa del usuario
     */
    async getUserInfo(userId) {
        try {
            const result = await pool.query(`
                SELECT 
                    au.*,
                    COUNT(al.id) as total_accesses,
                    MAX(al.timestamp) as last_access_logged,
                    COUNT(at.id) FILTER (WHERE at.expires_at > NOW() AND at.revoked = false) as active_tokens_count
                FROM authorized_users au
                LEFT JOIN access_logs al ON au.id = al.user_id
                LEFT JOIN active_tokens at ON au.id = at.user_id
                WHERE au.id = $1
                GROUP BY au.id
            `, [userId]);

            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('❌ Error getting user info:', error);
            return null;
        }
    }
}

// Middleware para Express
function requireAuth(req, res, next) {
    const auth = new TelegramAuth();
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.query.token ||
                  req.cookies?.auth_token;

    if (!token) {
        return res.status(401).json({ 
            error: 'Token requerido',
            message: 'Acceso al dashboard requiere autenticación via Telegram'
        });
    }

    auth.verifyToken(token)
        .then(decoded => {
            if (!decoded) {
                return res.status(401).json({ 
                    error: 'Token inválido o expirado',
                    message: 'Solicita un nuevo token via Telegram bot'
                });
            }

            req.user = decoded;
            next();
        })
        .catch(error => {
            console.error('❌ Auth middleware error:', error);
            res.status(500).json({ 
                error: 'Error de autenticación',
                message: 'Error interno del sistema'
            });
        });
}

// Rate limiting para autenticación
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos por IP cada 15 minutos
    message: { 
        error: 'Demasiados intentos de autenticación',
        message: 'Intenta nuevamente en 15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { 
    TelegramAuth, 
    requireAuth, 
    authLimiter 
};