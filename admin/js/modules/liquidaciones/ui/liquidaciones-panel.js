/**
 * LIQUIDACIONES PANEL - UI Principal
 * ===================================
 * Panel colapsable con resumen de empleados y sus balances
 */

class LiquidacionesPanel {
    constructor(service, formatter) {
        this.service = service;
        this.formatter = formatter;
        this.panelCreado = false;
    }

    /**
     * Crea el panel de liquidaciones en la interfaz (COLAPSADO por defecto)
     */
    crear() {
        if (this.panelCreado) {
            console.log('⚠️ Panel de liquidaciones ya existe');
            return;
        }

        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error('❌ No se encuentra mainContent');
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'liquidacionesPanel';
        panel.className = 'bg-white border-2 border-green-200 rounded-lg shadow-lg mb-4';
        panel.innerHTML = `
            <!-- Header Compacto (siempre visible) -->
            <div class="p-4 bg-green-50 cursor-pointer hover:bg-green-100 transition" onclick="liquidacionesPanel.toggle()">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                        <i id="iconoToggleLiquidaciones" class="fas fa-chevron-right text-green-700 transition-transform"></i>
                        <h3 class="text-lg font-bold text-green-800">
                            💰 Liquidaciones de Horas Extra
                        </h3>
                    </div>
                    <div id="resumenCompacto" class="flex items-center space-x-4 text-sm">
                        <div class="text-gray-500">
                            <i class="fas fa-spinner fa-spin"></i> Cargando...
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Contenido Expandible (oculto por defecto) -->
            <div id="liquidacionesContent" class="hidden border-t border-green-200">
                <div class="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <button 
                        id="btnHistorialGeneral" 
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-semibold"
                        onclick="event.stopPropagation(); liquidacionesModalHistorial.abrirGeneral()"
                    >
                        <i class="fas fa-book mr-2"></i>Historial General
                    </button>
                    <button 
                        id="btnRefreshLiquidaciones" 
                        class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                        onclick="event.stopPropagation(); liquidacionesPanel.refresh()"
                    >
                        <i class="fas fa-sync-alt mr-1"></i>Actualizar
                    </button>
                </div>
                <div id="liquidacionesContentInner" class="p-6">
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
                        <p>Cargando datos de liquidaciones...</p>
                    </div>
                </div>
            </div>
        `;

        // Insertar después del panel de control anual si existe, o al principio
        const controlAnualPanel = document.getElementById('controlAnualPanel');
        if (controlAnualPanel) {
            controlAnualPanel.parentNode.insertBefore(panel, controlAnualPanel.nextSibling);
        } else {
            mainContent.insertBefore(panel, mainContent.firstChild);
        }

        this.panelCreado = true;
        console.log('✅ Panel de liquidaciones creado (colapsado)');
    }

