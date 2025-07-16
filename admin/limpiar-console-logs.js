#!/usr/bin/env node

/**
 * SCRIPT PARA LIMPIAR CONSOLE.LOG SENSIBLES
 * ==========================================
 * Elimina automáticamente console.log que exponen información sensible
 * como fichajes, datos de empleados, horarios, etc.
 */

const fs = require('fs');
const path = require('path');

// Palabras clave que indican información sensible
const SENSITIVE_KEYWORDS = [
    'fichajes', 'empleado', 'horarios', 'ausencias', 'horas',
    'GABY', 'RAQUEL', 'BRYAN', 'MARÍA', 'XISCA', 'MERCEDES',
    'employee', 'schedule', 'datos', 'Datos', 'BD', 'Supabase',
    'registros', 'REGISTROS', 'DESGLOSE', 'FICHAJES', 'LISTADO'
];

// Archivos a limpiar
const FILES_TO_CLEAN = [
    'js/admin-horarios.js',
    'js/convenio-anual.js', 
    'js/ausencias-manager.js',
    'js/control-anual-simple.js'
];

function containsSensitiveInfo(line) {
    const lowerLine = line.toLowerCase();
    return SENSITIVE_KEYWORDS.some(keyword => 
        lowerLine.includes(keyword.toLowerCase())
    );
}

function shouldKeepConsoleLog(line) {
    // Mantener logs importantes para debugging básico
    const importantPatterns = [
        /console\.log\('🚀.*inicialand.*/,
        /console\.log\('✅.*listo.*/,
        /console\.log\('❌.*error.*/,
        /console\.log\('🔒.*autenticación.*/
    ];
    
    return importantPatterns.some(pattern => pattern.test(line));
}

function cleanFile(filePath) {
    console.log(`🧹 Limpiando: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Archivo no encontrado: ${filePath}`);
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let removedCount = 0;
    
    const cleanedLines = lines.map(line => {
        const trimmed = line.trim();
        
        // Si es un console.log y contiene información sensible
        if (trimmed.startsWith('console.log') && containsSensitiveInfo(line)) {
            // Solo mantener si es realmente importante
            if (shouldKeepConsoleLog(line)) {
                return line;
            } else {
                removedCount++;
                // Comentar la línea en lugar de eliminarla completamente
                return line.replace('console.log', '// console.log');
            }
        }
        
        return line;
    });
    
    const cleanedContent = cleanedLines.join('\n');
    
    // Crear backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);
    
    // Escribir archivo limpio
    fs.writeFileSync(filePath, cleanedContent);
    
    console.log(`✅ ${removedCount} console.log sensibles comentados en ${filePath}`);
    console.log(`💾 Backup guardado en: ${backupPath}`);
}

function main() {
    console.log('🔒 LIMPIANDO CONSOLE.LOG SENSIBLES DEL ADMIN');
    console.log('===============================================');
    
    let totalRemoved = 0;
    
    FILES_TO_CLEAN.forEach(file => {
        try {
            cleanFile(file);
        } catch (error) {
            console.error(`❌ Error limpiando ${file}:`, error.message);
        }
    });
    
    console.log('===============================================');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('');
    console.log('🔐 BENEFICIOS:');
    console.log('- Información sensible ya no visible en consola');
    console.log('- Datos de empleados protegidos');
    console.log('- Fichajes y horarios privados');
    console.log('');
    console.log('📝 PARA REVERTAR:');
    console.log('- Los archivos .backup contienen el código original');
    console.log('- Puedes descomentear líneas específicas si las necesitas');
}

if (require.main === module) {
    main();
}

module.exports = { cleanFile, containsSensitiveInfo }; 