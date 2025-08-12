window.DateUtils = (function() {
  function getCurrentWeekStart() {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function generateDaysForWeek(weekStart) {
    const startDate = new Date(weekStart);
    const days = [];
    const dayNames = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const dayLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayEmojis = ['📅', '📅', '📅', '📅', '🎉', '🎊', '🌅'];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push({
        key: dayNames[i],
        name: dayLabels[i],
        emoji: dayEmojis[i],
        date: `${currentDate.getDate()} ${currentDate.toLocaleDateString('es-ES', { month: 'short' })}`
      });
    }
    return days;
  }

  return { getCurrentWeekStart, generateDaysForWeek };
})();


