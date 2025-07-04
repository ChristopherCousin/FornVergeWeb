-- TABLA SIMPLE DE FICHAJES
-- Solo migrar WorkingPeriod desde Ágora, interpretar desde frontend

-- 1. Tabla simple de fichajes
CREATE TABLE IF NOT EXISTS fichajes (
    id BIGSERIAL PRIMARY KEY,
    empleado_id UUID NOT NULL REFERENCES employees(id),
    fecha DATE NOT NULL,
    entrada TIMESTAMP WITH TIME ZONE,
    salida TIMESTAMP WITH TIME ZONE,
    horas_trabajadas DECIMAL(4,2),
    completado BOOLEAN DEFAULT false,
    agora_id INTEGER UNIQUE, -- ID original de Ágora
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para consultas rápidas
CREATE INDEX idx_fichajes_empleado_fecha ON fichajes(empleado_id, fecha);
CREATE INDEX idx_fichajes_fecha ON fichajes(fecha);
CREATE INDEX idx_fichajes_agora_id ON fichajes(agora_id);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fichajes_updated_at 
    BEFORE UPDATE ON fichajes 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. RLS (Row Level Security) - DESHABILITADO PARA MIGRACIÓN
-- ALTER TABLE fichajes ENABLE ROW LEVEL SECURITY;

-- Política más permisiva para migración
-- CREATE POLICY "Allow all operations" 
--     ON fichajes FOR ALL 
--     TO public 
--     USING (true)
--     WITH CHECK (true);

-- NOTA: Ejecutar después de la migración para habilitar RLS:
-- ALTER TABLE fichajes ENABLE ROW LEVEL SECURITY;

-- 5. Comentarios
COMMENT ON TABLE fichajes IS 'Fichajes migrados desde Ágora - tabla principal para análisis convenio';
COMMENT ON COLUMN fichajes.empleado_id IS 'ID del empleado (FK a employees existente)';
COMMENT ON COLUMN fichajes.agora_id IS 'ID original del WorkingPeriod en Ágora';
COMMENT ON COLUMN fichajes.horas_trabajadas IS 'Horas calculadas del turno';

-- 6. Datos de ejemplo (puedes borrar después)
-- Nota: Reemplazar UUIDs por los reales de tu tabla employees
-- INSERT INTO fichajes (empleado_id, fecha, entrada, salida, horas_trabajadas, completado, agora_id) VALUES
-- ('uuid-del-empleado-1', '2025-06-20', '2025-06-20 07:00:00+00', '2025-06-20 14:00:00+00', 7.00, true, 999999),
-- ('uuid-del-empleado-2', '2025-06-20', '2025-06-20 14:00:00+00', '2025-06-20 21:00:00+00', 7.00, true, 999998)
-- ON CONFLICT (agora_id) DO NOTHING; 