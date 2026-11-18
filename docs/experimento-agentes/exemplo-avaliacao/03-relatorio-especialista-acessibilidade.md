# Relatório 03 — Especialista em Acessibilidade (`especialista-acessibilidade`)

## Metadados da Execução (Registro do Experimento)

| Campo | Registro |
| :--- | :--- |
| **Agente executado** | `especialista-acessibilidade` (prompt original preservado em `docs/experimento-agentes/originais-professora/especialista-acessibilidade.md`, SHA-256 `B3F63D598F4B`) |
| **Ferramenta / Plataforma** | Antigravity — subagente isolado via `define_subagent` + `invoke_subagent` |
| **Modelo utilizado** | Claude Opus 4.6 (Thinking) — herdado da sessão coordenadora (`Model: inherit`) |
| **Data da execução** | 2026-11-18 |
| **Restrições técnicas efetivamente aplicadas** | `EnableWriteTools: false`, `EnableMCPTools: false`, `EnableSubagentTools: false` (modo estritamente **somente leitura**, sem edição de arquivos nem execução de comandos) |
| **Contexto fornecido ao agente** | Repositório Habbi na branch `docs/experimento-agentes` (base estável `main` `bff8ef0`): `DESIGN_SYSTEM.md`, `AGENTS.md`, `index.html`, `app.js` e `style.css`, com foco exclusivo em **Calendário**, **Registro de Cigarros** e **Carrossel Principal**. |
| **Prompt aplicado** | `SystemPrompt` = conteúdo integral verbatim de `especialista-acessibilidade.md` + tarefa controlada idêntica para os 3 especialistas (escopo das 3 funcionalidades, caminhos absolutos dos arquivos, exigência de citação de arquivo/linha, separação explícita entre evidências comprovadas, hipóteses/testes manuais e recomendações, e declaração de limitações). |

---

## Saída Integral do Agente

# Auditoria de Acessibilidade Digital — Habbi (WCAG 2.2 AA, WAI-ARIA APG, eMAG e LBI)

## Escopo Auditado e Limites
- **Escopo coberto (inspeção estática direta do código-fonte)**:
  1. **Calendário** (`data-screen="16"` — grade mensal, seleção de dias, resumo mensal, detalhes/edição/remoção de eventos do dia selecionado e navegação entre meses).
  2. **Registro de cigarros** (Home `data-screen="10"` — medidor diário interativo `#home-cig-meter`, botão principal `+ Registrar cigarro`, botão `−` de desfazer, proximidade com SOS, painel rápido `#wl-quick-register-modal` via `openRegisterSheet` e tela legada `data-screen="11"` / `.quick-register-grid`).
  3. **Carrossel principal** (`#main-carousel-container` — cabeçalho fixo com pílula de conquista e indicadores `.wl-pager-nav-dots`, viewport deslizante entre Conquista `29` ↔ Início `10` ↔ Minijogos `15`, gestos touch/mouse e alternância com `tools-mode`).
- **Arquivos inspecionados**: [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js), [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css), [DESIGN_SYSTEM.md](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/DESIGN_SYSTEM.md) e [AGENTS.md](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/AGENTS.md).
- **Fora do escopo desta auditoria**: demais telas (Splash, Onboarding, SOS Hub `12`, Intervenção `13`, Ferramentas `14`, Progresso `17`, Histórico `19`, Perfil `21`, Configurações `22`, Auth `23`/`24`, Sentimentos `25`, Avatar `26`, Sobre `27`, Conta `28`) e testes automatizados/executados em navegador ou tecnologias assistivas reais. Esta avaliação **não atesta conformidade total** com WCAG 2.2 AA, eMAG ou LBI (Lei nº 13.146/2015, Art. 63).

---

## (a) Problemas Comprovados no Código (Confirmados — Ordenados por Severidade)

### Severidade CRÍTICA

#### 1. [Carrossel Principal] Slides fora da tela permanecem focáveis e expostos à árvore de acessibilidade
- **Arquivo / Linha / Elemento**:
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L10040-L10060) (`.main-carousel-track .carousel-slide` força `display: flex !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important;`)
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L3971-L4025) (`window.goToCarouselSlide`)
- **Critério WCAG / Padrão**: WCAG 2.2 **2.4.3** (Ordem do Foco — A), **2.4.7** (Foco Visível — AA), **1.3.2** (Sequência Significativa — A), **4.1.2** (Nome, Função, Valor — A); eMAG Rec. 1.2 e 2.2.
- **Evidência**: Os 3 slides (`data-screen="29"`, `"10"`, `"15"`) ficam permanentemente visíveis no DOM lado a lado dentro de um `overflow: hidden` e são deslocados apenas via `translate3d`. Nenhum slide inativo recebe `inert` nem `aria-hidden="true"` — inclusive quando `tools-mode` está ativo em `15` ou `29`.
- **Quem é afetado**: Usuários de teclado, dispositivos acionadores (*switch*) e leitores de tela (NVDA, VoiceOver, TalkBack). Ao pressionar `Tab` na Home, o foco "some" ao entrar em controles invisíveis de Conquista (`29`) e Minijogos (`15`); leitores de tela navegam pelas 3 telas misturadas como uma página única.
- **Correção recomendada** (para `dev-fullstack-senior`):
```javascript
// Em app.js -> goToCarouselSlide(slideIdx, smooth = true)
const slideScreens = [
  document.querySelector('.screen[data-screen="29"]'),
  document.querySelector('.screen[data-screen="10"]'),
  document.querySelector('.screen[data-screen="15"]')
];
slideScreens.forEach((el, idx) => {
  if (!el) return;
  const isActive = idx === slideIdx;
  el.inert = !isActive; // bloqueia foco e interação nos slides ocultos
  el.setAttribute('aria-hidden', String(!isActive));
});
```

