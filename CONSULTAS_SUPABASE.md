# 📊 CONSULTAS SUPABASE - FORN VERGE

## 🔗 Configuración de Conexión

```javascript
// Configuración para conectar con Supabase
const SUPABASE_URL = 'https://csxgkxjeifakwslamglc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg'
```

## 📅 CONSULTA 1: Horarios de Esta Semana

### SQL Directo:
```sql
SELECT 
    e.name AS empleado,
    e.emoji,
    s.day_of_week AS dia,
    s.start_time AS inicio,
    s.end_time AS fin,
    s.hours AS horas,
    s.is_free_day AS dia_libre,
    s.shift_description AS descripcion,
    s.colleagues AS compañeros
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE s.week_start = (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE - 1)::integer)
ORDER BY s.day_of_week, s.start_time;
```

### Supabase JS:
```javascript
const { data, error } = await supabase
    .from('schedules')
    .select(`
        *,
        employees(name, emoji, employee_id)
    `)
    .eq('week_start', getCurrentWeekStart())
    .order('day_of_week')
    .order('start_time');
```

## 📅 CONSULTA 2: Horarios de la Próxima Semana

### SQL Directo:
```sql
SELECT 
    e.name AS empleado,
    e.emoji,
    s.day_of_week AS dia,
    s.start_time AS inicio,
    s.end_time AS fin,
    s.hours AS horas,
    s.is_free_day AS dia_libre,
    s.shift_description AS descripcion
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE s.week_start = (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE - 1)::integer + INTERVAL '7 days')
ORDER BY s.day_of_week, s.start_time;
```

### Supabase JS:
```javascript
const { data, error } = await supabase
    .from('schedules')
    .select(`
        *,
        employees(name, emoji, employee_id)
    `)
    .eq('week_start', getNextWeekStart())
    .order('day_of_week')
    .order('start_time');
```

## 👥 CONSULTA 3: Todos los Empleados

### SQL Directo:
```sql
SELECT 
    name AS nombre,
    employee_id AS id_empleado,
    emoji,
    role AS rol,
    created_at AS fecha_registro
FROM employees
ORDER BY name;
```

### Supabase JS:
```javascript
const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');
```

## 🔍 CONSULTA 4: Horarios de un Empleado Específico

### SQL Directo (Ejemplo con Raquel):
```sql
SELECT 
    e.name AS empleado,
    s.week_start AS semana,
    s.day_of_week AS dia,
    s.start_time AS inicio,
    s.end_time AS fin,
    s.hours AS horas,
    s.is_free_day AS dia_libre,
    s.shift_description AS descripcion
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE e.employee_id = 'raquel'
  AND s.week_start = '2025-06-16'  -- Cambiar por la fecha deseada
ORDER BY s.day_of_week;
```

### Supabase JS:
```javascript
const { data, error } = await supabase
    .from('schedules')
    .select(`
        *,
        employees(name, emoji, employee_id)
    `)
    .eq('week_start', '2025-06-16')
    .filter('employees.employee_id', 'eq', 'raquel')
    .order('day_of_week');
```

## 📊 CONSULTA 5: Resumen Semanal

### SQL Directo:
```sql
SELECT 
    e.name AS empleado,
    e.emoji,
    COUNT(CASE WHEN s.is_free_day = false THEN 1 END) AS dias_trabajo,
    SUM(CASE WHEN s.is_free_day = false THEN s.hours ELSE 0 END) AS total_horas,
    COUNT(CASE WHEN s.is_free_day = true THEN 1 END) AS dias_libres
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE s.week_start = '2025-06-16'  -- Cambiar por la fecha deseada
GROUP BY e.name, e.emoji
ORDER BY total_horas DESC;
```

## 🗓️ CONSULTA 6: Horarios por Día Específico

### SQL Directo (Ejemplo Lunes):
```sql
SELECT 
    e.name AS empleado,
    e.emoji,
    s.start_time AS inicio,
    s.end_time AS fin,
    s.hours AS horas,
    s.shift_description AS descripcion,
    s.colleagues AS compañeros
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE s.week_start = '2025-06-16'
  AND s.day_of_week = 'lunes'
  AND s.is_free_day = false
ORDER BY s.start_time;
```

## 🔄 CONSULTA 7: Insertar Nuevos Horarios

