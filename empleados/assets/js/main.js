(function(){
  const supabase = () => window.supabaseClient;

  function showLoginError() {
    document.getElementById('loginError').classList.remove('hidden');
    setTimeout(() => { document.getElementById('loginError').classList.add('hidden'); }, 3000);
  }

  function showDashboard() {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('employeeDashboard');
    loginScreen.style.opacity = '0';
    loginScreen.style.transform = 'scale(0.95)';
    setTimeout(() => {
      loginScreen.classList.add('hidden');
      dashboard.classList.remove('hidden');
      const employeeName = window.AppState.currentEmployee.name.charAt(0).toUpperCase() + window.AppState.currentEmployee.name.slice(1).toLowerCase();
      document.getElementById('employeeName').innerHTML = `<i class="fas fa-user-circle mr-2"></i>Hola ${employeeName} 👋`;
      window.UI.startAutoRefresh();
      window.UI.updateLastRefreshTime();
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 300);
  }

  function bindLogin() {
    const togglePwdBtn = document.getElementById('togglePwdBtn');
    const accessInput = document.getElementById('accessCode');
    if (togglePwdBtn && accessInput) {
      togglePwdBtn.addEventListener('click', () => {
        const showing = accessInput.type === 'text';
        accessInput.type = showing ? 'password' : 'text';
        togglePwdBtn.innerHTML = showing ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
      });
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const accessCode = document.getElementById('accessCode').value;
      if (!accessCode) return;
      try {
        const { data, error } = await supabase()
          .from('employees')
          .select('*')
          .eq('access_code', btoa(accessCode))
          .single();
        if (error || !data) { showLoginError(); return; }
        window.AppState.currentEmployee = data;
        localStorage.setItem('fornverge_access_code', accessCode);
        localStorage.setItem('fornverge_employee_data', JSON.stringify(data));
        await window.ScheduleService.loadEmployeeSchedule();
        showDashboard();
      } catch (err) {
        console.error('Error de autenticación:', err);
        showLoginError();
      }
    });
  }

  async function tryAutoLogin() {
    const savedCode = localStorage.getItem('fornverge_access_code');
    const savedEmployee = localStorage.getItem('fornverge_employee_data');
    if (savedCode && savedEmployee) {
      try {
        window.AppState.currentEmployee = JSON.parse(savedEmployee);
        const { data, error } = await supabase()
          .from('employees')
          .select('*')
          .eq('access_code', btoa(savedCode))
          .single();
        if (data && !error) {
          window.AppState.currentEmployee = data;
          await window.ScheduleService.loadEmployeeSchedule();
          showDashboard();
        } else {
          localStorage.removeItem('fornverge_access_code');
          localStorage.removeItem('fornverge_employee_data');
        }
      } catch (error) {
        console.error('Error en auto-login:', error);
        localStorage.removeItem('fornverge_access_code');
        localStorage.removeItem('fornverge_employee_data');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Panel de empleados cargado (modular)');
    const actualWeek = window.DateUtils.getCurrentWeekStart();
    console.log(`🗓️ Sistema configurado para mostrar:`);
    console.log(`   📌 Semana actual: ${actualWeek}`);
    console.log(`   ⏭️  + Las siguientes 3 semanas`);
    console.log(`   🚫 Sin navegación hacia atrás desde la semana actual`);
    bindLogin();
    await tryAutoLogin();
  });
})();


