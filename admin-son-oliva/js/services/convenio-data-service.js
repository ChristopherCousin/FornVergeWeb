/**
 * SERVICIO DE CARGA DE DATOS PARA CONVENIO
 * =========================================
 * Maneja todas las consultas a Supabase para el análisis del convenio
 */

class ConvenioDataService {
    constructor(supabase, convenioConfig) {
        this.supabase = supabase;
        this.convenioConfig = convenioConfig;
    }

    /**
     * Carga empleados de Son Oliva (excluye admins)
     */
    async cargarEmpleados() {
        const { data: empleados } = await this.supabase
            .from('employees')
            .select('id, name, role, fecha_alta')
            .neq('role', 'admin')
            .eq('location_id', window.SON_OLIVA_LOCATION_ID)
            .order('name');
        
        return empleados || [];
    }

    /**
     * Carga fichajes desde inicio de año
     */
    async cargarFichajes() {
        const { data: fichajes } = await this.supabase
            .from('fichajes')
            .select('*')
            .gte('fecha', this.convenioConfig.inicio_año)
            .order('fecha', { ascending: false });
        
        return fichajes || [];
    }

    /**
     * Carga ausencias aprobadas del año
     */
    async cargarAusencias() {
        const { data: ausencias } = await this.supabase
            .from('ausencias')
            .select('*')
            .gte('fecha_inicio', this.convenioConfig.inicio_año)
            .eq('estado', 'aprobado')
            .order('fecha_inicio');
        
        return ausencias || [];
    }

    /**
     * Agrupa fichajes por empleado (para debug)
     */
    agruparFichajesPorEmpleado(fichajes, empleados) {
        const fichajesPorEmpleado = {};
        
        fichajes.forEach(fichaje => {
            const empleadoId = fichaje.empleado_id;
            if (!fichajesPorEmpleado[empleadoId]) {
                fichajesPorEmpleado[empleadoId] = [];
            }
            fichajesPorEmpleado[empleadoId].push(fichaje);
        });
        
        return fichajesPorEmpleado;
    }
}

// Exportar a window
window.ConvenioDataService = ConvenioDataService;
