# Relatório 01 — Especialista em UX (`especialista-ux`)

## Metadados da Execução (Registro do Experimento)

| Campo | Registro |
| :--- | :--- |
| **Agente executado** | `especialista-ux` (prompt original preservado em `docs/experimento-agentes/originais-professora/especialista-ux.md`, SHA-256 `8D2CBEF0A3AE`) |
| **Ferramenta / Plataforma** | Antigravity — subagente isolado via `define_subagent` + `invoke_subagent` |
| **Modelo utilizado** | Claude Opus 4.6 (Thinking) — herdado da sessão coordenadora (`Model: inherit`) |
| **Data da execução** | 2026-11-18 |
| **Restrições técnicas efetivamente aplicadas** | `EnableWriteTools: false`, `EnableMCPTools: false`, `EnableSubagentTools: false` (modo estritamente **somente leitura**, sem edição de arquivos nem execução de comandos) |
| **Contexto fornecido ao agente** | Repositório Habbi na branch `docs/experimento-agentes` (base estável `main` `bff8ef0`): `DESIGN_SYSTEM.md`, `AGENTS.md`, `index.html`, `app.js` e `style.css`, com foco exclusivo em **Calendário**, **Registro de Cigarros** e **Carrossel Principal**. |
| **Prompt aplicado** | `SystemPrompt` = conteúdo integral verbatim de `especialista-ux.md` + tarefa controlada idêntica para os 3 especialistas (escopo das 3 funcionalidades, caminhos absolutos dos arquivos, exigência de citação de arquivo/linha, separação explícita entre evidências comprovadas, hipóteses e recomendações, e declaração de limitações). |

---

## Saída Integral do Agente

# Avaliação de Experiência do Usuário (UX) — Habbi
**Escopo exclusivo:** (1) Calendário (`data-screen="16"`), (2) Registro de cigarros (Home `data-screen="10"` e fluxo de registro rápido), e (3) Carrossel principal (`#main-carousel-container`).  
**Abordagem:** Inspeção estática orientada a pessoas, jornada, modelo mental, proposta de valor, linguagem/tom e coerência emocional (modo somente leitura).

---

## Síntese da experiência atual

**Quem usa e em qual contexto:**  
Pessoas em processo de redução ou cessação do tabagismo — um contexto marcado por vulnerabilidade emocional, impulsos rápidos (*craving*/fissura), lapsos recorrentes e uso fragmentado ao longo do dia (no intervalo do trabalho, em casa, no transporte ou ao revisar o dia à noite). Segundo a documentação oficial do projeto (**Evidência:** `DESIGN_SYSTEM.md:28-30, 56`; `AGENTS.md:24-27`), a proposta de valor central do Habbi é substituir abordagens frias ou punitivas por **intervenção comportamental empática**, **micro-vitórias** e **acolhimento afetivo** mediado pela mascote Morgana.

**Coerência geral observada no código:**  
As três funcionalidades analisadas trazem decisões arquiteturais promissoras — como o registro de cigarro em um toque com desfazimento rápido (`−`), a visualização mensal com detalhamento diário expansível e o agrupamento das três superfícies centrais (Conquista ↔ Início ↔ Minijogos) em um fluxo horizontal contínuo.

Entretanto, a inspeção do código-fonte revela **tensões relevantes entre a proposta de valor empática prometida e a experiência efetivamente entregue**:
1. **Ruptura emocional e de confiança na Home:** a versão injetada em tempo de execução (`app.js:4881-5022`) substitui a mascote Morgana por um cigarro gigante que escurece até vermelho/bordô ao ultrapassar a meta, sem acolhimento nem explicação, enquanto o sistema de toasts foi silenciado globalmente (`app.js:3034-3038`).
2. **Expectativas quebradas e risco aos dados no Calendário:** há promessa de edição individual de registros que não se concretiza para cigarros/vontades, além de efeitos colaterais silenciosos ao confirmar dias retroativos.
3. **Baixa descobribilidade e fronteiras difusas no Carrossel:** a remoção da barra inferior deixou a navegação horizontal apoiada em 3 pontos sem rótulos e com a dica de arrasto permanentemente desativada, ao mesmo tempo em que o gesto de swipe disputa espaço com áreas clicáveis de registro na Home.

---

## (a) Problemas comprovados no código (Evidências)

### 1. Calendário (`data-screen="16"`)

