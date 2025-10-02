/* Forn Verge - Configuración de event listeners - MASSA SON OLIVA */

function setupEventListeners() {
    // saveAll button no existe en el header simplificado - guardado automático activado
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    document.getElementById('addShift').addEventListener('click', addShiftFromModal);
    
    // Navegación de semanas
    document.getElementById('prevWeek').addEventListener('click', goToPreviousWeek);
    document.getElementById('nextWeek').addEventListener('click', goToNextWeek);
    document.getElementById('weekSelector').addEventListener('change', onWeekSelectChange);
    
    // Vista única de semana - sin cambios de vista
    
    // Gestión de vacaciones ELIMINADA
    
    // Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
    
    document.getElementById('shiftModal').addEventListener('click', (e) => {
        if (e.target.id === 'shiftModal') closeModal();
    });
    
    // El modal de vacaciones ya no existe
    
    // ✅ DETECTAR CAMBIOS DE ORIENTACIÓN Y REDIMENSIONAMIENTO
    window.addEventListener('resize', debounce(forceGridReflow, 300));
    window.addEventListener('orientationchange', () => {
        setTimeout(forceGridReflow, 500); // Delay para orientación
    });
    
    // Generador automático
    const btnSugerirHorario = document.getElementById('btnSugerirHorario');
    if (btnSugerirHorario) {
        btnSugerirHorario.addEventListener('click', handleSugerirHorario);
    }
    
    // Botones del modo borrador
    document.getElementById('btnSaveDraft')?.addEventListener('click', handleSaveDraft);
    document.getElementById('btnDiscardDraft')?.addEventListener('click', handleDiscardDraft);
    // Ajustes del generador
    document.getElementById('btnGeneratorSettings')?.addEventListener('click', openGeneratorSettings);
    
    console.log('✅ Event listeners configurados con detección de resize');
}
