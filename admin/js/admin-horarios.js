/* Forn Verge - Admin Horarios JavaScript */

// Configuración
const SUPABASE_URL = 'https://csxgkxjeifakwslamglc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg';

// Variables dinámicas para semanas
let currentWeekStart = '2025-02-09'; // Semana inicial
const availableWeeks = [
    '2025-02-09', // Semana 1: 9-15 Feb
    '2025-02-16', // Semana 2: 16-22 Feb  
    '2025-02-23', // Semana 3: 23-01 Mar
    '2025-03-02', // Semana 4: 2-8 Mar
    '2025-03-09', // Semana 5: 9-15 Mar
    '2025-03-16', // Semana 6: 16-22 Mar
    '2025-03-23', // Semana 7: 23-29 Mar
    '2025-03-30'  // Semana 8: 30 Mar-5 Abr
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

// Configuración de autenticación
const ADMIN_PASSWORD = 'fornverge2025'; // Contraseña del panel
let isAuthenticated = false;

async function initApp() {
    console.log('🚀 Iniciando Gestión de Horarios...');
    
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
    
    await loadEmployees();
    await loadCurrentSchedules();
    
    console.log('🔍 ScheduleData después de cargar:', scheduleData);
    
    renderEmployees();
    setupEventListeners();
    
    hideLoading();
    updateStatus('Listo ✨');
}

function updateStatus(status) {
    document.getElementById('status').textContent = status;
}

function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('mainView').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
}

function setupEventListeners() {
    document.getElementById('saveAll').addEventListener('click', saveAllSchedules);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    document.getElementById('addShift').addEventListener('click', addShiftFromModal);
    
    // Navegación de semanas
    document.getElementById('prevWeek').addEventListener('click', goToPreviousWeek);
    document.getElementById('nextWeek').addEventListener('click', goToNextWeek);
    document.getElementById('weekSelector').addEventListener('change', onWeekSelectChange);
    
    // Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
    
    document.getElementById('shiftModal').addEventListener('click', (e) => {
        if (e.target.id === 'shiftModal') closeModal();
    });
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
        console.log('✅ Empleados cargados:', employees.length);
        
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

        console.log('📊 Datos recibidos:', data?.length || 0, 'registros');
        console.log('🔍 Muestra de datos:', data?.slice(0, 2));

        data.forEach(schedule => {
            const empId = schedule.employee_id;
            const day = schedule.day_of_week;
            
            if (scheduleData[empId] && scheduleData[empId][day]) {
                if (schedule.is_free_day) {
                    scheduleData[empId][day].push({
                        id: schedule.id,
                        type: 'free',
                        start: null,
                        end: null,
                        hours: 0,
                        isFree: true,
                        description: 'Día libre'
                    });
                } else {
                    const type = getShiftType(schedule.start_time, schedule.end_time);
                    scheduleData[empId][day].push({
                        id: schedule.id,
                        type: type,
                        start: schedule.start_time,
                        end: schedule.end_time,
                        hours: schedule.hours || 0,
                        isFree: false,
                        description: schedule.shift_description || getShiftDescription(type)
                    });
                }
            }
        });

        console.log('✅ Horarios cargados y procesados');

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
    let totalShifts = 0;
    let totalHours = 0;
    let freeDays = 0;

    employees.forEach(emp => {
        DAYS.forEach(day => {
            const shifts = scheduleData[emp.id][day.key] || [];
            shifts.forEach(shift => {
                if (shift.isFree) {
                    freeDays++;
                } else {
                    totalShifts++;
                    totalHours += shift.hours || 0;
                }
            });
        });
    });

    console.log('📊 Stats calculadas:', { 
        totalShifts, 
        totalHours, 
        freeDays, 
        employees: employees.length,
        scheduleData: Object.keys(scheduleData).length 
    });

    // Verificar que los elementos existen antes de actualizar
    const elements = {
        totalEmployees: document.getElementById('totalEmployees'),
        totalShifts: document.getElementById('totalShifts'),
        totalHours: document.getElementById('totalHours'),
        freeDays: document.getElementById('freeDays')
    };

    console.log('📊 Elementos DOM encontrados:', Object.keys(elements).filter(key => elements[key]));

    if (elements.totalEmployees) elements.totalEmployees.textContent = employees.length;
    if (elements.totalShifts) elements.totalShifts.textContent = totalShifts;
    if (elements.totalHours) elements.totalHours.textContent = totalHours;
    if (elements.freeDays) elements.freeDays.textContent = freeDays;
}

