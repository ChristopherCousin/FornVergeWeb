/**
 * LIQUIDACIONES MODAL EDITAR - UI Modal de Edición
 * =================================================
 * Modal para editar liquidaciones existentes
 */

class LiquidacionesModalEditar {
    constructor(service, formatter) {
        this.service = service;
        this.formatter = formatter;
    }

    /**
     * Abre el modal para editar una liquidación
     */
    async abrir(liquidacion) {
        if (!liquidacion) {
            alert('No se pudo cargar la información de la liquidación');
            return;
        }

        const empleadoNombre = this.formatter.getNombreEmpleado(liquidacion.employee_id);
        const empleadoEmoji = this.formatter.getEmpleadoEmoji(liquidacion.employee_id);

        const html = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="modalEditar">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-2xl font-bold text-gray-800">
                                ✏️ Editar Liquidación
                            </h3>
                            <button onclick="document.getElementById('modalEditar').remove()" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                        </div>

                        ${this.renderInfoLiquidacion(liquidacion, empleadoNombre, empleadoEmoji)}
                        ${this.renderFormulario(liquidacion)}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Auto-calcular importe al cambiar horas
        const tarifa = this.formatter.getTarifaEmpleado(liquidacion.employee_id);
        document.getElementById('inputHorasEditar').addEventListener('input', (e) => {
            const horas = parseFloat(e.target.value) || 0;
            const importe = this.formatter.calcularImporte(horas, tarifa);
            document.getElementById('inputImporteEditar').value = importe.toFixed(2);
        });
    }

    renderInfoLiquidacion(liquidacion, empleadoNombre, empleadoEmoji) {
        return `
            <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                <div class="font-semibold text-lg mb-2">
                    ${empleadoEmoji} ${empleadoNombre}
                </div>
                <div class="text-sm text-gray-600">
                    <div><strong>ID:</strong> ${liquidacion.id}</div>
                    <div><strong>Creada:</strong> ${this.formatter.formatFecha(liquidacion.created_at)}</div>
                </div>
            </div>
        `;
    }

    renderFormulario(liquidacion) {
        const fechaPago = this.formatter.formatFechaInput(liquidacion.liquidation_date);
        const periodoDesde = this.formatter.formatFechaInput(liquidacion.covered_period_start);
        const periodoHasta = this.formatter.formatFechaInput(liquidacion.covered_period_end);
        const hoy = this.formatter.formatFechaInput(new Date());

        return `
            <form id="formEditar" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Horas pagadas <span class="text-red-600">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="inputHorasEditar" 
                            step="0.5" 
                            min="0"
                            value="${parseFloat(liquidacion.liquidated_hours).toFixed(2)}"
                            class="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Importe pagado (€) <span class="text-red-600">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="inputImporteEditar" 
                            step="0.01" 
                            min="0"
                            value="${parseFloat(liquidacion.paid_amount).toFixed(2)}"
                            class="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Fecha del pago <span class="text-red-600">*</span>
                    </label>
                    <input 
                        type="date" 
                        id="inputFechaPagoEditar" 
                        value="${fechaPago}"
                        max="${hoy}"
                        class="w-full border border-gray-300 rounded px-3 py-2"
                        required
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Periodo desde
                        </label>
                        <input 
                            type="date" 
                            id="inputPeriodoDesdeEditar" 
                            value="${periodoDesde}"
                            class="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Periodo hasta
                        </label>
                        <input 
                            type="date" 
                            id="inputPeriodoHastaEditar" 
                            value="${periodoHasta}"
                            class="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Notas
                    </label>
                    <textarea 
                        id="inputNotasEditar" 
                        rows="2"
                        class="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Notas adicionales..."
                    >${liquidacion.notes || ''}</textarea>
                </div>

                <div class="flex space-x-3 pt-4">
                    <button 
                        type="button"
                        onclick="liquidacionesModalEditar.guardar('${liquidacion.id}', '${liquidacion.employee_id}')"
                        class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                        <i class="fas fa-save mr-2"></i>Guardar Cambios
                    </button>
                    <button 
                        type="button"
                        onclick="document.getElementById('modalEditar').remove()"
                        class="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Guarda los cambios de la liquidación
     */
    async guardar(liquidacionId, employeeId) {
        try {
            const horas = parseFloat(document.getElementById('inputHorasEditar').value);
            const importe = parseFloat(document.getElementById('inputImporteEditar').value);
            const fechaPago = document.getElementById('inputFechaPagoEditar').value;
            const periodoDesde = document.getElementById('inputPeriodoDesdeEditar').value;
            const periodoHasta = document.getElementById('inputPeriodoHastaEditar').value;
            const notas = document.getElementById('inputNotasEditar').value;

            if (!horas || !importe || !fechaPago || !periodoDesde || !periodoHasta) {
                alert('Por favor completa todos los campos obligatorios');
                return;
            }

            const confirmar = confirm(
                '¿Confirmas la actualización de esta liquidación?\n\n' +
                `Horas: ${horas}h\n` +
                `Importe: ${importe}€\n` +
                `Fecha: ${fechaPago}`
            );

            if (!confirmar) return;

            // Actualizar la liquidación
            const result = await this.service.actualizarLiquidacion(liquidacionId, {
                horasAPagar: horas,
                importe,
                fechaPago,
                periodoDesde,
                periodoHasta,
                notas: notas || null
            });

            if (result.success) {
                alert('✅ Liquidación actualizada correctamente');
                
                // Cerrar modal
                document.getElementById('modalEditar').remove();
                
                // Recalcular convenio y actualizar datos
                if (window.controlAnualController) {
                    await window.controlAnualController.actualizarDatos();
                }
                
                // Refrescar panel de liquidaciones
                if (window.liquidacionesPanel) {
                    await window.liquidacionesPanel.refresh();
                }

                // Si hay un historial general abierto, refrescarlo
                if (window.liquidacionesModalHistorial && window.liquidacionesModalHistorial.historialGeneralAbierto) {
                    window.liquidacionesModalHistorial.abrirGeneral();
                }
            }

        } catch (error) {
            console.error('❌ Error guardando cambios:', error);
            alert('❌ Error al actualizar la liquidación. Revisa la consola para más detalles.');
        }
    }
}

// Exportar a window
window.LiquidacionesModalEditar = LiquidacionesModalEditar;

