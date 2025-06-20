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
        setInterval(() => {
            this.updateDateTime();
            this.updateCurrentTanda();
            this.updateTimers();
        }, 1000);

        // Configurar selector de tandas
        document.querySelectorAll('.tanda-option').forEach(option => {
            option.addEventListener('click', () => {
                const tanda = option.dataset.tanda;
                this.selectTanda(tanda);
            });
        });
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

        // Configurar event listeners para los botones
        this.setupProductEventListeners();
    }

    createProductCard(product) {
        const emoji = PRODUCT_EMOJIS[product.producto] || '🥖';
        const estado = this.getProductStatus(product);
        const timerInfo = this.getTimerInfo(product);
        const recommendation = getDefrostRecommendation(this.currentTanda, product.producto);
        
        return `
            <div class="product-card ${estado.class}" data-product-id="${product.id}">
                <div class="product-header">
                    <div class="product-info">
                        <h3>${emoji} ${product.producto}</h3>
                    </div>
                    <div class="product-quantity">
                        ${product.cantidad_ajustada} uds
                    </div>
                </div>
                
                <div class="product-status ${estado.class}">
                    <span class="status-emoji">${estado.emoji}</span>
                    <span>${estado.description}</span>
                </div>
                
                ${estado.class === 'pending' ? `<div class="defrost-recommendation">${recommendation}</div>` : ''}
                ${timerInfo ? `<div class="timer-info">${timerInfo}</div>` : ''}
                
                <div class="product-actions">
                    ${this.createActionButtons(product, estado)}
                </div>
            </div>
        `;
    }

    getProductStatus(product) {
        // Aquí deberías obtener el estado real desde la base de datos
        // Por ahora, simulamos el estado basado en si tiene timestamps
        
        if (product.baking_started_at) {
            return {
                class: 'baking',
                emoji: '🔥',
                description: 'En horno'
            };
        }
        
        if (product.defrost_completed_at) {
            return {
                class: 'ready',
                emoji: '✅',
                description: 'Listo para horno'
            };
        }
        
        if (product.defrost_started_at) {
            return {
                class: 'defrosting',
                emoji: '🧊➡️',
                description: 'Descongelando'
            };
        }
        
        return {
            class: 'pending',
            emoji: '⏳',
            description: 'Pendiente de descongelar'
        };
    }

    getTimerInfo(product) {
        const now = new Date();
        
        if (product.baking_started_at) {
            const bakingTime = TIME_CONFIG.tiempos_horneado[product.producto] || 20;
            const remaining = calculateTimeRemaining(product.baking_started_at, bakingTime);
            
            if (remaining) {
                return `⏱️ Horneado: ${remaining.minutes}:${remaining.seconds.toString().padStart(2, '0')} restantes`;
            } else {
                return '🎯 ¡Horneado completado!';
            }
        }
        
        if (product.defrost_started_at) {
            const defrostTime = TIME_CONFIG.tiempos_descongelacion[product.producto] || 120;
            const remaining = calculateTimeRemaining(product.defrost_started_at, defrostTime);
            
            if (remaining) {
                return `❄️ Descongelación: ${remaining.minutes}:${remaining.seconds.toString().padStart(2, '0')} restantes`;
            } else {
                return '✅ ¡Descongelación completada!';
            }
        }
        
        return null;
    }

    createActionButtons(product, estado) {
        switch (estado.class) {
            case 'pending':
                return `
                    <button class="btn btn-primary btn-sm" onclick="app.startDefrost(${product.id})">
                        <span class="btn-icon">🧊</span>
                        Comenzar descongelación
                    </button>
                `;
                
            case 'defrosting':
                return `
                    <button class="btn btn-secondary btn-sm" onclick="app.completeDefrost(${product.id})">
                        <span class="btn-icon">✅</span>
                        Marcar descongelado
                    </button>
                `;
                
            case 'ready':
                return `
                    <button class="btn btn-warning btn-sm" onclick="app.startBaking(${product.id})">
                        <span class="btn-icon">🔥</span>
                        Meter al horno
                    </button>
                `;
                
            case 'baking':
                return `
                    <button class="btn btn-success btn-sm" onclick="app.completeBaking(${product.id})">
                        <span class="btn-icon">🎯</span>
                        Marcar horneado
                    </button>
                `;
                
            default:
                return '';
        }
    }

    setupProductEventListeners() {
        // Los event listeners se configuran inline en los botones
        // para simplificar la gestión de eventos dinámicos
    }

    async startDefrost(productId) {
        if (!await this.confirmAction('¿Comenzar descongelación?', 'Se iniciará el temporizador de descongelación.')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('cantidades_calculadas')
                .update({ 
                    defrost_started_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);

            if (error) throw error;

            await this.loadProducts();
            this.showSuccess('Descongelación iniciada');
            
        } catch (error) {
            console.error('Error iniciando descongelación:', error);
            this.showError('Error al iniciar descongelación');
        }
    }

    async completeDefrost(productId) {
        if (!await this.confirmAction('¿Marcar como descongelado?', 'El producto estará listo para el horno.')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('cantidades_calculadas')
                .update({ 
                    defrost_completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);

            if (error) throw error;

            await this.loadProducts();
            this.showSuccess('Producto listo para horno');
            
        } catch (error) {
            console.error('Error completando descongelación:', error);
            this.showError('Error al completar descongelación');
        }
    }

    async startBaking(productId) {
        if (!await this.confirmAction('¿Meter al horno?', 'Se iniciará el temporizador de horneado.')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('cantidades_calculadas')
                .update({ 
                    baking_started_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);

            if (error) throw error;

            await this.loadProducts();
            this.showSuccess('Horneado iniciado');
            
        } catch (error) {
            console.error('Error iniciando horneado:', error);
            this.showError('Error al iniciar horneado');
        }
    }

    async completeBaking(productId) {
        if (!await this.confirmAction('¿Marcar como horneado?', 'El producto estará completamente terminado.')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('cantidades_calculadas')
                .update({ 
                    baking_completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);

            if (error) throw error;

            await this.loadProducts();
            this.showSuccess('¡Producto completado!');
            
        } catch (error) {
            console.error('Error completando horneado:', error);
            this.showError('Error al completar horneado');
        }
    }

    updateSummary() {
        const stats = this.currentProducts.reduce((acc, product) => {
            const status = this.getProductStatus(product);
            switch (status.class) {
                case 'pending': acc.pending++; break;
                case 'defrosting': acc.defrosting++; break;
                case 'ready': acc.ready++; break;
                case 'baking': acc.baking++; break;
            }
            return acc;
        }, { pending: 0, defrosting: 0, ready: 0, baking: 0 });

        document.getElementById('total-pending').textContent = stats.pending + stats.defrosting;
        document.getElementById('total-ready').textContent = stats.ready;
        document.getElementById('total-baking').textContent = stats.baking;
    }

    updateTimers() {
        // Actualizar temporizadores en tiempo real
        if (!this.currentProducts || this.currentProducts.length === 0) return;
        
        this.currentProducts.forEach(product => {
            const productCard = document.querySelector(`[data-product-id="${product.id}"]`);
            if (productCard) {
                const timerElement = productCard.querySelector('.timer-info');
                if (timerElement) {
                    const timerInfo = this.getTimerInfo(product);
                    timerElement.textContent = timerInfo || '';
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
        // Aquí podrías mostrar una notificación toast
    }

    showError(message) {
        console.error('❌', message);
        // Aquí podrías mostrar una notificación de error
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