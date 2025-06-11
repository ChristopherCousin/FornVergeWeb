# 🥖 Forn Verge - Sistema de Gestión de Horarios

Sistema completo de gestión de horarios para el personal del Forn Verge.

## 📁 Estructura del Proyecto

```
FornVergeWeb/
├── admin/                    # 🔧 Panel de Administración
│   ├── css/
│   │   └── admin-horarios.css
│   ├── js/
│   │   └── admin-horarios.js
│   ├── index.html           # Panel principal de gestión
│   └── README.md
│
├── database/                # 💾 Base de Datos
│   └── supabase-completo.sql   # Estructura completa Supabase
│
├── assets/                  # 📁 Recursos estáticos
├── index.html              # 🏠 Página principal empleados
├── admin.html              # 📋 Panel básico admin (legacy)
├── empleados-mobile.html   # 📱 Vista móvil empleados
├── script.js               # ⚡ JavaScript principal
├── styles.css              # 🎨 Estilos principales
└── supabase-config.js      # ⚙️ Configuración Supabase
```

## 🚀 Características Principales

### Para Administradores (`/admin/`)
- ✅ **Gestión completa de horarios**
- ✅ **Múltiples turnos por día** (ej: Bryan domingo 9-13 + 16-21)
- ✅ **Templates rápidos** para turnos comunes
- ✅ **Estadísticas en tiempo real**
- ✅ **Interfaz moderna y profesional**

### Para Empleados
- ✅ **Vista de horarios personalizada**
- ✅ **Interfaz móvil optimizada**
- ✅ **Consulta de turnos semanales**

## 🗄️ Base de Datos

**Archivo principal**: `database/supabase-completo.sql`

### Tablas:
- `employees` - Datos de empleados
- `schedules` - Horarios con soporte múltiples turnos
- `schedule_changes` - Auditoría de cambios

### Nuevas características:
- Campo `shift_sequence` para múltiples turnos por día
- Campo `shift_description` para descripciones personalizadas
- Función `insert_multiple_shifts()` para inserción masiva
- Vista `schedule_detailed` para consultas optimizadas

## 🔧 Configuración

1. **Supabase**: Configurar URL y clave en `supabase-config.js`
2. **Base de datos**: Ejecutar `database/supabase-completo.sql`
3. **Semana activa**: Modificar `WEEK_START` en el código JavaScript

## 📱 URLs de Acceso

- **Admin Panel**: `/admin/index.html`
- **Empleados**: `/index.html`
- **Móvil**: `/empleados-mobile.html`

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework CSS**: Tailwind CSS
- **Iconos**: Font Awesome
- **Base de datos**: Supabase (PostgreSQL)
- **Hosting**: GitHub Pages 