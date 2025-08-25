window.UI = window.UI || {};

(function(UI){
  const { generateDaysForWeek } = window.WeekService;
  const { findColleaguesForDay, findColleaguesForShift } = window.ColleaguesUtils;

  UI.renderSchedule = function renderSchedule() {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = '';
    const currentDays = generateDaysForWeek(window.AppState.currentWeekStart);
    currentDays.forEach((day, index) => {
      const schedule = window.AppState.currentSchedule[day.key];
      const card = document.createElement('div');
      card.style.animationDelay = `${index * 0.1}s`;
      card.classList.add('slide-up');
      const today = new Date();
      const currentDayIndex = (today.getDay() + 6) % 7;
      const isCurrentWeek = window.AppState.currentWeekStart === window.DateUtils.getCurrentWeekStart();
      const isToday = isCurrentWeek && index === currentDayIndex;
      if (isToday) card.classList.add('today-highlight');

      if (schedule.is_free_day) {
        card.className = 'schedule-card day-free p-5 slide-up';
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <span class="text-xl">😴</span>
              </div>
              <div>
                <div class="font-bold text-lg">${day.name}</div>
                <div class="text-sm opacity-75">${day.date}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="bg-white/20 px-3 py-1 rounded-full">
                <span class="text-sm font-semibold">LIBRE</span>
              </div>
              <div class="text-xs mt-1 opacity-60">Descanso</div>
            </div>
          </div>
          ${isToday ? '<div class="mt-3"><span class="badge badge-today"><i class="fas fa-star"></i> Hoy</span></div>' : ''}
        `;
      } else {
        const startTime = schedule.start_time ? schedule.start_time.slice(0, 5) : '';
        const endTime = schedule.end_time ? schedule.end_time.slice(0, 5) : '';
        const isSplitShift = schedule.shifts.length > 1;
        let cardClass, icon, timeLabel;
        if (isSplitShift) { cardClass = 'day-special'; icon = '🔄'; timeLabel = 'Partido'; }
        else if (startTime >= '06:00' && startTime < '12:00') { cardClass = 'day-morning'; icon = '🌅'; timeLabel = 'Mañana'; }
        else if (startTime >= '14:00' && startTime < '18:00') { cardClass = 'day-afternoon'; icon = '🌆'; timeLabel = 'Tarde'; }
        else if (startTime >= '18:00') { cardClass = 'day-evening'; icon = '🌃'; timeLabel = 'Noche'; }
        else if (startTime >= '12:00' && startTime < '14:00') { cardClass = 'day-afternoon'; icon = '🌆'; timeLabel = 'Tarde'; }
        else { cardClass = 'day-special'; icon = '⚡'; timeLabel = 'Especial'; }

        const colleaguesWorking = findColleaguesForDay(day.key);
        let timeDisplay, hoursDisplay, colleaguesDisplay;
        if (isSplitShift) {
          const shiftDetails = schedule.shifts.map((shift, index) => {
            const shiftColleagues = findColleaguesForShift(day.key, shift);
            const colleaguesText = shiftColleagues.length > 0 ? shiftColleagues.join(', ') : 'Solo/a';
            return { time: `${shift.start_time.slice(0,5)}-${shift.end_time.slice(0,5)}`, colleagues: colleaguesText };
          });
          timeDisplay = shiftDetails.map(detail => detail.time).join(' + ');
          hoursDisplay = `${schedule.shifts.length} turnos`;
          colleaguesDisplay = shiftDetails;
        } else {
          timeDisplay = `${startTime} - ${endTime}`;
          hoursDisplay = `Turno completo`;
          colleaguesDisplay = colleaguesWorking.length > 0 ? colleaguesWorking.join(', ') : 'Trabajando solo/a';
        }

        card.className = `schedule-card ${cardClass} p-5 slide-up`;
        card.innerHTML = `
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <span class="text-xl">${icon}</span>
              </div>
              <div>
                <div class="font-bold text-lg">${day.name}</div>
                <div class="text-sm opacity-80">${day.date}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="bg-white/20 px-3 py-1 rounded-full mb-1">
                <span class="text-xs font-semibold">${timeLabel.toUpperCase()}</span>
              </div>
              <div class="text-xs opacity-60">${hoursDisplay}</div>
            </div>
          </div>
          <div class="bg-white/60 rounded-xl p-3 mb-3 border border-gray-200">
            ${isSplitShift ? `
              <div class="space-y-3">
                ${colleaguesDisplay.map((detail, index) => `
                  <div class="flex justify-between items-center ${index > 0 ? 'border-t border-white/20 pt-3' : ''}">
                    <div>
                      <div class="font-bold text-sm">${detail.time}</div>
                      <div class="text-xs opacity-75">Turno ${index + 1}</div>
                    </div>
                    <div class="text-right text-xs flex items-center gap-2">
                      <span class="text-gray-600">Con</span>
                      <div class="opacity-75 chips-row">
                        ${detail.colleagues === 'Solo/a'
                          ? '<span class="chip"><span class="avatar">🙂</span>Solo/a</span>'
                          : detail.colleagues.split(', ').map(name => `
                              <span class=\"chip\"><span class=\"avatar\">${name.charAt(0)}</span>${name}</span>
                            `).join('')}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="flex items-center justify-center">
                <div class="text-center">
                  <div class="time-display mb-1">${timeDisplay}</div>
                  <div class="text-xs text-gray-600">
                    <i class="fas fa-clock mr-1"></i>Horario de trabajo
                  </div>
                </div>
              </div>
            `}
          </div>
          ${(() => {
            const tasks = (window.AppState.currentSchedule[day.key] && window.AppState.currentSchedule[day.key].tasks) || [];
            if (!tasks || tasks.length === 0) return '';
            const chips = tasks.map(t => `<span class=\"chip\"><span class=\"avatar\">${(t.name || t.key || '?').trim().charAt(0).toUpperCase()}</span>${t.name || t.key}</span>`).join('');
            return `
              <div class=\"bg-white/60 rounded-xl p-3 mb-3 border border-gray-200\">
                <div class=\"flex items-center justify-between mb-2\">
                  <div class=\"font-semibold text-sm text-gray-800\"><i class=\"fas fa-list-check mr-2\"></i>Tareas asignadas</div>
                </div>
                <div class=\"chips-row\">${chips}</div>
              </div>
            `;
          })()}
          <div class="flex items-center justify-between text-xs text-gray-700">
            ${isSplitShift ? `
              <div class="bg-white/20 px-2 py-1 rounded-full text-xs">
                <i class="fas fa-arrows-split-up-and-left mr-1"></i>${schedule.shifts.length} turnos
              </div>
              <div class="text-right opacity-75">
                <i class="fas fa-info-circle mr-1"></i>Horario partido
              </div>
            ` : `
              <div class="flex items-center gap-2 opacity-75 w-full">
                ${colleaguesDisplay && typeof colleaguesDisplay === 'string' && colleaguesDisplay !== 'Trabajando solo/a'
                  ? `<span class=\"text-gray-600\">Trabajas con</span><div class=\"chips-row\">${colleaguesDisplay.split(', ').map(name => `<span class=\"chip\"><span class=\"avatar\">${name.charAt(0)}</span>${name}</span>`).join('')}</div>`
                  : '<span class="chip"><span class="avatar">🙂</span>Trabajas solo/a</span>'}
              </div>
            `}
          </div>
          ${isToday ? '<div class="mt-2"><span class="badge badge-today"><i class="fas fa-star"></i> Hoy</span></div>' : ''}
        `;
      }
      container.appendChild(card);
    });
  };

  UI.updateStats = function updateStats(){
    const schedule = window.AppState.currentSchedule;
    if (!schedule || typeof schedule !== 'object') {
      document.getElementById('workDays').textContent = '0';
      document.getElementById('nextShiftDay').innerHTML = '<i class="fas fa-calendar-times mr-1"></i>Sin datos';
      document.getElementById('nextShiftTime').textContent = 'disponibles';
      return;
    }
    const workDays = Object.values(schedule).filter(s => s && !s.is_free_day).length;
    document.getElementById('workDays').textContent = workDays;
    const today = new Date();
    const currentHour = today.getHours();
    const currentMinutes = today.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    const currentDayIndex = (today.getDay() + 6) % 7;
    const currentDays = window.WeekService.generateDaysForWeek(window.AppState.currentWeekStart);
    let nextShift = null;
    const todayDay = currentDays[currentDayIndex];
    const todaySchedule = schedule[todayDay.key];
    if (todaySchedule && !todaySchedule.is_free_day && todaySchedule.shifts) {
      for (const shift of todaySchedule.shifts) {
        if (shift.start_time > currentTime) { nextShift = { day: 'Hoy', time: shift.start_time.slice(0, 5), isToday: true }; break; }
      }
    }
    if (!nextShift) {
      for (let i = 1; i < 7; i++) {
        const dayIndex = (currentDayIndex + i) % 7;
        const day = currentDays[dayIndex];
        const s = schedule[day.key];
        if (s && !s.is_free_day && s.shifts && s.shifts.length > 0) {
          nextShift = { day: day.name, time: s.shifts[0].start_time.slice(0, 5), isToday: false };
          break;
        }
      }
    }
    if (nextShift) {
      document.getElementById('nextShiftDay').innerHTML = `<i class="fas fa-arrow-right mr-1"></i>${nextShift.isToday ? 'Hoy' : nextShift.day}`;
      document.getElementById('nextShiftTime').textContent = nextShift.time;
    } else {
      document.getElementById('nextShiftDay').innerHTML = '<i class="fas fa-calendar-times mr-1"></i>Sin turnos';
      document.getElementById('nextShiftTime').textContent = 'esta semana';
    }
  };
})(window.UI);


