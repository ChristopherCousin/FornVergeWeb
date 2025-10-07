/**
 * INTERFAZ DE LIQUIDACIONES
 * ==========================
 * Gestiona la UI para registrar y consultar pagos de horas extra
 */

class LiquidacionesUI {
    constructor(liquidacionesService) {
        this.service = liquidacionesService;
        this.empleadoSeleccionado = null;
    }

    /**
     * Crea el panel de liquidaciones en la interfaz (COLAPSADO por defecto)
     */
    crearPanel() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error('❌ No se encuentra mainContent');
            return;
        }

        // Verificar si ya existe el panel
        if (document.getElementById('liquidacionesPanel')) {
            console.log('⚠️ Panel de liquidaciones ya existe');
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'liquidacionesPanel';
        panel.className = 'bg-white border-2 border-green-200 rounded-lg shadow-lg mb-4';
        panel.innerHTML = `
            <!-- Header Compacto (siempre visible) -->
            <div class="p-4 bg-green-50 cursor-pointer hover:bg-green-100 transition" onclick="liquidacionesUI.togglePanel()">
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
                <div class="p-4 bg-gray-50 border-b border-gray-200 flex justify-end">
                    <button 
                        id="btnRefreshLiquidaciones" 
                        class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                        onclick="event.stopPropagation(); liquidacionesUI.refresh()"
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

        console.log('✅ Panel de liquidaciones creado (colapsado)');
    }

    /**
     * Alterna la visibilidad del panel
     */
    togglePanel() {
        const content = document.getElementById('liquidacionesContent');
        const icono = document.getElementById('iconoToggleLiquidaciones');
        
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            icono.classList.add('fa-rotate-90');
        } else {
            content.classList.add('hidden');
            icono.classList.remove('fa-rotate-90');
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
                html += `
                    <div class="mb-6">
                        <h4 class="text-lg font-bold text-red-700 mb-3 flex items-center">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            Empleados con horas pendientes de pagar (${conDeuda.length})
                        </h4>
                        <div class="space-y-3">
                `;

                for (const balance of conDeuda) {
                    const colorBadge = balance.pendiente_pago > 20 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
                    
                    // Obtener tarifa del empleado
                    const empleado = this.service.convenioManager.empleados.find(e => e.id === balance.empleado_id);
                    const tarifa = empleado?.tarifa_hora || 15;
                    
                    html += `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">${this.getEmpleadoEmoji(balance.empleado_id)}</span>
                                        <h5 class="text-lg font-bold text-gray-800">${balance.empleado_nombre}</h5>
                                        <span class="ml-2 px-2 py-1 ${colorBadge} rounded text-xs font-semibold">
                                            URGENTE
                                        </span>
                                        <span class="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                            ${tarifa}€/h
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
                                            Último pago: ${this.service.formatFecha(balance.ultima_liquidacion.liquidation_date)} 
                                            (${balance.ultima_liquidacion.liquidated_hours}h por ${balance.ultima_liquidacion.paid_amount}€)
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="ml-4 flex flex-col space-y-2">
                                    <button 
                                        onclick="liquidacionesUI.abrirModalPago('${balance.empleado_id}')"
                                        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
                                        title="Registrar pago"
                                    >
                                        <i class="fas fa-euro-sign mr-1"></i>Pagar
                                    </button>
                                    <button 
                                        onclick="liquidacionesUI.verHistorial('${balance.empleado_id}')"
                                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                                        title="Ver historial"
                                    >
                                        <i class="fas fa-history mr-1"></i>Historial
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }

                html += `
                        </div>
                    </div>
                `;

                // Resumen total de deuda
                const totalDeuda = conDeuda.reduce((sum, b) => sum + b.pendiente_pago, 0);
                const totalImporte = conDeuda.reduce((sum, b) => sum + b.importe_pendiente, 0);

                html += `
                    <div class="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-semibold text-gray-700">
                                <i class="fas fa-calculator mr-2"></i>Total pendiente de pagar:
                            </span>
                            <div class="text-right">
                                <div class="text-2xl font-bold text-red-600">${totalDeuda.toFixed(2)} h</div>
                                <div class="text-xl font-bold text-green-700">${totalImporte.toFixed(2)} €</div>
                                <div class="text-xs text-gray-500">(a 15€/h)</div>
                            </div>
                        </div>
                    </div>
                `;
            }

            // EMPLEADOS SIN DEUDA
            if (sinDeuda.length > 0) {
                html += `
                    <details class="bg-gray-50 border border-gray-200 rounded-lg">
                        <summary class="cursor-pointer p-3 font-semibold text-gray-700 hover:bg-gray-100">
                            <i class="fas fa-check-circle text-green-600 mr-2"></i>
                            Empleados al día (${sinDeuda.length})
                        </summary>
                        <div class="p-3 space-y-2">
                `;

                for (const balance of sinDeuda) {
                    const estadoTexto = balance.balance_horas < 0 
                        ? `Debe ${Math.abs(balance.balance_horas).toFixed(0)}h a la empresa`
                        : 'Sin deuda';
                    
                    html += `
                        <div class="bg-white border border-gray-200 rounded p-3 flex justify-between items-center">
                            <div class="flex items-center">
                                <span class="text-xl mr-2">${this.getEmpleadoEmoji(balance.empleado_id)}</span>
                                <span class="font-medium">${balance.empleado_nombre}</span>
                                <span class="ml-3 text-sm text-gray-600">${estadoTexto}</span>
                            </div>
                            <button 
                                onclick="liquidacionesUI.verHistorial('${balance.empleado_id}')"
                                class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
                            >
                                <i class="fas fa-history mr-1"></i>Historial
                            </button>
                        </div>
                    `;
                }

                html += `
                        </div>
                    </details>
                `;
            }

            content.innerHTML = html;

        } catch (error) {
            console.error('❌ Error renderizando balances:', error);
            content.innerHTML = `
                <div class="text-center py-8 text-red-600">
                    <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                    <p>Error cargando datos de liquidaciones</p>
                    <button onclick="liquidacionesUI.refresh()" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Abre el modal para registrar un pago
     */
    async abrirModalPago(employeeId) {
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
        const periodoDesde = mesAnterior.toISOString().split('T')[0];
        const periodoHasta = hoy.toISOString().split('T')[0];
        const fechaPago = hoy.toISOString().split('T')[0];

        // Obtener tarifa del empleado
        const empleado = this.service.convenioManager.empleados.find(e => e.id === employeeId);
        const tarifa = empleado?.tarifa_hora || 15;
        
        const importeSugerido = this.service.calcularImporte(balance.pendiente_pago, tarifa);

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

                        <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                            <div class="font-semibold text-lg mb-2">
                                ${this.getEmpleadoEmoji(employeeId)} ${balance.empleado_nombre}
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div><span class="text-gray-600">Balance total:</span> <span class="font-semibold">+${balance.balance_horas.toFixed(2)}h</span></div>
                                <div><span class="text-gray-600">Ya liquidado:</span> <span class="font-semibold">${balance.ya_liquidado.toFixed(2)}h</span></div>
                                <div class="col-span-2 text-lg">
                                    <span class="text-gray-600">Pendiente:</span> 
                                    <span class="font-bold text-red-600">${balance.pendiente_pago.toFixed(2)}h</span>
                                    <span class="text-gray-600"> × </span>
                                    <span class="font-semibold text-gray-700">${tarifa}€/h</span>
                                    <span class="text-gray-600"> = </span>
                                    <span class="font-bold text-green-600">${importeSugerido.toFixed(2)}€</span>
                                </div>
                            </div>
                        </div>

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
                                    onclick="liquidacionesUI.procesarPago('${employeeId}')"
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
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Auto-calcular importe al cambiar horas
        document.getElementById('inputHorasPagar').addEventListener('input', (e) => {
            const horas = parseFloat(e.target.value) || 0;
            const importe = this.service.calcularImporte(horas, tarifa);
            document.getElementById('inputImporte').value = importe.toFixed(2);
        });
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
     * Procesa el registro del pago
     */
    async procesarPago(employeeId) {
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
                
                // Cerrar modal y refrescar
                document.getElementById('modalPago').remove();
                await this.refresh();
            }

        } catch (error) {
            console.error('❌ Error procesando pago:', error);
            alert('❌ Error al registrar el pago. Revisa la consola para más detalles.');
        }
    }

    /**
     * Muestra el historial de liquidaciones de un empleado
     */
    async verHistorial(employeeId) {
        try {
            const historial = await this.service.getHistorial(employeeId);
            const balance = await this.service.getBalancePendientePago(employeeId);

            const html = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="modalHistorial">
                    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div class="p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-2xl font-bold text-gray-800">
                                    📜 Historial de ${balance.empleado_nombre}
                                </h3>
                                <button onclick="document.getElementById('modalHistorial').remove()" class="text-gray-500 hover:text-gray-700">
                                    <i class="fas fa-times text-2xl"></i>
                                </button>
                            </div>

                            ${historial.length === 0 ? `
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-inbox text-4xl mb-3"></i>
                                    <p>No hay liquidaciones registradas</p>
                                </div>
                            ` : `
                                <div class="overflow-x-auto">
                                    <table class="min-w-full">
                                        <thead class="bg-gray-100">
                                            <tr>
                                                <th class="px-4 py-2 text-left text-sm font-semibold">Fecha</th>
                                                <th class="px-4 py-2 text-left text-sm font-semibold">Periodo</th>
                                                <th class="px-4 py-2 text-center text-sm font-semibold">Horas</th>
                                                <th class="px-4 py-2 text-center text-sm font-semibold">Importe</th>
                                                <th class="px-4 py-2 text-left text-sm font-semibold">Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200">
                                            ${historial.map(item => `
                                                <tr>
                                                    <td class="px-4 py-2">${this.service.formatFecha(item.liquidation_date)}</td>
                                                    <td class="px-4 py-2 text-sm">
                                                        ${this.service.formatFecha(item.covered_period_start)} → 
                                                        ${this.service.formatFecha(item.covered_period_end)}
                                                    </td>
                                                    <td class="px-4 py-2 text-center font-semibold">${item.liquidated_hours.toFixed(2)}h</td>
                                                    <td class="px-4 py-2 text-center font-bold text-green-600">${item.paid_amount.toFixed(2)}€</td>
                                                    <td class="px-4 py-2 text-sm text-gray-600">${item.notes || '-'}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                        <tfoot class="bg-gray-50 font-bold">
                                            <tr>
                                                <td colspan="2" class="px-4 py-3 text-right">TOTAL PAGADO:</td>
                                                <td class="px-4 py-3 text-center">${historial.reduce((sum, item) => sum + parseFloat(item.liquidated_hours), 0).toFixed(2)}h</td>
                                                <td class="px-4 py-3 text-center text-green-600">${historial.reduce((sum, item) => sum + parseFloat(item.paid_amount), 0).toFixed(2)}€</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            `}
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
     * Obtiene el emoji de un empleado desde el convenioManager
     */
    getEmpleadoEmoji(employeeId) {
        if (!this.service || !this.service.convenioManager || !this.service.convenioManager.empleados) {
            return '👤';
        }
        const empleado = this.service.convenioManager.empleados.find(e => e.id === employeeId);
        return empleado?.emoji || '👤';
    }

    /**
     * Refresca los datos
     */
    async refresh() {
        // Refrescar el convenio primero (para tener datos actualizados)
        if (this.service.convenioManager) {
            await this.service.convenioManager.init();
        }
        
        // Luego refrescar la UI de liquidaciones
        await this.renderBalances();
    }
}

// ============================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================================================

const inicializarLiquidaciones = async () => {
    if (window.liquidacionesUI || window.inicializandoLiquidaciones) {
        return;
    }
    
    window.inicializandoLiquidaciones = true;
    console.log('💰 Iniciando sistema de liquidaciones...');
    
    // VERIFICAR PERMISOS PRIMERO
    const user = getCurrentUser();
    if (!user) {
        console.log('⏳ Esperando autenticación para verificar permisos...');
        window.inicializandoLiquidaciones = false;
        setTimeout(inicializarLiquidaciones, 500);
        return;
    }
    
    // SOLO el owner puede ver liquidaciones
    if (!hasPermission('liquidaciones', 'ver')) {
        console.log('🔒 Usuario sin permisos de liquidaciones - Panel no se mostrará');
        window.inicializandoLiquidaciones = false;
        return;
    }
    
    let intentos = 0;
    const maxIntentos = 20;
    
    while (intentos < maxIntentos) {
        if (window.controlAnualSimple && 
            window.controlAnualSimple.convenioAnual && 
            window.controlAnualSimple.supabase) {
            
            try {
                console.log('✅ Dependencias de liquidaciones disponibles, inicializando...');
                
                // Crear servicio
                const liquidacionesService = new window.LiquidacionesSimple(
                    window.controlAnualSimple.supabase,
                    window.controlAnualSimple.convenioAnual
                );
                
                // Crear UI
                window.liquidacionesUI = new LiquidacionesUI(liquidacionesService);
                window.liquidacionesUI.crearPanel();
                
                // Renderizar con un pequeño delay para asegurar que el DOM esté listo
                setTimeout(async () => {
                    try {
                        await window.liquidacionesUI.renderBalances();
                        console.log('✅ Sistema de liquidaciones renderizado correctamente');
                    } catch (err) {
                        console.error('❌ Error renderizando balances:', err);
                    }
                }, 500);
                
                console.log('✅ Sistema de liquidaciones inicializado correctamente');
                window.inicializandoLiquidaciones = false;
                return;
                
            } catch (error) {
                console.error('❌ Error inicializando liquidaciones:', error);
                window.inicializandoLiquidaciones = false;
                break;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        intentos++;
    }
    
    console.error('❌ No se pudo inicializar el sistema de liquidaciones');
    window.inicializandoLiquidaciones = false;
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(inicializarLiquidaciones, 2000); // Esperar 2s para que otros sistemas se inicialicen
});

// Exportar a window
window.LiquidacionesUI = LiquidacionesUI;

