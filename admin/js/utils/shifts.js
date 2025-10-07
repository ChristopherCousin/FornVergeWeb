/* Forn Verge - Utilidades de Cálculo de Turnos - MASSA SON OLIVA */

// Determinar el tipo de turno basado en las horas
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

// Obtener la descripción del tipo de turno
function getShiftDescription(type) {
    const descriptions = {
        'morning': 'Turno mañana',
        'afternoon': 'Turno tarde',
        'refuerzo': 'Turno refuerzo',
        'custom': 'Turno personalizado'
    };
    return descriptions[type] || 'Turno personalizado';
}

// Obtener el icono del tipo de turno
function getShiftTypeIcon(type) {
    switch(type) {
        case 'morning': return '🌅';
        case 'afternoon': return '🌆';
        case 'refuerzo': return '⚡';
        case 'custom': return '🎯';
        default: return '';
    }
}

// Obtener la clase CSS del tipo de turno
function getShiftTypeClass(type) {
    switch(type) {
        case 'morning': return 'morning';
        case 'afternoon': return 'afternoon';
        case 'refuerzo': return 'refuerzo';
        case 'custom': return 'custom';
        default: return 'custom';
    }
}

// Calcular horas entre dos tiempos (formato HH:MM)
function calcularHorasEntreTiempos(inicio, fin) {
    const [horaIni, minIni] = inicio.split(':').map(Number);
    const [horaFin, minFin] = fin.split(':').map(Number);
    const minutosIni = horaIni * 60 + minIni;
    const minutosFin = horaFin * 60 + minFin;
    return Math.round((minutosFin - minutosIni) / 60 * 10) / 10;
}

// Detectar tipo de turno basado en hora de inicio
function detectarTipoTurno(inicio, fin) {
    const hora = parseInt(inicio.split(':')[0]);
    if (hora < 12) return 'morning';
    if (hora < 18) return 'afternoon'; 
    return 'evening';
}

// Calcular total de turnos de un empleado (excluyendo días libres)
function getTotalShifts(empId, scheduleData, DAYS) {
    let total = 0;
    DAYS.forEach(day => {
        const shifts = scheduleData[empId][day.key] || [];
        total += shifts.filter(s => !s.isFree).length;
    });
    return total;
}

// Calcular total de horas de un empleado
function getTotalHours(empId, scheduleData, DAYS) {
    let total = 0;
    DAYS.forEach(day => {
        const shifts = scheduleData[empId][day.key] || [];
        total += shifts.reduce((sum, shift) => sum + (shift.hours || 0), 0);
    });
    return total;
}

// Exportar funciones al scope global para compatibilidad
window.getTotalShifts = getTotalShifts;
window.getTotalHours = getTotalHours;

