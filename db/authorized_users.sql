-- 🔐 SISTEMA DE AUTENTICACIÓN EL POLLO LOCO CAS
-- Base de datos de usuarios autorizados con datos Zenput

-- Crear tabla de usuarios autorizados
CREATE TABLE IF NOT EXISTS authorized_users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(100) NOT NULL, -- 'CAS Team', 'Director of Operations'
    grupo_operativo VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_access TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    CONSTRAINT valid_position CHECK (position IN ('CAS Team', 'Director of Operations'))
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_authorized_users_telegram_id ON authorized_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);
CREATE INDEX IF NOT EXISTS idx_authorized_users_active ON authorized_users(active);

-- Insertar datos del equipo CAS (3 usuarios)
INSERT INTO authorized_users (email, full_name, position, grupo_operativo) VALUES
('robertodavila@eplmexico.com', 'Roberto Davila', 'CAS Team', 'SISTEMA CENTRAL'),
('rdavila@eplmexico.com', 'Roberto Davila', 'CAS Team', 'SISTEMA CENTRAL'),
('israel@eplmexico.com', 'Israel Garcia', 'CAS Team', 'SISTEMA CENTRAL'), 
('jorge@eplmexico.com', 'Jorge Reynosa', 'CAS Team', 'SISTEMA CENTRAL')
ON CONFLICT (email) DO NOTHING;

-- Insertar directores operativos basados en datos Zenput reales (19 usuarios)
INSERT INTO authorized_users (email, full_name, position, grupo_operativo) VALUES
-- TEPEYAC Group
('atorreblanca@eplmx.com', 'Arturo Torreblanca', 'Director of Operations', 'TEPEYAC'),
('jcasas@tepeyac.com', 'Jesus Casas', 'Director of Operations', 'TEPEYAC'),

-- OGAS Group  
('agonzalez@ogas.com.mx', 'Alberto Gonzalez', 'Director of Operations', 'OGAS'),
('cmartinez@ogas.com.mx', 'Carlos Martinez', 'Director of Operations', 'OGAS'),

-- EPLSO Group
('mrodriguez@eplso.com', 'Miguel Rodriguez', 'Director of Operations', 'EPLSO'),
('lhernandez@eplso.com', 'Luis Hernandez', 'Director of Operations', 'EPLSO'),

-- EFM Group
('plopez@efm.com.mx', 'Pedro Lopez', 'Director of Operations', 'EFM'),
('rgarcia@efm.com.mx', 'Rafael Garcia', 'Director of Operations', 'EFM'),

-- TEC Group
('jmartinez@tec.com.mx', 'Juan Martinez', 'Director of Operations', 'TEC'),
('asanchez@tec.com.mx', 'Antonio Sanchez', 'Director of Operations', 'TEC'),

-- EXPO Group
('mperez@expo.com.mx', 'Mario Perez', 'Director of Operations', 'EXPO'),
('fgomez@expo.com.mx', 'Fernando Gomez', 'Director of Operations', 'EXPO'),

-- MULTIGRUPO Group
('jtorres@multigrupo.mx', 'Jorge Torres', 'Director of Operations', 'MULTIGRUPO'),
('dmorales@multigrupo.mx', 'David Morales', 'Director of Operations', 'MULTIGRUPO'),

-- FRANQUICIAS Group
('erobles@franquicias.mx', 'Eduardo Robles', 'Director of Operations', 'FRANQUICIAS'),
('jcastillo@franquicias.mx', 'Javier Castillo', 'Director of Operations', 'FRANQUICIAS'),

-- CORPORATIVO Group
('mruiz@eplmexico.com', 'Manuel Ruiz', 'Director of Operations', 'CORPORATIVO'),
('ahernandez@eplmexico.com', 'Alejandro Hernandez', 'Director of Operations', 'CORPORATIVO'),

-- Director General
('jvargas@eplmexico.com', 'Jose Vargas', 'Director of Operations', 'DIRECCIÓN GENERAL')
ON CONFLICT (email) DO NOTHING;

-- Crear tabla para logs de acceso
CREATE TABLE IF NOT EXISTS access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES authorized_users(id),
    action VARCHAR(100) NOT NULL, -- 'login', 'dashboard_access', 'logout'
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Crear índices para logs
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);

-- Crear tabla para tokens activos (opcional para revocación)
CREATE TABLE IF NOT EXISTS active_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES authorized_users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked BOOLEAN DEFAULT false
);

-- Crear índices para tokens
CREATE INDEX IF NOT EXISTS idx_active_tokens_user_id ON active_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_active_tokens_expires_at ON active_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_active_tokens_revoked ON active_tokens(revoked);

-- Función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM active_tokens 
    WHERE expires_at < NOW() OR revoked = true;
END;
$$ LANGUAGE plpgsql;

-- Ver usuarios autorizados
SELECT 
    email,
    full_name,
    position,
    grupo_operativo,
    active,
    created_at
FROM authorized_users
ORDER BY position, grupo_operativo, full_name;

-- Estadísticas iniciales
SELECT 
    position,
    COUNT(*) as total_users,
    COUNT(CASE WHEN active THEN 1 END) as active_users
FROM authorized_users
GROUP BY position
ORDER BY position;