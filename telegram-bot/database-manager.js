// =========================================
// DATABASE MANAGER - MANEJO ROBUSTO DE CONEXIONES PostgreSQL
// Previene errores de conexión perdida y reconecta automáticamente
// =========================================

const { Pool } = require('pg');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 segundos
    
    this.initializePool();
    
    console.log('🗄️ Database Manager inicializado con reconexión automática');
  }

  initializePool() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,                    // Máximo 10 conexiones
      idleTimeoutMillis: 30000,   // 30 segundos timeout
      connectionTimeoutMillis: 2000, // 2 segundos para conectar
      keepAlive: true,            // Mantener conexiones vivas
      keepAliveInitialDelayMillis: 10000 // 10 segundos antes del primer keepalive
    });

    // Manejar eventos de conexión
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    // Cuando se establece una conexión
    this.pool.on('connect', (client) => {
      console.log('✅ Nueva conexión PostgreSQL establecida');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Cuando hay un error en una conexión
    this.pool.on('error', (err, client) => {
      console.error('❌ Error en conexión PostgreSQL:', err.message);
      this.isConnected = false;
      this.handleConnectionError(err);
    });

    // Cuando se remueve una conexión
    this.pool.on('remove', () => {
      console.log('🔌 Conexión PostgreSQL removida del pool');
    });
  }

  async handleConnectionError(error) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      setTimeout(async () => {
        try {
          await this.testConnection();
        } catch (reconnectError) {
          console.error(`❌ Reconexión ${this.reconnectAttempts} falló:`, reconnectError.message);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('💀 Máximo número de reconexiones alcanzado');
          }
        }
      }, this.reconnectDelay);
    }
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      console.log('✅ Conexión PostgreSQL verificada exitosamente');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      return true;
    } catch (error) {
      console.error('❌ Test de conexión falló:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async query(text, params = []) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Verificar conexión antes de la query
        if (!this.isConnected) {
          await this.testConnection();
        }

        const start = Date.now();
        const result = await this.pool.query(text, params);
        const duration = Date.now() - start;
        
        if (duration > 1000) {
          console.log(`⚠️ Query lenta ejecutada en ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        attempt++;
        console.error(`❌ Error en query (intento ${attempt}/${maxRetries}):`, error.message);
        
        if (error.message.includes('Connection terminated') || 
            error.message.includes('connection') || 
            error.code === 'ECONNRESET') {
          this.isConnected = false;
          
          if (attempt < maxRetries) {
            console.log(`🔄 Reintentando query en 1 segundo...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        if (attempt >= maxRetries) {
          console.error('💀 Query falló después de todos los reintentos');
          throw error;
        }
      }
    }
  }

  async getConnectionInfo() {
    try {
      const result = await this.query(`
        SELECT 
          COUNT(*) as active_connections,
          current_database() as database_name,
          version() as postgresql_version
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      
      return {
        isConnected: this.isConnected,
        activeConnections: parseInt(result.rows[0].active_connections),
        databaseName: result.rows[0].database_name,
        postgresqlVersion: result.rows[0].postgresql_version.split(' ')[0] + ' ' + result.rows[0].postgresql_version.split(' ')[1],
        poolSize: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingClients: this.pool.waitingCount
      };
    } catch (error) {
      return {
        isConnected: false,
        error: error.message
      };
    }
  }

  async close() {
    try {
      await this.pool.end();
      console.log('✅ Pool de conexiones cerrado correctamente');
    } catch (error) {
      console.error('❌ Error cerrando pool:', error.message);
    }
  }

  getPool() {
    return this.pool;
  }
}

// Instancia singleton
let databaseManager = null;

function getDatabaseManager() {
  if (!databaseManager) {
    databaseManager = new DatabaseManager();
  }
  return databaseManager;
}

module.exports = {
  DatabaseManager,
  getDatabaseManager
};