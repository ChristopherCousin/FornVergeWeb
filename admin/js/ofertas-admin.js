// ==========================================
// ADMIN OFERTAS - FORN VERGE DE LLUC
// Sistema completo con autenticación y CRUD
// ==========================================

console.log('🚀 Iniciando Panel Admin de Ofertas...');

// Configuración de autenticación
const ADMIN_PASSWORD = 'fornverge2025'; // Misma contraseña que el admin principal
let isAuthenticated = false;
let supabaseClient = null;

// Variables globales
let offers = [];
let currentEditingOffer = null;
let statsData = {
    total: 0,
    active: 0,
    today: 0,
    featured: 0
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado - verificando autenticación...');
    initApp();
});

async function initApp() {
    try {
        // 1. Verificar autenticación
        checkAuthentication();
        
        if (!isAuthenticated) {
            console.log('🔒 Usuario no autenticado - mostrando login');
            setupLoginListeners();
            return;
        }
        
        // 2. Inicializar Supabase
        const supabaseOK = initSupabase();
        if (!supabaseOK) {
            console.error('❌ Error: Supabase no configurado');
            alert('Error de configuración. Contacta al administrador.');
            return;
        }
        
        // 3. Cargar datos
        console.log('📊 Cargando ofertas y estadísticas...');
        await loadOffers();
        await loadStats();
        
        // 4. Configurar interfaz
        setupEventListeners();
        renderOffers();
        updateStatsDisplay();
        
        console.log('✅ Panel admin listo!');
        
    } catch (error) {
        console.error('❌ Error inicializando admin:', error);
        alert('Error inicializando el panel. Revisa la consola.');
    }
}

// ==========================================
// AUTENTICACIÓN
// ==========================================

function checkAuthentication() {
    const saved = localStorage.getItem('forn_admin_auth');
    if (saved === 'authenticated') {
        isAuthenticated = true;
        showMainInterface();
        console.log('✅ Usuario autenticado desde localStorage');
    } else {
        isAuthenticated = false;
        showLoginInterface();
        console.log('🔒 Usuario no autenticado');
    }
}

function showMainInterface() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('mainHeader').style.display = 'block';
    document.getElementById('mainContent').style.display = 'block';
}

function showLoginInterface() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

function setupLoginListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('passwordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin(e);
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    const loginButton = document.getElementById('loginButton');
    
    console.log('🔐 Intentando login...');
    
    // Mostrar loading
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
    loginButton.disabled = true;
    
    // Simular verificación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (password === ADMIN_PASSWORD) {
        console.log('✅ Login exitoso!');
        isAuthenticated = true;
        localStorage.setItem('forn_admin_auth', 'authenticated');
        
        showMainInterface();
        initApp(); // Reiniciar con autenticación
        
    } else {
        console.log('❌ Contraseña incorrecta');
        errorDiv.classList.remove('hidden');
        
        // Resetear formulario
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Acceder al Panel de Ofertas';
        loginButton.disabled = false;
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    }
}

function logout() {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('forn_admin_auth');
    isAuthenticated = false;
    showLoginInterface();
}

// ==========================================
// INICIALIZAR SUPABASE
// ==========================================

function initSupabase() {
    try {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.URL) {
            supabaseClient = window.SUPABASE_CONFIG.client;
            console.log('✅ Supabase conectado correctamente');
            console.log('🔗 URL:', window.SUPABASE_CONFIG.URL);
            return true;
        } else {
            console.error('❌ SUPABASE_CONFIG no encontrado');
            console.error('❌ Disponible:', window.SUPABASE_CONFIG);
            return false;
        }
    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        return false;
    }
}

// ==========================================
// CARGAR DATOS
// ==========================================

