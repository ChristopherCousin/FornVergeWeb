/* Forn Verge - Navegación y cambio de semanas - MASSA SON OLIVA */

function setupWeekSelector() {
    const weekSelector = document.getElementById('weekSelector');
    weekSelector.innerHTML = '';
    
    availableWeeks.forEach(weekStart => {
        const option = document.createElement('option');
        option.value = weekStart;
        option.textContent = getWeekLabelShort(weekStart); // Usar versión corta para el selector
        if (weekStart === currentWeekStart) {
            option.selected = true;
        }
        weekSelector.appendChild(option);
    });
    
    updateNavigationButtons();
}

function getWeekLabel(weekStart) {
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.toLocaleDateString('es-ES', { month: 'long' });
    const endMonth = endDate.toLocaleDateString('es-ES', { month: 'long' });
    const year = startDate.getFullYear();
    
    // Capitalizar primera letra del mes
    const capitalizeMonth = (month) => month.charAt(0).toUpperCase() + month.slice(1);
    
    if (startMonth === endMonth) {
        return `${startDay}-${endDay} ${capitalizeMonth(startMonth)} ${year}`;
    } else {
        return `${startDay} ${capitalizeMonth(startMonth)} - ${endDay} ${capitalizeMonth(endMonth)} ${year}`;
    }
}

function getWeekLabelShort(weekStart) {
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.toLocaleDateString('es-ES', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('es-ES', { month: 'short' });
    
    if (startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth}`;
    } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }
}

function updateWeekDisplay() {
    const currentWeekText = document.getElementById('currentWeekText');
    const weekLabel = getWeekLabelShort(currentWeekStart); // Usar la versión corta para el header compacto
    
    // Solo actualizar el elemento que existe
    if (currentWeekText) {
        currentWeekText.textContent = weekLabel;
    }
}

function updateNavigationButtons() {
    const currentIndex = availableWeeks.indexOf(currentWeekStart);
    const prevButton = document.getElementById('prevWeek');
    const nextButton = document.getElementById('nextWeek');
    
    prevButton.disabled = currentIndex <= 0;
    nextButton.disabled = currentIndex >= availableWeeks.length - 1;
}

async function goToPreviousWeek() {
    const currentIndex = availableWeeks.indexOf(currentWeekStart);
    if (currentIndex > 0) {
        await changeToWeek(availableWeeks[currentIndex - 1]);
    }
}

async function goToNextWeek() {
    const currentIndex = availableWeeks.indexOf(currentWeekStart);
    if (currentIndex < availableWeeks.length - 1) {
        await changeToWeek(availableWeeks[currentIndex + 1]);
    }
}

async function onWeekSelectChange(event) {
    await changeToWeek(event.target.value);
}

async function changeToWeek(newWeekStart) {
    if (newWeekStart === currentWeekStart) return;
    
    if (isInDraftMode) {
        const result = await Swal.fire({
            title: 'Descartar borrador',
            text: "Tienes un borrador sin guardar. Si cambias de semana, se perderá. ¿Continuar?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, descartar',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) {
            // Sincronizar el selector de semana con la semana actual si cancela
            document.getElementById('weekSelector').value = currentWeekStart;
            return;
        }
        // Si confirma, salir del modo borrador
        handleDiscardDraft(true); // true para modo silencioso
    }
    
    console.log(`🔄 Cambiando a semana: ${newWeekStart}`);
    updateStatus('Cambiando semana...');
    showLoading();
    
    // Actualizar variables globales
    currentWeekStart = newWeekStart;
    DAYS = generateDaysForWeek(currentWeekStart);
    
    // Limpiar datos anteriores
    employees.forEach(emp => {
        scheduleData[emp.id] = {};
        DAYS.forEach(day => {
            scheduleData[emp.id][day.key] = [];
        });
    });
    
    // Cargar datos de la nueva semana
    await loadCurrentSchedules();
    
    // ✨ PREDEFINIR HORARIOS DE RAQUEL si es una semana nueva
    await checkAndPredefineRaquelSchedule();
    
    // Actualizar interfaz
    updateWeekDisplay();
    setupWeekSelector(); // Actualiza el selector
    renderEmployees();
    
    // 🧮 ACTUALIZAR CONTADOR DE HORAS TEÓRICAS
    actualizarContadorHorasTeoricas();
    
    hideLoading();
    updateStatus(`Semana ${getWeekLabel(currentWeekStart)} ✨`);
    
    console.log(`✅ Cambio completado a semana: ${getWeekLabel(currentWeekStart)}`);
    
    // Guardar la semana seleccionada
    localStorage.setItem('fornverge_last_week', newWeekStart);
}
