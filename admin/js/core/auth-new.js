/**
 * NUEVO SISTEMA DE AUTENTICACIÓN - Wrapper del sistema multi-usuario
 * ====================================================================
 * Reemplaza el sistema de contraseña estática por login con usuario
 * Mantiene compatibilidad con el código existente
 */

// Inicializar sistemas de auth
async function checkAuthentication() {
    // Crear instancias de los sistemas
    window.authSystem = new window.AuthMultiUser(window.supabase);
    window.permissionsManager = new window.PermissionsManager(window.authSystem);
    
    // Verificar sesión guardada
    const authResult = await window.authSystem.init();
    
    if (authResult.authenticated) {
        // Usuario ya autenticado
        isAuthenticated = true;
        setCurrentUser(authResult.user);
        
        // Inicializar selector de locales
        await initializeLocationSelector();
        
    } else {
        // Mostrar login
        isAuthenticated = false;
        showLoginInterface();
    }
}

async function initializeLocationSelector() {
    window.locationSelector = new window.LocationSelector(window.authSystem, window.supabase);
    
    const result = await window.locationSelector.init();
    
    if (!result.success) {
        alert('Error: No tienes acceso a ningún local');
        logout();
        return;
    }
    
    // SOLO mostrar selector si tiene múltiples locales (owner)
    if (result.needsSelection && result.locations && result.locations.length > 1) {
        // Owner con múltiples locales - mostrar modal de selección
        showLocationSelectorModal(result.locations);
    } else {
        // Manager con 1 local o local ya restaurado - cargar directo
        setCurrentLocation(result.location);
        showMainInterface();
    }
}

function showLocationSelectorModal(locations) {
    // Ocultar login
    document.getElementById('loginModal').style.display = 'none';
    
    // Mostrar selector
    const modal = window.locationSelector.renderLocationSelector();
    document.body.appendChild(modal);
    
    // Escuchar evento de selección
    window.addEventListener('locationSelected', async (e) => {
        setCurrentLocation(e.detail);
        showMainInterface();
    }, { once: true });
}

function showMainInterface() {
    document.body.classList.add('authenticated');
    document.getElementById('loginModal').style.display = 'none';
    
    const mainHeader = document.getElementById('mainHeader');
    const mainContent = document.getElementById('mainContent');
    
    if (mainHeader) mainHeader.style.display = 'block';
    if (mainContent) mainContent.style.display = 'block';
    
    // Aplicar permisos a la UI
    if (window.permissionsManager) {
        setTimeout(() => {
            window.permissionsManager.applyPermissionsToUI();
        }, 500);
    }
    
    // Actualizar título con local seleccionado
    updateHeaderWithLocation();
    
    // Inicializar la aplicación
    initializeApp();
}

function showLoginInterface() {
    document.body.classList.remove('authenticated');
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    
    // Focus en el input de usuario
    setTimeout(() => {
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) usernameInput.focus();
    }, 100);
}

function setupLoginListeners() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    
    if (!loginForm) {
        console.error('❌ Formulario de login no encontrado');
        return;
    }
    
    loginForm.addEventListener('submit', handleLogin);
    
    // Limpiar error al escribir
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            if (loginError) loginError.classList.add('hidden');
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (loginError) loginError.classList.add('hidden');
        });
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        if (loginError) {
            loginError.textContent = 'Por favor completa todos los campos';
            loginError.classList.remove('hidden');
        }
        return;
    }
    
    // Mostrar loading
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
    loginButton.disabled = true;
    
    // Intentar login
    const result = await window.authSystem.login(username, password);
    
    if (result.success) {
        console.log('✅ Login exitoso');
        isAuthenticated = true;
        setCurrentUser(result.user);
        
        // Inicializar selector de locales
        await initializeLocationSelector();
        
    } else {
        console.log('❌ Login fallido');
        if (loginError) {
            loginError.textContent = result.error || 'Usuario o contraseña incorrectos';
            loginError.classList.remove('hidden');
        }
        
        passwordInput.value = '';
        passwordInput.focus();
        
        // Shake animation
        loginForm.style.animation = 'shake 0.5s';
        setTimeout(() => {
            loginForm.style.animation = '';
        }, 500);
    }
    
    // Restaurar botón
    loginButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Acceder';
    loginButton.disabled = false;
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.authSystem.logout();
        
        isAuthenticated = false;
        setCurrentUser(null);
        setCurrentLocation(null);
        
        // Limpiar datos
        employees = [];
        scheduleData = {};
        
        showLoginInterface();
        
        console.log('🚪 Sesión cerrada');
    }
}

async function initializeApp() {
    try {
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
        
    } catch (error) {
        console.error('❌ Error inicializando app:', error);
        updateStatus('Error al cargar');
    }
}

function updateHeaderWithLocation() {
    const location = getCurrentLocation();
    if (!location) return;
    
    // Actualizar título del header
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.innerHTML = `Gestión Horarios <span class="text-sm font-normal ml-2">- ${location.location_name}</span>`;
    }
    
    // Si puede cambiar de local (owner), añadir selector
    if (window.locationSelector && window.locationSelector.canChangeLocation()) {
        addLocationSelectorToHeader();
    }
}

function addLocationSelectorToHeader() {
    const header = document.getElementById('mainHeader');
    if (!header) return;
    
    const container = header.querySelector('.max-w-7xl');
    if (!container) return;
    
    // Verificar si ya existe
    if (document.getElementById('headerLocationSelector')) return;
    
    const selector = document.createElement('div');
    selector.id = 'headerLocationSelector';
    selector.className = 'flex items-center gap-2';
    
    const locations = window.locationSelector.getAvailableLocations();
    const currentLoc = getCurrentLocation();
    
    selector.innerHTML = `
        <span class="text-blue-200 text-sm font-medium">Local:</span>
        <select 
            onchange="window.locationSelector.changeLocation(this.value)"
            class="bg-white text-gray-900 font-semibold border-2 border-blue-300 rounded-lg px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-all shadow-md"
            style="min-width: 180px;"
        >
            ${locations.map(loc => `
                <option value="${loc.location_id}" ${loc.location_id === currentLoc.location_id ? 'selected' : ''}>
                    📍 ${loc.location_name}
                </option>
            `).join('')}
        </select>
    `;
    
    container.appendChild(selector);
}

// Añadir animación shake
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

