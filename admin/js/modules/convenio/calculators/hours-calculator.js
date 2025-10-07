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
        
        // Solo log para Raquel con análisis detallado
        if (empleadoNombre.toUpperCase() === 'RAQUEL') {
            console.log(`\n🔍 [RAQUEL] Calculando Horas Reales Fichadas:`);
        }
        const ausenciasEmpleado = this.ausencias.filter(a => a.empleado_id === empleadoId && a.estado === 'aprobado');
        
        // 🔧 LÓGICA DE PRIORIDAD PARA FECHA MÍNIMA:
        // 1. fecha_inicio_computo (si existe) - campo discreto para casos especiales
        // 2. fecha_alta (si existe) - fecha oficial del contrato
        // 3. fechaDesde - fecha por defecto del sistema
        let fechaMinima;
        let origenFecha;
        
        if (empleado.fecha_inicio_computo) {
            fechaMinima = new Date(empleado.fecha_inicio_computo);
            origenFecha = '🔧 Ref. Sistema';
        } else if (empleado.fecha_alta) {
            fechaMinima = new Date(empleado.fecha_alta);
            origenFecha = '📅 Fecha Alta';
        } else {
            fechaMinima = fechaDesde;
            origenFecha = '⚙️ Fecha Sistema';
        }
        
        if (empleadoNombre.toUpperCase() === 'RAQUEL') {
            console.log(`   ${origenFecha}: Contando fichajes desde ${fechaMinima.toISOString().split('T')[0]}`);
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

            if (estaEnAusencia) {
                console.log(`   - [EXCLUIDO] Fichaje el ${f.fecha} (${f.horas_trabajadas || 0}h) por estar de ausencia.`);
                return false; // Se excluye el fichaje
            }
            return true; // Se incluye el fichaje
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
        
        if (empleadoNombre.toUpperCase() === 'RAQUEL') {
            console.log(`   ------------------------------------`);
            console.log(`   📊 Fichajes válidos encontrados: ${fichajesEmpleado.length}`);
            if (horasAntesAlta > 0) {
                console.log(`   🎁 HORAS PRE-ALTA (extras puras): ${horasAntesAlta.toFixed(2)}h`);
            }
            console.log(`   ✅ TOTAL HORAS FICHADAS: ${totalReal.toFixed(2)}h`);
            
            // ANÁLISIS DETALLADO POR SEMANAS
            console.log(`\n   📅 ANÁLISIS SEMANAL:`);
            const fichajesPorSemana = {};
            fichajesEmpleado.forEach(fich => {
                const fecha = new Date(fich.fecha);
                const lunes = new Date(fecha);
                lunes.setDate(fecha.getDate() - fecha.getDay() + 1);
                const semana = lunes.toISOString().split('T')[0];
                if (!fichajesPorSemana[semana]) fichajesPorSemana[semana] = [];
                fichajesPorSemana[semana].push(fich);
            });
            
            Object.keys(fichajesPorSemana).sort().forEach((semana, idx) => {
                const fichajes = fichajesPorSemana[semana];
                const horas = fichajes.reduce((s, f) => s + (f.horas_trabajadas || 0), 0);
                const indicador = horas > 45 ? '🔴' : horas > 40 ? '🟡' : horas < 30 ? '🔵' : '✅';
                console.log(`   ${indicador} Semana ${idx + 1} (${semana}): ${fichajes.length} días → ${horas.toFixed(2)}h`);
            });
        }

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
        const PROMEDIO_DIARIO_LEGAL = 40.5 / 7;  // 5.7857h/día - Promedio semanal hostelería

        if (ausenciasEmpleado.length > 0 && empleadoNombre.toUpperCase() === 'RAQUEL') {
            console.log(`\n🔍 [RAQUEL] Ausencias Registradas:`);
            
            for (const ausencia of ausenciasEmpleado) {
                // Calcular días que se solapan con el período consultado
                const inicioReal = new Date(Math.max(new Date(ausencia.fecha_inicio), fechaDesde));
                const finReal = new Date(Math.min(new Date(ausencia.fecha_fin), fechaHasta));
                
                const diasNaturales = Math.floor((finReal - inicioReal) / (1000 * 60 * 60 * 24)) + 1;
                const valorHorasAusencia = diasNaturales * PROMEDIO_DIARIO_LEGAL;
                console.log(`   - ${ausencia.tipo.toUpperCase()} (${ausencia.fecha_inicio} → ${ausencia.fecha_fin}): ${diasNaturales} días naturales.`);
                console.log(`     (Esto reduce el "deber" de horas en ${valorHorasAusencia.toFixed(2)}h)`);
            }
        }
        
        return 0; // Devuelve 0 porque las horas de ausencia ya no se suman, solo reducen la obligación
    }
}

// Exportar a window
window.HoursCalculator = HoursCalculator;
