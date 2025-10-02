

// Inicializar cliente de Supabase
initSupabase();

// Inicializar semana actual en base a availableWeeks (generado en utils/dates.js)
currentWeekStart = getCurrentWeek(availableWeeks);

// Generar días para la semana actual
let DAYS = generateDaysForWeek(currentWeekStart);

// Variables globales movidas a core/state.js:
// - employees, scheduleData, originalScheduleBeforeDraft, isInDraftMode
// - currentModalEmployee, currentModalDay, isEditingShift, currentEditingShiftIndex
// - employeesOnVacation, isAuthenticated

async function initApp() {
    // console.log('🚀 Iniciando Gestión de Horarios...');
    
    // Calcular semana actual dinámicamente
    currentWeekStart = getCurrentWeek();
    console.log(`📅 Semana calculada automáticamente: ${currentWeekStart}`);
    
    // Regenerar días para la semana actual
    DAYS = generateDaysForWeek(currentWeekStart);
    
    // Verificar autenticación al inicio
    checkAuthentication();
    
    if (!isAuthenticated) {
        setupLoginListeners();
        return;
    }
    
    // Solo cargar datos si está autenticado
    updateStatus('Cargando...');
    showLoading();
    
    setupWeekSelector();
    updateWeekDisplay();
    // loadVacationState(); // ELIMINADO - Ya no se usa el sistema antiguo
    
    await loadEmployees();
    await loadCurrentSchedules();
    
    // console.log('🔍 ScheduleData después de cargar:', scheduleData);
    
    renderEmployees();
    setupEventListeners();
    
    // Inicializar con vista de semana por defecto
    initDefaultView();
    
    hideLoading();
    updateStatus('Listo ✨');
}

// Funciones updateStatus(), showLoading(), hideLoading() movidas a ui/status.js

function setupEventListeners() {
    // saveAll button no existe en el header simplificado - guardado automático activado
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    document.getElementById('addShift').addEventListener('click', addShiftFromModal);
    
    // Navegación de semanas
    document.getElementById('prevWeek').addEventListener('click', goToPreviousWeek);
    document.getElementById('nextWeek').addEventListener('click', goToNextWeek);
    document.getElementById('weekSelector').addEventListener('change', onWeekSelectChange);
    
    // Vista única de semana - sin cambios de vista
    
    // Gestión de vacaciones ELIMINADA
    
    // Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
    
    document.getElementById('shiftModal').addEventListener('click', (e) => {
        if (e.target.id === 'shiftModal') closeModal();
    });
    
    // El modal de vacaciones ya no existe
    
    // ✅ DETECTAR CAMBIOS DE ORIENTACIÓN Y REDIMENSIONAMIENTO
    window.addEventListener('resize', debounce(forceGridReflow, 300));
    window.addEventListener('orientationchange', () => {
        setTimeout(forceGridReflow, 500); // Delay para orientación
    });
    
    // Generador automático
    const btnSugerirHorario = document.getElementById('btnSugerirHorario');
    if (btnSugerirHorario) {
        btnSugerirHorario.addEventListener('click', handleSugerirHorario);
    }
    
    // Botón para borrar toda la semana
    const btnBorrarSemana = document.getElementById('btnBorrarSemana');
    if (btnBorrarSemana) {
        btnBorrarSemana.addEventListener('click', handleBorrarSemanaCompleta);
    }
    
    // Botones del modo borrador
    document.getElementById('btnSaveDraft')?.addEventListener('click', handleSaveDraft);
    document.getElementById('btnDiscardDraft')?.addEventListener('click', handleDiscardDraft);
    // Ajustes del generador
    document.getElementById('btnGeneratorSettings')?.addEventListener('click', openGeneratorSettings);
    
    console.log('✅ Event listeners configurados con detección de resize');
}

// Funciones loadEmployees() y loadCurrentSchedules() movidas a services/schedules-service.js
// Funciones getShiftType(), getShiftDescription(), getShiftTypeIcon(), getShiftTypeClass() movidas a utils/shifts.js
// Funciones updateStats(), getActiveEmployees() movidas a core/state.js

function renderEmployees() {
    // Solo renderizar vista de semana
    renderWeekFullView();
    updateStats();
}

// Funciones getTotalShifts() y getTotalHours() movidas a utils/shifts.js

// Redefinir localmente para evitar recursión infinita
function getTotalShifts(empId) {
    let total = 0;
    DAYS.forEach(day => {
        const shifts = scheduleData[empId][day.key] || [];
        total += shifts.filter(s => !s.isFree).length;
    });
    return total;
}

function getTotalHours(empId) {
    let total = 0;
    DAYS.forEach(day => {
        const shifts = scheduleData[empId][day.key] || [];
        total += shifts.reduce((sum, shift) => sum + (shift.hours || 0), 0);
    });
    return total;
}

// Funciones de vista por días eliminadas - solo vista de semana
// Funciones openShiftModal(), closeModal(), setTemplate(), showQuickTimeSelector(), addFreeDay(), toggleSplitShiftFields(), addShiftFromModal() movidas a ui/modals.js
// Función getShiftDescription() movida a utils/shifts.js