#### 2. [Carrossel Principal] Padrão ARIA `tablist` inválido e estado ativo congelado nos indicadores de página
- **Arquivo / Linha / Elemento**:
  - [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L229-L233) (`.wl-pager-nav-dots[role="tablist"]` e botões `.wl-pager-dot`)
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L3996-L4001) (`goToCarouselSlide`)
- **Critério WCAG / Padrão**: WCAG 2.2 **4.1.2** (Nome, Função, Valor — A), **1.3.1** (Informações e Relações — A); WAI-ARIA APG *Tabs Pattern* (filhos obrigatórios de `tablist`).
- **Evidência**: O contêiner declara `role="tablist"`, mas os 3 `<button class="wl-pager-dot">` não possuem `role="tab"`, `aria-selected` nem `aria-controls`; os slides não possuem `role="tabpanel"`. Além disso, `goToCarouselSlide` altera somente a classe `.active`, mantendo permanentemente o atributo estático `aria-label="Página atual: Início"` no 2º botão mesmo quando o usuário está em Conquista ou Minijogos, e não há suporte a `ArrowLeft`/`ArrowRight`.
- **Quem é afetado**: Usuários de leitores de tela (recebem anúncio contraditório de página atual e violação de estrutura ARIA) e usuários de teclado.
- **Correção recomendada**:
```html
<!-- index.html -->
<div class="wl-pager-nav-dots" role="tablist" aria-label="Telas principais">
  <button type="button" class="wl-pager-dot" role="tab" id="tab-conquista"
          aria-controls="slide-screen-29" aria-selected="false" tabindex="-1"
          aria-label="Conquista" onclick="navigateHorizontalCarousel(29)"></button>
  <button type="button" class="wl-pager-dot active" role="tab" id="tab-inicio"
          aria-controls="slide-screen-10" aria-selected="true" tabindex="0"
          aria-label="Início" onclick="navigateHorizontalCarousel(10)"></button>
  <button type="button" class="wl-pager-dot" role="tab" id="tab-minijogos"
          aria-controls="slide-screen-15" aria-selected="false" tabindex="-1"
          aria-label="Minijogos" onclick="navigateHorizontalCarousel(15)"></button>
</div>
```
```javascript
// Em goToCarouselSlide: atualizar aria-selected e roving tabindex + adicionar keydown (ArrowLeft/ArrowRight/Home/End)
dots.forEach((dot, idx) => {
  const active = idx === slideIdx;
  dot.classList.toggle('active', active);
  dot.setAttribute('aria-selected', String(active));
  dot.setAttribute('tabindex', active ? '0' : '-1');
});
```

#### 3. [Registro de Cigarros — Home] Medidor interativo `#home-cig-meter` é um `<div>` clicável inacessível por teclado e sem estado acessível
- **Arquivo / Linha / Elemento**: [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L4925-L4950) (`<div class="wl-cig-meter-wrap" id="home-cig-meter" onclick="handleHomeAddCigarette()" title="Toque para adicionar">`)
- **Critério WCAG / Padrão**: WCAG 2.2 **2.1.1** (Teclado — A), **4.1.2** (Nome, Função, Valor — A), **1.1.1** (Conteúdo Não Textual — A); eMAG Rec. 2.1.
- **Evidência**: O medidor visual de cigarros é interativo por clique/toque, mas é renderizado como `<div>` sem `tabindex`, sem `role="button"`, sem tratamento de `Enter`/`Space` e com `alt="Progresso diário do cigarro"` estático que não informa a contagem atual nem o estágio de alerta.
- **Quem é afetado**: Usuários de teclado e usuários de leitores de tela.
- **Correção recomendada**: Como já existe o botão explícito `#btn-home-add-cig` logo abaixo, escolha uma das duas abordagens semânticas:
  - **Opção A (recomendada — manter interativo como `<button>`)**: converter `#home-cig-meter` em `<button type="button">` com `aria-label` dinâmico atualizado em `updateHomeScreen()` (ex.: `"Medidor diário: 3 de 11 cigarros hoje. Ative para registrar mais 1 cigarro"`) e `alt=""` nas 3 imagens internas.
```html
<button type="button" class="wl-cig-meter-wrap" id="home-cig-meter"
        onclick="handleHomeAddCigarette()"
        aria-label="Progresso diário: 0 de 11 cigarros hoje. Ative para registrar 1 cigarro">
  <div class="wl-cig-illustration-box" aria-hidden="true">
    <img src="${cigImgSrc}" alt="" class="wl-cig-png-base">
    ...
  </div>
</button>
```

#### 4. [Registro de Cigarros — Painel Rápido] Modal `#wl-quick-register-modal` sem `role="dialog"`, sem foco inicial/retorno, sem armadilha de foco e sem fechamento por `Escape`
- **Arquivo / Linha / Elemento**:
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5473-L5557) (criação de `#wl-quick-register-modal` e `#wl-celebration-modal`)
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5626-L5706) (`openQuickRegisterModal` e `closeQuickRegisterModal`)
  - [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L1187-L1197) (`#meta-exceeded-modal`)
