/* Forn Verge - Gestor del Generador Automático - MASSA SON OLIVA */

// Importar dependencias (acceso global)
// supabase desde config/supabase.js
// employees, scheduleData, originalScheduleBeforeDraft, isInDraftMode desde core/state.js
// currentWeekStart desde core/state.js
// renderEmployees desde admin-horarios.js
// actualizarContadorHorasTeoricas desde modules/hours-counter.js
// HorarioGenerator desde generador-horarios.js

// Configuración por defecto del generador
const settingsConfig = {
    weekday: [
        { start: '06:30', end: '14:00', count: 2 },
        { start: '14:00', end: '21:30', count: 2 }
    ],
    saturday: [
        { start: '07:00', end: '14:00', count: 3 },
        { start: '14:00', end: '22:00', count: 3 }
    ],
    sunday: [
        { start: '07:00', end: '14:00', count: 2 },
        { start: '14:00', end: '22:00', count: 2 }
    ]
};

/**
 * Maneja la generación automática de un borrador de horario
 */
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
        if (!window.controlAnualSimple || !window.ausenciasManager) {
            throw new Error('Los módulos de convenio y ausencias no están listos.');
        }

        const generator = new HorarioGenerator(
            supabase,
            employees,
            window.ausenciasManager,
            window.controlAnualSimple.convenioAnual
        );

        const resultado = await generator.generate(currentWeekStart);
        const nuevoScheduleData = resultado.schedule;

        // ✅ SIEMPRE aplicar el borrador con lo que se pudo cubrir
        scheduleData = nuevoScheduleData;
        if (window.renderEmployees) {
            window.renderEmployees();
        }
        if (window.actualizarContadorHorasTeoricas) {
            window.actualizarContadorHorasTeoricas();
        }

        // Activar modo borrador
        isInDraftMode = true;
        document.getElementById('draftModeBar').classList.remove('hidden');
        
        // ✨ NUEVO: Si hay turnos sin cubrir, mostrar ADVERTENCIA (pero permitir continuar)
        if (resultado.turnosSinCubrir && resultado.turnosSinCubrir.length > 0) {
            // Construir mensaje HTML con los turnos faltantes
            const turnosHTML = resultado.turnosSinCubrir.map(t => 
                `<div class="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-300 mb-2">
                    <div>
                        <span class="font-semibold text-orange-800 capitalize">${t.dia}</span>
                        <span class="text-gray-600 mx-2">•</span>
                        <span class="text-gray-700">${t.turno}</span>
                    </div>
                    <span class="text-sm text-orange-600 font-medium">Falta ${t.posicion}</span>
                </div>`
            ).join('');
            
            Swal.fire({
                icon: 'warning',
                title: '⚠️ Turnos Sin Cubrir Automáticamente',
                html: `
                    <div class="text-left">
                        <p class="text-gray-700 mb-4">
                            <strong>Se generó el horario con los empleados disponibles.</strong><br>
                            Los siguientes turnos necesitan ser cubiertos <strong>manualmente</strong>:
                        </p>
                        <div class="max-h-64 overflow-y-auto mb-4">
                            ${turnosHTML}
                        </div>
                        <div class="p-3 bg-blue-50 border border-blue-300 rounded">
                            <p class="text-sm text-blue-800">
                                <i class="fas fa-info-circle mr-1"></i>
                                <strong>¿Qué hacer ahora?</strong>
                            </p>
                            <ul class="text-sm text-gray-700 mt-2 ml-4 list-disc">
                                <li>Haz clic en estos días/horarios en el calendario</li>
                                <li>Asigna manualmente a los empleados de refuerzo</li>
                                <li>Luego guarda el horario completo</li>
                            </ul>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Entendido - Cubriré manualmente',
                confirmButtonColor: '#f59e0b',
                width: '600px'
            });
        } else {
            // Si todo está cubierto, mostrar éxito normal
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Borrador generado completamente',
                text: 'Todos los turnos fueron cubiertos automáticamente.',
                showConfirmButton: false,
                timer: 4000
            });
        }

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

/**
 * Abre el modal de ajustes del generador
 */
function openGeneratorSettings() {
    loadSettings();
    const settingsModal = document.getElementById('generatorSettingsModal');
    if (settingsModal) {
        settingsModal.style.display = 'block';
    }
}

/**
 * Cierra el modal de ajustes del generador y guarda los cambios
 */
function closeGeneratorSettings() {
    saveSettings();
    const settingsModal = document.getElementById('generatorSettingsModal');
    if (settingsModal) {
        settingsModal.style.display = 'none';
    }
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Ajustes guardados',
        showConfirmButton: false,
        timer: 2000
    });
}

/**
 * Carga los ajustes guardados en el localStorage
 */
function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('fornverge_generator_settings'));
    const settings = savedSettings || settingsConfig;

    // Cargar turnos
    for (const dayType in settingsConfig) { // Iterar siempre sobre la configuración base para seguridad
        const container = document.getElementById(`${dayType}-shifts-container`);
        if (container) {
            container.innerHTML = '';
            const shiftsToRender = settings[dayType] || []; // Usar los turnos guardados si existen
            shiftsToRender.forEach(shift => {
                container.appendChild(createShiftInputRow(dayType, shift));
            });
        }
    }
    
    // ✨ NUEVO: Cargar días de cierre
    const diasCierre = settings.dias_cierre || [];
    document.querySelectorAll('.dia-cierre').forEach(checkbox => {
        checkbox.checked = diasCierre.includes(checkbox.value);
    });
}

/**
 * Guarda los ajustes actuales en el localStorage
 */
function saveSettings() {
    const newSettings = {};
    
    // Guardar turnos
    for (const dayType in settingsConfig) {
        newSettings[dayType] = [];
        const container = document.getElementById(`${dayType}-shifts-container`);
        if (container) {
            container.querySelectorAll('.flex.items-center.space-x-2').forEach(row => {
                const inputs = row.querySelectorAll('input');
                if (inputs.length === 3) {
                    newSettings[dayType].push({
                        start: inputs[0].value,
                        end: inputs[1].value,
                        count: parseInt(inputs[2].value, 10) || 1
                    });
                }
            });
        }
    }
    
    // ✨ NUEVO: Guardar días de cierre
    newSettings.dias_cierre = Array.from(document.querySelectorAll('.dia-cierre:checked'))
        .map(cb => cb.value);
    
    console.log('💾 Guardando configuración del generador:', newSettings);
    localStorage.setItem('fornverge_generator_settings', JSON.stringify(newSettings));
}

/**
 * Crea una fila de input para configurar un turno
 * @param {string} dayType - Tipo de día (weekday, saturday, sunday)
 * @param {Object} shift - Objeto con la configuración del turno
 * @returns {HTMLElement} Elemento DOM de la fila
 */
function createShiftInputRow(dayType, shift = { start: '07:00', end: '14:00', count: 1 }) {
    const row = document.createElement('div');
    row.className = 'flex items-center space-x-2';
    
    row.innerHTML = `
        <input type="time" value="${shift.start}" class="border rounded px-2 py-1 w-1/3">
        <span>-</span>
        <input type="time" value="${shift.end}" class="border rounded px-2 py-1 w-1/3">
        <div class="flex items-center w-1/4">
             <i class="fas fa-users text-gray-500 mr-2"></i>
             <input type="number" value="${shift.count || 1}" min="1" max="5" class="border rounded px-2 py-1 w-full text-center">
        </div>
        <button class="text-red-500 hover:text-red-700 remove-shift-btn text-2xl">&times;</button>
    `;

    row.querySelector('.remove-shift-btn').addEventListener('click', () => {
        row.remove();
    });

    return row;
}

/**
 * Inicializa los event listeners para el modal de ajustes
 */
function initGeneratorSettingsListeners() {
    // Event listeners para botones de añadir turno
    document.querySelectorAll('.add-shift-btn-small').forEach(button => {
        button.addEventListener('click', (e) => {
            const dayType = e.currentTarget.dataset.dayType;
            const container = document.getElementById(`${dayType}-shifts-container`);
            if (container) {
                container.appendChild(createShiftInputRow(dayType));
            }
        });
    });

    // Event listeners para cerrar modal
    document.getElementById('closeGeneratorSettingsModal')?.addEventListener('click', closeGeneratorSettings);
    document.getElementById('doneGeneratorSettings')?.addEventListener('click', closeGeneratorSettings);

    // Event delegation en el modal completo
    const settingsModal = document.getElementById('generatorSettingsModal');
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-shift-btn-small')) {
                const dayType = e.target.dataset.dayType;
                const container = document.getElementById(`${dayType}-shifts-container`);
                if (container) {
                    container.appendChild(createShiftInputRow(dayType));
                }
            }

            if (e.target.id === 'closeGeneratorSettingsModal' || e.target.id === 'doneGeneratorSettings') {
                closeGeneratorSettings();
            }
        });
    }
}

// Inicializar event listeners cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeneratorSettingsListeners);
} else {
    initGeneratorSettingsListeners();
}

// Exportar al scope global para compatibilidad
window.handleSugerirHorario = handleSugerirHorario;
window.openGeneratorSettings = openGeneratorSettings;
window.closeGeneratorSettings = closeGeneratorSettings;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.createShiftInputRow = createShiftInputRow;