#### E1. Promessa quebrada de "Editar" registros individuais (cigarros, vontades e dia sem fumar)
- **Pessoa afetada:** Pessoa que revisa o dia no calendário para corrigir horário, quantidade ou detalhes de um cigarro ou fissura.
- **Evidência:** Cada linha de evento em `.wl-cal-event-row` exibe o botão `Editar` (`app.js:7531-7534`), que chama `editHabbiEvent(selKey, ev.id)` (`app.js:3010-3024`) → `openQuickRegisterModal(targetKey, null, ev.id)` (`app.js:5626-5696`). O modal altera o título para `"Editar registro"` (`app.js:5634`), porém só carrega dados do evento quando `found.kind === 'mood'` (`app.js:5648-5687`). Para `smoke`, `urge`, `sos` e `no-smoke`, não existe edição do evento selecionado nem de seu horário — apenas os botões gerais do dia. Ainda assim, a demonstração do tutorial afirma: *"No calendário real você edita horários e detalhes."* (`app.js:9101`).
- **Impacto:** Quebra de expectativa e perda de confiança no controle sobre o próprio histórico.
- **Recomendação:** Ou suportar edição real de horário/nota para todos os tipos de registro, ou restringir o botão `Editar` apenas a eventos efetivamente editáveis (`mood`), alinhando a microcopy do tutorial à capacidade real do produto.

#### E2. Efeito colateral silencioso no dia atual e perda de dados sem aviso ao confirmar "Não fumei hoje" retroativamente
- **Pessoa afetada:** Pessoa que atualiza dias passados no calendário (por exemplo, confirmando que ontem não fumou).
- **Evidência:**
  1. Em `quickConfirmDay()` (`app.js:5754-5796`), ao confirmar uma data **diferente de hoje** (`targetKey !== todayKey`), o código também marca automaticamente **hoje** como `no-smoke` caso hoje ainda esteja com `0` cigarros (`app.js:5780-5792`).
  2. Se a data selecionada já tinha cigarros registrados, `quickConfirmDay()` apaga silenciosamente todos os eventos `smoke` daquela data sem pedir confirmação (`app.js:5762-5765`).
  3. O rótulo do botão e da celebração permanece sempre `"Não fumei hoje"` / `"Não fumei hoje!"` (`app.js:5492, 5617, 5795, 2265`), mesmo ao editar datas passadas ou futuras.
- **Impacto:** Corrupção silenciosa dos registros do dia atual, exclusão acidental de histórico e desorientação temporal.
- **Recomendação:** Remover a marcação automática de `todayKey` quando `targetKey !== todayKey`; exigir confirmação simples se o dia já contiver cigarros; adaptar o rótulo dinamicamente para `"Não fumei neste dia"` quando `targetKey !== todayKey`.

#### E3. Registros retroativos gravam o horário atual, sobrescrevem a meta histórica e permitem lançar dados em datas futuras
- **Pessoa afetada:** Pessoa que faz registro retroativo no fim do dia/semana ou navega por meses para consultar seu planejamento.
- **Evidência:**
  1. `recordHabbiEvent()` (`app.js:2946-2951`) usa `now.toLocaleTimeString(...)` para `clock`/`time` mesmo para dias passados, e sobrescreve `rec.meta = userState.todayMeta || 11` (`app.js:2944`), alterando retroativamente o status de meta de datas antigas caso o usuário tenha ajustado sua meta posteriormente.
  2. `generateCalendar()` (`app.js:7344-7390`) e `openRegisterFromCalendar()` (`app.js:4081-4093`) não distinguem nem bloqueiam datas futuras (`dKey > todayKey`).
- **Impacto:** Distorção da narrativa temporal dos gatilhos (prejudicando autoconhecimento), reclassificação retroativa inesperada de dias antigos e possibilidade de registrar consumo/abstinência no futuro.
- **Recomendação:** Preservar `rec.meta` original quando já existir; permitir informar/omitir horário em lançamentos retroativos (ex.: `"Horário não informado"` ou seletor simples); desabilitar ou diferenciar visualmente datas futuras sem ação de registro.

#### E4. Ambiguidade de status e critérios de contagem no Calendário (dia em andamento vs. sem registro; silêncio sobre dias não confirmados)
- **Pessoa afetada:** Pessoa que consulta o calendário ao longo do dia ou ao fim do mês para avaliar sua evolução.
- **Evidência:**
  1. A legenda exibe apenas `Dentro da meta` (verde), `Acima da meta` (vermelho/rosa) e `Sem registro` (cinza) (`index.html:687-691`; `app.js:5109-5113`). Porém, `getDayStatus()` (`app.js:2719-2741`) devolve `'neutral'` (mesmo cinza de "Sem registro") para **hoje** quando há cigarros dentro da meta e o dia ainda não foi encerrado, gerando conflito visual com o card de detalhes (`"Em andamento"`, `app.js:7468-7475`).
  2. As cores da legenda (`#6CCB4F` / `#FF4736`, `style.css:5234-5235`) divergem das cores dos círculos da grade (`#2E7D32` / `#C53030`, `style.css:5140, 5157`), e dias acima da meta exibem `!` em vermelho escuro (`style.css:5156-5171`).
  3. Nos indicadores mensais (`app.js:7401-7414`), `isDaySmokeFree()` (`app.js:2744-2754`) ignora dias sem eventos (`evCount === 0`) e conta dias sem fumar simultaneamente em `"Sem fumar"` e `"Na meta"`, sem explicitar nenhuma dessas regras.
