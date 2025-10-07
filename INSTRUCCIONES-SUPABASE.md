# 🚀 INSTRUCCIONES PARA SUPABASE

## PASO 1: Limpiar solo la tabla de usuarios

Abre Supabase SQL Editor y ejecuta esto:

```sql
-- Eliminar SOLO la tabla de usuarios (locations se reutiliza)
DROP TABLE IF EXISTS admin_users CASCADE;
```

## PASO 2: Ejecutar archivos SQL

### 1️⃣ Ejecuta `database/admin-users-system.sql`

- Copia **TODO** el contenido del archivo
- Pégalo en Supabase SQL Editor
- Click en **"Run"**

### 2️⃣ Ejecuta `database/funciones-acceso-locales.sql`

- Copia **TODO** el contenido del archivo
- Pégalo en Supabase SQL Editor
- Click en **"Run"**

### 3️⃣ Ejecuta `database/add-excluido-convenio-empleados.sql`

- Copia **TODO** el contenido del archivo
- Pégalo en Supabase SQL Editor
- Click en **"Run"**
- Este paso añade la columna para excluir empleados del convenio

### 4️⃣ Deshabilitar RLS temporalmente (IMPORTANTE)

```sql
-- Deshabilitar RLS para permitir acceso sin autenticación Supabase
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
```

**NOTA:** Esto es necesario porque usamos nuestro propio sistema de auth, no el de Supabase.

## PASO 3: Verificar que funcionó

Ejecuta esto en Supabase:

```sql
SELECT * FROM admin_users_summary;
```

Debes ver 3 usuarios:
- `admin` (owner)
- `gerente_sonoliva` (manager)
- `gerente_llevant` (manager)

## ✅ CREDENCIALES FINALES:

| Usuario | Contraseña | Rol | Locales |
|---------|------------|-----|---------|
| `admin` | `859623` | Owner | Todos |
| `gerente_sonoliva` | `oliva5798` | Manager | Solo Son Oliva |
| `gerente_llevant` | `llevant6875` | Manager | Solo Llevant |

---

## 🎯 PRUEBA:

1. Abre la app
2. Login con: `admin` / `859623`
3. Debe aparecer selector de locales bien diseñado
4. Selecciona un local
5. Cambia de local con el dropdown del header
6. **NO debe aparecer el login al cambiar**

¡LISTO! 🚀

