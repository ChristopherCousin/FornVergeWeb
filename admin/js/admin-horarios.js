/* Forn Verge - Admin Horarios JavaScript */

// Configuración
const SUPABASE_URL = 'https://csxgkxjeifakwslamglc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg';

// Función para calcular automáticamente la semana actual
function getCurrentWeek() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-based (5 = junio)
    const currentDay = today.getDate();
    
    console.log(`📅 Fecha actual: ${currentDay}/${currentMonth + 1}/${currentYear}`);
    
    // Si estamos en junio de 2025
    if (currentYear === 2025 && currentMonth === 5) { // 5 = junio
        if (currentDay >= 16 && currentDay <= 22) {
            return '2025-06-16'; // 16-22 Jun
        } else if (currentDay >= 23 && currentDay <= 29) {
            return '2025-06-23'; // 23-29 Jun
        } else if (currentDay >= 30) {
            return '2025-06-30'; // 30 Jun-6 Jul
        } else {
            return '2025-06-16'; // Fallback para días anteriores
        }
    }
    // Si estamos en julio de 2025
    else if (currentYear === 2025 && currentMonth === 6) { // 6 = julio
        if (currentDay <= 6) {
            return '2025-06-30'; // 30 Jun-6 Jul
        } else if (currentDay >= 7 && currentDay <= 13) {
            return '2025-07-07'; // 7-13 Jul
        } else if (currentDay >= 14 && currentDay <= 20) {
            return '2025-07-14'; // 14-20 Jul
        } else if (currentDay >= 21 && currentDay <= 27) {
            return '2025-07-21'; // 21-27 Jul
        } else if (currentDay >= 28) {
            return '2025-07-28'; // 28 Jul-3 Ago
        }
    }
    // Si estamos en agosto de 2025
    else if (currentYear === 2025 && currentMonth === 7) { // 7 = agosto
        if (currentDay <= 3) {
            return '2025-07-28'; // 28 Jul-3 Ago
        } else if (currentDay >= 4 && currentDay <= 10) {
            return '2025-08-04'; // 4-10 Ago
        }
    }
    
    // Fallback por defecto
    return '2025-06-23';
}

// Variables dinámicas para semanas - CALCULADO AUTOMÁTICAMENTE
let currentWeekStart = getCurrentWeek(); // Calcular semana actual dinámicamente
const availableWeeks = [
    '2025-06-16', // Semana 1: 16-22 Jun (pasada)
    '2025-06-23', // Semana 2: 23-29 Jun ← ACTUAL (incluye 24 Jun)
    '2025-06-30', // Semana 3: 30 Jun-6 Jul
    '2025-07-07', // Semana 4: 7-13 Jul
    '2025-07-14', // Semana 5: 14-20 Jul
    '2025-07-21', // Semana 6: 21-27 Jul
    '2025-07-28', // Semana 7: 28 Jul-3 Ago
    '2025-08-04'  // Semana 8: 4-10 Ago
];

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función para generar días dinámicamente
function generateDaysForWeek(weekStart) {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const fullDayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const startDate = new Date(weekStart);
    return days.map((day, index) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + index);
        
        const dayNum = currentDate.getDate();
        const monthName = monthNames[currentDate.getMonth()];
        
        return {
            key: day,
            name: `${dayNames[index]} ${dayNum}`,
            fullName: `${fullDayNames[index]} ${dayNum} ${monthName}`
        };
    });
}

let DAYS = generateDaysForWeek(currentWeekStart);

let employees = [];
let scheduleData = {}; 
let currentModalEmployee = null;
let currentModalDay = null;
let employeesOnVacation = new Set(); // IDs de empleados de vacaciones

// Configuración de autenticación
const ADMIN_PASSWORD = 'fornverge2025'; // Contraseña del panel
let isAuthenticated = false;

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
    loadVacationState(); // Cargar estado de vacaciones
    
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

function updateStatus(status) {
    document.getElementById('status').textContent = status;
}

function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('weekFullView').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('weekFullView').classList.remove('hidden');
}

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
    
    // Gestión de vacaciones
    document.getElementById('vacationsBtn').addEventListener('click', openVacationModal);
    document.getElementById('closeVacationModal').addEventListener('click', closeVacationModal);
    document.getElementById('cancelVacationModal').addEventListener('click', closeVacationModal);
    
    // Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
    
    document.getElementById('shiftModal').addEventListener('click', (e) => {
        if (e.target.id === 'shiftModal') closeModal();
    });
    
    document.getElementById('vacationModal').addEventListener('click', (e) => {
        if (e.target.id === 'vacationModal') closeVacationModal();
    });
    
    // ✅ DETECTAR CAMBIOS DE ORIENTACIÓN Y REDIMENSIONAMIENTO
    window.addEventListener('resize', debounce(forceGridReflow, 300));
    window.addEventListener('orientationchange', () => {
        setTimeout(forceGridReflow, 500); // Delay para orientación
    });
    
    console.log('✅ Event listeners configurados con detección de resize');
}

