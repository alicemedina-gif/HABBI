# Instruções do Projeto Habbi para GitHub Copilot

O **Habbi** é um aplicativo acadêmico de intervenção comportamental empática para redução/cessação do tabagismo (Desenho Industrial — UFSM), protagonizado pela gatinha **Morgana**.

## Regras Inegociáveis do Projeto

1. **Zero gradientes, zero blur e zero glassmorphism**: utilize exclusivamente superfícies flat com cores sólidas definidas via tokens CSS (`:root` e `.device-screen.dark-theme`) em `style.css`.
2. **Design System oficial**: consulte sempre `DESIGN_SYSTEM.md` e `AGENTS.md` antes de qualquer alteração visual ou funcional.
3. **Tema Claro e Tema Escuro**: toda mudança deve preservar contraste WCAG 2.2 AA (>= 4.5:1 para texto normal, >= 3:1 para texto grande e componentes) nos dois temas.
4. **Responsividade obrigatória**: validar sempre em `320x568`, `390x844` e `430x932` px, mantendo área de toque mínima de `44x44 px` e foco visível (`:focus-visible`).
5. **Internacionalização (i18n)**: nunca insira texto visível hardcoded no HTML/JS sem registrar as chaves correspondentes em `HABBI_I18N` (`PT`, `EN` e `ES`) em `app.js`.
6. **Tom empático e acolhedor**: nunca usar mensagens punitivas, culpabilizantes ou alarmistas sobre recaídas ou gastos.
7. **Preservação de assets**: nunca renomear ou apagar arquivos em `assets/` ou `assets/ilustracoes/` (preservar espaços e nomes originais) e manter proporções da mascote (`object-fit: contain`).

## Agentes Especializados Disponíveis

Este repositório contém agentes especializados em `.github/agents/*.agent.md`:

- **Leitura e análise (sem edição de código)**:
  - `especialista-ux` — jornada do usuário, arquitetura de informação, carga cognitiva e fluxos.
  - `especialista-usabilidade` — heurísticas de Nielsen, feedback, prevenção e recuperação de erros.
  - `especialista-acessibilidade` — WCAG 2.2 AA, teclado, leitores de tela, contraste e ARIA.
  - `critico` — revisão adversarial, contradições entre análises, riscos, segurança e ética.
- **Dados e implementação**:
  - `analista-dados` — KPIs, métricas, funis e análise exploratória.
  - `cientista-dados` — modelagem estatística/ML, experimentos A/B e avaliação de modelos.
  - `dev-fullstack-senior` — arquitetura, implementação segura e testes após aprovação.

## Fluxo Oficial de Avaliação e Mudança

Siga sempre a ordem documentada em `AGENTS.md`:

`UX → Usabilidade → Acessibilidade → Revisão Crítica → Implementação Aprovada → Testes`

Não aplique correções no código durante etapas de análise/auditoria sem aprovação explícita.