- **Critério WCAG / Padrão**: WCAG 2.2 **2.1.1** (Teclado — A), **2.4.3** (Ordem do Foco — A), **4.1.2** (Nome, Função, Valor — A); WAI-ARIA APG *Dialog (Modal) Pattern*. (Diverge do próprio [DESIGN_SYSTEM.md](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/DESIGN_SYSTEM.md#L311), que afirma haver foco contido e fechamento por `Escape`.)
- **Evidência**: O painel rápido não possui `role="dialog"`, `aria-modal="true"` nem `aria-labelledby="wl-qreg-header-title"`. Ao abrir, o foco não é transferido para o modal; ao pressionar `Tab`, o foco escapa para elementos por trás do overlay; não há listener `keydown` para `Escape`; ao fechar, o foco não retorna ao botão acionador. O mesmo ocorre em `#wl-celebration-modal` (onde também `#wl-cel-paw-stage` é um `<div>` clicável sem teclado).
- **Quem é afetado**: Usuários de teclado, leitores de tela e pessoas usando ampliadores de tela.
- **Correção recomendada**:
```html
<div class="wl-qreg-sheet" role="dialog" aria-modal="true" aria-labelledby="wl-qreg-header-title" tabindex="-1">
```
```javascript
let qregPreviousFocus = null;
// Ao abrir:
qregPreviousFocus = document.activeElement;
document.querySelector('.app-screen-container')?.setAttribute('inert', '');
modal.classList.add('is-open');
modal.querySelector('.wl-qreg-sheet')?.focus();
// Listener keydown: fechar com Escape e ciclar Tab/Shift+Tab entre primeiro e último focável dentro do modal.
// Ao fechar: remover inert e chamar qregPreviousFocus?.focus().
```

#### 5. [Registro de Cigarros — Home e Painel Rápido] Ausência de mensagens de status acessíveis (`aria-live`) e perda de foco ao desabilitar o botão `−`
- **Arquivo / Linha / Elemento**:
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L3035-L3038) (`showToast` desativada) e [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L2014-L2019) (`.toast-notice { display: none !important; }`)
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L4887-L4893), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5608-L5609), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L6008-L6013) (`homeRemoveBtn.disabled = !canRemoveToday` e `minusBtn.disabled = cigs <= 0`)
- **Critério WCAG / Padrão**: WCAG 2.2 **4.1.3** (Mensagens de Status — AA), **2.4.3** (Ordem do Foco — A).
- **Evidência**:
  1. Como `showToast` está desativada e não existe nenhuma região `role="status"` / `aria-live="polite"`, ao acionar `+ Registrar cigarro` ou `−` (na Home ou no Painel Rápido), nenhum feedback é anunciado aos leitores de tela.
  2. Ao acionar `#btn-home-remove-cig` (Home) ou `#wl-qreg-btn-minus` (Painel Rápido) quando a contagem vai de `1` para `0`, o código executa `.disabled = true` no próprio botão que detém o foco — fazendo o navegador descartar o foco para `document.body`.
- **Quem é afetado**: Pessoas cegas/com baixa visão (sem confirmação da ação) e usuários de teclado (foco perdido após remover o último cigarro).
- **Correção recomendada**:
```html
<!-- Região live dedicada no container principal -->
<div id="habbi-sr-status" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
```
```javascript
function announceStatus(msg) {
  const region = document.getElementById('habbi-sr-status');
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = msg; });
}
// Em handleHomeRemoveCigarette(): se após remover cigs === 0 e o foco estava em btn-home-remove-cig,
// mover o foco para #btn-home-add-cig antes de desabilitar (ou usar aria-disabled="true" mantendo focável).
```

#### 6. [Registro de Cigarros — Home] Contraste crítico no Tema Escuro (`#4A0E17` sobre `#121214` ≈ 1,21:1) e estágios de alerta transmitidos apenas por cor
- **Arquivo / Linha / Elemento**:
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L6047-L6059) (`metaReg.style.color = '#4A0E17'` inline quando `overLimit >= 6`)
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L6061-L6115) (estágios `green`, `yellow`, `orange`, `red`, `dark` no medidor SVG)
- **Critério WCAG / Padrão**: WCAG 2.2 **1.4.3** (Contraste Mínimo — AA), **1.4.1** (Uso da Cor — A); eMAG Rec. 4.1 e 4.2.
- **Evidência**:
  1. Ao exceder a meta em 6+ cigarros, `metaReg.style.color = '#4A0E17'` é aplicado inline sobre `#121214` no tema escuro, gerando razão de contraste calculada de **~1,21:1** (praticamente ilegível; mínimo WCAG AA é 3,0:1 para texto grande / 4,5:1 para texto normal).
  2. A progressão dos 5 níveis de alerta do medidor na Home depende exclusivamente de cor (filtros `feFlood` e cor do dígito), sem texto/ícone complementar indicando que a meta foi ultrapassada.
- **Quem é afetado**: Usuários do modo escuro, pessoas com baixa visão, pessoas com daltonismo (deuteranopia/protanopia) e usuários de leitores de tela.
- **Correção recomendada**: Remover `metaReg.style.color = ...` inline, controlar estágios por classes CSS com tokens dedicados para tema claro e escuro (ex.: `#FCA5A5` no modo escuro, contraste > 9:1 contra `#121214`), e exibir um selo textual acessível (ex.: `"Meta ultrapassada (+2)"`) com ícone quando `overLimit > 0`.

#### 7. [Calendário] Perda de foco ao selecionar qualquer dia, ausência de estado selecionado/atual em ARIA e dias da semana ambíguos sem semântica de grade
- **Arquivo / Linha / Elemento**:
  - [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L683-L686) e [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5105-L5108) (`.wl-cal-weekdays` com `<span>D</span><span>S</span>...`)
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L7277-L7394) (`selectCalendarDate`, `generateCalendar`)
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L2719-L2741) + [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L7356-L7357) (falso `"Sem registros"` no `aria-label` de hoje em andamento)
- **Critério WCAG / Padrão**: WCAG 2.2 **2.4.3** (Ordem do Foco — A), **1.3.1** (Informações e Relações — A), **4.1.2** (Nome, Função, Valor — A), **4.1.3** (Mensagens de Status — AA); WAI-ARIA APG *Grid / Date Picker Pattern*.
- **Evidência**:
  1. Clicar ou pressionar `Enter` em qualquer dia executa `grid.innerHTML = ''` (`app.js:7290`), **destruindo o botão atualmente focado** e jogando o foco de volta ao topo da página (`body`).
  2. O dia selecionado só recebe classe visual `.is-selected`, sem `aria-pressed="true"` (ou `aria-selected="true"` em padrão `grid`) e hoje não recebe `aria-current="date"`.
  3. Os cabeçalhos da semana são letras isoladas (`D, S, T, Q, Q, S, S`) em `<span>` sem vínculo estrutural às colunas (leitores de tela anunciam letras soltas e repetidas sem significado).
  4. **Inconsistência semântica comprovada**: `getDayStatus(todayKey)` retorna `'neutral'` tanto para dia sem registros quanto para o dia atual *em andamento* com cigarros registrados (`app.js:2739-2740`). Em `app.js:7356`, qualquer valor diferente de `'green'`, `'exceeded'` ou `'zero'` cai no fallback `'Sem registros'` — fazendo o leitor de tela anunciar **`"Sem registros (Hoje)"` mesmo quando já há cigarros registrados no dia**.
  5. Mudar de mês (`changeCalendarMonth`) ou selecionar um dia não anuncia nada via `aria-live`, e não há navegação por setas na grade (exige ~35–42 pressionamentos de `Tab` para atravessar o mês).
