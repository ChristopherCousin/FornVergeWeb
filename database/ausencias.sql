-- ================================================================
-- TABLA DE AUSENCIAS - FORN VERGE
-- ================================================================
-- Gestiona vacaciones, bajas, permisos, etc.
-- Las ausencias cuentan como horas teóricas según convenio

CREATE TABLE IF NOT EXISTS ausencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Período de ausencia
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- Tipo de ausencia
    tipo TEXT NOT NULL CHECK (tipo IN (
        'vacaciones',      -- Vacaciones anuales
        'baja_medica',     -- Baja por enfermedad
        'permiso',         -- Permiso personal
        'maternidad',      -- Baja maternal/paternal
        'convenio',        -- Días convenio
        'asuntos_propios', -- Días asuntos propios
        'festivo_local'    -- Festivos locales
    )),
    
    -- Cálculo de horas
    horas_teoricas_dia DECIMAL(4,2) DEFAULT 8.00, -- Horas teóricas por día según convenio
    total_dias INTEGER GENERATED ALWAYS AS (fecha_fin - fecha_inicio + 1) STORED,
    total_horas_teoricas DECIMAL(6,2) GENERATED ALWAYS AS (
        (fecha_fin - fecha_inicio + 1) * horas_teoricas_dia
    ) STORED,
    
    -- Metadatos
    motivo TEXT,
    observaciones TEXT,
    justificante_subido BOOLEAN DEFAULT FALSE,
    
    -- Gestión
    creado_por TEXT, -- Quien registró la ausencia
    aprobado_por TEXT, -- Quien aprobó (para permisos)
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- ÍNDICES PARA CONSULTAS RÁPIDAS
-- ================================================================

CREATE INDEX idx_ausencias_empleado_fecha ON ausencias(empleado_id, fecha_inicio, fecha_fin);
CREATE INDEX idx_ausencias_periodo ON ausencias(fecha_inicio, fecha_fin);
CREATE INDEX idx_ausencias_tipo ON ausencias(tipo);
CREATE INDEX idx_ausencias_estado ON ausencias(estado);

-- ================================================================
-- TRIGGER PARA UPDATED_AT
-- ================================================================

CREATE OR REPLACE FUNCTION update_ausencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ausencias_updated_at 
    BEFORE UPDATE ON ausencias 
    FOR EACH ROW EXECUTE PROCEDURE update_ausencias_updated_at();

-- ================================================================
-- VALIDACIONES ADICIONALES
-- ================================================================

-- Validar que fecha_fin >= fecha_inicio
ALTER TABLE ausencias ADD CONSTRAINT check_fechas_ausencia 
    CHECK (fecha_fin >= fecha_inicio);

-- Validar que horas_teoricas_dia sea razonable
ALTER TABLE ausencias ADD CONSTRAINT check_horas_teoricas 
    CHECK (horas_teoricas_dia > 0 AND horas_teoricas_dia <= 24);

-- ================================================================
-- VISTA PARA CONSULTAS FÁCILES
-- ================================================================

CREATE OR REPLACE VIEW ausencias_detalle AS
SELECT 
    a.id,
    e.name AS empleado_nombre,
    e.employee_id,
    e.emoji,
    a.fecha_inicio,
    a.fecha_fin,
    a.tipo,
    a.total_dias,
    a.horas_teoricas_dia,
    a.total_horas_teoricas,
    a.motivo,
    a.estado,
    a.creado_por,
    a.created_at,
    -- Calcular si está activa hoy
    CASE 
        WHEN CURRENT_DATE BETWEEN a.fecha_inicio AND a.fecha_fin 
        THEN true 
        ELSE false 
    END AS activa_hoy,
    -- Días restantes
    CASE 
        WHEN CURRENT_DATE < a.fecha_inicio 
        THEN a.fecha_inicio - CURRENT_DATE
        WHEN CURRENT_DATE BETWEEN a.fecha_inicio AND a.fecha_fin
        THEN a.fecha_fin - CURRENT_DATE + 1
        ELSE 0
    END AS dias_restantes
FROM ausencias a
JOIN employees e ON a.empleado_id = e.id
ORDER BY a.fecha_inicio DESC;

-- ================================================================
-- FUNCIONES ÚTILES
-- ================================================================

