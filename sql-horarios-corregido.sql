-- ================================================================
-- SCRIPT CORREGIDO: Nuevos Horarios Semana 9-15 Febrero 2025
-- Arrays en formato PostgreSQL correcto: {"item1","item2"}
-- ================================================================

-- 1. BORRAR TODOS LOS SCHEDULES ACTUALES
-- ================================================================
DELETE FROM schedules WHERE week_start = '2025-02-09';
DELETE FROM schedules WHERE week_start = '2025-01-13'; -- Por si acaso quedan de la anterior

-- 2. CREAR NUEVA EMPLEADA: GABY
-- ================================================================
INSERT INTO employees (
    id,
    name,
    emoji,
    employee_id,
    access_code,
    role,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'GABY',
    '👩‍🍳',
    'gaby',
    encode('gaby2025', 'base64'),
    'employee',
    NOW(),
    NOW()
) ON CONFLICT (employee_id) DO NOTHING;

-- 3. INSERTAR NUEVOS HORARIOS SEGÚN LA TABLA
-- ================================================================

-- LUNES 09 FEBRERO
INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, is_free_day, colleagues, created_at, updated_at) VALUES 
-- Mañana: Andrea + Xisca
('3efd8270-f463-4c2c-9fd2-7dc6ad2f531e', '2025-02-09', 'lunes', '07:00:00', '14:00:00', 7, false, '{"XISCA"}', NOW(), NOW()),
('ae4a4aa4-f686-4000-ab83-8708822008e9', '2025-02-09', 'lunes', '07:00:00', '14:00:00', 7, false, '{"ANDREA"}', NOW(), NOW()),
-- Tarde: María + Bryan
('8c4e85ab-fe36-498b-9b45-3c3f81abf544', '2025-02-09', 'lunes', '14:00:00', '21:00:00', 7, false, '{"BRYAN"}', NOW(), NOW()),
('e97f1ea0-71ff-48da-978f-901299661c37', '2025-02-09', 'lunes', '14:00:00', '21:00:00', 7, false, '{"MARÍA"}', NOW(), NOW()),
-- Libre: Raquel
('3b4c6890-8775-454f-8b60-55ba24a73de7', '2025-02-09', 'lunes', NULL, NULL, 0, true, '{}', NOW(), NOW());

-- MARTES 10 FEBRERO
INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, is_free_day, colleagues, created_at, updated_at) VALUES 
-- Mañana: Andrea + Xisca
('3efd8270-f463-4c2c-9fd2-7dc6ad2f531e', '2025-02-09', 'martes', '07:00:00', '14:00:00', 7, false, '{"XISCA"}', NOW(), NOW()),
('ae4a4aa4-f686-4000-ab83-8708822008e9', '2025-02-09', 'martes', '07:00:00', '14:00:00', 7, false, '{"ANDREA"}', NOW(), NOW()),
-- Tarde: Bryan + Gaby
('e97f1ea0-71ff-48da-978f-901299661c37', '2025-02-09', 'martes', '14:00:00', '21:00:00', 7, false, '{"GABY"}', NOW(), NOW()),
((SELECT id FROM employees WHERE employee_id = 'gaby'), '2025-02-09', 'martes', '14:00:00', '21:00:00', 7, false, '{"BRYAN"}', NOW(), NOW()),
-- Libre: María, Raquel
('8c4e85ab-fe36-498b-9b45-3c3f81abf544', '2025-02-09', 'martes', NULL, NULL, 0, true, '{}', NOW(), NOW()),
('3b4c6890-8775-454f-8b60-55ba24a73de7', '2025-02-09', 'martes', NULL, NULL, 0, true, '{}', NOW(), NOW());

-- MIÉRCOLES 11 FEBRERO
INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, is_free_day, colleagues, created_at, updated_at) VALUES 
-- Mañana: Andrea (sola)
('3efd8270-f463-4c2c-9fd2-7dc6ad2f531e', '2025-02-09', 'miercoles', '07:00:00', '14:00:00', 7, false, '{}', NOW(), NOW()),
-- Partido: Xisca (sola)
('ae4a4aa4-f686-4000-ab83-8708822008e9', '2025-02-09', 'miercoles', '08:30:00', '12:30:00', 4, false, '{}', NOW(), NOW()),
-- Tarde: María (sola)
('8c4e85ab-fe36-498b-9b45-3c3f81abf544', '2025-02-09', 'miercoles', '14:00:00', '21:00:00', 7, false, '{}', NOW(), NOW()),
-- Libre: Bryan, Raquel, Gaby
('e97f1ea0-71ff-48da-978f-901299661c37', '2025-02-09', 'miercoles', NULL, NULL, 0, true, '{}', NOW(), NOW()),
('3b4c6890-8775-454f-8b60-55ba24a73de7', '2025-02-09', 'miercoles', NULL, NULL, 0, true, '{}', NOW(), NOW()),
((SELECT id FROM employees WHERE employee_id = 'gaby'), '2025-02-09', 'miercoles', NULL, NULL, 0, true, '{}', NOW(), NOW());

-- JUEVES 12 FEBRERO
INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, is_free_day, colleagues, created_at, updated_at) VALUES 
-- Mañana: Raquel + Andrea
('3b4c6890-8775-454f-8b60-55ba24a73de7', '2025-02-09', 'jueves', '07:00:00', '14:00:00', 7, false, '{"ANDREA"}', NOW(), NOW()),
('3efd8270-f463-4c2c-9fd2-7dc6ad2f531e', '2025-02-09', 'jueves', '07:00:00', '14:00:00', 7, false, '{"RAQUEL"}', NOW(), NOW()),
-- Tarde: María (14:00-21:00) + Bryan (17:00-21:00)
('8c4e85ab-fe36-498b-9b45-3c3f81abf544', '2025-02-09', 'jueves', '14:00:00', '21:00:00', 7, false, '{"BRYAN"}', NOW(), NOW()),
('e97f1ea0-71ff-48da-978f-901299661c37', '2025-02-09', 'jueves', '17:00:00', '21:00:00', 4, false, '{"MARÍA"}', NOW(), NOW()),
-- Libre: Xisca, Gaby
('ae4a4aa4-f686-4000-ab83-8708822008e9', '2025-02-09', 'jueves', NULL, NULL, 0, true, '{}', NOW(), NOW()),
((SELECT id FROM employees WHERE employee_id = 'gaby'), '2025-02-09', 'jueves', NULL, NULL, 0, true, '{}', NOW(), NOW());

