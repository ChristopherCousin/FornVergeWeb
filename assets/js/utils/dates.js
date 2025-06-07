// ================================
// UTILIDADES DE FECHAS Y TIEMPO
// ================================

import { DOM_SELECTORS, STORAGE_KEYS } from '../config/constants.js';

/**
 * Actualizar fecha y hora en el dashboard
 */
export function updateDateTime() {
    const now = new Date();
    
    const timeElement = document.querySelector(DOM_SELECTORS.currentTime);
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    const dateElement = document.querySelector(DOM_SELECTORS.currentDate);
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }
    
    const lastAccessElement = document.querySelector(DOM_SELECTORS.lastAccess);
    if (lastAccessElement) {
        const lastAccess = localStorage.getItem(STORAGE_KEYS.LAST_ACCESS);
        if (lastAccess) {
            lastAccessElement.textContent = lastAccess;
        }
    }
}

/**
 * Inicializar actualizador de tiempo
 */
export function initTimeUpdater() {
    updateDateTime();
    // Actualizar cada minuto
    setInterval(updateDateTime, 60000);
}

/**
 * Obtener el próximo turno de un empleado
 * @param {Object} schedule - Horarios del empleado
 * @returns {string} - Descripción del próximo turno
 */
export function getNextShift(schedule) {
    // Validar que schedule existe
    if (!schedule || typeof schedule !== 'object') {
        return 'Consulta el horario completo';
    }
    
    const today = new Date().getDay(); // 0 = domingo, 1 = lunes, etc.
    
    // Array de días en orden que coincida con getDay() (0=domingo, 1=lunes, etc.)
    const daysForGetDay = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayNamesSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Buscar el próximo día laborable
    for (let i = 1; i <= 7; i++) {
        const dayIndex = (today + i) % 7;
        const dayName = daysForGetDay[dayIndex];
        const dayData = schedule[dayName];
        
        // Verificar si existe el día y tiene turno
        if (dayData && dayData.time && dayData.time !== 'LIBRE') {
            return `${dayNamesSpanish[dayIndex]}: ${dayData.time}`;
        }
    }
    
    return 'Consulta el horario completo';
} 