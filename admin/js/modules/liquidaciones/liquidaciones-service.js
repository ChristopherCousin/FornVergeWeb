/**
 * LIQUIDACIONES SERVICE - Lógica de Negocio
 * ==========================================
 * Coordina Repository, StateManager y Formatter
 * Sin dependencias directas de ConvenioManager
 */

class LiquidacionesService {
    constructor(supabase) {
        this.repository = new window.LiquidacionesRepository(supabase);
        this.formatter = new window.LiquidacionesFormatter();
    }

    /**
     * Obtiene el balance actual de un empleado desde StateManager
     * NO recalcula nada, solo lee el estado
     */
    getBalanceActual(employeeId) {
        const stats = window.stateManager.getConvenioStat(employeeId);
        
        if (!stats) {
            console.error('❌ No hay stats para empleado:', employeeId);
            return null;
        }

        return {
            empleado_id: stats.empleado_id,
            empleado_nombre: stats.empleado_nombre,
            balance_horas: stats.diferencia_carga_trabajo || 0,
            horas_reales: stats.horas_reales_agora || 0,
            horas_ideales: stats.horas_ideales_desde_junio || 0,
            estado: stats.estado_semanal || 'desconocido',
            recomendacion: stats.recomendacion_compensacion || ''
        };
    }

    /**
     * Calcula cuánto hay que pagar ahora
     * Balance actual - ya liquidado = pendiente de pago
     */
    async getBalancePendientePago(employeeId) {
        const balanceActual = this.getBalanceActual(employeeId);
        if (!balanceActual) return null;

        const yaLiquidado = await this.repository.getTotalLiquidado(employeeId);
        const ultimaLiquidacion = await this.repository.getUltimaLiquidacion(employeeId);

        // Si el balance es negativo (el empleado debe horas), no hay que pagar nada
        const pendientePago = balanceActual.balance_horas > 0 
            ? Math.max(0, balanceActual.balance_horas - yaLiquidado)
            : 0;

        const tarifa = this.formatter.getTarifaEmpleado(employeeId);

        return {
            ...balanceActual,
            ya_liquidado: yaLiquidado,
            pendiente_pago: pendientePago,
            ultima_liquidacion: ultimaLiquidacion,
            tarifa_hora: tarifa,
            importe_pendiente: this.formatter.calcularImporte(pendientePago, tarifa)
        };
    }

    /**
     * Registra una nueva liquidación (pago)
     */
    async registrarLiquidacion({
        employeeId,
        horasAPagar,
        importe,
        fechaPago,
        periodoDesde,
        periodoHasta,
        managerId = null,
        notas = null
    }) {
        try {
            // 1. Obtener balance actual
            const balance = await this.getBalancePendientePago(employeeId);
            
            if (!balance) {
                throw new Error('No se pudo obtener el balance del empleado');
            }

            // 2. Validar que no se pague más de lo debido
            if (horasAPagar > balance.pendiente_pago) {
                const confirmar = confirm(
                    `⚠️ ADVERTENCIA:\n\n` +
                    `Estás pagando ${horasAPagar}h pero el balance pendiente es ${balance.pendiente_pago.toFixed(2)}h\n\n` +
                    `¿Continuar de todas formas?`
                );
                if (!confirmar) return null;
            }

            // 3. Calcular balance después del pago
            const balanceAfter = balance.balance_horas - (balance.ya_liquidado + horasAPagar);

            // 4. Registrar en BD
            const resultado = await this.repository.registrar({
                employeeId,
                horasAPagar,
                importe,
                fechaPago,
                periodoDesde,
                periodoHasta,
                balanceBefore: balance.balance_horas,
                balanceAfter,
                managerId,
                notas
            });

            return resultado;

        } catch (error) {
            console.error('❌ Error registrando liquidación:', error);
            throw error;
        }
    }

    /**
     * Obtiene el historial completo de liquidaciones de un empleado
     */
    async getHistorial(employeeId, limit = 50) {
        return await this.repository.getHistorial(employeeId, limit);
    }

    /**
     * Genera un resumen para TODOS los empleados
     */
    async getResumenTodos() {
        const empleados = window.stateManager.getEmpleados();
        const resumen = [];

        for (const empleado of empleados) {
            // Saltar empleados excluidos del convenio
            if (empleado.excluido_convenio === true) {
                continue;
            }

            const balance = await this.getBalancePendientePago(empleado.id);
            
            if (balance) {
                resumen.push(balance);
            }
        }

        return resumen;
    }

    /**
     * Obtiene todas las liquidaciones de todos los empleados
     */
    async getAllLiquidaciones() {
        return await this.repository.getAllLiquidaciones();
    }

    /**
     * Actualiza una liquidación existente
     */
    async actualizarLiquidacion(liquidacionId, datos) {
        try {
            const result = await this.repository.actualizar(liquidacionId, datos);
            
            if (result.success) {
                console.log('✅ Liquidación actualizada correctamente');
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error actualizando liquidación:', error);
            throw error;
        }
    }

    /**
     * Elimina una liquidación
     */
    async eliminarLiquidacion(liquidacionId, employeeId) {
        try {
            const confirmar = confirm(
                '⚠️ ADVERTENCIA:\n\n' +
                '¿Estás seguro de que deseas eliminar esta liquidación?\n\n' +
                'Esta acción NO se puede deshacer y afectará al balance del empleado.'
            );

            if (!confirmar) return null;

            const result = await this.repository.eliminar(liquidacionId);
            
            if (result.success) {
                console.log('✅ Liquidación eliminada correctamente');
                
                // Invalidar cache para forzar recálculo
                if (employeeId) {
                    await this.repository.getTotalLiquidado(employeeId);
                    await this.repository.getUltimaLiquidacion(employeeId);
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error eliminando liquidación:', error);
            throw error;
        }
    }
}

// Exportar a window
window.LiquidacionesService = LiquidacionesService;
