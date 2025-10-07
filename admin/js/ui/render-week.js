/* Forn Verge - Renderizado de vista semanal - MASSA SON OLIVA */

function initDefaultView() {
    // Solo inicializar vista de semana
    renderWeekFullView();
    updateStatus('Vista de semana completa 📋');
    updateStats();
}

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
    actualizarContadorHorasTeoricas();
    
    console.log('✅ Grid regenerado con estilos forzados para móvil');
}
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
