/**
 * SISTEMA DE AUTENTICACIÓN MULTI-USUARIO CON ROLES
 * ==================================================
 * Gestiona login con usuario/contraseña y control de permisos
 * 
 * @author Forn Verge
 * @version 2.0
 */

class AuthMultiUser {
    constructor(supabase) {
        this.supabase = supabase;
        this.currentUser = null;
    }

    /**
     * Inicializa el sistema de autenticación
     */
    async init() {
        // Verificar si hay sesión guardada
        await this.checkSavedSession();
        
        if (this.currentUser) {
            console.log('✅ Sesión activa:', this.currentUser.username);
            return { authenticated: true, user: this.currentUser };
        } else {
            console.log('🔐 Sin sesión activa');
            return { authenticated: false };
        }
    }

    /**
     * Verificar sesión guardada
     */
    async checkSavedSession() {
        const savedUser = sessionStorage.getItem('admin_user');
        const savedTimestamp = sessionStorage.getItem('admin_session_timestamp');
        
        if (!savedUser || !savedTimestamp) {
            return false;
        }

        // Verificar que la sesión no haya expirado (8 horas)
        const sessionAge = Date.now() - parseInt(savedTimestamp);
        const EIGHT_HOURS = 8 * 60 * 60 * 1000;
        
        if (sessionAge > EIGHT_HOURS) {
            console.log('⏰ Sesión expirada');
            this.logout();
            return false;
        }

        try {
            const user = JSON.parse(savedUser);
            
            // Verificar que el usuario sigue activo en BD
            const { data, error } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('id', user.id)
                .eq('active', true)
                .single();

            if (error || !data) {
                console.log('❌ Usuario no válido en BD');
                this.logout();
                return false;
            }

            this.currentUser = data;
            window.currentUser = data; // Global para acceso fácil
            return true;

        } catch (error) {
            console.error('Error verificando sesión:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Login con usuario y contraseña
     */
    async login(username, password) {
        try {
            // Hash de la contraseña
            const passwordHash = await this.sha256(password);
            
            console.log('🔐 [LOGIN DEBUG]');
            console.log('  Usuario:', username);
            console.log('  Password ingresado:', password);
            console.log('  Hash generado:', passwordHash);
            
            // Buscar usuario en BD
            const { data, error } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('username', username.toLowerCase().trim())
                .eq('password_hash', passwordHash)
                .eq('active', true)
                .single();

            console.log('  Error:', error);
            console.log('  Data:', data);

            if (error || !data) {
                console.log('❌ Login fallido para:', username);
                console.log('❌ Error detalle:', error);
                return {
                    success: false,
                    error: 'Usuario o contraseña incorrectos'
                };
            }

            // Actualizar último login
            await this.supabase
                .from('admin_users')
                .update({ 
                    last_login: new Date().toISOString()
                })
                .eq('id', data.id);

            // Guardar sesión
            this.currentUser = data;
            window.currentUser = data;
            
            sessionStorage.setItem('admin_user', JSON.stringify(data));
            sessionStorage.setItem('admin_session_timestamp', Date.now().toString());

            console.log('✅ Login exitoso:', data.username, '- Rol:', data.role);

            return {
                success: true,
                user: data,
                needsLocationSelection: this.needsLocationSelection()
            };

        } catch (error) {
            console.error('❌ Error en login:', error);
            return {
                success: false,
                error: 'Error al conectar con el servidor'
            };
        }
    }

    /**
     * Cerrar sesión
     */
    logout() {
        this.currentUser = null;
        window.currentUser = null;
        
        sessionStorage.removeItem('admin_user');
        sessionStorage.removeItem('admin_session_timestamp');
        sessionStorage.removeItem('current_location');
        
        console.log('🚪 Sesión cerrada');
    }

    /**
     * Verificar si el usuario necesita seleccionar local
     */
    needsLocationSelection() {
        if (!this.currentUser) return false;
        
        // Owner sin local asignado = puede elegir
        return this.currentUser.role === 'owner' && 
               this.currentUser.assigned_location_id === null;
    }

    /**
     * Obtener locales accesibles por el usuario
     */
    async getAccessibleLocations() {
        if (!this.currentUser) return [];

        try {
            const { data, error } = await this.supabase
                .rpc('get_accessible_locations', { 
                    p_user_id: this.currentUser.id 
                });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('❌ Error obteniendo locales:', error);
            return [];
        }
    }

    /**
     * Verificar permiso específico
     */
    hasPermission(module, action) {
        if (!this.currentUser) return false;
        
        // Owner tiene todos los permisos
        if (this.currentUser.role === 'owner') {
            return true;
        }

        // Verificar en permisos JSON
        const permissions = this.currentUser.permissions || {};
        return permissions[module]?.[action] === true;
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * SHA-256 hash
     */
    async sha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// Exportar a window
window.AuthMultiUser = AuthMultiUser;

