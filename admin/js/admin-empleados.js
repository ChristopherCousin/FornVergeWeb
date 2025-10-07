// admin/js/admin-empleados.js

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const employeesModal = document.getElementById('employeesModal');
    const employeesBtn = document.getElementById('employeesBtn');
    const closeEmployeesModal = document.getElementById('closeEmployeesModal');
    const newEmployeeForm = document.getElementById('newEmployeeForm');
    const employeesListContainer = document.getElementById('employeesListContainer');

    // --- ABRIR Y CERRAR MODAL ---
    employeesBtn.addEventListener('click', async () => {
        employeesModal.style.display = 'block';
        await loadAgoraNames(); // Cargar nombres de Ágora primero
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
     * Carga los nombres únicos de empleados desde Ágora
     */
    async function loadAgoraNames() {
        const select = document.getElementById('employeeAgoraName');
        select.innerHTML = '<option value="">Mismo nombre</option><option disabled>Cargando...</option>';
        
        try {
            const agoraApi = new window.AgoraApiService();
            const fichajes = await agoraApi.obtenerFichajes('2025-01-01', new Date().toISOString().split('T')[0]);
            
            // Extraer nombres únicos
            const nombresUnicos = [...new Set(fichajes.map(f => f.Empleado))].sort();
            
            select.innerHTML = '<option value="">Mismo nombre</option>' + 
                nombresUnicos.map(nombre => `<option value="${nombre}">${nombre}</option>`).join('');
        } catch (error) {
            console.error('Error cargando nombres de Ágora:', error);
            select.innerHTML = '<option value="">Mismo nombre</option><option disabled>Error cargando</option>';
        }
    }

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
            // Obtener location ID del contexto (local seleccionado por el usuario)
            const locationId = getCurrentLocationId();
            
            if (!locationId) {
                console.error('❌ No hay local seleccionado');
                employeesListContainer.innerHTML = `<p class="text-red-500">No hay local seleccionado</p>`;
                return;
            }
            
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('location_id', locationId)
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

        employeesListContainer.innerHTML = employees.map(employee => {
            // Formatear fecha de alta
            let fechaAltaStr = '';
            if (employee.fecha_alta) {
                const fechaAlta = new Date(employee.fecha_alta);
                fechaAltaStr = fechaAlta.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                });
            }
            
            return `
            <div class="flex justify-between items-center p-2 bg-gray-100 rounded-lg">
                <div class="flex-1">
                    <span class="font-semibold">${employee.name}</span>
                    ${employee.agora_employee_name && employee.agora_employee_name !== employee.name ? 
                        `<span class="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Ágora: ${employee.agora_employee_name}</span>` 
                        : ''}
                    ${employee.excluido_convenio ? 
                        `<span class="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-semibold">⚠️ Excluido Convenio</span>` 
                        : ''}
                    <br>
                    <small class="text-gray-500">
                        Login ID: ${employee.employee_id}
                        ${fechaAltaStr ? ` • <span class="text-blue-600 font-medium">📅 Alta: ${fechaAltaStr}</span>` : ''}
                    </small>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="text-purple-500 hover:text-purple-700" title="Mapear con Ágora" onclick="editAgoraName('${employee.id}', '${employee.name}', '${employee.agora_employee_name || ''}')">
                        <i class="fas fa-link"></i>
                    </button>
                    ${isOwner() ? `
                        <button class="text-orange-500 hover:text-orange-700" title="Configurar Convenio" onclick="toggleExcluirConvenio('${employee.id}', '${employee.name}', ${employee.excluido_convenio || false})">
                            <i class="fas fa-file-contract"></i>
                        </button>
                    ` : ''}
                    <button class="text-blue-500 hover:text-blue-700" title="Editar Preferencias" onclick="openPreferencesModal('${employee.id}', '${employee.name}')">
                        <i class="fas fa-sliders-h"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700" title="Eliminar Empleada" onclick="deleteEmployee('${employee.id}', '${employee.name}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    /**
     * Maneja el envío del formulario para crear un nuevo empleado.
     */
    newEmployeeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const name = document.getElementById('employeeName').value.trim();
        const agora_name = document.getElementById('employeeAgoraName').value.trim();
        const fecha_alta = document.getElementById('employeeStartDate').value;
        const employee_id = document.getElementById('employeeLoginId').value.trim();
        const access_code = document.getElementById('employeeAccessCode').value.trim();

        if (!name || !fecha_alta || !employee_id || !access_code) {
            Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
            return;
        }

        // Obtener location ID del contexto (local seleccionado por el usuario)
        const locationId = getCurrentLocationId();
        
        if (!locationId) {
            Swal.fire('Error', 'No hay local seleccionado.', 'error');
            return;
        }
        
        const newEmployee = {
            name,
            agora_employee_name: agora_name || name, // Si está vacío, usar el mismo nombre
            fecha_alta,
            employee_id,
            access_code: btoa(access_code),
            location_id: locationId
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
     * Alterna si un empleado está excluido del convenio (SOLO OWNER)
     */
    window.toggleExcluirConvenio = async (id, name, currentlyExcluded) => {
        const action = currentlyExcluded ? 'incluir en' : 'excluir de';
        const confirmText = currentlyExcluded 
            ? `¿Volver a incluir a <strong>${name}</strong> en el análisis del convenio?`
            : `¿Excluir a <strong>${name}</strong> del análisis del convenio?<br><small class="text-gray-600">Esto es para socios o autónomos que no están sujetos al convenio colectivo.</small>`;
        
        const result = await Swal.fire({
            title: currentlyExcluded ? 'Incluir en Convenio' : 'Excluir del Convenio',
            html: confirmText,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: currentlyExcluded ? '#3085d6' : '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: currentlyExcluded ? 'Sí, incluir' : 'Sí, excluir',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            try {
                const { error } = await supabase
                    .from('employees')
                    .update({ excluido_convenio: !currentlyExcluded })
                    .eq('id', id);
                
                if (error) throw error;
                
                Swal.fire(
                    '¡Actualizado!',
                    `${name} ha sido ${currentlyExcluded ? 'incluido en' : 'excluido de'} el análisis del convenio.`,
                    'success'
                );
                
                loadEmployees(); // Recargar lista
                
            } catch (error) {
                console.error('Error actualizando convenio:', error);
                Swal.fire('Error', 'No se pudo actualizar la configuración.', 'error');
            }
        }
    };

    /**
     * Edita el nombre de Ágora de un empleado (función global para el onclick).
     * @param {string} id - El ID del empleado (UUID).
     * @param {string} name - El nombre del empleado.
     * @param {string} currentAgoraName - El nombre actual en Ágora.
     */
    window.editAgoraName = async (id, name, currentAgoraName) => {
        // Cargar nombres de Ágora
        const agoraApi = new window.AgoraApiService();
        const fichajes = await agoraApi.obtenerFichajes('2025-01-01', new Date().toISOString().split('T')[0]);
        const nombresUnicos = [...new Set(fichajes.map(f => f.Empleado))].sort();
        
        const options = {
            '': 'Mismo nombre'
        };
        nombresUnicos.forEach(nombre => options[nombre] = nombre);
        
        const { value: agoraName } = await Swal.fire({
            title: `Mapear ${name} con Ágora`,
            html: `<p class="text-sm text-gray-600 mb-4">Selecciona el nombre con el que <strong>${name}</strong> ficha en Ágora.</p>`,
            input: 'select',
            inputOptions: options,
            inputValue: currentAgoraName || '',
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar'
        });

        if (agoraName !== undefined) { // undefined = cancelado, '' = vacío válido
            try {
                const { error } = await supabase
                    .from('employees')
                    .update({ agora_employee_name: agoraName || name })
                    .eq('id', id);

                if (error) throw error;

                Swal.fire('¡Éxito!', `Nombre en Ágora actualizado: "${agoraName || name}"`, 'success');
                loadEmployees();
            } catch (error) {
                console.error('Error actualizando nombre Ágora:', error);
                Swal.fire('Error', 'No se pudo actualizar el nombre.', 'error');
            }
        }
    };

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
    
    // ✨ NUEVO: Elementos para preferencias alternantes
    const alternatingPatternEnabled = document.getElementById('alternatingPatternEnabled');
    const alternatingPatternFields = document.getElementById('alternatingPatternFields');
    const alternatingFrequency = document.getElementById('alternatingFrequency');
    const alternatingStartWeek = document.getElementById('alternatingStartWeek');
    
    // ✨ NUEVO: Excluir del generador
    const excludeFromGenerator = document.getElementById('excludeFromGenerator');
    
    // ✨ NUEVO: Prioridad para primer turno
    const priorityFirstShift = document.getElementById('priorityFirstShift');
    
    // Toggle para mostrar/ocultar campos de patrón alternante
    if (alternatingPatternEnabled) {
        alternatingPatternEnabled.addEventListener('change', () => {
            if (alternatingPatternEnabled.value === 'true') {
                alternatingPatternFields.classList.remove('hidden');
            } else {
                alternatingPatternFields.classList.add('hidden');
            }
        });
    }
    
    // Botón de info para explicar qué son las preferencias alternantes
    const btnInfoAlternante = document.getElementById('btnInfoAlternante');
    if (btnInfoAlternante) {
        btnInfoAlternante.addEventListener('click', () => {
            Swal.fire({
                title: '¿Qué son las Preferencias Alternantes?',
                html: `
                    <div class="text-left space-y-3">
                        <p><strong>Las preferencias alternantes</strong> permiten configurar días libres que se repiten cada cierto número de semanas.</p>
                        
                        <div class="bg-blue-50 p-3 rounded">
                            <p class="font-semibold mb-2">📅 Ejemplo 1: Fines de semana alternos</p>
                            <ul class="text-sm space-y-1 ml-4">
                                <li>• Frecuencia: Quincenal (cada 2 semanas)</li>
                                <li>• Días: Sábado y Domingo</li>
                                <li>• Resultado: Libra fines de semana 1 semana sí, 1 no</li>
                            </ul>
                        </div>
                        
                        <div class="bg-green-50 p-3 rounded">
                            <p class="font-semibold mb-2">📅 Ejemplo 2: Lunes libres mensuales</p>
                            <ul class="text-sm space-y-1 ml-4">
                                <li>• Frecuencia: Mensual (cada 4 semanas)</li>
                                <li>• Días: Lunes</li>
                                <li>• Resultado: Libra lunes 1 semana al mes</li>
                            </ul>
                        </div>
                        
                        <p class="text-sm text-gray-600 mt-3">
                            <i class="fas fa-info-circle mr-1"></i>
                            El sistema calculará automáticamente en qué semanas aplica el patrón basándose en la fecha de inicio que especifiques.
                        </p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Entendido',
                width: '600px'
            });
        });
    }

    window.openPreferencesModal = async (employeeId, employeeName) => {
        preferenceEmployeeId.value = employeeId;
        preferenceEmployeeName.textContent = employeeName;

        // Cargar datos del empleado y preferencias
        const { data, error } = await supabase
            .from('employees')
            .select('schedule_preferences, fecha_alta, tarifa_hora, fecha_inicio_computo')
            .eq('id', employeeId)
            .single();

        if (error) {
            console.error('Error cargando preferencias:', error);
            Swal.fire('Error', 'No se pudieron cargar las preferencias.', 'error');
            return;
        }

        // Cargar datos básicos
        document.getElementById('editFechaAlta').value = data.fecha_alta || '';
        document.getElementById('editTarifaHora').value = data.tarifa_hora || '';
        document.getElementById('editFechaInicioComputo').value = data.fecha_inicio_computo || '';

        const prefs = data.schedule_preferences || {};
        turnoPreferencia.value = prefs.availability || 'any';
        partidoPreferencia.value = prefs.split_shifts || 'yes';
        fixedDayOffPreferencia.value = prefs.fixed_day_off || 'none';
        notasPreferencia.value = prefs.notes || '';
        
        // ✨ NUEVO: Cargar exclusión del generador
        excludeFromGenerator.checked = prefs.exclude_from_generator || false;
        
        // ✨ NUEVO: Cargar prioridad primer turno
        priorityFirstShift.checked = prefs.priority_first_shift || false;

        // ✨ NUEVO: Cargar preferencias alternantes
        const alternating = prefs.alternating_pattern || {};
        alternatingPatternEnabled.value = alternating.enabled ? 'true' : 'false';
        
        // Mostrar/ocultar campos según el estado
        if (alternating.enabled) {
            alternatingPatternFields.classList.remove('hidden');
            
            // Cargar valores
            alternatingFrequency.value = alternating.pattern?.frequency || 2;
            alternatingStartWeek.value = alternating.pattern?.start_week || '';
            
            // Marcar checkboxes de días
            const days = alternating.pattern?.days || [];
            document.querySelectorAll('.alternating-days').forEach(checkbox => {
                checkbox.checked = days.includes(checkbox.value);
            });
        } else {
            alternatingPatternFields.classList.add('hidden');
            
            // Limpiar campos
            document.querySelectorAll('.alternating-days').forEach(checkbox => {
                checkbox.checked = false;
            });
        }

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

        // ✨ NUEVO: Construir objeto de preferencias alternantes
        const alternatingEnabled = alternatingPatternEnabled.value === 'true';
        const alternatingDays = Array.from(document.querySelectorAll('.alternating-days:checked'))
            .map(cb => cb.value);
        
        // Validación: Si está habilitado, debe tener días seleccionados y fecha de inicio
        if (alternatingEnabled) {
            if (alternatingDays.length === 0) {
                Swal.fire('Error', 'Debes seleccionar al menos un día para el patrón alternante.', 'error');
                return;
            }
            if (!alternatingStartWeek.value) {
                Swal.fire('Error', 'Debes especificar una fecha de inicio para el patrón alternante.', 'error');
                return;
            }
            
            // Verificar que la fecha sea un lunes
            const startDate = new Date(alternatingStartWeek.value);
            if (startDate.getDay() !== 1) {
                const result = await Swal.fire({
                    title: 'Advertencia',
                    text: 'La fecha seleccionada no es un lunes. ¿Deseas continuar de todas formas?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, continuar',
                    cancelButtonText: 'Cancelar'
                });
                if (!result.isConfirmed) return;
            }
        }

        const newPrefs = {
            availability: turnoPreferencia.value,
            split_shifts: partidoPreferencia.value,
            fixed_day_off: fixedDayOffPreferencia.value,
            notes: notasPreferencia.value.trim(),
            
            // ✨ NUEVO: Excluir del generador
            exclude_from_generator: excludeFromGenerator.checked,
            
            // ✨ NUEVO: Prioridad primer turno
            priority_first_shift: priorityFirstShift.checked,
            
            // ✨ NUEVO: Preferencias alternantes
            alternating_pattern: {
                enabled: alternatingEnabled,
                type: "custom",
                pattern: alternatingEnabled ? {
                    frequency: parseInt(alternatingFrequency.value),
                    days: alternatingDays,
                    start_week: alternatingStartWeek.value
                } : null
            }
        };

        console.log('💾 Guardando preferencias:', newPrefs);

        // Obtener datos básicos
        const fechaAlta = document.getElementById('editFechaAlta').value;
        const tarifaHora = parseFloat(document.getElementById('editTarifaHora').value) || null;
        const fechaInicioComputo = document.getElementById('editFechaInicioComputo').value;

        const { error } = await supabase
            .from('employees')
            .update({ 
                schedule_preferences: newPrefs,
                fecha_alta: fechaAlta || null,
                tarifa_hora: tarifaHora,
                fecha_inicio_computo: fechaInicioComputo || null
            })
            .eq('id', employeeId);

        if (error) {
            console.error('Error guardando preferencias:', error);
            Swal.fire('Error', 'No se pudieron guardar las preferencias.', 'error');
        } else {
            Swal.fire('¡Guardado!', 'La configuración se ha actualizado.', 'success');
            closePrefsModal();
            loadEmployees();
        }
    });
});
