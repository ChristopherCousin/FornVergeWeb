/**
 * RIESGO CALCULATOR
 * =================
 * Calcula escenarios y riesgo de liquidar horas ahora vs esperar
 */

class RiesgoCalculator {
    constructor(empleado, balance, ausencias, fichajes, config) {
        this.empleado = empleado;
        this.balance = balance;
        this.ausencias = ausencias;
        this.fichajes = fichajes;
        this.config = config;
    }

    /**
     * Analiza el riesgo de liquidar ahora
     */
    analizar(finPeriodo) {
        const ahora = new Date();
        
        // Calcular días restantes
        const diasRestantes = Math.ceil((finPeriodo - ahora) / (1000 * 60 * 60 * 24));
        
        // Analizar ausencias futuras
        const ausenciasInfo = this.analizarAusenciasFuturas(finPeriodo);
        
        // Días realmente trabajables
        const diasTrabajables = Math.max(0, diasRestantes - ausenciasInfo.diasAusencia);
        
        // Horas ideales por día según convenio (40.5h / 7 días)
        const HORAS_IDEALES_DIA = 40.5 / 7; // 5.7857h
        
        // Calcular escenarios
        const horasIdealesRestantes = diasTrabajables * HORAS_IDEALES_DIA;
        
        // Calcular media de horas reales del empleado
        const mediaHorasDiarias = this.calcularMediaHorasDiarias();
        const horasEsperadasRestantes = diasTrabajables * mediaHorasDiarias;
        
        // Escenarios
        const escenarios = {
            mejor: {
                nombre: 'Mejor caso',
                descripcion: 'Trabaja todas las horas ideales',
                balanceFinal: this.balance.pendiente_pago + horasIdealesRestantes,
                variacion: horasIdealesRestantes
            },
            esperado: {
                nombre: 'Caso esperado',
                descripcion: 'Continúa con su media actual',
                balanceFinal: this.balance.pendiente_pago + (horasEsperadasRestantes - horasIdealesRestantes),
                variacion: horasEsperadasRestantes - horasIdealesRestantes
            },
            peor: {
                nombre: 'Peor caso',
                descripcion: 'No trabaja ninguna hora',
                balanceFinal: this.balance.pendiente_pago - horasIdealesRestantes,
                variacion: -horasIdealesRestantes
            }
        };

        // Calcular nivel de riesgo
        const nivelRiesgo = this.calcularNivelRiesgo(escenarios, diasTrabajables);
        
        // Calcular cantidades recomendadas
        const recomendaciones = this.calcularRecomendaciones(escenarios, nivelRiesgo);

        return {
            diasRestantes,
            diasTrabajables,
            diasAusencia: ausenciasInfo.diasAusencia,
            ausenciasFuturas: ausenciasInfo.ausencias,
            horasIdealesRestantes,
            escenarios,
            nivelRiesgo,
            recomendaciones,
            finPeriodo,
            mediaHorasDiarias
        };
    }

    /**
     * Analiza ausencias futuras del empleado
     */
    analizarAusenciasFuturas(fechaFinPeriodo) {
        const ahora = new Date();
        
        const ausenciasFuturas = this.ausencias.filter(a => 
            a.empleado_id === this.empleado.id &&
            a.estado === 'aprobado' &&
            new Date(a.fecha_fin) >= ahora &&
            new Date(a.fecha_inicio) <= fechaFinPeriodo
        );

        let diasAusencia = 0;
        
        ausenciasFuturas.forEach(ausencia => {
            const inicio = new Date(Math.max(ahora, new Date(ausencia.fecha_inicio)));
            const fin = new Date(Math.min(fechaFinPeriodo, new Date(ausencia.fecha_fin)));
            
            const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
            diasAusencia += dias;
        });

        return {
            ausencias: ausenciasFuturas,
            diasAusencia
        };
    }

    /**
     * Calcula la media de horas diarias que trabaja el empleado
     */
    calcularMediaHorasDiarias() {
        const fichajesEmpleado = this.fichajes.filter(f => f.empleado_id === this.empleado.id);
        
        if (fichajesEmpleado.length === 0) {
            return 40.5 / 7; // Media del convenio por defecto
        }

        const totalHoras = fichajesEmpleado.reduce((sum, f) => sum + (f.horas_trabajadas || 0), 0);
        const diasTrabajados = fichajesEmpleado.length;

        return totalHoras / diasTrabajados;
    }

