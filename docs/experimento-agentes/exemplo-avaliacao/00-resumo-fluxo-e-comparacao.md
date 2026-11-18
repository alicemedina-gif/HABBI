# Síntese Comparativa e Rastreamento do Fluxo — Experimento de Avaliação do Habbi

Este documento consolida a execução prática do fluxo oficial de avaliação sobre três funcionalidades reais do **Habbi** (**Calendário**, **Registro de Cigarros** e **Carrossel Principal**), comparando os quatro relatórios produzidos de forma independente na branch `docs/experimento-agentes` (base `main` `bff8ef0`, sem nenhuma modificação no código do aplicativo).

---

## 1. Rastreamento do Fluxo Executado (Etapas 1 a 6)

| Etapa | Agente | Status | Artefato Gerado | Restrição Aplicada |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `especialista-ux` | **Concluída** | `01-relatorio-especialista-ux.md` | Somente leitura (`EnableWriteTools: false`) |
| **2** | `especialista-usabilidade` | **Concluída** | `02-relatorio-especialista-usabilidade.md` | Somente leitura (`EnableWriteTools: false`) |
| **3** | `especialista-acessibilidade` | **Concluída** | `03-relatorio-especialista-acessibilidade.md` | Somente leitura (`EnableWriteTools: false`) |
| **4** | `critico` | **Concluída** | `04-relatorio-revisor-critico.md` | Somente leitura (`EnableWriteTools: false`) |
| **—** | **Decisão Humana (Autora)** | **Aguardando deliberação** | 6 decisões listadas na Seção 6 deste documento | Aprovação explícita obrigatória |
| **5** | `dev-fullstack-senior` | **Não executada (escopo bloqueado nesta fase)** | — | Aguarda aprovação humana |
| **6** | Testes (320/390/430 px × Claro/Escuro × PT/EN/ES × teclado/contraste) | **Não executada (escopo bloqueado nesta fase)** | — | Aguarda Etapa 5 |

> **Nota de controle experimental:** Os 3 primeiros agentes (`especialista-ux`, `especialista-usabilidade` e `especialista-acessibilidade`) foram executados em **contextos isolados e independentes** (nenhum deles viu o relatório dos demais) recebendo exatamente o mesmo escopo, os mesmos caminhos de arquivo e o mesmo modelo (`Claude Opus 4.6 (Thinking)` via `invoke_subagent` no Antigravity). Somente na Etapa 4 o `critico` recebeu os 3 relatórios junto com o código-fonte original para verificação adversarial.

---

## 2. Matriz Comparativa: Concordâncias entre os Agentes

Os achados abaixo foram **identificados de forma independente por múltiplos agentes** e **confirmados no código pelo `critico`**:

| Achado Comprovado no Código | Evidência Principal | UX | Usabilidade | Acessibilidade | Crítico |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`showToast()` silenciado globalmente** (bloqueio de visitante sem explicação, remoção `−` e humor sem feedback visual nem `aria-live`) | `app.js:3034-3038`, `style.css:2014-2019` | E6 | Item 1 (Sev. 3) | Item 5 (Crítica) | Confirmado |
| **Botão `Editar` no Calendário não edita cigarros/vontades/dia sem fumar** (só popula `mood`) | `app.js:7531`, `5634`, `5648-5651` | E1 | Item 2 (Sev. 3) | — | Confirmado *(mas desmentiu citação ao tutorial morto)* |
| **Efeitos colaterais em `quickConfirmDay()` e datas futuras no Calendário** (marca hoje colateralmente, apaga cigarros sem aviso, rótulo `"Não fumei hoje"` fixo, datas futuras permitidas) | `app.js:5762-5792`, `7344-7390`, `2944-2951` | E2, E3 | Item 3 (Sev. 3) | — | Confirmado |
| **Sobreposição grave das áreas de toque nos `.wl-pager-dot`** (`6 px` com `gap: 6 px` e `::before` de `44×44 px`) | `style.css:7858-7887` | Encaminhado | Item 4 (Sev. 3) | Item 9 (Alta) | Confirmado |
| **Hoje "Em andamento" aparece como "Sem registro" no Calendário** (grade cinza + `aria-label` falso `"Sem registros (Hoje)"` + cores legenda vs. grade divergentes) | `app.js:2739-2740`, `7356`, `style.css:5140-5236` | E4 | Item 6 (Sev. 2) | Item 7 (Crítica), Item 12 (Alta) | Confirmado |
| **Contraste crítico de `#4A0E17` sobre `#121214` (~1,22:1) na Home ao exceder a meta** | `app.js:6055` | E5 / Encam. | Item 9 / Encam. | Item 6 (Crítica) | Confirmado |
| **Conflito no palco `#home-cig-meter`** (interativo sem semântica de botão/affordance e conflito com swipe horizontal) | `app.js:4925`, `8955` | E8, E12 | Item 5 (Sev. 3) | Item 3 (Crítica) | Confirmado *(com conflito de solução!)* |
| **Encerramento silencioso de minijogo ativo pelo topo fixo e `Voltar` divergente em `tools-mode`** | `app.js:3974-3981`, `7995-8005` | E11 | Item 10 (Sev. 2) | — | Confirmado |
| **Exclusão em 1 toque no Calendário com alvos pequenos (`Editar`/`Remover` sem confirmação/desfazer)** | `app.js:7530-7539`, `style.css:5495-5523` | Encaminhado | Item 7 (Sev. 2) | Item 14 (Alta) | Confirmado |
| **Padrão `tablist` incompleto e `aria-label="Página atual: Início"` congelado nos pager dots** | `index.html:229-233`, `app.js:3996-4001` | Encaminhado | Encaminhado | Item 2 (Crítica) | Confirmado |

