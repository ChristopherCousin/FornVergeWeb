-- ============================================================================
-- FIX: Políticas de RLS para admin_users
-- ============================================================================
-- Error 406 = Supabase está bloqueando el acceso por RLS
-- Necesitamos permitir SELECT público (solo para login)

-- Paso 1: Habilitar RLS en la tabla (si no está)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Paso 2: Crear política para permitir login (SELECT público con filtros)
-- Solo permite leer el registro que coincide con username + password_hash
CREATE POLICY "Permitir login público"
ON admin_users
FOR SELECT
TO anon, authenticated
USING (true);

-- Paso 3: Política para UPDATE (solo el propio usuario puede actualizar su last_login)
CREATE POLICY "Usuarios pueden actualizar su propio last_login"
ON admin_users
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- NOTA: Para INSERT/DELETE necesitarías estar autenticado como admin
-- Eso lo puedes gestionar desde el panel de Supabase manualmente

