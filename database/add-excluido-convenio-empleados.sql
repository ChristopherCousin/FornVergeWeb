/**
 * AÑADIR CAMPO PARA EXCLUIR EMPLEADOS DEL CONVENIO
 * =================================================
 * Permite marcar empleados que no están sujetos al convenio (socios, autónomos, etc)
 */

-- Añadir columna excluido_convenio a employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS excluido_convenio BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN employees.excluido_convenio IS 'Indica si el empleado está excluido del análisis del convenio (socios, autónomos, etc)';

-- Marcar a Bryan como excluido (migración del hardcode)
UPDATE employees 
SET excluido_convenio = TRUE 
WHERE UPPER(name) LIKE '%BRYAN%';

-- Verificar
SELECT id, name, excluido_convenio 
FROM employees 
WHERE excluido_convenio = TRUE;