-- Función para obtener ausencias activas en una fecha
CREATE OR REPLACE FUNCTION get_ausencias_activas(fecha_consulta DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    empleado_id UUID,
    empleado_nombre TEXT,
    tipo TEXT,
    horas_teoricas_dia DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.empleado_id,
        e.name,
        a.tipo,
        a.horas_teoricas_dia
    FROM ausencias a
    JOIN employees e ON a.empleado_id = e.id
    WHERE fecha_consulta BETWEEN a.fecha_inicio AND a.fecha_fin
    AND a.estado = 'aprobado';
END;
$$ LANGUAGE plpgsql;

-- Función para calcular horas teóricas de ausencias en un período
CREATE OR REPLACE FUNCTION calcular_horas_teoricas_ausencias(
    emp_id UUID,
    fecha_desde DATE,
    fecha_hasta DATE
) RETURNS DECIMAL AS $$
DECLARE
    total_horas DECIMAL := 0;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            -- Si la ausencia está completamente dentro del período
            WHEN a.fecha_inicio >= fecha_desde AND a.fecha_fin <= fecha_hasta 
            THEN a.total_horas_teoricas
            
            -- Si la ausencia empieza antes pero termina dentro
            WHEN a.fecha_inicio < fecha_desde AND a.fecha_fin <= fecha_hasta AND a.fecha_fin >= fecha_desde
            THEN (a.fecha_fin - fecha_desde + 1) * a.horas_teoricas_dia
            
            -- Si la ausencia empieza dentro pero termina después
            WHEN a.fecha_inicio >= fecha_desde AND a.fecha_inicio <= fecha_hasta AND a.fecha_fin > fecha_hasta
            THEN (fecha_hasta - a.fecha_inicio + 1) * a.horas_teoricas_dia
            
            -- Si la ausencia cubre todo el período
            WHEN a.fecha_inicio < fecha_desde AND a.fecha_fin > fecha_hasta
            THEN (fecha_hasta - fecha_desde + 1) * a.horas_teoricas_dia
            
            ELSE 0
        END
    ), 0) INTO total_horas
    FROM ausencias a
    WHERE a.empleado_id = emp_id
    AND a.estado = 'aprobado'
    AND (
        (a.fecha_inicio BETWEEN fecha_desde AND fecha_hasta) OR
        (a.fecha_fin BETWEEN fecha_desde AND fecha_hasta) OR
        (a.fecha_inicio < fecha_desde AND a.fecha_fin > fecha_hasta)
    );
    
    RETURN total_horas;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- DATOS DE EJEMPLO (OPCIONAL - BORRAR DESPUÉS)
-- ================================================================

-- Ejemplos de ausencias (comentado para evitar errores en instalación)
/*
-- Vacaciones de verano para Gaby
INSERT INTO ausencias (empleado_id, fecha_inicio, fecha_fin, tipo, motivo, estado, creado_por) VALUES
((SELECT id FROM employees WHERE name = 'GABY'), '2025-08-01', '2025-08-15', 'vacaciones', 'Vacaciones verano', 'aprobado', 'admin');

-- Baja médica para Andrea  
INSERT INTO ausencias (empleado_id, fecha_inicio, fecha_fin, tipo, motivo, estado, creado_por) VALUES
((SELECT id FROM employees WHERE name = 'ANDREA'), '2025-07-10', '2025-07-12', 'baja_medica', 'Gripe', 'aprobado', 'admin');
*/

-- ================================================================
-- COMENTARIOS FINALES
-- ================================================================

COMMENT ON TABLE ausencias IS 'Gestión de ausencias (vacaciones, bajas, permisos) con cálculo automático de horas teóricas según convenio';
COMMENT ON COLUMN ausencias.tipo IS 'Tipo de ausencia: vacaciones, baja_medica, permiso, maternidad, convenio, asuntos_propios, festivo_local';
COMMENT ON COLUMN ausencias.horas_teoricas_dia IS 'Horas teóricas por día durante la ausencia (normalmente 8h según convenio)';
COMMENT ON COLUMN ausencias.total_horas_teoricas IS 'Total de horas teóricas calculadas automáticamente';
COMMENT ON FUNCTION get_ausencias_activas IS 'Obtiene empleados con ausencias activas en una fecha específica';
COMMENT ON FUNCTION calcular_horas_teoricas_ausencias IS 'Calcula horas teóricas de ausencias de un empleado en un período';

-- ================================================================
-- ¡LISTO! Ejecutar en Supabase SQL Editor
-- ================================================================ 