function removeShift(empId, day, index) {
    // ALERTA SEMANA PASADA
    const thisMonday = getThisMondayISO();
    if (currentWeekStart < thisMonday) {
        if (!confirm(`⚠️ ¡Estás eliminando un turno de una semana pasada! ⚠️\n\n¿Estás seguro de que quieres continuar?`)) {
            return; // Abortar si el usuario cancela
        }
    }
    
    const shiftToRemove = scheduleData[empId][day][index];
    
    // Remover del estado local
    scheduleData[empId][day].splice(index, 1);
    
    // Re-renderizar la vista correcta
    renderEmployees();
    
    // 🧮 ACTUALIZAR CONTADOR DE HORAS TEÓRICAS
    actualizarContadorHorasTeoricas();
    
    // Eliminar específicamente de Supabase (más seguro)
    // console.log('💾 Eliminando turno específico de Supabase...');
    setTimeout(() => {
        removeSpecificShiftFromDB(empId, day, shiftToRemove);
    }, 100);
}

async function removeSpecificShiftFromDB(empId, day, shiftData) {
    try {
        // Si tiene un ID de BD real, usar ese
        if (shiftData.id && !shiftData.id.toString().startsWith('temp_')) {
            console.log('🗑️ Eliminando registro específico con ID:', shiftData.id);
            
            const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', shiftData.id);
                
            if (error) {
                console.error('❌ Error eliminando registro específico:', error);
                return;
            }
            
            console.log('✅ Registro eliminado específicamente');
        } else {
            // Si no tiene ID real (temporal), reconstruir solo ese día del empleado
            // console.log('🔄 Reconstruyendo horarios solo para:', empId, day);
            await rebuildDaySchedule(empId, day);
        }
        
        updateStatus('Turno eliminado ✅');
        
        // Actualizar la vista después de eliminar
        renderEmployees();
        
    } catch (error) {
        console.error('❌ Error:', error);
        updateStatus('Error eliminando ❌');
    }
}

async function rebuildDaySchedule(empId, day) {
    try {
        // Eliminar solo los registros de este empleado en este día
        const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('employee_id', empId)
            .eq('week_start', currentWeekStart)
            .eq('day_of_week', day);
            
        if (deleteError) {
            console.error('❌ Error eliminando día específico:', deleteError);
            return;
        }
        
        // Insertar nuevos registros para este día
        const shifts = scheduleData[empId][day] || [];
        const newSchedules = [];
        
        if (shifts.length === 0) {
            // Día libre por defecto
            newSchedules.push({
                employee_id: empId,
                week_start: currentWeekStart,
                day_of_week: day,
                start_time: null,
                end_time: null,
                hours: 0,
                is_free_day: true,
                shift_sequence: 1,
                shift_description: 'Día libre',
                colleagues: []
            });
        } else {
            shifts.forEach((shift, index) => {
                newSchedules.push({
                    employee_id: empId,
                    week_start: currentWeekStart,
                    day_of_week: day,
                    start_time: shift.start,
                    end_time: shift.end,
                    hours: shift.hours || 0,
                    is_free_day: shift.isFree,
                    shift_sequence: index + 1,
                    shift_description: shift.description || getShiftDescription(shift.type),
                    colleagues: []
                });
            });
        }
        
        if (newSchedules.length > 0) {
            const { data: insertData, error } = await supabase
                .from('schedules')
                .insert(newSchedules);
                
            if (error) {
                console.error('❌ Error insertando día reconstruido:', error);
                return;
            }
        }
        
        console.log('✅ Día reconstruido exitosamente');
        
        // Actualizar la vista después de reconstruir
        renderEmployees();
        
    } catch (error) {
        console.error('❌ Error reconstruyendo día:', error);
    }
}

