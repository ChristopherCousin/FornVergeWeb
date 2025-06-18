# 🎯 Sistema de Ofertas Dinámicas - Forn Verge de Lluc

## 📋 Resumen del Sistema

He implementado un **sistema completo de ofertas dinámicas** que se integra perfectamente con tu web existente:

### ✨ **Características Implementadas:**

1. **🔗 Sección sutil en la web principal** con código QR automático
2. **📱 Página móvil-first** optimizada para acceso vía QR 
3. **⚡ Sistema dinámico** conectado a Supabase
4. **👔 Panel de administración** para gestionar ofertas
5. **🎨 Diseño coherente** con la estética premium de tu web

---

## 🏗️ Estructura de Archivos Creados

```
FornVergeWeb/
├── index.html                      # ✅ MODIFICADO: Añadida sección ofertas con QR
├── mobile-styles.css               # ✅ MODIFICADO: Estilos responsive para ofertas
├── ofertas/
│   ├── index.html                  # 🆕 Página móvil de ofertas
│   └── script.js                   # 🆕 Lógica de ofertas dinámicas
├── admin/
│   └── ofertas-admin.html          # 🆕 Panel admin para gestionar ofertas
└── database/
    └── ofertas-schema.sql          # 🆕 Schema SQL para Supabase
```

---

## 🚀 Implementación Paso a Paso

### **Paso 1: Base de Datos (Supabase)**

1. **Ejecutar el script SQL:**
   ```sql
   -- Ejecutar en tu dashboard de Supabase
   -- Archivo: database/ofertas-schema.sql
   ```

2. **Esto creará:**
   - ✅ Tabla `offers` con todas las columnas necesarias
   - ✅ Funciones SQL para consultas optimizadas
   - ✅ Índices para rendimiento
   - ✅ Datos de ejemplo para testing

### **Paso 2: Configuración de URLs**

1. **Actualizar configuración Supabase:**
   ```javascript
   // En assets/js/config/constants.js - añadir:
   const SUPABASE_CONFIG = {
       URL: 'tu-url-de-supabase',
       ANON_KEY: 'tu-anon-key'
   };
   ```

2. **El QR apunta automáticamente a:** `tudominio.com/ofertas/`

### **Paso 3: Testing Inmediato**

**¡El sistema ya funciona con datos demo!** 

- ✅ **Web principal:** Sección ofertas con QR generado automáticamente
- ✅ **Página móvil:** `/ofertas/` funciona con ofertas de ejemplo
- ✅ **Panel admin:** `/admin/ofertas-admin.html` para gestión

---

## 🎨 Características de Diseño

### **🌟 En la Web Principal (`index.html`)**

- **Sección elegante** que respeta la estética premium
- **QR code automático** que se genera al cargar la página
- **Responsive design** - se adapta a móvil/desktop
- **Botón alternativo** para escritorio ("Ver Ofertas Online")

### **📱 Página Móvil (`ofertas/index.html`)**

- **Mobile-first design** optimizado para QR scanning
- **Carga dinámica** desde Supabase o datos demo
- **Cards elegantes** con animaciones sutiles
- **Categorización visual** con iconos específicos
- **Sistema de prioridades** (ofertas destacadas)

### **👔 Panel Admin (`admin/ofertas-admin.html`)**

- **Integrado** con el estilo del admin existente
- **CRUD completo** - Crear, leer, actualizar, eliminar ofertas
- **Vista previa** de cómo se verán las ofertas
- **Gestión de QR** - visualizar, descargar, imprimir
- **Estadísticas** en tiempo real

---

## 📊 Gestión Dinámica de Ofertas

### **🔧 Cómo Cambiar Ofertas Diariamente:**

1. **Acceder al panel admin:** `/admin/ofertas-admin.html`
2. **Crear nueva oferta** con fechas específicas
3. **Configurar prioridad** (1=Normal, 2=Media, 3=Destacada)
4. **Activar/desactivar** ofertas según necesidad
5. **El QR siempre muestra las ofertas actuales**

### **📋 Tipos de Ofertas Disponibles:**

