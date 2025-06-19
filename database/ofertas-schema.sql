-- ================================================================
-- TABLA OFERTAS - FORN VERGE DE LLUC
-- Sistema de ofertas dinámicas con gestión admin
-- ================================================================

-- TABLA: offers (ofertas)
CREATE TABLE IF NOT EXISTS offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category = ANY (ARRAY[
        'panaderia'::text, 
        'pasteleria'::text, 
        'bar'::text, 
        'cafe'::text, 
        'desayuno'::text, 
        'merienda'::text, 
        'especial'::text, 
        'combo'::text, 
        'descuento'::text, 
        'regalo'::text
    ])),
    original_price DECIMAL(10,2),
    offer_price DECIMAL(10,2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
    terms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by TEXT DEFAULT 'admin'
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_offers_active_dates 
ON offers (is_active, start_date, end_date) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_offers_priority 
ON offers (priority DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offers_category 
ON offers (category);

-- ================================================================
-- FUNCIÓN PARA OBTENER OFERTAS ACTIVAS HOY
-- ================================================================

CREATE OR REPLACE FUNCTION get_active_offers_today()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    original_price DECIMAL(10,2),
    offer_price DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    priority INTEGER,
    terms TEXT,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.title,
        o.description,
        o.category,
        o.original_price,
        o.offer_price,
        o.start_date,
        o.end_date,
        o.priority,
        o.terms,
        (o.end_date - CURRENT_DATE)::INTEGER as days_remaining
    FROM offers o
    WHERE o.is_active = true
    AND o.start_date <= CURRENT_DATE
    AND o.end_date >= CURRENT_DATE
    ORDER BY o.priority DESC, o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIÓN PARA ESTADÍSTICAS DE OFERTAS
-- ================================================================

CREATE OR REPLACE FUNCTION get_offers_stats()
RETURNS TABLE (
    total_offers BIGINT,
    active_offers BIGINT,
    today_offers BIGINT,
    featured_offers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM offers) as total_offers,
        (SELECT COUNT(*) FROM offers WHERE is_active = true) as active_offers,
        (SELECT COUNT(*) FROM offers 
         WHERE is_active = true 
         AND start_date <= CURRENT_DATE 
         AND end_date >= CURRENT_DATE) as today_offers,
        (SELECT COUNT(*) FROM offers 
         WHERE is_active = true 
         AND priority >= 3
         AND start_date <= CURRENT_DATE 
         AND end_date >= CURRENT_DATE) as featured_offers;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_offers_updated_at 
BEFORE UPDATE ON offers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- RLS (ROW LEVEL SECURITY) - OPCIONAL
-- ================================================================

-- Habilitar RLS si quieres control de acceso
-- ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (cualquiera puede ver ofertas activas)
-- CREATE POLICY "Ofertas públicas lectura" ON offers FOR SELECT USING (is_active = true);

-- Política para admin (solo usuarios autenticados pueden gestionar)
-- CREATE POLICY "Admin ofertas gestión" ON offers FOR ALL USING (auth.role() = 'authenticated');

-- ================================================================
-- DATOS DE EJEMPLO PARA TESTING
-- ================================================================

INSERT INTO offers (
    title, 
    description, 
    category, 
    original_price, 
    offer_price, 
    start_date, 
    end_date, 
    priority, 
    terms
) VALUES 
(
    'Desayuno Mallorquín Completo',
    'Café con leche + ensaimada tradicional + zumo de naranja natural del día',
    'desayuno',
    8.50,
    6.90,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    3,
    'Válido hasta las 12:00h' || chr(10) || 'No acumulable con otras ofertas' || chr(10) || 'Sujeto a disponibilidad'
),
(
    'Pan Artesanal 20% Descuento',
    'Descuento especial en todo nuestro pan artesanal horneado en el día',
    'panaderia',
    NULL,
    NULL,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    2,
    'Aplicable solo a pan del día' || chr(10) || 'No válido para pedidos especiales' || chr(10) || 'Hasta agotar existencias'
),
(
    'Tarde de Tapas y Cervezas',
    '2 cañas artesanales + selección de 3 tapas caseras por precio especial',
    'bar',
    12.00,
    9.50,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days',
    1,
    'Válido de 17:00 a 20:00h' || chr(10) || 'Solo fines de semana' || chr(10) || 'Reserva recomendada'
),
(
    'Combo Merienda Familiar',
    'Selección de 6 pasteles tradicionales + 2 cafés + 2 chocolates calientes',
    'combo',
    18.00,
    14.90,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '21 days',
    2,
    'Ideal para compartir' || chr(10) || 'Válido tardes después de las 16:00h' || chr(10) || 'Pasteles según disponibilidad'
),
(
    'Café Especial de Temporada',
    'Prueba nuestro nuevo blend de café de temporada con notas de almendra y vainilla',
    'cafe',
    3.50,
    2.80,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '10 days',
    3,
    'Disponible mientras duren las existencias' || chr(10) || 'Solo en modalidad para llevar o en local' || chr(10) || 'Edición limitada'
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- VISTA PARA CONSULTAS FÁCILES
-- ================================================================

CREATE OR REPLACE VIEW active_offers_view AS
SELECT 
    id,
    title,
    description,
    category,
    original_price,
    offer_price,
    CASE 
        WHEN original_price IS NOT NULL AND offer_price IS NOT NULL 
        THEN (original_price - offer_price)
        ELSE NULL 
    END as savings,
    start_date,
    end_date,
    (end_date - CURRENT_DATE)::INTEGER as days_remaining,
    priority,
    CASE 
        WHEN priority >= 3 THEN 'Alta'
        WHEN priority = 2 THEN 'Media'
        ELSE 'Normal'
    END as priority_text,
    terms,
    created_at,
    updated_at
FROM offers
WHERE is_active = true
AND start_date <= CURRENT_DATE
AND end_date >= CURRENT_DATE
ORDER BY priority DESC, created_at DESC;

-- ================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ================================================================

COMMENT ON TABLE offers IS 'Tabla de ofertas especiales para la panadería Forn Verge de Lluc';
COMMENT ON COLUMN offers.category IS 'Categoría de la oferta: panaderia, pasteleria, bar, cafe, etc.';
COMMENT ON COLUMN offers.priority IS 'Prioridad de la oferta: 1=Normal, 2=Media, 3=Alta/Destacada';
COMMENT ON COLUMN offers.original_price IS 'Precio original (opcional, para mostrar descuento)';
COMMENT ON COLUMN offers.offer_price IS 'Precio de la oferta (opcional, puede ser texto como "Precio especial")';
COMMENT ON COLUMN offers.terms IS 'Términos y condiciones, separados por saltos de línea';

-- ================================================================
-- VERIFICAR INSTALACIÓN
-- ================================================================

-- Verificar que todo se creó correctamente
DO $$
BEGIN
    RAISE NOTICE 'Verificando instalación...';
    
    -- Verificar tabla
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers') THEN
        RAISE NOTICE '✓ Tabla offers creada correctamente';
    ELSE
        RAISE EXCEPTION '✗ Error: Tabla offers no encontrada';
    END IF;
    
    -- Verificar funciones
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_active_offers_today') THEN
        RAISE NOTICE '✓ Función get_active_offers_today creada correctamente';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_offers_stats') THEN
        RAISE NOTICE '✓ Función get_offers_stats creada correctamente';
    END IF;
    
    -- Verificar datos de ejemplo
    PERFORM count(*) FROM offers;
    IF FOUND THEN
        RAISE NOTICE '✓ Datos de ejemplo insertados correctamente';
    END IF;
    
    RAISE NOTICE '🎉 Instalación de sistema de ofertas completada con éxito!';
END $$; 