/**
 * CONTROL ANUAL UI - Interfaz de Usuario
 * =======================================
 * Maneja toda la renderización del panel de control anual
 */

class ControlAnualUI {
    constructor(controller) {
        this.controller = controller;
        this.panelCreado = false;
    }

    crearPanel() {
        if (this.panelCreado) {
            console.log('⚠️ Panel de control anual ya existe');
            return;
        }

        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error('❌ No se encuentra mainContent');
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'controlAnualPanel';
        panel.innerHTML = this.getTemplatePanel();

        mainContent.insertBefore(panel, mainContent.firstChild);
        
        this.panelCreado = true;
        console.log('✅ Panel de control anual creado');
    }

    getTemplatePanel() {
        return `
            <div class="bg-white border-2 border-purple-200 rounded-lg shadow-lg mb-4">
                <!-- Header con botón de minimizar -->
                <div class="flex justify-between items-center p-4 pb-0">
                    <div class="text-center flex-1">
                        <h3 class="text-2xl font-bold text-purple-800">
                            📊 Control Anual del Convenio
                        </h3>
                        <p id="subtituloPanel" class="text-gray-600">Información para planificar horarios cumpliendo el convenio</p>
                    </div>
                    <button id="btnMinimizarPanel" class="ml-4 text-gray-500 hover:text-gray-700 transition p-2 rounded-lg hover:bg-gray-100" title="Minimizar/Maximizar panel">
                        <i id="iconoMinimizar" class="fas fa-chevron-up text-xl"></i>
                    </button>
                </div>
                
                <!-- Indicador cuando está minimizado -->
                <div id="indicadorMinimizado" class="hidden px-4 pb-2 cursor-pointer">
                    <div class="text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-2 hover:bg-gray-100 transition">
                        <i class="fas fa-chart-line mr-1"></i>
                        <span id="resumenMinimizado">Panel minimizado - Click para ver estadísticas</span>
                    </div>
                </div>
                
                <!-- Contenido del panel -->
                <div id="contenidoPanel" class="p-6 pt-4">
                
                <!-- Botones principales -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <button id="btnGestionarAusencias" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg transition font-medium text-lg">
                        <i class="fas fa-calendar-times mr-2"></i>Gestionar Ausencias
                    </button>
                    <button id="btnActualizarDatos" class="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg transition font-medium text-lg">
                        <i class="fas fa-sync mr-2"></i>Actualizar Datos
                    </button>
                </div>
                
                <!-- Estado de empleados -->
                <div id="estadoEmpleadosAnual" class="space-y-3">
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Cargando datos anuales...</p>
                    </div>
                </div>
                
                <!-- Información del convenio -->
                <div class="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-2">📋 Límites del Convenio</h4>
                    <div class="text-sm text-gray-600 space-y-1">
                        <div>• <strong>Máximo anual:</strong> 1.776 horas por empleado</div>
                        <div>• <strong>Máximo diario:</strong> 9 horas efectivas</div>
                        <div>• <strong>Descanso entre turnos:</strong> Mínimo 12 horas</div>
                        <div>• <strong>Descanso semanal:</strong> 1,5 días seguidos</div>
                    </div>
                </div>
                
                </div> <!-- Cierre del contenido del panel -->
            </div>
        `;
    }

    setupMinimizar() {
        const btnMinimizar = document.getElementById('btnMinimizarPanel');
        const indicadorMinimizado = document.getElementById('indicadorMinimizado');
        
        if (!btnMinimizar || !indicadorMinimizado) {
            console.log('⚠️ Elementos del panel no encontrados');
            return;
        }

        // Cargar estado previo desde localStorage
        const estadoPrevio = localStorage.getItem('controlAnualPanelMinimizado');
        let isMinimizado = estadoPrevio === 'true';
        
        // Aplicar estado inicial
        this.aplicarEstadoPanel(isMinimizado);

        // Manejar click en el botón
        btnMinimizar.addEventListener('click', () => {
            isMinimizado = !isMinimizado;
            this.aplicarEstadoPanel(isMinimizado);
            localStorage.setItem('controlAnualPanelMinimizado', isMinimizado.toString());
        });
        
        // También permitir expandir haciendo click en el indicador
        indicadorMinimizado.addEventListener('click', () => {
            if (isMinimizado) {
                isMinimizado = false;
                this.aplicarEstadoPanel(isMinimizado);
                localStorage.setItem('controlAnualPanelMinimizado', isMinimizado.toString());
            }
        });
        
        console.log('✅ Funcionalidad de minimizar/maximizar configurada');
    }
    
