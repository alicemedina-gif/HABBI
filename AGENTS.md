# Diretrizes Operacionais para Agentes de IA — Habbi
**Manual de Governança, Engenharia de Software e Design de Interfaces**  
*Projeto Acadêmico: Laboratório de Interfaces — Desenho Industrial (UFSM)*  
*Documento de Referência Obrigatória para Qualquer Agente ou Desenvolvedor*  

---

## Sumário
1. [Declaração de Princípios & Filosofia do Habbi](#1-declaração-de-princípios--filosofia-do-habbi)
2. [Checklist Obrigatório Antes de Qualquer Modificação](#2-checklist-obrigatório-antes-de-qualquer-modificação)
3. [Regras Inegociáveis de Design de Interface (UI)](#3-regras-inegociáveis-de-design-de-interface-ui)
4. [Governança de Assets, Mascotes e Ilustrações](#4-governança-de-assets-mascotes-e-ilustrações)
5. [Arquitetura dos Temas (Claro e Escuro)](#5-arquitetura-dos-temas-claro-e-escuro)
6. [Padrões de Engenharia em CSS e JavaScript](#6-padrões-de-engenharia-em-css-e-javascript)
7. [Acessibilidade (WCAG 2.2 AA) & Responsividade](#7-acessibilidade-wcag-22-aa--responsividade)
8. [Internacionalização (i18n): PT, EN e ES](#8-internacionalização-i18n-pt-en-e-es)
9. [Segurança de Versão, Commits e Verificação](#9-segurança-de-versão-commits-e-verificação)
10. [Guia de Resolução de Problemas Frequentes](#10-guia-de-resolução-de-problemas-frequentes)

---

## 1. Declaração de Princípios & Filosofia do Habbi

O **Habbi** não é apenas mais um protótipo de software: é o resultado de uma pesquisa acadêmica do curso de **Desenho Industrial da UFSM** focada em **intervenção comportamental empática**. Sua proposta é substituir o tom punitivo e estressante dos métodos tradicionais de cessação por acolhimento, micro-vitórias e design afetivo (*cozy interface*).

### O Papel da Mascote Morgana
A gatinha **Morgana** é inspirada na gatinha real da autora e atua como a alma do aplicativo. Ela nunca repreende, não julga recaídas e celebra com carinho cada conquista diária. **Trate o universo visual e narrativo do Habbi com extremo respeito e rigor técnico.**

---

## 2. Checklist Obrigatório Antes de Qualquer Modificação

Antes de escrever qualquer linha de código em `index.html`, `style.css` ou `app.js`, o agente de IA deve executar mentalmente o seguinte checklist:

- [ ] **Li o `DESIGN_SYSTEM.md`?** Estou ciente das cores, tamanhos de fonte e componentes oficiais?
- [ ] **Identifiquei a tela afetada?** Verifiquei se é uma das 29 telas oficiais (`data-screen="1"` a `data-screen="29"`)?
- [ ] **Criei um commit ou tag de segurança no Git?** Posso reverter com segurança se algo quebrar?
- [ ] **Verifiquei referências de assets?** Garanti que nenhum arquivo em `assets/` será apagado ou renomeado?
- [ ] **Planejei os testes em ambos os temas?** O código funcionará com perfeição no tema Claro E no tema Escuro?
- [ ] **Respeitei a regra Flat?** Estou livre de gradientes, filtros de desfoque (*blur*) e *glassmorphism*?

---

## 3. Regras Inegociáveis de Design de Interface (UI)

### 3.1. Zero Gradientes, Zero Blur e Zero Glassmorphism
- **Proibido:** `background: linear-gradient(...)`, `backdrop-filter: blur(...)`, cartões translúcidos com borda difusa simulando vidro.
- **Obrigatório:** Cores sólidas e planas (*solid flat colors*), com superfícies limpas e opacas alinhadas à identidade autoral do Habbi.
- **Por quê?** Gradientes e vidros destroem o contraste WCAG no modo escuro, poluem a leitura em celulares de baixo custo e fogem completamente da identidade autoral projetada na UFSM.

### 3.2. Proibição de Cores Fixas Fora do Sistema
- **Nunca insira cores hexadecimais aleatórias** no CSS ou no HTML. Use sempre os tokens definidos em `:root` e `.device-screen.dark-theme`:
  - Fundo: `var(--bg-color)` ou `var(--bg-color-alt)`
  - Cards: `var(--card-bg)`
  - Textos: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
  - Acentos: `var(--primary)`, `var(--yellow)`, `var(--blue)`, `var(--orange)`, `var(--coral)`, `var(--purple)`
- Se precisar estilizar um elemento que só existe em modo escuro, declare a regra dentro de `.device-screen.dark-theme .seu-seletor`.

### 3.3. Preservação de Cantos e Formas
- Use os tokens de arredondamento oficiais:
  - `--border-radius-lg: 20px`: Cartões, modais, painéis inferiores.
  - `--border-radius-md: 14px`: Botões, chips, inputs.
  - `--border-radius-sm: 8px`: Badges pequenos e ícones secundários.
  - `999px`: Pílulas de status e botões circulares.
- Nunca utilize cantos vivos (`border-radius: 0`) em componentes interativos.

---

## 4. Governança de Assets, Mascotes e Ilustrações

### 4.1. NUNCA Renomeie ou Apague Arquivos de Imagem
- Os nomes dos arquivos na pasta `assets/` e `assets/ilustracoes/` possuem espaços e caracteres específicos (ex: `pata pra baixo.png`, `gato segurando coração.png`, `sacola_Prancheta 1.png`, `Gato Preto Ansioso com Gotas Azuis.png`).
- Esses nomes estão vinculados diretamente a seletores CSS e rotinas de carregamento dinâmico em `app.js`. Renomeá-los causará quebra silenciosa da renderização do mascote.
- Se um asset parecer não utilizado, **preserve-o**. Existe uma pasta dedicada `assets/orfaos_preservados/` justamente para salvaguardar ilustrações históricas.

### 4.2. Proporções e Posicionamento do Mascote
- **Sem Distorções:** O mascote Morgana deve sempre manter `object-fit: contain` ou `height: auto` quando a largura for fixa. Nunca force `width` e `height` simultâneos que alterem a proporção do desenho.
- **Transparência via Canvas:** Lembre-se de que o Habbi utiliza uma rotina no JavaScript que remove fundos brancos automaticamente em tempo de execução via Canvas. Não tente aplicar truques frágeis de CSS como `mix-blend-mode: multiply`, pois eles falham catastroficamente no modo escuro.

---

## 5. Arquitetura dos Temas (Claro e Escuro)

### 5.1. Como o Tema Funciona
O tema é aplicado através da classe `.dark-theme` no contêiner `.device-screen`:
```html
<div class="device-screen dark-theme"> ... </div>
```
O estado é sincronizado com o navegador por meio da chave:
```javascript
localStorage.setItem('habbi-theme', 'dark'); // ou 'light'
```

### 5.2. Regra de Ouro do Modo Escuro
- **Superfícies Escuras, Não Pretas Absolutas:** Utilize `#121214` para o fundo geral e `#1E1E24` ou `#26262D` para cartões. Isso cria hierarquia visual sem causar cansaço visual.
- **Textos Claros de Alto Contraste:** O texto principal no modo escuro deve ser `#F3F4F6` (contraste de 17:1 contra o fundo) e o texto secundário `#9CA3AF`.
- **Botões Coloridos:** No modo escuro, botões como `.btn-quick-choice` devem manter texto branco `#FFFFFF !important` para preservar legibilidade sobre cores vivas.

---

## 6. Padrões de Engenharia em CSS e JavaScript

### 6.1. Evitar Duplicação de Código
- Não crie novas classes CSS para funcionalidades que já possuem componentes prontos (ex: botões `.btn`, cartões `.card`, tags `.pill-tag`, seletores `.chip`).
- Em JavaScript, reaproveite as funções centrais de navegação e formatação:
  - `goToScreen(screenNumber)`: Navegação padronizada com ciclo de vida.
  - `showToast(message)`: Feedback acessível temporário.
  - `formatDayLabelPt(dateKey)`: Formatação de datas nos três idiomas.
  - `updateSavingsUI()`: Recálculo reativo da economia e metas.

### 6.2. Preservação de Animações e Micro-interações
- As seguintes animações são fundamentais para o tom emocional do aplicativo e **devem ser mantidas**:
  - `homeMascotFloat`: Movimento sutil de respiração e flutuação da Morgana na Home.
  - `homeMascotPop`: Reação tátil e expressiva da gatinha ao clique.
  - `.btn:active { transform: scale(0.97); }`: Feedback físico de clique em botões.
  - Cronômetro de Respiração 4-6 da tela SOS (`data-screen="12"` e `"13"`).
  - Animação da pata para cima e pata para baixo nas telas de configuração e minijogo.

---

## 7. Acessibilidade (WCAG 2.2 AA) & Responsividade

### 7.1. Verificações de Acessibilidade Obrigatórias
1. **Contraste de Cor:** Nunca introduza textos cinzas claros sobre fundo branco ou textos cinzas escuros sobre fundo preto. Verifique o índice de contraste (mínimo 4.5:1).
2. **Área de Toque (*Touch Targets*):** Todo elemento clicável deve possuir área mínima de toque de **44 × 44 px**.
3. **Foco Visível:** Mantenha o anel de foco acessível `:focus-visible` com espessura de 3px em azul acessível (`#339AF0` no claro e `#74C0FC` no escuro).
4. **Respeito a Movimento Reduzido:** Todas as animações CSS devem ter fallback estático sob a media query:
   ```css
   @media (prefers-reduced-motion: reduce) {
     .home-v2-mascot { animation: none !important; }
   }
   ```

### 7.2. Testes em Diferentes Telas
Qualquer nova tela ou ajuste deve ser testado nas seguintes resoluções emuladas:
- **320 × 568 px** (iPhone SE) — Garante que não haja quebra em telas compactas.
- **390 × 844 px** (iPhone 14) — Proporção padrão móvel moderna.
- **430 × 932 px** (iPhone 14 Pro Max) — Telas de grande proporção.

---

## 8. Internacionalização (i18n): PT, EN e ES

O Habbi possui suporte nativo completo a três idiomas (Português, Inglês e Espanhol). Todos os textos visíveis são governados pelo dicionário central `HABBI_I18N` em `app.js`:

```javascript
const HABBI_I18N = {
  PT: { /* textos em Português */ },
  EN: { /* textos em Inglês */ },
  ES: { /* textos em Espanhol */ }
};
```

### Regras para Novos Textos
1. **Nunca insira texto direto no HTML sem adicionar as chaves correspondentes em `HABBI_I18N.PT`, `HABBI_I18N.EN` e `HABBI_I18N.ES`.**
2. Se criar um novo botão, modal ou mensagem de erro, registre a string nos 3 idiomas e chame a função de atualização linguística na troca de idioma.

---

## 9. Segurança de Versão, Commits e Verificação

### 9.1. Fluxo de Trabalho com Git
Antes de qualquer refatoração ou intervenção complexa:
1. **Verifique o status do repositório:**
   ```powershell
   git status
   ```
2. **Crie uma tag ou commit de segurança prévio:**
   ```powershell
   git commit -m "chore: snapshot de seguranca antes de [funcionalidade]"
   ```
3. **Faça modificações pequenas e atômicas.**
4. **Execute testes automatizados** com navegador headless ou scripts de teste antes de dar a tarefa por concluída.
5. **Crie o commit final semântico:**
   ```powershell
   git commit -m "fix/feat: descricao clara da intervencao realizada"
   ```

---

## 10. Guia de Resolução de Problemas Frequentes

| Sintoma / Problema | Causa Raiz Típica | Ação Corretiva do Agente |
| :--- | :--- | :--- |
| **Texto invisível no modo escuro** | Cor preta ou cinza escura declarada inline (`style="color:#111"`) | Declarar regra em `style.css` com `.device-screen.dark-theme` e `!important`. |
| **Mascote com fundo branco feio** | Imagem inserida fora do container Canvas ou sem script de remoção de alfa | Usar a classe padrão `.home-v2-mascot` ou passar pelo filtro Canvas. |
| **Botão sem resposta ao clique** | `z-index` menor que o container ou evento não associado no `DOMContentLoaded` | Verificar camadas de sobreposição e vincular listener em `app.js`. |
| **Layout estourando horizontalmente** | Elemento com largura fixa em `px` maior que `320px` sem `max-width: 100%` | Usar `width: 100%`, flexbox com `flex-wrap: wrap` ou `box-sizing: border-box`. |
| **Idioma volta para o inglês ao trocar de tela** | Estado `userState.currentLang` não propagado ao renderizar nova tela | Chamar `applyLanguage(userState.currentLang)` dentro do ciclo de `goToScreen()`. |

---
*Este manual de diretrizes deve ser consultado e seguido rigorosamente por qualquer inteligência artificial ou desenvolvedor encarregado de dar continuidade ao Habbi.*
