/**
 * UTILIDADES PARA EL SISTEMA DE CONVENIO
 * =======================================
 * Funciones auxiliares reutilizables
 */

window.ConvenioUtils = {
    /**
     * Calcula días laborables (Lun-Vie) según metodología JAVI original
     */
    calcularDiasLaborablesJavi(fechaInicio, fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        let diasLaborables = 0;
        
        const fecha = new Date(inicio);
        while (fecha <= fin) {
            const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
            if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a Viernes
                diasLaborables++;
            }
            fecha.setDate(fecha.getDate() + 1);
        }
        
        return diasLaborables;
    },

    /**
     * Extrae la hora de un timestamp y la convierte a minutos desde medianoche (UTC)
     */
    extraerHoraDeTimestamp(timestamp) {
        if (!timestamp || timestamp === 'null') return null;
        
        try {
            // Si es un timestamp ISO, crear objeto Date
            const fecha = new Date(timestamp);
            if (isNaN(fecha.getTime())) return null;
            
            // Obtener horas y minutos en UTC (no hora local)
            const horas = fecha.getUTCHours();
            const minutos = fecha.getUTCMinutes();
            
            return (horas * 60) + minutos;
        } catch (error) {
            // Si falla, intentar extraer formato HH:MM del string
            const horaMatch = timestamp.toString().match(/(\d{1,2}):(\d{2})/);
            if (horaMatch) {
                const horas = parseInt(horaMatch[1], 10) || 0;
                const minutos = parseInt(horaMatch[2], 10) || 0;
                return (horas * 60) + minutos;
            }
            
            return null;
        }
    },

    /**
     * Agrupa fichajes por semanas (lunes = inicio de semana)
     */
    agruparPorSemanas(fichajes) {
        const semanas = {};
        
        fichajes.forEach(fichaje => {
            const fecha = new Date(fichaje.fecha);
            const inicioSemana = new Date(fecha);
            inicioSemana.setDate(fecha.getDate() - fecha.getDay() + 1); // Lunes
            const claveSeccion = inicioSemana.toISOString().split('T')[0];
            
            if (!semanas[claveSeccion]) {
                semanas[claveSeccion] = [];
            }
            semanas[claveSeccion].push(fichaje);
        });
        
        return semanas;
    }
};
