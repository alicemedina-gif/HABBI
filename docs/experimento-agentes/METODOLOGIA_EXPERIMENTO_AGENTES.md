# Metodologia do Experimento de Engenharia de Prompts e Agentes Especializados no Projeto Habbi

**Curso:** Desenho Industrial — Universidade Federal de Santa Maria (UFSM)  
**Disciplina / Contexto:** Laboratório de Interfaces — Projeto **Habbi** (Intervenção Comportamental Empática para Redução e Cessação do Tabagismo)  
**Branch do Experimento:** `docs/experimento-agentes` (baseada na versão estável `main` `bff8ef0`, sem interferir na branch `feat/supabase-integration` nem alterar o aplicativo em produção)  
**Data da Execução:** 18 de novembro de 2026

---

## 1. Introdução e Objetivo Acadêmico

O desenvolvimento contemporâneo de interfaces digitais frequentemente recorre a modelos de linguagem (LLMs) de forma genérica ("avalie meu app e sugira melhorias"). Embora rápido, esse uso indiferenciado tende a produzir respostas superficiais, misturar opiniões subjetivas com defeitos objetivos, ignorar requisitos normativos (como WCAG 2.2 AA) e induzir viés de confirmação.

Este experimento investiga **o papel da engenharia de prompts na especialização de agentes de IA** aplicados ao mesmo artefato real de software: o aplicativo **Habbi**. Incorporamos sete prompts especializados fornecidos pela docente da disciplina — cobrindo UX, Usabilidade, Acessibilidade, Revisão Crítica, Análise de Dados, Ciência de Dados e Desenvolvimento Full Stack — preservando integralmente suas instruções originais, organizando-os de modo compatível com ferramentas reais de engenharia de software e executando um ciclo controlado de avaliação sobre três funcionalidades críticas do Habbi:

1. **Calendário** (`data-screen="16"` — visualização mensal, seleção de dias, resumo e edição/remoção de eventos);
2. **Registro de Cigarros** (`data-screen="10"` — Home com medidor interativo, `+ Registrar cigarro`, `−` desfazer, `SOS` e fluxo de registro rápido);
3. **Carrossel Principal** (`#main-carousel-container` — cabeçalho fixo, indicadores de página, gestos horizontais entre Conquista `29` ↔ Início `10` ↔ Minijogos `15` e alternância com `tools-mode`).

---

## 2. O Papel da Engenharia de Prompts no Experimento

No experimento, o modelo subjacente (`Claude Opus 4.6 (Thinking)`), o código-fonte analisado (`index.html`, `app.js`, `style.css`), a documentação de contexto (`DESIGN_SYSTEM.md`, `AGENTS.md`) e o escopo funcional foram mantidos **estritamente constantes** entre as execuções. A **única variável independente manipulada** entre os agentes das Etapas 1 a 3 foi o **prompt de sistema (`SystemPrompt`)** — acrescido, na Etapa 4, dos relatórios produzidos pelas etapas anteriores.

A análise dos sete prompts fornecidos evidencia **cinco mecanismos concretos de engenharia de prompts** que explicam por que o mesmo modelo produz análises radicalmente diferentes conforme a instrução recebida:

### 2.1. Enquadramento de Persona e Lente Teórica Explícita
Cada prompt ancora o modelo em referenciais teóricos distintos:
- `especialista-ux` ativa lentes de **jornada do usuário, modelo mental, proposta de valor e contexto emocional**;
- `especialista-usabilidade` ativa **ISO 9241-11 (eficácia, eficiência, satisfação) e as heurísticas de Nielsen com escala 0–4**;
- `especialista-acessibilidade` ativa **WCAG 2.2 níveis A/AA, WAI-ARIA Authoring Practices Guide, eMAG e LBI (Lei nº 13.146/2015)**;
- `critico` ativa **postura adversarial independente** orientada a refutação, casos de borda, segurança, privacidade e ética.

Sem essa ancoragem teórica, um prompt genérico raramente calcularia razões de contraste luminoso exatas (`1,22:1`), aplicaria uma escala de severidade consistente ou procuraria vulnerabilidades de Stored XSS em notas de humor.

### 2.2. Delimitação Negativa de Escopo ("Fora do seu foco")
Os prompts originais definem explicitamente **o que o agente NÃO deve fazer** e para qual outro agente deve encaminhar achados fronteiriços. Na prática do experimento, isso produziu um efeito mensurável de disciplina epistêmica:
- `especialista-ux` registrou achados de alvos `< 44 px` e atributos ARIA em uma seção dedicada *"Encaminhamentos fora do foco de UX"*, sem desviar seu relatório principal da jornada emocional;
- `especialista-usabilidade` encaminhou conformidade WCAG para Acessibilidade e a ausência da mascote Morgana para UX;
- `especialista-acessibilidade` encaminhou a ergonomia de toque acidental entre SOS e Registro para Usabilidade e a fragmentação da jornada para UX.

