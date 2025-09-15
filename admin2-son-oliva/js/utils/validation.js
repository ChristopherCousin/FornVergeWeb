/**
 * UTILIDADES DE VALIDACIÓN - FORN VERGE
 * ======================================
 * Funciones de validación para formularios y datos
 */

/**
 * Valida formato de hora (HH:MM)
 * @param {string} time - Hora a validar
 * @returns {boolean} True si es válida
 */
export function isValidTime(time) {
    if (!time) return false;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}

/**
 * Valida formato de fecha (YYYY-MM-DD)
 * @param {string} date - Fecha a validar
 * @returns {boolean} True si es válida
 */
export function isValidDate(date) {
    if (!date) return false;
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
}

/**
 * Valida que la hora de fin sea posterior a la de inicio
 * @param {string} startTime - Hora de inicio
 * @param {string} endTime - Hora de fin
 * @returns {boolean} True si es válida
 */
export function isValidTimeRange(startTime, endTime) {
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return false;
    }
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    return end > start;
}

/**
 * Valida que una fecha de fin sea posterior o igual a la de inicio
 * @param {string} startDate - Fecha de inicio
 * @param {string} endDate - Fecha de fin
 * @returns {boolean} True si es válida
 */
export function isValidDateRange(startDate, endDate) {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return false;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return end >= start;
}

/**
 * Valida nombre de empleado
 * @param {string} name - Nombre a validar
 * @returns {boolean} True si es válido
 */
export function isValidEmployeeName(name) {
    if (!name || typeof name !== 'string') return false;
    return name.trim().length >= 2;
}

/**
 * Valida ID de empleado
 * @param {string} employeeId - ID a validar
 * @returns {boolean} True si es válido
 */
export function isValidEmployeeId(employeeId) {
    if (!employeeId || typeof employeeId !== 'string') return false;
    const cleanId = employeeId.trim().toLowerCase();
    return cleanId.length >= 3 && /^[a-z0-9]+$/.test(cleanId);
}

/**
 * Valida código de acceso
 * @param {string} accessCode - Código a validar
 * @returns {boolean} True si es válido
 */
export function isValidAccessCode(accessCode) {
    if (!accessCode || typeof accessCode !== 'string') return false;
    return accessCode.trim().length >= 4;
}

/**
 * Calcula las horas entre dos tiempos
 * @param {string} startTime - Hora de inicio (HH:MM)
 * @param {string} endTime - Hora de fin (HH:MM)
 * @returns {number} Horas trabajadas
 */
export function calculateHours(startTime, endTime) {
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return 0;
    }
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    if (end <= start) return 0;
    
    const diffMs = end - start;
    return diffMs / (1000 * 60 * 60); // Convertir a horas
}

/**
 * Valida que no haya solapamiento entre turnos
 * @param {Array} shifts - Array de turnos existentes
 * @param {Object} newShift - Nuevo turno a validar
 * @param {number} excludeIndex - Índice a excluir (para edición)
 * @returns {boolean} True si no hay solapamiento
 */
export function validateNoOverlap(shifts, newShift, excludeIndex = -1) {
    if (!shifts || !newShift) return true;
    
    const newStart = new Date(`2000-01-01 ${newShift.start}`);
    const newEnd = new Date(`2000-01-01 ${newShift.end}`);
    
    for (let i = 0; i < shifts.length; i++) {
        if (i === excludeIndex) continue;
        
        const shift = shifts[i];
        if (!shift.start || !shift.end) continue;
        
        const existingStart = new Date(`2000-01-01 ${shift.start}`);
        const existingEnd = new Date(`2000-01-01 ${shift.end}`);
        
        // Verificar solapamiento
        if (newStart < existingEnd && newEnd > existingStart) {
            return false;
        }
    }
    
    return true;
}

/**
 * Sanitiza texto para prevenir XSS
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export function sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}
