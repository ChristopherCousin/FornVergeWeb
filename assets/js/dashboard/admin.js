// ================================
// DASHBOARD DE ADMINISTRADOR
// ================================

import { fornDB } from '../config/supabase.js';
import { DOM_SELECTORS, DAYS, DAY_NAMES, DATES, COLORS } from '../config/constants.js';
import { showNotification } from '../utils/notifications.js';

/**
 * Configurar dashboard de administrador
 */
export async function setupAdminDashboard(admin) {
    try {
        console.log('🔧 Configurando dashboard de admin...');
        
        // Actualizar header
        updateAdminHeader();
        
        // Obtener datos desde Supabase
        const allSchedules = await fornDB.getAllSchedules();
        console.log('📊 Todos los horarios obtenidos:', allSchedules);
        
        if (allSchedules) {
            // Actualizar estadísticas
            updateAdminStats(allSchedules);
            
            // Crear vista de horarios
            createAdminScheduleView(allSchedules);
            
            // Crear resumen administrativo
            updateAdminSummary(allSchedules);
        } else {
            throw new Error('No se pudieron cargar los horarios');
        }
        
    } catch (error) {
        console.error('❌ Error cargando dashboard admin:', error);
        showNotification('Error cargando datos. Usando modo offline.', 'error');
        setupAdminFallback(admin);
    }
}

/**
 * Actualizar header de administrador
 */
function updateAdminHeader() {
    const headerTitle = document.querySelector('.protected-header h1');
    const headerSubtitle = document.querySelector('.protected-header p');
    
    if (headerTitle) headerTitle.textContent = 'Panel de Administración';
    if (headerSubtitle) headerSubtitle.textContent = 'Gestión Completa de Horarios';
    
    // Mostrar noticia para administradores
    const adminNotice = document.getElementById('adminNotice');
    if (adminNotice) adminNotice.classList.remove('hidden');
}

/**
 * Actualizar estadísticas principales
 */
function updateAdminStats(allSchedules) {
    const allEmployees = Object.values(allSchedules).filter(emp => emp.role === 'employee');
    const totalEmployees = allEmployees.length;
    const currentWeekHours = allEmployees.reduce((sum, emp) => {
        return sum + Object.values(emp.schedule).reduce((empSum, day) => empSum + (day.hours || 0), 0);
    }, 0);
    
    // Actualizar contadores
    const employeeCountEl = document.querySelector('.bg-purple-500 .font-bold.text-lg');
    const employeeLabelEl = document.querySelector('.bg-purple-500 .text-purple-100');
    const hoursCountEl = document.querySelector('.bg-orange-500 .font-bold.text-lg');
    const hoursLabelEl = document.querySelector('.bg-orange-500 .text-orange-100');
    
    if (employeeCountEl) employeeCountEl.textContent = `${totalEmployees} empleados`;
    if (employeeLabelEl) employeeLabelEl.textContent = 'activos';
    if (hoursCountEl) hoursCountEl.textContent = `${currentWeekHours}h`;
    if (hoursLabelEl) hoursLabelEl.textContent = 'semanales total';
}

/**
 * Crear vista completa de horarios para admin
 */
function createAdminScheduleView(allSchedules) {
    const scheduleContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.xl\\:grid-cols-3.gap-6.mb-8');
    if (!scheduleContainer) return;
    
    scheduleContainer.innerHTML = '';
    
    DAYS.forEach((day, index) => {
        const dayCard = createAdminDayCard(day, index, allSchedules);
        scheduleContainer.appendChild(dayCard);
    });
}

/**
 * Crear tarjeta de día para administrador
 */
function createAdminDayCard(day, index, allSchedules) {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-container p-6';
    
    // Obtener empleados para este día
    const daySchedules = Object.values(allSchedules)
        .filter(emp => emp.role === 'employee')
        .map(emp => ({
            name: emp.name,
            emoji: emp.emoji,
            id: emp.id,
            supabase_id: emp.supabase_id,
            ...(emp.schedule[day] || { time: 'LIBRE', hours: 0, colleagues: [] })
        }))
        .sort((a, b) => {
            if (a.time === 'LIBRE') return 1;
            if (b.time === 'LIBRE') return -1;
            return a.time.localeCompare(b.time);
        });
    
    const employeeShiftsHTML = daySchedules.map(emp => {
        const isWorkDay = emp.time !== 'LIBRE';
        return `
            <div class="employee-shift ${emp.id}-shift ${!isWorkDay ? 'free-day' : ''}" 
                 data-employee="${emp.id}" data-day="${day}">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-gray-800">${emp.emoji} ${emp.name}</span>
                    <div class="flex items-center space-x-2">
                        <span class="${isWorkDay ? 'time-badge cursor-pointer' : 'bg-gray-400 text-white px-3 py-1 rounded-full text-sm'}"
                              ${isWorkDay ? `onclick="editShift('${emp.supabase_id}', '${day}', '${emp.time}')"` : ''}>
                            ${emp.time}
                        </span>
                        ${isWorkDay ? '<i class="fas fa-edit text-blue-500 cursor-pointer text-sm" title="Editar turno"></i>' : ''}
                    </div>
                </div>
                ${isWorkDay ? `<div class="text-xs text-gray-500 mt-1">${emp.hours} horas</div>` : ''}
            </div>
        `;
    }).join('');
    
    dayCard.innerHTML = `
        <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${DAY_NAMES[index]}</h3>
            <div class="w-16 h-1 bg-${COLORS[index]}-500 mx-auto rounded-full"></div>
            <p class="text-sm text-gray-500 mt-2">${DATES[index]}</p>
        </div>
        <div class="space-y-3">
            ${employeeShiftsHTML}
            <button onclick="addShift('${day}')" 
                    class="w-full mt-4 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition">
                <i class="fas fa-plus mr-2"></i>Agregar Turno
            </button>
        </div>
    `;
    
    return dayCard;
}

