/**
 * LIQUIDACIONES MODAL HISTORIAL - UI Modal de Historial
 * ======================================================
 * Modal para ver el historial de liquidaciones (individual o general)
 */

class LiquidacionesModalHistorial {
    constructor(service, formatter) {
        this.service = service;
        this.formatter = formatter;
        this.historialGeneralAbierto = false;
        this.todasLasLiquidaciones = [];
    }

    /**
     * Abre el modal del historial de liquidaciones de UN empleado específico
     */
    async abrir(employeeId) {
        try {
            this.historialGeneralAbierto = false;
            const historial = await this.service.getHistorial(employeeId);
            const balance = await this.service.getBalancePendientePago(employeeId);

            const html = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="modalHistorial">
                    <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div class="p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-2xl font-bold text-gray-800">
                                    📜 Historial de ${balance.empleado_nombre}
                                </h3>
                                <button onclick="document.getElementById('modalHistorial').remove()" class="text-gray-500 hover:text-gray-700">
                                    <i class="fas fa-times text-2xl"></i>
                                </button>
                            </div>

                            ${historial.length === 0 
                                ? this.renderVacio() 
                                : this.renderTabla(historial, true)
                            }
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', html);

        } catch (error) {
            console.error('❌ Error mostrando historial:', error);
            alert('Error al cargar el historial');
        }
    }

    /**
     * Abre el modal con TODAS las liquidaciones de todos los empleados
     */
    async abrirGeneral() {
        try {
            this.historialGeneralAbierto = true;
            this.todasLasLiquidaciones = await this.service.getAllLiquidaciones();

            const html = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="modalHistorial">
                    <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
                        <div class="p-6 border-b border-gray-200">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-2xl font-bold text-gray-800">
                                    📚 Historial General de Liquidaciones
                                </h3>
                                <button onclick="document.getElementById('modalHistorial').remove()" class="text-gray-500 hover:text-gray-700">
                                    <i class="fas fa-times text-2xl"></i>
                                </button>
                            </div>
                            
                            <!-- Buscador -->
                            <div class="flex items-center space-x-3">
                                <div class="flex-1">
                                    <input 
                                        type="text" 
                                        id="buscadorLiquidaciones"
                                        placeholder="🔍 Buscar por nombre de empleado..."
                                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        oninput="liquidacionesModalHistorial.filtrar()"
                                    />
                                </div>
                                <div class="text-sm text-gray-600">
                                    <span id="contadorLiquidaciones">${this.todasLasLiquidaciones.length}</span> liquidaciones
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto p-6">
                            ${this.todasLasLiquidaciones.length === 0 
                                ? this.renderVacio() 
                                : `<div id="tablaHistorialGeneral">${this.renderTabla(this.todasLasLiquidaciones, false)}</div>`
                            }
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', html);

        } catch (error) {
            console.error('❌ Error mostrando historial general:', error);
            alert('Error al cargar el historial general');
        }
    }

    /**
     * Filtra las liquidaciones por nombre de empleado
     */
    filtrar() {
        const busqueda = document.getElementById('buscadorLiquidaciones')?.value.toLowerCase() || '';
        
        const filtradas = this.todasLasLiquidaciones.filter(liq => {
            const nombreEmpleado = liq.employee_name?.toLowerCase() || '';
            return nombreEmpleado.includes(busqueda);
        });

        // Actualizar contador
        const contador = document.getElementById('contadorLiquidaciones');
        if (contador) {
            contador.textContent = filtradas.length;
        }

        // Actualizar tabla
        const contenedor = document.getElementById('tablaHistorialGeneral');
        if (contenedor) {
            contenedor.innerHTML = this.renderTabla(filtradas, false);
        }
    }

    renderVacio() {
        return `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-3"></i>
                <p>No hay liquidaciones registradas</p>
            </div>
        `;
    }