A delimitação negativa reduz a diluição de atenção do modelo: ao liberar o agente de tentar cobrir tudo, permite-lhe aprofundar a sua especialidade.

### 2.3. Regras Epistemológicas (Evidência vs. Hipótese vs. Recomendação)
Todos os prompts exigem honestidade analítica: citar evidências verificáveis, declarar premissas, distinguir o que foi comprovado do que exige teste com pessoas ou dispositivos reais e nunca atestar conformidade total apenas por leitura de código. Esse mecanismo evitou afirmações infundadas (como declarar que o cigarro na Home "causa recaída" — corretamente classificado como **hipótese** de *cue reactivity* dependente de estudo empírico).

### 2.4. Estruturação Obrigatória de Saída
Exigir formatos estruturados diferentes (ex.: tabela impacto × esforço + perguntas de pesquisa em UX; escala 0–4 + 3 tarefas de teste em Usabilidade; critério WCAG + código de correção em Acessibilidade; Veredito + Bloqueantes + Importantes + Pontos a Verificar + O que está sólido no Crítico) torna os relatórios **comparáveis, auditáveis e acionáveis** para tomada de decisão humana.

### 2.5. Princípio do Menor Privilégio Imposto pela Plataforma (Prompt + Restrição Técnica)
Uma lição central de engenharia de agentes é que **uma instrução textual ("não edite código") não substitui uma restrição técnica real**. Neste experimento, os quatro agentes avaliadores foram executados com `EnableWriteTools: false`, `EnableMCPTools: false` e `EnableSubagentTools: false`, garantindo deterministicamente que nenhum agente pudesse alterar `index.html`, `app.js`, `style.css` ou `DESIGN_SYSTEM.md` durante a auditoria.

---

## 3. Arquitetura de Agentes e Compatibilidade Real entre Ferramentas

Um erro comum em projetos com IA é assumir que salvar arquivos `.md` em uma pasta do repositório faz com que eles sejam executados automaticamente. Como parte da metodologia, auditamos a compatibilidade real de formato em três plataformas sem alterar uma única palavra do corpo original dos prompts (preservados com verificação de hash SHA-256 em `docs/experimento-agentes/originais-professora/`):

| Camada no Repositório | Ferramenta-Alvo | Adaptação de Metadados | Execução Automática? |
| :--- | :--- | :--- | :--- |
| `docs/experimento-agentes/originais-professora/*.md` | Referência acadêmica (arquivo morto/fonte primária) | Nenhuma (100% idênticos aos originais) | Não |
| `.claude/agents/*.md` | **Claude Code** | Nenhuma (o schema da professora já é nativo do Claude Code) | Sim, quando executado no Claude Code |
| `.github/agents/*.agent.md` + `.github/copilot-instructions.md` | **GitHub Copilot** | Extensão `.agent.md`, `tools` convertido para array YAML (`["read", "search"]` ou `["read", "search", "edit", "execute"]`), `user-invocable: true` | Sim, no VS Code / Copilot Coding Agent |
| `.agents/skills/habbi-<nome>/SKILL.md` + `AGENTS.md` + `define_subagent` | **Antigravity** *(ferramenta efetivamente executada)* | Skill com `name: habbi-<nome>`, ponte de contexto para `DESIGN_SYSTEM.md`/`AGENTS.md`; execução isolada via `invoke_subagent` com `EnableWriteTools: false` | Sim (executado e verificado neste experimento) |

O detalhamento técnico completo de cada adaptação e a matriz dos 7 agentes constam em `docs/experimento-agentes/CATALOGO_AGENTES.md`.

---

## 4. Desenho Experimental e Fluxo de Trabalho

O protocolo seguiu o fluxo oficial documentado na Seção 11 de `AGENTS.md`:

```text
Etapa 1: especialista-ux              (contexto isolado, somente leitura)
Etapa 2: especialista-usabilidade     (contexto isolado, somente leitura)
Etapa 3: especialista-acessibilidade  (contexto isolado, somente leitura)
               ↓
Etapa 4: critico                      (lê relatórios 1–3 + código-fonte real, somente leitura)
               ↓
         [Portão de Decisão Humana]   (autora delibera sobre conflitos e prioridades)
               ↓
Etapa 5: dev-fullstack-senior         (não executada nesta fase — aguarda aprovação)
Etapa 6: Testes integrados            (não executada nesta fase — aguarda Etapa 5)
```

