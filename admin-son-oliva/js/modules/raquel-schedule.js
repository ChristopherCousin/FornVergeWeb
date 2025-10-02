/* Forn Verge - Predefinir horarios de Raquel automáticamente - MASSA SON OLIVA */

async function checkAndPredefineRaquelSchedule() {
    try {
        // Encontrar a Raquel
        const raquel = employees.find(emp => emp.name.toUpperCase() === 'RAQUEL');
        if (!raquel) {
            // console.log('ℹ️ Raquel no encontrada en la lista de empleados');
            return;
        }

        // Verificar si ya tiene horarios para esta semana
        const { data: existingSchedules, error } = await supabase
            .from('schedules')
            .select('id')
            .eq('employee_id', raquel.id)
            .eq('week_start', currentWeekStart)
            .limit(1);

        if (error) {
            console.error('❌ Error verificando horarios de Raquel:', error);
            return;
        }

        // Si ya tiene horarios, no hacer nada
        if (existingSchedules && existingSchedules.length > 0) {
            // console.log('ℹ️ Raquel ya tiene horarios para esta semana');
            return;
        }

        // console.log('✨ Predefiniendo horarios de Raquel para la semana ' + currentWeekStart);
        updateStatus('Creando horarios de Raquel...');

        // Horarios predefinidos de Raquel: 6:00-14:00 L-V, libre sábado
        const raquelSchedule = [
            { day: 'lunes', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'martes', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'miercoles', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'jueves', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'viernes', start: '06:00:00', end: '14:00:00', hours: 8, free: false },
            { day: 'sabado', start: null, end: null, hours: 0, free: true },
            { day: 'domingo', start: '06:00:00', end: '14:00:00', hours: 8, free: false }
        ];

        // Crear los registros en la base de datos
        const schedulePromises = raquelSchedule.map(async (schedule) => {
            const scheduleData = {
                employee_id: raquel.id,
                week_start: currentWeekStart,
                day_of_week: schedule.day,
                start_time: schedule.start,
                end_time: schedule.end,
                hours: schedule.hours,
                is_free_day: schedule.free,
                shift_sequence: 1,
                shift_description: schedule.free ? 'Día libre' : 'Turno mañana',
                colleagues: []
            };

            const { data, error } = await supabase
                .from('schedules')
                .insert([scheduleData])
                .select();

            if (error) {
                console.error(`❌ Error creando horario para ${schedule.day}:`, error);
                return null;
            }

            return data[0];
        });

        const results = await Promise.all(schedulePromises);
        const successCount = results.filter(result => result !== null).length;

        if (successCount === raquelSchedule.length) {
            // console.log(`✅ Horarios de Raquel creados exitosamente (${successCount} días)`);
            
            // Actualizar scheduleData local
            raquelSchedule.forEach((schedule, index) => {
                const result = results[index];
                if (result) {
                    const shift = {
                        id: result.id,
                        type: schedule.free ? 'free' : 'morning',
                        start: schedule.start,
                        end: schedule.end,
                        hours: schedule.hours,
                        isFree: schedule.free,
                        description: schedule.free ? 'Día libre' : 'Turno mañana'
                    };
                    
                    if (!scheduleData[raquel.id][schedule.day]) {
                        scheduleData[raquel.id][schedule.day] = [];
                    }
                    scheduleData[raquel.id][schedule.day].push(shift);
                }
            });

            // Mostrar notificación
            showRaquelNotification();
            
        } else {
            console.warn(`⚠️ Solo se crearon ${successCount} de ${raquelSchedule.length} horarios para Raquel`);
        }

    } catch (error) {
        console.error('❌ Error en predefinición de horarios de Raquel:', error);
    }
}

function showRaquelNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full opacity-0 transition-all duration-500';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-magic mr-3 text-xl"></i>
            <div>
                <div class="font-semibold">¡Horarios creados!</div>
                <div class="text-sm opacity-90">Raquel: L-V 6:00-14:00, Sáb libre</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
    }, 100);
    
    // Animar salida después de 4 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 4000);
}

// ✨ Exportar al scope global para compatibilidad
window.checkAndPredefineRaquelSchedule = checkAndPredefineRaquelSchedule;
window.showRaquelNotification = showRaquelNotification;