    renderTabla(historial, esIndividual = false) {
        const totalHoras = historial.reduce((sum, item) => sum + parseFloat(item.liquidated_hours), 0);
        const totalImporte = historial.reduce((sum, item) => sum + parseFloat(item.paid_amount), 0);

        return `
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-100">
                        <tr>
                            ${!esIndividual ? '<th class="px-4 py-2 text-left text-sm font-semibold">Empleado</th>' : ''}
                            <th class="px-4 py-2 text-left text-sm font-semibold">Fecha</th>
                            <th class="px-4 py-2 text-left text-sm font-semibold">Periodo</th>
                            <th class="px-4 py-2 text-center text-sm font-semibold">Horas</th>
                            <th class="px-4 py-2 text-center text-sm font-semibold">Importe</th>
                            <th class="px-4 py-2 text-left text-sm font-semibold">Notas</th>
                            <th class="px-4 py-2 text-center text-sm font-semibold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${historial.map(item => this.renderFila(item, esIndividual)).join('')}
                    </tbody>
                    <tfoot class="bg-gray-50 font-bold">
                        <tr>
                            <td colspan="${esIndividual ? 2 : 3}" class="px-4 py-3 text-right">TOTAL PAGADO:</td>
                            <td class="px-4 py-3 text-center">${totalHoras.toFixed(2)}h</td>
                            <td class="px-4 py-3 text-center text-green-600">${totalImporte.toFixed(2)}€</td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    renderFila(item, esIndividual = false) {
        const emoji = this.formatter.getEmpleadoEmoji(item.employee_id);
        const nombre = esIndividual ? '' : (item.employee_name || this.formatter.getNombreEmpleado(item.employee_id));

        return `
            <tr class="hover:bg-gray-50">
                ${!esIndividual ? `<td class="px-4 py-2"><span class="mr-1">${emoji}</span>${nombre}</td>` : ''}
                <td class="px-4 py-2">${this.formatter.formatFecha(item.liquidation_date)}</td>
                <td class="px-4 py-2 text-sm text-gray-600">
                    ${this.formatter.formatFecha(item.covered_period_start)} → 
                    ${this.formatter.formatFecha(item.covered_period_end)}
                </td>
                <td class="px-4 py-2 text-center font-semibold">${parseFloat(item.liquidated_hours).toFixed(2)}h</td>
                <td class="px-4 py-2 text-center font-bold text-green-600">${parseFloat(item.paid_amount).toFixed(2)}€</td>
                <td class="px-4 py-2 text-sm text-gray-600">${item.notes || '-'}</td>
                <td class="px-4 py-2 text-center">
                    <div class="flex items-center justify-center space-x-2">
                        <button 
                            onclick="liquidacionesModalHistorial.editar('${item.id}')"
                            class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs"
                            title="Editar liquidación"
                        >
                            <i class="fas fa-edit"></i>
                        </button>
                        <button 
                            onclick="liquidacionesModalHistorial.eliminar('${item.id}', '${item.employee_id}')"
                            class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs"
                            title="Eliminar liquidación"
                        >
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Abre el modal de edición
     */
    async editar(liquidacionId) {
        try {
            // Buscar la liquidación en el array cargado o cargarla de nuevo
            let liquidacion = this.todasLasLiquidaciones.find(l => l.id === liquidacionId);
            
            if (!liquidacion) {
                // Si no está en la lista, cargarla desde el servicio
                const todas = await this.service.getAllLiquidaciones();
                liquidacion = todas.find(l => l.id === liquidacionId);
            }

            if (!liquidacion) {
                alert('No se pudo cargar la liquidación');
                return;
            }

            // Abrir modal de edición
            if (window.liquidacionesModalEditar) {
                await window.liquidacionesModalEditar.abrir(liquidacion);
            } else {
                alert('El módulo de edición no está disponible');
            }

        } catch (error) {
            console.error('❌ Error abriendo editor:', error);
            alert('Error al abrir el editor de liquidación');
        }
    }

    /**
     * Elimina una liquidación
     */
    async eliminar(liquidacionId, employeeId) {
        try {
            const result = await this.service.eliminarLiquidacion(liquidacionId, employeeId);

            if (result && result.success) {
                alert('✅ Liquidación eliminada correctamente');

                // Cerrar y reabrir el modal para actualizar
                document.getElementById('modalHistorial')?.remove();

                // Recalcular convenio
                if (window.controlAnualController) {
                    await window.controlAnualController.actualizarDatos();
                }

                // Refrescar panel
                if (window.liquidacionesPanel) {
                    await window.liquidacionesPanel.refresh();
                }

                // Reabrir el historial
                if (this.historialGeneralAbierto) {
                    await this.abrirGeneral();
                } else {
                    await this.abrir(employeeId);
                }
            }

        } catch (error) {
            console.error('❌ Error eliminando liquidación:', error);
            alert('Error al eliminar la liquidación');
        }
    }
}

// Exportar a window
window.LiquidacionesModalHistorial = LiquidacionesModalHistorial;
