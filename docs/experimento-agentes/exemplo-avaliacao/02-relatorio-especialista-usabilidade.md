# Relatório 02 — Especialista em Usabilidade (`especialista-usabilidade`)

## Metadados da Execução (Registro do Experimento)

| Campo | Registro |
| :--- | :--- |
| **Agente executado** | `especialista-usabilidade` (prompt original preservado em `docs/experimento-agentes/originais-professora/especialista-usabilidade.md`, SHA-256 `8949B5EA0295`) |
| **Ferramenta / Plataforma** | Antigravity — subagente isolado via `define_subagent` + `invoke_subagent` |
| **Modelo utilizado** | Claude Opus 4.6 (Thinking) — herdado da sessão coordenadora (`Model: inherit`) |
| **Data da execução** | 2026-11-18 |
| **Restrições técnicas efetivamente aplicadas** | `EnableWriteTools: false`, `EnableMCPTools: false`, `EnableSubagentTools: false` (modo estritamente **somente leitura**, sem edição de arquivos nem execução de comandos) |
| **Contexto fornecido ao agente** | Repositório Habbi na branch `docs/experimento-agentes` (base estável `main` `bff8ef0`): `DESIGN_SYSTEM.md`, `AGENTS.md`, `index.html`, `app.js` e `style.css`, com foco exclusivo em **Calendário**, **Registro de Cigarros** e **Carrossel Principal**. |
| **Prompt aplicado** | `SystemPrompt` = conteúdo integral verbatim de `especialista-usabilidade.md` + tarefa controlada idêntica para os 3 especialistas (escopo das 3 funcionalidades, caminhos absolutos dos arquivos, exigência de citação de arquivo/linha, separação explícita entre evidências comprovadas, hipóteses e recomendações, e declaração de limitações). |

---

## Saída Integral do Agente

# Avaliação de Usabilidade — Habbi (Calendário, Registro de Cigarros e Carrossel Principal)

Avaliação heurística e de inspeção de tarefas baseada na ISO 9241-11 (eficácia, eficiência e satisfação) e nas heurísticas de Nielsen, conduzida exclusivamente por leitura estática do código-fonte do projeto Habbi (`index.html`, `app.js`, `style.css`, `DESIGN_SYSTEM.md` e `AGENTS.md`).

---

## 1. Perfil de quem usa, suposições e tarefas principais

### Perfil presumido *(suposições declaradas)*
- **Quem usa:** Pessoas adultas ou jovens-adultas em processo de redução ou cessação do tabagismo, usando smartphone (frequentemente com uma só mão e em janelas curtas de atenção).
- **Contexto emocional crítico:** Parte dos acessos ocorre em momentos de ansiedade, pressa ou fissura (*craving*), quando a tolerância a fricção, ambiguidade e erros acidentais é baixa.
- **Familiaridade tecnológica:** Variada; assume-se domínio básico de smartphones, mas **não** se assume memorização de gestos ocultos ou leitura cuidadosa do tutorial inicial.

### Tarefas principais avaliadas (escopo obrigatório)
1. **Calendário (`data-screen="16"`):** Consultar o histórico mensal, entender o status de cada dia, trocar de mês, inspecionar os eventos de um dia selecionado, adicionar um registro retroativo e editar/remover um registro incorreto.
2. **Registro de cigarros (`data-screen="10"` + `#wl-quick-register-modal` / `openRegisterSheet`):** Registrar um cigarro fumado hoje, desfazer um registro acidental (`−`), confirmar um dia sem fumar, acionar SOS em momento de vontade e registrar humor/vontade.
3. **Carrossel principal (`#main-carousel-container`):** Perceber e navegar horizontalmente entre Conquista (`data-screen="29"`) ↔ Início (`data-screen="10"`) ↔ Minijogos (`data-screen="15"`) por toque nos indicadores/pílula ou por arraste, e alternar previsivelmente com o modo `tools-mode`.

