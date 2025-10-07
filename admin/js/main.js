/* Forn Verge - Main Orchestrator - MASSA SON OLIVA */

// ====================================
// IMPORTS DE CONFIGURACIÓN
// ====================================
import { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_PASSWORD_HASH, SON_OLIVA_LOCATION_ID } from './config/constants.js';
import { supabase } from './config/supabase.js';
import { availableWeeks, currentWeekStart, setCurrentWeekStart, getCurrentWeek } from './config/weeks.js';

// ====================================
// IMPORTS DE UTILIDADES
// ====================================
import { sha256 } from './utils/auth-utils.js';
import { 
    toISODate, 
    getThisMondayISO, 
    generateDaysForWeek,
    getDayEmoji,
    getDayDate,
    getWeekLabel,
    getWeekLabelShort
} from './utils/date-utils.js';
import { getShiftType, getShiftDescription, calcularHorasEntreTiempos, detectarTipoTurno } from './utils/shift-utils.js';
import { getEmployeeColor, getShiftTypeIcon, getShiftTypeClass } from './utils/colors.js';
import { debounce } from './utils/debounce.js';

// ====================================
// IMPORTS DE CORE
// ====================================
import { 
    employees, 
    scheduleData, 
    originalScheduleBeforeDraft,
    isInDraftMode,
    currentModalEmployee,
    currentModalDay,
    employeesOnVacation,
    isEditingShift,
    currentEditingShiftIndex,
    isAuthenticated,
    DAYS,
    setEmployees,
    setScheduleData,
    setIsAuthenticated,
    setDAYS
} from './core/state.js';

import { 
    checkAuthentication, 
    showMainInterface, 
    showLoginInterface,
    setupLoginListeners,
    handleLogin,
    logout 
} from './core/auth.js';

import { initApp } from './core/init.js';
import { setupEventListeners } from './core/events.js';

// ====================================
// IMPORTS DE SERVICIOS
// ====================================
import { loadEmployees } from './services/employees.js';
import { 
    loadCurrentSchedules, 
    removeSpecificShiftFromDB,
    rebuildDaySchedule,
    saveAllSchedules 
} from './services/schedules.js';

// ====================================
// IMPORTS DE MÓDULOS
// ====================================
import { 
    setupWeekSelector,
    updateWeekDisplay,
    updateNavigationButtons,
    goToPreviousWeek,
    goToNextWeek,
    onWeekSelectChange,
    changeToWeek
} from './modules/week-navigation.js';

import {
    openShiftModal,
    closeModal,
    setTemplate,
    addFreeDay,
    toggleSplitShiftFields,
    addShiftFromModal,
    removeShift
} from './modules/shift-modal.js';

import {
    calcularHorasSemanalesTeoricas,
    obtenerDesgloseHorasEmpleados,
    actualizarContadorHorasTeoricas,
    toggleContadorHorasTeoricas
} from './modules/hours-counter.js';

import { 
    checkAndPredefineRaquelSchedule 
} from './modules/raquel-schedule.js';

import {
    handleSugerirHorario,
    handleSaveDraft,
    handleDiscardDraft
} from './modules/draft-mode.js';

import {
    openGeneratorSettings,
    closeGeneratorSettings,
    loadSettings,
    saveSettings,
    createShiftInputRow
} from './modules/generator-settings.js';

// ====================================
// IMPORTS DE UI
// ====================================
import { updateStatus, showLoading, hideLoading } from './ui/status.js';
import { 
    initDefaultView,
    renderWeekFullView,
    createWeekDayColumn,
    forceGridReflow,
    forceUpdateWeekView
} from './ui/render-week.js';
import { 
    createWeekShiftElement,
    createAbsenceElement,
    removeWeekShift
} from './ui/render-shifts.js';
import {
    updateStats,
    renderEmployees,
    getActiveEmployees,
    getTotalShifts,
    getTotalHours,
    getEmployeeWeekStats,
    renderEmployeeLegend,
    renderWeekSummary
} from './ui/stats.js';

// ====================================
// IMPORTS DE DEBUG
// ====================================
import {
    runDiagnostic,
    cleanDuplicates,
    debugGaby,
    fixGaby,
    detectInconsistentData,
    cleanInconsistentData
} from './debug/diagnostic.js';

// ====================================
// EXPORTAR AL SCOPE GLOBAL (window)
// ====================================
// Para mantener compatibilidad con código existente
window.supabase = supabase;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Funciones de debug en consola
window.runDiagnostic = runDiagnostic;
window.cleanDuplicates = cleanDuplicates;
window.debugGaby = debugGaby;
window.fixGaby = fixGaby;
window.detectInconsistentData = detectInconsistentData;
window.cleanInconsistentData = cleanInconsistentData;
window.forceUpdateWeekView = forceUpdateWeekView;

// Funciones globales necesarias
window.removeWeekShift = removeWeekShift;
window.setTemplate = setTemplate;
window.addFreeDay = addFreeDay;
window.toggleSplitShiftFields = toggleSplitShiftFields;

// ====================================
// INICIALIZACIÓN
// ====================================
// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

console.log('>> Sistema modular cargado correctamente');
