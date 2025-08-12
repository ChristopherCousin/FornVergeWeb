(function(){
  function goToPreviousWeek(){
    const idx = window.AppState.availableWeeks.indexOf(window.AppState.currentWeekStart);
    if (idx > 0) {
      window.AppState.currentWeekStart = window.AppState.availableWeeks[idx - 1];
      window.ScheduleService.loadEmployeeSchedule();
    }
  }
  function goToNextWeek(){
    const idx = window.AppState.availableWeeks.indexOf(window.AppState.currentWeekStart);
    if (idx < window.AppState.availableWeeks.length - 1) {
      window.AppState.currentWeekStart = window.AppState.availableWeeks[idx + 1];
      window.ScheduleService.loadEmployeeSchedule();
    }
  }

  document.getElementById('prevWeekBtn').addEventListener('click', goToPreviousWeek);
  document.getElementById('nextWeekBtn').addEventListener('click', goToNextWeek);

  document.getElementById('logoutBtn').addEventListener('click', () => {
    window.UI.stopAutoRefresh();
    localStorage.removeItem('fornverge_access_code');
    localStorage.removeItem('fornverge_employee_data');
    window.AppState.currentEmployee = null;
    window.AppState.currentSchedule = null;
    window.AppState.currentWeekStart = null;
    window.AppState.availableWeeks = [];
    document.getElementById('employeeDashboard').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('accessCode').value = '';
    window.scrollTo(0, 0);
  });

  document.addEventListener('visibilitychange', () => {
    if (window.AppState.currentEmployee) {
      if (document.hidden) {
        window.UI.stopAutoRefresh();
      } else {
        window.UI.startAutoRefresh();
        setTimeout(window.UI.autoRefreshData, 1000);
      }
    }
  });

  window.addEventListener('focus', () => {
    if (window.AppState.currentEmployee && !document.hidden) {
      setTimeout(window.UI.autoRefreshData, 500);
    }
  });
})();


