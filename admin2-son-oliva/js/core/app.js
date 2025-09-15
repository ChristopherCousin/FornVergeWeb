/**
 * NÚCLEO PRINCIPAL DE LA APLICACIÓN - FORN VERGE
 * ===============================================
 * Inicialización y coordinación de todos los módulos
 */

import { initSupabase } from '../config/supabase.js';
import { authManager } from '../config/auth.js';
import { getCurrentWeek } from '../utils/dates.js';
import { updateStatus, showLoading, hideLoading } from '../utils/helpers.js';
import { UIManager } from './ui-manager.js';
import { DataManager } from './data-manager.js';
import { EmployeesModule } from '../modules/employees.js';
import { SchedulesModule } from '../modules/schedules.js';
import { AbsencesModule } from '../modules/absences.js';
import { GeneratorModule } from '../modules/generator.js';
import { ConventionModule } from '../modules/convention.js';

class App {
    constructor() {
        this.isInitialized = false;
        this.currentWeekStart = getCurrentWeek();
        
        // Módulos principales
        this.uiManager = null;
        this.dataManager = null;
        this.employeesModule = null;
        this.schedulesModule = null;
        this.absencesModule = null;
        this.generatorModule = null;
        this.conventionModule = null;
        
        // Estado global
        this.employees = [];
        this.scheduleData = {};
        this.isInDraftMode = false;
        this.originalScheduleBeforeDraft = null;
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        console.log('🚀 Iniciando Gestión de Horarios v2...');
        
        try {
            // 1. Inicializar autenticación
            authManager.init();
            
            // Si no está autenticado, esperar a que se autentique
            if (!authManager.isLoggedIn()) {
                window.addEventListener('authSuccess', () => this.initAfterAuth());
                return;
            }
            
            // Si ya está autenticado, inicializar directamente
            await this.initAfterAuth();
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            updateStatus('Error de inicialización');
        }
    }

    /**
     * Inicialización después de autenticación exitosa
     */
    async initAfterAuth() {
        try {
            updateStatus('Inicializando...');
            showLoading();
            
            // 2. Inicializar Supabase
            const supabase = initSupabase();
            if (!supabase) {
                throw new Error('No se pudo inicializar Supabase');
            }
            
            // 3. Inicializar gestores principales
            this.dataManager = new DataManager(supabase);
            this.uiManager = new UIManager();
            
            // 4. Cargar datos iniciales
            await this.loadInitialData();
            
            // 5. Inicializar módulos
            await this.initModules();
            
            // 6. Configurar interfaz
            this.uiManager.setupWeekNavigation(this.currentWeekStart);
            this.uiManager.setupEventListeners();
            
            // 7. Renderizar vista inicial
            await this.renderInitialView();
            
            this.isInitialized = true;
            hideLoading();
            updateStatus('Listo ✨');
            
            console.log('✅ Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error en inicialización post-auth:', error);
            updateStatus('Error cargando datos');
            hideLoading();
        }
    }

    /**
     * Carga los datos iniciales necesarios
     */
    async loadInitialData() {
        console.log('📊 Cargando datos iniciales...');
        
        // Cargar empleados
        this.employees = await this.dataManager.loadEmployees();
        console.log(`👥 ${this.employees.length} empleados cargados`);
        
        // Cargar horarios de la semana actual
        this.scheduleData = await this.dataManager.loadSchedules(this.currentWeekStart);
        console.log(`📅 Horarios cargados para semana ${this.currentWeekStart}`);
    }

    /**
     * Inicializa todos los módulos
     */
    async initModules() {
        console.log('🔧 Inicializando módulos...');
        
        // Módulo de empleados
        this.employeesModule = new EmployeesModule(this.dataManager);
        await this.employeesModule.init();
        
        // Módulo de horarios
        this.schedulesModule = new SchedulesModule(this.dataManager);
        await this.schedulesModule.init();
        
        // Módulo de ausencias
        this.absencesModule = new AbsencesModule(this.dataManager);
        await this.absencesModule.init();
        
        // Módulo de convenio
        this.conventionModule = new ConventionModule(this.dataManager);
        await this.conventionModule.init();
        
        // Módulo generador (depende de los otros)
        this.generatorModule = new GeneratorModule(
            this.dataManager,
            this.absencesModule,
            this.conventionModule
        );
        await this.generatorModule.init();
        
        // Hacer módulos disponibles globalmente para compatibilidad
        window.app = this;
        window.employeesModule = this.employeesModule;
        window.schedulesModule = this.schedulesModule;
        window.absencesManager = this.absencesModule; // Compatibilidad con nombre antiguo
        window.controlAnualSimple = this.conventionModule; // Compatibilidad con nombre antiguo
    }

