-- ========================================
-- ACTUALIZAR CÓDIGOS DE ACCESO SEGUROS
-- Nombre + 4 dígitos aleatorios
-- ========================================

-- Nuevos códigos seguros (base64 encoded)
UPDATE employees 
SET access_code = encode('bryan7489'::bytea, 'base64')
WHERE name = 'Bryan';

UPDATE employees 
SET access_code = encode('raquel3156'::bytea, 'base64')
WHERE name = 'Raquel';

UPDATE employees 
SET access_code = encode('maria8924'::bytea, 'base64')
WHERE name = 'María';

UPDATE employees 
SET access_code = encode('xisca2637'::bytea, 'base64')
WHERE name = 'Xisca';

UPDATE employees 
SET access_code = encode('andrea5812'::bytea, 'base64')
WHERE name = 'Andrea';

UPDATE employees 
SET access_code = encode('gaby4173'::bytea, 'base64')
WHERE name = 'Gaby';

-- Verificar los nuevos códigos
SELECT name, access_code FROM employees ORDER BY name;

-- ========================================
-- CÓDIGOS PARA DAR A LAS EMPLEADAS:
-- ========================================
-- Bryan:   bryan7489
-- Raquel:  raquel3156
-- María:   maria8924
-- Xisca:   xisca2637
-- Andrea:  andrea5812
-- Gaby:    gaby4173
-- ======================================== 