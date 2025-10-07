/**
 * MÓDULO DE LIQUIDACIONES - Integrado con ConvenioAnualManager
 * ============================================================
 * REUTILIZA los cálculos de balance que ya hace el sistema de convenio
 * NO recalcula nada, simplemente registra los pagos
 * 
 * @requires ConvenioAnualManager - debe estar inicializado primero
 */

class LiquidacionesSimple {
    constructor(supabase, convenioManager) {
        this.supabase = supabase;
        this.convenioManager = convenioManager; // El manager del convenio YA inicializado
        this.TARIFA_HORA = 15; // €/hora por defecto
    }

    /**
     * Obtiene el balance actual de un empleado desde el ConvenioManager
     * ESTO YA ESTÁ CALCULADO, solo lo leemos
     */
    getBalanceActual(employeeId) {
        const stats = this.convenioManager.getEstadoEmpleado(employeeId);
        
        if (!stats) {
            console.error('❌ No hay stats para empleado:', employeeId);
            return null;
        }

        // diferencia_carga_trabajo es el balance:
        // > 0 = La empresa DEBE horas al empleado
        // < 0 = El empleado DEBE horas a la empresa
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
     * Obtiene el total ya liquidado (pagado) de un empleado desde BD
     */
    async getTotalLiquidado(employeeId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_total_liquidated_hours', { p_employee_id: employeeId });

            if (error) throw error;

            return parseFloat(data) || 0;
        } catch (error) {
            console.error('❌ Error obteniendo total liquidado:', error);
            return 0;
        }
    }

    /**
     * Obtiene la última liquidación de un empleado
     */
    async getUltimaLiquidacion(employeeId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_last_liquidation', { p_employee_id: employeeId });

            if (error) throw error;

            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('❌ Error obteniendo última liquidación:', error);
            return null;
        }
    }

    /**
     * Calcula cuánto hay que pagar ahora
     * Balance actual - ya liquidado = pendiente de pago
     */
    async getBalancePendientePago(employeeId) {
        const balanceActual = this.getBalanceActual(employeeId);
        if (!balanceActual) return null;

        const yaLiquidado = await this.getTotalLiquidado(employeeId);
        const ultimaLiquidacion = await this.getUltimaLiquidacion(employeeId);

        // Si el balance es negativo (el empleado debe horas), no hay que pagar nada
        const pendientePago = balanceActual.balance_horas > 0 
            ? Math.max(0, balanceActual.balance_horas - yaLiquidado)
            : 0;

        // Obtener tarifa del empleado
        const empleado = this.convenioManager.empleados.find(e => e.id === employeeId);
        const tarifa = empleado?.tarifa_hora || this.TARIFA_HORA;

        return {
            ...balanceActual,
            ya_liquidado: yaLiquidado,
            pendiente_pago: pendientePago,
            ultima_liquidacion: ultimaLiquidacion,
            tarifa_hora: tarifa,
            importe_pendiente: this.calcularImporte(pendientePago, tarifa)
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

            // 4. Insertar en BD
            const { data, error } = await this.supabase
                .from('liquidaciones')
                .insert({
                    employee_id: employeeId,
                    liquidation_date: fechaPago,
                    liquidated_hours: horasAPagar,
                    paid_amount: importe,
                    covered_period_start: periodoDesde,
                    covered_period_end: periodoHasta,
                    balance_before: balance.balance_horas,
                    balance_after: balanceAfter,
                    manager_id: managerId,
                    notes: notas
                })
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Liquidación registrada:', data);
            
            return {
                success: true,
                liquidacion: data,
                balance_anterior: balance.balance_horas,
                balance_nuevo: balanceAfter
            };

        } catch (error) {
            console.error('❌ Error registrando liquidación:', error);
            throw error;
        }
    }

    /**
     * Obtiene el historial completo de liquidaciones de un empleado
     */
    async getHistorial(employeeId, limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('liquidaciones_con_empleado')
                .select('*')
                .eq('employee_id', employeeId)
                .order('liquidation_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return [];
        }
    }

    /**
     * Genera un resumen para TODOS los empleados
     */
    async getResumenTodos() {
        const empleados = this.convenioManager.empleados || [];
        const resumen = [];

        for (const empleado of empleados) {
            // Saltar empleados excluidos del convenio (ahora desde BD)
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
     * Calcula importe basado en horas y tarifa
     */
    calcularImporte(horas, tarifa = null) {
        const tarifaFinal = tarifa || this.TARIFA_HORA;
        return Math.round(horas * tarifaFinal * 100) / 100;
    }

    /**
     * Formatea un número de horas
     */
    formatHoras(horas) {
        if (horas === null || horas === undefined) return '0.00 h';
        return `${horas.toFixed(2)} h`;
    }

    /**
     * Formatea un importe monetario
     */
    formatImporte(importe) {
        if (importe === null || importe === undefined) return '0.00 €';
        return `${importe.toFixed(2)} €`;
    }

    /**
     * Formatea una fecha
     */
    formatFecha(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// Exportar a window
window.LiquidacionesSimple = LiquidacionesSimple;

