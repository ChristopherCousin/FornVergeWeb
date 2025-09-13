/**
 * GESTIÓN DE AUSENCIAS - FORN VERGE
 * ==================================
 * Sistema para gestionar vacaciones, bajas, permisos desde la web
 * Se integra con el Control Anual del Convenio
 */

class AusenciasManager {
    constructor(supabase) {
        this.supabase = supabase;
        this.empleados = [];
        this.ausencias = [];
        this.listenersSetup = false; // Evitar event listeners duplicados
        this.formSubmitting = false; // Evitar envío doble del formulario
        this.PROMEDIO_DIARIO_CONVENIO = 40 / 7; // Aprox 5.714

        // Inicializar
        this.init();
    }

    async init() {
        // console.log('🏖️ Inicializando Gestión de Ausencias...');
        
        try {
            // Solo configurar event listeners una vez
            if (!this.listenersSetup) {
                this.setupEventListeners();
                this.listenersSetup = true;
            }
            
            await this.cargarEmpleados();
            await this.cargarAusencias();
            this.cargarEmpleadosEnSelect();
            this.actualizarListaAusencias();
            
            // console.log('✅ Gestión de Ausencias inicializada');
            
        } catch (error) {
            console.error('❌ Error inicializando Gestión de Ausencias:', error);
        }
    }

