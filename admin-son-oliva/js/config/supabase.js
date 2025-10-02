/* Forn Verge - Cliente de Supabase - MASSA SON OLIVA */

// Cliente de Supabase (se inicializa cuando window.supabase está disponible)
let supabase;

// Función para inicializar el cliente de Supabase
function initSupabase() {
    if (window.supabase && typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // ✨ Exportar al scope global para que otros módulos puedan acceder
        window.supabase = supabase;
        
        console.log('✅ Cliente de Supabase inicializado y exportado globalmente');
        return true;
    }
    console.error('❌ No se pudo inicializar el cliente de Supabase');
    return false;
}

