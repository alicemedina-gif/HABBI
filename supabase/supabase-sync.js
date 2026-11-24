/**
 * Habbi — Serviço de Autenticação e Sincronização Supabase (Offline-First)
 *
 * Arquitetura e Diretrizes:
 * - Suporta autenticação real via e-mail e senha.
 * - Modo Visitante permanece 100% autônomo (grava localmente sem depender de rede).
 * - Migração Segura: dados locais do visitante são migrados de forma idempotente para a nuvem
 *   sem perda nem duplicação (usando client_event_id determinístico).
 * - Resiliência Offline: operações em modo logado são salvas no localStorage imediatamente (0 ms)
 *   e sincronizadas em segundo plano, caindo em fila offline (habbi-sync-queue) em caso de falha de conexão.
 * - Suporte nativo i18n para mensagens de erro em PT, EN e ES.
 */
(function initHabbiSupabaseAuthSync() {
  const SYNC_QUEUE_KEY = 'habbi-sync-queue';
  let isSyncing = false;
  let syncDebounceTimer = null;

  // Dicionário de mensagens de erro amigáveis para Supabase Auth
  const AUTH_MESSAGES = {
    PT: {
      invalidCredentials: 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.',
      userAlreadyRegistered: 'Este e-mail já está cadastrado. Faça login para acessar sua conta.',
      passwordTooShort: 'A senha deve conter no mínimo 6 caracteres.',
      emailNotConfirmed: 'Por favor, confirme seu e-mail pelo link que enviamos antes de entrar.',
      emailRequired: 'Informe um e-mail válido.',
      networkError: 'Sem conexão no momento. Seus dados continuam salvos com segurança neste dispositivo.',
      resetEmailSent: 'Enviamos um link de recuperação para seu e-mail! Verifique sua caixa de entrada e spam.',
      signupSuccess: 'Conta criada com sucesso! Bem-vindo(a) ao Habbi.',
      loginSuccess: 'Sessão iniciada com sucesso!',
      logoutSuccess: 'Você saiu da sua conta.',
      profileUpdated: 'Dados atualizados com sucesso.',
      passwordUpdated: 'Senha atualizada com sucesso!'
    },
    EN: {
      invalidCredentials: 'Incorrect email or password. Please check your credentials.',
      userAlreadyRegistered: 'This email is already registered. Please sign in.',
      passwordTooShort: 'Password must be at least 6 characters.',
      emailNotConfirmed: 'Please verify your email through the link sent before signing in.',
      emailRequired: 'Please enter a valid email address.',
      networkError: 'No internet connection. Your data remains safely stored on this device.',
      resetEmailSent: 'Password reset link sent! Please check your inbox and spam folder.',
      signupSuccess: 'Account created successfully! Welcome to Habbi.',
      loginSuccess: 'Signed in successfully!',
      logoutSuccess: 'You have signed out.',
      profileUpdated: 'Profile updated successfully.',
      passwordUpdated: 'Password updated successfully!'
    },
    ES: {
      invalidCredentials: 'Correo o contraseña incorrectos. Por favor verifica tus datos.',
      userAlreadyRegistered: 'Este correo ya está registrado. Inicia sesión para continuar.',
      passwordTooShort: 'La contraseña debe tener al menos 6 caracteres.',
      emailNotConfirmed: 'Por favor confirma tu correo electrónico antes de iniciar sesión.',
      emailRequired: 'Introduce un correo electrónico válido.',
      networkError: 'Sin conexión a internet. Tus datos permanecen seguros en tu dispositivo.',
      resetEmailSent: '¡Enlace de recuperación enviado! Revisa tu bandeja de entrada o spam.',
      signupSuccess: '¡Cuenta creada con éxito! Bienvenido(a) a Habbi.',
      loginSuccess: '¡Sesión iniciada con éxito!',
      logoutSuccess: 'Has cerrado sesión.',
      profileUpdated: 'Datos actualizados con éxito.',
      passwordUpdated: '¡Contraseña actualizada con éxito!'
    }
  };

  function getActiveLang() {
    try {
      if (typeof window !== 'undefined' && window.userState && window.userState.currentLang) {
        return window.userState.currentLang.toUpperCase();
      }
      const saved = localStorage.getItem('habbi-app-lang');
      if (saved) return saved.toUpperCase();
    } catch (_e) {}
    return 'PT';
  }

  function getAuthText(key) {
    const lang = getActiveLang();
    const table = AUTH_MESSAGES[lang] || AUTH_MESSAGES.PT;
    return table[key] || AUTH_MESSAGES.PT[key] || '';
  }

  function parseSupabaseError(err) {
    if (!err) return '';
    const raw = String(err.message || err.error_description || err || '').toLowerCase();
    if (raw.includes('invalid login credentials') || raw.includes('invalid grant') || raw.includes('bad credentials')) {
      return getAuthText('invalidCredentials');
    }
    if (raw.includes('already registered') || raw.includes('user already exists') || raw.includes('unique constraint')) {
      return getAuthText('userAlreadyRegistered');
    }
    if (raw.includes('at least 6 characters') || raw.includes('password should be at least')) {
      return getAuthText('passwordTooShort');
    }
    if (raw.includes('email not confirmed') || raw.includes('not verified')) {
      return getAuthText('emailNotConfirmed');
    }
    if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('unable to resolve') || raw.includes('abort')) {
      return getAuthText('networkError');
    }
    return err.message || getAuthText('networkError');
  }

  function getClient() {
    if (typeof window.getHabbiSupabaseClient === 'function') {
      return window.getHabbiSupabaseClient();
    }
    return null;
  }

  function isSupabaseAvailable() {
    const client = getClient();
    return Boolean(client && typeof client.from === 'function');
  }

  // ==========================================================================
  // FILA OFFLINE (RESILIÊNCIA EM FALHAS DE REDE)
  // ==========================================================================
  function loadSyncQueue() {
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (_e) {}
    return [];
  }

  function saveSyncQueue(queue) {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue.slice(0, 500)));
    } catch (_e) {}
  }

  function enqueueMutation(actionType, payload) {
    const queue = loadSyncQueue();
    queue.push({
      id: 'queue_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: actionType,
      payload: payload,
      createdAt: new Date().toISOString()
    });
    saveSyncQueue(queue);
  }

  // ==========================================================================
  // AUTENTICAÇÃO REAL (SUPABASE AUTH)
  // ==========================================================================
  async function signUp({ name, email, password }) {
    const client = getClient();
    if (!client) {
      return { success: false, error: getAuthText('networkError') };
    }

    try {
      const redirectUrl = (typeof window !== 'undefined' && window.location)
        ? (window.location.origin + window.location.pathname)
        : undefined;

      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: (name || '').trim()
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        return { success: false, error: parseSupabaseError(error) };
      }

      const user = data ? data.user : null;
      const session = data ? data.session : null;

      // Se a confirmação de e-mail estiver ativada e não houver sessão ativa imediata
      const requiresEmailConfirmation = Boolean(user && !session);

      return {
        success: true,
        user: user,
        session: session,
        requiresEmailConfirmation: requiresEmailConfirmation
      };
    } catch (err) {
      return { success: false, error: parseSupabaseError(err) };
    }
  }

  async function signIn({ email, password }) {
    const client = getClient();
    if (!client) {
      return { success: false, error: getAuthText('networkError') };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        return { success: false, error: parseSupabaseError(error) };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (err) {
      return { success: false, error: parseSupabaseError(err) };
    }
  }

  async function signOut() {
    const client = getClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('[Habbi Supabase] Erro ao deslogar no backend:', err);
      }
    }
    return { success: true };
  }

  async function sendPasswordResetEmail(email) {
    const client = getClient();
    if (!client) {
      return { success: false, error: getAuthText('networkError') };
    }

    try {
      const redirectUrl = (typeof window !== 'undefined' && window.location)
        ? (window.location.origin + window.location.pathname + '#recovery')
        : undefined;

      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl
      });

      if (error) {
        return { success: false, error: parseSupabaseError(error) };
      }

      return { success: true, message: getAuthText('resetEmailSent') };
    } catch (err) {
      return { success: false, error: parseSupabaseError(err) };
    }
  }

  async function updateUserPassword(newPassword) {
    const client = getClient();
    if (!client) {
      return { success: false, error: getAuthText('networkError') };
    }

    try {
      const { data, error } = await client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: parseSupabaseError(error) };
      }

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: parseSupabaseError(err) };
    }
  }

  async function getSession() {
    const client = getClient();
    if (!client) return null;
    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data) return null;
      return data.session;
    } catch (_e) {
      return null;
    }
  }

  async function getCurrentUser() {
    const sess = await getSession();
    return sess ? sess.user : null;
  }

  // ==========================================================================
  // MIGRAÇÃO SEGURA & IDEMPOTENTE (VISITANTE LOCAL -> NUVEM)
  // ==========================================================================
  async function migrateLocalVisitorData(userId, snapshot) {
    if (!userId || !snapshot) return { success: false, skipped: true };
    const migrationFlagKey = 'habbi-migrated-uid-' + userId;

    if (localStorage.getItem(migrationFlagKey) === 'true') {
      return { success: true, alreadyMigrated: true };
    }

    const client = getClient();
    if (!client) return { success: false, error: 'Supabase indisponível' };

    try {
      // 1. Atualizar Perfil e Metas no Supabase se existirem dados no snapshot local
      const profileUpdates = {};
      if (snapshot.name && snapshot.name.toLowerCase() !== 'visitante') {
        profileUpdates.display_name = snapshot.name;
      }
      if (snapshot.avatar) {
        profileUpdates.avatar = snapshot.avatar;
      }
      if (Object.keys(profileUpdates).length > 0) {
        await client.from('profiles').update(profileUpdates).eq('id', userId);
      }

      // Metas do usuário
      const goalUpdates = {
        user_id: userId,
        today_meta: typeof snapshot.todayMeta === 'number' && snapshot.todayMeta >= 0 ? snapshot.todayMeta : 11,
        habitual_cigs: typeof snapshot.habitualCigs === 'number' && snapshot.habitualCigs >= 1 ? snapshot.habitualCigs : 12,
        habitual_cigs_customized: Boolean(snapshot.habitualCigsCustomized),
        pack_price: typeof snapshot.packPrice === 'number' && snapshot.packPrice > 0 ? snapshot.packPrice : 15.00,
        cigs_per_pack: typeof snapshot.cigsPerPack === 'number' && snapshot.cigsPerPack >= 1 ? snapshot.cigsPerPack : 20,
        pack_freq_days: typeof snapshot.packFreqDays === 'number' && snapshot.packFreqDays >= 1 ? snapshot.packFreqDays : 2,
        savings_goal_title: snapshot.savingsGoal && snapshot.savingsGoal.title ? snapshot.savingsGoal.title : 'Minha conquista',
        savings_goal_target: snapshot.savingsGoal && typeof snapshot.savingsGoal.target === 'number' ? snapshot.savingsGoal.target : 250.00
      };
      await client.from('user_goals').upsert(goalUpdates, { onConflict: 'user_id' });

      // Preferências
      const prefUpdates = {
        user_id: userId,
        language: snapshot.currentLang || 'PT',
        theme: snapshot.theme || 'light',
        onboarding_completed: Boolean(snapshot.onboardingCompleted),
        tutorial_completed: Boolean(snapshot.tutorialCompleted),
        has_configured_first_goal: Boolean(snapshot.hasConfiguredFirstGoal),
        sacola_100_celebrated: Boolean(snapshot.sacola100Celebrated)
      };
      await client.from('user_preferences').upsert(prefUpdates, { onConflict: 'user_id' });

      // 2. Migração de Eventos e Resumos Diários
      const dailyRecords = snapshot.dailyRecords || {};
      const eventsBatch = [];
      const dailyBatch = [];

      for (const dateKey of Object.keys(dailyRecords)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
        const rec = dailyRecords[dateKey];
        if (!rec || typeof rec !== 'object') continue;

        dailyBatch.push({
          user_id: userId,
          date_key: dateKey,
          meta: typeof rec.meta === 'number' && rec.meta >= 0 ? rec.meta : 11,
          cigs_count: typeof rec.cigs === 'number' && rec.cigs >= 0 ? rec.cigs : 0,
          urges_count: typeof rec.urges === 'number' && rec.urges >= 0 ? rec.urges : 0,
          smoke_free: Boolean(rec.smokeFree),
          day_completed: Boolean(rec.dayCompleted),
          latest_mood: rec.latestMood || null
        });

        if (Array.isArray(rec.events)) {
          for (const ev of rec.events) {
            if (!ev || typeof ev !== 'object') continue;
            const eventId = ev.id || Date.now();
            const clientEventId = `local-${dateKey}-${eventId}`;
            const kindClean = ['smoke', 'no-smoke', 'urge', 'sos', 'mood', 'day-complete'].includes(ev.kind) ? ev.kind : 'smoke';

            eventsBatch.push({
              user_id: userId,
              client_event_id: clientEventId,
              date_key: dateKey,
              kind: kindClean,
              event_type: ev.type || 'sucesso',
              title: ev.title || '',
              desc_text: ev.desc || '',
              detail: ev.detail || '',
              mood_value: ev.moodValue || null,
              influences: Array.isArray(ev.influences) ? ev.influences : [],
              note: ev.note || '',
              clock_label: ev.clock || ev.time || '',
              occurred_at: new Date(ev.timestamp || eventId || Date.now()).toISOString()
            });
          }
        }
      }

      // Upsert seguro: onConflict em (user_id, date_key) para resumos diários
      if (dailyBatch.length > 0) {
        await client.from('daily_records').upsert(dailyBatch, { onConflict: 'user_id,date_key' });
      }

      // Upsert idempotente de eventos: ignora duplicatas sem erro
      if (eventsBatch.length > 0) {
        // Envia em fatias de 100 para respeitar limites de payload
        for (let i = 0; i < eventsBatch.length; i += 100) {
          const slice = eventsBatch.slice(i, i + 100);
          await client.from('habbi_events').upsert(slice, {
            onConflict: 'user_id,client_event_id',
            ignoreDuplicates: true
          });
        }
      }

      // 3. Minigame records: mantém o MAIOR recorde (Math.max)
      const localGames = snapshot.gameRecords || {};
      const { data: remoteGames } = await client.from('minigame_records').select('game_key, best_score').eq('user_id', userId);
      const remoteMap = {};
      if (Array.isArray(remoteGames)) {
        remoteGames.forEach(r => { remoteMap[r.game_key] = r.best_score; });
      }

      const gameBatch = ['memory', 'sequence', 'math', 'reflex'].map(gk => ({
        user_id: userId,
        game_key: gk,
        best_score: Math.max(Number(localGames[gk]) || 0, Number(remoteMap[gk]) || 0)
      }));
      await client.from('minigame_records').upsert(gameBatch, { onConflict: 'user_id,game_key' });

      // Marca flag de migração concluída para este usuário
      localStorage.setItem(migrationFlagKey, 'true');
      return { success: true };
    } catch (err) {
      console.warn('[Habbi Supabase] Erro durante migração local -> nuvem:', err);
      return { success: false, error: err.message };
    }
  }

  // ==========================================================================
  // SINCRONIZAÇÃO NUVEM -> LOCAL (PULL CLOUD DATA)
  // ==========================================================================
  async function pullCloudDataToLocal(userId) {
    if (!userId) return null;
    const client = getClient();
    if (!client) return null;

    try {
      const [profRes, prefsRes, goalsRes, daysRes, eventsRes, gamesRes] = await Promise.all([
        client.from('profiles').select('*').eq('id', userId).maybeSingle(),
        client.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
        client.from('user_goals').select('*').eq('user_id', userId).maybeSingle(),
        client.from('daily_records').select('*').eq('user_id', userId),
        client.from('habbi_events').select('*').eq('user_id', userId).order('occurred_at', { ascending: false }),
        client.from('minigame_records').select('*').eq('user_id', userId)
      ]);

      const profile = profRes.data || {};
      const prefs = prefsRes.data || {};
      const goals = goalsRes.data || {};
      const days = daysRes.data || [];
      const events = eventsRes.data || [];
      const games = gamesRes.data || [];

      // Monta mapa de eventos agrupados por data
      const eventsByDate = {};
      events.forEach(ev => {
        const dKey = ev.date_key;
        if (!eventsByDate[dKey]) eventsByDate[dKey] = [];
        eventsByDate[dKey].push({
          id: ev.client_event_id ? ev.client_event_id.replace(/^local-[^\\-]+-/, '') : ev.id,
          clientEventId: ev.client_event_id,
          timestamp: new Date(ev.occurred_at).getTime(),
          dateKey: dKey,
          kind: ev.kind,
          type: ev.event_type,
          title: ev.title,
          clock: ev.clock_label,
          time: ev.clock_label,
          desc: ev.desc_text,
          detail: ev.detail,
          moodValue: ev.mood_value,
          influences: ev.influences || [],
          note: ev.note
        });
      });

      // Monta dailyRecords local
      const dailyRecords = {};
      days.forEach(d => {
        const dKey = d.date_key;
        dailyRecords[dKey] = {
          dateKey: dKey,
          meta: d.meta,
          cigs: d.cigs_count,
          urges: d.urges_count,
          smokeFree: Boolean(d.smoke_free),
          dayCompleted: Boolean(d.day_completed),
          latestMood: d.latest_mood,
          events: eventsByDate[dKey] || []
        };
      });

      // Recordes de jogos
      const gameRecords = { memory: 0, sequence: 0, math: 0, reflex: 0 };
      games.forEach(g => {
        if (g.game_key && gameRecords[g.game_key] !== undefined) {
          gameRecords[g.game_key] = g.best_score;
        }
      });

      return {
        profile,
        prefs,
        goals,
        dailyRecords,
        gameRecords
      };
    } catch (err) {
      console.warn('[Habbi Supabase] Erro ao puxar dados da nuvem:', err);
      return null;
    }
  }

  // ==========================================================================
  // SINCRONIZAÇÃO EM SEGUNDO PLANO (LOCAL -> CLOUD)
  // ==========================================================================
  async function syncLocalChangesToCloud() {
    if (isSyncing) return;
    const client = getClient();
    if (!client) return;

    try {
      const sess = await getSession();
      if (!sess || !sess.user) return;
      const userId = sess.user.id;

      isSyncing = true;

      // 1. Sincroniza preferências e metas ativas
      if (typeof window !== 'undefined' && window.userState) {
        const u = window.userState;
        await client.from('user_preferences').upsert({
          user_id: userId,
          language: u.currentLang || 'PT',
          theme: u.theme || 'light',
          onboarding_completed: Boolean(u.onboardingCompleted),
          tutorial_completed: Boolean(u.tutorialCompleted),
          has_configured_first_goal: Boolean(u.hasConfiguredFirstGoal),
          sacola_100_celebrated: Boolean(u.sacola100Celebrated)
        }, { onConflict: 'user_id' });

        await client.from('user_goals').upsert({
          user_id: userId,
          today_meta: typeof u.todayMeta === 'number' && u.todayMeta >= 0 ? u.todayMeta : 11,
          habitual_cigs: typeof u.habitualCigs === 'number' && u.habitualCigs >= 1 ? u.habitualCigs : 12,
          habitual_cigs_customized: Boolean(u.habitualCigsCustomized),
          pack_price: typeof u.packPrice === 'number' && u.packPrice > 0 ? u.packPrice : 15.00,
          cigs_per_pack: typeof u.cigsPerPack === 'number' && u.cigsPerPack >= 1 ? u.cigsPerPack : 20,
          savings_goal_title: u.savingsGoal && u.savingsGoal.title ? u.savingsGoal.title : 'Minha conquista',
          savings_goal_target: u.savingsGoal && typeof u.savingsGoal.target === 'number' ? u.savingsGoal.target : 250.00
        }, { onConflict: 'user_id' });

        // Sincroniza resumo diário de hoje
        const todayKey = (typeof window.getDateKey === 'function') ? window.getDateKey(new Date()) : new Date().toISOString().slice(0, 10);
        if (u.dailyRecords && u.dailyRecords[todayKey]) {
          const rec = u.dailyRecords[todayKey];
          await client.from('daily_records').upsert({
            user_id: userId,
            date_key: todayKey,
            meta: typeof rec.meta === 'number' && rec.meta >= 0 ? rec.meta : 11,
            cigs_count: typeof rec.cigs === 'number' && rec.cigs >= 0 ? rec.cigs : 0,
            urges_count: typeof rec.urges === 'number' && rec.urges >= 0 ? rec.urges : 0,
            smoke_free: Boolean(rec.smokeFree),
            day_completed: Boolean(rec.dayCompleted),
            latest_mood: rec.latestMood || null
          }, { onConflict: 'user_id,date_key' });
        }
      }

      // 2. Drena fila offline se houver itens pendentes
      await flushOfflineQueue();
    } catch (err) {
      console.warn('[Habbi Supabase] Sincronização em segundo plano pausada (offline):', err);
    } finally {
      isSyncing = false;
    }
  }

  function triggerDebouncedSync() {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      syncLocalChangesToCloud();
    }, 800);
  }

  async function flushOfflineQueue() {
    const queue = loadSyncQueue();
    if (queue.length === 0) return;

    const client = getClient();
    if (!client) return;

    const remaining = [];
    for (const item of queue) {
      try {
        if (item.type === 'habbi_event' && item.payload) {
          await client.from('habbi_events').upsert(item.payload, {
            onConflict: 'user_id,client_event_id',
            ignoreDuplicates: true
          });
        } else if (item.type === 'daily_record' && item.payload) {
          await client.from('daily_records').upsert(item.payload, { onConflict: 'user_id,date_key' });
        } else if (item.type === 'minigame_record' && item.payload) {
          await client.from('minigame_records').upsert(item.payload, { onConflict: 'user_id,game_key' });
        }
      } catch (_e) {
        remaining.push(item);
      }
    }
    saveSyncQueue(remaining);
  }

  // Listener para restabelecimento de conexão
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      syncLocalChangesToCloud();
    });
  }

  // ==========================================================================
  // EXPORTAÇÃO GLOBAL
  // ==========================================================================
  window.HabbiSupabaseAuthSync = Object.freeze({
    isAvailable: isSupabaseAvailable,
    getClient: getClient,
    getCurrentUser: getCurrentUser,
    getSession: getSession,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    sendPasswordResetEmail: sendPasswordResetEmail,
    updateUserPassword: updateUserPassword,
    migrateLocalVisitorData: migrateLocalVisitorData,
    pullCloudDataToLocal: pullCloudDataToLocal,
    syncLocalChangesToCloud: syncLocalChangesToCloud,
    triggerDebouncedSync: triggerDebouncedSync,
    flushOfflineQueue: flushOfflineQueue,
    getAuthText: getAuthText
  });
})();
