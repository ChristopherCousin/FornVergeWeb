-- ============================================================================
-- SISTEMA DE USUARIOS ADMINISTRADORES CON ROLES
-- ============================================================================
-- Permite login con usuario/contraseña y control de permisos por rol
-- Owner puede gestionar múltiples locales, managers solo su local asignado
-- ============================================================================

-- Añadir slug y agora_url a locations (para URLs amigables y API de Ágora)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS agora_url TEXT;

-- Actualizar slugs y URLs de Ágora de locales existentes
UPDATE locations 
SET slug = 'llevant',
    agora_url = 'http://vergedelluch.ddns.net:8984'
WHERE name = 'MASSA Llevant';

UPDATE locations 
SET slug = 'son-oliva',
    agora_url = 'http://88.20.190.118:8984'
WHERE name = 'MASSA Son Oliva';

-- Hacer slug único (solo si no existe ya)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'locations_slug_key'
    ) THEN
        ALTER TABLE locations ADD CONSTRAINT locations_slug_key UNIQUE (slug);
    END IF;
END $$;

COMMENT ON COLUMN locations.slug IS 'Identificador URL-friendly del local';
COMMENT ON COLUMN locations.agora_url IS 'URL de la API de Ágora para este local';


-- ============================================================================
-- TABLA: admin_users
-- ============================================================================

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Credenciales
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- SHA-256
    full_name TEXT NOT NULL,
    
    -- Rol y permisos
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'supervisor')),
    
    -- Local asignado (NULL = acceso a todos los locales)
    assigned_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    
    -- Permisos específicos por módulo (JSON)
    permissions JSONB DEFAULT '{}',
    
    -- Estado y auditoría
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    last_location_accessed UUID REFERENCES locations(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(active);
CREATE INDEX idx_admin_users_location ON admin_users(assigned_location_id);

-- Seguridad
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Comentarios
COMMENT ON TABLE admin_users IS 'Usuarios del panel de administración con sistema de roles y permisos';
COMMENT ON COLUMN admin_users.assigned_location_id IS 'NULL = acceso a todos los locales (solo owner), UUID = solo ese local';
COMMENT ON COLUMN admin_users.permissions IS 'Permisos granulares por módulo en formato JSON';


-- ============================================================================
-- USUARIOS INICIALES
-- ============================================================================

-- OWNER (Dueño) - Acceso total a todos los locales
-- Usuario: admin | Contraseña: 859623
INSERT INTO admin_users (username, password_hash, full_name, role, assigned_location_id, permissions) VALUES
('admin', '671a4b835d5f4969b45bacd535534155cceee5a990d45134ab3518d0ec813ed4', 'Administrador', 'owner', NULL, '{
  "liquidaciones": {
    "ver": true,
    "registrar": true,
    "editar": true,
    "eliminar": true
  },
  "horarios": {
    "ver": true,
    "editar": true,
    "eliminar": true,
    "generar": true
  },
  "convenio": {
    "ver": true,
    "modificar_config": true
  },
  "empleados": {
    "ver": true,
    "crear": true,
    "editar": true,
    "eliminar": true,
    "editar_tarifa": true
  },
  "ausencias": {
    "ver": true,
    "gestionar": true
  },
  "admin_users": {
    "gestionar": true
  }
}');

-- MANAGER Son Oliva - Solo gestiona Son Oliva, SIN liquidaciones
-- Usuario: gerente_sonoliva | Contraseña: oliva5798
-- Hash SHA-256: 474779aebf5be6db9f80f6ae1b07040b9e7594ea513955022d285c5a22381005
INSERT INTO admin_users (username, password_hash, full_name, role, assigned_location_id, permissions) VALUES
('gerente_sonoliva', '474779aebf5be6db9f80f6ae1b07040b9e7594ea513955022d285c5a22381005', 'Gerente Son Oliva', 'manager', 
(SELECT id FROM locations WHERE slug = 'son-oliva'), '{
  "liquidaciones": {
    "ver": false,
    "registrar": false
  },
  "horarios": {
    "ver": true,
    "editar": true,
    "eliminar": true,
    "generar": true
  },
  "convenio": {
    "ver": true,
    "modificar_config": false
  },
  "empleados": {
    "ver": true,
    "crear": true,
    "editar": true,
    "eliminar": false,
    "editar_tarifa": false
  },
  "ausencias": {
    "ver": true,
    "gestionar": true
  }
}');

-- MANAGER Llevant - Solo gestiona Llevant, SIN liquidaciones
-- Usuario: gerente_llevant | Contraseña: llevant6875
-- Hash SHA-256: dc09e559cca885657a2cf007d79bdff4d7ade824622460751d8d2c217ffbd59c
INSERT INTO admin_users (username, password_hash, full_name, role, assigned_location_id, permissions) VALUES
('gerente_llevant', 'dc09e559cca885657a2cf007d79bdff4d7ade824622460751d8d2c217ffbd59c', 'Gerente Llevant', 'manager', 
(SELECT id FROM locations WHERE slug = 'llevant'), '{
  "liquidaciones": {
    "ver": false,
    "registrar": false
  },
  "horarios": {
    "ver": true,
    "editar": true,
    "eliminar": true,
    "generar": true
  },
  "convenio": {
    "ver": true,
    "modificar_config": false
  },
  "empleados": {
    "ver": true,
    "crear": true,
    "editar": true,
    "eliminar": false,
    "editar_tarifa": false
  },
  "ausencias": {
    "ver": true,
    "gestionar": true
  }
}');


-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para verificar si un usuario puede acceder a un local
CREATE OR REPLACE FUNCTION user_can_access_location(p_user_id UUID, p_location_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_assigned_location UUID;
BEGIN
    SELECT assigned_location_id INTO v_assigned_location
    FROM admin_users
    WHERE id = p_user_id AND active = true;
    
    -- Si assigned_location_id es NULL, puede acceder a todos (owner)
    IF v_assigned_location IS NULL THEN
        RETURN true;
    END IF;
    
    -- Si no, solo puede acceder a su local asignado
    RETURN v_assigned_location = p_location_id;
END;
$$ LANGUAGE plpgsql;


-- Función para obtener locales accesibles por un usuario
CREATE OR REPLACE FUNCTION get_accessible_locations(p_user_id UUID)
RETURNS TABLE(location_id UUID, location_name TEXT, location_slug TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT l.id, l.name, l.slug
    FROM locations l
    WHERE (
        -- Si el usuario tiene assigned_location_id NULL (owner), ver todos
        (SELECT assigned_location_id FROM admin_users WHERE id = p_user_id) IS NULL
        OR
        -- Si no, solo su local
        l.id = (SELECT assigned_location_id FROM admin_users WHERE id = p_user_id)
    )
    ORDER BY l.name;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- VISTA PARA CONSULTAS
-- ============================================================================

CREATE OR REPLACE VIEW admin_users_summary AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.role,
    l.name as assigned_location_name,
    l.slug as assigned_location_slug,
    u.active,
    u.last_login,
    u.created_at
FROM admin_users u
LEFT JOIN locations l ON u.assigned_location_id = l.id
ORDER BY u.created_at DESC;


-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS en la tabla
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT a usuarios autenticados
CREATE POLICY "Permitir lectura de usuarios activos"
ON admin_users FOR SELECT
USING (active = true);

-- Política: Permitir UPDATE de last_login
CREATE POLICY "Permitir actualizar último login"
ON admin_users FOR UPDATE
USING (active = true)
WITH CHECK (active = true);

-- Comentario
COMMENT ON TABLE admin_users IS 'Usuarios administradores del sistema con roles y permisos';


-- ============================================================================
-- GENERAR HASH DE CONTRASEÑA (para crear nuevos usuarios)
-- ============================================================================

-- Para generar el hash de una contraseña en JavaScript (consola del navegador):
/*
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Ejemplo:
await sha256('micontraseña2025')
*/


-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver usuarios creados
SELECT * FROM admin_users_summary;

-- Ver locales disponibles para el owner
SELECT * FROM get_accessible_locations((SELECT id FROM admin_users WHERE username = 'javi'));

-- Ver locales disponibles para un manager
SELECT * FROM get_accessible_locations((SELECT id FROM admin_users WHERE username = 'gerente_sonoliva'));