async function saveAllSchedules(isAutoSave = false) {
    const saveBtn = document.getElementById('saveAll'); // Puede ser null
    let originalText = '';
    
    if (!isAutoSave && saveBtn) {
        originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
        saveBtn.disabled = true;
    }
    updateStatus('Guardando...');

    try {
        // console.log('🗑️ Eliminando horarios existentes para semana:', currentWeekStart);
        
        // CORRECCIÓN CRÍTICA: Aplicar filtro ANTES del delete
        const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('week_start', currentWeekStart);

        if (deleteError) {
            console.error('❌ Error eliminando:', deleteError);
            throw deleteError;
        }

        // console.log('✅ Horarios antiguos eliminados SOLO para semana', currentWeekStart);

        const newSchedules = [];
        let sequenceCounter = {};
        
        // console.log('🔄 Procesando horarios para guardado...');
        // console.log('👥 Empleados a procesar:', employees.length);
        // console.log('📊 ScheduleData actual:', scheduleData);

        employees.forEach(employee => {
            DAYS.forEach(day => {
                const shifts = scheduleData[employee.id][day.key] || [];
                const dayKey = `${employee.id}_${day.key}`;
                sequenceCounter[dayKey] = 1;
                
                // console.log(`📝 ${employee.name} - ${day.name}: ${shifts.length} turnos`, shifts);
                
                if (shifts.length === 0) {
                    // Registro para día sin turnos (solo campos básicos)
                    const scheduleRecord = {
                        employee_id: employee.id,
                        week_start: currentWeekStart,
                        day_of_week: day.key,
                        start_time: null,
                        end_time: null,
                        hours: 0,
                        is_free_day: true,
                        shift_sequence: 1,
                        shift_description: 'Día libre',
                        colleagues: []
                    };
                    
                    newSchedules.push(scheduleRecord);
                } else {
                    shifts.forEach((shift, shiftIndex) => {
                        const scheduleRecord = {
                            employee_id: employee.id,
                            week_start: currentWeekStart,
                            day_of_week: day.key,
                            start_time: shift.start,
                            end_time: shift.end,
                            hours: shift.hours || 0,
                            is_free_day: shift.isFree,
                            shift_sequence: shiftIndex + 1,
                            shift_description: shift.description || getShiftDescription(shift.type),
                            colleagues: []
                        };
                        
                        newSchedules.push(scheduleRecord);
                    });
                }
            });
        });

        // console.log('💾 Intentando guardar', newSchedules.length, 'registros');
        // console.log('📄 Muestra de registros a guardar:', newSchedules.slice(0, 3));
        // console.log('✅ Usando estructura COMPLETA de BD (con shift_sequence y shift_description)');

        const { data: insertData, error } = await supabase
            .from('schedules')
            .insert(newSchedules);

        if (error) {
            console.error('❌ Error insertando:', error);
            console.error('❌ Detalles del error:', error.details);
            console.error('❌ Mensaje:', error.message);
            alert('Error al guardar: ' + error.message);
            return;
        }

        // console.log('✅ Guardados', newSchedules.length, 'registros exitosamente');
        console.log('✅ Respuesta de insert:', insertData);
        
        if (!isAutoSave) {
            showSaveSuccess();
        }
        
        // 🧮 ACTUALIZAR CONTADOR DE HORAS TEÓRICAS
        actualizarContadorHorasTeoricas();
        
        updateStatus('Guardado ✅');

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al guardar horarios');
        updateStatus('Error ❌');
    } finally {
        if (!isAutoSave && saveBtn) {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }
}

// Función showSaveSuccess() movida a ui/status.js

// ================================
// VISTA POR DÍAS
// ================================

// Función renderDaysView eliminada - solo vista de semana

// Funciones de vista por días eliminadas completamente
// Funciones getDayEmoji() y getDayDate() movidas a utils/formatters.js

// Redefinir localmente para evitar recursión infinita
function getDayEmoji(dayKey) {
    const emojis = {
        'lunes': '📋',
        'martes': '📋', 
        'miercoles': '📋',
        'jueves': '📋',
        'viernes': '📋',
        'sabado': '🛍️',
        'domingo': '😴'
    };
    return emojis[dayKey] || '📅';
}

function getDayDate(dayKey) {
    const weekStart = new Date(currentWeekStart);
    const dayIndex = DAYS.findIndex(d => d.key === dayKey);
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayIndex);
    
    return `${dayDate.getDate()} ${dayDate.toLocaleDateString('es-ES', { month: 'short' })}`;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

function removeWeekShift(event, empId, dayKey, shiftData) {
    event.stopPropagation();
    
    console.log('🗑️ Eliminando turno desde vista de semana:', { empId, dayKey, shiftData });
    
    // Buscar el índice del turno en scheduleData
    const shifts = scheduleData[empId][dayKey] || [];
    let shiftIndex = -1;
    
    // Mejorar la búsqueda del turno
    if (shiftData.isFree) {
        // Para días libres, buscar por tipo
        shiftIndex = shifts.findIndex(shift => shift.isFree === true);
    } else {
        // Para turnos normales, buscar por horarios exactos
        shiftIndex = shifts.findIndex(shift => {
            return !shift.isFree && 
                   shift.start === shiftData.start && 
                   shift.end === shiftData.end;
        });
        
        // Si no se encuentra, intentar búsqueda más flexible
        if (shiftIndex === -1) {
            shiftIndex = shifts.findIndex(shift => {
                return !shift.isFree && 
                       shift.start?.slice(0,5) === shiftData.start?.slice(0,5) &&
                       shift.end?.slice(0,5) === shiftData.end?.slice(0,5);
            });
        }
    }
    
    if (shiftIndex === -1) {
        console.error('❌ No se encontró el turno para eliminar');
        console.log('🔍 Turnos disponibles:', shifts);
        console.log('🔍 Buscando:', shiftData);
        return;
    }
    
    console.log(`🎯 Encontrado turno en índice ${shiftIndex}`);
    
    // Eliminar usando la función existente
    removeShift(empId, dayKey, shiftIndex);
    
    // Forzar actualización de la vista semanal
    setTimeout(() => {
        renderWeekFullView();
    }, 100);
}

