/**
 * ANALIZADOR DE CUMPLIMIENTO DEL CONVENIO
 * ========================================
 * Detecta violaciones de límites diarios y semanales
 */

class ComplianceAnalyzer {
    constructor(convenioConfig, fichajes) {
        this.convenioConfig = convenioConfig;
        this.fichajes = fichajes;
    }

    /**
     * Analiza cumplimiento del convenio para un empleado
     * Retorna objeto con excesos y array de alertas a generar
     */
    analizarCumplimientoConvenio(empleadoId, empleadoNombre) {
        // Analizar fichajes para encontrar violaciones
        const fichajesEmpleado = this.fichajes.filter(f => f.empleado_id === empleadoId);
        
        const resultado = {
            excesos_diarios: [],
            violaciones_descanso: [],
            semanas_exceso: [],
            alertas: []
        };
        
        // 1. Excesos diarios (>9h)
        resultado.excesos_diarios = fichajesEmpleado.filter(f => 
            (f.horas_trabajadas || 0) > this.convenioConfig.horas_maximas_dia
        );
        
        // 2. Violaciones de descanso entre turnos (<12h)
        // TODO: Implementar cuando tengamos entrada/salida detallada
        
        // 3. Semanas con exceso de horas (>40h)
        const semanas = window.ConvenioUtils.agruparPorSemanas(fichajesEmpleado);
        resultado.semanas_exceso = Object.entries(semanas).filter(([semana, fichajes]) => {
            const horasSemana = fichajes.reduce((sum, f) => sum + (f.horas_trabajadas || 0), 0);
            return horasSemana > this.convenioConfig.horas_maximas_semana;
        });
        
        // Generar alertas
        if (resultado.excesos_diarios.length > 0) {
            resultado.alertas.push({
                empleado: empleadoNombre,
                tipo: 'exceso_diario',
                cantidad: resultado.excesos_diarios.length,
                gravedad: resultado.excesos_diarios.length > 5 ? 'alta' : 'media'
            });
        }
        
        if (resultado.semanas_exceso.length > 0) {
            resultado.alertas.push({
                empleado: empleadoNombre,
                tipo: 'exceso_semanal',
                cantidad: resultado.semanas_exceso.length,
                gravedad: resultado.semanas_exceso.length > 3 ? 'alta' : 'media'
            });
        }
        
        return resultado;
    }
}

// Exportar a window
window.ComplianceAnalyzer = ComplianceAnalyzer;
