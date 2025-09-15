// admin/js/admin-empleados.js

document.addEventListener('DOMContentLoaded', () => {
    const LOCATION_ID = '781fd5a8-c486-4224-bd2a-bc968ad3f58c'; // ID para Forn Verge ARAGON

    // --- ELEMENTOS DEL DOM ---
    const employeesModal = document.getElementById('employeesModal');
    const employeesBtn = document.getElementById('employeesBtn');
    const closeEmployeesModal = document.getElementById('closeEmployeesModal');
    const newEmployeeForm = document.getElementById('newEmployeeForm');
    const employeesListContainer = document.getElementById('employeesListContainer');

    // --- ABRIR Y CERRAR MODAL ---
    employeesBtn.addEventListener('click', () => {
        employeesModal.style.display = 'block';
        loadEmployees();
    });

    closeEmployeesModal.addEventListener('click', () => {
        employeesModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === employeesModal) {
            employeesModal.style.display = 'none';
        }
    });

    // --- LÓGICA PRINCIPAL ---

    /**
     * Carga y muestra la lista de empleados desde Supabase.
     */
    async function loadEmployees() {
        // Asumiendo que 'supabase' está disponible globalmente desde admin-horarios.js o un script similar.
        if (!window.supabase) {
            console.error('Supabase client is not initialized.');
            employeesListContainer.innerHTML = `<p class="text-red-500">Error: Supabase no está conectado.</p>`;
            return;
        }

        employeesListContainer.innerHTML = '<p>Cargando empleadas...</p>';

        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('location_id', LOCATION_ID)
                .order('name', { ascending: true });

            if (error) throw error;

            renderEmployeesList(data);
        } catch (error) {
            console.error('Error cargando empleados:', error.message);
            employeesListContainer.innerHTML = `<p class="text-red-500">No se pudieron cargar las empleadas.</p>`;
        }
    }

    /**
     * Renderiza la lista de empleados en el contenedor.
     * @param {Array} employees - La lista de empleados.
     */
    function renderEmployeesList(employees) {
        if (!employees || employees.length === 0) {
            employeesListContainer.innerHTML = '<p>No hay empleadas registradas.</p>';
            return;
        }

        employeesListContainer.innerHTML = employees.map(employee => `
            <div class="flex justify-between items-center p-2 bg-gray-100 rounded-lg">
                <div>
                    <span class="font-semibold">${employee.name}</span>
                    <br>
                    <small class="text-gray-500">Login ID: ${employee.employee_id}</small>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="text-blue-500 hover:text-blue-700" title="Editar Preferencias" onclick="openPreferencesModal('${employee.id}', '${employee.name}')">
                        <i class="fas fa-sliders-h"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700" title="Eliminar Empleada" onclick="deleteEmployee('${employee.id}', '${employee.name}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Maneja el envío del formulario para crear un nuevo empleado.
     */
    newEmployeeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const name = document.getElementById('employeeName').value.trim();
        const fecha_alta = document.getElementById('employeeStartDate').value;
        const employee_id = document.getElementById('employeeLoginId').value.trim();
        const access_code = document.getElementById('employeeAccessCode').value.trim();

        if (!name || !fecha_alta || !employee_id || !access_code) {
            Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
            return;
        }

        const newEmployee = {
            name,
            fecha_alta,
            employee_id,
            access_code: btoa(access_code),
            location_id: LOCATION_ID
        };
        
        try {
            const { data, error } = await supabase
                .from('employees')
                .insert([newEmployee])
                .select();
            
            if (error) {
                if (error.code === '23505') { // Error de violación de unicidad (para employee_id)
                    throw new Error('El "ID de Empleado" ya existe. Por favor, elige otro.');
                }
                throw error;
            }
            
            Swal.fire('¡Éxito!', `La empleada ${name} ha sido añadida correctamente.`, 'success');
            newEmployeeForm.reset();
            loadEmployees(); // Recargar la lista

        } catch (error) {
            console.error('Error al añadir empleada:', error.message);
            Swal.fire('Error', `No se pudo añadir la empleada: ${error.message}`, 'error');
        }
    });


    /**
     * Elimina un empleado (función global para el onclick).
     * @param {string} id - El ID del empleado (UUID).
     * @param {string} name - El nombre del empleado.
     */
    window.deleteEmployee = async (id, name) => {
        const result = await Swal.fire({
            title: `¿Seguro que quieres eliminar a ${name}?`,
            text: "Esta acción eliminará también todos sus fichajes. No se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // Paso 1: Eliminar los registros de fichajes asociados al empleado.
                // La columna en 'fichajes' que referencia a 'employees' es 'empleado_id'.
                const { error: fichajesError } = await supabase
                    .from('fichajes')
                    .delete()
                    .eq('empleado_id', id);

                if (fichajesError) {
                    // Si hay un error aquí, lo lanzamos para que lo capture el bloque catch.
                    throw fichajesError;
                }

                // Paso 2: Una vez eliminados los fichajes, eliminar al empleado.
                const { error: employeeError } = await supabase
                    .from('employees')
                    .delete()
                    .eq('id', id);

                if (employeeError) {
                    throw employeeError;
                }

                Swal.fire('Eliminada', `${name} y todos sus fichajes han sido eliminados.`, 'success');
                loadEmployees(); // Recargar la lista

            } catch (error) {
                console.error('Error al eliminar empleada:', error.message);
                Swal.fire(
                    'Error', 
                    `No se pudo eliminar a ${name}.<br><small>Detalles: ${error.message}</small>`, 
                    'error'
                );
            }
        }
    }

    // --- LÓGICA DE PREFERENCIAS ---
    const preferencesModal = document.getElementById('preferencesModal');
    const closePreferencesModal = document.getElementById('closePreferencesModal');
    const cancelPreferences = document.getElementById('cancelPreferences');
    const preferencesForm = document.getElementById('preferencesForm');
    const preferenceEmployeeId = document.getElementById('preferenceEmployeeId');
    const preferenceEmployeeName = document.getElementById('preferenceEmployeeName');
    const turnoPreferencia = document.getElementById('turnoPreferencia');
    const partidoPreferencia = document.getElementById('partidoPreferencia');
    const notasPreferencia = document.getElementById('notasPreferencia');
    const fixedDayOffPreferencia = document.getElementById('fixedDayOffPreferencia');

    window.openPreferencesModal = async (employeeId, employeeName) => {
        preferenceEmployeeId.value = employeeId;
        preferenceEmployeeName.textContent = employeeName;

        // Cargar preferencias existentes
        const { data, error } = await supabase
            .from('employees')
            .select('schedule_preferences')
            .eq('id', employeeId)
            .single();

        if (error) {
            console.error('Error cargando preferencias:', error);
            Swal.fire('Error', 'No se pudieron cargar las preferencias.', 'error');
            return;
        }

        const prefs = data.schedule_preferences || {};
        turnoPreferencia.value = prefs.availability || 'any';
        partidoPreferencia.value = prefs.split_shifts || 'yes';
        fixedDayOffPreferencia.value = prefs.fixed_day_off || 'none';
        notasPreferencia.value = prefs.notes || '';

        preferencesModal.style.display = 'block';
    };

    const closePrefsModal = () => {
        preferencesModal.style.display = 'none';
    };

    closePreferencesModal.addEventListener('click', closePrefsModal);
    cancelPreferences.addEventListener('click', closePrefsModal);

    preferencesForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const employeeId = preferenceEmployeeId.value;

        const newPrefs = {
            availability: turnoPreferencia.value,
            split_shifts: partidoPreferencia.value,
            fixed_day_off: fixedDayOffPreferencia.value,
            notes: notasPreferencia.value.trim()
        };

        const { error } = await supabase
            .from('employees')
            .update({ schedule_preferences: newPrefs })
            .eq('id', employeeId);

        if (error) {
            console.error('Error guardando preferencias:', error);
            Swal.fire('Error', 'No se pudieron guardar las preferencias.', 'error');
        } else {
            Swal.fire('¡Guardado!', 'Las preferencias se han actualizado.', 'success');
            closePrefsModal();
        }
    });
});
