/**
 * CONTROL ANUAL INIT - Inicializador
 * ===================================
 * Inicializa y conecta todos los módulos del control anual
 */

// Función principal de inicialización
async function inicializarControlAnual() {
    console.log('📊 Iniciando Control Anual...');
    
    // Crear controller
    const controller = new window.ControlAnualController();
    await controller.init();
    
    // Crear UI
    const ui = new window.ControlAnualUI(controller);
    ui.crearPanel();
    
    // Crear gestor de eventos
    const events = new window.ControlAnualEvents(controller, ui);
    events.setup();
    
    // Hacer disponibles globalmente
    window.controlAnualController = controller;
    window.controlAnualUI = ui;
    window.controlAnualEvents = events;
    
    console.log('✅ Control Anual inicializado');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarControlAnual);
} else {
    inicializarControlAnual();
}
