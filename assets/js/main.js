// ================================
// ARCHIVO PRINCIPAL - COORDINADOR
// ================================

import { initAuth, getCurrentEmployee } from './auth/auth.js';
import { setupAdminDashboard } from './dashboard/admin.js';
import { setupEmployeeDashboard } from './dashboard/employee.js';
import { updateDateTime, initTimeUpdater } from './utils/dates.js';
import { showNotification } from './utils/notifications.js';

/**
 * Inicializar aplicación completa
 */
async function initApp() {
    console.log('🚀 Iniciando aplicación Forn Verge...');
    
    try {
        // 1. Inicializar sistema de autenticación
        initAuth();
        
        // 2. Configurar actualizador de tiempo
        initTimeUpdater();
        
        // 3. Configurar eventos globales
        setupGlobalEvents();
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
        showNotification('Error inicializando la aplicación', 'error');
    }
}

/**
 * Configurar eventos globales de la aplicación
 */
function setupGlobalEvents() {
    // Evento: Usuario autenticado
    document.addEventListener('userAuthenticated', async (event) => {
        const employee = event.detail;
        console.log('🔓 Usuario autenticado, configurando dashboard...', employee);
        
        try {
            // Configurar dashboard según el rol
            if (employee.role === 'admin') {
                await setupAdminDashboard(employee);
            } else {
                await setupEmployeeDashboard(employee);
            }
            
            // Actualizar fecha/hora
            updateDateTime();
            
        } catch (error) {
            console.error('Error configurando dashboard:', error);
            showNotification('Error cargando dashboard', 'error');
        }
    });
    
    // Evento: Sesión restaurada
    document.addEventListener('sessionRestored', async (event) => {
        const employee = event.detail;
        console.log('🔄 Sesión restaurada, reconfigurando dashboard...', employee);
        
        try {
            // Reconfigurar dashboard
            if (employee.role === 'admin') {
                await setupAdminDashboard(employee);
            } else {
                await setupEmployeeDashboard(employee);
            }
            
            // Actualizar tiempo
            updateDateTime();
            
            // Mostrar último acceso
            updateLastAccess();
            
        } catch (error) {
            console.error('Error restaurando sesión:', error);
            showNotification('Error restaurando sesión', 'error');
        }
    });
    
    // Evento: Solicitud de actualización
    document.addEventListener('refreshRequested', async () => {
        const currentEmployee = getCurrentEmployee();
        if (currentEmployee) {
            console.log('🔄 Refrescando datos...');
            
            if (currentEmployee.role === 'admin') {
                await setupAdminDashboard(currentEmployee);
            } else {
                await setupEmployeeDashboard(currentEmployee);
            }
            
            showNotification('Datos actualizados', 'success');
        }
    });
    
    // Manejo de errores globales
    window.addEventListener('error', (event) => {
        console.error('Error global capturado:', event.error);
        showNotification('Ha ocurrido un error inesperado', 'error');
    });
    
    // Manejo de promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Promesa rechazada:', event.reason);
        showNotification('Error de conexión', 'error');
    });
}

/**
 * Actualizar información de último acceso
 */
function updateLastAccess() {
    const lastAccess = localStorage.getItem('lastAccess');
    const lastAccessEl = document.getElementById('lastAccess');
    
    if (lastAccessEl && lastAccess) {
        lastAccessEl.textContent = lastAccess;
    }
}

/**
 * Estado de la aplicación
 */
const AppState = {
    initialized: false,
    currentUser: null,
    isOnline: navigator.onLine
};

/**
 * Verificar estado de conexión
 */
function checkConnectionStatus() {
    window.addEventListener('online', () => {
        AppState.isOnline = true;
        showNotification('Conexión restaurada', 'success');
        console.log('🌐 Conexión restaurada');
    });
    
    window.addEventListener('offline', () => {
        AppState.isOnline = false;
        showNotification('Sin conexión a internet', 'warning');
        console.log('🚫 Conexión perdida');
    });
}

/**
 * Funciones de utilidad global
 */
window.FornApp = {
    /**
     * Obtener estado actual de la aplicación
     */
    getState: () => AppState,
    
    /**
     * Verificar si está online
     */
    isOnline: () => AppState.isOnline,
    
    /**
     * Obtener empleado actual
     */
    getCurrentUser: () => getCurrentEmployee(),
    
    /**
     * Mostrar notificación
     */
    notify: (message, type = 'info') => showNotification(message, type)
};

// ================================
// INICIALIZACIÓN CUANDO DOM ESTÁ LISTO
// ================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM ya está cargado
    initApp();
}

// Verificar conexión
checkConnectionStatus(); 