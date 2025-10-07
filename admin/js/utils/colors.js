/* Forn Verge - Sistema de Colores por Empleado - MASSA SON OLIVA */

// Sistema de colores por empleado en lugar de por tipo de turno
function getEmployeeColor(employeeId) {
    const colors = [
        { border: '#10b981', background: '#d1fae5' }, // Verde esmeralda
        { border: '#3b82f6', background: '#dbeafe' }, // Azul
        { border: '#f59e0b', background: '#fef3c7' }, // Ámbar
        { border: '#ef4444', background: '#fecaca' }, // Rojo
        { border: '#8b5cf6', background: '#ede9fe' }, // Violeta
        { border: '#06b6d4', background: '#cffafe' }, // Cian
        { border: '#f97316', background: '#fed7aa' }, // Naranja
        { border: '#84cc16', background: '#ecfccb' }, // Lima
        { border: '#ec4899', background: '#fce7f3' }, // Rosa
        { border: '#6366f1', background: '#e0e7ff' }  // Índigo
    ];
    
    // Crear un índice estable basado en el ID del empleado
    // NOTA: Requiere la variable global 'employees' del archivo principal
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
    const colorIndex = employeeIndex >= 0 ? employeeIndex % colors.length : 0;
    
    return colors[colorIndex];
}

