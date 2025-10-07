/**
 * FUNCIONES DE ACCESO A LOCALES
 * ==============================
 * Funciones SQL para verificar y obtener locales accesibles por usuario
 */

-- ===== FUNCIÓN: Verificar si un usuario puede acceder a un local =====

CREATE OR REPLACE FUNCTION user_can_access_location(
    p_user_id UUID,
    p_location_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assigned_location UUID;
    v_role TEXT;
BEGIN
    -- Obtener rol y local asignado
    SELECT assigned_location_id, role 
    INTO v_assigned_location, v_role
    FROM admin_users
    WHERE id = p_user_id AND active = true;
    
    -- Si no existe o está inactivo
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Owner sin local asignado = acceso a todos
    IF v_role = 'owner' AND v_assigned_location IS NULL THEN
        -- Verificar que el local existe
        RETURN EXISTS (SELECT 1 FROM locations WHERE id = p_location_id);
    END IF;
    
    -- Managers/Supervisors solo a su local asignado
    RETURN v_assigned_location = p_location_id;
END;
$$;

-- ===== FUNCIÓN: Obtener locales accesibles por un usuario =====

CREATE OR REPLACE FUNCTION get_accessible_locations(
    p_user_id UUID
)
RETURNS TABLE (
    location_id UUID,
    location_name TEXT,
    location_slug TEXT,
    agora_url TEXT,
    can_edit BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assigned_location UUID;
    v_role TEXT;
BEGIN
    -- Obtener datos del usuario
    SELECT assigned_location_id, role
    INTO v_assigned_location, v_role
    FROM admin_users
    WHERE id = p_user_id AND active = true;
    
    -- Si no existe o está inactivo
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Owner sin local asignado = todos los locales
    IF v_role = 'owner' AND v_assigned_location IS NULL THEN
        RETURN QUERY
        SELECT 
            l.id,
            l.name,
            l.slug,
            l.agora_url,
            TRUE::BOOLEAN
        FROM locations l
        ORDER BY l.name;
        
    -- Manager/Supervisor = solo su local
    ELSIF v_assigned_location IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            l.id,
            l.name,
            l.slug,
            l.agora_url,
            (v_role IN ('owner', 'manager'))::BOOLEAN
        FROM locations l
        WHERE l.id = v_assigned_location;
    END IF;
END;
$$;

-- ===== PERMISOS =====

-- Permitir que usuarios autenticados ejecuten estas funciones
GRANT EXECUTE ON FUNCTION user_can_access_location(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_accessible_locations(UUID) TO authenticated;

-- COMENTARIOS

COMMENT ON FUNCTION user_can_access_location IS 
'Verifica si un usuario tiene permiso para acceder a un local específico';

COMMENT ON FUNCTION get_accessible_locations IS 
'Devuelve la lista de locales a los que un usuario tiene acceso';

-- ===== TESTING =====

-- Test 1: Verificar que el owner puede acceder a Son Oliva
-- SELECT user_can_access_location(
--     (SELECT id FROM admin_users WHERE username = 'javi'),
--     (SELECT id FROM locations WHERE slug = 'son-oliva')
-- );

-- Test 2: Obtener locales del owner
-- SELECT * FROM get_accessible_locations(
--     (SELECT id FROM admin_users WHERE username = 'javi')
-- );

-- Test 3: Obtener locales de un manager
-- SELECT * FROM get_accessible_locations(
--     (SELECT id FROM admin_users WHERE username = 'gerente_sonoliva')
-- );

