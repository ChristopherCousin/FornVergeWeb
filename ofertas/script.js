// ==========================================
// OFERTAS DINÁMICAS - FORN VERGE DE LLUC
// Sistema de ofertas en tiempo real
// ==========================================

import { SUPABASE_CONFIG } from '../assets/js/config/constants.js';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

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
            
            // Cargar ofertas
            await this.loadOffers();
            
            // Configurar refresco automático cada 30 segundos
            setInterval(() => this.loadOffers(), 30000);
            
        } catch (error) {
            console.error('Error inicializando ofertas:', error);
            this.showEmptyState();
        }
    }
    
    // ==========================================
    // CARGAR OFERTAS DESDE SUPABASE
    // ==========================================
    
    async loadOffers() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('offers')
                .select('*')
                .lte('start_date', today)
                .gte('end_date', today)
                .eq('is_active', true)
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error cargando ofertas:', error);
                this.showEmptyState();
                return;
            }
            
            this.offers = data || [];
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
// OFERTAS DEMO (FALLBACK)
// ==========================================

const DEMO_OFFERS = [
    {
        id: 'demo-1',
        title: 'Desayuno Mallorquín',
        description: 'Café con leche + ensaimada tradicional + zumo de naranja natural',
        category: 'desayuno',
        original_price: 8.50,
        offer_price: 6.90,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        is_active: true,
        priority: 3,
        terms: 'Válido hasta las 12:00h\nNo acumulable con otras ofertas'
    },
    {
        id: 'demo-2',
        title: 'Pan del Día 20% OFF',
        description: 'Descuento especial en todo nuestro pan artesanal horneado hoy',
        category: 'panaderia',
        original_price: null,
        offer_price: null,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        is_active: true,
        priority: 2,
        terms: 'Aplicable a pan del día\nNo válido para pedidos especiales'
    },
    {
        id: 'demo-3',
        title: 'Tarde de Cervezas',
        description: '2 cañas + tapa de jamón ibérico por precio especial',
        category: 'bar',
        original_price: 12.00,
        offer_price: 9.50,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        is_active: true,
        priority: 1,
        terms: 'Válido de 17:00 a 20:00h\nSolo fines de semana'
    }
];

// ==========================================
// CARGAR OFERTAS DEMO SI NO HAY SUPABASE
// ==========================================

class DemoOfertasManager extends OfertasManager {
    async loadOffers() {
        try {
            // Simular delay de carga
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Filtrar ofertas activas para hoy
            const today = new Date().toISOString().split('T')[0];
            
            this.offers = DEMO_OFFERS.filter(offer => {
                return offer.is_active && 
                       offer.start_date <= today && 
                       offer.end_date >= today;
            });
            
            this.renderOffers();
            
        } catch (error) {
            console.error('Error cargando ofertas demo:', error);
            this.showEmptyState();
        }
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Detectar si Supabase está disponible
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.URL) {
        new OfertasManager();
    } else {
        // Usar sistema demo
        new DemoOfertasManager();
    }
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