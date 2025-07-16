-- ================================================================
-- SUPABASE COMPLETO - FORN VERGE HORARIOS
-- Estructura completa + Fix múltiples turnos por día
-- ================================================================

-- ================================================================
-- 1. ESTRUCTURA ACTUAL (YA EXISTENTE)
-- ================================================================

-- TABLA: employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '👤'::text,
    employee_id TEXT NOT NULL UNIQUE,
    access_code TEXT NOT NULL,
    role TEXT DEFAULT 'employee'::text CHECK (role = ANY (ARRAY['employee'::text, 'admin'::text])),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLA: schedules
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    day_of_week TEXT NOT NULL CHECK (day_of_week = ANY (ARRAY['lunes'::text, 'martes'::text, 'miercoles'::text, 'jueves'::text, 'viernes'::text, 'sabado'::text, 'domingo'::text])),
    start_time TIME,
    end_time TIME,
    hours INTEGER DEFAULT 0,
    colleagues TEXT[], -- ARRAY de texto
    is_free_day BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLA: schedule_changes (historial)
CREATE TABLE IF NOT EXISTS schedule_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    old_schedule JSONB,
    new_schedule JSONB,
    changed_by TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================================
-- 2. FIX PARA MÚLTIPLES TURNOS POR DÍA
-- ================================================================

-- PROBLEMA: Constraint único impide múltiples turnos por día
-- SOLUCIÓN: Eliminar constraint + agregar campo secuencia

-- Eliminar constraint problemático
DO $$ 
BEGIN
    ALTER TABLE schedules DROP CONSTRAINT schedules_employee_id_week_start_day_of_week_key;
EXCEPTION 
    WHEN undefined_object THEN 
        NULL; -- Constraint no existe, ignorar
END $$;

-- Agregar campo para secuencia de turnos
DO $$ 
BEGIN
    ALTER TABLE schedules ADD COLUMN shift_sequence INTEGER DEFAULT 1;
EXCEPTION 
    WHEN duplicate_column THEN 
        NULL; -- Columna ya existe, ignorar
END $$;

-- Agregar descripción del turno
DO $$ 
BEGIN
    ALTER TABLE schedules ADD COLUMN shift_description TEXT;
EXCEPTION 
    WHEN duplicate_column THEN 
        NULL; -- Columna ya existe, ignorar
END $$;

-- Nuevo constraint: único por empleado + semana + día + secuencia
DO $$ 
BEGIN
    ALTER TABLE schedules ADD CONSTRAINT unique_employee_day_week_sequence 
    UNIQUE (employee_id, week_start, day_of_week, shift_sequence);
EXCEPTION 
    WHEN duplicate_object THEN 
        NULL; -- Constraint ya existe, ignorar
END $$;

-- Actualizar registros existentes
UPDATE schedules 
SET shift_sequence = 1 
WHERE shift_sequence IS NULL;

UPDATE schedules 
SET shift_description = CASE 
    WHEN is_free_day THEN 'Día libre'
    WHEN start_time = '07:00:00' AND end_time = '14:00:00' THEN 'Turno mañana'
    WHEN start_time = '14:00:00' AND end_time = '21:00:00' THEN 'Turno tarde'
    ELSE 'Turno personalizado'
END
WHERE shift_description IS NULL;

-- ================================================================
-- 3. FUNCIÓN PARA MÚLTIPLES TURNOS FÁCIL
-- ================================================================

CREATE OR REPLACE FUNCTION insert_multiple_shifts(
    p_employee_id UUID,
    p_week_start DATE,
    p_day_of_week TEXT,
    p_shifts JSONB
) RETURNS VOID AS $$
DECLARE
    shift_record JSONB;
    sequence_num INTEGER := 1;
