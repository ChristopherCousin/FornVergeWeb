-- ============================================================================
-- SISTEMA SIMPLE DE LIQUIDACIONES - FORN VERGE
-- ============================================================================
-- Este sistema REUTILIZA los cálculos que ya hace el frontend en tiempo real
-- NO recalcula nada, solo registra los pagos
-- ============================================================================

-- Tabla simple para registrar pagos de horas extra
CREATE TABLE IF NOT EXISTS liquidaciones (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Fecha del pago
    liquidation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Horas que se pagan en esta liquidación
    liquidated_hours NUMERIC(6, 2) NOT NULL CHECK (liquidated_hours > 0),
    
    -- Importe pagado en efectivo (€)
    paid_amount NUMERIC(8, 2) NOT NULL CHECK (paid_amount >= 0),
    
    -- Periodo que cubre este pago
    covered_period_start DATE NOT NULL,
    covered_period_end DATE NOT NULL,
    
    -- El balance QUE HABÍA antes de este pago (se copia del frontend)
    balance_before NUMERIC(7, 2),
    
    -- El balance QUE QUEDA después de este pago
    balance_after NUMERIC(7, 2),
    
    -- Quién autorizó el pago
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    -- Notas del pago (opcional)
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_period CHECK (covered_period_end >= covered_period_start)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_liquidaciones_employee ON liquidaciones(employee_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_date ON liquidaciones(liquidation_date);

-- Seguridad
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;

-- Comentario
COMMENT ON TABLE liquidaciones IS 'Registro de pagos de horas extra. El balance se calcula en el frontend desde Agora API.';


-- Vista para consultar liquidaciones con datos del empleado
CREATE OR REPLACE VIEW liquidaciones_con_empleado AS
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


-- Función simple para obtener el total ya liquidado de un empleado
CREATE OR REPLACE FUNCTION get_total_liquidated_hours(p_employee_id UUID)
RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(liquidated_hours) FROM liquidaciones WHERE employee_id = p_employee_id),
        0
    );
END;
$$ LANGUAGE plpgsql;


-- Función para obtener la última liquidación de un empleado
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
-- EJEMPLOS DE USO
-- ============================================================================

-- Ejemplo 1: Registrar un pago (se hace desde el frontend con INSERT normal)
/*
INSERT INTO liquidaciones (
    employee_id,
    liquidation_date,
    liquidated_hours,
    paid_amount,
    covered_period_start,
    covered_period_end,
    balance_before,
    balance_after,
    manager_id,
    notes
) VALUES (
    'uuid-del-empleado',
    '2025-10-07',
    25.50,              -- horas que se pagan
    382.50,             -- importe (25.5h × 15€/h)
    '2025-09-01',       -- periodo desde
    '2025-09-30',       -- periodo hasta
    50.00,              -- balance ANTES (el empleado tenía +50h pendientes)
    24.50,              -- balance DESPUÉS (50 - 25.5 = 24.5h quedan pendientes)
    'uuid-manager',
    'Pago de septiembre en efectivo'
);
*/

-- Ejemplo 2: Ver todas las liquidaciones de un empleado
-- SELECT * FROM liquidaciones_con_empleado WHERE employee_id = 'uuid';

-- Ejemplo 3: Ver cuánto se ha pagado en total a un empleado
-- SELECT get_total_liquidated_hours('uuid');

-- Ejemplo 4: Ver la última liquidación
-- SELECT * FROM get_last_liquidation('uuid');

