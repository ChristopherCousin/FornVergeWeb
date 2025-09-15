/**
 * MÓDULO DEL SISTEMA DE CONVENIO - FORN VERGE
 * ============================================
 * Control anual del convenio laboral de Baleares
 */

import { CONVENIO_CONFIG } from '../config/constants.js';
import { formatHours } from '../utils/helpers.js';

export class ConventionModule {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.employees = [];
        this.timeClocks = [];
        this.absences = [];
        this.annualStats = {};
        this.conventionAlerts = [];
        
        this.config = CONVENIO_CONFIG;
    }

    async init() {
        console.log('📊 Inicializando módulo de convenio...');
        
        try {
            await this.loadData();
            await this.calculateAnnualStats();
            this.createSimplePanel();
            
        } catch (error) {
            console.error('Error inicializando módulo de convenio:', error);
        }
    }

    async loadData() {
        try {
            this.employees = await this.dataManager.loadEmployees();
            this.timeClocks = await this.dataManager.loadTimeClocks(this.config.inicio_año);
            this.absences = await this.dataManager.loadAbsences();
            
            console.log(`📋 Datos del convenio: ${this.employees.length} empleados, ${this.timeClocks.length} fichajes`);
        } catch (error) {
            console.error('Error cargando datos del convenio:', error);
        }
    }

    async calculateAnnualStats() {
        console.log('🔢 Calculando estadísticas anuales...');
        
        this.annualStats = {};
        this.conventionAlerts = [];

        for (const employee of this.employees) {
            if (this.config.excluidos.includes(employee.name.toUpperCase())) {
                continue; // Skip excluded employees
            }

            const stats = await this.calculateEmployeeAnnualStats(employee);
            this.annualStats[employee.id] = stats;

            // Check for convention violations
            this.checkConventionLimits(employee, stats);
        }
    }

    async calculateEmployeeAnnualStats(employee) {
        const stats = {
            name: employee.name,
            horasReales: 0,
            horasTeoricas: 0,
            horasAusencias: 0,
            horasTotal: 0,
            diasTrabajados: 0,
            diasAusencias: 0,
            estado: 'equilibrado', // equilibrado, subcarga, sobrecarga
            diferencia: 0
        };

        // Calculate real hours from time clocks
        const employeeTimeClocks = this.timeClocks.filter(tc => tc.employee_id === employee.id);
        stats.horasReales = employeeTimeClocks.reduce((total, tc) => total + (tc.hours_worked || 0), 0);
        stats.diasTrabajados = employeeTimeClocks.length;

        // Calculate theoretical hours for periods without data
        const startDate = new Date(this.config.fechas_alta_empleados[employee.name] || this.config.inicio_datos_reales);
        const today = new Date();
        const totalDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const workDays = Math.floor(totalDays * (5/7)); // Assuming 5 work days per week
        
        stats.horasTeoricas = workDays * this.config.horas_teoricas_dia;

        // Calculate absence hours
        const employeeAbsences = this.absences.filter(abs => abs.employee_id === employee.id);
        stats.horasAusencias = employeeAbsences.reduce((total, absence) => {
            const days = this.calculateAbsenceDays(absence.fecha_inicio, absence.fecha_fin);
            return total + (days * this.config.horas_teoricas_dia);
        }, 0);
        stats.diasAusencias = employeeAbsences.length;

        // Total hours (real + theoretical - absences)
        stats.horasTotal = stats.horasReales + stats.horasTeoricas - stats.horasAusencias;

        // Determine status
        const expectedHours = this.config.horas_maximas_anuales;
        stats.diferencia = stats.horasTotal - expectedHours;

        if (stats.diferencia > 50) {
            stats.estado = 'sobrecarga';
        } else if (stats.diferencia < -50) {
            stats.estado = 'subcarga';
        } else {
            stats.estado = 'equilibrado';
        }

        return stats;
    }

    calculateAbsenceDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    checkConventionLimits(employee, stats) {
        // Check annual hour limit
        if (stats.horasTotal > this.config.horas_maximas_anuales) {
            this.conventionAlerts.push({
                type: 'error',
                employee: employee.name,
                message: `Supera el límite anual de horas (${formatHours(stats.horasTotal)} / ${formatHours(this.config.horas_maximas_anuales)})`
            });
        }

        // Check for significant underwork
        if (stats.diferencia < -200) {
            this.conventionAlerts.push({
                type: 'warning',
                employee: employee.name,
                message: `Subcarga significativa (${formatHours(Math.abs(stats.diferencia))} horas bajo el objetivo)`
            });
        }
    }

    createSimplePanel() {
        // Check if panel already exists
        if (document.getElementById('controlAnualPanel')) {
            this.updateSimplePanel();
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'controlAnualPanel';
        panel.className = 'convention-panel';
        
        panel.innerHTML = this.generatePanelHTML();
        
        // Insert after hours counter
        const horasTeoricas = document.getElementById('horasTeoricas');
        if (horasTeoricas && horasTeoricas.parentNode) {
            horasTeoricas.parentNode.insertBefore(panel, horasTeoricas.nextSibling);
        }

        this.setupPanelEvents();
    }

    updateSimplePanel() {
        const panel = document.getElementById('controlAnualPanel');
        if (panel) {
            panel.innerHTML = this.generatePanelHTML();
            this.setupPanelEvents();
        }
    }

    generatePanelHTML() {
        const totalEmployees = Object.keys(this.annualStats).length;
        const alertsCount = this.conventionAlerts.length;
        
        const employeesList = Object.values(this.annualStats).map(stats => `
            <div class="employee-stats ${stats.estado}">
                <span class="emp-name">${stats.name}</span>
                <span class="emp-hours">${formatHours(stats.horasTotal)}</span>
                <span class="emp-status ${stats.estado}">${this.getStatusIcon(stats.estado)}</span>
            </div>
        `).join('');

        const alertsList = this.conventionAlerts.map(alert => `
            <div class="alert ${alert.type}">
                <strong>${alert.employee}:</strong> ${alert.message}
            </div>
        `).join('');

        return `
            <div class="panel-header">
                <h3>📊 Control Anual del Convenio</h3>
                <button id="toggleConventionPanel" class="toggle-btn">−</button>
            </div>
            <div class="panel-content" id="conventionPanelContent">
                <div class="stats-summary">
                    <div class="stat-item">
                        <span class="stat-label">Empleados monitorizados:</span>
                        <span class="stat-value">${totalEmployees}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Alertas activas:</span>
                        <span class="stat-value ${alertsCount > 0 ? 'alert' : ''}">${alertsCount}</span>
                    </div>
                </div>
                
                <div class="employees-annual-stats">
                    <h4>Estado por empleado:</h4>
                    ${employeesList}
                </div>
                
                ${alertsCount > 0 ? `
                    <div class="convention-alerts">
                        <h4>⚠️ Alertas del convenio:</h4>
                        ${alertsList}
                    </div>
                ` : ''}
            </div>
        `;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'sobrecarga': return '🔴';
            case 'subcarga': return '🟡';
            case 'equilibrado': return '🟢';
            default: return '⚪';
        }
    }

    setupPanelEvents() {
        const toggleBtn = document.getElementById('toggleConventionPanel');
        const content = document.getElementById('conventionPanelContent');
        
        if (toggleBtn && content) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = content.style.display !== 'none';
                content.style.display = isVisible ? 'none' : 'block';
                toggleBtn.textContent = isVisible ? '+' : '−';
            });
        }
    }

    // Public methods for compatibility
    getEmployeeAnnualStats(employeeId) {
        return this.annualStats[employeeId] || null;
    }

    getAllAnnualStats() {
        return { ...this.annualStats };
    }

    getConventionAlerts() {
        return [...this.conventionAlerts];
    }

    async refresh() {
        await this.loadData();
        await this.calculateAnnualStats();
        this.updateSimplePanel();
    }
}
