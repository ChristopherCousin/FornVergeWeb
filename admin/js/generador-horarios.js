/**
 * GENERADOR AUTOMÁTICO DE HORARIOS - FORN VERGE
 * =============================================
 * Lógica para sugerir un horario semanal basado en reglas de negocio,
 * convenio y preferencias de las empleadas.
 */

class HorarioGenerator {
    constructor(supabase, employees, ausenciasManager, convenioAnual) {
        this.supabase = supabase;
        this.employees = employees;
        this.ausenciasManager = ausenciasManager;
        this.convenioAnual = convenioAnual;

        // La configuración de cobertura ahora se carga desde localStorage
        this.coverageNeeds = this.loadCoverageSettings();

        this.days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    }

    /**
     * Carga la configuración de cobertura desde localStorage o usa valores por defecto.
     */
    loadCoverageSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('fornverge_generator_settings'));
        const defaultConfig = { // Valores por defecto por si no hay nada guardado
            weekday: [{ start: '06:30', end: '14:00', count: 2 }, { start: '14:00', end: '21:30', count: 2 }],
            saturday: [{ start: '07:00', end: '14:00', count: 3 }, { start: '14:00', end: '22:00', count: 3 }],
            sunday: [{ start: '07:00', end: '14:00', count: 2 }, { start: '14:00', end: '22:00', count: 2 }],
            dias_cierre: [] // Por defecto no hay días de cierre
        };
        return savedSettings || defaultConfig;
    }

    /**
     * Verifica si un empleado debe tener días libres por patrón alternante esta semana.
     * @param {object} employee - El empleado
     * @param {string} weekStart - Fecha de inicio de semana (YYYY-MM-DD)
     * @returns {Array|null} Array de días a librar o null si no aplica
     */
    aplicaPatronAlternante(employee, weekStart) {
        const pattern = employee.preferences?.alternating_pattern;
        
        if (!pattern || !pattern.enabled) return null;
        
        try {
            // Calcular número de semana desde la referencia
            const startWeek = new Date(pattern.pattern.start_week);
            const currentWeek = new Date(weekStart);
            const weeksDiff = Math.floor((currentWeek - startWeek) / (7 * 24 * 60 * 60 * 1000));
            
            // Verificar si esta semana cae en el patrón
            const esSemanConPatron = weeksDiff % pattern.pattern.frequency === 0;
            
            if (esSemanConPatron) {
                console.log(`✨ ${employee.name}: Patrón alternante activo esta semana - librando ${pattern.pattern.days.join(', ')}`);
                return pattern.pattern.days; // ["sabado", "domingo"]
            }
            
            console.log(`⏭️ ${employee.name}: Patrón alternante NO activo esta semana`);
            return null; // Esta semana NO aplica el patrón
        } catch (error) {
            console.error(`❌ Error calculando patrón alternante para ${employee.name}:`, error);
            return null;
        }
    }

    /**
     * Punto de entrada principal para generar el horario.
     * @param {string} weekStart - La fecha de inicio de la semana (YYYY-MM-DD).
     * @returns {object} Un objeto `scheduleData` con el horario sugerido.
     */
    async generate(weekStart) {
        console.log('\n' + '='.repeat(80));
        console.log('🔮 INICIANDO GENERADOR AUTOMÁTICO DE HORARIOS');
        console.log('='.repeat(80));
        console.log('📅 Semana:', weekStart);
        console.log('⏰ Timestamp:', new Date().toLocaleString('es-ES'));
        console.log('='.repeat(80) + '\n');
        
        // 📊 PASO 1: MOSTRAR CONFIGURACIÓN COMPLETA
        console.log('📋 CONFIGURACIÓN DEL GENERADOR:');
        console.log('─'.repeat(80));
        console.log('🔧 Configuración de Turnos:', JSON.stringify(this.coverageNeeds, null, 2));
        console.log('─'.repeat(80) + '\n');

        // 1. Obtener el estado actual de todas las empleadas
        const employeeStates = await this.getEmployeeStates(weekStart);
        console.log('📊 Estado de empleadas:', employeeStates);

        // 2. Priorizar empleadas
        const prioritizedEmployees = this.prioritizeEmployees(employeeStates);
        console.log('🏆 Empleadas priorizadas:', prioritizedEmployees.map(e => e.name));
        
        // 3. Inicializar el borrador del horario y el estado de seguimiento
        let draftSchedule = this.initializeDraftSchedule();
        let trackingState = this.initializeTrackingState(prioritizedEmployees);
        
        // ✨ NUEVO: Array para rastrear turnos sin cubrir
        let turnosSinCubrir = [];

        // 4. PRE-ASIGNAR días libres fijos y alternantes
        this.assignFixedFreeDays(draftSchedule, trackingState, prioritizedEmployees, weekStart);

        // 5. Lógica de asignación (el núcleo del generador)
        for (const day of this.days) {
            // ✨ NUEVO: Verificar si el local está cerrado este día
            const diasCierre = this.coverageNeeds.dias_cierre || [];
            if (diasCierre.includes(day)) {
                console.log(`🔒 ${day.toUpperCase()} - Local CERRADO, marcando como día libre para todos`);
                
                // Marcar como día libre para todos los empleados
                prioritizedEmployees.forEach(employee => {
                    // Solo si no tiene ya algo asignado
                    if (draftSchedule[employee.id][day].length === 0) {
                        draftSchedule[employee.id][day].push({
                            id: `closed_${day}_${employee.id}`,
                            isFree: true,
                            type: 'free_closed',
                            description: 'Local cerrado'
                        });
                    }
                });
                
                continue; // Saltar al siguiente día
            }
            
            let dayType;
            const dayIndex = this.days.indexOf(day);
            if (dayIndex >= 0 && dayIndex <= 4) { // Lunes a Viernes
                dayType = 'weekday';
            } else if (dayIndex === 5) { // Sábado
                dayType = 'saturday';
            } else { // Domingo
                dayType = 'sunday';
            }
            
            const neededShifts = this.coverageNeeds[dayType] || [];

            neededShifts.forEach((shiftInfo, shiftIndex) => {
                const requiredEmployees = shiftInfo.count || 1;
                
                // ✨ NUEVO: Determinar si este es el primer turno del día
                const esPrimerTurno = shiftIndex === 0;

                // Re-priorizar dinámicamente para cada turno
                const dynamicPrioritizedEmployees = prioritizedEmployees.slice().sort((a, b) => {
                    const aTracking = trackingState[a.id];
                    const bTracking = trackingState[b.id];
                    
                    // ✨ PRIORIDAD MÁXIMA: Si es el primer turno, empleados con priority_first_shift van PRIMERO
                    if (esPrimerTurno) {
                        const aPriority = a.preferences?.priority_first_shift === true;
                        const bPriority = b.preferences?.priority_first_shift === true;
                        
                        if (aPriority && !bPriority) {
                            console.log(`⭐ ${a.name} tiene prioridad de primer turno`);
                            return -1;
                        }
                        if (bPriority && !aPriority) {
                            console.log(`⭐ ${b.name} tiene prioridad de primer turno`);
                            return 1;
                        }
                    }

                    // Prioridad 1: Quien ha trabajado MENOS días va primero
                    const aDays = aTracking.workDays.size;
                    const bDays = bTracking.workDays.size;
                    if (aDays < bDays) return -1;
                    if (aDays > bDays) return 1;

                    // Prioridad 2: Si han trabajado los mismos días, usar convenio
                    const aConvenio = a.convenio || {};
                    const bConvenio = b.convenio || {};
                    if (aConvenio.estado_semanal === 'subcarga' && bConvenio.estado_semanal !== 'subcarga') return -1;
                    if (bConvenio.estado_semanal === 'subcarga' && aConvenio.estado_semanal !== 'subcarga') return 1;
                    if (aConvenio.estado_semanal === 'subcarga' && bConvenio.estado_semanal === 'subcarga') {
                        return aConvenio.diferencia_carga_trabajo - bConvenio.diferencia_carga_trabajo;
                    }
                    if (aConvenio.estado_semanal === 'equilibrado' && bConvenio.estado_semanal !== 'equilibrado') return -1;
                    if (bConvenio.estado_semanal === 'equilibrado' && aConvenio.estado_semanal !== 'equilibrado') return 1;
                    if (aConvenio.estado_semanal === 'sobrecarga' && bConvenio.estado_semanal === 'sobrecarga') {
                        return aConvenio.diferencia_carga_trabajo - bConvenio.diferencia_carga_trabajo;
                    }
                    return 0;
                });

                for (let i = 0; i < requiredEmployees; i++) {
                    let assignedInThisIteration = false;
                    for (const employee of dynamicPrioritizedEmployees) {
                        // El ID de slot debe ser único para el turno y la posición
                        const shiftId = `${day}-${shiftInfo.start}-${shiftInfo.end}-${i}`;

                        if (this.isEmployeeSuitable(employee, day, shiftInfo, trackingState, shiftId)) {
                            this.assignShift(draftSchedule, trackingState, employee.id, day, shiftInfo, shiftId);
                            assignedInThisIteration = true;
                            break; 
                        }
                    }
                    if (!assignedInThisIteration) {
                        console.warn(`⚠️ No se pudo encontrar empleada para el slot ${i + 1}/${requiredEmployees} del turno ${shiftInfo.start}-${shiftInfo.end} del ${day}`);
                        
                        // ✨ NUEVO: Registrar turno sin cubrir
                        turnosSinCubrir.push({
                            dia: day,
                            turno: `${shiftInfo.start} - ${shiftInfo.end}`,
                            posicion: `${i + 1}/${requiredEmployees}`
                        });
                    }
                }
            });
        }

        // 6. Asignar días libres rotativos a quienes no hayan completado
        Object.keys(trackingState).forEach(employeeId => {
            const tracking = trackingState[employeeId];
            this.days.forEach(day => {
                // Si el día no tiene ni turno de trabajo ni día libre fijo, se asigna como libre rotativo
                if (!tracking.workDays.has(day) && !tracking.freeDays.has(day)) {
                    draftSchedule[employeeId][day].push({
                        id: `temp_free_${Date.now()}_${Math.random()}`,
                        isFree: true,
                        type: 'free',
                        description: 'Día libre'
                    });
                }
            });
        });

        console.log('✅ Horario generado:', draftSchedule);
        console.log('📈 Estado final de seguimiento:', trackingState);
        
        if (turnosSinCubrir.length > 0) {
            console.warn('⚠️ TURNOS SIN CUBRIR:', turnosSinCubrir);
        }
        
        // 7. Devolver el horario generado Y los turnos sin cubrir
        return {
            schedule: draftSchedule,
            turnosSinCubrir: turnosSinCubrir
        };
    }

    isEmployeeSuitable(employee, day, shiftInfo, trackingState, shiftId) {
        const tracking = trackingState[employee.id];

        // 0. No se puede trabajar en un día libre fijo
        if (tracking.freeDays.has(day)) {
            return false;
        }

        // 1. Ya tiene un turno asignado este día
        if (tracking.workDays.has(day)) {
            return false;
        }
        
        // 2. Ya tiene este turno específico asignado (para evitar duplicados en el mismo día si hay turnos iguales)
        if (tracking.assignedShifts.has(shiftId)) {
            return false;
        }

        // 3. ✨ LÍMITE DINÁMICO: Calcular días máximos según días libres del empleado
        const diasLibresAsignados = tracking.freeDays.size;
        const diasCierreEnSemana = this.coverageNeeds.dias_cierre?.length || 0;
        const diasLibresTotales = diasLibresAsignados + diasCierreEnSemana;
        const maxDiasTrabajo = Math.min(7 - diasLibresTotales, 6); // Máximo 6 días consecutivos (convenio)
        
        if (tracking.workDays.size >= maxDiasTrabajo) {
            return false;
        }

        // 4. Comprobar preferencias de turno
        const prefs = employee.preferences;
        const shiftType = this.getShiftTypeFromTime(shiftInfo.start);

        if (shiftType === 'morning' && prefs.availability === 'afternoon_only') {
            return false;
        }
        if (shiftType === 'afternoon' && prefs.availability === 'morning_only') {
            return false;
        }

        return true;
    }

    assignShift(draftSchedule, trackingState, employeeId, day, shiftInfo, shiftId) {
        const hours = this.calculateHours(shiftInfo.start, shiftInfo.end);
        const shiftType = this.getShiftTypeFromTime(shiftInfo.start);

        const newShift = {
            id: `temp_${Date.now()}_${Math.random()}`,
            start: `${shiftInfo.start}:00`,
            end: `${shiftInfo.end}:00`,
            hours: hours,
            type: shiftType,
            isFree: false,
            description: `Turno ${shiftType}`
        };

        draftSchedule[employeeId][day].push(newShift);

        // Actualizar seguimiento
        const tracking = trackingState[employeeId];
        tracking.workDays.add(day);
        tracking.assignedShifts.add(shiftId);
        tracking.assignedHours += hours;
    }

    assignFixedFreeDays(draftSchedule, trackingState, employees, weekStart) {
        employees.forEach(employee => {
            // 1. Días libres fijos normales
            const fixedDay = employee.preferences?.fixed_day_off;
            if (fixedDay && fixedDay !== 'none' && this.days.includes(fixedDay)) {
                draftSchedule[employee.id][fixedDay].push({
                    id: `fixed_free_${employee.id}`,
                    isFree: true,
                    type: 'free_fixed',
                    description: 'Día libre fijo'
                });
                trackingState[employee.id].freeDays.add(fixedDay);
                console.log(`📌 ${employee.name}: Día libre fijo asignado - ${fixedDay}`);
            }
            
            // 2. ✨ NUEVO: Días libres por patrón alternante
            const diasAlternantes = this.aplicaPatronAlternante(employee, weekStart);
            if (diasAlternantes && Array.isArray(diasAlternantes)) {
                diasAlternantes.forEach(dia => {
                    if (this.days.includes(dia)) {
                        draftSchedule[employee.id][dia].push({
                            id: `alternating_free_${employee.id}_${dia}`,
                            isFree: true,
                            type: 'free_alternating',
                            description: 'Día libre (patrón alternante)'
                        });
                        trackingState[employee.id].freeDays.add(dia);
                        console.log(`🔄 ${employee.name}: Día libre alternante asignado - ${dia}`);
                    }
                });
            }
        });
    }

    getShiftTypeFromTime(startTime) {
        const hour = parseInt(startTime.split(':')[0], 10);
        return hour < 14 ? 'morning' : 'afternoon';
    }

    calculateHours(start, end) {
        const startTime = new Date(`1970-01-01T${start}:00Z`);
        const endTime = new Date(`1970-01-01T${end}:00Z`);
        const diff = endTime.getTime() - startTime.getTime();
        return Math.round(diff / (1000 * 60 * 60));
    }

    /**
     * Recopila toda la información necesaria para cada empleada.
     */
    async getEmployeeStates(weekStart) {
        const weekStartDate = new Date(weekStart);
        const employeePromises = this.employees.map(async (emp) => {
            const convenioStatus = this.convenioAnual.getEstadoEmpleado(emp.id) || {
                estado_semanal: 'equilibrado',
                diferencia_carga_trabajo: 0,
                recomendacion_compensacion: 'Empleado excluido del análisis del convenio'
            };
            const preferences = emp.schedule_preferences || {};
            
            // Comprobar si está de ausencia durante toda la semana
            let isAbsentAllWeek = true;
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStartDate);
                day.setDate(day.getDate() + i);
                if (!this.ausenciasManager.getAusenciaEmpleado(emp.id, day)) {
                    isAbsentAllWeek = false;
                    break;
                }
            }

            return {
                id: emp.id,
                name: emp.name,
                isAvailable: !isAbsentAllWeek,
                convenio: convenioStatus,
                preferences: preferences
            };
        });

        return Promise.all(employeePromises);
    }

    /**
     * Ordena las empleadas según la necesidad de horas del convenio.
     */
    prioritizeEmployees(employeeStates) {
        return employeeStates
            .filter(e => e.isAvailable)
            .filter(e => {
                // ✨ NUEVO: Excluir empleados marcados como excluidos del generador
                const isExcluded = e.preferences?.exclude_from_generator === true;
                if (isExcluded) {
                    console.log(`⛔ ${e.name} excluido del generador automático por preferencias`);
                }
                return !isExcluded;
            })
            .sort((a, b) => {
                // Asegurarse de que 'convenio' existe para evitar errores
                const aConvenio = a.convenio || {};
                const bConvenio = b.convenio || {};

                // Prioridad 1: Empleadas con subcarga (necesitan más horas)
                if (aConvenio.estado_semanal === 'subcarga' && bConvenio.estado_semanal !== 'subcarga') return -1;
                if (bConvenio.estado_semanal === 'subcarga' && aConvenio.estado_semanal !== 'subcarga') return 1;
                
                // Si ambas tienen subcarga, la que tenga mayor diferencia (más negativa) va primero
                if (aConvenio.estado_semanal === 'subcarga' && bConvenio.estado_semanal === 'subcarga') {
                    return aConvenio.diferencia_carga_trabajo - bConvenio.diferencia_carga_trabajo;
                }

                // Prioridad 2: Empleadas equilibradas
                if (aConvenio.estado_semanal === 'equilibrado' && bConvenio.estado_semanal !== 'equilibrado') return -1;
                if (bConvenio.estado_semanal === 'equilibrado' && aConvenio.estado_semanal !== 'equilibrado') return 1;

                // Prioridad 3: Empleadas con sobrecarga (necesitan menos horas)
                // Se ordenan de menor a mayor sobrecarga para que la que menos sobrecarga tenga, trabaje antes.
                if (aConvenio.estado_semanal === 'sobrecarga' && bConvenio.estado_semanal === 'sobrecarga') {
                    return aConvenio.diferencia_carga_trabajo - bConvenio.diferencia_carga_trabajo;
                }

                return 0; // Mantener orden si no hay diferencia
            });
    }

    /**
     * Crea una estructura de scheduleData vacía.
     */
    initializeDraftSchedule() {
        const schedule = {};
        this.employees.forEach(emp => {
            schedule[emp.id] = {};
            this.days.forEach(day => {
                schedule[emp.id][day] = [];
            });
        });
        return schedule;
    }

    /**
     * Crea un objeto para hacer seguimiento de las horas y días libres asignados.
     */
    initializeTrackingState(employees) {
        const state = {};
        employees.forEach(emp => {
            state[emp.id] = {
                assignedHours: 0,
                freeDays: new Set(),
                workDays: new Set(), // Para contar días trabajados en la semana
                assignedShifts: new Set() // Para evitar duplicados de turnos
            };
        });
        return state;
    }
}

