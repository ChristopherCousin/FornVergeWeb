/* 
 * Week Manager - Operaciones sobre semanas completas
 * - Borrar semana completa
 * - Duplicar semana (futuro)
 */

/**
 * Borra todos los horarios de la semana actual
 */
async function handleBorrarSemanaCompleta() {
    // Convertir currentWeekStart (string) a Date
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekText = `${weekStart.getDate()}/${weekStart.getMonth()+1} - ${weekEnd.getDate()}/${weekEnd.getMonth()+1}`;
    
    // Confirmación con advertencia clara
    const confirmation = await Swal.fire({
        icon: 'warning',
        title: '⚠️ ¿Borrar toda la semana?',
        html: `
            <div class="text-left">
                <p class="text-gray-700 mb-3">
                    Estás a punto de <strong class="text-red-600">BORRAR TODOS</strong> los horarios de:
                </p>
                <div class="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-3">
                    <p class="text-center text-lg font-bold text-red-800">
                        📅 Semana del ${weekText}
                    </p>
                </div>
                <div class="bg-yellow-50 border border-yellow-300 rounded p-3">
                    <p class="text-sm text-yellow-800">
                        <i class="fas fa-exclamation-triangle mr-1"></i>
                        <strong>Esta acción NO se puede deshacer.</strong><br>
                        Se eliminarán permanentemente todos los turnos de esta semana de la base de datos.
                    </p>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, borrar todo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        reverseButtons: true
    });
    
    if (!confirmation.isConfirmed) {
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Borrando...',
            html: 'Eliminando todos los horarios de la semana',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Borrar de Supabase usando week_start (que es un string en formato YYYY-MM-DD)
        console.log(`🗑️ Borrando todos los horarios de la semana: ${currentWeekStart}`);
        
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('week_start', currentWeekStart);
        
        if (error) {
            throw error;
        }
        
        // Limpiar estado local - vaciar todos los turnos para todos los empleados
        Object.keys(scheduleData).forEach(empId => {
            DAYS.forEach(day => {
                scheduleData[empId][day.key] = [];
            });
        });
        
        // Cerrar loading y mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: '✅ Semana borrada',
            text: `Todos los horarios de la semana ${weekText} han sido eliminados.`,
            timer: 2500,
            showConfirmButton: false
        });
        
        // Actualizar vista
        if (window.renderEmployees) {
            window.renderEmployees();
        }
        if (window.updateStats) {
            window.updateStats();
        }
        
        console.log('✅ Semana completa borrada exitosamente');
        
    } catch (error) {
        console.error('❌ Error borrando la semana:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo borrar la semana. ' + (error.message || 'Error desconocido'),
            confirmButtonColor: '#dc2626'
        });
    }
}

// Exportar
window.handleBorrarSemanaCompleta = handleBorrarSemanaCompleta;

