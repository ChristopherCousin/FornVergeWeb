// ===== CONFIGURACIÓN DE SUPABASE =====
// ⚠️ IMPORTANTE: Configura estos valores con tus credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://csxgkxjeifakwslamglc.supabase.co', // Tu URL de Supabase
    anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg' // 👈 CAMBIAR POR LA CLAVE CORRECTA
};

// ===== CONFIGURACIÓN DE HORARIOS =====
const TIME_CONFIG = {
    // Franjas horarias para la producción
    tandas: {
        mañana: { 
            start: 6, 
            end: 12, 
            emoji: '🌅', 
            name: 'Mañana',
            work_start: 6,  // Empleados entran a las 6:00
            ready_time: 7,  // Todo listo a las 7:00 (apertura al público)
            description: 'Entran 6:00, Apertura 7:00',
            preparation_time: '17:00' // Se prepara el día anterior a las 17:00
        },
        mediodia: { 
            start: 12, 
            end: 17, 
            emoji: '☀️', 
            name: 'Mediodía',
            work_start: 12, // Empleados entran a las 12:00
            ready_time: 12, // Todo listo a las 12:00
            description: 'Cambio turno 12:00',
            preparation_time: '17:00' // Se prepara el día anterior a las 17:00
        },
        tarde: { 
            start: 17, 
            end: 21, 
            emoji: '🌆', 
            name: 'Tarde',
            work_start: 17, // Empleados entran a las 17:00
            ready_time: 17, // Todo listo a las 17:00
            description: 'Cambio turno 17:00',
            preparation_time: '17:00' // Se prepara el día anterior a las 17:00
        }
    },
    
    // Tiempos de descongelación por producto (en minutos) - AJUSTADOS PARA PREPARACIÓN
    tiempos_descongelacion: {
        'Barra Clásica': 45,                    // Reducido porque está pre-organizado
        'Mini Croissant': 60,                   // Masa hojaldrada pre-separada
        'Croissant': 75,                        // Croissant grande pre-organizado
        'Napolitana Choco.': 60,                // Con relleno pre-separado
        'Mini Croissant Choco Dúo': 60,        // Pequeño pero organizado
        'Empanada Pollo y Cebolla': 90,         // CARNE - Tiempo reducido por pre-organización
        'Empanada Carne': 90,                   // CARNE - Tiempo reducido pero seguro
        'Empanada Guisantes': 60,               // Verdura pre-organizada
        'Ensaimada Crema': 75,                  // Crema láctea pre-separada
        'Ensaimada Normal': 60,                 // Masa dulce pre-organizada
        'Napolitana Jamón/Queso': 75           // Jamón y queso pre-separado
    },
    
    // Tiempos de horneado por producto (en minutos)
    tiempos_horneado: {
        'Barra Clásica': 15,
        'Mini Croissant': 15,
        'Croissant': 15,
        'Napolitana Choco.': 15,
        'Mini Croissant Choco Dúo': 15,
        'Empanada Pollo y Cebolla': 18,
        'Empanada Carne': 18,
        'Empanada Guisantes': 18,
        'Ensaimada Crema': 15,
        'Ensaimada Normal': 15,
        'Napolitana Jamón/Queso': 15
    }
};

