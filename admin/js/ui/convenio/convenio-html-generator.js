/**
 * GENERADOR DE HTML PARA CONVENIO
 * ================================
 * Genera el HTML del resumen anual del convenio
 */

class ConvenioHtmlGenerator {
    constructor(convenioConfig) {
        this.convenioConfig = convenioConfig;
    }

    /**
     * Genera HTML del resumen anual del convenio
     */
    generarResumenAnualHTML(statsAnuales, alertas) {
        const empleadosStats = Object.values(statsAnuales);
        const promedioProgreso = empleadosStats.reduce((sum, s) => 
            sum + (s.total_horas_año / this.convenioConfig.horas_maximas_anuales * 100), 0
        ) / empleadosStats.length;
        
        const alertasCriticas = alertas.filter(a => a.gravedad === 'alta').length;
        const alertasMenores = alertas.filter(a => a.gravedad === 'media').length;
        const alertasFichajes = alertas.filter(a => a.tipo === 'fichajes_durante_ausencia');
        
        // Generar sección de alertas de fichajes inválidos
        let seccionFichajesInvalidos = '';
        if (alertasFichajes.length > 0) {
            const fichajesInvalidos = alertasFichajes[0].fichajes;
            seccionFichajesInvalidos = `
                <div class="mt-3 bg-red-100 border border-red-300 rounded-lg p-3">
                    <h5 class="font-bold text-red-800 mb-2">🚨 FICHAJES DURANTE AUSENCIAS</h5>
                    <div class="text-sm text-red-700 space-y-1">
                        ${fichajesInvalidos.map(f => `
                            <div>⚠️ ${f.empleado}: ${f.fecha} (${f.horas}h) durante ${f.tipoAusencia.replace('_', ' ')}</div>
                        `).join('')}
                    </div>
                    <div class="mt-2 text-xs text-red-600">
                        <strong>Acción requerida:</strong> Revisar y corregir estos fichajes con el área legal/RRHH
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="bg-purple-50 p-3 rounded-lg mt-4">
                <h4 class="font-semibold text-purple-800 mb-2">📊 Resumen Anual del Convenio</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div class="text-center">
                        <div class="font-bold text-purple-600">${promedioProgreso.toFixed(1)}%</div>
                        <div class="text-gray-600">Progreso Medio</div>
                    </div>
                    <div class="text-center">
                        <div class="font-bold ${alertasCriticas > 0 ? 'text-red-600' : 'text-green-600'}">${alertasCriticas}</div>
                        <div class="text-gray-600">Críticas</div>
                    </div>
                    <div class="text-center">
                        <div class="font-bold text-orange-600">${alertasMenores}</div>
                        <div class="text-gray-600">Menores</div>
                    </div>
                    <div class="text-center">
                        <div class="font-bold text-blue-600">${empleadosStats.length}</div>
                        <div class="text-gray-600">Empleados</div>
                    </div>
                </div>
                
                <div class="mt-3 text-xs text-purple-700">
                    <div>📅 Período: Enero - Diciembre 2025</div>
                    <div>📋 Datos reales desde: 06/06/2025</div>
                    <div>🎯 Límite anual: ${this.convenioConfig.horas_maximas_anuales}h por empleado</div>
                </div>
                
                ${seccionFichajesInvalidos}
            </div>
        `;
    }
}

// Exportar a window
window.ConvenioHtmlGenerator = ConvenioHtmlGenerator;
