/* Forn Verge - Sistema de borrador para horarios sugeridos - MASSA SON OLIVA */

async function handleSugerirHorario() {
    const result = await Swal.fire({
        title: '¿Generar un borrador de horario?',
        text: "Esto creará una sugerencia visual que podrás guardar o descartar.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, generar',
        cancelButtonText: 'Cancelar',
        showDenyButton: true,
        denyButtonText: '<i class="fas fa-cog"></i> Ajustes'
    });

    if (result.isDenied) {
        openGeneratorSettings();
        return;
    }

    if (!result.isConfirmed) {
        return;
    }

    // Guardar el estado actual antes de generar el borrador
    originalScheduleBeforeDraft = JSON.parse(JSON.stringify(scheduleData));

    const suggestButton = document.getElementById('btnSugerirHorario');
    const originalButtonText = suggestButton.innerHTML;
    suggestButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando...';
    suggestButton.disabled = true;

    try {
        // ✨ Verificar que los módulos necesarios estén listos
        const controlAnual = window.controlAnualController || window.controlAnualSimple;
        
        if (!controlAnual || !controlAnual.convenioAnual) {
            throw new Error('El módulo de convenio no está listo. Por favor, espera a que la página cargue completamente.');
        }
        
        if (!window.ausenciasManager) {
            throw new Error('El módulo de ausencias no está listo. Por favor, espera a que la página cargue completamente.');
        }

        const generator = new HorarioGenerator(
            supabase,
            employees,
            window.ausenciasManager,
            controlAnual.convenioAnual
        );

        const nuevoScheduleData = await generator.generate(currentWeekStart);

        // Aplicar el borrador a la vista
        scheduleData = nuevoScheduleData;
        renderEmployees();
        actualizarContadorHorasTeoricas();

        // Activar modo borrador
        isInDraftMode = true;
        document.getElementById('draftModeBar').classList.remove('hidden');

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Borrador generado',
            text: 'Revisa y guarda o descarta los cambios.',
            showConfirmButton: false,
            timer: 4000
        });

    } catch (error) {
        console.error('❌ Error generando el horario:', error);
        // Si hay error, restaurar el estado original
        if (originalScheduleBeforeDraft) {
            scheduleData = originalScheduleBeforeDraft;
            originalScheduleBeforeDraft = null;
        }
        Swal.fire(
            'Error',
            `No se pudo generar el horario: ${error.message}`,
            'error'
        );
    } finally {
        suggestButton.innerHTML = originalButtonText;
        suggestButton.disabled = false;
    }
}

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
    renderEmployees();
    actualizarContadorHorasTeoricas();

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