---

## 3. Contradições e Conflitos Detectados Entre os Agentes

Um dos resultados mais valiosos do experimento é observar **onde especialistas corretos dentro de sua própria disciplina produzem recomendações mutuamente incompatíveis** — demonstrando por que a etapa de revisão crítica e a decisão humana são indispensáveis:

| Ponto de Conflito | Posição de UX / Usabilidade | Posição de Acessibilidade | Diagnóstico do Crítico |
| :--- | :--- | :--- | :--- |
| **1. `#home-cig-meter` (cigarro central clicável)** | **Remover o `onclick`** (`UX E8/E12`, `Usab. Item 5`) para eliminar registros acidentais durante o arraste horizontal e evitar dupla função ambígua. | **Opção A recomendada: manter interativo convertendo em `<button>`** (`A11y Item 3`) com `aria-label` dinâmico. | **Conflito bloqueante:** implementar a Opção A resolve teclado/ARIA, mas mantém intacto o bug de registro acidental e o conflito com swipe. A solução convergente mais simples é remover o `onclick` e marcar a ilustração como decorativa (`aria-hidden="true"`), centralizando o registro no botão `+ Registrar cigarro`. |
| **2. Indicadores do Carrossel (`.wl-pager-dot`)** | **Substituir os 3 pontos por abas/seletor segmentado com rótulos visíveis** (`Conquista \| Início \| Minijogos`) (`UX E9`, `Usab. Item 4`). | **Manter pontos de `8×8 px` sem texto visível** com `min-width: 24px; min-height: 24px` no snippet CSS (`A11y Itens 2 e 9`). | **Conflito bloqueante + quebra de regra do projeto:** o snippet de Acessibilidade passa WCAG 2.5.8 AA (24 px), mas mantém baixa descobribilidade visual e **viola a meta de 44×44 px** de `AGENTS.md:126` e `DESIGN_SYSTEM.md:169`. |
| **3. Uso de cores hexadecimais literais nos snippets de correção** | Foco conceitual em suavizar tons punitivos e harmonizar legenda/grade. | Propõe snippets CSS com hexadecimais literais novos (`#64748B`, `#1E293B`, `#FCA5A5`, `#C53030`). | Viola `AGENTS.md:3.2` (proibição de hexadecimais fora dos tokens `:root` / `.dark-theme`). Na Etapa 5, toda correção de cor deve ser mapeada como token CSS. |
| **4. Priorização de código morto (Tela 11 e tutorial demo)** | `UX E1` e `Usab. Item 2` citaram `app.js:9101` como contradição ativa no tutorial; `Usab. Item 12` tratou Tela 11 como baixa prioridade (limpeza). | `A11y Itens 11 e 13` classificaram contraste e botão fechar da Tela 11 como **Severidade ALTA (Prioridade 2)**. | O `critico` verificou no código que `ensureCalTutorialDemoRow()` nunca é chamada e `showScreen(11)` intercepta toda entrada na Tela 11. Solução superior: **deletar o código morto**, não reformar CSS/HTML inalcançável. |

