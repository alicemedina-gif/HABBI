# Relatório 04 — Revisor Crítico Independente (`critico`)

## Metadados da Execução (Registro do Experimento)

| Campo | Registro |
| :--- | :--- |
| **Agente executado** | `critico` (prompt original preservado em `docs/experimento-agentes/originais-professora/critico.md`, SHA-256 `278C4C038139`) |
| **Ferramenta / Plataforma** | Antigravity — subagente isolado via `define_subagent` + `invoke_subagent` |
| **Modelo utilizado** | Claude Opus 4.6 (Thinking) — herdado da sessão coordenadora (`Model: inherit`) |
| **Data da execução** | 2026-11-18 |
| **Restrições técnicas efetivamente aplicadas** | `EnableWriteTools: false`, `EnableMCPTools: false`, `EnableSubagentTools: false` (modo estritamente **somente leitura**, sem edição de arquivos nem execução de comandos) |
| **Contexto fornecido ao agente** | Relatórios completos `01-relatorio-especialista-ux.md`, `02-relatorio-especialista-usabilidade.md` e `03-relatorio-especialista-acessibilidade.md` + acesso direto aos arquivos originais do Habbi (`DESIGN_SYSTEM.md`, `AGENTS.md`, `index.html`, `app.js`, `style.css`) para confrontação adversarial independente contra o código real. |
| **Prompt aplicado** | `SystemPrompt` = conteúdo integral verbatim de `critico.md` + tarefa de Etapa 4 (verificar afirmações dos 3 relatórios diretamente no código, detectar falsos positivos/código morto, expor contradições entre recomendações, levantar pontos cegos de segurança/privacidade/lógica/ética/documentação, separar fatos de hipóteses e emitir veredicto). |

---

## Saída Integral do Agente

# Revisão Crítica Independente (`critico`) — Etapa 4 (Habbi)

Revisão adversarial independente dos relatórios `01-relatorio-especialista-ux.md`, `02-relatorio-especialista-usabilidade.md` e `03-relatorio-especialista-acessibilidade.md`, confrontados diretamente contra `index.html`, `app.js`, `style.css`, `DESIGN_SYSTEM.md` e `AGENTS.md` (modo somente leitura).

---

## Veredito

**Aprovar com ajustes.** Os três relatórios diagnosticam corretamente a maioria dos defeitos centrais de fluxo, usabilidade e acessibilidade no Calendário, no Registro de Cigarros e no Carrossel Principal, porém **não estão prontos para guiar diretamente a Etapa 5 (`dev-fullstack-senior`)**: deixaram passar vulnerabilidades bloqueantes (Stored XSS, perda silenciosa de dados no logout, furo de autenticação de visitantes e erro lógico na economia), produziram especificações conflitantes entre si em pontos-chave e classificaram código morto como defeito ativo.

---

## Problemas bloqueantes

Estes itens impedem a entrega direta dos relatórios como especificação para implementação sem decisão e correção prévia:

### 1. [Ponto cego de todos os 3 especialistas — Segurança] Stored XSS no Calendário e no Histórico via `innerHTML` sem sanitização
- **Evidência comprovada no código:**
  - `saveQuickMood()` (`app.js:5853-5860`) grava o texto livre de `#wl-qreg-mood-note` diretamente em `note`, `desc` e `detail` sem escape.
  - `createEventRowEl()` no Calendário (`app.js:7514-7527`) interpola `${ev.title}`, `${ev.desc}` e `${subText}` diretamente em `item.innerHTML`.
  - `renderHistoryTimeline()` no Histórico (`app.js:8469-8485`) interpola `${evt.title}`, `${evt.time}` e `${evt.desc || evt.detail}` em `wrapper.innerHTML`.
  - `createEventRowEl()` (`app.js:7531, 7535`) e o histórico de economia (`app.js:3648`) interpolam `selKey` e `ev.id` dentro de atributos `onclick="..."` em strings HTML; como `habbiRestoreData()` (`app.js:2567-2606`) restaura JSON arbitrário para `localStorage` sem validar/sanitizar strings ou tipos dos eventos, um backup adulterado ou uma nota com `<img src=x onerror=...>` executa código arbitrário no contexto da aplicação.
