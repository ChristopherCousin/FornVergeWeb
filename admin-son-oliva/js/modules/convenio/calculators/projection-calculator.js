/**
 * CALCULADORA DE PROYECCIÓN
 * =========================
 * Calcula proyecciones y recomendaciones para resto del año
 */

class ProjectionCalculator {
    constructor(convenioConfig, empleados, fichajes, ausencias) {
        this.convenioConfig = convenioConfig;
        this.empleados = empleados;
        this.fichajes = fichajes;
        this.ausencias = ausencias;
    }

    /**
     * Calcula proyección y compensación histórica para un empleado
     */
    calcularProyeccion(stats, fechaActual, empleado) {
        const finAño = new Date('2025-12-31');
        const diasRestantes = Math.floor((finAño - fechaActual) / (1000 * 60 * 60 * 24));
        const semanasRestantes = Math.floor(diasRestantes / 7);
        
        // ====== CALCULAR MEDIA SEMANAL SOLO DE SEMANAS COMPLETAS ======
        const fichajesEmpleado = this.fichajes.filter(f => f.empleado_id === stats.empleado_id);
        const semanasConDatos = window.ConvenioUtils.agruparPorSemanas(fichajesEmpleado);
        
        // Filtrar solo semanas COMPLETAS (que ya terminaron)
        const hoy = new Date();
        const inicioSemanaActual = new Date(hoy);
        inicioSemanaActual.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes de esta semana
        const claveSeccionActual = inicioSemanaActual.toISOString().split('T')[0];
        
        // Calcular solo con semanas REALMENTE completas o mayormente completas
        const semanasCompletas = {};
        let horasSemanasCompletas = 0;
        
        Object.keys(semanasConDatos).forEach(claveSeccion => {
            const fichajes = semanasConDatos[claveSeccion];
            const horasEstaSemana = fichajes.reduce((sum, f) => sum + (f.horas_trabajadas || 0), 0);
            
            if (claveSeccion === claveSeccionActual) {
                // Es la semana actual - incluir solo si ya tiene varios días trabajados
                const hoy = new Date();
                const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes, ... 6=sábado
                const diasTranscurridos = diaSemana === 0 ? 7 : diaSemana;
                
                // Si ya pasaron 4+ días de la semana Y tiene fichajes, incluirla
                if (diasTranscurridos >= 4 && fichajes.length >= 2) {
                    semanasCompletas[claveSeccion] = fichajes;
                    horasSemanasCompletas += horasEstaSemana;
                }
            } else {
                // Semana pasada - incluir siempre
                semanasCompletas[claveSeccion] = fichajes;
                horasSemanasCompletas += horasEstaSemana;
            }
        });
        
        const numSemanasCompletas = Object.keys(semanasCompletas).length;
        
        // Media semanal REAL basándose solo en semanas completas (inicial)
        let mediaSemanalInicial = numSemanasCompletas > 0 ? 
            horasSemanasCompletas / numSemanasCompletas : 0;
        
        // Horas que faltan para llegar al máximo anual
        stats.horas_restantes_año = Math.max(0, this.convenioConfig.horas_maximas_anuales - stats.total_horas_año);
        
        // Cálculo realista para resto del año
        if (semanasRestantes > 0) {
            stats.horas_recomendadas_semana = stats.horas_restantes_año / semanasRestantes;
        } else {
            stats.horas_recomendadas_semana = 0;
        }
        
        // ====== VERIFICAR SI ESTÁ ACTUALMENTE DE AUSENCIA ======
        const fechaActualSinHora = fechaActual.toISOString().split('T')[0];
        
        const ausenciaActual = this.ausencias.find(ausencia => 
            ausencia.empleado_id === stats.empleado_id &&
            ausencia.fecha_inicio <= fechaActualSinHora &&
            ausencia.fecha_fin >= fechaActualSinHora &&
            ausencia.estado === 'aprobado'
        );
        
        if (ausenciaActual) {
            stats.estado_semanal = 'de_ausencia';
            stats.recomendacion_compensacion = 'Análisis pausado durante ausencia';
            // CONTINUAR análisis para calcular compensación histórica
        }
        
        // ====== ANÁLISIS DE COMPENSACIÓN HISTÓRICA ======
        const fechaInicioReal = empleado.fecha_alta ? new Date(empleado.fecha_alta) : new Date(this.convenioConfig.inicio_datos_reales);
        
        // Si la fecha de alta es futura, el balance es 0
        if (fechaInicioReal > fechaActual) {
            stats.diferencia_carga_trabajo = 0;
            stats.horas_ideales_desde_junio = 0;
            stats.estado_semanal = 'futuro';
            stats.recomendacion_compensacion = 'El empleado empieza en el futuro';
            return { alertas: [] };
        }

        const diasTotalesDesdeInicio = Math.floor((fechaActual - fechaInicioReal) / (1000 * 60 * 60 * 24));
        
        // Calcular días que estuvo ausente
        const fechaInicioStr = fechaInicioReal.toISOString().split('T')[0];
        const fechaActualStr = fechaActual.toISOString().split('T')[0];
        
        let diasAusencia = 0;
        this.ausencias
            .filter(a => a.empleado_id === stats.empleado_id && a.estado === 'aprobado')
            .forEach(ausencia => {
                const inicioAusencia = ausencia.fecha_inicio >= fechaInicioStr ? ausencia.fecha_inicio : fechaInicioStr;
                const finAusencia = ausencia.fecha_fin <= fechaActualStr ? ausencia.fecha_fin : fechaActualStr;
                
                if (inicioAusencia <= finAusencia) {
                    const diasEstaAusencia = Math.floor((new Date(finAusencia) - new Date(inicioAusencia)) / (1000 * 60 * 60 * 24)) + 1;
                    diasAusencia += diasEstaAusencia;
                }
            });
        
        // Días realmente disponibles para trabajar
        const diasDisponibles = diasTotalesDesdeInicio - diasAusencia;
        
        // ✅ NUEVA LÓGICA DE CÁLCULO (Opción 1 del usuario - 25/11/2025)
        const esMediaJornada = stats.empleado_nombre.toUpperCase().includes('GABY');
        const HORAS_SEMANALES_CONVENIO = esMediaJornada ? 25 : 40;
        const PROMEDIO_DIARIO_LEGAL = HORAS_SEMANALES_CONVENIO / 7;

        // Horas ideales según días disponibles
        const horasIdealesParaDiasDisponibles = diasDisponibles * PROMEDIO_DIARIO_LEGAL;
        const horasFichadasReales = stats.horas_reales_agora;
        const diferenciaCargaTrabajo = horasFichadasReales - horasIdealesParaDiasDisponibles;
        
        console.log(`\n[3] Calculando Balance Final para ${stats.empleado_nombre}:`);
        console.log(`   - Período analizado: ${fechaInicioReal.toISOString().split('T')[0]} a ${fechaActual.toISOString().split('T')[0]}`);
        console.log(`   ------------------------------------`);
        console.log(`   A. Días Totales en período: ${diasTotalesDesdeInicio}`);
        console.log(`   B. Días de Ausencia: ${diasAusencia}`);
        console.log(`   C. Días de Obligación de Trabajo (A - B): ${diasDisponibles}`);
        console.log(`   ------------------------------------`);
        console.log(`   D. Horas a Realizar (C * ${PROMEDIO_DIARIO_LEGAL.toFixed(2)}h/día): ${horasIdealesParaDiasDisponibles.toFixed(2)}h`);
        console.log(`   E. Horas Fichadas Reales (de [1]): ${horasFichadasReales.toFixed(2)}h`);
        console.log(`   ------------------------------------`);
        console.log(`   SALDO FINAL (E - D): ${diferenciaCargaTrabajo.toFixed(2)}h`);
        if (diferenciaCargaTrabajo < 0) {
            console.log(`   ==> ${stats.empleado_nombre} DEBE ${Math.abs(diferenciaCargaTrabajo).toFixed(2)}h a la empresa.`);
        } else {
            console.log(`   ==> La empresa DEBE ${diferenciaCargaTrabajo.toFixed(2)}h a ${stats.empleado_nombre}.`);
        }
        console.log(`============== FIN ANÁLISIS ${stats.empleado_nombre.toUpperCase()} ==============`);

        // Guardar diferencia de carga
        stats.diferencia_carga_trabajo = diferenciaCargaTrabajo;
        stats.horas_ideales_desde_junio = horasIdealesParaDiasDisponibles; 
        
        // ====== CALCULAR MEDIA SEMANAL CORRECTA ======
        const totalDiasTrabajados = fichajesEmpleado.length;
        const horasPorDia = totalDiasTrabajados > 0 ? stats.horas_reales_agora / totalDiasTrabajados : 0;
        const mediaPorDias = horasPorDia * this.convenioConfig.dias_trabajo_empleada_semana;
        
        const diferenciaPorcentual = Math.abs(mediaSemanalInicial - mediaPorDias) / mediaPorDias * 100;
        
        if (numSemanasCompletas >= 3 && mediaSemanalInicial > 35 && diferenciaPorcentual < 15) {
            stats.media_semanal_real = mediaSemanalInicial;
        } else {
            stats.media_semanal_real = mediaPorDias;
        }
        
        // Crear recomendaciones
        if (stats.horas_reales_agora < 50) {
            if (stats.estado_semanal !== 'de_ausencia') {
                const diasDesdeInicio = Math.floor((new Date() - new Date(fechaInicioStr)) / (1000 * 60 * 60 * 24));
                
                if (diasDesdeInicio < 14) {
                    stats.estado_semanal = 'empleado_nuevo';
                    stats.recomendacion_compensacion = `Empleado nuevo (${diasDesdeInicio} días) - Analizar compensación`;
                } else {
                    stats.estado_semanal = 'sin_datos';
                    stats.recomendacion_compensacion = 'Pocos datos históricos - Seguir con horarios normales';
                }
            }
        }
        
        // NO modificar estado si ya está marcado como ausente
        if (stats.estado_semanal === 'de_ausencia') {
            return { alertas: [] };
        }
        
        const alertas = [];
        
        // Clasificar según carga de trabajo
        if (stats.diferencia_carga_trabajo === 0 && diasTotalesDesdeInicio <= 0) {
            stats.estado_semanal = 'futuro';
            stats.recomendacion_compensacion = `Empieza el ${new Date(empleado.fecha_alta).toLocaleDateString()}`;
        } else if (Math.abs(diferenciaCargaTrabajo) <= 1) {
            stats.estado_semanal = 'equilibrado';
            stats.recomendacion_compensacion = `Equilibrio perfecto (${diferenciaCargaTrabajo >= 0 ? '+' : ''}${diferenciaCargaTrabajo.toFixed(0)}h vs ideal)`;
        } else if (diferenciaCargaTrabajo > 1) {
            stats.estado_semanal = 'sobrecarga';
            stats.recomendacion_compensacion = `Ha trabajado MUCHO (+${diferenciaCargaTrabajo.toFixed(0)}h vs ideal) - Reducir carga próximas semanas`;
            
            alertas.push({
                empleado: stats.empleado_nombre,
                tipo: 'sobrecarga_historica',
                diferencia: diferenciaCargaTrabajo.toFixed(0),
                gravedad: diferenciaCargaTrabajo > 40 ? 'alta' : 'media'
            });
        } else {
            stats.estado_semanal = 'subcarga';
            stats.recomendacion_compensacion = `Ha trabajado POCO (${diferenciaCargaTrabajo.toFixed(0)}h vs ideal) - Aumentar carga próximas semanas`;
            
            alertas.push({
                empleado: stats.empleado_nombre,
                tipo: 'subcarga_historica', 
                diferencia: Math.abs(diferenciaCargaTrabajo).toFixed(0),
                gravedad: Math.abs(diferenciaCargaTrabajo) > 40 ? 'alta' : 'media'
            });
        }
        
        // Alerta si cerca del límite anual
        if (stats.total_horas_año > this.convenioConfig.horas_maximas_anuales * 0.8) {
            alertas.push({
                empleado: stats.empleado_nombre,
                tipo: 'cerca_limite_anual',
                porcentaje: (stats.total_horas_año / this.convenioConfig.horas_maximas_anuales * 100).toFixed(1),
                gravedad: stats.total_horas_año > this.convenioConfig.horas_maximas_anuales * 0.9 ? 'alta' : 'media'
            });
        }
        
        return { alertas };
    }
}

// Exportar a window
window.ProjectionCalculator = ProjectionCalculator;
