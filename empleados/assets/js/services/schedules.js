window.ScheduleService = (function(){
  const supabase = () => window.supabaseClient;
  const { generateDaysForWeek } = window.WeekService;

  function setLoading(isLoading) {
    const overlay = document.getElementById('loadingOverlay');
    const prevBtn = document.getElementById('prevWeekBtn');
    const nextBtn = document.getElementById('nextWeekBtn');
    if (isLoading) {
      overlay && overlay.classList.add('show');
      renderSkeletons();
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    } else {
      overlay && overlay.classList.remove('show');
    }
  }

  function renderSkeletons() {
    const container = document.getElementById('scheduleContainer');
    const skeleton = Array.from({ length: 7 }).map((_, i) => `
      <div class="schedule-card p-5 slide-up" style="animation-delay: ${i * 0.08}s">
        <div class="flex items-center justify-between mb-3">
          <div class="skeleton skeleton-line" style="width: 40%; height: 16px"></div>
          <div class="skeleton skeleton-line" style="width: 20%; height: 12px"></div>
        </div>
        <div class="skeleton" style="height: 44px"></div>
      </div>
    `).join('');
    container.innerHTML = skeleton;
  }

  function processAllEmployeesSchedules(allSchedules) {
    // Construir lista dinámica de empleados a partir de los datos recibidos
    const employeeNameSet = new Set();
    allSchedules.forEach(s => {
      const raw = s.employees && s.employees.name ? s.employees.name : '';
      if (raw) {
        const name = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        employeeNameSet.add(name);
      }
    });

    const employeeNames = Array.from(employeeNameSet.values());
    window.AppState.allEmployeeNames = employeeNames;

    // Inicializar estructura por empleado y día
    window.AppState.allEmployeesSchedules = {};
    const currentDays = generateDaysForWeek(window.AppState.currentWeekStart);
    employeeNames.forEach(empName => {
      window.AppState.allEmployeesSchedules[empName] = {};
      currentDays.forEach(day => {
        window.AppState.allEmployeesSchedules[empName][day.key] = { is_free_day: true, shifts: [] };
      });
    });

    // Poblar turnos
    allSchedules.forEach(schedule => {
      const empNameRaw = schedule.employees.name;
      const empName = empNameRaw.charAt(0).toUpperCase() + empNameRaw.slice(1).toLowerCase();
      // Asegurar que existe el contenedor por si llega un nombre nuevo no inicializado
      if (!window.AppState.allEmployeesSchedules[empName]) {
        window.AppState.allEmployeesSchedules[empName] = {};
        currentDays.forEach(day => {
          window.AppState.allEmployeesSchedules[empName][day.key] = { is_free_day: true, shifts: [] };
        });
        if (!window.AppState.allEmployeeNames.includes(empName)) {
          window.AppState.allEmployeeNames.push(empName);
        }
      }
      const dayData = window.AppState.allEmployeesSchedules[empName][schedule.day_of_week];
      if (schedule.is_free_day) {
        dayData.is_free_day = true;
        dayData.shifts = [];
      } else {
        dayData.is_free_day = false;
        dayData.shifts.push({
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          hours: schedule.hours,
          shift_sequence: schedule.shift_sequence || 1
        });
        dayData.shifts.sort((a, b) => a.shift_sequence - b.shift_sequence);
      }
    });
  }

  function processScheduleData(scheduleData) {
    window.AppState.currentSchedule = {};
    const currentDays = generateDaysForWeek(window.AppState.currentWeekStart);
    currentDays.forEach(day => {
      window.AppState.currentSchedule[day.key] = {
        is_free_day: true,
        shifts: [],
        start_time: null,
        end_time: null,
        hours: 0
      };
    });
    scheduleData.forEach(schedule => {
      const dayData = window.AppState.currentSchedule[schedule.day_of_week];
      if (schedule.is_free_day) {
        dayData.is_free_day = true;
        dayData.shifts = [];
        dayData.start_time = null;
        dayData.end_time = null;
        dayData.hours = 0;
      } else {
        dayData.is_free_day = false;
        dayData.shifts.push({
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          hours: schedule.hours || 0,
          shift_sequence: schedule.shift_sequence || 1,
          colleagues: schedule.colleagues || []
        });
      }
    });
    Object.keys(window.AppState.currentSchedule).forEach(dayKey => {
      const dayData = window.AppState.currentSchedule[dayKey];
      if (!dayData.is_free_day && dayData.shifts.length > 0) {
        dayData.shifts.sort((a, b) => a.shift_sequence - b.shift_sequence);
        dayData.start_time = dayData.shifts[0].start_time;
        dayData.end_time = dayData.shifts[dayData.shifts.length - 1].end_time;
        dayData.hours = dayData.shifts.reduce((total, shift) => total + (shift.hours || 0), 0);
        dayData.colleagues = dayData.shifts[0].colleagues;
      }
    });
  }

  function updateWeekDisplay() {
    const startDate = new Date(window.AppState.currentWeekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const startStr = `${startDate.getDate()} ${startDate.toLocaleDateString('es-ES', { month: 'short' })}`;
    const endStr = `${endDate.getDate()} ${endDate.toLocaleDateString('es-ES', { month: 'short' })}`;
    document.getElementById('weekRange').textContent = `Semana ${startStr} - ${endStr}`;
  }

  function updateNavigationButtons() {
    const currentIndex = window.AppState.availableWeeks.indexOf(window.AppState.currentWeekStart);
    const prevBtn = document.getElementById('prevWeekBtn');
    const nextBtn = document.getElementById('nextWeekBtn');
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= window.AppState.availableWeeks.length - 1;
    const weekTitle = document.getElementById('weekTitle');
    const actualCurrentWeek = window.DateUtils.getCurrentWeekStart();
    if (window.AppState.currentWeekStart === actualCurrentWeek) {
      weekTitle.innerHTML = '📅 Esta semana';
    } else {
      const weekNumber = currentIndex + 1;
      const weekLabel = weekNumber === 2 ? 'Próxima semana' : weekNumber === 3 ? 'En 2 semanas' : weekNumber === 4 ? 'En 3 semanas' : 'Semana futura';
      weekTitle.innerHTML = `📅 ${weekLabel}`;
    }
  }

  function showWeekUnavailableMessage() {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = `
      <div class="week-unavailable">
        <div class="text-center">
          <div class="text-2xl mb-2">📅</div>
          <h3 class="font-bold text-lg mb-2">Semana no disponible</h3>
          <p class="text-sm mb-4">Los horarios para esta semana aún no están publicados.</p>
          <button onclick="window.UI.autoRefreshData()" class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
            <i class="fas fa-sync-alt mr-2"></i>Actualizar ahora
          </button>
        </div>
      </div>`;
    if (!window.AppState.currentSchedule) window.AppState.currentSchedule = {};
    window.UI.updateStats();
    updateNavigationButtons();
  }

  async function loadEmployeeSchedule() {
    try {
      setLoading(true);
      if (!window.AppState.currentWeekStart) {
        window.AppState.currentWeekStart = await window.WeekService.getCurrentWeek();
      }
      updateWeekDisplay();
      const { data: weekCheck, error: weekError } = await supabase()
        .from('schedules')
        .select('employee_id')
        .eq('week_start', window.AppState.currentWeekStart)
        .eq('employee_id', window.AppState.currentEmployee.id)
        .limit(1);
      if (weekError) { showWeekUnavailableMessage(); return; }
      if (!weekCheck || weekCheck.length === 0) { showWeekUnavailableMessage(); return; }
      const { data: mySchedules, error: myError } = await supabase()
        .from('schedules')
        .select('*')
        .eq('employee_id', window.AppState.currentEmployee.id)
        .eq('week_start', window.AppState.currentWeekStart)
        .order('day_of_week');
      if (myError) { console.error(myError); return; }
      const { data: allSchedules, error: allError } = await supabase()
        .from('schedules')
        .select(`*, employees!inner(name)`) 
        .eq('week_start', window.AppState.currentWeekStart);
      if (!allError && allSchedules) processAllEmployeesSchedules(allSchedules);
      processScheduleData(mySchedules || []);
      window.UI.renderSchedule();
      window.UI.updateStats();
      updateNavigationButtons();
    } catch (e) {
      console.error('Error general:', e);
      showWeekUnavailableMessage();
    } finally {
      setLoading(false);
    }
  }

  return { loadEmployeeSchedule, processAllEmployeesSchedules, processScheduleData, updateNavigationButtons, showWeekUnavailableMessage };
})();


