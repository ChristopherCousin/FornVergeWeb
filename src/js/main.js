/**
 * ==========================================
 * FORN VERGE DE LLUC - MAIN JAVASCRIPT
 * Funcionalidad principal de la aplicación
 * ==========================================
 */

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================
const CONFIG = {
    ANIMATION_DURATION: 300,
    SCROLL_THRESHOLD: 300,
    BREAKPOINT_MOBILE: 768,
    QR_API_URL: 'https://api.qrserver.com/v1/create-qr-code/',
    OFERTAS_PATH: 'ofertas/'
};

// ==========================================
// UTILIDADES GLOBALES
// ==========================================
const Utils = {
    /**
     * Detecta si es dispositivo móvil
     */
    isMobile() {
        return window.innerWidth <= CONFIG.BREAKPOINT_MOBILE;
    },

    /**
     * Debounce function para optimizar eventos
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Scroll suave a elemento
     */
    smoothScrollTo(element) {
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    },

    /**
     * Añadir/remover clase con animación
     */
    toggleClass(element, className, condition = null) {
        if (condition === null) {
            element.classList.toggle(className);
        } else {
            element.classList.toggle(className, condition);
        }
    }
};

// ==========================================
// GESTIÓN DE SCROLL
// ==========================================
class ScrollManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.scrollTopBtn = document.querySelector('.scroll-top');
        this.scrollIndicator = document.querySelector('.scroll-indicator');
        
        this.init();
    }

    init() {
        window.addEventListener('scroll', Utils.debounce(() => {
            this.handleScroll();
        }, 16)); // 60fps
        
        if (this.scrollTopBtn) {
            this.scrollTopBtn.addEventListener('click', () => {
                this.scrollToTop();
            });
        }
    }

    handleScroll() {
        const scrollY = window.pageYOffset;
        
        // Navbar effect
        if (this.navbar) {
            Utils.toggleClass(this.navbar, 'scrolled', scrollY > 50);
        }
        
        // Scroll to top button
        if (this.scrollTopBtn) {
            Utils.toggleClass(this.scrollTopBtn, 'visible', scrollY > CONFIG.SCROLL_THRESHOLD);
        }
        
        // Hide scroll indicator after first scroll
        if (this.scrollIndicator && scrollY > 100) {
            this.scrollIndicator.style.opacity = '0';
        }
        
        // Update active nav link
        this.updateActiveNavLink();
    }

    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.navbar__link');
        
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// ==========================================
// NAVEGACIÓN
// ==========================================
class Navigation {
    constructor() {
        this.init();
    }

    init() {
        this.setupSmoothScrolling();
        this.setupHoverEffects();
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                Utils.smoothScrollTo(target);
            });
        });
    }

    setupHoverEffects() {
        document.querySelectorAll('.navbar__link').forEach(link => {
            link.addEventListener('mouseenter', function() {
                this.style.color = 'var(--primary-gold)';
                this.style.transform = 'translateY(-2px)';
            });
            
            link.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.color = 'var(--light-gold)';
                    this.style.transform = 'translateY(0)';
                }
            });
        });
    }
}

// ==========================================
// OBSERVADOR DE INTERSECCIÓN
// ==========================================
class IntersectionObserverManager {
    constructor() {
        this.options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.init();
    }

    init() {
        // Observer para animaciones de entrada
        this.animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    // Añadir delay escalonado para múltiples elementos
                    const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) * 100;
                    entry.target.style.transitionDelay = `${delay}ms`;
                }
            });
        }, this.options);

        // Observar elementos con animación
        this.observeAnimatedElements();
    }

    observeAnimatedElements() {
        // Elementos con data-aos
        document.querySelectorAll('[data-aos]').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            this.animationObserver.observe(element);
        });

        // Cards con hover effects
        document.querySelectorAll('.card, .info-card').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            this.animationObserver.observe(element);
        });
    }
}

// ==========================================
// GESTIÓN DE OFERTAS Y QR
// ==========================================
class OffersManager {
    constructor() {
        this.qrContainer = document.getElementById('qr-code');
        this.desktopBtn = document.getElementById('desktop-offers-btn');
        this.mobileButtonContainer = document.getElementById('mobile-button-container');
        this.qrFullContainer = document.getElementById('qr-container');
        this.description = document.getElementById('offers-description');
        
        this.init();
    }

    init() {
        // Detectar dispositivo al cargar
        this.detectDeviceAndShowOffers();
        
        // Re-detectar en resize con debounce
        window.addEventListener('resize', Utils.debounce(() => {
            this.detectDeviceAndShowOffers();
        }, 250));
    }

    detectDeviceAndShowOffers() {
        const isMobile = Utils.isMobile();
        
        if (isMobile) {
            this.showMobileInterface();
        } else {
            this.showDesktopInterface();
        }
    }

    showMobileInterface() {
        console.log('📱 Dispositivo móvil detectado - mostrando botón directo');
        
        if (this.qrFullContainer) this.qrFullContainer.style.display = 'none';
        if (this.mobileButtonContainer) this.mobileButtonContainer.style.display = 'block';
        if (this.desktopBtn) this.desktopBtn.style.display = 'none';
        
        if (this.description) {
            this.description.innerHTML = `
                Accede a nuestras promociones especiales directamente desde tu móvil.<br>
                <span style="color: var(--primary-gold); font-weight: 600;">¡Ofertas exclusivas actualizadas cada día!</span>
            `;
        }
    }

