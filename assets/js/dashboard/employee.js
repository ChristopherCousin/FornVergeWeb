// ================================
// DASHBOARD DE EMPLEADO
// ================================

import { fornDB } from '../config/supabase.js';
import { DOM_SELECTORS, DAYS, DAY_NAMES, DATES, COLORS } from '../config/constants.js';
import { showNotification } from '../utils/notifications.js';
import { getNextShift } from '../utils/dates.js';

/**
 * Configurar dashboard personal del empleado
 */
export async function setupEmployeeDashboard(employee) {
    try {
        console.log('👨‍💼 Configurando dashboard personal para:', employee.name);
        
        // Actualizar header personal
        updateEmployeeHeader(employee);
        
        // Obtener horario personal
        const schedule = await fornDB.getEmployeeSchedule(employee.supabase_id);
        console.log('📊 Horario obtenido:', schedule);
        
        if (schedule) {
            // Actualizar estadísticas personales
            updateEmployeeStats(employee, schedule);
            
            // Crear vista personal de horarios
            createPersonalScheduleView(employee, schedule);
            
            // Crear resumen personal
            updatePersonalSummary(employee, schedule);
        } else {
            throw new Error('No se pudo cargar el horario personal');
        }
        
    } catch (error) {
        console.error('❌ Error cargando dashboard personal:', error);
        showNotification('Error cargando datos. Usando modo offline.', 'error');
        setupEmployeeFallback(employee);
    }
}

/**
 * Actualizar header personal
 */
function updateEmployeeHeader(employee) {
    const headerTitle = document.querySelector('.protected-header h1');
    const headerSubtitle = document.querySelector('.protected-header p');
    
    if (headerTitle) headerTitle.textContent = `Panel de ${employee.name}`;
    if (headerSubtitle) headerSubtitle.textContent = 'Mis Horarios y Turnos';
    
    // Ocultar noticia de admin para empleados
    const adminNotice = document.getElementById('adminNotice');
    if (adminNotice) adminNotice.classList.add('hidden');
}

/**
 * Actualizar estadísticas personales
 */
function updateEmployeeStats(employee, schedule) {
    const totalHours = Object.values(schedule).reduce((sum, day) => sum + (day.hours || 0), 0);
    const workingDays = Object.values(schedule).filter(day => day.time !== 'LIBRE').length;
    
    // Actualizar contadores personales
    const employeeCountEl = document.querySelector('.bg-purple-500 .font-bold.text-lg');
    const employeeLabelEl = document.querySelector('.bg-purple-500 .text-purple-100');
    const hoursCountEl = document.querySelector('.bg-orange-500 .font-bold.text-lg');
    const hoursLabelEl = document.querySelector('.bg-orange-500 .text-orange-100');
    
    if (employeeCountEl) employeeCountEl.textContent = 'Mi horario';
    if (employeeLabelEl) employeeLabelEl.textContent = `${totalHours}h semanales`;
    if (hoursCountEl) hoursCountEl.textContent = `${workingDays} días`;
    if (hoursLabelEl) hoursLabelEl.textContent = 'de trabajo';
}

/**
 * Crear vista personal de horarios
 */
function createPersonalScheduleView(employee, schedule) {
    const scheduleContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.xl\\:grid-cols-3.gap-6.mb-8');
    if (!scheduleContainer) return;
    
    scheduleContainer.innerHTML = '';
    
    DAYS.forEach((day, index) => {
        const dayCard = createPersonalDayCard(employee, day, index, schedule);
        scheduleContainer.appendChild(dayCard);
    });
}

/**
 * Crear tarjeta de día personal
 */
function createPersonalDayCard(employee, day, index, schedule) {
    const dayData = schedule[day] || { time: 'LIBRE', hours: 0, colleagues: [] };
    const isWorkDay = dayData.time !== 'LIBRE';
    
    const dayCard = document.createElement('div');
    dayCard.className = 'day-container p-6';
    
    dayCard.innerHTML = `
        <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${DAY_NAMES[index]}</h3>
            <div class="w-16 h-1 bg-${COLORS[index]}-500 mx-auto rounded-full"></div>
            <p class="text-sm text-gray-500 mt-2">${DATES[index]}</p>
        </div>
        <div class="space-y-3">
            <div class="employee-shift ${employee.id}-shift ${!isWorkDay ? 'free-day' : ''}">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-gray-800">${employee.emoji} ${employee.name}</span>
                    <span class="${isWorkDay ? 'time-badge' : 'bg-gray-400 text-white px-3 py-1 rounded-full text-sm'}">
                        ${dayData.time}
                    </span>
                </div>
                ${isWorkDay ? `<div class="text-xs text-gray-500 mt-1">${dayData.hours} horas</div>` : ''}
            </div>
            ${renderColleagues(dayData.colleagues)}
        </div>
    `;
    
    return dayCard;
}

