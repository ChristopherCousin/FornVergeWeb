-- ================================================================
-- AÑADIR EMPLEADA: MERCEDES
-- ================================================================
-- Este script añade a Mercedes como empleada al sistema de horarios
-- Ejecutar en Supabase SQL Editor

INSERT INTO employees (name, emoji, employee_id, access_code, role) VALUES
('MERCEDES', '👩‍💼', 'mercedes', 'bWVyY2VkZXMyMDI1', 'employee')
ON CONFLICT (employee_id) DO NOTHING;

-- Verificar que se añadió correctamente
SELECT name, emoji, employee_id, role 
FROM employees 
WHERE employee_id = 'mercedes';

-- ================================================================
-- INFORMACIÓN DE ACCESO PARA MERCEDES:
-- ================================================================
-- Employee ID: mercedes
-- Access Code: mercedes2025 (codificado como: bWVyY2VkZXMyMDI1)
-- Rol: employee
-- ================================================================ 