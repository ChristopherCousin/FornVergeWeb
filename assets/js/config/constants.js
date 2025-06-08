// ================================
// CONSTANTES DE CONFIGURACIÓN UI
// Forn Verge de Lluc
// ================================

// Configuración de días de la semana
export const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
export const DAY_NAMES = ['🌅 LUNES', '🌄 MARTES', '🌞 MIÉRCOLES', '🌅 JUEVES', '🎉 VIERNES', '🎊 SÁBADO', '🌅 DOMINGO'];
export const DATES = ['9 Febrero', '10 Febrero', '11 Febrero', '12 Febrero', '13 Febrero', '14 Febrero', '15 Febrero'];
export const COLORS = ['blue', 'green', 'yellow', 'purple', 'red', 'pink', 'indigo'];

// Configuración agrupada (para compatibilidad)
export const DAYS_CONFIG = {
    days: DAYS,
    dayNames: DAY_NAMES,
    dates: DATES,
    colors: COLORS
};

// Configuración de semana demo (temporal para mostrar datos)
export const DEMO_WEEK = '2025-02-09';

// Selectores DOM comunes
export const DOM_SELECTORS = {
    loginScreen: '#loginScreen',
    employeeDashboard: '#employeeDashboard',
    loginForm: '#loginForm',
    accessCode: '#accessCode',
    loginError: '#loginError',
    logoutBtn: '#logoutBtn',
    currentTime: '#currentTime',
    currentDate: '#currentDate',
    lastAccess: '#lastAccess',
    scheduleContainer: '.grid.grid-cols-1.lg\\:grid-cols-2.xl\\:grid-cols-3.gap-6.mb-8',
    summarySection: '.bg-white.rounded-2xl.p-6.shadow-lg.mb-8',
    headerTitle: '.protected-header h1',
    headerSubtitle: '.protected-header p',
    purpleCard: '.bg-purple-500 .font-bold.text-lg',
    purpleSubtitle: '.bg-purple-500 .text-purple-100',
    orangeCard: '.bg-orange-500 .font-bold.text-lg',
    orangeSubtitle: '.bg-orange-500 .text-orange-100'
};

// Tipos de notificación
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning'
};

// Configuración de localStorage
export const STORAGE_KEYS = {
    EMPLOYEE_ACCESS: 'employeeAccess',
    CURRENT_EMPLOYEE: 'currentEmployee',
    LAST_ACCESS: 'lastAccess'
};

// Configuración Supabase
export const SUPABASE_CONFIG = {
    URL: 'https://csxgkxjeifakwslamglc.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg'
};

// Códigos de acceso válidos (SOLO PARA FALLBACK LOCAL SI SUPABASE FALLA)
export const FALLBACK_CODES = ['bryan2025', 'raquel2025', 'maria2025', 'xisca2025', 'andrea2025', 'adminforn2025']; 