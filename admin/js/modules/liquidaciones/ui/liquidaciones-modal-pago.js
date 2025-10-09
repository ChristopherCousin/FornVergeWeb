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
        // Mostrar modal de carga
        this.mostrarModalCargando();

        try {
            // Analizar riesgo de liquidación
            const analisis = await this.service.analizarRiesgoLiquidacion(employeeId);

            if (!analisis.success) {
                alert('No se pudo cargar el análisis de riesgo: ' + analisis.error);
                document.getElementById('modalPagoCargando')?.remove();
                return;
            }

            const { balance, riesgo, recomendacion, periodo } = analisis;

            if (balance.pendiente_pago <= 0) {
                alert(`${balance.empleado_nombre} no tiene horas pendientes de pagar.`);
                document.getElementById('modalPagoCargando')?.remove();
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
                <div id="modalPago" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; border-radius: 8px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-width: 768px; width: 100%; margin: 16px; max-height: 90vh; overflow-y: auto;">
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
                            ${riesgo ? this.renderAnalisisRiesgo(riesgo, recomendacion, periodo, balance) : ''}
                            ${this.renderFormulario(employeeId, balance, periodoDesde, periodoHasta, fechaPago, importeSugerido, riesgo)}
                        </div>
                    </div>
                </div>
            `;

            // Remover modal de carga y mostrar modal real
            document.getElementById('modalPagoCargando')?.remove();
            document.body.insertAdjacentHTML('beforeend', html);

            // Auto-calcular importe al cambiar horas
            document.getElementById('inputHorasPagar').addEventListener('input', (e) => {
                const horas = parseFloat(e.target.value) || 0;
                const importe = this.formatter.calcularImporte(horas, balance.tarifa_hora);
                document.getElementById('inputImporte').value = importe.toFixed(2);
            });

            // Guardar riesgo en el modal para validación posterior
            this.currentRiesgo = riesgo;
            this.currentBalance = balance;

        } catch (error) {
            console.error('❌ Error abriendo modal:', error);
            alert('Error al abrir el modal de pago');
            document.getElementById('modalPagoCargando')?.remove();
        }
    }

    mostrarModalCargando() {
        const html = `
            <div id="modalPagoCargando" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
                <div style="background: white; border-radius: 8px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); padding: 32px; text-align: center;">
                    <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                    <p class="text-lg font-semibold">Analizando riesgo de liquidación...</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
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

    renderAnalisisRiesgo(riesgo, recomendacion, periodo, balance) {
        const colorRiesgo = {
            'ALTO': 'red',
            'MEDIO': 'orange',
            'BAJO': 'yellow',
            'MUY_BAJO': 'green'
        }[riesgo.nivelRiesgo.nivel] || 'gray';

        return `
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-${colorRiesgo}-300 rounded-lg p-5 mb-4">
                <h4 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-brain mr-2 text-blue-600"></i>
                    Análisis Inteligente
                </h4>
                
                <!-- Información del Periodo -->
                <div class="bg-white rounded p-3 mb-3">
                    <div class="text-sm font-semibold text-gray-600 mb-1">📅 Política de liquidación:</div>
                    <div class="text-base font-bold text-gray-800 capitalize">${periodo.descripcion}</div>
                    ${!periodo.yaTermino ? `
                        <div class="text-sm text-gray-600 mt-1">
                            ⏱️ Tiempo restante: <span class="font-semibold">${periodo.dias} días, ${periodo.horas} horas</span>
                        </div>
                    ` : `
                        <div class="text-sm text-green-600 mt-1 font-semibold">
                            ✅ El periodo ya terminó - Sin riesgo
                        </div>
                    `}
                </div>

                <!-- Proyección -->
                <div class="grid grid-cols-3 gap-2 mb-3">
                    <div class="bg-green-100 rounded p-2 text-center">
                        <div class="text-xs text-gray-600">Mejor caso</div>
                        <div class="text-lg font-bold text-green-700">+${riesgo.escenarios.mejor.balanceFinal.toFixed(1)}h</div>
                    </div>
                    <div class="bg-blue-100 rounded p-2 text-center">
                        <div class="text-xs text-gray-600">Esperado</div>
                        <div class="text-lg font-bold text-blue-700">${riesgo.escenarios.esperado.balanceFinal >= 0 ? '+' : ''}${riesgo.escenarios.esperado.balanceFinal.toFixed(1)}h</div>
                    </div>
                    <div class="bg-red-100 rounded p-2 text-center">
                        <div class="text-xs text-gray-600">Peor caso</div>
                        <div class="text-lg font-bold ${riesgo.escenarios.peor.balanceFinal < 0 ? 'text-red-700' : 'text-gray-700'}">${riesgo.escenarios.peor.balanceFinal >= 0 ? '+' : ''}${riesgo.escenarios.peor.balanceFinal.toFixed(1)}h</div>
                    </div>
                </div>

                ${riesgo.diasAusencia > 0 ? `
                    <div class="bg-yellow-50 border border-yellow-300 rounded p-2 mb-3 text-sm">
                        <i class="fas fa-calendar-times text-yellow-600 mr-1"></i>
                        <span class="font-semibold">Ausencias programadas:</span> ${riesgo.diasAusencia} días
                    </div>
                ` : ''}

                <!-- Nivel de Riesgo -->
                <div class="bg-${colorRiesgo}-100 border-2 border-${colorRiesgo}-400 rounded p-3 mb-3">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-sm font-semibold text-gray-600">Nivel de Riesgo</div>
                            <div class="text-xl font-bold text-${colorRiesgo}-700">${riesgo.nivelRiesgo.icono} ${riesgo.nivelRiesgo.nivel}</div>
                        </div>
                        <div class="text-sm text-gray-600">${riesgo.nivelRiesgo.descripcion}</div>
                    </div>
                </div>

                <!-- Recomendación -->
                <div class="bg-white border-2 border-blue-300 rounded p-3">
                    <div class="font-bold text-gray-800 mb-2">${recomendacion.titulo}</div>
                    <div class="text-sm text-gray-700 mb-2">${recomendacion.mensaje}</div>
                    <div class="text-sm font-semibold text-blue-700">
                        💡 ${recomendacion.accion}
                    </div>
                    ${recomendacion.alternativa ? `
                        <div class="text-xs text-gray-600 mt-1">
                            ${recomendacion.alternativa}
                        </div>
                    ` : ''}
                </div>

                <!-- Botones de Cantidad Rápida -->
                <div class="grid grid-cols-3 gap-2 mt-3">
                    <button type="button" onclick="liquidacionesModalPago.setHoras(${riesgo.recomendaciones.segura.horas.toFixed(2)})" 
                            class="px-3 py-2 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600">
                        Seguro: ${riesgo.recomendaciones.segura.horas.toFixed(1)}h
                    </button>
                    <button type="button" onclick="liquidacionesModalPago.setHoras(${riesgo.recomendaciones.moderada.horas.toFixed(2)})" 
                            class="px-3 py-2 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600">
                        Moderado: ${riesgo.recomendaciones.moderada.horas.toFixed(1)}h
                    </button>
                    <button type="button" onclick="liquidacionesModalPago.setHoras(${balance.pendiente_pago.toFixed(2)})" 
                            class="px-3 py-2 bg-${colorRiesgo}-500 text-white rounded text-xs font-semibold hover:bg-${colorRiesgo}-600">
                        Todo: ${balance.pendiente_pago.toFixed(1)}h
                    </button>
                </div>
            </div>
        `;
    }

    setHoras(horas) {
        const input = document.getElementById('inputHorasPagar');
        if (input) {
            input.value = horas.toFixed(2);
            input.dispatchEvent(new Event('input'));
        }
    }

    renderFormulario(employeeId, balance, periodoDesde, periodoHasta, fechaPago, importeSugerido, riesgo) {
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
