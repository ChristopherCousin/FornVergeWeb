# 🥖 Forn Verge - Sistema de Descongelación

Una aplicación web progresiva (PWA) para gestionar la descongelación y horneado de productos en la panadería Forn Verge.

## 📱 Características

- **Responsive**: Funciona perfectamente en móviles, tablets y desktop
- **PWA**: Se puede instalar como app nativa en el dispositivo
- **Tiempo real**: Actualización automática de datos cada 5 minutos
- **Offline**: Funciona sin conexión gracias al Service Worker
- **Temporizadores**: Seguimiento automático de tiempos de descongelación y horneado
- **Estados visuales**: Indicadores claros del estado de cada producto
- **Fácil de usar**: Interfaz intuitiva pensada para empleadas de panadería

## 🚀 Instalación

### 1. Configurar Base de Datos

Ejecuta este SQL en tu Supabase para añadir las columnas necesarias:

```sql
-- Ejecutar en Supabase SQL Editor
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS defrost_started_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS defrost_completed_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS baking_started_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS baking_completed_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100) NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS notes TEXT NULL;
```

### 2. Configurar Credenciales

Edita el archivo `config.js` y asegúrate de que las credenciales de Supabase son correctas:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://csxgkxjeifakwslamglc.supabase.co',
    anon_key: 'tu_clave_anonima_aqui'
};
```

### 3. Subir a Servidor Web

Sube todos los archivos de la carpeta `descongelacion-web/` a tu servidor web o hosting.

### 4. Configurar HTTPS

**Importante**: Para que funcione como PWA, necesitas HTTPS. GitHub Pages lo proporciona automáticamente.

## 📋 Uso Diario

### Para las Empleadas

1. **Acceder a la aplicación** desde el móvil
2. **Instalar la app** (si aparece el botón "Instalar" en el navegador)
3. **Ver la tanda actual** automáticamente detectada por la hora
4. **Seguir el flujo**:
   - ⏳ **Pendiente** → Clic en "Comenzar descongelación"
   - 🧊➡️ **Descongelando** → Esperar tiempo (automático) → Clic en "Marcar descongelado"
   - ✅ **Listo para horno** → Clic en "Meter al horno"
   - 🔥 **En horno** → Esperar tiempo (automático) → Clic en "Marcar horneado"

### Tiempos Automáticos

- **Descongelación**: 90-150 minutos según producto
- **Horneado**: 15-25 minutos según producto
- Los temporizadores se actualizan en tiempo real

### Estados de los Productos

| Estado | Emoji | Descripción | Acción |
|--------|-------|-------------|--------|
| Pendiente | ⏳ | Por descongelar | Comenzar descongelación |
| Descongelando | 🧊➡️ | En proceso | Esperar o marcar manualmente |
| Listo | ✅ | Descongelado | Meter al horno |
| Horneando | 🔥 | En el horno | Esperar o marcar terminado |

## 📱 Instalación como App

### En Android/iOS:
1. Abrir la web en Chrome/Safari
2. Buscar el botón "Añadir a pantalla de inicio" o "Instalar"
3. Confirmar instalación
4. ¡Ya tienes la app en tu móvil!

### En Desktop:
1. Abrir en Chrome/Edge
2. Buscar el icono de instalación en la barra de direcciones
3. Hacer clic en "Instalar"

## 🔄 Integración con el Sistema Existente

### Flujo de Datos

```
1. Script Python (extraer_ventas.py) → Analiza ventas de Agora
2. Calcula cantidades recomendadas → Actualiza Supabase
3. Aplicación Web → Lee de Supabase → Muestra a empleadas
4. Empleadas marcan estados → Se guarda en Supabase
5. Datos disponibles para métricas y seguimiento
```

### Actualización Automática

- El script Python debe ejecutarse semanalmente para actualizar cantidades
- La web se actualiza automáticamente cada 5 minutos
- Los datos se sincronizan en tiempo real entre dispositivos

## 🛠️ Configuración Avanzada

### Modificar Tiempos de Descongelación

Edita en `config.js`:

```javascript
tiempos_descongelacion: {
    'Croissant': 120,      // 2 horas
    'Empanada': 150,       // 2.5 horas
    // etc...
}
```

### Modificar Franjas Horarias

```javascript
tandas: {
    mañana: { start: 6, end: 12 },
    mediodia: { start: 12, end: 17 },
    tarde: { start: 17, end: 21 }
}
```

### Cambiar Actualización Automática

```javascript
auto_refresh_minutes: 5,  // Cambiar a los minutos deseados
```

## 🐛 Solución de Problemas

### La app no carga datos
- Verificar conexión a internet
- Revisar credenciales de Supabase en `config.js`
- Comprobar que las tablas existen en Supabase

### No aparecen productos
- Verificar que se ejecutó el script Python recientemente
- Comprobar que hay datos en la tabla `cantidades_calculadas`
- Revisar que la tanda actual tiene productos configurados

### La app no se puede instalar
- Verificar que se accede por HTTPS
- Comprobar que el `manifest.json` es válido
- Probar desde Chrome/Safari móvil

### Los temporizadores no funcionan
- Verificar que las columnas de timestamp se añadieron a la BD
- Comprobar que las acciones se guardan correctamente

## 📊 Monitoreo

### Logs en Consola del Navegador
- Abrir DevTools (F12)
- Ver la consola para mensajes de estado
- Revisar errores de red o base de datos

### Estados en Supabase
- Acceder al panel de Supabase
- Revisar tabla `cantidades_calculadas`
- Verificar timestamps de estados

## 🔧 Desarrollo

### Estructura de Archivos

```
descongelacion-web/
├── index.html          # Página principal
├── styles.css          # Estilos y diseño
├── app.js             # Lógica principal
├── config.js          # Configuración
├── manifest.json      # PWA manifest
├── sw.js             # Service Worker
├── actualizar_tabla_estados.sql  # SQL para BD
└── README.md         # Este archivo
```

### Tecnologías Usadas

- **HTML5/CSS3**: Interfaz responsive
- **JavaScript ES6+**: Lógica de aplicación
- **Supabase**: Base de datos en tiempo real
- **PWA**: Progressive Web App
- **Service Worker**: Funcionalidad offline

## 📞 Soporte

Para problemas técnicos:
1. Revisar la consola del navegador (F12)
2. Verificar configuración en `config.js`
3. Comprobar estado de Supabase
4. Consultar logs del script Python

---

**Versión**: 1.0.0  
**Compatibilidad**: Chrome 80+, Safari 13+, Firefox 75+  
**Desarrollado para**: Forn Verge Panadería 