/**
 * CONFIGURACIÓN CENTRALIZADA DE SUPABASE - FORN VERGE
 * ====================================================
 * Cliente Supabase centralizado para toda la aplicación
 */

import { SUPABASE_CONFIG } from './constants.js';

// Cliente Supabase global
let supabaseClient = null;

/**
 * Inicializa el cliente de Supabase
 * @returns {Object} Cliente de Supabase
 */
export function initSupabase() {
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.ANON_KEY
        );
    }
    return supabaseClient;
}

/**
 * Obtiene el cliente de Supabase
 * @returns {Object} Cliente de Supabase
 */
export function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

/**
 * Verifica si Supabase está disponible
 * @returns {boolean} True si está disponible
 */
export function isSupabaseReady() {
    return !!window.supabase && !!supabaseClient;
}
