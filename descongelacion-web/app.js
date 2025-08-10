// ===== APLICACIÓN FORN VERGE - VISTA SIMPLE =====
class DescongelacionApp {
    constructor() {
        this.supabase = null;
        this.allProducts = [];
        this.targetDate = null;
        this.isOnline = false;
        this.lastUpdate = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Forn Verge - Vista simple...');
        
        // Validar configuración
        if (!validateConfig()) {
            this.showError('Configuración incorrecta. Revisa config.js');
            return;
        }

        // Inicializar Supabase
        try {
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url, 
                SUPABASE_CONFIG.anon_key
            );
            console.log('✅ Conexión a Supabase establecida');
            this.updateConnectionStatus(true);
        } catch (error) {
            console.error('❌ Error conectando a Supabase:', error);
            this.updateConnectionStatus(false);
        }

        // Configurar fecha para HOY (día actual)
        this.targetDate = new Date();
        
        // Configurar interfaz
        this.setupUI();
        
        // Cargar datos iniciales
        await this.loadAllProducts();
        
        // Configurar actualizaciones automáticas
        this.setupAutoRefresh();
        
        console.log('✅ Vista simple lista');
    }

    setupUI() {
        // Actualizar fecha y hora cada segundo
        this.updateDateTime();
        setInterval(() => {
            this.updateDateTime();
        }, 1000);

        // Redibujar según tamaño de pantalla (responsive)
        window.addEventListener('resize', () => {
            // Evitar re-render innecesario si no hay productos
            if (this.allProducts && this.allProducts.length > 0) {
                this.renderProducts();
            }
        });
    }

    updateDateTime() {
        const now = new Date();
        document.getElementById('current-date').textContent = formatDate(now);
        document.getElementById('current-time').textContent = formatTime(now);
        document.getElementById('target-date').textContent = 
            `Producción de hoy: ${formatShortDate(this.targetDate)}`;
    }

    updateConnectionStatus(isOnline) {
        this.isOnline = isOnline;
        const statusBar = document.getElementById('connection-status');
        const statusText = document.getElementById('status-text');
        
        if (isOnline) {
            statusBar.className = 'status-bar online';
            statusText.textContent = '🟢 Conectado';
        } else {
            statusBar.className = 'status-bar offline';
            statusText.textContent = '🔴 Sin conexión';
        }
    }

    async loadAllProducts() {
        if (!this.supabase) return;

        this.showLoading(true);

        try {
            const weekday = getWeekdayNumber(this.targetDate);
            
            const { data, error } = await this.supabase
                .from('cantidades_calculadas')
                .select('*')
                .eq('dia_semana', weekday);

            if (error) throw error;

            // Agrupar productos por tipo
            this.allProducts = this.groupProductsByType(data || []);
            this.renderProducts();
            this.lastUpdate = new Date();
            document.getElementById('last-update').textContent = formatTime(this.lastUpdate);
            
            console.log(`📦 Productos cargados para ${WEEKDAYS[weekday]}`);
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.showError('Error al cargar productos');
            this.updateConnectionStatus(false);
        } finally {
            this.showLoading(false);
        }
    }

    groupProductsByType(products) {
        const grouped = {};
        
        products.forEach(product => {
            if (!grouped[product.producto]) {
                grouped[product.producto] = {
                    producto: product.producto,
                    tandas: {}
                };
            }
            grouped[product.producto].tandas[product.tanda] = product;
        });

        // Convertir a array y ordenar alfabéticamente
        return Object.values(grouped).sort((a, b) => 
            a.producto.localeCompare(b.producto)
        );
    }

    renderProducts() {
        const container = document.getElementById('products-list');
        const noProducts = document.getElementById('no-products');

        if (this.allProducts.length === 0) {
            container.style.display = 'none';
            noProducts.style.display = 'block';
            noProducts.innerHTML = `
                <h3>😴 No hay productos</h3>
                <p>No hay productos para ${formatShortDate(this.targetDate)}.</p>
            `;
            return;
        }

        container.style.display = 'block';
        noProducts.style.display = 'none';

        if (this.isMobileLayout()) {
            container.innerHTML = `
                <div class="products-mobile">
                    ${this.allProducts.map(productGroup => this.createProductMobileItem(productGroup)).join('')}
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="products-table">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Mañana<br><span class="badge-horario">${TIME_CONFIG.tandas['mañana'].hornear_hora} → ${TIME_CONFIG.tandas['mañana'].listo_hora}</span></th>
                                <th>Mediodía<br><span class="badge-horario">${TIME_CONFIG.tandas['mediodia'].hornear_hora} → ${TIME_CONFIG.tandas['mediodia'].listo_hora}</span></th>
                                <th>Tarde<br><span class="badge-horario">${TIME_CONFIG.tandas['tarde'].hornear_hora} → ${TIME_CONFIG.tandas['tarde'].listo_hora}</span></th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.allProducts.map(productGroup => this.createProductRow(productGroup)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    createProductRow(productGroup) {
        const manana = productGroup.tandas['mañana']?.cantidad_ajustada || 0;
        const mediodia = productGroup.tandas['mediodia']?.cantidad_ajustada || 0;
        const tarde = productGroup.tandas['tarde']?.cantidad_ajustada || 0;
        const total = manana + mediodia + tarde;

        if (total === 0) return '';

        return `
            <tr>
                <td class="col-producto">${productGroup.producto}</td>
                <td class="col-amount tanda-manana ${manana > 0 ? 'has-amount' : ''}">${manana || ''}</td>
                <td class="col-amount tanda-mediodia ${mediodia > 0 ? 'has-amount' : ''}">${mediodia || ''}</td>
                <td class="col-amount tanda-tarde ${tarde > 0 ? 'has-amount' : ''}">${tarde || ''}</td>
                <td class="col-amount col-total">${total}</td>
            </tr>
        `;
    }

    isMobileLayout() {
        return window.innerWidth <= 768;
    }

    createProductMobileItem(productGroup) {
        const manana = productGroup.tandas['mañana']?.cantidad_ajustada || 0;
        const mediodia = productGroup.tandas['mediodia']?.cantidad_ajustada || 0;
        const tarde = productGroup.tandas['tarde']?.cantidad_ajustada || 0;
        const total = manana + mediodia + tarde;

        if (total === 0) return '';

        const chips = [];
        if (manana > 0) {
            chips.push(`
                <div class="chip chip-manana">
                    <div class="time">🌅 ${TIME_CONFIG.tandas['mañana'].hornear_hora} → ${TIME_CONFIG.tandas['mañana'].listo_hora}</div>
                    <div class="amount">${manana}</div>
                </div>
            `);
        }
        if (mediodia > 0) {
            chips.push(`
                <div class="chip chip-mediodia">
                    <div class="time">☀️ ${TIME_CONFIG.tandas['mediodia'].hornear_hora} → ${TIME_CONFIG.tandas['mediodia'].listo_hora}</div>
                    <div class="amount">${mediodia}</div>
                </div>
            `);
        }
        if (tarde > 0) {
            chips.push(`
                <div class="chip chip-tarde">
                    <div class="time">🌇 ${TIME_CONFIG.tandas['tarde'].hornear_hora} → ${TIME_CONFIG.tandas['tarde'].listo_hora}</div>
                    <div class="amount">${tarde}</div>
                </div>
            `);
        }

        return `
            <div class="mobile-item">
                <div class="mobile-header">
                    <div class="mobile-name">${productGroup.producto}</div>
                    <div class="mobile-total">${total}</div>
                </div>
                <div class="mobile-chips">
                    ${chips.join('')}
                </div>
            </div>
        `;
    }

    showLoading(show) {
        document.getElementById('products-loading').style.display = show ? 'block' : 'none';
    }

    setupAutoRefresh() {
        setInterval(async () => {
            if (this.isOnline) {
                await this.loadAllProducts();
            }
        }, APP_CONFIG.auto_refresh_minutes * 60000);
    }

    showError(message) {
        console.error(message);
        const toast = document.createElement('div');
        toast.className = 'toast toast-error show';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// ===== INICIALIZACIÓN =====
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new DescongelacionApp();
});

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registrado'))
            .catch(error => console.log('SW error:', error));
    });
} 