// ===== CONFIGURACIÓN DE LA APLICACIÓN =====
const APP_CONFIG = {
    // Actualización automática cada X minutos
    auto_refresh_minutes: 2,
    
    // Versión de la aplicación
    version: '2.0.0',
    
    // Configuración de la PWA
    app_name: 'Forn Verge - Preparación y Descongelación',
    
    // Configuración de notificaciones
    notifications: {
        enabled: true,
        preparation_reminder: 60, // Recordatorio preparación día anterior
        defrost_reminder: 10,     // minutos antes de sacar del congelador
        baking_reminder: 5        // minutos antes de que termine el horneado
    },
    
    // Modos de operación
    modes: {
        preparation: {
            name: 'Preparación',
            emoji: '📋',
            description: 'Preparar bandejas para mañana',
            available_hours: [16, 17, 18, 19, 20] // Solo disponible en estas horas
        },
        execution: {
            name: 'Ejecución',
            emoji: '⚡',
            description: 'Seguir tiempos del día',
            available_hours: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
        }
    },
    
    // Estados de los productos - NUEVO FLUJO
    estados: {
        pending_preparation: { 
            name: 'Por preparar', 
            emoji: '📝', 
            color: '#6c757d',
            description: 'Bandeja no preparada aún'
        },
        prepared: { 
            name: 'Preparado', 
            emoji: '📦', 
            color: '#17a2b8',
            description: 'Bandeja lista en congelador'
        },
        ready_to_defrost: { 
            name: 'Por sacar', 
            emoji: '⏰', 
            color: '#ffc107',
            description: 'Hora de sacar del congelador'
        },
        defrosting: { 
            name: 'Descongelando', 
            emoji: '🧊➡️', 
            color: '#17a2b8',
            description: 'Fuera del congelador'
        },
        ready_to_bake: { 
            name: 'Listo para horno', 
            emoji: '✅', 
            color: '#28a745',
            description: 'Descongelado y listo'
        },
        baking: { 
            name: 'En horno', 
            emoji: '🔥', 
            color: '#fd7e14',
            description: 'Horneándose'
        },
        completed: { 
            name: 'Completado', 
            emoji: '🎯', 
            color: '#6f42c1',
            description: 'Listo para vender'
        }
    }
};

// ===== CONFIGURACIÓN DE DÍAS DE LA SEMANA =====
const WEEKDAYS = {
    0: 'Lunes',
    1: 'Martes', 
    2: 'Miércoles',
    3: 'Jueves',
    4: 'Viernes',
    5: 'Sábado',
    6: 'Domingo'
};

// ===== EMOJIS POR PRODUCTO =====
const PRODUCT_EMOJIS = {
    'Barra Clásica': '🥖',
    'Mini Croissant': '🥐',
    'Croissant': '🥐',
    'Napolitana Choco.': '🍫🥐',
    'Mini Croissant Choco Dúo': '🍫🥐',
    'Empanada Pollo y Cebolla': '🥟🐔',
    'Empanada Carne': '🥟🥩',
    'Empanada Guisantes': '🥟🟢',
    'Ensaimada Crema': '🍩🍰',
    'Ensaimada Normal': '🍩',
    'Napolitana Jamón/Queso': '🧀🥐'
};

// ===== FUNCIÓN PARA DETECTAR MODO DE OPERACIÓN =====
function getCurrentMode() {
    const now = new Date();
    const hour = now.getHours();
    
    // Modo preparación: 16:00-20:00 para preparar día siguiente
    if (hour >= 16 && hour <= 20) {
        return 'preparation';
    }
    
    // Resto del tiempo: modo ejecución
    return 'execution';
}

// ===== FUNCIÓN PARA OBTENER LA TANDA ACTUAL =====
function getCurrentTanda() {
    const now = new Date();
    const hour = now.getHours();
    
    for (const [key, tanda] of Object.entries(TIME_CONFIG.tandas)) {
        if (hour >= tanda.start && hour < tanda.end) {
            return key;
        }
    }
    
    // Si no está en ninguna tanda, devolver la siguiente
    if (hour < 6) return 'mañana';
    if (hour >= 21) return 'mañana'; // Para el día siguiente
    
    return null;
}

// ===== FUNCIÓN PARA OBTENER FECHA DEL DÍA OBJETIVO =====
function getTargetDate(mode = null) {
    const now = new Date();
    const currentMode = mode || getCurrentMode();
    
    if (currentMode === 'preparation') {
        // En modo preparación, trabajamos para mañana
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    } else {
        // En modo ejecución, trabajamos para hoy
        return now;
    }
}

// ===== FUNCIÓN PARA FORMATEAR FECHAS =====
function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function formatTime(date) {
    return new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}

function formatShortDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    }).format(date);
}

// ===== FUNCIÓN PARA CALCULAR TIEMPO RESTANTE =====
function calculateTimeRemaining(startTime, durationMinutes) {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(start.getTime() + (durationMinutes * 60000));
    const remaining = end.getTime() - now.getTime();
    
    if (remaining <= 0) return null;
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return { minutes, seconds, total: remaining };
}