- **Impacto:** Dúvida sobre se o registro de hoje foi salvo corretamente, dificuldade de interpretar o resumo mensal e frustração quando um dia real sem fumar (sem interação no app) não é computado.
- **Recomendação:** Introduzir um estado visual claro para `"Hoje / Em andamento"` (distinto de `"Sem registro"`), harmonizar as cores entre legenda e grade com tom menos punitivo para dias acima da meta (ex.: coral/âmbar suave sem `!` alarmista) e adicionar microcopy breve esclarecendo que dias sem fumar exigem confirmação.

---

### 2. Registro de cigarros (Home `data-screen="10"` e fluxo de registro rápido)

#### E5. Contradição com a proposta empática: cigarro protagonista, ausência da Morgana e escala cromática punitiva ao exceder a meta
- **Pessoa afetada:** Pessoa que fuma além da meta em um dia difícil — exatamente o momento de maior risco de culpa e abandono do app.
- **Evidência:**
  1. `applyHabbiFlatDesign()` (`app.js:4881-5022`) sobrescreve totalmente o HTML da tela 10 (`index.html:264-316`), removendo a mascote Morgana, a saudação pessoal e a semana compacta, e tornando a ilustração de um cigarro (`cigarro_Prancheta 1.png`) o centro visual da Home (`#home-cig-stage`, `app.js:4900-4951`).
  2. Ao ultrapassar a meta (`overLimit >= 1`, `app.js:6034-6115`), o cigarro e o contador numérico escalam para amarelo → laranja → vermelho (`#FF4736`) → bordô/vinho escuro (`#4A0E17`, `app.js:4920, 6055, 6099`).
  3. O modal acolhedor `meta-exceeded-modal` (*"Como esta não é uma recaída, o que deseja fazer com a meta de amanhã?"*, `app.js:2218-2224, 8593-8615`) nunca é disparado por `handleHomeAddCigarette()` (`app.js:6143-6178`) nem por `quickAdjustCigarette()` (`app.js:5720-5752`).
- **Impacto:** Incoerência direta com os princípios do Habbi (`DESIGN_SYSTEM.md:28-30, 56`; `AGENTS.md:24-27`). Em vez de acolhimento ou oferta gentil de apoio quando a pessoa excede a meta, a interface entrega sinais visuais progressivamente alarmistas/punitivos.
- **Recomendação:** Reintegrar presença afetiva ou microcopy acolhedora da Morgana nos momentos de excesso (ex.: mensagem breve sem culpa + convite suave ao SOS ou ajuste de meta), suavizar o estágio final `#4A0E17` e reconectar (ou redesenhar de forma não intrusiva) o fluxo de acolhimento quando a meta é ultrapassada.

#### E6. Silenciamento global de `showToast()` deixa usuários sem feedback — e redireciona visitantes sem explicação
- **Pessoa afetada:** (a) Visitantes que optaram por `"Continuar como visitante"` / `"Continuar sem cadastro"` (`app.js:456, 459`); (b) Qualquer usuário ao desfazer cigarro (`−`) ou salvar humor.
- **Evidência:** `showToast(_message)` (`app.js:3034-3038`) foi neutralizado (apenas oculta `#toast-notice`). Consequentemente:
  1. Ao tocar em `+ Registrar cigarro`, no cigarro central (`handleHomeAddCigarette`, `app.js:6144-6149`) ou em `openRegisterSheet` (`app.js:4068-4073`), visitantes são levados abruptamente para a tela de Cadastro (`showScreen(24)`) porque o toast *"Crie ou acesse sua conta para começar a registrar!"* não aparece.
  2. Ao tocar em `−` na Home (`handleHomeRemoveCigarette`, `app.js:6212`), o feedback `"1 cigarro removido"` nunca é exibido.
  3. Em `saveQuickMood()` (`app.js:5892`), a confirmação `"Registrado com sucesso"` também é silenciada.
- **Impacto:** Atrito crítico no primeiro uso (sensação de bloqueio/erro arbitrário ao tentar registrar como visitante) e insegurança sobre se ações de remoção ou salvamento de humor realmente funcionaram.
- **Recomendação:** Reativar feedback contextual leve (inline ou toast acessível e discreto) especialmente para barreiras de conta e ações reversíveis/destrutivas — ou permitir registro local imediato para visitantes (já que toda a persistência já usa `localStorage`, `app.js:2413-2440`), convidando para criar conta apenas como benefício de backup/personalização.

