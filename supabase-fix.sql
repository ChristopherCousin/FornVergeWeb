-- ================================
-- CONFIGURACIÓN COMPLETA SUPABASE
-- Forn Verge de Lluc - Sistema de Horarios
-- ================================

-- 1. CREAR TABLAS
-- ================================

-- Crear tabla de empleados
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '👤',
    employee_id TEXT UNIQUE NOT NULL,
    access_code TEXT NOT NULL,
    role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de horarios
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')),
    start_time TIME,
    end_time TIME,
    hours INTEGER DEFAULT 0,
    colleagues TEXT[],
    is_free_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, week_start, day_of_week)
);

-- Crear tabla de cambios
CREATE TABLE IF NOT EXISTS schedule_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    old_schedule JSONB,
    new_schedule JSONB,
    changed_by TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INSERTAR EMPLEADOS
-- ================================

-- Limpiar datos existentes (solo en desarrollo)
DELETE FROM schedule_changes;
DELETE FROM schedules;
DELETE FROM employees;

-- Insertar empleados
INSERT INTO employees (name, emoji, employee_id, access_code, role) VALUES
('BRYAN', '👨‍💼', 'bryan', 'YnJ5YW4yMDI1', 'employee'),
('RAQUEL', '👩‍💼', 'raquel', 'cmFxdWVsMjAyNQ==', 'employee'),
('MARÍA', '👩‍💼', 'maria', 'bWFyaWEyMDI1', 'employee'),
('XISCA', '👩‍💼', 'xisca', 'eGlzY2EyMDI1', 'employee'),
('ANDREA', '👩‍💼', 'andrea', 'YW5kcmVhMjAyNQ==', 'employee'),
('ADMINISTRADOR', '👔', 'admin', 'YWRtaW5mb3JuMjAyNQ==', 'admin');

-- 3. INSERTAR HORARIOS COMPLETOS - SEMANA 13-19 ENERO 2025
-- ================================

-- Variables para UUIDs de empleados
DO $$
DECLARE
    bryan_id UUID;
    raquel_id UUID;
    maria_id UUID;
    xisca_id UUID;
    andrea_id UUID;
BEGIN
    -- Obtener IDs de empleados
    SELECT id INTO bryan_id FROM employees WHERE employee_id = 'bryan';
    SELECT id INTO raquel_id FROM employees WHERE employee_id = 'raquel';
    SELECT id INTO maria_id FROM employees WHERE employee_id = 'maria';
    SELECT id INTO xisca_id FROM employees WHERE employee_id = 'xisca';
    SELECT id INTO andrea_id FROM employees WHERE employee_id = 'andrea';

    -- LUNES 13 ENERO 2025
    INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, colleagues, is_free_day) VALUES
    (bryan_id, '2025-01-13', 'lunes', '07:00', '14:00', 7, ARRAY['XISCA', 'ANDREA'], false),
    (raquel_id, '2025-01-13', 'lunes', '14:00', '21:00', 7, ARRAY['XISCA', 'ANDREA'], false),
    (maria_id, '2025-01-13', 'lunes', NULL, NULL, 0, ARRAY[]::TEXT[], true),
    (xisca_id, '2025-01-13', 'lunes', '10:00', '16:00', 6, ARRAY['BRYAN', 'ANDREA'], false),
    (andrea_id, '2025-01-13', 'lunes', '12:00', '19:00', 7, ARRAY['BRYAN', 'XISCA'], false);

    -- MARTES 14 ENERO 2025
    INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, colleagues, is_free_day) VALUES
    (bryan_id, '2025-01-13', 'martes', '14:00', '21:00', 7, ARRAY['XISCA', 'ANDREA'], false),
    (raquel_id, '2025-01-13', 'martes', NULL, NULL, 0, ARRAY[]::TEXT[], true),
    (maria_id, '2025-01-13', 'martes', '07:00', '14:00', 7, ARRAY['XISCA', 'ANDREA'], false),
    (xisca_id, '2025-01-13', 'martes', '12:00', '18:00', 6, ARRAY['BRYAN', 'ANDREA'], false),
    (andrea_id, '2025-01-13', 'martes', '10:00', '17:00', 7, ARRAY['MARÍA', 'XISCA'], false);

    -- MIÉRCOLES 15 ENERO 2025
    INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, colleagues, is_free_day) VALUES
    (bryan_id, '2025-01-13', 'miercoles', '10:00', '16:00', 6, ARRAY['ANDREA'], false),
    (raquel_id, '2025-01-13', 'miercoles', '07:00', '14:00', 7, ARRAY[], false),
    (maria_id, '2025-01-13', 'miercoles', '14:00', '21:00', 7, ARRAY['ANDREA'], false),
    (xisca_id, '2025-01-13', 'miercoles', NULL, NULL, 0, ARRAY[]::TEXT[], true),
    (andrea_id, '2025-01-13', 'miercoles', '12:00', '19:00', 7, ARRAY['BRYAN', 'MARÍA'], false);

    -- JUEVES 16 ENERO 2025
    INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, colleagues, is_free_day) VALUES
    (bryan_id, '2025-01-13', 'jueves', '12:00', '19:00', 7, ARRAY['XISCA'], false),
    (raquel_id, '2025-01-13', 'jueves', '10:00', '16:00', 6, ARRAY['BRYAN'], false),
    (maria_id, '2025-01-13', 'jueves', '07:00', '13:00', 6, ARRAY[], false),
    (xisca_id, '2025-01-13', 'jueves', '14:00', '21:00', 7, ARRAY['BRYAN'], false),
    (andrea_id, '2025-01-13', 'jueves', NULL, NULL, 0, ARRAY[]::TEXT[], true);

    -- VIERNES 17 ENERO 2025
    INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, colleagues, is_free_day) VALUES
    (bryan_id, '2025-01-13', 'viernes', '07:00', '14:00', 7, ARRAY['ANDREA', 'MARÍA'], false),
    (raquel_id, '2025-01-13', 'viernes', '12:00', '19:00', 7, ARRAY['MARÍA'], false),
    (maria_id, '2025-01-13', 'viernes', '10:00', '17:00', 7, ARRAY['ANDREA', 'RAQUEL'], false),
    (xisca_id, '2025-01-13', 'viernes', '14:00', '21:00', 7, ARRAY[], false),
    (andrea_id, '2025-01-13', 'viernes', '07:00', '13:00', 6, ARRAY['BRYAN', 'MARÍA'], false);

    -- SÁBADO 18 ENERO 2025
    INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, colleagues, is_free_day) VALUES
    (bryan_id, '2025-01-13', 'sabado', NULL, NULL, 0, ARRAY[]::TEXT[], true),
    (raquel_id, '2025-01-13', 'sabado', '07:00', '14:00', 7, ARRAY['XISCA'], false),
    (maria_id, '2025-01-13', 'sabado', '12:00', '19:00', 7, ARRAY['XISCA', 'ANDREA'], false),
    (xisca_id, '2025-01-13', 'sabado', '10:00', '17:00', 7, ARRAY['RAQUEL', 'MARÍA'], false),
    (andrea_id, '2025-01-13', 'sabado', '14:00', '21:00', 7, ARRAY['MARÍA'], false);

    -- DOMINGO 19 ENERO 2025
    INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, colleagues, is_free_day) VALUES
    (bryan_id, '2025-01-13', 'domingo', '10:00', '17:00', 7, ARRAY['ANDREA', 'XISCA'], false),
    (raquel_id, '2025-01-13', 'domingo', '14:00', '21:00', 7, ARRAY['XISCA'], false),
    (maria_id, '2025-01-13', 'domingo', '07:00', '14:00', 7, ARRAY['ANDREA', 'BRYAN'], false),
    (xisca_id, '2025-01-13', 'domingo', '12:00', '19:00', 7, ARRAY['BRYAN', 'RAQUEL'], false),
    (andrea_id, '2025-01-13', 'domingo', '09:00', '15:00', 6, ARRAY['BRYAN', 'MARÍA'], false);

