/* Forn Verge - Navegación y Selector de Semanas - MASSA SON OLIVA */

// ===== CONFIGURAR SELECTOR DE SEMANAS =====

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

// ===== ACTUALIZAR DISPLAY DE SEMANA =====

function updateWeekDisplay() {
    const currentWeekText = document.getElementById('currentWeekText');
    const weekLabel = getWeekLabelShort(currentWeekStart); // Usar la versión corta para el header compacto
    
    // Solo actualizar el elemento que existe
    if (currentWeekText) {
        currentWeekText.textContent = weekLabel;
    }
}

// ===== ACTUALIZAR BOTONES DE NAVEGACIÓN =====

function updateNavigationButtons() {
    const currentIndex = availableWeeks.indexOf(currentWeekStart);
    const prevButton = document.getElementById('prevWeek');
    const nextButton = document.getElementById('nextWeek');
    
    prevButton.disabled = currentIndex <= 0;
    nextButton.disabled = currentIndex >= availableWeeks.length - 1;
}

// ===== NAVEGACIÓN: SEMANA ANTERIOR =====

async function goToPreviousWeek() {
    const currentIndex = availableWeeks.indexOf(currentWeekStart);
    if (currentIndex > 0) {
        await changeToWeek(availableWeeks[currentIndex - 1]);
    }
}

// ===== NAVEGACIÓN: SEMANA SIGUIENTE =====

async function goToNextWeek() {
    const currentIndex = availableWeeks.indexOf(currentWeekStart);
    if (currentIndex < availableWeeks.length - 1) {
        await changeToWeek(availableWeeks[currentIndex + 1]);
    }
}

// ===== EVENTO: CAMBIO EN SELECTOR DE SEMANAS =====

async function onWeekSelectChange(event) {
    await changeToWeek(event.target.value);
}

// ===== CAMBIAR A UNA SEMANA ESPECÍFICA =====

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

