-- Agregar campo para nombre en Ágora
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS agora_employee_name TEXT;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_employees_agora_name 
ON employees(agora_employee_name);

