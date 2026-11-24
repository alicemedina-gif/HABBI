/**
 * Habbi — Configuração do Cliente Supabase (Frontend)
 *
 * Princípios de Engenharia:
 * - Usa EXCLUSIVAMENTE a Project URL raiz (sem "/rest/v1/") e a Publishable / Anon Key.
 * - NUNCA incluir secret keys ou service_role neste arquivo ou em qualquer arquivo do frontend.
 * - Fallback offline-first: se o SDK não estiver carregado ou a rede falhar, retorna null sem quebrar o app.
 * - Suporta override dinâmico via localStorage para flexibilidade sem necessidade de rebuild.
 */
(function initHabbiSupabaseConfig() {
  const DEFAULT_RAW_URL = 'https://nkzzgdaiozlaeqnlaydk.supabase.co/rest/v1/';
  const DEFAULT_KEY = 'sb_publishable_C0FqDkGCUzJiazT5iqrlTQ_pzX2g-5O';

  function getSavedUrl() {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem('habbi-supabase-url');
        if (val && typeof val === 'string' && val.trim()) return val.trim();
      }
    } catch (_e) {}
    return DEFAULT_RAW_URL;
  }

  function getSavedKey() {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem('habbi-supabase-anon-key');
        if (val && typeof val === 'string' && val.trim()) return val.trim();
      }
    } catch (_e) {}
    return DEFAULT_KEY;
  }

  function normalizeUrl(raw) {
    return String(raw || '').replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }

  let clientInstance = null;

  function getHabbiSupabaseClient() {
    if (clientInstance) return clientInstance;
    // Fallback offline-first: se o SDK @supabase/supabase-js não foi carregado
    if (typeof window === 'undefined' || !window.supabase || typeof window.supabase.createClient !== 'function') {
      return null;
    }

    const cleanUrl = normalizeUrl(getSavedUrl());
    const publishableKey = getSavedKey();

    if (!cleanUrl || !publishableKey) {
      return null;
    }

    try {
      clientInstance = window.supabase.createClient(cleanUrl, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'habbi-supabase-auth'
        }
      });
    } catch (err) {
      console.warn('[Habbi Supabase] Falha ao instanciar cliente:', err);
      clientInstance = null;
    }
    return clientInstance;
  }

  // Permite configurar ou atualizar credenciais de forma limpa pelo console ou UI
  window.setHabbiSupabaseCredentials = function(newUrl, newKey) {
    try {
      if (newUrl) localStorage.setItem('habbi-supabase-url', newUrl);
      if (newKey) localStorage.setItem('habbi-supabase-anon-key', newKey);
      clientInstance = null;
      return getHabbiSupabaseClient();
    } catch (_e) {
      return null;
    }
  };

  window.clearHabbiSupabaseCredentialsOverride = function() {
    try {
      localStorage.removeItem('habbi-supabase-url');
      localStorage.removeItem('habbi-supabase-anon-key');
      clientInstance = null;
      return getHabbiSupabaseClient();
    } catch (_e) {
      return null;
    }
  };

  window.HABBI_SUPABASE_CONFIG = Object.freeze({
    get url() { return normalizeUrl(getSavedUrl()); },
    get publishableKey() { return getSavedKey(); }
  });
  window.getHabbiSupabaseClient = getHabbiSupabaseClient;
})();
