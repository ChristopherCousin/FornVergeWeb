/**
 * LIQUIDACIONES MODAL PAGO - UI Modal de Pago
 * ============================================
 * Modal para registrar nuevas liquidaciones (pagos)
 */

class LiquidacionesModalPago {
    constructor(service, formatter) {
        this.service = service;
        this.formatter = formatter;
    }

    /**
     * Abre el modal para registrar un pago
     */
    async abrir(employeeId) {
        const balance = await this.service.getBalancePendientePago(employeeId);
        
        if (!balance) {
            alert('No se pudo cargar la información del empleado');
            return;
        }

        if (balance.pendiente_pago <= 0) {
            alert(`${balance.empleado_nombre} no tiene horas pendientes de pagar.`);
            return;
        }

        // Calcular periodo sugerido (último mes)
        const hoy = new Date();
        const mesAnterior = new Date(hoy);
        mesAnterior.setMonth(hoy.getMonth() - 1);
        const periodoDesde = this.formatter.formatFechaInput(mesAnterior);
        const periodoHasta = this.formatter.formatFechaInput(hoy);
        const fechaPago = this.formatter.formatFechaInput(hoy);
        
        const importeSugerido = this.formatter.calcularImporte(balance.pendiente_pago, balance.tarifa_hora);

        const html = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="modalPago">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-2xl font-bold text-gray-800">
                                💵 Registrar Pago de Horas Extra
                            </h3>
                            <button onclick="document.getElementById('modalPago').remove()" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                        </div>

                        ${this.renderInfoEmpleado(employeeId, balance, importeSugerido)}
                        ${this.renderFormulario(employeeId, balance, periodoDesde, periodoHasta, fechaPago, importeSugerido)}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Auto-calcular importe al cambiar horas
        document.getElementById('inputHorasPagar').addEventListener('input', (e) => {
            const horas = parseFloat(e.target.value) || 0;
            const importe = this.formatter.calcularImporte(horas, balance.tarifa_hora);
            document.getElementById('inputImporte').value = importe.toFixed(2);
        });
    }

    renderInfoEmpleado(employeeId, balance, importeSugerido) {
        return `
            <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                <div class="font-semibold text-lg mb-2">
                    ${this.formatter.getEmpleadoEmoji(employeeId)} ${balance.empleado_nombre}
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-gray-600">Balance total:</span> <span class="font-semibold">+${balance.balance_horas.toFixed(2)}h</span></div>
                    <div><span class="text-gray-600">Ya liquidado:</span> <span class="font-semibold">${balance.ya_liquidado.toFixed(2)}h</span></div>
                    <div class="col-span-2 text-lg">
                        <span class="text-gray-600">Pendiente:</span> 
                        <span class="font-bold text-red-600">${balance.pendiente_pago.toFixed(2)}h</span>
                        <span class="text-gray-600"> × </span>
                        <span class="font-semibold text-gray-700">${balance.tarifa_hora}€/h</span>
                        <span class="text-gray-600"> = </span>
                        <span class="font-bold text-green-600">${importeSugerido.toFixed(2)}€</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderFormulario(employeeId, balance, periodoDesde, periodoHasta, fechaPago, importeSugerido) {
        return `
            <form id="formPago" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Horas a pagar <span class="text-red-600">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="inputHorasPagar" 
                            step="0.5" 
                            min="0" 
                            max="${balance.pendiente_pago}"
                            value="${balance.pendiente_pago.toFixed(2)}"
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
                            id="inputImporte" 
                            step="0.01" 
                            min="0"
                            value="${importeSugerido.toFixed(2)}"
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
                        id="inputFechaPago" 
                        value="${fechaPago}"
                        max="${fechaPago}"
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
                            id="inputPeriodoDesde" 
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
                            id="inputPeriodoHasta" 
                            value="${periodoHasta}"
                            class="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Notas (opcional)
                    </label>
                    <textarea 
                        id="inputNotas" 
                        rows="2"
                        class="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Ej: Pago en efectivo por horas extra septiembre"
                    ></textarea>
                </div>

                <div class="flex space-x-3 pt-4">
                    <button 
                        type="button"
                        onclick="liquidacionesModalPago.procesar('${employeeId}')"
                        class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                        <i class="fas fa-check mr-2"></i>Confirmar Pago
                    </button>
                    <button 
                        type="button"
                        onclick="document.getElementById('modalPago').remove()"
                        class="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Procesa el registro del pago
     */
    async procesar(employeeId) {
        try {
            const horas = parseFloat(document.getElementById('inputHorasPagar').value);
            const importe = parseFloat(document.getElementById('inputImporte').value);
            const fechaPago = document.getElementById('inputFechaPago').value;
            const periodoDesde = document.getElementById('inputPeriodoDesde').value;
            const periodoHasta = document.getElementById('inputPeriodoHasta').value;
            const notas = document.getElementById('inputNotas').value;

            if (!horas || !importe || !fechaPago || !periodoDesde || !periodoHasta) {
                alert('Por favor completa todos los campos obligatorios');
                return;
            }

            const balance = await this.service.getBalancePendientePago(employeeId);
            
            const confirmar = confirm(
                `¿Confirmas el registro de este pago?\n\n` +
                `Empleado: ${balance.empleado_nombre}\n` +
                `Horas: ${horas}h\n` +
                `Importe: ${importe}€\n` +
                `Fecha: ${fechaPago}\n\n` +
                `Balance actual: ${balance.balance_horas.toFixed(2)}h\n` +
                `Balance después: ${(balance.balance_horas - horas).toFixed(2)}h`
            );

            if (!confirmar) return;

            // Registrar la liquidación
            const result = await this.service.registrarLiquidacion({
                employeeId,
                horasAPagar: horas,
                importe,
                fechaPago,
                periodoDesde,
                periodoHasta,
                notas: notas || null
            });

            if (result.success) {
                alert(`✅ Pago registrado correctamente\n\nHoras: ${horas}h\nImporte: ${importe}€\n\nBalance nuevo: ${result.balance_nuevo.toFixed(2)}h`);
                
                // Cerrar modal
                document.getElementById('modalPago').remove();
                
                // IMPORTANTE: Recalcular convenio para actualizar balances
                if (window.controlAnualController) {
                    await window.controlAnualController.actualizarDatos();
                }
                
                // Refrescar panel de liquidaciones
                if (window.liquidacionesPanel) {
                    await window.liquidacionesPanel.refresh();
                }
            }

        } catch (error) {
            console.error('❌ Error procesando pago:', error);
            alert('❌ Error al registrar el pago. Revisa la consola para más detalles.');
        }
    }
}

// Exportar a window
window.LiquidacionesModalPago = LiquidacionesModalPago;
