-- ============================================================================
-- AÑADIR TARIFA POR HORA A EMPLEADOS
-- ============================================================================
-- Cada empleado puede tener una tarifa diferente para las horas extra

-- Añadir columna para la tarifa por hora
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS tarifa_hora NUMERIC(5, 2) DEFAULT 15.00;

-- Comentario
COMMENT ON COLUMN employees.tarifa_hora IS 'Tarifa por hora para liquidación de horas extra (€/h)';

-- Actualizar tarifas existentes (ajusta según tus empleados)
-- Ejemplo:
-- UPDATE employees SET tarifa_hora = 18.00 WHERE name = 'MARIA';
-- UPDATE employees SET tarifa_hora = 16.00 WHERE name = 'ANA';

-- Ver empleados con sus tarifas
SELECT id, name, horas_contrato, tarifa_hora 
FROM employees 
WHERE role != 'admin'
ORDER BY name;