- **Caminho de resolução:** Substituir `innerHTML` por construção DOM com `textContent` (ou escape estrito de HTML) para todos os dados de usuário e anexar listeners via `addEventListener` em vez de `onclick="..."` interpolado; validar schema e tipos em `habbiRestoreData()`.

### 2. [Conflito direto entre relatórios] Contradições de especificação que forçariam o `dev-fullstack-senior` a escolher arbitrariamente
- **Conflito A — Palco do cigarro (`#home-cig-meter`, `app.js:4925`):**
  - `especialista-ux` (E8, E12, Rec. 3) e `especialista-usabilidade` (Item 5, Prioridade Alta #4) recomendam **remover o `onclick`** de `#home-cig-meter` para eliminar registros acidentais e o conflito com o swipe horizontal.
  - `especialista-acessibilidade` (Item 3, linha 96) marca como **"Opção A (recomendada — manter interativo como `<button>`)"** transformar `#home-cig-meter` em `<button type="button" onclick="handleHomeAddCigarette()">`. Implementar a Opção A preserva integralmente o defeito de registro acidental e conflito de swipe apontado pelos outros dois especialistas.
- **Conflito B — Indicadores do Carrossel (`.wl-pager-dot`, `index.html:229-233`, `style.css:7858-7896`):**
  - `especialista-ux` (E9, Rec. 4) e `especialista-usabilidade` (Item 4, Prioridade Alta #2) recomendam substituir os 3 pontos anônimos por **abas/seletor segmentado com rótulos visíveis** (`Conquista | Início | Minijogos`).
  - `especialista-acessibilidade` (Itens 2 e 9) fornece código pronto mantendo **pontos de 8×8 px sem texto visível** e com `min-width: 24px; min-height: 24px` — o que mantém a baixa descobribilidade visual e **viola a exigência explícita de 44×44 px** de `AGENTS.md:126` e `DESIGN_SYSTEM.md:169`.
- **Caminho de resolução:** Decisão humana explícita antes da Etapa 5. A opção tecnicamente mais simples e convergente para os três critérios é: (1) tornar `#home-cig-meter` não clicável (`aria-hidden="true"` na ilustração, mantendo a ação exclusivamente no botão `+ Registrar cigarro`) e (2) adotar um seletor segmentado rotulado (`role="tablist"` + 3 `<button role="tab">` com texto visível e `min-height: 44px`).

### 3. [Ponto cego — Lógica de negócio / Efeito comportamental invertido] Economia estimada "sobe" no exato momento em que o usuário registra que fumou um cigarro
- **Evidência comprovada no código:** Em `computeSavingsMetrics()` (`app.js:3382-3403`) e `updateSavingsDisplay()` (`app.js:3478-3495`), quando ainda não há dias finalizados (`confirmedDaysCount === 0`), o app promove `m.todaySavings` a valor principal (`showPartialAsHero = true`). Como `dayAvoided = Math.max(0, habitual - dayCigs)` (`app.js:3393`), se o usuário com `habitual = 12` e `packPrice = 15` (`R$ 0,75/cig`) registra o **1º cigarro fumado hoje**, a pílula no topo salta imediatamente de **`R$ 0,00` para `R$ 8,25`**; ao fumar o 2º cigarro, o valor **cai** para `R$ 7,50`. Pior: registrar apenas um humor às 8h (`todayCigs = 0`) faz a pílula saltar para `R$ 9,00` sem o dia ter terminado.
- **Impacto:** Quebra o modelo mental financeiro e introduz reforço positivo distorcido ao ato de fumar. Nenhum dos 3 especialistas notou esse cálculo.
- **Caminho de resolução:** Não promover economia "parcial" de dia em aberto para o indicador principal do topo (ou separar explicitamente "Economia consolidada" de "Projeção se não fumar mais hoje"), e impedir que eventos não-abstinência (como registro de humor) gerem projeção de dia limpo.

### 4. [Ponto cego — Privacidade, ética e perda de dados] Autenticação ilusória, furo de bloqueio para visitantes e "Sair da conta" destrutivo sem aviso
- **Evidência comprovada no código:**
  1. **Dados sensíveis de saúde/hábito em texto claro no `localStorage`** (`app.js:2413-2440`, chave `habbi-real-records-v2`): nome, e-mail, histórico de tabagismo, humor e notas livres ficam acessíveis a qualquer script na mesma origem (agravado pelo Stored XSS do item 1).
  2. **Furo de autenticação para visitantes:** `openToolFromFerramentas('gatilhos')` (`app.js:5068-5076`) abre `openQuickRegisterModal(null, 'mood')` sem verificar `userState.isAuthenticated`, e `saveQuickMood()` (`app.js:5845-5894`) **não chama** `requireAuthToRegister()`. Assim, visitantes bloqueados na Home e no Calendário conseguem gravar registros de humor/notas no `localStorage` via Ferramentas (e `btnMoodSubmit` da Tela 25 em `app.js:8536-8588` também não verifica autenticação).
  3. **Destruição silenciosa do histórico no logout:** `btn-login-submit` (`app.js:8039-8057`) e `btn-register-submit` (`app.js:8059-8078`) aceitam campos vazios, descartam a senha e ignoram o checkbox `#register-terms` (cujos links abrem `alert('Termos de Uso')` / `alert('Políticas de Privacidade')`, `index.html:919-921`). Ainda assim, a UI induz a pessoa a crer que criou uma conta persistente — mas `handleProfileLogout()` (`app.js:8663-8732`) executa `localStorage.removeItem(RECORDS_STORAGE_KEY)` e zera `dailyRecords` **sem confirmação nem aviso**, apagando irreversivelmente todo o histórico. Além disso, os itens "Backup e dados" e "Privacidade" em Configurações (`index.html:831-832`) não têm ação vinculada, apesar de `habbiDownloadBackupFile()` existir em `app.js:2630-2647`.
- **Caminho de resolução:** Exigir confirmação explícita antes de apagar dados locais no logout (informando claramente que os dados vivem apenas no dispositivo), expor a função de exportação/backup já existente na UI de Configurações, eliminar o bloqueio inconsistente de visitantes (permitindo uso local transparente ou aplicando a regra de modo uniforme) e substituir os `alert()` de privacidade por um aviso honesto sobre armazenamento local e natureza acadêmica do protótipo.

---

## Problemas importantes

### 1. Falsos positivos e código morto tratados como defeitos ativos nos relatórios
A inspeção direta do código mostrou que os relatórios cometeram erros de escopo/estado real do código que inflariam retrabalho na Etapa 5:
- **`ensureCalTutorialDemoRow()` (`app.js:9080-9113`) é código morto:** `especialista-ux` (E1) e `especialista-usabilidade` (Item 2) afirmaram que o tutorial contradiz o produto ao exibir *"No calendário real você edita horários e detalhes."* (`app.js:9101`). Na realidade, **nenhum passo de `HABBI_TUTORIAL_STEPS` (`app.js:9131-9216`) invoca `ensureCalTutorialDemoRow()`** (apenas `removeCalTutorialDemoRow()` é chamada como resquício de versão anterior). O defeito real de o botão `Editar` em `.wl-cal-event-row` (`app.js:7531`) não editar cigarros/vontades **é verdadeiro**, mas a promessa no tutorial ativo não existe.
- **Tela 11 (`data-screen="11"`, `.quick-register-grid`) é inalcançável via navegação normal:** `showScreen(11)` (`app.js:3046-3055`) intercepta qualquer acesso e abre `#wl-quick-register-modal`. Ainda assim, `especialista-acessibilidade` classificou contrastes de `.btn-quick-choice.*` (Item 11) e o botão fechar `<div onclick="handleBackFromScreen(11)">` (Item 13) como **Severidade ALTA** em Prioridade 2. O caminho mais simples não é "consertar CSS/HTML da Tela 11", e sim **remover o código morto** (`index.html:404-417`, `app.js:3230-3241`, `app.js:8390-8416`, `style.css:1175-1216`).
- **`.slide-in-*` / `.slide-out-*` (`style.css:7799-7855`):** citadas por `especialista-acessibilidade` (Item 16) no escopo de `prefers-reduced-motion` do Carrossel Principal, mas `goToCarouselSlide()` (`app.js:3991-3992`) não usa essas classes (usa `translate3d` inline).
- **Disparo duplicado em `#btn-home-sos` (`app.js:4954` + `app.js:8341-8344`):** confirmado como real (`applyHabbiFlatDesign()` roda na linha 5588 antes do listener da linha 8341), porém de impacto baixo: na 2ª execução `currentScreen` já é `12`, logo `sosReturnScreen` (`app.js:3058`) não é sobrescrito, mas `handleScreenEntry(12)` e `applyAppLanguage()` rodam duas vezes. Deve ser limpo, sem prioridade crítica.

### 2. Pontos cegos de Acessibilidade dentro do escopo do Carrossel Principal (Slide 0 — Conquista) e Modo Escuro
O `especialista-acessibilidade` auditou bem a Home (Slide 1), o Calendário e os Minijogos (Slide 2), mas deixou passar defeitos equivalentes no **Slide 0 (Conquista, `data-screen="29"`)** e no modo escuro do **Painel Rápido**:
- **Dois `<div role="button" tabindex="0">` sem teclado no Slide 0:** `.wl-conquista-goal-card` (`app.js:5206`) e `#wl-conquista-bag-stage` (`app.js:5218`) têm `onclick="openChangeGoalModal()"` mas nenhum handler `keydown` para `Enter`/`Space` (mesmo erro encontrado nos cards de Minijogos no Item 8).
- **Modais da Tela 29 sem padrão Dialog completo e controles sem nome acessível:** `#wl-goal-modal-overlay` (`app.js:5310`, sem `aria-modal="true"`) e `#wl-sav-sheet-overlay` (`app.js:5329`) não movem foco, não contêm `Tab`, não fecham com `Escape` e não restauram foco. Além disso, os botões `−`/`+` de "Consumo habitual" (`app.js:5344, 5346`) não possuem `aria-label` (diferente dos controles de preço/maço logo abaixo).
- **Alvos de toque abaixo de 44×44 px na Tela 29:** `.wl-sav-step-btn` (`34×34 px`, `style.css:6904-6906`), `.wl-sav-freq-chip` (`height: 34 px`, `style.css:6957-6958`) e `.wl-sav-history-del` (`24×24 px`, `style.css:7067-7069`).
- **Falhas de contraste no tema escuro omitidas:**
  - `.wl-qreg-step-btn.plus` (`style.css:5826-5831`): `background-color: #1F2A37` sobre `var(--bg-color)` (`#121214` no escuro), sem override `.dark-theme`, gerando contraste de limite ~1,28:1 (falha WCAG 1.4.11 AA).
  - `.wl-sav-history-right strong.pos` (`#2D6A1E` ≈ 2,8:1) e `strong.neg` (`#0F3D5E` ≈ 1,7:1) sobre `#121214` no modo escuro (`style.css:7059-7065`), sem override `.dark-theme` (falha WCAG 1.4.3 AA).

### 3. Pontos cegos de Internacionalização (i18n) em textos visíveis e dados persistidos
Os especialistas apontaram apenas `aria-label` em PT e `<html lang="pt-BR">` fixo, mas ignoraram falhas visíveis em PT/EN/ES:
- **Home multilíngue quebrada (`app.js:4889, 4892` vs `app.js:1698-1730`):** os textos literais `"hoje"` (`0 / 11 hoje`) e `"da meta de hoje"` (`0% da meta de hoje`) **nunca são atualizados** por `applyAppLanguage()`. Em inglês, a Home exibe mistura de idiomas (*"0 / 11 hoje"* e *"0 days smoke-free • 0% da meta de hoje"*).
- **Eventos persistidos hardcoded em Português:** `recomputeDayAggregates()` (`app.js:2692-2695`), `recordHabbiEvent()` (`app.js:2951`), `quickAdjustCigarette` (`app.js:5735-5737`), `quickConfirmDay` (`app.js:5774-5776`), `quickAddUrge` (`app.js:5806-5808`) e `saveQuickMood` (`app.js:5867`) gravam textos finais em Português (`Cigarro registrado`, `Não fumei hoje`, `Hoje, 14:30`, `Humor: Feliz`) no `localStorage`. Ao trocar o idioma para EN/ES, Calendário e Histórico continuam exibindo o histórico em Português — e o mesmo ocorre com strings da Tela 29 em `app.js:3414-3415, 3506-3525, 3630, 3642-3643`.

### 4. Pontos cegos de casos de borda temporais e inconsistência de padrões numéricos
- **Virada da meia-noite com app aberto:** `initialNow` (`app.js:86, 113-117`) fixa `calViewYear`, `calViewMonth`, `calSelectedDate` e `activeRegisterDateKey` no carregamento. Sem listener de mudança de dia (`visibilitychange`/timer), uma aba aberta após 00:00 continua exibindo o consumo e o badge de dia anterior na Home até o usuário disparar uma ação.
- **Data UTC no nome do arquivo de backup:** `habbiDownloadBackupFile()` (`app.js:2640`) usa `new Date().toISOString().slice(0, 10)` (UTC) em vez de `getDateKey(new Date())` (local), gerando data do dia seguinte após 21h no horário de Brasília (UTC-3).
- **Defaults divergentes de preço/consumo:** `userState` nasce com `todayMeta: 11`, `habitualCigs: 12`, `packPrice: 15.00` (`app.js:107, 131, 133`), enquanto `index.html:145` define `value="10.00"` e `app.js:5279` exibe `R$ 0,50 / cigarro` no markup inicial.

### 5. Divergências estruturais e contradições na própria documentação (`DESIGN_SYSTEM.md` e `AGENTS.md`)
Nenhum especialista confrontou a documentação oficial como fonte possivelmente desatualizada ou incoerente:
- **`AGENTS.md` contradiz a si mesmo:** a linha `98` exige `color: #FFFFFF !important` nos `.btn-quick-choice` no modo escuro, incluindo o botão amarelo (`.urge`, `#FBC016` → contraste `1,66:1`), violando diretamente a regra de contraste mínimo `4,5:1` da linha `125` do mesmo documento.
- **`AGENTS.md:3.2` vs snippets dos relatórios:** `AGENTS.md:52-58` proíbe cores hexadecimais fora dos tokens `:root`. O código atual já descumpre amplamente essa regra, e os snippets do `especialista-acessibilidade` introduzem mais hexadecimais soltos (`#64748B`, `#1E293B`, `#FCA5A5`, `#C53030`) em vez de definir tokens semânticos em `:root` / `.dark-theme`.
- **`DESIGN_SYSTEM.md` faz afirmações falsas sobre a implementação atual:**
  - Afirma detecção de `prefers-color-scheme` (`DESIGN_SYSTEM.md:247`), mas `app.js:8650` faz `localStorage.getItem('habbi-theme') || 'light'`.
  - Afirma que todas as cores cumprem WCAG 2.2 AA (`DESIGN_SYSTEM.md:83`), nenhum alvo é `< 44×44 px` (`DESIGN_SYSTEM.md:169`) e modais têm foco contido e fechamento por `Escape` (`DESIGN_SYSTEM.md:311`) — tudo refutado pelo código.
  - Descreve uma Home com Morgana + `.bottom-nav` de `68px` (`DESIGN_SYSTEM.md:58, 164, 208`; `AGENTS.md:28, 114-115`), que foi substituída em runtime por `applyHabbiFlatDesign()` (`app.js:4881-5022`) e `style.css:4587-4589`.
  - `AGENTS.md:48` proíbe `blur`, mas `style.css:3893` usa `filter: blur(1.6px)` na Tela 7 (configuração de meta/preço).

### 6. Ética em produto digital de saúde (dependência química)
- O aplicativo oferece intervenção para fissura (*craving*) e suporte a cessação do tabagismo sem nenhum aviso visível de que se trata de **protótipo acadêmico de apoio comportamental que não substitui orientação médica ou psicológica** (nem indicação clara de serviços públicos como o Programa Nacional de Controle do Tabagismo / SUS — apenas o CVV aparece no modal de suporte do SOS).
- Somar a isso o cigarro gigante no centro da Home (`cue reactivity`), a escala cromática que escurece até `#4A0E17` sem acolhimento e a economia que salta ao registrar o 1º cigarro cria risco real de dano motivacional/emocional em usuários vulneráveis caso o protótipo seja testado fora de ambiente controlado.

---

## Pontos a verificar

### (a) Separação rigorosa: o que NÃO foi provado no código (hipóteses do produto e dos relatórios)
Os pontos abaixo aparecem nos relatórios (ou emergem do produto) como riscos plausíveis, mas **não são fatos comprováveis por inspeção estática**:
1. **Reatividade a gatilhos visuais (*cue reactivity*) do cigarro central vs. Morgana (UX H1):** o desvio em relação a `DESIGN_SYSTEM.md` é fato verificado; se o desenho do cigarro *de fato* aumenta fissura ou ajuda no automonitoramento depende de teste empírico com fumantes.
2. **Interpretação de `0 / 11 hoje • 0% da meta de hoje` e preenchimento verde (Usabilidade b.1 e b.3):** a ambiguidade semântica é plausível, mas o impacto real na compreensão exige teste moderado.
3. **Compreensão da pílula monetária como dinheiro real/cashback (UX H2):** a existência do disclaimer no tutorial sugere preocupação prévia da autora, mas não comprova confusão recorrente.
4. **Conflito de `touchmove` `{ passive: false }` do carrossel com VoiceOver/TalkBack (Acessibilidade b.1):** precisa de teste em iOS e Android reais.
5. **Contraste computado de filtros SVG (`feFlood` + transparência via Canvas) e recorte de `:focus-visible` sob `overflow: hidden` (Acessibilidade b.2 e b.4):** dependem de medição em navegador real.
6. **Quebra de layout e reflow em `320×568 px` e zoom `200%` (Acessibilidade b.3; Usabilidade Item 11):** estimativas de dobra e sobreposição precisam ser validadas em runtime.

### (b) Decisões humanas obrigatórias antes da Etapa 5 (`dev-fullstack-senior`)
Nenhuma destas decisões deve ser tomada unilateralmente pelo desenvolvedor:
1. **Identidade da Home (`data-screen="10"`):** manter o medidor de cigarro (corrigindo estágios, contraste e removendo `onclick` da imagem) **ou** restaurar protagonismo da mascote Morgana conforme `DESIGN_SYSTEM.md` / `AGENTS.md`? (Se mantiver o cigarro, atualizar `DESIGN_SYSTEM.md` e `AGENTS.md` para encerrar a contradição documental.)
2. **Regra do modo visitante:** remover o bloqueio de login no primeiro registro (permitindo uso local completo com convite opcional) **ou** manter a barreira de conta — e, neste caso, fechar o furo em `saveQuickMood()` e explicar o bloqueio com feedback claro?
3. **Regra de cálculo da economia estimada:** exibir apenas dias finalizados no topo/hero **ou** mostrar "projeção de hoje" separada e somente após ação intencional (sem subir ao registrar o 1º cigarro)?
4. **Navegação do Carrossel Principal:** adotar abas/pílulas rotuladas (`Conquista | Início | Minijogos`) com `min-height: 44px` no topo, substituindo os 3 pontos anônimos?
5. **Escopo do botão `Editar` no Calendário:** implementar edição real de horário/detalhes para `smoke`/`urge`/`no-smoke` **ou** restringir `Editar` exclusivamente a registros `mood`?
6. **Código morto (`data-screen="11"`, `data-screen="25"`, `ensureCalTutorialDemoRow`):** autorizar remoção definitiva para evitar manutenção duplicada e falsos alertas futuros?

---

## O que está sólido

Fatos verificados diretamente no código-fonte que **se sustentam integralmente** e podem ir para o backlog de implementação após as decisões humanas:

1. **Verificações matemáticas de contraste do `especialista-acessibilidade`:** confirmadas por cálculo direto — `#4A0E17` sobre `#121214` ≈ **1,22:1** (`app.js:6055`), `.wl-pager-dot.active` `#1E293B` sobre `#121214` ≈ **1,28:1** (`style.css:7894`), `#5FB149` sobre `#FFFFFF` ≈ **2,67:1** (`style.css:4702, 5262, 5742` — falhando inclusive o limite 3,0:1 de texto grande em `.wl-cal-metric-box strong`), e `#FFFFFF` sobre `#6CCB4F` ≈ **2,04:1** (`style.css:5860, 6010`).
2. **Bugs de integridade no Calendário (UX E2/E3, Usabilidade Item 3):** confirmados em `quickConfirmDay()` (`app.js:5762-5765` apaga cigarros sem confirmação; `app.js:5780-5792` altera `todayKey` colateralmente; rótulo fixo `"Não fumei hoje"`), `recordHabbiEvent()` (`app.js:2944` sobrescreve `rec.meta` histórico e `2947` grava hora atual em data passada) e `generateCalendar()` (`app.js:7344-7390` permite datas futuras, o que infla `daysClean` e economia em `app.js:2748, 3395`).
3. **Promessa quebrada do botão `Editar` no Calendário (UX E1, Usabilidade Item 2):** confirmada em `app.js:7531` + `openQuickRegisterModal()` (`app.js:5634, 5648-5651`).
4. **Silenciamento global de `showToast()` (UX E6, Usabilidade Item 1, Acessibilidade Item 5):** confirmado em `app.js:3035-3038` e `style.css:2014-2019`, deixando redirecionamentos de autenticação, remoção de cigarro e salvamento de humor sem feedback visual nem `aria-live`.
5. **Sobreposição de alvos nos `.wl-pager-dot` (UX Encaminhamento, Usabilidade Item 4, Acessibilidade Item 9):** confirmada em `style.css:7858-7887` (`6 px` com `gap: 6 px` e `::before` de `44×44 px`).
6. **Barreiras críticas de teclado/ARIA (Acessibilidade Itens 1, 2, 4, 5, 7, 8, 13, 14):** confirmadas — slides inativos sem `inert`/`aria-hidden` (`style.css:10040-10051`), `role="tablist"` sem `role="tab"`/`aria-selected` e `aria-label` congelado (`index.html:229-233`, `app.js:3996-4001`), `#wl-quick-register-modal` sem `role="dialog"`/`Escape`/focus trap (`app.js:5480, 5626-5706`), perda de foco ao clicar em dias do calendário (`grid.innerHTML = ''` em `app.js:7290`) e ao desabilitar `−` (`app.js:6011`), falso `"Sem registros (Hoje)"` no `aria-label` do dia em andamento (`app.js:2739-2740, 7356`), 4 cards de Minijogos `<div role="button">` sem `keydown` (`index.html:342-383`, `app.js:8419-8426`), `#wl-qreg-mood-note` sem `<label>` (`app.js:5550`), e `#wl-cal-toggle-events-btn` sem `aria-expanded`/`aria-controls` (`app.js:7569-7591`).
7. **Inconsistências de navegação em Minijogos e Home (UX E5/E8/E11, Usabilidade Itens 6, 7, 8, 9, 10):** confirmadas — recuo visual de preenchimento 100% → 50% acima da meta (`app.js:6077-6101`), `meta-exceeded-modal` nunca acionado (`app.js:8593-8615`), encerramento silencioso de minijogo ativo pelo cabeçalho fixo (`app.js:3974-3981`), divergência entre `handleMinijogosBack` (`app.js:7995-8005`) e `handleBackFromScreen(15)` (`app.js:7952-7956`), e `applyAppLanguage()` sobrescrevendo o sufixo `' ✓'` de `#wl-qreg-confirm-lbl` (`app.js:2265` vs `5617`).
8. **Verificação positiva de dark theme em dois controles:** ao contrário do que poderia parecer pela regra base, `.wl-home-savings-pill` e `.wl-home-sos-pill` possuem overrides adequados para o tema escuro em `style.css:9498-9507` (`#86EFAC` e `#FED7AA`).

---

## Limitações desta revisão crítica

1. **Inspeção exclusivamente estática:** nenhum código foi executado em navegador, simulador móvel (`320/390/430 px`) ou leitor de tela (NVDA, VoiceOver, TalkBack). Portanto, não foram medidos em runtime tempos de resposta, comportamento real de gestos touch/pointer, renderização dos filtros SVG (`feFlood`) combinados à remoção de fundo via Canvas nem eventual recorte visual de `:focus-visible`.
2. **Amostragem dirigida nos arquivos extensos (`app.js` com 9.437 linhas e `style.css` com 10.392 linhas):** foram lidos integralmente os 3 relatórios, `DESIGN_SYSTEM.md`, `AGENTS.md`, e todos os trechos de `index.html`, `app.js` e `style.css` ligados às 3 funcionalidades do escopo, à persistência/backup, à autenticação/logout, à internacionalização e aos overrides de tema escuro; módulos fora do escopo (como a lógica interna dos 4 minijogos, tela de respiração `13` e animações da splash `1`) não foram auditados linha a linha.
3. **Ausência de evidência empírica com usuários:** avaliações sobre impacto emocional, gatilho visual do cigarro, eficácia terapêutica e compreensão espontânea das métricas permanecem hipóteses que requerem validação qualitativa/quantitativa com pessoas reais em processo de redução ou cessação do tabagismo.