- **Quem é afetado**: Usuários de teclado e leitores de tela.
- **Correção recomendada**:
```javascript
// 1. Em selectCalendarDate / generateCalendar: após reconstruir a grade, restaurar o foco no botão da data selecionada (quando disparado por interação do usuário):
dayEl.dataset.dateKey = dKey;
dayEl.setAttribute('aria-pressed', String(isSelected));
if (isToday) dayEl.setAttribute('aria-current', 'date');
// Corrigir statusDesc verificando se há eventos no dia:
const rec = userState.dailyRecords[dKey];
const hasEvents = Boolean(rec && Array.isArray(rec.events) && rec.events.length > 0);
const statusDesc = status === 'green'
  ? (rec && rec.cigs === 0 ? 'Sem fumar' : 'Dentro da meta')
  : status === 'exceeded'
    ? 'Acima da meta'
    : (hasEvents ? 'Em andamento' : 'Sem registros');
// Ao final de selectCalendarDate:
grid.querySelector(`button[data-date-key="${dateKey}"]`)?.focus();
// 2. Adicionar aria-live="polite" no título do mês ou região de status ao trocar mês/selecionar dia,
// e usar <abbr title="Domingo">D</abbr> (ou tabela semântica <table>/<th scope="col" abbr="Domingo">D</th>).
```

---

### Severidade ALTA

#### 8. [Carrossel Principal — Minijogos] Cards dos minijogos usam `<div role="button" tabindex="0">` sem ativação por `Enter` ou `Space`
- **Arquivo / Linha / Elemento**: [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L342-L383) (`#btn-game-memory`, `#btn-game-sequence`, `#btn-game-math`, `#btn-game-reflex`) e [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L8419-L8426)
- **Critério WCAG / Padrão**: WCAG 2.2 **2.1.1** (Teclado — A), **4.1.2** (Nome, Função, Valor — A); WAI-ARIA APG *Button Pattern*.
- **Evidência**: Os 4 cards são `<div>` com `role="button"` e `tabindex="0"`, mas recebem apenas `addEventListener('click', ...)` sem handler `keydown` para `Enter`/`Space`.
- **Quem é afetado**: Usuários de teclado e acionadores (conseguem focar o card, mas não conseguem iniciar nenhum minijogo).
- **Correção recomendada**: Trocar `<div class="game-grid-card" role="button" tabindex="0">` por `<button type="button" class="game-grid-card">` (que já garante ativação nativa por `Enter` e `Space`), removendo `role` e `tabindex` manuais.

#### 9. [Carrossel Principal] Sobreposição das áreas de toque nos indicadores `.wl-pager-dot` (WCAG 2.2 — Tamanho do Alvo)
- **Arquivo / Linha / Elemento**: [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L7858-L7887) (`.wl-pager-nav-dots` com `gap: 6px`; `.wl-pager-dot` de `6px` com `::before` de `44×44px`)
- **Critério WCAG / Padrão**: WCAG 2.2 **2.5.8** (Tamanho do Alvo (Mínimo) — AA).
- **Evidência**: Os três pontos visuais de `6px`/`18px` ficam separados por apenas `6px`, mas cada um projeta um `::before` de `44×44px` centralizado. Como o espaçamento entre centros é ~12–18px, as zonas de toque de `44px` sobrepõem umas às outras, fazendo com que toques no ponto central/esquerdo possam disparar o ponto vizinho.
- **Quem é afetado**: Pessoas com deficiência motora, tremores ou dedos largos em telas sensíveis ao toque.
- **Correção recomendada**:
```css
.wl-pager-nav-dots { gap: 12px; padding: 2px 6px; }
.wl-pager-dot {
  min-width: 24px; /* ou 44px para aderir ao DESIGN_SYSTEM.md */
  min-height: 24px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.wl-pager-dot::before { content: none; }
.wl-pager-dot::after {
  content: '';
  width: 8px; height: 8px; border-radius: 999px; background-color: #64748B;
}
.wl-pager-dot.active::after { width: 20px; background-color: #1E293B; }
```

#### 10. [Carrossel Principal] Contraste não-textual insuficiente nos indicadores `.wl-pager-dot` (especialmente ativo no Tema Escuro ≈ 1,27:1)
- **Arquivo / Linha / Elemento**: [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L7868-L7896)
- **Critério WCAG / Padrão**: WCAG 2.2 **1.4.11** (Contraste Não-Textual — AA, mínimo 3,0:1).
- **Evidência**: `.wl-pager-dot` inativo usa `#D1D5DB` sobre fundo claro (~1,37:1); `.wl-pager-dot.active` usa `#1E293B` sem override para `.dark-theme`, gerando **~1,27:1** sobre `#121214` (o ponto ativo desaparece no modo escuro).
- **Quem é afetado**: Usuários com baixa visão e usuários do modo escuro.
- **Correção recomendada**: Usar `#64748B` (inativo, ≥ 4,5:1 no claro) e `#1E293B` (ativo no claro); em `.device-screen.dark-theme`, usar `#9CA3AF` (inativo, ~7,1:1) e `#F3F4F6` (ativo, ~17,2:1).

