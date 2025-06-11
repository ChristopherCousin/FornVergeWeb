# 🚀 Admin Panel - Forn Verge

Panel de administración profesional para la gestión de horarios del personal.

## 📁 Estructura

```
admin/
├── css/
│   └── admin-horarios.css     # Estilos del panel
├── js/
│   └── admin-horarios.js      # Funcionalidad JavaScript
├── index.html                 # Página principal limpia
└── README.md                  # Esta documentación
```

## ✨ Características

- **Múltiples turnos por día**: Un empleado puede tener varios turnos el mismo día
- **Templates rápidos**: Botones preconfigurados para turnos comunes
- **Interfaz moderna**: Gradientes, animaciones y UX profesional
- **Estadísticas en tiempo real**: Contadores automáticos de horas y turnos
- **Gestión flexible**: Agregar, eliminar y modificar turnos fácilmente

## 🎯 Tipos de Turno

- **🌅 Mañana**: 7:00-14:00
- **🌆 Tarde**: 14:00-21:00  
- **🔧 Refuerzo**: Turnos parciales (AM/PM)
- **🎯 Personalizado**: Horarios flexibles
- **🆓 Día Libre**: Descanso

## 💾 Base de Datos

La estructura de la base de datos está en `../database/supabase-completo.sql` que incluye:

- Soporte para múltiples turnos por día
- Campos `shift_sequence` y `shift_description`
- Funciones helper para inserción masiva
- Vista `schedule_detailed` para consultas

## 🚀 Uso

1. Abrir `index.html` en el navegador
2. Los empleados se cargan automáticamente desde Supabase
3. Hacer clic en "Agregar" para cada día/empleado
4. Usar templates rápidos o configurar horarios personalizados
5. Guardar todo con el botón "Guardar Todo"

## 🔧 Configuración

La configuración de Supabase está en `js/admin-horarios.js`:

```javascript
const SUPABASE_URL = 'https://csxgkxjeifakwslamglc.supabase.co';
const WEEK_START = '2025-02-09'; // Semana actual
``` 