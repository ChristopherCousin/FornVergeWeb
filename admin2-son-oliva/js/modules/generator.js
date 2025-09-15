/**
 * MÓDULO GENERADOR AUTOMÁTICO DE HORARIOS - FORN VERGE
 * =====================================================
 * Genera horarios automáticamente basado en reglas de negocio
 */

import { DEFAULT_COVERAGE, STORAGE_KEYS } from '../config/constants.js';
import { showToast } from '../utils/helpers.js';

export class GeneratorModule {
    constructor(dataManager, absencesModule, conventionModule) {
        this.dataManager = dataManager;
        this.absencesModule = absencesModule;
        this.conventionModule = conventionModule;
        
        this.coverageNeeds = this.loadCoverageSettings();
        this.days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    }

    async init() {
        console.log('🔮 Inicializando generador automático...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('btnSugerirHorario');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateSchedule());
        }

        // Make globally available for compatibility
        window.generatorModule = this;
    }

    loadCoverageSettings() {
        const saved = localStorage.getItem(STORAGE_KEYS.GENERATOR_SETTINGS);
        return saved ? JSON.parse(saved) : DEFAULT_COVERAGE;
    }

    saveCoverageSettings() {
        localStorage.setItem(STORAGE_KEYS.GENERATOR_SETTINGS, JSON.stringify(this.coverageNeeds));
    }

