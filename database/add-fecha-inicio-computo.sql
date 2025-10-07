-- =====================================================
-- AÑADIR CAMPO DE FECHA INICIO CÓMPUTO A EMPLOYEES
-- =====================================================
-- Fecha: 2025-10-07
-- Propósito: Permitir configurar desde qué fecha se cuentan
--            los fichajes válidos de un empleado (campo discreto)
-- =====================================================

-- Añadir columna fecha_inicio_computo
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS fecha_inicio_computo DATE;

-- Añadir comentario descriptivo
COMMENT ON COLUMN employees.fecha_inicio_computo IS 
'Fecha desde la cual se contabilizan fichajes válidos. Si es NULL, se cuentan todos los fichajes. Útil para descartar fichajes erróneos o de prueba anteriores.';

-- Verificar que se añadió correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees' 
  AND column_name = 'fecha_inicio_computo';

-- Ejemplo de uso:
-- UPDATE employees SET fecha_inicio_computo = '2025-09-15' WHERE name = 'Juan';

