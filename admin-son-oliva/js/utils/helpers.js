/* Forn Verge - Funciones Auxiliares - MASSA SON OLIVA */

/**
 * Función debounce para evitar múltiples llamadas consecutivas
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función con debounce aplicado
 */
function debounce(func, wait) {
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
 * Fuerza el redibujado del grid cuando cambia el tamaño de pantalla
 */
function forceGridReflow() {
    const container = document.getElementById('weekGridContainer');
    if (container && container.children.length > 0) {
        console.log('🔄 Forzando redibujado del grid por cambio de tamaño');
        // Llamar a renderWeekFullView del módulo renderer
        if (window.renderWeekFullView) {
            window.renderWeekFullView();
        }
    }
}

/**
 * Inicializa la vista por defecto (semana completa)
 */
function initDefaultView() {
    // Solo inicializar vista de semana
    if (window.renderWeekFullView) {
        window.renderWeekFullView();
    }
    if (window.updateStatus) {
        window.updateStatus('Vista de semana completa 📋');
    }
    if (window.updateStats) {
        window.updateStats();
    }
}

// Exportar al scope global para compatibilidad
window.debounce = debounce;
window.forceGridReflow = forceGridReflow;
window.initDefaultView = initDefaultView;

