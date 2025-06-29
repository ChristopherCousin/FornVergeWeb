# 🥖 Forn Verge - Sistema de Preparación y Descongelación v2.0

Una aplicación web progresiva (PWA) completamente renovada para gestionar la preparación y descongelación de productos en la panadería Forn Verge con un **nuevo flujo operativo ultra-práctico**.

## 🆕 **NUEVO FLUJO OPERATIVO v2.0**

### 📋 **MODO PREPARACIÓN** (16:00-20:00 del día anterior)
- Revisar cantidades para el día siguiente
- Organizar productos en bandejas separadas por tanda
- Etiquetar claramente cada bandeja
- Guardar organizadamente en congelador

### ⚡ **MODO EJECUCIÓN** (6:00-21:00 del día del servicio)
- Seguir timers automáticos simples
- Sacar bandejas del congelador a la hora indicada
- Meter al horno cuando esté descongelado
- Marcar como terminado

## 💡 **¿POR QUÉ ESTE CAMBIO?**

El sistema anterior requería demasiadas decisiones durante el servicio. El nuevo sistema:

✅ **Separa preparación de ejecución**  
✅ **Reduce errores durante el servicio**  
✅ **Simplifica el día a día**  
✅ **Es más realista operativamente**  
✅ **Facilita el entrenamiento de personal**

## 📱 **Características Renovadas**

- **Detección automática de modo**: La app sabe si estás en preparación o ejecución
- **Preparación por tandas**: Organiza productos del día siguiente por franjas horarias
- **Checklists intuitivos**: Marca productos como contados, etiquetados y guardados
- **Ejecución simplificada**: Solo botones de "Sacar", "Hornear" y "Terminado"
- **Tiempos optimizados**: Reducidos porque los productos están pre-organizados
- **Diseño dual**: Interfaz púrpura para preparación, naranja para ejecución

## 🚀 **Instalación**

### 1. Actualizar Base de Datos

Ejecuta este SQL en tu Supabase:

```sql
-- Nuevas columnas para preparación y seguimiento
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS prepared BOOLEAN DEFAULT FALSE;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS defrost_started_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS defrost_completed_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS baking_started_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS baking_completed_at TIMESTAMPTZ NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100) NULL;
ALTER TABLE cantidades_calculadas ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_cantidades_prepared ON cantidades_calculadas(prepared, prepared_at);
CREATE INDEX IF NOT EXISTS idx_cantidades_estados ON cantidades_calculadas(defrost_started_at, baking_started_at);
CREATE INDEX IF NOT EXISTS idx_cantidades_updated ON cantidades_calculadas(updated_at);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cantidades_updated_at ON cantidades_calculadas;
CREATE TRIGGER update_cantidades_updated_at
    BEFORE UPDATE ON cantidades_calculadas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Configurar Credenciales

Edita el archivo `config.js`:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://csxgkxjeifakwslamglc.supabase.co',
    anon_key: 'tu_clave_anonima_aqui'
};
```

### 3. Subir a Servidor Web

Sube todos los archivos a tu servidor web con HTTPS.

## 📋 **Nuevo Flujo de Trabajo Diario**

### **16:00-20:00 (Día Anterior) - MODO PREPARACIÓN**

1. **La app detecta automáticamente el modo preparación**
2. **Seleccionar tanda a preparar** (Mañana, Mediodía o Tarde)
3. **Ver lista de productos** para esa tanda del día siguiente
4. **Para cada producto:**
   - ☑️ Contar y separar unidades
   - ☑️ Etiquetar bandeja con tanda y fecha
   - ☑️ Guardar en congelador organizadamente
5. **Marcar tanda como preparada** cuando esté completa

### **6:00-21:00 (Día del Servicio) - MODO EJECUCIÓN**

1. **La app detecta automáticamente el modo ejecución**
2. **Ver todas las tandas del día** organizadas
3. **Seguir indicaciones por tanda activa:**
   - 📥 **"SACAR DEL CONGELADOR"** cuando sea el momento
   - 🔥 **"METER AL HORNO"** cuando esté descongelado
   - ✅ **"MARCAR TERMINADO"** cuando esté listo

## 🎯 **Estados del Producto**

| Estado | Emoji | Descripción | Acción |
|--------|-------|-------------|--------|
| Por preparar | 📝 | Bandeja no preparada aún | Preparar bandeja |
| Preparado | 📦 | Bandeja lista en congelador | Esperar hora de sacar |
| Por sacar | ⏰ | Hora de sacar del congelador | **SACAR AHORA** |
| Descongelando | 🧊➡️ | Fuera del congelador | Esperar descongelación |
| Listo para horno | ✅ | Descongelado completamente | **AL HORNO AHORA** |
| Horneando | 🔥 | En el horno | Esperar cocción |
| Completado | 🎯 | Listo para vender | ¡Terminado! |

