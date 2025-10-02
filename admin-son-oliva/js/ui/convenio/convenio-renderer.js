/**
 * RENDERIZADOR DE CONVENIO
 * ========================
 * Actualiza el panel web con información del convenio
 */

class ConvenioRenderer {
    constructor(convenioConfig) {
        this.htmlGenerator = new window.ConvenioHtmlGenerator(convenioConfig);
    }

    /**
     * Muestra resumen anual en consola (opcional)
     */
    mostrarResumenAnual(statsAnuales, alertas) {
        // Los console.log están comentados en el original
        // Esta función existe para mantener compatibilidad
        
        // Actualizar panel web
        this.actualizarPanelWeb(statsAnuales, alertas);
    }

    /**
     * Actualiza el panel web con el resumen anual
     */
    actualizarPanelWeb(statsAnuales, alertas) {
        // Buscar el panel de control existente
        const panelControl = document.getElementById('controlHorariosPanel');
        if (!panelControl) return;
        
        // Crear sección de resumen anual
        const resumenAnualHtml = this.htmlGenerator.generarResumenAnualHTML(statsAnuales, alertas);
        
        // Insertar después del resumen semanal
        const resumenSemanal = panelControl.querySelector('.bg-blue-50');
        if (resumenSemanal && !document.getElementById('resumenAnual')) {
            const divAnual = document.createElement('div');
            divAnual.id = 'resumenAnual';
            divAnual.innerHTML = resumenAnualHtml;
            resumenSemanal.parentNode.insertBefore(divAnual, resumenSemanal.nextSibling);
        }
    }
}

// Exportar a window
window.ConvenioRenderer = ConvenioRenderer;
