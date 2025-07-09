# 🍞 Forn Verge - Aplicación de Horneado

## Vista Simple y Clara de Tandas Diarias

Esta aplicación muestra de forma **simple y directa** las cantidades que se deben hornear en cada tanda del día actual.

## ⏰ Horarios de las Tandas

### 🌅 Mañana
- **Hornear:** 06:40h 
- **Listo para venta:** 07:00h (primera venta del día)

### ☀️ Mediodía  
- **Hornear:** 10:40h
- **Listo para venta:** 11:00h

### 🌇 Tarde
- **Hornear:** 16:40h  
- **Listo para venta:** 17:00h

## 🎯 Lo que muestra la aplicación

1. **Productos del día actual** (no del día siguiente)
2. **Solo productos con cantidades** (no muestra productos en 0)
3. **Cantidades por tanda** con horarios específicos
4. **Interfaz limpia y fácil de leer**

## 🔧 Cambios realizados

- ✅ **Horarios actualizados** según especificaciones exactas
- ✅ **Vista del día actual** en lugar de mañana  
- ✅ **Interfaz simplificada** - solo productos y cantidades
- ✅ **Horarios visibles** en cada tanda
- ✅ **Filtrado automático** - solo muestra tandas con cantidades > 0

## 📱 Uso

1. La aplicación se conecta automáticamente a Supabase
2. Muestra los productos y cantidades para HOY
3. Cada tanda muestra:
   - Horario de horneado → hora de listo
   - Cantidad exacta a hornear
   - Solo se muestran las tandas que tienen cantidades

## 🔄 Actualización automática

La aplicación se actualiza automáticamente cada 2 minutos para mantener los datos sincronizados con la base de datos. 