/* Forn Verge - Gestor de Borradores - MASSA SON OLIVA */

// Importar dependencias (acceso global)
// isInDraftMode, originalScheduleBeforeDraft, scheduleData desde core/state.js
// saveAllSchedules desde services/schedules-service.js
// renderEmployees desde admin-horarios.js
// actualizarContadorHorasTeoricas desde modules/hours-counter.js

/**
 * Guarda el borrador como horario definitivo
 */
async function handleSaveDraft() {
    const saveButton = document.getElementById('btnSaveDraft');
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
    saveButton.disabled = true;

    // El scheduleData actual ya es el borrador, simplemente lo guardamos
    await saveAllSchedules(false); // false para que muestre el feedback visual

    // Salir del modo borrador
    isInDraftMode = false;
    originalScheduleBeforeDraft = null;
    document.getElementById('draftModeBar').classList.add('hidden');

    saveButton.innerHTML = '<i class="fas fa-save mr-2"></i>Guardar Horario';
    saveButton.disabled = false;

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Horario guardado correctamente',
        showConfirmButton: false,
        timer: 3000
    });
}

/**
 * Descarta el borrador y restaura el horario original
 * @param {boolean} silent - Si es true, no muestra notificación
 */
async function handleDiscardDraft(silent = false) {
    // Restaurar el horario original
    if (originalScheduleBeforeDraft) {
        scheduleData = originalScheduleBeforeDraft;
    }

    // Salir del modo borrador
    isInDraftMode = false;
    originalScheduleBeforeDraft = null;
    document.getElementById('draftModeBar').classList.add('hidden');

    // Re-renderizar para mostrar el horario restaurado
    if (window.renderEmployees) {
        window.renderEmployees();
    }
    if (window.actualizarContadorHorasTeoricas) {
        window.actualizarContadorHorasTeoricas();
    }

    if (!silent) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Borrador descartado',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Exportar al scope global para compatibilidad
window.handleSaveDraft = handleSaveDraft;
window.handleDiscardDraft = handleDiscardDraft;

