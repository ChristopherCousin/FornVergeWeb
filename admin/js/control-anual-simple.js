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
            console.log('⏳ Esperando Supabase...');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Inicializar igual que en admin-horarios.js
        const SUPABASE_URL = 'https://csxgkxjeifakwslamglc.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg';
        
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase inicializado correctamente');
    }

    async cargarEmpleados() {
        const { data: empleados } = await this.supabase
            .from('employees')
            .select('id, name, role')
            .neq('role', 'admin')
            .order('name');
        
        this.empleados = empleados || [];
        console.log(`👥 ${this.empleados.length} empleados cargados`);
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
        console.log('⏳ Esperando inicialización externa de AusenciasManager...');
    }

    crearPanelSimple() {
        const panel = document.createElement('div');
        panel.id = 'controlAnualPanel';
        panel.innerHTML = `
            <div class="bg-white border-2 border-purple-200 rounded-lg shadow-lg p-6 mb-4">
                <div class="text-center mb-6">
                    <h3 class="text-2xl font-bold text-purple-800">
                        📊 Control Anual del Convenio
                    </h3>
                    <p class="text-gray-600">Información para planificar horarios cumpliendo el convenio</p>
                </div>
                
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
            </div>
        `;

        // Insertar al inicio
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.insertBefore(panel, mainContent.firstChild);
        }

        // Eventos
        this.setupEventos();
        
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
        
        // Generar tarjetas de empleados
        const empleadosHtml = stats.map(empleadoStats => {
            const progreso = (empleadoStats.total_horas_año / 1776 * 100);
            const horasRestantes = Math.max(0, 1776 - empleadoStats.total_horas_año);
            const mediaSemanal = empleadoStats.media_semanal_real || 0;
            const diferenciaCarga = empleadoStats.diferencia_carga_trabajo || 0;
            
            // Colores y estados según la compensación histórica
            let colorBorde = 'green';
            let estado = '✅ Equilibrio perfecto';
            let alertaCompensacion = '';
            
            // Caso especial: Empleado de ausencia (vacaciones, baja, etc.)
            if (empleadoStats.estado_semanal === 'de_ausencia') {
                // Calcular qué tal lo hizo ANTES de la ausencia
                const diferenciaCarga = empleadoStats.diferencia_carga_trabajo || 0;
                let estadoTrabajo = '';
                let colorCompensacion = 'blue';
                
                if (Math.abs(diferenciaCarga) <= 15) {
                    estadoTrabajo = `Equilibrio perfecto (${diferenciaCarga >= 0 ? '+' : ''}${diferenciaCarga.toFixed(0)}h vs ideal)`;
                    colorCompensacion = 'green';
                } else if (diferenciaCarga > 15) {
                    estadoTrabajo = `Trabajó MUCHO (+${diferenciaCarga.toFixed(0)}h vs ideal)`;
                    colorCompensacion = 'orange';
                } else {
                    estadoTrabajo = `Trabajó POCO (${diferenciaCarga.toFixed(0)}h vs ideal)`;
                    colorCompensacion = 'yellow';
                }
                
                return `
                    <div class="border-l-4 border-blue-500 bg-white p-4 rounded-r-lg shadow-sm">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h5 class="text-lg font-semibold text-gray-900">${empleadoStats.empleado_nombre}</h5>
                                <div class="mt-2 space-y-1">
                                    <div class="flex justify-between text-sm">
                                        <span>Horas trabajadas (desde junio):</span>
                                        <span class="font-medium text-gray-900">${empleadoStats.horas_reales_agora.toFixed(0)}h</span>
                                    </div>
                                    <div class="flex justify-between text-sm">
                                        <span>Progreso del convenio:</span>
                                        <span class="font-medium text-gray-600">${progreso.toFixed(1)}% (${empleadoStats.total_horas_año.toFixed(0)}h / 1.776h)</span>
                                    </div>
                                    <div class="flex justify-between text-sm">
                                        <span>Compensación histórica:</span>
                                        <span class="font-medium text-${colorCompensacion}-600">${estadoTrabajo}</span>
                                    </div>
                                </div>
                                
                                <!-- Nota de ausencia discreta -->
                                <div class="mt-3 p-2 rounded-lg bg-blue-50 text-blue-700">
                                    <div class="text-sm">🏖️ Actualmente ausente - Análisis histórico disponible</div>
                                </div>
                                
                                <!-- Barra de progreso -->
                                <div class="mt-3">
                                    <div class="bg-gray-200 rounded-full h-2">
                                        <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                             style="width: ${Math.min(progreso, 100)}%"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="ml-4 text-right">
                                <div class="text-2xl">🏖️</div>
                                <div class="text-xs text-gray-500">Ausente</div>
                            </div>
                        </div>
                    </div>
                `;
            }
            // Caso especial: Sin datos suficientes
            else if (empleadoStats.estado_semanal === 'sin_datos') {
                colorBorde = 'gray';
                estado = '📊 Sin datos';
                alertaCompensacion = empleadoStats.recomendacion_compensacion || 'Pocos datos históricos - Continuar con horarios normales';
            }
            // Prioridad 1: Estado crítico por límite anual
            else if (progreso > 95) {
                colorBorde = 'red';
                estado = '🔴 CRÍTICO';
                alertaCompensacion = '⛔ NO programar más horas';
            } else if (progreso > 85) {
                colorBorde = 'orange';
                estado = '⚠️ Cuidado';
                alertaCompensacion = `⚠️ Máximo ${empleadoStats.horas_recomendadas_semana.toFixed(0)}h/semana`;
            } 
            // Prioridad 2: Estados de compensación histórica
            else if (empleadoStats.estado_semanal === 'sobrecarga') {
                colorBorde = 'red';
                estado = '🔥 Ha trabajado MUCHO';
                alertaCompensacion = empleadoStats.recomendacion_compensacion;
            } else if (empleadoStats.estado_semanal === 'subcarga') {
                colorBorde = 'orange';
                estado = '⚠️ Ha trabajado POCO';
                alertaCompensacion = empleadoStats.recomendacion_compensacion;
            } else if (empleadoStats.estado_semanal === 'equilibrado') {
                colorBorde = 'green';
                estado = '✅ Equilibrio perfecto';
                alertaCompensacion = empleadoStats.recomendacion_compensacion || `Continuar con el ritmo actual`;
            } else {
                // Estado por defecto
                alertaCompensacion = `✅ Puede hacer ${empleadoStats.horas_recomendadas_semana.toFixed(0)}h/semana`;
            }
            
            return `
                <div class="border-l-4 border-${colorBorde}-500 bg-white p-4 rounded-r-lg shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h5 class="text-lg font-semibold text-gray-900">${empleadoStats.empleado_nombre}</h5>
                            <div class="mt-2 space-y-1">
                                <div class="flex justify-between text-sm">
                                    <span>Horas trabajadas (desde junio):</span>
                                    <span class="font-medium text-gray-900">${empleadoStats.horas_reales_agora.toFixed(0)}h</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>Media semanal real:</span>
                                    <span class="font-medium ${empleadoStats.estado_semanal === 'sin_datos' ? 'text-gray-500' : 
                                        empleadoStats.estado_semanal === 'subcarga' || empleadoStats.estado_semanal === 'sobrecarga' ? 'text-' + colorBorde + '-600' : 'text-green-600'}">${mediaSemanal.toFixed(1)}h/semana ${empleadoStats.estado_semanal === 'sin_datos' ? '(pocos datos)' : ''}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>Progreso del convenio:</span>
                                    <span class="font-medium text-gray-600">${progreso.toFixed(1)}% (${empleadoStats.total_horas_año.toFixed(0)}h / 1.776h)</span>
                                </div>
                            </div>
                            
                            <!-- Alerta de compensación -->
                            <div class="mt-3 p-2 rounded-lg ${colorBorde === 'red' ? 'bg-red-50 text-red-800' : 
                                                                colorBorde === 'orange' ? 'bg-orange-50 text-orange-800' :
                                                                colorBorde === 'yellow' ? 'bg-yellow-50 text-yellow-800' :
                                                                colorBorde === 'gray' ? 'bg-gray-50 text-gray-700' :
                                                                'bg-green-50 text-green-800'}">
                                <div class="text-sm font-medium">${alertaCompensacion}</div>
                            </div>
                            
                            <!-- Barra de progreso -->
                            <div class="mt-3">
                                <div class="bg-gray-200 rounded-full h-2">
                                    <div class="bg-${colorBorde}-500 h-2 rounded-full transition-all duration-300" 
                                         style="width: ${Math.min(progreso, 100)}%"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="ml-4 text-right">
                            <div class="text-2xl">${estado.split(' ')[0]}</div>
                            <div class="text-xs text-gray-500">${estado.split(' ').slice(1).join(' ')}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Generar resumen de alertas de compensación
        const alertasCompensacion = this.generarResumenCompensacion(stats);
        
        container.innerHTML = empleadosHtml + alertasCompensacion;
    }

    generarResumenCompensacion(stats) {
        // Filtrar empleados por su estado de compensación histórica
        const empleadosConDatos = stats.filter(s => s.estado_semanal !== 'sin_datos' && s.estado_semanal !== 'de_ausencia');
        const empleadosSinDatos = stats.filter(s => s.estado_semanal === 'sin_datos');
        const empleadosDeAusencia = stats.filter(s => s.estado_semanal === 'de_ausencia');
        
        const empleadosConSobrecarga = empleadosConDatos.filter(s => s.estado_semanal === 'sobrecarga');
        const empleadosConSubcarga = empleadosConDatos.filter(s => s.estado_semanal === 'subcarga');
        const empleadosEquilibrados = empleadosConDatos.filter(s => s.estado_semanal === 'equilibrado');

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

        // Mostrar sección de compensaciones históricas detallada
        return seccionAusencias + seccionSinDatos + `
            <div class="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-orange-800 mb-3">
                    ⚖️ Compensaciones Históricas Necesarias (Desde Junio)
                </h4>
                
                ${empleadosConSobrecarga.length > 0 ? `
                    <div class="mb-3">
                        <h5 class="font-medium text-red-700 mb-2">🔻 Reducir carga futura (han trabajado MÁS del ideal):</h5>
                        <div class="space-y-1 text-sm">
                            ${empleadosConSobrecarga.map(s => `
                                <div class="flex justify-between text-red-600">
                                    <span>• ${s.empleado_nombre}:</span>
                                    <span>${s.horas_reales_agora.toFixed(0)}h trabajadas (+${s.diferencia_carga_trabajo.toFixed(0)}h vs ideal)</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${empleadosConSubcarga.length > 0 ? `
                    <div class="mb-3">
                        <h5 class="font-medium text-blue-700 mb-2">🔺 Aumentar carga futura (han trabajado MENOS del ideal):</h5>
                        <div class="space-y-1 text-sm">
                            ${empleadosConSubcarga.map(s => `
                                <div class="flex justify-between text-blue-600">
                                    <span>• ${s.empleado_nombre}:</span>
                                    <span>${s.horas_reales_agora.toFixed(0)}h trabajadas (${s.diferencia_carga_trabajo.toFixed(0)}h vs ideal)</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${empleadosEquilibrados.length > 0 ? `
                    <div class="mb-3">
                        <h5 class="font-medium text-green-700 mb-2">✅ En equilibrio histórico:</h5>
                        <div class="space-y-1 text-sm">
                            ${empleadosEquilibrados.map(s => `
                                <div class="flex justify-between text-green-600">
                                    <span>• ${s.empleado_nombre}:</span>
                                    <span>${s.horas_reales_agora.toFixed(0)}h trabajadas (${s.diferencia_carga_trabajo >= 0 ? '+' : ''}${s.diferencia_carga_trabajo.toFixed(0)}h vs ideal)</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="mt-3 p-2 bg-orange-100 rounded text-sm text-orange-800">
                    💡 <strong>Objetivo:</strong> Compensar en las próximas semanas para que todas acaben cerca del ideal (~40.8h/semana promedio desde junio).
                    <br>📊 <strong>Análisis:</strong> Basado en horas reales trabajadas vs. lo que deberían haber trabajado desde el 06/06/2025.
                </div>
            </div>
        `;
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