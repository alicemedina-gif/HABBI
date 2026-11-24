# Plano de Integração Supabase — Habbi (Branch `feat/supabase-integration`)

## 1. Inventário Completo do `localStorage` Atual

| Chave no `localStorage` | Conteúdo / Estrutura | Telas e Funcionalidades Dependentes | Destino no Supabase |
| :--- | :--- | :--- | :--- |
| `habbi-real-records-v2` (`RECORDS_STORAGE_KEY`) | JSON principal: `name`, `email`, `avatar`, `currentLang`, `isAuthenticated`, `todayMeta`, `habitualCigs`, `habitualCigsCustomized`, `packPrice`, `cigsPerPack`, `packFreqDays`, `savingsGoal`, `tutorialCompleted`, `hasConfiguredFirstGoal`, `dailyRecords` (por `YYYY-MM-DD` com `events[]`), `packEvents`, `cigarettesAvoided`, `savingsHistory` | Home (10), Calendário (16), Quick Register, Minha Conquista / Gastos (29), Progresso (17), Histórico (19), Perfil (21), Minha Conta (28), Avatar (26), Backup/Restore | Distribuído em `profiles`, `user_preferences`, `user_goals`, `daily_records`, `habbi_events`, `pack_events` |
| `habbi-game-records` (`GAME_RECORDS_KEY`) | `{ memory, sequence, reflex, math }` | Minijogos (15) — recordes nos 4 cards e durante partidas | `minigame_records` |
| `habbi-theme` | `'light'` ou `'dark'` | Tema global (`.device-screen.dark-theme`) e Configurações (22) | `user_preferences.theme` (+ espelho local instantâneo no boot) |
| `habbi-app-lang` | `'PT'`, `'EN'` ou `'ES'` | Splash (1), Configurações (22) e todo o dicionário `HABBI_I18N` | `user_preferences.language` (+ espelho local instantâneo) |
| `habbi-onboarding-completed` | `'1'` | Fluxo inicial (Telas 3–5 e 7) e disparo do tutorial | `user_preferences.onboarding_completed` |
| `habbi-tutorial-completed` | `'1'` | Tutorial interativo da Home (6 etapas) | `user_preferences.tutorial_completed` |
| `habbi-first-goal-set` | `'1'` | Configuração inicial de meta na Conquista (29) | `user_preferences.has_configured_first_goal` |
| `habbi-sacola-100-celebrated` | `'true'` | Confetes únicos ao atingir 100% da sacola (29) | `user_preferences.sacola_100_celebrated` |
| `habbi-current-screen` | Número da tela (`1`..`29`) | Navegação transitória da sessão | **Permanece somente local** (não vai para a nuvem) |

---

## 2. Observação Importante sobre a Project URL

- URL informada: `https://nkzzgdaiozlaeqnlaydk.supabase.co/rest/v1/`
- **Project URL correta para o SDK JS:** `https://nkzzgdaiozlaeqnlaydk.supabase.co` (sem `/rest/v1/`, pois o `@supabase/supabase-js` acrescenta `/auth/v1` e `/rest/v1` automaticamente).
- Chave pública configurada em `supabase/supabase-config.js`: `sb_publishable_C0FqDkGCUzJiazT5iqrlTQ_pzX2g-5O` (nenhuma secret key ou `service_role` no frontend).

---

## 3. O Que Configurar no Painel do Supabase (Antes da Etapa 2)

1. **Executar o SQL:**
   - Acesse **SQL Editor → New query**, cole o conteúdo completo de `supabase/schema.sql` e clique em **Run**.
   - Em **Table Editor**, confirme a criação das 7 tabelas (`profiles`, `user_preferences`, `user_goals`, `daily_records`, `habbi_events`, `pack_events`, `minigame_records`) e verifique o ícone de cadeado **RLS Enabled** em todas.
2. **Authentication → Providers → Email:**
   - Mantenha **Email** habilitado.
   - Deixe **Confirm email** habilitado (para ativar a confirmação de e-mail no cadastro).
   - Opcional (somente se quiser usar os botões "Entrar com Google"): configurar Google OAuth depois; caso contrário, ocultar ou sinalizar "Em breve" nos botões sociais na Etapa 2.
3. **Authentication → URL Configuration:**
   - **Site URL:** URL de produção do Vercel (ex.: `https://<seu-projeto>.vercel.app`).
   - **Redirect URLs** (adicionar todas que você usa para testar):
     - `https://<seu-projeto>.vercel.app/**`
     - `http://localhost:5500/**` (ou a porta local que você usar)
     - `http://127.0.0.1:5500/**`
4. **Authentication → Email Templates:**
   - Revisar os templates **Confirm signup** e **Reset password** (opcionalmente traduzir para português com o tom acolhedor do Habbi), garantindo que o link aponte para `{{ .ConfirmationURL }}` (ou `{{ .SiteURL }}#recovery` no reset).

---

## 4. Arquitetura Planejada (Etapa 2 — Após Sua Aprovação)

### 4.1 Autenticação nas Telas Existentes (21, 23, 24 e 28)
- **Cadastro (Tela 24):** `supabase.auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo } })`.
  - Valida nome, e-mail, senha (mín. 6 caracteres) e aceite de termos.
  - Se `data.session === null` (confirmação de e-mail ativada), exibe mensagem acolhedora pedindo para confirmar o link no e-mail + botão "Reenviar e-mail de confirmação" (`supabase.auth.resend`).
- **Login (Tela 23):** `supabase.auth.signInWithPassword({ email, password })`.
  - Mapeia erros comuns para PT/EN/ES (e-mail não confirmado, credenciais inválidas, sem conexão).