    aplicarEstadoPanel(isMinimizado) {
        const contenidoPanel = document.getElementById('contenidoPanel');
        const iconoMinimizar = document.getElementById('iconoMinimizar');
        const indicadorMinimizado = document.getElementById('indicadorMinimizado');
        const btnMinimizar = document.getElementById('btnMinimizarPanel');
        
        if (!contenidoPanel || !iconoMinimizar || !indicadorMinimizado || !btnMinimizar) return;
        
        if (isMinimizado) {
            // Minimizar con animación
            contenidoPanel.style.transition = 'all 0.3s ease';
            contenidoPanel.style.opacity = '0';
            contenidoPanel.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                contenidoPanel.classList.add('hidden');
                indicadorMinimizado.classList.remove('hidden');
                iconoMinimizar.classList.remove('fa-chevron-up');
                iconoMinimizar.classList.add('fa-chevron-down');
                btnMinimizar.title = 'Maximizar panel';
                
                this.actualizarResumenMinimizado();
            }, 300);
            
        } else {
            // Maximizar con animación
            indicadorMinimizado.classList.add('hidden');
            contenidoPanel.classList.remove('hidden');
            contenidoPanel.style.opacity = '0';
            contenidoPanel.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                contenidoPanel.style.transition = 'all 0.3s ease';
                contenidoPanel.style.opacity = '1';
                contenidoPanel.style.transform = 'translateY(0)';
                iconoMinimizar.classList.remove('fa-chevron-down');
                iconoMinimizar.classList.add('fa-chevron-up');
                btnMinimizar.title = 'Minimizar panel';
            }, 10);
        }
    }
    
    actualizarResumenMinimizado() {
        const resumenMinimizado = document.getElementById('resumenMinimizado');
        if (!resumenMinimizado) return;
        
        const stats = Object.values(window.stateManager.getConvenioStats());
        if (stats.length === 0) return;
        
        const empleadosEquilibrados = stats.filter(s => s.estado_semanal === 'equilibrado').length;
        const empleadosConProblemas = stats.filter(s => s.estado_semanal === 'subcarga' || s.estado_semanal === 'sobrecarga').length;
        const empleadosAusentes = stats.filter(s => s.estado_semanal === 'de_ausencia').length;
        const totalPartidos = stats.reduce((sum, s) => sum + (s.total_partidos || 0), 0);
        const totalMañanas = stats.reduce((sum, s) => sum + (s.total_turnos_mañana || 0), 0);
        
        let textoResumen = `${stats.length} empleados`;
        if (empleadosEquilibrados > 0) textoResumen += ` • ${empleadosEquilibrados} equilibrados`;
        if (empleadosConProblemas > 0) textoResumen += ` • ${empleadosConProblemas} requieren ajustes`;
        if (empleadosAusentes > 0) textoResumen += ` • ${empleadosAusentes} ausentes`;
        if (totalPartidos > 0) textoResumen += ` • ${totalPartidos} partidos totales`;
        if (totalMañanas > 0) textoResumen += ` • ${totalMañanas} mañanas totales`;
        
        resumenMinimizado.textContent = textoResumen;
    }

    actualizarEstadoEmpleados() {
        const container = document.getElementById('estadoEmpleadosAnual');
        if (!container) return;
        
        // Verificar error de Ágora
        const errorAgora = window.stateManager.getAgoraError();
        if (errorAgora) {
            container.innerHTML = this.renderErrorAgora(errorAgora);
            return;
        }
        
        const stats = Object.values(window.stateManager.getConvenioStats());
        if (stats.length === 0) return;
        
        // Solo esperar liquidaciones si el usuario tiene permisos para verlas
        const tienePermisosLiquidaciones = window.hasPermission && window.hasPermission('liquidaciones', 'ver');
        const liquidacionesCargadas = window.liquidacionesPanel?.datosCompletos === true;
        
        if (tienePermisosLiquidaciones && !liquidacionesCargadas) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Cargando datos de liquidaciones...</p>
                </div>
            `;
            return;
        }
        
        const alertasCompensacion = this.generarResumenCompensacion(stats);
        container.innerHTML = alertasCompensacion;
        
        this.actualizarResumenMinimizado();
    }

    renderErrorAgora(error) {
        return `
            <div class="bg-red-100 border-2 border-red-400 rounded-lg p-6">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-triangle text-red-600 text-3xl mr-4"></i>
                    <div class="flex-1">
                        <h4 class="text-xl font-bold text-red-800 mb-2">
                            ❌ Error de Conexión con Ágora
                        </h4>
                        <p class="text-red-700 mb-3">
                            No se pueden cargar los fichajes desde el sistema Ágora. 
                            <strong>Las estadísticas de horas y compensaciones NO están disponibles.</strong>
                        </p>
                        <div class="bg-red-50 border border-red-300 rounded p-3 mb-3">
                            <p class="text-sm text-red-800 font-mono">
                                <strong>Error técnico:</strong> ${error}
                            </p>
                        </div>
                        <button 
                            onclick="window.location.reload()" 
                            class="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition font-medium">
                            <i class="fas fa-sync mr-2"></i>Reintentar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    generarResumenCompensacion(stats) {
        const empleadosConDatos = stats.filter(s => s.estado_semanal !== 'sin_datos');
        const empleadosSinDatos = stats.filter(s => s.estado_semanal === 'sin_datos');
        const empleadosDeAusencia = stats.filter(s => s.estado_semanal === 'de_ausencia');
        
        // Empleados con sobrecarga (han trabajado de más)
        const empleadosConSobrecarga = empleadosConDatos.filter(s => 
            s.estado_semanal === 'sobrecarga' || 
            (s.estado_semanal === 'de_ausencia' && s.diferencia_carga_trabajo > 5) ||
            (s.estado_semanal === 'empleado_nuevo' && s.diferencia_carga_trabajo > 5)
        );
        
        const empleadosConSubcarga = empleadosConDatos.filter(s => 
            (s.estado_semanal === 'subcarga' || 
            (s.estado_semanal === 'de_ausencia' && s.diferencia_carga_trabajo < -1) ||
            (s.estado_semanal === 'empleado_nuevo' && s.diferencia_carga_trabajo < -1)) &&
            !s.empleado_nombre.toUpperCase().includes('XISCA')
        );
        
        const empleadosEquilibrados = empleadosConDatos.filter(s => 
            s.estado_semanal === 'equilibrado' || 
            (s.estado_semanal === 'de_ausencia' && Math.abs(s.diferencia_carga_trabajo) <= 1) ||
            (s.estado_semanal === 'empleado_nuevo' && Math.abs(s.diferencia_carga_trabajo) <= 1)
        );

        // Solo empleados equilibrados y con datos suficientes
        if (empleadosConSobrecarga.length === 0 && empleadosConSubcarga.length === 0 && empleadosConDatos.length > 0) {
            return `
                <div class="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-green-800 mb-2">
                        ✅ Compensaciones Históricas Perfectas
                    </h4>
                    <p class="text-green-700">
                        ${empleadosConDatos.length > 1 ? 'Las empleadas están' : 'La empleada está'} en equilibrio histórico. 
                        ¡Excelente distribución de la carga de trabajo!
                    </p>
                </div>
            `;
        }

        if (empleadosConDatos.length === 0) {
            return `
                <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-blue-800 mb-2">
                        📊 Análisis de Compensaciones Históricas
                    </h4>
                    <p class="text-blue-700">
                        Se necesitan más datos históricos para analizar patrones de compensación.
                        Continuar con horarios normales mientras se recopilan datos.
                    </p>
                </div>
            `;
        }

        // Mostrar sección de compensaciones históricas
        let html = `
            <div class="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">
                    ⚖️ Compensaciones Necesarias para Próximos Horarios
                </h4>
        `;

        if (empleadosConSobrecarga.length > 0) {
            html += this.renderSeccionSobrecarga(empleadosConSobrecarga);
        }

        if (empleadosConSubcarga.length > 0) {
            html += this.renderSeccionSubcarga(empleadosConSubcarga);
        }

        if (empleadosEquilibrados.length > 0) {
            html += this.renderSeccionEquilibrados(empleadosEquilibrados);
        }

        html += `
                <div class="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
                    💡 <strong>Objetivo:</strong> Compensar diferencias históricas desde la fecha de alta para que todas acaben cerca del ideal.
                </div>
            </div>
        `;

        return html;
    }

    renderSeccionSobrecarga(empleados) {
        let html = `
            <div class="mb-4">
                <h5 class="font-bold text-red-700 mb-2">🔻 DAR MENOS HORAS:</h5>
                <div class="space-y-2">
        `;
        
        empleados.sort((a, b) => b.diferencia_carga_trabajo - a.diferencia_carga_trabajo).forEach(s => {
            html += `
                <div class="bg-red-50 p-3 rounded flex justify-between items-center">
                    <div class="font-semibold text-red-800">
                        ${s.empleado_nombre}
                        ${s.estado_semanal === 'de_ausencia' ? '(🏥 vuelve pronto)' : ''}
                        ${s.estado_semanal === 'empleado_nuevo' ? '(🆕 nuevo)' : ''}
                    </div>
                    <div class="text-sm">
                        <span class="text-red-600 font-bold">+${Math.abs(s.diferencia_carga_trabajo).toFixed(0)}h extra</span> | 
                        ${s.total_partidos || 0} partidos | 
                        ${s.total_turnos_mañana || 0} mañanas
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }

    renderSeccionSubcarga(empleados) {
        let html = `
            <div class="mb-4">
                <h5 class="font-bold text-blue-700 mb-2">🔺 DAR MÁS HORAS:</h5>
                <div class="space-y-2">
        `;
        
        empleados.sort((a, b) => a.diferencia_carga_trabajo - b.diferencia_carga_trabajo).forEach(s => {
            html += `
                <div class="bg-blue-50 p-3 rounded flex justify-between items-center">
                    <div class="font-semibold text-blue-800">
                        ${s.empleado_nombre}
                        ${s.estado_semanal === 'de_ausencia' ? '(🏥 vuelve pronto)' : ''}
                        ${s.estado_semanal === 'empleado_nuevo' ? '(🆕 nuevo)' : ''}
                    </div>
                    <div class="text-sm">
                        <span class="text-blue-600 font-bold">${Math.abs(s.diferencia_carga_trabajo).toFixed(0)}h menos</span> | 
                        ${s.total_partidos || 0} partidos | 
                        ${s.total_turnos_mañana || 0} mañanas
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }

    renderSeccionEquilibrados(empleados) {
        let html = `
            <div class="mb-4">
                <h5 class="font-bold text-green-700 mb-2">✅ MANTENER IGUAL:</h5>
                <div class="space-y-2">
        `;
        
        empleados.forEach(s => {
            html += `
                <div class="bg-green-50 p-3 rounded flex justify-between items-center">
                    <div class="font-semibold text-green-800">
                        ${s.empleado_nombre}
                        ${s.estado_semanal === 'de_ausencia' ? '(🏥 vuelve pronto)' : ''}
                        ${s.estado_semanal === 'empleado_nuevo' ? '(🆕 nuevo)' : ''}
                    </div>
                    <div class="text-sm">
                        <span class="text-green-600 font-bold">equilibrado</span> | 
                        ${s.total_partidos || 0} partidos | 
                        ${s.total_turnos_mañana || 0} mañanas
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
}

// Exportar a window
window.ControlAnualUI = ControlAnualUI;
