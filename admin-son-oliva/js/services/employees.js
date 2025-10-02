/* Forn Verge - Carga de empleados desde Supabase - MASSA SON OLIVA */

async function loadEmployees() {
    try {
        // ID del local MASSA Son Oliva
        const SON_OLIVA_LOCATION_ID = '781fd5a8-c486-4224-bd2a-bc968ad3f58c';
        
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .neq('role', 'admin')
            .eq('location_id', SON_OLIVA_LOCATION_ID)
            .order('name');

        if (error) {
            console.error('❌ Error cargando empleados:', error);
            return;
        }

        employees = data;
        // console.log('✅ Empleados cargados:', employees.length);
        
        employees.forEach(emp => {
            scheduleData[emp.id] = {};
            DAYS.forEach(day => {
                scheduleData[emp.id][day.key] = [];
            });
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}
