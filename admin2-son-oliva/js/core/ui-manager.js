/**
 * GESTOR DE INTERFAZ DE USUARIO - FORN VERGE
 * ===========================================
 * Maneja toda la lógica de renderizado y eventos de UI
 */

import { generateDaysForWeek, getWeekRange } from '../utils/dates.js';
import { formatHours, findEmployeeById } from '../utils/helpers.js';
import { DAYS, AVAILABLE_WEEKS } from '../config/constants.js';

export class UIManager {
    constructor() {
        this.currentWeekStart = null;
        this.weekDays = [];
        
        // Referencias a elementos DOM frecuentes
        this.elements = {
            weekSelector: null,
            currentWeekText: null,
            weekGridContainer: null,
            totalHorasSemanales: null,
            listaHorasEmpleados: null,
            draftModeBar: null
        };
        
        this.cacheElements();
    }

    /**
     * Cachea referencias a elementos DOM
     */
    cacheElements() {
        this.elements = {
            weekSelector: document.getElementById('weekSelector'),
            currentWeekText: document.getElementById('currentWeekText'),
            weekGridContainer: document.getElementById('weekGridContainer'),
            totalHorasSemanales: document.getElementById('totalHorasSemanales'),
            listaHorasEmpleados: document.getElementById('listaHorasEmpleados'),
            draftModeBar: document.getElementById('draftModeBar')
        };
    }

    /**
     * Configura la navegación de semanas
     * @param {string} weekStart - Semana inicial
     */
    setupWeekNavigation(weekStart) {
        this.currentWeekStart = weekStart;
        this.weekDays = generateDaysForWeek(weekStart);
        
        this.setupWeekSelector();
        this.updateWeekDisplay(weekStart);
        this.setupWeekNavigationButtons();
    }

    /**
     * Configura el selector de semanas
     */
    setupWeekSelector() {
        if (!this.elements.weekSelector) return;
        
        this.elements.weekSelector.innerHTML = AVAILABLE_WEEKS.map(week => {
            const range = getWeekRange(week);
            return `<option value="${week}">${range}</option>`;
        }).join('');
        
        this.elements.weekSelector.value = this.currentWeekStart;
        
        this.elements.weekSelector.addEventListener('change', (e) => {
            const newWeek = e.target.value;
            window.app?.changeWeek(newWeek);
        });
    }

