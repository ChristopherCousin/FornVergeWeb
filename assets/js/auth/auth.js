// ================================
// SISTEMA DE AUTENTICACIÓN
// ================================

import { fornDB } from '../config/supabase.js';
import { DOM_SELECTORS, STORAGE_KEYS, FALLBACK_CODES } from '../config/constants.js';
import { showNotification } from '../utils/notifications.js';

// Variable global del empleado actual
export let currentEmployee = null;

/**
 * Inicializar sistema de autenticación
 */
export function initAuth() {
    // Configurar formulario de login
    const loginForm = document.querySelector(DOM_SELECTORS.loginForm);
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Configurar botón de logout
    const logoutBtn = document.querySelector(DOM_SELECTORS.logoutBtn);
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Verificar sesión existente
    checkExistingSession();
}

/**
 * Manejar proceso de login
 */
async function handleLogin(e) {
    e.preventDefault();
    const accessCode = document.querySelector(DOM_SELECTORS.accessCode).value;
    
    console.log('🔍 Intentando autenticar con código:', accessCode);
    
    try {
        // Intentar autenticación con Supabase primero
        const employee = await fornDB.authenticateEmployee(accessCode);
        console.log('👤 Datos del empleado desde Supabase:', employee);
        
        if (employee) {
            await authenticateSuccessful(employee, 'supabase');
        } else {
            throw new Error('Credenciales inválidas en Supabase');
        }
    } catch (error) {
        console.error('❌ Error de autenticación Supabase:', error);
        
        // Fallback al sistema local
        const isValidCode = FALLBACK_CODES.includes(accessCode);
        if (isValidCode) {
            await authenticateWithFallback(accessCode);
        } else {
            showAuthError();
        }
    }
}

/**
 * Autenticación exitosa - configurar sesión
 */
async function authenticateSuccessful(employee, source = 'supabase') {
    currentEmployee = {
        name: employee.name,
        emoji: employee.emoji,
        id: employee.employee_id,
        role: employee.role,
        supabase_id: employee.id,
        source: source
    };
    
    console.log('✅ Empleado autenticado:', currentEmployee);
    
    // Cambiar pantallas
    showDashboard();
    
    // Guardar sesión
    saveSession();
    
    // Mostrar notificación de bienvenida
    const sourceText = source === 'supabase' ? '' : ' (Modo local)';
    showNotification(`¡Bienvenida ${currentEmployee.name}! 👋${sourceText}`, 'success');
    
    // Notificar a otros módulos que el usuario se autenticó
    document.dispatchEvent(new CustomEvent('userAuthenticated', { 
        detail: currentEmployee 
    }));
}

/**
 * Autenticación con datos locales (fallback)
 */
async function authenticateWithFallback(accessCode) {
    // Crear datos básicos para fallback
    const fallbackEmployee = {
        name: getFallbackName(accessCode),
        emoji: getFallbackEmoji(accessCode),
        employee_id: accessCode.replace('2025', ''),
        role: accessCode === 'adminforn2025' ? 'admin' : 'employee',
        id: `fallback-${accessCode}`
    };
    
    await authenticateSuccessful(fallbackEmployee, 'local');
}

/**
 * Mostrar error de autenticación
 */
function showAuthError() {
    const errorElement = document.querySelector(DOM_SELECTORS.loginError);
    if (errorElement) {
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 3000);
    }
}

/**
 * Cambiar de pantalla de login a dashboard
 */
function showDashboard() {
    const loginScreen = document.querySelector(DOM_SELECTORS.loginScreen);
    const dashboard = document.querySelector(DOM_SELECTORS.employeeDashboard);
    
    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
}

/**
 * Guardar sesión en localStorage
 */
function saveSession() {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_ACCESS, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_EMPLOYEE, JSON.stringify(currentEmployee));
    localStorage.setItem(STORAGE_KEYS.LAST_ACCESS, new Date().toLocaleString('es-ES'));
}

/**
 * Manejar logout
 */
function handleLogout() {
    // Limpiar datos
    currentEmployee = null;
    
    // Limpiar localStorage
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEE_ACCESS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_EMPLOYEE);
    
    // Recargar página
    location.reload();
}

/**
 * Verificar si hay una sesión existente
 */
async function checkExistingSession() {
    const hasAccess = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ACCESS);
    const savedEmployee = localStorage.getItem(STORAGE_KEYS.CURRENT_EMPLOYEE);
    
    if (hasAccess === 'true' && savedEmployee) {
        try {
            currentEmployee = JSON.parse(savedEmployee);
            showDashboard();
            
            // Notificar que hay una sesión activa
            document.dispatchEvent(new CustomEvent('sessionRestored', { 
                detail: currentEmployee 
            }));
            
            console.log('🔄 Sesión restaurada:', currentEmployee);
        } catch (error) {
            console.error('Error restaurando sesión:', error);
            handleLogout();
        }
    }
}

/**
 * Obtener datos de fallback para nombres
 */
function getFallbackName(code) {
    const names = {
        'bryan2025': 'BRYAN',
        'raquel2025': 'RAQUEL', 
        'maria2025': 'MARÍA',
        'xisca2025': 'XISCA',
        'andrea2025': 'ANDREA',
        'adminforn2025': 'ADMINISTRADOR'
    };
    return names[code] || 'EMPLEADO';
}

/**
 * Obtener emoji de fallback
 */
function getFallbackEmoji(code) {
    const emojis = {
        'bryan2025': '👨‍💼',
        'raquel2025': '👩‍💼', 
        'maria2025': '👩‍💼',
        'xisca2025': '👩‍💼',
        'andrea2025': '👩‍💼',
        'adminforn2025': '👔'
    };
    return emojis[code] || '👤';
}

/**
 * Obtener empleado actual
 */
export function getCurrentEmployee() {
    return currentEmployee;
} 