### Percurso sintético (walkthrough)
- **Calendário:** Topo esquerdo da barra fixa → `goToScreen(16)` → grade mensal + legenda + 3 métricas mensais + card do dia selecionado (com barra de meta + último evento + botão "Ver outros X registros") + botão fixo `Adicionar registro` → abre `#wl-quick-register-modal` para a data selecionada.
- **Registro de cigarros:** Na Home (`data-screen="10"`), o HTML original (`index.html:264-316`) é substituído em tempo de execução por `applyHabbiFlatDesign()` (`app.js:4881-5022`), passando a exibir o contador `0 / 11 hoje`, o selo condicional `Não fumei hoje`, o medidor central clicável do cigarro (`#home-cig-meter`), o botão `SOS` e a linha inferior `[ − ] [ + Registrar cigarro ]`. A Tela 11 (`quick-register-grid`) foi redirecionada em `showScreen()` (`app.js:3046-3055`) para abrir o bottom sheet `#wl-quick-register-modal`.
- **Carrossel principal:** Cabeçalho fixo (`#main-carousel-header`) com Calendário, pílula de economia (que navega para `29`), Menu Hub e 3 pontos indicadores (`.wl-pager-dot`); abaixo, `#main-carousel-viewport` desliza um trilho de `300%` de largura com slides `29`, `10` e `15`. Quando `15` ou `29` são abertas via Ferramentas/SOS, o container recebe `.tools-mode`, ocultando o cabeçalho fixo e mostrando um cabeçalho tradicional com seta `Voltar`.

---

## (a) Problemas comprovados no código (ordenados por severidade — Escala de Nielsen 0–4)

### Severidade 3 — Problemas graves (alta prioridade)

#### 1. Feedback global (`showToast`) desativado silenciosamente deixa bloqueios de autenticação e ações críticas sem explicação
- **Local:** `app.js:3034-3038` (`showToast`), chamado por `openRegisterSheet` (`app.js:4069`), `openRegisterFromCalendar` (`app.js:4083`), `requireAuthToRegister` (`app.js:5711`), `saveQuickMood` (`app.js:5892`), `handleHomeAddCigarette` (`app.js:6145`), `handleHomeRemoveCigarette` (`app.js:6212`).
- **Heurística / princípio afetado:** Visibilidade do status do sistema; Ajudar usuários a reconhecer, diagnosticar e recuperar erros.
- **Evidência:** `function showToast(_message)` foi reduzida a um *no-op* que apenas remove `.show` (`app.js:3035-3038`). Assim, ao tocar em `+ Registrar cigarro` ou `Adicionar registro` sem estar autenticado, o app redireciona abruptamente para a tela de cadastro (`showScreen(24)`) descartando a mensagem explicativa; ao desfazer um cigarro na Home (`handleHomeRemoveCigarette`), o aviso `'1 cigarro removido'` nunca aparece; e ao salvar humor (`saveQuickMood`), o painel apenas fecha sem confirmação.
- **Impacto para quem usa:** Desorientação ("por que fui jogado para o cadastro?") e insegurança sobre se uma remoção ou salvamento realmente ocorreu.
- **Severidade:** **3**
- **Recomendação concreta:** Reativar um feedback leve e discreto (banner/toast acessível com duração de ~2,5 s) ao menos para confirmações de remoção/salvamento e incluir um aviso contextual inline no topo da Tela 24 quando ela for aberta por bloqueio de registro.

#### 2. Botão "Editar" nos eventos do Calendário não edita cigarros, vontades nem dias sem fumar
- **Local:** `app.js:7531-7534` (botão `Editar` em `updateCalendarSummaryAndDetails`), `app.js:3010-3024` (`editHabbiEvent`), `app.js:5626-5696` (`openQuickRegisterModal`), `app.js:9101` (texto do tutorial).
- **Heurística / princípio afetado:** Correspondência entre o sistema e o mundo real; Clareza e previsibilidade; Controle e liberdade do usuário.
- **Evidência:** Todo item listado no dia selecionado (`smoke`, `urge`, `sos`, `no-smoke` e `mood`) exibe um botão `Editar`. Contudo, `openQuickRegisterModal` (`app.js:5648-5651`) só popula dados de edição quando `found.kind === 'mood'`. Para os demais tipos, o modal apenas altera o cabeçalho para `"Editar registro"` (`app.js:5634`), mas não exibe horário, tipo nem campos do evento clicado — contradizendo inclusive o texto do próprio tutorial (`app.js:9101`: *"No calendário real você edita horários e detalhes."*).
- **Impacto para quem usa:** Frustração e quebra de confiança ao tentar corrigir um registro de cigarro ou vontade; o usuário abre um modal intitulado "Editar registro" que na prática funciona como "Adicionar registro".
- **Severidade:** **3**
- **Recomendação concreta:** Exibir o botão `Editar` apenas nos registros realmente editáveis (`mood`), ou implementar edição real de horário/nota para eventos `smoke` e `urge` quando `editEventId` apontar para eles.

