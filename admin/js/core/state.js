/**
 * STATE MANAGER - Sistema Central de Estado
 * ==========================================
 * Patrón Observer para desacoplar módulos
 * Todos los módulos leen/escriben a través de este manager
 */

class StateManager {
    constructor() {
        // Estado centralizado
        this.state = {
            empleados: [],
            balances: {}, // { empleadoId: { balance_horas, horas_reales, etc } }
            liquidaciones: {}, // { empleadoId: { total_liquidado, ultima, historial } }
            convenio: {
                stats_anuales: {},
                alertas: [],
                error_agora: null
            },
            ui: {
                panelMinimizado: false
            }
        };
        
        // Subscribers para notificaciones
        this.subscribers = {
            empleados: [],
            balances: [],
            liquidaciones: [],
            convenio: [],
            ui: []
        };
        
        console.log('🏗️ StateManager inicializado');
    }

    // ============================================================================
    // EMPLEADOS
    // ============================================================================

    setEmpleados(empleados) {
        this.state.empleados = empleados;
        this.notify('empleados', empleados);
    }

    getEmpleados() {
        return this.state.empleados;
    }

    getEmpleado(empleadoId) {
        return this.state.empleados.find(e => e.id === empleadoId);
    }

    // ============================================================================
    // BALANCES (desde ConvenioManager)
    // ============================================================================

    setBalance(empleadoId, balance) {
        this.state.balances[empleadoId] = balance;
        this.notify('balances', { empleadoId, balance });
    }

    setAllBalances(balances) {
        this.state.balances = balances;
        this.notify('balances', balances);
    }

    getBalance(empleadoId) {
        return this.state.balances[empleadoId] || null;
    }

    getAllBalances() {
        return this.state.balances;
    }

    // ============================================================================
    // LIQUIDACIONES (desde LiquidacionesRepository)
    // ============================================================================

    setLiquidaciones(empleadoId, data) {
        if (!this.state.liquidaciones[empleadoId]) {
            this.state.liquidaciones[empleadoId] = {};
        }
        this.state.liquidaciones[empleadoId] = {
            ...this.state.liquidaciones[empleadoId],
            ...data
        };
        
        this.notify('liquidaciones', { empleadoId, data });
    }

    getLiquidaciones(empleadoId) {
        return this.state.liquidaciones[empleadoId] || null;
    }

    // ============================================================================
    // CONVENIO (desde ConvenioManager)
    // ============================================================================

    setConvenioStats(stats) {
        this.state.convenio.stats_anuales = stats;
        this.notify('convenio', stats);
    }

    setConvenioAlertas(alertas) {
        this.state.convenio.alertas = alertas;
        this.notify('convenio', { alertas });
    }

    setAgoraError(error) {
        this.state.convenio.error_agora = error;
        this.notify('convenio', { error_agora: error });
    }

    getConvenioStats() {
        return this.state.convenio.stats_anuales;
    }

    getConvenioStat(empleadoId) {
        return this.state.convenio.stats_anuales[empleadoId] || null;
    }

    getAgoraError() {
        return this.state.convenio.error_agora;
    }

    // ============================================================================
    // UI STATE
    // ============================================================================

    setUIState(key, value) {
        this.state.ui[key] = value;
        this.notify('ui', { key, value });
    }

    getUIState(key) {
        return this.state.ui[key];
    }

    // ============================================================================
    // OBSERVER PATTERN
    // ============================================================================

    /**
     * Suscribirse a cambios en un tipo de estado
     * @param {string} type - 'empleados', 'balances', 'liquidaciones', 'convenio', 'ui'
     * @param {function} callback - Función a ejecutar cuando cambie
     */
    subscribe(type, callback) {
        if (!this.subscribers[type]) {
            console.error(`❌ Tipo de suscripción inválido: ${type}`);
            return;
        }
        this.subscribers[type].push(callback);
        
        // Devolver función para desuscribirse
        return () => {
            this.subscribers[type] = this.subscribers[type].filter(cb => cb !== callback);
        };
    }

    /**
     * Notificar a todos los subscribers de un tipo
     */
    notify(type, data) {
        if (!this.subscribers[type]) return;
        
        this.subscribers[type].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Error en subscriber ${type}:`, error);
            }
        });
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    /**
     * Resetear todo el estado (útil para cambio de local)
     */
    reset() {
        this.state = {
            empleados: [],
            balances: {},
            liquidaciones: {},
            convenio: {
                stats_anuales: {},
                alertas: [],
                error_agora: null
            },
            ui: {
                panelMinimizado: false
            }
        };
        console.log('🔄 StateManager reseteado');
    }

    /**
     * Debug: ver todo el estado actual
     */
    debug() {
        console.log('🔍 Estado actual:', {
            empleados: this.state.empleados.length,
            balances: Object.keys(this.state.balances).length,
            liquidaciones: Object.keys(this.state.liquidaciones).length,
            convenio_stats: Object.keys(this.state.convenio.stats_anuales).length,
            alertas: this.state.convenio.alertas.length,
            error_agora: this.state.convenio.error_agora
        });
        return this.state;
    }
}

// Instancia global única (Singleton)
window.stateManager = new StateManager();

// Exportar también la clase
window.StateManager = StateManager;