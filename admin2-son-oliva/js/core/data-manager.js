/**
 * GESTOR DE DATOS - FORN VERGE
 * =============================
 * Centraliza todas las operaciones con la base de datos
 */

import { LOCATION_ID } from '../config/constants.js';

export class DataManager {
    constructor(supabase) {
        this.supabase = supabase;
    }

    // ===========================
    // EMPLEADOS
    // ===========================

    /**
     * Carga todos los empleados del local
     * @returns {Array} Lista de empleados
     */
    async loadEmployees() {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .select('*')
                .neq('role', 'admin')
                .eq('location_id', LOCATION_ID)
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error cargando empleados:', error);
            return [];
        }
    }

    /**
     * Crea un nuevo empleado
     * @param {Object} employeeData - Datos del empleado
     * @returns {Object} Empleado creado
     */
    async createEmployee(employeeData) {
        try {
            const newEmployee = {
                ...employeeData,
                location_id: LOCATION_ID,
                role: 'employee'
            };

            const { data, error } = await this.supabase
                .from('employees')
                .insert([newEmployee])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creando empleado:', error);
            throw error;
        }
    }

    /**
     * Actualiza un empleado existente
     * @param {string} employeeId - ID del empleado
     * @param {Object} updates - Datos a actualizar
     * @returns {Object} Empleado actualizado
     */
    async updateEmployee(employeeId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .update(updates)
                .eq('id', employeeId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error actualizando empleado:', error);
            throw error;
        }
    }

    /**
     * Elimina un empleado
     * @param {string} employeeId - ID del empleado
     */
    async deleteEmployee(employeeId) {
        try {
            const { error } = await this.supabase
                .from('employees')
                .delete()
                .eq('id', employeeId);

            if (error) throw error;
        } catch (error) {
            console.error('Error eliminando empleado:', error);
            throw error;
        }
    }

    // ===========================
    // HORARIOS
    // ===========================

    /**
     * Carga los horarios de una semana específica
     * @param {string} weekStart - Fecha de inicio de semana
     * @returns {Object} Datos de horarios organizados por empleado y día
     */
    async loadSchedules(weekStart) {
        try {
            const { data, error } = await this.supabase
                .from('schedules')
                .select('*')
                .eq('week_start', weekStart);

            if (error) throw error;

            // Organizar datos por empleado y día
            const scheduleData = {};
            (data || []).forEach(schedule => {
                if (!scheduleData[schedule.employee_id]) {
                    scheduleData[schedule.employee_id] = {};
                }
                
                if (!scheduleData[schedule.employee_id][schedule.day_of_week]) {
                    scheduleData[schedule.employee_id][schedule.day_of_week] = [];
                }
                
                scheduleData[schedule.employee_id][schedule.day_of_week].push({
                    id: schedule.id,
                    start: schedule.start_time,
                    end: schedule.end_time,
                    hours: schedule.hours_worked || 0,
                    free: schedule.is_free_day || false,
                    type: schedule.shift_type || 'morning',
                    sequence: schedule.shift_sequence || 0
                });
            });

            return scheduleData;
        } catch (error) {
            console.error('Error cargando horarios:', error);
            return {};
        }
    }

    /**
     * Guarda los horarios de una semana
     * @param {string} weekStart - Fecha de inicio de semana
     * @param {Object} scheduleData - Datos de horarios
     */
    async saveSchedules(weekStart, scheduleData) {
        try {
            // Primero eliminar horarios existentes de la semana
            await this.supabase
                .from('schedules')
                .delete()
                .eq('week_start', weekStart);

            // Preparar nuevos registros
            const records = [];
            Object.keys(scheduleData).forEach(employeeId => {
                const employeeSchedule = scheduleData[employeeId];
                Object.keys(employeeSchedule).forEach(day => {
                    const dayShifts = employeeSchedule[day];
                    dayShifts.forEach((shift, index) => {
                        records.push({
                            employee_id: employeeId,
                            week_start: weekStart,
                            day_of_week: day,
                            start_time: shift.free ? null : shift.start,
                            end_time: shift.free ? null : shift.end,
                            hours_worked: shift.free ? 0 : (shift.hours || 0),
                            is_free_day: shift.free || false,
                            shift_type: shift.type || 'morning',
                            shift_sequence: index
                        });
                    });
                });
            });

            // Insertar nuevos registros
            if (records.length > 0) {
                const { error } = await this.supabase
                    .from('schedules')
                    .insert(records);

                if (error) throw error;
            }
        } catch (error) {
            console.error('Error guardando horarios:', error);
            throw error;
        }
    }

    /**
     * Elimina un turno específico
     * @param {string} scheduleId - ID del turno
     */
    async deleteShift(scheduleId) {
        try {
            const { error } = await this.supabase
                .from('schedules')
                .delete()
                .eq('id', scheduleId);

            if (error) throw error;
        } catch (error) {
            console.error('Error eliminando turno:', error);
            throw error;
        }
    }

    // ===========================
    // AUSENCIAS
    // ===========================

    /**
     * Carga todas las ausencias
     * @returns {Array} Lista de ausencias
     */
    async loadAbsences() {
        try {
            const { data, error } = await this.supabase
                .from('ausencias')
                .select('*')
                .order('fecha_inicio', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error cargando ausencias:', error);
            return [];
        }
    }

    /**
     * Crea una nueva ausencia
     * @param {Object} absenceData - Datos de la ausencia
     * @returns {Object} Ausencia creada
     */
    async createAbsence(absenceData) {
        try {
            const { data, error } = await this.supabase
                .from('ausencias')
                .insert([absenceData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creando ausencia:', error);
            throw error;
        }
    }

    /**
     * Elimina una ausencia
     * @param {string} absenceId - ID de la ausencia
     */
    async deleteAbsence(absenceId) {
        try {
            const { error } = await this.supabase
                .from('ausencias')
                .delete()
                .eq('id', absenceId);

            if (error) throw error;
        } catch (error) {
            console.error('Error eliminando ausencia:', error);
            throw error;
        }
    }

    // ===========================
    // FICHAJES (para convenio)
    // ===========================

    /**
     * Carga los fichajes desde una fecha específica
     * @param {string} fromDate - Fecha desde la cual cargar
     * @returns {Array} Lista de fichajes
     */
    async loadTimeClocks(fromDate) {
        try {
            const { data, error } = await this.supabase
                .from('fichajes')
                .select('*')
                .gte('fecha', fromDate)
                .order('fecha', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error cargando fichajes:', error);
            return [];
        }
    }

    // ===========================
    // PREFERENCIAS DE EMPLEADOS
    // ===========================

    /**
     * Carga las preferencias de un empleado
     * @param {string} employeeId - ID del empleado
     * @returns {Object} Preferencias del empleado
     */
    async loadEmployeePreferences(employeeId) {
        try {
            const { data, error } = await this.supabase
                .from('employee_preferences')
                .select('*')
                .eq('employee_id', employeeId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
            return data || {};
        } catch (error) {
            console.error('Error cargando preferencias:', error);
            return {};
        }
    }

    /**
     * Guarda las preferencias de un empleado
     * @param {string} employeeId - ID del empleado
     * @param {Object} preferences - Preferencias a guardar
     */
    async saveEmployeePreferences(employeeId, preferences) {
        try {
            const { error } = await this.supabase
                .from('employee_preferences')
                .upsert({
                    employee_id: employeeId,
                    ...preferences
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error guardando preferencias:', error);
            throw error;
        }
    }

    // ===========================
    // UTILIDADES
    // ===========================

    /**
     * Ejecuta una consulta personalizada
     * @param {string} table - Tabla a consultar
     * @param {Object} options - Opciones de consulta
     * @returns {Array} Resultados de la consulta
     */
    async customQuery(table, options = {}) {
        try {
            let query = this.supabase.from(table);

            if (options.select) query = query.select(options.select);
            if (options.eq) {
                Object.keys(options.eq).forEach(key => {
                    query = query.eq(key, options.eq[key]);
                });
            }
            if (options.neq) {
                Object.keys(options.neq).forEach(key => {
                    query = query.neq(key, options.neq[key]);
                });
            }
            if (options.gte) {
                Object.keys(options.gte).forEach(key => {
                    query = query.gte(key, options.gte[key]);
                });
            }
            if (options.order) {
                query = query.order(options.order.column, { ascending: options.order.ascending });
            }

            const { data, error } = await query;
            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error en consulta personalizada:', error);
            return [];
        }
    }
}
