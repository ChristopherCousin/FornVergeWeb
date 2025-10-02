/**
 * CALCULADORA DE HORAS
 * ====================
 * Cálculos de horas teóricas, reales y ausencias
 */

class HoursCalculator {
    constructor(convenioConfig, empleados, fichajes, ausencias) {
        this.convenioConfig = convenioConfig;
        this.empleados = empleados;
        this.fichajes = fichajes;
        this.ausencias = ausencias;
    }

    /**
     * Calcula horas teóricas para un período
     * (Para el período anterior al 06/06/2025, asumimos cumplimiento teórico)
     */
    calcularHorasTeoricas(fechaDesde, fechaHasta, empleadoId) {
        const dias = Math.floor((fechaHasta - fechaDesde) / (1000 * 60 * 60 * 24));
        const semanasCompletas = Math.floor(dias / 7);
        const diasRestantes = dias % 7;
        
        // Calcular horas teóricas por empleada: 5 días/semana × 8h/día = 40h/semana
        const horasSemanasCompletas = semanasCompletas * this.convenioConfig.dias_trabajo_empleada_semana * this.convenioConfig.horas_teoricas_dia;
        const horasDiasRestantes = Math.min(diasRestantes, this.convenioConfig.dias_trabajo_empleada_semana) * this.convenioConfig.horas_teoricas_dia;
        
        const totalTeorico = horasSemanasCompletas + horasDiasRestantes;
        
        return totalTeorico;
    }

    /**
     * Calcula horas reales fichadas (excluyendo fichajes durante ausencias)
     */
    calcularHorasReales(fechaDesde, fechaHasta, empleadoId, empleadoNombre) {
        console.log(`\n[1] Calculando Horas Reales Fichadas para ${empleadoNombre}:`);
        const ausenciasEmpleado = this.ausencias.filter(a => a.empleado_id === empleadoId && a.estado === 'aprobado');
        
        const fichajesEmpleado = this.fichajes.filter(f => {
            // Filtros básicos
            if (f.empleado_id !== empleadoId) return false;
            
            const fechaFichaje = new Date(f.fecha);
            if (isNaN(fechaFichaje.getTime()) || fechaFichaje < fechaDesde || fechaFichaje > fechaHasta) {
                return false;
            }

            // Excluir fichajes que ocurran durante un período de ausencia
            const estaEnAusencia = ausenciasEmpleado.some(ausencia => {
                const inicioAusencia = new Date(ausencia.fecha_inicio);
                const finAusencia = new Date(ausencia.fecha_fin);
                return fechaFichaje >= inicioAusencia && fechaFichaje <= finAusencia;
            });

            if (estaEnAusencia) {
                console.log(`   - [EXCLUIDO] Fichaje el ${f.fecha} (${f.horas_trabajadas || 0}h) por estar de ausencia.`);
                return false; // Se excluye el fichaje
            }

            console.log(`   - [INCLUIDO] Fichaje el ${f.fecha}: ${f.horas_trabajadas || 0}h`);
            return true; // Se incluye el fichaje
        });

        const totalReal = fichajesEmpleado.reduce((sum, f) => sum + (f.horas_trabajadas || 0), 0);
        
        console.log(`   ------------------------------------`);
        console.log(`   TOTAL HORAS FICHADAS: ${totalReal.toFixed(2)}h`);

        return totalReal;
    }

    /**
     * METODOLOGÍA JAVI 2.0 - Cálculo inteligente de ausencias
     * Solo cuenta días laborables según regla general del convenio
     */
    calcularHorasAusencias(fechaDesde, fechaHasta, empleadoId, empleadoNombre) {
        const ausenciasEmpleado = this.ausencias.filter(a => 
            a.empleado_id === empleadoId &&
            // Verificar solapamiento de fechas
            (new Date(a.fecha_inicio) <= fechaHasta && new Date(a.fecha_fin) >= fechaDesde)
        );
        const PROMEDIO_DIARIO_LEGAL = 40 / 7;

        if (ausenciasEmpleado.length > 0) {
            console.log(`\n[2] Ausencias Registradas para ${empleadoNombre}:`);
        }
        
        for (const ausencia of ausenciasEmpleado) {
            // Calcular días que se solapan con el período consultado
            const inicioReal = new Date(Math.max(new Date(ausencia.fecha_inicio), fechaDesde));
            const finReal = new Date(Math.min(new Date(ausencia.fecha_fin), fechaHasta));
            
            const diasNaturales = Math.floor((finReal - inicioReal) / (1000 * 60 * 60 * 24)) + 1;
            const valorHorasAusencia = diasNaturales * PROMEDIO_DIARIO_LEGAL;
            console.log(`   - ${ausencia.tipo.toUpperCase()} (${ausencia.fecha_inicio} → ${ausencia.fecha_fin}): ${diasNaturales} días naturales.`);
            console.log(`     (Esto reduce el "deber" de horas en ${valorHorasAusencia.toFixed(2)}h)`);
        }
        
        return 0; // Devuelve 0 porque las horas de ausencia ya no se suman, solo reducen la obligación
    }
}

// Exportar a window
window.HoursCalculator = HoursCalculator;
