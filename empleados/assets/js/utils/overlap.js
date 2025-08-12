window.OverlapUtils = (function() {
  function schedulesOverlap(schedule1, schedule2) {
    if (!schedule1.start_time || !schedule1.end_time || !schedule2.start_time || !schedule2.end_time) {
      return false;
    }
    const start1 = schedule1.start_time;
    const end1 = schedule1.end_time;
    const start2 = schedule2.start_time;
    const end2 = schedule2.end_time;
    return start1 < end2 && start2 < end1;
  }
  return { schedulesOverlap };
})();


