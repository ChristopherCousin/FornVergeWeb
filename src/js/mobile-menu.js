/**
 * ==========================================
 * FORN VERGE DE LLUC - MOBILE MENU
 * Gestión completa del menú móvil
 * ==========================================
 */

class MobileMenu {
    constructor() {
        // Referencias DOM
        this.mobileMenuBtn = document.getElementById('mobile-menu');
        this.mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        this.mobileMenuClose = document.getElementById('mobile-menu-close');
        this.mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
        
        // Estado del menú
        this.isOpen = false;
        this.isAnimating = false;
        
        // Configuración
        this.config = {
            animationDuration: 300,
            breakpoint: 768
        };
        
        this.init();
    }

    init() {
        if (!this.mobileMenuBtn || !this.mobileMenuOverlay) {
            console.warn('⚠️ Elementos del menú móvil no encontrados');
            return;
        }

        this.setupEventListeners();
        this.setupGestures();
        this.handleResize();
    }

    setupEventListeners() {
        // Botón de apertura
        this.mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.open();
        });

        // Botón de cierre
        if (this.mobileMenuClose) {
            this.mobileMenuClose.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
            });
        }

        // Click en overlay para cerrar
        this.mobileMenuOverlay.addEventListener('click', (e) => {
            if (e.target === this.mobileMenuOverlay) {
                this.close();
            }
        });

        // Enlaces de navegación
        this.mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.close();
            });
        });

        // Tecla ESC para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Detectar cambio de tamaño de pantalla
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Prevenir scroll cuando el menú esté abierto
        this.mobileMenuOverlay.addEventListener('touchmove', (e) => {
            if (this.isOpen) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    setupGestures() {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        // Touch gestures para cerrar el menú deslizando hacia arriba
        this.mobileMenuOverlay.addEventListener('touchstart', (e) => {
            if (!this.isOpen) return;
            
            startY = e.touches[0].clientY;
            isDragging = true;
            this.mobileMenuOverlay.style.transition = 'none';
        }, { passive: true });

        this.mobileMenuOverlay.addEventListener('touchmove', (e) => {
            if (!isDragging || !this.isOpen) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Solo permitir deslizar hacia arriba para cerrar
            if (deltaY < 0) {
                const opacity = Math.max(0, 1 + (deltaY / 200));
                this.mobileMenuOverlay.style.opacity = opacity;
            }
        }, { passive: true });

        this.mobileMenuOverlay.addEventListener('touchend', () => {
            if (!isDragging || !this.isOpen) return;
            
            isDragging = false;
            this.mobileMenuOverlay.style.transition = '';
            
            const deltaY = currentY - startY;
            
            // Si deslizó más de 100px hacia arriba, cerrar menú
            if (deltaY < -100) {
                this.close();
            } else {
                // Restaurar opacidad
                this.mobileMenuOverlay.style.opacity = '';
            }
        }, { passive: true });
    }

    open() {
        if (this.isOpen || this.isAnimating) return;
        
        console.log('📱 Abriendo menú móvil');
        
        this.isAnimating = true;
        this.isOpen = true;
        
        // Prevenir scroll del body
        document.body.classList.add('no-scroll');
        
        // Mostrar overlay
        this.mobileMenuOverlay.classList.add('active');
        
        // Animar entrada de los enlaces
        this.animateLinksIn();
        
        // Marcar como no animando después de la duración
        setTimeout(() => {
            this.isAnimating = false;
        }, this.config.animationDuration);
        
        // Accessibility
        this.mobileMenuOverlay.setAttribute('aria-hidden', 'false');
        this.mobileMenuBtn.setAttribute('aria-expanded', 'true');
        
        // Focus en el primer enlace
        const firstLink = this.mobileNavLinks[0];
        if (firstLink) {
            setTimeout(() => {
                firstLink.focus();
            }, this.config.animationDuration);
        }
    }

    close() {
        if (!this.isOpen || this.isAnimating) return;
        
        console.log('📱 Cerrando menú móvil');
        
        this.isAnimating = true;
        this.isOpen = false;
        
        // Animar salida de los enlaces
        this.animateLinksOut();
        
        // Ocultar overlay después de la animación
        setTimeout(() => {
            this.mobileMenuOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
            this.isAnimating = false;
            
            // Restaurar estilos
            this.mobileMenuOverlay.style.opacity = '';
        }, this.config.animationDuration);
        
        // Accessibility
        this.mobileMenuOverlay.setAttribute('aria-hidden', 'true');
        this.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        
        // Devolver focus al botón de menú
        this.mobileMenuBtn.focus();
    }

    animateLinksIn() {
        this.mobileNavLinks.forEach((link, index) => {
            link.style.transform = 'translateX(-50px)';
            link.style.opacity = '0';
            
            setTimeout(() => {
                link.style.transition = 'all 0.3s ease';
                link.style.transform = 'translateX(0)';
                link.style.opacity = '1';
            }, index * 100);
        });
    }

    animateLinksOut() {
        this.mobileNavLinks.forEach((link, index) => {
            setTimeout(() => {
                link.style.transform = 'translateX(50px)';
                link.style.opacity = '0';
            }, index * 50);
        });
        
        // Limpiar estilos después de la animación
        setTimeout(() => {
            this.mobileNavLinks.forEach(link => {
                link.style.transition = '';
                link.style.transform = '';
                link.style.opacity = '';
            });
        }, this.config.animationDuration);
    }

    handleResize() {
        // Cerrar menú si cambiamos a desktop
        if (window.innerWidth > this.config.breakpoint && this.isOpen) {
            this.close();
        }
    }

    // Método público para toggle
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    // Método para destruir el componente
    destroy() {
        // Remover event listeners
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.removeEventListener('click', this.open);
        }
        
        if (this.mobileMenuClose) {
            this.mobileMenuClose.removeEventListener('click', this.close);
        }
        
        // Limpiar estado
        document.body.classList.remove('no-scroll');
        this.mobileMenuOverlay.classList.remove('active');
        
        console.log('🗑️ Menú móvil destruido');
    }
}

// Función global para cerrar menú (para uso en HTML)
window.closeMobileMenu = function() {
    if (window.mobileMenu && window.mobileMenu.isOpen) {
        window.mobileMenu.close();
    }
};

// Auto-inicialización si el DOM ya está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileMenu = new MobileMenu();
    });
} else {
    window.mobileMenu = new MobileMenu();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileMenu;
}

// Exportar para uso global
window.MobileMenu = MobileMenu; 