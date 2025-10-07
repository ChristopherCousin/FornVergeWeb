/* Forn Verge - Servicio de Horarios (BD) - MASSA SON OLIVA */

// ===== CARGAR EMPLEADOS DESDE SUPABASE =====

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

// ===== CARGAR HORARIOS DESDE SUPABASE =====

async function loadCurrentSchedules() {
    try {
        // Primero intentar con start_time que siempre existe
        let { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('week_start', currentWeekStart)
            .order('start_time', { nullsFirst: true });

        // Si hay error, intentar sin ordenar
        if (error) {
            console.log('🔄 Reintentando sin ordenar...');
            const result = await supabase
                .from('schedules')
                .select('*')
                .eq('week_start', currentWeekStart);
            
            data = result.data;
            error = result.error;
        }

        if (error) {
            console.error('❌ Error cargando horarios:', error);
            console.error('Error details:', error);
            return;
        }

        // LIMPIAR scheduleData antes de cargar
        employees.forEach(emp => {
            DAYS.forEach(day => {
                scheduleData[emp.id][day.key] = [];
            });
        });

        // Log específico para Gaby antes del procesamiento
        const gabyEmployee = employees.find(emp => emp.name === 'GABY');
        if (gabyEmployee) {
            const gabySchedules = data.filter(s => s.employee_id === gabyEmployee.id);
            gabySchedules.forEach((s, i) => {
                console.log(`  [${i+1}] ${s.day_of_week}: ${s.start_time || 'NULL'}-${s.end_time || 'NULL'} (libre: ${s.is_free_day}, seq: ${s.shift_sequence})`);
            });
        }

        data.forEach(schedule => {
            const empId = schedule.employee_id;
            const day = schedule.day_of_week;
            
            if (scheduleData[empId] && scheduleData[empId][day]) {
                if (schedule.is_free_day) {
                    scheduleData[empId][day].push({
                        id: schedule.id,
                        type: 'free',
                        isFree: true,
                        description: 'Día libre'
                    });
                } else {
                    const shiftType = getShiftType(schedule.start_time, schedule.end_time);
                    const newShift = {
                        id: schedule.id,
                        start: schedule.start_time,
                        end: schedule.end_time,
                        hours: schedule.hours || 0,
                        type: shiftType,
                        isFree: false,
                        description: schedule.shift_description || getShiftDescription(shiftType)
                    };
                    
                    scheduleData[empId][day].push(newShift);
                }
            }
        });

        // Log específico para Gaby después del procesamiento
        if (gabyEmployee) {
            DAYS.forEach(day => {
                const shifts = scheduleData[gabyEmployee.id][day.key] || [];
                console.log(`  ${day.key}: ${shifts.length} turnos`);
                shifts.forEach((s, i) => {
                    console.log(`    [${i+1}] ${s.isFree ? 'DÍA LIBRE' : `${s.start}-${s.end} (${s.hours}h)`}`);
                });
            });
        }

        updateStats();
        
        // 🧮 ACTUALIZAR CONTADOR DE HORAS TEÓRICAS
        actualizarContadorHorasTeoricas();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// ===== ELIMINAR TURNO ESPECÍFICO DE LA BD =====

async function removeSpecificShiftFromDB(empId, day, shiftData) {
    try {
        // Si tiene un ID de BD real, usar ese
        if (shiftData.id && !shiftData.id.toString().startsWith('temp_')) {
            console.log('🗑️ Eliminando registro específico con ID:', shiftData.id);
            
            const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', shiftData.id);
                
            if (error) {
                console.error('❌ Error eliminando registro específico:', error);
                return;
            }
            
            console.log('✅ Registro eliminado específicamente');
        } else {
            // Si no tiene ID real (temporal), reconstruir solo ese día del empleado
            await rebuildDaySchedule(empId, day);
        }
        
        updateStatus('Turno eliminado ✅');
        
        // Actualizar la vista después de eliminar
        renderEmployees();
        
    } catch (error) {
        console.error('❌ Error:', error);
        updateStatus('Error eliminando ❌');
    }
}

// ===== RECONSTRUIR HORARIOS DE UN DÍA =====

async function rebuildDaySchedule(empId, day) {
    try {
        // Eliminar solo los registros de este empleado en este día
        const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('employee_id', empId)
            .eq('week_start', currentWeekStart)
            .eq('day_of_week', day);
            
        if (deleteError) {
            console.error('❌ Error eliminando día específico:', deleteError);
            return;
        }
        
        // Insertar nuevos registros para este día
        const shifts = scheduleData[empId][day] || [];
        const newSchedules = [];
        
        if (shifts.length === 0) {
            // Día libre por defecto
            newSchedules.push({
                employee_id: empId,
                week_start: currentWeekStart,
                day_of_week: day,
                start_time: null,
                end_time: null,
                hours: 0,
                is_free_day: true,
                shift_sequence: 1,
                shift_description: 'Día libre',
                colleagues: []
            });
        } else {
            shifts.forEach((shift, index) => {
                newSchedules.push({
                    employee_id: empId,
                    week_start: currentWeekStart,
                    day_of_week: day,
                    start_time: shift.start,
                    end_time: shift.end,
                    hours: shift.hours || 0,
                    is_free_day: shift.isFree,
                    shift_sequence: index + 1,
                    shift_description: shift.description || getShiftDescription(shift.type),
                    colleagues: []
                });
            });
        }
        
        if (newSchedules.length > 0) {
            const { data: insertData, error } = await supabase
                .from('schedules')
                .insert(newSchedules);
                
            if (error) {
                console.error('❌ Error insertando día reconstruido:', error);
                return;
            }
        }
        
        console.log('✅ Día reconstruido exitosamente');
        
        // Actualizar la vista después de reconstruir
        renderEmployees();
        
    } catch (error) {
        console.error('❌ Error reconstruyendo día:', error);
    }
}

// ===== GUARDAR TODOS LOS HORARIOS =====

async function saveAllSchedules(isAutoSave = false) {
    const saveBtn = document.getElementById('saveAll'); // Puede ser null
    let originalText = '';
    
    if (!isAutoSave && saveBtn) {
        originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
        saveBtn.disabled = true;
    }
    updateStatus('Guardando...');

    try {
        // CORRECCIÓN CRÍTICA: Aplicar filtro ANTES del delete
        const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('week_start', currentWeekStart);

        if (deleteError) {
            console.error('❌ Error eliminando:', deleteError);
            throw deleteError;
        }

        const newSchedules = [];
        let sequenceCounter = {};

        employees.forEach(employee => {
            DAYS.forEach(day => {
                const shifts = scheduleData[employee.id][day.key] || [];
                const dayKey = `${employee.id}_${day.key}`;
                sequenceCounter[dayKey] = 1;
                
                if (shifts.length === 0) {
                    // Registro para día sin turnos (solo campos básicos)
                    const scheduleRecord = {
                        employee_id: employee.id,
                        week_start: currentWeekStart,
                        day_of_week: day.key,
                        start_time: null,
                        end_time: null,
                        hours: 0,
                        is_free_day: true,
                        shift_sequence: 1,
                        shift_description: 'Día libre',
                        colleagues: []
                    };
                    
                    newSchedules.push(scheduleRecord);
                } else {
                    shifts.forEach((shift, shiftIndex) => {
                        const scheduleRecord = {
                            employee_id: employee.id,
                            week_start: currentWeekStart,
                            day_of_week: day.key,
                            start_time: shift.start,
                            end_time: shift.end,
                            hours: shift.hours || 0,
                            is_free_day: shift.isFree,
                            shift_sequence: shiftIndex + 1,
                            shift_description: shift.description || getShiftDescription(shift.type),
                            colleagues: []
                        };
                        
                        newSchedules.push(scheduleRecord);
                    });
                }
            });
        });

        const { data: insertData, error } = await supabase
            .from('schedules')
            .insert(newSchedules);

        if (error) {
            console.error('❌ Error insertando:', error);
            console.error('❌ Detalles del error:', error.details);
            console.error('❌ Mensaje:', error.message);
            alert('Error al guardar: ' + error.message);
            return;
        }

        console.log('✅ Respuesta de insert:', insertData);
        
        if (!isAutoSave) {
            showSaveSuccess();
        }
        
        // 🧮 ACTUALIZAR CONTADOR DE HORAS TEÓRICAS
        actualizarContadorHorasTeoricas();
        
        updateStatus('Guardado ✅');

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al guardar horarios');
        updateStatus('Error ❌');
    } finally {
        if (!isAutoSave && saveBtn) {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }
}