#### 3. Registro retroativo/futuro no Calendário permite gravar no futuro, apaga cigarros silenciosamente e altera "Hoje" como efeito colateral
- **Local:** `app.js:7344-7390` (`generateCalendar`), `app.js:5490-5493`, `app.js:5611-5623` (`syncQuickRegisterModalUI`), `app.js:5754-5796` (`quickConfirmDay`), `app.js:2744-2754` (`isDaySmokeFree`), `app.js:3395` (`computeSavingsMetrics`).
- **Heurística / princípio afetado:** Prevenção de erros; Consistência e padrões; Clareza de rótulos.
- **Evidência:**
  1. Não existe bloqueio para selecionar datas futuras (`dKey > todayKey`) nem para adicionar cigarros ou confirmar `"Não fumei hoje"` nelas, o que infla imediatamente `daysClean` (`isDaySmokeFree`, `app.js:2748`) e a economia confirmada (`app.js:3395`).
  2. Em `quickConfirmDay()` (`app.js:5761-5765`), clicar em `"Não fumei hoje"` **exclui sem confirmação todos os cigarros registrados naquela data** (`rec.events = rec.events.filter(e => e.kind !== 'smoke')`).
  3. Nas linhas `app.js:5779-5792`, ao confirmar `"Não fumei hoje"` para **uma data passada ou futura** (`targetKey !== todayKey`), o código marca automaticamente **o dia de hoje** como `"Não fumei hoje"` caso hoje ainda esteja com 0 cigarros.
  4. O rótulo do botão permanece `"Não fumei hoje"` (`app.js:5492`, `5617`) mesmo quando o usuário selecionou uma data antiga no calendário.
- **Impacto para quem usa:** Perda silenciosa de registros existentes, alteração involuntária do dia atual ao ajustar dias passados e distorção das estatísticas por registros em datas futuras.
- **Severidade:** **3**
- **Recomendação concreta:** Bloquear (ou desabilitar visualmente) registro em datas futuras; remover o bloco das linhas `5779-5792` que altera `todayKey` colateralmente; adaptar o rótulo para `"Não fumei neste dia"` quando `targetKey !== todayKey`; e pedir confirmação antes de zerar cigarros já registrados na data.

#### 4. Sobreposição grave das áreas de toque nos indicadores de página do Carrossel (`.wl-pager-dot`) e baixa descobribilidade das abas laterais
- **Local:** `index.html:228-235`, `style.css:7858-7896` (`.wl-pager-nav-dots`, `.wl-pager-dot`, `.wl-pager-dot::before`), `app.js:5967-5973`.
- **Heurística / princípio afetado:** Reconhecimento em vez de memorização; Prevenção de erros; Eficiência de uso e arquitetura de navegação.
- **Evidência:**
  1. Cada `.wl-pager-dot` mede `6 × 6 px` (ou `18 × 6 px` ativo), com `gap: 6px` entre eles (`style.css:7862, 7870-7896`), mas aplica um pseudo-elemento `::before` de `min-width: 44px; min-height: 44px` centralizado (`style.css:7879-7887`). Como os centros dos três pontos ficam a apenas ~12–18 px de distância, as áreas clicáveis de 44 px se sobrepõem quase completamente: o 3º ponto (Minijogos, posterior no DOM) sobrepõe parte do centro (Início), que sobrepõe o 1º (Conquista).
  2. Os pontos não têm rótulos visíveis, e a dica `"Arraste para explorar"` (`#wl-carousel-swipe-hint`) é forçada a `display: none` fora do tutorial (`index.html:234`, `app.js:5969-5972`).
  - *Encaminhamento:* A ausência de `role="tab"` e `aria-selected` dentro de `role="tablist"` (`index.html:229-233`) envolve conformidade técnica de acessibilidade — encaminhar à `especialista-acessibilidade`.
