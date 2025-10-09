/**
 * LIQUIDACIONES INIT - Inicializador del Sistema
 * ===============================================
 * Inicializa todos los módulos de liquidaciones
 */

const inicializarLiquidaciones = async () => {
    if (window.liquidacionesPanel || window.inicializandoLiquidaciones) {
        return;
    }
    
    window.inicializandoLiquidaciones = true;
    console.log('💰 Iniciando sistema de liquidaciones...');
    
    // VERIFICAR PERMISOS PRIMERO
    const user = getCurrentUser();
    if (!user) {
        console.log('⏳ Esperando autenticación para verificar permisos...');
        window.inicializandoLiquidaciones = false;
        setTimeout(inicializarLiquidaciones, 500);
        return;
    }
    
    // SOLO el owner puede ver liquidaciones
    if (!hasPermission('liquidaciones', 'ver')) {
        console.log('🔒 Usuario sin permisos de liquidaciones - Panel no se mostrará');
        window.inicializandoLiquidaciones = false;
        return;
    }
    
    // Esperar a que StateManager y Supabase estén disponibles
    let intentos = 0;
    const maxIntentos = 20;
    
    while (intentos < maxIntentos) {
        if (window.stateManager && 
            window.supabase && 
            typeof window.supabase.from === 'function') {
            
            try {
                console.log('✅ Dependencias de liquidaciones disponibles, inicializando...');
                
                // Crear instancias de los servicios
                const service = new window.LiquidacionesService(window.supabase);
                const formatter = new window.LiquidacionesFormatter();
                
                // Crear instancias de los módulos UI
                window.liquidacionesPanel = new window.LiquidacionesPanel(service, formatter);
                window.liquidacionesModalPago = new window.LiquidacionesModalPago(service, formatter);
                window.liquidacionesModalHistorial = new window.LiquidacionesModalHistorial(service, formatter);
                window.liquidacionesModalEditar = new window.LiquidacionesModalEditar(service, formatter);
                
                // Crear panel
                window.liquidacionesPanel.crear();
                
                // Renderizar con un pequeño delay para asegurar que el DOM esté listo
                setTimeout(async () => {
                    try {
                        await window.liquidacionesPanel.renderBalances();
                        
                        // Marcar como completamente cargado
                        window.liquidacionesPanel.datosCompletos = true;
                        
                        // IMPORTANTE: Refrescar Control Anual ahora que tenemos datos de liquidaciones
                        if (window.controlAnualUI) {
                            window.controlAnualUI.actualizarEstadoEmpleados();
                        }
                    } catch (err) {
                        console.error('❌ Error renderizando balances:', err);
                    }
                }, 500);
                
                console.log('✅ Sistema de liquidaciones inicializado correctamente');
                window.inicializandoLiquidaciones = false;
                return;
                
            } catch (error) {
                console.error('❌ Error inicializando liquidaciones:', error);
                window.inicializandoLiquidaciones = false;
                break;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        intentos++;
    }
    
    console.error('❌ No se pudo inicializar el sistema de liquidaciones');
    window.inicializandoLiquidaciones = false;
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(inicializarLiquidaciones, 2000); // Esperar 2s para que otros sistemas se inicialicen
});
