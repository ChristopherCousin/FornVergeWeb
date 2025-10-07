/**
 * CALCULADORA DE TURNOS
 * =====================
 * Calcula partidos (turnos dobles) y turnos de mañana
 */

class ShiftsCalculator {
    constructor(empleados, fichajes) {
        this.empleados = empleados;
        this.fichajes = fichajes;
    }

    /**
     * Calcula el número de partidos (turnos dobles) de un empleado
     */
    calcularPartidos(empleadoId) {
        const fichajesEmpleado = this.fichajes.filter(f => f.empleado_id === empleadoId);
        
        // Agrupar fichajes por fecha
        const fichajesPorFecha = {};
        fichajesEmpleado.forEach(fichaje => {
            const fecha = fichaje.fecha;
            if (!fichajesPorFecha[fecha]) {
                fichajesPorFecha[fecha] = [];
            }
            fichajesPorFecha[fecha].push(fichaje);
        });
        
        let totalPartidos = 0;
        
        // Analizar cada día para detectar turnos dobles
        Object.entries(fichajesPorFecha).forEach(([fecha, fichajes]) => {
            // Solo contar como partido si hay exactamente 2 fichajes en el día
            if (fichajes.length === 2) {
                const fichaje1 = fichajes[0];
                const fichaje2 = fichajes[1];
                
                // Verificar si hay diferencia significativa en las horas (indicativo de turno doble)
                const horas1 = fichaje1.horas_trabajadas || 0;
                const horas2 = fichaje2.horas_trabajadas || 0;
                
                // Considerar partido si:
                // 1. Ambos fichajes tienen horas significativas (>1h cada uno)
                // 2. La diferencia entre horas es de al menos 2h (indica descanso entre turnos)
                if (horas1 >= 1 && horas2 >= 1 && Math.abs(horas1 - horas2) >= 2) {
                    totalPartidos++;
                }
                // También contar como partido si ambos turnos son similares (típico de turnos partidos)
                else if (horas1 >= 2 && horas2 >= 2 && Math.abs(horas1 - horas2) <= 2) {
                    totalPartidos++;
                }
            }
        });
        
        return totalPartidos;
    }

    /**
     * Calcula el número total de turnos de mañana (5:30-15:30) de un empleado
     * Excluye a Bryan (le gustan las tardes) y Raquel (siempre está de mañanas)
     * Solo cuenta turnos NO partidos en horario de mañana
     */
    calcularTurnosMañana(empleadoId) {
        const empleado = this.empleados.find(e => e.id === empleadoId);
        if (!empleado) return 0;
        
        // ===== EXCLUSIONES ESPECÍFICAS =====
        const nombreEmpleado = empleado.name.toUpperCase().trim();
        
        // No contar Bryan (le gusta estar de tardes)
        if (nombreEmpleado.includes('BRYAN')) {
            return 0;
        }
        
        // No contar Raquel (siempre está de mañanas - no necesita equilibrio)
        if (nombreEmpleado.includes('RAQUEL')) {
            return 0;
        }
        
        const fichajesEmpleado = this.fichajes.filter(f => f.empleado_id === empleadoId);
        
        // Agrupar fichajes por fecha
        const fichajesPorFecha = {};
        fichajesEmpleado.forEach(fichaje => {
            const fecha = fichaje.fecha;
            if (!fichajesPorFecha[fecha]) {
                fichajesPorFecha[fecha] = [];
            }
            fichajesPorFecha[fecha].push(fichaje);
        });
        
        let totalTurnosMañana = 0;

        // Analizar cada día para detectar turnos de mañana
        Object.entries(fichajesPorFecha).forEach(([fecha, fichajes]) => {
            // ===== SOLO CONTAR DÍAS CON UN SOLO FICHAJE (NO PARTIDOS) =====
            if (fichajes.length === 1) {
                const fichaje = fichajes[0];
                
                // Verificar que tenga horas de entrada y salida
                if (fichaje.entrada && fichaje.salida) {
                    // Extraer solo la hora de los timestamps
                    const horaEntrada = window.ConvenioUtils.extraerHoraDeTimestamp(fichaje.entrada);
                    const horaSalida = window.ConvenioUtils.extraerHoraDeTimestamp(fichaje.salida);
                    
                    if (horaEntrada !== null && horaSalida !== null) {
                        // ===== FRANJA DE MAÑANA AMPLIADA =====
                        // 5:30 (330 min) a 15:30 (930 min) para cubrir casos como 5:55-14:00
                        const inicioMañana = 5 * 60 + 30; // 5:30 = 330 minutos
                        const finMañana = 15 * 60 + 30;   // 15:30 = 930 minutos
                        
                        // Verificar si entrada Y salida están dentro de la franja de mañana
                        if (horaEntrada >= inicioMañana && horaEntrada <= finMañana &&
                            horaSalida >= inicioMañana && horaSalida <= finMañana &&
                            horaSalida > horaEntrada) { // Verificar que salida > entrada
                            
                            totalTurnosMañana++;
                        }
                    }
                }
            }
            // ===== SI HAY 2 FICHAJES = PARTIDO → NO CONTAR COMO MAÑANA =====
            // Los partidos no se cuentan como mañanas, independientemente del horario
        });
        
        return totalTurnosMañana;
    }
}

// Exportar a window
window.ShiftsCalculator = ShiftsCalculator;