- 🍞 **Panadería** - Descuentos en pan, baguettes, etc.
- 🧁 **Pastelería** - Ensaimadas, dulces tradicionales
- 🍺 **Bar** - Promociones de bebidas y tapas
- ☕ **Café** - Ofertas especiales de café
- 🌅 **Desayuno** - Combos matutinos
- 🕐 **Merienda** - Promociones de tarde
- ⭐ **Especial** - Ofertas únicas
- 📦 **Combo** - Paquetes combinados
- 💯 **Descuento** - Descuentos porcentuales
- 🎁 **Regalo** - Promociones con regalo

---

## 🎯 Flujo de Usuario

### **👥 Cliente (Móvil)**
1. Ve el QR en la panadería o web
2. Escanea con el móvil
3. Accede automáticamente a `/ofertas/`
4. Ve ofertas actuales con precios y condiciones
5. Información siempre actualizada

### **👔 Administrador**
1. Accede a `/admin/ofertas-admin.html`
2. Crea ofertas con fechas específicas
3. Configura precios, descuentos, condiciones
4. Activa/desactiva según necesidad
5. Genera nuevos QR si es necesario

---

## ⚡ Características Técnicas

### **🔄 Actualización Automática**
- Las ofertas se refrescan cada 30 segundos
- Sistema de cache inteligente
- Funciona offline con Service Worker básico

### **🎨 Responsive & Premium**
- Mantiene la estética de tu web
- Animaciones sutiles (AOS)
- Glassmorphism effects
- Compatible con todos los dispositivos

### **🔧 Fácil Mantenimiento**
- Sistema demo funcional sin Supabase
- Datos de ejemplo incluidos
- Documentación completa en código
- Estructura modular y escalable

---

## 📱 URLs del Sistema

- **🏠 Web principal:** `tudominio.com/`
- **📱 Ofertas móvil:** `tudominio.com/ofertas/`
- **👔 Admin ofertas:** `tudominio.com/admin/ofertas-admin.html`
- **👔 Admin principal:** `tudominio.com/admin/`

---

## 🔧 Configuración Opcional

### **🔐 Seguridad Supabase (RLS)**
```sql
-- En el archivo SQL está comentado
-- Descomentar para habilitar control de acceso
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
```

### **🎨 Personalización de Colores**
```css
/* En ofertas/index.html */
:root {
    --primary-gold: #D4A574;  /* Cambiar según tu marca */
    --dark-gold: #B8956A;
    /* ... resto de variables */
}
```

### **📊 Analytics (Opcional)**
```javascript
// Añadir en ofertas/script.js
// Google Analytics, Facebook Pixel, etc.
```

---

## 🚀 Estado Actual

### **✅ Funcionando Ahora Mismo:**

1. **Sección QR en web principal** - Lista para usar
2. **Página móvil de ofertas** - Con datos demo funcionales
3. **Panel administrativo** - CRUD completo
4. **Base de datos** - Schema SQL listo para ejecutar

### **🔧 Para Activar Completamente:**

1. Ejecutar `database/ofertas-schema.sql` en Supabase
2. Configurar URLs en `constants.js`
3. ¡Ya está todo funcionando!

---

## 💡 Ventajas del Sistema

### **🎯 Para el Negocio:**
- Aumenta ventas con promociones dinámicas
- Reduce costes de impresión de folletos
- Facilita gestión de ofertas especiales
- Mejora experiencia del cliente

### **📱 Para los Clientes:**
- Acceso instantáneo vía QR
- Siempre actualizado
- No necesita instalar apps
- Diseño elegante y profesional

### **👔 Para la Gestión:**
- Control total desde panel admin
- Cambios en tiempo real
- Estadísticas de ofertas
- Sistema escalable

---

## 🎉 ¡Listo para Usar!

El sistema está **completamente implementado** y listo para funcionar. Con un diseño sutil que respeta la estética premium de tu web y un sistema dinámico que te permitirá cambiar ofertas diariamente de forma fácil y profesional.

**¿Alguna pregunta sobre la implementación o quieres personalizar algo específico?** 🤔 