- **Impacto para quem usa:** Quem tenta tocar nos indicadores para mudar de tela acerta repetidamente a aba errada; e quem pula o tutorial ou retorna depois não reconhece que Minijogos está acessível deslizando para a direita.
- **Severidade:** **3**
- **Recomendação concreta:** Substituir os pontos anônimos por um seletor segmentado compacto com rótulos visíveis (`Conquista | Início | Minijogos`) com espaçamento sem sobreposição, ou separar os indicadores em no mínimo 48 px entre centros com legendas curtas.

#### 5. Medidor central da Home (`#home-cig-meter`) dispara registro de cigarro com 1 toque sem affordance clara e em conflito com o gesto de arraste do carrossel; acesso ao registro rápido de humor/vontade desaparece da Home
- **Local:** `app.js:4881-4970` (injeção da Home), `app.js:4925` (`#home-cig-meter`), `app.js:6166-6169` (`is-bumping` apenas removido), `app.js:8954-9019` (`initHorizontalCarouselGestures`), `index.html:311` (`openRegisterSheet()` sobrescrito).
- **Heurística / princípio afetado:** Prevenção de erros; Clareza e previsibilidade; Descoberta de funcionalidades.
- **Evidência:**
  1. Todo o palco central (`min-height: 280px`, `width: 100%`) executa `handleHomeAddCigarette()` ao toque (`app.js:4925`), sem nenhum rótulo visível informando que a imagem é clicável (apenas `title`, invisível em touch) e sem a animação `is-bumping` (a linha `6168` apenas remove a classe sem readicioná-la).
  2. Como o usuário desliza horizontalmente sobre essa mesma área para navegar no carrossel (`#main-carousel-viewport`), qualquer arraste abaixo do limiar de `16 px` (`app.js:8955`) ou toque exploratório registra um cigarro por engano.
  3. Ao substituir o HTML estático de `data-screen="10"` (`index.html:311`), `applyHabbiFlatDesign()` removeu o único botão da Home que chamava `openRegisterSheet()`, deixando o registro rápido de **Vontade superada** e **Humor** sem acesso direto na tela inicial (exigindo ir ao Calendário ou ao Menu > Ferramentas).
- **Impacto para quem usa:** Registros acidentais de cigarros durante tentativas de arraste/exploração e aumento desnecessário de passos para registrar humor ou vontade superada.
- **Severidade:** **3**
- **Recomendação concreta:** Remover o `onclick` do palco ilustrativo do cigarro (concentrando a ação no botão explícito `+ Registrar cigarro`), restaurar um feedback visual imediato no medidor ao registrar, e avaliar um atalho secundário claro na Home para abrir o painel de registro completo (humor/vontade) sem competir com `+ Registrar cigarro`.

---

### Severidade 2 — Problemas menores (prioridade média)

#### 6. No Calendário, o dia atual "Em andamento" aparece visualmente idêntico a "Sem registro" e cores da legenda divergem da grade
- **Local:** `app.js:2719-2741` (`getDayStatus`), `app.js:5109-5113`, `app.js:7356`, `app.js:7468-7475`, `style.css:5139-5182`, `style.css:5227-5236`.
- **Heurística / princípio afetado:** Consistência e padrões; Visibilidade do status do sistema.
- **Evidência:** Quando hoje possui de 1 até `meta` cigarros (sem finalização do dia), `getDayStatus(todayKey)` retorna `'neutral'` (`app.js:2739-2740`). Na grade mensal, o dia fica cinza (`.state-neutral`), igual a `"Sem registro"` na legenda (`app.js:5112`), apesar de o card inferior mostrar `"X / 11 cigarros • Em andamento"`. Além disso, a legenda usa `#6CCB4F` / `#FF4736` (`style.css:5234-5235`), enquanto os círculos da grade usam `#2E7D32` / `#C53030` (`style.css:5140, 5157`).
- **Impacto para quem usa:** Ao abrir o calendário no meio do dia, o usuário pode acreditar que seus registros de hoje não foram contabilizados.
- **Severidade:** **2**
- **Recomendação concreta:** Diferenciar visualmente o dia "Em andamento" (ex.: anel/borda colorida ou estado próprio na legenda) e igualar os tons de verde/vermelho entre legenda e grade.