### Controle de Variáveis na Execução
- **Isolamento das Etapas 1–3:** UX, Usabilidade e Acessibilidade foram invocados em paralelo, sem acesso aos relatórios uns dos outros, para evitar contaminação de viés (*anchoring*).
- **Verificação Independente na Etapa 4:** O `critico` recebeu os três relatórios prontos **e** acesso direto aos arquivos originais (`index.html`, `app.js`, `style.css`, `DESIGN_SYSTEM.md`, `AGENTS.md`), permitindo validar matematicamente contrastes, caçar falsos positivos e detectar lacunas comuns aos três especialistas.
- **Imutabilidade do Produto:** Verificou-se via `git diff` que nenhum arquivo do aplicativo foi alterado durante o experimento.

---

## 5. Como a Especialização Influenciou a Análise do Mesmo Aplicativo

A comparação sistemática dos quatro relatórios (`00-resumo-fluxo-e-comparacao.md`) demonstrou empiricamente quatro efeitos da especialização por engenharia de prompts:

### 5.1. Convergência em Defeitos Sistêmicos (Validação Cruzada)
Problemas estruturais apareceram sob ângulos complementares em múltiplos agentes, aumentando a confiança no diagnóstico:
- O silenciamento de `showToast()` (`app.js:3034-3038`) foi lido pela **UX** como quebra de confiança e atrito para visitantes, pela **Usabilidade** como violação de *Visibilidade do status do sistema* (Sev. 3), e pela **Acessibilidade** como ausência de `role="status"` / `aria-live` (WCAG 4.1.3, Crítica).
- O estado `'neutral'` do dia atual em andamento (`app.js:2739-2740`) foi lido pela **UX** como ambiguidade de progresso, pela **Usabilidade** como inconsistência entre grade e card, e pela **Acessibilidade** como falso anúncio `"Sem registros (Hoje)"` para leitores de tela.

### 5.2. Descobertas Exclusivas por Lente Disciplinar
Cada especialista encontrou defeitos críticos invisíveis aos demais:
- Apenas **UX** problematizou o protagonismo do cigarro em contraste com a proposta empática da Morgana e a hipótese de *cue reactivity*.
- Apenas **Usabilidade** detectou o bug visual em `updateHomeScreen` (`app.js:6077-6101`) no qual o preenchimento do cigarro recua de `100%` para `50%` quando o consumo sobe de `+1` para `+2` acima da meta, além do apagamento de `' ✓'` por `applyAppLanguage()`.
- Apenas **Acessibilidade** detectou a ausência de `inert`/`aria-hidden` nos slides fora da tela do carrossel, a destruição de foco por `grid.innerHTML = ''` no Calendário, os cards de Minijogos sem ativação por teclado e as taxas numéricas exatas de contraste (`1,21:1` a `2,67:1`).

### 5.3. Emergência de Conflitos Reais Entre Disciplinas
O experimento expôs **dois conflitos diretos de especificação** entre agentes igualmente competentes:
1. **`#home-cig-meter` (cigarro central):** UX e Usabilidade recomendaram remover o `onclick` para impedir registros acidentais durante o swipe; Acessibilidade recomendou como Opção A transformá-lo em `<button>` mantendo o `onclick`.
2. **`.wl-pager-dot` (indicadores do carrossel):** UX e Usabilidade recomendaram abas rotuladas (`Conquista | Início | Minijogos`); Acessibilidade entregou snippet mantendo pontos de `8×8 px` sem texto e alvo mínimo de `24×24 px` (violando os `44×44 px` de `AGENTS.md`).

Sem um protocolo comparativo, um desenvolvedor (humano ou IA) que executasse os relatórios sequencialmente introduziria regressões em uma disciplina ao corrigir outra.

### 5.4. O Valor Decisivo da Etapa Adversarial (`critico`)
O agente `critico` elevou substancialmente o rigor do experimento em três frentes que **nenhum dos três primeiros agentes cobriu**:
1. **Corte de falsos positivos / código morto:** comprovou que `ensureCalTutorialDemoRow()` nunca é invocada pelo tutorial ativo e que `data-screen="11"` é inalcançável (evitando retrabalho inútil em CSS/HTML morto).
2. **Descoberta de riscos bloqueantes de segurança, privacidade e lógica de negócio:** Stored XSS via `innerHTML` em notas de humor e backups restaurados; bug comportamental invertido em `computeSavingsMetrics()` (a economia estimada sobe de `R$ 0,00` para `R$ 8,25` ao registrar o 1º cigarro fumado); furo de autenticação de visitantes em `saveQuickMood()`; e `handleProfileLogout()` apagando `localStorage` irreversivelmente sem aviso.
3. **Auditoria da própria documentação normativa:** demonstrou que `DESIGN_SYSTEM.md` contém afirmações desatualizadas sobre a implementação atual e que `AGENTS.md` contém uma autocontradição entre texto branco obrigatório em botão amarelo (`1,66:1`) e contraste mínimo `4,5:1`.

