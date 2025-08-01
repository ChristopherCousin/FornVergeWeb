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
        this.empleados = [];
        this.fichajes = [];
        this.ausencias = [];
        
        // ============================================
        // CONFIGURACIÓN DEL CONVENIO DE BALEARES
        // ============================================
        this.convenio = {
            // Límites diarios
            horas_maximas_dia: 9,
            descanso_minimo_entre_turnos: 10, // horas
            
            // Límites semanales
            horas_maximas_semana: 40,
            dias_maximos_consecutivos: 6,
            
            // Límites anuales (estos son los CRÍTICOS para la encargada)
            horas_maximas_anuales: 1776,  // Convenio Hostelería Baleares 2023-2025
            horas_teoricas_dia: 6.8,      // Horas teóricas según convenio REAL
            dias_trabajo_empleada_semana: 6, // Cada empleada trabaja 6 días/semana (libra 1 día)
            
            // Fechas importantes
            inicio_año: '2025-01-01',
            inicio_datos_reales: '2025-06-06', // Desde cuándo tenemos datos de Ágora
            
            // Empleados excluidos del convenio
            excluidos: ['BRYAN'] // Socio/autónomo
        };
        
        this.stats_anuales = {};
        this.alertas_convenio = [];
    }

    async init() {
        console.log('📊 Iniciando Control Anual del Convenio...');
        
        try {
            await this.cargarDatos();
            await this.calcularEstadisticasAnuales();
            this.mostrarResumenAnual();
            this.mostrarAlertasConvenio();
            
            console.log('✅ Control Anual inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando Control Anual:', error);
        }
    }

    async cargarDatos() {
        // console.log('🔍 Cargando datos para análisis anual...');
        
        // Cargar empleados (excluir admins)
        const { data: empleados } = await this.supabase
            .from('employees')
            .select('id, name, role')
            .neq('role', 'admin')
            .order('name');
        
        this.empleados = empleados || [];
        // console.log(`👥 ${this.empleados.length} empleados cargados`);
        
        // Cargar fichajes desde inicio de año
        const { data: fichajes } = await this.supabase
            .from('fichajes')
            .select('*')
            .gte('fecha', this.convenio.inicio_año)
            .order('fecha', { ascending: false });
        
        this.fichajes = fichajes || [];
        // console.log(`📋 ${this.fichajes.length} fichajes cargados desde enero`);
        
        // ====== DEBUG: IMPRIMIR TODOS LOS FICHAJES ======
        // console.log('\n🔍 ======== TODOS LOS FICHAJES DE SUPABASE ========');
        console.log('Filtro: fecha >= ' + this.convenio.inicio_año);
        // console.log('Total fichajes:', this.fichajes.length);
        // console.log('\n📊 DESGLOSE POR EMPLEADO:');
        
        // Agrupar por empleado
        const fichajesPorEmpleado = {};
        this.fichajes.forEach(fichaje => {
            const empleadoId = fichaje.empleado_id;
            if (!fichajesPorEmpleado[empleadoId]) {
                fichajesPorEmpleado[empleadoId] = [];
            }
            fichajesPorEmpleado[empleadoId].push(fichaje);
        });
        
        // Imprimir por empleado
        for (const [empleadoId, fichajesEmpleado] of Object.entries(fichajesPorEmpleado)) {
            const empleado = this.empleados.find(e => e.id === empleadoId);
            const nombreEmpleado = empleado ? empleado.name : `ID:${empleadoId}`;
            
            // console.log(`\n👤 ${nombreEmpleado.toUpperCase()} (${fichajesEmpleado.length} fichajes):`);
            
            // Ordenar por fecha
            fichajesEmpleado.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            
            let totalHoras = 0;
            fichajesEmpleado.forEach((fichaje, index) => {
                const fecha = new Date(fichaje.fecha);
                const diaSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fecha.getDay()];
                const fechaStr = fecha.toLocaleDateString('es-ES');
                const horas = fichaje.horas_trabajadas || 0;
                totalHoras += horas;
                
                // console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${fechaStr} (${diaSemana}) → ${horas.toFixed(1)}h`);
            });
            
            // console.log(`   📊 TOTAL: ${totalHoras.toFixed(1)} horas`);
            // console.log(`   📅 Primer fichaje: ${fichajesEmpleado[0]?.fecha || 'N/A'}`);
            // console.log(`   📅 Último fichaje: ${fichajesEmpleado[fichajesEmpleado.length - 1]?.fecha || 'N/A'}`);
        }
        
        // console.log('\n🔍 ======== FIN LISTADO FICHAJES ========\n');
        
        // Cargar ausencias activas este año
        const { data: ausencias } = await this.supabase
            .from('ausencias')
            .select('*')
            .gte('fecha_inicio', this.convenio.inicio_año)
            .eq('estado', 'aprobado')
            .order('fecha_inicio');
        
        this.ausencias = ausencias || [];
        // console.log(`🏖️ ${this.ausencias.length} ausencias aprobadas este año`);
        
        // Debug: mostrar ausencias por empleado
        if (this.ausencias.length > 0) {
            // console.log('\n📋 AUSENCIAS REGISTRADAS:');
            this.ausencias.forEach(ausencia => {
                const empleado = this.empleados.find(e => e.id === ausencia.empleado_id);
                const nombreEmpleado = empleado ? empleado.name : `ID:${ausencia.empleado_id}`;
                // console.log(`  👤 ${nombreEmpleado} (ID: ${ausencia.empleado_id}): ${ausencia.tipo} | ${ausencia.fecha_inicio} → ${ausencia.fecha_fin} | Estado: ${ausencia.estado}`);
            });
            
            // ===== VALIDACIÓN DE FICHAJES DURANTE AUSENCIAS =====
            // console.log('\n🔍 VALIDANDO FICHAJES DURANTE AUSENCIAS:');
            this.validarFichajesDuranteAusencias();
        }
    }

    validarFichajesDuranteAusencias() {
        const fichajesInvalidos = [];
        
        this.fichajes.forEach(fichaje => {
            const fechaFichaje = fichaje.fecha;
            const empleadoId = fichaje.empleado_id;
            
            // Buscar si hay ausencias activas en esta fecha
            const ausenciaActiva = this.ausencias.find(ausencia => 
                ausencia.empleado_id === empleadoId &&
                ausencia.fecha_inicio <= fechaFichaje &&
                ausencia.fecha_fin >= fechaFichaje &&
                ausencia.estado === 'aprobado'
            );
            
            if (ausenciaActiva) {
                const empleado = this.empleados.find(e => e.id === empleadoId);
                const nombreEmpleado = empleado ? empleado.name : `ID:${empleadoId}`;
                
                fichajesInvalidos.push({
                    empleado: nombreEmpleado,
                    fecha: fechaFichaje,
                    horas: fichaje.horas_trabajadas,
                    tipoAusencia: ausenciaActiva.tipo,
                    inicioAusencia: ausenciaActiva.fecha_inicio,
                    finAusencia: ausenciaActiva.fecha_fin
                });
                
                // console.log(`🚨 FICHAJE INVÁLIDO: ${nombreEmpleado} trabajó ${fichaje.horas_trabajadas}h el ${fechaFichaje} durante ${ausenciaActiva.tipo} (${ausenciaActiva.fecha_inicio} → ${ausenciaActiva.fecha_fin})`);
            }
        });
        
        if (fichajesInvalidos.length > 0) {
            // console.log(`⚠️ TOTAL: ${fichajesInvalidos.length} fichajes durante ausencias detectados`);
            this.alertas_convenio.push({
                tipo: 'fichajes_durante_ausencia',
                fichajes: fichajesInvalidos,
                gravedad: 'alta'
            });
        } else {
            // console.log('✅ No se detectaron fichajes durante ausencias');
        }
    }

    async calcularEstadisticasAnuales() {
        console.log('🧮 Calculando estadísticas anuales...');
        
        const hoy = new Date();
        const inicioAño = new Date(this.convenio.inicio_año);
        const inicioReales = new Date(this.convenio.inicio_datos_reales);
        
        for (const empleado of this.empleados) {
            // Excluir empleados no sujetos al convenio
            if (this.convenio.excluidos.includes(empleado.name.toUpperCase())) {
                // console.log(`⏭️ Saltando ${empleado.name} (excluido del convenio)`);
                continue;
            }
            
            const stats = {
                empleado_id: empleado.id,
                empleado_nombre: empleado.name,
                
                // ====== HORAS TEÓRICAS (Enero - 06/06/2025) ======
                horas_teoricas_pre_agora: this.calcularHorasTeoricas(inicioAño, inicioReales, empleado.id),
                
                // ====== HORAS REALES (06/06/2025 - Hoy) ======
                horas_reales_agora: this.calcularHorasReales(inicioReales, hoy, empleado.id),
                
                // ====== HORAS POR AUSENCIAS ======
                horas_ausencias: this.calcularHorasAusencias(inicioAño, hoy, empleado.id),
                
                // ====== PARTIDOS (TURNOS DOBLES) ======
                total_partidos: this.calcularPartidos(empleado.id),
                
                // ====== TURNOS DE MAÑANA (6:00-15:00) ======
                total_turnos_mañana: this.calcularTurnosMañana(empleado.id),
                
                // ====== TOTALES ======
                total_horas_año: 0,
                total_dias_trabajados: 0,
                
                // ====== ANÁLISIS DE CUMPLIMIENTO ======
                excesos_diarios: [],
                violaciones_descanso: [],
                semanas_exceso: [],
                
                // ====== PROYECCIÓN ======
                horas_restantes_año: 0,
                dias_laborables_restantes: 0,
                promedio_horas_dia_necesario: 0,
                media_semanal_real: 0,
                horas_recomendadas_semana: 0,
                estado_semanal: '',
                recomendacion_compensacion: ''
            };
            
                    // Logs de debug eliminados para producción

            // Calcular totales
            stats.total_horas_año = stats.horas_teoricas_pre_agora + 
                                   stats.horas_reales_agora + 
                                   stats.horas_ausencias;
                                   
            if (empleado.name.toUpperCase().includes('RAQUEL')) {
                console.log(`📊 TOTAL horas año: ${stats.total_horas_año.toFixed(1)}h`);
            }
            
            // Analizar cumplimiento del convenio
            this.analizarCumplimientoConvenio(stats, empleado);
            
            // Calcular proyección para resto del año
            this.calcularProyeccion(stats, hoy);
            
            this.stats_anuales[empleado.id] = stats;
            
            // console.log(`📊 ${empleado.name}: ${stats.total_horas_año.toFixed(1)}h año`);
        }
    }

    calcularHorasTeoricas(fechaDesde, fechaHasta, empleadoId) {
        // Para el período anterior al 06/06/2025, asumimos cumplimiento teórico
        const dias = Math.floor((fechaHasta - fechaDesde) / (1000 * 60 * 60 * 24));
        const semanasCompletas = Math.floor(dias / 7);
        const diasRestantes = dias % 7;
        
        // Calcular horas teóricas por empleada: 6 días/semana × 6.8h/día = 40.8h/semana
        const horasSemanasCompletas = semanasCompletas * this.convenio.dias_trabajo_empleada_semana * this.convenio.horas_teoricas_dia;
        const horasDiasRestantes = Math.min(diasRestantes, this.convenio.dias_trabajo_empleada_semana) * this.convenio.horas_teoricas_dia;
        
        const totalTeorico = horasSemanasCompletas + horasDiasRestantes;
        
        // console.log(`  📅 ${this.empleados.find(e => e.id === empleadoId)?.name}: ${totalTeorico.toFixed(1)}h teóricas (${fechaDesde.toLocaleDateString()} - ${fechaHasta.toLocaleDateString()}) = ${semanasCompletas} semanas × ${(this.convenio.dias_trabajo_empleada_semana * this.convenio.horas_teoricas_dia).toFixed(1)}h/semana`);
        
        return totalTeorico;
    }

    calcularHorasReales(fechaDesde, fechaHasta, empleadoId) {
        const fichajesEmpleado = this.fichajes.filter(f => 
            f.empleado_id === empleadoId &&
            new Date(f.fecha) >= fechaDesde &&
            new Date(f.fecha) <= fechaHasta
        );
        
        const totalReal = fichajesEmpleado.reduce((sum, f) => sum + (f.horas_trabajadas || 0), 0);
        
        // console.log(`  📋 ${this.empleados.find(e => e.id === empleadoId)?.name}: ${totalReal.toFixed(1)}h reales (${fichajesEmpleado.length} fichajes)`);
        
        return totalReal;
    }

    /**
     * METODOLOGÍA JAVI 2.0 - Cálculo inteligente de ausencias
     * Solo cuenta días laborables según regla general del convenio
     */
    calcularHorasAusencias(fechaDesde, fechaHasta, empleadoId) {
        const ausenciasEmpleado = this.ausencias.filter(a => 
            a.empleado_id === empleadoId &&
            // Verificar solapamiento de fechas
            (new Date(a.fecha_inicio) <= fechaHasta && new Date(a.fecha_fin) >= fechaDesde)
        );
        
        let totalAusencias = 0;
        
        for (const ausencia of ausenciasEmpleado) {
            // Calcular días que se solapan con el período consultado
            const inicioReal = new Date(Math.max(new Date(ausencia.fecha_inicio), fechaDesde));
            const finReal = new Date(Math.min(new Date(ausencia.fecha_fin), fechaHasta));
            
            let horasAusenciaReal = 0;
            
            // Iterar día por día en el período de ausencia
            const fechaIterador = new Date(inicioReal);
            while (fechaIterador <= finReal) {
                const fechaStr = fechaIterador.toISOString().split('T')[0];
                
                // ✅ METODOLOGÍA JAVI 2.0 CORREGIDA: Solo regla general del convenio
                const eraLaborable = this.aplicarReglaGeneralConvenio(fechaStr);
                
                if (eraLaborable) {
                    horasAusenciaReal += this.convenio.horas_teoricas_dia; // 6.8h solo si tocaba trabajar
                }
                
                // Debug limpiado - ya se maneja en aplicarReglaGeneralConvenio
                
                fechaIterador.setDate(fechaIterador.getDate() + 1);
            }
            
            totalAusencias += horasAusenciaReal;
            
            // === DEBUG JAVI 2.0 CORREGIDO ===
            const empleado = this.empleados.find(e => e.id === empleadoId);
            if (empleado && empleado.name.toUpperCase().includes('RAQUEL')) {
                const diasTotales = Math.floor((finReal - inicioReal) / (1000 * 60 * 60 * 24)) + 1;
                const diasLaborablesCalculados = horasAusenciaReal / 6.8;
                console.log(`\n✅ AUSENCIA ${ausencia.tipo.toUpperCase()}: ${ausencia.fecha_inicio} → ${ausencia.fecha_fin}`);
                console.log(`   📊 Total días naturales: ${diasTotales} días`);
                console.log(`   💼 Días laborables (convenio): ${diasLaborablesCalculados.toFixed(1)} días`);
                console.log(`   ✅ Horas JAVI 2.0: ${horasAusenciaReal.toFixed(1)}h`);
                console.log(`   📋 Detalle día por día (solo convenio, no horarios planificados):`);
            }
        }
        
        return totalAusencias;
    }

    calcularPartidos(empleadoId) {
        const fichajesEmpleado = this.fichajes.filter(f => f.empleado_id === empleadoId);
        
        // Agrupar fichajes por fecha
        const fichajesPorFecha = {};
        fichajesEmpleado.forEach(fichaje => {
            const fecha = fichaje.fecha;
            if (!fichajesPorFecha[fecha]) {
                fichajesPorFecha[fecha] = [];
            }
            fichajesPorFecha[fecha].push(fichaje);
        });
        
        let totalPartidos = 0;
        
        // Analizar cada día para detectar turnos dobles
        Object.entries(fichajesPorFecha).forEach(([fecha, fichajes]) => {
            // Solo contar como partido si hay exactamente 2 fichajes en el día
            if (fichajes.length === 2) {
                const fichaje1 = fichajes[0];
                const fichaje2 = fichajes[1];
                
                // Verificar si hay diferencia significativa en las horas (indicativo de turno doble)
                const horas1 = fichaje1.horas_trabajadas || 0;
                const horas2 = fichaje2.horas_trabajadas || 0;
                
                // Considerar partido si:
                // 1. Ambos fichajes tienen horas significativas (>1h cada uno)
                // 2. La diferencia entre horas es de al menos 2h (indica descanso entre turnos)
                if (horas1 >= 1 && horas2 >= 1 && Math.abs(horas1 - horas2) >= 2) {
                    totalPartidos++;
                    // console.log(`  🔄 ${this.empleados.find(e => e.id === empleadoId)?.name}: Partido detectado en ${fecha} (${horas1}h + ${horas2}h)`);
                }
                // También contar como partido si ambos turnos son similares (típico de turnos partidos)
                else if (horas1 >= 2 && horas2 >= 2 && Math.abs(horas1 - horas2) <= 2) {
                    totalPartidos++;
                    // console.log(`  🔄 ${this.empleados.find(e => e.id === empleadoId)?.name}: Partido detectado en ${fecha} (${horas1}h + ${horas2}h - turnos similares)`);
                }
            }
        });
        
        // console.log(`  🎯 ${this.empleados.find(e => e.id === empleadoId)?.name}: ${totalPartidos} partidos totales`);
        
        return totalPartidos;
    }

    /**
     * Calcula el número total de turnos de mañana (6:00-15:00) de un empleado
     * Excluye a Bryan (le gustan las tardes) y Raquel (siempre está de mañanas)
     * Solo cuenta turnos NO partidos en horario de mañana
     */
    calcularTurnosMañana(empleadoId) {
        const empleado = this.empleados.find(e => e.id === empleadoId);
        if (!empleado) return 0;
        
        // ===== EXCLUSIONES ESPECÍFICAS =====
        const nombreEmpleado = empleado.name.toUpperCase().trim();
        
        // No contar Bryan (le gusta estar de tardes)
        if (nombreEmpleado.includes('BRYAN')) {
            return 0;
        }
        
        // No contar Raquel (siempre está de mañanas - no necesita equilibrio)
        if (nombreEmpleado.includes('RAQUEL')) {
            return 0;
        }
        
        const fichajesEmpleado = this.fichajes.filter(f => f.empleado_id === empleadoId);
        
        // Agrupar fichajes por fecha
        const fichajesPorFecha = {};
        fichajesEmpleado.forEach(fichaje => {
            const fecha = fichaje.fecha;
            if (!fichajesPorFecha[fecha]) {
                fichajesPorFecha[fecha] = [];
            }
            fichajesPorFecha[fecha].push(fichaje);
        });
        
        let totalTurnosMañana = 0;

        // Analizar cada día para detectar turnos de mañana
        Object.entries(fichajesPorFecha).forEach(([fecha, fichajes]) => {
            // ===== SOLO CONTAR DÍAS CON UN SOLO FICHAJE (NO PARTIDOS) =====
            if (fichajes.length === 1) {
                const fichaje = fichajes[0];
                
                // Verificar que tenga horas de entrada y salida
                if (fichaje.entrada && fichaje.salida) {
                    // Extraer solo la hora de los timestamps
                    const horaEntrada = this.extraerHoraDeTimestamp(fichaje.entrada);
                    const horaSalida = this.extraerHoraDeTimestamp(fichaje.salida);
                    
                    if (horaEntrada !== null && horaSalida !== null) {
                        // ===== FRANJA DE MAÑANA AMPLIADA =====
                        // 5:30 (330 min) a 15:30 (930 min) para cubrir casos como 5:55-14:00
                        const inicioMañana = 5 * 60 + 30; // 5:30 = 330 minutos
                        const finMañana = 15 * 60 + 30;   // 15:30 = 930 minutos
                        
                        // Verificar si entrada Y salida están dentro de la franja de mañana
                        if (horaEntrada >= inicioMañana && horaEntrada <= finMañana &&
                            horaSalida >= inicioMañana && horaSalida <= finMañana &&
                            horaSalida > horaEntrada) { // Verificar que salida > entrada
                            
                            totalTurnosMañana++;
                        }
                    }
                }
            }
            // ===== SI HAY 2 FICHAJES = PARTIDO → NO CONTAR COMO MAÑANA =====
            // Los partidos no se cuentan como mañanas, independientemente del horario
        });
        
        return totalTurnosMañana;
    }

    // Función eliminada - era conceptualmente incorrecta mezclar control anual con horarios planificados

    /**
     * METODOLOGÍA JAVI 2.0 - Regla general del convenio
     * Solo domingos libres, resto laborables (6 de 7 días)
     */
    aplicarReglaGeneralConvenio(fecha) {
        const fechaObj = new Date(fecha);
        const dayOfWeek = fechaObj.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
        const esLaborable = dayOfWeek !== 0; // Todos excepto domingo
        
        // DEBUG para ausencias de Raquel
        const empleado = this.empleados.find(e => e && e.name && e.name.toUpperCase().includes('RAQUEL'));
        if (empleado) {
            const diasSemana = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
            console.log(`   📅 ${fecha} (${diasSemana[dayOfWeek]}): ${esLaborable ? 'LABORABLE (+6.8h)' : 'DÍA LIBRE (+0h)'}`);
        }
        
        return esLaborable;
    }

    /**
     * Calcula días laborables (Lun-Vie) según metodología JAVI original
     */
    calcularDiasLaborablesJavi(fechaInicio, fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        let diasLaborables = 0;
        
        const fecha = new Date(inicio);
        while (fecha <= fin) {
            const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
            if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a Viernes
                diasLaborables++;
            }
            fecha.setDate(fecha.getDate() + 1);
        }
        
        return diasLaborables;
    }

    /**
     * Extrae la hora de un timestamp y la convierte a minutos desde medianoche (UTC)
     */
    extraerHoraDeTimestamp(timestamp) {
        if (!timestamp || timestamp === 'null') return null;
        
        try {
            // Si es un timestamp ISO, crear objeto Date
            const fecha = new Date(timestamp);
            if (isNaN(fecha.getTime())) return null;
            
            // Obtener horas y minutos en UTC (no hora local)
            const horas = fecha.getUTCHours();
            const minutos = fecha.getUTCMinutes();
            
            return (horas * 60) + minutos;
        } catch (error) {
            // Si falla, intentar extraer formato HH:MM del string
            const horaMatch = timestamp.toString().match(/(\d{1,2}):(\d{2})/);
            if (horaMatch) {
                const horas = parseInt(horaMatch[1], 10) || 0;
                const minutos = parseInt(horaMatch[2], 10) || 0;
                return (horas * 60) + minutos;
            }
            
            return null;
        }
    }

    analizarCumplimientoConvenio(stats, empleado) {
        // Analizar fichajes para encontrar violaciones
        const fichajesEmpleado = this.fichajes.filter(f => f.empleado_id === empleado.id);
        
        // 1. Excesos diarios (>9h)
        stats.excesos_diarios = fichajesEmpleado.filter(f => 
            (f.horas_trabajadas || 0) > this.convenio.horas_maximas_dia
        );
        
        // 2. Violaciones de descanso entre turnos (<12h)
        // TODO: Implementar cuando tengamos entrada/salida detallada
        
        // 3. Semanas con exceso de horas (>40h)
        const semanas = this.agruparPorSemanas(fichajesEmpleado);
        stats.semanas_exceso = Object.entries(semanas).filter(([semana, fichajes]) => {
            const horasSemana = fichajes.reduce((sum, f) => sum + (f.horas_trabajadas || 0), 0);
            return horasSemana > this.convenio.horas_maximas_semana;
        });
        
        // Generar alertas
        if (stats.excesos_diarios.length > 0) {
            this.alertas_convenio.push({
                empleado: empleado.name,
                tipo: 'exceso_diario',
                cantidad: stats.excesos_diarios.length,
                gravedad: stats.excesos_diarios.length > 5 ? 'alta' : 'media'
            });
        }
        
        if (stats.semanas_exceso.length > 0) {
            this.alertas_convenio.push({
                empleado: empleado.name,
                tipo: 'exceso_semanal',
                cantidad: stats.semanas_exceso.length,
                gravedad: stats.semanas_exceso.length > 3 ? 'alta' : 'media'
            });
        }
    }

    calcularProyeccion(stats, fechaActual) {
        const finAño = new Date('2025-12-31');
        const diasRestantes = Math.floor((finAño - fechaActual) / (1000 * 60 * 60 * 24));
        const semanasRestantes = Math.floor(diasRestantes / 7);
        
        // ====== CALCULAR MEDIA SEMANAL SOLO DE SEMANAS COMPLETAS ======
        const fichajesEmpleado = this.fichajes.filter(f => f.empleado_id === stats.empleado_id);
        const semanasConDatos = this.agruparPorSemanas(fichajesEmpleado);
        
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
                // Si estamos a jueves/viernes/etc. y ya hay fichajes, la semana está prácticamente completa
                const hoy = new Date();
                const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes, ... 6=sábado
                const diasTranscurridos = diaSemana === 0 ? 7 : diaSemana; // Convertir domingo=0 a domingo=7
                
                // Si ya pasaron 3+ días de la semana Y tiene fichajes, incluirla
                if (diasTranscurridos >= 4 && fichajes.length >= 2) {
                    semanasCompletas[claveSeccion] = fichajes;
                    horasSemanasCompletas += horasEstaSemana;
                    // console.log(`     🟡 Semana ${claveSeccion}: ${horasEstaSemana.toFixed(1)}h (ACTUAL, pero con ${diasTranscurridos} días transcurridos → INCLUIDA)`);
                } else {
                    // console.log(`     ❌ Semana ${claveSeccion}: ${horasEstaSemana.toFixed(1)}h (ACTUAL y solo ${diasTranscurridos} días → EXCLUIDA)`);
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
        
        // Debug info DETALLADO
        // console.log(`📊 ${stats.empleado_nombre}:`);
        // console.log(`   - Semanas con datos: ${Object.keys(semanasConDatos).length}`);
        console.log(`   - Semana actual (excluida): ${claveSeccionActual}`);
        
        // Mostrar TODAS las semanas encontradas
        Object.keys(semanasConDatos).forEach(claveSeccion => {
            const fichajes = semanasConDatos[claveSeccion];
            const horasSemana = fichajes.reduce((sum, f) => sum + (f.horas_trabajadas || 0), 0);
            const esActual = claveSeccion === claveSeccionActual;
            // console.log(`     ${esActual ? '❌' : '✅'} Semana ${claveSeccion}: ${horasSemana.toFixed(1)}h (${fichajes.length} fichajes) ${esActual ? '← ACTUAL, EXCLUIDA' : ''}`);
        });
        
        console.log(`   - Semanas COMPLETAS: ${numSemanasCompletas}`);
        // console.log(`   - Horas en semanas completas: ${horasSemanasCompletas.toFixed(1)}h`);
        
        // Calcular media inicial aquí para mostrar en el log
        const mediaCalculada = numSemanasCompletas > 0 ? horasSemanasCompletas / numSemanasCompletas : 0;
        // console.log(`   - CÁLCULO INICIAL: ${horasSemanasCompletas.toFixed(1)}h ÷ ${numSemanasCompletas} semanas = ${mediaCalculada.toFixed(1)}h/semana`);
        
        // Horas que faltan para llegar al máximo anual
        stats.horas_restantes_año = Math.max(0, this.convenio.horas_maximas_anuales - stats.total_horas_año);
        
        // Cálculo realista para resto del año
        if (semanasRestantes > 0) {
            stats.horas_recomendadas_semana = stats.horas_restantes_año / semanasRestantes;
        } else {
            stats.horas_recomendadas_semana = 0;
        }
        
        // ====== VERIFICAR SI ESTÁ ACTUALMENTE DE AUSENCIA ======
        // console.log(`🔍 Verificando ausencias para ${stats.empleado_nombre} (ID: ${stats.empleado_id})`);
        
        // Convertir a fechas sin horas para comparación precisa
        const fechaActualSinHora = fechaActual.toISOString().split('T')[0];
        console.log(`   📅 Fecha actual (sin hora): ${fechaActualSinHora}`);
        // console.log(`   🏖️ Ausencias del empleado:`);
        
        const ausenciasEmpleado = this.ausencias.filter(a => a.empleado_id === stats.empleado_id);
        ausenciasEmpleado.forEach(ausencia => {
            const esActiva = ausencia.fecha_inicio <= fechaActualSinHora && 
                           ausencia.fecha_fin >= fechaActualSinHora && 
                           ausencia.estado === 'aprobado';
            // Log de ausencias simplificado para privacidad
        });
        
        const ausenciaActual = this.ausencias.find(ausencia => 
            ausencia.empleado_id === stats.empleado_id &&
            ausencia.fecha_inicio <= fechaActualSinHora &&
            ausencia.fecha_fin >= fechaActualSinHora &&
            ausencia.estado === 'aprobado'
        );
        
        if (ausenciaActual) {
            console.log(`   ✅ AUSENCIA ACTIVA DETECTADA: ${ausenciaActual.tipo}`);
            stats.estado_semanal = 'de_ausencia';
            stats.recomendacion_compensacion = 'Análisis pausado durante ausencia';
            // CONTINUAR análisis para calcular compensación histórica
            // No hacer return aquí para que calcule diferencia_carga_trabajo
        } else {
            // console.log(`   ❌ No hay ausencias activas para ${stats.empleado_nombre}`);
        }
        
        // ====== ANÁLISIS DE COMPENSACIÓN HISTÓRICA ======
        // Calcular cuánto ha trabajado comparado con el ideal desde junio
        const inicioReales = new Date(this.convenio.inicio_datos_reales);
        const diasTotalesDesdeJunio = Math.floor((fechaActual - inicioReales) / (1000 * 60 * 60 * 24));
        
        // Calcular días que estuvo ausente (no disponible para trabajar)
        const inicioRealesStr = inicioReales.toISOString().split('T')[0];
        const fechaActualStr = fechaActual.toISOString().split('T')[0];
        
        let diasAusencia = 0;
        this.ausencias
            .filter(a => a.empleado_id === stats.empleado_id && a.estado === 'aprobado')
            .forEach(ausencia => {
                // Calcular intersección entre período de ausencia y período desde junio
                const inicioAusencia = ausencia.fecha_inicio >= inicioRealesStr ? ausencia.fecha_inicio : inicioRealesStr;
                const finAusencia = ausencia.fecha_fin <= fechaActualStr ? ausencia.fecha_fin : fechaActualStr;
                
                if (inicioAusencia <= finAusencia) {
                    const diasEstaAusencia = Math.floor((new Date(finAusencia) - new Date(inicioAusencia)) / (1000 * 60 * 60 * 24)) + 1;
                    diasAusencia += diasEstaAusencia;
                    // Log de ausencias específicas eliminado para privacidad
                }
            });
        
        // Días realmente disponibles para trabajar
        const diasDisponibles = diasTotalesDesdeJunio - diasAusencia;
        const semanasDisponibles = diasDisponibles / 7;
        const horasIdealesAjustadas = semanasDisponibles * (this.convenio.dias_trabajo_empleada_semana * this.convenio.horas_teoricas_dia); // 40.8h/semana ideal
        const horasRealesDesdeJunio = stats.horas_reales_agora;
        
        // === DEBUG JAVI 2.0 CORREGIDO ===
        if (stats.empleado_nombre.toUpperCase().includes('RAQUEL')) {
            console.log(`\n✅ ===== FÓRMULA JAVI 2.0 CORREGIDA =====`);
            console.log(`📅 Período: ${this.convenio.inicio_datos_reales} → ${fechaActualStr}`);
            console.log(`📊 Días totales desde junio: ${diasTotalesDesdeJunio} días`);
            console.log(`🏥 Días de ausencia: ${diasAusencia} días`);
            console.log(`⚡ Horas reales fichadas: ${horasRealesDesdeJunio.toFixed(1)}h`);
            console.log(`🏥 Horas ausencias (solo convenio): ${stats.horas_ausencias.toFixed(1)}h`);
            
            // FÓRMULA JAVI 2.0
            const fechaInicio = new Date(this.convenio.inicio_datos_reales);
            const fechaFin = new Date(fechaActualStr);
            const diasExactos = Math.floor((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
            const semanasJavi = diasExactos / 7;
            const horasIdealesFijas = semanasJavi * 40.8;
            const horasCumplidas = horasRealesDesdeJunio + stats.horas_ausencias;
            const diferenciaJavi20 = horasCumplidas - horasIdealesFijas;
            
            console.log(`📊 Horas ideales FIJAS: ${horasIdealesFijas.toFixed(2)}h`);
            console.log(`🧮 Horas cumplidas: ${horasCumplidas.toFixed(1)}h`);
            console.log(`✅ DIFERENCIA JAVI 2.0: ${diferenciaJavi20 >= 0 ? '+' : ''}${diferenciaJavi20.toFixed(1)}h`);
            console.log(`==========================================`);
        }
        
        // console.log(`   📊 Cálculo compensación ${stats.empleado_nombre}:`);
        console.log(`     • Días totales desde junio: ${diasTotalesDesdeJunio}`);
        console.log(`     • Días de ausencia: ${diasAusencia}`);
        console.log(`     • Días disponibles: ${diasDisponibles}`);
        console.log(`     • Semanas disponibles: ${semanasDisponibles.toFixed(1)}`);
        
        // ✅ APLICAR METODOLOGÍA JAVI 2.0 PARA DIFERENCIA FINAL
        const fechaInicio = new Date(this.convenio.inicio_datos_reales);
        const fechaFin = new Date(fechaActualStr);
        const diasExactos = Math.floor((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
        const semanasJavi = diasExactos / 7;

        // Ajustar horas semanales ideales según el empleado (GABY es media jornada)
        const esMediaJornada = stats.empleado_nombre.toUpperCase().includes('GABY');
        const horasSemanalesIdeales = esMediaJornada ? 25 : 40.8;

        const horasIdealesFijas = semanasJavi * horasSemanalesIdeales; // Horas ideales FIJAS (no ajustadas por bajas)
        const horasCumplidas = horasRealesDesdeJunio + stats.horas_ausencias;
        const diferenciaCargaTrabajo = horasCumplidas - horasIdealesFijas; // ✅ NUEVA FÓRMULA JAVI 2.0
        
        console.log(`     • Diferencia: ${diferenciaCargaTrabajo >= 0 ? '+' : ''}${diferenciaCargaTrabajo.toFixed(1)}h`);
        
        // Guardar SIEMPRE la diferencia de carga (incluso para empleados ausentes)
        stats.diferencia_carga_trabajo = diferenciaCargaTrabajo;
        stats.horas_ideales_desde_junio = horasIdealesFijas; // ✅ Usar horas ideales FIJAS
        
        // ====== CALCULAR MEDIA SEMANAL CORRECTA (basada en días trabajados) ======
        // Si tenemos pocos datos o semanas muy parciales, usar método alternativo
        const totalDiasTrabajados = fichajesEmpleado.length;
        const horasPorDia = totalDiasTrabajados > 0 ? horasRealesDesdeJunio / totalDiasTrabajados : 0;
        const mediaPorDias = horasPorDia * this.convenio.dias_trabajo_empleada_semana; // 6 días/semana
        
        // Decidir qué método usar - SIEMPRE usar método por días si es más confiable
        const diferenciaPorcentual = Math.abs(mediaSemanalInicial - mediaPorDias) / mediaPorDias * 100;
        
        if (numSemanasCompletas >= 3 && mediaSemanalInicial > 35 && diferenciaPorcentual < 15) {
            // Solo usar método original si: 3+ semanas completas, media alta Y coherencia entre métodos
            stats.media_semanal_real = mediaSemanalInicial;
            console.log(`   📊 MEDIA SEMANAL: ${stats.media_semanal_real.toFixed(1)}h/semana (${numSemanasCompletas} semanas robustas)`);
        } else {
            // En todos los demás casos, usar cálculo por días (más confiable)
            stats.media_semanal_real = mediaPorDias;
            // console.log(`   📊 MEDIA SEMANAL: ${stats.media_semanal_real.toFixed(1)}h/semana (${totalDiasTrabajados} días × ${horasPorDia.toFixed(1)}h/día × 6 días/semana)`);
            if (numSemanasCompletas < 3) {
                console.log(`   ⚠️ Usando método por días: pocas semanas completas (${numSemanasCompletas})`);
            } else if (diferenciaPorcentual >= 15) {
                console.log(`   ⚠️ Usando método por días: métodos divergen ${diferenciaPorcentual.toFixed(1)}% (semanas: ${mediaSemanalInicial.toFixed(1)}h vs días: ${mediaPorDias.toFixed(1)}h)`);
            }
        }
        
        // Solo crear recomendaciones si tenemos datos suficientes Y no está ausente
        if (horasRealesDesdeJunio < 50) { // Menos de ~1.5 semanas de trabajo
            if (stats.estado_semanal !== 'de_ausencia') {
                stats.estado_semanal = 'sin_datos';
                stats.recomendacion_compensacion = 'Pocos datos históricos - Seguir con horarios normales';
            }
            return;
        }
        
        // NO modificar estado si ya está marcado como ausente
        if (stats.estado_semanal === 'de_ausencia') {
            return; // Mantener estado de ausencia y su recomendación
        }
        
        // Clasificar según la carga de trabajo histórica (solo para empleados activos)
        if (Math.abs(diferenciaCargaTrabajo) <= 1) {
            stats.estado_semanal = 'equilibrado';
            stats.recomendacion_compensacion = `Equilibrio perfecto (${diferenciaCargaTrabajo >= 0 ? '+' : ''}${diferenciaCargaTrabajo.toFixed(0)}h vs ideal)`;
        } else if (diferenciaCargaTrabajo > 1) {
            stats.estado_semanal = 'sobrecarga';
            stats.recomendacion_compensacion = `Ha trabajado MUCHO (+${diferenciaCargaTrabajo.toFixed(0)}h vs ideal) - Reducir carga próximas semanas`;
            
            // Alerta de sobrecarga
            this.alertas_convenio.push({
                empleado: stats.empleado_nombre,
                tipo: 'sobrecarga_historica',
                diferencia: diferenciaCargaTrabajo.toFixed(0),
                gravedad: diferenciaCargaTrabajo > 40 ? 'alta' : 'media'
            });
        } else {
            stats.estado_semanal = 'subcarga';
            stats.recomendacion_compensacion = `Ha trabajado POCO (${diferenciaCargaTrabajo.toFixed(0)}h vs ideal) - Aumentar carga próximas semanas`;
            
            // Alerta de subcarga
            this.alertas_convenio.push({
                empleado: stats.empleado_nombre,
                tipo: 'subcarga_historica', 
                diferencia: Math.abs(diferenciaCargaTrabajo).toFixed(0),
                gravedad: Math.abs(diferenciaCargaTrabajo) > 40 ? 'alta' : 'media'
            });
        }
        
        // Alerta si se está cerca del límite anual
        if (stats.total_horas_año > this.convenio.horas_maximas_anuales * 0.8) {
            this.alertas_convenio.push({
                empleado: stats.empleado_nombre,
                tipo: 'cerca_limite_anual',
                porcentaje: (stats.total_horas_año / this.convenio.horas_maximas_anuales * 100).toFixed(1),
                gravedad: stats.total_horas_año > this.convenio.horas_maximas_anuales * 0.9 ? 'alta' : 'media'
            });
        }
    }

    agruparPorSemanas(fichajes) {
        const semanas = {};
        
        fichajes.forEach(fichaje => {
            const fecha = new Date(fichaje.fecha);
            const inicioSemana = new Date(fecha);
            inicioSemana.setDate(fecha.getDate() - fecha.getDay() + 1); // Lunes
            const claveSeccion = inicioSemana.toISOString().split('T')[0];
            
            if (!semanas[claveSeccion]) {
                semanas[claveSeccion] = [];
            }
            semanas[claveSeccion].push(fichaje);
        });
        
        return semanas;
    }

    mostrarResumenAnual() {
        console.log('\n📊 ======== RESUMEN ANUAL DEL CONVENIO ========');
        
        Object.values(this.stats_anuales).forEach(stats => {
            // console.log(`\n👤 ${stats.empleado_nombre.toUpperCase()}:`);
            // console.log(`   💼 Total horas año: ${stats.total_horas_año.toFixed(1)}h / ${this.convenio.horas_maximas_anuales}h`);
            // console.log(`   📈 Progreso: ${(stats.total_horas_año / this.convenio.horas_maximas_anuales * 100).toFixed(1)}%`);
            // console.log(`   🎯 Horas restantes: ${stats.horas_restantes_año.toFixed(1)}h`);
            console.log(`   📊 Media semanal real: ${stats.media_semanal_real.toFixed(1)}h/semana`);
            console.log(`   ⚖️ Estado semanal: ${stats.estado_semanal}`);
            console.log(`   💡 Recomendación: ${stats.recomendacion_compensacion}`);
            // console.log(`   📅 Para resto del año: ${stats.horas_recomendadas_semana.toFixed(1)}h/semana`);
            
            if (stats.excesos_diarios.length > 0) {
                console.log(`   ⚠️ Excesos diarios: ${stats.excesos_diarios.length}`);
            }
            if (stats.semanas_exceso.length > 0) {
                console.log(`   ⚠️ Semanas exceso: ${stats.semanas_exceso.length}`);
            }
        });
        
        // Mostrar en el panel web
        this.actualizarPanelWeb();
    }

    mostrarAlertasConvenio() {
        console.log('\n🚨 ======== ALERTAS DEL CONVENIO ========');
        
        if (this.alertas_convenio.length === 0) {
            console.log('✅ Sin violaciones del convenio detectadas');
            return;
        }
        
        // Agrupar por gravedad
        const alertasAltas = this.alertas_convenio.filter(a => a.gravedad === 'alta');
        const alertasMedias = this.alertas_convenio.filter(a => a.gravedad === 'media');
        
        if (alertasAltas.length > 0) {
            console.log('\n🔴 ALERTAS CRÍTICAS:');
            alertasAltas.forEach(alerta => this.mostrarAlerta(alerta));
        }
        
        if (alertasMedias.length > 0) {
            console.log('\n🟡 ALERTAS MENORES:');
            alertasMedias.forEach(alerta => this.mostrarAlerta(alerta));
        }
    }

    mostrarAlerta(alerta) {
        switch (alerta.tipo) {
            case 'exceso_diario':
                // console.log(`   👤 ${alerta.empleado}: ${alerta.cantidad} días con >9h`);
                break;
            case 'exceso_semanal':
                // console.log(`   👤 ${alerta.empleado}: ${alerta.cantidad} semanas con >40h`);
                break;
            case 'exceso_semanal_compensar':
                // console.log(`   👤 ${alerta.empleado}: Exceso de ${alerta.desviacion}h/semana - Reducir horas para compensar`);
                break;
            case 'defecto_semanal_compensar':
                // console.log(`   👤 ${alerta.empleado}: Defecto de ${alerta.desviacion}h/semana - Aumentar horas para compensar`);
                break;
            case 'cerca_limite_anual':
                // console.log(`   👤 ${alerta.empleado}: ${alerta.porcentaje}% del límite anual`);
                break;
            case 'fichajes_durante_ausencia':
                // console.log(`   🚨 FICHAJES DURANTE AUSENCIAS: ${alerta.fichajes.length} fichajes inválidos detectados`);
                alerta.fichajes.forEach(fichaje => {
                    // console.log(`     👤 ${fichaje.empleado}: ${fichaje.fecha} (${fichaje.horas}h) durante ${fichaje.tipoAusencia}`);
                });
                break;
        }
    }

    actualizarPanelWeb() {
        // Buscar el panel de control existente
        const panelControl = document.getElementById('controlHorariosPanel');
        if (!panelControl) return;
        
        // Crear sección de resumen anual
        const resumenAnualHtml = this.generarResumenAnualHTML();
        
        // Insertar después del resumen semanal
        const resumenSemanal = panelControl.querySelector('.bg-blue-50');
        if (resumenSemanal && !document.getElementById('resumenAnual')) {
            const divAnual = document.createElement('div');
            divAnual.id = 'resumenAnual';
            divAnual.innerHTML = resumenAnualHtml;
            resumenSemanal.parentNode.insertBefore(divAnual, resumenSemanal.nextSibling);
        }
    }

    generarResumenAnualHTML() {
        const empleadosStats = Object.values(this.stats_anuales);
        const promedioProgreso = empleadosStats.reduce((sum, s) => 
            sum + (s.total_horas_año / this.convenio.horas_maximas_anuales * 100), 0
        ) / empleadosStats.length;
        
        const alertasCriticas = this.alertas_convenio.filter(a => a.gravedad === 'alta').length;
        const alertasMenores = this.alertas_convenio.filter(a => a.gravedad === 'media').length;
        const alertasFichajes = this.alertas_convenio.filter(a => a.tipo === 'fichajes_durante_ausencia');
        
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
                    <div>🎯 Límite anual: ${this.convenio.horas_maximas_anuales}h por empleado</div>
                </div>
                
                ${seccionFichajesInvalidos}
            </div>
        `;
    }

    // Función pública para obtener datos para planificación
    getEstadoEmpleado(empleadoId) {
        return this.stats_anuales[empleadoId];
    }

    // Función para recomendar horas para semana futura
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

// Exportar para uso global
window.ConvenioAnualManager = ConvenioAnualManager; 