/**
 * Actualizar resumen administrativo
 */
function updateAdminSummary(allSchedules) {
    const summarySection = document.querySelector('.bg-white.rounded-2xl.p-6.shadow-lg.mb-8');
    if (!summarySection) return;
    
    const allEmployees = Object.values(allSchedules).filter(emp => emp.role === 'employee');
    
    const employeeSummaries = allEmployees.map(emp => {
        const totalHours = Object.values(emp.schedule).reduce((sum, day) => sum + (day.hours || 0), 0);
        const freeDays = Object.values(emp.schedule).filter(day => day.time === 'LIBRE').length;
        return { ...emp, totalHours, freeDays };
    });
    
    summarySection.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-800">📊 Resumen Administrativo</h3>
            <div class="flex space-x-2">
                <button onclick="exportSchedule()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    <i class="fas fa-download mr-2"></i>Exportar
                </button>
                <button onclick="refreshData()" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                    <i class="fas fa-sync-alt mr-2"></i>Actualizar
                </button>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            ${employeeSummaries.map(emp => `
                <div class="text-center bg-gray-50 rounded-xl p-4">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span class="text-2xl">${emp.emoji}</span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-sm">${emp.name}</h4>
                    <p class="text-blue-600 font-semibold">${emp.totalHours}h</p>
                    <p class="text-gray-500 text-xs">${emp.freeDays} días libres</p>
                    <button onclick="editEmployee('${emp.supabase_id}')" 
                            class="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                        Editar
                    </button>
                </div>
            `).join('')}
        </div>
        
        <div class="mt-8 p-4 bg-green-50 rounded-xl">
            <div class="flex items-center space-x-3">
                <i class="fas fa-database text-green-600 text-xl"></i>
                <div>
                    <h4 class="font-semibold text-green-800">✅ Conectado a Supabase</h4>
                    <p class="text-green-700">Datos sincronizados en tiempo real</p>
                    <p class="text-green-700">Total horas semanales: ${employeeSummaries.reduce((sum, emp) => sum + emp.totalHours, 0)}h</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Configurar dashboard offline (fallback)
 */
function setupAdminFallback(admin) {
    updateAdminHeader();
    
    const summarySection = document.querySelector('.bg-white.rounded-2xl.p-6.shadow-lg.mb-8');
    if (summarySection) {
        summarySection.innerHTML = `
            <div class="text-center">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">⚠️ Modo Offline</h3>
                <p class="text-gray-600 mb-4">No se puede conectar con la base de datos</p>
                <button onclick="location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    <i class="fas fa-sync-alt mr-2"></i>Reintentar Conexión
                </button>
            </div>
        `;
    }
}

// ================================
// FUNCIONES DE ADMINISTRACIÓN 
// (Expuestas globalmente para los onclick)
// ================================

/**
 * Editar turno de empleado
 */
window.editShift = async function(employeeId, day, currentTime) {
    const [startTime, endTime] = currentTime.includes(' - ') ? currentTime.split(' - ') : ['', ''];
    const newStartTime = prompt(`Hora de inicio para ${day}:`, startTime);
    if (!newStartTime) return;
    
    const newEndTime = prompt(`Hora de fin para ${day}:`, endTime);
    if (!newEndTime) return;
    
    try {
        const success = await fornDB.updateEmployeeShift(employeeId, day, newStartTime, newEndTime);
        if (success) {
            showNotification(`Horario actualizado: ${newStartTime} - ${newEndTime}`, 'success');
            await refreshData();
        } else {
            showNotification('Error actualizando horario', 'error');
        }
    } catch (error) {
        console.error('Error editando turno:', error);
        showNotification('Error conectando con la base de datos', 'error');
    }
};

/**
 * Agregar nuevo turno
 */
window.addShift = function(day) {
    showNotification(`Función para agregar turno en ${day}`, 'info');
};

/**
 * Editar empleado
 */
window.editEmployee = function(employeeId) {
    showNotification(`Editando empleado: ${employeeId}`, 'info');
};

/**
 * Exportar horarios
 */
window.exportSchedule = function() {
    showNotification('Exportando horarios...', 'success');
};

/**
 * Actualizar datos
 */
window.refreshData = async function() {
    showNotification('Actualizando datos...', 'info');
    // Emitir evento para que el sistema principal recargue
    document.dispatchEvent(new CustomEvent('refreshRequested'));
}; 