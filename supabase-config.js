// Configuración de Supabase para Forn Verge de Lluc
// Instalación: npm install @supabase/supabase-js
// O incluir via CDN: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// ================================
// CONFIGURACIÓN INICIAL
// ================================

// 🔥 ACTUALIZA ESTAS VARIABLES CON TUS DATOS DE SUPABASE:
// Ve a tu proyecto Supabase > Settings > API
const SUPABASE_URL = 'https://csxgkxjeifakwslamglc.supabase.co'; // Reemplaza TU_PROJECT_ID
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg'; // Copia el anon/public key

// ⚠️ IMPORTANTE: Actualiza estas variables antes de usar!

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================
// ESTRUCTURA DE BASE DE DATOS
// ================================

/*
TABLA: employees
- id (uuid, primary key)
- name (text)
- emoji (text)
- employee_id (text, unique) ej: 'bryan', 'raquel'
- access_code (text) - código encriptado
- role (text) - 'employee' o 'admin'
- created_at (timestamp)
- updated_at (timestamp)

TABLA: schedules
- id (uuid, primary key)
- employee_id (uuid, foreign key -> employees.id)
- week_start (date) - fecha del lunes de esa semana
- day_of_week (text) - 'lunes', 'martes', etc.
- start_time (time)
- end_time (time)
- hours (integer)
- colleagues (text[]) - array de nombres de compañeros
- is_free_day (boolean)
- created_at (timestamp)
- updated_at (timestamp)

TABLA: schedule_changes
- id (uuid, primary key)
- employee_id (uuid)
- old_schedule (jsonb)
- new_schedule (jsonb)
- changed_by (text) - quien hizo el cambio
- reason (text)
- created_at (timestamp)
*/

// ================================
// FUNCIONES DE EMPLEADOS
// ================================

class FornSupabaseManager {
    constructor() {
        this.currentWeek = this.getCurrentWeekStart();
    }

    // Obtener inicio de semana actual (lunes) - FIJO PARA DEMO
    getCurrentWeekStart() {
        // Para la demo, usar siempre la semana del 13-19 enero 2025
        return '2025-01-13';
        
        // Código original comentado:
        // const today = new Date();
        // const dayOfWeek = today.getDay();
        // const monday = new Date(today);
        // monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        // return monday.toISOString().split('T')[0];
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
                console.error('Error autenticación:', error);
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

    async setFreeDay(employeeId, day, weekStart = null) {
        try {
            const week = weekStart || this.currentWeek;
            
            const { data, error } = await supabase
                .from('schedules')
                .upsert({
                    employee_id: employeeId,
                    week_start: week,
                    day_of_week: day,
                    start_time: null,
                    end_time: null,
                    hours: 0,
                    colleagues: [],
                    is_free_day: true,
                    updated_at: new Date().toISOString()
                })
                .match({ employee_id: employeeId, week_start: week, day_of_week: day });

            if (error) {
                console.error('Error estableciendo día libre:', error);
                return false;
            }

            await this.logScheduleChange(employeeId, day, 'LIBRE', 'admin');
            return true;
        } catch (error) {
            console.error('Error en setFreeDay:', error);
            return false;
        }
    }

    // ================================
    // FUNCIONES AUXILIARES
    // ================================

    formatScheduleData(schedules) {
        const formatted = {};
        const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        // Inicializar todos los días
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

    // ================================
    // FUNCIONES DE ADMINISTRACIÓN
    // ================================

    async getWeeklyStats(weekStart = null) {
        try {
            const week = weekStart || this.currentWeek;
            
            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    hours,
                    employees(name, employee_id)
                `)
                .eq('week_start', week)
                .eq('is_free_day', false);

            if (error) {
                console.error('Error obteniendo estadísticas:', error);
                return null;
            }

            const stats = {};
            data.forEach(record => {
                const empId = record.employees.employee_id;
                if (!stats[empId]) {
                    stats[empId] = {
                        name: record.employees.name,
                        totalHours: 0,
                        workingDays: 0
                    };
                }
                stats[empId].totalHours += record.hours;
                stats[empId].workingDays += 1;
            });

            return stats;
        } catch (error) {
            console.error('Error en getWeeklyStats:', error);
            return null;
        }
    }

    async bulkUpdateSchedule(scheduleUpdates) {
        try {
            const updates = scheduleUpdates.map(update => ({
                ...update,
                updated_at: new Date().toISOString()
            }));

            const { data, error } = await supabase
                .from('schedules')
                .upsert(updates);

            if (error) {
                console.error('Error en actualización masiva:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error en bulkUpdateSchedule:', error);
            return false;
        }
    }
}

// Instancia global
const fornDB = new FornSupabaseManager();

// ================================
// INSTRUCCIONES DE CONFIGURACIÓN
// ================================

/*
PASOS PARA CONFIGURAR SUPABASE:

1. Crear cuenta en https://supabase.com
2. Crear nuevo proyecto
3. Ir a SQL Editor y ejecutar:

-- Crear tabla de empleados
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '👤',
    employee_id TEXT UNIQUE NOT NULL,
    access_code TEXT NOT NULL,
    role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de horarios
CREATE TABLE schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')),
    start_time TIME,
    end_time TIME,
    hours INTEGER DEFAULT 0,
    colleagues TEXT[],
    is_free_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, week_start, day_of_week)
);

-- Crear tabla de cambios
CREATE TABLE schedule_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    old_schedule JSONB,
    new_schedule JSONB,
    changed_by TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar empleados iniciales
INSERT INTO employees (name, emoji, employee_id, access_code, role) VALUES
('BRYAN', '👨‍💼', 'bryan', 'YnJ5YW4yMDI1', 'employee'),
('RAQUEL', '👩‍💼', 'raquel', 'cmFxdWVsMjAyNQ==', 'employee'),
('MARÍA', '👩‍💼', 'maria', 'bWFyaWEyMDI1', 'employee'),
('XISCA', '👩‍💼', 'xisca', 'eGlzY2EyMDI1', 'employee'),
('ANDREA', '👩‍💼', 'andrea', 'YW5kcmVhMjAyNQ==', 'employee'),
('ADMINISTRADOR', '👔', 'admin', 'YWRtaW5mb3JuMjAyNQ==', 'admin');

4. Configurar Row Level Security (RLS):
   - Ir a Authentication > Policies
   - Habilitar RLS en todas las tablas
   - Crear políticas apropiadas

5. Obtener URL y API Key:
   - Ir a Settings > API
   - Copiar URL y anon/public key

6. Actualizar variables en este archivo:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY

7. Incluir en empleados.html:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="supabase-config.js"></script>
*/ 