    /**
     * Configura los botones de navegación de semana
     */
    setupWeekNavigationButtons() {
        const prevBtn = document.getElementById('prevWeek');
        const nextBtn = document.getElementById('nextWeek');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const currentIndex = AVAILABLE_WEEKS.indexOf(this.currentWeekStart);
                if (currentIndex > 0) {
                    const prevWeek = AVAILABLE_WEEKS[currentIndex - 1];
                    window.app?.changeWeek(prevWeek);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const currentIndex = AVAILABLE_WEEKS.indexOf(this.currentWeekStart);
                if (currentIndex < AVAILABLE_WEEKS.length - 1) {
                    const nextWeek = AVAILABLE_WEEKS[currentIndex + 1];
                    window.app?.changeWeek(nextWeek);
                }
            });
        }
    }

    /**
     * Actualiza la visualización de la semana actual
     * @param {string} weekStart - Nueva semana
     */
    updateWeekDisplay(weekStart) {
        this.currentWeekStart = weekStart;
        this.weekDays = generateDaysForWeek(weekStart);
        
        if (this.elements.currentWeekText) {
            this.elements.currentWeekText.textContent = getWeekRange(weekStart);
        }
        
        if (this.elements.weekSelector) {
            this.elements.weekSelector.value = weekStart;
        }
    }

    /**
     * Renderiza la lista de empleados y sus horarios
     * @param {Array} employees - Lista de empleados
     * @param {Object} scheduleData - Datos de horarios
     */
    renderEmployees(employees, scheduleData) {
        if (!this.elements.weekGridContainer) return;
        
        const html = this.generateEmployeesHTML(employees, scheduleData);
        this.elements.weekGridContainer.innerHTML = html;
        
        // Configurar eventos después de renderizar
        this.setupEmployeeEvents();
    }

    /**
     * Genera el HTML para la vista de empleados
     * @param {Array} employees - Lista de empleados
     * @param {Object} scheduleData - Datos de horarios
     * @returns {string} HTML generado
     */
    generateEmployeesHTML(employees, scheduleData) {
        if (!employees || employees.length === 0) {
            return '<div class="text-center py-8 text-gray-500">No hay empleados registrados</div>';
        }

        const headerHTML = this.generateHeaderHTML();
        const employeesHTML = employees.map(employee => 
            this.generateEmployeeRowHTML(employee, scheduleData[employee.id] || {})
        ).join('');

        return `
            <div class="week-grid">
                ${headerHTML}
                ${employeesHTML}
            </div>
        `;
    }

    /**
     * Genera el HTML del header de la tabla
     * @returns {string} HTML del header
     */
    generateHeaderHTML() {
        const daysHTML = this.weekDays.map(day => `
            <div class="day-header">
                <div class="day-name">${day.name}</div>
                <div class="day-full-name text-xs opacity-75">${day.fullName}</div>
            </div>
        `).join('');

        return `
            <div class="week-header">
                <div class="employee-name-header">Empleada</div>
                ${daysHTML}
                <div class="actions-header">Acciones</div>
            </div>
        `;
    }

    /**
     * Genera el HTML de una fila de empleado
     * @param {Object} employee - Datos del empleado
     * @param {Object} employeeSchedule - Horarios del empleado
     * @returns {string} HTML de la fila
     */
    generateEmployeeRowHTML(employee, employeeSchedule) {
        const daysHTML = this.weekDays.map(day => {
            const daySchedule = employeeSchedule[day.key] || [];
            return this.generateDayCellHTML(employee.id, day.key, daySchedule);
        }).join('');

        return `
            <div class="employee-row" data-employee-id="${employee.id}">
                <div class="employee-name">
                    <span class="name">${employee.name}</span>
                    <div class="employee-info">
                        <small class="text-gray-500">${employee.employee_id || 'Sin ID'}</small>
                    </div>
                </div>
                ${daysHTML}
                <div class="employee-actions">
                    <button class="btn-preferences" title="Preferencias" 
                            onclick="openPreferencesModal('${employee.id}', '${employee.name}')">
                        <i class="fas fa-sliders-h"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Genera el HTML de una celda de día
     * @param {string} employeeId - ID del empleado
     * @param {string} dayKey - Clave del día
     * @param {Array} daySchedule - Horarios del día
     * @returns {string} HTML de la celda
     */
    generateDayCellHTML(employeeId, dayKey, daySchedule) {
        if (!daySchedule || daySchedule.length === 0) {
            // Día sin horarios
            return `
                <div class="day-cell empty" data-employee-id="${employeeId}" data-day="${dayKey}">
                    <button class="add-shift-btn" onclick="openShiftModal('${employeeId}', '${dayKey}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
        }

        const shiftsHTML = daySchedule.map((shift, index) => {
            if (shift.free) {
                return `
                    <div class="shift free-day">
                        <span class="shift-text">Libre</span>
                        <button class="remove-shift" onclick="removeShift('${employeeId}', '${dayKey}', ${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }

            return `
                <div class="shift ${shift.type || 'morning'}">
                    <div class="shift-time">${shift.start} - ${shift.end}</div>
                    <div class="shift-hours">${formatHours(shift.hours)}</div>
                    <button class="remove-shift" onclick="removeShift('${employeeId}', '${dayKey}', ${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');

        return `
            <div class="day-cell has-shifts" data-employee-id="${employeeId}" data-day="${dayKey}">
                ${shiftsHTML}
                <button class="add-shift-btn secondary" onclick="openShiftModal('${employeeId}', '${dayKey}')">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    }

    /**
     * Configura eventos específicos de empleados
     */
    setupEmployeeEvents() {
        // Los eventos se manejan principalmente via onclick en el HTML
        // debido a la naturaleza dinámica del contenido
    }

    /**
     * Actualiza el contador de horas teóricas
     * @param {Array} employees - Lista de empleados
     * @param {Object} scheduleData - Datos de horarios
     */
    updateHoursCounter(employees, scheduleData) {
        let totalHours = 0;
        const employeeHours = {};

        employees.forEach(employee => {
            const employeeSchedule = scheduleData[employee.id] || {};
            let empHours = 0;

            Object.values(employeeSchedule).forEach(dayShifts => {
                dayShifts.forEach(shift => {
                    if (!shift.free) {
                        empHours += shift.hours || 0;
                    }
                });
            });

            employeeHours[employee.id] = {
                name: employee.name,
                hours: empHours
            };
            totalHours += empHours;
        });

        // Actualizar total
        if (this.elements.totalHorasSemanales) {
            this.elements.totalHorasSemanales.textContent = formatHours(totalHours);
        }

        // Actualizar desglose por empleado
        if (this.elements.listaHorasEmpleados) {
            const desglose = Object.values(employeeHours).map(emp => `
                <div class="employee-hours-item">
                    <span class="emp-name">${emp.name}</span>
                    <span class="emp-hours">${formatHours(emp.hours)}</span>
                </div>
            `).join('');
            
            this.elements.listaHorasEmpleados.innerHTML = desglose;
        }

        // Mostrar alarma si supera el límite
        this.updateOverloadAlarm(totalHours);
    }

    /**
     * Actualiza la alarma de sobrecarga
     * @param {number} totalHours - Total de horas
     */
    updateOverloadAlarm(totalHours) {
        const alarmElement = document.getElementById('alarmaSobrecarga');
        const LIMITE_HORAS = 205;

        if (alarmElement) {
            if (totalHours > LIMITE_HORAS) {
                alarmElement.classList.remove('hidden');
            } else {
                alarmElement.classList.add('hidden');
            }
        }
    }

    /**
     * Muestra el modo borrador
     */
    showDraftMode() {
        if (this.elements.draftModeBar) {
            this.elements.draftModeBar.classList.remove('hidden');
        }
    }

    /**
     * Oculta el modo borrador
     */
    hideDraftMode() {
        if (this.elements.draftModeBar) {
            this.elements.draftModeBar.classList.add('hidden');
        }
    }

    /**
     * Configura los event listeners principales
     */
    setupEventListeners() {
        // Botón de logout
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.app?.logout();
            });
        }

        // Botones del modo borrador
        const saveDraftBtn = document.getElementById('btnSaveDraft');
        const discardDraftBtn = document.getElementById('btnDiscardDraft');
        
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                window.app?.saveDraft();
            });
        }
        
        if (discardDraftBtn) {
            discardDraftBtn.addEventListener('click', () => {
                window.app?.discardDraft();
            });
        }

        // Botón del generador automático
        const generateBtn = document.getElementById('btnSugerirHorario');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                window.generatorModule?.generateSchedule();
            });
        }

        // Botón de gestión de empleados
        const employeesBtn = document.getElementById('employeesBtn');
        if (employeesBtn) {
            employeesBtn.addEventListener('click', () => {
                window.employeesModule?.openModal();
            });
        }
    }

    /**
     * Inicializa la vista por defecto
     */
    initDefaultView() {
        // Mostrar vista de semana completa por defecto
        const weekView = document.getElementById('weekFullView');
        if (weekView) {
            weekView.classList.add('active');
        }
    }
}
