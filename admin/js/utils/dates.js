/* Forn Verge - Utilidades de Fechas - MASSA SON OLIVA */

// Función HASH para la contraseña
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convertir Date a formato ISO (YYYY-MM-DD)
function toISODate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Obtener el lunes de la semana actual en formato ISO
function getThisMondayISO() {
    const today = new Date();
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekday = d.getDay(); // 0=Domingo, 1=Lunes, ...
    const diffToMonday = (weekday === 0 ? -6 : 1) - weekday;
    d.setDate(d.getDate() + diffToMonday);
    d.setHours(0,0,0,0);
    return toISODate(d);
}

// Función para calcular automáticamente la semana actual (lunes) y ajustarla a las disponibles
function getCurrentWeek(weeks = []) {
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

// Función para generar semanas automáticamente
function generateAvailableWeeks(startWeek, numberOfWeeks = 52) {
    const weeks = [];
    const startDate = new Date(startWeek);
    
    for (let i = 0; i < numberOfWeeks; i++) {
        const weekDate = new Date(startDate);
        weekDate.setDate(startDate.getDate() + (i * 7));
        weeks.push(toISODate(weekDate));
    }
    
    return weeks;
}

// Generar semanas disponibles (52 semanas desde el 16 de junio de 2025)
const availableWeeks = generateAvailableWeeks('2025-06-16', 52);

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