---

## 4. Contribuições Únicas de Cada Agente (O Valor da Especialização)

Mesmo analisando exatamente o mesmo código-fonte com o mesmo modelo de IA, **cada prompt especializado revelou classes inteiras de problemas que os outros três não detectaram**:

### Contribuições exclusivas de `especialista-ux`
- **Tensão com a proposta de valor empática:** explicitou o descompasso entre `DESIGN_SYSTEM.md`/`AGENTS.md` (acolhimento com Morgana) e a Home injetada em runtime (cigarro gigante + ausência da Morgana + escala punitiva `#4A0E17` + `meta-exceeded-modal` desconectado).
- **Hipótese de *cue reactivity*:** levantou o risco clínico/comportamental de exibir um cigarro grande no centro da tela inicial para pessoas em abstinência recente.
- **Alinhamento com redução gradual:** questionou se destacar `"0 Sem fumar"` como primeira métrica mensal desvaloriza micro-vitórias de quem está em redução gradual.
- **Plano de pesquisa qualitativa:** formulou 5 perguntas empíricas com métodos específicos (*5-second test*, *diary study* de 7 dias, A/B moderado com *think-aloud*).

### Contribuições exclusivas de `especialista-usabilidade`
- **Bug de regressão visual no medidor acima da meta:** identificou que `updateHomeScreen` (`app.js:6077-6101`) faz o cigarro "esvaziar" de `100%` para `50%` ao subir de `+1` para `+2` (e novamente de `+3` para `+4`), violando o modelo mental de acúmulo.
- **Micro-defeitos operacionais:** descobriu que a animação `is-bumping` (`app.js:6168`) é um *no-op* (só remove a classe), que `applyAppLanguage()` (`app.js:2265`) apaga o marcador `' ✓'` do botão `"Não fumei hoje"`, que `changeCalendarMonth()` força seleção no dia `01` e que desfazer um cigarro após clique acidental não restaura a confirmação `"Não fumei hoje"`.
- **Ambiguidade do `% da meta`:** levantou a hipótese de que `"100% da meta de hoje"` em verde pode ser lido como conquista positiva quando significa ter atingido o teto de consumo.
- **Protocolo de teste:** entregou 3 tarefas prontas e mensuráveis para teste de usabilidade moderado.

### Contribuições exclusivas de `especialista-acessibilidade`
- **Rigor normativo (WCAG 2.2 AA, WAI-ARIA APG, eMAG e LBI):** mapeou 20 achados vinculados a critérios exatos (1.1.1, 1.3.1, 1.3.2, 1.4.1, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 2.1.1, 2.3.3, 2.4.3, 2.4.6, 2.4.7, 2.5.8, 3.1.1, 3.1.2, 3.3.2, 4.1.2, 4.1.3).
- **Barreiras estruturais invisíveis a olho nu:** slides fora da viewport sem `inert`/`aria-hidden`, perda de foco ao clicar em qualquer dia do Calendário (`grid.innerHTML = ''`) e ao desabilitar `−` quando o contador zera, 4 cards de Minijogos em `<div role="button">` sem `Enter`/`Space`, ausência de `aria-expanded`/`aria-controls` no expansor de eventos e `<html lang="pt-BR">` estático mesmo em EN/ES.
- **Cálculos objetivos de contraste:** quantificou exatamente as violações (`1,21:1` em `#4A0E17`, `1,27:1` no dot ativo dark, `2,04:1` em branco sobre `#6CCB4F`, `2,67:1` em `#5FB149` sobre branco, `2,48:1` em `.state-outside`).

