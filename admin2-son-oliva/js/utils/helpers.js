/**
 * FUNCIONES AUXILIARES - FORN VERGE
 * ==================================
 * Funciones de utilidad general para toda la aplicación
 */

/**
 * Actualiza el estado en la interfaz
 * @param {string} status - Estado a mostrar
 */
export function updateStatus(status) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

/**
 * Muestra el estado de carga
 */
export function showLoading() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
}

/**
 * Oculta el estado de carga
 */
export function hideLoading() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
}

/**
 * Muestra una notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 * @param {number} duration - Duración en ms
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Usar SweetAlert2 si está disponible
    if (window.Swal) {
        const icon = type === 'success' ? 'success' : 
                    type === 'error' ? 'error' : 
                    type === 'warning' ? 'warning' : 'info';
        
        window.Swal.fire({
            toast: true,
            position: 'top-end',
            icon: icon,
            title: message,
            showConfirmButton: false,
            timer: duration
        });
    } else {
        // Fallback a console
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * Muestra el estado de guardado exitoso
 */
export function showSaveSuccess() {
    const saveStatus = document.getElementById('saveStatus');
    if (saveStatus) {
        saveStatus.classList.remove('hidden');
        setTimeout(() => {
            saveStatus.classList.add('hidden');
        }, 3000);
    }
}

/**
 * Debounce - Retrasa la ejecución de una función
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle - Limita la frecuencia de ejecución de una función
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} Función throttled
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback para navegadores más antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (err) {
            document.body.removeChild(textArea);
            return false;
        }
    }
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Capitaliza la primera letra de una cadena
 * @param {string} str - Cadena a capitalizar
 * @returns {string} Cadena capitalizada
 */
export function capitalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formatea un número de horas para mostrar
 * @param {number} hours - Número de horas
 * @returns {string} Horas formateadas
 */
export function formatHours(hours) {
    if (typeof hours !== 'number' || isNaN(hours)) return '0h';
    
    if (hours === 0) return '0h';
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
        return `${wholeHours}h`;
    } else {
        return `${wholeHours}h ${minutes}m`;
    }
}

/**
 * Ordena empleados alfabéticamente
 * @param {Array} employees - Array de empleados
 * @returns {Array} Empleados ordenados
 */
export function sortEmployeesAlphabetically(employees) {
    if (!Array.isArray(employees)) return [];
    
    return employees.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

/**
 * Busca un empleado por ID
 * @param {Array} employees - Array de empleados
 * @param {string} id - ID del empleado
 * @returns {Object|null} Empleado encontrado o null
 */
export function findEmployeeById(employees, id) {
    if (!Array.isArray(employees) || !id) return null;
    return employees.find(emp => emp.id === id) || null;
}

/**
 * Busca un empleado por nombre
 * @param {Array} employees - Array de empleados
 * @param {string} name - Nombre del empleado
 * @returns {Object|null} Empleado encontrado o null
 */
export function findEmployeeByName(employees, name) {
    if (!Array.isArray(employees) || !name) return null;
    return employees.find(emp => 
        emp.name && emp.name.toLowerCase() === name.toLowerCase()
    ) || null;
}

/**
 * Espera un tiempo determinado
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise} Promesa que se resuelve después del tiempo
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica si un elemento está visible en el viewport
 * @param {HTMLElement} element - Elemento a verificar
 * @returns {boolean} True si está visible
 */
export function isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