- **Recuperação de senha (link "Esqueceu a senha?" na Tela 23):**
  - Substitui o `alert(...)` atual por fluxo real `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
  - Ao abrir o link de recuperação (`onAuthStateChange` com evento `PASSWORD_RECOVERY`), abre a Tela 28 (ou modal dedicado de nova senha) chamando `supabase.auth.updateUser({ password })`.
- **Editar Conta (Tela 28):** atualiza `profiles.display_name`, `user_goals.today_meta`, `user_goals.pack_price` e, se preenchida a nova senha, `supabase.auth.updateUser({ password })`.
- **Logout (Tela 21):** `supabase.auth.signOut()`, limpa apenas a sessão autenticada e estado de conta sem destruir o app (retorna ao modo visitante limpo).

### 4.2 Migração Segura de Registros Locais → Conta (Sem Sobrescrever nem Duplicar)
Executada **uma única vez após o primeiro login confirmado**, somente se houver dados locais não migrados:
1. **Carrega estado remoto da conta** (`profiles`, `user_preferences`, `user_goals`, `daily_records`, `habbi_events`, `pack_events`, `minigame_records`).
2. **Eventos (`habbi_events` e `pack_events`) — Merge Idempotente por `client_event_id`:**
   - Cada evento local recebe `client_event_id = "local-" + dateKey + "-" + event.id` (determinístico).
   - Inserção com `upsert(..., { onConflict: 'user_id,client_event_id', ignoreDuplicates: true })`.
   - Resultado: **nunca duplica** eventos já enviados e **nunca apaga** eventos já existentes na nuvem.
3. **Resumos diários (`daily_records`):**
   - Após o merge de `habbi_events`, recalcula `cigs_count`, `urges_count`, `smoke_free`, `day_completed`, `latest_mood` por data e faz `upsert` por `(user_id, date_key)` somente para datas tocadas/combinadas.
4. **Recordes de minijogos (`minigame_records`):**
   - Mantém sempre o **maior valor**: `Math.max(localScore, remoteScore)`.
5. **Metas e Preferências (`user_goals`, `user_preferences`):**
   - Se a conta na nuvem for **nova** (sem registros/metas customizadas), envia os ajustes locais (meta diária, preço do maço, objetivo da sacola, tema, idioma).
   - Se a conta na nuvem **já tiver dados**, prioriza os dados da nuvem e não sobrescreve configurações existentes (oferecendo aviso discreto).
6. **Flag de controle:** grava `habbi-migrated-uid-<userId>` no `localStorage` para não repetir a migração em logins futuros, mantendo um backup JSON temporário (`habbi-pre-migration-backup`) em caso de falha de rede.

### 4.3 Modo Visitante e Funcionamento Offline-First
- **Modo Visitante:** quem não criou conta continua usando o Habbi exatamente como hoje (Splash, Onboarding, Home, Conquista, Minijogos, SOS, Tema, Idioma) 100% via `localStorage`, sem nenhuma chamada obrigatória à rede.
- **Offline-First (usuário logado sem internet):**
  - Toda ação (adicionar/remover cigarro, registrar humor, trocar meta, bater recorde) continua salvando **primeiro no `localStorage`** e atualizando a UI instantaneamente (0 ms).
  - As mutações pendentes entram em uma fila leve `habbi-sync-queue` no `localStorage`.
  - Quando `navigator.onLine` / evento `online` dispara (ou no próximo carregamento), a fila é drenada de forma idempotente para o Supabase.

---

## 5. Plano de Testes (Antes de Liberar para `main`)

| # | Cenário de Teste | Resultado Esperado |
| :--- | :--- | :--- |
| T1 | **SQL & RLS no Supabase** | As 7 tabelas existem com RLS ativo; usuário A não consegue ler/editar/deletar registros do usuário B; usuário `anon` recebe permissão negada. |
| T2 | **Modo Visitante (sem login)** | Abrir o app sem conta: navegar Splash → Onboarding → Home → Conquista → Minijogos → SOS; sem erros no console e sem chamadas quebradas. |
| T3 | **Cadastro + Confirmação de E-mail** | Criar conta na Tela 24 gera usuário no `auth.users`, dispara trigger criando `profiles`/`user_preferences`/`user_goals` e envia e-mail de confirmação. |
| T4 | **Login + Persistência de Sessão** | Entrar na Tela 23 com conta confirmada; recarregar a página mantém sessão ativa e carrega dados da nuvem. |
| T5 | **Recuperação de Senha** | Clicar em "Esqueceu a senha?" envia e-mail real; abrir link permite definir nova senha e logar com ela. |
| T6 | **Sincronização CRUD (Home/Calendário/Conquista/Minijogos)** | Adicionar cigarro, desfazer com `−`, registrar humor, alterar preço do maço, trocar meta da sacola e bater recorde refletem no Supabase e aparecem ao logar em outro navegador/dispositivo. |
| T7 | **Migração Local → Nuvem (sem duplicar/sobrescrever)** | Criar dados locais como visitante, depois logar em conta existente com outros registros: ambos os conjuntos se unem sem duplicatas; relogar não duplica novamente; maior recorde de minijogo prevalece. |
| T8 | **Offline → Online** | Desativar rede (DevTools Offline), registrar/remover cigarro e trocar tema: UI funciona normalmente; religar rede envia fila pendente sem duplicar. |
| T9 | **Logout Limpo** | Sair na Tela 21 encerra sessão no Supabase, limpa estado autenticado da tela e retorna ao modo visitante sem vazar dados da conta anterior. |
| T10 | **Regressão Visual & i18n** | Conferir 320, 390 e 430 px, temas claro e escuro, e idiomas PT/EN/ES nas telas 21, 23, 24 e 28. |
