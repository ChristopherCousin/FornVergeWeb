/**
 * SISTEMA DE CONTROL ANUAL DEL CONVENIO - FORN VERGE
 * ====================================================
 * Enfoque desde la perspectiva de la encargada:
 * - Visión anual completa (enero-diciembre)
 * - Horas teóricas para períodos sin datos
 * - Ausencias como horas teóricas según convenio
 * - Planificación de semanas futuras
 */

class ConvenioAnualManager {
    constructor(supabase) {
        this.supabase = supabase;
        this.convenio = window.CONVENIO_CONFIG;
        
        // Estado
        this.empleados = [];
        this.fichajes = [];
        this.ausencias = [];
        this.stats_anuales = {};
        this.alertas_convenio = [];
        
        // Servicios
        this.dataService = new window.ConvenioDataService(supabase, this.convenio);
        this.renderer = new window.ConvenioRenderer(this.convenio);
    }

    async init() {
        try {
            await this.cargarDatos();
            await this.calcularEstadisticasAnuales();
            this.renderer.mostrarResumenAnual(this.stats_anuales, this.alertas_convenio);
            
            const alertGenerator = new window.AlertGenerator(this.alertas_convenio);
            alertGenerator.mostrarAlertasConvenio();
            
        } catch (error) {
            console.error('❌ Error inicializando Control Anual:', error);
        }
    }

    async cargarDatos() {
        // Cargar empleados, fichajes y ausencias
        this.empleados = await this.dataService.cargarEmpleados();
        this.fichajes = await this.dataService.cargarFichajes();
        this.ausencias = await this.dataService.cargarAusencias();
        
        // Validar fichajes durante ausencias
        if (this.ausencias.length > 0) {
            const validator = new window.AusenciasValidator(this.empleados, this.fichajes, this.ausencias);
            const alertaFichajes = validator.validarFichajesDuranteAusencias();
            
            if (alertaFichajes) {
                this.alertas_convenio.push(alertaFichajes);
            }
        }
    }

    async calcularEstadisticasAnuales() {
        const hoy = new Date();
        const inicioAño = new Date(this.convenio.inicio_año);
        const inicioReales = new Date(this.convenio.inicio_datos_reales);
        
        // Inicializar calculadoras
        const hoursCalc = new window.HoursCalculator(this.convenio, this.empleados, this.fichajes, this.ausencias);
        const shiftsCalc = new window.ShiftsCalculator(this.empleados, this.fichajes);
        const complianceAnalyzer = new window.ComplianceAnalyzer(this.convenio, this.fichajes);
        const projectionCalc = new window.ProjectionCalculator(this.convenio, this.empleados, this.fichajes, this.ausencias);
        
        for (const empleado of this.empleados) {
            // Excluir empleados marcados como no sujetos al convenio (desde BD)
            if (empleado.excluido_convenio === true) {
                console.log(`⏭️ ${empleado.name} excluido del convenio (socio/autónomo)`);
                continue;
            }
            
            console.log(`\n\n============== 📊 ANALIZANDO A ${empleado.name.toUpperCase()} ==============`);
            
            // Determinar fecha de inicio real para este empleado
            const fechaInicioReal = empleado.fecha_alta ? new Date(empleado.fecha_alta) : inicioReales;
            
            // Crear objeto de estadísticas
            const stats = {
                empleado_id: empleado.id,
                empleado_nombre: empleado.name,
                
                // Horas teóricas (eliminadas - no hay datos antes del 6/6/2025)
                horas_teoricas_pre_agora: 0,
                
                // Horas reales desde fecha de alta
                horas_reales_agora: hoursCalc.calcularHorasReales(fechaInicioReal, hoy, empleado.id, empleado.name),
                
                // Horas por ausencias
                horas_ausencias: hoursCalc.calcularHorasAusencias(inicioAño, hoy, empleado.id, empleado.name),
                
                // Partidos y turnos de mañana
                total_partidos: shiftsCalc.calcularPartidos(empleado.id),
                total_turnos_mañana: shiftsCalc.calcularTurnosMañana(empleado.id),
                
                // Totales
                total_horas_año: 0,
                total_dias_trabajados: 0,
                
                // Análisis de cumplimiento
                excesos_diarios: [],
                violaciones_descanso: [],
                semanas_exceso: [],
                
                // Proyección
                horas_restantes_año: 0,
                dias_laborables_restantes: 0,
                promedio_horas_dia_necesario: 0,
                media_semanal_real: 0,
                horas_recomendadas_semana: 0,
                estado_semanal: '',
                recomendacion_compensacion: ''
            };
            
            // Calcular totales
            stats.total_horas_año = stats.horas_reales_agora;
            
            // Analizar cumplimiento del convenio
            const resultadoCompliance = complianceAnalyzer.analizarCumplimientoConvenio(empleado.id, empleado.name);
            stats.excesos_diarios = resultadoCompliance.excesos_diarios;
            stats.violaciones_descanso = resultadoCompliance.violaciones_descanso;
            stats.semanas_exceso = resultadoCompliance.semanas_exceso;
            
            // Agregar alertas de compliance
            this.alertas_convenio.push(...resultadoCompliance.alertas);
            
            // Calcular proyección para resto del año
            const resultadoProyeccion = projectionCalc.calcularProyeccion(stats, hoy, empleado);
            
            // Agregar alertas de proyección
            if (resultadoProyeccion.alertas) {
                this.alertas_convenio.push(...resultadoProyeccion.alertas);
            }
            
            this.stats_anuales[empleado.id] = stats;
        }
    }

    // ===== API PÚBLICA =====
    
    /**
     * Obtiene estadísticas de un empleado
     */
    getEstadoEmpleado(empleadoId) {
        return this.stats_anuales[empleadoId];
    }

    /**
     * Recomienda horas para semana futura
     */
    recomendarHorasSemana(empleadoId) {
        const stats = this.stats_anuales[empleadoId];
        if (!stats) return null;
        
        return {
            horas_disponibles: Math.min(
                this.convenio.horas_maximas_semana,
                Math.max(0, stats.horas_restantes_año / (stats.dias_laborables_restantes / this.convenio.dias_trabajo_empleada_semana))
            ),
            recomendacion: stats.promedio_horas_dia_necesario <= 8 ? 'normal' : 'reducir'
        };
    }
}

// Exportar a window
window.ConvenioAnualManager = ConvenioAnualManager;
