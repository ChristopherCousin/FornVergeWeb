/**
 * LIQUIDACIONES CONFIG REPOSITORY
 * ================================
 * Gestiona la configuración de liquidaciones por local
 */

class LiquidacionesConfigRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.cache = {};
    }

    /**
     * Obtiene la configuración de liquidaciones para un local
     */
    async getConfig(locationId) {
        // Verificar cache
        if (this.cache[locationId]) {
            return this.cache[locationId];
        }

        try {
            const { data, error } = await this.supabase
                .from('liquidaciones_config')
                .select('*')
                .eq('location_id', locationId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No existe, crear por defecto
                    return await this.createDefaultConfig(locationId);
                } else if (error.code === '42501') {
                    console.error(`❌ [ConfigRepository] Error de permisos RLS`);
                    return this.getDefaultConfig();
                } else {
                    console.error(`❌ [ConfigRepository] Error cargando config:`, error.message);
                    return this.getDefaultConfig();
                }
            }

            if (!data) {
                return await this.createDefaultConfig(locationId);
            }

            // Guardar en cache
            this.cache[locationId] = data;
            console.log(`✅ [ConfigRepository] Config cargada: ${data.frecuencia}`);
            return data;

        } catch (err) {
            console.error('❌ [ConfigRepository] Excepción:', err);
            return this.getDefaultConfig();
        }
    }

    /**
     * Configuración por defecto
     */
    getDefaultConfig() {
        return {
            frecuencia: 'semanal',
            dia_corte: 'domingo',
            margen_seguridad_horas: 5,
            umbral_minimo_liquidar: 5,
            auto_detectar_cierre: true
        };
    }

    /**
     * Crea configuración por defecto para un local
     */
    async createDefaultConfig(locationId) {
        try {
            const defaultConfig = {
                location_id: locationId,
                ...this.getDefaultConfig()
            };

            const { data, error } = await this.supabase
                .from('liquidaciones_config')
                .insert(defaultConfig)
                .select()
                .single();

            if (error) {
                console.error('❌ Error creando config por defecto:', error);
                return this.getDefaultConfig();
            }

            // Guardar en cache
            this.cache[locationId] = data;
            return data;

        } catch (err) {
            console.error('❌ Error creando config:', err);
            return this.getDefaultConfig();
        }
    }

    /**
     * Actualiza la configuración
     */
    async updateConfig(locationId, config) {
        try {
            const { data, error } = await this.supabase
                .from('liquidaciones_config')
                .update({
                    frecuencia: config.frecuencia,
                    dia_corte: config.dia_corte,
                    margen_seguridad_horas: config.margen_seguridad_horas,
                    umbral_minimo_liquidar: config.umbral_minimo_liquidar,
                    auto_detectar_cierre: config.auto_detectar_cierre,
                    updated_at: new Date().toISOString()
                })
                .eq('location_id', locationId)
                .select()
                .single();

            if (error) throw error;

            // Actualizar cache
            this.cache[locationId] = data;
            
            console.log('✅ Configuración de liquidaciones actualizada');
            return { success: true, config: data };

        } catch (error) {
            console.error('❌ Error actualizando config:', error);
            throw error;
        }
    }

    /**
     * Limpia el cache
     */
    clearCache(locationId = null) {
        if (locationId) {
            delete this.cache[locationId];
        } else {
            this.cache = {};
        }
    }
}

// Exportar a window
window.LiquidacionesConfigRepository = LiquidacionesConfigRepository;

