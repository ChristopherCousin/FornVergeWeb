/**
 * UTILIDADES DE FECHAS - FORN VERGE
 * ==================================
 * Funciones comunes para manejo de fechas
 */

import { DAYS, MONTHS, AVAILABLE_WEEKS } from '../config/constants.js';

/**
 * Convierte una fecha a formato ISO (YYYY-MM-DD)
 * @param {Date} date - Fecha a convertir
 * @returns {string} Fecha en formato ISO
 */
export function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Obtiene el lunes de la semana actual
 * @returns {string} Fecha del lunes en formato ISO
 */
export function getThisMondayISO() {
    const today = new Date();
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekday = d.getDay(); // 0=Domingo, 1=Lunes, ...
    const diffToMonday = (weekday === 0 ? -6 : 1) - weekday;
    d.setDate(d.getDate() + diffToMonday);
    d.setHours(0, 0, 0, 0);
    return toISODate(d);
}

/**
 * Calcula automáticamente la semana actual ajustándola a las disponibles
 * @param {Array} weeks - Array de semanas disponibles
 * @returns {string} Fecha de la semana más apropiada
 */
export function getCurrentWeek(weeks = AVAILABLE_WEEKS) {
    const thisMonday = getThisMondayISO();
    
    if (Array.isArray(weeks) && weeks.length > 0) {
        if (weeks.includes(thisMonday)) return thisMonday;
        
        const todayTs = new Date(thisMonday).getTime();
        const sortedDesc = [...weeks].sort((a, b) => new Date(b) - new Date(a));
        const fallback = sortedDesc.find(w => new Date(w).getTime() <= todayTs);
        
        return fallback || sortedDesc[0] || thisMonday;
    }
    
    return thisMonday;
}

/**
 * Genera información de días para una semana específica
 * @param {string} weekStart - Fecha de inicio de semana (YYYY-MM-DD)
 * @returns {Array} Array con información de cada día
 */
export function generateDaysForWeek(weekStart) {
    const startDate = new Date(weekStart);
    
    return DAYS.keys.map((day, index) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + index);
        
        const dayNum = currentDate.getDate();
        const monthName = MONTHS[currentDate.getMonth()];
        
        return {
            key: day,
            name: `${DAYS.names[index]} ${dayNum}`,
            fullName: `${DAYS.fullNames[index]} ${dayNum} ${monthName}`
        };
    });
}

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export function formatDateForDisplay(isoDate) {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
}

/**
 * Obtiene el rango de fechas de una semana
 * @param {string} weekStart - Fecha de inicio de semana
 * @returns {string} Rango formateado (ej: "9-15 Feb")
 */
export function getWeekRange(weekStart) {
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const month = MONTHS[startDate.getMonth()].substring(0, 3);
    
    return `${startDay}-${endDay} ${month}`;
}

/**
 * Verifica si una fecha está en un rango de ausencia
 * @param {string} date - Fecha a verificar (YYYY-MM-DD)
 * @param {string} startDate - Fecha inicio ausencia
 * @param {string} endDate - Fecha fin ausencia
 * @returns {boolean} True si está en el rango
 */
export function isDateInRange(date, startDate, endDate) {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return checkDate >= start && checkDate <= end;
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha fin (YYYY-MM-DD)
 * @returns {number} Número de días
 */
export function daysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
}
