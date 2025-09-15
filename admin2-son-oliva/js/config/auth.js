/**
 * SISTEMA DE AUTENTICACIÓN - FORN VERGE
 * ======================================
 * Manejo centralizado de autenticación y autorización
 */

import { AUTH_CONFIG } from './constants.js';

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.checkStoredAuth();
    }

    /**
     * Función HASH para la contraseña
     */
    async sha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Verifica la autenticación almacenada
     */
    checkStoredAuth() {
        const stored = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
        const rememberMe = localStorage.getItem(AUTH_CONFIG.REMEMBER_KEY) === 'true';
        
        if (stored && rememberMe) {
            this.isAuthenticated = stored === 'authenticated';
        } else {
            this.isAuthenticated = false;
        }
    }

    /**
     * Intenta autenticar con una contraseña
     * @param {string} password - Contraseña a verificar
     * @param {boolean} remember - Si recordar la sesión
     * @returns {boolean} True si la autenticación es exitosa
     */
    async authenticate(password, remember = false) {
        try {
            const hashedPassword = await this.sha256(password);
            
            if (hashedPassword === AUTH_CONFIG.PASSWORD_HASH) {
                this.isAuthenticated = true;
                
                if (remember) {
                    localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, 'authenticated');
                    localStorage.setItem(AUTH_CONFIG.REMEMBER_KEY, 'true');
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error durante la autenticación:', error);
            return false;
        }
    }

    /**
     * Cierra la sesión
     */
    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
        localStorage.removeItem(AUTH_CONFIG.REMEMBER_KEY);
    }

    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} True si está autenticado
     */
    isLoggedIn() {
        return this.isAuthenticated;
    }

    /**
     * Muestra el modal de login
     */
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'block';
            // Focus en el input de contraseña
            const passwordInput = document.getElementById('passwordInput');
            if (passwordInput) {
                setTimeout(() => passwordInput.focus(), 100);
            }
        }
    }

    /**
     * Oculta el modal de login
     */
    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Muestra el contenido principal
     */
    showMainContent() {
        const header = document.getElementById('mainHeader');
        const content = document.getElementById('mainContent');
        
        if (header) header.style.display = 'block';
        if (content) content.style.display = 'block';
    }

    /**
     * Oculta el contenido principal
     */
    hideMainContent() {
        const header = document.getElementById('mainHeader');
        const content = document.getElementById('mainContent');
        
        if (header) header.style.display = 'none';
        if (content) content.style.display = 'none';
    }

    /**
     * Configura los event listeners para el login
     */
    setupLoginListeners() {
        const loginForm = document.getElementById('loginForm');
        const passwordInput = document.getElementById('passwordInput');
        const rememberCheckbox = document.getElementById('rememberMe');
        const loginError = document.getElementById('loginError');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const password = passwordInput?.value || '';
                const remember = rememberCheckbox?.checked || false;
                
                if (await this.authenticate(password, remember)) {
                    this.hideLoginModal();
                    this.showMainContent();
                    
                    // Disparar evento personalizado para inicializar la app
                    window.dispatchEvent(new CustomEvent('authSuccess'));
                } else {
                    if (loginError) {
                        loginError.classList.remove('hidden');
                    }
                    if (passwordInput) {
                        passwordInput.value = '';
                        passwordInput.focus();
                    }
                }
            });
        }

        // Limpiar error al escribir
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                if (loginError) {
                    loginError.classList.add('hidden');
                }
            });
        }
    }

    /**
     * Inicializa el sistema de autenticación
     */
    init() {
        if (this.isAuthenticated) {
            this.showMainContent();
        } else {
            this.hideMainContent();
            this.showLoginModal();
            this.setupLoginListeners();
        }
    }
}

// Instancia única del gestor de autenticación
export const authManager = new AuthManager();