/**
 * Renderizar compañeros de trabajo
 */
function renderColleagues(colleagues) {
    if (!colleagues || colleagues.length === 0) return '';
    
    return `
        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
            <p class="text-sm font-medium text-blue-800 mb-2">👥 Trabajas con:</p>
            <div class="space-y-1">
                ${colleagues.map(colleague => `
                    <p class="text-sm text-blue-700">• ${colleague}</p>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Actualizar resumen personal
 */
function updatePersonalSummary(employee, schedule) {
    const summarySection = document.querySelector('.bg-white.rounded-2xl.p-6.shadow-lg.mb-8');
    if (!summarySection) return;
    

    
    const totalHours = Object.values(schedule).reduce((sum, day) => sum + (day.hours || 0), 0);
    const freeDays = Object.values(schedule).filter(day => day.time === 'LIBRE').length;
    const workingDays = 7 - freeDays;
    
    summarySection.innerHTML = `
        <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            📊 Mi Resumen Semanal
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
                <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-3xl">${employee.emoji}</span>
                </div>
                <h4 class="font-bold text-gray-800 text-xl">${employee.name}</h4>
                <p class="text-blue-600 font-bold text-2xl">${totalHours} horas</p>
                <p class="text-gray-500">esta semana</p>
            </div>
            
            <div class="text-center">
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-calendar-check text-green-600 text-2xl"></i>
                </div>
                <h4 class="font-bold text-gray-800 text-xl">Días Laborales</h4>
                <p class="text-green-600 font-bold text-2xl">${workingDays}</p>
                <p class="text-gray-500">de trabajo</p>
            </div>
            
            <div class="text-center">
                <div class="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-home text-purple-600 text-2xl"></i>
                </div>
                <h4 class="font-bold text-gray-800 text-xl">Días Libres</h4>
                <p class="text-purple-600 font-bold text-2xl">${freeDays}</p>
                <p class="text-gray-500">de descanso</p>
            </div>
        </div>
        
        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-4 bg-yellow-50 rounded-xl">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-lightbulb text-yellow-600 text-xl"></i>
                    <div>
                        <h4 class="font-semibold text-yellow-800">Próximo turno</h4>
                        <p class="text-yellow-700">${getNextShift(schedule)}</p>
                    </div>
                </div>
            </div>
            
            <div class="p-4 bg-green-50 rounded-xl">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-database text-green-600 text-xl"></i>
                    <div>
                        <h4 class="font-semibold text-green-800">Datos actualizados</h4>
                        <p class="text-green-700">Sincronizado con la base de datos</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Configurar dashboard offline para empleado
 */
function setupEmployeeFallback(employee) {
    updateEmployeeHeader(employee);
    
    const summarySection = document.querySelector('.bg-white.rounded-2xl.p-6.shadow-lg.mb-8');
    if (summarySection) {
        summarySection.innerHTML = `
            <div class="text-center">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-3xl">${employee.emoji}</span>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">⚠️ Sin conexión</h3>
                <p class="text-gray-600 mb-4">No se pueden cargar los horarios</p>
                <button onclick="location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    <i class="fas fa-sync-alt mr-2"></i>Reintentar
                </button>
            </div>
        `;
    }
    
    // Ocultar vista de horarios si no hay datos
    const scheduleContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.xl\\:grid-cols-3.gap-6.mb-8');
    if (scheduleContainer) {
        scheduleContainer.innerHTML = `
            <div class="col-span-full text-center p-8 bg-gray-50 rounded-xl">
                <i class="fas fa-wifi-slash text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-600">Horarios no disponibles sin conexión</p>
            </div>
        `;
    }
} 