    /**
     * Renderiza la vista inicial
     */
    async renderInitialView() {
        console.log('🎨 Renderizando vista inicial...');
        
        // Renderizar empleados y horarios
        this.uiManager.renderEmployees(this.employees, this.scheduleData);
        
        // Actualizar contador de horas
        this.uiManager.updateHoursCounter(this.employees, this.scheduleData);
        
        // Configurar vista por defecto
        this.uiManager.initDefaultView();
    }

    /**
     * Cambia a una semana diferente
     * @param {string} newWeekStart - Nueva semana en formato YYYY-MM-DD
     */
    async changeWeek(newWeekStart) {
        if (newWeekStart === this.currentWeekStart) return;
        
        try {
            updateStatus('Cargando semana...');
            showLoading();
            
            // Guardar semana actual
            this.currentWeekStart = newWeekStart;
            localStorage.setItem('fornverge_last_week', newWeekStart);
            
            // Recargar datos para la nueva semana
            this.scheduleData = await this.dataManager.loadSchedules(newWeekStart);
            
            // Actualizar UI
            this.uiManager.updateWeekDisplay(newWeekStart);
            this.uiManager.renderEmployees(this.employees, this.scheduleData);
            this.uiManager.updateHoursCounter(this.employees, this.scheduleData);
            
            // Limpiar modo borrador si estaba activo
            if (this.isInDraftMode) {
                this.discardDraft();
            }
            
            hideLoading();
            updateStatus('Listo ✨');
            
        } catch (error) {
            console.error('❌ Error cambiando de semana:', error);
            updateStatus('Error cargando semana');
            hideLoading();
        }
    }

    /**
     * Activa el modo borrador
     * @param {Object} draftScheduleData - Datos del borrador
     */
    enableDraftMode(draftScheduleData) {
        // Guardar estado original
        this.originalScheduleBeforeDraft = JSON.parse(JSON.stringify(this.scheduleData));
        
        // Aplicar borrador
        this.scheduleData = draftScheduleData;
        this.isInDraftMode = true;
        
        // Actualizar UI
        this.uiManager.showDraftMode();
        this.uiManager.renderEmployees(this.employees, this.scheduleData);
        this.uiManager.updateHoursCounter(this.employees, this.scheduleData);
    }

    /**
     * Guarda el borrador actual
     */
    async saveDraft() {
        if (!this.isInDraftMode) return;
        
        try {
            updateStatus('Guardando horario...');
            
            await this.dataManager.saveSchedules(this.currentWeekStart, this.scheduleData);
            
            // Limpiar modo borrador
            this.originalScheduleBeforeDraft = null;
            this.isInDraftMode = false;
            this.uiManager.hideDraftMode();
            
            updateStatus('Horario guardado ✅');
            
        } catch (error) {
            console.error('❌ Error guardando borrador:', error);
            updateStatus('Error guardando');
        }
    }

    /**
     * Descarta el borrador actual
     */
    discardDraft() {
        if (!this.isInDraftMode) return;
        
        // Restaurar estado original
        if (this.originalScheduleBeforeDraft) {
            this.scheduleData = this.originalScheduleBeforeDraft;
            this.originalScheduleBeforeDraft = null;
        }
        
        this.isInDraftMode = false;
        this.uiManager.hideDraftMode();
        
        // Re-renderizar
        this.uiManager.renderEmployees(this.employees, this.scheduleData);
        this.uiManager.updateHoursCounter(this.employees, this.scheduleData);
    }

    /**
     * Recarga los datos de empleados
     */
    async reloadEmployees() {
        this.employees = await this.dataManager.loadEmployees();
        this.uiManager.renderEmployees(this.employees, this.scheduleData);
        this.uiManager.updateHoursCounter(this.employees, this.scheduleData);
    }

    /**
     * Recarga los horarios de la semana actual
     */
    async reloadSchedules() {
        this.scheduleData = await this.dataManager.loadSchedules(this.currentWeekStart);
        this.uiManager.renderEmployees(this.employees, this.scheduleData);
        this.uiManager.updateHoursCounter(this.employees, this.scheduleData);
    }

    /**
     * Cierra sesión
     */
    logout() {
        authManager.logout();
        location.reload();
    }
}

// Instancia única de la aplicación
export const app = new App();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
