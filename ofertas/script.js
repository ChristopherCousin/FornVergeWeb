// ==========================================
// OFERTAS DINÁMICAS - FORN VERGE DE LLUC
// Sistema de ofertas en tiempo real
// ==========================================

console.log('🍞 Sistema de ofertas iniciado - conectando con Supabase...');

// Cliente Supabase (usar el global configurado)
let supabaseClient = null;

// Inicializar cliente Supabase
function initSupabase() {
    try {
        // Verificar si la configuración está disponible
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.URL) {
            // Usar el cliente ya configurado
            supabaseClient = window.SUPABASE_CONFIG.client;
            console.log('✅ Supabase conectado - Sistema de ofertas listo');
            console.log('🔗 URL:', window.SUPABASE_CONFIG.URL);
            return true;
        } else {
            console.error('❌ SUPABASE_CONFIG no encontrado - Verificar supabase-config.js');
            console.error('🔍 Disponible en window:', Object.keys(window).filter(key => key.includes('SUPABASE')));
            return false;
        }
    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        return false;
    }
}

// ==========================================
// CLASE PRINCIPAL OFERTAS
// ==========================================

class OfertasManager {
    constructor() {
        this.offersContainer = document.getElementById('offers-container');
        this.loadingElement = document.getElementById('loading');
        this.emptyState = document.getElementById('empty-state');
        this.offers = [];
        
        this.init();
    }
    
    async init() {
        try {
            // Inicializar AOS
            AOS.init({
                duration: 600,
                easing: 'ease-in-out',
                once: true
            });
            
            // Inicializar Supabase
            const supabaseConnected = initSupabase();
            if (!supabaseConnected) {
                console.warn('⚠️ Supabase no configurado - mostrar mensaje de configuración');
                showConfigurationMessage();
                return;
            }
            
            // Cargar ofertas desde la base de datos
            await this.loadOffers();
            
            // Configurar refresco automático cada 30 segundos
            setInterval(() => this.loadOffers(), 30000);
            
        } catch (error) {
            console.error('❌ Error inicializando sistema de ofertas:', error);
            this.showEmptyState();
        }
    }
    
    // ==========================================
    // CARGAR OFERTAS DESDE SUPABASE
    // ==========================================
    
    async loadOffers() {
        try {
            if (!supabaseClient) {
                console.error('Supabase no inicializado');
                this.showEmptyState();
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabaseClient
                .from('offers')
                .select('*')
                .lte('start_date', today)
                .gte('end_date', today)
                .eq('is_active', true)
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error cargando ofertas desde Supabase:', error);
                this.showEmptyState();
                return;
            }
            
            this.offers = data || [];
            console.log(`Ofertas cargadas: ${this.offers.length}`);
            this.renderOffers();
            
        } catch (error) {
            console.error('Error en loadOffers:', error);
            this.showEmptyState();
        }
    }
    
    // ==========================================
    // RENDERIZAR OFERTAS
    // ==========================================
    
