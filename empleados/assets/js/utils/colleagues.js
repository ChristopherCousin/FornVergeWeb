window.ColleaguesUtils = (function() {
  const EMPLOYEES = window.APP_CONFIG.EMPLOYEE_NAMES;
  const { schedulesOverlap } = window.OverlapUtils;

  function normalizeName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  function findColleaguesForDay(dayKey) {
    const { currentEmployee, currentSchedule, allEmployeesSchedules } = window.AppState;
    const colleagues = [];
    const currentEmpName = normalizeName(currentEmployee.name);
    const myDayData = currentSchedule[dayKey];
    if (myDayData.is_free_day) return [];

    for (const empName of EMPLOYEES) {
      if (empName === currentEmpName) continue;
      const empDayData = allEmployeesSchedules[empName] && allEmployeesSchedules[empName][dayKey];
      if (!empDayData || empDayData.is_free_day || empDayData.shifts.length === 0) continue;
      let hasOverlap = false;
      for (const myShift of myDayData.shifts) {
        for (const empShift of empDayData.shifts) {
          if (schedulesOverlap(myShift, empShift)) { hasOverlap = true; break; }
        }
        if (hasOverlap) break;
      }
      if (hasOverlap) colleagues.push(empName);
    }
    return colleagues;
  }

  function findColleaguesForShift(dayKey, myShift) {
    const { currentEmployee, allEmployeesSchedules } = window.AppState;
    const colleagues = [];
    const currentEmpName = normalizeName(currentEmployee.name);
    for (const empName of EMPLOYEES) {
      if (empName === currentEmpName) continue;
      const empDayData = allEmployeesSchedules[empName] && allEmployeesSchedules[empName][dayKey];
      if (!empDayData || empDayData.is_free_day || empDayData.shifts.length === 0) continue;
      for (const empShift of empDayData.shifts) {
        if (schedulesOverlap(myShift, empShift)) { colleagues.push(empName); break; }
      }
    }
    return colleagues;
  }

  return { findColleaguesForDay, findColleaguesForShift };
})();