#### E7. Arquitetura de registro fragmentada entre Home, Painel Rápido (`wl-quick-register-modal`) e Tela 11 legada (`.quick-register-grid`)
- **Pessoa afetada:** Pessoa que deseja registrar um momento de **vontade superada** ou seu **humor/gatilho** a partir da tela inicial.
- **Evidência:**
  1. Na Home injetada (`app.js:4886-4969`), o único registro disponível é cigarro (`+` / `−`) e `"Não fumei hoje"` (apenas enquanto `todayLogged === 0`, `app.js:6022-6032`). O CTA antigo `openRegisterSheet()` de `index.html:311` foi removido; não há acesso na Home ao painel `wl-quick-register-modal`.
  2. A Tela 11 (`index.html:405-417`, `.quick-register-grid`) foi interceptada em `showScreen()` (`app.js:3046-3055`) para abrir `wl-quick-register-modal`, mas mantém HTML, traduções e listeners legados (`app.js:1748-1757, 5921-5924, 8391-8416`).
  3. Dentro do próprio `wl-quick-register-modal` (`app.js:5480-5555`), há inconsistência no fechamento: `Não fumei hoje` e `Vontade superada` fecham o sheet imediatamente (`app.js:5794, 5810`), `+1 cigarro`/`−` salvam em tempo real sem botão `"Concluir"`, e humor exige um clique extra em `"Salvar humor"` (`app.js:5820-5827`).
- **Impacto:** Baixa descobribilidade do registro de humor e de vontades superadas (só alcançáveis pelo Calendário ou via Menu → Ferramentas → "Registrar Humor do Dia") e modelo mental inconsistente de salvamento no painel rápido.
- **Recomendação:** Definir uma porta de entrada coerente para registros não-cigarro (humor/vontade) a partir da jornada principal (ou explicitar claramente que o registro completo vive no Calendário) e padronizar o comportamento de salvamento/fechamento do `wl-quick-register-modal`.

#### E8. Rótulo econômico demais no SOS, tutorial desatualizado em relação ao botão `−` e palco clicável sem affordance
- **Pessoa afetada:** Pessoa em momento de fissura (buscando ajuda rápida) ou que tocou sem querer no cigarro central.
- **Evidência:**
  1. Em `index.html:307` o botão SOS dizia `"SOS — Estou com vontade"`, mas a injeção em `app.js:4954-4957` reduziu o rótulo visível a apenas `"SOS"`, posicionado com menos peso visual imediatamente acima (`gap: 10px`, `style.css:4762`; `8px` em telas baixas, `style.css:10375`) da linha escura dominante `−` / `+ Registrar cigarro`.
  2. O tutorial (`app.js:569-571, 9149-9151`) diz que, para corrigir um registro errado, a pessoa deve abrir o **Calendário** — ignorando o botão `−` já presente na Home (`#btn-home-remove-cig`, `app.js:4960`), que por sua vez não tem texto visível e usa cor verde claro (`#E3F7D8`, `style.css:10172`), historicamente associada a sucesso/meta no Habbi.
  3. O contêiner `#home-cig-meter` (`app.js:4925`) registra um cigarro ao toque em toda a área da ilustração (`min-height: 280px`, `style.css:4710`), sem nenhum rótulo ou pista visual indicando que a imagem é clicável (apenas `title="Toque para adicionar"`, invisível em mobile).
- **Impacto:** Risco de registro acidental ao tocar ou tentar arrastar a tela sobre a ilustração central; menor clareza imediata sobre o propósito do botão `SOS` para novos usuários; subutilização ou interpretação incorreta do botão `−`.
- **Recomendação:** Tornar explícita a intenção acolhedora do SOS (ex.: `"SOS • Estou com vontade"` ou microcopy sutil), remover o gatilho de registro direto da área ilustrativa do cigarro (concentrando o registro no botão explícito `+ Registrar cigarro` para evitar falsos positivos), atualizar o passo 2 do tutorial para mencionar o `−` da Home e diferenciar semanticamente o visual do botão `−` (neutro em vez de verde de sucesso).

---

### 3. Carrossel principal (`#main-carousel-container`)

#### E9. Baixa descobribilidade da navegação horizontal: dots sem rótulo e dica de arrasto permanentemente oculta
- **Pessoa afetada:** Novos usuários e usuários recorrentes que não memorizaram o tutorial e procuram Economia/Conquista ou Minijogos.
- **Evidência:**
  1. A barra de navegação inferior (`.bottom-nav`) está oculta permanentemente (`style.css:4587-4589`).
  2. No cabeçalho fixo (`index.html:228-235`), a navegação horizontal depende de 3 pontos de `6×6px` (`.wl-pager-dot`, `style.css:7868-7896`) sem nenhum rótulo visível indicando os destinos (`Conquista`, `Início`, `Minijogos`).
  3. O elemento `#wl-carousel-swipe-hint` (*"Arraste para explorar"*) inicia oculto (`style="display:none;"`, `index.html:234`), é forçado a `display: none` em `updateHomeScreen()` (`app.js:5967-5973`) e também é explicitamente escondido em todos os passos do tutorial (`hideTutorialSwipeHint()`, `app.js:9141-9211`). Ou seja, a pista visual nunca é exibida.