    renderOffers() {
        this.hideLoading();
        
        if (this.offers.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.offersContainer.innerHTML = '';
        this.offersContainer.style.display = 'block';
        this.emptyState.style.display = 'none';
        
        this.offers.forEach((offer, index) => {
            const offerCard = this.createOfferCard(offer, index);
            this.offersContainer.appendChild(offerCard);
        });
    }
    
    // ==========================================
    // CREAR CARD DE OFERTA
    // ==========================================
    
    createOfferCard(offer, index) {
        const card = document.createElement('div');
        card.className = 'offer-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index * 100).toString());
        
        // Marcar como destacada si tiene prioridad alta
        if (offer.priority >= 3) {
            card.classList.add('featured');
        }
        
        // Calcular días restantes
        const endDate = new Date(offer.end_date);
        const today = new Date();
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        card.innerHTML = `
            ${offer.priority >= 3 ? '<div class="offer-badge">🔥 Destacada</div>' : ''}
            
            <div class="offer-icon">
                <i class="${this.getOfferIcon(offer.category)}" style="color: var(--primary-gold); font-size: 1.5rem;"></i>
            </div>
            
            <h3 class="offer-title playfair">${offer.title}</h3>
            <p class="offer-description">${offer.description}</p>
            
            ${offer.original_price ? `
                <div class="offer-price">
                    <span class="original-price">${offer.original_price}€</span>
                    <span class="offer-price-value">${offer.offer_price}€</span>
                    <span class="offer-savings">Ahorra ${(offer.original_price - offer.offer_price).toFixed(2)}€</span>
                </div>
            ` : `
                <div class="offer-price">
                    <span class="offer-price-value">${offer.offer_price ? offer.offer_price + '€' : 'Precio especial'}</span>
                </div>
            `}
            
            <div class="offer-validity">
                <i class="fas fa-clock" style="color: var(--primary-gold);"></i>
                <span>Válida ${daysLeft === 1 ? 'hasta mañana' : `${daysLeft} días más`}</span>
            </div>
            
            ${offer.terms ? `
                <div class="offer-terms">
                    <h4><i class="fas fa-info-circle" style="margin-right: 0.5rem; color: var(--primary-gold);"></i>Condiciones</h4>
                    <ul>
                        ${offer.terms.split('\n').map(term => term.trim() ? `<li>${term}</li>` : '').join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        return card;
    }
    
    // ==========================================
    // ICONOS POR CATEGORÍA
    // ==========================================
    
    getOfferIcon(category) {
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
    
    // ==========================================
    // ESTADOS DE UI
    // ==========================================
    
    hideLoading() {
        this.loadingElement.style.display = 'none';
    }
    
    showEmptyState() {
        this.hideLoading();
        this.offersContainer.style.display = 'none';
        this.emptyState.style.display = 'block';
    }
}

// ==========================================
// MENSAJE DE CONFIGURACIÓN PROFESIONAL
// ==========================================

function showConfigurationMessage() {
    const container = document.getElementById('offers-container');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    
    loading.style.display = 'none';
    emptyState.style.display = 'none';
    container.style.display = 'block';
    
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: rgba(212, 165, 116, 0.1); border-radius: 16px; border: 2px solid var(--primary-gold);">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary-gold), var(--dark-gold)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                <i class="fas fa-cog" style="color: var(--charcoal); font-size: 2rem;"></i>
            </div>
                         <h3 style="color: var(--charcoal); margin-bottom: 1rem;">Configuración Requerida</h3>
             <p style="color: var(--warm-brown); margin-bottom: 1.5rem; line-height: 1.6;">
                 <strong>Para activar las ofertas dinámicas:</strong><br><br>
                 1. Ejecutar <code>database/ofertas-schema.sql</code> en Supabase<br>
                 2. Configurar <code>supabase-config.js</code> con tus credenciales<br>
                 3. Crear ofertas desde el panel de administración<br><br>
                 <small>📄 Ver OFERTAS_README.md para instrucciones detalladas</small>
             </p>
            <a href="../admin/ofertas-admin.html" style="background: linear-gradient(135deg, var(--primary-gold), var(--dark-gold)); color: var(--charcoal); padding: 1rem 2rem; border-radius: 25px; text-decoration: none; font-weight: 600;">
                <i class="fas fa-tools" style="margin-right: 0.5rem;"></i>Panel Admin
            </a>
        </div>
    `;
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Siempre usar el sistema profesional con Supabase
    new OfertasManager();
});

// ==========================================
// PWA BÁSICA - FUNCIONAMIENTO OFFLINE
// ==========================================

// Service Worker básico para cache
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
            .then(function(registration) {
                console.log('SW registrado con éxito');
            })
            .catch(function(registrationError) {
                console.log('SW registro falló');
            });
    });
}

// Detectar conexión
window.addEventListener('online', function() {
    document.body.classList.remove('offline');
});

window.addEventListener('offline', function() {
    document.body.classList.add('offline');
}); 