-- VIERNES 13 FEBRERO
INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, is_free_day, colleagues, created_at, updated_at) VALUES 
-- Mañana: Raquel + Xisca
('3b4c6890-8775-454f-8b60-55ba24a73de7', '2025-02-09', 'viernes', '07:00:00', '14:00:00', 7, false, '{"XISCA"}', NOW(), NOW()),
('ae4a4aa4-f686-4000-ab83-8708822008e9', '2025-02-09', 'viernes', '07:00:00', '14:00:00', 7, false, '{"RAQUEL"}', NOW(), NOW()),
-- Tarde: María + Bryan
('8c4e85ab-fe36-498b-9b45-3c3f81abf544', '2025-02-09', 'viernes', '14:00:00', '21:00:00', 7, false, '{"BRYAN"}', NOW(), NOW()),
('e97f1ea0-71ff-48da-978f-901299661c37', '2025-02-09', 'viernes', '14:00:00', '21:00:00', 7, false, '{"MARÍA"}', NOW(), NOW()),
-- Libre: Andrea, Gaby
('3efd8270-f463-4c2c-9fd2-7dc6ad2f531e', '2025-02-09', 'viernes', NULL, NULL, 0, true, '{}', NOW(), NOW()),
((SELECT id FROM employees WHERE employee_id = 'gaby'), '2025-02-09', 'viernes', NULL, NULL, 0, true, '{}', NOW(), NOW());

-- SÁBADO 14 FEBRERO
INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, is_free_day, colleagues, created_at, updated_at) VALUES 
-- Mañana: Andrea + Xisca
('3efd8270-f463-4c2c-9fd2-7dc6ad2f531e', '2025-02-09', 'sabado', '07:00:00', '14:00:00', 7, false, '{"XISCA"}', NOW(), NOW()),
('ae4a4aa4-f686-4000-ab83-8708822008e9', '2025-02-09', 'sabado', '07:00:00', '14:00:00', 7, false, '{"ANDREA"}', NOW(), NOW()),
-- Tarde: María + Bryan
('8c4e85ab-fe36-498b-9b45-3c3f81abf544', '2025-02-09', 'sabado', '14:00:00', '21:00:00', 7, false, '{"BRYAN"}', NOW(), NOW()),
('e97f1ea0-71ff-48da-978f-901299661c37', '2025-02-09', 'sabado', '14:00:00', '21:00:00', 7, false, '{"MARÍA"}', NOW(), NOW()),
-- Refuerzo: Gaby (sola)
((SELECT id FROM employees WHERE employee_id = 'gaby'), '2025-02-09', 'sabado', '09:00:00', '13:00:00', 4, false, '{}', NOW(), NOW()),
-- Libre: Raquel
('3b4c6890-8775-454f-8b60-55ba24a73de7', '2025-02-09', 'sabado', NULL, NULL, 0, true, '{}', NOW(), NOW());

-- DOMINGO 15 FEBRERO
INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, is_free_day, colleagues, created_at, updated_at) VALUES 
-- Mañana: Raquel + Andrea
('3b4c6890-8775-454f-8b60-55ba24a73de7', '2025-02-09', 'domingo', '07:00:00', '14:00:00', 7, false, '{"ANDREA"}', NOW(), NOW()),
('3efd8270-f463-4c2c-9fd2-7dc6ad2f531e', '2025-02-09', 'domingo', '07:00:00', '14:00:00', 7, false, '{"RAQUEL"}', NOW(), NOW()),
-- Tarde: María + Xisca
('8c4e85ab-fe36-498b-9b45-3c3f81abf544', '2025-02-09', 'domingo', '14:00:00', '21:00:00', 7, false, '{"XISCA"}', NOW(), NOW()),
('ae4a4aa4-f686-4000-ab83-8708822008e9', '2025-02-09', 'domingo', '14:00:00', '21:00:00', 7, false, '{"MARÍA"}', NOW(), NOW()),
-- Libre: Bryan, Gaby
('e97f1ea0-71ff-48da-978f-901299661c37', '2025-02-09', 'domingo', NULL, NULL, 0, true, '{}', NOW(), NOW()),
((SELECT id FROM employees WHERE employee_id = 'gaby'), '2025-02-09', 'domingo', NULL, NULL, 0, true, '{}', NOW(), NOW());

-- 4. VERIFICACIÓN FINAL
-- ================================================================
-- Contar horarios insertados
SELECT 
    'Total horarios insertados' as descripcion,
    COUNT(*) as cantidad
FROM schedules 
WHERE week_start = '2025-02-09';

-- Ver resumen por empleado
SELECT 
    e.name,
    e.employee_id,
    COUNT(s.id) as dias_trabajados,
    SUM(s.hours) as horas_totales
FROM employees e
LEFT JOIN schedules s ON e.id = s.employee_id AND s.week_start = '2025-02-09'
WHERE e.role = 'employee'
GROUP BY e.id, e.name, e.employee_id
ORDER BY e.name;

-- ================================================================
-- FIN DEL SCRIPT CORREGIDO
-- ================================================================ 