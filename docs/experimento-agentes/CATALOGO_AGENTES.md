# Catálogo de Agentes Especializados — Experimento Habbi

Este catálogo documenta os **7 agentes especializados** fornecidos pela disciplina para o experimento de engenharia de prompts no projeto **Habbi** (Laboratório de Interfaces — Desenho Industrial, UFSM), suas funções, limites de atuação, compatibilidade real com ferramentas e todas as adaptações de metadados realizadas.

---

## 1. Preservação Integral dos Prompts Originais

Os 7 arquivos Markdown fornecidos pela professora foram preservados **integralmente (byte a byte)** em:

- `docs/experimento-agentes/originais-professora/`

| Arquivo Original | Nome do Agente | SHA-256 (prefixo 12 hex) | Preservação Integral |
| :--- | :--- | :--- | :--- |
| `especialista-ux.md` | `especialista-ux` | `8D2CBEF0A3AE` | Sim (100% idêntico) |
| `especialista-usabilidade.md` | `especialista-usabilidade` | `8949B5EA0295` | Sim (100% idêntico) |
| `especialista-acessibilidade.md` | `especialista-acessibilidade` | `B3F63D598F4B` | Sim (100% idêntico) |
| `critico.md` | `critico` | `278C4C038139` | Sim (100% idêntico) |
| `analista-dados.md` | `analista-dados` | `87A7F0C55C9B` | Sim (100% idêntico) |
| `cientista-dados.md` | `cientista-dados` | `F51F8268451E` | Sim (100% idêntico) |
| `dev-fullstack-senior.md` | `dev-fullstack-senior` | `F4A92DAF835C` | Sim (100% idêntico) |

---

## 2. Papel, Escopo e Permissões de Cada Agente

