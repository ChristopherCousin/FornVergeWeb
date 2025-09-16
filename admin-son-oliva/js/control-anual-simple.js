/**
 * CONTROL ANUAL SIMPLE PARA LA ENCARGADA - FORN VERGE
 * ===================================================
 * Sistema FÁCIL para planificar horarios cumpliendo el convenio
 * SOLO información anual, sin complicaciones técnicas
 */

class ControlAnualSimple {
    constructor() {
        this.supabase = null;
        this.empleados = [];
        this.convenioAnual = null;
        this.ausenciasManager = null;
        this.init();
    }

    async init() {
        console.log('📊 Iniciando Control Anual Simple...');
        
        // Esperar autenticación
        await this.esperarAutenticacion();
        
        // Inicializar Supabase correctamente
        await this.inicializarSupabase();
        
        // Cargar empleados
        await this.cargarEmpleados();
        
        // Inicializar sistema anual
        await this.inicializarSistemaAnual();
        
        // Crear panel simple
        this.crearPanelSimple();
        
        console.log('✅ Control Anual Simple listo');
    }

    async esperarAutenticacion() {
        while (!document.getElementById('mainContent') || 
               document.getElementById('mainContent').style.display === 'none') {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    async inicializarSupabase() {
        // Esperar a que Supabase esté disponible
        while (!window.supabase) {
            // console.log('⏳ Esperando Supabase...');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Inicializar igual que en admin-horarios.js
        const SUPABASE_URL = 'https://csxgkxjeifakwslamglc.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg';
        
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // console.log('✅ Supabase inicializado correctamente');
    }

    async cargarEmpleados() {
        // ID del local MASSA Son Oliva
        const SON_OLIVA_LOCATION_ID = '781fd5a8-c486-4224-bd2a-bc968ad3f58c';
        
        const { data: empleados } = await this.supabase
            .from('employees')
            .select('id, name, role')
            .neq('role', 'admin')
            .eq('location_id', SON_OLIVA_LOCATION_ID)
            .order('name');
        
        this.empleados = empleados || [];
        // console.log(`👥 ${this.empleados.length} empleados cargados`);
    }

    async inicializarSistemaAnual() {
        // Esperar a que ConvenioAnualManager esté disponible
        while (typeof ConvenioAnualManager === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        this.convenioAnual = new ConvenioAnualManager(this.supabase);
        await this.convenioAnual.init();
        
        // Hacer disponible globalmente
        window.controlAnualSimple = this;
        
        // Esperar a que ausencias se inicialice externamente
        // console.log('⏳ Esperando inicialización externa de AusenciasManager...');
    }

    crearPanelSimple() {
        const panel = document.createElement('div');
        panel.id = 'controlAnualPanel';
        panel.innerHTML = `
            <div class="bg-white border-2 border-purple-200 rounded-lg shadow-lg mb-4">
                <!-- Header con botón de minimizar -->
                <div class="flex justify-between items-center p-4 pb-0">
                    <div class="text-center flex-1">
                        <h3 class="text-2xl font-bold text-purple-800">
                            📊 Control Anual del Convenio
                        </h3>
                        <p id="subtituloPanel" class="text-gray-600">Información para planificar horarios cumpliendo el convenio</p>
                    </div>
                    <button id="btnMinimizarPanel" class="ml-4 text-gray-500 hover:text-gray-700 transition p-2 rounded-lg hover:bg-gray-100" title="Minimizar/Maximizar panel">
                        <i id="iconoMinimizar" class="fas fa-chevron-up text-xl"></i>
                    </button>
                </div>
                
                <!-- Indicador cuando está minimizado -->
                <div id="indicadorMinimizado" class="hidden px-4 pb-2 cursor-pointer">
                    <div class="text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-2 hover:bg-gray-100 transition">
                        <i class="fas fa-chart-line mr-1"></i>
                        <span id="resumenMinimizado">Panel minimizado - Click para ver estadísticas</span>
                    </div>
                </div>
                
                <!-- Contenido del panel -->
                <div id="contenidoPanel" class="p-6 pt-4">
                
                <!-- Botones principales -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <button id="btnGestionarAusencias" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg transition font-medium text-lg">
                        <i class="fas fa-calendar-times mr-2"></i>Gestionar Ausencias
                    </button>
                    <button id="btnActualizarDatos" class="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg transition font-medium text-lg">
                        <i class="fas fa-sync mr-2"></i>Actualizar Datos
                    </button>
                </div>
                
                <!-- Estado de empleados -->
                <div id="estadoEmpleadosAnual" class="space-y-3">
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Cargando datos anuales...</p>
                    </div>
                </div>
                
                <!-- Información del convenio -->
                <div class="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-2">📋 Límites del Convenio</h4>
                    <div class="text-sm text-gray-600 space-y-1">
                        <div>• <strong>Máximo anual:</strong> 1.776 horas por empleado</div>
                        <div>• <strong>Máximo diario:</strong> 9 horas efectivas</div>
                        <div>• <strong>Descanso entre turnos:</strong> Mínimo 12 horas</div>
                        <div>• <strong>Descanso semanal:</strong> 1,5 días seguidos</div>
                    </div>
                </div>
                
                </div> <!-- Cierre del contenido del panel -->
            </div>
        `;

        // Insertar al inicio
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.insertBefore(panel, mainContent.firstChild);
        }

        // Eventos
        this.setupEventos();
        
        // Configurar funcionalidad de minimizar/maximizar
        this.setupMinimizarPanel();
        
        // Actualizar datos cada 5 minutos
        this.actualizarEstadoEmpleados();
        setInterval(() => this.actualizarEstadoEmpleados(), 300000);
    }

    setupEventos() {
        document.getElementById('btnGestionarAusencias').addEventListener('click', () => {
            if (window.ausenciasManager) {
                window.ausenciasManager.abrirModal();
            } else {
                alert('Sistema de ausencias no disponible aún. Espera unos segundos y vuelve a intentar.');
            }
        });

        document.getElementById('btnActualizarDatos').addEventListener('click', async () => {
            await this.actualizarDatos();
        });
    }

    setupMinimizarPanel() {
        const btnMinimizar = document.getElementById('btnMinimizarPanel');
        const contenidoPanel = document.getElementById('contenidoPanel');
        const iconoMinimizar = document.getElementById('iconoMinimizar');
        const indicadorMinimizado = document.getElementById('indicadorMinimizado');
        const subtituloPanel = document.getElementById('subtituloPanel');
        const resumenMinimizado = document.getElementById('resumenMinimizado');
        
        if (!btnMinimizar || !contenidoPanel || !iconoMinimizar || !indicadorMinimizado) {
            console.log('⚠️ Elementos del panel no encontrados');
            return;
        }

        // Cargar estado previo desde localStorage
        const estadoPrevio = localStorage.getItem('controlAnualPanelMinimizado');
        let isMinimizado = estadoPrevio === 'true';
        
        // Aplicar estado inicial
        this.aplicarEstadoPanel(isMinimizado);

        // Manejar click en el botón
        btnMinimizar.addEventListener('click', () => {
            isMinimizado = !isMinimizado;
            this.aplicarEstadoPanel(isMinimizado);
            
            // Guardar estado en localStorage
            localStorage.setItem('controlAnualPanelMinimizado', isMinimizado.toString());
        });
        
        // También permitir expandir haciendo click en el indicador
        indicadorMinimizado.addEventListener('click', () => {
            if (isMinimizado) {
                isMinimizado = false;
                this.aplicarEstadoPanel(isMinimizado);
                localStorage.setItem('controlAnualPanelMinimizado', isMinimizado.toString());
            }
        });
        
        console.log('✅ Funcionalidad de minimizar/maximizar configurada');
    }
    
    aplicarEstadoPanel(isMinimizado) {
        const contenidoPanel = document.getElementById('contenidoPanel');
        const iconoMinimizar = document.getElementById('iconoMinimizar');
        const indicadorMinimizado = document.getElementById('indicadorMinimizado');
        const subtituloPanel = document.getElementById('subtituloPanel');
        const resumenMinimizado = document.getElementById('resumenMinimizado');
        const btnMinimizar = document.getElementById('btnMinimizarPanel');
        
        if (isMinimizado) {
            // Minimizar con animación
            contenidoPanel.style.transition = 'all 0.3s ease';
            contenidoPanel.style.opacity = '0';
            contenidoPanel.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                contenidoPanel.classList.add('hidden');
                indicadorMinimizado.classList.remove('hidden');
                iconoMinimizar.classList.remove('fa-chevron-up');
                iconoMinimizar.classList.add('fa-chevron-down');
                btnMinimizar.title = 'Maximizar panel';
                
                // Actualizar resumen minimizado con datos actuales
                this.actualizarResumenMinimizado();
            }, 300);
            
        } else {
            // Maximizar con animación
            indicadorMinimizado.classList.add('hidden');
            contenidoPanel.classList.remove('hidden');
            contenidoPanel.style.opacity = '0';
            contenidoPanel.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                contenidoPanel.style.transition = 'all 0.3s ease';
                contenidoPanel.style.opacity = '1';
                contenidoPanel.style.transform = 'translateY(0)';
                iconoMinimizar.classList.remove('fa-chevron-down');
                iconoMinimizar.classList.add('fa-chevron-up');
                btnMinimizar.title = 'Minimizar panel';
            }, 10);
        }
    }
    
    actualizarResumenMinimizado() {
        const resumenMinimizado = document.getElementById('resumenMinimizado');
        if (!resumenMinimizado || !this.convenioAnual || !this.convenioAnual.stats_anuales) {
            return;
        }
        
        const stats = Object.values(this.convenioAnual.stats_anuales);
        const empleadosEquilibrados = stats.filter(s => s.estado_semanal === 'equilibrado').length;
        const empleadosConProblemas = stats.filter(s => s.estado_semanal === 'subcarga' || s.estado_semanal === 'sobrecarga').length;
        const empleadosAusentes = stats.filter(s => s.estado_semanal === 'de_ausencia').length;
        const totalPartidos = stats.reduce((sum, s) => sum + (s.total_partidos || 0), 0);
        const totalMañanas = stats.reduce((sum, s) => sum + (s.total_turnos_mañana || 0), 0);
        
        let textoResumen = `${stats.length} empleados`;
        if (empleadosEquilibrados > 0) textoResumen += ` • ${empleadosEquilibrados} equilibrados`;
        if (empleadosConProblemas > 0) textoResumen += ` • ${empleadosConProblemas} requieren ajustes`;
        if (empleadosAusentes > 0) textoResumen += ` • ${empleadosAusentes} ausentes`;
        if (totalPartidos > 0) textoResumen += ` • ${totalPartidos} partidos totales`;
        if (totalMañanas > 0) textoResumen += ` • ${totalMañanas} mañanas totales`;
        
        resumenMinimizado.textContent = textoResumen;
    }

    async actualizarDatos() {
        const btn = document.getElementById('btnActualizarDatos');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Actualizando...';
        btn.disabled = true;
        
        try {
            await this.convenioAnual.init();
            if (window.ausenciasManager) {
                await window.ausenciasManager.init();
            }
            this.actualizarEstadoEmpleados();
            
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Actualizado';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error actualizando:', error);
            btn.innerHTML = '<i class="fas fa-times mr-2"></i>Error';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
        }
    }

    actualizarEstadoEmpleados() {
        if (!this.convenioAnual || !this.convenioAnual.stats_anuales) {
            return;
        }

        const container = document.getElementById('estadoEmpleadosAnual');
        const stats = Object.values(this.convenioAnual.stats_anuales);
        
        // No mostrar tarjetas individuales - solo la sección de compensaciones
        const empleadosHtml = '';

        // Generar resumen de alertas de compensación
        const alertasCompensacion = this.generarResumenCompensacion(stats);
        
        container.innerHTML = empleadosHtml + alertasCompensacion;
        
        // Actualizar resumen minimizado si está minimizado
        this.actualizarResumenMinimizado();
    }

    generarResumenCompensacion(stats) {
        // Filtrar empleados por su estado de compensación histórica
        // INCLUIR empleados de ausencia para planificación (pero marcarlos especialmente)
        const empleadosConDatos = stats.filter(s => s.estado_semanal !== 'sin_datos');
        const empleadosSinDatos = stats.filter(s => s.estado_semanal === 'sin_datos');
        const empleadosDeAusencia = stats.filter(s => s.estado_semanal === 'de_ausencia');
        
        // Clasificar empleados (LÓGICA ORIGINAL + ausencias + empleados nuevos)
        const empleadosConSobrecarga = empleadosConDatos.filter(s => 
            s.estado_semanal === 'sobrecarga' || 
            (s.estado_semanal === 'de_ausencia' && s.diferencia_carga_trabajo > 5) ||
            (s.estado_semanal === 'empleado_nuevo' && s.diferencia_carga_trabajo > 5)
        );
        const empleadosConSubcarga = empleadosConDatos.filter(s => 
            (s.estado_semanal === 'subcarga' || 
            (s.estado_semanal === 'de_ausencia' && s.diferencia_carga_trabajo < -1) ||
            (s.estado_semanal === 'empleado_nuevo' && s.diferencia_carga_trabajo < -1)) &&
            !s.empleado_nombre.toUpperCase().includes('XISCA') // Excluir a Xisca
        );
        const empleadosEquilibrados = empleadosConDatos.filter(s => 
            s.estado_semanal === 'equilibrado' || 
            (s.estado_semanal === 'de_ausencia' && Math.abs(s.diferencia_carga_trabajo) <= 1) ||
            (s.estado_semanal === 'empleado_nuevo' && Math.abs(s.diferencia_carga_trabajo) <= 1)
        );

        // Debug: mostrar qué empleados están en cada categoría
        console.log('🔍 ===== ANÁLISIS COMPENSACIONES =====');
        console.log('📊 Empleados con sobrecarga:', empleadosConSobrecarga.map(s => s.empleado_nombre));
        console.log('📊 Empleados con subcarga:', empleadosConSubcarga.map(s => s.empleado_nombre));
        console.log('📊 Empleados equilibrados:', empleadosEquilibrados.map(s => s.empleado_nombre));
        console.log('📊 Empleados sin datos:', empleadosSinDatos.map(s => s.empleado_nombre));
        console.log('📊 Empleados de ausencia:', empleadosDeAusencia.map(s => s.empleado_nombre));

        // Información sobre empleados de ausencia (simplificada)
        let seccionAusencias = '';
        if (empleadosDeAusencia.length > 0) {
            seccionAusencias = `
                <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 class="font-medium text-blue-700 mb-2">🏖️ Empleados Ausentes:</h5>
                    <div class="text-sm text-blue-600">
                        ${empleadosDeAusencia.length} empleado${empleadosDeAusencia.length > 1 ? 's' : ''} actualmente ausente${empleadosDeAusencia.length > 1 ? 's' : ''} - Análisis histórico disponible arriba
                    </div>
                </div>
            `;
        }



        // Información sobre empleados sin datos
        let seccionSinDatos = '';
        if (empleadosSinDatos.length > 0) {
            seccionSinDatos = `
                <div class="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h5 class="font-medium text-gray-700 mb-2">📊 Empleados con Pocos Datos Históricos:</h5>
                    <div class="space-y-1 text-sm text-gray-600">
                        ${empleadosSinDatos.map(s => `
                            <div>• ${s.empleado_nombre}: Continuar con horarios normales (se necesitan más semanas completas)</div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Solo empleados equilibrados y con datos suficientes
        if (empleadosConSobrecarga.length === 0 && empleadosConSubcarga.length === 0 && empleadosConDatos.length > 0) {
            return seccionAusencias + seccionSinDatos + `
                <div class="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-green-800 mb-2">
                        ✅ Compensaciones Históricas Perfectas
                    </h4>
                    <p class="text-green-700">
                        ${empleadosConDatos.length > 1 ? 'Las empleadas están' : 'La empleada está'} en equilibrio histórico (cerca del ideal desde junio). 
                        ¡Excelente distribución de la carga de trabajo!
                    </p>
                </div>
            `;
        }

        if (empleadosConDatos.length === 0) {
            return seccionAusencias + seccionSinDatos + `
                <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-blue-800 mb-2">
                        📊 Análisis de Compensaciones Históricas
                    </h4>
                    <p class="text-blue-700">
                        Se necesitan más datos históricos para analizar patrones de compensación.
                        Continuar con horarios normales mientras se recopilan datos.
                    </p>
                </div>
            `;
        }

        // Mostrar sección de compensaciones históricas SIMPLIFICADA
        let compensacionesHtml = `
            <div class="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">
                    ⚖️ Compensaciones Necesarias para Próximos Horarios
                </h4>
        `;

        // Empleados que han trabajado MÁS (reducir carga)
        if (empleadosConSobrecarga.length > 0) {
            compensacionesHtml += `
                <div class="mb-4">
                    <h5 class="font-bold text-red-700 mb-2">🔻 DAR MENOS HORAS:</h5>
                    <div class="space-y-2">
            `;
            empleadosConSobrecarga
                .sort((a, b) => b.diferencia_carga_trabajo - a.diferencia_carga_trabajo)
                .forEach(s => {
                const mediaJornadaBadge = s.empleado_nombre.toUpperCase().includes('GABY')
                    ? '<span class="ml-2 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">25h/sem</span>'
                    : '';
                compensacionesHtml += `
                    <div class="bg-red-50 p-3 rounded flex justify-between items-center">
                        <div class="font-semibold text-red-800">
                            ${s.empleado_nombre} ${mediaJornadaBadge}
                            ${s.estado_semanal === 'de_ausencia' ? '(🏥 vuelve pronto)' : ''}
                            ${s.estado_semanal === 'empleado_nuevo' ? '(🆕 nuevo)' : ''}
                        </div>
                        <div class="text-sm">
                            <span class="text-red-600 font-bold">+${Math.abs(s.diferencia_carga_trabajo).toFixed(0)}h extra</span> | 
                            ${s.total_partidos || 0} partidos | 
                            ${s.total_turnos_mañana || 0} mañanas
                        </div>
                    </div>
                `;
            });
            compensacionesHtml += `
                    </div>
                </div>
            `;
        }

        // Empleados que han trabajado MENOS (aumentar carga)
        if (empleadosConSubcarga.length > 0) {
            compensacionesHtml += `
                <div class="mb-4">
                    <h5 class="font-bold text-blue-700 mb-2">🔺 DAR MÁS HORAS:</h5>
                    <div class="space-y-2">
            `;
            empleadosConSubcarga
                .sort((a, b) => a.diferencia_carga_trabajo - b.diferencia_carga_trabajo)
                .forEach(s => {
                const mediaJornadaBadge = s.empleado_nombre.toUpperCase().includes('GABY')
                    ? '<span class="ml-2 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">25h/sem</span>'
                    : '';
                compensacionesHtml += `
                    <div class="bg-blue-50 p-3 rounded flex justify-between items-center">
                        <div class="font-semibold text-blue-800">
                            ${s.empleado_nombre} ${mediaJornadaBadge}
                            ${s.estado_semanal === 'de_ausencia' ? '(🏥 vuelve pronto)' : ''}
                            ${s.estado_semanal === 'empleado_nuevo' ? '(🆕 nuevo)' : ''}
                        </div>
                        <div class="text-sm">
                            <span class="text-blue-600 font-bold">${Math.abs(s.diferencia_carga_trabajo).toFixed(0)}h menos</span> | 
                            ${s.total_partidos || 0} partidos | 
                            ${s.total_turnos_mañana || 0} mañanas
                        </div>
                    </div>
                `;
            });
            compensacionesHtml += `
                    </div>
                </div>
            `;
        }

        // Empleados equilibrados
        if (empleadosEquilibrados.length > 0) {
            compensacionesHtml += `
                <div class="mb-4">
                    <h5 class="font-bold text-green-700 mb-2">✅ MANTENER IGUAL:</h5>
                    <div class="space-y-2">
            `;
            empleadosEquilibrados.forEach(s => {
                const mediaJornadaBadge = s.empleado_nombre.toUpperCase().includes('GABY')
                    ? '<span class="ml-2 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">25h/sem</span>'
                    : '';
                compensacionesHtml += `
                    <div class="bg-green-50 p-3 rounded flex justify-between items-center">
                        <div class="font-semibold text-green-800">
                            ${s.empleado_nombre} ${mediaJornadaBadge}
                            ${s.estado_semanal === 'de_ausencia' ? '(🏥 vuelve pronto)' : ''}
                            ${s.estado_semanal === 'empleado_nuevo' ? '(🆕 nuevo)' : ''}
                        </div>
                        <div class="text-sm">
                            <span class="text-green-600 font-bold">equilibrado</span> | 
                            ${s.total_partidos || 0} partidos | 
                            ${s.total_turnos_mañana || 0} mañanas
                        </div>
                    </div>
                `;
            });
            compensacionesHtml += `
                    </div>
                </div>
            `;
        }

        compensacionesHtml += `
                <div class="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
                    💡 <strong>Objetivo:</strong> Compensar diferencias históricas desde desde la fecha de alta para que todas acaben cerca del ideal.
                </div>
            </div>
        `;

        return seccionAusencias + seccionSinDatos + compensacionesHtml;
    }

    calcularSemanasRestantes() {
        const ahora = new Date();
        const finAño = new Date('2025-12-31');
        const diasRestantes = Math.floor((finAño - ahora) / (1000 * 60 * 60 * 24));
        return Math.floor(diasRestantes / 7);
    }
}

// Instancia global
window.controlAnualSimple = new ControlAnualSimple(); 