## ⏰ **Tiempos Optimizados**

Los tiempos se han **reducido** porque los productos están pre-organizados:

- **Barra Clásica**: 45 min (antes 90 min)
- **Croissants**: 60-75 min (antes 90 min)
- **Empanadas carne**: 90 min (antes 120 min, por sanidad)
- **Bollería dulce**: 60-75 min (antes 80-100 min)

## 🔄 **Ejemplo de Flujo Físico**

### **Día Anterior (18:00)**
```
CONGELADOR ORGANIZADO:
┌─ MAÑANA [25/12] ─┐  ┌─ MEDIODÍA [25/12] ┐  ┌─ TARDE [25/12] ─┐
│ Barra: 15 uds    │  │ Empanada: 12 uds  │  │ Croissant: 8 uds │
│ Croissant: 8 uds │  │ Napolitana: 6 uds │  │ Ensaimada: 4 uds │
└─────────────────┘  └─────────────────┘  └────────────────┘
```

### **Día del Servicio**
- **6:00** → Sacar bandeja "MAÑANA"
- **6:45** → Meter barra al horno (45 min después)
- **12:00** → Sacar bandeja "MEDIODÍA"
- **13:30** → Meter empanadas al horno (90 min después)

## 📱 **Instalación como PWA**

### En Móvil:
1. Abrir en Chrome/Safari
2. "Añadir a pantalla de inicio"
3. ¡Ya tienes la app instalada!

### En Desktop:
1. Abrir en Chrome/Edge
2. Icono de instalación en barra de direcciones
3. "Instalar"

## 🎨 **Indicadores Visuales**

- **Header púrpura**: Modo Preparación
- **Header naranja**: Modo Ejecución
- **Tarjetas pulsantes**: Acciones urgentes
- **Barras de color**: Estado de cada producto
- **Emojis contextuales**: Identificación rápida

## 🛠️ **Configuración Avanzada**

### Modificar Horarios de Modo

```javascript
// En config.js
modes: {
    preparation: {
        available_hours: [16, 17, 18, 19, 20] // 16:00-20:00
    },
    execution: {
        available_hours: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]
    }
}
```

### Ajustar Tiempos de Descongelación

```javascript
tiempos_descongelacion: {
    'Barra Clásica': 45,        // Reducido por pre-organización
    'Empanada Carne': 90,       // Mínimo por sanidad
    // etc...
}
```

## 🐛 **Solución de Problemas**

### La app no cambia de modo
- Verificar que la hora del sistema es correcta
- Comprobar configuración en `modes` en config.js

### No aparecen productos para preparar
- Verificar que hay datos en la tabla para el día siguiente
- Comprobar que se seleccionó una tanda

### Los tiempos no son correctos
- Verificar configuración de `tiempos_descongelacion`
- Comprobar que los horarios de tandas son correctos

## 📊 **Ventajas del Nuevo Sistema**

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Decisiones durante servicio** | Muchas | Mínimas |
| **Errores operativos** | Frecuentes | Muy reducidos |
| **Entrenamiento personal** | Complejo | Simple |
| **Estrés en servicio** | Alto | Bajo |
| **Organización física** | Variable | Estandarizada |
| **Control de stock** | Difícil | Fácil |

## 🔧 **Desarrollo**

### Estructura Renovada

```
descongelacion-web/
├── index.html           # Interfaz dual modo
├── styles.css          # Estilos preparación + ejecución  
├── app.js             # Lógica dual renovada
├── config.js          # Configuración tiempos optimizados
├── manifest.json      # PWA manifest
├── sw.js             # Service Worker
└── README.md         # Esta documentación
```

### Tecnologías

- **HTML5/CSS3**: Interfaz dual responsive
- **JavaScript ES6+**: Lógica de modos automáticos
- **Supabase**: Base de datos tiempo real
- **PWA**: Instalación nativa
- **Service Worker**: Funcionalidad offline

## 📞 **Soporte**

Para problemas:
1. Verificar configuración en `config.js`
2. Comprobar credenciales de Supabase
3. Revisar que se ejecutaron los SQL de actualización
4. Verificar que la hora del sistema es correcta

---

**Versión**: 2.0.0  
**Enfoque**: Preparación día anterior + Ejecución simple  
**Resultado**: Operación más eficiente y menos errores  
**Desarrollado para**: Forn Verge Panadería - Flujo optimizado 