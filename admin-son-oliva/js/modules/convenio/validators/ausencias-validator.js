/**
 * VALIDADOR DE AUSENCIAS
 * ======================
 * Detecta fichajes inválidos durante períodos de ausencia
 */

class AusenciasValidator {
    constructor(empleados, fichajes, ausencias) {
        this.empleados = empleados;
        this.fichajes = fichajes;
        this.ausencias = ausencias;
    }

    /**
     * Valida que no haya fichajes durante ausencias aprobadas
     * Retorna array de alertas con fichajes inválidos
     */
    validarFichajesDuranteAusencias() {
        const fichajesInvalidos = [];
        
        this.fichajes.forEach(fichaje => {
            const fechaFichaje = fichaje.fecha;
            const empleadoId = fichaje.empleado_id;
            
            // Buscar si hay ausencias activas en esta fecha
            const ausenciaActiva = this.ausencias.find(ausencia => 
                ausencia.empleado_id === empleadoId &&
                ausencia.fecha_inicio <= fechaFichaje &&
                ausencia.fecha_fin >= fechaFichaje &&
                ausencia.estado === 'aprobado'
            );
            
            if (ausenciaActiva) {
                const empleado = this.empleados.find(e => e.id === empleadoId);
                const nombreEmpleado = empleado ? empleado.name : `ID:${empleadoId}`;
                
                fichajesInvalidos.push({
                    empleado: nombreEmpleado,
                    fecha: fechaFichaje,
                    horas: fichaje.horas_trabajadas,
                    tipoAusencia: ausenciaActiva.tipo,
                    inicioAusencia: ausenciaActiva.fecha_inicio,
                    finAusencia: ausenciaActiva.fecha_fin
                });
            }
        });
        
        // Generar alerta si hay fichajes inválidos
        if (fichajesInvalidos.length > 0) {
            return {
                tipo: 'fichajes_durante_ausencia',
                fichajes: fichajesInvalidos,
                gravedad: 'alta'
            };
        }
        
        return null;
    }
}

// Exportar a window
window.AusenciasValidator = AusenciasValidator;
