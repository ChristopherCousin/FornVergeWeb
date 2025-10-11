-- =====================================================
-- ELIMINAR TABLA Y VISTA DEL GENERADOR AUTOMÁTICO
-- =====================================================
-- Ejecuta este script en Supabase para eliminar completamente
-- el sistema de generador automático de horarios

-- Eliminar la vista primero (depende de la tabla)
DROP VIEW IF EXISTS generator_config_detallado CASCADE;

-- Eliminar la tabla principal (CASCADE eliminará cualquier dependencia)
DROP TABLE IF EXISTS generator_config CASCADE;

-- Eliminar la función del trigger si existe
DROP FUNCTION IF EXISTS update_generator_config_updated_at() CASCADE;

-- Confirmar eliminación
SELECT 'Tabla generator_config y vista eliminadas correctamente' AS resultado;

