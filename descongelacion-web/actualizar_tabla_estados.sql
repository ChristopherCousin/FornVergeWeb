-- ===================================================================
-- ACTUALIZACIÓN DE TABLA PARA SISTEMA v2.0 - PREPARACIÓN + EJECUCIÓN
-- ===================================================================
-- Este script actualiza la tabla para soportar el nuevo flujo:
-- 1. Preparación el día anterior (16:00-20:00)
-- 2. Ejecución el día del servicio (6:00-21:00)
-- ===================================================================

-- ===== NUEVAS COLUMNAS PARA PREPARACIÓN =====
-- Columnas para marcar productos como preparados
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS prepared BOOLEAN DEFAULT FALSE;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ NULL;

-- ===== COLUMNAS EXISTENTES PARA SEGUIMIENTO =====
-- Timestamps para seguimiento de estados durante ejecución
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS defrost_started_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS defrost_completed_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS baking_started_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS baking_completed_at TIMESTAMPTZ NULL;

-- ===== COLUMNAS DE AUDITORÍA =====
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100) NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- ===== NUEVAS COLUMNAS ADICIONALES v2.0 =====
-- Para mejorar el seguimiento y la experiencia
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS preparation_employee VARCHAR(100) NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS tanda_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS tanda_completed_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS priority_order INTEGER DEFAULT 0;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS estimated_ready_time TIMESTAMPTZ NULL;

-- ===== ÍNDICES PARA OPTIMIZACIÓN =====
-- Índices para búsquedas comunes en modo preparación
CREATE INDEX IF NOT EXISTS idx_cantidades_prepared ON cantidades_calculadas(prepared, prepared_at);
CREATE INDEX IF NOT EXISTS idx_cantidades_preparation_day ON cantidades_calculadas(dia_semana, tanda, prepared);

-- Índices para búsquedas comunes en modo ejecución  
CREATE INDEX IF NOT EXISTS idx_cantidades_estados ON cantidades_calculadas(defrost_started_at, baking_started_at);
CREATE INDEX IF NOT EXISTS idx_cantidades_active ON cantidades_calculadas(dia_semana, tanda, defrost_started_at, baking_completed_at);

-- Índices para auditoría y rendimiento
CREATE INDEX IF NOT EXISTS idx_cantidades_updated ON cantidades_calculadas(updated_at);
CREATE INDEX IF NOT EXISTS idx_cantidades_priority ON cantidades_calculadas(tanda, priority_order);

-- ===== FUNCIÓN PARA ACTUALIZAR TIMESTAMP AUTOMÁTICAMENTE =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===== TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA =====
DROP TRIGGER IF EXISTS update_cantidades_updated_at ON cantidades_calculadas;
CREATE TRIGGER update_cantidades_updated_at
    BEFORE UPDATE ON cantidades_calculadas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== FUNCIÓN PARA MARCAR TANDA COMO PREPARADA =====