### Para crear horarios de Raquel (todos los días menos sábado):
```sql
-- Primero obtener el ID de Raquel
SELECT id FROM employees WHERE employee_id = 'raquel';

-- Insertar horarios (reemplazar UUID_DE_RAQUEL con el ID obtenido)
INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, is_free_day, shift_description, colleagues) VALUES
('UUID_DE_RAQUEL', '2025-06-23', 'lunes', '07:00:00', '14:00:00', 7, false, 'Turno mañana', ARRAY['Gaby']),
('UUID_DE_RAQUEL', '2025-06-23', 'martes', '07:00:00', '14:00:00', 7, false, 'Turno mañana', ARRAY['Gaby']),
('UUID_DE_RAQUEL', '2025-06-23', 'miercoles', '07:00:00', '14:00:00', 7, false, 'Turno mañana', ARRAY['Gaby']),
('UUID_DE_RAQUEL', '2025-06-23', 'jueves', '07:00:00', '14:00:00', 7, false, 'Turno mañana', ARRAY['Gaby']),
('UUID_DE_RAQUEL', '2025-06-23', 'viernes', '07:00:00', '14:00:00', 7, false, 'Turno mañana', ARRAY['Gaby']),
('UUID_DE_RAQUEL', '2025-06-23', 'sabado', NULL, NULL, 0, true, 'Día libre', ARRAY[]::TEXT[]),
('UUID_DE_RAQUEL', '2025-06-23', 'domingo', '07:00:00', '14:00:00', 7, false, 'Turno mañana', ARRAY['Gaby']);
```

### Para crear horarios de Gaby (apoyo todos los días):
```sql
-- Primero obtener el ID de Gaby
SELECT id FROM employees WHERE employee_id = 'gaby';

-- Insertar horarios (reemplazar UUID_DE_GABY con el ID obtenido)
INSERT INTO schedules (employee_id, week_start, day_of_week, start_time, end_time, hours, is_free_day, shift_description, colleagues) VALUES
('UUID_DE_GABY', '2025-06-23', 'lunes', '09:00:00', '13:00:00', 4, false, 'Apoyo', ARRAY['Raquel']),
('UUID_DE_GABY', '2025-06-23', 'martes', '09:00:00', '13:00:00', 4, false, 'Apoyo', ARRAY['Raquel']),
('UUID_DE_GABY', '2025-06-23', 'miercoles', '09:00:00', '13:00:00', 4, false, 'Apoyo', ARRAY['Raquel']),
('UUID_DE_GABY', '2025-06-23', 'jueves', '09:00:00', '13:00:00', 4, false, 'Apoyo', ARRAY['Raquel']),
('UUID_DE_GABY', '2025-06-23', 'viernes', '09:00:00', '13:00:00', 4, false, 'Apoyo', ARRAY['Raquel']),
('UUID_DE_GABY', '2025-06-23', 'sabado', '09:00:00', '13:00:00', 4, false, 'Apoyo', ARRAY[]::TEXT[]),
('UUID_DE_GABY', '2025-06-23', 'domingo', '09:00:00', '13:00:00', 4, false, 'Apoyo', ARRAY['Raquel']);
```

## 🛠️ CONSULTAS ÚTILES ADICIONALES

### Ver todas las semanas con horarios:
```sql
SELECT DISTINCT week_start, 
       COUNT(*) as total_registros
FROM schedules 
GROUP BY week_start 
ORDER BY week_start DESC;
```

### Eliminar horarios de una semana específica:
```sql
DELETE FROM schedules 
WHERE week_start = '2025-06-16';
```

### Actualizar horario específico:
```sql
UPDATE schedules 
SET start_time = '08:00:00', 
    end_time = '15:00:00', 
    hours = 7,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM employees WHERE employee_id = 'raquel')
  AND week_start = '2025-06-16'
  AND day_of_week = 'lunes';
```

## 📱 Comandos para Ejecutar Scripts

```bash
# Instalar dependencias
npm install @supabase/supabase-js

# Consultar horarios actuales y crear próximos
node consulta_horarios.js

# Ver todas las consultas con SQL
node consultas_supabase.js
```

## 🎯 RESULTADO ACTUAL

**Semana del 16 de Junio 2025:**
- **Raquel**: Trabaja 07:00-14:00 (7h) de Lunes a Viernes y Domingo. Sábado libre.
- **Gaby**: Apoyo 09:00-13:00 (4h) todos los días.

**Total horas semanales:**
- Raquel: 42 horas (6 días)
- Gaby: 28 horas (7 días) 