- **Impacto:** Funcionalidade de alto valor terapêutico (Minijogos de distração cognitiva) e motivacional (Minha Conquista) fica "escondida" atrás de gestos sem significadores visíveis na Home.
- **Recomendação:** Substituir ou complementar os 3 pontos por indicadores com rótulos curtos (ex.: abas/pílulas compactas `Conquista · Início · Minijogos` no topo ou micro-rótulos sob os dots), mantendo o gesto de arrasto como acelerador natural.

#### E10. Redundância e ausência de estado ativo na pílula de conquista do cabeçalho fixo
- **Pessoa afetada:** Pessoa navegando entre Início, Conquista e Minijogos.
- **Evidência:** A pílula `.wl-home-savings-pill` (`index.html:220-223`) exibe o valor `R$ 0,00` e navega para `navigateHorizontalCarousel(29)` em todos os 3 slides, sem indicação de estado ativo quando o slide 0 (Conquista) já está aberto. Na tela 29, o mesmo valor reaparece imediatamente abaixo (`#wl-conquista-main-val`, `app.js:5263`), e a pílula não informa que se trata de uma *estimativa* (dependendo do aviso no passo 4 do tutorial: *"Não é dinheiro recebido pelo aplicativo"*, `app.js:578`).
- **Impacto:** Redundância de informação na tela Conquista, falta de feedback de localização e risco de expectativa financeira equivocada (interpretar o valor como saldo real/recompensa).
- **Recomendação:** Destacar visualmente a pílula quando Conquista estiver ativa (ou integrá-la ao seletor rotulado do carrossel) e considerar microcopy/ícone que evite semântica bancária (ex.: ícone de cofrinho/meta com rótulo de economia estimada no contexto).

#### E11. Interrupção silenciosa de minijogos em andamento e comportamento assimétrico de retorno no `tools-mode`
- **Pessoa afetada:** Pessoa em momento de fissura usando um minijogo para se distrair (tanto pelo Carrossel quanto via SOS/Ferramentas).
- **Evidência:**
  1. Com um minijogo ativo em modo carrossel (`userState.isGameActive === true`), o arrasto horizontal é bloqueado (`app.js:8929-8931`), mas o cabeçalho fixo permanece clicável. Tocar em um dot, na pílula de economia (`goToCarouselSlide`, `app.js:3974-3981`) ou no ícone do Calendário (`showScreen`, `app.js:3082-3089`) **encerra o jogo e descarta a partida silenciosamente**, sem confirmação.
  2. Em `tools-mode` (Minijogos aberto por SOS `app.js:7857-7859` ou Ferramentas `app.js:5062-5064`), tocar na seta "Voltar" do topo chama `handleMinijogosBack()` (`app.js:7995-8005`), que encerra o jogo **e sai diretamente da tela de Minijogos** de volta para SOS/Ferramentas — diferente do botão `"Sair do jogo"` no rodapé, que retorna à grade dos 4 jogos (`quitInlineGame`, `app.js:7235-7240`).
- **Impacto:** Perda abrupta do estado de foco cognitivo durante uma crise de fissura e comportamento imprevisível do botão "Voltar" conforme o ponto de entrada.
- **Recomendação:** Ao iniciar um minijogo no modo carrossel, ocultar/desabilitar temporariamente o cabeçalho de navegação ou confirmar saída antes de encerrar a partida; padronizar o botão "Voltar" em `tools-mode` para retornar primeiro à grade de minijogos quando um jogo estiver em execução.

#### E12. Conflito entre tentativa de arrasto horizontal e registro acidental de cigarro na Home
- **Pessoa afetada:** Pessoa tentando arrastar da Home para Conquista ou Minijogos com o polegar na região central da tela.
- **Evidência:** Em `initHorizontalCarouselGestures()` (`app.js:8923-9020`), `handleStart` não ignora toques iniciados em elementos interativos (ao contrário do carrossel de onboarding em `app.js:8833`). Se o gesto iniciado sobre `#home-cig-meter` (`app.js:4925`) não ultrapassar `16px` horizontais com razão `> 1.25` (`app.js:8955`), `isHorizontalSwipe` permanece `false` e o evento `click` dispara `handleHomeAddCigarette()`.
- **Impacto:** Registro indevido de cigarro quando a intenção era explorar outras telas — gerando estresse desnecessário e desconfiança na interface.
- **Recomendação:** (Em conjunto com E8) remover `onclick="handleHomeAddCigarette()"` de `#home-cig-meter`, reservando a área central para leitura visual e gestos fluidos do carrossel.

---

## (b) Hipóteses e riscos que dependem de teste com usuários reais