| Agente | Função Principal | Fora do Foco (Fronteira de Escopo) | Perfil de Ferramentas | Quando Acionar no Habbi |
| :--- | :--- | :--- | :--- | :--- |
| **`especialista-ux`** | Avaliar experiência do usuário de ponta a ponta: jornada, arquitetura de informação, carga cognitiva, fluxos e expectativas. | Não reescrever código de produção; não entrar em detalhe fino de WCAG (papel de Acessibilidade) nem em estatística/ML. | Somente leitura (`Read`, `Glob`, `Grep`, `WebFetch`, `WebSearch`) | Ao desenhar ou auditar jornadas (onboarding, registro diário, SOS, navegação em carrossel). |
| **`especialista-usabilidade`** | Inspecionar eficiência operacional, heurísticas de Nielsen, prevenção/recuperação de erros, affordances, consistência e clareza de rótulos/microcopy. | Não propor redirecionamento estratégico de produto; não substituir análise de acessibilidade WCAG profunda. | Somente leitura (`Read`, `Glob`, `Grep`, `WebFetch`, `WebSearch`) | Ao avaliar formulários, botões de registro/desfazer, calendário, feedbacks e redução de atrito. |
| **`especialista-acessibilidade`** | Auditar conformidade WCAG 2.2 (níveis A e AA), navegação por teclado, leitores de tela, semântica HTML/ARIA, contraste, foco e redução de movimento. | Não redesenhar jornada de produto ou estratégia comercial; focar em barreiras de acesso e critérios mensuráveis. | Somente leitura (`Read`, `Glob`, `Grep`, `WebFetch`, `WebSearch`) | Antes de qualquer release ou após alterações em tema claro/escuro, componentes interativos e gestos. |
| **`critico`** | Revisão adversarial independente: contestar premissas, encontrar contradições entre relatórios, apontar riscos de segurança, privacidade, ética e casos de borda. | Não corrigir código nem suavizar críticas; exigir evidência e separar fatos de suposições. | Somente leitura (`Read`, `Glob`, `Grep`, `WebFetch`, `WebSearch`) | Após as análises especializadas (ou antes de implementar uma proposta) para evitar pontos cegos e viés de confirmação. |
| **`analista-dados`** | Definir KPIs, métricas de produto, funis, consultas SQL/Python de análise exploratória e validação de qualidade de dados. | Não treinar modelos preditivos complexos (papel de Ciência de Dados) nem desenvolver UI. | Leitura + Escrita + Execução (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`) | Ao estruturar eventos do Habbi (retenção, adesão ao registro, eficácia do SOS, funil de metas). |
| **`cientista-dados`** | Modelagem estatística/ML, experimentos A/B com rigor inferencial, validação contra vazamento de dados e avaliação de vieses. | Não fazer dashboards descritivos simples (papel de Analista de Dados) nem UI. | Leitura + Escrita + Execução (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`) | Ao propor modelos de risco de recaída, personalização comportamental ou testes controlados de intervenção. |
| **`dev-fullstack-senior`** | Arquitetura, implementação limpa, integração frontend/backend, segurança e testes automatizados das mudanças aprovadas. | Não inventar escopo nem ignorar restrições de UX, usabilidade, acessibilidade ou revisão crítica. | Leitura + Escrita + Execução (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`) | Somente na etapa **5 (Implementação Aprovada)** do fluxo, após decisão humana sobre o que corrigir. |

---

## 3. Verificação de Compatibilidade Real por Ferramenta

Um ponto metodológico essencial deste experimento é **não presumir** que um arquivo `.md` colocado em qualquer pasta será executado automaticamente. Abaixo está a compatibilidade real verificada no repositório e no ambiente local:

| Plataforma / Ferramenta | Localização Reconhecida | Execução Automática? | Status no Ambiente Local | Observação Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **Arquivo Markdown avulso** (`docs/experimento-agentes/originais-professora/*.md`) | Qualquer pasta de documentação | **Não** — apenas referência/arquivo | Disponível como fonte primária | Nenhum IDE/CLI executa `.md` soltos em `docs/` automaticamente sem invocação explícita. |
| **Claude Code** | `.claude/agents/<nome>.md` | **Sim** (nativamente no Claude Code) | CLI `claude` não instalado no PATH Windows desta máquina | O formato original da professora já segue 100% o schema nativo do Claude Code (`name`, `description`, `tools` em string separada por vírgulas). |
| **GitHub Copilot** (VS Code / Copilot Coding Agent) | `.github/agents/<nome>.agent.md` + `.github/copilot-instructions.md` | **Sim** (nativamente no VS Code / GitHub Copilot) | CLI `code`/`gh`/`copilot` não instalado no PATH Windows desta máquina | Exige extensão `.agent.md`, frontmatter YAML com `tools` em lista (array) compatível com Copilot e arquivo global `.github/copilot-instructions.md`. |
| **Antigravity (ambiente usado na execução)** | `.agents/skills/habbi-<nome>/SKILL.md` + `AGENTS.md` + subagentes dinâmicos via `define_subagent` / `invoke_subagent` | **Sim** (skills por descoberta progressiva + subagentes isolados em tempo de execução) | **Ativo e verificado nesta execução** | `define_subagent` permite injetar o prompt original verbatim como `SystemPrompt` e aplicar restrição real de somente leitura (`EnableWriteTools: false`). |

---

## 4. Documentação Transparente de Todas as Adaptações Realizadas

**Regra de integridade:** o **corpo textual das instruções** dos 7 agentes da professora **não foi alterado em nenhuma versão** (Claude Code, GitHub Copilot ou Antigravity). Apenas os **metadados YAML** (e, no caso das skills Antigravity, um cabeçalho HTML comentado de referência ao Habbi) foram ajustados onde exigido pelo schema da ferramenta.

### 4.1. Versão Claude Code (`.claude/agents/*.md`)
- **Adaptação feita:** **Nenhuma.** Os 7 arquivos são cópias byte-a-byte idênticas aos arquivos originais (`SHA-256` validado).
- **Motivo:** Os arquivos originais já possuem exatamente o frontmatter esperado pelo Claude Code (`name`, `description`, `tools: Read, Glob, Grep, ...`).

### 4.2. Versão GitHub Copilot (`.github/agents/*.agent.md` + `.github/copilot-instructions.md`)
- **Adaptações feitas nos metadados YAML:**
  1. **Extensão do arquivo:** renomeada de `.md` para `.agent.md` em `.github/agents/`, conforme especificação de custom agents do GitHub Copilot.
  2. **Campo `tools`:** convertido do formato string separada por vírgulas do Claude Code para lista YAML de aliases compatíveis com Copilot:
     - Agentes de leitura (`especialista-ux`, `especialista-usabilidade`, `especialista-acessibilidade`, `critico`): `tools: ["read", "search"]` (preservando o princípio de menor privilégio sem edição ou shell).
     - Agentes de dados e implementação (`analista-dados`, `cientista-dados`, `dev-fullstack-senior`): `tools: ["read", "search", "edit", "execute"]`.
  3. **Campos explícitos de invocação:** adicionados `user-invocable: true` e `disable-model-invocation: false` para garantir visibilidade na seleção manual do Copilot Chat e delegação quando aplicável.
  4. **Contexto global do projeto:** criado `.github/copilot-instructions.md` com as regras obrigatórias do Habbi (flat design, tokens CSS, WCAG 2.2 AA, PT/EN/ES, `DESIGN_SYSTEM.md` e `AGENTS.md`).
- **Corpo do prompt:** **100% preservado** (zero alteração de frase, regra ou formato de saída).

### 4.3. Versão Antigravity (`.agents/skills/habbi-<nome>/SKILL.md` + subagentes `define_subagent`)
- **Adaptações feitas para Skills (`.agents/skills/habbi-<nome>/SKILL.md`):**
  1. **Estrutura de pasta:** cada agente foi empacotado em `.agents/skills/habbi-<nome>/SKILL.md`, conforme especificação de workspace skills do Antigravity.
  2. **Frontmatter YAML:** mantidos `name: habbi-<nome>` (prefixo `habbi-` para evitar colisão de namespace) e a `description` original; removido o campo `tools` do frontmatter de skill (pois skills no Antigravity são instruções carregadas sob demanda, enquanto a restrição efetiva de ferramentas é aplicada na definição do subagente via `define_subagent`).
  3. **Ponte de contexto:** adicionado um bloco de comentário/nota de contexto antes do corpo original apontando para `DESIGN_SYSTEM.md` e `AGENTS.md` sem editar o texto original do prompt.
- **Execução real no experimento (`define_subagent` / `invoke_subagent`):**
  - Para executar os 4 agentes avaliadores (`especialista-ux`, `especialista-usabilidade`, `especialista-acessibilidade`, `critico`) com isolamento real de contexto e **restrição técnica efetiva de ferramentas**, cada um foi registrado com `define_subagent`:
    - `SystemPrompt`: conteúdo integral verbatim do respectivo arquivo original.
    - `EnableWriteTools: false` (bloqueia `write_file`, `edit_file` e `run_command`).
    - `EnableMCPTools: false` e `EnableSubagentTools: false`.
  - Isso garante que a restrição "somente leitura" não dependa apenas de "boa vontade" do prompt textual, mas seja imposta pela própria camada de ferramentas da plataforma.
