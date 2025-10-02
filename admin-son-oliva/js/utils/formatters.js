/* Forn Verge - Formateadores de Texto y Etiquetas - MASSA SON OLIVA */

// Obtener emoji para cada día de la semana
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

// Obtener la fecha formateada de un día (ej: "15 Ene")
function getDayDate(dayKey, currentWeekStart, DAYS) {
    const weekStart = new Date(currentWeekStart);
    const dayIndex = DAYS.findIndex(d => d.key === dayKey);
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayIndex);
    
    return `${dayDate.getDate()} ${dayDate.toLocaleDateString('es-ES', { month: 'short' })}`;
}

// Obtener etiqueta completa de la semana (ej: "9-15 Enero 2025")
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

// Obtener etiqueta corta de la semana (ej: "9-15 Ene")
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

// Exportar funciones al scope global para compatibilidad
window.getDayEmoji = getDayEmoji;
window.getDayDate = getDayDate;