// ===== FUNCIÓN PARA CALCULAR CUÁNDO SACAR DEL CONGELADOR =====
function calculateDefrostSchedule(tanda, producto) {
    const tandaInfo = TIME_CONFIG.tandas[tanda];
    if (!tandaInfo) return null;
    
    const defrostMinutes = TIME_CONFIG.tiempos_descongelacion[producto] || 60;
    const bakingMinutes = TIME_CONFIG.tiempos_horneado[producto] || 15;
    const readyTime = tandaInfo.ready_time * 60; // Convertir a minutos
    
    // Calcular hacia atrás desde hora objetivo
    const bakeStartTime = readyTime - bakingMinutes;
    const defrostStartTime = bakeStartTime - defrostMinutes;
    
    return {
        defrost_hour: Math.floor(defrostStartTime / 60),
        defrost_minutes: defrostStartTime % 60,
        bake_hour: Math.floor(bakeStartTime / 60),
        bake_minutes: bakeStartTime % 60,
        ready_hour: Math.floor(readyTime / 60),
        ready_minutes: readyTime % 60
    };
}

// ===== FUNCIÓN PARA VERIFICAR SI ES HORA DE SACAR =====
function shouldDefrostNow(tanda, producto) {
    const schedule = calculateDefrostSchedule(tanda, producto);
    if (!schedule) return false;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const defrostMinutes = schedule.defrost_hour * 60 + schedule.defrost_minutes;
    
    // Permitir 15 minutos de ventana antes y después
    return currentMinutes >= (defrostMinutes - 15) && currentMinutes <= (defrostMinutes + 15);
}

// ===== FUNCIÓN PARA VERIFICAR SI ES HORA DE HORNEAR =====
function shouldBakeNow(tanda, producto) {
    const schedule = calculateDefrostSchedule(tanda, producto);
    if (!schedule) return false;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const bakeMinutes = schedule.bake_hour * 60 + schedule.bake_minutes;
    
    // Permitir 10 minutos de ventana antes y después
    return currentMinutes >= (bakeMinutes - 10) && currentMinutes <= (bakeMinutes + 10);
}

// ===== FUNCIÓN PARA OBTENER EL DÍA DE LA SEMANA =====
function getWeekdayNumber(date = new Date()) {
    return date.getDay() === 0 ? 6 : date.getDay() - 1; // Convertir domingo=0 a domingo=6
}

// ===== FUNCIÓN PARA VALIDAR CONFIGURACIÓN =====
function validateConfig() {
    if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'TU_SUPABASE_URL') {
        console.error('❌ URL de Supabase no configurada');
        return false;
    }
    
    if (!SUPABASE_CONFIG.anon_key || SUPABASE_CONFIG.anon_key === 'TU_CLAVE_PUBLICA') {
        console.error('❌ Clave de Supabase no configurada');
        return false;
    }
    
    return true;
}

// ===== FUNCIONES DE UTILIDAD PARA PREPARACIÓN =====
function getTomorrowWeekday() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getWeekdayNumber(tomorrow);
}

function isPreparationTime() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 16 && hour <= 20;
}

function getPreparationStatus(tanda, fecha) {
    // Esta función se conectará con la base de datos para verificar
    // si una tanda específica ya está preparada
    return 'pending_preparation'; // Por defecto
}

// Exportar configuraciones para uso global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.TIME_CONFIG = TIME_CONFIG;
window.APP_CONFIG = APP_CONFIG;
window.WEEKDAYS = WEEKDAYS;
window.PRODUCT_EMOJIS = PRODUCT_EMOJIS;
window.getCurrentMode = getCurrentMode;
window.getCurrentTanda = getCurrentTanda;
window.getTargetDate = getTargetDate;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.formatShortDate = formatShortDate;
window.calculateTimeRemaining = calculateTimeRemaining;
window.calculateDefrostSchedule = calculateDefrostSchedule;
window.shouldDefrostNow = shouldDefrostNow;
window.shouldBakeNow = shouldBakeNow;
window.getWeekdayNumber = getWeekdayNumber;
window.validateConfig = validateConfig; 