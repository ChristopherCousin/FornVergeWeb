/**
 * CONFIGURACIÓN DEL CONVENIO DE HOSTELERÍA BALEARES
 * ==================================================
 * Todos los límites y reglas del convenio colectivo
 */

window.CONVENIO_CONFIG = {
    // Límites diarios
    horas_maximas_dia: 9,
    descanso_minimo_entre_turnos: 10, // horas
    
    // Límites semanales
    horas_maximas_semana: 40,
    dias_maximos_consecutivos: 6,
    
    // Límites anuales (estos son los CRÍTICOS para la encargada)
    horas_maximas_anuales: 1776,  // Convenio Hostelería Baleares 2023-2025
    horas_semanales_promedio: 40.5, // Promedio semanal según convenio hostelería
    tasa_diaria_convenio: 40.5 / 7, // 5.7857h/día - Tasa diaria para calcular horas ideales
    horas_teoricas_dia: 8,      // 40h semanales / 5 días laborables = 8h/día
    dias_trabajo_empleada_semana: 5, // L-V laborables, S-D libres
    
    // Fechas importantes
    inicio_año: '2025-01-01',
    inicio_datos_reales: '2025-06-06', // Desde cuándo tenemos datos de Ágora
    
    // Empleados excluidos del convenio (AHORA SE GESTIONA DESDE LA BD)
    // Ver columna: employees.excluido_convenio
    
    // Fechas de alta específicas por empleado (cuando no coinciden con inicio_datos_reales)
    fechas_alta_empleados: {
        'MARIA JOSE': '2025-08-12' // María José empezó el 12 de agosto
    }
};

// ID de la localización (DEPRECADO - Ahora se usa getCurrentLocationId())
// window.SON_OLIVA_LOCATION_ID = '781fd5a8-c486-4224-bd2a-bc968ad3f58c';