#### 11. [Registro de Cigarros — Home, Painel Rápido e Tela 11] Múltiplas falhas de contraste de texto (1,66:1 a 3,88:1)
- **Arquivo / Linha / Elemento**:
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L4701-L4704): `.wl-home-sub-stat strong` (`#5FB149` em 14px sobre `#FAFAF7` ≈ **2,57:1** — mínimo 4,5:1).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5739-L5743): `.wl-qreg-date` (`#5FB149` em 12px sobre `#FFFFFF` ≈ **2,67:1** — mínimo 4,5:1).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5859-L5862): `.wl-qreg-action-btn.green.is-confirmed` (`#FFFFFF` sobre `#6CCB4F` em 13px ≈ **2,04:1** — mínimo 4,5:1).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L6006-L6017): `.wl-qreg-save-mood-btn` (`#FFFFFF` sobre `#6CCB4F` em 12px ≈ **2,04:1** — mínimo 4,5:1).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L1203-L1205) e [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L164-L170) (Tela 11 `.quick-register-grid`): `.btn-quick-choice.urge` (`#FFFFFF` sobre `#FBC016` ≈ **1,66:1**), `.btn-quick-choice.no-smoke` (`#FFFFFF` sobre `#5FB149` ≈ **2,67:1**), `.btn-quick-choice.smoke` (`#FFFFFF` sobre `#E9463E` em 17px ≈ **3,88:1**).
- **Critério WCAG / Padrão**: WCAG 2.2 **1.4.3** (Contraste Mínimo — AA); eMAG Rec. 4.2.
- **Quem é afetado**: Pessoas com baixa visão, presbiopia, daltonismo e leitura em ambiente externo.
- **Correção recomendada**:
```css
/* Substituir #5FB149 em texto claro por var(--primary-dark) (#2E7D32 = 5,1:1 sobre #FFFFFF; no dark: #A8E67A) */
.wl-home-sub-stat strong,
.wl-qreg-date { color: var(--primary-dark); }

/* Em botões preenchidos com verde claro (#6CCB4F), usar texto escuro #111827 (contraste ~9,4:1) ou fundo #2E7D32 com texto #FFFFFF (5,1:1) */
.wl-qreg-action-btn.green.is-confirmed,
.wl-qreg-save-mood-btn { background-color: #2E7D32; color: #FFFFFF; }

/* Na .quick-register-grid (caso mantida no código): usar #111827 sobre #FBC016 (~11,9:1), #2E7D32/#C53030 com #FFFFFF */
.btn-quick-choice.urge { background-color: #FBC016; color: #111827 !important; }
.btn-quick-choice.no-smoke { background-color: #2E7D32; }
.btn-quick-choice.smoke { background-color: #C53030; }
```

#### 12. [Calendário] Contraste insuficiente no resumo mensal, nos dias fora do mês (clicáveis) e na legenda/barra de meta
- **Arquivo / Linha / Elemento**:
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5259-L5265): `.wl-cal-metric-box strong` (`#5FB149` em 22px bold sobre `#FFFFFF` ≈ **2,67:1** — falha até mesmo o limite 3,0:1 de texto grande!).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5183-L5188): `.calendar-grid-circle.state-outside` (`#64748B` com `opacity: 0.65` sobre `#FFFFFF` ≈ **2,48:1** em botões *ativos* clicáveis!).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5234-L5236): pontos da legenda `.dot.green` (`#6CCB4F` ≈ 2,04:1) e `.dot.neutral` (`#D1D5DB` ≈ 1,48:1), além de divergirem das cores reais da grade (`#2E7D32` e `#C53030`).
- **Critério WCAG / Padrão**: WCAG 2.2 **1.4.3** (Contraste Mínimo — AA) e **1.4.11** (Contraste Não-Textual — AA).
- **Quem é afetado**: Pessoas com baixa visão e daltonismo.
- **Correção recomendada**:
```css
.wl-cal-metric-box strong { color: var(--primary-dark); } /* #2E7D32 no claro (5,1:1), #A8E67A no escuro */
.calendar-grid-circle.state-outside { color: #526071; opacity: 1; } /* ~6,3:1 sobre #FFFFFF */
.wl-cal-legend-item .dot.green { background-color: #2E7D32; }
.wl-cal-legend-item .dot.pink { background-color: #C53030; }
.wl-cal-legend-item .dot.neutral { background-color: #F3F4F6; border: 1.5px solid #64748B; }
```

#### 13. [Registro de Cigarros — Painel Rápido & Tela 11] Botão de fechar sem semântica, `<input>` sem rótulo e botões de alternância sem `aria-pressed`
- **Arquivo / Linha / Elemento**:
  - [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L408): fechar Tela 11 usa `<div onclick="handleBackFromScreen(11)">` sem `button`/teclado/`aria-label`.
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5550): `<input type="text" id="wl-qreg-mood-note" placeholder="Nota opcional...">` sem `<label>` nem `aria-label`.
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5519-L5548) e [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5830-L5843): botões `.wl-qreg-mood-pill`, `.wl-qreg-tag` e `#home-nosmoke-badge` / `#wl-qreg-btn-confirm-day` não expõem `aria-pressed="true|false"`; além disso, os `<img alt="Feliz">` dentro de `.wl-qreg-mood-pill` duplicam o texto `<span>Feliz</span>` na leitura.
- **Critério WCAG / Padrão**: WCAG 2.2 **2.1.1** (Teclado — A), **3.3.2** (Rótulos ou Instruções — A), **1.3.1** (Informações e Relações — A), **4.1.2** (Nome, Função, Valor — A).
- **Quem é afetado**: Usuários de leitores de tela, teclado e pessoas com deficiência cognitiva.
- **Correção recomendada**:
```html
<!-- Em #wl-quick-register-modal -->
<button type="button" class="wl-qreg-mood-pill" data-mood="Feliz" aria-pressed="false" onclick="selectQuickMood('Feliz')">
  <img src="..." alt="" aria-hidden="true" class="wl-qreg-mood-img">
  <span>Feliz</span>
</button>
...
<label for="wl-qreg-mood-note" class="sr-only">Nota opcional sobre seu humor</label>
<input type="text" id="wl-qreg-mood-note" class="wl-qreg-note-input" placeholder="Nota opcional...">
```
E atualizar `btn.setAttribute('aria-pressed', String(isSelected))` em `selectQuickMood`, no clique das `.wl-qreg-tag` e nos botões "Não fumei hoje".

#### 14. [Calendário] Alvos abaixo do mínimo (`.wl-cal-today-chip`), botões "Editar"/"Remover" genéricos e controle expansível sem `aria-expanded` / `aria-controls`
- **Arquivo / Linha / Elemento**:
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5020-L5032): `.wl-cal-today-chip` (`padding: 4px 10px; font-size: 11px;` → altura estimada **~20–22px**, abaixo de 24×24px da WCAG 2.5.8 AA).
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L7531-L7539) e [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5495-L5523): botões `.wl-cal-ev-btn` ("Editar" / "Remover") repetem o mesmo nome acessível em todos os itens sem identificar o evento, têm altura compacta (~24–26px com `gap: 5px`, bem abaixo dos 44px do Design System) e "Remover" executa exclusão imediata sem confirmação ou desfazer.
  - [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L7569-L7591): `#wl-cal-toggle-events-btn` ("Ver outros X registros") não declara `aria-expanded` nem `aria-controls="wl-cal-more-events"`.
