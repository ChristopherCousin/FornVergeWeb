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
            ready_time: 7,  // Todo listo a las 7:00 (apertura al público)
            description: 'Apertura 7:00 - Todo debe estar listo a las 7:00'
        },
        mediodia: { 
            start: 12, 
            end: 17, 
            emoji: '☀️', 
            name: 'Mediodía',
            ready_time: 12, // Todo listo a las 12:00
            description: 'Cambio turno 12:00 - Todo debe estar listo a las 12:00'
        },
        tarde: { 
            start: 17, 
            end: 21, 
            emoji: '🌆', 
            name: 'Tarde',
            ready_time: 17, // Todo listo a las 17:00
            description: 'Cambio turno 17:00 - Todo debe estar listo a las 17:00'
        }
    },
    
    // Tiempos de descongelación por producto (en minutos) - VERANO
    tiempos_descongelacion: {
        'Barra Clásica': 40,
        'Mini Croissant': 50,
        'Croissant': 60,
        'Napolitana Choco.': 55,
        'Mini Croissant Choco Dúo': 50,
        'Empanada Pollo y Cebolla': 70,
        'Empanada Carne': 75,
        'Empanada Guisantes': 70,
        'Ensaimada Crema': 65,
        'Ensaimada Normal': 60,
        'Napolitana Jamón/Queso': 55
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
    auto_refresh_minutes: 5,
    
    // Versión de la aplicación
    version: '1.0.0',
    
    // Configuración de la PWA
    app_name: 'Forn Verge - Descongelación',
    
    // Configuración de notificaciones
    notifications: {
        enabled: true,
        defrost_reminder: 30, // minutos antes de que termine la descongelación
        baking_reminder: 5    // minutos antes de que termine el horneado
    },
    
    // Estados de los productos
    estados: {
        pending: { 
            name: 'Pendiente', 
            emoji: '⏳', 
            color: '#ffc107',
            description: 'Por descongelar'
        },
        defrosting: { 
            name: 'Descongelando', 
            emoji: '🧊➡️', 
            color: '#17a2b8',
            description: 'En proceso de descongelación'
        },
        ready: { 
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
            description: 'Proceso terminado'
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

// ===== FUNCIÓN PARA CALCULAR CUÁNDO EMPEZAR DESCONGELACIÓN =====
function calculateDefrostStartTime(tanda, producto) {
    const tandaInfo = TIME_CONFIG.tandas[tanda];
    if (!tandaInfo) return null;
    
    const defrostMinutes = TIME_CONFIG.tiempos_descongelacion[producto] || 60;
    const bakingMinutes = TIME_CONFIG.tiempos_horneado[producto] || 15;
    const readyHour = tandaInfo.ready_time;
    
    // CALCULAR HACIA ATRÁS:
    // 1. Hora objetivo (cliente lo quiere)
    const targetTime = readyHour * 60; // convertir a minutos desde 00:00
    
    // 2. Hora de meter al horno (target - tiempo_horneado)
    const ovenTime = targetTime - bakingMinutes;
    
    // 3. Hora de sacar del congelador (horno - tiempo_descongelacion)
    const defrostStart = ovenTime - defrostMinutes;
    
    // Convertir de vuelta a horas y minutos
    const startHour = Math.floor(defrostStart / 60);
    const startMinutes = defrostStart % 60;
    const ovenHour = Math.floor(ovenTime / 60);
    const ovenMinutes = ovenTime % 60;
    
    return {
        start_hour: startHour,
        start_minutes: startMinutes,
        oven_hour: ovenHour,
        oven_minutes: ovenMinutes,
        ready_hour: readyHour,
        ready_minutes: 0,
        defrost_duration: defrostMinutes,
        baking_duration: bakingMinutes,
        total_process: defrostMinutes + bakingMinutes
    };
}

// ===== FUNCIÓN PARA OBTENER RECOMENDACIÓN DE INICIO =====
function getDefrostRecommendation(tanda, producto) {
    const calc = calculateDefrostStartTime(tanda, producto);
    if (!calc) return 'No calculado';
    
    const startTime = `${calc.start_hour.toString().padStart(2, '0')}:${calc.start_minutes.toString().padStart(2, '0')}`;
    const ovenTime = `${calc.oven_hour.toString().padStart(2, '0')}:${calc.oven_minutes.toString().padStart(2, '0')}`;
    const readyTime = `${calc.ready_hour.toString().padStart(2, '0')}:${calc.ready_minutes.toString().padStart(2, '0')}`;
    
    return `🧊 ${startTime} → 🔥 ${ovenTime} → 🎯 ${readyTime}`;
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
    
    if (!SUPABASE_CONFIG.anon_key || SUPABASE_CONFIG.anon_key === 'TU_SUPABASE_ANON_KEY') {
        console.error('❌ Clave anónima de Supabase no configurada');
        return false;
    }
    
    return true;
}

// Exportar configuraciones para uso global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.TIME_CONFIG = TIME_CONFIG;
window.APP_CONFIG = APP_CONFIG;
window.WEEKDAYS = WEEKDAYS;
window.PRODUCT_EMOJIS = PRODUCT_EMOJIS;
window.getCurrentTanda = getCurrentTanda;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.calculateTimeRemaining = calculateTimeRemaining;
window.calculateDefrostStartTime = calculateDefrostStartTime;
window.getDefrostRecommendation = getDefrostRecommendation;
window.getWeekdayNumber = getWeekdayNumber;
window.validateConfig = validateConfig; 