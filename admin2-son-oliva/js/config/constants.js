/**
 * CONSTANTES CENTRALIZADAS - FORN VERGE
 * =====================================
 * Todas las constantes del sistema en un solo lugar
 */

// Configuración de Supabase
export const SUPABASE_CONFIG = {
    URL: 'https://csxgkxjeifakwslamglc.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg'
};

// ID del local MASSA Son Oliva
export const LOCATION_ID = '781fd5a8-c486-4224-bd2a-bc968ad3f58c';

// Configuración de autenticación
export const AUTH_CONFIG = {
    PASSWORD_HASH: 'c02c130935092678750a1396e519f523c8df545464f46ffd27729f2d9cde6f35', // SHA-256 de 'fornverge2025'
    STORAGE_KEY: 'fornverge_admin_auth',
    REMEMBER_KEY: 'fornverge_remember_me'
};

// Semanas disponibles para el sistema
export const AVAILABLE_WEEKS = [
    '2025-06-16', // Semana 1: 16-22 Jun (pasada)
    '2025-06-23', // Semana 2: 23-29 Jun ← ACTUAL (incluye 24 Jun)
    '2025-06-30', // Semana 3: 30 Jun-6 Jul
    '2025-07-07', // Semana 4: 7-13 Jul
    '2025-07-14', // Semana 5: 14-20 Jul
    '2025-07-21', // Semana 6: 21-27 Jul
    '2025-07-28', // Semana 7: 28 Jul-3 Ago
    '2025-08-04', // Semana 8: 4-10 Ago
    '2025-08-11', // 11-17 Ago
    '2025-08-18', // 18-24 Ago
    '2025-08-25', // 25-31 Ago
    '2025-09-01', // 1-7 Sep
    '2025-09-08', // 8-14 Sep
    '2025-09-15', // 15-21 Sep
    '2025-09-22', // 22-28 Sep
    '2025-09-29'  // 29 Sep-5 Oct
];

// Configuración del convenio de Baleares
export const CONVENIO_CONFIG = {
    // Límites diarios
    horas_maximas_dia: 9,
    descanso_minimo_entre_turnos: 10, // horas
    
    // Límites semanales
    horas_maximas_semana: 40,
    dias_maximos_consecutivos: 6,
    
    // Límites anuales
    horas_maximas_anuales: 1776,  // Convenio Hostelería Baleares 2023-2025
    horas_teoricas_dia: 8,      // 40h semanales / 5 días laborables = 8h/día
    dias_trabajo_empleada_semana: 5, // L-V laborables, S-D libres
    
    // Fechas importantes
    inicio_año: '2025-01-01',
    inicio_datos_reales: '2025-06-06', // Desde cuándo tenemos datos de Ágora
    
    // Empleados excluidos del convenio
    excluidos: ['BRYAN'], // Socio/autónomo
    
    // Fechas de alta específicas por empleado
    fechas_alta_empleados: {
        'MARIA JOSE': '2025-08-12' // María José empezó el 12 de agosto
    }
};

// Días de la semana
export const DAYS = {
    keys: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    names: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    fullNames: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
};

// Nombres de meses
export const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Configuración de turnos por defecto para el generador
export const DEFAULT_COVERAGE = {
    weekday: [
        { start: '06:30', end: '14:00', count: 2 },
        { start: '14:00', end: '21:30', count: 2 }
    ],
    saturday: [
        { start: '07:00', end: '14:00', count: 3 },
        { start: '14:00', end: '22:00', count: 3 }
    ],
    sunday: [
        { start: '07:00', end: '14:00', count: 2 },
        { start: '14:00', end: '22:00', count: 2 }
    ]
};

// Tipos de ausencias
export const ABSENCE_TYPES = {
    vacaciones: '🏖️ Vacaciones',
    baja_medica: '🏥 Baja médica',
    permiso: '📋 Permiso personal',
    maternidad: '👶 Maternidad/Paternidad',
    convenio: '📋 Días convenio',
    asuntos_propios: '📝 Asuntos propios',
    festivo_local: '🎉 Festivo local'
};

// Claves de almacenamiento local
export const STORAGE_KEYS = {
    LAST_WEEK: 'fornverge_last_week',
    GENERATOR_SETTINGS: 'fornverge_generator_settings',
    AUTH_TOKEN: 'fornverge_admin_auth',
    REMEMBER_ME: 'fornverge_remember_me'
};
