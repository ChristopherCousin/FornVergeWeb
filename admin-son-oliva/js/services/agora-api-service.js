/**
 * SERVICIO DE API DE ÁGORA
 * =========================
 * Maneja todas las llamadas a la API de Ágora para obtener fichajes en tiempo real
 */

class AgoraApiService {
    constructor() {
        // Configuración de la API de Ágora
        this.AGORA_URL = "http://88.20.190.118:8984";
        this.API_TOKEN = "K7xLp3zQ9mR2bV1nS4tY6wU";
        this.LOCALES_IDS = "1"; // Local 1 = Forn Aragó (Son Oliva)
        this.QUERY_GUID = "{E393C693-6134-42C1-B09B-25DBC5DFD12F}";
    }

    /**
     * Obtener fichajes crudos desde Ágora en un rango de fechas
     * @param {string} fechaDesde - Fecha inicio en formato YYYY-MM-DD
     * @param {string} fechaHasta - Fecha fin en formato YYYY-MM-DD
     * @returns {Array} Array de fichajes sin transformar
     */
    async obtenerFichajes(fechaDesde, fechaHasta) {
        const payload = {
            QueryGuid: this.QUERY_GUID,
            Params: {
                datDesde: fechaDesde,
                datHasta: fechaHasta,
                locales: this.LOCALES_IDS
            }
        };

        try {
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
            return data;

        } catch (error) {
            console.error('❌ [Ágora API] Error obteniendo fichajes:', error);
            return [];
        }
    }
}

// Exportar a window
window.AgoraApiService = AgoraApiService;

