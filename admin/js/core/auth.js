/* Forn Verge - Sistema de Autenticación - MASSA SON OLIVA */

// ===== SISTEMA DE AUTENTICACIÓN =====

function checkAuthentication() {
    const savedAuth = localStorage.getItem('fornverge_admin_auth');
    const sessionAuth = sessionStorage.getItem('fornverge_admin_session');
    
    if (savedAuth === 'authenticated' || sessionAuth === 'authenticated') {
        isAuthenticated = true;
        showMainInterface();
        console.log('✅ Usuario autenticado desde storage');
    } else {
        isAuthenticated = false;
        showLoginInterface();
        console.log('🔐 Mostrando pantalla de login');
    }
}

function showMainInterface() {
    document.body.classList.add('authenticated');
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('mainHeader').style.display = 'block';
    document.getElementById('mainContent').style.display = 'block';
}

function showLoginInterface() {
    document.body.classList.remove('authenticated');
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    
    // Focus en el input de contraseña
    setTimeout(() => {
        document.getElementById('passwordInput').focus();
    }, 100);
}

function setupLoginListeners() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    
    loginForm.addEventListener('submit', handleLogin);
    
    // Enter en el input de contraseña
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin(e);
        }
    });
    
    // Limpiar error al escribir
    passwordInput.addEventListener('input', () => {
        loginError.classList.add('hidden');
        passwordInput.classList.remove('border-red-500');
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    const rememberMe = document.getElementById('rememberMe');
    
    const password = passwordInput.value;
    
    // Mostrar loading
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
    loginButton.disabled = true;
    
    // Simular pequeño delay para UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const passwordHash = await sha256(password);
    
    // DEBUG: Mostrar hashes en consola para verificar
    console.log('HASH esperado:', ADMIN_PASSWORD_HASH);
    console.log('HASH introducido:', passwordHash);
    
    if (passwordHash === ADMIN_PASSWORD_HASH) {
        // Login exitoso
        isAuthenticated = true;
        
        // Guardar sesión
        if (rememberMe.checked) {
            localStorage.setItem('fornverge_admin_auth', 'authenticated');
        } else {
            sessionStorage.setItem('fornverge_admin_session', 'authenticated');
        }
        
        console.log('✅ Login exitoso');
        
        // Mostrar interfaz principal
        showMainInterface();
        
        // Inicializar la aplicación
        setTimeout(async () => {
            updateStatus('Cargando...');
            showLoading();
            
            setupWeekSelector();
            updateWeekDisplay();
            
            await loadEmployees();
            await loadCurrentSchedules();
            
            renderEmployees();
            setupEventListeners();
            
            hideLoading();
            updateStatus('Listo ✨');
        }, 300);
        
    } else {
        // Login fallido
        loginError.classList.remove('hidden');
        passwordInput.classList.add('border-red-500');
        passwordInput.value = '';
        passwordInput.focus();
        
        // Shake animation
        passwordInput.style.animation = 'shake 0.5s';
        setTimeout(() => {
            passwordInput.style.animation = '';
        }, 500);
        
        console.log('❌ Login fallido');
    }
    
    // Restaurar botón
    loginButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Acceder';
    loginButton.disabled = false;
}

function logout() {
    // Confirmar logout
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        // Limpiar autenticación
        localStorage.removeItem('fornverge_admin_auth');
        sessionStorage.removeItem('fornverge_admin_session');
        
        isAuthenticated = false;
        
        // Mostrar login
        showLoginInterface();
        
        // Limpiar datos sensibles
        employees = [];
        scheduleData = {};
        
        console.log('🚪 Sesión cerrada');
    }
}

// Añadir animación shake al CSS dinámicamente
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
}
`;

const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);