#### 7. Exclusão de eventos no Calendário ocorre em 1 toque sem confirmação nem "Desfazer", com botões muito pequenos e próximos
- **Local:** `app.js:7530-7539`, `app.js:2988-3008` (`deleteHabbiEvent`), `style.css:5488-5523` (`.wl-cal-ev-btn`).
- **Heurística / princípio afetado:** Prevenção de erros; Recuperação de erros.
- **Evidência:** Os botões `Editar` e `Remover` ficam lado a lado com `gap: 5px`, `padding: 5px 11px` e `font-size: 11.5px` (~26–28 px de altura). Um toque em `Remover` deleta imediatamente o evento (incluindo notas de humor), sem confirmação, sem "Desfazer" e sem toast.
  - *Encaminhamento:* A altura inferior a 44 px desses botões (e também das setas de mês `40×40 px`, botão fechar `40×40 px` e chip `Hoje` em `style.css:4981-5050`) viola a diretriz de alvos de toque — encaminhar auditoria técnica à `especialista-acessibilidade`.
- **Impacto para quem usa:** Alto risco de apagar registros por erro de precisão ao tentar tocar em `Editar`, sem forma de recuperação.
- **Severidade:** **2**
- **Recomendação concreta:** Ampliar a área clicável e o espaçamento dos botões de ação na lista de eventos e oferecer um recurso imediato de `"Desfazer"` (ou confirmação leve para remoção de notas/humor).

#### 8. Botão `−` (desfazer cigarro) na Home carece de rótulo visível, diverge visualmente do modal e não restaura "Não fumei hoje" após clique acidental
- **Local:** `app.js:4959-4968`, `app.js:6152-6154` (`handleHomeAddCigarette`), `app.js:6180-6213` (`handleHomeRemoveCigarette`), `style.css:10164-10173` vs `style.css:5814-5819`.
- **Heurística / princípio afetado:** Consistência e padrões; Clareza de chamadas para ação; Recuperação de erros.
- **Evidência:** Na Home, `#btn-home-remove-cig` mostra apenas o símbolo `−` em verde claro (`#E3F7D8`, mesma paleta do selo positivo `Não fumei hoje`), enquanto no painel rápido (`#wl-qreg-btn-minus`) o botão `−` é cinza neutro (`#E5E7EB`). Se o usuário confirmou `"Não fumei hoje"`, tocou sem querer em `+ Registrar cigarro` (o que apaga `no-smoke` em `app.js:6153`) e tocou em `−` para corrigir, o cigarro é removido, mas a confirmação `"Não fumei hoje"` não volta e nenhum feedback textual aparece.
- **Impacto para quem usa:** Ambiguidade sobre o efeito do botão `−` (ex.: diminuir meta vs. remover cigarro) e perda silenciosa da confirmação diária após erro seguido de correção.
- **Severidade:** **2**
- **Recomendação concreta:** Padronizar o estilo neutro do botão `−` entre Home e painel rápido, adicionar indicação clara de ação (ou micro-feedback imediato `"1 cigarro removido"`) e avisar/permitir reconfirmar caso um evento `no-smoke` tenha sido removido.

#### 9. Proximidade e baixo destaque do botão `SOS` junto ao registro de cigarros, somados a um medidor de excesso que "esvazia" visualmente ao avançar na escala
- **Local:** `app.js:4953-4969`, `app.js:6047-6115` (`updateHomeScreen`), `style.css:4755-4799`, `style.css:10374-10386`.
- **Heurística / princípio afetado:** Prevenção de erros; Hierarquia visual; Clareza e previsibilidade.
- **Evidência:**
  1. O botão `SOS` (`height: 44px`, rótulo reduzido para apenas `"SOS"`, fundo translúcido suave `rgba(255, 159, 67, 0.18)`) fica empilhado a `10 px` (`8 px` em `max-height: 640px`) diretamente acima da linha `[ − ] [ + Registrar cigarro ]`.
  2. Ao ultrapassar a meta (`overLimit >= 1`), `updateHomeScreen` alterna o preenchimento do cigarro entre `100%` (amarelo em `+1`), **`50%` (laranja em `+2`)**, `100%` (laranja em `+3`), **`50%` (vermelho em `+4`)**, `100%` (vermelho em `+5`) e `100%` (vinho `#4A0E17` em `+6`) (`app.js:6077-6101`), sem legenda explicativa.
  - *Encaminhamento:* O uso de `metaReg.style.color = '#4A0E17'` (`app.js:6055`) sobre fundo escuro `#121214` no tema escuro compromete o contraste — encaminhar verificação à `especialista-acessibilidade`.
