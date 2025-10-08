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
            console.log(`📡 [Ágora API] Consultando: ${this.AGORA_URL}`);
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

        } catch (error) {
            console.error('❌ [Ágora API] Error obteniendo fichajes:', error);
            return {
                success: false,
                data: [],
                error: error.message || 'Error desconocido al conectar con Ágora'
            };
        }
    }
}

// Exportar a window
window.AgoraApiService = AgoraApiService;

