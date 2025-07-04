#!/bin/bash

# MIGRACIÓN NOCTURNA DE FICHAJES
# Ejecutar este script cada noche

echo "🌙 $(date): Iniciando migración nocturna..."

# Ir al directorio del proyecto
cd /Users/root1/Documents/GitHub/FornVergeWeb

# Activar entorno virtual y ejecutar migración
source venv_agora/bin/activate
python3 migracion_fichajes_simple.py

# Resultado
if [ $? -eq 0 ]; then
    echo "✅ $(date): Migración completada exitosamente"
else
    echo "❌ $(date): Error en migración"
fi

echo "---" 