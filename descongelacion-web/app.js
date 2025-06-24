// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
class DescongelacionApp {
    constructor() {
        this.supabase = null;
        this.currentProducts = [];
        this.currentTanda = null;
        this.currentDate = new Date();
        this.timers = new Map();
        this.isOnline = false;
        this.lastUpdate = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando aplicación Forn Verge...');
        
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

        // Configurar interfaz
        this.setupUI();
        this.updateDateTime();
        this.updateCurrentTanda();
        
        // Cargar datos iniciales
        await this.loadProducts();
        
        // Configurar actualizaciones automáticas
        this.setupAutoRefresh();
        this.setupEventListeners();
        
        console.log('✅ Aplicación inicializada correctamente');
    }

    setupUI() {
        // Actualizar fecha y hora cada segundo
        this.updateDateTime();
        setInterval(() => {
            this.updateDateTime();
            this.updateSchedules(); // Actualizar horarios y resumen cada segundo
            this.updateSummary();   // Actualizar contadores urgentes
        }, 1000);

        // Detectar cambios de tanda automáticamente
        this.updateCurrentTanda();
        setInterval(() => {
            this.updateCurrentTanda();
        }, 60000); // Verificar cada minuto

        // Configurar event listeners
        this.setupEventListeners();
        
        // Configurar actualización automática
        this.setupAutoRefresh();
    }

    updateDateTime() {
        const now = new Date();
        
        // Verificar si cambió el día
        if (now.getDate() !== this.currentDate.getDate()) {
            this.currentDate = now;
            this.loadProducts(); // Recargar productos para el nuevo día
        }
        
        document.getElementById('current-date').textContent = formatDate(now);
        document.getElementById('current-time').textContent = formatTime(now);
    }

    updateCurrentTanda() {
        const tanda = getCurrentTanda();
        
        if (tanda !== this.currentTanda) {
            this.currentTanda = tanda;
            this.updateTandaSelector();
            this.loadProducts(); // Recargar productos para la nueva tanda
        }

        if (tanda) {
            const tandaInfo = TIME_CONFIG.tandas[tanda];
            document.getElementById('current-tanda').textContent = 
                `${tandaInfo.emoji} ${tandaInfo.name} (${tandaInfo.start}:00-${tandaInfo.end}:00)`;
        }
    }

