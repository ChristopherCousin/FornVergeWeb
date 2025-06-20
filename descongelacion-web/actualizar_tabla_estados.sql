-- ===================================================================
-- ACTUALIZACIÓN DE TABLA PARA SEGUIMIENTO DE ESTADOS
-- ===================================================================
-- Este script añade las columnas necesarias para que la web pueda
-- hacer seguimiento de los estados de descongelación y horneado
-- ===================================================================

ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS defrost_started_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS defrost_completed_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS baking_started_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS baking_completed_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100) NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_cantidades_estados ON cantidades_calculadas(defrost_started_at, baking_started_at);
CREATE INDEX IF NOT EXISTS idx_cantidades_updated ON cantidades_calculadas(updated_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_cantidades_updated_at ON cantidades_calculadas;
CREATE TRIGGER update_cantidades_updated_at
    BEFORE UPDATE ON cantidades_calculadas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Confirmación
SELECT 'Tabla cantidades_calculadas actualizada con columnas de seguimiento' AS status; 