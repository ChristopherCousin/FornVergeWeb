/* Forn Verge - Estado Global de la Aplicación - MASSA SON OLIVA */

// ===== VARIABLES GLOBALES DE ESTADO =====

// Datos de empleados y horarios
let employees = [];
let scheduleData = {}; 

// Sistema de borrador
let originalScheduleBeforeDraft = null; // Para guardar el estado antes de un borrador
let isInDraftMode = false; // Para saber si estamos en modo borrador

// Estado del modal de turnos
let currentModalEmployee = null;
let currentModalDay = null;
let isEditingShift = false;
let currentEditingShiftIndex = null;

// Empleados de vacaciones (legacy - se mantiene por compatibilidad)
let employeesOnVacation = new Set(); // IDs de empleados de vacaciones

// Variable de autenticación
let isAuthenticated = false;

// ===== FUNCIONES DE ACCESO AL ESTADO =====

// Obtener empleados activos (no de vacaciones)
function getActiveEmployees() {
    // AHORA MOSTRAMOS A TODOS, las ausencias se visualizan en la parrilla.
    return employees;
}

// Actualizar estadísticas (función placeholder para compatibilidad)
function updateStats() {
    // Stats eliminadas completamente - solo para debug interno
    const activeEmployees = getActiveEmployees();
    // console.log(`📊 ${activeEmployees.length} empleados activos en la semana`);
}
