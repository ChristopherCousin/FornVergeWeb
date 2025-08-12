window.UI = window.UI || {};

(function(UI){
  function showRefreshIndicator() {
    const indicator = document.getElementById('autoRefreshIndicator');
    const icon = indicator.querySelector('i');
    indicator.classList.add('show');
    icon.classList.add('updating');
  }

  function hideRefreshIndicator() {
    const indicator = document.getElementById('autoRefreshIndicator');
    const icon = indicator.querySelector('i');
    setTimeout(() => {
      indicator.classList.remove('show');
      icon.classList.remove('updating');
    }, 1000);
  }

  function updateLastRefreshTime() {
    window.AppState.lastRefreshTime = new Date();
    const timeString = window.AppState.lastRefreshTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdated').innerHTML = `<i class="fas fa-sync-alt mr-1"></i>Actualizado a las ${timeString}`;
  }

  async function autoRefreshData() {
    if (!window.AppState.currentEmployee) return;
    try {
      showRefreshIndicator();
      await window.WeekService.getAvailableWeeks();
      await window.ScheduleService.loadEmployeeSchedule();
      updateLastRefreshTime();
    } catch (e) {
      console.error('Auto refresh error', e);
    } finally {
      hideRefreshIndicator();
    }
  }

  function startAutoRefresh() {
    if (window.AppState.autoRefreshInterval) clearInterval(window.AppState.autoRefreshInterval);
    window.AppState.autoRefreshInterval = setInterval(autoRefreshData, window.APP_CONFIG.AUTO_REFRESH_MS);
  }

  function stopAutoRefresh() {
    if (window.AppState.autoRefreshInterval) {
      clearInterval(window.AppState.autoRefreshInterval);
      window.AppState.autoRefreshInterval = null;
    }
  }

  UI.autoRefreshData = autoRefreshData;
  UI.startAutoRefresh = startAutoRefresh;
  UI.stopAutoRefresh = stopAutoRefresh;
  UI.updateLastRefreshTime = updateLastRefreshTime;
})(window.UI);


