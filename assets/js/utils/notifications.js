// ================================
// SISTEMA DE NOTIFICACIONES
// ================================

import { NOTIFICATION_TYPES } from '../config/constants.js';

/**
 * Mostrar notificación al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, info, warning)
 * @param {number} duration - Duración en ms (por defecto 3000)
 */
export function showNotification(message, type = NOTIFICATION_TYPES.INFO, duration = 3000) {
    // Crear elemento de notificación si no existe
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
    }

    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `
        transform transition-all duration-300 ease-in-out
        max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto
        flex ring-1 ring-black ring-opacity-5
        ${getNotificationStyles(type)}
    `;

    notification.innerHTML = `
        <div class="flex-1 w-0 p-4">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    ${getNotificationIcon(type)}
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-900">
                        ${message}
                    </p>
                </div>
            </div>
        </div>
        <div class="flex border-l border-gray-200">
            <button onclick="this.parentElement.parentElement.remove()" 
                    class="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none">
                ✕
            </button>
        </div>
    `;

    // Añadir al container
    container.appendChild(notification);

    // Auto-eliminar después del tiempo especificado
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
}

function getNotificationStyles(type) {
    switch (type) {
        case NOTIFICATION_TYPES.SUCCESS:
            return 'border-l-4 border-green-400';
        case NOTIFICATION_TYPES.ERROR:
            return 'border-l-4 border-red-400';
        case NOTIFICATION_TYPES.WARNING:
            return 'border-l-4 border-yellow-400';
        case NOTIFICATION_TYPES.INFO:
        default:
            return 'border-l-4 border-blue-400';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case NOTIFICATION_TYPES.SUCCESS:
            return '<i class="fas fa-check-circle text-green-400"></i>';
        case NOTIFICATION_TYPES.ERROR:
            return '<i class="fas fa-exclamation-circle text-red-400"></i>';
        case NOTIFICATION_TYPES.WARNING:
            return '<i class="fas fa-exclamation-triangle text-yellow-400"></i>';
        case NOTIFICATION_TYPES.INFO:
        default:
            return '<i class="fas fa-info-circle text-blue-400"></i>';
    }
} 