- **Critério WCAG / Padrão**: WCAG 2.2 **2.5.8** (Tamanho do Alvo Mínimo — AA), **4.1.2** (Nome, Função, Valor — A), **2.4.6** (Cabeçalhos e Rótulos — AA).
- **Quem é afetado**: Usuários de leitores de tela e pessoas com comprometimento motor.
- **Correção recomendada**:
```javascript
// Em createEventRowEl(ev):
aria-label="Editar ${ev.title} às ${subText}"
aria-label="Remover ${ev.title} às ${subText}"

// Em toggleBtn (#wl-cal-toggle-events-btn):
toggleBtn.setAttribute('aria-expanded', String(isExpanded));
toggleBtn.setAttribute('aria-controls', 'wl-cal-more-events');
// e atualizar aria-expanded dentro de toggleBtn.onclick
```
E garantir `min-height: 44px; min-width: 44px;` (ou no mínimo `>= 36–44px` com espaçamento seguro) em `.wl-cal-today-chip`, `.wl-cal-ev-btn`, `.wl-cal-nav-arrow` (`40px` hoje) e `.wl-close-circle` (`40px` hoje).

---

### Severidade MÉDIA

#### 15. [Todas as 3 funcionalidades] `<html lang>` fixo em `pt-BR` e `aria-label`s não traduzidos em EN/ES
- **Arquivo / Linha / Elemento**: [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L2), [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L216-L233), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L1470-L1879), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L4954-L4964), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5090-L5101), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L7337-L7386)
- **Critério WCAG / Padrão**: WCAG 2.2 **3.1.1** (Idioma da Página — A) e **3.1.2** (Idioma das Partes — AA).
- **Evidência**: `applyAppLanguage()` nunca altera `document.documentElement.lang` (mantém `pt-BR` mesmo em `EN`/`ES`) e não traduz os `aria-label` da topbar do carrossel, dos pager dots, do botão SOS/Registrar cigarro na Home, das setas/fechar do Calendário e das datas geradas em `generateCalendar()`.
- **Quem é afetado**: Usuários de leitores de tela que usam o Habbi em Inglês ou Espanhol (pronúncia incorreta pelo sintetizador e rótulos em português misturados à interface).
- **Correção recomendada**:
```javascript
// No início de applyAppLanguage(langKey):
const langTagMap = { PT: 'pt-BR', EN: 'en', ES: 'es' };
document.documentElement.lang = langTagMap[lang] || 'pt-BR';
// E mapear os aria-label correspondentes no dicionário HABBI_I18N.
```

#### 16. [Carrossel Principal & Registro de Cigarros] Suporte incompleto a `prefers-reduced-motion: reduce`
- **Arquivo / Linha / Elemento**:
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L10033), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L3991) (`track.style.transition = smooth ? 'transform 0.28s ...' : 'none'` inline ignora preferência do SO).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L7799-L7855) (`.slide-in-*` / `.slide-out-*`).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L4722), [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L4802-L4810) (`.wl-home-add-btn.is-pressed`), [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L6059-L6250) (animações amplas de zoom/rotação/explosão do modal `#wl-celebration-modal`).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L10388-L10392) cobre apenas `.wl-home-remove-btn.is-pressed`.
- **Critério WCAG / Padrão**: WCAG 2.2 **2.3.3** (Animação a partir de Interações — AAA; diretriz explícita do projeto em [AGENTS.md](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/AGENTS.md#L127-L132)).
- **Quem é afetado**: Pessoas com transtornos vestibulares, vertigem ou enxaqueca desencadeada por movimento.
- **Correção recomendada**: Verificar `const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;` em `goToCarouselSlide` (passando `transition: 'none'`) e cobrir `.main-carousel-track`, `.wl-home-cig-png-fill`, `.wl-home-add-btn.is-pressed` e `#wl-celebration-modal *` sob `@media (prefers-reduced-motion: reduce)`.

#### 17. [Registro de Cigarros — Painel Rápido] Alvos de toque abaixo do padrão 44×44px (e tags `.wl-qreg-tag` no limite de 24px)
- **Arquivo / Linha / Elemento**:
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5948-L5958): `.wl-qreg-tag` (`padding: 4px 8px; font-size: 11px;` → altura estimada ~23–25px, no limiar de falha da WCAG 2.5.8 AA).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5797-L5831): `.wl-qreg-step-btn` (`42px`).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5993-L6017): `.wl-qreg-note-input` e `.wl-qreg-save-mood-btn` (`height: 38px`).
- **Critério WCAG / Padrão**: WCAG 2.2 **2.5.8** (Tamanho do Alvo Mínimo — AA) e **2.5.5** (AAA / meta 44×44px do projeto).
- **Quem é afetado**: Usuários com dificuldades motoras ou uso móvel com uma mão.
- **Correção recomendada**: Elevar `.wl-qreg-tag`, `.wl-qreg-step-btn`, `.wl-qreg-note-input` e `.wl-qreg-save-mood-btn` para `min-height: 44px` (e `min-width: 44px` no botão `−`).

#### 18. [Carrossel Principal] Nome acessível ambíguo na pílula de economia e ausência de landmarks semânticos no cabeçalho fixo
- **Arquivo / Linha / Elemento**: [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L214-L227) (`.main-carousel-fixed-header`, `.wl-home-savings-pill`)
- **Critério WCAG / Padrão**: WCAG 2.2 **2.4.6** (Cabeçalhos e Rótulos — AA), **1.3.1** (Informações e Relações — A).
- **Evidência**: `.wl-home-savings-pill` usa apenas `title="Ver sua conquista"` (ignorado por leitores de tela móveis), sendo anunciado apenas como `"R$ 0,00, botão"`. O cabeçalho fixo usa `<div>` em vez de `<header>` e `<nav aria-label="...">`.
- **Quem é afetado**: Usuários de leitores de tela.
- **Correção recomendada**: Usar `<header class="main-carousel-fixed-header">` + `<nav aria-label="Acesso rápido">` e adicionar `aria-label` dinâmico na pílula (ex.: `"Economia estimada: R$ 0,00. Abrir Minha conquista"`).

