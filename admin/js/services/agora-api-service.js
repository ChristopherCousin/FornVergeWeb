/**
 * SERVICIO DE API DE ÁGORA
 * =========================
 * Maneja todas las llamadas a la API de Ágora para obtener fichajes en tiempo real
 * NOTA: Cada local tiene su propia URL de Ágora
 */

class AgoraApiService {
    constructor() {
        // Configuración base de la API de Ágora
        this.API_TOKEN = "K7xLp3zQ9mR2bV1nS4tY6wU";
        this.LOCALES_IDS = "1"; // Local 1 en Ágora
        this.QUERY_GUID = "{E393C693-6134-42C1-B09B-25DBC5DFD12F}";
        
        // URL dinámica según el local actual
        this.AGORA_URL = this.getAgoraUrlForCurrentLocation();
        
        // URL del proxy de Supabase (para producción con HTTPS)
        this.PROXY_URL = this.getProxyUrl();
        
        // Detectar si estamos en producción (HTTPS)
        this.USE_PROXY = window.location.protocol === 'https:';
    }
    
    /**
     * Obtener URL del proxy según el entorno
     */
    getProxyUrl() {
        // Tu proyecto de Supabase
        const SUPABASE_PROJECT_ID = window.SUPABASE_CONFIG?.projectId || 'csxgkxjeifakwslamglc';
        return `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/agora-proxy`;
    }
    
    /**
     * Obtener URL de Ágora según el local actual
     */
    getAgoraUrlForCurrentLocation() {
        const currentLocation = getCurrentLocation();
        
        if (!currentLocation) {
            console.warn('⚠️ No hay local seleccionado, usando URL por defecto');
            return 'http://88.20.190.118:8984'; // Fallback a Son Oliva
        }
        
        // Usar agora_url del local si existe
        if (currentLocation.agora_url) {
            console.log(`📡 Usando Ágora URL: ${currentLocation.agora_url}`);
            return currentLocation.agora_url;
        }
        
        // Fallback basado en slug
        const urlMap = {
            'son-oliva': 'http://88.20.190.118:8984',
            'llevant': 'http://vergedelluch.ddns.net:8984'
        };
        
        const url = urlMap[currentLocation.location_slug] || urlMap['son-oliva'];
        console.log(`📡 Usando Ágora URL (fallback): ${url}`);
        return url;
    }

    /**
     * Obtener fichajes crudos desde Ágora en un rango de fechas
     * @param {string} fechaDesde - Fecha inicio en formato YYYY-MM-DD
     * @param {string} fechaHasta - Fecha fin en formato YYYY-MM-DD
     * @returns {Object} { success: boolean, data: Array, error: string }
     */
    async obtenerFichajes(fechaDesde, fechaHasta) {
        // Actualizar URL por si cambió el local
        this.AGORA_URL = this.getAgoraUrlForCurrentLocation();
        
        const payload = {
            QueryGuid: this.QUERY_GUID,
            Params: {
                datDesde: fechaDesde,
                datHasta: fechaHasta,
                locales: this.LOCALES_IDS
            }
        };

        try {
            if (this.USE_PROXY) {
                // PRODUCCIÓN (HTTPS): Usar proxy de Supabase
                console.log(`🔐 [Ágora API] Usando proxy HTTPS para: ${this.AGORA_URL}`);
                return await this.fetchViaProxy(payload);
            } else {
                // LOCAL (HTTP): Llamada directa
                console.log(`📡 [Ágora API] Llamada directa HTTP: ${this.AGORA_URL}`);
                return await this.fetchDirect(payload);
            }

        } catch (error) {
            console.error('❌ [Ágora API] Error obteniendo fichajes:', error);
            return {
                success: false,
                data: [],
                error: error.message || 'Error desconocido al conectar con Ágora'
            };
        }
    }
    
    /**
     * Llamada directa a AGORA (solo funciona en HTTP/local)
     */
    async fetchDirect(payload) {
        const response = await fetch(`${this.AGORA_URL}/api/custom-query`, {
            method: 'POST',
            headers: {
                'Api-Token': this.API_TOKEN,
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            data: data,
            error: null
        };
    }
    
    /**
     * Llamada a través del proxy de Supabase (para HTTPS/producción)
     */
    async fetchViaProxy(payload) {
        const response = await fetch(this.PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': window.SUPABASE_CONFIG?.anonKey || ''
            },
            body: JSON.stringify({
                agoraUrl: this.AGORA_URL,
                payload: payload,
                apiToken: this.API_TOKEN
            })
        });

        if (!response.ok) {
            throw new Error(`Error en proxy: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error desconocido del proxy');
        }

        return {
            success: true,
            data: result.data,
            error: null
        };
    }
}

// Exportar a window
window.AgoraApiService = AgoraApiService;

