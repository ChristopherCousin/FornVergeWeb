/**
 * MÓDULO DE GESTIÓN DE AUSENCIAS - FORN VERGE
 * ============================================
 * Maneja vacaciones, bajas médicas y otros tipos de ausencias
 */

import { isValidDate, isValidDateRange } from '../utils/validation.js';
import { showToast } from '../utils/helpers.js';
import { ABSENCE_TYPES } from '../config/constants.js';

export class AbsencesModule {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.employees = [];
        this.absences = [];
        this.isModalOpen = false;
        
        this.setupElements();
    }

    async init() {
        console.log('🏖️ Inicializando módulo de ausencias...');
        this.setupEventListeners();
        await this.loadData();
    }

    setupElements() {
        this.modal = document.getElementById('ausenciasModal');
        this.form = document.getElementById('nuevaAusenciaForm');
        this.listContainer = document.getElementById('listaAusencias');
    }

    setupEventListeners() {
        // Open modal button
        const openBtn = document.getElementById('btnGestionarAusencias');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.openModal());
        }

        // Close modal buttons
        const closeBtn1 = document.getElementById('closeAusenciasModal');
        const closeBtn2 = document.getElementById('cerrarAusenciasModal');
        
        if (closeBtn1) closeBtn1.addEventListener('click', () => this.closeModal());
        if (closeBtn2) closeBtn2.addEventListener('click', () => this.closeModal());

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleCreateAbsence(e));
        }

        // Auto-fill end date
        const startDateInput = document.getElementById('ausenciaFechaInicio');
        const endDateInput = document.getElementById('ausenciaFechaFin');
        
        if (startDateInput && endDateInput) {
            startDateInput.addEventListener('change', () => {
                if (startDateInput.value && !endDateInput.value) {
                    endDateInput.value = startDateInput.value;
                }
            });
        }
    }

    async loadData() {
        try {
            this.employees = await this.dataManager.loadEmployees();
            this.absences = await this.dataManager.loadAbsences();
            console.log(`📋 ${this.absences.length} ausencias cargadas`);
        } catch (error) {
            console.error('Error cargando datos de ausencias:', error);
        }
    }

    async openModal() {
        if (this.isModalOpen) return;
        
        this.isModalOpen = true;
        await this.loadData();
        this.populateEmployeeSelect();
        this.renderAbsencesList();
        
        if (this.modal) {
            this.modal.style.display = 'block';
        }
    }

    closeModal() {
        this.isModalOpen = false;
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        this.resetForm();
    }

    populateEmployeeSelect() {
        const select = document.getElementById('ausenciaEmpleado');
        if (!select) return;

        const options = this.employees.map(emp => 
            `<option value="${emp.id}">${emp.name}</option>`
        ).join('');

        select.innerHTML = '<option value="">Seleccionar empleado...</option>' + options;
    }

    renderAbsencesList() {
        if (!this.listContainer) return;

        if (this.absences.length === 0) {
            this.listContainer.innerHTML = '<p class="text-gray-500">No hay ausencias registradas.</p>';
            return;
        }

        const html = this.absences.map(absence => {
            const employee = this.employees.find(emp => emp.id === absence.employee_id);
            const employeeName = employee ? employee.name : 'Empleado desconocido';
            const typeLabel = ABSENCE_TYPES[absence.tipo] || absence.tipo;

            return `
                <div class="absence-item">
                    <div class="absence-info">
                        <div class="absence-employee">${employeeName}</div>
                        <div class="absence-details">
                            <span class="absence-type">${typeLabel}</span>
                            <span class="absence-dates">${absence.fecha_inicio} - ${absence.fecha_fin}</span>
                        </div>
                    </div>
                    <button class="btn-delete-absence" onclick="absencesModule.confirmDeleteAbsence('${absence.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        }).join('');

        this.listContainer.innerHTML = html;
    }

    async handleCreateAbsence(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const absenceData = {
            employee_id: formData.get('employee_id'),
            fecha_inicio: formData.get('fecha_inicio'),
            fecha_fin: formData.get('fecha_fin'),
            tipo: formData.get('tipo')
        };

        if (!this.validateAbsenceData(absenceData)) return;

        try {
            const newAbsence = await this.dataManager.createAbsence(absenceData);
            this.absences.unshift(newAbsence);
            
            this.renderAbsencesList();
            this.resetForm();
            
            showToast('Ausencia registrada correctamente', 'success');

        } catch (error) {
            console.error('Error creando ausencia:', error);
            showToast('Error al registrar la ausencia', 'error');
        }
    }

    validateAbsenceData(data) {
        if (!data.employee_id) {
            showToast('Selecciona un empleado', 'error');
            return false;
        }

        if (!isValidDate(data.fecha_inicio) || !isValidDate(data.fecha_fin)) {
            showToast('Fechas inválidas', 'error');
            return false;
        }

        if (!isValidDateRange(data.fecha_inicio, data.fecha_fin)) {
            showToast('La fecha de fin debe ser posterior o igual a la de inicio', 'error');
            return false;
        }

        if (!data.tipo) {
            showToast('Selecciona un tipo de ausencia', 'error');
            return false;
        }

        return true;
    }

    async confirmDeleteAbsence(absenceId) {
        if (!window.Swal) {
            if (!confirm('¿Eliminar esta ausencia?')) return;
        } else {
            const result = await window.Swal.fire({
                title: '¿Eliminar ausencia?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) return;
        }

        try {
            await this.dataManager.deleteAbsence(absenceId);
            this.absences = this.absences.filter(abs => abs.id !== absenceId);
            
            this.renderAbsencesList();
            showToast('Ausencia eliminada', 'success');

        } catch (error) {
            console.error('Error eliminando ausencia:', error);
            showToast('Error al eliminar la ausencia', 'error');
        }
    }

    resetForm() {
        if (this.form) {
            this.form.reset();
        }
    }

    // Make available globally for onclick handlers
    getEmployeeNameById(employeeId) {
        const employee = this.employees.find(emp => emp.id === employeeId);
        return employee ? employee.name : 'Empleado desconocido';
    }
}

// Global reference for onclick handlers
window.absencesModule = null;