- **Impacto para quem usa:** Em momento de fissura, o rótulo mínimo `"SOS"` pode não deixar claro que se trata de apoio imediato contra a vontade; a proximidade favorece toque acidental; e o recuo visual de 100% para 50% ao somar mais cigarros contradiz o modelo mental de acúmulo.
- **Severidade:** **2**
- **Recomendação concreta:** Ampliar o distanciamento visual/espacial entre `SOS` e o bloco de registro, usar rótulo mais descritivo (`"SOS • Estou com vontade"` ou `"SOS • Ajuda rápida"`), e manter o cigarro 100% preenchido acima da meta, comunicando o excesso por mudança de cor + badge explícito (`+2 acima da meta`).

#### 10. Inconsistências de navegação no Carrossel vs. `tools-mode` (encerramento abrupto de minijogos, `Voltar` divergente e pílula de economia sem estado ativo)
- **Local:** `app.js:3974-3981` (`goToCarouselSlide`), `app.js:7951-7964` (`handleBackFromScreen`), `app.js:7995-8005` (`handleMinijogosBack`), `app.js:8923-8946` (`handleStart`), `index.html:220-223`.
- **Heurística / princípio afetado:** Controle e liberdade do usuário; Consistência e padrões; Visibilidade do status do sistema.
- **Evidência:**
  1. Durante um minijogo ativo no modo carrossel, o arraste é bloqueado (`app.js:8929`), mas o cabeçalho fixo continua totalmente clicável: um toque acidental nos dots ou na pílula de economia encerra imediatamente o jogo e descarta a partida (`app.js:3974-3981`) sem confirmação.
  2. Em `tools-mode`, tocar na seta `Voltar` (`handleMinijogosBack`, `app.js:7996-8003`) durante um jogo encerra o jogo e sai diretamente para Ferramentas/SOS, diferindo de `handleBackFromScreen(15)` (`app.js:7953-7956`), que retorna ao menu de Minijogos.
  3. A pílula de economia no cabeçalho fixo (`index.html:220`) não recebe estilo de estado ativo quando `currentCarouselSlide === 0` (Conquista), parecendo sempre um link para outra tela.
  4. Diferentemente do carrossel de onboarding (`app.js:8833`), `initHorizontalCarouselGestures` (`app.js:8923-8946`) não ignora o início de arraste sobre botões/cards, o que pode engolir cliques imprecisos quando o dedo desliza > 16 px (`habbiCarouselJustDragged`, `app.js:9009-9019`).
- **Impacto para quem usa:** Perda involuntária de progresso em minijogos, saída inesperada para fora da seção de jogos e menor previsibilidade sobre onde o usuário está no carrossel.
- **Severidade:** **2**
- **Recomendação concreta:** Ocultar/desabilitar a troca de slide no topo durante partidas ativas (ou confirmar antes de encerrar); padronizar `handleMinijogosBack` para retornar primeiro ao menu de minijogos; indicar visualmente o estado ativo na pílula de economia na Tela 29; e ignorar início de arraste horizontal sobre controles críticos.

#### 11. Troca de mês no Calendário força seleção no dia 1º e detalhes do dia podem ficar abaixo da dobra em telas compactas
- **Local:** `app.js:7244-7266` (`changeCalendarMonth`), `app.js:7331-7390`, `index.html:682-726`, `style.css:4954-5285`.
- **Heurística / princípio afetado:** Eficiência e flexibilidade de uso; Clareza visual.
- **Evidência:** Ao navegar para outro mês pelas setas (`changeCalendarMonth`), o app seleciona automaticamente o dia `01` (`app.js:7262`), mesmo sem registros, em vez do último dia com registro ou de manter foco explícito. Além disso, a pilha vertical (header + card de grade + legenda + 3 métricas mensais) precede o `#wl-cal-summary-card`, empurrando a lista de eventos do dia selecionado para abaixo da dobra em viewports de 568–700 px de altura sem rolagem assistida ao tocar em um dia.
- **Impacto para quem usa:** O usuário toca em um dia na grade e pode não perceber imediatamente que o card inferior foi atualizado (exigindo rolagem manual repetida).
- **Severidade:** **2**
- **Recomendação concreta:** Em telas com pouca altura, compactar o espaçamento entre a grade e o resumo mensal (ou fazer `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` no card de detalhes quando o usuário selecionar um dia que não esteja visível junto ao card).

