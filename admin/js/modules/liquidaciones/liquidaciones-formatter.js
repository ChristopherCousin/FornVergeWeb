/**
 * LIQUIDACIONES FORMATTER - Utilidades de Formato
 * ================================================
 * Funciones de formato para liquidaciones
 * Sin lógica de negocio, solo presentación
 */

class LiquidacionesFormatter {
    constructor() {
        this.TARIFA_HORA_DEFAULT = 15; // €/hora por defecto
    }

    /**
     * Calcula importe basado en horas y tarifa
     */
    calcularImporte(horas, tarifa = null) {
        const tarifaFinal = tarifa || this.TARIFA_HORA_DEFAULT;
        return Math.round(horas * tarifaFinal * 100) / 100;
    }

    /**
     * Formatea un número de horas
     */
    formatHoras(horas) {
        if (horas === null || horas === undefined) return '0.00 h';
        return `${horas.toFixed(2)} h`;
    }

    /**
     * Formatea un importe monetario
     */
    formatImporte(importe) {
        if (importe === null || importe === undefined) return '0.00 €';
        return `${importe.toFixed(2)} €`;
    }

    /**
     * Formatea una fecha (DD/MM/YYYY)
     */
    formatFecha(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Formatea fecha para input HTML (YYYY-MM-DD)
     */
    formatFechaInput(fecha) {
        if (!fecha) return '';
        return new Date(fecha).toISOString().split('T')[0];
    }

    /**
     * Obtiene emoji de un empleado
     */
    getEmpleadoEmoji(employeeId) {
        const empleado = window.stateManager.getEmpleado(employeeId);
        return empleado?.emoji || '👤';
    }

    /**
     * Obtiene tarifa de un empleado
     */
    getTarifaEmpleado(employeeId) {
        const empleado = window.stateManager.getEmpleado(employeeId);
        return empleado?.tarifa_hora || this.TARIFA_HORA_DEFAULT;
    }

    /**
     * Obtiene nombre de un empleado
     */
    getNombreEmpleado(employeeId) {
        const empleado = window.stateManager.getEmpleado(employeeId);
        return empleado?.name || 'Desconocido';
    }

    /**
     * Genera clase CSS según cantidad de horas pendientes
     */
    getClassPendiente(horasPendientes) {
        if (horasPendientes > 20) return 'bg-red-100 text-red-800';
        if (horasPendientes > 10) return 'bg-orange-100 text-orange-800';
        return 'bg-yellow-100 text-yellow-800';
    }

    /**
     * Genera texto descriptivo del estado
     */
    getTextoEstado(balance) {
        if (balance < -1) {
            return `Debe ${Math.abs(balance).toFixed(0)}h a la empresa`;
        } else if (balance > 1) {
            return `Empresa debe ${balance.toFixed(0)}h`;
        } else {
            return 'Sin deuda';
        }
    }
}

// Exportar a window
window.LiquidacionesFormatter = LiquidacionesFormatter;
