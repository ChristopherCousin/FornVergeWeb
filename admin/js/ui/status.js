/* Forn Verge - Gestión de Estados de UI - MASSA SON OLIVA */

// Actualizar el texto de estado en el header
function updateStatus(status) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// Mostrar indicador de carga
function showLoading() {
    const loadingState = document.getElementById('loadingState');
    const weekFullView = document.getElementById('weekFullView');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (weekFullView) weekFullView.classList.add('hidden');
}

// Ocultar indicador de carga
function hideLoading() {
    const loadingState = document.getElementById('loadingState');
    const weekFullView = document.getElementById('weekFullView');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (weekFullView) weekFullView.classList.remove('hidden');
}

// Mostrar mensaje de guardado exitoso
function showSaveSuccess() {
    const saveStatus = document.getElementById('saveStatus');
    if (!saveStatus) return;
    
    saveStatus.classList.remove('hidden');
    
    setTimeout(() => {
        saveStatus.classList.add('hidden');
    }, 4000);
}
