/**
 * MÓDULO DE GESTIÓN DE EMPLEADOS - FORN VERGE
 * ============================================
 * Maneja toda la lógica relacionada con empleados
 */

import { isValidEmployeeName, isValidEmployeeId, isValidAccessCode, sanitizeText } from '../utils/validation.js';
import { showToast } from '../utils/helpers.js';

export class EmployeesModule {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.employees = [];
        this.isModalOpen = false;
        
        // Referencias DOM
        this.modal = null;
        this.form = null;
        this.listContainer = null;
        
        this.setupElements();
    }

    /**
     * Inicializa el módulo
     */
    async init() {
        console.log('👥 Inicializando módulo de empleados...');
        this.setupEventListeners();
        await this.loadEmployees();
    }

    /**
     * Configura referencias a elementos DOM
     */
    setupElements() {
        this.modal = document.getElementById('employeesModal');
        this.form = document.getElementById('newEmployeeForm');
        this.listContainer = document.getElementById('employeesListContainer');
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botón para abrir modal
        const openBtn = document.getElementById('employeesBtn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.openModal());
        }

        // Botones para cerrar modal
        const closeBtn1 = document.getElementById('closeEmployeesModal');
        const closeBtn2 = document.querySelector('#employeesModal .modal-close');
        
        if (closeBtn1) closeBtn1.addEventListener('click', () => this.closeModal());
        if (closeBtn2) closeBtn2.addEventListener('click', () => this.closeModal());

        // Cerrar al hacer click fuera
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }

        // Formulario de nuevo empleado
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleCreateEmployee(e));
        }

        // Validación en tiempo real del ID de empleado
        const employeeIdInput = document.getElementById('employeeLoginId');
        if (employeeIdInput) {
            employeeIdInput.addEventListener('input', (e) => {
                // Convertir a minúsculas y limpiar
                e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
            });
        }
    }

    /**
     * Carga la lista de empleados
     */
    async loadEmployees() {
        try {
            this.employees = await this.dataManager.loadEmployees();
            console.log(`📋 ${this.employees.length} empleados cargados`);
        } catch (error) {
            console.error('Error cargando empleados:', error);
            this.employees = [];
        }
    }

    /**
     * Abre el modal de gestión de empleados
     */
    async openModal() {
        if (this.isModalOpen) return;
        
        this.isModalOpen = true;
        await this.loadEmployees();
        this.renderEmployeesList();
        
        if (this.modal) {
            this.modal.style.display = 'block';
        }
    }

    /**
     * Cierra el modal
     */
    closeModal() {
        this.isModalOpen = false;
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        this.resetForm();
    }

    /**
     * Renderiza la lista de empleados en el modal
     */
    renderEmployeesList() {
        if (!this.listContainer) return;

        if (this.employees.length === 0) {
            this.listContainer.innerHTML = '<p class="text-gray-500">No hay empleados registrados.</p>';
            return;
        }

        const html = this.employees.map(employee => `
            <div class="employee-item" data-employee-id="${employee.id}">
                <div class="employee-info">
                    <div class="employee-name">${sanitizeText(employee.name)}</div>
                    <div class="employee-details">
                        <small class="text-gray-500">
                            ID: ${sanitizeText(employee.employee_id || 'Sin ID')} | 
                            Alta: ${employee.fecha_alta ? new Date(employee.fecha_alta).toLocaleDateString() : 'No definida'}
                        </small>
                    </div>
                </div>
                <div class="employee-actions">
                    <button class="btn-edit" title="Editar Preferencias" 
                            onclick="employeesModule.openPreferencesModal('${employee.id}', '${sanitizeText(employee.name)}')">
                        <i class="fas fa-sliders-h"></i>
                    </button>
                    <button class="btn-delete" title="Eliminar Empleado" 
                            onclick="employeesModule.confirmDeleteEmployee('${employee.id}', '${sanitizeText(employee.name)}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.listContainer.innerHTML = html;
    }

    /**
     * Maneja la creación de un nuevo empleado
     * @param {Event} event - Evento del formulario
     */
    async handleCreateEmployee(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const employeeData = {
            name: sanitizeText(formData.get('name') || ''),
            employee_id: sanitizeText(formData.get('employee_id') || '').toLowerCase(),
            access_code: btoa(formData.get('access_code') || ''), // Codificar en base64
            fecha_alta: formData.get('fecha_alta') || new Date().toISOString().split('T')[0]
        };

        // Validaciones
        if (!this.validateEmployeeData(employeeData)) {
            return;
        }

        try {
            // Verificar que el ID de empleado no esté duplicado
            const existingEmployee = this.employees.find(emp => 
                emp.employee_id && emp.employee_id.toLowerCase() === employeeData.employee_id
            );
            
            if (existingEmployee) {
                showToast('Ya existe un empleado con ese ID de acceso', 'error');
                return;
            }

            // Crear empleado
            const newEmployee = await this.dataManager.createEmployee(employeeData);
            
            // Actualizar lista local
            this.employees.push(newEmployee);
            
            // Re-renderizar lista
            this.renderEmployeesList();
            
            // Limpiar formulario
            this.resetForm();
            
            // Notificar éxito
            showToast(`Empleado ${employeeData.name} creado correctamente`, 'success');
            
            // Recargar empleados en la app principal
            if (window.app) {
                await window.app.reloadEmployees();
            }

        } catch (error) {
            console.error('Error creando empleado:', error);
            showToast('Error al crear el empleado', 'error');
        }
    }

    /**
     * Valida los datos del empleado
     * @param {Object} employeeData - Datos a validar
     * @returns {boolean} True si es válido
     */
    validateEmployeeData(employeeData) {
        if (!isValidEmployeeName(employeeData.name)) {
            showToast('El nombre debe tener al menos 2 caracteres', 'error');
            return false;
        }

        if (!isValidEmployeeId(employeeData.employee_id)) {
            showToast('El ID debe tener al menos 3 caracteres y solo contener letras y números', 'error');
            return false;
        }

        if (!isValidAccessCode(atob(employeeData.access_code))) {
            showToast('El código de acceso debe tener al menos 4 caracteres', 'error');
            return false;
        }

        return true;
    }

    /**
     * Resetea el formulario
     */
    resetForm() {
        if (this.form) {
            this.form.reset();
            
            // Establecer fecha actual por defecto
            const dateInput = document.getElementById('employeeStartDate');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }
    }

    /**
     * Confirma y elimina un empleado
     * @param {string} employeeId - ID del empleado
     * @param {string} employeeName - Nombre del empleado
     */
    async confirmDeleteEmployee(employeeId, employeeName) {
        if (!window.Swal) {
            if (!confirm(`¿Estás seguro de que quieres eliminar a ${employeeName}?`)) {
                return;
            }
        } else {
            const result = await window.Swal.fire({
                title: '¿Eliminar empleado?',
                text: `Se eliminará permanentemente a ${employeeName}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) return;
        }

        try {
            await this.dataManager.deleteEmployee(employeeId);
            
            // Actualizar lista local
            this.employees = this.employees.filter(emp => emp.id !== employeeId);
            
            // Re-renderizar lista
            this.renderEmployeesList();
            
            showToast(`${employeeName} ha sido eliminado`, 'success');
            
            // Recargar empleados en la app principal
            if (window.app) {
                await window.app.reloadEmployees();
            }

        } catch (error) {
            console.error('Error eliminando empleado:', error);
            showToast('Error al eliminar el empleado', 'error');
        }
    }

    /**
     * Abre el modal de preferencias de empleado
     * @param {string} employeeId - ID del empleado
     * @param {string} employeeName - Nombre del empleado
     */
    async openPreferencesModal(employeeId, employeeName) {
        // Esta funcionalidad se implementará en una futura iteración
        // Por ahora, mostrar un mensaje
        showToast('Funcionalidad de preferencias en desarrollo', 'info');
        
        // TODO: Implementar modal de preferencias
        console.log(`Abrir preferencias para ${employeeName} (${employeeId})`);
    }

    /**
     * Obtiene un empleado por ID
     * @param {string} employeeId - ID del empleado
     * @returns {Object|null} Empleado encontrado
     */
    getEmployeeById(employeeId) {
        return this.employees.find(emp => emp.id === employeeId) || null;
    }

    /**
     * Obtiene todos los empleados
     * @returns {Array} Lista de empleados
     */
    getAllEmployees() {
        return [...this.employees];
    }
}
