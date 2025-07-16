-- ================================================================
-- SCRIPT PARA ELIMINAR COMPLETAMENTE A ANDREA DEL SISTEMA
-- ================================================================
-- IMPORTANTE: Este script eliminará TODOS los datos de Andrea
-- Ejecutar en Supabase SQL Editor con PRECAUCIÓN
-- ================================================================

-- PASO 1: Buscar información de Andrea
DO $$
DECLARE
    andrea_id UUID;
    total_schedules INTEGER;
    total_ausencias INTEGER;
    total_fichajes INTEGER;
    total_changes INTEGER;
BEGIN
    -- Encontrar el ID de Andrea
    SELECT id INTO andrea_id 
    FROM employees 
    WHERE name ILIKE 'ANDREA' OR employee_id = 'andrea';
    
    IF andrea_id IS NULL THEN
        RAISE NOTICE '❌ ANDREA no encontrada en la base de datos';
        RETURN;
    END IF;
    
    RAISE NOTICE '👤 ANDREA encontrada con ID: %', andrea_id;
    
    -- Contar registros existentes
    SELECT COUNT(*) INTO total_schedules FROM schedules WHERE employee_id = andrea_id;
    SELECT COUNT(*) INTO total_ausencias FROM ausencias WHERE empleado_id = andrea_id;
    SELECT COUNT(*) INTO total_fichajes FROM fichajes WHERE empleado_id = andrea_id;
    
    -- Contar cambios solo si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedule_changes') THEN
        SELECT COUNT(*) INTO total_changes FROM schedule_changes WHERE employee_id = andrea_id;
    ELSE
        total_changes := 0;
    END IF;
    
    RAISE NOTICE '📊 REGISTROS DE ANDREA:';
    RAISE NOTICE '   • Horarios (schedules): %', total_schedules;
    RAISE NOTICE '   • Ausencias: %', total_ausencias;
    RAISE NOTICE '   • Fichajes: %', total_fichajes;
    RAISE NOTICE '   • Cambios de horario: %', total_changes;
    
    -- PASO 2: Eliminar todos los registros relacionados
    RAISE NOTICE '🗑️ INICIANDO ELIMINACIÓN...';
    
    -- 2a. Eliminar horarios (schedules)
    DELETE FROM schedules WHERE employee_id = andrea_id;
    GET DIAGNOSTICS total_schedules = ROW_COUNT;
    RAISE NOTICE '✅ Eliminados % horarios', total_schedules;
    
    -- 2b. Eliminar historial de cambios (schedule_changes) - SI EXISTE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedule_changes') THEN
        DELETE FROM schedule_changes WHERE employee_id = andrea_id;
        GET DIAGNOSTICS total_changes = ROW_COUNT;
        RAISE NOTICE '✅ Eliminados % cambios de horario', total_changes;
    ELSE
        RAISE NOTICE '📝 Tabla schedule_changes no existe - saltando';
        total_changes := 0;
    END IF;
    
    -- 2c. Eliminar ausencias
    DELETE FROM ausencias WHERE empleado_id = andrea_id;
    GET DIAGNOSTICS total_ausencias = ROW_COUNT;
    RAISE NOTICE '✅ Eliminadas % ausencias', total_ausencias;
    
    -- 2d. Eliminar fichajes
    DELETE FROM fichajes WHERE empleado_id = andrea_id;
    GET DIAGNOSTICS total_fichajes = ROW_COUNT;
    RAISE NOTICE '✅ Eliminados % fichajes', total_fichajes;
    
    -- PASO 3: Eliminar registro de empleado
    DELETE FROM employees WHERE id = andrea_id;
    RAISE NOTICE '✅ Eliminado registro de empleado ANDREA';
    
    RAISE NOTICE '🎉 ANDREA ha sido eliminada completamente del sistema';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error durante la eliminación: %', SQLERRM;
END $$;

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================

-- Verificar que Andrea no existe en ninguna tabla
DO $$
BEGIN
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL:';
    
    -- Verificar employees
    IF EXISTS (SELECT 1 FROM employees WHERE name ILIKE 'ANDREA' OR employee_id = 'andrea') THEN
        RAISE NOTICE '❌ ANDREA todavía existe en employees';
    ELSE
        RAISE NOTICE '✅ ANDREA eliminada de employees';
    END IF;
    
    -- Verificar schedules
    IF EXISTS (SELECT 1 FROM schedules s JOIN employees e ON s.employee_id = e.id WHERE e.name ILIKE 'ANDREA') THEN
        RAISE NOTICE '❌ Horarios de ANDREA todavía existen';
    ELSE
        RAISE NOTICE '✅ Horarios de ANDREA eliminados';
    END IF;
    
    -- Verificar ausencias  
    IF EXISTS (SELECT 1 FROM ausencias a JOIN employees e ON a.empleado_id = e.id WHERE e.name ILIKE 'ANDREA') THEN
        RAISE NOTICE '❌ Ausencias de ANDREA todavía existen';
    ELSE
        RAISE NOTICE '✅ Ausencias de ANDREA eliminadas';
    END IF;
    
    -- Verificar fichajes
    IF EXISTS (SELECT 1 FROM fichajes f JOIN employees e ON f.empleado_id = e.id WHERE e.name ILIKE 'ANDREA') THEN
        RAISE NOTICE '❌ Fichajes de ANDREA todavía existen';
    ELSE
        RAISE NOTICE '✅ Fichajes de ANDREA eliminados';
    END IF;
    
    RAISE NOTICE '✨ VERIFICACIÓN COMPLETADA';
END $$;

-- ================================================================
-- CONSULTAS PARA VERIFICAR MANUALMENTE (OPCIONAL)
-- ================================================================

-- Verificar empleados restantes
SELECT name, employee_id, role, created_at 
FROM employees 
ORDER BY name;

-- Verificar que no hay horarios huérfanos
SELECT COUNT(*) as horarios_sin_empleado
FROM schedules s 
LEFT JOIN employees e ON s.employee_id = e.id 
WHERE e.id IS NULL;

-- ================================================================
-- INSTRUCCIONES DE USO:
-- ================================================================
-- 1. Copiar todo este script
-- 2. Ir a Supabase → SQL Editor
-- 3. Pegar el script
-- 4. Revisar que dice "ANDREA" (no otra persona)
-- 5. Ejecutar con el botón "Run"
-- 6. Revisar los mensajes de confirmación
-- 7. ¡Andrea será eliminada para siempre!
-- ================================================================ 