#### 19. [Todas as 3 funcionalidades] Restrições de reflow/redimensionamento de texto (fontes em `px`, `overflow: hidden`, truncamento e ocultação global de scrollbars)
- **Arquivo / Linha / Elemento**:
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L216-L233) (`body { height: 100vh; overflow: hidden; }` e supressão global de scrollbars).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L335-L346) (`.device-container { max-height: 860px; }`).
  - [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L5471-L5479) (`.wl-cal-event-subdesc` com `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`).
- **Critério WCAG / Padrão**: WCAG 2.2 **1.4.4** (Redimensionar Texto — AA) e **1.4.10** (Reflow — AA).
- **Quem é afetado**: Usuários com baixa visão que aumentam o tamanho de fonte do sistema/navegador (até 200%) ou navegam em telas pequenas/paisagem.
- **Correção recomendada**: Migrar gradualmente tipografia de `px` para `rem`, permitir quebra de linha em `.wl-cal-event-subdesc` (`white-space: normal; overflow-wrap: anywhere;`) e evitar `overflow: hidden !important` em contêineres com conteúdo dinâmico.

---

### Severidade BAIXA

#### 20. [Home, Calendário e Carrossel] Ausência de `<h1>` nas telas auditadas e SVGs/pontos decorativos sem `aria-hidden="true"`
- **Arquivo / Linha / Elemento**:
  - Home injetada em [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L4886-L4970) (nenhum `<h1>` ou `<h2>`); Calendário ([index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L672) / [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5094)), Conquista ([index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L243)) e Minijogos ([index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L322)) começam diretamente em `<h2>`.
  - Ícones `<svg>` e marcadores `<i class="dot">` em [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L217-L225), [index.html](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/index.html#L669-L723), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L4895-L4966), [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L5491-L5495) e [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L7521-L7537) sem `aria-hidden="true" focusable="false"`.
- **Critério WCAG / Padrão**: WCAG 2.2 **1.3.1** (Informações e Relações — A), **2.4.6** (Cabeçalhos e Rótulos — AA); eMAG Rec. 1.3.
- **Quem é afetado**: Usuários de leitores de tela que navegam por hierarquia de títulos.
- **Correção recomendada**: Inserir um `<h1>` (visível ou `.sr-only` na Home, ex.: `<h1 class="sr-only">Início — Registro diário</h1>`, e promover `#wl-cal-month-title`, `.wl-sav-title` e `.wl-minijogos-title` para `<h1>` quando a respectiva tela estiver ativa) e adicionar `aria-hidden="true" focusable="false"` a todos os SVGs e `<i class="dot">` puramente decorativos.

---

## (b) Hipóteses / Riscos que Dependem de Teste em Dispositivo e Leitor de Tela Real (Precisa de Teste Manual)

1. **Conflito entre gesto horizontal do carrossel e leitores de tela móveis (VoiceOver iOS / TalkBack Android)**
   - **Onde**: [app.js](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/app.js#L8915-L9061) (`touchstart`/`touchmove` com `e.preventDefault()` em `#main-carousel-viewport`) e [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L10024) (`touch-action: pan-y`).
   - **Risco**: No TalkBack e VoiceOver, o gesto de varredura horizontal com 1 dedo é usado pelo leitor de tela para mover o cursor de leitura para o próximo elemento. Precisa ser validado em aparelho físico se `touchmove` com `{ passive: false }` intercepta ou gera conflito com a navegação por varredura e se a troca de slide via dots (`tablist`) funciona sem travar o foco do leitor.
2. **Contraste computado efetivo de filtros SVG e fundos semitransparentes no Tema Escuro e em Modo Alto Contraste (`forced-colors`)**
   - **Onde**: filtros `feFlood` do cigarro (`app.js:4903-4922`), fundos `rgba(...)` no tema escuro (`.wl-home-sos-pill`, `.wl-cal-event-row`, `.wl-cal-goal-pill`, `.wl-home-nosmoke-badge`) e `.wl-cig-png-base` com `opacity: 0.55`.
   - **Risco**: Como a cor final depende da renderização da imagem PNG + filtro SVG + composição alfa sobre `#121214`/`#1E1E24`, é necessário medir o contraste computado em runtime (DevTools / Color Contrast Analyzer) e testar em Windows High Contrast (`forced-colors: active`), onde ícones e bordas podem sumir.
3. **Reflow e sobreposição real em 320px × 568px e com zoom de 200% / fonte do sistema em 200%**
   - **Onde**: Grade 7 colunas do Calendário (`style.css:5081-5133`), linha de ações de evento `.wl-cal-event-row` (título + hora + 2 botões lado a lado em `320px`), grade de 5 humores `.wl-qreg-mood-row` (`grid-template-columns: repeat(5, 1fr)` em `320px`), e Home sob `max-height: 640px`.
   - **Risco**: Em 320px com ampliação de texto de 200% (WCAG 1.4.4 / 1.4.10), há risco real de corte de texto, colapso dos 5 botões de humor ou sobreposição entre os botões "Editar"/"Remover" e o horário do registro.
4. **Visibilidade real do anel `:focus-visible` sob `overflow: hidden`**
   - **Onde**: [style.css](file:///C:/Users/alice/OneDrive/Documentos/GitHub/HABBI/style.css#L1027-L1048) (`outline-offset: 2px`) combinado com `overflow: hidden` em `.main-carousel-viewport`, `.wl-home-cig-stage` e `.wl-cal-goal-bar-track`.
   - **Risco**: O anel de foco pode ser recortado nas bordas superiores/inferiores ou laterais dos contêineres (WCAG 2.4.7 / 2.4.11). Exige inspeção visual navegando integralmente com `Tab`/`Shift+Tab`.
5. **Leitura de emojis, caracteres especiais (`✓`, `−`, `✕`, `•`) e datas em NVDA, JAWS, VoiceOver e TalkBack**
   - **Onde**: `Não fumei hoje ✓`, botão `✕` (com `aria-label="Fechar"`), `0 / 11 hoje` e `0/11 cigarros • +2 acima da meta`.
   - **Risco**: Alguns sintetizadores leem `"barra"` ou `"sinal de verificação"` de forma verbosa ou confusa; a validação ideal requer teste com pessoas cegas usuárias habituais de NVDA (Windows), VoiceOver (iOS) e TalkBack (Android).
6. **Acessibilidade cognitiva/motora em momentos de fissura (foco de validação com usuários reais)**
   - **Risco**: Verificar com pessoas com deficiência motora e cognitiva se o fluxo de desfazer um registro acidental (`−` na Home e remoção no Calendário) e a distinção entre `+ Registrar cigarro` e `SOS` funcionam sob estresse. *(Nota de escopo: aspectos de ergonomia de toque acidental entre SOS e Registro, clareza de copy e conveniência do fluxo sem confirmação pertencem à `especialista-usabilidade` e `especialista-ux`, para quem encaminhamos esses pontos.)*

---

## (c) Recomendações Priorizadas (Plano de Ação para `dev-fullstack-senior`)

1. **Prioridade 1 — Desbloqueio estrutural de teclado e leitores de tela (barreiras críticas)**:
   - Aplicar `inert` e `aria-hidden` nos slides inativos do carrossel principal (`goToCarouselSlide` + `tools-mode`).
   - Corrigir o padrão `tablist`/`tab`/`tabpanel` nos `.wl-pager-dot` (incluindo `aria-selected`, `roving tabindex`, setas e remoção do `aria-label` congelado).
   - Transformar `#home-cig-meter` em `<button type="button">` com rótulo dinâmico (ou remover o `onclick` e torná-lo decorativo se a ação ficar só no CTA principal).
   - Implementar padrão WAI-ARIA Dialog completo em `#wl-quick-register-modal` (e demais modais): `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, armadilha de foco, `Escape` e restauração de foco.
   - Criar região `aria-live="polite"` (`role="status"`) para anunciar registros/remoções de cigarros, mudança de mês e seleção de dia; impedir perda de foco ao desabilitar `−` e ao clicar em dias do Calendário (restaurando o foco no botão da data após re-render).
   - Corrigir o falso `"Sem registros"` do dia atual em andamento no `aria-label` do Calendário e remover o inline `metaReg.style.color = '#4A0E17'` (substituindo por classes com contraste ≥ 4,5:1 + indicador textual de meta ultrapassada).
2. **Prioridade 2 — Contraste AA, alvos de toque e semântica de controles (barreiras altas)**:
   - Trocar `#5FB149` em textos sobre claro por `var(--primary-dark)` (`#2E7D32`), corrigir texto branco sobre `#6CCB4F` / `#FBC016` / `#E9463E`, aumentar contraste de `.state-outside` no Calendário e dar contraste ≥ 3:1 aos `.wl-pager-dot` em ambos os temas.
   - Eliminar sobreposição dos `::before` de 44px nos `.wl-pager-dot` e ajustar `.wl-cal-today-chip`, `.wl-qreg-tag`, `.wl-cal-ev-btn`, `.wl-cal-nav-arrow` e `.wl-close-circle` para respeitar WCAG 2.5.8 AA e a meta de 44×44px do Design System.
   - Converter os 4 cards de Minijogos e o botão fechar da Tela 11 em `<button type="button">`; adicionar `<label>` ao input de nota, `aria-pressed` aos toggles de humor/influência/"Não fumei hoje", `aria-expanded`/`aria-controls` no expansor do Calendário e `aria-label` contextual nos botões "Editar"/"Remover".
3. **Prioridade 3 — Idioma, movimento reduzido, reflow e semântica complementar (médias/baixas)**:
   - Sincronizar `document.documentElement.lang` e todos os `aria-label` no `HABBI_I18N` (PT/EN/ES).
   - Estender `prefers-reduced-motion: reduce` ao `goToCarouselSlide`, medidor, botão `+` e modal de celebração.
   - Revisar landmarks (`<header>`, `<nav>`), hierarquia de `<h1>`, `aria-hidden="true"` em SVGs decorativos e reflow em 320px / zoom 200%.

### Encaminhamentos Fora do Foco de Acessibilidade
- **Para `especialista-usabilidade`**: avaliar a proximidade vertical (`gap: 10px`) entre `#btn-home-sos` e a linha `−` / `+ Registrar cigarro` sob risco de toque acidental, a ausência de confirmação ou desfazer ao clicar em `"Remover"` no Calendário, e a visibilidade da instrução de que o medidor central do cigarro também é clicável.
- **Para `especialista-ux`**: avaliar a coerência da jornada entre os dois pontos de entrada de registro (Home 1-toque vs. Painel Rápido no Calendário vs. Tela 11 legada ainda presente no HTML).

---

## Limitações desta Análise
1. **Inspeção estática apenas**: não foram executados axe-core, Lighthouse ou navegador headless sobre a aplicação em execução (modo estritamente somente leitura).
2. **Sem teste em tecnologias assistivas reais**: o comportamento efetivo em NVDA, JAWS, VoiceOver (iOS/macOS) e TalkBack (Android), bem como o conflito de gestos touch do carrossel com leitores de tela móveis, não pôde ser verificado empiricamente.
3. **Medições computadas em runtime não executadas**: contrastes de camadas PNG com filtros SVG (`feFlood`) + transparência via Canvas, dimensões reais renderizadas em viewports de 320px/390px/430px sob zoom de 200% e eventual recorte do anel `:focus-visible` exigem verificação em dispositivo/navegador real.
4. **Sem testes com pessoas com deficiência**: barreiras práticas de compreensão, esforço motor e sobrecarga cognitiva em situação real de fissura só podem ser confirmadas em testes participativos com usuários com deficiência.
5. **Escopo restrito**: apenas Calendário (`16`), Registro de cigarros (`10`, `openRegisterSheet`, `11`) e Carrossel principal (`#main-carousel-container`) foram auditados; as demais 26 telas do aplicativo permanecem fora desta avaliação.