    updateTandaSelector() {
        document.querySelectorAll('.tanda-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.tanda === this.currentTanda) {
                option.classList.add('active');
            }
        });
    }

    selectTanda(tanda) {
        this.currentTanda = tanda;
        this.updateTandaSelector();
        this.loadProducts();
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

    async loadProducts() {
        if (!this.supabase || !this.currentTanda) return;

        this.showLoading(true);

        try {
            const weekday = getWeekdayNumber(this.currentDate);
            
            const { data, error } = await this.supabase
                .from('cantidades_calculadas')
                .select('*')
                .eq('dia_semana', weekday)
                .eq('tanda', this.currentTanda);

            if (error) throw error;

            this.currentProducts = data || [];
            this.renderProducts();
            this.updateSummary();
            this.lastUpdate = new Date();
            document.getElementById('last-update').textContent = formatTime(this.lastUpdate);
            
            console.log(`📦 Cargados ${this.currentProducts.length} productos para ${WEEKDAYS[weekday]} - ${this.currentTanda}`);
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.showError('Error al cargar productos');
            this.updateConnectionStatus(false);
        } finally {
            this.showLoading(false);
        }
    }

    renderProducts() {
        const container = document.getElementById('products-list');
        const noProducts = document.getElementById('no-products');

        if (this.currentProducts.length === 0) {
            container.style.display = 'none';
            noProducts.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        noProducts.style.display = 'none';

        container.innerHTML = this.currentProducts.map(product => 
            this.createProductCard(product)
        ).join('');
    }

    createProductCard(product) {
        const emoji = PRODUCT_EMOJIS[product.producto] || '🥖';
        const schedule = this.getProductSchedule(product);
        
        return `
            <div class="product-card simple" data-product-id="${product.id}">
                <div class="product-header">
                    <div class="product-info">
                        <h3>${emoji} ${product.producto}</h3>
                    </div>
                    <div class="product-quantity">
                        ${product.cantidad_ajustada} uds
                    </div>
                </div>
                
                <div class="product-schedule">
                    ${schedule}
                </div>
            </div>
        `;
    }

    getProductSchedule(product) {
        const calc = calculateDefrostStartTime(this.currentTanda, product.producto);
        if (!calc) return 'No se pudo calcular el horario';
        
        const defrostTime = `${calc.start_hour.toString().padStart(2, '0')}:${calc.start_minutes.toString().padStart(2, '0')}`;
        const ovenTime = `${calc.oven_hour.toString().padStart(2, '0')}:${calc.oven_minutes.toString().padStart(2, '0')}`;
        const readyTime = `${calc.ready_hour.toString().padStart(2, '0')}:${calc.ready_minutes.toString().padStart(2, '0')}`;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const defrostStart = calc.start_hour * 60 + calc.start_minutes;
        const ovenStart = calc.oven_hour * 60 + calc.oven_minutes;
        const readyMoment = calc.ready_hour * 60 + calc.ready_minutes;
        
        let status = '';
        if (currentTime < defrostStart) {
            status = '⏳ Esperando';
        } else if (currentTime < ovenStart) {
            status = '🧊 Descongelar ahora';
        } else if (currentTime < readyMoment) {
            status = '🔥 Al horno ahora';
        } else {
            status = '🎯 ¡Listo!';
        }
        
        return `
            <div class="schedule-status">${status}</div>
            <div class="schedule-timeline">
                <div class="timeline-step">
                    <span class="step-icon">🧊</span>
                    <span class="step-time">${defrostTime}</span>
                    <span class="step-label">Sacar del congelador</span>
                </div>
                <div class="timeline-step">
                    <span class="step-icon">🔥</span>
                    <span class="step-time">${ovenTime}</span>
                    <span class="step-label">Meter al horno</span>
                </div>
                <div class="timeline-step">
                    <span class="step-icon">🎯</span>
                    <span class="step-time">${readyTime}</span>
                    <span class="step-label">Listo para vender</span>
                </div>
            </div>
        `;
    }

    updateSummary() {
        // Contar productos por estado actual
        let needDefrost = 0;
        let needOven = 0;
        let total = this.currentProducts.length;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        this.currentProducts.forEach(product => {
            const calc = calculateDefrostStartTime(this.currentTanda, product.producto);
            if (calc) {
                const defrostStart = calc.start_hour * 60 + calc.start_minutes;
                const ovenStart = calc.oven_hour * 60 + calc.oven_minutes;
                const readyMoment = calc.ready_hour * 60 + calc.ready_minutes;
                
                if (currentTime >= defrostStart && currentTime < ovenStart) {
                    needDefrost++;
                } else if (currentTime >= ovenStart && currentTime < readyMoment) {
                    needOven++;
                }
            }
        });
        
        // Actualizar contadores en la UI
        const totalElement = document.getElementById('total-products');
        if (totalElement) {
            totalElement.textContent = total;
        }
        
        // Actualizar información de productos por descongelar
        const defrostElement = document.querySelector('.action-summary');
        if (defrostElement) {
            defrostElement.innerHTML = `
                <div class="summary-item ${needDefrost > 0 ? 'urgent' : ''}">
                    🧊 Por descongelar: <strong>${needDefrost}</strong>
                </div>
                <div class="summary-item ${needOven > 0 ? 'urgent' : ''}">
                    🔥 Al horno: <strong>${needOven}</strong>
                </div>
            `;
        }
        
        console.log(`📊 Resumen: ${needDefrost} para descongelar, ${needOven} al horno, ${total} total`);
    }

    updateSchedules() {
        // Actualizar horarios en tiempo real
        if (!this.currentProducts || this.currentProducts.length === 0) return;
        
        this.currentProducts.forEach(product => {
            const productCard = document.querySelector(`[data-product-id="${product.id}"]`);
            if (productCard) {
                const scheduleElement = productCard.querySelector('.product-schedule');
                if (scheduleElement) {
                    const schedule = this.getProductSchedule(product);
                    scheduleElement.innerHTML = schedule;
                }
            }
        });
    }

    showLoading(show) {
        document.getElementById('products-loading').style.display = show ? 'block' : 'none';
        document.getElementById('products-list').style.display = show ? 'none' : 'block';
        document.getElementById('no-products').style.display = 'none';
    }

    setupAutoRefresh() {
        setInterval(async () => {
            if (this.isOnline) {
                await this.loadProducts();
            }
        }, APP_CONFIG.auto_refresh_minutes * 60000);
    }

    setupEventListeners() {
        // Botón de actualización manual
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadProducts();
        });

        // Cerrar modal
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideModal();
        });
    }

    async confirmAction(title, message) {
        return new Promise((resolve) => {
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-message').textContent = message;
            document.getElementById('confirm-modal').style.display = 'flex';

            const confirmBtn = document.getElementById('modal-confirm');
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

            newConfirmBtn.addEventListener('click', () => {
                this.hideModal();
                resolve(true);
            });

            setTimeout(() => {
                this.hideModal();
                resolve(false);
            }, 30000); // Auto-cancelar después de 30 segundos
        });
    }

    hideModal() {
        document.getElementById('confirm-modal').style.display = 'none';
    }

    showSuccess(message) {
        console.log('✅', message);
        this.showToast(message, 'success');
    }

    showError(message) {
        console.error('❌', message);
        this.showToast(message, 'error');
    }

    showToast(message, type) {
        // Crear toast dinámicamente
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Mostrar con animación
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Ocultar y eliminar después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// ===== INICIALIZACIÓN =====
let app;

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar la librería de Supabase
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@supabase/supabase-js@2';
    script.onload = () => {
        app = new DescongelacionApp();
        window.app = app; // Para acceso global
    };
    document.head.appendChild(script);
});

// ===== SERVICE WORKER PARA PWA =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 