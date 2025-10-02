/* Forn Verge - Cálculo y renderizado de estadísticas - MASSA SON OLIVA */

function updateStats() {
    // Stats eliminadas completamente - solo para debug interno
    const activeEmployees = getActiveEmployees();
    // console.log(`📊 ${activeEmployees.length} empleados activos en la semana`);
}

function renderEmployees() {
    // Solo renderizar vista de semana
    renderWeekFullView();
    updateStats();
}

// Función helper para filtrar empleados que no están de vacaciones
function getActiveEmployees() {
    // AHORA MOSTRAMOS A TODOS, las ausencias se visualizan en la parrilla.
    return employees;
}

function getTotalShifts(empId) {
    let total = 0;
    DAYS.forEach(day => {
        const shifts = scheduleData[empId][day.key] || [];
        total += shifts.filter(s => !s.isFree).length;
    });
    return total;
}

function getTotalHours(empId) {
    let total = 0;
    DAYS.forEach(day => {
        const shifts = scheduleData[empId][day.key] || [];
        total += shifts.reduce((sum, shift) => sum + (shift.hours || 0), 0);
    });
    return total;
}
function renderEmployeeLegend() {
    const container = document.getElementById('employeeLegend');
    container.innerHTML = '';
    
    const activeEmployees = getActiveEmployees();
    
    if (activeEmployees.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    const title = document.createElement('div');
    title.className = 'employee-legend-title';
    title.innerHTML = '<i class="fas fa-palette mr-2"></i>Código de colores por empleado';
    
    const grid = document.createElement('div');
    grid.className = 'employee-legend-grid';
    
    activeEmployees.forEach(employee => {
        const color = getEmployeeColor(employee.id);
        const totalHours = getTotalHours(employee.id);
        
        const item = document.createElement('div');
        item.className = 'employee-legend-item';
        item.style.cssText = `
            background: linear-gradient(45deg, ${color.background}, #ffffff);
            border: 1px solid ${color.border};
        `;
        
        item.innerHTML = `
            <div class="employee-legend-color" style="background: ${color.border}; border-color: ${color.border};"></div>
            <div class="employee-legend-info">
                <div class="employee-legend-name">${employee.name}</div>
                <div class="employee-legend-hours">${totalHours}h semanales</div>
            </div>
        `;
        
        grid.appendChild(item);
    });
    
    container.appendChild(title);
    container.appendChild(grid);
}

function renderWeekSummary() {
    const container = document.getElementById('weekSummary');
    container.innerHTML = '';
    
    const activeEmployees = getActiveEmployees();
    
    if (activeEmployees.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    const title = document.createElement('div');
    title.className = 'week-summary-title';
    title.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Resumen Semanal de Horas';
    
    const grid = document.createElement('div');
    grid.className = 'week-summary-grid';
    
    activeEmployees.forEach(employee => {
        const color = getEmployeeColor(employee.id);
        const stats = getEmployeeWeekStats(employee.id);
        
        const card = document.createElement('div');
        card.className = 'employee-summary-card';
        card.style.cssText = `
            background: linear-gradient(45deg, ${color.background}, #ffffff);
            border-color: ${color.border};
        `;
        
        card.innerHTML = `
            <div class="employee-summary-header">
                <div class="employee-summary-name">${employee.name}</div>
                <div class="employee-summary-total" style="color: ${color.border};">${stats.totalHours}h</div>
            </div>
            <div class="employee-summary-details">
                <div class="summary-detail-item">
                    <span class="summary-detail-label">Turnos:</span>
                    <span class="summary-detail-value">${stats.totalShifts}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">Días libres:</span>
                    <span class="summary-detail-value">${stats.freeDays}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">🌅 Mañanas:</span>
                    <span class="summary-detail-value">${stats.morningShifts}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">🌆 Tardes:</span>
                    <span class="summary-detail-value">${stats.afternoonShifts}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">⚡ Refuerzos:</span>
                    <span class="summary-detail-value">${stats.refuerzoShifts}</span>
                </div>
                <div class="summary-detail-item">
                    <span class="summary-detail-label">Promedio/día:</span>
                    <span class="summary-detail-value">${stats.averageHours}h</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    container.appendChild(title);
    container.appendChild(grid);
}

function getEmployeeWeekStats(employeeId) {
    let totalHours = 0;
    let totalShifts = 0;
    let freeDays = 0;
    let morningShifts = 0;
    let afternoonShifts = 0;
    let refuerzoShifts = 0;
    let customShifts = 0;
    
    DAYS.forEach(day => {
        const shifts = scheduleData[employeeId][day.key] || [];
        
        if (shifts.length === 0) {
            freeDays++;
        } else {
            shifts.forEach(shift => {
                if (shift.isFree) {
                    freeDays++;
                } else {
                    totalShifts++;
                    totalHours += shift.hours || 0;
                    
                    switch(shift.type) {
                        case 'morning':
                            morningShifts++;
                            break;
                        case 'afternoon':
                            afternoonShifts++;
                            break;
                        case 'refuerzo':
                            refuerzoShifts++;
                            break;
                        default:
                            customShifts++;
                            break;
                    }
                }
            });
        }
    });
    
    const workingDays = DAYS.length - freeDays;
    const averageHours = workingDays > 0 ? (totalHours / workingDays).toFixed(1) : '0.0';
    
    return {
        totalHours,
        totalShifts,
        freeDays,
        morningShifts,
        afternoonShifts,
        refuerzoShifts,
        customShifts,
        averageHours
    };
}