CREATE OR REPLACE FUNCTION mark_tanda_prepared(
    p_dia_semana INTEGER,
    p_tanda VARCHAR,
    p_employee_name VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE cantidades_calculadas 
    SET 
        prepared = TRUE,
        prepared_at = NOW(),
        preparation_employee = COALESCE(p_employee_name, preparation_employee)
    WHERE 
        dia_semana = p_dia_semana 
        AND tanda = p_tanda
        AND prepared = FALSE;
        
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ===== FUNCIÓN PARA OBTENER ESTADO DEL PRODUCTO =====
CREATE OR REPLACE FUNCTION get_product_state(
    p_prepared BOOLEAN,
    p_defrost_started_at TIMESTAMPTZ,
    p_defrost_completed_at TIMESTAMPTZ,
    p_baking_started_at TIMESTAMPTZ,
    p_baking_completed_at TIMESTAMPTZ
)
RETURNS VARCHAR AS $$
BEGIN
    -- Estados según el nuevo flujo v2.0
    IF p_baking_completed_at IS NOT NULL THEN
        RETURN 'completed';
    ELSIF p_baking_started_at IS NOT NULL THEN
        RETURN 'baking';
    ELSIF p_defrost_completed_at IS NOT NULL THEN
        RETURN 'ready_to_bake';
    ELSIF p_defrost_started_at IS NOT NULL THEN
        RETURN 'defrosting';
    ELSIF p_prepared = TRUE THEN
        RETURN 'prepared';
    ELSE
        RETURN 'pending_preparation';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ===== VISTA PARA RESUMEN DE PREPARACIÓN =====
CREATE OR REPLACE VIEW preparation_summary AS
SELECT 
    dia_semana,
    tanda,
    COUNT(*) as total_products,
    COUNT(CASE WHEN prepared = TRUE THEN 1 END) as prepared_products,
    COUNT(CASE WHEN prepared = FALSE THEN 1 END) as pending_products,
    ROUND(
        (COUNT(CASE WHEN prepared = TRUE THEN 1 END)::FLOAT / COUNT(*)::FLOAT) * 100, 
        2
    ) as preparation_percentage,
    MAX(prepared_at) as last_prepared_at,
    MIN(CASE WHEN prepared = FALSE THEN producto END) as next_to_prepare
FROM cantidades_calculadas
GROUP BY dia_semana, tanda
ORDER BY dia_semana, 
    CASE tanda 
        WHEN 'mañana' THEN 1 
        WHEN 'mediodia' THEN 2 
        WHEN 'tarde' THEN 3 
    END;

-- ===== VISTA PARA SEGUIMIENTO DE EJECUCIÓN =====
CREATE OR REPLACE VIEW execution_tracking AS
SELECT 
    id,
    producto,
    cantidad_ajustada,
    dia_semana,
    tanda,
    get_product_state(
        prepared, 
        defrost_started_at, 
        defrost_completed_at, 
        baking_started_at, 
        baking_completed_at
    ) as current_state,
    defrost_started_at,
    defrost_completed_at,
    baking_started_at,
    baking_completed_at,
    estimated_ready_time,
    employee_name,
    updated_at
FROM cantidades_calculadas
WHERE prepared = TRUE
ORDER BY 
    dia_semana,
    CASE tanda 
        WHEN 'mañana' THEN 1 
        WHEN 'mediodia' THEN 2 
        WHEN 'tarde' THEN 3 
    END,
    priority_order;

-- ===== FUNCIÓN PARA LIMPIAR DATOS ANTIGUOS =====
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_rows INTEGER;
BEGIN
    -- Eliminar registros más antiguos que X días
    DELETE FROM cantidades_calculadas 
    WHERE updated_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    -- Log de limpieza
    INSERT INTO cantidades_calculadas (producto, cantidad_ajustada, dia_semana, tanda, notes, updated_at)
    VALUES (
        'CLEANUP_LOG', 
        deleted_rows, 
        EXTRACT(DOW FROM NOW()), 
        'cleanup', 
        'Cleaned ' || deleted_rows || ' old records', 
        NOW()
    );
    
    RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql;

-- ===== CONFIGURAR LIMPIEZA AUTOMÁTICA (OPCIONAL) =====
-- Para configurar limpieza automática semanal, ejecutar:
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data(7);');

-- ===== GRANTS DE PERMISOS =====
-- Asegurar que la aplicación puede usar las nuevas funciones
GRANT EXECUTE ON FUNCTION mark_tanda_prepared TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_state TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data TO authenticated;

-- Permisos para las vistas
GRANT SELECT ON preparation_summary TO anon, authenticated;
GRANT SELECT ON execution_tracking TO anon, authenticated;

-- ===== DATOS DE EJEMPLO PARA TESTING =====
-- Solo ejecutar si la tabla está vacía
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cantidades_calculadas LIMIT 1) THEN
        INSERT INTO cantidades_calculadas 
        (producto, cantidad_ajustada, dia_semana, tanda, priority_order) 
        VALUES 
        -- Lunes Mañana
        ('Barra Clásica', 15, 0, 'mañana', 1),
        ('Croissant', 8, 0, 'mañana', 2),
        ('Mini Croissant', 12, 0, 'mañana', 3),
        
        -- Lunes Mediodía  
        ('Empanada Pollo y Cebolla', 10, 0, 'mediodia', 1),
        ('Napolitana Jamón/Queso', 6, 0, 'mediodia', 2),
        
        -- Lunes Tarde
        ('Ensaimada Crema', 8, 0, 'tarde', 1),
        ('Napolitana Choco.', 6, 0, 'tarde', 2);
        
        RAISE NOTICE 'Datos de ejemplo insertados para testing';
    END IF;
END $$;

-- ===== CONFIRMACIÓN =====
SELECT 
    'Tabla cantidades_calculadas actualizada para sistema v2.0 - Preparación + Ejecución' AS status,
    COUNT(*) AS total_products,
    COUNT(CASE WHEN prepared = TRUE THEN 1 END) AS prepared_products
FROM cantidades_calculadas; 