    showDesktopInterface() {
        console.log('💻 Dispositivo escritorio detectado - mostrando QR + botón');
        
        if (this.qrFullContainer) this.qrFullContainer.style.display = 'flex';
        if (this.mobileButtonContainer) this.mobileButtonContainer.style.display = 'none';
        if (this.desktopBtn) this.desktopBtn.style.display = 'inline-block';
        
        if (this.description) {
            this.description.innerHTML = `
                Descubre nuestras promociones especiales escaneando el código QR.<br>
                <span style="color: var(--primary-gold); font-weight: 600;">¡Ofertas exclusivas actualizadas cada día!</span>
            `;
        }
        
        // Generar QR después de un pequeño delay
        setTimeout(() => this.generateQRCode(), 1000);
    }

    generateQRCode() {
        if (!this.qrContainer) return;
        
        const ofertasURL = `${window.location.origin}${window.location.pathname.replace('index.html', '')}${CONFIG.OFERTAS_PATH}`;
        
        console.log('🔗 Generando QR para:', ofertasURL);
        
        const qrImageURL = `${CONFIG.QR_API_URL}?size=150x150&data=${encodeURIComponent(ofertasURL)}&bgcolor=FFFFFF&color=2C2C2C&margin=10&format=png&ecc=M`;
        
        const qrImg = document.createElement('img');
        qrImg.src = qrImageURL;
        qrImg.alt = 'QR Code Ofertas Forn Verge de Lluc';
        qrImg.style.width = '100%';
        qrImg.style.height = '100%';
        qrImg.style.borderRadius = '8px';
        
        qrImg.onload = () => {
            console.log('✅ QR Code generado correctamente');
        };
        
        qrImg.onerror = () => {
            console.error('❌ Error generando QR Code');
            this.qrContainer.innerHTML = `
                <div style="color: var(--warm-brown); text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    <small>Error generando QR</small>
                </div>
            `;
        };
        
        this.qrContainer.innerHTML = '';
        this.qrContainer.appendChild(qrImg);
        
        if (this.desktopBtn) {
            this.desktopBtn.href = ofertasURL;
        }
    }
}

// ==========================================
// NOTIFICACIONES
// ==========================================
class NotificationManager {
    static show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        
        const typeClasses = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-1000 ${typeClasses[type] || typeClasses.info} text-white transform translate-x-full transition-transform duration-300`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Slide in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Slide out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(full)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

// ==========================================
// GESTIÓN DE RENDIMIENTO
// ==========================================
class PerformanceManager {
    constructor() {
        this.init();
    }

    init() {
        // Lazy loading de imágenes cuando estén disponibles
        this.setupLazyLoading();
        
        // Preload de recursos críticos
        this.preloadCriticalResources();
        
        // Optimizaciones de scroll
        this.optimizeScrollPerformance();
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    preloadCriticalResources() {
        // Preload de fuentes críticas
        const fontPreloads = [
            'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap',
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
        ];

        fontPreloads.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = font;
            document.head.appendChild(link);
        });
    }

    optimizeScrollPerformance() {
        // Marcar elementos que serán animados para optimizar repaints
        document.querySelectorAll('.card, .info-card, .btn').forEach(element => {
            element.style.willChange = 'transform';
        });

        // Cleanup después de la animación
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.querySelectorAll('[style*="will-change"]').forEach(element => {
                    element.style.willChange = 'auto';
                });
            }, 2000);
        });
    }
}

// ==========================================
// INICIALIZACIÓN PRINCIPAL
// ==========================================
class App {
    constructor() {
        this.components = {};
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bootstrap());
        } else {
            this.bootstrap();
        }
    }

    bootstrap() {
        console.log('🚀 Inicializando Forn Verge de Lluc App...');
        
        try {
            // Inicializar componentes principales
            this.components.scrollManager = new ScrollManager();
            this.components.navigation = new Navigation();
            this.components.intersectionObserver = new IntersectionObserverManager();
            this.components.offersManager = new OffersManager();
            this.components.performanceManager = new PerformanceManager();
            
            // Marcar la app como cargada
            document.body.classList.add('app-loaded');
            
            console.log('✅ App inicializada correctamente');
            
            // Mostrar notificación de bienvenida (opcional)
            // NotificationManager.show('¡Bienvenido a Forn Verge de Lluc!', 'success');
            
        } catch (error) {
            console.error('❌ Error inicializando la app:', error);
            NotificationManager.show('Error cargando la aplicación', 'error');
        }
    }

    // Método para reinicializar componentes (útil para SPA o cambios dinámicos)
    refresh() {
        console.log('🔄 Refrescando componentes...');
        Object.values(this.components).forEach(component => {
            if (component.refresh && typeof component.refresh === 'function') {
                component.refresh();
            }
        });
    }
}

// ==========================================
// EXPORTAR PARA USO GLOBAL
// ==========================================
window.FornVergeApp = {
    App,
    Utils,
    NotificationManager,
    CONFIG
};

// ==========================================
// AUTO-INICIALIZACIÓN
// ==========================================
const app = new App();

// Hacer disponible globalmente para debugging
window.app = app; 