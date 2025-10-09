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
     * IMPORTANTE: Usa fecha_inicio_computo si existe, sino usa fecha_alta, sino usa fecha_desde
     */
    calcularHorasReales(fechaDesde, fechaHasta, empleado) {
        const empleadoId = empleado.id;
        const empleadoNombre = empleado.name;
        
        const ausenciasEmpleado = this.ausencias.filter(a => a.empleado_id === empleadoId && a.estado === 'aprobado');
        
        // 🔧 LÓGICA DE PRIORIDAD PARA FECHA MÍNIMA:
        // 1. fecha_inicio_computo (si existe) - campo discreto para casos especiales
        // 2. fecha_alta (si existe) - fecha oficial del contrato
        // 3. fechaDesde - fecha por defecto del sistema
        let fechaMinima;
        
        if (empleado.fecha_inicio_computo) {
            fechaMinima = new Date(empleado.fecha_inicio_computo);
        } else if (empleado.fecha_alta) {
            fechaMinima = new Date(empleado.fecha_alta);
        } else {
            fechaMinima = fechaDesde;
        }
        
        const fichajesEmpleado = this.fichajes.filter(f => {
            // Filtros básicos
            if (f.empleado_id !== empleadoId) return false;
            
            const fechaFichaje = new Date(f.fecha);
            if (isNaN(fechaFichaje.getTime()) || fechaFichaje > fechaHasta) {
                return false;
            }
            
            // Filtrar fichajes anteriores a la fecha mínima determinada
            if (fechaFichaje < fechaMinima) {
                return false;
            }
            
            // Los fichajes previos a fecha_alta SÍ se cuentan si fecha_inicio_computo es anterior

            // Excluir fichajes que ocurran durante un período de ausencia
            const estaEnAusencia = ausenciasEmpleado.some(ausencia => {
                const inicioAusencia = new Date(ausencia.fecha_inicio);
                const finAusencia = new Date(ausencia.fecha_fin);
                return fechaFichaje >= inicioAusencia && fechaFichaje <= finAusencia;
            });

            return !estaEnAusencia; // Se excluye si está en ausencia
        });

        // Separar fichajes antes y después de fecha_alta (si fecha_inicio_computo es anterior)
        let fichajesAntesAlta = [];
        let fichajesDesdeAlta = fichajesEmpleado;
        
        // Solo hay fichajes "pre-alta" si fecha_inicio_computo es anterior a fecha_alta
        if (empleado.fecha_inicio_computo && empleado.fecha_alta) {
            const fechaAltaDate = new Date(empleado.fecha_alta);
            fichajesAntesAlta = fichajesEmpleado.filter(f => new Date(f.fecha) < fechaAltaDate);
            fichajesDesdeAlta = fichajesEmpleado.filter(f => new Date(f.fecha) >= fechaAltaDate);
        }
        
        const horasAntesAlta = fichajesAntesAlta.reduce((sum, f) => sum + (f.horas_trabajadas || 0), 0);
        const horasDesdeAlta = fichajesDesdeAlta.reduce((sum, f) => sum + (f.horas_trabajadas || 0), 0);
        const totalReal = horasAntesAlta + horasDesdeAlta;

        return totalReal;
    }

    /**
     * METODOLOGÍA JAVI 2.0 - Cálculo inteligente de ausencias
     * Solo cuenta días laborables según regla general del convenio
     * Actualizado: Usa tasa de devengo diario exacta (1776h / 365 días)
     */
    calcularHorasAusencias(fechaDesde, fechaHasta, empleadoId, empleadoNombre) {
        const ausenciasEmpleado = this.ausencias.filter(a => 
            a.empleado_id === empleadoId &&
            // Verificar solapamiento de fechas
            (new Date(a.fecha_inicio) <= fechaHasta && new Date(a.fecha_fin) >= fechaDesde)
        );
        
        return 0; // Devuelve 0 porque las horas de ausencia ya no se suman, solo reducen la obligación
    }
}

// Exportar a window
window.HoursCalculator = HoursCalculator;