async function loadEmployees() {
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .neq('role', 'admin')
            .order('name');

        if (error) {
            console.error('❌ Error cargando empleados:', error);
            return;
        }

        employees = data;
        // console.log('✅ Empleados cargados:', employees.length);
        
        employees.forEach(emp => {
            scheduleData[emp.id] = {};
            DAYS.forEach(day => {
                scheduleData[emp.id][day.key] = [];
            });
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function loadCurrentSchedules() {
    try {
        // Primero intentar con start_time que siempre existe
        let { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('week_start', currentWeekStart)
            .order('start_time', { nullsFirst: true });

        // Si hay error, intentar sin ordenar
        if (error) {
            console.log('🔄 Reintentando sin ordenar...');
            const result = await supabase
                .from('schedules')
                .select('*')
                .eq('week_start', currentWeekStart);
            
            data = result.data;
            error = result.error;
        }

        if (error) {
            console.error('❌ Error cargando horarios:', error);
            console.error('Error details:', error);
            return;
        }

        // console.log('📊 Datos recibidos:', data?.length || 0, 'registros');
        // console.log('🔍 Muestra de datos:', data?.slice(0, 2));

        // LIMPIAR scheduleData antes de cargar
        employees.forEach(emp => {
            DAYS.forEach(day => {
                scheduleData[emp.id][day.key] = [];
            });
        });

        // Log específico para Gaby antes del procesamiento
        const gabyEmployee = employees.find(emp => emp.name === 'GABY');
        if (gabyEmployee) {
            const gabySchedules = data.filter(s => s.employee_id === gabyEmployee.id);
            // console.log('🔍 GABY - Registros en BD:', gabySchedules.length);
            gabySchedules.forEach((s, i) => {
                console.log(`  [${i+1}] ${s.day_of_week}: ${s.start_time || 'NULL'}-${s.end_time || 'NULL'} (libre: ${s.is_free_day}, seq: ${s.shift_sequence})`);
            });
        }

        data.forEach(schedule => {
            const empId = schedule.employee_id;
            const day = schedule.day_of_week;
            
            if (scheduleData[empId] && scheduleData[empId][day]) {
                if (schedule.is_free_day) {
                    scheduleData[empId][day].push({
                        id: schedule.id,
                        type: 'free',
                        isFree: true,
                        description: 'Día libre'
                    });
                    
                    // Log específico para Gaby cuando es día libre
                    if (gabyEmployee && empId === gabyEmployee.id) {
                        // console.log(`🔍 GABY - Añadiendo día libre en ${day}`);
                    }
                } else {
                    const shiftType = getShiftType(schedule.start_time, schedule.end_time);
                    const newShift = {
                        id: schedule.id,
                        start: schedule.start_time,
                        end: schedule.end_time,
                        hours: schedule.hours || 0,
                        type: shiftType,
                        isFree: false,
                        description: schedule.shift_description || getShiftDescription(shiftType)
                    };
                    
                    scheduleData[empId][day].push(newShift);
                    
                    // Log específico para Gaby cuando es turno de trabajo
                    if (gabyEmployee && empId === gabyEmployee.id) {
                        // console.log(`🔍 GABY - Añadiendo turno en ${day}: ${newShift.start}-${newShift.end} (${newShift.hours}h)`);
                    }
                }
            }
        });

        // Log específico para Gaby después del procesamiento
        if (gabyEmployee) {
            // console.log('🔍 GABY - Estado final en scheduleData:');
            DAYS.forEach(day => {
                const shifts = scheduleData[gabyEmployee.id][day.key] || [];
                console.log(`  ${day.key}: ${shifts.length} turnos`);
                shifts.forEach((s, i) => {
                    console.log(`    [${i+1}] ${s.isFree ? 'DÍA LIBRE' : `${s.start}-${s.end} (${s.hours}h)`}`);
                });
            });
        }

        // console.log('✅ Horarios cargados en scheduleData');
        updateStats();
        
        // 🧮 ACTUALIZAR CONTADOR DE HORAS TEÓRICAS
        actualizarContadorHorasTeoricas();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function getShiftType(startTime, endTime) {
    if (startTime === '07:00:00' && endTime === '14:00:00') return 'morning';
    if (startTime === '14:00:00' && endTime === '21:00:00') return 'afternoon';
    if (startTime && endTime) {
        const start = parseInt(startTime.split(':')[0]);
        if (start >= 9 && start <= 11) return 'refuerzo';
        if (start >= 16 && start <= 18) return 'refuerzo';
    }
    return 'custom';
}

function updateStats() {
    // Stats eliminadas completamente - solo para debug interno
    const activeEmployees = getActiveEmployees();
    // console.log(`📊 ${activeEmployees.length} empleados activos en la semana`);
}

function renderEmployees() {
    // Solo renderizar vista de semana
    renderWeekFullView();
    updateStats();
}

// Función helper para filtrar empleados que no están de vacaciones
function getActiveEmployees() {
    return employees.filter(emp => !employeesOnVacation.has(emp.id));
}

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

function openShiftModal(empId, day, empName, dayName) {
    currentModalEmployee = empId;
    currentModalDay = day;
    
    // Mostrar información del empleado y día
    document.getElementById('modalEmployeeDay').textContent = `${empName} - ${dayName}`;
    
    // Limpiar campos
    document.getElementById('startTime').value = '07:00';
    document.getElementById('endTime').value = '14:00';
    document.getElementById('startTime1').value = '07:00';
    document.getElementById('endTime1').value = '13:00';
    document.getElementById('startTime2').value = '16:00';
    document.getElementById('endTime2').value = '21:00';
    document.getElementById('shiftType').value = 'morning';
    
    // Ocultar campos de turno partido
    document.getElementById('singleShiftFields').classList.remove('hidden');
    document.getElementById('splitShiftFields').classList.add('hidden');
    
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
    
    updateStatus(`Agregando turno para ${empName} 📝`);
}

function closeModal() {
    document.getElementById('shiftModal').classList.remove('show');
    
    // Restaurar scroll del body
    document.body.style.overflow = '';
    
    currentModalEmployee = null;
    currentModalDay = null;
    
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
    const shiftTypeSelector = document.getElementById('shiftTypeSelector');
    const addButton = document.getElementById('addShift');
    
    if (splitFields.classList.contains('hidden')) {
        // Mostrar campos dobles (modo partido)
        singleFields.classList.add('hidden');
        splitFields.classList.remove('hidden');
        shiftTypeSelector.classList.add('hidden');
        addButton.innerHTML = '<i class="fas fa-plus mr-2"></i>Agregar Horario Partido';
    } else {
        // Mostrar campos simples (modo normal)
        singleFields.classList.remove('hidden');
        splitFields.classList.add('hidden');
        shiftTypeSelector.classList.remove('hidden');
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
        
        scheduleData[currentModalEmployee][currentModalDay].push(...shifts);
        
    } else {
        // Modo normal - crear 1 turno
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const shiftType = document.getElementById('shiftType').value;
        
        if (!startTime || !endTime) {
            alert('Por favor completa las horas');
            return;
        }
        
        if (startTime >= endTime) {
            alert('La hora de inicio debe ser menor que la de fin');
            return;
        }
        
        const hours = Math.round((new Date(`2000-01-01 ${endTime}`) - new Date(`2000-01-01 ${startTime}`)) / (1000 * 60 * 60));
        
        const newShift = {
            id: 'temp_' + Date.now(),
            type: shiftType,
            start: startTime + ':00',
            end: endTime + ':00',
            hours: hours,
            isFree: false,
            description: getShiftDescription(shiftType)
        };
        
        scheduleData[currentModalEmployee][currentModalDay].push(newShift);
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

function removeShift(empId, day, index) {
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
    const saveBtn = document.getElementById('saveAll');
    const originalText = saveBtn.innerHTML;
    
    if (!isAutoSave) {
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
        if (!isAutoSave) {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }
}

function showSaveSuccess() {
    const saveStatus = document.getElementById('saveStatus');
    saveStatus.classList.remove('hidden');
    
    setTimeout(() => {
        saveStatus.classList.add('hidden');
    }, 4000);
}

// ================================
// VISTA POR DÍAS
// ================================

// Función renderDaysView eliminada - solo vista de semana

// Funciones de vista por días eliminadas completamente

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

// ================================
// NAVEGACIÓN POR SEMANAS
// ================================

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

// ================================
// PREDEFINIR HORARIOS DE RAQUEL
// ================================

async function checkAndPredefineRaquelSchedule() {
    try {
        // Encontrar a Raquel
        const raquel = employees.find(emp => emp.name.toUpperCase() === 'RAQUEL');
        if (!raquel) {
            // console.log('ℹ️ Raquel no encontrada en la lista de empleados');
            return;
        }

        // Verificar si ya tiene horarios para esta semana
        const { data: existingSchedules, error } = await supabase
            .from('schedules')
            .select('id')
            .eq('employee_id', raquel.id)
            .eq('week_start', currentWeekStart)
            .limit(1);

        if (error) {
            console.error('❌ Error verificando horarios de Raquel:', error);
            return;
        }

        // Si ya tiene horarios, no hacer nada
        if (existingSchedules && existingSchedules.length > 0) {
            // console.log('ℹ️ Raquel ya tiene horarios para esta semana');
            return;
        }

        // console.log('✨ Predefiniendo horarios de Raquel para la semana ' + currentWeekStart);
        updateStatus('Creando horarios de Raquel...');

        // Horarios predefinidos de Raquel: 6:00-14:00 L-V, libre sábado
        const raquelSchedule = [
            { day: 'lunes', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'martes', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'miercoles', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'jueves', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'viernes', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'sabado', start: null, end: null, hours: 0, free: true },
            { day: 'domingo', start: '06:00:00', end: '14:00:00', hours: 8, free: false }
        ];

        // Crear los registros en la base de datos
        const schedulePromises = raquelSchedule.map(async (schedule) => {
            const scheduleData = {
                employee_id: raquel.id,
                week_start: currentWeekStart,
                day_of_week: schedule.day,
                start_time: schedule.start,
                end_time: schedule.end,
                hours: schedule.hours,
                is_free_day: schedule.free,
                shift_sequence: 1,
                shift_description: schedule.free ? 'Día libre' : 'Turno mañana',
                colleagues: []
            };

            const { data, error } = await supabase
                .from('schedules')
                .insert([scheduleData])
                .select();

            if (error) {
                console.error(`❌ Error creando horario para ${schedule.day}:`, error);
                return null;
            }

            return data[0];
        });

        const results = await Promise.all(schedulePromises);
        const successCount = results.filter(result => result !== null).length;

        if (successCount === raquelSchedule.length) {
            // console.log(`✅ Horarios de Raquel creados exitosamente (${successCount} días)`);
            
            // Actualizar scheduleData local
            raquelSchedule.forEach((schedule, index) => {
                const result = results[index];
                if (result) {
                    const shift = {
                        id: result.id,
                        type: schedule.free ? 'free' : 'morning',
                        start: schedule.start,
                        end: schedule.end,
                        hours: schedule.hours,
                        isFree: schedule.free,
                        description: schedule.free ? 'Día libre' : 'Turno mañana'
                    };
                    
                    if (!scheduleData[raquel.id][schedule.day]) {
                        scheduleData[raquel.id][schedule.day] = [];
                    }
                    scheduleData[raquel.id][schedule.day].push(shift);
                }
            });

            // Mostrar notificación
            showRaquelNotification();
            
        } else {
            console.warn(`⚠️ Solo se crearon ${successCount} de ${raquelSchedule.length} horarios para Raquel`);
        }

    } catch (error) {
        console.error('❌ Error en predefinición de horarios de Raquel:', error);
    }
}

function showRaquelNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full opacity-0 transition-all duration-500';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-magic mr-3 text-xl"></i>
            <div>
                <div class="font-semibold">¡Horarios creados!</div>
                <div class="text-sm opacity-90">Raquel: L-V 6:00-14:00, Sáb libre</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
    }, 100);
    
    // Animar salida después de 4 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 4000);
}

// ================================
// SISTEMA DE AUTENTICACIÓN
// ================================

function checkAuthentication() {
    const savedAuth = localStorage.getItem('fornverge_admin_auth');
    const sessionAuth = sessionStorage.getItem('fornverge_admin_session');
    
    if (savedAuth === 'authenticated' || sessionAuth === 'authenticated') {
        isAuthenticated = true;
        showMainInterface();
        console.log('✅ Usuario autenticado desde storage');
    } else {
        isAuthenticated = false;
        showLoginInterface();
        console.log('🔐 Mostrando pantalla de login');
    }
}

function showMainInterface() {
    document.body.classList.add('authenticated');
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('mainHeader').style.display = 'block';
    document.getElementById('mainContent').style.display = 'block';
}

function showLoginInterface() {
    document.body.classList.remove('authenticated');
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    
    // Focus en el input de contraseña
    setTimeout(() => {
        document.getElementById('passwordInput').focus();
    }, 100);
}

function setupLoginListeners() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    
    loginForm.addEventListener('submit', handleLogin);
    
    // Enter en el input de contraseña
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin(e);
        }
    });
    
    // Limpiar error al escribir
    passwordInput.addEventListener('input', () => {
        loginError.classList.add('hidden');
        passwordInput.classList.remove('border-red-500');
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    const rememberMe = document.getElementById('rememberMe');
    
    const password = passwordInput.value;
    
    // Mostrar loading
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
    loginButton.disabled = true;
    
    // Simular pequeño delay para UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (password === ADMIN_PASSWORD) {
        // Login exitoso
        isAuthenticated = true;
        
        // Guardar sesión
        if (rememberMe.checked) {
            localStorage.setItem('fornverge_admin_auth', 'authenticated');
        } else {
            sessionStorage.setItem('fornverge_admin_session', 'authenticated');
        }
        
        console.log('✅ Login exitoso');
        
        // Mostrar interfaz principal
        showMainInterface();
        
        // Inicializar la aplicación
        setTimeout(async () => {
            updateStatus('Cargando...');
            showLoading();
            
            setupWeekSelector();
            updateWeekDisplay();
            
            await loadEmployees();
            await loadCurrentSchedules();
            
            renderEmployees();
            setupEventListeners();
            
            hideLoading();
            updateStatus('Listo ✨');
        }, 300);
        
    } else {
        // Login fallido
        loginError.classList.remove('hidden');
        passwordInput.classList.add('border-red-500');
        passwordInput.value = '';
        passwordInput.focus();
        
        // Shake animation
        passwordInput.style.animation = 'shake 0.5s';
        setTimeout(() => {
            passwordInput.style.animation = '';
        }, 500);
        
        console.log('❌ Login fallido');
    }
    
    // Restaurar botón
    loginButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Acceder';
    loginButton.disabled = false;
}

function logout() {
    // Confirmar logout
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        // Limpiar autenticación
        localStorage.removeItem('fornverge_admin_auth');
        sessionStorage.removeItem('fornverge_admin_session');
        
        isAuthenticated = false;
        
        // Mostrar login
        showLoginInterface();
        
        // Limpiar datos sensibles
        employees = [];
        scheduleData = {};
        
        console.log('🚪 Sesión cerrada');
    }
}

// Añadir animación shake al CSS dinámicamente
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
}
`;

const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);

// === FUNCIONES DE VISTA DE SEMANA COMPLETA ===

// Solo vista de semana - funciones de cambio de vista eliminadas

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
    
    // Separar empleados que trabajan de los que están libres (CON LÓGICA MEJORADA)
    const workingShifts = [];
    const freeEmployees = [];
    
    getActiveEmployees().forEach(employee => {
        const shifts = scheduleData[employee.id][day.key] || [];
        
        if (shifts.length === 0) {
            // No tiene registros - empleado libre
            freeEmployees.push(employee);
        } else {
            // Separar turnos de trabajo de días libres
            const workShifts = shifts.filter(shift => !shift.isFree);
            const freeShifts = shifts.filter(shift => shift.isFree);
            
            if (workShifts.length > 0) {
                // Tiene turnos de trabajo - agregar SOLO los turnos de trabajo
                workShifts.forEach(shift => {
                    workingShifts.push({
                        employee: employee,
                        shift: shift
                    });
                });
                
                // Log de advertencia si también tiene días libres (problema de datos)
                if (freeShifts.length > 0) {
                    console.warn(`⚠️ VISTA SEMANAL: ${employee.name} tiene TANTO turnos de trabajo COMO días libres en ${day.key} - priorizando turnos de trabajo`);
                }
            } else {
                // Solo tiene días libres - empleado libre
                freeEmployees.push(employee);
            }
        }
    });
    
    // Ordenar turnos de trabajo por hora de inicio
    workingShifts.sort((a, b) => {
        if (!a.shift.start || !b.shift.start) return 0;
        return a.shift.start.localeCompare(b.shift.start);
    });
    
    // Renderizar primero los turnos de trabajo
    workingShifts.forEach(({ employee, shift }) => {
        const shiftElement = createWeekShiftElement(employee, day, shift);
        content.appendChild(shiftElement);
    });
    
    // Separador visual si hay empleados libres
    if (freeEmployees.length > 0 && workingShifts.length > 0) {
        const separator = document.createElement('div');
        separator.style.cssText = 'height: 8px; border-bottom: 1px dashed #d1d5db; margin: 8px 0;';
        content.appendChild(separator);
    }
    
    // Renderizar empleados libres al final (solo empleados que REALMENTE están libres)
    freeEmployees.forEach(employee => {
        const freeElement = createWeekShiftElement(employee, day, { isFree: true });
        content.appendChild(freeElement);
    });
    
    // No necesitamos botón extra - los empleados libres ya son clickeables
    
    column.appendChild(header);
    column.appendChild(content);
    
    return column;
}

function createWeekShiftElement(employee, day, shift) {
    const element = document.createElement('div');
    
    if (shift.isFree) {
        element.className = 'week-shift-compact free';
        element.innerHTML = `
            <div class="week-employee-name">${employee.name}</div>
            <div class="week-shift-time">Día libre</div>
            <div style="font-size: 8px; opacity: 0.7; margin-top: 2px;">👆 Toca para asignar</div>
        `;
    } else {
        const employeeColor = getEmployeeColor(employee.id);
        element.className = `week-shift-compact employee-color`;
        element.style.cssText = `
            border-left: 3px solid ${employeeColor.border};
            background: linear-gradient(45deg, ${employeeColor.background}, #ffffff);
        `;
        
        element.innerHTML = `
            <div class="week-employee-name">${employee.name}</div>
            <div class="week-shift-time">${shift.start?.slice(0,5)} - ${shift.end?.slice(0,5)}</div>
            <div class="week-shift-delete" onclick="removeWeekShift(event, '${employee.id}', '${day.key}', ${JSON.stringify(shift).replace(/"/g, '&quot;')})">
                <i class="fas fa-times"></i>
            </div>
        `;
    }
    
    // Agregar funcionalidad de click para editar
    element.onclick = (e) => {
        e.stopPropagation();
        openShiftModal(employee.id, day.key, employee.name, day.fullName);
    };
    
    return element;
}

// Sistema de colores por empleado en lugar de por tipo de turno
function getEmployeeColor(employeeId) {
    const colors = [
        { border: '#10b981', background: '#d1fae5' }, // Verde esmeralda
        { border: '#3b82f6', background: '#dbeafe' }, // Azul
        { border: '#f59e0b', background: '#fef3c7' }, // Ámbar
        { border: '#ef4444', background: '#fecaca' }, // Rojo
        { border: '#8b5cf6', background: '#ede9fe' }, // Violeta
        { border: '#06b6d4', background: '#cffafe' }, // Cian
        { border: '#f97316', background: '#fed7aa' }, // Naranja
        { border: '#84cc16', background: '#ecfccb' }, // Lima
        { border: '#ec4899', background: '#fce7f3' }, // Rosa
        { border: '#6366f1', background: '#e0e7ff' }  // Índigo
    ];
    
    // Crear un índice estable basado en el ID del empleado
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
    const colorIndex = employeeIndex >= 0 ? employeeIndex % colors.length : 0;
    
    return colors[colorIndex];
}

function getShiftTypeIcon(type) {
    switch(type) {
        case 'morning': return '🌅';
        case 'afternoon': return '🌆';
        case 'refuerzo': return '⚡';
        case 'custom': return '🎯';
        default: return '';
    }
}

function getShiftTypeClass(type) {
    switch(type) {
        case 'morning': return 'morning';
        case 'afternoon': return 'afternoon';
        case 'refuerzo': return 'refuerzo';
        case 'custom': return 'custom';
        default: return 'custom';
    }
}

// Función showAddEmployeeMenu eliminada - ya no necesaria

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

// === FUNCIONES DE GESTIÓN DE VACACIONES ===

function loadVacationState() {
    try {
        const savedVacations = localStorage.getItem('fornverge_vacations');
        if (savedVacations) {
            const vacationArray = JSON.parse(savedVacations);
            employeesOnVacation = new Set(vacationArray);
            // console.log('✅ Estado de vacaciones cargado:', employeesOnVacation);
        }
    } catch (error) {
        console.error('❌ Error cargando estado de vacaciones:', error);
        employeesOnVacation = new Set();
    }
}

function saveVacationState() {
    try {
        const vacationArray = Array.from(employeesOnVacation);
        localStorage.setItem('fornverge_vacations', JSON.stringify(vacationArray));
        console.log('💾 Estado de vacaciones guardado:', vacationArray);
    } catch (error) {
        console.error('❌ Error guardando estado de vacaciones:', error);
    }
}

function openVacationModal() {
    renderVacationList();
    document.getElementById('vacationModal').classList.add('show');
}

function closeVacationModal() {
    document.getElementById('vacationModal').classList.remove('show');
}

function renderVacationList() {
    const container = document.getElementById('employeeVacationList');
    container.innerHTML = '';
    
    employees.forEach(employee => {
        const isOnVacation = employeesOnVacation.has(employee.id);
        
        const item = document.createElement('div');
        item.className = `vacation-employee-item ${isOnVacation ? 'on-vacation' : ''}`;
        
        item.innerHTML = `
            <div class="vacation-employee-info">
                <span class="text-2xl">${isOnVacation ? '🏖️' : '👤'}</span>
                <span class="vacation-employee-name">${employee.name}</span>
                <span class="vacation-status ${isOnVacation ? 'active' : 'inactive'} ml-2">
                    ${isOnVacation ? 'De vacaciones' : 'Disponible'}
                </span>
            </div>
            <button 
                class="vacation-toggle ${isOnVacation ? 'on-vacation' : ''}"
                onclick="toggleEmployeeVacation('${employee.id}')"
            >
                ${isOnVacation ? '🏖️ Quitar vacaciones' : '✈️ Poner de vacaciones'}
            </button>
        `;
        
        container.appendChild(item);
    });
}

function toggleEmployeeVacation(employeeId) {
    if (employeesOnVacation.has(employeeId)) {
        // Quitar de vacaciones
        employeesOnVacation.delete(employeeId);
        // console.log(`✅ ${getEmployeeName(employeeId)} ya no está de vacaciones`);
    } else {
        // Poner de vacaciones
        employeesOnVacation.add(employeeId);
        // console.log(`🏖️ ${getEmployeeName(employeeId)} está ahora de vacaciones`);
    }
    
    // Guardar estado y actualizar interfaz
    saveVacationState();
    renderVacationList();
    renderEmployees(); // Actualizar las vistas de horarios
    
    // Mostrar notificación
    const employee = employees.find(emp => emp.id === employeeId);
    const isNowOnVacation = employeesOnVacation.has(employeeId);
    showVacationNotification(employee.name, isNowOnVacation);
}

function getEmployeeName(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Empleado desconocido';
}

function showVacationNotification(employeeName, isOnVacation) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full opacity-0 transition-all duration-500';
    
    const icon = isOnVacation ? '🏖️' : '👤';
    const action = isOnVacation ? 'puesto de vacaciones' : 'quitado de vacaciones';
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="text-2xl mr-3">${icon}</span>
            <div>
                <div class="font-semibold">${employeeName}</div>
                <div class="text-sm opacity-90">Ha sido ${action}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
    }, 100);
    
    // Animar salida después de 3 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// === FUNCIONES DISPONIBLES EN CONSOLA PARA DEBUGGING ===
// Usar en consola del navegador:
// window.runDiagnostic() - Para diagnosticar problemas generales
// window.cleanDuplicates() - Para limpiar duplicados generales
// window.debugGaby() - Para diagnosticar problemas específicos de Gaby
// window.fixGaby() - Para limpiar completamente los horarios de Gaby
// window.detectInconsistentData() - Para detectar datos inconsistentes
// window.cleanInconsistentData() - Para limpiar datos inconsistentes automáticamente
// window.forceUpdateWeekView() - Para forzar actualización de vista semanal

window.runDiagnostic = runDiagnostic;
window.cleanDuplicates = cleanDuplicates;
window.debugGaby = debugGaby;
window.fixGaby = fixGaby;
window.detectInconsistentData = detectInconsistentData;
window.cleanInconsistentData = cleanInconsistentData;
window.forceUpdateWeekView = forceUpdateWeekView;

// === FUNCIÓN DE DIAGNÓSTICO PARA DETECTAR PROBLEMAS ===

async function runDiagnostic() {
    console.log('🔍 === DIAGNÓSTICO DEL SISTEMA ===');
    
    try {
        // 1. Verificar duplicados en BD
        const { data: allSchedules, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('week_start', currentWeekStart);
            
        if (error) {
            console.error('❌ Error obteniendo datos:', error);
            return;
        }
        
        // console.log(`📊 Total registros en BD para semana ${currentWeekStart}: ${allSchedules.length}`);
        
        // Agrupar por empleado y día
        const byEmployeeDay = {};
        allSchedules.forEach(schedule => {
            const key = `${schedule.employee_id}_${schedule.day_of_week}`;
            if (!byEmployeeDay[key]) byEmployeeDay[key] = [];
            byEmployeeDay[key].push(schedule);
        });
        
        // Verificar duplicados
        let duplicatesFound = 0;
        Object.keys(byEmployeeDay).forEach(key => {
            const records = byEmployeeDay[key];
            if (records.length > 1) {
                duplicatesFound++;
                const [empId, day] = key.split('_');
                const empName = employees.find(e => e.id === empId)?.name || 'Desconocido';
                
                // console.log(`⚠️  DUPLICADO: ${empName} - ${day} (${records.length} registros)`);
                records.forEach((r, i) => {
                    console.log(`   [${i+1}] ${r.start_time || 'libre'}-${r.end_time || 'libre'} (libre: ${r.is_free_day}, seq: ${r.shift_sequence})`);
                });
            }
        });
        
        if (duplicatesFound === 0) {
            // console.log('✅ No se encontraron duplicados en la BD');
        } else {
            console.log(`🚨 Se encontraron ${duplicatesFound} casos de duplicados`);
        }
        
        // 2. Verificar consistencia entre BD y scheduleData
        // console.log('\n🔄 Verificando consistencia BD vs ScheduleData...');
        let inconsistencies = 0;
        
        employees.forEach(emp => {
            DAYS.forEach(day => {
                const memoryShifts = scheduleData[emp.id][day.key] || [];
                const dbShifts = allSchedules.filter(s => 
                    s.employee_id === emp.id && s.day_of_week === day.key
                );
                
                if (memoryShifts.length !== dbShifts.length) {
                    inconsistencies++;
                    console.log(`⚠️  INCONSISTENCIA: ${emp.name} - ${day.name}`);
                    console.log(`   Memoria: ${memoryShifts.length} turnos`);
                    // console.log(`   BD: ${dbShifts.length} turnos`);
                }
            });
        });
        
        if (inconsistencies === 0) {
            // console.log('✅ BD y memoria están sincronizados');
        } else {
            console.log(`🚨 Se encontraron ${inconsistencies} inconsistencias`);
        }
        
        console.log('🔍 === FIN DIAGNÓSTICO ===\n');
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
    }
}

// === FUNCIÓN PARA LIMPIAR DUPLICADOS EN BD ===

async function cleanDuplicates() {
    console.log('🧹 === LIMPIEZA DE DUPLICADOS ===');
    
    try {
        const { data: allSchedules, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('week_start', currentWeekStart)
            .order('created_at');
            
        if (error) {
            console.error('❌ Error obteniendo datos:', error);
            return;
        }
        
        // Agrupar por empleado y día
        const byEmployeeDay = {};
        allSchedules.forEach(schedule => {
            const key = `${schedule.employee_id}_${schedule.day_of_week}`;
            if (!byEmployeeDay[key]) byEmployeeDay[key] = [];
            byEmployeeDay[key].push(schedule);
        });
        
        let duplicatesRemoved = 0;
        
        // Procesar cada grupo
        for (const key of Object.keys(byEmployeeDay)) {
            const records = byEmployeeDay[key];
            
            if (records.length > 1) {
                const [empId, day] = key.split('_');
                const empName = employees.find(e => e.id === empId)?.name || 'Desconocido';
                
                // console.log(`🔧 Limpiando duplicados: ${empName} - ${day} (${records.length} registros)`);
                
                // Mantener solo el más reciente (último en el array ordenado por created_at)
                const toKeep = records[records.length - 1];
                const toDelete = records.slice(0, -1);
                
                console.log(`✅ Manteniendo registro: ${toKeep.start_time || 'libre'}-${toKeep.end_time || 'libre'} (ID: ${toKeep.id.substring(0,8)})`);
                
                // Eliminar los duplicados
                for (const record of toDelete) {
                    console.log(`🗑️  Eliminando: ${record.start_time || 'libre'}-${record.end_time || 'libre'} (ID: ${record.id.substring(0,8)})`);
                    
                    const { error: deleteError } = await supabase
                        .from('schedules')
                        .delete()
                        .eq('id', record.id);
                        
                    if (deleteError) {
                        console.error('❌ Error eliminando:', deleteError);
                    } else {
                        duplicatesRemoved++;
                    }
                }
            }
        }
        
        console.log(`✅ Limpieza completada. ${duplicatesRemoved} duplicados eliminados.`);
        
        // Recargar datos después de la limpieza
        if (duplicatesRemoved > 0) {
            // console.log('🔄 Recargando datos...');
            await loadCurrentSchedules();
            renderEmployees();
            renderWeekFullView();
        }
        
        console.log('🧹 === FIN LIMPIEZA ===\n');
        
    } catch (error) {
        console.error('❌ Error en limpieza:', error);
    }
}

// === FUNCIÓN ESPECÍFICA PARA DIAGNOSTICAR PROBLEMAS CON GABY ===

async function debugGaby() {
    // console.log('🔍 === DIAGNÓSTICO ESPECÍFICO DE GABY ===');
    
    try {
        // 1. Encontrar a Gaby
        const gabyEmployee = employees.find(emp => emp.name === 'GABY');
        if (!gabyEmployee) {
            // console.log('❌ Gaby no encontrada en employees');
            return;
        }
        
        // console.log('✅ Gaby encontrada:', gabyEmployee);
        
        // 2. Verificar datos en BD
        const { data: gabySchedules, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('employee_id', gabyEmployee.id)
            .eq('week_start', currentWeekStart)
            .order('created_at');
            
        if (error) {
            console.error('❌ Error obteniendo horarios de Gaby:', error);
            return;
        }
        
        // console.log(`📊 Gaby en BD (${currentWeekStart}): ${gabySchedules.length} registros`);
        gabySchedules.forEach((s, i) => {
            console.log(`  [${i+1}] ${s.day_of_week}: ${s.start_time || 'NULL'}-${s.end_time || 'NULL'} (libre: ${s.is_free_day}, seq: ${s.shift_sequence}, created: ${s.created_at})`);
        });
        
        // 3. Verificar datos en memoria (scheduleData)
        // console.log('🧠 Gaby en memoria (scheduleData):');
        DAYS.forEach(day => {
            const shifts = scheduleData[gabyEmployee.id]?.[day.key] || [];
            console.log(`  ${day.key}: ${shifts.length} turnos`);
            shifts.forEach((s, i) => {
                console.log(`    [${i+1}] ${s.isFree ? 'DÍA LIBRE' : `${s.start}-${s.end} (${s.hours}h, type: ${s.type})`}`);
            });
        });
        
        // 4. Verificar si está de vacaciones
        const isOnVacation = employeesOnVacation.has(gabyEmployee.id);
        console.log(`🏖️ ¿Está de vacaciones?: ${isOnVacation}`);
        
        // 5. Vista siempre es de semana
        console.log(`👁️ Vista activa: SEMANA (única vista disponible)`);
        
        // 6. Buscar inconsistencias
        console.log('🔍 Buscando inconsistencias...');
        let inconsistencias = [];
        
        DAYS.forEach(day => {
            const memoryShifts = scheduleData[gabyEmployee.id]?.[day.key] || [];
            const dbShifts = gabySchedules.filter(s => s.day_of_week === day.key);
            
            if (memoryShifts.length !== dbShifts.length) {
                inconsistencias.push(`${day.key}: BD(${dbShifts.length}) vs Memoria(${memoryShifts.length})`);
            }
            
            // Verificar si hay turnos normales mezclados con días libres
            if (memoryShifts.length > 1) {
                const hasFree = memoryShifts.some(s => s.isFree);
                const hasWork = memoryShifts.some(s => !s.isFree);
                if (hasFree && hasWork) {
                    inconsistencias.push(`${day.key}: MEZCLA de día libre Y turno de trabajo`);
                }
            }
        });
        
        if (inconsistencias.length > 0) {
            console.log('🚨 INCONSISTENCIAS ENCONTRADAS:');
            inconsistencias.forEach(inc => console.log(`  - ${inc}`));
        } else {
            console.log('✅ No se encontraron inconsistencias obvias');
        }
        
        // console.log('🔍 === FIN DIAGNÓSTICO DE GABY ===\n');
        
    } catch (error) {
        console.error('❌ Error en diagnóstico de Gaby:', error);
    }
}

// === FUNCIÓN PARA LIMPIAR PROBLEMAS ESPECÍFICOS DE GABY ===

async function fixGaby() {
    // console.log('🔧 === ARREGLANDO PROBLEMAS DE GABY ===');
    
    try {
        // 1. Encontrar a Gaby
        const gabyEmployee = employees.find(emp => emp.name === 'GABY');
        if (!gabyEmployee) {
            // console.log('❌ Gaby no encontrada');
            return;
        }
        
        // console.log('✅ Limpiando horarios de Gaby...');
        
        // 2. Eliminar TODOS los registros de Gaby para esta semana
        const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('employee_id', gabyEmployee.id)
            .eq('week_start', currentWeekStart);
            
        if (deleteError) {
            console.error('❌ Error eliminando registros:', deleteError);
            return;
        }
        
        // console.log('✅ Registros de BD eliminados');
        
        // 3. Limpiar datos en memoria
        DAYS.forEach(day => {
            scheduleData[gabyEmployee.id][day.key] = [];
        });
        
        // console.log('✅ Datos en memoria limpiados');
        
        // 4. Recargar desde BD (debería estar vacío)
        await loadCurrentSchedules();
        
        // 5. Actualizar vistas
        renderEmployees();
        renderWeekFullView();
        
        // console.log('🔧 === GABY LIMPIADA - Ahora puedes agregar horarios nuevos ===\n');
        
    } catch (error) {
        console.error('❌ Error limpiando Gaby:', error);
    }
}

// === FUNCIÓN PARA DETECTAR DATOS INCONSISTENTES ===

function detectInconsistentData() {
    // console.log('🔍 === DETECTANDO DATOS INCONSISTENTES ===');
    
    let inconsistencies = [];
    
    employees.forEach(employee => {
        DAYS.forEach(day => {
            const shifts = scheduleData[employee.id][day.key] || [];
            
            if (shifts.length > 1) {
                const workShifts = shifts.filter(shift => !shift.isFree);
                const freeShifts = shifts.filter(shift => shift.isFree);
                
                if (workShifts.length > 0 && freeShifts.length > 0) {
                    inconsistencies.push({
                        employee: employee.name,
                        day: day.key,
                        workShifts: workShifts.length,
                        freeShifts: freeShifts.length,
                        details: {
                            work: workShifts.map(s => `${s.start}-${s.end}`),
                            free: freeShifts.map(s => 'Día libre')
                        }
                    });
                }
            }
        });
    });
    
    if (inconsistencies.length > 0) {
        console.log(`🚨 Se encontraron ${inconsistencies.length} inconsistencias:`);
        inconsistencies.forEach((inc, i) => {
            // console.log(`${i+1}. ${inc.employee} - ${inc.day}:`);
            console.log(`   - Turnos de trabajo: ${inc.details.work.join(', ')}`);
            console.log(`   - Días libres: ${inc.details.free.join(', ')}`);
        });
        
        console.log('\n💡 Usa window.cleanInconsistentData() para limpiar automáticamente');
    } else {
        // console.log('✅ No se encontraron datos inconsistentes');
    }
    
    console.log('🔍 === FIN DETECCIÓN ===\n');
    
    return inconsistencies;
}

// === FUNCIÓN PARA LIMPIAR DATOS INCONSISTENTES ===

async function cleanInconsistentData() {
    // console.log('🧹 === LIMPIANDO DATOS INCONSISTENTES ===');
    
    const inconsistencies = detectInconsistentData();
    
    if (inconsistencies.length === 0) {
        console.log('✅ No hay nada que limpiar');
        return;
    }
    
    let cleaned = 0;
    
    for (const inc of inconsistencies) {
        // console.log(`🔧 Limpiando ${inc.employee} - ${inc.day}...`);
        
        try {
            const employee = employees.find(emp => emp.name === inc.employee);
            if (!employee) continue;
            
            // Eliminar todos los registros de este empleado en este día
            const { error: deleteError } = await supabase
                .from('schedules')
                .delete()
                .eq('employee_id', employee.id)
                .eq('week_start', currentWeekStart)
                .eq('day_of_week', inc.day);
                
            if (deleteError) {
                console.error(`❌ Error eliminando ${inc.employee} - ${inc.day}:`, deleteError);
                continue;
            }
            
            // Mantener solo los turnos de trabajo en memoria
            const shifts = scheduleData[employee.id][inc.day] || [];
            const workShifts = shifts.filter(shift => !shift.isFree);
            scheduleData[employee.id][inc.day] = workShifts;
            
            // Re-insertar solo los turnos de trabajo en BD
            if (workShifts.length > 0) {
                const newSchedules = workShifts.map((shift, index) => ({
                    employee_id: employee.id,
                    week_start: currentWeekStart,
                    day_of_week: inc.day,
                    start_time: shift.start,
                    end_time: shift.end,
                    hours: shift.hours || 0,
                    is_free_day: false,
                    shift_sequence: index + 1,
                    shift_description: shift.description || getShiftDescription(shift.type),
                    colleagues: []
                }));
                
                const { error: insertError } = await supabase
                    .from('schedules')
                    .insert(newSchedules);
                    
                if (insertError) {
                    console.error(`❌ Error insertando ${inc.employee} - ${inc.day}:`, insertError);
                    continue;
                }
            }
            
            cleaned++;
            // console.log(`✅ ${inc.employee} - ${inc.day} limpiado`);
            
        } catch (error) {
            console.error(`❌ Error procesando ${inc.employee} - ${inc.day}:`, error);
        }
    }
    
    console.log(`✅ Limpieza completada. ${cleaned} casos limpiados.`);
    
            // Recargar datos y actualizar vista
        if (cleaned > 0) {
            // console.log('🔄 Recargando datos...');
            await loadCurrentSchedules();
            renderEmployees();
            renderWeekFullView();
        }
    
    console.log('🧹 === FIN LIMPIEZA ===\n');
}

// === FUNCIÓN PARA FORZAR ACTUALIZACIÓN DE VISTA SEMANAL ===

function forceUpdateWeekView() {
    renderWeekFullView();
}

// ✅ FUNCIÓN PARA FORZAR REDIBUJADO DEL GRID
function forceGridReflow() {
    const container = document.getElementById('weekGridContainer');
    if (container && container.children.length > 0) {
        console.log('🔄 Forzando redibujado del grid por cambio de tamaño');
        renderWeekFullView();
    }
}

// ✅ FUNCIÓN DEBOUNCE PARA EVITAR MÚLTIPLES LLAMADAS
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== NUEVAS FUNCIONES PARA CONTADOR DE HORAS TEÓRICAS =====

/**
 * Calcula el total de horas semanales teóricas de todos los empleados activos
 * @returns {number} Total de horas semanales
 */
function calcularHorasSemanalesTeoricas() {
    const activeEmployees = getActiveEmployees();
    let totalHoras = 0;
    
    activeEmployees.forEach(employee => {
        const horasEmpleado = getTotalHours(employee.id);
        totalHoras += horasEmpleado;
    });
    
    return totalHoras;
}

/**
 * Obtiene el desglose de horas por empleado para mostrar en la interfaz
 * @returns {Array} Array con objetos {empleado, horas, color}
 */
function obtenerDesgloseHorasEmpleados() {
    const activeEmployees = getActiveEmployees();
    const desglose = [];
    
    activeEmployees.forEach(employee => {
        const horasEmpleado = getTotalHours(employee.id);
        const color = getEmployeeColor(employee.id);
        
        desglose.push({
            id: employee.id,
            nombre: employee.name,
            horas: horasEmpleado,
            color: color
        });
    });
    
    // Ordenar por horas descendente
    return desglose.sort((a, b) => b.horas - a.horas);
}

/**
 * Actualiza la interfaz del contador de horas teóricas
 */
function actualizarContadorHorasTeoricas() {
    console.log('🧮 Actualizando contador de horas teóricas...');
    
    const totalHoras = calcularHorasSemanalesTeoricas();
    const desglose = obtenerDesgloseHorasEmpleados();
    const LIMITE_HORAS = 205;
    
    // Actualizar el total de horas
    const totalElement = document.getElementById('totalHorasSemanales');
    if (totalElement) {
        totalElement.textContent = `${totalHoras}h`;
        
        // Cambiar color según proximidad al límite
        if (totalHoras > LIMITE_HORAS) {
            totalElement.className = 'text-2xl font-bold text-red-600';
        } else if (totalHoras > LIMITE_HORAS * 0.9) { // 90% del límite
            totalElement.className = 'text-2xl font-bold text-orange-600';
        } else {
            totalElement.className = 'text-2xl font-bold text-blue-800';
        }
    }
    
    // Mostrar/ocultar alarma de sobrecarga
    const alarmaElement = document.getElementById('alarmaSobrecarga');
    if (alarmaElement) {
        if (totalHoras > LIMITE_HORAS) {
            alarmaElement.classList.remove('hidden');
        } else {
            alarmaElement.classList.add('hidden');
        }
    }
    
    // Actualizar desglose por empleado
    const listaElement = document.getElementById('listaHorasEmpleados');
    if (listaElement) {
        listaElement.innerHTML = '';
        
        desglose.forEach(emp => {
            const empDiv = document.createElement('div');
            empDiv.className = 'bg-white p-2 rounded border text-center text-xs';
            empDiv.style.borderColor = emp.color.border;
            empDiv.style.backgroundColor = emp.color.background;
            
            empDiv.innerHTML = `
                <div class="font-semibold text-gray-800 truncate" title="${emp.nombre}">
                    ${emp.nombre}
                </div>
                <div class="text-lg font-bold" style="color: ${emp.color.border};">
                    ${emp.horas}h
                </div>
            `;
            
            listaElement.appendChild(empDiv);
        });
        
        // Si no hay empleados activos
        if (desglose.length === 0) {
            listaElement.innerHTML = '<div class="col-span-full text-center text-gray-500 py-2">No hay empleados activos</div>';
        }
    }
    
    console.log(`📊 Contador actualizado: ${totalHoras}h total (${desglose.length} empleados)`);
}

/**
 * Función auxiliar para ocultar/mostrar el contador según la configuración
 */
function toggleContadorHorasTeoricas(visible = true) {
    const contadorElement = document.getElementById('horasTeoricas');
    if (contadorElement) {
        if (visible) {
            contadorElement.style.display = 'block';
        } else {
            contadorElement.style.display = 'none';
        }
    }
}


// Funciones auxiliares
function calcularHorasEntreTiempos(inicio, fin) {
    const [horaIni, minIni] = inicio.split(':').map(Number);
    const [horaFin, minFin] = fin.split(':').map(Number);
    const minutosIni = horaIni * 60 + minIni;
    const minutosFin = horaFin * 60 + minFin;
    return Math.round((minutosFin - minutosIni) / 60 * 10) / 10;
}

function detectarTipoTurno(inicio, fin) {
    const hora = parseInt(inicio.split(':')[0]);
    if (hora < 12) return 'morning';
    if (hora < 18) return 'afternoon'; 
    return 'evening';
}