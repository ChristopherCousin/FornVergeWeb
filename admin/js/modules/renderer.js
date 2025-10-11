/* Forn Verge - Módulo de Renderizado - MASSA SON OLIVA */

// Importar dependencias (acceso global)
// scheduleData, employees, DAYS, currentWeekStart desde core/state.js
// getActiveEmployees desde core/state.js
// getEmployeeColor desde utils/colors.js
// getTotalHours desde utils/shifts.js
// actualizarContadorHorasTeoricas desde modules/hours-counter.js
// openShiftModal desde ui/modals.js

/**
 * Renderiza la vista completa de la semana con todos los empleados
 */
function renderWeekFullView() {
    const container = document.getElementById('weekGridContainer');
    container.innerHTML = '';
    
    // ✅ FORZAR RESTABLECIMIENTO DE CLASES CSS MÓVIL
    container.className = 'week-grid';
    
    // ✅ FORZAR ESTILOS CRÍTICOS PARA EVITAR SCROLL LATERAL
    container.style.cssText = `
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 2px;
        width: 100%;
        max-width: 100vw;
        margin: 0;
        padding: 4px;
        overflow: hidden;
        box-sizing: border-box;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;
    
    // ✅ FORZAR ESTILOS MÓVIL SI ES NECESARIO
    if (window.innerWidth <= 768) {
        container.style.cssText += `
            width: calc(100vw - 4px) !important;
            max-width: calc(100vw - 4px) !important;
            padding: 1px !important;
            gap: 1px !important;
        `;
    }
    
    // ✅ FORZAR ESTILOS ULTRA MÓVIL SI ES NECESARIO
    if (window.innerWidth <= 400) {
        container.style.cssText += `
            width: calc(100vw - 2px) !important;
            max-width: calc(100vw - 2px) !important;
            padding: 0 !important;
            gap: 0 !important;
        `;
    }
    
    // Crear columna para cada día de la semana
    DAYS.forEach(day => {
        const dayColumn = createWeekDayColumn(day);
        container.appendChild(dayColumn);
    });
    
    // 🧮 ACTUALIZAR CONTADOR DE HORAS TEÓRICAS
    if (window.actualizarContadorHorasTeoricas) {
        window.actualizarContadorHorasTeoricas();
    }
    
    console.log('✅ Grid regenerado con estilos forzados para móvil');
}

/**
 * Renderiza la leyenda de colores por empleado
 */
function renderEmployeeLegend() {
    const container = document.getElementById('employeeLegend');
    container.innerHTML = '';
    
    const activeEmployees = getActiveEmployees();
    
    if (activeEmployees.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    const title = document.createElement('div');
    title.className = 'employee-legend-title';
    title.innerHTML = '<i class="fas fa-palette mr-2"></i>Código de colores por empleado';
    
    const grid = document.createElement('div');
    grid.className = 'employee-legend-grid';
    
    activeEmployees.forEach(employee => {
        const color = getEmployeeColor(employee.id);
        const totalHours = getTotalHours(employee.id);
        
        const item = document.createElement('div');
        item.className = 'employee-legend-item';
        item.style.cssText = `
            background: linear-gradient(45deg, ${color.background}, #ffffff);
            border: 1px solid ${color.border};
        `;
        
        item.innerHTML = `
            <div class="employee-legend-color" style="background: ${color.border}; border-color: ${color.border};"></div>
            <div class="employee-legend-info">
                <div class="employee-legend-name">${employee.name}</div>
                <div class="employee-legend-hours">${totalHours}h semanales</div>
            </div>
        `;
        
        grid.appendChild(item);
    });
    
    container.appendChild(title);
    container.appendChild(grid);
}

/**
 * Renderiza el resumen semanal de horas por empleado
 */
function renderWeekSummary() {
    const container = document.getElementById('weekSummary');
    container.innerHTML = '';
    
    const activeEmployees = getActiveEmployees();
    
    if (activeEmployees.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    const title = document.createElement('div');
    title.className = 'week-summary-title';
    title.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Resumen Semanal de Horas';
    
    const grid = document.createElement('div');
    grid.className = 'week-summary-grid';
    
    activeEmployees.forEach(employee => {
        const color = getEmployeeColor(employee.id);
        const stats = getEmployeeWeekStats(employee.id);
        
        const card = document.createElement('div');
        card.className = 'employee-summary-card';
        card.style.cssText = `
            background: linear-gradient(45deg, ${color.background}, #ffffff);
            border-color: ${color.border};
        `;
        
        card.innerHTML = `
            <div class="employee-summary-header">
                <div class="employee-summary-name">${employee.name}</div>
                <div class="employee-summary-total" style="color: ${color.border};">${stats.totalHours}h</div>
            </div>
            <div class="employee-summary-details">
                <div class="summary-detail-item">
                    <span class="summary-detail-label">Turnos:</span>
                    <span class="summary-detail-value">${stats.totalShifts}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">Días libres:</span>
                    <span class="summary-detail-value">${stats.freeDays}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">🌅 Mañanas:</span>
                    <span class="summary-detail-value">${stats.morningShifts}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">🌆 Tardes:</span>
                    <span class="summary-detail-value">${stats.afternoonShifts}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">⚡ Refuerzos:</span>
                    <span class="summary-detail-value">${stats.refuerzoShifts}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">Promedio/día:</span>
                    <span class="summary-detail-value">${stats.averageHours}h</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    container.appendChild(title);
    container.appendChild(grid);
}

/**
 * Obtiene las estadísticas semanales de un empleado
 * @param {string} employeeId - ID del empleado
 * @returns {Object} Estadísticas del empleado
 */
function getEmployeeWeekStats(employeeId) {
    let totalHours = 0;
    let totalShifts = 0;
    let freeDays = 0;
    let morningShifts = 0;
    let afternoonShifts = 0;
    let refuerzoShifts = 0;
    let customShifts = 0;
    
    DAYS.forEach(day => {
        const shifts = scheduleData[employeeId][day.key] || [];
        
        if (shifts.length === 0) {
            freeDays++;
        } else {
            shifts.forEach(shift => {
                if (shift.isFree) {
                    freeDays++;
                } else {
                    totalShifts++;
                    totalHours += shift.hours || 0;
                    
                    switch(shift.type) {
                        case 'morning':
                            morningShifts++;
                            break;
                        case 'afternoon':
                            afternoonShifts++;
                            break;
                        case 'refuerzo':
                            refuerzoShifts++;
                            break;
                        default:
                            customShifts++;
                            break;
                    }
                }
            });
        }
    });
    
    const workingDays = DAYS.length - freeDays;
    const averageHours = workingDays > 0 ? (totalHours / workingDays).toFixed(1) : '0.0';
    
    return {
        totalHours,
        totalShifts,
        freeDays,
        morningShifts,
        afternoonShifts,
        refuerzoShifts,
        customShifts,
        averageHours
    };
}

/**
 * Crea la columna para un día específico de la semana
 * @param {Object} day - Objeto con información del día
 * @returns {HTMLElement} Elemento DOM de la columna
 */
function createWeekDayColumn(day) {
    const column = document.createElement('div');
    column.className = 'week-day-column';
    
    // ✅ FORZAR ESTILOS MÓVIL EN LAS COLUMNAS
    column.style.cssText = `
        width: 100%;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        box-sizing: border-box;
        background: linear-gradient(145deg, #f8fafc, #f1f5f9);
        border-radius: 6px;
        padding: 4px 2px;
        min-height: 300px;
        border: 1px solid #e2e8f0;
        position: relative;
    `;
    
    // ✅ AJUSTAR SEGÚN TAMAÑO DE PANTALLA
    if (window.innerWidth <= 768) {
        column.style.cssText += `
            padding: 1px !important;
            min-height: 240px !important;
        `;
    }
    
    if (window.innerWidth <= 400) {
        column.style.cssText += `
            padding: 1px 0 !important;
            min-height: 220px !important;
            border-radius: 2px !important;
            border-width: 1px !important;
        `;
    }
    
    // Header del día
    const header = document.createElement('div');
    header.className = 'week-day-header';
    header.innerHTML = `
        <div>${day.name}</div>
    `;
    
    // ✅ FORZAR ESTILOS DEL HEADER
    if (window.innerWidth <= 768) {
        header.style.cssText = `
            font-size: 7px !important;
            padding: 2px 1px !important;
            line-height: 1 !important;
            word-wrap: break-word !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            margin-bottom: 2px !important;
        `;
    }
    
    if (window.innerWidth <= 400) {
        header.style.cssText += `
            font-size: 6px !important;
            padding: 1px !important;
            margin-bottom: 1px !important;
            border-radius: 2px !important;
        `;
    }
    
    // Contenido del día
    const content = document.createElement('div');
    content.className = 'week-day-content';
    
    const currentDate = new Date(currentWeekStart);
    const dayIndex = DAYS.findIndex(d => d.key === day.key);
    currentDate.setDate(currentDate.getDate() + dayIndex);

    const workingShifts = [];
    const freeEmployees = [];
    const absentEmployees = [];

    getActiveEmployees().forEach(employee => {
        const ausenciaInfo = window.ausenciasManager?.getAusenciaEmpleado(employee.id, currentDate);

        if (ausenciaInfo) {
            absentEmployees.push({ employee, ausenciaInfo });
        } else {
            const shifts = scheduleData[employee.id]?.[day.key] || [];
            const workShiftsForEmployee = shifts.filter(s => !s.isFree);

            if (workShiftsForEmployee.length > 0) {
                workShiftsForEmployee.forEach(shift => {
                    const originalIndex = shifts.findIndex(s => s.id === shift.id);
                    workingShifts.push({ employee, shift, indexInSchedule: originalIndex });
                });
            } else {
                freeEmployees.push(employee);
            }
        }
    });

    // Ordenar turnos de trabajo por hora de inicio
    workingShifts.sort((a, b) => {
        if (!a.shift.start || !b.shift.start) return 0;
        return a.shift.start.localeCompare(b.shift.start);
    });

    // 1. Renderizar turnos de trabajo
    workingShifts.forEach(({ employee, shift, indexInSchedule }) => {
        const shiftElement = createWeekShiftElement(employee, day, shift, indexInSchedule);
        content.appendChild(shiftElement);
    });

    // 2. Separador visual si hay empleados libres o ausentes
    if (workingShifts.length > 0 && (freeEmployees.length > 0 || absentEmployees.length > 0)) {
        const separator = document.createElement('div');
        separator.style.cssText = 'height: 8px; border-bottom: 1px dashed #d1d5db; margin: 8px 4px 4px;';
        content.appendChild(separator);
    }

    // 3. Renderizar empleados ausentes
    absentEmployees.forEach(({ employee, ausenciaInfo }) => {
        const absenceElement = createAbsenceElement(employee, ausenciaInfo);
        content.appendChild(absenceElement);
    });

    // 4. Renderizar empleados libres
    freeEmployees.forEach(employee => {
        const freeElement = createWeekShiftElement(employee, day, { isFree: true });
        content.appendChild(freeElement);
    });

    column.appendChild(header);
    column.appendChild(content);
    
    return column;
}

/**
 * Crea el elemento visual de un turno en la vista semanal
 * @param {Object} employee - Objeto del empleado
 * @param {Object} day - Objeto del día
 * @param {Object} shift - Objeto del turno
 * @param {number|null} indexInSchedule - Índice del turno en el horario
 * @returns {HTMLElement} Elemento DOM del turno
 */
function createWeekShiftElement(employee, day, shift, indexInSchedule = null) {
    const element = document.createElement('div');
    
    const controlAnual = window.controlAnualController || window.controlAnualSimple;
    const convenioStatus = controlAnual?.convenioAnual?.getEstadoEmpleado(employee.id);
    let statusIcon = '';
    if (convenioStatus) {
        switch (convenioStatus.estado_semanal) {
            case 'sobrecarga':
                statusIcon = '<span class="ml-2 text-red-500" title="Necesita menos horas">🔻</span>';
                break;
            case 'subcarga':
                statusIcon = '<span class="ml-2 text-blue-500" title="Necesita más horas">🔺</span>';
                break;
            case 'equilibrado':
                statusIcon = '<span class="ml-2 text-green-500" title="Carga de trabajo equilibrada">✅</span>';
                break;
        }
    }

    if (shift.isFree) {
        element.className = 'week-shift-compact free';
        element.innerHTML = `
            <div class="week-employee-name">${employee.name}${statusIcon}</div>
            <div class="week-shift-time">Día libre</div>
            <div style="font-size: 8px; opacity: 0.7; margin-top: 2px;">👆 Toca para asignar</div>
        `;
        element.title = 'Asignar turno';
    } else {
        const employeeColor = getEmployeeColor(employee.id);
        element.className = `week-shift-compact employee-color`;
        element.style.cssText = `
            border-left: 3px solid ${employeeColor.border};
            background: linear-gradient(45deg, ${employeeColor.background}, #ffffff);
        `;
        
        element.innerHTML = `
            <div class="week-employee-name">${employee.name}${statusIcon}</div>
            <div class="week-shift-time">${shift.start?.slice(0,5)} - ${shift.end?.slice(0,5)}</div>
            <div class="week-shift-delete" onclick="removeWeekShift(event, '${employee.id}', '${day.key}', ${JSON.stringify(shift).replace(/"/g, '&quot;')})">
                <i class="fas fa-times"></i>
            </div>
        `;
        element.title = `Editar turno ${shift.start?.slice(0,5) || ''} - ${shift.end?.slice(0,5) || ''}`;
    }
    
    // Agregar funcionalidad de click para editar
    element.onclick = (e) => {
        e.stopPropagation();
        openShiftModal(employee.id, day.key, employee.name, day.fullName, shift.isFree ? null : shift, indexInSchedule);
    };
    
    return element;
}

/**
 * Crea el elemento visual de una ausencia
 * @param {Object} employee - Objeto del empleado
 * @param {Object} absenceInfo - Información de la ausencia
 * @returns {HTMLElement} Elemento DOM de la ausencia
 */
function createAbsenceElement(employee, absenceInfo) {
    const element = document.createElement('div');
    element.className = 'week-shift-compact absence';
    
    const iconos = {
        'vacaciones': '🏖️',
        'baja_medica': '🏥',
        'permiso': '📋',
        'maternidad': '👶',
        'convenio': '📋',
        'asuntos_propios': '📝',
        'festivo_local': '🎉'
    };
    
    const tipoCapitalizado = (absenceInfo.tipo || '').replace('_', ' ');
    
    element.innerHTML = `
        <div class="week-employee-name">${employee.name}</div>
        <div class="week-shift-time">
            <span class="text-lg">${iconos[absenceInfo.tipo] || '📋'}</span>
            <span class="capitalize">${tipoCapitalizado}</span>
        </div>
    `;
    element.title = `Ausente por ${tipoCapitalizado}`;
    
    return element;
}

// Exportar al scope global para compatibilidad
window.renderWeekFullView = renderWeekFullView;
window.renderEmployeeLegend = renderEmployeeLegend;
window.renderWeekSummary = renderWeekSummary;
window.getEmployeeWeekStats = getEmployeeWeekStats;
window.createWeekDayColumn = createWeekDayColumn;
window.createWeekShiftElement = createWeekShiftElement;
window.createAbsenceElement = createAbsenceElement;