#### H1. Impacto emocional do cigarro gigante como protagonista da Home (gatilho visual *cue reactivity*)
- **Pessoa afetada:** Pessoas em abstinência recente ou redução ativa, sensíveis a gatilhos visuais.
- **Hipótese:** Exibir uma ilustração grande de cigarro no centro da tela inicial (`#home-cig-stage`, `app.js:4884, 4900-4951`) — no lugar da mascote Morgana originalmente concebida (`index.html:279-281`) — pode atuar como **gatilho visual de vontade de fumar** (*cue-induced craving*) ou gerar desconforto emocional em quem busca se distanciar do símbolo do cigarro.
- **Evidência de origem no código:** `app.js:4884-4951` (ilustração de cigarro ocupando `min-height: 280px` no centro da tela 10) vs. `DESIGN_SYSTEM.md:29, 52` (proposta de *cozy interface* com Morgana como âncora afetiva).
- **Impacto potencial:** Aumento da fissura ao abrir o app ou rejeição afetiva/abandono.
- **Recomendação:** Testar comparativamente (A/B qualitativo) a Home centrada no medidor de cigarro versus uma variação com protagonismo da Morgana / metáfora visual neutra.

#### H2. Interpretação da pílula monetária no topo como saldo ou recompensa financeira do app
- **Pessoa afetada:** Novos usuários que pulam ou leem rapidamente o tutorial.
- **Hipótese:** Mesmo com o aviso no passo 4 do tutorial (*"Não é dinheiro recebido pelo aplicativo"*, `app.js:578`), a pílula com cifrão (`R$ 0,00`) no topo fixo (`index.html:220-223`) pode continuar sendo interpretada inicialmente como cashback, carteira virtual ou saldo real, gerando frustração posterior.
- **Evidência de origem no código:** Existência do próprio disclaimer defensivo no tutorial (`app.js:578`) e na tela 29 (`app.js:5269-5271`), enquanto a pílula no topo exibe apenas ícone `$` + valor (`index.html:220-223`).
- **Impacto potencial:** Expectativa desalinhada quanto à proposta de valor do Habbi.
- **Recomendação:** Validar compreensão espontânea do elemento no topo sem explicação prévia do tutorial.

#### H3. Efeito da barreira de autenticação obrigatória no primeiro registro sobre a retenção de visitantes
- **Pessoa afetada:** Pessoas curiosas que entram como visitantes para experimentar o app antes de criar conta.
- **Hipótese:** Exigir criação de conta no exato momento em que a pessoa decide registrar seu primeiro cigarro ou dia sem fumar (`app.js:4068, 5708, 6144`) — especialmente em um aplicativo voltado a momentos impulsivos — pode provocar alto abandono antes que o usuário perceba valor.
- **Evidência de origem no código:** `app.js:4068-4073, 5708-5718, 6144-6149` (bloqueio com redirecionamento para tela 24) combinados à existência de modo visitante no onboarding (`app.js:456, 459`).
- **Impacto potencial:** Perda do momento de maior motivação do usuário (*aha moment*).
- **Recomendação:** Investigar em teste de primeiro uso e funil de retenção se permitir registros locais sem login prévio aumenta engajamento inicial.

#### H4. Carga cognitiva e valor percebido do resumo mensal de 3 números no Calendário (`Sem fumar`, `Na meta`, `Vontades`)
- **Pessoa afetada:** Pessoas que estão em estratégia de **redução gradual** (não abstinência total imediata).
- **Hipótese:** Para quem reduz de 15 para 8 cigarros/dia, ver `"0 Sem fumar"` como primeira métrica destacada no calendário (`index.html:695-698`) pode ofuscar suas micro-vitórias de redução, gerando desânimo mesmo estando `"Na meta"`.
- **Evidência de origem no código:** Ordem e destaque das métricas em `.wl-cal-month-metrics` (`index.html:694-707`; `app.js:5116-5129`) e contagem sobreposta em `app.js:7408-7413`.
- **Impacto potencial:** Desalinhamento com a proposta de valorizar micro-vitórias na redução gradual.
- **Recomendação:** Avaliar com usuários em redução gradual vs. cessação abrupta quais métricas mensais geram maior senso de progresso.

#### H5. Proximidade física entre `SOS` e `+ Registrar cigarro` sob estresse/fissura aguda
- **Pessoa afetada:** Pessoa ansiosa ou agitada abrindo o app com uma mão durante um pico de fissura.
- **Hipótese:** Sob agitação motora/emocional, a pílula `SOS` menor e diretamente encostada acima do botão principal `+ Registrar cigarro` (`style.css:4755-4800, 10374-10376`) pode sofrer erros de toque ou ser ofuscada pela saliência visual do botão de registro.
- **Evidência de origem no código:** `.wl-home-focused-actions` com `gap: 10px` (`8px` em `max-height: 640px`), `.wl-home-sos-pill` (`44px`, fundo suave) vs. `.wl-home-add-btn` (`56px`, alto contraste).
- **Impacto potencial:** Atraso ou erro no acesso à micro-intervenção de emergência no momento mais crítico da jornada.
- **Recomendação:** Testar em cenários simulados de uso rápido com uma mão e estresse temporal.

