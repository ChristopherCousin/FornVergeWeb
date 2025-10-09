/**
 * CONTROL ANUAL EVENTS - Gestor de Eventos
 * =========================================
 * Maneja todos los eventos del panel de control anual
 */

class ControlAnualEvents {
    constructor(controller, ui) {
        this.controller = controller;
        this.ui = ui;
    }

    setup() {
        this.setupBotones();
        this.setupMinimizar();
        this.setupAutoRefresh();
        this.setupStateSubscriptions();
    }

    setupBotones() {
        const btnGestionarAusencias = document.getElementById('btnGestionarAusencias');
        const btnActualizarDatos = document.getElementById('btnActualizarDatos');
        
        if (btnGestionarAusencias) {
            btnGestionarAusencias.addEventListener('click', () => this.onGestionarAusencias());
        }
        
        if (btnActualizarDatos) {
            btnActualizarDatos.addEventListener('click', () => this.onActualizarDatos());
        }
    }

    setupMinimizar() {
        this.ui.setupMinimizar();
    }

    setupAutoRefresh() {
        // Actualizar estado de empleados cada 5 minutos
        this.ui.actualizarEstadoEmpleados();
        setInterval(() => this.ui.actualizarEstadoEmpleados(), 300000);
    }

    setupStateSubscriptions() {
        // Suscribirse a cambios en el convenio
        window.stateManager.subscribe('convenio', (data) => {
            console.log('📡 Convenio actualizado, refrescando UI...');
            this.ui.actualizarEstadoEmpleados();
        });
    }

    async onGestionarAusencias() {
        if (window.ausenciasManager) {
            window.ausenciasManager.abrirModal();
        } else {
            alert('Sistema de ausencias no disponible aún. Espera unos segundos y vuelve a intentar.');
        }
    }

    async onActualizarDatos() {
        const btn = document.getElementById('btnActualizarDatos');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Actualizando...';
        btn.disabled = true;
        
        try {
            await this.controller.actualizarDatos();
            
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Actualizado';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error actualizando:', error);
            btn.innerHTML = '<i class="fas fa-times mr-2"></i>Error';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
        }
    }
}

// Exportar a window
window.ControlAnualEvents = ControlAnualEvents;