function renderEmployees() {
    renderDaysView();
    updateStats();
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

function renderDayColumn(employee, day) {
    const shifts = scheduleData[employee.id][day.key] || [];
    const totalHours = shifts.reduce((sum, shift) => sum + (shift.hours || 0), 0);
    
    return `
        <div class="day-column">
            <h4 class="text-sm font-bold text-gray-700 mb-2 text-center">${day.name}</h4>
            <p class="text-xs text-center mb-3 ${totalHours > 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'}">${totalHours}h</p>
            
            <div class="shifts-container mb-3">
                ${shifts.map((shift, index) => renderShiftEntry(employee.id, day.key, shift, index)).join('')}
                ${shifts.length === 0 ? '<p class="text-gray-400 text-xs text-center py-6">Sin turnos</p>' : ''}
            </div>
            
            <button 
                class="add-shift-btn"
                onclick="openShiftModal('${employee.id}', '${day.key}', '${employee.name}', '${day.fullName}')"
            >
                <i class="fas fa-plus mr-1"></i>Agregar
            </button>
        </div>
    `;
}

function renderShiftEntry(empId, day, shift, index) {
    if (shift.isFree) {
        return `
            <div class="shift-entry shift-free">
                <div class="font-medium text-sm">🆓 Libre</div>
                <div class="text-xs text-gray-500">Descanso</div>
                <div class="delete-btn" onclick="removeShift('${empId}', '${day}', ${index})">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        `;
    } else {
        const typeClass = `shift-${shift.type}`;
        const icon = shift.type === 'morning' ? '🌅' : 
                   shift.type === 'afternoon' ? '🌆' : 
                   shift.type === 'refuerzo' ? '🔧' : '🎯';
        
        return `
            <div class="shift-entry ${typeClass}">
                <div class="font-semibold text-sm">${icon} ${shift.start?.slice(0,5)} - ${shift.end?.slice(0,5)}</div>
                <div class="text-xs opacity-80">${shift.hours}h • ${shift.description || shift.type}</div>
                <div class="delete-btn" onclick="removeShift('${empId}', '${day}', ${index})">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        `;
    }
}

function openShiftModal(empId, day, empName, dayName) {
    currentModalEmployee = empId;
    currentModalDay = day;
    
    // Resetear a modo normal
    document.getElementById('singleShiftFields').classList.remove('hidden');
    document.getElementById('splitShiftFields').classList.add('hidden');
    document.getElementById('shiftTypeSelector').classList.remove('hidden');
    document.getElementById('addShift').innerHTML = '<i class="fas fa-plus mr-2"></i>Agregar Turno';
    
    // Resetear campos a valores por defecto
    document.getElementById('startTime').value = '07:00';
    document.getElementById('endTime').value = '14:00';
    document.getElementById('shiftType').value = 'morning';
    
    document.getElementById('modalEmployeeDay').textContent = `${empName} - ${dayName}`;
    document.getElementById('shiftModal').classList.add('show');
}

function closeModal() {
    document.getElementById('shiftModal').classList.remove('show');
    currentModalEmployee = null;
    currentModalDay = null;
}

function setTemplate(start, end, type) {
    document.getElementById('startTime').value = start;
    document.getElementById('endTime').value = end;
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
    
    renderDaysView();
    updateStats();
    
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
    
    renderDaysView();
    updateStats();
    
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
    
    // Re-renderizar la vista
    renderDaysView();
    updateStats();
    
    // Eliminar específicamente de Supabase (más seguro)
    console.log('💾 Eliminando turno específico de Supabase...');
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
            console.log('🔄 Reconstruyendo horarios solo para:', empId, day);
            await rebuildDaySchedule(empId, day);
        }
        
        updateStatus('Turno eliminado ✅');
        
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
        console.log('🗑️ Eliminando horarios existentes para semana:', currentWeekStart);
        
        // CORRECCIÓN CRÍTICA: Aplicar filtro ANTES del delete
        const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('week_start', currentWeekStart);

        if (deleteError) {
            console.error('❌ Error eliminando:', deleteError);
            throw deleteError;
        }

        console.log('✅ Horarios antiguos eliminados SOLO para semana', currentWeekStart);

        const newSchedules = [];
        let sequenceCounter = {};
        
        console.log('🔄 Procesando horarios para guardado...');
        console.log('👥 Empleados a procesar:', employees.length);
        console.log('📊 ScheduleData actual:', scheduleData);

        employees.forEach(employee => {
            DAYS.forEach(day => {
                const shifts = scheduleData[employee.id][day.key] || [];
                const dayKey = `${employee.id}_${day.key}`;
                sequenceCounter[dayKey] = 1;
                
                console.log(`📝 ${employee.name} - ${day.name}: ${shifts.length} turnos`, shifts);
                
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

        console.log('💾 Intentando guardar', newSchedules.length, 'registros');
        console.log('📄 Muestra de registros a guardar:', newSchedules.slice(0, 3));
        console.log('✅ Usando estructura COMPLETA de BD (con shift_sequence y shift_description)');

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

        console.log('✅ Guardados', newSchedules.length, 'registros exitosamente');
        console.log('✅ Respuesta de insert:', insertData);
        
        if (!isAutoSave) {
            showSaveSuccess();
        }
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

function renderDaysView() {
    const container = document.getElementById('dailyScheduleContainer');
    container.innerHTML = '';
    
    DAYS.forEach(day => {
        const dayCard = createDayScheduleCard(day);
        container.appendChild(dayCard);
    });
}

function createDayScheduleCard(day) {
    const card = document.createElement('div');
    card.className = 'day-schedule-card p-6';
    
    // Obtener empleados que trabajan este día y los que están libres
    const workingEmployees = [];
    const freeEmployees = [];
    
    employees.forEach(employee => {
        const shifts = scheduleData[employee.id][day.key] || [];
        
        if (shifts.length === 0 || shifts.some(shift => shift.isFree)) {
            freeEmployees.push(employee);
        } else {
            workingEmployees.push({
                ...employee,
                shifts: shifts
            });
        }
    });
    
    // Ordenar por hora de inicio del primer turno
    workingEmployees.sort((a, b) => {
        const aFirstShift = a.shifts[0];
        const bFirstShift = b.shifts[0];
        if (!aFirstShift.start || !bFirstShift.start) return 0;
        return aFirstShift.start.localeCompare(bFirstShift.start);
    });
    
    const totalHoursDay = workingEmployees.reduce((total, emp) => {
        return total + emp.shifts.reduce((empTotal, shift) => empTotal + (shift.hours || 0), 0);
    }, 0);
    
    card.innerHTML = `
        <!-- Header del día -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-3">
                <div class="text-4xl">${getDayEmoji(day.key)}</div>
                <div>
                    <h3 class="text-2xl font-bold text-gray-800">${day.name}</h3>
                    <div class="text-sm text-gray-500">${getDayDate(day.key)}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-2xl font-bold text-green-600">${workingEmployees.length}</div>
                <div class="text-sm text-gray-500">trabajando</div>
                <div class="text-lg font-bold text-blue-600">${totalHoursDay}h total</div>
            </div>
        </div>
        
        <!-- Empleados trabajando -->
        ${workingEmployees.length > 0 ? `
            <div class="mb-6">
                <h4 class="font-semibold text-gray-700 mb-3">👩‍💼 Trabajando (${workingEmployees.length})</h4>
                <div class="space-y-3">
                    ${workingEmployees.map(emp => {
                        return createEmployeeShiftDisplayWithActions(emp, day);
                    }).join('')}
                </div>
            </div>
        ` : ''}
        
        <!-- Empleados libres con botón para agregar turno -->
        ${freeEmployees.length > 0 ? `
            <div class="mb-6">
                <h4 class="font-semibold text-gray-500 mb-3">😴 Libres (${freeEmployees.length})</h4>
                <div class="grid grid-cols-1 gap-2">
                    ${freeEmployees.map(emp => `
                        <div class="day-card day-free flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <span class="text-sm">👤</span>
                                <span class="text-sm font-medium">${emp.name}</span>
                            </div>
                            <button 
                                onclick="openShiftModal('${emp.id}', '${day.key}', '${emp.name}', '${day.fullName}')"
                                class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-full transition-all hover:scale-105"
                            >
                                <i class="fas fa-plus mr-1"></i>Agregar
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        <!-- Botón para agregar empleado a cualquier turno -->
        <div class="border-t pt-4">
            <div class="flex flex-wrap gap-2">
                ${employees.map(emp => `
                    <button 
                        onclick="openShiftModal('${emp.id}', '${day.key}', '${emp.name}', '${day.fullName}')"
                        class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-all border border-blue-200 hover:border-blue-300"
                    >
                        <i class="fas fa-plus mr-1"></i>${emp.name}
                    </button>
                `).join('')}
            </div>
            <p class="text-xs text-gray-500 mt-2">💡 Haz clic en cualquier empleado para gestionar sus horarios de ${day.name}</p>
        </div>
    `;
    
    return card;
}

function createEmployeeShiftDisplayWithActions(emp, day) {
    const shifts = emp.shifts;
    const isMultipleShifts = shifts.length > 1;
    
    if (isMultipleShifts) {
        // Horario partido: mostrar todos los turnos con acciones
        const totalHours = shifts.reduce((total, shift) => total + (shift.hours || 0), 0);
        const timeDisplay = shifts
            .map(shift => `${shift.start?.slice(0,5)}-${shift.end?.slice(0,5)}`)
            .join(' + ');
            
        return `
            <div class="day-card day-special">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl">🔄</span>
                        <div>
                            <div class="font-semibold">${emp.name}</div>
                            <div class="text-xs text-red-600 font-medium">⚡ ${shifts.length} turnos</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-sm">${timeDisplay}</div>
                        <div class="text-xs opacity-80">${totalHours}h total</div>
                    </div>
                </div>
                <div class="flex justify-end space-x-1 mt-3">
                    <button 
                        onclick="openShiftModal('${emp.id}', '${day.key}', '${emp.name}', '${day.fullName}')"
                        class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-all"
                    >
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                    ${shifts.map((shift, index) => `
                        <button 
                            onclick="removeShift('${emp.id}', '${day.key}', ${index})"
                            class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-all"
                        >
                            <i class="fas fa-times"></i>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        // Un solo turno con acciones
        const shift = shifts[0];
        const startTime = shift.start?.slice(0,5) || '';
        const endTime = shift.end?.slice(0,5) || '';
        
        const isSpecialTime = startTime !== '07:00' && startTime !== '14:00';
        const cardClass = isSpecialTime ? 'day-special' : 
                         startTime === '07:00' ? 'day-morning' : 'day-afternoon';
        
        const icon = isSpecialTime ? '⚡' : 
                    startTime === '07:00' ? '🌅' : '🌆';
        
        return `
            <div class="day-card ${cardClass}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl">${icon}</span>
                        <div>
                            <div class="font-semibold">${emp.name}</div>
                            <div class="text-xs opacity-75">${shift.description || shift.type}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold">${startTime} - ${endTime}</div>
                        <div class="text-xs opacity-80">${shift.hours}h</div>
                    </div>
                </div>
                <div class="flex justify-end space-x-1 mt-3">
                    <button 
                        onclick="openShiftModal('${emp.id}', '${day.key}', '${emp.name}', '${day.fullName}')"
                        class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-all"
                    >
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                    <button 
                        onclick="removeShift('${emp.id}', '${day.key}', 0)"
                        class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-all"
                    >
                        <i class="fas fa-times"></i> Quitar
                    </button>
                </div>
            </div>
        `;
    }
}

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
    const weekDisplay = document.getElementById('weekDisplay');
    const currentWeekText = document.getElementById('currentWeekText');
    const weekLabel = getWeekLabel(currentWeekStart);
    
    weekDisplay.textContent = `Forn Verge - Semana ${weekLabel}`;
    
    // Actualizar también el indicador principal
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
    
    // Actualizar interfaz
    updateWeekDisplay();
    setupWeekSelector(); // Actualiza el selector
    renderEmployees();
    
    hideLoading();
    updateStatus(`Semana ${getWeekLabel(currentWeekStart)} ✨`);
    
    console.log(`✅ Cambio completado a semana: ${getWeekLabel(currentWeekStart)}`);
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp); 