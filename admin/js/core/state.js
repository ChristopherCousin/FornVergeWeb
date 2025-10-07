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

// Sistema multi-usuario y multi-local (NUEVO)
let currentUser = null;
let currentLocation = null;
let authSystem = null;
let locationSelector = null;
let permissionsManager = null;

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

// ===== FUNCIONES DE USUARIO Y LOCATION (NUEVO SISTEMA) =====

function getCurrentUser() {
    return currentUser || window.currentUser || null;
}

function getCurrentLocation() {
    return currentLocation || window.currentLocation || null;
}

function getCurrentLocationId() {
    const loc = getCurrentLocation();
    return loc?.location_id || loc?.id || null;
}

function setCurrentUser(user) {
    currentUser = user;
    window.currentUser = user;
}

function setCurrentLocation(location) {
    currentLocation = location;
    window.currentLocation = location;
}

// Helper para verificar permisos
function hasPermission(module, action) {
    if (window.permissionsManager) {
        return window.permissionsManager.hasPermission(module, action);
    }
    return false;
}

function isOwner() {
    const user = getCurrentUser();
    return user?.role === 'owner';
}

function isManager() {
    const user = getCurrentUser();
    return user?.role === 'manager';
}