    /**
     * Alterna la visibilidad del panel
     */
    toggle() {
        const content = document.getElementById('liquidacionesContent');
        const icono = document.getElementById('iconoToggleLiquidaciones');
        
        if (!content || !icono) return;
        
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            icono.classList.add('fa-rotate-90');
        } else {
            content.classList.add('hidden');
            icono.classList.remove('fa-rotate-90');
        }
    }

    /**
     * Actualiza el resumen compacto (cuando está colapsado)
     */
    actualizarResumenCompacto(numEmpleados, totalHoras, totalImporte) {
        const resumen = document.getElementById('resumenCompacto');
        if (!resumen) return;

        if (numEmpleados === 0) {
            resumen.innerHTML = `
                <div class="flex items-center space-x-2 text-green-700">
                    <i class="fas fa-check-circle"></i>
                    <span class="font-semibold">Todo al día</span>
                </div>
            `;
        } else {
            resumen.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="text-red-700 font-semibold">
                        <i class="fas fa-users mr-1"></i>
                        ${numEmpleados} empleado${numEmpleados > 1 ? 's' : ''}
                    </div>
                    <div class="text-orange-700 font-bold">
                        ${totalHoras.toFixed(1)}h
                    </div>
                    <div class="text-green-700 font-bold">
                        ${totalImporte.toFixed(2)}€
                    </div>
                    <div class="text-gray-500 text-xs">
                        <i class="fas fa-hand-pointer"></i> Click para ver detalle
                    </div>
                </div>
            `;
        }
    }

    /**
     * Renderiza la tabla de balances de todos los empleados
     */
    async renderBalances() {
        const content = document.getElementById('liquidacionesContentInner');
        if (!content) return;

        try {
            const balances = await this.service.getResumenTodos();

            if (balances.length === 0) {
                content.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-info-circle text-4xl mb-3"></i>
                        <p>No hay datos de empleados disponibles</p>
                    </div>
                `;
                this.actualizarResumenCompacto(0, 0, 0);
                return;
            }

            // Separar empleados con deuda pendiente de los que no
            const conDeuda = balances.filter(b => b.pendiente_pago > 0);
            const sinDeuda = balances.filter(b => b.pendiente_pago <= 0);

            // Actualizar resumen compacto
            const totalDeuda = conDeuda.reduce((sum, b) => sum + b.pendiente_pago, 0);
            const totalImporte = conDeuda.reduce((sum, b) => sum + b.importe_pendiente, 0);
            this.actualizarResumenCompacto(conDeuda.length, totalDeuda, totalImporte);

            let html = '';

            // EMPLEADOS CON DEUDA PENDIENTE
            if (conDeuda.length > 0) {
                html += this.renderSeccionConDeuda(conDeuda);
                html += this.renderResumenTotal(conDeuda);
            }

            // EMPLEADOS SIN DEUDA
            if (sinDeuda.length > 0) {
                html += this.renderSeccionSinDeuda(sinDeuda);
            }

            content.innerHTML = html;

        } catch (error) {
            console.error('❌ Error renderizando balances:', error);
            content.innerHTML = `
                <div class="text-center py-8 text-red-600">
                    <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                    <p>Error cargando datos de liquidaciones</p>
                    <button onclick="liquidacionesPanel.refresh()" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    renderSeccionConDeuda(empleados) {
        let html = `
            <div class="mb-6">
                <h4 class="text-lg font-bold text-red-700 mb-3 flex items-center">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Empleados con horas pendientes de pagar (${empleados.length})
                </h4>
                <div class="space-y-3">
        `;

        empleados.forEach(balance => {
            const colorBadge = balance.pendiente_pago > 20 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
            
            html += `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <span class="text-2xl mr-2">${this.formatter.getEmpleadoEmoji(balance.empleado_id)}</span>
                                <h5 class="text-lg font-bold text-gray-800">${balance.empleado_nombre}</h5>
                                <span class="ml-2 px-2 py-1 ${colorBadge} rounded text-xs font-semibold">
                                    URGENTE
                                </span>
                                <span class="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    ${balance.tarifa_hora}€/h
                                </span>
                            </div>
                            <div class="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                    <span class="text-gray-600">Balance:</span>
                                    <span class="font-semibold text-red-600 ml-1">+${balance.balance_horas.toFixed(1)}h</span>
                                </div>
                                <div>
                                    <span class="text-gray-600">Liquidado:</span>
                                    <span class="font-semibold ml-1">${balance.ya_liquidado.toFixed(1)}h</span>
                                </div>
                                <div>
                                    <span class="text-gray-600">Pendiente:</span>
                                    <span class="font-bold text-red-700 ml-1">${balance.pendiente_pago.toFixed(1)}h → ${balance.importe_pendiente.toFixed(2)}€</span>
                                </div>
                            </div>
                            ${balance.ultima_liquidacion ? `
                                <div class="mt-2 text-xs text-gray-500">
                                    <i class="fas fa-history mr-1"></i>
                                    Último pago: ${this.formatter.formatFecha(balance.ultima_liquidacion.liquidation_date)} 
                                    (${balance.ultima_liquidacion.liquidated_hours}h por ${balance.ultima_liquidacion.paid_amount}€)
                                </div>
                            ` : ''}
                        </div>
                        <div class="ml-4 flex flex-col space-y-2">
                            <button 
                                onclick="liquidacionesModalPago.abrir('${balance.empleado_id}')"
                                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
                                title="Registrar pago"
                            >
                                <i class="fas fa-euro-sign mr-1"></i>Pagar
                            </button>
                            <button 
                                onclick="liquidacionesModalHistorial.abrir('${balance.empleado_id}')"
                                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                                title="Ver historial"
                            >
                                <i class="fas fa-history mr-1"></i>Historial
                            </button>
                        </div>
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

    renderResumenTotal(empleados) {
        const totalDeuda = empleados.reduce((sum, b) => sum + b.pendiente_pago, 0);
        const totalImporte = empleados.reduce((sum, b) => sum + b.importe_pendiente, 0);

        return `
            <div class="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                <div class="flex justify-between items-center">
                    <span class="text-lg font-semibold text-gray-700">
                        <i class="fas fa-calculator mr-2"></i>Total pendiente de pagar:
                    </span>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-red-600">${totalDeuda.toFixed(2)} h</div>
                        <div class="text-xl font-bold text-green-700">${totalImporte.toFixed(2)} €</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSeccionSinDeuda(empleados) {
        let html = `
            <details class="bg-gray-50 border border-gray-200 rounded-lg">
                <summary class="cursor-pointer p-3 font-semibold text-gray-700 hover:bg-gray-100">
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    Empleados al día (${empleados.length})
                </summary>
                <div class="p-3 space-y-2">
        `;

        empleados.forEach(balance => {
            const estadoTexto = this.formatter.getTextoEstado(balance.balance_horas);
            
            html += `
                <div class="bg-white border border-gray-200 rounded p-3 flex justify-between items-center">
                    <div class="flex items-center">
                        <span class="text-xl mr-2">${this.formatter.getEmpleadoEmoji(balance.empleado_id)}</span>
                        <span class="font-medium">${balance.empleado_nombre}</span>
                        <span class="ml-3 text-sm text-gray-600">${estadoTexto}</span>
                    </div>
                    <button 
                        onclick="liquidacionesModalHistorial.abrir('${balance.empleado_id}')"
                        class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
                    >
                        <i class="fas fa-history mr-1"></i>Historial
                    </button>
                </div>
            `;
        });

        html += `
                </div>
            </details>
        `;

        return html;
    }

    /**
     * Refresca los datos
     */
    async refresh() {
        await this.renderBalances();
    }
}

// Exportar a window
window.LiquidacionesPanel = LiquidacionesPanel;
