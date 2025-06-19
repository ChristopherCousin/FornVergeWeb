-- Tabla para guardar el progreso de descongelación
CREATE TABLE descongelacion_completados (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    dia_semana TEXT NOT NULL,
    producto TEXT NOT NULL,
    tanda TEXT NOT NULL,
    completado BOOLEAN DEFAULT true,
    completado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_descongelacion_fecha ON descongelacion_completados(fecha);
CREATE INDEX idx_descongelacion_fecha_producto ON descongelacion_completados(fecha, producto, tanda);

-- Constraint único para evitar duplicados
ALTER TABLE descongelacion_completados 
ADD CONSTRAINT unique_descongelacion_dia 
UNIQUE (fecha, producto, tanda);

-- Habilitar RLS (Row Level Security) - opcional
ALTER TABLE descongelacion_completados ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura/escritura a todos (puedes ajustarlo)
CREATE POLICY "Permitir todo acceso a descongelacion" 
ON descongelacion_completados FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Comentarios para documentar
COMMENT ON TABLE descongelacion_completados IS 'Tabla para registrar el progreso de descongelación diaria por producto y tanda';
COMMENT ON COLUMN descongelacion_completados.fecha IS 'Fecha del día (YYYY-MM-DD)';
COMMENT ON COLUMN descongelacion_completados.dia_semana IS 'Día de la semana (monday, tuesday, etc.)';
COMMENT ON COLUMN descongelacion_completados.producto IS 'Nombre del producto (Barra Clásica, etc.)';
COMMENT ON COLUMN descongelacion_completados.tanda IS 'Tanda del día (mañana, mediodía, tarde)';
COMMENT ON COLUMN descongelacion_completados.completado_at IS 'Timestamp cuando se marcó como completado'; 