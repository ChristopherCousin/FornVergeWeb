/**
 * CONTROL ANUAL CONTROLLER - Controlador Principal
 * =================================================
 * Orquesta la inicialización y coordinación del sistema de control anual
 */

class ControlAnualController {
    constructor() {
        this.supabase = null;
        this.convenioAnual = null;
        this.ausenciasManager = null;
    }

    async init() {
        console.log('📊 Iniciando Control Anual...');
        
        // Esperar autenticación y local
        await this.esperarAutenticacion();
        
        // Inicializar Supabase
        await this.inicializarSupabase();
        
        // Cargar empleados en StateManager
        await this.cargarEmpleados();
        
        // Inicializar sistema anual
        await this.inicializarSistemaAnual();
        
        console.log('✅ Control Anual listo');
    }

    async esperarAutenticacion() {
        // Esperar a que el mainContent esté visible
        while (!document.getElementById('mainContent') || 
               document.getElementById('mainContent').style.display === 'none') {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // IMPORTANTE: Esperar a que el local esté seleccionado
        let intentos = 0;
        while (!getCurrentLocationId() && intentos < 50) {
            console.log('⏳ [ControlAnual] Esperando a que se seleccione el local...');
            await new Promise(resolve => setTimeout(resolve, 200));
            intentos++;
        }
        
        const locationId = getCurrentLocationId();
        const location = getCurrentLocation();
        
        if (!locationId) {
            console.error('❌ [ControlAnual] No se pudo obtener el local después de esperar');
        } else {
            console.log('✅ [ControlAnual] Local confirmado:', location?.location_name, '| ID:', locationId);
        }
    }

    async inicializarSupabase() {
        // Esperar a que el CLIENTE global de Supabase esté disponible
        let intentos = 0;
        while (intentos < 20) {
            if (window.supabase && typeof window.supabase.from === 'function') {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            intentos++;
        }
        
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            console.error('❌ Cliente global de Supabase no disponible después de esperar');
            return;
        }
        
        // Reutilizar la instancia global del CLIENTE de Supabase
        this.supabase = window.supabase;
        console.log('✅ Usando instancia global del cliente de Supabase');
    }

    async cargarEmpleados() {
        const locationId = getCurrentLocationId();
        
        if (!locationId) {
            console.error('❌ [ControlAnualController] No hay local seleccionado');
            window.stateManager.setEmpleados([]);
            return;
        }
        
        const { data: empleados } = await this.supabase
            .from('employees')
            .select('id, name, role, fecha_alta, fecha_inicio_computo, agora_employee_name, tarifa_hora, excluido_convenio, emoji')
            .neq('role', 'admin')
            .eq('location_id', locationId)
            .order('name');
        
        const empleadosArray = empleados || [];
        
        // Guardar en StateManager
        window.stateManager.setEmpleados(empleadosArray);
        
        console.log(`👥 ${empleadosArray.length} empleados cargados en StateManager`);
    }

    async inicializarSistemaAnual() {
        // Esperar a que ConvenioAnualManager esté disponible
        while (typeof ConvenioAnualManager === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        this.convenioAnual = new ConvenioAnualManager(this.supabase);
        await this.convenioAnual.init();
        
        // Hacer disponible globalmente (para compatibilidad temporal)
        window.controlAnualController = this;
    }

    async actualizarDatos() {
        console.log('🔄 Actualizando datos del convenio...');
        
        await this.convenioAnual.init();
        
        if (window.ausenciasManager) {
            await window.ausenciasManager.init();
        }
        
        // Notificar a los subscribers del StateManager
        window.stateManager.notify('convenio', { updated: true });
        
        console.log('✅ Datos actualizados');
    }
}

// Exportar a window
window.ControlAnualController = ControlAnualController;