END $$;

-- 4. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ================================

-- Habilitar RLS en todas las tablas
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_changes ENABLE ROW LEVEL SECURITY;

-- Políticas para employees (lectura pública)
DROP POLICY IF EXISTS "Public read employees" ON employees;
CREATE POLICY "Public read employees" ON employees FOR SELECT USING (true);

-- Políticas para schedules (lectura pública)
DROP POLICY IF EXISTS "Public read schedules" ON schedules;
CREATE POLICY "Public read schedules" ON schedules FOR SELECT USING (true);

-- Políticas para insertar en schedules (público por ahora)
DROP POLICY IF EXISTS "Public insert schedules" ON schedules;
CREATE POLICY "Public insert schedules" ON schedules FOR INSERT WITH CHECK (true);

-- Políticas para actualizar schedules (público por ahora)
DROP POLICY IF EXISTS "Public update schedules" ON schedules;
CREATE POLICY "Public update schedules" ON schedules FOR UPDATE USING (true);

-- Políticas para schedule_changes (lectura/escritura pública)
DROP POLICY IF EXISTS "Public access schedule_changes" ON schedule_changes;
CREATE POLICY "Public access schedule_changes" ON schedule_changes FOR ALL USING (true);

-- 5. VERIFICACIÓN DE DATOS
-- ================================

-- Verificar empleados insertados
SELECT 'EMPLEADOS INSERTADOS:' as status;
SELECT name, employee_id, role FROM employees ORDER BY role, name;

-- Verificar horarios insertados
SELECT 'HORARIOS INSERTADOS:' as status;
SELECT 
    e.name,
    s.day_of_week,
    CASE 
        WHEN s.is_free_day THEN 'LIBRE'
        ELSE CONCAT(s.start_time, ' - ', s.end_time)
    END as horario,
    s.hours
FROM schedules s 
JOIN employees e ON s.employee_id = e.id 
WHERE s.week_start = '2025-01-13'
ORDER BY e.name, 
    CASE s.day_of_week 
        WHEN 'lunes' THEN 1
        WHEN 'martes' THEN 2
        WHEN 'miercoles' THEN 3
        WHEN 'jueves' THEN 4
        WHEN 'viernes' THEN 5
        WHEN 'sabado' THEN 6
        WHEN 'domingo' THEN 7
    END;

-- ¡CONFIGURACIÓN COMPLETADA!
-- Ahora puedes usar el sistema con los códigos:
-- bryan2025, raquel2025, maria2025, xisca2025, andrea2025, adminforn2025 