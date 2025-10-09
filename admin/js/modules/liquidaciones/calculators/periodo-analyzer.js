/**
 * PERIODO ANALYZER
 * ================
 * Analiza fichajes históricos para determinar cuándo termina
 * el periodo de liquidación (cierre de semana/mes)
 */

class PeriodoAnalyzer {
    constructor(fichajes, config) {
        this.fichajes = fichajes;
        this.config = config;
    }

    /**
     * Calcula la fecha y hora de fin del periodo actual
     */
    calcularFinDePeriodo() {
        const ahora = new Date();
        const frecuencia = this.config.frecuencia || 'semanal';

        if (frecuencia === 'semanal') {
            return this.calcularFinDeSemana(ahora);
        } else if (frecuencia === 'mensual') {
            return this.calcularFinDeMes(ahora);
        } else if (frecuencia === 'quincenal') {
            return this.calcularFinDeQuincena(ahora);
        }

        // Por defecto: fin de semana
        return this.calcularFinDeSemana(ahora);
    }

    /**
     * Calcula el fin de la semana actual
     */
    calcularFinDeSemana(fecha) {
        const proximoDomingo = new Date(fecha);
        const diasHastaDomingo = (7 - fecha.getDay()) % 7;
        
        if (diasHastaDomingo === 0 && fecha.getHours() < 12) {
            // Es domingo por la mañana, el fin ya pasó
            proximoDomingo.setDate(fecha.getDate());
        } else {
            proximoDomingo.setDate(fecha.getDate() + (diasHastaDomingo || 7));
        }

        // Detectar hora de cierre del domingo
        const horaCierre = this.detectarHoraCierre(0); // 0 = Domingo
        
        proximoDomingo.setHours(horaCierre.hora, horaCierre.minutos, 0, 0);

        return proximoDomingo;
    }

    /**
     * Calcula el fin del mes actual
     */
    calcularFinDeMes(fecha) {
        const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        const diaSemana = ultimoDiaMes.getDay();
        
        // Detectar hora de cierre de ese día de la semana
        const horaCierre = this.detectarHoraCierre(diaSemana);
        
        ultimoDiaMes.setHours(horaCierre.hora, horaCierre.minutos, 0, 0);

        return ultimoDiaMes;
    }

    /**
     * Calcula el fin de la quincena
     */
    calcularFinDeQuincena(fecha) {
        const dia = fecha.getDate();
        let finQuincena;

        if (dia <= 15) {
            // Primera quincena
            finQuincena = new Date(fecha.getFullYear(), fecha.getMonth(), 15);
        } else {
            // Segunda quincena
            finQuincena = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        }

        const diaSemana = finQuincena.getDay();
        const horaCierre = this.detectarHoraCierre(diaSemana);
        
        finQuincena.setHours(horaCierre.hora, horaCierre.minutos, 0, 0);

        return finQuincena;
    }

    /**
     * Detecta la hora de cierre típica para un día de la semana
     * analizando fichajes históricos
     */
    detectarHoraCierre(diaSemana) {
        if (!this.config.auto_detectar_cierre) {
            return { hora: 20, minutos: 0 };
        }

        // Filtrar fichajes de ese día de la semana
        const fichajesDia = this.fichajes.filter(f => {
            const fecha = new Date(f.fecha);
            return fecha.getDay() === diaSemana;
        });

        if (fichajesDia.length === 0) {
            return { hora: 20, minutos: 0 };
        }

        // Obtener horas de salida
        const horasSalida = fichajesDia
            .map(f => f.salida || f.hora_salida || f.end_time)
            .filter(h => h)
            .map(h => this.parseHoraFromTimestamp(h));

        if (horasSalida.length === 0) {
            return { hora: 20, minutos: 0 };
        }

        // Calcular la hora MÁS TARDÍA (el cierre real del negocio)
        const horaMasTardia = horasSalida.reduce((max, hora) => {
            const totalMinutos = hora.hora * 60 + hora.minutos;
            const maxMinutos = max.hora * 60 + max.minutos;
            return totalMinutos > maxMinutos ? hora : max;
        }, horasSalida[0]);

        return horaMasTardia;
    }

    /**
     * Parsea una hora desde un timestamp ISO o formato HH:MM
     */
    parseHoraFromTimestamp(timestamp) {
        if (!timestamp) return { hora: 20, minutos: 0 };

        try {
            // Si es un timestamp ISO (contiene 'T'), extraer la hora
            if (timestamp.includes('T')) {
                const fecha = new Date(timestamp);
                return {
                    hora: fecha.getHours(),
                    minutos: fecha.getMinutes()
                };
            }
            
            // Si es formato HH:MM o HH:MM:SS
            const partes = timestamp.split(':');
            return {
                hora: parseInt(partes[0]) || 20,
                minutos: parseInt(partes[1]) || 0
            };
        } catch (error) {
            console.error('   ❌ Error parseando hora:', timestamp, error);
            return { hora: 20, minutos: 0 };
        }
    }

    /**
     * Parsea una hora en formato "HH:MM" o "HH:MM:SS" (legacy, mantener compatibilidad)
     */
    parseHora(horaStr) {
        return this.parseHoraFromTimestamp(horaStr);
    }

    /**
     * Calcula cuántos días faltan hasta el fin del periodo
     */
    calcularDiasRestantes() {
        const ahora = new Date();
        const finPeriodo = this.calcularFinDePeriodo();
        
        const diffMs = finPeriodo - ahora;
        const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        return {
            dias: diffDias,
            horas: Math.floor(diffMs / (1000 * 60 * 60)) % 24,
            finPeriodo: finPeriodo,
            yaTermino: diffMs <= 0
        };
    }

    /**
     * Obtiene descripción legible del periodo
     */
    getDescripcionPeriodo() {
        const frecuencia = this.config.frecuencia || 'semanal';
        const finPeriodo = this.calcularFinDePeriodo();
        
        const opciones = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const fechaTexto = finPeriodo.toLocaleDateString('es-ES', opciones);

        if (frecuencia === 'semanal') {
            return `Fin de semana: ${fechaTexto}`;
        } else if (frecuencia === 'mensual') {
            return `Fin de mes: ${fechaTexto}`;
        } else if (frecuencia === 'quincenal') {
            return `Fin de quincena: ${fechaTexto}`;
        }

        return fechaTexto;
    }
}

// Exportar a window
window.PeriodoAnalyzer = PeriodoAnalyzer;

