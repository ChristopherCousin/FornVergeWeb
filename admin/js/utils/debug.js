/* Forn Verge - Utilidades de Debugging - MASSA SON OLIVA */

// === FUNCIÓN DE DIAGNÓSTICO PARA DETECTAR PROBLEMAS ===

async function runDiagnostic() {
    console.log('🔍 === DIAGNÓSTICO DEL SISTEMA ===');
    
    try {
        // 1. Verificar duplicados en BD
        const { data: allSchedules, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('week_start', currentWeekStart);
            
        if (error) {
            console.error('❌ Error obteniendo datos:', error);
            return;
        }
        
        // console.log(`📊 Total registros en BD para semana ${currentWeekStart}: ${allSchedules.length}`);
        
        // Agrupar por empleado y día
        const byEmployeeDay = {};
        allSchedules.forEach(schedule => {
            const key = `${schedule.employee_id}_${schedule.day_of_week}`;
            if (!byEmployeeDay[key]) byEmployeeDay[key] = [];
            byEmployeeDay[key].push(schedule);
        });
        
        // Verificar duplicados
        let duplicatesFound = 0;
        Object.keys(byEmployeeDay).forEach(key => {
            const records = byEmployeeDay[key];
            if (records.length > 1) {
                duplicatesFound++;
                const [empId, day] = key.split('_');
                const empName = employees.find(e => e.id === empId)?.name || 'Desconocido';
                
                // console.log(`⚠️  DUPLICADO: ${empName} - ${day} (${records.length} registros)`);
                records.forEach((r, i) => {
                    console.log(`   [${i+1}] ${r.start_time || 'libre'}-${r.end_time || 'libre'} (libre: ${r.is_free_day}, seq: ${r.shift_sequence})`);
                });
            }
        });
        
        if (duplicatesFound === 0) {
            // console.log('✅ No se encontraron duplicados en la BD');
        } else {
            console.log(`🚨 Se encontraron ${duplicatesFound} casos de duplicados`);
        }
        
        // 2. Verificar consistencia entre BD y scheduleData
        // console.log('\n🔄 Verificando consistencia BD vs ScheduleData...');
        let inconsistencies = 0;
        
        employees.forEach(emp => {
            DAYS.forEach(day => {
                const memoryShifts = scheduleData[emp.id][day.key] || [];
                const dbShifts = allSchedules.filter(s => 
                    s.employee_id === emp.id && s.day_of_week === day.key
                );
                
                if (memoryShifts.length !== dbShifts.length) {
                    inconsistencies++;
                    console.log(`⚠️  INCONSISTENCIA: ${emp.name} - ${day.name}`);
                    console.log(`   Memoria: ${memoryShifts.length} turnos`);
                    // console.log(`   BD: ${dbShifts.length} turnos`);
                }
            });
        });
        
        if (inconsistencies === 0) {
            // console.log('✅ BD y memoria están sincronizados');
        } else {
            console.log(`🚨 Se encontraron ${inconsistencies} inconsistencias`);
        }
        
        console.log('🔍 === FIN DIAGNÓSTICO ===\n');
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
    }
}

// === FUNCIÓN PARA LIMPIAR DUPLICADOS EN BD ===

async function cleanDuplicates() {
    console.log('🧹 === LIMPIEZA DE DUPLICADOS ===');
    
    try {
        const { data: allSchedules, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('week_start', currentWeekStart)
            .order('created_at');
            
        if (error) {
            console.error('❌ Error obteniendo datos:', error);
            return;
        }
        
        // Agrupar por empleado y día
        const byEmployeeDay = {};
        allSchedules.forEach(schedule => {
            const key = `${schedule.employee_id}_${schedule.day_of_week}`;
            if (!byEmployeeDay[key]) byEmployeeDay[key] = [];
            byEmployeeDay[key].push(schedule);
        });
        
        let duplicatesRemoved = 0;
        
        // Procesar cada grupo
        for (const key of Object.keys(byEmployeeDay)) {
            const records = byEmployeeDay[key];
            
            if (records.length > 1) {
                const [empId, day] = key.split('_');
                const empName = employees.find(e => e.id === empId)?.name || 'Desconocido';
                
                // console.log(`🔧 Limpiando duplicados: ${empName} - ${day} (${records.length} registros)`);
                
                // Mantener solo el más reciente (último en el array ordenado por created_at)
                const toKeep = records[records.length - 1];
                const toDelete = records.slice(0, -1);
                
                console.log(`✅ Manteniendo registro: ${toKeep.start_time || 'libre'}-${toKeep.end_time || 'libre'} (ID: ${toKeep.id.substring(0,8)})`);
                
                // Eliminar los duplicados
                for (const record of toDelete) {
                    console.log(`🗑️  Eliminando: ${record.start_time || 'libre'}-${record.end_time || 'libre'} (ID: ${record.id.substring(0,8)})`);
                    
                    const { error: deleteError } = await supabase
                        .from('schedules')
                        .delete()
                        .eq('id', record.id);
                        
                    if (deleteError) {
                        console.error('❌ Error eliminando:', deleteError);
                    } else {
                        duplicatesRemoved++;
                    }
                }
            }
        }
        
        console.log(`✅ Limpieza completada. ${duplicatesRemoved} duplicados eliminados.`);
        
        // Recargar datos después de la limpieza
        if (duplicatesRemoved > 0) {
            // console.log('🔄 Recargando datos...');
            await loadCurrentSchedules();
            renderEmployees();
            renderWeekFullView();
        }
        
        console.log('🧹 === FIN LIMPIEZA ===\n');
        
    } catch (error) {
        console.error('❌ Error en limpieza:', error);
    }
}

// === FUNCIÓN ESPECÍFICA PARA DIAGNOSTICAR PROBLEMAS CON GABY ===

async function debugGaby() {
    // console.log('🔍 === DIAGNÓSTICO ESPECÍFICO DE GABY ===');
    
    try {
        // 1. Encontrar a Gaby
        const gabyEmployee = employees.find(emp => emp.name === 'GABY');
        if (!gabyEmployee) {
            // console.log('❌ Gaby no encontrada en employees');
            return;
        }
        
        // console.log('✅ Gaby encontrada:', gabyEmployee);
        
        // 2. Verificar datos en BD
        const { data: gabySchedules, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('employee_id', gabyEmployee.id)
            .eq('week_start', currentWeekStart)
            .order('created_at');
            
        if (error) {
            console.error('❌ Error obteniendo horarios de Gaby:', error);
            return;
        }
        
        // console.log(`📊 Gaby en BD (${currentWeekStart}): ${gabySchedules.length} registros`);
        gabySchedules.forEach((s, i) => {
            console.log(`  [${i+1}] ${s.day_of_week}: ${s.start_time || 'NULL'}-${s.end_time || 'NULL'} (libre: ${s.is_free_day}, seq: ${s.shift_sequence}, created: ${s.created_at})`);
        });
        
        // 3. Verificar datos en memoria (scheduleData)
        // console.log('🧠 Gaby en memoria (scheduleData):');
        DAYS.forEach(day => {
            const shifts = scheduleData[gabyEmployee.id]?.[day.key] || [];
            console.log(`  ${day.key}: ${shifts.length} turnos`);
            shifts.forEach((s, i) => {
                console.log(`    [${i+1}] ${s.isFree ? 'DÍA LIBRE' : `${s.start}-${s.end} (${s.hours}h, type: ${s.type})`}`);
            });
        });
        
        // 4. Verificar si está de vacaciones
        const isOnVacation = employeesOnVacation.has(gabyEmployee.id);
        console.log(`🏖️ ¿Está de vacaciones?: ${isOnVacation}`);
        
        // 5. Vista siempre es de semana
        console.log(`👁️ Vista activa: SEMANA (única vista disponible)`);
        
        // 6. Buscar inconsistencias
        console.log('🔍 Buscando inconsistencias...');
        let inconsistencias = [];
        
        DAYS.forEach(day => {
            const memoryShifts = scheduleData[gabyEmployee.id]?.[day.key] || [];
            const dbShifts = gabySchedules.filter(s => s.day_of_week === day.key);
            
            if (memoryShifts.length !== dbShifts.length) {
                inconsistencias.push(`${day.key}: BD(${dbShifts.length}) vs Memoria(${memoryShifts.length})`);
            }
            
            // Verificar si hay turnos normales mezclados con días libres
            if (memoryShifts.length > 1) {
                const hasFree = memoryShifts.some(s => s.isFree);
                const hasWork = memoryShifts.some(s => !s.isFree);
                if (hasFree && hasWork) {
                    inconsistencias.push(`${day.key}: MEZCLA de día libre Y turno de trabajo`);
                }
            }
        });
        
        if (inconsistencias.length > 0) {
            console.log('🚨 INCONSISTENCIAS ENCONTRADAS:');
            inconsistencias.forEach(inc => console.log(`  - ${inc}`));
        } else {
            console.log('✅ No se encontraron inconsistencias obvias');
        }
        
        // console.log('🔍 === FIN DIAGNÓSTICO DE GABY ===\n');
        
    } catch (error) {
        console.error('❌ Error en diagnóstico de Gaby:', error);
    }
}

// === FUNCIÓN PARA LIMPIAR PROBLEMAS ESPECÍFICOS DE GABY ===

async function fixGaby() {
    // console.log('🔧 === ARREGLANDO PROBLEMAS DE GABY ===');
    
    try {
        // 1. Encontrar a Gaby
        const gabyEmployee = employees.find(emp => emp.name === 'GABY');
        if (!gabyEmployee) {
            // console.log('❌ Gaby no encontrada');
            return;
        }
        
        // console.log('✅ Limpiando horarios de Gaby...');
        
        // 2. Eliminar TODOS los registros de Gaby para esta semana
        const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('employee_id', gabyEmployee.id)
            .eq('week_start', currentWeekStart);
            
        if (deleteError) {
            console.error('❌ Error eliminando registros:', deleteError);
            return;
        }
        
        // console.log('✅ Registros de BD eliminados');
        
        // 3. Limpiar datos en memoria
        DAYS.forEach(day => {
            scheduleData[gabyEmployee.id][day.key] = [];
        });
        
        // console.log('✅ Datos en memoria limpiados');
        
        // 4. Recargar desde BD (debería estar vacío)
        await loadCurrentSchedules();
        
        // 5. Actualizar vistas
        renderEmployees();
        renderWeekFullView();
        
        // console.log('🔧 === GABY LIMPIADA - Ahora puedes agregar horarios nuevos ===\n');
        
    } catch (error) {
        console.error('❌ Error limpiando Gaby:', error);
    }
}

// === FUNCIÓN PARA DETECTAR DATOS INCONSISTENTES ===

function detectInconsistentData() {
    // console.log('🔍 === DETECTANDO DATOS INCONSISTENTES ===');
    
    let inconsistencies = [];
    
    employees.forEach(employee => {
        DAYS.forEach(day => {
            const shifts = scheduleData[employee.id][day.key] || [];
            
            if (shifts.length > 1) {
                const workShifts = shifts.filter(shift => !shift.isFree);
                const freeShifts = shifts.filter(shift => shift.isFree);
                
                if (workShifts.length > 0 && freeShifts.length > 0) {
                    inconsistencies.push({
                        employee: employee.name,
                        day: day.key,
                        workShifts: workShifts.length,
                        freeShifts: freeShifts.length,
                        details: {
                            work: workShifts.map(s => `${s.start}-${s.end}`),
                            free: freeShifts.map(s => 'Día libre')
                        }
                    });
                }
            }
        });
    });
    
    if (inconsistencies.length > 0) {
        console.log(`🚨 Se encontraron ${inconsistencies.length} inconsistencias:`);
        inconsistencies.forEach((inc, i) => {
            // console.log(`${i+1}. ${inc.employee} - ${inc.day}:`);
            console.log(`   - Turnos de trabajo: ${inc.details.work.join(', ')}`);
            console.log(`   - Días libres: ${inc.details.free.join(', ')}`);
        });
        
        console.log('\n💡 Usa window.cleanInconsistentData() para limpiar automáticamente');
    } else {
        // console.log('✅ No se encontraron datos inconsistentes');
    }
    
    console.log('🔍 === FIN DETECCIÓN ===\n');
    
    return inconsistencies;
}

// === FUNCIÓN PARA LIMPIAR DATOS INCONSISTENTES ===

async function cleanInconsistentData() {
    // console.log('🧹 === LIMPIANDO DATOS INCONSISTENTES ===');
    
    const inconsistencies = detectInconsistentData();
    
    if (inconsistencies.length === 0) {
        console.log('✅ No hay nada que limpiar');
        return;
    }
    
    let cleaned = 0;
    
    for (const inc of inconsistencies) {
        // console.log(`🔧 Limpiando ${inc.employee} - ${inc.day}...`);
        
        try {
            const employee = employees.find(emp => emp.name === inc.employee);
            if (!employee) continue;
            
            // Eliminar todos los registros de este empleado en este día
            const { error: deleteError } = await supabase
                .from('schedules')
                .delete()
                .eq('employee_id', employee.id)
                .eq('week_start', currentWeekStart)
                .eq('day_of_week', inc.day);
                
            if (deleteError) {
                console.error(`❌ Error eliminando ${inc.employee} - ${inc.day}:`, deleteError);
                continue;
            }
            
            // Mantener solo los turnos de trabajo en memoria
            const shifts = scheduleData[employee.id][inc.day] || [];
            const workShifts = shifts.filter(shift => !shift.isFree);
            scheduleData[employee.id][inc.day] = workShifts;
            
            // Re-insertar solo los turnos de trabajo en BD
            if (workShifts.length > 0) {
                const newSchedules = workShifts.map((shift, index) => ({
                    employee_id: employee.id,
                    week_start: currentWeekStart,
                    day_of_week: inc.day,
                    start_time: shift.start,
                    end_time: shift.end,
                    hours: shift.hours || 0,
                    is_free_day: false,
                    shift_sequence: index + 1,
                    shift_description: shift.description || getShiftDescription(shift.type),
                    colleagues: []
                }));
                
                const { error: insertError } = await supabase
                    .from('schedules')
                    .insert(newSchedules);
                    
                if (insertError) {
                    console.error(`❌ Error insertando ${inc.employee} - ${inc.day}:`, insertError);
                    continue;
                }
            }
            
            cleaned++;
            // console.log(`✅ ${inc.employee} - ${inc.day} limpiado`);
            
        } catch (error) {
            console.error(`❌ Error procesando ${inc.employee} - ${inc.day}:`, error);
        }
    }
    
    console.log(`✅ Limpieza completada. ${cleaned} casos limpiados.`);
    
    // Recargar datos y actualizar vista
    if (cleaned > 0) {
        // console.log('🔄 Recargando datos...');
        await loadCurrentSchedules();
        renderEmployees();
        renderWeekFullView();
    }
    
    console.log('🧹 === FIN LIMPIEZA ===\n');
}

// === FUNCIÓN PARA FORZAR ACTUALIZACIÓN DE VISTA SEMANAL ===

function forceUpdateWeekView() {
    renderWeekFullView();
}

// Exportar al scope global
window.runDiagnostic = runDiagnostic;
window.cleanDuplicates = cleanDuplicates;
window.debugGaby = debugGaby;
window.fixGaby = fixGaby;
window.detectInconsistentData = detectInconsistentData;
window.cleanInconsistentData = cleanInconsistentData;
window.forceUpdateWeekView = forceUpdateWeekView;

