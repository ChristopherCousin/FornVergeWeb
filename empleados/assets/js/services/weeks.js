window.WeekService = (function(){
  const { getCurrentWeekStart, generateDaysForWeek } = window.DateUtils;

  function generateAvailableWeeks() {
    const currentWeekStart = getCurrentWeekStart();
    const weeks = [currentWeekStart];
    for (let i = 1; i <= 3; i++) {
      const nextWeek = new Date(currentWeekStart);
      nextWeek.setDate(nextWeek.getDate() + (i * 7));
      const year = nextWeek.getFullYear();
      const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
      const day = String(nextWeek.getDate()).padStart(2, '0');
      weeks.push(`${year}-${month}-${day}`);
    }
    return weeks;
  }

  async function getAvailableWeeks() {
    const { availableWeeks } = window.AppState;
    const supabase = window.supabaseClient;
    window.AppState.availableWeeks = generateAvailableWeeks();
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('week_start')
        .in('week_start', window.AppState.availableWeeks)
        .order('week_start', { ascending: true });
      if (error) return window.AppState.availableWeeks;
      if (data && data.length > 0) return window.AppState.availableWeeks;
      return window.AppState.availableWeeks;
    } catch(_) {
      return window.AppState.availableWeeks;
    }
  }

  async function getCurrentWeek() {
    await getAvailableWeeks();
    return window.AppState.availableWeeks[0];
  }

  return { generateAvailableWeeks, getAvailableWeeks, getCurrentWeek, generateDaysForWeek };
})();