    /**
     * Calcula el nivel de riesgo
     */
    calcularNivelRiesgo(escenarios, diasTrabajables) {
        const balancePeorCaso = escenarios.peor.balanceFinal;
        const margenSeguridad = this.config.margen_seguridad_horas || 5;

        // Nivel de riesgo basado en el peor escenario
        if (balancePeorCaso < -margenSeguridad) {
            return {
                nivel: 'ALTO',
                descripcion: 'Alto riesgo de sobrepago',
                color: 'red',
                icono: '🔴'
            };
        } else if (balancePeorCaso < 0) {
            return {
                nivel: 'MEDIO',
                descripcion: 'Riesgo moderado',
                color: 'orange',
                icono: '🟡'
            };
        } else if (diasTrabajables > 3) {
            return {
                nivel: 'BAJO',
                descripcion: 'Riesgo controlado, pero quedan días',
                color: 'yellow',
                icono: '🟢'
            };
        } else {
            return {
                nivel: 'MUY_BAJO',
                descripcion: 'Muy bajo riesgo',
                color: 'green',
                icono: '✅'
            };
        }
    }

    /**
     * Calcula recomendaciones de cantidad a pagar
     */
    calcularRecomendaciones(escenarios, nivelRiesgo) {
        const margenSeguridad = this.config.margen_seguridad_horas || 5;
        
        // Cantidad SEGURA (asumiendo peor caso + margen)
        const cantidadSegura = Math.max(0, escenarios.peor.balanceFinal - margenSeguridad);
        
        // Cantidad MODERADA (50% del riesgo)
        const cantidadModerada = Math.max(0, this.balance.pendiente_pago - (Math.abs(escenarios.peor.variacion) / 2));
        
        // Cantidad TOTAL (todo)
        const cantidadTotal = this.balance.pendiente_pago;

        return {
            segura: {
                horas: cantidadSegura,
                descripcion: 'Garantizada incluso en el peor caso',
                nivel: 'SEGURO',
                color: 'green'
            },
            moderada: {
                horas: cantidadModerada,
                descripcion: 'Con margen de seguridad del 50%',
                nivel: 'MODERADO',
                color: 'blue'
            },
            total: {
                horas: cantidadTotal,
                descripcion: 'Bajo tu responsabilidad',
                nivel: nivelRiesgo.nivel,
                color: nivelRiesgo.color
            }
        };
    }

    /**
     * Genera mensaje de recomendación
     */
    getMensajeRecomendacion(analisis) {
        const { nivelRiesgo, recomendaciones, diasTrabajables, finPeriodo } = analisis;

        if (nivelRiesgo.nivel === 'ALTO') {
            return {
                titulo: '⚠️ NO RECOMENDADO',
                mensaje: `Pagar ahora tiene alto riesgo. El empleado podría quedar en negativo si no trabaja los ${diasTrabajables} días restantes.`,
                accion: `Espera hasta ${finPeriodo.toLocaleDateString('es-ES')} para tener 0% riesgo`,
                alternativa: `O paga solo ${recomendaciones.segura.horas.toFixed(1)}h (cantidad segura)`
            };
        } else if (nivelRiesgo.nivel === 'MEDIO') {
            return {
                titulo: '⚠️ PRECAUCIÓN',
                mensaje: `Hay riesgo moderado. Quedan ${diasTrabajables} días trabajables.`,
                accion: `Recomendado pagar ${recomendaciones.moderada.horas.toFixed(1)}h (margen de seguridad)`,
                alternativa: `O espera hasta ${finPeriodo.toLocaleDateString('es-ES')}`
            };
        } else if (nivelRiesgo.nivel === 'BAJO') {
            return {
                titulo: '✅ RIESGO BAJO',
                mensaje: `Puedes pagar, pero quedan ${diasTrabajables} días.`,
                accion: `Puedes pagar hasta ${recomendaciones.moderada.horas.toFixed(1)}h con seguridad`,
                alternativa: `Para máxima seguridad, espera hasta ${finPeriodo.toLocaleDateString('es-ES')}`
            };
        } else {
            return {
                titulo: '✅ SIN RIESGO',
                mensaje: 'El periodo está casi terminado o ya terminó.',
                accion: `Puedes pagar todo: ${recomendaciones.total.horas.toFixed(1)}h`,
                alternativa: null
            };
        }
    }
}

// Exportar a window
window.RiesgoCalculator = RiesgoCalculator;

