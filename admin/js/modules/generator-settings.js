/* Forn Verge - Configuración de turnos para el generador - MASSA SON OLIVA */

// --- LÓGICA DE AJUSTES DEL GENERADOR ---

const settingsModal = document.getElementById('generatorSettingsModal');
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

function openGeneratorSettings() {
    loadSettings();
    settingsModal.style.display = 'block';
}

function closeGeneratorSettings() {
    saveSettings();
    settingsModal.style.display = 'none';
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Ajustes guardados',
        showConfirmButton: false,
        timer: 2000
    });
}

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

function saveSettings() {
    const newSettings = {};
    
    // Guardar turnos
    for (const dayType in settingsConfig) {
        newSettings[dayType] = [];
        const container = document.getElementById(`${dayType}-shifts-container`);
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
    
    // ✨ NUEVO: Guardar días de cierre
    newSettings.dias_cierre = Array.from(document.querySelectorAll('.dia-cierre:checked'))
        .map(cb => cb.value);
    
    console.log('💾 Guardando configuración del generador:', newSettings);
    localStorage.setItem('fornverge_generator_settings', JSON.stringify(newSettings));
}

document.querySelectorAll('.add-shift-btn-small').forEach(button => {
    button.addEventListener('click', (e) => {
        const dayType = e.currentTarget.dataset.dayType;
        const container = document.getElementById(`${dayType}-shifts-container`);
        container.appendChild(createShiftInputRow(dayType));
    });
});

document.getElementById('closeGeneratorSettingsModal')?.addEventListener('click', closeGeneratorSettings);
document.getElementById('doneGeneratorSettings')?.addEventListener('click', closeGeneratorSettings);

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

document.addEventListener('DOMContentLoaded', () => {
    // ...
    // Otros inicializadores
    
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

    initialize();