---

### Severidade 1 — Problemas cosméticos / baixa prioridade

#### 12. Perda do marcador `✓` em `"Não fumei hoje"` no painel rápido após reaplicação de idioma e coexistência de fluxos legados (`data-screen="11"` / Home V2)
- **Local:** `app.js:2264-2265` (`applyAppLanguage`), `app.js:5616-5617` (`syncQuickRegisterModalUI`), `index.html:264-316`, `index.html:404-417`.
- **Heurística / princípio afetado:** Consistência e padrões.
- **Evidência:** `applyAppLanguage` sobrescreve `#wl-qreg-confirm-lbl` com o texto base (`'Não fumei hoje'`), apagando o sufixo `' ✓'` definido por `syncQuickRegisterModalUI` quando o dia já estava confirmado. Adicionalmente, a remoção da mascote Morgana da Home atual (`app.js:4886-4969` vs. `index.html:279-281`) impacta a proposta afetiva da jornada — encaminhar avaliação de estratégia/identidade emocional à `especialista-ux`.
- **Impacto para quem usa:** Pequena inconsistência visual no selo de confirmação após troca de idioma ou reentrada em telas que chamam `applyAppLanguage()`.
- **Severidade:** **1**
- **Recomendação concreta:** Chamar `syncQuickRegisterModalUI()` ao final de `applyAppLanguage()` e remover gradualmente o HTML/listeners obsoletos de `data-screen="11"` para evitar divergências futuras.

---

## (b) Hipóteses e riscos que dependem de teste com usuários reais

Os pontos abaixo **não** são defeitos objetivos comprováveis apenas no código, mas hipóteses relevantes de usabilidade que precisam ser verificadas com pessoas reais:

1. **Compreensão do contador `0 / 11 hoje` + `% da meta de hoje`:** Na Home (`app.js:4888-4893`), `0 / 11 hoje • 0% da meta de hoje` mistura uma meta de *teto/limite máximo* (quanto menor, melhor) com percentual crescente (`0%` → `100%`) em verde. Usuários podem interpretar "100% da meta" positivamente (como meta atingida), quando na verdade significa ter chegado ao limite máximo de cigarros do dia.
2. **Descoberta espontânea do gesto de arraste horizontal no Carrossel:** Mesmo após o tutorial inicial, é preciso testar se usuários reais lembram, após dias de uso, que Conquista fica à esquerda e Minijogos à direita sem barra de abas rotulada.
3. **Interpretação da metáfora do cigarro que "enche" de verde ao registrar cigarros:** A cor verde costuma sinalizar progresso positivo no Habbi (`DESIGN_SYSTEM.md:89`); o cigarro se preenchendo em verde conforme o usuário fuma pode gerar ambiguidade semântica (sensação de recompensa ao fumar ou dúvida se o medidor representa cigarros *fumados* ou *evitados*).
4. **Conforto cognitivo no painel rápido `#wl-quick-register-modal`:** O modal mistura ações instantâneas que fecham o painel (`Não fumei hoje`, `Vontade superada`), ações cumulativas que o mantêm aberto (`−` / `+1 cigarro`) e uma seção expansível com botão próprio (`Salvar humor`). É necessário observar se usuários entendem que `+1 cigarro` já salva na hora (sem precisar de botão "Salvar") enquanto o humor exige clicar em `Salvar humor`.
5. **Eficiência do acesso ao SOS em momento de urgência:** Verificar na prática se a posição inferior central e o tamanho do pill `SOS` permitem acionamento rápido com o polegar sem toques acidentais em `+ Registrar cigarro`.

---

## (c) Recomendações priorizadas

