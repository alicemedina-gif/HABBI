/**
 * Habbi — Configuração do Cliente Supabase (Frontend)
 *
 * IMPORTANTE:
 * - Usa EXCLUSIVAMENTE a Project URL raiz (sem "/rest/v1/") e a Publishable Key.
 * - NUNCA incluir secret keys ou service_role neste arquivo ou em qualquer arquivo do frontend.
 * - Ainda NÃO conectado ao index.html nesta etapa de preparação/revisão.
 */
(function initHabbiSupabaseConfig() {
  // Project URL normalizada (o SDK @supabase/supabase-js monta /auth/v1 e /rest/v1 automaticamente)
  const RAW_URL = 'https://vnpxqfepowwtbdiqjusz.supabase.co/rest/v1/';
  const SUPABASE_URL = RAW_URL.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3-zEkBJ6DUkBmyOzEQwwLA_TuS1RZCx';

  let clientInstance = null;

  function getHabbiSupabaseClient() {
    if (clientInstance) return clientInstance;
    // Fallback offline-first: se o SDK não carregou (sem internet), retorna null sem quebrar o app
    if (typeof window === 'undefined' || !window.supabase || typeof window.supabase.createClient !== 'function') {
      return null;
    }
    clientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'habbi-supabase-auth'
      }
    });
    return clientInstance;
  }

  window.HABBI_SUPABASE_CONFIG = Object.freeze({
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY
  });
  window.getHabbiSupabaseClient = getHabbiSupabaseClient;
})();
