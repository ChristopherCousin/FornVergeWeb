// ================================
// CONFIGURACIÓN SUPABASE
// Forn Verge de Lluc
// ================================

import { SUPABASE_CONFIG, DEMO_WEEK } from './constants.js';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

// ================================
// CLASE PRINCIPAL SUPABASE MANAGER
// ================================

class FornSupabaseManager {
    constructor() {
        this.currentWeek = DEMO_WEEK; // Usar semana fija para la demo
    }

    // ================================
    // AUTENTICACIÓN
    // ================================

    async authenticateEmployee(accessCode) {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('access_code', btoa(accessCode))
                .single();

            if (error) {
                console.error('Error autenticación Supabase:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error en autenticación:', error);
            return null;
        }
    }

    // ================================
    // GESTIÓN DE HORARIOS
    // ================================

    async getEmployeeSchedule(employeeId, weekStart = null) {
        try {
            const week = weekStart || this.currentWeek;
            
            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    *,
                    employees(name, emoji, employee_id)
                `)
                .eq('employee_id', employeeId)
                .eq('week_start', week);

            if (error) {
                console.error('Error obteniendo horario:', error);
                return null;
            }

            return this.formatScheduleData(data);
        } catch (error) {
            console.error('Error en getEmployeeSchedule:', error);
            return null;
        }
    }

    async getAllSchedules(weekStart = null) {
        try {
            const week = weekStart || this.currentWeek;
            
            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    *,
                    employees(name, emoji, employee_id, role)
                `)
                .eq('week_start', week)
                .order('day_of_week')
                .order('start_time');

            if (error) {
                console.error('Error obteniendo todos los horarios:', error);
                return null;
            }

            return this.groupSchedulesByEmployee(data);
        } catch (error) {
            console.error('Error en getAllSchedules:', error);
            return null;
        }
    }

    async updateEmployeeShift(employeeId, day, startTime, endTime, weekStart = null) {
        try {
            const week = weekStart || this.currentWeek;
            
            // Calcular horas
            const hours = this.calculateHours(startTime, endTime);
            
            // Obtener compañeros de turno
            const colleagues = await this.getColleagues(day, startTime, endTime, employeeId, week);
            
            const { data, error } = await supabase
                .from('schedules')
                .upsert({
                    employee_id: employeeId,
                    week_start: week,
                    day_of_week: day,
                    start_time: startTime,
                    end_time: endTime,
                    hours: hours,
                    colleagues: colleagues,
                    is_free_day: false,
                    updated_at: new Date().toISOString()
                })
                .match({ employee_id: employeeId, week_start: week, day_of_week: day });

            if (error) {
                console.error('Error actualizando turno:', error);
                return false;
            }

            // Registrar cambio
            await this.logScheduleChange(employeeId, day, { startTime, endTime }, 'admin');
            
            return true;
        } catch (error) {
            console.error('Error en updateEmployeeShift:', error);
            return false;
        }
    }

    // ================================
    // UTILIDADES INTERNAS
    // ================================

    formatScheduleData(schedules) {
        const formatted = {};
        const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        // Inicializar todos los días como libres
        days.forEach(day => {
            formatted[day] = { time: 'LIBRE', hours: 0, colleagues: [] };
        });
        
        // Rellenar con datos reales
        schedules.forEach(schedule => {
            if (schedule.is_free_day) {
                formatted[schedule.day_of_week] = { 
                    time: 'LIBRE', 
                    hours: 0, 
                    colleagues: [] 
                };
            } else {
                formatted[schedule.day_of_week] = {
                    time: `${schedule.start_time} - ${schedule.end_time}`,
                    hours: schedule.hours,
                    colleagues: schedule.colleagues || []
                };
            }
        });
        
        return formatted;
    }

    groupSchedulesByEmployee(schedules) {
        const grouped = {};
        
        schedules.forEach(schedule => {
            const empId = schedule.employees.employee_id;
            
            if (!grouped[empId]) {
                grouped[empId] = {
                    name: schedule.employees.name,
                    emoji: schedule.employees.emoji,
                    id: empId,
                    role: schedule.employees.role,
                    supabase_id: schedule.employee_id, // ID real de Supabase
                    schedule: {}
                };
            }
            
            if (schedule.is_free_day) {
                grouped[empId].schedule[schedule.day_of_week] = {
                    time: 'LIBRE',
                    hours: 0,
                    colleagues: []
                };
            } else {
                grouped[empId].schedule[schedule.day_of_week] = {
                    time: `${schedule.start_time} - ${schedule.end_time}`,
                    hours: schedule.hours,
                    colleagues: schedule.colleagues || []
                };
            }
        });
        
        return grouped;
    }

    calculateHours(startTime, endTime) {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        return Math.round((end - start) / (1000 * 60 * 60));
    }

    async getColleagues(day, startTime, endTime, excludeEmployeeId, weekStart) {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    employees(name)
                `)
                .eq('week_start', weekStart)
                .eq('day_of_week', day)
                .eq('is_free_day', false)
                .neq('employee_id', excludeEmployeeId);

            if (error) return [];
            
            // Filtrar por solapamiento de horarios
            const colleagues = [];
            for (const schedule of data) {
                if (this.timesOverlap(startTime, endTime, schedule.start_time, schedule.end_time)) {
                    colleagues.push(schedule.employees.name);
                }
            }
            
            return colleagues;
        } catch (error) {
            console.error('Error obteniendo compañeros:', error);
            return [];
        }
    }

    timesOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
    }

    async logScheduleChange(employeeId, day, newData, changedBy) {
        try {
            const { error } = await supabase
                .from('schedule_changes')
                .insert({
                    employee_id: employeeId,
                    old_schedule: {},
                    new_schedule: { day, ...newData },
                    changed_by: changedBy,
                    reason: 'Cambio administrativo'
                });

            if (error) {
                console.error('Error registrando cambio:', error);
            }
        } catch (error) {
            console.error('Error en logScheduleChange:', error);
        }
    }
}

// Exportar instancia única
export const fornDB = new FornSupabaseManager(); 