---

## Encaminhamentos fora do foco de UX

Os pontos abaixo foram identificados durante a leitura do código, mas pertencem às áreas de **Usabilidade (interação pontual)** e **Acessibilidade (conformidade técnica WCAG)** e ficam formalmente encaminhados:

- **Para `especialista-usabilidade`:**
  1. **Alvos de toque abaixo de 44×44px** (descumprindo `DESIGN_SYSTEM.md:169` e `AGENTS.md:7.1`): `.wl-cal-ev-btn` (`padding: 5px 11px`, `style.css:5495-5509`), `.wl-cal-today-chip` (`padding: 4px 10px`, `style.css:5020-5032`), `.wl-cal-nav-arrow` e `.wl-close-circle` (`40×40px`, `style.css:4981-4984, 5034-5038`), `.wl-qreg-step-btn` (`height: 42px`, `style.css:5797-5819`), `.wl-hub-close` (`34×34px`, `style.css:4867-4870`).
  2. **Sobreposição de áreas clicáveis nos pager dots:** `.wl-pager-dot::before` define `min-width: 44px; min-height: 44px` sobre pontos de `6px` com `gap: 6px` (`style.css:7862-7887`), causando forte colisão entre os 3 alvos de toque.
  3. **Disparo duplicado em `#btn-home-sos`:** possui `onclick="goToScreen(12)"` (`app.js:4954`) **e** `addEventListener('click', () => showScreen(12))` (`app.js:8341-8344`).
  4. **Parâmetros finos de gesto touch/mouse do carrossel:** limiar de `16px`, razão `1.25` e bloqueio de clique por `180ms` (`app.js:8955, 9010`).

- **Para `especialista-acessibilidade`:**
  1. **Slides fora da viewport ainda focáveis e expostos à árvore de acessibilidade:** `.main-carousel-track .carousel-slide` mantém `opacity: 1; visibility: visible; pointer-events: auto` sem `inert` nem `aria-hidden` para os 2 slides inativos (`style.css:10040-10051`).
  2. **Semântica incompleta/desatualizada no pager:** `.wl-pager-nav-dots` tem `role="tablist"`, mas os `.wl-pager-dot` não têm `role="tab"`/`aria-selected`, e o `aria-label="Página atual: Início"` (`index.html:229-233`) permanece estático mesmo após trocar de slide (`app.js:3996-4001`).
  3. **Elemento interativo sem semântica de botão nem teclado:** `#home-cig-meter` (`app.js:4925`) é um `<div>` com `onclick`, sem `role="button"` nem `tabindex="0"`.
  4. **Contraste crítico no modo escuro:** ao ultrapassar 6+ cigarros, `metaReg.style.color = '#4A0E17'` (`app.js:6055`) aplica bordô muito escuro inline sobre fundo `#121214` no tema escuro.
  5. **Modal de registro rápido sem acessibilidade de diálogo:** `.wl-qreg-sheet` (`app.js:5480`) não declara `role="dialog"`, `aria-modal="true"`, foco contido nem fechamento por `Escape` (contrariando `DESIGN_SYSTEM.md:311`).
  6. **Internacionalização de `aria-label` no Calendário:** os `aria-label` dos dias em `generateCalendar()` (`app.js:7337, 7356-7357, 7386`) estão fixos em Português mesmo nos modos EN e ES.

---

## (c) Recomendações priorizadas por impacto e esforço

