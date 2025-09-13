# 🚨 ELIMINAR ANDREA DEL SISTEMA - INSTRUCCIONES URGENTES

## ⚠️ ADVERTENCIA IMPORTANTE
**Este proceso eliminará COMPLETAMENTE todos los datos de Andrea del sistema de Forn Verge. Esta acción NO se puede deshacer.**

## 📋 ¿Qué se eliminará?
El script eliminará TODOS los registros de Andrea de estas tablas:
- ✅ **Horarios** (schedules) - Todos sus turnos asignados
- ✅ **Ausencias** (ausencias) - Vacaciones, bajas médicas, permisos
- ✅ **Fichajes** (fichajes) - Registros de entrada/salida
- ✅ **Historial** (schedule_changes) - Cambios de horarios
- ✅ **Empleado** (employees) - Su registro principal

## 🎯 Instrucciones Paso a Paso

### PASO 1: Acceder a Supabase
1. Ir a [https://supabase.com](https://supabase.com)
2. Iniciar sesión con la cuenta de Forn Verge
3. Seleccionar el proyecto `csxgkxjeifakwslamglc`
4. Ir a **SQL Editor** en el menú lateral

### PASO 2: Ejecutar el Script
1. Abrir el archivo `eliminar-andrea.sql` que está en esta carpeta
2. **COPIAR TODO** el contenido del archivo (Ctrl+A, Ctrl+C)
3. En Supabase SQL Editor, **PEGAR** el script (Ctrl+V)
4. **REVISAR** que dice "ANDREA" (no otro nombre)
5. Hacer clic en **"Run"** o **"Ejecutar"**

### PASO 3: Verificar Resultado
El script mostrará mensajes como:
```
👤 ANDREA encontrada con ID: [uuid]
📊 REGISTROS DE ANDREA:
   • Horarios (schedules): X
   • Ausencias: X  
   • Fichajes: X
   • Cambios de horario: X
🗑️ INICIANDO ELIMINACIÓN...
✅ Eliminados X horarios
✅ Eliminados X cambios de horario
✅ Eliminadas X ausencias
✅ Eliminados X fichajes
✅ Eliminado registro de empleado ANDREA
🎉 ANDREA ha sido eliminada completamente del sistema
```

Si aparece: `❌ ANDREA no encontrada en la base de datos`, significa que ya fue eliminada anteriormente.

### PASO 4: Verificación Final
El script automáticamente verificará que Andrea fue eliminada correctamente:
```
🔍 VERIFICACIÓN FINAL:
✅ ANDREA eliminada de employees
✅ Horarios de ANDREA eliminados
✅ Ausencias de ANDREA eliminadas
✅ Fichajes de ANDREA eliminados
✨ VERIFICACIÓN COMPLETADA
```

## 🎯 ¿Qué pasa después?

### En el Panel Admin
- Andrea desaparecerá inmediatamente de las listas de empleados
- Sus horarios no aparecerán en la planificación semanal
- No habrá referencias a ella en estadísticas

### En Reportes y Análisis
- Sus datos históricos serán eliminados del convenio anual
- No aparecerá en análisis de horas trabajadas
- Sus ausencias no afectarán a los cálculos

## 🔒 Seguridad
El script incluye:
- ✅ Verificaciones de seguridad antes de eliminar
- ✅ Mensajes informativos paso a paso  
- ✅ Verificación final de que todo fue eliminado
- ✅ Rollback automático si hay errores

## 📞 Soporte
Si hay algún problema durante la ejecución:
1. **NO ejecutar el script de nuevo**
2. Capturar pantalla del mensaje de error
3. Contactar con soporte técnico

## ⏰ Tiempo Estimado
- Preparación: 2 minutos
- Ejecución: 10-30 segundos  
- Verificación: 1 minuto
- **Total: 3-4 minutos**

---

**IMPORTANTE**: Una vez ejecutado, Andrea no aparecerá más en ninguna parte del sistema. Asegúrate de que esta es la acción correcta antes de proceder. 