### Contribuições exclusivas de `critico`
- **Segurança (Stored XSS):** descobriu injeção HTML via `innerHTML` no Calendário e Histórico a partir de notas de humor e backups restaurados sem validação (`app.js:5853, 7514, 8469, 2567`).
- **Erro comportamental/financeiro na economia:** comprovou que `computeSavingsMetrics()` faz a economia estimada saltar de `R$ 0,00` para `R$ 8,25` no exato momento em que o usuário registra o 1º cigarro fumado (`app.js:3382-3403, 3478-3495`).
- **Privacidade, autenticação e perda de dados:** descobriu furo de bloqueio de visitantes via Ferramentas (`saveQuickMood`), cadastro/login simulados aceitando campos vazios e `handleProfileLogout()` apagando `localStorage` irreversivelmente sem confirmação.
- **Auditoria da própria documentação e dos outros agentes:** identificou falsos positivos/código morto nos relatórios (`ensureCalTutorialDemoRow`, Tela 11, `.slide-in-*`), falhas de a11y omitidas no Slide 0 (Conquista) e no tema escuro, bugs visíveis de i18n (`"hoje"` e eventos gravados em PT), casos de borda de meia-noite/UTC, autocontradições em `AGENTS.md`/`DESIGN_SYSTEM.md` e ausência de aviso ético de saúde.

---

## 5. Separação Rigorosa: Fatos Comprovados vs. Hipóteses vs. Recomendações

| Categoria | Critério de Inclusão | Exemplos Confirmados Neste Experimento |
| :--- | :--- | :--- |
| **1. Problemas Comprovados no Código** | Verificáveis diretamente em arquivo, linha, seletor CSS ou fórmula matemática (reprodutíveis sem subjetividade). | Stored XSS via `innerHTML`; salto indevido da economia ao registrar o 1º cigarro; `quickConfirmDay()` marcando hoje colateralmente; `showToast()` neutralizado; `grid.innerHTML = ''` destruindo o foco; slides inativos sem `inert`; contraste `1,22:1` em `#4A0E17`; `.wl-pager-dot::before` sobrepostos; `handleProfileLogout()` apagando dados sem aviso; `"hoje"` não traduzido em EN/ES. |
| **2. Hipóteses e Itens de Teste Real** | Plausíveis a partir do código, mas impossíveis de provar sem pessoas reais, dispositivos físicos ou leitores de tela. | Se o cigarro central gera *cue reactivity* ou ajuda no controle; se `"100% da meta"` em verde confunde usuários; se a pílula monetária parece dinheiro real; se `touchmove` conflita com VoiceOver/TalkBack; contraste computado de filtros SVG + Canvas; recorte real de `:focus-visible` sob `overflow: hidden`; reflow em `320 px` com zoom `200%`. |
| **3. Recomendações (Ações Propostas)** | Mudanças de design, arquitetura ou código sugeridas — dependem de priorização e aprovação humana antes da Etapa 5. | Escapar HTML / usar `textContent`; adotar seletor segmentado rotulado (`44 px`); remover `onclick` de `#home-cig-meter`; corrigir `computeSavingsMetrics()` e `quickConfirmDay()`; adicionar confirmação no logout e aviso ético de protótipo acadêmico; corrigir tokens de contraste AA e teclado/ARIA; remover código morto (`data-screen="11"`, `ensureCalTutorialDemoRow`). |

---

## 6. Decisões Humanas Pendentes Antes da Etapa 5 (`dev-fullstack-senior`)

Nenhuma alteração foi aplicada ao código do Habbi nesta etapa. Antes de acionar `dev-fullstack-senior`, a autora deve deliberar sobre os **6 pontos de decisão** destacados pelo `critico`:

1. **Protagonismo da Home:** manter o medidor de cigarro (sem `onclick` na imagem, sem recuo 100%→50% e com acolhimento ao exceder) **ou** restaurar a mascote Morgana conforme `DESIGN_SYSTEM.md`?
2. **Política do modo visitante:** liberar registro local completo sem exigir cadastro **ou** manter o bloqueio de conta fechando o furo em `saveQuickMood()` e exibindo aviso claro?
3. **Regra da economia estimada:** mostrar apenas economia consolidada de dias finalizados no topo **ou** exibir projeção diária claramente separada (sem subir ao registrar o 1º cigarro)?
4. **Navegação do Carrossel:** substituir os 3 pontos por abas/pílulas rotuladas (`Conquista | Início | Minijogos`) com `min-height: 44px`?
5. **Escopo do `Editar` no Calendário:** implementar edição real de horário/detalhes para todos os eventos **ou** exibir `Editar` apenas para eventos `mood`?
6. **Limpeza de código morto:** autorizar remoção definitiva da Tela 11 legada (`data-screen="11"`) e de `ensureCalTutorialDemoRow()`?
