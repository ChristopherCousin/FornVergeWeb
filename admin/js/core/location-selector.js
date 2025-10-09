/**
 * SELECTOR DE LOCALES
 * ====================
 * Permite al owner seleccionar entre múltiples locales
 * Los managers cargan automáticamente su local asignado
 * 
 * @author Forn Verge
 * @version 1.0
 */

class LocationSelector {
    constructor(authSystem, supabase) {
        this.auth = authSystem;
        this.supabase = supabase;
        this.currentLocation = null;
        this.availableLocations = [];
    }

    /**
     * Inicializar selector de locales
     */
    async init() {
        const user = this.auth.getCurrentUser();
        
        if (!user) {
            console.error('❌ No hay usuario autenticado');
            return { success: false };
        }

        // Cargar locales accesibles
        this.availableLocations = await this.auth.getAccessibleLocations();

        if (this.availableLocations.length === 0) {
            console.error('❌ Usuario sin locales asignados');
            return { success: false, error: 'No tienes acceso a ningún local' };
        }

        // Si solo tiene un local, seleccionarlo automáticamente
        if (this.availableLocations.length === 1) {
            await this.selectLocation(this.availableLocations[0].location_id);
            return { 
                success: true, 
                autoSelected: true,
                location: this.currentLocation 
            };
        }

        // Si tiene varios, verificar si hay uno guardado
        const savedLocationId = sessionStorage.getItem('current_location_id');
        const savedLocation = this.availableLocations.find(l => l.location_id === savedLocationId);

        if (savedLocation) {
            await this.selectLocation(savedLocation.location_id);
            return { 
                success: true, 
                restored: true,
                location: this.currentLocation 
            };
        }

        // Necesita seleccionar
        return { 
            success: true, 
            needsSelection: true,
            locations: this.availableLocations 
        };
    }

    /**
     * Seleccionar un local
     */
    async selectLocation(locationId) {
        const location = this.availableLocations.find(l => l.location_id === locationId);
        
        if (!location) {
            console.error('❌ Local no accesible:', locationId);
            return false;
        }

        // Verificar que el usuario puede acceder a este local
        const { data, error } = await this.supabase
            .rpc('user_can_access_location', {
                p_user_id: this.auth.getCurrentUser().id,
                p_location_id: locationId
            });

        if (error || !data) {
            console.error('❌ Sin permisos para este local');
            return false;
        }

        // Guardar local seleccionado EN TODAS PARTES
        this.currentLocation = location;
        window.currentLocation = location;
        
        // IMPORTANTE: Usar setCurrentLocation para sincronizar con state.js
        if (typeof setCurrentLocation === 'function') {
            setCurrentLocation(location);
        }
        
        sessionStorage.setItem('current_location_id', locationId);
        sessionStorage.setItem('current_location', JSON.stringify(location));

        // Actualizar en BD el último local accedido
        await this.supabase
            .from('admin_users')
            .update({ last_location_accessed: locationId })
            .eq('id', this.auth.getCurrentUser().id);

        console.log(`✅ [LocationSelector] Local seleccionado: ${location.location_name}`);

        return true;
    }

    /**
     * Cambiar de local (solo para owners con múltiples locales)
     */
    async changeLocation(locationId) {
        if (!this.auth.getCurrentUser() || this.availableLocations.length <= 1) {
            console.log('⚠️ No puede cambiar de local');
            return false;
        }

        const prevLocation = this.currentLocation?.location_name;
        const newLocation = this.availableLocations.find(l => l.location_id === locationId);
        
        console.log(`🔄 [LocationSelector] Cambiando de local: ${prevLocation} → ${newLocation?.location_name}`);

        const success = await this.selectLocation(locationId);
        
        if (success) {
            // Limpiar estado antes del reload
            console.log('🧹 [LocationSelector] Limpiando estado antes del reload...');
            
            if (window.stateManager) {
                window.stateManager.reset();
            }
            
            // Recargar la página después de guardar el nuevo local
            console.log('🔄 [LocationSelector] Recargando aplicación...');
            
            // Esperar un poquito para que se guarde en sessionStorage
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }

        return success;
    }

    /**
     * Obtener local actual
     */
    getCurrentLocation() {
        return this.currentLocation;
    }

    /**
     * Obtener ID del local actual
     */
    getCurrentLocationId() {
        return this.currentLocation?.location_id || null;
    }

    /**
     * Obtener todos los locales accesibles
     */
    getAvailableLocations() {
        return this.availableLocations;
    }

    /**
     * Verificar si puede cambiar de local
     */
    canChangeLocation() {
        return this.availableLocations.length > 1;
    }

    /**
     * Crear UI del selector de locales
     */
    renderLocationSelector() {
        const modal = document.createElement('div');
        modal.id = 'locationSelectorModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8" style="max-height: 90vh; overflow-y: auto;">
                <div class="text-center mb-8">
                    <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <i class="fas fa-store text-4xl text-white"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">Selecciona un Local</h2>
                    <p class="text-gray-600 text-lg">¿Con qué local deseas trabajar?</p>
                </div>
                
                <div class="space-y-4" id="locationsList">
                    ${this.availableLocations.map(loc => `
                        <button 
                            onclick="window.locationSelector.selectAndContinue('${loc.location_id}')"
                            class="group w-full p-6 bg-white border-3 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left transform hover:scale-105"
                            style="display: block; width: 100%; border-width: 3px;"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 bg-blue-100 group-hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                                        <i class="fas fa-map-marker-alt text-2xl text-blue-600 group-hover:text-white transition-colors"></i>
                                    </div>
                                    <div>
                                        <div class="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">${loc.location_name}</div>
                                        <div class="text-sm text-gray-500 uppercase tracking-wider font-medium mt-1">${loc.location_slug}</div>
                                    </div>
                                </div>
                                <i class="fas fa-arrow-right text-2xl text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
                            </div>
                        </button>
                    `).join('')}
                </div>
                
                <div class="mt-6 text-center text-sm text-gray-500">
                    <i class="fas fa-info-circle mr-1"></i>
                    Puedes cambiar de local en cualquier momento desde el menú superior
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * Seleccionar y continuar
     */
    async selectAndContinue(locationId) {
        const success = await this.selectLocation(locationId);
        
        if (success) {
            // Cerrar modal
            const modal = document.getElementById('locationSelectorModal');
            if (modal) modal.remove();

            // Emitir evento de local seleccionado
            window.dispatchEvent(new CustomEvent('locationSelected', { 
                detail: this.currentLocation 
            }));
        }
    }
}

// Exportar a window
window.LocationSelector = LocationSelector;

