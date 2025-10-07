/* Forn Verge - Elementos de turnos y ausencias - MASSA SON OLIVA */

function createWeekShiftElement(employee, day, shift, indexInSchedule = null) {
    const element = document.createElement('div');
    
    const convenioStatus = window.controlAnualSimple?.convenioAnual?.getEstadoEmpleado(employee.id);
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
