-- ============================================================================
-- FIX: Añadir columnas faltantes y eliminar función vieja
-- ============================================================================

-- 1. ELIMINAR LA FUNCIÓN VIEJA (la incorrecta)
DROP FUNCTION IF EXISTS get_employee_hour_debt(UUID);

-- 2. AÑADIR LAS COLUMNAS FALTANTES A LA TABLA liquidaciones
ALTER TABLE liquidaciones 
ADD COLUMN IF NOT EXISTS balance_before NUMERIC(7, 2);

ALTER TABLE liquidaciones 
ADD COLUMN IF NOT EXISTS balance_after NUMERIC(7, 2);

-- 3. RECREAR LA VISTA (ahora sí funcionará)
DROP VIEW IF EXISTS liquidaciones_con_empleado;

CREATE VIEW liquidaciones_con_empleado AS
SELECT 
    l.id,
    l.employee_id,
    e.name as employee_name,
    e.emoji as employee_emoji,
    e.horas_contrato,
    l.liquidation_date,
    l.liquidated_hours,
    l.paid_amount,
    l.covered_period_start,
    l.covered_period_end,
    l.balance_before,
    l.balance_after,
    m.name as manager_name,
    l.notes,
    l.created_at
FROM liquidaciones l
JOIN employees e ON l.employee_id = e.id
LEFT JOIN employees m ON l.manager_id = m.id
ORDER BY l.liquidation_date DESC, l.created_at DESC;

-- 4. RECREAR LAS FUNCIONES CORRECTAS
CREATE OR REPLACE FUNCTION get_total_liquidated_hours(p_employee_id UUID)
RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(liquidated_hours) FROM liquidaciones WHERE employee_id = p_employee_id),
        0
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_last_liquidation(p_employee_id UUID)
RETURNS TABLE(
    liquidation_id BIGINT,
    liquidation_date DATE,
    liquidated_hours NUMERIC,
    paid_amount NUMERIC,
    balance_after NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.liquidation_date,
        l.liquidated_hours,
        l.paid_amount,
        l.balance_after
    FROM liquidaciones l
    WHERE l.employee_id = p_employee_id
    ORDER BY l.liquidation_date DESC, l.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que la tabla tiene todas las columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'liquidaciones' 
ORDER BY ordinal_position;

-- Verificar que las funciones están creadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('get_total_liquidated_hours', 'get_last_liquidation')
  AND routine_schema = 'public';

-- Verificar que la vista funciona
SELECT COUNT(*) as total_liquidaciones FROM liquidaciones_con_empleado;

