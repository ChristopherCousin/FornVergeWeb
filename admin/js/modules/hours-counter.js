/* Forn Verge - Contador de Horas Teóricas - MASSA SON OLIVA */

// ===== FUNCIONES PARA CONTADOR DE HORAS TEÓRICAS =====

/**
 * Calcula el total de horas semanales teóricas de todos los empleados activos
 * @returns {number} Total de horas semanales
 */
function calcularHorasSemanalesTeoricas() {
    const activeEmployees = getActiveEmployees();
    let totalHoras = 0;
    
    activeEmployees.forEach(employee => {
        const horasEmpleado = getTotalHours(employee.id);
        totalHoras += horasEmpleado;
    });
    
    return totalHoras;
}

/**
 * Obtiene el desglose de horas por empleado para mostrar en la interfaz
 * @returns {Array} Array con objetos {empleado, horas, color}
 */
function obtenerDesgloseHorasEmpleados() {
    const activeEmployees = getActiveEmployees();
    const desglose = [];
    
    activeEmployees.forEach(employee => {
        const horasEmpleado = getTotalHours(employee.id);
        const color = getEmployeeColor(employee.id);
        
        desglose.push({
            id: employee.id,
            nombre: employee.name,
            horas: horasEmpleado,
            color: color
        });
    });
    
    // Ordenar por horas descendente
    return desglose.sort((a, b) => b.horas - a.horas);
}

/**
 * Actualiza la interfaz del contador de horas teóricas
 */
function actualizarContadorHorasTeoricas() {
    console.log('🧮 Actualizando contador de horas teóricas...');
    
    const totalHoras = calcularHorasSemanalesTeoricas();
    const desglose = obtenerDesgloseHorasEmpleados();
    const LIMITE_HORAS = 205;
    
    // Actualizar el total de horas
    const totalElement = document.getElementById('totalHorasSemanales');
    if (totalElement) {
        totalElement.textContent = `${totalHoras}h`;
        
        // Cambiar color según proximidad al límite
        if (totalHoras > LIMITE_HORAS) {
            totalElement.className = 'text-2xl font-bold text-red-600';
        } else if (totalHoras > LIMITE_HORAS * 0.9) { // 90% del límite
            totalElement.className = 'text-2xl font-bold text-orange-600';
        } else {
            totalElement.className = 'text-2xl font-bold text-blue-800';
        }
    }
    
    // Mostrar/ocultar alarma de sobrecarga
    const alarmaElement = document.getElementById('alarmaSobrecarga');
    if (alarmaElement) {
        if (totalHoras > LIMITE_HORAS) {
            alarmaElement.classList.remove('hidden');
        } else {
            alarmaElement.classList.add('hidden');
        }
    }
    
    // Actualizar desglose por empleado
    const listaElement = document.getElementById('listaHorasEmpleados');
    if (listaElement) {
        listaElement.innerHTML = '';
        
        desglose.forEach(emp => {
            const empDiv = document.createElement('div');
            empDiv.className = 'bg-white p-2 rounded border text-center text-xs';
            empDiv.style.borderColor = emp.color.border;
            empDiv.style.backgroundColor = emp.color.background;
            
            empDiv.innerHTML = `
                <div class="font-semibold text-gray-800 truncate" title="${emp.nombre}">
                    ${emp.nombre}
                </div>
                <div class="text-lg font-bold" style="color: ${emp.color.border};">
                    ${emp.horas}h
                </div>
            `;
            
            listaElement.appendChild(empDiv);
        });
        
        // Si no hay empleados activos
        if (desglose.length === 0) {
            listaElement.innerHTML = '<div class="col-span-full text-center text-gray-500 py-2">No hay empleados activos</div>';
        }
    }
    
    console.log(`📊 Contador actualizado: ${totalHoras}h total (${desglose.length} empleados)`);
}

/**
 * Función auxiliar para ocultar/mostrar el contador según la configuración
 */
function toggleContadorHorasTeoricas(visible = true) {
    const contadorElement = document.getElementById('horasTeoricas');
    if (contadorElement) {
        if (visible) {
            contadorElement.style.display = 'block';
        } else {
            contadorElement.style.display = 'none';
        }
    }
}

// Exportar al scope global
window.calcularHorasSemanalesTeoricas = calcularHorasSemanalesTeoricas;
window.obtenerDesgloseHorasEmpleados = obtenerDesgloseHorasEmpleados;
window.actualizarContadorHorasTeoricas = actualizarContadorHorasTeoricas;
window.toggleContadorHorasTeoricas = toggleContadorHorasTeoricas;
