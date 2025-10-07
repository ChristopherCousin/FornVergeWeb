/* Forn Verge - Carga de empleados desde Supabase - MASSA SON OLIVA */

async function loadEmployees() {
    try {
        // Obtener location ID del contexto (local seleccionado por el usuario)
        const locationId = getCurrentLocationId();
        
        if (!locationId) {
            console.error('❌ No hay local seleccionado');
            return;
        }
        
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .neq('role', 'admin')
            .eq('location_id', locationId)
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
