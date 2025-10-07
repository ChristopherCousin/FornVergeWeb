/**
 * SISTEMA DE PERMISOS
 * ====================
 * Helpers para verificar permisos y ocultar/mostrar elementos según rol
 * 
 * @author Forn Verge
 * @version 1.0
 */

class PermissionsManager {
    constructor(authSystem) {
        this.auth = authSystem;
    }

    /**
     * Verificar si tiene permiso
     */
    hasPermission(module, action) {
        return this.auth.hasPermission(module, action);
    }

    /**
     * Verificar si es owner
     */
    isOwner() {
        const user = this.auth.getCurrentUser();
        return user?.role === 'owner';
    }

    /**
     * Verificar si es manager
     */
    isManager() {
        const user = this.auth.getCurrentUser();
        return user?.role === 'manager';
    }

    /**
     * Verificar si es supervisor
     */
    isSupervisor() {
        const user = this.auth.getCurrentUser();
        return user?.role === 'supervisor';
    }

    /**
     * Ocultar elemento si no tiene permiso
     */
    hideIfNoPermission(elementId, module, action) {
        if (!this.hasPermission(module, action)) {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.display = 'none';
                console.log(`🔒 Elemento oculto por permisos: ${elementId}`);
            }
        }
    }

    /**
     * Deshabilitar elemento si no tiene permiso
     */
    disableIfNoPermission(elementId, module, action) {
        if (!this.hasPermission(module, action)) {
            const element = document.getElementById(elementId);
            if (element) {
                element.disabled = true;
                element.classList.add('opacity-50', 'cursor-not-allowed');
                element.title = 'No tienes permisos para esta acción';
                console.log(`🔒 Elemento deshabilitado: ${elementId}`);
            }
        }
    }

    /**
     * Aplicar permisos a la interfaz
     */
    applyPermissionsToUI() {
        const user = this.auth.getCurrentUser();
        
        if (!user) {
            console.error('❌ No hay usuario para aplicar permisos');
            return;
        }

        console.log(`🔐 Aplicando permisos para rol: ${user.role}`);

        // Liquidaciones - Solo owner
        if (!this.hasPermission('liquidaciones', 'ver')) {
            this.hideIfNoPermission('liquidacionesPanel', 'liquidaciones', 'ver');
            this.hideIfNoPermission('btnNuevaLiquidacion', 'liquidaciones', 'registrar');
        }

        // Editar tarifa de empleados - Solo owner
        if (!this.hasPermission('empleados', 'editar_tarifa')) {
            // Ocultar campos de tarifa en formularios de empleados
            const tarifaInputs = document.querySelectorAll('[data-permission="editar_tarifa"]');
            tarifaInputs.forEach(input => {
                input.style.display = 'none';
            });
        }

        // Eliminar empleados - Solo owner
        if (!this.hasPermission('empleados', 'eliminar')) {
            const deleteButtons = document.querySelectorAll('[data-action="delete-employee"]');
            deleteButtons.forEach(btn => {
                btn.style.display = 'none';
            });
        }

        // Modificar configuración del convenio - Solo owner
        if (!this.hasPermission('convenio', 'modificar_config')) {
            const configButtons = document.querySelectorAll('[data-permission="modify-convenio-config"]');
            configButtons.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
            });
        }

        // Mostrar indicador de rol en header
        this.showRoleIndicator();
    }

    /**
     * Mostrar indicador de rol del usuario
     */
    showRoleIndicator() {
        const user = this.auth.getCurrentUser();
        if (!user) return;

        const roleNames = {
            owner: 'Dueño',
            manager: 'Gerente',
            supervisor: 'Supervisor'
        };

        const roleColors = {
            owner: 'bg-red-100 text-red-800',
            manager: 'bg-blue-100 text-blue-800',
            supervisor: 'bg-green-100 text-green-800'
        };

        // Buscar donde mostrar el indicador (en el header)
        const header = document.getElementById('mainHeader');
        if (!header) return;

        // Verificar si ya existe
        let roleIndicator = document.getElementById('roleIndicator');
        
        if (!roleIndicator) {
            roleIndicator = document.createElement('div');
            roleIndicator.id = 'roleIndicator';
            roleIndicator.className = `px-3 py-1 rounded-full text-sm font-semibold ${roleColors[user.role]}`;
            
            // Insertar en el header
            const headerContainer = header.querySelector('.max-w-7xl');
            if (headerContainer) {
                const userInfo = document.createElement('div');
                userInfo.className = 'flex items-center space-x-3';
                userInfo.innerHTML = `
                    <span class="text-sm text-blue-200">${user.full_name}</span>
                    <div id="roleIndicator" class="${roleColors[user.role]} px-3 py-1 rounded-full text-sm font-semibold">
                        ${roleNames[user.role]}
                    </div>
                `;
                headerContainer.appendChild(userInfo);
            }
        }
    }

    /**
     * Obtener descripción del permiso
     */
    getPermissionDescription(module, action) {
        const descriptions = {
            liquidaciones: {
                ver: 'Ver liquidaciones de horas extra',
                registrar: 'Registrar pagos de horas extra',
                editar: 'Editar liquidaciones existentes',
                eliminar: 'Eliminar liquidaciones'
            },
            horarios: {
                ver: 'Ver horarios',
                editar: 'Editar horarios',
                eliminar: 'Eliminar horarios',
                generar: 'Usar generador automático'
            },
            empleados: {
                ver: 'Ver empleados',
                crear: 'Crear nuevos empleados',
                editar: 'Editar datos de empleados',
                eliminar: 'Eliminar empleados',
                editar_tarifa: 'Modificar tarifa por hora'
            },
            convenio: {
                ver: 'Ver estadísticas del convenio',
                modificar_config: 'Modificar configuración del convenio'
            },
            ausencias: {
                ver: 'Ver ausencias',
                gestionar: 'Aprobar/rechazar ausencias'
            }
        };

        return descriptions[module]?.[action] || 'Permiso desconocido';
    }
}

// Helper functions globales
window.hasPermission = function(module, action) {
    return window.permissionsManager?.hasPermission(module, action) || false;
};

window.isOwner = function() {
    return window.permissionsManager?.isOwner() || false;
};

window.isManager = function() {
    return window.permissionsManager?.isManager() || false;
};

// Exportar a window
window.PermissionsManager = PermissionsManager;