    async generateSchedule() {
        if (!window.app) {
            showToast('Sistema no inicializado', 'error');
            return;
        }

        // Show confirmation dialog
        if (window.Swal) {
            const result = await window.Swal.fire({
                title: '🔮 Generar Horario Automático',
                html: `
                    <p>Se generará un horario sugerido para la semana actual.</p>
                    <p><strong>⚠️ Esto sobrescribirá los horarios existentes.</strong></p>
                    <p>Podrás revisar y guardar o descartar los cambios.</p>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '🚀 Generar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#8B5CF6'
            });

            if (!result.isConfirmed) return;
        }

        try {
            // Save original schedule before generating
            window.app.originalScheduleBeforeDraft = JSON.parse(JSON.stringify(window.app.scheduleData));

            // Generate new schedule
            const newScheduleData = await this.generate(window.app.currentWeekStart);
            
            // Apply draft
            window.app.enableDraftMode(newScheduleData);
            
            showToast('Borrador de horario generado. Revisa y guarda o descarta.', 'success');

        } catch (error) {
            console.error('Error generando horario:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    }

    async generate(weekStart) {
        console.log('🔮 Generando horario para la semana:', weekStart);

        // Get employee states and priorities
        const employeeStates = await this.getEmployeeStates(weekStart);
        const prioritizedEmployees = this.prioritizeEmployees(employeeStates);
        
        // Initialize schedule and tracking
        let draftSchedule = this.initializeDraftSchedule();
        let trackingState = this.initializeTrackingState(prioritizedEmployees);

        // Assign fixed free days first
        this.assignFixedFreeDays(draftSchedule, trackingState, prioritizedEmployees);

        // Main assignment logic
        for (const day of this.days) {
            const dayType = this.getDayType(day);
            const neededShifts = this.coverageNeeds[dayType] || [];

            neededShifts.forEach((shiftInfo) => {
                const requiredEmployees = shiftInfo.count || 1;
                
                // Re-prioritize for each shift
                const dynamicPrioritizedEmployees = this.getDynamicPriority(prioritizedEmployees, trackingState);
                
                // Assign employees to this shift
                for (let i = 0; i < requiredEmployees && i < dynamicPrioritizedEmployees.length; i++) {
                    const employee = dynamicPrioritizedEmployees[i];
                    
                    if (this.canAssignShift(employee, day, shiftInfo, draftSchedule, trackingState)) {
                        this.assignShift(employee, day, shiftInfo, draftSchedule, trackingState);
                    }
                }
            });
        }

        // Ensure everyone has at least 2 free days
        this.ensureFreeDays(draftSchedule, prioritizedEmployees, trackingState);

        return draftSchedule;
    }

    async getEmployeeStates(weekStart) {
        const employees = window.app?.employees || [];
        const states = [];

        for (const employee of employees) {
            const conventionStats = this.conventionModule?.getEmployeeAnnualStats(employee.id);
            
            states.push({
                ...employee,
                convenio: conventionStats || {},
                workDays: new Set(),
                totalHours: 0
            });
        }

        return states;
    }

    prioritizeEmployees(employeeStates) {
        return employeeStates.sort((a, b) => {
            // Priority 1: Convention status (subcarga first)
            const aStatus = a.convenio?.estado || 'equilibrado';
            const bStatus = b.convenio?.estado || 'equilibrado';
            
            if (aStatus === 'subcarga' && bStatus !== 'subcarga') return -1;
            if (bStatus === 'subcarga' && aStatus !== 'subcarga') return 1;
            
            // Priority 2: Alphabetical by name
            return (a.name || '').localeCompare(b.name || '');
        });
    }

    initializeDraftSchedule() {
        return {};
    }

    initializeTrackingState(employees) {
        const state = {};
        employees.forEach(emp => {
            state[emp.id] = {
                workDays: new Set(),
                totalHours: 0,
                freeDays: new Set()
            };
        });
        return state;
    }

    assignFixedFreeDays(schedule, tracking, employees) {
        // Simple implementation: assign random free days
        employees.forEach(employee => {
            const empId = employee.id;
            const freeDaysNeeded = 2;
            const availableDays = [...this.days];
            
            // Randomly select free days
            for (let i = 0; i < freeDaysNeeded && availableDays.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * availableDays.length);
                const freeDay = availableDays.splice(randomIndex, 1)[0];
                
                this.assignFreeDay(employee, freeDay, schedule, tracking);
            }
        });
    }

    getDayType(day) {
        const dayIndex = this.days.indexOf(day);
        if (dayIndex >= 0 && dayIndex <= 4) return 'weekday'; // Mon-Fri
        if (dayIndex === 5) return 'saturday';
        return 'sunday';
    }

    getDynamicPriority(employees, trackingState) {
        return employees.slice().sort((a, b) => {
            const aTracking = trackingState[a.id];
            const bTracking = trackingState[b.id];
            
            // Priority: fewer work days first
            const aDays = aTracking.workDays.size;
            const bDays = bTracking.workDays.size;
            
            return aDays - bDays;
        });
    }

    canAssignShift(employee, day, shiftInfo, schedule, tracking) {
        const empId = employee.id;
        
        // Check if already has free day
        if (tracking[empId].freeDays.has(day)) return false;
        
        // Check if already working this day
        if (schedule[empId] && schedule[empId][day] && schedule[empId][day].length > 0) {
            return false; // Already has a shift this day
        }
        
        // Check maximum work days (5 per week)
        if (tracking[empId].workDays.size >= 5) return false;
        
        return true;
    }

    assignShift(employee, day, shiftInfo, schedule, tracking) {
        const empId = employee.id;
        
        if (!schedule[empId]) schedule[empId] = {};
        if (!schedule[empId][day]) schedule[empId][day] = [];
        
        const hours = this.calculateShiftHours(shiftInfo.start, shiftInfo.end);
        
        schedule[empId][day].push({
            free: false,
            start: shiftInfo.start,
            end: shiftInfo.end,
            hours: hours,
            type: this.getShiftType(shiftInfo.start)
        });
        
        tracking[empId].workDays.add(day);
        tracking[empId].totalHours += hours;
    }

    assignFreeDay(employee, day, schedule, tracking) {
        const empId = employee.id;
        
        if (!schedule[empId]) schedule[empId] = {};
        if (!schedule[empId][day]) schedule[empId][day] = [];
        
        schedule[empId][day].push({
            free: true,
            start: null,
            end: null,
            hours: 0,
            type: 'free'
        });
        
        tracking[empId].freeDays.add(day);
    }

    ensureFreeDays(schedule, employees, tracking) {
        employees.forEach(employee => {
            const empId = employee.id;
            const freeDaysCount = tracking[empId].freeDays.size;
            
            if (freeDaysCount < 2) {
                // Find days without assignments and make them free
                const unassignedDays = this.days.filter(day => 
                    !tracking[empId].workDays.has(day) && 
                    !tracking[empId].freeDays.has(day)
                );
                
                const neededFreeDays = 2 - freeDaysCount;
                for (let i = 0; i < neededFreeDays && i < unassignedDays.length; i++) {
                    this.assignFreeDay(employee, unassignedDays[i], schedule, tracking);
                }
            }
        });
    }

    calculateShiftHours(startTime, endTime) {
        const start = new Date(`2000-01-01 ${startTime}`);
        const end = new Date(`2000-01-01 ${endTime}`);
        
        if (end <= start) return 0;
        
        const diffMs = end - start;
        return diffMs / (1000 * 60 * 60); // Convert to hours
    }

    getShiftType(startTime) {
        const hour = parseInt(startTime.split(':')[0]);
        return hour < 14 ? 'morning' : 'afternoon';
    }
}
