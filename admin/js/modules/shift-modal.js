/* Forn Verge - Modal para agregar/editar turnos - MASSA SON OLIVA */

// Variable global para guardar la posición del scroll
let scrollPositionBeforeModal = 0;

function openShiftModal(empId, day, empName, dayName, shiftToEdit = null, shiftIndex = null) {
    // ALERTA SEMANA PASADA
    const thisMonday = getThisMondayISO();
    if (currentWeekStart < thisMonday) {
        if (!confirm(`⚠️ ¡Estás editando una semana pasada! ⚠️\n\n¿Estás seguro de que quieres modificar los horarios del ${dayName}?`)) {
            return; // Abortar si el usuario cancela
        }
    }

    currentModalEmployee = empId;
    currentModalDay = day;
    isEditingShift = !!shiftToEdit || shiftIndex !== null;
    currentEditingShiftIndex = shiftIndex;
    
    // Mostrar información del empleado y día
    document.getElementById('modalEmployeeDay').textContent = `${empName} - ${dayName}`;
    
    // Ajustar título y botón según modo (crear/editar)
    const modalTitle = document.querySelector('#shiftModal h3');
    if (modalTitle) {
        modalTitle.innerHTML = isEditingShift
            ? '<i class="fas fa-edit mr-2 text-blue-600"></i>Editar Turno'
            : '<i class="fas fa-plus-circle mr-2 text-blue-600"></i>Agregar Turno';
    }
    const addButton = document.getElementById('addShift');
    if (addButton) {
        addButton.innerHTML = isEditingShift
            ? '<i class="fas fa-save mr-2"></i>Guardar cambios'
            : '<i class="fas fa-plus mr-2"></i>Agregar Turno';
    }

    // Preparar campos - campos simples SIEMPRE visibles, partido oculto
    const singleFields = document.getElementById('singleShiftFields');
    const splitFields = document.getElementById('splitShiftFields');
    // Los campos simples siempre visibles
    singleFields.classList.remove('hidden');
    splitFields.classList.add('hidden');

    if (shiftToEdit && !shiftToEdit.isFree) {
        // Precargar datos del turno a editar
        const startValue = (shiftToEdit.start || '').slice(0, 5) || '07:00';
        const endValue = (shiftToEdit.end || '').slice(0, 5) || '14:00';
        document.getElementById('startTime').value = startValue;
        document.getElementById('endTime').value = endValue;
        // Inicializar valores por defecto para horario partido (por si el usuario cambia a partido)
        document.getElementById('startTime1').value = startValue;
        document.getElementById('endTime1').value = '13:00';
        document.getElementById('startTime2').value = '16:00';
        document.getElementById('endTime2').value = '21:00';
    } else {
        // Modo creación - valores por defecto
        document.getElementById('startTime').value = '07:00';
        document.getElementById('endTime').value = '14:00';
        document.getElementById('startTime1').value = '07:00';
        document.getElementById('endTime1').value = '13:00';
        document.getElementById('startTime2').value = '16:00';
        document.getElementById('endTime2').value = '21:00';
    }
    
    // 🔧 GUARDAR posición del scroll ANTES de abrir el modal
    scrollPositionBeforeModal = window.pageYOffset || document.documentElement.scrollTop;
    console.log('📍 Guardando posición del scroll:', scrollPositionBeforeModal);
    
    // Cargar templates guardados
    if (typeof loadSavedTemplates === 'function') {
        loadSavedTemplates();
    }
    
    // Mostrar modal con mejor UX móvil
    const modal = document.getElementById('shiftModal');
    modal.classList.add('show');
    
    // Mejorar foco para móvil - no enfocar automáticamente en móvil
    if (window.innerWidth > 768) {
        setTimeout(() => {
            document.getElementById('startTime').focus();
        }, 100);
    }
    
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPositionBeforeModal}px`;
    document.body.style.width = '100%';
    
    updateStatus(`Agregando turno para ${empName} 📝`);
}

function closeModal() {
    document.getElementById('shiftModal').classList.remove('show');
    
    // 🔧 RESTAURAR posición del scroll exacta
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    // Restaurar el scroll a la posición guardada
    window.scrollTo(0, scrollPositionBeforeModal);
    console.log('📍 Restaurando posición del scroll a:', scrollPositionBeforeModal);
    
    currentModalEmployee = null;
    currentModalDay = null;
    isEditingShift = false;
    currentEditingShiftIndex = null;
    
    updateStatus('Listo ✨');
}

function setTemplate(start, end, type) {
    if (type === 'morning') {
        // Selector rápido de hora
        const quickTimes = ['06:00', '06:30', '07:00'];
        let currentShifts = scheduleData[currentModalEmployee]?.[currentModalDay] || [];
        let defaultStart = '06:00';
        if (currentShifts.filter(s => s.type === 'morning').length > 0) {
            defaultStart = '06:30';
        }
        // Mostrar selector rápido
        showQuickTimeSelector(defaultStart, end, type, quickTimes);
    } else {
        document.getElementById('startTime').value = start;
        document.getElementById('endTime').value = end;
        document.getElementById('shiftType').value = type;
    }
}

function showQuickTimeSelector(defaultStart, end, type, quickTimes) {
    // Crear modal flotante o popover
    let container = document.getElementById('quickTimeSelector');
    if (!container) {
        container = document.createElement('div');
        container.id = 'quickTimeSelector';
        container.className = 'quick-time-selector-modal';
        document.body.appendChild(container);
    }
    container.innerHTML = `<div class='quick-time-title'>¿Hora de entrada para turno de mañana?</div>
        <div class='quick-time-btns'>
            ${quickTimes.map(t => `<button class='quick-time-btn' data-time='${t}'>${t}</button>`).join('')}
        </div>
        <button class='quick-time-cancel'>Cancelar</button>`;
    // Posicionar sobre el modal
    const modal = document.getElementById('shiftModal');
    container.style.position = 'fixed';
    container.style.left = '50%';
    container.style.top = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.zIndex = 3000;
    container.style.display = 'block';
    // Listeners
    container.querySelectorAll('.quick-time-btn').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('startTime').value = btn.dataset.time;
            document.getElementById('endTime').value = '14:00';
            document.getElementById('shiftType').value = type;
            container.style.display = 'none';
        };
    });
    container.querySelector('.quick-time-cancel').onclick = () => {
        container.style.display = 'none';
    };
    // Por defecto
    document.getElementById('startTime').value = defaultStart;
    document.getElementById('endTime').value = '14:00';
    document.getElementById('shiftType').value = type;
}

function addFreeDay() {
    scheduleData[currentModalEmployee][currentModalDay] = [{
        id: 'temp_' + Date.now(),
        type: 'free',
        start: null,
        end: null,
        hours: 0,
        isFree: true,
        description: 'Día libre'
    }];
    
    renderEmployees(); // Esto ahora detecta y renderiza la vista correcta
    
    // CAPTURAR las variables ANTES de cerrar el modal
    const empId = currentModalEmployee;
    const dayKey = currentModalDay;
    
    closeModal();
    
    // Guardar automáticamente
    console.log('💾 Guardando automáticamente después de añadir día libre...');
    setTimeout(() => {
        rebuildDaySchedule(empId, dayKey);
    }, 100);
}

function toggleSplitShiftFields() {
    const singleFields = document.getElementById('singleShiftFields');
    const splitFields = document.getElementById('splitShiftFields');
    const addButton = document.getElementById('addShift');
    
    if (splitFields.classList.contains('hidden')) {
        // Mostrar campos dobles (modo partido)
        singleFields.classList.add('hidden');
        splitFields.classList.remove('hidden');
        addButton.innerHTML = '<i class="fas fa-plus mr-2"></i>Agregar Horario Partido';
    } else {
        // Mostrar campos simples (modo normal)
        singleFields.classList.remove('hidden');
        splitFields.classList.add('hidden');
        addButton.innerHTML = '<i class="fas fa-plus mr-2"></i>Agregar Turno';
    }
}

function addShiftFromModal() {
    const splitFields = document.getElementById('splitShiftFields');
    const isSplitMode = !splitFields.classList.contains('hidden');
    
    if (isSplitMode) {
        // Modo horario partido - crear 2 turnos
        const startTime1 = document.getElementById('startTime1').value;
        const endTime1 = document.getElementById('endTime1').value;
        const startTime2 = document.getElementById('startTime2').value;
        const endTime2 = document.getElementById('endTime2').value;
        
        if (!startTime1 || !endTime1 || !startTime2 || !endTime2) {
            alert('Por favor completa todas las horas de ambos turnos');
            return;
        }
        
        if (startTime1 >= endTime1 || startTime2 >= endTime2) {
            alert('Las horas de inicio deben ser menores que las de fin');
            return;
        }
        
        // Calcular horas
        const hours1 = Math.round((new Date(`2000-01-01 ${endTime1}`) - new Date(`2000-01-01 ${startTime1}`)) / (1000 * 60 * 60));
        const hours2 = Math.round((new Date(`2000-01-01 ${endTime2}`) - new Date(`2000-01-01 ${startTime2}`)) / (1000 * 60 * 60));
        
        // Crear ambos turnos
        const shifts = [
            {
                id: 'temp_' + Date.now() + '_1',
                type: 'custom',
                start: startTime1 + ':00',
                end: endTime1 + ':00',
                hours: hours1,
                isFree: false,
                description: 'Primer turno'
            },
            {
                id: 'temp_' + Date.now() + '_2',
                type: 'custom',
                start: startTime2 + ':00',
                end: endTime2 + ':00',
                hours: hours2,
                isFree: false,
                description: 'Segundo turno'
            }
        ];
        
        // --- FIX: Limpiar día libre si existe antes de añadir turnos de trabajo ---
        scheduleData[currentModalEmployee][currentModalDay] = (scheduleData[currentModalEmployee][currentModalDay] || []).filter(shift => !shift.isFree);

        if (isEditingShift && currentEditingShiftIndex !== null) {
            // Reemplazar el turno editado por dos turnos (partido)
            scheduleData[currentModalEmployee][currentModalDay].splice(currentEditingShiftIndex, 1, ...shifts);
        } else {
            scheduleData[currentModalEmployee][currentModalDay].push(...shifts);
        }
        
    } else {
        // Modo normal - crear 1 turno
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        if (!startTime || !endTime) {
            alert('Por favor completa las horas');
            return;
        }
        
        if (startTime >= endTime) {
            alert('La hora de inicio debe ser menor que la de fin');
            return;
        }
        
        const hours = Math.round((new Date(`2000-01-01 ${endTime}`) - new Date(`2000-01-01 ${startTime}`)) / (1000 * 60 * 60));
        
        // Determinar el tipo de turno basado en la hora de inicio
        const hour = parseInt(startTime.split(':')[0]);
        const autoType = hour < 14 ? 'morning' : 'afternoon';
        
        const newShift = {
            id: 'temp_' + Date.now(),
            type: autoType,
            start: startTime + ':00',
            end: endTime + ':00',
            hours: hours,
            isFree: false,
            description: `Turno ${autoType === 'morning' ? 'mañana' : 'tarde'}`
        };
        
        // --- FIX: Limpiar día libre si existe antes de añadir un turno de trabajo ---
        scheduleData[currentModalEmployee][currentModalDay] = (scheduleData[currentModalEmployee][currentModalDay] || []).filter(shift => !shift.isFree);

        if (isEditingShift && currentEditingShiftIndex !== null) {
            // Reemplazar el turno existente
            scheduleData[currentModalEmployee][currentModalDay][currentEditingShiftIndex] = newShift;
        } else {
            scheduleData[currentModalEmployee][currentModalDay].push(newShift);
        }
    }
    
    renderEmployees(); // Esto ahora detecta y renderiza la vista correcta
    
    // 🧮 ACTUALIZAR CONTADOR DE HORAS TEÓRICAS
    actualizarContadorHorasTeoricas();
    
    // CAPTURAR las variables ANTES de cerrar el modal
    const empId = currentModalEmployee;
    const dayKey = currentModalDay;
    
    closeModal();
    
    // Guardar automáticamente
    console.log('💾 Guardando automáticamente después de añadir turno...');
    setTimeout(() => {
        rebuildDaySchedule(empId, dayKey);
    }, 100);
}

function getShiftDescription(type) {
    const descriptions = {
        'morning': 'Turno mañana',
        'afternoon': 'Turno tarde',
        'refuerzo': 'Turno refuerzo',
        'custom': 'Turno personalizado'
    };
    return descriptions[type] || 'Turno personalizado';
}
