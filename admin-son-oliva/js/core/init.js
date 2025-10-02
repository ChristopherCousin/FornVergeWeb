/* Forn Verge - Función initApp y configuración inicial - MASSA SON OLIVA */

async function initApp() {
    // console.log('🚀 Iniciando Gestión de Horarios...');
    
    // Calcular semana actual dinámicamente
    currentWeekStart = getCurrentWeek();
    console.log(`📅 Semana calculada automáticamente: ${currentWeekStart}`);
    
    // Regenerar días para la semana actual
    DAYS = generateDaysForWeek(currentWeekStart);
    
    // Verificar autenticación al inicio
    checkAuthentication();
    
    if (!isAuthenticated) {
        setupLoginListeners();
        return;
    }
    
    // Solo cargar datos si está autenticado
    updateStatus('Cargando...');
    showLoading();
    
    setupWeekSelector();
    updateWeekDisplay();
    // loadVacationState(); // ELIMINADO - Ya no se usa el sistema antiguo
    
    await loadEmployees();
    await loadCurrentSchedules();
    
    // console.log('🔍 ScheduleData después de cargar:', scheduleData);
    
    renderEmployees();
    setupEventListeners();
    
    // Inicializar con vista de semana por defecto
    initDefaultView();
    
    hideLoading();
    updateStatus('Listo ✨');
}