    setupEventListeners() {
        // Abrir modal
        const btnAbrirAusencias = document.getElementById('btnGestionarAusencias');
        if (btnAbrirAusencias) {
            btnAbrirAusencias.addEventListener('click', () => this.abrirModal());
        }

        // Cerrar modal
        const btnCerrar1 = document.getElementById('closeAusenciasModal');
        const btnCerrar2 = document.getElementById('cerrarAusenciasModal');
        
        if (btnCerrar1) btnCerrar1.addEventListener('click', () => this.cerrarModal());
        if (btnCerrar2) btnCerrar2.addEventListener('click', () => this.cerrarModal());

        // Formulario nueva ausencia
        const form = document.getElementById('nuevaAusenciaForm');
        if (form) {
            form.addEventListener('submit', (e) => this.crearAusencia(e));
        }

        // Cerrar modal al hacer click fuera
        const modal = document.getElementById('ausenciasModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.cerrarModal();
            });
        }

        // Auto-completar fecha fin cuando se selecciona inicio
        const fechaInicio = document.getElementById('ausenciaFechaInicio');
        const fechaFin = document.getElementById('ausenciaFechaFin');
        
        if (fechaInicio && fechaFin) {
            fechaInicio.addEventListener('change', () => {
                if (fechaInicio.value && !fechaFin.value) {
                    fechaFin.value = fechaInicio.value;
                }
            });
        }
    }

    async cargarEmpleados() {
        const { data: empleados } = await this.supabase
            .from('employees')
            .select('id, name, role')
            .neq('role', 'admin')
            .order('name');
        
        this.empleados = empleados || [];
        // console.log(`👥 ${this.empleados.length} empleados cargados para ausencias`);
    }

    async cargarAusencias() {
        const { data: ausencias } = await this.supabase
            .from('ausencias')
            .select(`
                *,
                employees(name)
            `)
            .gte('fecha_inicio', '2025-01-01')
            .order('fecha_inicio', { ascending: false });
        
        this.ausencias = (ausencias || []).map(a => ({
            ...a,
            empleado_nombre: a.employees?.name || 'Desconocido'
        }));
        
        // console.log(`🏖️ ${this.ausencias.length} ausencias cargadas`);
    }

    cargarEmpleadosEnSelect() {
        const select = document.getElementById('ausenciaEmpleado');
        if (!select) return;

        // Limpiar opciones existentes (excepto la primera)
        select.innerHTML = '<option value="">Seleccionar empleado...</option>';
        
        // Agregar empleados
        this.empleados.forEach(empleado => {
            const option = document.createElement('option');
            option.value = empleado.id;
            option.textContent = empleado.name;
            select.appendChild(option);
        });
    }

    async crearAusencia(event) {
        event.preventDefault();
        
        // Evitar envío doble del formulario
        if (this.formSubmitting) {
            console.log('⏳ Formulario ya se está enviando, evitando duplicación...');
            return;
        }
        
        this.formSubmitting = true;
        
        try {
            // Recoger datos del formulario
            const empleadoId = document.getElementById('ausenciaEmpleado').value;
            const fechaInicio = document.getElementById('ausenciaFechaInicio').value;
            const fechaFin = document.getElementById('ausenciaFechaFin').value;
            const tipo = document.getElementById('ausenciaTipo').value;
            const horasDia = 5.6;

            // Validaciones
            if (!empleadoId || !fechaInicio || !fechaFin || !tipo) {
                alert('Por favor completa todos los campos obligatorios');
                this.formSubmitting = false; // Resetear flag en caso de validación fallida
                return;
            }

            if (new Date(fechaFin) < new Date(fechaInicio)) {
                alert('La fecha de fin debe ser posterior o igual a la fecha de inicio');
                this.formSubmitting = false; // Resetear flag en caso de validación fallida
                return;
            }

            // Crear objeto ausencia
            const nuevaAusencia = {
                empleado_id: empleadoId,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                tipo: tipo,
                horas_teoricas_dia: horasDia,
                estado: 'aprobado', // Por defecto aprobado desde admin
                creado_por: 'admin'
            };

            console.log('📋 Creando ausencia:', nuevaAusencia);

            // Insertar en base de datos
            const { data, error } = await this.supabase
                .from('ausencias')
                .insert([nuevaAusencia])
                .select();

            if (error) {
                console.error('❌ Error creando ausencia:', error);
                alert('Error al crear la ausencia: ' + error.message);
                this.formSubmitting = false; // Resetear flag en caso de error
                return;
            }

            console.log('✅ Ausencia creada:', data);

            // Mostrar notificación
            this.mostrarNotificacion('Ausencia registrada correctamente', 'success');

            // Limpiar formulario
            document.getElementById('nuevaAusenciaForm').reset();

            // Recargar datos
            await this.cargarAusencias();
            this.actualizarListaAusencias();

            // Actualizar panel de control si está disponible
            if (window.controlAnualSimple && window.controlAnualSimple.convenioAnual) {
                await window.controlAnualSimple.convenioAnual.init();
                window.controlAnualSimple.actualizarEstadoEmpleados();
            }

        } catch (error) {
            console.error('❌ Error creando ausencia:', error);
            alert('Error inesperado al crear la ausencia');
        } finally {
            // Resetear flag para permitir nuevos envíos
            this.formSubmitting = false;
        }
    }

    async eliminarAusencia(ausenciaId) {
        if (!confirm('¿Estás seguro de eliminar esta ausencia?')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('ausencias')
                .delete()
                .eq('id', ausenciaId);

            if (error) {
                console.error('❌ Error eliminando ausencia:', error);
                alert('Error al eliminar la ausencia');
                return;
            }

            console.log('✅ Ausencia eliminada');
            this.mostrarNotificacion('Ausencia eliminada correctamente', 'success');

            // Recargar datos
            await this.cargarAusencias();
            this.actualizarListaAusencias();

            // Actualizar panel de control
            if (window.controlHorarios && window.controlHorarios.convenioAnual) {
                await window.controlHorarios.convenioAnual.init();
            }

        } catch (error) {
            console.error('❌ Error eliminando ausencia:', error);
            alert('Error inesperado al eliminar la ausencia');
        }
    }

    actualizarListaAusencias() {
        const lista = document.getElementById('listaAusencias');
        if (!lista) return;

        if (this.ausencias.length === 0) {
            lista.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-calendar-day text-3xl mb-2"></i>
                    <p>No hay ausencias registradas</p>
                </div>
            `;
            return;
        }

        lista.innerHTML = this.ausencias.map(ausencia => this.generarHTMLAusencia(ausencia)).join('');
    }

    generarHTMLAusencia(ausencia) {
        const fechaInicio = new Date(ausencia.fecha_inicio);
        const fechaFin = new Date(ausencia.fecha_fin);
        const hoy = new Date();
        
        const esActiva = hoy >= fechaInicio && hoy <= fechaFin;
        const diasRestantes = esActiva ? Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24)) : 0;
        const totalDias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
        const totalHoras = totalDias * (ausencia.horas_teoricas_dia || 8);
        
        // Iconos por tipo
        const iconos = {
            'vacaciones': '🏖️',
            'baja_medica': '🏥',
            'permiso': '📋',
            'maternidad': '👶',
            'convenio': '📋',
            'asuntos_propios': '📝',
            'festivo_local': '🎉'
        };

        // Estados
        const estadoClase = esActiva ? 'bg-yellow-100 border-yellow-400' : 'bg-gray-50 border-gray-200';
        const estadoTexto = esActiva ? 
            `<span class="text-yellow-700 font-medium">🟡 Activa (${diasRestantes} días restantes)</span>` :
            '<span class="text-gray-500">⚪ Finalizada</span>';

        return `
            <div class="border rounded-lg p-3 ${estadoClase}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-lg">${iconos[ausencia.tipo] || '📋'}</span>
                            <span class="font-semibold text-gray-800">${ausencia.empleado_nombre}</span>
                            <span class="text-sm text-gray-600 capitalize">${ausencia.tipo.replace('_', ' ')}</span>
                        </div>
                        
                        <div class="text-sm text-gray-600 space-y-1">
                            <div>📅 ${this.formatearFecha(ausencia.fecha_inicio)} → ${this.formatearFecha(ausencia.fecha_fin)}</div>
                            <div>⏰ ${totalDias} días (${totalHoras}h teóricas)</div>
                            ${ausencia.motivo ? `<div>📝 ${ausencia.motivo}</div>` : ''}
                            <div>${estadoTexto}</div>
                        </div>
                    </div>
                    
                    <button onclick="window.ausenciasManager.eliminarAusencia('${ausencia.id}')" 
                            class="text-red-500 hover:text-red-700 transition ml-2">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    }

    formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    abrirModal() {
        const modal = document.getElementById('ausenciasModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Inicializar si no se ha hecho
            if (this.empleados.length === 0) {
                this.init();
            }
            
            // Establecer fecha por defecto (hoy)
            const hoy = new Date().toISOString().split('T')[0];
            const fechaInicio = document.getElementById('ausenciaFechaInicio');
            if (fechaInicio && !fechaInicio.value) {
                fechaInicio.value = hoy;
            }
        }
    }

    cerrarModal() {
        const modal = document.getElementById('ausenciasModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear elemento de notificación
        const notif = document.createElement('div');
        notif.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
        
        // Colores según tipo
        const colores = {
            'success': 'bg-green-500 text-white',
            'error': 'bg-red-500 text-white',
            'info': 'bg-blue-500 text-white',
            'warning': 'bg-yellow-500 text-black'
        };
        
        notif.className += ` ${colores[tipo] || colores.info}`;
        notif.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-check-circle"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        // Agregar al DOM
        document.body.appendChild(notif);
        
        // Animar entrada
        setTimeout(() => notif.style.transform = 'translateX(0)', 10);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notif.style.transform = 'translateX(100%)';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    // Función para obtener ausencias activas en una fecha
    getAusenciasActivas(fecha = new Date()) {
        const fechaStr = fecha.toISOString().split('T')[0];
        return this.ausencias.filter(ausencia => 
            ausencia.fecha_inicio <= fechaStr && 
            ausencia.fecha_fin >= fechaStr &&
            ausencia.estado === 'aprobado'
        );
    }

    // Función para verificar si un empleado está ausente
    empleadoEstaAusente(empleadoId, fecha = new Date()) {
        const ausenciasActivas = this.getAusenciasActivas(fecha);
        return ausenciasActivas.some(ausencia => ausencia.empleado_id === empleadoId);
    }

    getAusenciaEmpleado(empleadoId, fecha = new Date()) {
        const fechaStr = fecha.toISOString().split('T')[0];
        return this.ausencias.find(ausencia => 
            ausencia.empleado_id === empleadoId &&
            ausencia.fecha_inicio <= fechaStr && 
            ausencia.fecha_fin >= fechaStr &&
            ausencia.estado === 'aprobado'
        );
    }

    renderAusenciasList(ausencias) {
        const container = document.getElementById('listaAusencias');
        if (!container) return;

        let html = '';

        if (ausencias.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-4">No hay ausencias registradas.</div>';
            return;
        }

        ausencias.forEach(ausencia => {
            const diasNaturales = Math.floor((new Date(ausencia.fecha_fin) - new Date(ausencia.fecha_inicio)) / (1000 * 60 * 60 * 24)) + 1;
            const valorTeoricoAusencia = diasNaturales * this.PROMEDIO_DIARIO_CONVENIO;
            
            html += `
                <div class="ausencia-card estado-${ausencia.estado}">
                    <div class="ausencia-header">
                        <div class="ausencia-empleado">
                            <i class="fas fa-user-circle mr-2"></i>
                            ${this.getEmployeeNameById(ausencia.empleado_id)}
                        </div>
                        <div class="ausencia-tipo">${this.formatTipoAusencia(ausencia.tipo)}</div>
                    </div>
                    <div class="ausencia-body">
                        <div class="ausencia-fecha">
                            <i class="fas fa-calendar-alt mr-2 text-gray-400"></i>
                            ${new Date(ausencia.fecha_inicio).toLocaleDateString()} &rarr; ${new Date(ausencia.fecha_fin).toLocaleDateString()}
                        </div>
                        <div class="ausencia-details">
                            <div>
                                <i class="fas fa-business-time mr-2 text-gray-400"></i>
                                ${diasNaturales} días (valor: ${valorTeoricoAusencia.toFixed(1)}h teóricas)
                            </div>
                            <div class="ausencia-estado">
                                <i class="fas fa-info-circle mr-1"></i>
                                ${this.formatEstado(ausencia.estado)}
                            </div>
                            <div class="info-convenio">
                                <i class="fas fa-info-circle mr-2 text-blue-500"></i>
                                <div>
                                    <div class="font-semibold">Lógica del Convenio</div>
                                    <div class="text-xs text-gray-600">
                                        Cada día de ausencia (L-D) reduce la obligación de horas a realizar en ~${this.PROMEDIO_DIARIO_CONVENIO.toFixed(2)}h.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="ausencia-actions">
                        <button class="btn-ausencia-eliminar" onclick="ausenciasManager.eliminarAusencia('${ausencia.id}')"><i class="fas fa-trash-alt"></i> Eliminar</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    formatTipoAusencia(tipo) {
        const tipos = {
            'vacaciones': 'Vacaciones',
            'baja_medica': 'Baja Médica',
            'permiso': 'Permiso',
            'maternidad': 'Maternidad',
            'convenio': 'Convenio',
            'asuntos_propios': 'Asuntos Propios',
            'festivo_local': 'Festivo Local'
        };
        return tipos[tipo] || tipo;
    }

    formatEstado(estado) {
        const estados = {
            'pendiente': 'Pendiente',
            'aprobado': 'Aprobado',
            'rechazado': 'Rechazado'
        };
        return estados[estado] || estado;
    }

    getEmployeeNameById(id) {
        const empleado = this.empleados.find(emp => emp.id === id);
        return empleado ? empleado.name : 'Desconocido';
    }
}

// Solo usar window.ausenciasManager como instancia global

// 🔄 Inicialización robusta del sistema de ausencias
const inicializarAusencias = async () => {
    // Evitar múltiples inicializaciones simultáneas
    if (window.ausenciasManager || window.inicializandoAusencias) {
        // console.log('🔄 Sistema de ausencias ya inicializado o en proceso');
        return;
    }
    
    window.inicializandoAusencias = true;
    // console.log('🏖️ Iniciando sistema de ausencias...');
    
    let intentos = 0;
    const maxIntentos = 20; // Más intentos para ausencias
    
    while (intentos < maxIntentos) {
        // Verificar si todos los componentes están disponibles
        if (window.controlAnualSimple && 
            window.controlAnualSimple.supabase && 
            typeof window.controlAnualSimple.supabase.from === 'function') {
            
            try {
                // console.log('✅ Dependencias de ausencias disponibles, inicializando...');
                
                // Crear instancia global
                window.ausenciasManager = new AusenciasManager(window.controlAnualSimple.supabase);
                await window.ausenciasManager.init();
                
                // console.log('✅ Sistema de ausencias inicializado correctamente');
                window.inicializandoAusencias = false;
                return;
                
            } catch (error) {
                console.error('❌ Error inicializando ausencias:', error);
                window.inicializandoAusencias = false;
                break;
            }
        }
        
        // console.log(`⏳ Esperando dependencias de ausencias... (${intentos + 1}/${maxIntentos})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        intentos++;
    }
    
    console.error('❌ No se pudo inicializar el sistema de ausencias después de esperar');
    window.inicializandoAusencias = false;
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que la página esté completamente cargada
    setTimeout(inicializarAusencias, 3000);
});

// Exportar para uso global
window.AusenciasManager = AusenciasManager;
window.inicializarAusencias = inicializarAusencias; 