BEGIN
    -- Eliminar turnos existentes del día
    DELETE FROM schedules 
    WHERE employee_id = p_employee_id 
    AND week_start = p_week_start 
    AND day_of_week = p_day_of_week;
    
    -- Insertar nuevos turnos
    FOR shift_record IN SELECT * FROM jsonb_array_elements(p_shifts)
    LOOP
        INSERT INTO schedules (
            employee_id, 
            week_start, 
            day_of_week, 
            start_time, 
            end_time, 
            hours, 
            is_free_day, 
            shift_sequence,
            shift_description,
            colleagues,
            created_at,
            updated_at
        ) VALUES (
            p_employee_id,
            p_week_start,
            p_day_of_week,
            (shift_record->>'start_time')::TIME,
            (shift_record->>'end_time')::TIME,
            (shift_record->>'hours')::INTEGER,
            (shift_record->>'is_free_day')::BOOLEAN,
            sequence_num,
            shift_record->>'description',
            ARRAY[]::TEXT[],
            NOW(),
            NOW()
        );
        
        sequence_num := sequence_num + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 4. VISTA PARA CONSULTAS FÁCILES
-- ================================================================

CREATE OR REPLACE VIEW schedule_detailed AS
SELECT 
    e.name AS employee_name,
    e.employee_id,
    e.emoji,
    s.week_start,
    s.day_of_week,
    s.shift_sequence,
    s.start_time,
    s.end_time,
    s.hours,
    s.is_free_day,
    s.shift_description,
    s.colleagues
FROM schedules s
JOIN employees e ON s.employee_id = e.id
ORDER BY e.name, s.week_start, s.day_of_week, s.shift_sequence;

-- ================================================================
-- 5. EMPLEADOS DE EJEMPLO (SI NO EXISTEN)
-- ================================================================

INSERT INTO employees (name, emoji, employee_id, access_code, role) VALUES
('BRYAN', '👨‍💼', 'bryan', 'YnJ5YW4yMDI1', 'employee'),
('RAQUEL', '👩‍💼', 'raquel', 'cmFxdWVsMjAyNQ==', 'employee'),
('MARÍA', '👩‍💼', 'maria', 'bWFyaWEyMDI1', 'employee'),
('XISCA', '👩‍💼', 'xisca', 'eGlzY2EyMDI1', 'employee'),
('GABY', '👩‍🍳', 'gaby', 'Z2FieTIwMjU=', 'employee'),
('MERCEDES', '👩‍💼', 'mercedes', 'bWVyY2VkZXMyMDI1', 'employee'),
('ADMINISTRADOR', '👔', 'admin', 'YWRtaW5mb3JuMjAyNQ==', 'admin')
ON CONFLICT (employee_id) DO NOTHING;

-- ================================================================
-- 6. EJEMPLO DE USO: BRYAN DOMINGO CON 2 TURNOS
-- ================================================================

-- Ejemplo: Bryan domingo 9-13 y 16-21 (AHORA SÍ ES POSIBLE)
-- Comentado para evitar errores durante la instalación
/*
SELECT insert_multiple_shifts(
    (SELECT id FROM employees WHERE employee_id = 'bryan'),
    '2025-02-09'::DATE,
    'domingo',
    '[
        {
            "start_time": "09:00:00",
            "end_time": "13:00:00", 
            "hours": 4,
            "is_free_day": false,
            "description": "Refuerzo mañana"
        },
        {
            "start_time": "16:00:00",
            "end_time": "21:00:00",
            "hours": 5, 
            "is_free_day": false,
            "description": "Refuerzo tarde"
        }
    ]'::JSONB
);
*/

-- ================================================================
-- 7. ¡YA ESTÁ LISTO!
-- ================================================================
-- Ahora puedes usar el admin panel con:
-- ✅ Múltiples turnos por día
-- ✅ Guardado automático  
-- ✅ Horarios partidos
-- ✅ Campos shift_sequence y shift_description

-- ================================================================
-- 7. CONFIGURAR ROW LEVEL SECURITY (OPCIONAL)
-- ================================================================

-- Habilitar RLS si quieres seguridad
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE schedule_changes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (lectura pública)
-- CREATE POLICY IF NOT EXISTS "Public read employees" ON employees FOR SELECT USING (true);
-- CREATE POLICY IF NOT EXISTS "Public read schedules" ON schedules FOR SELECT USING (true);

-- ================================================================
-- RESULTADO FINAL:
-- ✅ Múltiples turnos por día FUNCIONANDO
-- ✅ Estructura completa y limpia
-- ✅ Función helper para insertar múltiples turnos
-- ✅ Vista para consultas fáciles
-- ✅ Bryan domingo 9-13 + 16-21 ¡YA POSIBLE!
-- ================================================================ 