| Prioridade | Ação recomendada | Funcionalidade | Impacto UX | Esforço estimado | Achados endereçados |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | **Corrigir efeitos colaterais no Calendário:** remover marcação automática de `todayKey` em `quickConfirmDay`, pedir confirmação antes de zerar cigarros existentes, adaptar rótulo para `"Não fumei neste dia"`, impedir registros em datas futuras e preservar `rec.meta` histórico. | Calendário | **Alto** | **Baixo** | E2, E3 |
| **2** | **Restaurar feedback ao usuário e desbloquear/esclarecer fluxo de visitantes:** reativar mensagens de feedback discretas (desfazer cigarro, salvar humor, barreira de conta) ou permitir registro local imediato para visitantes sem redirecionamento abrupto para tela 24. | Registro | **Alto** | **Baixo** | E6, H3 |
| **3** | **Eliminar registro acidental por toque no cigarro central e alinhar tutorial:** remover `onclick` de `#home-cig-meter` (evitando conflito com swipe), atualizar o passo 2 do tutorial para apresentar o botão `−` da Home e dar estilo neutro (não verde-sucesso) ao `−`. | Registro + Carrossel | **Alto** | **Baixo** | E8, E12 |
| **4** | **Tornar explícita a navegação do Carrossel e o botão SOS:** adicionar rótulos curtos aos indicadores do carrossel (`Conquista · Início · Minijogos`), destacar estado ativo da pílula/aba de Conquista e devolver texto explicativo ao botão SOS (`"SOS • Estou com vontade"`). | Carrossel + Registro | **Alto** | **Baixo–Médio** | E8, E9, E10, H5 |
| **5** | **Alinhar a ação "Editar" no Calendário à realidade (ou implementar edição de horário/detalhe):** evitar promessa quebrada no botão `Editar` e no tutorial; permitir escolher/omitir horário em lançamentos retroativos. | Calendário | **Alto** | **Médio** | E1, E3 |
| **6** | **Resgatar coerência emocional na Home ao ultrapassar a meta:** substituir o estágio final alarmista (`#4A0E17`) por linguagem visual/textual empática com presença da Morgana e oferta gentil de SOS ou ajuste de meta (reconectando a lógica acolhedora de `meta-exceeded-modal`). | Registro | **Alto** | **Médio** | E5, H1 |
| **7** | **Proteger minijogos ativos e uniformizar o `tools-mode`:** impedir encerramento silencioso de partida ao clicar no cabeçalho fixo (ocultar/confirmar saída) e fazer o "Voltar" em `tools-mode` retornar primeiro à grade de jogos. | Carrossel | **Médio** | **Baixo–Médio** | E11 |
| **8** | **Esclarecer estados e regras do Calendário + unificar portas de registro:** diferenciar `"Hoje (em andamento)"` de `"Sem registro"` na grade/legenda, harmonizar cores/ícone de excesso sem `!` punitivo, e dar acesso claro ao registro de humor/vontade a partir da Home (limpando código morto da tela 11). | Calendário + Registro | **Médio** | **Médio** | E4, E7, H4 |

---

## Perguntas que ainda exigem pesquisa e métodos sugeridos

1. **A ilustração central de cigarro na Home motiva o controle ou atua como gatilho visual (*cue reactivity*) em comparação com a Morgana?**  
   - *Método sugerido:* Teste de conceito comparativo (A/B moderado com *think-aloud* + escala breve de valência emocional/desejo antes e após interação) com fumantes em diferentes estágios (redução gradual vs. abstinência recente).
2. **Usuários sem treinamento/tutorial descobrem espontaneamente as telas Conquista e Minijogos no carrossel e compreendem o valor monetário do topo como estimativa?**  
   - *Método sugerido:* Teste de primeira impressão (*5-second test*) seguido de tarefas exploratórias sem tutorial prévio (ex.: *"Você está com vontade e quer se distrair"* / *"Veja quanto economizou"*).
3. **Em um momento real de fissura ou rotina corrida, o fluxo de 1 toque na Home vs. o painel rápido no Calendário atende à necessidade sem gerar sub-registro ou erro?**  
   - *Método sugerido:* Estudo de diário (*diary study*) de 7 dias em dispositivos móveis reais dos participantes, combinado a entrevistas curtas de saída.
4. **Como usuários em redução gradual reagem emocionalmente às cores de excesso, ao botão `−` de desfazer e à métrica `"Sem fumar"` no Calendário?**  
   - *Método sugerido:* Entrevistas contextuais com protótipo povoado com cenários realistas (dia dentro da meta, dia acima da meta, dia sem registro, semana de redução parcial).
5. **Qual o impacto da exigência de cadastro no primeiro registro na taxa de ativação de visitantes?**  
   - *Método sugerido:* Teste moderado de onboarding-até-primeiro-registro e, em produção/piloto, análise de funil de conversão entre entrada como visitante e conclusão do 1º registro.

---

## Limitações desta análise

Por tratar-se exclusivamente de **inspeção estática de código-fonte e documentação** (sem execução em navegador/dispositivo físico e sem participantes reais):
- **Não foi possível validar renderização visual real** nas resoluções-alvo (`320×568`, `390×844`, `430×932`), proporções reais das imagens PNG (`cigarro_Prancheta 1.png`, `sacola_Prancheta 1.png`), remoção de fundo via Canvas nem eventual corte de textos em EN/ES.
- **Não foi possível medir a física real dos gestos** (sensibilidade do swipe no carrossel, conflito entre rolagem vertical e arrasto horizontal em telas sensíveis ao toque iOS/Android, fluidez das animações CSS).
- **Não existem dados quantitativos de uso** (analytics, funil de abandono, taxa de erro de toque, retenção) nem relatos diretos de usuários reais — todas as inferências comportamentais e emocionais foram, por isso, explicitamente separadas e rotuladas como **hipóteses**.
- **Não foram avaliadas outras telas fora do escopo** (Onboarding, SOS detalhado, Ferramentas, Perfil, Configurações), exceto nos pontos exatos de transição que afetam diretamente Calendário, Registro de cigarros ou Carrossel principal.
