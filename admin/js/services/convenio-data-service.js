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
     * Carga empleados del local actual (excluye admins)
     * Incluye agora_employee_name para mapeo
     */
    async cargarEmpleados() {
        const locationId = getCurrentLocationId();
        
        if (!locationId) {
            console.error('❌ [ConvenioDataService] No hay local seleccionado');
            return [];
        }
        
        const { data: empleados } = await this.supabase
            .from('employees')
            .select('id, name, role, fecha_alta, fecha_inicio_computo, agora_employee_name, tarifa_hora, excluido_convenio')
            .neq('role', 'admin')
            .eq('location_id', locationId)
            .order('name');
        
        console.log(`👥 [ConvenioDataService] ${empleados?.length || 0} empleados cargados del local`);
        
        return empleados || [];
    }

    /**
     * Carga fichajes desde inicio de año DESDE LA API DE ÁGORA
     * Mapea automáticamente usando agora_employee_name
     */
    async cargarFichajes() {
        console.log('📡 [ConvenioDataService] Cargando fichajes desde API de Ágora...');
        
        try {
            // 1. Cargar empleados primero (necesarios para el mapeo)
            const empleados = await this.cargarEmpleados();
            
            // 2. Obtener fichajes crudos de Ágora
            const fechaHasta = new Date().toISOString().split('T')[0];
            const fechaDesde = this.convenioConfig.inicio_año;
            
            const agoraApi = new window.AgoraApiService();
            const fichajesRaw = await agoraApi.obtenerFichajes(fechaDesde, fechaHasta);
            
            console.log(`✅ [Ágora API] Recibidos ${fichajesRaw.length} fichajes`);
            
            // 3. Transformar y mapear
            const fichajes = fichajesRaw.map(fichaje => {
                const fechaInicio = new Date(fichaje.FechaInicio);
                const fecha = fechaInicio.toISOString().split('T')[0];
                const horas_trabajadas = parseFloat((fichaje.DuracionMinutos / 60).toFixed(2));
                
                // Buscar empleado por agora_employee_name
                const empleado = empleados.find(emp => 
                    this.normalizarNombre(emp.agora_employee_name || emp.name) === this.normalizarNombre(fichaje.Empleado)
                );
                
                return {
                    empleado_id: empleado ? empleado.id : null,
                    empleado_nombre: fichaje.Empleado,
                    fecha: fecha,
                    entrada: fichaje.FechaInicio,
                    salida: fichaje.FechaFin,
                    horas_trabajadas: horas_trabajadas
                };
            }).filter(f => f.empleado_id !== null); // Filtrar fichajes sin mapeo
            
            console.log(`✅ [ConvenioDataService] Fichajes mapeados: ${fichajes.length}`);
            
            return fichajes;
        } catch (error) {
            console.error('❌ [ConvenioDataService] Error cargando fichajes:', error);
            throw new Error('No se pudieron cargar los fichajes desde la API de Ágora');
        }
    }
    
    /**
     * Normaliza nombres para comparaciones
     */
    normalizarNombre(nombre) {
        return nombre.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
