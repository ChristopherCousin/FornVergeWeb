# 🏢 Sistema Multi-Local - MASSA

## 📋 Resumen

El sistema de gestión de horarios ahora soporta **múltiples locales**:

- **MASSA Llevant** (local original)
- **MASSA Son Oliva** (nuevo local)

## 📁 Estructura de Carpetas

```
FornVergeWeb/
├── admin/                    # Panel admin para MASSA Llevant
├── admin-son-oliva/          # Panel admin para MASSA Son Oliva
├── empleados/                # Aplicación para empleados (ambos locales)
└── SISTEMA-MULTI-LOCAL.md    # Este documento
```

## 🔧 Configuración Técnica

### Base de Datos
- **Tabla `locations`**: Contiene los datos de cada local
- **Tabla `employees`**: Incluye campo `location_id` para asociar empleados a locales
- **Otras tablas**: Sin cambios (schedules, ausencias, etc.)

### IDs de Locales
- **MASSA Llevant**: `b1cd939f-2d99-4856-8c15-7926e95d4cbd`
- **MASSA Son Oliva**: `781fd5a8-c486-4224-bd2a-bc968ad3f58c`

## 🎯 Funcionamiento

### Panel Admin (2 versiones)
- **`/admin/`**: Gestiona solo empleados de MASSA Llevant
- **`/admin-son-oliva/`**: Gestiona solo empleados de MASSA Son Oliva

**Características filtradas por local:**
- ✅ Carga de empleados
- ✅ Creación de nuevos empleados
- ✅ Gestión de horarios
- ✅ Gestión de ausencias

### Aplicación Empleados (1 versión para ambos)
- **`/empleados/`**: Funciona para empleados de cualquier local
- **Autenticación**: Por código de acceso individual
- **Sin filtrado**: Cada empleado ve solo sus propios datos

## 🚀 Ventajas del Sistema

### ✅ Separación Completa
- Cada local tiene su propio panel de administración
- No hay interferencia entre locales
- Datos completamente separados

### ✅ Simplicidad para Empleados
- Una sola aplicación para todos
- Mismo proceso de login independientemente del local
- Interfaz uniforme

### ✅ Escalabilidad
- Fácil agregar nuevos locales
- Solo requiere duplicar carpeta admin
- Base de datos preparada para múltiples locales

## 📱 URLs de Acceso

### Administradores
- **MASSA Llevant**: `/admin/`
- **MASSA Son Oliva**: `/admin-son-oliva/`

### Empleados (todos)
- **Cualquier local**: `/empleados/`

## 🔒 Seguridad

- Cada panel admin filtra automáticamente por `location_id`
- Imposible ver empleados de otros locales desde panel admin
- Empleados solo ven sus propios horarios
- Códigos de acceso únicos por empleado

## 📝 Notas Importantes

1. **Nuevos empleados**: Se asignan automáticamente al local correcto según el panel usado
2. **Horarios**: Se gestionan independientemente por local
3. **Ausencias**: Separadas por local
4. **Reportes**: Cada local tiene sus propios datos

---

**Fecha de implementación**: Septiembre 2025  
**Estado**: ✅ Implementado y listo para uso