async function loadOffers() {
    try {
        console.log('📥 Cargando ofertas desde Supabase...');
        
        const { data, error } = await supabaseClient
            .from('offers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error cargando ofertas:', error);
            throw error;
        }
        
        offers = data || [];
        console.log(`✅ ${offers.length} ofertas cargadas`);
        
        // Log de muestra de datos
        if (offers.length > 0) {
            console.log('📋 Muestra de oferta:', offers[0]);
        }
        
    } catch (error) {
        console.error('❌ Error en loadOffers:', error);
        offers = [];
    }
}

async function loadStats() {
    try {
        console.log('📊 Calculando estadísticas...');
        
        const today = new Date().toISOString().split('T')[0];
        
        statsData = {
            total: offers.length,
            active: offers.filter(o => o.is_active).length,
            today: offers.filter(o => 
                o.is_active && 
                o.start_date <= today && 
                o.end_date >= today
            ).length,
            featured: offers.filter(o => 
                o.is_active && 
                o.priority >= 3 && 
                o.start_date <= today && 
                o.end_date >= today
            ).length
        };
        
        console.log('📈 Estadísticas:', statsData);
        
    } catch (error) {
        console.error('❌ Error calculando estadísticas:', error);
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    console.log('🎯 Configurando event listeners...');
    
    // Formulario
    document.getElementById('offerForm').addEventListener('submit', handleOfferSubmit);
    document.getElementById('cancelEdit').addEventListener('click', cancelEdit);
    
    // Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
    
    // QR Modal
    document.getElementById('showQRBtn').addEventListener('click', showQRModal);
    document.getElementById('closeQRModal').addEventListener('click', closeQRModal);
    document.getElementById('downloadQR').addEventListener('click', downloadQR);
    document.getElementById('printQR').addEventListener('click', printQR);
    
    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Auto-save de fechas por defecto
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = nextWeek;
    
    console.log('✅ Event listeners configurados');
}

// ==========================================
// CRUD DE OFERTAS
// ==========================================

async function handleOfferSubmit(e) {
    e.preventDefault();
    
    console.log('💾 Intentando guardar oferta...');
    
    const formData = getFormData();
    console.log('📝 Datos del formulario:', formData);
    
    // Validación
    if (!validateFormData(formData)) {
        console.log('❌ Validación fallida');
        return;
    }
    
    const submitBtn = document.getElementById('submitText').parentElement;
    const originalText = document.getElementById('submitText').textContent;
    
    // Mostrar loading
    document.getElementById('submitText').textContent = 'Guardando...';
    submitBtn.disabled = true;
    
    try {
        let result;
        
        if (currentEditingOffer) {
            console.log('✏️ Editando oferta existente:', currentEditingOffer);
            result = await updateOffer(currentEditingOffer, formData);
        } else {
            console.log('➕ Creando nueva oferta');
            result = await createOffer(formData);
        }
        
        if (result.success) {
            console.log('✅ Oferta guardada correctamente');
            
            // Recargar datos
            await loadOffers();
            await loadStats();
            renderOffers();
            updateStatsDisplay();
            
            // Resetear formulario
            resetForm();
            
            // Mostrar éxito
            showNotification('Oferta guardada correctamente', 'success');
            
        } else {
            console.error('❌ Error guardando:', result.error);
            showNotification('Error guardando la oferta', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error en handleOfferSubmit:', error);
        showNotification('Error inesperado', 'error');
    }
    
    // Restaurar botón
    document.getElementById('submitText').textContent = originalText;
    submitBtn.disabled = false;
}

async function createOffer(data) {
    try {
        console.log('🔄 Insertando en Supabase...');
        
        const { data: result, error } = await supabaseClient
            .from('offers')
            .insert([data])
            .select();
        
        if (error) {
            console.error('❌ Error de Supabase:', error);
            return { success: false, error };
        }
        
        console.log('✅ Oferta creada:', result[0]);
        return { success: true, data: result[0] };
        
    } catch (error) {
        console.error('❌ Error en createOffer:', error);
        return { success: false, error };
    }
}

async function updateOffer(offerId, data) {
    try {
        console.log('🔄 Actualizando en Supabase...', offerId);
        
        const { data: result, error } = await supabaseClient
            .from('offers')
            .update(data)
            .eq('id', offerId)
            .select();
        
        if (error) {
            console.error('❌ Error de Supabase:', error);
            return { success: false, error };
        }
        
        console.log('✅ Oferta actualizada:', result[0]);
        return { success: true, data: result[0] };
        
    } catch (error) {
        console.error('❌ Error en updateOffer:', error);
        return { success: false, error };
    }
}

async function deleteOffer(offerId) {
    if (!confirm('¿Estás seguro de eliminar esta oferta?')) {
        return;
    }
    
    try {
        console.log('🗑️ Eliminando oferta:', offerId);
        
        const { error } = await supabaseClient
            .from('offers')
            .delete()
            .eq('id', offerId);
        
        if (error) {
            console.error('❌ Error eliminando:', error);
            showNotification('Error eliminando la oferta', 'error');
            return;
        }
        
        console.log('✅ Oferta eliminada');
        showNotification('Oferta eliminada correctamente', 'success');
        
        // Recargar datos
        await loadOffers();
        await loadStats();
        renderOffers();
        updateStatsDisplay();
        
    } catch (error) {
        console.error('❌ Error en deleteOffer:', error);
        showNotification('Error inesperado', 'error');
    }
}

// ==========================================
// UTILIDADES DEL FORMULARIO
// ==========================================

function getFormData() {
    return {
        title: document.getElementById('offerTitle').value.trim(),
        description: document.getElementById('offerDescription').value.trim(),
        category: document.getElementById('offerCategory').value,
        original_price: parseFloat(document.getElementById('originalPrice').value) || null,
        offer_price: parseFloat(document.getElementById('offerPrice').value) || null,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        priority: parseInt(document.getElementById('offerPriority').value),
        terms: document.getElementById('offerTerms').value.trim(),
        is_active: document.getElementById('isActive').checked,
        created_by: 'admin'
    };
}

function validateFormData(data) {
    if (!data.title) {
        alert('El título es obligatorio');
        return false;
    }
    
    if (!data.description) {
        alert('La descripción es obligatoria');
        return false;
    }
    
    if (!data.category) {
        alert('La categoría es obligatoria');
        return false;
    }
    
    if (!data.start_date || !data.end_date) {
        alert('Las fechas son obligatorias');
        return false;
    }
    
    if (new Date(data.start_date) > new Date(data.end_date)) {
        alert('La fecha de inicio no puede ser posterior a la fecha fin');
        return false;
    }
    
    return true;
}

function resetForm() {
    document.getElementById('offerForm').reset();
    document.getElementById('editingOfferId').value = '';
    document.getElementById('formTitle').textContent = 'Nueva Oferta';
    document.getElementById('submitText').textContent = 'Guardar Oferta';
    document.getElementById('cancelEdit').style.display = 'none';
    currentEditingOffer = null;
    
    // Restaurar fechas por defecto
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = nextWeek;
    document.getElementById('isActive').checked = true;
}

function editOffer(offer) {
    console.log('✏️ Editando oferta:', offer);
    
    currentEditingOffer = offer.id;
    
    // Llenar formulario
    document.getElementById('offerTitle').value = offer.title;
    document.getElementById('offerDescription').value = offer.description;
    document.getElementById('offerCategory').value = offer.category;
    document.getElementById('originalPrice').value = offer.original_price || '';
    document.getElementById('offerPrice').value = offer.offer_price || '';
    document.getElementById('startDate').value = offer.start_date;
    document.getElementById('endDate').value = offer.end_date;
    document.getElementById('offerPriority').value = offer.priority;
    document.getElementById('offerTerms').value = offer.terms || '';
    document.getElementById('isActive').checked = offer.is_active;
    
    // Cambiar UI
    document.getElementById('formTitle').textContent = 'Editar Oferta';
    document.getElementById('submitText').textContent = 'Actualizar Oferta';
    document.getElementById('cancelEdit').style.display = 'inline-block';
}

function cancelEdit() {
    console.log('❌ Cancelando edición');
    resetForm();
}

// ==========================================
// RENDERIZAR OFERTAS
// ==========================================

function renderOffers() {
    console.log('🎨 Renderizando ofertas...');
    
    const container = document.getElementById('offersList');
    const loading = document.getElementById('offersLoading');
    const empty = document.getElementById('emptyOffers');
    
    loading.style.display = 'none';
    
    if (offers.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    empty.style.display = 'none';
    container.style.display = 'block';
    container.innerHTML = '';
    
    offers.forEach(offer => {
        const offerElement = createOfferElement(offer);
        container.appendChild(offerElement);
    });
    
    console.log(`✅ ${offers.length} ofertas renderizadas`);
}

function createOfferElement(offer) {
    const div = document.createElement('div');
    div.className = `offer-preview ${!offer.is_active ? 'inactive' : ''}`;
    
    const today = new Date().toISOString().split('T')[0];
    const isValidToday = offer.start_date <= today && offer.end_date >= today;
    const daysLeft = Math.ceil((new Date(offer.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    div.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-3">
                <div class="category-icon">
                    <i class="${getCategoryIcon(offer.category)}"></i>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">${offer.title}</h3>
                    <p class="text-sm text-gray-600">${offer.description}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="priority-badge priority-${offer.priority}">
                    ${getPriorityText(offer.priority)}
                </span>
                ${!offer.is_active ? '<span class="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">Inactiva</span>' : ''}
            </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
                <span class="text-sm text-gray-500">Precio:</span>
                <div class="font-semibold">
                    ${offer.original_price ? `<span class="line-through text-gray-400">${offer.original_price}€</span> ` : ''}
                    ${offer.offer_price ? `<span class="text-green-600">${offer.offer_price}€</span>` : '<span class="text-blue-600">Precio especial</span>'}
                </div>
            </div>
            <div>
                <span class="text-sm text-gray-500">Vigencia:</span>
                <div class="font-semibold ${isValidToday ? 'text-green-600' : 'text-gray-400'}">
                    ${isValidToday ? `${daysLeft} días restantes` : 'No válida hoy'}
                </div>
            </div>
        </div>
        
        <div class="flex justify-between items-center">
            <div class="text-sm text-gray-500">
                <i class="fas fa-calendar mr-1"></i>
                ${formatDate(offer.start_date)} - ${formatDate(offer.end_date)}
            </div>
            <div class="flex gap-2">
                <button onclick="editOffer(${JSON.stringify(offer).replace(/"/g, '&quot;')})" 
                        class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition">
                    <i class="fas fa-edit mr-1"></i>Editar
                </button>
                <button onclick="deleteOffer('${offer.id}')" 
                        class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition">
                    <i class="fas fa-trash mr-1"></i>Eliminar
                </button>
            </div>
        </div>
    `;
    
    return div;
}

function getCategoryIcon(category) {
    const icons = {
        'panaderia': 'fas fa-bread-slice',
        'pasteleria': 'fas fa-cookie-bite',
        'bar': 'fas fa-wine-glass-alt',
        'cafe': 'fas fa-mug-hot',
        'desayuno': 'fas fa-sun',
        'merienda': 'fas fa-clock',
        'especial': 'fas fa-star',
        'combo': 'fas fa-layer-group',
        'descuento': 'fas fa-percentage',
        'regalo': 'fas fa-gift'
    };
    return icons[category] || 'fas fa-tag';
}

function getPriorityText(priority) {
    const texts = {
        1: 'Normal',
        2: 'Media',
        3: 'Alta'
    };
    return texts[priority] || 'Normal';
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-ES');
}

// ==========================================
// ESTADÍSTICAS
// ==========================================

function updateStatsDisplay() {
    console.log('📊 Actualizando estadísticas en UI...');
    
    document.getElementById('totalOffers').textContent = statsData.total;
    document.getElementById('activeOffers').textContent = statsData.active;
    document.getElementById('todayOffers').textContent = statsData.today;
    document.getElementById('featuredOffers').textContent = statsData.featured;
}

// ==========================================
// FILTROS
// ==========================================

function handleFilterClick(e) {
    const filter = e.target.dataset.filter;
    console.log('🔍 Aplicando filtro:', filter);
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Aplicar filtro
    applyFilter(filter);
}

function applyFilter(filter) {
    let filteredOffers = [...offers];
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
        case 'active':
            filteredOffers = offers.filter(o => o.is_active);
            break;
        case 'today':
            filteredOffers = offers.filter(o => 
                o.is_active && 
                o.start_date <= today && 
                o.end_date >= today
            );
            break;
        case 'featured':
            filteredOffers = offers.filter(o => 
                o.is_active && 
                o.priority >= 3 &&
                o.start_date <= today && 
                o.end_date >= today
            );
            break;
        default: // 'all'
            // Ya está filteredOffers = [...offers]
    }
    
    console.log(`📋 Mostrando ${filteredOffers.length} ofertas`);
    
    // Temporalmente reemplazar offers para renderizar
    const originalOffers = offers;
    offers = filteredOffers;
    renderOffers();
    offers = originalOffers;
}

// ==========================================
// QR CODE
// ==========================================

function showQRModal() {
    console.log('📱 Mostrando modal QR...');
    
    const modal = document.getElementById('qrModal');
    const container = document.getElementById('qrCodeContainer');
    
    // Generar QR
    const ofertasURL = window.location.origin + window.location.pathname.replace('admin/ofertas-admin.html', '') + 'ofertas/';
    console.log('🔗 URL para QR:', ofertasURL);
    
    const qrImageURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ofertasURL)}&bgcolor=FFFFFF&color=2C2C2C&margin=10&format=png&ecc=M`;
    
    container.innerHTML = `
        <img src="${qrImageURL}" alt="QR Code Ofertas" style="width: 200px; height: 200px; border-radius: 8px; border: 2px solid #D4A574;">
    `;
    
    modal.style.display = 'flex';
}

function closeQRModal() {
    document.getElementById('qrModal').style.display = 'none';
}

function downloadQR() {
    console.log('💾 Descargando QR...');
    
    const img = document.querySelector('#qrCodeContainer img');
    if (img) {
        const link = document.createElement('a');
        link.download = 'ofertas-forn-verge-qr.png';
        link.href = img.src;
        link.click();
    }
}

function printQR() {
    console.log('🖨️ Imprimiendo QR...');
    
    const img = document.querySelector('#qrCodeContainer img');
    if (img) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head><title>QR Code - Ofertas Forn Verge</title></head>
                <body style="text-align: center; padding: 20px;">
                    <h2>Ofertas Especiales - Forn Verge de Lluc</h2>
                    <img src="${img.src}" style="width: 300px; height: 300px;">
                    <p>Escanea para ver nuestras ofertas actuales</p>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// ==========================================
// NOTIFICACIONES
// ==========================================

function showNotification(message, type = 'info') {
    console.log(`📢 Notificación (${type}):`, message);
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'} mr-2"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==========================================
// ESTILOS DINÁMICOS PARA FILTROS
// ==========================================

// Agregar estilos para los botones de filtro
const style = document.createElement('style');
style.textContent = `
    .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #D1D5DB;
        background: white;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .filter-btn:hover {
        background: #F3F4F6;
    }
    
    .filter-btn.active {
        background: #D4A574;
        color: white;
        border-color: #D4A574;
    }
`;
document.head.appendChild(style);

console.log('🎯 JavaScript admin ofertas cargado completamente'); 