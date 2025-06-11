/* Forn Verge - Admin Horarios JavaScript */

// Configuración
const SUPABASE_URL = 'https://csxgkxjeifakwslamglc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg';
const WEEK_START = '2025-02-09';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DAYS = [
    { key: 'lunes', name: 'Lun 9', fullName: 'Lunes 9 Febrero' },
    { key: 'martes', name: 'Mar 10', fullName: 'Martes 10 Febrero' },
    { key: 'miercoles', name: 'Mié 11', fullName: 'Miércoles 11 Febrero' },
    { key: 'jueves', name: 'Jue 12', fullName: 'Jueves 12 Febrero' },
    { key: 'viernes', name: 'Vie 13', fullName: 'Viernes 13 Febrero' },
    { key: 'sabado', name: 'Sáb 14', fullName: 'Sábado 14 Febrero' },
    { key: 'domingo', name: 'Dom 15', fullName: 'Domingo 15 Febrero' }
];

let employees = [];
let scheduleData = {}; 
let currentModalEmployee = null;
let currentModalDay = null;

async function initApp() {
    console.log('🚀 Iniciando Gestión de Horarios...');
    updateStatus('Cargando...');
    showLoading();
    
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
    document.getElementById('employeesGrid').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('employeesGrid').classList.remove('hidden');
}

function setupEventListeners() {
    document.getElementById('saveAll').addEventListener('click', saveAllSchedules);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    document.getElementById('addShift').addEventListener('click', addShiftFromModal);
    
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
            .eq('week_start', WEEK_START)
            .order('start_time', { nullsFirst: true });

        // Si hay error, intentar sin ordenar
        if (error) {
            console.log('🔄 Reintentando sin ordenar...');
            const result = await supabase
                .from('schedules')
                .select('*')
                .eq('week_start', WEEK_START);
            
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
    const grid = document.getElementById('employeesGrid');
    grid.innerHTML = '';

    employees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card p-6';
        card.innerHTML = `
            <div class="flex items-center mb-6">
                <div class="text-5xl mr-4">${employee.emoji}</div>
                <div>
                    <h3 class="text-3xl font-bold text-gray-800">${employee.name}</h3>
                    <p class="text-gray-600 text-lg">@${employee.employee_id}</p>
                    <p class="text-sm text-blue-600 font-medium">Turnos: ${getTotalShifts(employee.id)} • Horas: ${getTotalHours(employee.id)}h</p>
                </div>
            </div>
            
            <div class="grid grid-cols-7 gap-4">
                ${DAYS.map(day => renderDayColumn(employee, day)).join('')}
            </div>
        `;
        
        grid.appendChild(card);
    });
    
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
    
    renderEmployees();
    
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
    
    renderEmployees();
    
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
    renderEmployees();
    
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
            .eq('week_start', WEEK_START)
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
                week_start: WEEK_START,
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
                    week_start: WEEK_START,
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
        console.log('🗑️ Eliminando horarios existentes para semana:', WEEK_START);
        
        // CORRECCIÓN CRÍTICA: Aplicar filtro ANTES del delete
        const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('week_start', WEEK_START);

        if (deleteError) {
            console.error('❌ Error eliminando:', deleteError);
            throw deleteError;
        }

        console.log('✅ Horarios antiguos eliminados SOLO para semana', WEEK_START);

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
                        week_start: WEEK_START,
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
                            week_start: WEEK_START,
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp); 