### Prioridade Alta (corrigir antes de testes amplos)
1. **Restaurar feedback contextual** (`showToast` ou banners inline) para bloqueios de login, remoções de cigarro e salvamentos de humor.
2. **Corrigir a sobreposição das áreas clicáveis dos `.wl-pager-dot`** e dar rótulos visíveis às 3 telas do carrossel (`Conquista | Início | Minijogos`).
3. **Corrigir as regras do Calendário e do Painel Rápido:** bloquear registros em datas futuras, remover a alteração automática de "hoje" ao confirmar outra data, ajustar o texto para `"Não fumei neste dia"`, pedir confirmação antes de apagar cigarros existentes e restringir/implementar corretamente o botão `Editar`.
4. **Eliminar o registro acidental pelo palco do cigarro (`#home-cig-meter`)** e reintroduzir um caminho claro (sem competição com `+ Registrar cigarro`) para acessar humor/vontade a partir da Home.

### Prioridade Média
5. **Diferenciar o estado "Em andamento"** do dia atual no calendário e alinhar as cores da legenda com os círculos da grade.
6. **Proteger contra perda acidental:** adicionar `"Desfazer"` ou confirmação ao botão `Remover` no calendário e ao sair de um minijogo ativo pelos controles do cabeçalho fixo do carrossel; padronizar `handleMinijogosBack`.
7. **Refinar a hierarquia da Home:** distanciar `SOS` do registro de cigarros, tornar o rótulo de `SOS` autoexplicativo, manter o preenchimento do cigarro em 100% acima da meta (sem voltar a 50%) e padronizar visualmente o botão `−`.

### Prioridade Baixa
8. **Ajustar detalhes de acabamento:** chamar `syncQuickRegisterModalUI()` em `applyAppLanguage()`, suavizar a revelação do card de detalhes no calendário em telas baixas e limpar código legado da Tela 11.

---

## Tarefas recomendadas para teste de usabilidade com pessoas reais (máximo 3)

1. **Tarefa 1 — Registro diário, correção de erro e interpretação do medidor (Home + Calendário)**
   - *Cenário:* "Imagine que você acabou de fumar um cigarro e quer registrá-lo. Depois, percebe que apertou duas vezes por engano e quer corrigir. Por fim, diga o que entende que o número `1 / 11 hoje` e o desenho do cigarro estão mostrando."
   - *O que observar/medir:* Taxa de conclusão sem erro, incidência de toques acidentais no palco do cigarro ou em `SOS`, descoberta do botão `−`, e interpretação verbal da barra verde e do `% da meta`.

2. **Tarefa 2 — Ajuste retroativo e gestão de registros no Calendário**
   - *Cenário:* "Você esqueceu de anotar ontem que não fumou nenhum cigarro, e também quer corrigir o horário de um registro de dois dias atrás e apagar um registro errado."
   - *O que observar/medir:* Facilidade para localizar o calendário e o dia anterior, reação ao rótulo `"Não fumei hoje"` em uma data passada, expectativa frustrada ao clicar em `Editar`, e risco de erro de toque entre `Editar` e `Remover`.

3. **Tarefa 3 — Descoberta e navegação no Carrossel (Conquista e Minijogos) em situação de vontade**
   - *Cenário:* "Você está com vontade de fumar e quer se distrair com um jogo rápido sem usar o menu superior; depois, quer conferir quanto economizou até agora e voltar para a tela inicial."
   - *O que observar/medir:* Se a pessoa descobre o gesto horizontal ou tenta tocar nos 3 pontinhos (e se acerta o ponto pretendido), tempo até chegar a Minijogos/Conquista e se ocorre encerramento acidental de jogo ao tocar no topo.

---

## Limitações desta análise
- **Inspeção estática apenas:** O aplicativo não foi executado em navegador nem em dispositivos reais (320 px, 390 px, 430 px); portanto, altura real acima da dobra, velocidade de renderização, fluidez de animações, comportamento real de eventos `touch` vs. `click` em iOS/Android e renderização de filtros SVG (`feFlood`/`clip-path`) no medidor do cigarro não foram testados em runtime.
- **Ausência de métricas comportamentais:** Carga cognitiva percebida, clareza emocional da linguagem e descobribilidade após uso prolongado dependem de testes empíricos com pessoas fumantes/ex-fumantes.
- **Recorte de especialidade:** Questões de conformidade WCAG 2.2 AA (contraste numérico em tema claro/escuro, atributos ARIA de `tablist`, foco de teclado em modais e alvos < 44 px) foram apenas sinalizadas para a `especialista-acessibilidade`, e decisões de estratégia de produto/jornada emocional (como a remoção da mascote Morgana da Home) foram sinalizadas para a `especialista-ux`.
