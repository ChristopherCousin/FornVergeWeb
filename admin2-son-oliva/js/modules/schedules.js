/**
 * MÓDULO DE GESTIÓN DE HORARIOS - FORN VERGE
 * ===========================================
 * Maneja toda la lógica relacionada con horarios y turnos
 */

import { isValidTime, isValidTimeRange, calculateHours, validateNoOverlap } from '../utils/validation.js';
import { showToast } from '../utils/helpers.js';

export class SchedulesModule {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentModalEmployee = null;
        this.currentModalDay = null;
        this.isEditingShift = false;
        this.currentEditingShiftIndex = null;
        
        this.setupElements();
    }

    async init() {
        console.log('📅 Inicializando módulo de horarios...');
        this.setupEventListeners();
    }

    setupElements() {
        this.modal = document.getElementById('shiftModal');
        this.form = document.querySelector('#shiftModal form');
    }

    setupEventListeners() {
        // Modal events
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelModal');
        
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }

        // Add shift button
        const addShiftBtn = document.getElementById('addShift');
        if (addShiftBtn) {
            addShiftBtn.addEventListener('click', () => this.handleAddShift());
        }

        // Template buttons (global functions for onclick)
        window.setTemplate = (start, end, type) => this.setTemplate(start, end, type);
        window.toggleSplitShiftFields = () => this.toggleSplitShiftFields();
        window.addFreeDay = () => this.addFreeDay();
        window.openShiftModal = (employeeId, day) => this.openShiftModal(employeeId, day);
        window.removeShift = (employeeId, day, index) => this.removeShift(employeeId, day, index);
    }

    openShiftModal(employeeId, day) {
        this.currentModalEmployee = employeeId;
        this.currentModalDay = day;
        this.isEditingShift = false;
        
        const employee = window.app?.employees?.find(emp => emp.id === employeeId);
        const employeeName = employee ? employee.name : 'Empleado';
        const dayName = this.getDayName(day);
        
        const modalTitle = document.getElementById('modalEmployeeDay');
        if (modalTitle) {
            modalTitle.textContent = `${employeeName} - ${dayName}`;
        }

        this.resetModalForm();
        
        if (this.modal) {
            this.modal.style.display = 'block';
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        this.resetModalForm();
        this.currentModalEmployee = null;
        this.currentModalDay = null;
        this.isEditingShift = false;
        this.currentEditingShiftIndex = null;
    }

    resetModalForm() {
        // Reset to single shift mode
        this.showSingleShiftFields();
        
        // Reset form values
        const startTime = document.getElementById('startTime');
        const endTime = document.getElementById('endTime');
        const shiftType = document.getElementById('shiftType');
        
        if (startTime) startTime.value = '07:00';
        if (endTime) endTime.value = '14:00';
        if (shiftType) shiftType.value = 'morning';
    }

    setTemplate(startTime, endTime, type) {
        const startInput = document.getElementById('startTime');
        const endInput = document.getElementById('endTime');
        const typeInput = document.getElementById('shiftType');
        
        if (startInput) startInput.value = startTime;
        if (endInput) endInput.value = endTime;
        if (typeInput) typeInput.value = type;
        
        this.showSingleShiftFields();
    }

    toggleSplitShiftFields() {
        const singleFields = document.getElementById('singleShiftFields');
        const splitFields = document.getElementById('splitShiftFields');
        
        if (singleFields && splitFields) {
            if (splitFields.classList.contains('hidden')) {
                // Show split fields
                singleFields.classList.add('hidden');
                splitFields.classList.remove('hidden');
                
                // Set default values for split shift
                const start1 = document.getElementById('startTime1');
                const end1 = document.getElementById('endTime1');
                const start2 = document.getElementById('startTime2');
                const end2 = document.getElementById('endTime2');
                
                if (start1) start1.value = '07:00';
                if (end1) end1.value = '13:00';
                if (start2) start2.value = '16:00';
                if (end2) end2.value = '21:00';
            } else {
                this.showSingleShiftFields();
            }
        }
    }

    showSingleShiftFields() {
        const singleFields = document.getElementById('singleShiftFields');
        const splitFields = document.getElementById('splitShiftFields');
        
        if (singleFields) singleFields.classList.remove('hidden');
        if (splitFields) splitFields.classList.add('hidden');
    }

    addFreeDay() {
        this.addShiftToSchedule(this.currentModalEmployee, this.currentModalDay, {
            free: true,
            start: null,
            end: null,
            hours: 0,
            type: 'free'
        });
        
        this.closeModal();
    }

    async handleAddShift() {
        if (!this.currentModalEmployee || !this.currentModalDay) return;

        const splitFields = document.getElementById('splitShiftFields');
        const isSplitShift = splitFields && !splitFields.classList.contains('hidden');

        if (isSplitShift) {
            await this.handleSplitShift();
        } else {
            await this.handleSingleShift();
        }
    }

    async handleSingleShift() {
        const startTime = document.getElementById('startTime')?.value;
        const endTime = document.getElementById('endTime')?.value;
        const shiftType = document.getElementById('shiftType')?.value || 'morning';

        if (!this.validateShiftTimes(startTime, endTime)) return;

        const hours = calculateHours(startTime, endTime);
        const shift = {
            free: false,
            start: startTime,
            end: endTime,
            hours: hours,
            type: shiftType
        };

        this.addShiftToSchedule(this.currentModalEmployee, this.currentModalDay, shift);
        this.closeModal();
    }

    async handleSplitShift() {
        const start1 = document.getElementById('startTime1')?.value;
        const end1 = document.getElementById('endTime1')?.value;
        const start2 = document.getElementById('startTime2')?.value;
        const end2 = document.getElementById('endTime2')?.value;

        if (!this.validateShiftTimes(start1, end1) || !this.validateShiftTimes(start2, end2)) return;

        const hours1 = calculateHours(start1, end1);
        const hours2 = calculateHours(start2, end2);

        const shift1 = {
            free: false,
            start: start1,
            end: end1,
            hours: hours1,
            type: 'morning'
        };

        const shift2 = {
            free: false,
            start: start2,
            end: end2,
            hours: hours2,
            type: 'afternoon'
        };

        this.addShiftToSchedule(this.currentModalEmployee, this.currentModalDay, shift1);
        this.addShiftToSchedule(this.currentModalEmployee, this.currentModalDay, shift2);
        this.closeModal();
    }

    validateShiftTimes(startTime, endTime) {
        if (!isValidTime(startTime) || !isValidTime(endTime)) {
            showToast('Formato de hora inválido', 'error');
            return false;
        }

        if (!isValidTimeRange(startTime, endTime)) {
            showToast('La hora de fin debe ser posterior a la de inicio', 'error');
            return false;
        }

        return true;
    }

    addShiftToSchedule(employeeId, day, shift) {
        if (!window.app?.scheduleData) return;

        if (!window.app.scheduleData[employeeId]) {
            window.app.scheduleData[employeeId] = {};
        }

        if (!window.app.scheduleData[employeeId][day]) {
            window.app.scheduleData[employeeId][day] = [];
        }

        window.app.scheduleData[employeeId][day].push(shift);

        // Re-render UI
        if (window.app.uiManager) {
            window.app.uiManager.renderEmployees(window.app.employees, window.app.scheduleData);
            window.app.uiManager.updateHoursCounter(window.app.employees, window.app.scheduleData);
        }
    }

    async removeShift(employeeId, day, shiftIndex) {
        if (!window.app?.scheduleData?.[employeeId]?.[day]) return;

        // Remove from local data
        window.app.scheduleData[employeeId][day].splice(shiftIndex, 1);

        // If no shifts left, remove the day array
        if (window.app.scheduleData[employeeId][day].length === 0) {
            delete window.app.scheduleData[employeeId][day];
        }

        // Re-render UI
        if (window.app.uiManager) {
            window.app.uiManager.renderEmployees(window.app.employees, window.app.scheduleData);
            window.app.uiManager.updateHoursCounter(window.app.employees, window.app.scheduleData);
        }

        showToast('Turno eliminado', 'success');
    }

    getDayName(dayKey) {
        const dayNames = {
            'lunes': 'Lunes',
            'martes': 'Martes',
            'miercoles': 'Miércoles',
            'jueves': 'Jueves',
            'viernes': 'Viernes',
            'sabado': 'Sábado',
            'domingo': 'Domingo'
        };
        return dayNames[dayKey] || dayKey;
    }
}
