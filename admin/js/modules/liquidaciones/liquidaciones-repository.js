/**
 * LIQUIDACIONES REPOSITORY - Capa de Acceso a Datos
 * ==================================================
 * Gestiona todas las operaciones con Supabase para liquidaciones
 * Responsabilidad única: Persistencia de datos
 */

class LiquidacionesRepository {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * Obtiene el total de horas ya liquidadas de un empleado
     * @param {string} employeeId - UUID del empleado
     * @returns {Promise<number>}
     */
    async getTotalLiquidado(employeeId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_total_liquidated_hours', { p_employee_id: employeeId });

            if (error) throw error;

            const total = parseFloat(data) || 0;
            
            // Actualizar cache en StateManager
            window.stateManager.setLiquidaciones(employeeId, { 
                total_liquidado: total 
            });
            
            return total;
            
        } catch (error) {
            console.error('❌ Error obteniendo total liquidado:', error);
            return 0;
        }
    }

    /**
     * Obtiene la última liquidación de un empleado
     * @param {string} employeeId - UUID del empleado
     * @returns {Promise<Object|null>}
     */
    async getUltimaLiquidacion(employeeId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_last_liquidation', { p_employee_id: employeeId });

            if (error) throw error;

            const ultima = data && data.length > 0 ? data[0] : null;
            
            // Actualizar cache
            window.stateManager.setLiquidaciones(employeeId, { 
                ultima_liquidacion: ultima 
            });
            
            return ultima;
            
        } catch (error) {
            console.error('❌ Error obteniendo última liquidación:', error);
            return null;
        }
    }

    /**
     * Registra una nueva liquidación (pago)
     * @param {Object} liquidacion - Datos de la liquidación
     * @returns {Promise<Object>}
     */
    async registrar(liquidacion) {
        try {
            const { data, error } = await this.supabase
                .from('liquidaciones')
                .insert({
                    employee_id: liquidacion.employeeId,
                    liquidation_date: liquidacion.fechaPago,
                    liquidated_hours: liquidacion.horasAPagar,
                    paid_amount: liquidacion.importe,
                    covered_period_start: liquidacion.periodoDesde,
                    covered_period_end: liquidacion.periodoHasta,
                    balance_before: liquidacion.balanceBefore,
                    balance_after: liquidacion.balanceAfter,
                    manager_id: liquidacion.managerId || null,
                    notes: liquidacion.notas || null
                })
                .select()
                .single();

            if (error) throw error;

            // Actualizar cache: invalidar datos de este empleado para forzar recarga
            await this.getTotalLiquidado(liquidacion.employeeId);
            await this.getUltimaLiquidacion(liquidacion.employeeId);
            
            return {
                success: true,
                liquidacion: data,
                balance_anterior: liquidacion.balanceBefore,
                balance_nuevo: liquidacion.balanceAfter
            };

        } catch (error) {
            console.error('❌ Error registrando liquidación:', error);
            throw error;
        }
    }

    /**
     * Obtiene el historial completo de liquidaciones de un empleado
     * @param {string} employeeId - UUID del empleado
     * @param {number} limit - Máximo de registros
     * @returns {Promise<Array>}
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

            const historial = data || [];
            
            // Actualizar cache
            window.stateManager.setLiquidaciones(employeeId, { 
                historial 
            });
            
            return historial;
            
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return [];
        }
    }

    /**
     * Obtiene todas las liquidaciones de todos los empleados
     * @returns {Promise<Array>}
     */
    async getAllLiquidaciones() {
        try {
            const { data, error } = await this.supabase
                .from('liquidaciones_con_empleado')
                .select('*')
                .order('liquidation_date', { ascending: false })
                .limit(200);

            if (error) throw error;

            return data || [];
            
        } catch (error) {
            console.error('❌ Error obteniendo todas las liquidaciones:', error);
            return [];
        }
    }

    /**
     * Actualiza una liquidación existente
     * @param {string} liquidacionId - ID de la liquidación
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async actualizar(liquidacionId, datos) {
        try {
            const updateData = {};
            
            if (datos.horasAPagar !== undefined) updateData.liquidated_hours = datos.horasAPagar;
            if (datos.importe !== undefined) updateData.paid_amount = datos.importe;
            if (datos.fechaPago !== undefined) updateData.liquidation_date = datos.fechaPago;
            if (datos.periodoDesde !== undefined) updateData.covered_period_start = datos.periodoDesde;
            if (datos.periodoHasta !== undefined) updateData.covered_period_end = datos.periodoHasta;
            if (datos.notas !== undefined) updateData.notes = datos.notas;

            const { data, error } = await this.supabase
                .from('liquidaciones')
                .update(updateData)
                .eq('id', liquidacionId)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Liquidación actualizada:', data);
            return { success: true, liquidacion: data };

        } catch (error) {
            console.error('❌ Error actualizando liquidación:', error);
            throw error;
        }
    }

    /**
     * Elimina una liquidación
     * @param {string} liquidacionId - ID de la liquidación
     * @returns {Promise<Object>}
     */
    async eliminar(liquidacionId) {
        try {
            const { error } = await this.supabase
                .from('liquidaciones')
                .delete()
                .eq('id', liquidacionId);

            if (error) throw error;

            console.log('✅ Liquidación eliminada:', liquidacionId);
            return { success: true };

        } catch (error) {
            console.error('❌ Error eliminando liquidación:', error);
            throw error;
        }
    }
}

// Exportar a window
window.LiquidacionesRepository = LiquidacionesRepository;
