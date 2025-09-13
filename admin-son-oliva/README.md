# 🚀 Admin Panel - MASSA Son Oliva

Panel de administración profesional para la gestión de horarios del personal del local de **MASSA Son Oliva**.

## 📁 Estructura

```
admin-son-oliva/
├── css/
│   └── admin-horarios.css     # Estilos del panel
├── js/
│   ├── admin-horarios.js      # Funcionalidad JavaScript (filtrado por Son Oliva)
│   └── admin-empleados.js     # Gestión de empleados (filtrado por Son Oliva)
├── index.html                 # Página principal para Son Oliva
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
const SON_OLIVA_LOCATION_ID = '781fd5a8-c486-4224-bd2a-bc968ad3f58c';
```

## 🏢 Configuración del Local

Este panel está configurado específicamente para el local **MASSA Son Oliva**:

- **Location ID**: `781fd5a8-c486-4224-bd2a-bc968ad3f58c`
- **Dirección**: Av. Tomás de Villanueva Cortés, 11, Palma
- **Filtrado automático**: Solo muestra empleados asignados a este local
- **Creación de empleados**: Los nuevos empleados se asignan automáticamente a Son Oliva 