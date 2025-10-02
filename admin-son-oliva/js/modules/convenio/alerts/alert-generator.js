/**
 * GENERADOR DE ALERTAS
 * ====================
 * Muestra y clasifica alertas del convenio
 */

class AlertGenerator {
    constructor(alertas) {
        this.alertas = alertas;
    }

    /**
     * Muestra todas las alertas clasificadas por gravedad
     */
    mostrarAlertasConvenio() {
        if (this.alertas.length === 0) {
            return;
        }
        
        // Agrupar por gravedad
        const alertasAltas = this.alertas.filter(a => a.gravedad === 'alta');
        const alertasMedias = this.alertas.filter(a => a.gravedad === 'media');
        
        if (alertasAltas.length > 0) {
            alertasAltas.forEach(alerta => this.mostrarAlerta(alerta));
        }
        
        if (alertasMedias.length > 0) {
            alertasMedias.forEach(alerta => this.mostrarAlerta(alerta));
        }
    }

    /**
     * Muestra una alerta individual (placeholder - los logs están comentados)
     */
    mostrarAlerta(alerta) {
        switch (alerta.tipo) {
            case 'exceso_diario':
                // console.log(`   👤 ${alerta.empleado}: ${alerta.cantidad} días con >9h`);
                break;
            case 'exceso_semanal':
                // console.log(`   👤 ${alerta.empleado}: ${alerta.cantidad} semanas con >40h`);
                break;
            case 'exceso_semanal_compensar':
                // console.log(`   👤 ${alerta.empleado}: Exceso de ${alerta.desviacion}h/semana - Reducir horas para compensar`);
                break;
            case 'defecto_semanal_compensar':
                // console.log(`   👤 ${alerta.empleado}: Defecto de ${alerta.desviacion}h/semana - Aumentar horas para compensar`);
                break;
            case 'cerca_limite_anual':
                // console.log(`   👤 ${alerta.empleado}: ${alerta.porcentaje}% del límite anual`);
                break;
            case 'fichajes_durante_ausencia':
                // console.log(`   🚨 FICHAJES DURANTE AUSENCIAS: ${alerta.fichajes.length} fichajes inválidos detectados`);
                alerta.fichajes.forEach(fichaje => {
                    // console.log(`     👤 ${fichaje.empleado}: ${fichaje.fecha} (${fichaje.horas}h) durante ${fichaje.tipoAusencia}`);
                });
                break;
        }
    }

    /**
     * Obtiene resumen de alertas para el panel web
     */
    getResumenAlertas() {
        return {
            criticas: this.alertas.filter(a => a.gravedad === 'alta').length,
            menores: this.alertas.filter(a => a.gravedad === 'media').length,
            fichajes: this.alertas.filter(a => a.tipo === 'fichajes_durante_ausencia')
        };
    }
}

// Exportar a window
window.AlertGenerator = AlertGenerator;