---

## 6. Metodologia para Comparar Resultados na Apresentação Acadêmica

Para apresentar e avaliar os resultados de forma replicável em sala de aula ou banca, recomenda-se organizar a comparação em **cinco indicadores qualitativos/quantitativos**:

1. **Cobertura por Categoria de Defeito:** classificar cada achado por domínio (Jornada/Emoção, Heurística/Interação, WCAG/ARIA, Segurança/Privacidade, Lógica de Negócio, i18n, Documentação) e contar quantos domínios cada agente cobriu — evidenciando a complementaridade.
2. **Taxa de Convergência (Validação Cruzada):** proporção de achados identificados por $\ge 2$ agentes independentes e confirmados no código.
3. **Taxa de Precisão / Falsos Positivos (Verificação pelo Crítico):** número de achados confirmados no código ativo vs. achados baseados em código morto ou premissas não verificadas.
4. **Índice de Conflitos Interdisciplinares:** quantidade de recomendações em que dois especialistas propõem soluções incompatíveis (demonstrando a necessidade de arbitragem humana).
5. **Rigor Epistêmico (Fatos vs. Hipóteses):** proporção de declarações corretamente rotuladas como evidência verificada no código vs. hipótese dependente de teste com usuários reais.

---

## 7. Limitações Metodológicas do Experimento

Para manter rigor científico na apresentação, as seguintes limitações devem ser declaradas explicitamente:

1. **Inspeção estática sem execução em runtime:** nenhum dos 4 agentes executou o aplicativo em navegador real, simulador móvel (`320×568`, `390×844`, `430×932`) ou leitor de tela real (NVDA, JAWS, VoiceOver, TalkBack). Questões de física de gestos touch, contraste computado após filtros SVG/Canvas e reflow real em zoom `200%` permanecem pendentes de verificação dinâmica.
2. **Ausência de validação empírica com usuários reais:** agentes de IA simulam lentes teóricas de UX/Usabilidade/Acessibilidade, mas **não substituem pessoas reais** em processo de redução ou cessação do tabagismo, nem pessoas com deficiência usando tecnologias assistivas no cotidiano.
3. **Homogeneidade do modelo subjacente (viés de modelo único):** os quatro agentes utilizaram o mesmo modelo base (`Claude Opus 4.6 (Thinking)`). Embora isso tenha sido metodologicamente vantajoso para **isolar o efeito puro da engenharia de prompts**, compartilhamento de modelo pode gerar pontos cegos comuns; experimentos futuros podem cruzar modelos distintos (ex.: Claude vs. Gemini vs. GPT) com os mesmos prompts.
4. **Amostragem de escopo:** apenas 3 funcionalidades centrais foram auditadas (Calendário, Registro de Cigarros e Carrossel Principal); as demais telas do Habbi (Onboarding, SOS detalhado, Perfil, Configurações, Autenticação) foram inspecionadas apenas nos pontos de interseção.
5. **Agentes de dados e desenvolvimento não executados nesta fase:** `analista-dados`, `cientista-dados` e `dev-fullstack-senior` foram organizados, preservados e preparados nas três plataformas, mas não foram executados por respeitar a restrição de não alterar código nem instrumentar dados nesta etapa.

---

## 8. Conclusão

O experimento comprova que **engenharia de prompts estruturada transforma um único LLM em um colegiado multidisciplinar complementar**, capaz de elevar drasticamente a profundidade técnica de auditorias de interface quando combinada a: (i) preservação fiel de personas e limites de foco, (ii) separação rigorosa entre evidência e hipótese, (iii) restrição real de ferramentas (somente leitura), (iv) revisão adversarial independente (`critico`) e (v) **decisão humana explícita** antes de qualquer alteração de código.

No contexto do **Habbi**, essa metodologia produziu um diagnóstico verificável, ético e diretamente acionável — evitando tanto a implementação precipitada de recomendações conflitantes quanto o retrabalho sobre código morto — e estabelece um protocolo replicável para futuras iterações do projeto na UFSM.
