window.goToScreen = function(screenNum) { if (typeof window.showScreen === 'function') { window.showScreen(screenNum); } };
document.addEventListener('DOMContentLoaded', () => {
  // Helper global de sanitização contra XSS
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  window.escapeHtml = escapeHtml;

  // Navigation State
  let currentScreen = 1;
  const totalScreens = 29;

  // Data e fuso horário locais do dispositivo
  function getDateKey(dateObj = new Date()) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDateKey(dateKey) {
    if (!dateKey || typeof dateKey !== 'string') {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
    }
    const parts = dateKey.split('-').map(Number);
    return {
      year: parts[0] || new Date().getFullYear(),
      month: (parts[1] || 1) - 1,
      day: parts[2] || 1
    };
  }

  const MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const MONTH_NAMES_I18N = {
    PT: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ES: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  };

  const WEEKDAY_NAMES_I18N = {
    PT: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    EN: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ES: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  };

  const WEEKDAY_NAMES_PT = WEEKDAY_NAMES_I18N.PT;

  function getMonthNamePt(monthIdx) {
    const lang = (window.userState && window.userState.currentLang ? window.userState.currentLang : 'PT').toUpperCase();
    const list = MONTH_NAMES_I18N[lang] || MONTH_NAMES_I18N.PT;
    return list[(monthIdx + 12) % 12] || '';
  }

  function formatDayLabelPt(dateKey) {
    const lang = (window.userState && window.userState.currentLang ? window.userState.currentLang : 'PT').toUpperCase();
    const todayKey = getDateKey(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = getDateKey(yesterdayDate);
    const { year, month, day } = parseDateKey(dateKey);
    const monthName = getMonthNamePt(month);
    const monthLower = monthName.toLowerCase();
    const nowYear = new Date().getFullYear();
    const yearSuffix = year !== nowYear ? (lang === 'EN' ? `, ${year}` : ` de ${year}`) : '';
    const dayOfWeek = (WEEKDAY_NAMES_I18N[lang] || WEEKDAY_NAMES_I18N.PT)[new Date(year, month, day).getDay()];

    if (lang === 'EN') {
      if (dateKey === todayKey) return `Today, ${monthName} ${day}${yearSuffix}`;
      if (dateKey === yesterdayKey) return `Yesterday, ${monthName} ${day}${yearSuffix}`;
      return `${dayOfWeek}, ${monthName} ${day}${yearSuffix}`;
    }
    if (lang === 'ES') {
      if (dateKey === todayKey) return `Hoy, ${day} de ${monthLower}${yearSuffix}`;
      if (dateKey === yesterdayKey) return `Ayer, ${day} de ${monthLower}${yearSuffix}`;
      return `${dayOfWeek}, ${day} de ${monthLower}${yearSuffix}`;
    }

    if (dateKey === todayKey) {
      return `Hoje, ${day} de ${monthLower}${yearSuffix}`;
    }
    if (dateKey === yesterdayKey) {
      return `Ontem, ${day} de ${monthLower}${yearSuffix}`;
    }
    return `${dayOfWeek}, ${day} de ${monthLower}${yearSuffix}`;
  }

  const initialNow = new Date();

  // Selected Data State (conectado aos registros reais do usuário)
  const userState = {
    name: '',
    email: '',
    avatar: 'verde',
    isAuthenticated: false,
    authReturnScreen: 10,
    motivations: [],
    patterns: [],
    yearsSmoking: 'Menos de 1',
    mood: null,
    sosUrge: 7,
    sosContext: 'Casa',
    sosTime: '3 min',
    selectedIntervention: 'Respiração 4-6',
    groundingCheckedCount: 0,

    // Indicadores reais calculados a partir de dailyRecords
    daysClean: 0,
    totalUrgesOvercome: 0,
    todayMeta: 11,
    todayLogged: 0,
    lastGoalPromptDateKey: null,
    suggestedMetaCustomized: false,
    metaExceededModalShown: false,
    isGameActive: false,

    // Estado de navegação do Calendário (mês/ano reais do dispositivo)
    calViewYear: initialNow.getFullYear(),
    calViewMonth: initialNow.getMonth(),
    calSelectedDate: getDateKey(initialNow),
    calEventsExpandedDate: null,
    activeRegisterDateKey: getDateKey(initialNow),
    returnScreenAfterRegister: 10,

    // Mapa de registros reais indexado por YYYY-MM-DD
    dailyRecords: {},

    // Listas legadas mantidas sincronizadas por compatibilidade
    successDaysList: [],
    relapseDaysList: [],
    warningDaysList: [],

    historyEvents: [],

    // Savings State
    habitualCigs: 12,
    habitualCigsCustomized: false,
    packPrice: 12.00,
    cigsPerPack: 20,
    packFreqDays: 2,
    packEvents: [],
    totalSavings: 0.00,
    cigarettesAvoided: 0,
    savingsHistory: [],
    savingsGoal: { title: 'Minha conquista', target: 250 },
    gameRecords: { memory: 0, sequence: 0, reflex: 0, math: 0 },
    theme: 'light',
    onboardingCompleted: false,
    tutorialCompleted: false,
    hasConfiguredFirstGoal: false,
    sacola100Celebrated: false,
    currentScreenSaved: 1
  };
  window.userState = userState;

  const flagSVGs = {
    PT: `<svg viewBox="0 0 36 36" width="100%" height="100%"><rect width="36" height="36" fill="#009B3A"/><polygon points="18,5 32,18 18,31 4,18" fill="#FEDF00"/><circle cx="18" cy="18" r="6.8" fill="#002776"/><path d="M11.4,16.6 Q18,13.8 24.6,18.4" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    EN: `<svg viewBox="0 0 36 36" width="100%" height="100%"><rect width="36" height="36" fill="#B22234"/><rect y="5" width="36" height="4" fill="#FFFFFF"/><rect y="13" width="36" height="4" fill="#FFFFFF"/><rect y="21" width="36" height="4" fill="#FFFFFF"/><rect y="29" width="36" height="4" fill="#FFFFFF"/><rect width="18" height="19" fill="#3C3B6E"/></svg>`,
    ES: `<svg viewBox="0 0 36 36" width="100%" height="100%"><rect width="36" height="36" fill="#AA151B"/><rect y="9" width="36" height="18" fill="#F1BF00"/></svg>`
  };
  window.flagSVGs = flagSVGs;

  function getDefaultGoalTitle(lang) {
    const code = (lang || (window.userState && window.userState.currentLang) || 'PT').toUpperCase();
    if (code === 'EN') return 'My achievement';
    if (code === 'ES') return 'Mi logro';
    return 'Minha conquista';
  }
  window.getDefaultGoalTitle = getDefaultGoalTitle;

  const HABBI_I18N = {
    PT: {
      langCode: 'PT',
      langName: 'Português (BR)',
      toastLangChanged: 'Idioma alterado para Português',
      splashHeadline: 'Controle seus hábitos,<br>acompanhe sua evolução.',
      splashStart: 'INICIAR',

      // Boas-vindas (2)
      welcomeTitle: 'Olá!',
      welcomeSubtitle: 'Que bom te ver por aqui!',
      welcomeLogin: 'Entrar',
      welcomeSignup: 'Criar conta',

      // Onboarding (3, 4, 5)
      onb1Step: '1 de 3',
      onb1Title: 'Acompanhe seu limite<br>com 1 toque',
      onb1Desc: 'Registre ao longo do dia para ficar dentro da sua meta diária.',
      onb1Next: 'ADICIONAR',
      onbSkip: 'IGNORAR',
      onb2Step: '2 de 3',
      onb2Title: 'Identifique gatilhos',
      onb2Desc: 'Pequenos incentivos para seguir no seu ritmo.',
      onb2Next: 'Ativar lembretes',
      onbRemindersEnable: 'Ativar lembretes',
      onbRemindersSkip: 'Agora não',
      onbNotifTitle: 'Que tal distrair a mente?',
      onbNotifSub: 'Lembretes e ferramentas para te acompanhar.',
      onb3Step: '3 de 3',
      onb3Title: 'Uma nova forma de<br>cuidar de você.',
      onb3Desc: 'Pequenas escolhas diárias geram grandes mudanças.',
      onb3Next: 'Vamos começar!',
      onbCompareBadTitle: 'No piloto<br>automático',
      onbCompareGoodTitle: 'Com o<br>Habbi',
      onbCompareBadList: [
        'Hábitos sem perceber',
        'Momentos de ansiedade',
        'Falta de distrações',
        'Pouco controle da rotina',
        'Gastos acumulados',
        'Progresso despercebido'
      ],
      onbCompareGoodList: [
        'Registro rápido e fácil',
        'Apoio nos momentos difíceis',
        'Minijogos para distrair',
        'Calendário de hábitos',
        'Controle de gastos',
        'Progresso visual diário'
      ],

      // Jornada (6)
      journeyTitle: 'Escolha sua jornada',
      journeyDesc: 'Comece por onde quiser transformar.',
      journeySmoking: 'Tabagismo',
      journeyAvailable: 'Disponível',
      journeyVape: 'Vape',
      journeyAlcohol: 'Álcool',
      journeyGambling: 'Apostas',
      journeySocial: 'Redes Sociais',
      journeyProcrastination: 'Procrastinação',
      journeyComingSoon: 'Em breve',
      journeySubmit: 'Continuar',

      // Configuração inicial (7, 8, 9)
      configTitle: 'Configuração',
      configSubmit: 'Continuar',
      metaH1: 'Quantos cigarros você fuma por dia?',
      metaSliderUnit: 'cigarros',
      metaYearsQuestion: 'Há quantos anos você fuma?',
      metaYearsLess1: 'Menos de 1',
      metaYears1to5: '1 - 5 anos',
      metaYears5to10: '5 - 10 anos',
      metaYears10plus: '10+ anos',
      metaPriceQuestion: 'Preço médio do maço/carteira (R$)',
      metaPriceDesc: 'Usado para calcular a sua economia diária.',
      metaTitle: 'Quantos cigarros você fuma por dia?',
      metaDesc: 'Defina uma meta realista para hoje.',
      metaUnit: 'cigarros por dia',
      metaSubmit: 'Pronto!',
      metaSuggestedTitle: 'Meta para hoje',
      metaSuggestedDesc: 'Que tal começar com 1 cigarro a menos do seu consumo habitual?',
      metaSuggestedBadge: 'Primeiro passo sugerido',
      metaSuggestedHint: 'Você pode confirmar ou ajustar este valor antes de iniciar.',
      metaSuggestedUnit: 'cigarros hoje',
      metaHabitualSub: 'Seu consumo habitual de referência',
      metaHabitualUnit: 'cigarros por dia',

      // Evolução de Meta Diária (Home)
      goalPromptTitle: 'Meta de hoje',
      goalPromptMetYesterday: 'Ontem você mandou bem!',
      goalPromptOverYesterday: 'Ontem foi um dia desafiador, e tudo bem!',
      goalPromptNormal: 'Novo dia, novo passo',
      goalPromptZero: 'Meta sem fumar mantida!',
      goalPromptZeroDesc: 'Você já conquistou a meta de 0 cigarros. Vamos continuar sem fumar hoje?',
      goalPromptKeepBtn: 'Continuar com {0}',
      goalPromptReduceBtn: 'Tentar {0}',
      goalPromptZeroKeepBtn: 'Continuar sem fumar',
      goalPromptLaterBtn: 'Decidir depois',
      goalToastKept: 'Meta mantida em {0} cigarros hoje.',
      goalToastReduced: 'Nova meta definida: {0} cigarros hoje! Um passo de cada vez.',
      goalToastZero: 'Excelente! Meta de 0 cigarros mantida para hoje.',

      // Ajuste de Meta nas Configurações e Perfil
      settingsGoalAdjustLabel: 'Meta diária e consumo',
      settingsGoalAdjustDesc: 'Altere sua meta diária ou consumo habitual',
      goalModalTitle: 'Ajustar meta e consumo',
      goalModalTodayLabel: 'Meta diária atual',
      goalModalTodayDesc: 'Seu limite de cigarros planejado para hoje.',
      goalModalHabitualLabel: 'Consumo habitual de referência',
      goalModalHabitualDesc: 'Usado para calcular a sua economia diária acumulada.',
      goalModalSave: 'Salvar',
      goalModalCancel: 'Cancelar',
      goalToastSaved: 'Meta e consumo atualizados com sucesso!',

      motivationsH1: 'O que te motiva a mudar?',
      motivationsDesc: 'Escolha quantas quiser.',
      motHealth: 'Saúde',
      motSavings: 'Economia',
      motFamily: 'Família',
      motExercise: 'Exercícios',
      motQuality: 'Qualidade de vida',
      motOther: 'Outro',

      calcTitle: 'Economia estimada',
      calcDesc: 'Veja quanto você pode poupar.',
      calcSubmit: 'Continuar',

      triggersH1: 'O que te faz querer fumar?',
      triggersDesc: 'Escolha quantas quiser.',
      triggersTitle: 'Quais momentos dão mais vontade?',
      trigStress: 'Estresse',
      trigAnxiety: 'Ansiedade',
      trigWork: 'Trabalho',
      trigCoffee: 'Café',
      trigMeals: 'Após refeições',
      trigSocial: 'Socialização',
      trigBoredom: 'Tédio',
      trigAlcohol: 'Bebida alcoólica',
      trigOther: 'Outro',
      triggersSubmit: 'Continuar',

      // Home (10)
      homeGreetingMorning: 'Bom dia,',
      homeGreetingAfternoon: 'Boa tarde,',
      homeGreetingNight: 'Boa noite,',
      homeTodaySuffix: 'hoje',
      homeDaySingular: 'dia sem fumar',
      homeDaysPlural: 'dias sem fumar',
      homeMetaPctSuffix: 'da meta de hoje',
      homeNoSmoke: 'Não fumei hoje',
      homeSosBtn: 'SOS',
      homeAddCig: 'Registrar cigarro',
      homeSwipeHint: '‹ Arraste para explorar ›',

      // Hub Menu
      hubTitle: 'Menu do Habbi',
      hubProfileTitle: 'Meu perfil',
      hubProfileDesc: 'Conta e informações pessoais',
      hubProgressTitle: 'Meu progresso',
      hubProgressDesc: 'Histórico e evolução',
      hubToolsTitle: 'Ferramentas',
      hubToolsDesc: 'Respiração e exercícios de apoio',
      hubSettingsTitle: 'Configurações',
      hubSettingsDesc: 'Lembretes e preferências',

      // Registro Rápido (11)
      quickTitle: 'Como está agora?',
      quickNoSmoke: 'Não fumei hoje',
      quickUrge: 'Tive vontade',
      quickSmoke: 'Fumei',
      quickMood: 'Como estou',

      // SOS Hub (12)
      sosTitle: 'Vamos por partes.',
      sosSubtitle: 'Só os próximos minutos.',
      sosTimerTag: 'Uma pausa de 5 minutos',
      sosTimerStart: 'Começar pausa',
      sosTimerPause: 'Pausar',
      sosTimerResume: 'Continuar',
      sosTimerReset: 'Reiniciar',
      sosCardBreathe: 'Respirar',
      sosCardDistract: 'Distrair',
      sosCardWater: 'Beber água',
      sosCardCalm: 'Me acalmar',
      sosSupportBtn: 'Preciso de alguém',
      sosDismissBtn: 'Voltar ao SOS',

      // Intervenções (13)
      intervBreatheTitle: 'Respiração 4-6',
      intervCalmTitle: 'Me Acalmar (5-4-3-2-1)',
      intervInhale: 'Inspire',
      intervExhale: 'Solte',
      intervTip: 'Inspire pelo nariz por 4s e solte pela boca por 6s.',
      intervTipPaused: 'Pausado. Toque em Continuar quando estiver pronto.',
      intervDone: 'Concluir',
      intervPause: 'Pausar',
      intervResume: 'Continuar',
      intervNext: 'Próximo',
      intervPrev: 'Anterior',

      // Ferramentas (14)
      toolsTitle: 'Ferramentas',
      toolsSubtitle: 'Escolha uma categoria.',
      toolsRespTitle: 'Respiração Guiada 4-6',
      toolsRespTag: '3 MINUTOS • ACALMAR',
      toolsMiniTitle: '4 Minijogos de Foco',
      toolsMiniTag: 'DISTRAÇÃO COGNITIVA',
      toolsSosTitle: 'Cortar Fissura Agora',
      toolsSosTag: 'EMERGÊNCIA • SOS',
      toolsMoodTitle: 'Registrar Humor do Dia',
      toolsMoodTag: 'PADRÕES & EMOÇÕES',

      // Minijogos (15)
      minijogosTitle: 'Minijogos',
      minijogosCarouselSub: 'Exercícios rápidos para quebrar a fissura',
      minijogosToolsSub: 'Exercícios e distração',
      gameMemTitle: 'Memória',
      gameMemSub: 'Encontre os pares',
      gameSeqTitle: 'Sequência',
      gameSeqSub: 'Repita a sequência',
      gameSeqInstruction: 'Memorize a sequência e repita na mesma ordem.',
      gameSeqObserve: 'Observe',
      gameSeqYourTurn: 'Sua vez',
      gameSeqProgress: 'Sua vez',
      gameSeqSoftError: 'Tudo bem! Nova sequência...',
      gameSeqSuccess: 'Perfeito!',
      gameSeqRoundRecord: 'Rodada {0} • Recorde: {1}',
      gameSeqSoundOn: 'Som ativado',
      gameSeqSoundOff: 'Sem som',
      gameMathTitle: 'Matemática',
      gameMathSub: 'Cálculo mental',
      gameTapTitle: 'Jogo do Tap',
      gameTapSub: 'Folhas ágeis',
      gameQuitBtn: 'Sair do jogo',
      gameScorePairs: 'Pares: {0} • Rodada {1}',
      gameScoreSeq: 'Sequências: {0} • Rodada {1}',
      gameScoreLeaves: 'Folhas: {0}',
      gameScoreMath: 'Acertos: {0} • Rodada {1}',
      recordWord: 'Recorde',
      recordNewToast: '🎉 Novo recorde!',

      // Calendário (16)
      calTitle: 'Calendário',
      calToday: 'Hoje',
      calWeekdays: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
      calLegendGoal: 'Dentro da meta',
      calLegendOver: 'Acima da meta',
      calLegendEmpty: 'Sem registro',
      calStatClean: 'Sem fumar',
      calStatGoal: 'Na meta',
      calStatUrges: 'Vontades',
      calGoalNoLogs: 'Sem registros • Meta {0}/dia',
      calGoalExceeded: '{0} / {1} cigarros • +{2} acima da meta',
      calGoalInProgress: '{0} / {1} cigarros • Em andamento',
      calGoalSmokeFree: '0 / {0} cigarros • Sem fumar',
      calGoalWithin: '{0} / {1} cigarros • Dentro da meta',
      calEventEdit: 'Editar',
      calEventRemove: 'Remover',
      calEventAdd: 'Adicionar registro',
      calNoLogsDay: 'Sem registros para este dia',
      calDemoTitle: '1 cigarro',
      calDemoSub: 'Exemplo para demonstração',
      calMoreLogs: 'Ver mais {0} registros',
      calSeeMoreLogs: 'Ver outros {0} {1}',
      calSeeMoreSingular: 'registro',
      calSeeMorePlural: 'registros',
      calShowLess: 'Mostrar menos',

      // Painel Rápido de Registro
      qregAddTitle: 'Adicionar registro',
      qregEditTitle: 'Editar registro',
      qregNoSmokeBtn: 'Não fumei hoje',
      qregUrgeBtn: 'Vontade superada',
      qregDateCigsLbl: 'Consumo na data',
      qregCigsUnit: 'cigarros',
      qregAddCigBtn: '+1 cigarro',
      qregMoodQuestion: 'Como está se sentindo?',
      qregMoods: { Feliz: 'Feliz', Calmo: 'Calmo', Ansioso: 'Ansioso', Triste: 'Triste', Irritado: 'Irritado' },
      qregInfluences: { Sono: 'Sono', Exercício: 'Exercício', Trabalho: 'Trabalho', Relações: 'Relações', Alimentação: 'Alimentação' },
      qregNotePlaceholder: 'Nota opcional...',
      qregSaveMoodBtn: 'Salvar humor',

      // Progresso (17)
      progressTitle: 'Meu progresso',
      progressSubtitle: 'Histórico e evolução',
      statCleanDays: 'Dias sem fumar',
      statCigsAvoided: 'Cigarros evitados',
      statSaved: 'Economizado',
      statUrges: 'Vontades superadas',

      challengesTitle: 'Desafios',
      historyTitle: 'Histórico',
      historyTimelineSubtitle: 'Linha do tempo de todos os seus registros',
      historyEmptyText: 'Nenhum registro encontrado ainda.',
      insightsTitle: 'Insights',

      // Sentimentos / Gatilhos (25)
      moodTitle: 'Como você está?',
      moodSubtitle: 'Selecione seu humor hoje (opcional):',
      moodInfluenceTitle: 'O que está influenciando seu humor?',
      moodNotesLabel: 'O que aconteceu? (opcional)',
      moodNotesPlaceholder: 'Escreva um breve comentário sobre o seu dia...',
      moodSubmitBtn: 'Salvar Registro',
      moodHappy: 'Feliz',
      moodCalm: 'Calmo',
      moodAnxious: 'Ansioso',
      moodSad: 'Triste',
      moodIrritated: 'Irritado',

      // Perfil (21)
      profileTitle: 'Perfil',
      profileVisitor: 'Visitante',
      profileUnauthSub: 'Crie uma conta para salvar seus dados',
      profileCreateAccount: 'Criar conta',
      profileSignIn: 'Entrar',
      profileEdit: 'Editar perfil',
      profileHowToUse: 'Como usar o Habbi',
      profileHowToUseSub: 'Ver o tutorial interativo',
      profileLogout: 'Sair da conta',

      // Configurações (22)
      settingsTitle: 'Configurações',
      settingsLangLabel: 'Idioma',
      settingsNotifications: 'Notificações',
      settingsReminders: 'Lembretes',
      settingsTheme: 'Tema',
      settingsBackup: 'Backup e dados',
      settingsPrivacy: 'Privacidade',
      settingsHelp: 'Ajuda e suporte',
      settingsAbout: 'Sobre o Habbi',
      settingsOnboarding: 'Refazer tour inicial (Onboarding)',
      settingsDeleteProfileData: 'Apagar registros deste perfil',
      settingsRestartTest: 'Reiniciar experiência de teste',
      settingsLogout: 'Sair',
      themeLight: 'Claro',
      themeDark: 'Escuro',
      splashLoginLink: 'Já tenho conta · Entrar',
      delModalTitle: 'Apagar registros deste perfil?',
      delModalDesc: 'Esta ação remove permanentemente os registros diários, humor, economia e recordes salvos neste perfil local. Outras contas salvas neste dispositivo não serão afetadas.',
      delModalBackup: 'Baixar backup JSON antes',
      delModalConfirm: 'Apagar registros',
      delModalCancel: 'Cancelar',
      delModalDone: 'Registros deste perfil apagados.',
      noSmokeOtherDay: 'Não fumei neste dia',
      noSmokeModalTitle: 'Substituir registros desta data?',
      noSmokeModalDesc: 'Esta data já possui {0} cigarro(s) registrado(s). Deseja zerar esses cigarros e confirmar como dia sem fumar?',
      noSmokeModalConfirm: 'Confirmar dia sem fumar',
      futureDateBlocked: 'Não é possível registrar em datas futuras.',
      loginEmailInvalid: 'Informe um e-mail válido para entrar.',
      registerFieldsInvalid: 'Informe seu nome e um e-mail válido para criar a conta.',
      savingsDayInProgress: 'Dia em andamento • Consolida ao encerrar o dia ou confirmar sem fumar',
      tabConquista: 'Conquista',
      tabHome: 'Início',
      tabMinigames: 'Minijogos',
      toastUndo: 'Desfazer',
      toastEventRemoved: 'Registro removido',
      toastEventRestored: 'Registro restaurado',
      toastCigAdded: 'Cigarro registrado',
      overMetaEmpathy: '+{0} acima da meta — tudo bem, recomece no próximo',
      leaveGameTitle: 'Sair da partida atual?',
      leaveGameDesc: 'Você tem um minijogo em andamento. Se trocar de aba agora, esta partida será encerrada.',
      leaveGameStay: 'Continuar jogando',
      leaveGameConfirm: 'Sair da partida',
      homeTodayWord: 'hoje',
      savingsPillAria: 'Economia estimada: {0}. Abrir Conquista',
      navCalAria: 'Abrir calendário',
      navMenuAria: 'Abrir menu',
      carouselTabsAria: 'Seções principais do Habbi',
      homeSosAria: 'SOS Ajuda rápida para momentos de vontade',
      homeAddCigAria: 'Registrar cigarro',
      homeRemoveCigAria: 'Desfazer último cigarro registrado',
      calPrevMonthAria: 'Mês anterior',
      calNextMonthAria: 'Próximo mês',
      calCloseAria: 'Fechar calendário',
      calStatusFuture: 'Data futura bloqueada',
      calStatusMet: 'Meta atingida',
      calStatusExceeded: 'Meta ultrapassada',
      calStatusZero: 'Sem consumo',
      calStatusInProgress: 'Em andamento',
      calStatusNoLogs: 'Sem registros',
      calTodayWord: 'Hoje',
      calLegendInProgress: 'Em andamento',
      evSmokeTitle: 'Cigarro registrado',
      evSmokeDesc: '{0}/{1} no dia',
      evUrgeTitle: 'Vontade superada',
      evUrgeDesc: 'Impulso controlado',
      evSosTitle: 'Intervenção SOS',
      evNoSmokeTodayTitle: 'Não fumei hoje',
      evNoSmokeDayTitle: 'Não fumei neste dia',
      evNoSmokeDesc: '0 cigarros no dia',
      evMoodPrefix: 'Humor',
      evMoodFallbackTitle: 'Registro de Sentimentos',
      evMoodFallbackDesc: 'Sentimento registrado',
      ethicalNote: 'O Habbi é um protótipo acadêmico de apoio comportamental e não substitui acompanhamento médico ou psicológico.',
      histEmptyTitle: 'Nenhum registro salvo ainda',
      histEmptyDesc: 'Seus registros diários aparecerão aqui automaticamente.',

      // Login / Cadastro (23, 24)
      loginTitle: 'Entrar',
      loginSubtitle: 'Acesse sua conta Habbi',
      loginGuest: 'Continuar como visitante →',
      signupTitle: 'Criar conta',
      signupSubtitle: 'Comece sua jornada livre de fumo',
      signupGuest: 'Continuar sem cadastro →',

      // Avatar (26)
      avatarTitle: 'Escolha seu Avatar',
      avatarSubtitle: 'Selecione um gatinho para o seu perfil:',

      // Sobre o Habbi (27)
      aboutTitle: 'Sobre o Habbi',
      aboutMascotLabel: 'A inspiração do mascote',
      aboutP1: 'O Habbi é um projeto acadêmico desenvolvido na disciplina de Laboratório de Interfaces do curso de Desenho Industrial da Universidade Federal de Santa Maria (UFSM).',
      aboutP2: 'A proposta surgiu da ideia de criar um aplicativo que tornasse a mudança de hábitos mais leve e acolhedora, unindo design, tecnologia e ilustrações autorais.',
      aboutP3: 'A identidade visual e os personagens foram desenvolvidos especialmente para o projeto, tendo como principal inspiração a Morgana, minha gatinha, que deu origem ao mascote presente nas telas do aplicativo.',
      aboutP4: 'Inicialmente voltado à redução do tabagismo, o Habbi foi pensado para futuramente acompanhar a transformação de outros hábitos, sempre valorizando as pequenas conquistas de cada pessoa.',
      aboutFooter: 'Um projeto feito com cuidado, criatividade e um pouquinho da Morgana. ♡',

      // Minha Conta (28)
      accountTitle: 'Minha Conta',
      accountNameLabel: 'Nome',
      accountEmailLabel: 'E-mail',
      accountPassLabel: 'Nova Senha (opcional)',
      accountMetaLabel: 'Meta Diária (cigarros/dia)',
      accountPackPriceLabel: 'Preço do Maço (R$)',
      accountSaveBtn: 'Salvar Alterações',

      // Economia & Conquista (29)
      savingsTitle: 'Sua Economia',
      savingsSubtitle: 'Veja o valor acumulado ao evitar o cigarro.',
      savingsTotalLabel: 'TOTAL ECONOMIZADO',
      savingsHistoryTitle: 'Histórico de Poupança',
      conquistaTitle: 'Minha conquista',
      conquistaGoalLabel: 'Objetivo',
      conquistaDefaultGoal: 'Minha conquista',
      conquistaChangeChip: 'Trocar',
      conquistaDisclaimer: 'Estimativa baseada nos seus registros.',
      conquistaOfGoal: 'do objetivo',
      conquistaAchieved: '100% atingido!',
      conquistaEstPrefix: 'Economia estimada:',
      conquistaRemainingPrefix: 'Faltam',
      conquistaRemainingDone: 'Objetivo alcançado! Parabéns!',
      conquistaAdjust: 'Ajustar consumo',
      conquistaHistory: 'Histórico',
      conquistaExpensesTitle: 'Seus gastos',
      conquistaExpensesSub: 'Gasto estimado com base nos seus registros',
      conquistaExpensesToday: 'Hoje',
      conquistaExpensesMonth: 'Este mês',
      conquistaExpensesPerCig: 'Custo estimado: {0} / cigarro',
      conquistaInfoAria: 'Sobre a economia estimada',
      backupModalTitle: 'Backup e dados',
      backupModalDesc: 'Seus registros ficam salvos neste dispositivo. Você pode baixar uma cópia ou gerenciar os dados deste perfil.',
      backupModalExport: 'Baixar backup (JSON)',
      backupModalClose: 'Fechar',
      localTestEnvBadge: 'Ambiente de teste local',
      aboutCreatedBy: 'Criado por',
      aboutContact: 'Contato:',
      homeRemoveCigAria: 'Desfazer último cigarro registrado',
      homeRemoveCigToast: '1 cigarro removido',
      goalModalTitle: 'Definir objetivo',
      goalModalSub: 'Defina para onde vai o fruto da sua vitória:',
      goalModalNameLabel: 'O que você quer conquistar?',
      goalModalNamePlaceholder: 'Ex: Viagem, tênis novo, curso...',
      goalModalAmountLabel: 'Quanto custa? (R$)',
      goalModalSave: 'Salvar objetivo',
      savingsSheetTitle: 'Parâmetros de economia',
      savingsCfgHabitual: 'Consumo habitual',
      savingsCfgHabitualDesc: 'Cigarros fumados por dia antes',
      savingsCfgPrice: 'Preço do maço (R$)',
      savingsCfgPriceDesc: 'Valor pago em cada maço',
      savingsCfgPerPack: 'Cigarros por maço',
      savingsCfgPerPackDesc: 'Quantidade padrão por maço',
      savingsCfgFreqTitle: 'Frequência habitual de compra',
      savingsFreqDaily: '1 por dia',
      savingsFreq2Days: 'A cada 2 dias',
      savingsFreq3Days: 'A cada 3 dias',
      savingsFreqWeekly: '1 por semana',
      savingsCfgDone: 'Pronto',
      savingsHistDone: 'Fechar',

      // Modais SOS
      waterTitle: 'Que tal um copo de água?',
      waterDesc: 'Beba devagar, sentindo a temperatura da água. Esse gesto simples quebra o impulso automático e relaxa seu corpo.',
      waterDone: 'Já bebi!',
      waterBack: 'Voltar',
      supportTitle: 'Preciso de alguém',
      supportDesc: 'Você não precisa enfrentar isso sozinho. Escolha uma das opções:',
      supportCvvTitle: 'Ligar 188 (CVV)',
      supportCvvDesc: 'Apoio emocional gratuito e sigiloso 24h',
      supportMsgTitle: 'Mensagem de apoio pronta',
      supportMsgDesc: 'Copiar texto acolhedor para WhatsApp',
      supportClose: 'Fechar',
      feedbackTitle: 'E agora?',
      feedbackDesc: 'Como você está se sentindo após essa pausa?',
      feedbackPassStrong: 'Passou!',
      feedbackPassSmall: 'Consegui superar a vontade',
      feedbackDecStrong: 'Diminuiu',
      feedbackDecSmall: 'Estou me sentindo mais calmo',
      feedbackStillStrong: 'Ainda tô com vontade',
      feedbackStillSmall: 'Quero tentar outra estratégia',
      feedbackSuccessTitle: 'Você conseguiu!',
      feedbackSuccessDesc: 'Mais uma vitória registrada. Cada fissura superada te deixa mais forte e livre.',
      feedbackSuccessBtn: 'Voltar ao início',
      feedbackDecTitle: 'Excelente progresso!',
      feedbackDecDesc: 'A intensidade baixou. Você está no controle e no caminho certo.',
      feedbackStillTitle: 'Tudo bem, respire fundo.',
      feedbackStillDesc: 'A vontade vem em ondas. Vamos tentar outra estratégia simples juntos?',

      // Modal Meta Excedida
      modalMetaTitle: 'Meta Excedida',
      modalMetaQuestion: 'Como esta não é uma recaída, o que deseja fazer com a meta de amanhã?',
      modalMetaKeep: 'Manter em',
      modalMetaReduce: 'Reduzir para',

      // Tutorial Interativo (6 passos)
      tutorialSteps: [
        {
          title: 'Registre seu dia',
          desc: 'Toque aqui para adicionar um cigarro e acompanhar seu consumo.'
        },
        {
          title: 'Errou um registro?',
          desc: 'Abra o calendário, selecione o dia e remova ou ajuste os cigarros registrados.'
        },
        {
          title: 'Explore o Habbi',
          desc: 'Arraste para os lados para encontrar sua economia e os minijogos.'
        },
        {
          title: 'Acompanhe sua economia',
          desc: 'Veja uma estimativa do dinheiro que deixou de gastar com base no seu consumo e nos registros. Não é dinheiro recebido pelo aplicativo.'
        },
        {
          title: 'Uma ajuda quando precisar',
          desc: 'O SOS reúne exercícios e distrações para os momentos de vontade de fumar.'
        },
        {
          title: 'Mais recursos para você',
          desc: 'Encontre exercícios de respiração, atividades de apoio e recursos para o dia a dia.'
        }
      ],
      tutStepOf: 'de',
      tutNext: 'Próximo',
      tutPrev: 'Voltar',
      tutSkip: 'Pular',
      tutFinish: 'Concluir',
      tutToastSkip: 'Tutorial pulado. Você pode revê-lo no Perfil.',
      tutToastDone: 'Tudo pronto para usar o Habbi!'
    },
    EN: {
      langCode: 'EN',
      langName: 'English',
      toastLangChanged: 'Language changed to English',
      splashHeadline: 'Control your habits,<br>track your progress.',
      splashStart: 'START',

      // Welcome (2)
      welcomeTitle: 'Hello!',
      welcomeSubtitle: 'Great to have you here!',
      welcomeLogin: 'Sign In',
      welcomeSignup: 'Create account',

      // Onboarding (3, 4, 5)
      onb1Step: '1 of 3',
      onb1Title: 'Track your limit<br>with 1 tap',
      onb1Desc: 'Log throughout the day to stay within your daily goal.',
      onb1Next: 'ADD',
      onbSkip: 'SKIP',
      onb2Step: '2 of 3',
      onb2Title: 'Identify triggers',
      onb2Desc: 'Gentle nudges to keep going at your own pace.',
      onb2Next: 'Enable reminders',
      onbRemindersEnable: 'Enable reminders',
      onbRemindersSkip: 'Not now',
      onbNotifTitle: 'Time for a quick distraction?',
      onbNotifSub: 'Reminders and tools to support you.',
      onb3Step: '3 of 3',
      onb3Title: 'A new way to<br>take care of yourself.',
      onb3Desc: 'Small daily choices create big changes.',
      onb3Next: "Let's start!",
      onbCompareBadTitle: 'On autopilot',
      onbCompareGoodTitle: 'With Habbi',
      onbCompareBadList: [
        'Habits without noticing',
        'Moments of anxiety',
        'Lack of distractions',
        'Little routine control',
        'Accumulated expenses',
        'Unnoticed progress'
      ],
      onbCompareGoodList: [
        'Quick & easy logging',
        'Support in tough moments',
        'Minigames to distract',
        'Habit calendar',
        'Expense tracking',
        'Daily visual progress'
      ],

      // Journey (6)
      journeyTitle: 'Choose your journey',
      journeyDesc: 'Start where you want to transform.',
      journeySmoking: 'Smoking',
      journeyAvailable: 'Available',
      journeyVape: 'Vape',
      journeyAlcohol: 'Alcohol',
      journeyGambling: 'Gambling',
      journeySocial: 'Social Media',
      journeyProcrastination: 'Procrastination',
      journeyComingSoon: 'Coming soon',
      journeySubmit: 'Continue',

      // Initial Setup (7, 8, 9)
      configTitle: 'Settings',
      configSubmit: 'Continue',
      metaH1: 'How many cigarettes do you smoke a day?',
      metaSliderUnit: 'cigarettes',
      metaYearsQuestion: 'How many years have you smoked?',
      metaYearsLess1: 'Less than 1',
      metaYears1to5: '1 - 5 years',
      metaYears5to10: '5 - 10 years',
      metaYears10plus: '10+ years',
      metaPriceQuestion: 'Average pack price (R$)',
      metaPriceDesc: 'Used to calculate your daily savings.',
      metaTitle: 'How many cigarettes do you smoke a day?',
      metaDesc: 'Set a realistic goal for today.',
      metaUnit: 'cigarettes per day',
      metaSubmit: 'Done!',
      metaSuggestedTitle: 'Goal for today',
      metaSuggestedDesc: 'How about starting with 1 cigarette less than your habitual intake?',
      metaSuggestedBadge: 'Suggested first step',
      metaSuggestedHint: 'You can confirm or adjust this target before starting.',
      metaSuggestedUnit: 'cigarettes today',
      metaHabitualSub: 'Your baseline reference consumption',
      metaHabitualUnit: 'cigarettes per day',

      // Daily Goal Evolution (Home)
      goalPromptTitle: "Today's goal",
      goalPromptMetYesterday: 'You did great yesterday!',
      goalPromptOverYesterday: 'Yesterday was challenging, and that\'s okay!',
      goalPromptNormal: 'New day, new step',
      goalPromptZero: 'Smoke-free goal active!',
      goalPromptZeroDesc: 'You have reached 0 cigarettes goal. Keep smoke-free today?',
      goalPromptKeepBtn: 'Keep at {0}',
      goalPromptReduceBtn: 'Try {0}',
      goalPromptZeroKeepBtn: 'Keep smoke-free',
      goalPromptLaterBtn: 'Decide later',
      goalToastKept: 'Goal maintained at {0} cigarettes today.',
      goalToastReduced: 'New goal set: {0} cigarettes today! One step at a time.',
      goalToastZero: 'Great! 0 cigarettes goal maintained for today.',

      // Goal Adjust in Settings and Profile
      settingsGoalAdjustLabel: 'Daily goal & baseline',
      settingsGoalAdjustDesc: 'Change your daily goal or baseline consumption',
      goalModalTitle: 'Adjust goal & baseline',
      goalModalTodayLabel: 'Current daily goal',
      goalModalTodayDesc: 'Target cigarette limit planned for today.',
      goalModalHabitualLabel: 'Baseline reference consumption',
      goalModalHabitualDesc: 'Used to calculate your daily cumulative savings.',
      goalModalSave: 'Save',
      goalModalCancel: 'Cancel',
      goalToastSaved: 'Goal and baseline updated successfully!',

      motivationsH1: 'What motivates you to change?',
      motivationsDesc: 'Choose as many as you like.',
      motHealth: 'Health',
      motSavings: 'Savings',
      motFamily: 'Family',
      motExercise: 'Exercise',
      motQuality: 'Quality of life',
      motOther: 'Other',

      calcTitle: 'Estimated savings',
      calcDesc: 'See how much you can save.',
      calcSubmit: 'Continue',

      triggersH1: 'What makes you crave smoking?',
      triggersDesc: 'Choose as many as you like.',
      triggersTitle: 'When do cravings hit hardest?',
      trigStress: 'Stress',
      trigAnxiety: 'Anxiety',
      trigWork: 'Work',
      trigCoffee: 'Coffee',
      trigMeals: 'After meals',
      trigSocial: 'Socializing',
      trigBoredom: 'Boredom',
      trigAlcohol: 'Alcohol',
      trigOther: 'Other',
      triggersSubmit: 'Continue',

      // Home (10)
      homeGreetingMorning: 'Good morning,',
      homeGreetingAfternoon: 'Good afternoon,',
      homeGreetingNight: 'Good evening,',
      homeTodaySuffix: 'today',
      homeDaySingular: 'smoke-free day',
      homeDaysPlural: 'smoke-free days',
      homeMetaPctSuffix: "of today's goal",
      homeNoSmoke: 'Smoke-free today',
      homeSosBtn: 'SOS',
      homeAddCig: 'Log cigarette',
      homeSwipeHint: '‹ Swipe to explore ›',

      // Hub Menu
      hubTitle: 'Habbi Menu',
      hubProfileTitle: 'My profile',
      hubProfileDesc: 'Account & personal info',
      hubProgressTitle: 'My progress',
      hubProgressDesc: 'History and evolution',
      hubToolsTitle: 'Tools',
      hubToolsDesc: 'Breathing & support exercises',
      hubSettingsTitle: 'Settings',
      hubSettingsDesc: 'Reminders & preferences',

      // Quick Register (11)
      quickTitle: 'How are you right now?',
      quickNoSmoke: 'Smoke-free today',
      quickUrge: 'Had craving',
      quickSmoke: 'Smoked',
      quickMood: 'How I feel',

      // SOS Hub (12)
      sosTitle: 'One step at a time.',
      sosSubtitle: 'Just the next few minutes.',
      sosTimerTag: 'A 5-minute pause',
      sosTimerStart: 'Start pause',
      sosTimerPause: 'Pause',
      sosTimerResume: 'Continue',
      sosTimerReset: 'Reset',
      sosCardBreathe: 'Breathe',
      sosCardDistract: 'Distract',
      sosCardWater: 'Drink water',
      sosCardCalm: 'Calm down',
      sosSupportBtn: 'I need someone',
      sosDismissBtn: 'Back to SOS',

      // Interventions (13)
      intervBreatheTitle: 'Breathing 4-6',
      intervCalmTitle: 'Calm Down (5-4-3-2-1)',
      intervInhale: 'Inhale',
      intervExhale: 'Exhale',
      intervTip: 'Inhale through your nose for 4s, exhale through mouth for 6s.',
      intervTipPaused: 'Paused. Tap Continue when you are ready.',
      intervDone: 'Finish',
      intervPause: 'Pause',
      intervResume: 'Continue',
      intervNext: 'Next',
      intervPrev: 'Back',

      // Tools (14)
      toolsTitle: 'Tools',
      toolsSubtitle: 'Choose a category.',
      toolsRespTitle: 'Guided Breathing 4-6',
      toolsRespTag: '3 MINUTES • CALM DOWN',
      toolsMiniTitle: '4 Focus Mini-games',
      toolsMiniTag: 'COGNITIVE DISTRACTION',
      toolsSosTitle: 'Cut Craving Now',
      toolsSosTag: 'EMERGENCY • SOS',
      toolsMoodTitle: 'Daily Mood Log',
      toolsMoodTag: 'PATTERNS & EMOTIONS',

      // Mini-games (15)
      minijogosTitle: 'Minigames',
      minijogosCarouselSub: 'Quick exercises to break the urge',
      minijogosToolsSub: 'Exercises and distraction',
      gameMemTitle: 'Memory',
      gameMemSub: 'Find pairs',
      gameSeqTitle: 'Sequence',
      gameSeqSub: 'Repeat the sequence',
      gameSeqInstruction: 'Memorize the sequence and repeat in the same order.',
      gameSeqObserve: 'Watch',
      gameSeqYourTurn: 'Your turn',
      gameSeqProgress: 'Your turn',
      gameSeqSoftError: 'It’s okay! New sequence...',
      gameSeqSuccess: 'Great!',
      gameSeqRoundRecord: 'Round {0} • Best: {1}',
      gameSeqSoundOn: 'Sound on',
      gameSeqSoundOff: 'Muted',
      gameMathTitle: 'Math',
      gameMathSub: 'Mental math',
      gameTapTitle: 'Tap Game',
      gameTapSub: 'Quick leaves',
      gameQuitBtn: 'Quit game',
      gameScorePairs: 'Pairs: {0} • Round {1}',
      gameScoreSeq: 'Sequences: {0} • Round {1}',
      gameScoreLeaves: 'Leaves: {0}',
      gameScoreMath: 'Correct: {0} • Round {1}',
      recordWord: 'Record',
      recordNewToast: '🎉 New record!',

      // Calendar (16)
      calTitle: 'Calendar',
      calToday: 'Today',
      calWeekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      calLegendGoal: 'Within goal',
      calLegendOver: 'Above goal',
      calLegendEmpty: 'No logs',
      calStatClean: 'Smoke-free',
      calStatGoal: 'On target',
      calStatUrges: 'Cravings',
      calGoalNoLogs: 'No logs • Goal {0}/day',
      calGoalExceeded: '{0} / {1} cigarettes • +{2} over goal',
      calGoalInProgress: '{0} / {1} cigarettes • In progress',
      calGoalSmokeFree: '0 / {0} cigarettes • Smoke-free',
      calGoalWithin: '{0} / {1} cigarettes • Within goal',
      calEventEdit: 'Edit',
      calEventRemove: 'Remove',
      calEventAdd: 'Add record',
      calNoLogsDay: 'No records for this day',
      calDemoTitle: '1 cigarette',
      calDemoSub: 'Example for demonstration',
      calMoreLogs: 'View {0} more logs',
      calSeeMoreLogs: 'See other {0} {1}',
      calSeeMoreSingular: 'log',
      calSeeMorePlural: 'logs',
      calShowLess: 'Show less',

      // Quick Register Sheet
      qregAddTitle: 'Add record',
      qregEditTitle: 'Edit record',
      qregNoSmokeBtn: 'Smoke-free today',
      qregUrgeBtn: 'Urge overcome',
      qregDateCigsLbl: 'Consumption on date',
      qregCigsUnit: 'cigarettes',
      qregAddCigBtn: '+1 cigarette',
      qregMoodQuestion: 'How are you feeling?',
      qregMoods: { Feliz: 'Happy', Calmo: 'Calm', Ansioso: 'Anxious', Triste: 'Sad', Irritado: 'Irritated' },
      qregInfluences: { Sono: 'Sleep', Exercício: 'Exercise', Trabalho: 'Work', Relações: 'Relationships', Alimentação: 'Food' },
      qregNotePlaceholder: 'Optional note...',
      qregSaveMoodBtn: 'Save mood',

      // Progress (17)
      progressTitle: 'My progress',
      progressSubtitle: 'History and evolution',
      statCleanDays: 'Smoke-free days',
      statCigsAvoided: 'Cigarettes avoided',
      statSaved: 'Saved',
      statUrges: 'Cravings overcome',

      challengesTitle: 'Challenges',
      historyTitle: 'History',
      historyTimelineSubtitle: 'Timeline of all your logs',
      historyEmptyText: 'No records found yet.',
      insightsTitle: 'Insights',

      // Mood / Triggers (25)
      moodTitle: 'How are you?',
      moodSubtitle: 'Select your mood today (optional):',
      moodInfluenceTitle: 'What is influencing your mood?',
      moodNotesLabel: 'What happened? (optional)',
      moodNotesPlaceholder: 'Write a brief note about your day...',
      moodSubmitBtn: 'Save Log',
      moodHappy: 'Happy',
      moodCalm: 'Calm',
      moodAnxious: 'Anxious',
      moodSad: 'Sad',
      moodIrritated: 'Irritated',

      // Profile (21)
      profileTitle: 'Profile',
      profileVisitor: 'Visitor',
      profileUnauthSub: 'Create an account to save your data',
      profileCreateAccount: 'Create account',
      profileSignIn: 'Sign In',
      profileEdit: 'Edit profile',
      profileHowToUse: 'How to use Habbi',
      profileHowToUseSub: 'View interactive tutorial',
      profileLogout: 'Log out',

      // Settings (22)
      settingsTitle: 'Settings',
      settingsLangLabel: 'Language',
      settingsNotifications: 'Notifications',
      settingsReminders: 'Reminders',
      settingsTheme: 'Theme',
      settingsBackup: 'Backup & data',
      settingsPrivacy: 'Privacy',
      settingsHelp: 'Help & support',
      settingsAbout: 'About Habbi',
      settingsOnboarding: 'Replay onboarding tour',
      settingsDeleteProfileData: 'Delete this profile\'s records',
      settingsRestartTest: 'Restart test experience',
      settingsLogout: 'Log out',
      themeLight: 'Light',
      themeDark: 'Dark',
      splashLoginLink: 'I already have an account · Sign in',
      delModalTitle: 'Delete this profile\'s records?',
      delModalDesc: 'This permanently removes daily logs, mood, savings and records saved in this local profile. Other accounts saved on this device will not be affected.',
      delModalBackup: 'Download JSON backup first',
      delModalConfirm: 'Delete records',
      delModalCancel: 'Cancel',
      delModalDone: 'Profile records deleted.',
      noSmokeOtherDay: 'Smoke-free this day',
      noSmokeModalTitle: 'Replace logs for this date?',
      noSmokeModalDesc: 'This date already has {0} cigarette(s) logged. Clear them and confirm as a smoke-free day?',
      noSmokeModalConfirm: 'Confirm smoke-free day',
      futureDateBlocked: 'Future dates cannot be logged.',
      loginEmailInvalid: 'Please enter a valid email to sign in.',
      registerFieldsInvalid: 'Please enter your name and a valid email to create an account.',
      savingsDayInProgress: 'Day in progress • Consolidates at day end or smoke-free confirmation',
      tabConquista: 'Goal',
      tabHome: 'Home',
      tabMinigames: 'Games',
      toastUndo: 'Undo',
      toastEventRemoved: 'Log removed',
      toastEventRestored: 'Log restored',
      toastCigAdded: 'Cigarette logged',
      overMetaEmpathy: '+{0} over goal — it\'s okay, start fresh on the next one',
      leaveGameTitle: 'Leave current game?',
      leaveGameDesc: 'You have a minigame in progress. Switching tabs now will end this round.',
      leaveGameStay: 'Keep playing',
      leaveGameConfirm: 'Leave game',
      homeTodayWord: 'today',
      savingsPillAria: 'Estimated savings: {0}. Open Goal',
      navCalAria: 'Open calendar',
      navMenuAria: 'Open menu',
      carouselTabsAria: 'Main Habbi sections',
      homeSosAria: 'SOS quick help for cravings',
      homeAddCigAria: 'Log cigarette',
      homeRemoveCigAria: 'Undo last logged cigarette',
      calPrevMonthAria: 'Previous month',
      calNextMonthAria: 'Next month',
      calCloseAria: 'Close calendar',
      calStatusFuture: 'Future date locked',
      calStatusMet: 'Goal met',
      calStatusExceeded: 'Over goal',
      calStatusZero: 'Smoke-free',
      calStatusInProgress: 'In progress',
      calStatusNoLogs: 'No logs',
      calTodayWord: 'Today',
      calLegendInProgress: 'In progress',
      evSmokeTitle: 'Cigarette logged',
      evSmokeDesc: '{0}/{1} today',
      evUrgeTitle: 'Craving overcome',
      evUrgeDesc: 'Urge managed',
      evSosTitle: 'SOS intervention',
      evNoSmokeTodayTitle: 'Smoke-free today',
      evNoSmokeDayTitle: 'Smoke-free day',
      evNoSmokeDesc: '0 cigarettes logged',
      evMoodPrefix: 'Mood',
      evMoodFallbackTitle: 'Mood log',
      evMoodFallbackDesc: 'Feeling logged',
      ethicalNote: 'Habbi is an academic behavioral support prototype and does not replace medical or psychological care.',
      histEmptyTitle: 'No logs saved yet',
      histEmptyDesc: 'Your daily logs will appear here automatically.',

      // Login / Signup (23, 24)
      loginTitle: 'Sign In',
      loginSubtitle: 'Access your Habbi account',
      loginGuest: 'Continue as guest →',
      signupTitle: 'Create account',
      signupSubtitle: 'Start your smoke-free journey',
      signupGuest: 'Continue without account →',

      // Avatar (26)
      avatarTitle: 'Choose your Avatar',
      avatarSubtitle: 'Select a mascot for your profile:',

      // About (27)
      aboutTitle: 'About Habbi',
      aboutMascotLabel: 'The mascot inspiration',
      aboutP1: 'Habbi is an academic project created in the Interface Laboratory course of the Industrial Design program at the Federal University of Santa Maria (UFSM).',
      aboutP2: 'The project was born to make habit change gentle and welcoming, blending design, technology, and original artwork.',
      aboutP3: 'The visual identity and characters were designed specifically for the project, inspired by Morgana, my cat, who became the mascot across the app.',
      aboutP4: 'Initially focused on reducing smoking, Habbi is designed to accompany other habit transformations in the future, celebrating every small victory.',
      aboutFooter: 'A project crafted with care, creativity, and a touch of Morgana. ♡',

      // My Account (28)
      accountTitle: 'My Account',
      accountNameLabel: 'Name',
      accountEmailLabel: 'Email',
      accountPassLabel: 'New Password (optional)',
      accountMetaLabel: 'Daily Goal (cigs/day)',
      accountPackPriceLabel: 'Pack Price (R$)',
      accountSaveBtn: 'Save Changes',

      // Savings & Conquest (29)
      savingsTitle: 'Your Savings',
      savingsSubtitle: 'Track what you save by skipping cigarettes.',
      savingsTotalLabel: 'TOTAL SAVED',
      savingsHistoryTitle: 'Savings History',
      conquistaTitle: 'My achievement',
      conquistaGoalLabel: 'Goal',
      conquistaDefaultGoal: 'My achievement',
      conquistaChangeChip: 'Change',
      conquistaDisclaimer: 'Estimate based on your logs.',
      conquistaOfGoal: 'of goal',
      conquistaAchieved: '100% achieved!',
      conquistaEstPrefix: 'Estimated savings:',
      conquistaRemainingPrefix: 'Remaining:',
      conquistaRemainingDone: 'Goal reached! Congratulations!',
      conquistaAdjust: 'Adjust intake',
      conquistaHistory: 'History',
      conquistaExpensesTitle: 'Your spending',
      conquistaExpensesSub: 'Estimated spending based on your logs',
      conquistaExpensesToday: 'Today',
      conquistaExpensesMonth: 'This month',
      conquistaExpensesPerCig: 'Estimated cost: {0} / cigarette',
      conquistaInfoAria: 'About estimated savings',
      backupModalTitle: 'Backup and data',
      backupModalDesc: 'Your records stay saved on this device. You can download a copy or manage this profile\'s data.',
      backupModalExport: 'Download backup (JSON)',
      backupModalClose: 'Close',
      localTestEnvBadge: 'Local test environment',
      aboutCreatedBy: 'Created by',
      aboutContact: 'Contact:',
      homeRemoveCigAria: 'Undo last logged cigarette',
      homeRemoveCigToast: '1 cigarette removed',
      goalModalTitle: 'Set goal',
      goalModalSub: 'Choose where the reward of your victory goes:',
      goalModalNameLabel: 'What do you want to achieve?',
      goalModalNamePlaceholder: 'E.g.: Trip, new shoes, course...',
      goalModalAmountLabel: 'Estimated price (R$)',
      goalModalSave: 'Save goal',
      savingsSheetTitle: 'Savings parameters',
      savingsCfgHabitual: 'Habitual intake',
      savingsCfgHabitualDesc: 'Cigarettes smoked daily previously',
      savingsCfgPrice: 'Pack price (R$)',
      savingsCfgPriceDesc: 'Price paid per cigarette pack',
      savingsCfgPerPack: 'Cigarettes per pack',
      savingsCfgPerPackDesc: 'Standard quantity per pack',
      savingsCfgFreqTitle: 'Habitual buying frequency',
      savingsFreqDaily: '1 per day',
      savingsFreq2Days: 'Every 2 days',
      savingsFreq3Days: 'Every 3 days',
      savingsFreqWeekly: '1 per week',
      savingsCfgDone: 'Done',
      savingsHistDone: 'Close',

      // SOS Modals
      waterTitle: 'How about a glass of water?',
      waterDesc: 'Drink slowly, feeling the temperature of the water. This simple gesture breaks the automatic urge and relaxes your body.',
      waterDone: 'Done!',
      waterBack: 'Back',
      supportTitle: 'I need someone',
      supportDesc: 'You do not have to go through this alone. Choose an option:',
      supportCvvTitle: 'Call 988 (Helpline)',
      supportCvvDesc: 'Free and confidential 24/7 emotional support',
      supportMsgTitle: 'Ready support message',
      supportMsgDesc: 'Copy supportive text for WhatsApp',
      supportClose: 'Close',
      feedbackTitle: 'What now?',
      feedbackDesc: 'How are you feeling after this pause?',
      feedbackPassStrong: 'Passed!',
      feedbackPassSmall: 'I overcame the craving',
      feedbackDecStrong: 'Decreased',
      feedbackDecSmall: 'I feel calmer now',
      feedbackStillStrong: 'Still craving',
      feedbackStillSmall: 'I want another strategy',
      feedbackSuccessTitle: 'You did it!',
      feedbackSuccessDesc: 'Another victory logged. Every craving overcome makes you stronger and freer.',
      feedbackSuccessBtn: 'Back to home',
      feedbackDecTitle: 'Great progress!',
      feedbackDecDesc: 'The intensity dropped. You are in control and on track.',
      feedbackStillTitle: 'It is okay, take a deep breath.',
      feedbackStillDesc: 'Cravings come in waves. Let us try another simple strategy together.',

      // Goal Exceeded Modal
      modalMetaTitle: 'Goal Exceeded',
      modalMetaQuestion: 'Since this is not a relapse, what would you like to do with tomorrow\'s goal?',
      modalMetaKeep: 'Keep at',
      modalMetaReduce: 'Reduce to',

      // Interactive Tutorial (6 steps)
      tutorialSteps: [
        {
          title: 'Log your day',
          desc: 'Tap here to add a cigarette and track your daily intake.'
        },
        {
          title: 'Made a mistake logging?',
          desc: 'Open the calendar, select the day, and remove or adjust logged cigarettes.'
        },
        {
          title: 'Explore Habbi',
          desc: 'Swipe sideways to find your savings and mini-games.'
        },
        {
          title: 'Track your savings',
          desc: 'See an estimate of the money you stopped spending based on your intake and logs. This is not money received by the app.'
        },
        {
          title: 'Help when you need it',
          desc: 'SOS gathers exercises and distractions for moments of intense cravings.'
        },
        {
          title: 'More resources for you',
          desc: 'Find breathing exercises, support activities, and everyday tools.'
        }
      ],
      tutStepOf: 'of',
      tutNext: 'Next',
      tutPrev: 'Back',
      tutSkip: 'Skip',
      tutFinish: 'Done',
      tutToastSkip: 'Tutorial skipped. You can review it in Profile.',
      tutToastDone: 'All set to use Habbi!'
    },
    ES: {
      langCode: 'ES',
      langName: 'Español',
      toastLangChanged: 'Idioma cambiado a Español',
      splashHeadline: 'Controla tus hábitos,<br>sigue tu evolución.',
      splashStart: 'EMPEZAR',

      // Welcome (2)
      welcomeTitle: '¡Hola!',
      welcomeSubtitle: '¡Qué bueno verte por aquí!',
      welcomeLogin: 'Iniciar sesión',
      welcomeSignup: 'Crear cuenta',

      // Onboarding (3, 4, 5)
      onb1Step: '1 de 3',
      onb1Title: 'Sigue tu límite<br>con 1 toque',
      onb1Desc: 'Registra a lo largo del día para mantenerte en tu meta diaria.',
      onb1Next: 'AGREGAR',
      onbSkip: 'OMITIR',
      onb2Step: '2 de 3',
      onb2Title: 'Identifica disparadores',
      onb2Desc: 'Pequeños incentivos para seguir a tu propio ritmo.',
      onb2Next: 'Activar recordatorios',
      onbRemindersEnable: 'Activar recordatorios',
      onbRemindersSkip: 'Ahora no',
      onbNotifTitle: '¿Qué tal distraer la mente?',
      onbNotifSub: 'Recordatorios y herramientas para acompañarte.',
      onb3Step: '3 de 3',
      onb3Title: 'Una nueva forma de<br>cuidar de ti.',
      onb3Desc: 'Pequeñas decisiones diarias generan grandes cambios.',
      onb3Next: '¡Vamos a empezar!',
      onbCompareBadTitle: 'En piloto<br>automático',
      onbCompareGoodTitle: 'Con Habbi',
      onbCompareBadList: [
        'Hábitos sin darte cuenta',
        'Momentos de ansiedad',
        'Falta de distracciones',
        'Poco control de la rutina',
        'Gastos acumulados',
        'Progreso desapercibido'
      ],
      onbCompareGoodList: [
        'Registro rápido y fácil',
        'Apoyo en momentos difíciles',
        'Minijuegos para distraer',
        'Calendario de hábitos',
        'Control de gastos',
        'Progreso visual diario'
      ],

      // Journey (6)
      journeyTitle: 'Elige tu camino',
      journeyDesc: 'Comienza por donde quieras transformar.',
      journeySmoking: 'Tabaquismo',
      journeyAvailable: 'Disponible',
      journeyVape: 'Vape',
      journeyAlcohol: 'Alcohol',
      journeyGambling: 'Apuestas',
      journeySocial: 'Redes Sociales',
      journeyProcrastination: 'Procrastinación',
      journeyComingSoon: 'Muy pronto',
      journeySubmit: 'Continuar',

      // Initial Setup (7, 8, 9)
      configTitle: 'Configuración',
      configSubmit: 'Continuar',
      metaH1: '¿Cuántos cigarrillos fumas al día?',
      metaSliderUnit: 'cigarrillos',
      metaYearsQuestion: '¿Cuántos años llevas fumando?',
      metaYearsLess1: 'Menos de 1',
      metaYears1to5: '1 - 5 años',
      metaYears5to10: '5 - 10 años',
      metaYears10plus: '10+ años',
      metaPriceQuestion: 'Precio medio de la cajetilla (R$)',
      metaPriceDesc: 'Usado para calcular tu ahorro diario.',
      metaTitle: '¿Cuántos cigarrillos fumas al día?',
      metaDesc: 'Define una meta realista para hoy.',
      metaUnit: 'cigarrillos por día',
      metaSubmit: '¡Listo!',
      metaSuggestedTitle: 'Meta para hoy',
      metaSuggestedDesc: '¿Qué tal empezar con 1 cigarrillo menos de tu consumo habitual?',
      metaSuggestedBadge: 'Primer paso sugerido',
      metaSuggestedHint: 'Puedes confirmar o ajustar este valor antes de iniciar.',
      metaSuggestedUnit: 'cigarrillos hoy',
      metaHabitualSub: 'Tu consumo habitual de referencia',
      metaHabitualUnit: 'cigarrillos por día',

      // Evolución de Meta Diaria (Home)
      goalPromptTitle: 'Meta de hoy',
      goalPromptMetYesterday: '¡Ayer lo hiciste genial!',
      goalPromptOverYesterday: '¡Ayer fue un día desafiante, y no pasa nada!',
      goalPromptNormal: 'Nuevo día, nuevo paso',
      goalPromptZero: '¡Meta sin fumar activa!',
      goalPromptZeroDesc: 'Has alcanzado la meta de 0 cigarrillos. ¿Continuar sin fumar hoy?',
      goalPromptKeepBtn: 'Continuar con {0}',
      goalPromptReduceBtn: 'Intentar {0}',
      goalPromptZeroKeepBtn: 'Continuar sin fumar',
      goalPromptLaterBtn: 'Decidir después',
      goalToastKept: 'Meta mantenida en {0} cigarrillos hoy.',
      goalToastReduced: '¡Nueva meta definida: {0} cigarrillos hoy! Paso a paso.',
      goalToastZero: '¡Excelente! Meta de 0 cigarrillos mantenida para hoy.',

      // Ajuste de Meta en Configuración y Perfil
      settingsGoalAdjustLabel: 'Meta diaria y consumo',
      settingsGoalAdjustDesc: 'Cambia tu meta diaria o consumo habitual',
      goalModalTitle: 'Ajustar meta y consumo',
      goalModalTodayLabel: 'Meta diaria actual',
      goalModalTodayDesc: 'Límite de cigarrillos planeado para hoy.',
      goalModalHabitualLabel: 'Consumo habitual de referencia',
      goalModalHabitualDesc: 'Usado para calcular tu ahorro diario acumulado.',
      goalModalSave: 'Guardar',
      goalModalCancel: 'Cancelar',
      goalToastSaved: '¡Meta y consumo actualizados con éxito!',

      motivationsH1: '¿Qué te motiva a cambiar?',
      motivationsDesc: 'Elige tantas como quieras.',
      motHealth: 'Salud',
      motSavings: 'Ahorro',
      motFamily: 'Familia',
      motExercise: 'Ejercicio',
      motQuality: 'Calidad de vida',
      motOther: 'Otro',

      calcTitle: 'Ahorro estimado',
      calcDesc: 'Mira cuánto puedes ahorrar.',
      calcSubmit: 'Continuar',

      triggersH1: '¿Qué te hace querer fumar?',
      triggersDesc: 'Elige tantas como quieras.',
      triggersTitle: '¿En qué momentos sientes más ganas?',
      trigStress: 'Estrés',
      trigAnxiety: 'Ansiedad',
      trigWork: 'Trabajo',
      trigCoffee: 'Café',
      trigMeals: 'Después de comer',
      trigSocial: 'Socialización',
      trigBoredom: 'Aburrimiento',
      trigAlcohol: 'Bebida alcohólica',
      trigOther: 'Otro',
      triggersSubmit: 'Continuar',

      // Home (10)
      homeGreetingMorning: 'Buenos días,',
      homeGreetingAfternoon: 'Buenas tardes,',
      homeGreetingNight: 'Buenas noches,',
      homeTodaySuffix: 'hoy',
      homeDaySingular: 'día sin fumar',
      homeDaysPlural: 'días sin fumar',
      homeMetaPctSuffix: 'de la meta de hoy',
      homeNoSmoke: 'No fumé hoy',
      homeSosBtn: 'SOS',
      homeAddCig: 'Registrar cigarrillo',
      homeSwipeHint: '‹ Desliza para explorar ›',

      // Hub Menu
      hubTitle: 'Menú de Habbi',
      hubProfileTitle: 'Mi perfil',
      hubProfileDesc: 'Cuenta e información personal',
      hubProgressTitle: 'Mi progreso',
      hubProgressDesc: 'Historial y evolución',
      hubToolsTitle: 'Herramientas',
      hubToolsDesc: 'Respiración y ejercicios de apoyo',
      hubSettingsTitle: 'Configuraciones',
      hubSettingsDesc: 'Recordatorios y preferencias',

      // Quick Register (11)
      quickTitle: '¿Cómo estás ahora?',
      quickNoSmoke: 'No fumé hoy',
      quickUrge: 'Tuve ganas',
      quickSmoke: 'Fumé',
      quickMood: 'Cómo me siento',

      // SOS Hub (12)
      sosTitle: 'Paso a paso.',
      sosSubtitle: 'Solo los próximos minutos.',
      sosTimerTag: 'Una pausa de 5 minutos',
      sosTimerStart: 'Comenzar pausa',
      sosTimerPause: 'Pausar',
      sosTimerResume: 'Continuar',
      sosTimerReset: 'Reiniciar',
      sosCardBreathe: 'Respirar',
      sosCardDistract: 'Distraer',
      sosCardWater: 'Beber agua',
      sosCardCalm: 'Calmarme',
      sosSupportBtn: 'Necesito a alguien',
      sosDismissBtn: 'Volver al SOS',

      // Interventions (13)
      intervBreatheTitle: 'Respiración 4-6',
      intervCalmTitle: 'Calmarme (5-4-3-2-1)',
      intervInhale: 'Inhala',
      intervExhale: 'Exhala',
      intervTip: 'Inhala por la nariz 4s y exhala por la boca 6s.',
      intervTipPaused: 'Pausado. Toca Continuar cuando estés listo.',
      intervDone: 'Completar',
      intervPause: 'Pausar',
      intervResume: 'Continuar',
      intervNext: 'Siguiente',
      intervPrev: 'Anterior',

      // Tools (14)
      toolsTitle: 'Herramientas',
      toolsSubtitle: 'Elige una categoría.',
      toolsRespTitle: 'Respiración Guiada 4-6',
      toolsRespTag: '3 MINUTOS • CALMARME',
      toolsMiniTitle: '4 Minijuegos de Enfoque',
      toolsMiniTag: 'DISTRACCIÓN COGNITIVA',
      toolsSosTitle: 'Cortar Ansiedad Ahora',
      toolsSosTag: 'EMERGENCIA • SOS',
      toolsMoodTitle: 'Registrar Estado de Ánimo',
      toolsMoodTag: 'PATRONES Y EMOCIONES',

      // Mini-games (15)
      minijogosTitle: 'Minijuegos',
      minijogosCarouselSub: 'Ejercicios rápidos para romper el impulso',
      minijogosToolsSub: 'Ejercicios y distracción',
      gameMemTitle: 'Memoria',
      gameMemSub: 'Encuentra las parejas',
      gameSeqTitle: 'Secuencia',
      gameSeqSub: 'Repite la secuencia',
      gameSeqInstruction: 'Memoriza la secuencia y repite en el mismo orden.',
      gameSeqObserve: 'Observa',
      gameSeqYourTurn: 'Tu turno',
      gameSeqProgress: 'Tu turno',
      gameSeqSoftError: '¡Todo bien! Nueva secuencia...',
      gameSeqSuccess: '¡Perfecto!',
      gameSeqRoundRecord: 'Ronda {0} • Récord: {1}',
      gameSeqSoundOn: 'Sonido activado',
      gameSeqSoundOff: 'Sin sonido',
      gameMathTitle: 'Matemática',
      gameMathSub: 'Cálculo mental',
      gameTapTitle: 'Juego del Tap',
      gameTapSub: 'Hojas ágiles',
      gameQuitBtn: 'Salir del juego',
      gameScorePairs: 'Parejas: {0} • Ronda {1}',
      gameScoreSeq: 'Secuencias: {0} • Ronda {1}',
      gameScoreLeaves: 'Hojas: {0}',
      gameScoreMath: 'Aciertos: {0} • Ronda {1}',
      recordWord: 'Récord',
      recordNewToast: '🎉 ¡Nuevo récord!',

      // Calendar (16)
      calTitle: 'Calendario',
      calToday: 'Hoy',
      calWeekdays: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
      calLegendGoal: 'Dentro de la meta',
      calLegendOver: 'Sobre la meta',
      calLegendEmpty: 'Sin registro',
      calStatClean: 'Sin fumar',
      calStatGoal: 'En la meta',
      calStatUrges: 'Deseos',
      calGoalNoLogs: 'Sin registros • Meta {0}/día',
      calGoalExceeded: '{0} / {1} cigarrillos • +{2} sobre la meta',
      calGoalInProgress: '{0} / {1} cigarrillos • En progreso',
      calGoalSmokeFree: '0 / {0} cigarrillos • Sin fumar',
      calGoalWithin: '{0} / {1} cigarrillos • Dentro de la meta',
      calEventEdit: 'Editar',
      calEventRemove: 'Eliminar',
      calEventAdd: 'Añadir registro',
      calNoLogsDay: 'Sin registros para este día',
      calDemoTitle: '1 cigarrillo',
      calDemoSub: 'Ejemplo de demostración',
      calMoreLogs: 'Ver {0} registros más',
      calSeeMoreLogs: 'Ver otros {0} {1}',
      calSeeMoreSingular: 'registro',
      calSeeMorePlural: 'registros',
      calShowLess: 'Mostrar menos',

      // Quick Register Sheet
      qregAddTitle: 'Agregar registro',
      qregEditTitle: 'Editar registro',
      qregNoSmokeBtn: 'No fumé hoy',
      qregUrgeBtn: 'Deseo superado',
      qregDateCigsLbl: 'Consumo en la fecha',
      qregCigsUnit: 'cigarrillos',
      qregAddCigBtn: '+1 cigarrillo',
      qregMoodQuestion: '¿Cómo te sientes?',
      qregMoods: { Feliz: 'Feliz', Calmo: 'Calmado', Ansioso: 'Ansioso', Triste: 'Triste', Irritado: 'Irritado' },
      qregInfluences: { Sono: 'Sueño', Exercício: 'Ejercicio', Trabalho: 'Trabajo', Relações: 'Relaciones', Alimentação: 'Alimentación' },
      qregNotePlaceholder: 'Nota opcional...',
      qregSaveMoodBtn: 'Guardar ánimo',

      // Progress (17)
      progressTitle: 'Mi progreso',
      progressSubtitle: 'Historial y evolución',
      statCleanDays: 'Días sin fumar',
      statCigsAvoided: 'Cigarrillos evitados',
      statSaved: 'Ahorrado',
      statUrges: 'Deseos superados',

      challengesTitle: 'Desafíos',
      historyTitle: 'Historial',
      historyTimelineSubtitle: 'Línea de tiempo de todos tus registros',
      historyEmptyText: 'Aún no se encontraron registros.',
      insightsTitle: 'Insights',

      // Mood / Triggers (25)
      moodTitle: '¿Cómo estás?',
      moodSubtitle: 'Selecciona tu ánimo hoy (opcional):',
      moodInfluenceTitle: '¿Qué influye en tu estado de ánimo?',
      moodNotesLabel: '¿Qué pasó? (opcional)',
      moodNotesPlaceholder: 'Escribe un breve comentario sobre tu día...',
      moodSubmitBtn: 'Guardar Registro',
      moodHappy: 'Feliz',
      moodCalm: 'Tranquilo',
      moodAnxious: 'Ansioso',
      moodSad: 'Triste',
      moodIrritated: 'Irritado',

      // Profile (21)
      profileTitle: 'Perfil',
      profileVisitor: 'Visitante',
      profileUnauthSub: 'Crea una cuenta para guardar tus datos',
      profileCreateAccount: 'Crear cuenta',
      profileSignIn: 'Iniciar sesión',
      profileEdit: 'Editar perfil',
      profileHowToUse: 'Cómo usar Habbi',
      profileHowToUseSub: 'Ver tutorial interactivo',
      profileLogout: 'Cerrar sesión',

      // Settings (22)
      settingsTitle: 'Configuraciones',
      settingsLangLabel: 'Idioma',
      settingsNotifications: 'Notificaciones',
      settingsReminders: 'Recordatorios',
      settingsTheme: 'Tema',
      settingsBackup: 'Copia y datos',
      settingsPrivacy: 'Privacidad',
      settingsHelp: 'Ayuda y soporte',
      settingsAbout: 'Sobre Habbi',
      settingsOnboarding: 'Rehacer tour inicial (Onboarding)',
      settingsDeleteProfileData: 'Borrar registros de este perfil',
      settingsRestartTest: 'Reiniciar experiencia de prueba',
      settingsLogout: 'Salir',
      themeLight: 'Claro',
      themeDark: 'Oscuro',
      splashLoginLink: 'Ya tengo cuenta · Entrar',
      delModalTitle: '¿Borrar registros de este perfil?',
      delModalDesc: 'Esta acción elimina permanentemente los registros diarios, ánimo, ahorro y récords guardados en este perfil local. Otras cuentas guardadas en este dispositivo no se verán afectadas.',
      delModalBackup: 'Descargar respaldo JSON antes',
      delModalConfirm: 'Borrar registros',
      delModalCancel: 'Cancelar',
      delModalDone: 'Registros de este perfil borrados.',
      noSmokeOtherDay: 'No fumé este día',
      noSmokeModalTitle: '¿Reemplazar registros de esta fecha?',
      noSmokeModalDesc: 'Esta fecha ya tiene {0} cigarrillo(s) registrado(s). ¿Deseas borrarlos y confirmar el día sin fumar?',
      noSmokeModalConfirm: 'Confirmar día sin fumar',
      futureDateBlocked: 'No es posible registrar en fechas futuras.',
      loginEmailInvalid: 'Ingresa un correo válido para iniciar sesión.',
      registerFieldsInvalid: 'Ingresa tu nombre y un correo válido para crear tu cuenta.',
      savingsDayInProgress: 'Día en curso • Se consolida al finalizar el día o confirmar sin fumar',
      tabConquista: 'Logro',
      tabHome: 'Inicio',
      tabMinigames: 'Juegos',
      toastUndo: 'Deshacer',
      toastEventRemoved: 'Registro eliminado',
      toastEventRestored: 'Registro restaurado',
      toastCigAdded: 'Cigarrillo registrado',
      overMetaEmpathy: '+{0} sobre la meta — está bien, vuelve a empezar en el próximo',
      leaveGameTitle: '¿Salir de la partida actual?',
      leaveGameDesc: 'Tienes un minijuego en curso. Si cambias de pestaña ahora, esta partida terminará.',
      leaveGameStay: 'Seguir jugando',
      leaveGameConfirm: 'Salir de la partida',
      homeTodayWord: 'hoy',
      savingsPillAria: 'Ahorro estimado: {0}. Abrir Logro',
      navCalAria: 'Abrir calendario',
      navMenuAria: 'Abrir menú',
      carouselTabsAria: 'Secciones principales de Habbi',
      homeSosAria: 'SOS ayuda rápida para momentos de antojo',
      homeAddCigAria: 'Registrar cigarrillo',
      homeRemoveCigAria: 'Deshacer último cigarrillo registrado',
      calPrevMonthAria: 'Mes anterior',
      calNextMonthAria: 'Mes siguiente',
      calCloseAria: 'Cerrar calendario',
      calStatusFuture: 'Fecha futura bloqueada',
      calStatusMet: 'Meta cumplida',
      calStatusExceeded: 'Sobre la meta',
      calStatusZero: 'Sin consumo',
      calStatusInProgress: 'En curso',
      calStatusNoLogs: 'Sin registros',
      calTodayWord: 'Hoy',
      calLegendInProgress: 'En curso',
      evSmokeTitle: 'Cigarrillo registrado',
      evSmokeDesc: '{0}/{1} en el día',
      evUrgeTitle: 'Antojo superado',
      evUrgeDesc: 'Impulso controlado',
      evSosTitle: 'Intervención SOS',
      evNoSmokeTodayTitle: 'No fumé hoy',
      evNoSmokeDayTitle: 'No fumé este día',
      evNoSmokeDesc: '0 cigarrillos en el día',
      evMoodPrefix: 'Ánimo',
      evMoodFallbackTitle: 'Registro de emociones',
      evMoodFallbackDesc: 'Emoción registrada',
      ethicalNote: 'Habbi es un prototipo académico de apoyo conductual y no sustituye el acompañamiento médico ni psicológico.',
      histEmptyTitle: 'Aún no hay registros guardados',
      histEmptyDesc: 'Tus registros diarios aparecerán aquí automáticamente.',

      // Login / Signup (23, 24)
      loginTitle: 'Iniciar sesión',
      loginSubtitle: 'Accede a tu cuenta Habbi',
      loginGuest: 'Continuar como invitado →',
      signupTitle: 'Crear cuenta',
      signupSubtitle: 'Comienza tu camino sin humo',
      signupGuest: 'Continuar sin cuenta →',

      // Avatar (26)
      avatarTitle: 'Elige tu Avatar',
      avatarSubtitle: 'Elige una mascota para tu perfil:',

      // About (27)
      aboutTitle: 'Sobre Habbi',
      aboutMascotLabel: 'La inspiración de la mascota',
      aboutP1: 'Habbi es un proyecto académico desarrollado en el Laboratorio de Interfaces del curso de Diseño Industrial de la Universidad Federal de Santa María (UFSM).',
      aboutP2: 'La propuesta surgió para hacer el cambio de hábitos más suave y acogedor, combinando diseño, tecnología e ilustraciones originales.',
      aboutP3: 'La identidad visual y los personajes fueron diseñados especialmente para el proyecto, inspirados en Morgana, mi gatita, que dio vida a la mascota en la app.',
      aboutP4: 'Inicialmente enfocado en la reducción del tabaquismo, Habbi está pensado para acompañar otras transformaciones de hábitos en el futuro.',
      aboutFooter: 'Un proyecto hecho con cariño, creatividad y un toque de Morgana. ♡',

      // My Account (28)
      accountTitle: 'Mi Cuenta',
      accountNameLabel: 'Nombre',
      accountEmailLabel: 'Correo',
      accountPassLabel: 'Nueva Contraseña (opcional)',
      accountMetaLabel: 'Meta Diaria (cigarrillos/día)',
      accountPackPriceLabel: 'Precio de la Cajetilla (R$)',
      accountSaveBtn: 'Guardar Cambios',

      // Savings & Conquest (29)
      savingsTitle: 'Tu Ahorro',
      savingsSubtitle: 'Sigue lo que ahorras al evitar el cigarrillo.',
      savingsTotalLabel: 'TOTAL AHORRADO',
      savingsHistoryTitle: 'Historial de Ahorro',
      conquistaTitle: 'Mi logro',
      conquistaGoalLabel: 'Objetivo',
      conquistaDefaultGoal: 'Mi logro',
      conquistaChangeChip: 'Cambiar',
      conquistaDisclaimer: 'Estimación basada en tus registros.',
      conquistaOfGoal: 'del objetivo',
      conquistaAchieved: '¡100% alcanzado!',
      conquistaEstPrefix: 'Ahorro estimado:',
      conquistaRemainingPrefix: 'Faltan',
      conquistaRemainingDone: '¡Objetivo alcanzado! ¡Felicitaciones!',
      conquistaAdjust: 'Ajustar consumo',
      conquistaHistory: 'Historial',
      conquistaExpensesTitle: 'Tus gastos',
      conquistaExpensesSub: 'Gasto estimado según tus registros',
      conquistaExpensesToday: 'Hoy',
      conquistaExpensesMonth: 'Este mes',
      conquistaExpensesPerCig: 'Costo estimado: {0} / cigarrillo',
      conquistaInfoAria: 'Sobre el ahorro estimado',
      backupModalTitle: 'Copia de seguridad y datos',
      backupModalDesc: 'Tus registros se guardan en este dispositivo. Puedes descargar una copia o gestionar los datos de este perfil.',
      backupModalExport: 'Descargar copia (JSON)',
      backupModalClose: 'Cerrar',
      localTestEnvBadge: 'Entorno de prueba local',
      aboutCreatedBy: 'Creado por',
      aboutContact: 'Contacto:',
      homeRemoveCigAria: 'Deshacer último cigarrillo registrado',
      homeRemoveCigToast: '1 cigarrillo eliminado',
      goalModalTitle: 'Definir objetivo',
      goalModalSub: 'Define hacia dónde irá el fruto de tu victoria:',
      goalModalNameLabel: '¿Qué quieres conquistar?',
      goalModalNamePlaceholder: 'Ej: Viaje, zapatillas nuevas, curso...',
      goalModalAmountLabel: 'Precio estimado (R$)',
      goalModalSave: 'Guardar objetivo',
      savingsSheetTitle: 'Parámetros de ahorro',
      savingsCfgHabitual: 'Consumo habitual',
      savingsCfgHabitualDesc: 'Cigarrillos fumados por día antes',
      savingsCfgPrice: 'Precio de la cajetilla (R$)',
      savingsCfgPriceDesc: 'Precio pagado por cada cajetilla',
      savingsCfgPerPack: 'Cigarrillos por cajetilla',
      savingsCfgPerPackDesc: 'Cantidad estándar por cajetilla',
      savingsCfgFreqTitle: 'Frecuencia habitual de compra',
      savingsFreqDaily: '1 al día',
      savingsFreq2Days: 'Cada 2 días',
      savingsFreq3Days: 'Cada 3 días',
      savingsFreqWeekly: '1 por semana',
      savingsCfgDone: 'Listo',
      savingsHistDone: 'Cerrar',

      // SOS Modals
      waterTitle: '¿Qué tal un vaso de agua?',
      waterDesc: 'Bebe despacio, sintiendo la temperatura del agua. Este simple gesto rompe el impulso automático y relaja tu cuerpo.',
      waterDone: '¡Ya bebí!',
      waterBack: 'Volver',
      supportTitle: 'Necesito a alguien',
      supportDesc: 'No tienes que enfrentar esto solo. Elige una de las opciones:',
      supportCvvTitle: 'Llamar 024 (Línea de ayuda)',
      supportCvvDesc: 'Apoyo emocional gratuito y confidencial 24h',
      supportMsgTitle: 'Mensaje de apoyo listo',
      supportMsgDesc: 'Copiar texto de apoyo para WhatsApp',
      supportClose: 'Cerrar',
      feedbackTitle: '¿Y ahora?',
      feedbackDesc: '¿Cómo te sientes tras esta pausa?',
      feedbackPassStrong: '¡Se pasó!',
      feedbackPassSmall: 'Logré superar las ganas',
      feedbackDecStrong: 'Disminuyó',
      feedbackDecSmall: 'Me siento más tranquilo',
      feedbackStillStrong: 'Aún tengo ganas',
      feedbackStillSmall: 'Quiero intentar otra estrategia',
      feedbackSuccessTitle: '¡Lo lograste!',
      feedbackSuccessDesc: 'Otra victoria registrada. Cada deseo superado te hace más fuerte y libre.',
      feedbackSuccessBtn: 'Volver al inicio',
      feedbackDecTitle: '¡Excelente progreso!',
      feedbackDecDesc: 'La intensidad bajó. Estás en control y en el camino correcto.',
      feedbackStillTitle: 'Todo bien, respira hondo.',
      feedbackStillDesc: 'El deseo viene en olas. Probemos otra estrategia sencilla juntos.',

      // Goal Exceeded Modal
      modalMetaTitle: 'Meta Excedida',
      modalMetaQuestion: 'Como esto no es una recaída, ¿qué deseas hacer con la meta de mañana?',
      modalMetaKeep: 'Mantener en',
      modalMetaReduce: 'Reducir a',

      // Interactive Tutorial (6 steps)
      tutorialSteps: [
        {
          title: 'Registra tu día',
          desc: 'Toca aquí para añadir un cigarrillo y seguir tu consumo.'
        },
        {
          title: '¿Te equivocaste de registro?',
          desc: 'Abre el calendario, selecciona el día y elimina o ajusta los cigarrillos registrados.'
        },
        {
          title: 'Explora Habbi',
          desc: 'Desliza hacia los lados para encontrar tu ahorro y los minijuegos.'
        },
        {
          title: 'Sigue tus ahorros',
          desc: 'Consulta una estimación del dinero que dejaste de gastar según tu consumo y registros. No es dinero recibido por la aplicación.'
        },
        {
          title: 'Ayuda cuando la necesites',
          desc: 'SOS reúne ejercicios y distracciones para los momentos de ganas de fumar.'
        },
        {
          title: 'Más recursos para ti',
          desc: 'Encuentra ejercicios de respiración, actividades de apoyo y herramientas para el día a día.'
        }
      ],
      tutStepOf: 'de',
      tutNext: 'Siguiente',
      tutPrev: 'Volver',
      tutSkip: 'Saltar',
      tutFinish: 'Finalizar',
      tutToastSkip: 'Tutorial saltado. Puedes revisarlo en Perfil.',
      tutToastDone: '¡Todo listo para usar Habbi!'
    }
  };
  window.HABBI_I18N = HABBI_I18N;

  // Renderização dinâmica de títulos/subtítulos padrão de eventos no idioma ativo,
  // preservando sempre integralmente as notas livres digitadas pela pessoa.
  function getLocalizedEventDisplay(ev, meta, t) {
    const dict = t || HABBI_I18N[(userState.currentLang || 'PT').toUpperCase()] || HABBI_I18N.PT;
    if (!ev || typeof ev !== 'object') return { title: '', subdesc: '' };
    const safeMeta = Math.max(1, parseInt(meta || userState.todayMeta, 10) || 11);

    if (ev.kind === 'smoke') {
      const baseTitle = dict.evSmokeTitle || 'Cigarro registrado';
      const title = (typeof ev.cigNumber === 'number' && ev.cigNumber > 0)
        ? `${baseTitle} (${ev.cigNumber}/${safeMeta})`
        : baseTitle;
      const subdesc = (typeof ev.cigNumber === 'number' && ev.cigNumber > 0)
        ? (dict.evSmokeDesc || '{0}/{1} no dia').replace('{0}', ev.cigNumber).replace('{1}', safeMeta)
        : String(ev.desc || '');
      return { title, subdesc };
    }
    if (ev.kind === 'urge') {
      return {
        title: dict.evUrgeTitle || 'Vontade superada',
        subdesc: dict.evUrgeDesc || 'Impulso controlado'
      };
    }
    if (ev.kind === 'sos') {
      return {
        title: dict.evSosTitle || 'Intervenção SOS',
        subdesc: String(ev.desc || dict.evUrgeDesc || '')
      };
    }
    if (ev.kind === 'no-smoke') {
      const todayKey = (typeof getDateKey === 'function') ? getDateKey(new Date()) : '';
      const isTodayEv = ev.dateKey && todayKey && ev.dateKey === todayKey;
      return {
        title: isTodayEv
          ? (dict.evNoSmokeTodayTitle || dict.homeNoSmoke || 'Não fumei hoje')
          : (dict.evNoSmokeDayTitle || dict.noSmokeOtherDay || 'Não fumei neste dia'),
        subdesc: dict.evNoSmokeDesc || '0 cigarros no dia'
      };
    }
    if (ev.kind === 'mood') {
      let moodKey = ev.moodValue || '';
      if (!moodKey && typeof ev.title === 'string') {
        const stripped = ev.title.replace(/^(Humor|Mood|Ánimo)\s*:\s*/i, '').trim();
        if (stripped && dict.qregMoods && dict.qregMoods[stripped]) {
          moodKey = stripped;
        }
      }
      const localizedMood = (moodKey && dict.qregMoods && dict.qregMoods[moodKey]) ? dict.qregMoods[moodKey] : moodKey;
      const title = localizedMood
        ? `${dict.evMoodPrefix || 'Humor'}: ${localizedMood}`
        : (dict.evMoodFallbackTitle || 'Registro de Sentimentos');

      const parts = [];
      if (Array.isArray(ev.influences) && ev.influences.length > 0) {
        const locInf = ev.influences.map(tag => (dict.qregInfluences && dict.qregInfluences[tag]) ? dict.qregInfluences[tag] : tag);
        parts.push(locInf.join(', '));
      }
      if (typeof ev.note === 'string' && ev.note.trim()) {
        // Preserva literalmente a nota livre digitada pelo usuário
        parts.push(ev.note.trim());
      }
      let subdesc = parts.join(' • ');
      if (!subdesc && ev.desc && ev.desc !== 'Sentimento registrado' && ev.desc !== 'Feeling logged' && ev.desc !== 'Emoción registrada') {
        subdesc = String(ev.desc);
      }
      return { title, subdesc };
    }
    return {
      title: String(ev.title || ''),
      subdesc: String(ev.desc || '')
    };
  }
  window.getLocalizedEventDisplay = getLocalizedEventDisplay;

  window.applyAppLanguage = function(langKey) {
    const code = (langKey || 'PT').toUpperCase();
    const lang = HABBI_I18N[code] ? code : 'PT';
    userState.currentLang = lang;
    if (document.documentElement) {
      document.documentElement.lang = (lang === 'EN' ? 'en' : lang === 'ES' ? 'es' : 'pt-BR');
    }
    try {
      localStorage.setItem('habbi-app-lang', lang);
    } catch (_e) {}
    savePersistedState();

    const t = HABBI_I18N[lang];

    // Screen 1: Splash
    const flagEl = document.getElementById('wl-lang-flag-circle');
    const codeEl = document.getElementById('wl-lang-code-txt');
    const headEl = document.getElementById('wl-splash-headline');
    const startBtn = document.getElementById('btn-splash-start');
    if (flagEl && flagSVGs[lang]) {
      flagEl.innerHTML = flagSVGs[lang];
    }
    if (codeEl) codeEl.innerText = t.langCode;
    if (headEl) {
      headEl.innerHTML = t.splashHeadline;
      headEl.classList.remove('is-subtle-in');
      void headEl.offsetWidth;
      headEl.classList.add('is-subtle-in');
    }
    if (startBtn) startBtn.innerText = t.splashStart;

    // Screen 2: Boas-vindas
    const s2 = document.querySelector('.screen[data-screen="2"]');
    if (s2) {
      const h1 = s2.querySelector('h1');
      if (h1) h1.innerText = t.welcomeTitle || 'Olá!';
      const p = s2.querySelector('p');
      if (p) p.innerText = t.welcomeSubtitle || 'Que bom te ver por aqui!';
      const btnLog = document.getElementById('btn-welcome-login');
      if (btnLog) btnLog.innerText = t.welcomeLogin || 'Entrar';
      const btnSign = document.getElementById('btn-welcome-signup');
      if (btnSign) btnSign.innerText = t.welcomeSignup || 'Criar conta';
    }

    // Screen 3: Onboarding 1
    const s3 = document.querySelector('.screen[data-screen="3"]');
    if (s3) {
      const step = s3.querySelector('.onboarding-top .caption, .wl-step-pill');
      if (step) step.innerText = t.onb1Step || '1 de 3';
      const h1 = s3.querySelector('h1');
      if (h1) h1.innerHTML = t.onb1Title;
      const p = s3.querySelector('p.caption');
      if (p) p.innerText = t.onb1Desc;
      const btnSpan = s3.querySelector('#btn-onboarding-1-next span');
      if (btnSpan) btnSpan.innerText = t.onb1Next || 'ADICIONAR';
    }

    // Screen 4: Onboarding 2
    const s4 = document.querySelector('.screen[data-screen="4"]');
    if (s4) {
      const step = s4.querySelector('.onboarding-top .caption, .wl-step-pill');
      if (step) step.innerText = t.onb2Step || '2 de 3';
      const h1 = s4.querySelector('h1');
      if (h1) h1.innerHTML = t.onb2Title || 'Identifique gatilhos';
      const p = s4.querySelector('p.caption');
      if (p) p.innerText = t.onb2Desc || 'Pequenos incentivos para seguir no seu ritmo.';
      const notifTitle = s4.querySelector('.wl-notif-bubble strong');
      if (notifTitle) notifTitle.innerText = t.onbNotifTitle || 'Que tal distrair a mente?';
      const notifSub = s4.querySelector('.wl-notif-bubble span:not(.wl-notif-time)');
      if (notifSub) notifSub.innerText = t.onbNotifSub || 'Lembretes e ferramentas para te acompanhar.';
      const btn = document.getElementById('btn-onboarding-2-next');
      if (btn) btn.innerText = t.onbRemindersEnable || 'Ativar lembretes';
      const btnSkip = document.getElementById('btn-onboarding-2-skip');
      if (btnSkip) btnSkip.innerText = t.onbRemindersSkip || 'Agora não';
    }

    // Screen 5: Onboarding 3
    const s5 = document.querySelector('.screen[data-screen="5"]');
    if (s5) {
      const step = s5.querySelector('.onboarding-top .caption, .wl-step-pill');
      if (step) step.innerText = t.onb3Step || '3 de 3';
      const h1 = s5.querySelector('h1');
      if (h1) h1.innerHTML = t.onb3Title;
      const badH3 = s5.querySelector('.wl-compare-card.bad h3');
      if (badH3) badH3.innerHTML = t.onbCompareBadTitle || 'No piloto<br>automático';
      const badLis = s5.querySelectorAll('.wl-compare-card.bad li');
      if (badLis.length && t.onbCompareBadList) {
        badLis.forEach((li, idx) => {
          if (t.onbCompareBadList[idx]) {
            li.innerHTML = `<span class="wl-mark bad">\u2715</span> ${t.onbCompareBadList[idx]}`;
          }
        });
      }
      const goodH3 = s5.querySelector('.wl-compare-card.good h3');
      if (goodH3) goodH3.innerHTML = t.onbCompareGoodTitle || 'Com o<br>Habbi';
      const goodLis = s5.querySelectorAll('.wl-compare-card.good li');
      if (goodLis.length && t.onbCompareGoodList) {
        goodLis.forEach((li, idx) => {
          if (t.onbCompareGoodList[idx]) {
            li.innerHTML = `<span class="wl-mark good">\u2713</span> ${t.onbCompareGoodList[idx]}`;
          }
        });
      }
      const btn = document.getElementById('btn-onboarding-3-next');
      if (btn) btn.innerText = t.onb3Next || 'Vamos começar!';
    }

    document.querySelectorAll('.wl-onb-screen .wl-skip-btn').forEach(btn => {
      btn.innerText = t.onbSkip || 'IGNORAR';
    });

    // Screen 6: Jornada
    const s6 = document.querySelector('.screen[data-screen="6"]');
    if (s6) {
      const h2 = s6.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.journeyTitle;
      const cap = s6.querySelector('.caption.mb-24');
      if (cap) cap.innerText = t.journeyDesc;
      const jChipSel = s6.querySelector('.chip[data-journey="Tabagismo"]');
      if (jChipSel) {
        const jSpan = jChipSel.querySelector('span:first-child');
        if (jSpan) {
          const svg = jSpan.querySelector('svg');
          jSpan.textContent = '';
          if (svg) jSpan.appendChild(svg);
          jSpan.appendChild(document.createTextNode(t.journeySmoking || 'Tabagismo'));
        }
        const jAvail = jChipSel.querySelector('.pill-tag');
        if (jAvail) jAvail.innerText = t.journeyAvailable || 'Disponível';
      }
      const lockedChips = s6.querySelectorAll('.chip.locked');
      const lockedNames = [
        t.journeyVape || 'Vape',
        t.journeyAlcohol || 'Álcool',
        t.journeyGambling || 'Apostas',
        t.journeySocial || 'Redes Sociais',
        t.journeyProcrastination || 'Procrastinação'
      ];
      lockedChips.forEach((chip, i) => {
        const spanTxt = chip.querySelector('span:first-child');
        if (spanTxt && lockedNames[i]) spanTxt.innerText = lockedNames[i];
        const spanTag = chip.querySelector('.pill-tag');
        if (spanTag) spanTag.innerText = t.journeyComingSoon || 'Em breve';
      });
      const btn = document.getElementById('btn-journey-submit');
      if (btn) btn.innerText = t.journeySubmit;
    }

    // Screen 7: Meta Diária
    const s7 = document.querySelector('.screen[data-screen="7"]');
    if (s7) {
      const h2 = s7.querySelector('.detail-header h2') || s7.querySelector('.wl-calc-top-title');
      if (h2) h2.innerText = t.metaH1 || 'Quantos cigarros você fuma por dia?';
      const h1 = s7.querySelector('h1');
      if (h1) h1.innerText = t.metaH1 || 'Quantos cigarros você fuma por dia?';
      const calcUnit = s7.querySelector('.wl-calc-unit-label');
      if (calcUnit) {
        const spanEl = calcUnit.querySelector('#cigarettes-per-day-unit-label');
        if (spanEl) {
          spanEl.innerText = t.metaHabitualUnit || 'cigarros por dia';
        } else {
          calcUnit.innerText = t.metaHabitualUnit || 'cigarros por dia';
        }
      }
      const calcSub = s7.querySelector('.wl-calc-sub') || document.getElementById('wl-calc-sub-headline');
      if (calcSub) calcSub.innerText = t.metaHabitualSub || 'Seu consumo habitual de referência';
      const suggTitle = document.getElementById('habbi-suggested-goal-title');
      if (suggTitle) suggTitle.innerText = t.metaSuggestedTitle || 'Meta sugerida para hoje';
      const suggDesc = document.getElementById('habbi-suggested-goal-desc');
      if (suggDesc) suggDesc.innerText = t.metaSuggestedDesc || 'Que tal começar com 1 cigarro a menos do seu consumo habitual?';
      const suggBadge = document.getElementById('habbi-suggested-badge-text');
      if (suggBadge) suggBadge.innerText = t.metaSuggestedBadge || 'Primeiro passo sugerido';
      const suggHint = document.getElementById('habbi-suggested-hint');
      if (suggHint) suggHint.innerText = t.metaSuggestedHint || 'Você pode confirmar ou ajustar este valor antes de iniciar.';
      const suggUnit = document.getElementById('habbi-suggested-meta-unit');
      if (suggUnit) suggUnit.innerText = t.metaSuggestedUnit || 'cigarros hoje';
      const pillHabitualTitle = document.getElementById('wl-cigs-pill-title');
      if (pillHabitualTitle) pillHabitualTitle.innerText = t.metaHabitualLabel || (lang === 'EN' ? 'Baseline consumption' : (lang === 'ES' ? 'Consumo habitual' : 'Consumo habitual'));
      const btnDone = document.getElementById('btn-calc-done') || document.getElementById('btn-config-1-submit');
      if (btnDone) btnDone.innerText = t.configMetaDone || (lang === 'EN' ? 'Done!' : (lang === 'ES' ? '¡Listo!' : 'Pronto!'));
      const sliderCap = s7.querySelector('.slider-container .caption');
      if (sliderCap) sliderCap.innerText = t.metaSliderUnit || 'cigarros';
      const h2s = s7.querySelectorAll('h2.mb-12');
      if (h2s.length >= 2) {
        h2s[0].innerText = t.metaYearsQuestion || 'Há quantos anos você fuma?';
        h2s[1].innerText = t.metaPriceQuestion || 'Preço médio do maço/carteira (R$)';
      }
      const yearsChips = s7.querySelectorAll('#years-smoking-chips .chip');
      if (yearsChips.length >= 4) {
        yearsChips[0].innerText = t.metaYearsLess1 || 'Menos de 1';
        yearsChips[1].innerText = t.metaYears1to5 || '1 - 5 anos';
        yearsChips[2].innerText = t.metaYears5to10 || '5 - 10 anos';
        yearsChips[3].innerText = t.metaYears10plus || '10+ anos';
      }
      const priceCap = s7.querySelector('.form-group .caption');
      if (priceCap) priceCap.innerText = t.metaPriceDesc || 'Usado para calcular a sua economia diária.';
      const btn = document.getElementById('btn-config-1-submit');
      if (btn) btn.innerText = t.configSubmit || 'Continuar';
    }

    const settingsGoalLbl = document.getElementById('settings-goal-label');
    if (settingsGoalLbl) settingsGoalLbl.innerText = t.settingsGoalAdjustLabel || 'Meta diária e consumo';

    const goalModalTitleEl = document.getElementById('habbi-goal-adjust-title');
    if (goalModalTitleEl) goalModalTitleEl.innerText = t.goalModalTitle || 'Ajustar meta e consumo';
    const goalModalTodayLblEl = document.getElementById('habbi-adjust-today-lbl');
    if (goalModalTodayLblEl) goalModalTodayLblEl.innerText = t.goalModalTodayLabel || 'Meta diária atual';
    const goalModalTodayDescEl = document.getElementById('habbi-adjust-today-desc');
    if (goalModalTodayDescEl) goalModalTodayDescEl.innerText = t.goalModalTodayDesc || 'Seu limite de cigarros planejado para hoje.';
    const goalModalHabitLblEl = document.getElementById('habbi-adjust-habitual-lbl');
    if (goalModalHabitLblEl) goalModalHabitLblEl.innerText = t.goalModalHabitualLabel || 'Consumo habitual de referência';
    const goalModalHabitDescEl = document.getElementById('habbi-adjust-habitual-desc');
    if (goalModalHabitDescEl) goalModalHabitDescEl.innerText = t.goalModalHabitualDesc || 'Usado para calcular a sua economia diária acumulada.';
    const goalModalCancelBtn = document.getElementById('btn-goal-adjust-cancel');
    if (goalModalCancelBtn) goalModalCancelBtn.innerText = t.goalModalCancel || 'Cancelar';
    const goalModalSaveBtn = document.getElementById('btn-goal-adjust-save');
    if (goalModalSaveBtn) goalModalSaveBtn.innerText = t.goalModalSave || 'Salvar';

    // Screen 8: Motivações
    const s8 = document.querySelector('.screen[data-screen="8"]');
    if (s8) {
      const h2 = s8.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.configTitle || 'Configuração';
      const h1 = s8.querySelector('h1');
      if (h1) h1.innerText = t.motivationsH1 || 'O que te motiva a mudar?';
      const cap = s8.querySelector('.caption.mb-24');
      if (cap) cap.innerText = t.motivationsDesc || 'Escolha quantas quiser.';
      const motChips = s8.querySelectorAll('#motivations-chips-grid .chip span');
      if (motChips.length >= 6) {
        motChips[0].innerText = t.motHealth || 'Saúde';
        motChips[1].innerText = t.motSavings || 'Economia';
        motChips[2].innerText = t.motFamily || 'Família';
        motChips[3].innerText = t.motExercise || 'Exercícios';
        motChips[4].innerText = t.motQuality || 'Qualidade de vida';
        motChips[5].innerText = t.motOther || 'Outro';
      }
      const btn = document.getElementById('btn-motivations-submit');
      if (btn) btn.innerText = t.configSubmit || 'Continuar';
    }

    // Screen 9: Gatilhos Iniciais
    const s9 = document.querySelector('.screen[data-screen="9"]');
    if (s9) {
      const h2 = s9.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.configTitle || 'Configuração';
      const h1 = s9.querySelector('h1');
      if (h1) h1.innerText = t.triggersH1 || 'O que te faz querer fumar?';
      const cap = s9.querySelector('.caption.mb-24');
      if (cap) cap.innerText = t.triggersDesc || 'Escolha quantas quiser.';
      const trigMap = {
        'Estresse': t.trigStress || 'Estresse',
        'Ansiedade': t.trigAnxiety || 'Ansiedade',
        'Trabalho': t.trigWork || 'Trabalho',
        'Cafe': t.trigCoffee || 'Café',
        'Apos refeicoes': t.trigMeals || 'Após refeições',
        'Socializacao': t.trigSocial || 'Socialização',
        'Tedio': t.trigBoredom || 'Tédio',
        'Bebida alcoolica': t.trigAlcohol || 'Bebida alcoólica',
        'Outro': t.trigOther || 'Outro'
      };
      s9.querySelectorAll('#triggers-chips-grid .chip').forEach(ch => {
        const key = ch.dataset.val;
        if (trigMap[key]) ch.innerText = trigMap[key];
      });
      const btn = document.getElementById('btn-triggers-submit');
      if (btn) btn.innerText = t.configSubmit || 'Continuar';
    }

    // Screen 10: Home Hero & Controls
    const homeTodayWord = document.getElementById('home-today-word');
    if (homeTodayWord) {
      homeTodayWord.innerText = t.homeTodayWord || 'hoje';
    }
    const homeMetaOfToday = document.getElementById('home-meta-of-today-label');
    if (homeMetaOfToday) {
      homeMetaOfToday.innerText = t.homeMetaPctSuffix || 'da meta de hoje';
    }
    const homeDaysLbl = document.getElementById('home-display-days-label');
    if (homeDaysLbl) {
      homeDaysLbl.innerText = userState.daysClean === 1 ? t.homeDaySingular : t.homeDaysPlural;
    }
    const homeNoSmokeText = document.getElementById('home-nosmoke-badge-text');
    if (homeNoSmokeText) {
      const todayKey = getDateKey(new Date());
      const todayRec = userState.dailyRecords[todayKey];
      const isConfirmed = Boolean(todayRec && todayRec.smokeFree);
      homeNoSmokeText.innerText = isConfirmed ? (t.homeNoSmoke + ' ✓') : t.homeNoSmoke;
    }
    const homeSosBtn = document.getElementById('btn-home-sos');
    if (homeSosBtn) {
      const sosAria = t.homeSosAria || 'SOS Ajuda rápida para momentos de vontade';
      homeSosBtn.setAttribute('aria-label', sosAria);
      homeSosBtn.setAttribute('title', sosAria);
    }
    const homeSosBtnText = document.querySelector('.wl-home-sos-pill span');
    if (homeSosBtnText) homeSosBtnText.innerText = t.homeSosBtn || 'SOS';
    const homeAddBtn = document.getElementById('btn-home-add-cig');
    if (homeAddBtn) {
      const addAria = t.homeAddCigAria || t.homeAddCig || 'Registrar cigarro';
      homeAddBtn.setAttribute('aria-label', addAria);
      homeAddBtn.setAttribute('title', addAria);
    }
    const homeAddCigText = document.querySelector('.wl-home-add-btn span');
    if (homeAddCigText) homeAddCigText.innerText = t.homeAddCig || 'Registrar cigarro';
    const homeRemoveBtn = document.getElementById('btn-home-remove-cig');
    if (homeRemoveBtn) {
      const remLabel = t.homeRemoveCigAria || 'Desfazer último cigarro registrado';
      homeRemoveBtn.setAttribute('aria-label', remLabel);
      homeRemoveBtn.setAttribute('title', remLabel);
    }

    // Carrossel Principal: indicadores minimalistas (sem texto visível) + aria-labels traduzidos
    const tabConquista = document.getElementById('wl-tab-conquista');
    if (tabConquista) {
      const lbl = t.tabConquista || 'Conquista';
      tabConquista.setAttribute('aria-label', lbl);
      tabConquista.setAttribute('title', lbl);
    }
    const tabInicio = document.getElementById('wl-tab-inicio');
    if (tabInicio) {
      const lbl = t.tabHome || 'Início';
      tabInicio.setAttribute('aria-label', lbl);
      tabInicio.setAttribute('title', lbl);
    }
    const tabMinijogos = document.getElementById('wl-tab-minijogos');
    if (tabMinijogos) {
      const lbl = t.tabMinigames || 'Minijogos';
      tabMinijogos.setAttribute('aria-label', lbl);
      tabMinijogos.setAttribute('title', lbl);
    }
    const tabsBar = document.querySelector('.wl-carousel-tabs');
    if (tabsBar) tabsBar.setAttribute('aria-label', t.carouselTabsAria || 'Seções principais do Habbi');
    const navCalBtn = document.querySelector('#main-carousel-header .wl-top-nav-btn[onclick*="goToScreen(16)"]');
    if (navCalBtn) navCalBtn.setAttribute('aria-label', t.navCalAria || 'Abrir calendário');
    const navMenuBtn = document.querySelector('#main-carousel-header .wl-top-nav-btn[onclick*="toggleHabbiHubMenu"]');
    if (navMenuBtn) navMenuBtn.setAttribute('aria-label', t.navMenuAria || 'Abrir menu');
    const heroSavingsText = document.getElementById('home-savings-top')?.innerText || 'R$ 0,00';
    const savPillAriaTpl = t.savingsPillAria || 'Economia estimada: {0}. Abrir Conquista';
    document.querySelectorAll('.wl-home-savings-pill').forEach(pill => {
      pill.setAttribute('aria-label', savPillAriaTpl.replace('{0}', heroSavingsText));
    });

    const swipeHint = document.getElementById('wl-home-swipe-hint') || document.querySelector('#wl-carousel-swipe-hint span');
    if (swipeHint) {
      swipeHint.innerText = t.homeSwipeHintText || t.homeSwipeHint || 'Arraste para explorar';
    }
    const greetLabel = document.getElementById('home-greeting-label');
    if (greetLabel) {
      const hr = new Date().getHours();
      if (hr < 12) greetLabel.innerText = t.homeGreetingMorning || 'Bom dia,';
      else if (hr < 18) greetLabel.innerText = t.homeGreetingAfternoon || 'Boa tarde,';
      else greetLabel.innerText = t.homeGreetingNight || 'Boa noite,';
    }

    // Hub menu texts
    const hubTitleEl = document.querySelector('.wl-hub-header h3');
    if (hubTitleEl) hubTitleEl.innerText = t.hubTitle;
    const hubItems = document.querySelectorAll('.wl-hub-item');
    if (hubItems.length >= 4) {
      const pTxt = hubItems[0].querySelector('.wl-hub-txt');
      if (pTxt) pTxt.innerHTML = `<strong>${t.hubProfileTitle}</strong><span>${t.hubProfileDesc}</span>`;
      const prTxt = hubItems[1].querySelector('.wl-hub-txt');
      if (prTxt) prTxt.innerHTML = `<strong>${t.hubProgressTitle}</strong><span>${t.hubProgressDesc}</span>`;
      const toolTxt = hubItems[2].querySelector('.wl-hub-txt');
      if (toolTxt) toolTxt.innerHTML = `<strong>${t.hubToolsTitle}</strong><span>${t.hubToolsDesc}</span>`;
      const setTxt = hubItems[3].querySelector('.wl-hub-txt');
      if (setTxt) setTxt.innerHTML = `<strong>${t.hubSettingsTitle}</strong><span>${t.hubSettingsDesc}</span>`;
    }

    // Screen 12: SOS Hub
    const sosTitle = document.querySelector('.wl-sos-title');
    if (sosTitle) sosTitle.innerText = t.sosTitle;
    const sosSubtitle = document.querySelector('.wl-sos-subtitle');
    if (sosSubtitle) sosSubtitle.innerText = t.sosSubtitle;
    const sosTimerTag = document.querySelector('.wl-sos-timer-tag');
    if (sosTimerTag) sosTimerTag.innerText = t.sosTimerTag;
    const sosTimerStart = document.getElementById('btn-sos-timer-start');
    if (sosTimerStart) sosTimerStart.innerText = t.sosTimerStart;
    const sosTimerBtnTxt = document.getElementById('wl-sos-timer-btn-text');
    if (sosTimerBtnTxt && !window.wlSosTimerInterval) sosTimerBtnTxt.innerText = t.sosTimerPause;
    const sosTimerReset = document.getElementById('btn-sos-timer-reset');
    if (sosTimerReset) sosTimerReset.innerText = t.sosTimerReset;
    const cardRespTitle = document.querySelector('.card-respirar .wl-sos-card-title');
    if (cardRespTitle) cardRespTitle.innerText = t.sosCardBreathe;
    const cardDistTitle = document.querySelector('.card-distrair .wl-sos-card-title');
    if (cardDistTitle) cardDistTitle.innerText = t.sosCardDistract;
    const cardAguaTitle = document.querySelector('.card-agua .wl-sos-card-title');
    if (cardAguaTitle) cardAguaTitle.innerText = t.sosCardWater;
    const cardCalmTitle = document.querySelector('.card-calmar .wl-sos-card-title');
    if (cardCalmTitle) cardCalmTitle.innerText = t.sosCardCalm;
    const sosSupportTxt = document.querySelector('.wl-sos-support-btn span');
    if (sosSupportTxt) sosSupportTxt.innerText = t.sosSupportBtn;
    const sosDismiss = document.querySelector('.wl-sos-dismiss-btn');
    if (sosDismiss) sosDismiss.innerText = t.sosDismissBtn;

    // Screen 13: Intervenções
    const intervTip = document.getElementById('wl-breath-tip');
    if (intervTip) intervTip.innerText = t.intervTip;
    const breathPauseBtn = document.getElementById('btn-breath-pause-toggle');
    if (breathPauseBtn && !breathState.isPaused) breathPauseBtn.innerText = t.intervPause;

    // Screen 14: Ferramentas
    const s14Title = document.querySelector('.screen[data-screen="14"] h2, .screen[data-screen="14"] h1');
    if (s14Title) s14Title.innerText = t.toolsTitle;
    const s14Caption = document.querySelector('.screen[data-screen="14"] .caption');
    if (s14Caption) s14Caption.innerText = t.toolsSubtitle;
    const qCards = document.querySelectorAll('.wl-quest-card');
    if (qCards.length >= 4) {
      const q0 = qCards[0].querySelector('.wl-quest-info');
      if (q0) q0.innerHTML = `<span class="wl-quest-tag">${t.toolsRespTag}</span><h3>${t.toolsRespTitle}</h3>`;
      const q1 = qCards[1].querySelector('.wl-quest-info');
      if (q1) q1.innerHTML = `<span class="wl-quest-tag">${t.toolsMiniTag}</span><h3>${t.toolsMiniTitle}</h3>`;
      const q2 = qCards[2].querySelector('.wl-quest-info');
      if (q2) q2.innerHTML = `<span class="wl-quest-tag">${t.toolsSosTag}</span><h3>${t.toolsSosTitle}</h3>`;
      const q3 = qCards[3].querySelector('.wl-quest-info');
      if (q3) q3.innerHTML = `<span class="wl-quest-tag">${t.toolsMoodTag}</span><h3>${t.toolsMoodTitle}</h3>`;
    }

    // Screen 15: Minijogos
    const miniTitles = document.querySelectorAll('.wl-minijogos-title');
    miniTitles.forEach(el => { el.innerText = t.minijogosTitle || 'Minijogos'; });
    const miniIntroSub = document.querySelector('.wl-minijogos-carousel-intro .caption');
    if (miniIntroSub) miniIntroSub.innerText = t.minijogosCarouselSub || 'Exercícios rápidos para quebrar a fissura';
    const miniToolsSub = document.querySelector('#wl-minijogos-tools-header .caption');
    if (miniToolsSub) miniToolsSub.innerText = t.minijogosToolsSub || 'Exercícios e distração';
    const gMem = document.getElementById('btn-game-memory');
    if (gMem) {
      const tEl = gMem.querySelector('.game-grid-card-title');
      const sEl = gMem.querySelector('.game-grid-card-sub');
      if (tEl) tEl.innerText = t.gameMemTitle;
      if (sEl) sEl.innerText = t.gameMemSub;
    }
    const gSeq = document.getElementById('btn-game-sequence');
    if (gSeq) {
      const tEl = gSeq.querySelector('.game-grid-card-title');
      const sEl = gSeq.querySelector('.game-grid-card-sub');
      if (tEl) tEl.innerText = t.gameSeqTitle;
      if (sEl) sEl.innerText = t.gameSeqSub;
    }
    const gMath = document.getElementById('btn-game-math');
    if (gMath) {
      const tEl = gMath.querySelector('.game-grid-card-title');
      const sEl = gMath.querySelector('.game-grid-card-sub');
      if (tEl) tEl.innerText = t.gameMathTitle;
      if (sEl) sEl.innerText = t.gameMathSub;
    }
    const gTap = document.getElementById('btn-game-reflex');
    if (gTap) {
      const tEl = gTap.querySelector('.game-grid-card-title');
      const sEl = gTap.querySelector('.game-grid-card-sub');
      if (tEl) tEl.innerText = t.gameTapTitle;
      if (sEl) sEl.innerText = t.gameTapSub;
    }
    const quitBtnTxt = document.querySelector('#btn-quit-game span');
    if (quitBtnTxt) quitBtnTxt.innerText = t.gameQuitBtn;
    if (typeof updateMinigamesRecordUI === 'function') {
      updateMinigamesRecordUI();
    }

    // Screen 16: Calendário
    const calTodayBtn = document.getElementById('wl-cal-today-btn');
    if (calTodayBtn) calTodayBtn.innerText = t.calToday;
    const calWk = document.querySelector('.wl-cal-weekdays');
    if (calWk && t.calWeekdays) {
      calWk.innerHTML = t.calWeekdays.map(w => `<span>${w}</span>`).join('');
    }
    const calLegends = document.querySelectorAll('.wl-cal-legend-item');
    if (calLegends.length >= 4) {
      calLegends[0].innerHTML = `<i class="dot green"></i>${t.calLegendGoal}`;
      calLegends[1].innerHTML = `<i class="dot pink"></i>${t.calLegendOver}`;
      calLegends[2].innerHTML = `<i class="dot in-progress"></i>${t.calLegendInProgress || 'Em andamento'}`;
      calLegends[3].innerHTML = `<i class="dot neutral"></i>${t.calLegendEmpty}`;
    } else if (calLegends.length >= 3) {
      calLegends[0].innerHTML = `<i class="dot green"></i>${t.calLegendGoal}`;
      calLegends[1].innerHTML = `<i class="dot pink"></i>${t.calLegendOver}`;
      calLegends[2].innerHTML = `<i class="dot neutral"></i>${t.calLegendEmpty}`;
    }
    const calPrevBtn = document.querySelector('.wl-cal-nav-arrow[onclick*="changeCalendarMonth(-1)"]');
    if (calPrevBtn) {
      const pLbl = t.calPrevMonthAria || 'Mês anterior';
      calPrevBtn.setAttribute('aria-label', pLbl);
      calPrevBtn.setAttribute('title', pLbl);
    }
    const calNextBtn = document.querySelector('.wl-cal-nav-arrow[onclick*="changeCalendarMonth(1)"]');
    if (calNextBtn) {
      const nLbl = t.calNextMonthAria || 'Próximo mês';
      calNextBtn.setAttribute('aria-label', nLbl);
      calNextBtn.setAttribute('title', nLbl);
    }
    const calCloseBtn = document.querySelector('.screen[data-screen="16"] .wl-close-circle');
    if (calCloseBtn) {
      calCloseBtn.setAttribute('aria-label', t.calCloseAria || 'Fechar calendário');
    }
    const calMetrics = document.querySelectorAll('.wl-cal-metric-box span');
    if (calMetrics.length >= 3) {
      calMetrics[0].innerText = t.calStatClean;
      calMetrics[1].innerText = t.calStatGoal;
      calMetrics[2].innerText = t.calStatUrges;
    }
    const calAddBtn = document.querySelector('.wl-cal-add-entry-btn span, .wl-cal-pill-actions .wl-cal-btn span');
    if (calAddBtn) calAddBtn.innerText = t.calEventAdd || 'Adicionar registro';

    if (typeof generateCalendar === 'function') {
      const titleEl = document.getElementById('wl-cal-month-title');
      if (titleEl && typeof userState.calViewMonth === 'number') {
        const mName = getMonthNamePt(userState.calViewMonth);
        const yNum = userState.calViewYear;
        titleEl.innerText = lang === 'EN' ? `${mName} ${yNum}` : `${mName} de ${yNum}`;
      }
    }

    // Screen 17: Progresso
    const s17 = document.querySelector('.screen[data-screen="17"]');
    if (s17) {
      const h2 = s17.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.progressTitle;
      const sub = s17.querySelector('.detail-header .caption');
      if (sub) sub.innerText = t.progressSubtitle;
      const caps = s17.querySelectorAll('.stats-card .caption');
      if (caps.length >= 4) {
        caps[0].innerText = t.statCleanDays;
        caps[1].innerText = t.statCigsAvoided;
        caps[2].innerText = t.statSaved;
        caps[3].innerText = t.statUrges;
      }
    }

    // Screen 18: Desafios
    const s18Title = document.querySelector('.screen[data-screen="18"] .detail-header h2');
    if (s18Title) s18Title.innerText = t.challengesTitle;

    // Screen 19: Histórico
    const s19Title = document.querySelector('.screen[data-screen="19"] .detail-header h2');
    if (s19Title) s19Title.innerText = t.historyTitle;

    // Screen 20: Insights
    const s20Title = document.querySelector('.screen[data-screen="20"] .detail-header h2');
    if (s20Title) s20Title.innerText = t.insightsTitle;

    // Screen 21: Perfil
    const s21 = document.querySelector('.screen[data-screen="21"]');
    if (s21) {
      const h2 = s21.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.profileTitle;
      const dispName = document.getElementById('profile-display-name');
      if (dispName && (!userState.isAuthenticated || !userState.name)) {
        dispName.innerText = t.profileVisitor || 'Visitante';
      }
      const dispSub = document.getElementById('profile-display-sub');
      if (dispSub && !userState.isAuthenticated) {
        dispSub.innerText = t.profileUnauthSub || 'Crie uma conta para salvar seus dados';
      }
      const btnCreate = s21.querySelector('#profile-unauth-box button:first-child');
      if (btnCreate) btnCreate.innerText = t.profileCreateAccount || 'Criar conta';
      const btnIn = s21.querySelector('#profile-unauth-box button:last-child');
      if (btnIn) btnIn.innerText = t.profileSignIn || 'Entrar';
      const editSpan = s21.querySelector('#profile-edit-btn-text');
      if (editSpan) {
        editSpan.innerText = t.profileEdit || 'Editar perfil';
      }
      const tutItem = document.getElementById('btn-profile-tutorial');
      if (tutItem) {
        const lbl = tutItem.querySelector('.label');
        if (lbl) {
          const svg = lbl.querySelector('svg');
          lbl.textContent = '';
          if (svg) lbl.appendChild(svg);
          lbl.appendChild(document.createTextNode(t.profileHowToUse || 'Como usar o Habbi'));
        }
      }
      const logoutSpan = s21.querySelector('#profile-logout-text');
      if (logoutSpan) {
        logoutSpan.innerText = t.profileLogout || 'Sair da conta';
      }
    }

    // Screen 22: Settings
    const s22 = document.querySelector('.screen[data-screen="22"]');
    if (s22) {
      const s22Title = s22.querySelector('.detail-header h2');
      if (s22Title) s22Title.innerText = t.settingsTitle;
      const langLabel = document.getElementById('settings-lang-label');
      if (langLabel) langLabel.innerText = t.settingsLangLabel;
      const langVal = document.getElementById('settings-lang-value');
      if (langVal) langVal.innerText = t.langName;
      const s22Items = s22.querySelectorAll('.menu-list-item');
      s22Items.forEach((item) => {
        const txt = item.innerText || '';
        if (txt.includes('Notifica') || txt.includes('Notifications')) {
          const lbl = item.querySelector('.label');
          if (lbl) {
            const svg = lbl.querySelector('svg');
            lbl.textContent = '';
            if (svg) lbl.appendChild(svg);
            lbl.appendChild(document.createTextNode(t.settingsNotifications));
          }
        } else if (txt.includes('Lembrete') || txt.includes('Reminder') || txt.includes('Recordatorio')) {
          const lbl = item.querySelector('.label');
          if (lbl) {
            const svg = lbl.querySelector('svg');
            lbl.textContent = '';
            if (svg) lbl.appendChild(svg);
            lbl.appendChild(document.createTextNode(t.settingsReminders));
          }
        } else if (txt.includes('Backup') || txt.includes('Copia')) {
          const lbl = item.querySelector('.label');
          if (lbl) {
            const svg = lbl.querySelector('svg');
            lbl.textContent = '';
            if (svg) lbl.appendChild(svg);
            lbl.appendChild(document.createTextNode(t.settingsBackup));
          }
        } else if (txt.includes('Privacidade') || txt.includes('Privacy') || txt.includes('Privacidad')) {
          const lbl = item.querySelector('.label');
          if (lbl) {
            const svg = lbl.querySelector('svg');
            lbl.textContent = '';
            if (svg) lbl.appendChild(svg);
            lbl.appendChild(document.createTextNode(t.settingsPrivacy));
          }
        } else if (txt.includes('Ajuda') || txt.includes('Help') || txt.includes('Ayuda')) {
          const lbl = item.querySelector('.label');
          if (lbl) {
            const svg = lbl.querySelector('svg');
            lbl.textContent = '';
            if (svg) lbl.appendChild(svg);
            lbl.appendChild(document.createTextNode(t.settingsHelp));
          }
        } else if (txt.includes('Sobre') || txt.includes('About')) {
          const lbl = item.querySelector('.label');
          if (lbl) {
            const svg = lbl.querySelector('svg');
            lbl.textContent = '';
            if (svg) lbl.appendChild(svg);
            lbl.appendChild(document.createTextNode(t.settingsAbout));
          }
        } else if (txt.includes('tour') || txt.includes('Onboarding') || txt.includes('Refazer') || txt.includes('Rehacer')) {
          const lbl = item.querySelector('.label');
          if (lbl) {
            const svg = lbl.querySelector('svg');
            lbl.textContent = '';
            if (svg) lbl.appendChild(svg);
            lbl.appendChild(document.createTextNode(t.settingsOnboarding));
          }
        }
      });
      const delLbl = document.getElementById('settings-delete-profile-label');
      if (delLbl) delLbl.innerText = t.settingsDeleteProfileData || 'Apagar registros deste perfil';
      const outLbl = document.getElementById('settings-logout-label');
      if (outLbl) outLbl.innerText = t.settingsLogout || 'Sair';
    }

    const splashLoginBtn = document.getElementById('btn-splash-login');
    if (splashLoginBtn) splashLoginBtn.innerText = t.splashLoginLink || 'Já tenho conta · Entrar';

    const restartTestLabel = t.settingsRestartTest || 'Reiniciar experiência de teste';
    const sRestartBtn = document.getElementById('settings-restart-test-btn');
    if (sRestartBtn) sRestartBtn.innerText = restartTestLabel;
    const pRestartBtn = document.getElementById('profile-restart-test-btn');
    if (pRestartBtn) pRestartBtn.innerText = restartTestLabel;

    const delModalTitle = document.getElementById('habbi-del-modal-title');
    if (delModalTitle) delModalTitle.innerText = t.delModalTitle || 'Apagar registros deste perfil?';
    const delModalDesc = document.getElementById('habbi-del-modal-desc');
    if (delModalDesc) delModalDesc.innerText = t.delModalDesc || '';
    const delModalBackup = document.getElementById('habbi-del-modal-backup');
    if (delModalBackup) delModalBackup.innerText = t.delModalBackup || 'Baixar backup JSON antes';
    const delModalConfirm = document.getElementById('habbi-del-modal-confirm');
    if (delModalConfirm) delModalConfirm.innerText = t.delModalConfirm || 'Apagar registros';

    const backupModalTitle = document.getElementById('habbi-backup-modal-title');
    if (backupModalTitle) backupModalTitle.innerText = t.backupModalTitle || 'Backup e dados';
    const backupModalDesc = document.getElementById('habbi-backup-modal-desc');
    if (backupModalDesc) backupModalDesc.innerText = t.backupModalDesc || 'Seus registros ficam salvos neste dispositivo. Você pode baixar uma cópia ou gerenciar os dados deste perfil.';
    const backupModalExport = document.getElementById('habbi-backup-modal-export');
    if (backupModalExport) backupModalExport.innerText = t.backupModalExport || 'Baixar backup (JSON)';
    const backupModalClose = document.getElementById('habbi-backup-modal-close');
    if (backupModalClose) backupModalClose.innerText = t.backupModalClose || 'Fechar';
    document.querySelectorAll('.habbi-local-test-badge').forEach(b => {
      b.textContent = t.localTestEnvBadge || 'Ambiente de teste local';
    });
    const delModalCancel = document.getElementById('habbi-del-modal-cancel');
    if (delModalCancel) delModalCancel.innerText = t.delModalCancel || 'Cancelar';

    const nsModalTitle = document.getElementById('habbi-nosmoke-modal-title');
    if (nsModalTitle) nsModalTitle.innerText = t.noSmokeModalTitle || 'Substituir registros desta data?';
    const nsModalConfirm = document.getElementById('habbi-nosmoke-modal-confirm');
    if (nsModalConfirm) nsModalConfirm.innerText = t.noSmokeModalConfirm || 'Confirmar dia sem fumar';
    const nsModalCancel = document.getElementById('habbi-nosmoke-modal-cancel');
    if (nsModalCancel) nsModalCancel.innerText = t.delModalCancel || 'Cancelar';

    // Abas do Carrossel e Modal de saída de partida
    const tabConq = document.getElementById('wl-tab-lbl-conquista');
    if (tabConq) tabConq.innerText = t.tabConquista || 'Conquista';
    const tabHome = document.getElementById('wl-tab-lbl-inicio');
    if (tabHome) tabHome.innerText = t.tabHome || 'Início';
    const tabMini = document.getElementById('wl-tab-lbl-minijogos');
    if (tabMini) tabMini.innerText = t.tabMinigames || 'Minijogos';
    const lgTitle = document.getElementById('habbi-leave-game-title');
    if (lgTitle) lgTitle.innerText = t.leaveGameTitle || 'Sair da partida atual?';
    const lgDesc = document.getElementById('habbi-leave-game-desc');
    if (lgDesc) lgDesc.innerText = t.leaveGameDesc || 'Você tem um minijogo em andamento. Se trocar de aba agora, esta partida será encerrada.';
    const lgStay = document.getElementById('habbi-leave-game-stay');
    if (lgStay) lgStay.innerText = t.leaveGameStay || 'Continuar jogando';
    const lgConfirm = document.getElementById('habbi-leave-game-confirm');
    if (lgConfirm) lgConfirm.innerText = t.leaveGameConfirm || 'Sair da partida';

    // Screen 23: Login
    const s23 = document.querySelector('.screen[data-screen="23"]');
    if (s23) {
      const h2 = s23.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.loginTitle;
      const sub = s23.querySelector('.detail-header .caption');
      if (sub) sub.innerText = t.loginSubtitle;
      const guestBtn = document.getElementById('btn-login-guest') || s23.querySelector('button[onclick*="continueAsGuest"]');
      if (guestBtn) guestBtn.innerText = t.loginGuest;
    }

    // Screen 24: Cadastro
    const s24 = document.querySelector('.screen[data-screen="24"]');
    if (s24) {
      const h2 = s24.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.signupTitle;
      const sub = s24.querySelector('.detail-header .caption');
      if (sub) sub.innerText = t.signupSubtitle;
    }

    // Screen 25: Registro de Humor / Gatilhos
    const s25 = document.querySelector('.screen[data-screen="25"]');
    if (s25) {
      const h2 = s25.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.moodTitle || 'Como você está?';
      const capMood = s25.querySelector('.caption');
      if (capMood) capMood.innerText = t.moodSubtitle || 'Selecione seu humor hoje (opcional):';
      const moodSpans = s25.querySelectorAll('.mood-card span');
      if (moodSpans.length >= 5) {
        moodSpans[0].innerText = t.moodHappy || 'Feliz';
        moodSpans[1].innerText = t.moodCalm || 'Calmo';
        moodSpans[2].innerText = t.moodAnxious || 'Ansioso';
        moodSpans[3].innerText = t.moodSad || 'Triste';
        moodSpans[4].innerText = t.moodIrritated || 'Irritado';
      }
      const caps = s25.querySelectorAll('span.caption');
      if (caps.length >= 2) caps[1].innerText = t.moodInfluenceTitle || 'O que está influenciando seu humor?';
      const notesLabel = s25.querySelector('.form-label');
      if (notesLabel) notesLabel.innerText = t.moodNotesLabel || 'O que aconteceu? (opcional)';
      const notesInput = document.getElementById('mood-notes');
      if (notesInput) notesInput.placeholder = t.moodNotesPlaceholder || 'Escreva um breve comentário sobre o seu dia...';
      const moodBtn = document.getElementById('btn-mood-submit');
      if (moodBtn) moodBtn.innerText = t.moodSubmitBtn || 'Salvar Registro';
    }

    // Screen 26: Avatar
    const s26 = document.querySelector('.screen[data-screen="26"]');
    if (s26) {
      const h2 = s26.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.avatarTitle;
      const sub = s26.querySelector('p.caption');
      if (sub) {
        sub.innerText = t.avatarSubtitle || (userState.currentLang === 'EN' ? 'Select a mascot for your profile:' : (userState.currentLang === 'ES' ? 'Elige una mascota para tu perfil:' : 'Selecione um gatinho para o seu perfil:'));
      }
      const avatarCards = s26.querySelectorAll('.avatar-option-card');
      const avMap = {
        cachecol: { PT: 'Cachecol', EN: 'Scarf', ES: 'Bufanda' },
        flor: { PT: 'Flor', EN: 'Flower', ES: 'Flor' },
        folha: { PT: 'Folha', EN: 'Leaf', ES: 'Hoja' },
        fone: { PT: 'Fone', EN: 'Headphones', ES: 'Auriculares' },
        laco: { PT: 'Laço', EN: 'Bow', ES: 'Lazo' },
        oculos: { PT: 'Óculos', EN: 'Glasses', ES: 'Gafas' },
        verde: { PT: 'Verde', EN: 'Green', ES: 'Verde' },
        azul: { PT: 'Azul', EN: 'Blue', ES: 'Azul' },
        amarelo: { PT: 'Amarelo', EN: 'Yellow', ES: 'Amarillo' },
        laranja: { PT: 'Laranja', EN: 'Orange', ES: 'Naranja' },
        rosa: { PT: 'Rosa', EN: 'Pink', ES: 'Rosa' },
        vermelho: { PT: 'Vermelho', EN: 'Red', ES: 'Rojo' }
      };
      avatarCards.forEach(card => {
        const key = card.dataset.avatar || card.dataset.color;
        const lbl = card.querySelector('.avatar-label');
        if (lbl && avMap[key]) {
          lbl.innerText = avMap[key][lang] || avMap[key].PT;
        }
      });
    }

    // Screen 27: Sobre o Habbi
    const s27 = document.querySelector('.screen[data-screen="27"]');
    if (s27) {
      const h2 = s27.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.aboutTitle || 'Sobre o Habbi';
      const mascotSub = s27.querySelector('div[style*="font-size:13px"]');
      if (mascotSub) mascotSub.innerText = t.aboutMascotLabel || 'A inspiração do mascote';
      const cardH1 = s27.querySelector('.card h1');
      if (cardH1) cardH1.innerText = t.aboutTitle || 'Sobre o Habbi';
      const ps = s27.querySelectorAll('.card p');
      if (ps.length >= 5) {
        ps[0].innerText = t.aboutP1;
        ps[1].innerText = t.aboutP2;
        ps[2].innerText = t.aboutP3;
        ps[3].innerText = t.aboutP4;
        ps[4].innerText = t.aboutFooter;
      }
      const createdByLbl = document.getElementById('wl-about-created-by-lbl');
      if (createdByLbl) createdByLbl.innerText = t.aboutCreatedBy || 'Criado por';
      const contactLbl = document.getElementById('wl-about-contact-lbl');
      if (contactLbl) contactLbl.innerText = t.aboutContact || 'Contato:';
    }

    // Screen 28: Minha Conta
    const s28 = document.querySelector('.screen[data-screen="28"]');
    if (s28) {
      const h2 = s28.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.accountTitle;
      const labels = s28.querySelectorAll('.form-label');
      if (labels.length >= 3) {
        labels[0].innerText = t.accountNameLabel || 'Nome';
        labels[1].innerText = t.accountEmailLabel || 'E-mail';
        labels[2].innerText = t.accountPassLabel || 'Nova Senha (opcional)';
      }
      const editAccountMetaLbl = document.getElementById('edit-account-meta-label');
      if (editAccountMetaLbl) editAccountMetaLbl.innerText = t.goalModalTodayLabel || 'Meta diária atual (cigarros/dia)';
      const editAccountHabitualLbl = document.getElementById('edit-account-habitual-label');
      if (editAccountHabitualLbl) editAccountHabitualLbl.innerText = t.goalModalHabitualLabel || 'Consumo habitual de referência (cigarros/dia)';
      const packPriceLbl = s28.querySelector('label[for="edit-account-pack-price"]');
      if (packPriceLbl) packPriceLbl.innerText = t.accountPackPriceLabel || 'Preço do Maço (R$)';
      const saveBtn = document.getElementById('btn-save-account-changes');
      if (saveBtn) saveBtn.innerText = t.accountSaveBtn || t.accountSave;
    }

    // Screen 29: Economia & Conquista
    const s29 = document.querySelector('.screen[data-screen="29"]');
    if (s29) {
      const h2s = s29.querySelectorAll('.wl-sav-title');
      h2s.forEach(h2 => { h2.innerText = t.conquistaTitle || 'Minha conquista'; });
      const conqIntroSub = s29.querySelector('.wl-conquista-carousel-intro .caption');
      if (conqIntroSub) {
        conqIntroSub.innerText = lang === 'EN' ? 'Track your savings and goals' : (lang === 'ES' ? 'Sigue tu ahorro y tus metas' : 'Acompanhe sua economia e metas');
      }
      const conqToolsSub = s29.querySelector('#wl-conquista-tools-header .caption');
      if (conqToolsSub) {
        conqToolsSub.innerText = lang === 'EN' ? 'Savings and goals' : (lang === 'ES' ? 'Ahorro y metas' : 'Economia e metas');
      }
      const goalLbl = document.querySelector('.wl-conquista-goal-label');
      if (goalLbl) goalLbl.innerText = t.conquistaGoalLabel || 'Objetivo';
      const chgChip = document.querySelector('.wl-conquista-change-chip');
      if (chgChip) chgChip.innerText = t.conquistaChangeChip || 'Trocar';
      const disc = document.getElementById('wl-conquista-info-popover');
      if (disc) disc.innerText = t.conquistaDisclaimer || 'Estimativa baseada nos seus registros.';
      const infoBtn = document.getElementById('wl-conquista-info-btn');
      if (infoBtn) {
        const infoAria = t.conquistaInfoAria || 'Sobre a economia estimada';
        infoBtn.setAttribute('aria-label', infoAria);
        infoBtn.setAttribute('title', infoAria);
      }
      const expTitle = document.getElementById('wl-expenses-title');
      if (expTitle) expTitle.innerText = t.conquistaExpensesTitle || 'Seus gastos';
      const expTodayLbl = document.getElementById('wl-expenses-today-lbl');
      if (expTodayLbl) expTodayLbl.innerText = t.conquistaExpensesToday || 'Hoje';
      const expMonthLbl = document.getElementById('wl-expenses-month-lbl');
      if (expMonthLbl) expMonthLbl.innerText = t.conquistaExpensesMonth || 'Este mês';
      if (typeof window.updateConquistaBagUI === 'function') window.updateConquistaBagUI();
      const subBtns = document.querySelectorAll('.wl-conquista-action-btn span');
      if (subBtns.length >= 2) {
        subBtns[0].innerText = t.conquistaAdjust || 'Ajustar consumo';
        subBtns[1].innerText = t.conquistaHistory || 'Histórico';
      }
      const goalModalTitle = document.getElementById('wl-goal-modal-title');
      if (goalModalTitle) goalModalTitle.innerText = t.goalModalTitle || 'Definir objetivo';
      const goalModalSub = document.querySelector('.wl-goal-modal-sub');
      if (goalModalSub) goalModalSub.innerText = t.goalModalSub || 'Defina para onde vai o fruto da sua vitória:';
      const goalNameLbl = document.querySelector('label[for="wl-goal-custom-name"]');
      if (goalNameLbl) goalNameLbl.innerText = t.goalModalNameLabel || 'O que você quer conquistar?';
      const goalNameInp = document.getElementById('wl-goal-custom-name');
      if (goalNameInp) goalNameInp.placeholder = t.goalModalNamePlaceholder || 'Ex: Viagem, tênis novo, curso...';
      const goalAmtLbl = document.querySelector('label[for="wl-goal-custom-amount"]');
      if (goalAmtLbl) goalAmtLbl.innerText = t.goalModalAmountLabel || 'Quanto custa? (R$)';
      const goalSaveBtn = document.querySelector('#wl-goal-modal-overlay .wl-dark-pill-btn');
      if (goalSaveBtn) goalSaveBtn.innerText = t.goalModalSave || 'Salvar objetivo';

      const sheetTitle = document.getElementById('wl-sav-sheet-title');
      if (sheetTitle) sheetTitle.innerText = t.savingsSheetTitle || 'Parâmetros de economia';
      const cfgInfos = document.querySelectorAll('.wl-sav-cfg-info');
      if (cfgInfos.length >= 3) {
        cfgInfos[0].innerHTML = `<strong>${t.savingsCfgHabitual || 'Consumo habitual'}</strong><span>${t.savingsCfgHabitualDesc || 'Cigarros fumados por dia antes'}</span>`;
        cfgInfos[1].innerHTML = `<strong>${t.savingsCfgPrice || 'Preço do maço (R$)'}</strong><span>${t.savingsCfgPriceDesc || 'Valor pago em cada maço'}</span>`;
        cfgInfos[2].innerHTML = `<strong>${t.savingsCfgPerPack || 'Cigarros por maço'}</strong><span>${t.savingsCfgPerPackDesc || 'Quantidade padrão por maço'}</span>`;
      }
      const freqSub = document.querySelector('.wl-sav-cfg-sub');
      if (freqSub) freqSub.innerText = t.savingsCfgFreqTitle || 'Frequência habitual de compra';
      const freqChips = document.querySelectorAll('.wl-sav-freq-chip');
      if (freqChips.length >= 4) {
        freqChips[0].innerText = t.savingsFreqDaily || '1 por dia';
        freqChips[1].innerText = t.savingsFreq2Days || 'A cada 2 dias';
        freqChips[2].innerText = t.savingsFreq3Days || 'A cada 3 dias';
        freqChips[3].innerText = t.savingsFreqWeekly || '1 por semana';
      }
      const sheetDones = document.querySelectorAll('.wl-sav-sheet-done');
      sheetDones.forEach(btn => {
        if (btn.innerText.includes('Pronto') || btn.innerText.includes('Done') || btn.innerText.includes('Listo')) {
          btn.innerText = t.savingsCfgDone || 'Pronto';
        } else {
          btn.innerText = t.savingsHistDone || 'Fechar';
        }
      });
    }

    // Atualiza o objetivo padrão genericamente se não foi customizado
    const defaultGoalTitles = ['minha conquista', 'my achievement', 'mi logro', 'jantar especial', 'bola de futebol'];
    if (!userState.savingsGoal || !userState.savingsGoal.title || defaultGoalTitles.some(dt => userState.savingsGoal.title.toLowerCase().includes(dt))) {
      userState.savingsGoal = {
        title: t.conquistaDefaultGoal || 'Minha conquista',
        target: (userState.savingsGoal && userState.savingsGoal.target) ? userState.savingsGoal.target : 250
      };
      savePersistedState();
    }
    if (typeof window.updateConquistaBagUI === 'function') {
      window.updateConquistaBagUI();
    }

    // Modal Meta Excedida
    const metaModal = document.getElementById('meta-exceeded-modal');
    if (metaModal) {
      const h3 = metaModal.querySelector('h3');
      if (h3) h3.innerText = t.modalMetaTitle || 'Meta Excedida';
      const qP = metaModal.querySelector('p.caption');
      if (qP) qP.innerText = t.modalMetaQuestion || 'Como esta não é uma recaída, o que deseja fazer com a meta de amanhã?';
    }

    // Modais SOS
    const waterModalTitle = document.querySelector('#wl-sos-water-modal .wl-sos-modal-title');
    if (waterModalTitle) waterModalTitle.innerText = t.waterTitle;
    const waterModalDesc = document.querySelector('#wl-sos-water-modal .wl-sos-modal-desc');
    if (waterModalDesc) waterModalDesc.innerText = t.waterDesc;
    const waterDoneBtn = document.querySelector('#wl-sos-water-modal .wl-dark-pill-btn');
    if (waterDoneBtn) waterDoneBtn.innerText = t.waterDone;
    const waterBackBtn = document.querySelector('#wl-sos-water-modal .wl-light-pill-btn');
    if (waterBackBtn) waterBackBtn.innerText = t.waterBack;

    const suppTitle = document.querySelector('#wl-sos-support-modal h3');
    if (suppTitle) suppTitle.innerText = t.supportTitle;
    const suppDesc = document.querySelector('#wl-sos-support-modal .wl-sos-modal-desc');
    if (suppDesc) suppDesc.innerText = t.supportDesc;
    const suppOpts = document.querySelectorAll('#wl-sos-support-modal .wl-sos-support-opt .wl-sos-opt-text');
    if (suppOpts.length >= 2) {
      suppOpts[0].innerHTML = `<strong>${t.supportCvvTitle}</strong><span>${t.supportCvvDesc}</span>`;
      suppOpts[1].innerHTML = `<strong>${t.supportMsgTitle}</strong><span>${t.supportMsgDesc}</span>`;
    }
    const suppClose = document.querySelector('#wl-sos-support-modal .wl-light-pill-btn');
    if (suppClose) suppClose.innerText = t.supportClose;

    const fTitle = document.querySelector('#wl-sos-feedback-step-ask .wl-sos-modal-title');
    if (fTitle) fTitle.innerText = t.feedbackTitle;
    const fDesc = document.querySelector('#wl-sos-feedback-step-ask .wl-sos-modal-desc');
    if (fDesc) fDesc.innerText = t.feedbackDesc;
    const fbPass = document.querySelector('#wl-sos-feedback-step-ask .passed');
    if (fbPass) fbPass.innerHTML = `<strong>${t.feedbackPassStrong}</strong><small>${t.feedbackPassSmall}</small>`;
    const fbDec = document.querySelector('#wl-sos-feedback-step-ask .decreased');
    if (fbDec) fbDec.innerHTML = `<strong>${t.feedbackDecStrong}</strong><small>${t.feedbackDecSmall}</small>`;
    const fbStill = document.querySelector('#wl-sos-feedback-step-ask .still');
    if (fbStill) fbStill.innerHTML = `<strong>${t.feedbackStillStrong}</strong><small>${t.feedbackStillSmall}</small>`;

    // Painel Rápido de Registro (Sheet)
    const qHeaderTitle = document.getElementById('wl-qreg-header-title');
    if (qHeaderTitle) {
      qHeaderTitle.innerText = (typeof quickEditingEventId !== 'undefined' && quickEditingEventId) ? (t.qregEditTitle || 'Editar registro') : (t.qregAddTitle || 'Adicionar registro');
    }
    const qRegNoSmoke = document.getElementById('wl-qreg-confirm-lbl');
    if (qRegNoSmoke) qRegNoSmoke.innerText = t.qregNoSmokeBtn || 'Não fumei hoje';
    const qUrgeBtnSpan = document.querySelector('.wl-qreg-action-btn.blue span');
    if (qUrgeBtnSpan) qUrgeBtnSpan.innerText = t.qregUrgeBtn || 'Vontade superada';
    const qCardLbl = document.querySelector('.wl-qreg-card .wl-qreg-section-lbl');
    if (qCardLbl) qCardLbl.innerText = t.qregDateCigsLbl || 'Consumo na data';
    const qMetaSpan = document.querySelector('.wl-qreg-cig-counter span');
    if (qMetaSpan) {
      const curMeta = (userState.dailyRecords[userState.activeRegisterDateKey || getDateKey(new Date())] && userState.dailyRecords[userState.activeRegisterDateKey || getDateKey(new Date())].meta) || userState.todayMeta || 11;
      qMetaSpan.innerHTML = `/ <em id="wl-qreg-meta-num">${curMeta}</em> ${t.qregCigsUnit || 'cigarros'}`;
    }
    const qPlusBtn = document.querySelector('.wl-qreg-step-btn.plus');
    if (qPlusBtn) qPlusBtn.innerText = t.qregAddCigBtn || '+1 cigarro';
    const qMoodLbl = document.querySelector('.wl-qreg-mood-block > .wl-qreg-section-lbl');
    if (qMoodLbl) qMoodLbl.innerText = t.qregMoodQuestion || 'Como está se sentindo?';
    if (t.qregMoods) {
      document.querySelectorAll('#wl-qreg-mood-row .wl-qreg-mood-pill').forEach(pill => {
        const m = pill.dataset.mood;
        const sp = pill.querySelector('span');
        if (sp && m && t.qregMoods[m]) sp.innerText = t.qregMoods[m];
      });
    }
    if (t.qregInfluences) {
      document.querySelectorAll('#wl-qreg-influence-chips .wl-qreg-tag').forEach(tag => {
        const v = tag.dataset.val;
        if (v && t.qregInfluences[v]) tag.innerText = t.qregInfluences[v];
      });
    }
    const qNoteInp = document.getElementById('wl-qreg-mood-note');
    if (qNoteInp) qNoteInp.placeholder = t.qregNotePlaceholder || 'Nota opcional...';
    const qNoteLbl = document.getElementById('wl-qreg-mood-note-label');
    if (qNoteLbl) qNoteLbl.innerText = (t.qregNotePlaceholder || 'Nota opcional').replace(/\.\.\.$/, '');
    const qSaveMoodBtn = document.getElementById('wl-qreg-save-mood-btn');
    if (qSaveMoodBtn) qSaveMoodBtn.innerText = t.qregSaveMoodBtn || 'Salvar humor';

    // Nota ética discreta (Sobre o Habbi + Modal de Apoio do SOS)
    const ethicalText = t.ethicalNote || 'O Habbi é um protótipo acadêmico de apoio comportamental e não substitui acompanhamento médico ou psicológico.';
    const aboutEthical = document.getElementById('wl-about-ethical-note');
    if (aboutEthical) aboutEthical.innerText = ethicalText;
    const sosEthical = document.getElementById('wl-sos-ethical-note');
    if (sosEthical) sosEthical.innerText = ethicalText;

    // Modais de exclusão, confirmação sem fumar, saída do minijogo e modo teste
    const delTitle = document.getElementById('habbi-del-modal-title');
    if (delTitle) delTitle.innerText = t.delModalTitle || 'Apagar registros deste perfil?';
    const delDesc = document.getElementById('habbi-del-modal-desc');
    if (delDesc) delDesc.innerText = t.delModalDesc || 'Esta ação remove permanentemente os registros salvos neste perfil local.';
    const delBtnLbl = document.getElementById('btn-delete-profile-records-label');
    if (delBtnLbl) delBtnLbl.innerText = t.settingsDeleteRecords || 'Apagar registros deste perfil';
    const testBtn = document.getElementById('btn-local-restart-test');
    if (testBtn) testBtn.innerText = t.localRestartTestBtn || 'Reiniciar experiência de teste';
    const noSmokeModalTitle = document.getElementById('habbi-nosmoke-modal-title');
    if (noSmokeModalTitle) noSmokeModalTitle.innerText = t.noSmokeModalTitle || 'Substituir registros desta data?';
    const leaveGameTitle = document.getElementById('habbi-leave-game-title');
    if (leaveGameTitle) leaveGameTitle.innerText = t.leaveGameTitle || 'Sair da partida atual?';
    const leaveGameDesc = document.getElementById('habbi-leave-game-desc');
    if (leaveGameDesc) leaveGameDesc.innerText = t.leaveGameDesc || 'Você tem um minijogo em andamento. Se trocar de aba agora, esta partida será encerrada.';
    const leaveStayBtn = document.querySelector('#habbi-confirm-leave-game-modal .btn-primary');
    if (leaveStayBtn) leaveStayBtn.innerText = t.leaveGameStay || 'Continuar jogando';
    const leaveConfBtn = document.querySelector('#habbi-confirm-leave-game-modal .habbi-modal-btn-danger');
    if (leaveConfBtn) leaveConfBtn.innerText = t.leaveGameConfirm || 'Sair da partida';

    // Mantém o sufixo ' ✓' e estado confirmado no Painel Rápido ao trocar idioma
    if (typeof window.syncQuickRegisterModalUI === 'function') {
      window.syncQuickRegisterModalUI();
    }

    // Re-renderiza grade/eventos do Calendário e Histórico no novo idioma ativo
    if (typeof generateCalendar === 'function' && typeof userState.calViewYear === 'number') {
      generateCalendar(false);
    }
    if (typeof renderHistoryTimeline === 'function') {
      renderHistoryTimeline();
    }

    // Atualiza o tutorial se estiver em execução
    if (window.habbiTutorialActive && typeof currentTutorialStep === 'number' && typeof renderTutorialStep === 'function') {
      renderTutorialStep(currentTutorialStep);
    }
  };


  window.cycleAppLanguage = function() {
    const langOrder = ['PT', 'EN', 'ES'];
    const cur = (userState.currentLang || 'PT').toUpperCase();
    let idx = langOrder.indexOf(cur);
    if (idx === -1) idx = 0;
    const nextLang = langOrder[(idx + 1) % langOrder.length];
    window.applyAppLanguage(nextLang);
    const t = HABBI_I18N[nextLang];
    if (typeof showToast === 'function' && t) {
      showToast(t.toastLangChanged);
    }
  };

  // ==========================================================================
  // ARMAZENAMENTO ISOLADO POR PERFIL (PRONTO PARA user.id DO SUPABASE)
  // ==========================================================================
  const RECORDS_STORAGE_KEY = 'habbi-real-records-v2'; // Chave legada (somente leitura na migração)
  const PROFILES_INDEX_KEY = 'habbi-profiles-index-v1';
  const ACTIVE_SESSION_KEY = 'habbi-active-session-v1';
  const PROFILE_DATA_PREFIX = 'habbi-profile-data:';
  const LEGACY_MIGRATION_BACKUP_KEY = 'habbi-legacy-migration-backup-v1';
  const STORAGE_MIGRATION_DONE_KEY = 'habbi-storage-migration-v1-done';
  const GUEST_PROFILE_ID = 'prof_guest_local';
  const LEGACY_KEYS_TO_BACKUP = [
    'habbi-real-records-v2',
    'habbi-game-records',
    'habbi-onboarding-completed',
    'habbi-tutorial-completed',
    'habbi-first-goal-set',
    'habbi-sacola-100-celebrated',
    'habbi-theme',
    'habbi-app-lang',
    'habbi-current-screen'
  ];

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
  }

  function getProfileStorageKey(profileId) {
    return `${PROFILE_DATA_PREFIX}${profileId}`;
  }

  function createEmptyProfilesIndex() {
    return {
      version: 1,
      profiles: {},
      emailToProfileId: {},
      supabaseIdToProfileId: {},
      testCounter: 0
    };
  }

  function loadProfilesIndex() {
    try {
      const raw = localStorage.getItem(PROFILES_INDEX_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            version: 1,
            profiles: (parsed.profiles && typeof parsed.profiles === 'object') ? parsed.profiles : {},
            emailToProfileId: (parsed.emailToProfileId && typeof parsed.emailToProfileId === 'object') ? parsed.emailToProfileId : {},
            supabaseIdToProfileId: (parsed.supabaseIdToProfileId && typeof parsed.supabaseIdToProfileId === 'object') ? parsed.supabaseIdToProfileId : {},
            testCounter: typeof parsed.testCounter === 'number' && parsed.testCounter >= 0 ? parsed.testCounter : 0
          };
        }
      }
    } catch (_e) {}
    return createEmptyProfilesIndex();
  }

  function saveProfilesIndex(idx) {
    try {
      localStorage.setItem(PROFILES_INDEX_KEY, JSON.stringify(idx));
    } catch (_e) {}
  }

  function loadActiveSession() {
    try {
      const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const mode = ['guest', 'account', 'test', 'signed-out'].includes(parsed.mode) ? parsed.mode : 'guest';
          const activeProfileId = typeof parsed.activeProfileId === 'string' && parsed.activeProfileId.trim()
            ? parsed.activeProfileId.trim()
            : null;
          return { mode, activeProfileId };
        }
      }
    } catch (_e) {}
    return null;
  }

  function saveActiveSession(session) {
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({
        mode: session.mode,
        activeProfileId: session.activeProfileId || null
      }));
    } catch (_e) {}
  }

  function createFreshProfileSnapshot(overrides = {}) {
    const lang = (overrides.currentLang || 'PT').toUpperCase();
    return {
      name: overrides.name || '',
      email: overrides.email || '',
      avatar: overrides.avatar || 'verde',
      currentLang: lang,
      theme: overrides.theme === 'dark' ? 'dark' : 'light',
      dailyRecords: (overrides.dailyRecords && typeof overrides.dailyRecords === 'object') ? overrides.dailyRecords : {},
      todayMeta: (typeof overrides.todayMeta === 'number' && overrides.todayMeta >= 0) ? overrides.todayMeta : 11,
      habitualCigs: (typeof overrides.habitualCigs === 'number' && overrides.habitualCigs >= 1) ? overrides.habitualCigs : 12,
      habitualCigsCustomized: Boolean(overrides.habitualCigsCustomized),
      yearsSmoking: overrides.yearsSmoking || 'Menos de 1',
      lastGoalPromptDateKey: overrides.lastGoalPromptDateKey || null,
      packPrice: (typeof overrides.packPrice === 'number' && overrides.packPrice > 0) ? overrides.packPrice : 12.00,
      cigsPerPack: (typeof overrides.cigsPerPack === 'number' && overrides.cigsPerPack >= 1) ? overrides.cigsPerPack : 20,
      packFreqDays: (typeof overrides.packFreqDays === 'number' && overrides.packFreqDays >= 1) ? overrides.packFreqDays : 2,
      packEvents: Array.isArray(overrides.packEvents) ? overrides.packEvents : [],
      cigarettesAvoided: (typeof overrides.cigarettesAvoided === 'number' && overrides.cigarettesAvoided >= 0) ? overrides.cigarettesAvoided : 0,
      savingsHistory: Array.isArray(overrides.savingsHistory) ? overrides.savingsHistory : [],
      savingsGoal: (overrides.savingsGoal && typeof overrides.savingsGoal.title === 'string')
        ? overrides.savingsGoal
        : { title: getDefaultGoalTitle(lang), target: 250 },
      gameRecords: (overrides.gameRecords && typeof overrides.gameRecords === 'object')
        ? {
            memory: Number(overrides.gameRecords.memory) || 0,
            sequence: Number(overrides.gameRecords.sequence) || 0,
            reflex: Number(overrides.gameRecords.reflex) || 0,
            math: Number(overrides.gameRecords.math) || 0
          }
        : { memory: 0, sequence: 0, reflex: 0, math: 0 },
      onboardingCompleted: Boolean(overrides.onboardingCompleted),
      tutorialCompleted: Boolean(overrides.tutorialCompleted),
      hasConfiguredFirstGoal: Boolean(overrides.hasConfiguredFirstGoal),
      sacola100Celebrated: Boolean(overrides.sacola100Celebrated),
      currentScreen: (typeof overrides.currentScreen === 'number' && overrides.currentScreen >= 1) ? overrides.currentScreen : 1
    };
  }

  function loadProfileSnapshot(profileId) {
    if (!profileId) return null;
    try {
      const raw = localStorage.getItem(getProfileStorageKey(profileId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return createFreshProfileSnapshot(parsed);
      }
    } catch (_e) {}
    return null;
  }

  function saveProfileSnapshot(profileId, snapshot) {
    if (!profileId || !snapshot) return;
    try {
      localStorage.setItem(getProfileStorageKey(profileId), JSON.stringify(snapshot));
      const idx = loadProfilesIndex();
      if (idx.profiles[profileId]) {
        idx.profiles[profileId].updatedAt = new Date().toISOString();
        saveProfilesIndex(idx);
      }
    } catch (_e) {}
  }

  function ensureGuestProfile() {
    const idx = loadProfilesIndex();
    const nowIso = new Date().toISOString();
    if (!idx.profiles[GUEST_PROFILE_ID]) {
      idx.profiles[GUEST_PROFILE_ID] = {
        id: GUEST_PROFILE_ID,
        kind: 'guest',
        supabaseUserId: null,
        email: null,
        label: 'Visitante',
        createdAt: nowIso,
        updatedAt: nowIso
      };
      saveProfilesIndex(idx);
    }
    return GUEST_PROFILE_ID;
  }

  function resolveAccountProfileId({ supabaseUserId = null, email = null, label = null } = {}) {
    const idx = loadProfilesIndex();
    const normEmail = normalizeEmail(email);
    const supaId = (typeof supabaseUserId === 'string' && supabaseUserId.trim()) ? supabaseUserId.trim() : null;
    const nowIso = new Date().toISOString();

    let foundId = null;
    if (supaId && idx.supabaseIdToProfileId[supaId] && idx.profiles[idx.supabaseIdToProfileId[supaId]]) {
      foundId = idx.supabaseIdToProfileId[supaId];
    } else if (normEmail && idx.emailToProfileId[normEmail] && idx.profiles[idx.emailToProfileId[normEmail]]) {
      foundId = idx.emailToProfileId[normEmail];
    }

    if (foundId) {
      const meta = idx.profiles[foundId];
      if (supaId && !meta.supabaseUserId) {
        meta.supabaseUserId = supaId;
        idx.supabaseIdToProfileId[supaId] = foundId;
      }
      if (normEmail && !meta.email) {
        meta.email = normEmail;
        idx.emailToProfileId[normEmail] = foundId;
      }
      if (label && !meta.label) {
        meta.label = label;
      }
      meta.updatedAt = nowIso;
      saveProfilesIndex(idx);
      return foundId;
    }

    const rand = Math.random().toString(36).slice(2, 8);
    const newId = `prof_acct_${Date.now().toString(36)}_${rand}`;
    idx.profiles[newId] = {
      id: newId,
      kind: 'account',
      supabaseUserId: supaId,
      email: normEmail || null,
      label: label || (normEmail ? normEmail.split('@')[0] : null),
      createdAt: nowIso,
      updatedAt: nowIso
    };
    if (normEmail) idx.emailToProfileId[normEmail] = newId;
    if (supaId) idx.supabaseIdToProfileId[supaId] = newId;
    saveProfilesIndex(idx);
    return newId;
  }

  function createTestProfile() {
    const idx = loadProfilesIndex();
    const nowTs = Date.now();
    const nowIso = new Date(nowTs).toISOString();
    idx.testCounter = (typeof idx.testCounter === 'number' ? idx.testCounter : 0) + 1;
    const testId = `prof_test_${idx.testCounter}_${nowTs}`;
    idx.profiles[testId] = {
      id: testId,
      kind: 'test',
      supabaseUserId: null,
      email: null,
      label: `Teste #${idx.testCounter}`,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    saveProfilesIndex(idx);
    saveProfileSnapshot(testId, createFreshProfileSnapshot({ currentLang: 'PT', theme: 'light', currentScreen: 1 }));
    return testId;
  }

  function clearAuthFormInputs() {
    ['login-email', 'login-password', 'register-name', 'register-email', 'register-password', 'edit-account-name', 'edit-account-email', 'edit-account-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    ['login-error-msg', 'register-error-msg'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = '';
        el.style.display = 'none';
      }
    });
  }

  function resetInMemoryUserState(langOverride) {
    const nowReset = new Date();
    const lang = (langOverride || userState.currentLang || 'PT').toUpperCase();
    userState.name = '';
    userState.email = '';
    userState.avatar = 'verde';
    userState.isAuthenticated = false;
    userState.currentLang = lang;
    userState.theme = 'light';
    userState.motivations = [];
    userState.patterns = [];
    userState.mood = null;
    userState.sosUrge = 7;
    userState.sosContext = 'Casa';
    userState.sosTime = '3 min';
    userState.selectedIntervention = 'Respiração 4-6';
    userState.groundingCheckedCount = 0;
    userState.daysClean = 0;
    userState.daysGoalMet = 0;
    userState.totalUrgesOvercome = 0;
    userState.todayMeta = 11;
    userState.todayLogged = 0;
    userState.metaExceededModalShown = false;
    userState.isGameActive = false;
    userState.calViewYear = nowReset.getFullYear();
    userState.calViewMonth = nowReset.getMonth();
    userState.calSelectedDate = getDateKey(nowReset);
    userState.calEventsExpandedDate = null;
    userState.activeRegisterDateKey = getDateKey(nowReset);
    userState.dailyRecords = {};
    userState.successDaysList = [];
    userState.relapseDaysList = [];
    userState.warningDaysList = [];
    userState.historyEvents = [];
    userState.habitualCigs = 12;
    userState.habitualCigsCustomized = false;
    userState.yearsSmoking = 'Menos de 1';
    userState.packPrice = 12.00;
    userState.cigsPerPack = 20;
    userState.packFreqDays = 2;
    userState.packEvents = [];
    userState.totalSavings = 0.00;
    userState.cigarettesAvoided = 0;
    userState.savingsHistory = [];
    userState.savingsGoal = { title: getDefaultGoalTitle(lang), target: 250 };
    userState.gameRecords = { memory: 0, sequence: 0, reflex: 0, math: 0 };
    userState.onboardingCompleted = false;
    userState.lastGoalPromptDateKey = null;
    userState.suggestedMetaCustomized = false;
    userState.tutorialCompleted = false;
    userState.hasConfiguredFirstGoal = false;
    userState.sacola100Celebrated = false;
    userState.currentScreenSaved = 1;
  }

  function extractCurrentStateSnapshot() {
    return {
      name: userState.name || '',
      email: userState.email || '',
      avatar: userState.avatar || 'verde',
      currentLang: userState.currentLang || 'PT',
      theme: userState.theme === 'dark' ? 'dark' : 'light',
      dailyRecords: userState.dailyRecords || {},
      todayMeta: (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11,
      habitualCigs: userState.habitualCigs || 12,
      habitualCigsCustomized: Boolean(userState.habitualCigsCustomized),
      yearsSmoking: userState.yearsSmoking || 'Menos de 1',
      lastGoalPromptDateKey: userState.lastGoalPromptDateKey || null,
      packPrice: userState.packPrice || 12.00,
      cigsPerPack: userState.cigsPerPack || 20,
      packFreqDays: userState.packFreqDays || 2,
      packEvents: Array.isArray(userState.packEvents) ? userState.packEvents : [],
      cigarettesAvoided: userState.cigarettesAvoided || 0,
      savingsHistory: Array.isArray(userState.savingsHistory) ? userState.savingsHistory : [],
      savingsGoal: userState.savingsGoal || { title: getDefaultGoalTitle(userState.currentLang), target: 250 },
      gameRecords: (userState.gameRecords && typeof userState.gameRecords === 'object')
        ? {
            memory: Number(userState.gameRecords.memory) || 0,
            sequence: Number(userState.gameRecords.sequence) || 0,
            reflex: Number(userState.gameRecords.reflex) || 0,
            math: Number(userState.gameRecords.math) || 0
          }
        : { memory: 0, sequence: 0, reflex: 0, math: 0 },
      onboardingCompleted: Boolean(userState.onboardingCompleted),
      tutorialCompleted: Boolean(userState.tutorialCompleted),
      hasConfiguredFirstGoal: Boolean(userState.hasConfiguredFirstGoal),
      sacola100Celebrated: Boolean(userState.sacola100Celebrated),
      currentScreen: typeof currentScreen === 'number' ? currentScreen : (userState.currentScreenSaved || 1)
    };
  }

  function applySnapshotToUserState(snapshot, isAccountProfile) {
    const clean = createFreshProfileSnapshot(snapshot || {});
    resetInMemoryUserState(clean.currentLang);
    userState.name = clean.name;
    userState.email = clean.email;
    userState.avatar = clean.avatar;
    userState.currentLang = clean.currentLang;
    userState.theme = clean.theme;
    userState.isAuthenticated = Boolean(isAccountProfile);
    userState.dailyRecords = clean.dailyRecords;
    userState.todayMeta = clean.todayMeta;
    userState.habitualCigs = clean.habitualCigs;
    userState.habitualCigsCustomized = clean.habitualCigsCustomized;
    userState.yearsSmoking = clean.yearsSmoking || 'Menos de 1';
    userState.packPrice = clean.packPrice;
    userState.cigsPerPack = clean.cigsPerPack;
    userState.packFreqDays = clean.packFreqDays;
    userState.packEvents = clean.packEvents;
    userState.cigarettesAvoided = clean.cigarettesAvoided;
    userState.savingsHistory = clean.savingsHistory;
    if (clean.savingsGoal && typeof clean.savingsGoal.title === 'string') {
      const lower = clean.savingsGoal.title.toLowerCase();
      if (lower.includes('bola') || lower === 'jantar especial' || !clean.savingsGoal.title.trim()) {
        userState.savingsGoal = { title: getDefaultGoalTitle(clean.currentLang), target: clean.savingsGoal.target || 250 };
      } else {
        userState.savingsGoal = clean.savingsGoal;
      }
    }
    userState.gameRecords = clean.gameRecords;
    userState.onboardingCompleted = clean.onboardingCompleted;
    userState.lastGoalPromptDateKey = clean.lastGoalPromptDateKey || null;
    userState.tutorialCompleted = clean.tutorialCompleted;
    userState.hasConfiguredFirstGoal = clean.hasConfiguredFirstGoal;
    userState.sacola100Celebrated = clean.sacola100Celebrated;
    userState.currentScreenSaved = clean.currentScreen;
  }

  function runLegacyStorageMigrationIfNeeded() {
    try {
      if (localStorage.getItem(STORAGE_MIGRATION_DONE_KEY) === '1') {
        return;
      }

      const legacyBackupMap = {};
      let hasAnyLegacyData = false;
      LEGACY_KEYS_TO_BACKUP.forEach(k => {
        const val = localStorage.getItem(k);
        if (val !== null) {
          legacyBackupMap[k] = val;
          hasAnyLegacyData = true;
        }
      });

      if (hasAnyLegacyData) {
        // 1. Grava backup pré-migração intacto (somente se ainda não existir)
        if (!localStorage.getItem(LEGACY_MIGRATION_BACKUP_KEY)) {
          localStorage.setItem(LEGACY_MIGRATION_BACKUP_KEY, JSON.stringify({
            version: 1,
            backedUpAt: new Date().toISOString(),
            keys: legacyBackupMap
          }));
        }

        // 2. Parseia dados legados com segurança
        let legacyParsed = {};
        if (legacyBackupMap[RECORDS_STORAGE_KEY]) {
          try {
            const p = JSON.parse(legacyBackupMap[RECORDS_STORAGE_KEY]);
            if (p && typeof p === 'object') legacyParsed = p;
          } catch (_e) {}
        }

        let legacyGames = { memory: 0, sequence: 0, reflex: 0, math: 0 };
        if (legacyBackupMap['habbi-game-records']) {
          try {
            const g = JSON.parse(legacyBackupMap['habbi-game-records']);
            if (g && typeof g === 'object') legacyGames = g;
          } catch (_e) {}
        }

        const isLegacyAccount = Boolean(legacyParsed.isAuthenticated && typeof legacyParsed.email === 'string' && legacyParsed.email.trim());
        const targetProfileId = isLegacyAccount
          ? resolveAccountProfileId({ email: legacyParsed.email, label: legacyParsed.name || null })
          : ensureGuestProfile();
        const targetMode = isLegacyAccount ? 'account' : 'guest';

        // 3. Migra sem duplicar caso o cofre de destino ainda não exista
        if (!localStorage.getItem(getProfileStorageKey(targetProfileId))) {
          const migratedSnapshot = createFreshProfileSnapshot({
            name: typeof legacyParsed.name === 'string' ? legacyParsed.name : '',
            email: typeof legacyParsed.email === 'string' ? legacyParsed.email : '',
            avatar: typeof legacyParsed.avatar === 'string' ? legacyParsed.avatar : 'verde',
            currentLang: typeof legacyParsed.currentLang === 'string'
              ? legacyParsed.currentLang
              : (legacyBackupMap['habbi-app-lang'] || 'PT'),
            theme: legacyBackupMap['habbi-theme'] === 'dark' ? 'dark' : 'light',
            dailyRecords: (legacyParsed.dailyRecords && typeof legacyParsed.dailyRecords === 'object') ? legacyParsed.dailyRecords : {},
            todayMeta: legacyParsed.todayMeta,
            habitualCigs: legacyParsed.habitualCigs || legacyParsed.todayMeta,
            habitualCigsCustomized: legacyParsed.habitualCigsCustomized,
            packPrice: legacyParsed.packPrice,
            cigsPerPack: legacyParsed.cigsPerPack,
            packFreqDays: legacyParsed.packFreqDays,
            packEvents: legacyParsed.packEvents,
            cigarettesAvoided: legacyParsed.cigarettesAvoided,
            savingsHistory: legacyParsed.savingsHistory,
            savingsGoal: legacyParsed.savingsGoal,
            gameRecords: legacyGames,
            onboardingCompleted: legacyBackupMap['habbi-onboarding-completed'] === '1',
            tutorialCompleted: Boolean(legacyParsed.tutorialCompleted) || legacyBackupMap['habbi-tutorial-completed'] === '1',
            hasConfiguredFirstGoal: Boolean(legacyParsed.hasConfiguredFirstGoal) || legacyBackupMap['habbi-first-goal-set'] === '1',
            sacola100Celebrated: legacyBackupMap['habbi-sacola-100-celebrated'] === 'true' || legacyBackupMap['habbi-sacola-100-celebrated'] === '1',
            currentScreen: parseInt(legacyBackupMap['habbi-current-screen'], 10) || 1
          });
          saveProfileSnapshot(targetProfileId, migratedSnapshot);
        }

        if (!loadActiveSession()) {
          saveActiveSession({ mode: targetMode, activeProfileId: targetProfileId });
        }
      }

      localStorage.setItem(STORAGE_MIGRATION_DONE_KEY, '1');
    } catch (_e) {
      // Nunca impede inicialização do app
    }
  }

  function ensureActiveProfileForWrite() {
    let session = loadActiveSession();
    if (!session || session.mode === 'signed-out' || !session.activeProfileId) {
      const guestId = ensureGuestProfile();
      session = { mode: 'guest', activeProfileId: guestId };
      saveActiveSession(session);
    }
    return session;
  }

  function loadPersistedState() {
    try {
      runLegacyStorageMigrationIfNeeded();
      let session = loadActiveSession();

      if (!session) {
        const guestId = ensureGuestProfile();
        session = { mode: 'guest', activeProfileId: guestId };
        saveActiveSession(session);
      }

      if (session.mode === 'signed-out' || !session.activeProfileId) {
        resetInMemoryUserState(localStorage.getItem('habbi-app-lang') || 'PT');
        return;
      }

      const snap = loadProfileSnapshot(session.activeProfileId);
      const isAccount = session.mode === 'account';
      if (snap) {
        applySnapshotToUserState(snap, isAccount);
      } else {
        const fallbackLang = localStorage.getItem('habbi-app-lang') || 'PT';
        resetInMemoryUserState(fallbackLang);
        userState.isAuthenticated = isAccount;
        saveProfileSnapshot(session.activeProfileId, extractCurrentStateSnapshot());
      }
    } catch (_e) {
      // Ignora erro de leitura no localStorage
    }
  }

  function savePersistedState() {
    try {
      const session = loadActiveSession();
      if (!session || session.mode === 'signed-out' || !session.activeProfileId) {
        // Sessão encerrada: não sobrescreve nem recria cofre de nenhum perfil
        return;
      }
      const payload = extractCurrentStateSnapshot();
      saveProfileSnapshot(session.activeProfileId, payload);
      localStorage.setItem('habbi-app-lang', userState.currentLang || 'PT');
      localStorage.setItem('habbi-theme', userState.theme === 'dark' ? 'dark' : 'light');
    } catch (_e) {
      // Ignora erro de gravação no localStorage
    }
  }
  window.savePersistedState = savePersistedState;
  window.getActiveHabbiSession = loadActiveSession;
  window.getHabbiProfilesIndex = loadProfilesIndex;

  /**
   * NOTA DE ARQUITETURA E SEGURANÇA SOBRE AUTENTICAÇÃO:
   * A flag `userState.isAuthenticated` armazenada no localStorage é estritamente
   * um estado de interface/sessão para mock/uso local do usuário no frontend.
   * Ela NÃO constitui autenticação criptográfica segura (não utiliza tokens assinados,
   * JWTs emitidos por servidor, HTTPS auth cookies nem hash de credenciais).
   * Para qualquer ambiente com múltiplos usuários ou dados sensíveis em nuvem,
   * é mandatória a integração com um backend seguro (OAuth2/OpenID/Firebase/Supabase).
   */

  /**
   * Exporta um snapshot completo e verificável de todos os dados do Habbi.
   * @returns {Object} Pacote de dados contendo registros, metas, avatar, histórico e checksum.
   */
  function habbiExportData() {
    try {
      savePersistedState();
      const session = loadActiveSession();
      const activeSnap = (session && session.activeProfileId)
        ? (loadProfileSnapshot(session.activeProfileId) || extractCurrentStateSnapshot())
        : extractCurrentStateSnapshot();

      const allHabbiKeys = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('habbi-')) {
          allHabbiKeys[k] = localStorage.getItem(k);
        }
      }

      const snapshot = {
        app: 'Habbi',
        schemaVersion: '3.0.0',
        exportedAt: new Date().toISOString(),
        activeProfileId: (session && session.activeProfileId) || null,
        userState: {
          name: userState.name || '',
          email: userState.email || '',
          avatar: userState.avatar || 'verde',
          currentLang: userState.currentLang || 'PT',
          theme: userState.theme === 'dark' ? 'dark' : 'light',
          isAuthenticated: Boolean(userState.isAuthenticated),
          todayMeta: (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11,
          habitualCigs: userState.habitualCigs || 12,
          habitualCigsCustomized: Boolean(userState.habitualCigsCustomized),
          lastGoalPromptDateKey: userState.lastGoalPromptDateKey || null,
          packPrice: userState.packPrice || 15,
          cigsPerPack: userState.cigsPerPack || 20,
          packFreqDays: userState.packFreqDays || 2,
          packEvents: Array.isArray(userState.packEvents) ? userState.packEvents : [],
          cigarettesAvoided: userState.cigarettesAvoided || 0,
          savingsHistory: Array.isArray(userState.savingsHistory) ? userState.savingsHistory : [],
          savingsGoal: userState.savingsGoal || null,
          gameRecords: userState.gameRecords || { memory: 0, sequence: 0, reflex: 0, math: 0 },
          dailyRecords: userState.dailyRecords || {}
        },
        persistedPayload: activeSnap,
        allHabbiLocalStorage: allHabbiKeys
      };

      // Checksum simples e determinístico para verificação de integridade
      const jsonString = JSON.stringify(snapshot.userState);
      let hash = 0;
      for (let i = 0; i < jsonString.length; i++) {
        hash = ((hash << 5) - hash) + jsonString.charCodeAt(i);
        hash |= 0;
      }
      snapshot.checksum = 'HBB-' + Math.abs(hash).toString(16);

      return snapshot;
    } catch (err) {
      console.error('[Habbi Export Error]', err);
      return null;
    }
  }

  function isPlainObject(val) {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  function hasDangerousKey(obj) {
    if (!isPlainObject(obj)) return false;
    return Object.prototype.hasOwnProperty.call(obj, '__proto__')
      || Object.prototype.hasOwnProperty.call(obj, 'constructor')
      || Object.prototype.hasOwnProperty.call(obj, 'prototype');
  }

  function isFiniteNumberInRange(val, min, max) {
    return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
  }

  /**
   * Valida um pacote de backup exportado sem alterar o estado atual.
   * @param {Object|string} data Backup a ser validado.
   * @returns {Object} { valid: boolean, errors: string[], summary: Object }
   */
  function habbiValidateBackup(data) {
    const errors = [];
    let parsed = data;
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        return { valid: false, errors: ['JSON inválido ou corrompido: ' + e.message], summary: null };
      }
    }
    if (!isPlainObject(parsed) || hasDangerousKey(parsed)) {
      return { valid: false, errors: ['Objeto de backup ausente, nulo ou malformado.'], summary: null };
    }
    const state = parsed.userState || parsed.persistedPayload;
    if (!isPlainObject(state) || hasDangerousKey(state)) {
      errors.push('Falta seção "userState" ou "persistedPayload" válida no backup.');
    } else {
      // Validação de strings escalares opcionais
      const optionalStrings = ['name', 'email', 'avatar', 'currentLang', 'theme'];
      optionalStrings.forEach(field => {
        if (state[field] !== undefined && state[field] !== null && typeof state[field] !== 'string') {
          errors.push(`"${field}" deve ser texto.`);
        }
      });

      // Validação de números opcionais
      const numericBounds = {
        todayMeta: [1, 200],
        habitualCigs: [1, 200],
        packPrice: [0, 10000],
        cigsPerPack: [1, 200],
        packFreqDays: [1, 365],
        cigarettesAvoided: [0, 10000000]
      };
      Object.keys(numericBounds).forEach(field => {
        if (state[field] !== undefined && state[field] !== null) {
          const [min, max] = numericBounds[field];
          if (!isFiniteNumberInRange(state[field], min, max)) {
            errors.push(`"${field}" deve ser um número válido entre ${min} e ${max}.`);
          }
        }
      });

      // Validação estrita de dailyRecords
      if (!isPlainObject(state.dailyRecords) || hasDangerousKey(state.dailyRecords)) {
        errors.push('"dailyRecords" ausente ou inválido.');
      } else {
        const dateKeyRe = /^\d{4}-\d{2}-\d{2}$/;
        const recKeys = Object.keys(state.dailyRecords);
        for (let i = 0; i < recKeys.length; i++) {
          const dKey = recKeys[i];
          if (!dateKeyRe.test(dKey)) {
            errors.push(`Chave de data inválida em "dailyRecords": ${dKey}`);
            break;
          }
          const rec = state.dailyRecords[dKey];
          if (!isPlainObject(rec) || hasDangerousKey(rec)) {
            errors.push(`Registro diário inválido para ${dKey}.`);
            break;
          }
          if (rec.cigs !== undefined && !isFiniteNumberInRange(rec.cigs, 0, 500)) {
            errors.push(`"cigs" inválido em ${dKey}.`);
            break;
          }
          if (rec.meta !== undefined && !isFiniteNumberInRange(rec.meta, 1, 200)) {
            errors.push(`"meta" inválido em ${dKey}.`);
            break;
          }
          if (rec.events !== undefined) {
            if (!Array.isArray(rec.events)) {
              errors.push(`"events" deve ser lista em ${dKey}.`);
              break;
            }
            for (let j = 0; j < rec.events.length; j++) {
              const ev = rec.events[j];
              if (!isPlainObject(ev) || hasDangerousKey(ev) || typeof ev.kind !== 'string' || !ev.kind.trim()) {
                errors.push(`Evento malformado em ${dKey}[${j}].`);
                break;
              }
              const evStrFields = ['id', 'title', 'desc', 'detail', 'note', 'time', 'clock', 'moodValue', 'type'];
              let badField = false;
              for (let k = 0; k < evStrFields.length; k++) {
                const f = evStrFields[k];
                if (ev[f] !== undefined && ev[f] !== null && typeof ev[f] !== 'string' && typeof ev[f] !== 'number') {
                  errors.push(`Campo "${f}" inválido em evento ${dKey}[${j}].`);
                  badField = true;
                  break;
                }
              }
              if (badField) break;
              if (ev.influences !== undefined && (!Array.isArray(ev.influences) || ev.influences.some(x => typeof x !== 'string'))) {
                errors.push(`Campo "influences" inválido em evento ${dKey}[${j}].`);
                break;
              }
            }
          }
        }
      }

      // Validação de savingsHistory
      if (state.savingsHistory !== undefined) {
        if (!Array.isArray(state.savingsHistory)) {
          errors.push('"savingsHistory" deve ser uma lista.');
        } else {
          for (let i = 0; i < state.savingsHistory.length; i++) {
            const sh = state.savingsHistory[i];
            if (!isPlainObject(sh) || hasDangerousKey(sh)) {
              errors.push(`Item inválido em "savingsHistory"[${i}].`);
              break;
            }
            if (sh.title !== undefined && typeof sh.title !== 'string') {
              errors.push(`"savingsHistory"[${i}].title deve ser texto.`);
              break;
            }
            if (sh.amount !== undefined && !isFiniteNumberInRange(sh.amount, -1000000, 1000000)) {
              errors.push(`"savingsHistory"[${i}].amount deve ser numérico.`);
              break;
            }
          }
        }
      }

      // Validação de packEvents
      if (state.packEvents !== undefined) {
        if (!Array.isArray(state.packEvents)) {
          errors.push('"packEvents" deve ser uma lista.');
        } else {
          for (let i = 0; i < state.packEvents.length; i++) {
            const pe = state.packEvents[i];
            if (!isPlainObject(pe) || hasDangerousKey(pe)) {
              errors.push(`Item inválido em "packEvents"[${i}].`);
              break;
            }
            if (pe.price !== undefined && !isFiniteNumberInRange(pe.price, 0, 10000)) {
              errors.push(`"packEvents"[${i}].price deve ser numérico.`);
              break;
            }
            if (pe.kind !== undefined && typeof pe.kind !== 'string') {
              errors.push(`"packEvents"[${i}].kind deve ser texto.`);
              break;
            }
          }
        }
      }

      // Validação de savingsGoal
      if (state.savingsGoal !== undefined && state.savingsGoal !== null) {
        if (!isPlainObject(state.savingsGoal) || hasDangerousKey(state.savingsGoal)) {
          errors.push('"savingsGoal" inválido.');
        } else {
          if (state.savingsGoal.title !== undefined && typeof state.savingsGoal.title !== 'string') {
            errors.push('"savingsGoal.title" deve ser texto.');
          }
          if (state.savingsGoal.target !== undefined && !isFiniteNumberInRange(state.savingsGoal.target, 1, 10000000)) {
            errors.push('"savingsGoal.target" deve ser numérico positivo.');
          }
        }
      }
    }

    // Validação de allHabbiLocalStorage (quando presente)
    if (parsed.allHabbiLocalStorage !== undefined) {
      if (!isPlainObject(parsed.allHabbiLocalStorage) || hasDangerousKey(parsed.allHabbiLocalStorage)) {
        errors.push('"allHabbiLocalStorage" deve ser um objeto válido.');
      } else {
        const lsKeys = Object.keys(parsed.allHabbiLocalStorage);
        for (let i = 0; i < lsKeys.length; i++) {
          const k = lsKeys[i];
          if (!k.startsWith('habbi-') || typeof parsed.allHabbiLocalStorage[k] !== 'string') {
            errors.push(`Entrada inválida em "allHabbiLocalStorage": ${k}`);
            break;
          }
        }
      }
    }

    const dailyKeys = (state && isPlainObject(state.dailyRecords)) ? Object.keys(state.dailyRecords) : [];
    const summary = {
      app: parsed.app || 'Desconhecido',
      schemaVersion: parsed.schemaVersion || '1.0',
      exportedAt: parsed.exportedAt || 'Desconhecido',
      totalDaysWithRecords: dailyKeys.length,
      hasSavingsGoal: Boolean(state && state.savingsGoal),
      avatar: (state && typeof state.avatar === 'string' && state.avatar) || 'verde',
      checksum: parsed.checksum || 'Nenhum'
    };

    return {
      valid: errors.length === 0,
      errors: errors,
      summary: summary
    };
  }

  /**
   * Restaura dados a partir de um backup.
   * @param {Object|string} data Dados a serem restaurados.
   * @param {Object} options Opções de restauração. Se `dryRun: true`, apenas testa sem gravar.
   * @returns {Object} Resultado da operação.
   */
  function habbiRestoreData(data, options = { dryRun: false }) {
    const isDryRun = options && options.dryRun === true;
    const validation = habbiValidateBackup(data);
    if (!validation.valid) {
      return {
        success: false,
        dryRun: isDryRun,
        errors: validation.errors,
        summary: validation.summary
      };
    }

    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const incomingState = parsed.userState || parsed.persistedPayload;

    if (isDryRun) {
      return {
        success: true,
        dryRun: true,
        message: 'Teste de integridade e restauração bem-sucedido (modo simulação: nenhum dado real foi alterado).',
        summary: validation.summary
      };
    }

    // Execução real da restauração
    try {
      if (isPlainObject(parsed.allHabbiLocalStorage)) {
        Object.keys(parsed.allHabbiLocalStorage).forEach(key => {
          if (!key.startsWith('habbi-') || typeof parsed.allHabbiLocalStorage[key] !== 'string') return;
          if (key === LEGACY_MIGRATION_BACKUP_KEY && localStorage.getItem(LEGACY_MIGRATION_BACKUP_KEY)) return;
          try {
            localStorage.setItem(key, parsed.allHabbiLocalStorage[key]);
          } catch (_e) {}
        });
      }

      if (isPlainObject(incomingState)) {
        const activeSess = ensureActiveProfileForWrite();
        const restoredSnap = createFreshProfileSnapshot(incomingState);
        saveProfileSnapshot(activeSess.activeProfileId, restoredSnap);
      }

      loadPersistedState();
      refreshAllViews();

      return {
        success: true,
        dryRun: false,
        message: 'Dados do Habbi restaurados com sucesso.',
        summary: validation.summary
      };
    } catch (err) {
      return {
        success: false,
        dryRun: false,
        errors: [err.message],
        summary: validation.summary
      };
    }
  }

  /**
   * Aciona o download de um arquivo JSON de backup diretamente no navegador do usuário.
   */
  function habbiDownloadBackupFile() {
    const data = habbiExportData();
    if (!data) {
      alert('Erro ao gerar exportação dos dados.');
      return;
    }
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = getDateKey(new Date());
    a.href = url;
    a.download = `habbi-backup-dados-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Exporta utilitários de dados no escopo global para acesso programático e console
  window.habbiExportData = habbiExportData;
  window.habbiValidateBackup = habbiValidateBackup;
  window.habbiRestoreData = habbiRestoreData;
  window.habbiDownloadBackupFile = habbiDownloadBackupFile;

  function getSafeTodayMeta() {
    return (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11;
  }
  window.getSafeTodayMeta = getSafeTodayMeta;

  function getOrCreateDayRecord(dateKey) {
    const key = dateKey || getDateKey(new Date());
    if (!userState.dailyRecords[key]) {
      userState.dailyRecords[key] = {
        dateKey: key,
        cigs: 0,
        meta: getSafeTodayMeta(),
        smokeFree: false,
        dayCompleted: false,
        urges: 0,
        mood: null,
        events: []
      };
    }
    return userState.dailyRecords[key];
  }

  function recomputeDayAggregates(record) {
    if (!record) return;
    if (typeof record.meta !== 'number' || record.meta < 0) record.meta = getSafeTodayMeta();
    const meta = record.meta;
    const events = Array.isArray(record.events) ? record.events : [];
    let cigs = 0;
    let urges = 0;
    let hasSmokeFreeMark = false;
    let hasDayCompleteMark = false;
    let latestMood = null;

    // Percorre do registro mais antigo para o mais recente para numerar cada cigarro individualmente
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];
      if (!ev) continue;
      if (ev.kind === 'smoke') {
        cigs++;
        ev.cigNumber = cigs;
        ev.isExceeded = cigs > meta;
        ev.type = ev.isExceeded ? 'acima-meta' : 'sucesso';
        ev.title = ev.isExceeded
          ? `Cigarro acima da meta (${cigs}/${meta})`
          : `Cigarro registrado (${cigs}/${meta})`;
        ev.desc = `${cigs}/${meta} no dia`;
      } else if (ev.kind === 'urge' || ev.kind === 'sos') {
        urges++;
      } else if (ev.kind === 'no-smoke') {
        hasSmokeFreeMark = true;
        hasDayCompleteMark = true;
      } else if (ev.kind === 'day-complete') {
        hasDayCompleteMark = true;
      } else if (ev.kind === 'mood' && ev.moodValue) {
        latestMood = ev.moodValue;
      }
    }

    record.cigs = cigs;
    record.urges = urges;
    record.smokeFree = hasSmokeFreeMark && cigs === 0;
    record.dayCompleted = hasDayCompleteMark;
    record.mood = latestMood;
  }

  // Retorna o estado visual de uma data:
  // 'neutral' (cinza: sem registros ou dia atual ainda em aberto sem consumo)
  // 'green'   (verde: consumo igual ou inferior à meta diária)
  // 'exceeded'(rosa: consumo acima da meta estabelecida)
  function getDayStatus(dateKey) {
    const record = userState.dailyRecords[dateKey];
    if (!record) return 'neutral';
    const eventsCount = Array.isArray(record.events) ? record.events.length : 0;
    if (eventsCount === 0 && !record.smokeFree && !record.dayCompleted && record.cigs === 0 && record.urges === 0 && !record.mood) {
      return 'neutral';
    }
    const meta = (typeof record.meta === 'number' && record.meta >= 0) ? record.meta : getSafeTodayMeta();
    if (record.cigs > meta) {
      return 'exceeded';
    }
    const todayKey = getDateKey(new Date());
    // Se a data já passou, considera dia concluído dentro da meta
    if (dateKey < todayKey) {
      return 'green';
    }
    // Dia atual: só é considerado verde concluído se foi expressamente finalizado / confirmado sem fumar
    if (record.dayCompleted || record.smokeFree) {
      return 'green';
    }
    // Dia atual em andamento (ainda não finalizado definitivamente)
    return 'neutral';
  }

  // Dia sem fumar: 0 cigarros + dia confirmado sem fumar ou data passada com registro e 0 cigarros
  function isDaySmokeFree(dateKey) {
    const record = userState.dailyRecords[dateKey];
    if (!record) return false;
    if (record.cigs > 0) return false;
    if (record.smokeFree || record.dayCompleted) return true;
    const eventsCount = Array.isArray(record.events) ? record.events.length : 0;
    if (eventsCount === 0) return false;
    const todayKey = getDateKey(new Date());
    if (dateKey < todayKey) return true;
    return false;
  }

  // Dia com meta cumprida: consumo igual ou inferior à meta (0 <= cigs <= meta), com dia finalizado
  function isDayGoalMet(dateKey) {
    const record = userState.dailyRecords[dateKey];
    if (!record) return false;
    const meta = (typeof record.meta === 'number' && record.meta >= 0) ? record.meta : getSafeTodayMeta();
    if (record.cigs > meta) return false;
    const todayKey = getDateKey(new Date());
    if (dateKey < todayKey) return true;
    if (record.smokeFree || record.dayCompleted) return true;
    return false;
  }

  function recalculateAllStats(skipSave = false) {
    const todayKey = getDateKey(new Date());
    const todayRec = userState.dailyRecords[todayKey];
    userState.todayLogged = todayRec ? todayRec.cigs : 0;

    let totalSmokeFree = 0;
    let totalGoalMet = 0;
    let totalUrges = 0;
    const allEvents = [];

    Object.keys(userState.dailyRecords).forEach(key => {
      const rec = userState.dailyRecords[key];
      if (!rec) return;
      recomputeDayAggregates(rec);
      const evs = Array.isArray(rec.events) ? rec.events : [];
      if (evs.length === 0 && !rec.smokeFree && !rec.dayCompleted && (typeof rec.cigs !== 'number' || rec.cigs === 0) && key !== todayKey) {
        delete userState.dailyRecords[key];
        return;
      }
      if (isDaySmokeFree(key)) {
        totalSmokeFree++;
      }
      if (isDayGoalMet(key)) {
        totalGoalMet++;
      }
      totalUrges += rec.urges || 0;
      evs.forEach(ev => {
        allEvents.push(ev);
      });
    });

    allEvents.sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0));

    userState.daysClean = totalSmokeFree;
    userState.daysGoalMet = totalGoalMet;
    userState.totalUrgesOvercome = totalUrges;
    userState.historyEvents = allEvents;

    // Atualiza tela 17 (Progresso) se presente no DOM
    const statsCleanEl = document.getElementById('stats-clean-days');
    if (statsCleanEl) statsCleanEl.innerText = userState.daysClean;
    const statsUrgesEl = document.getElementById('stats-urges-overcome');
    if (statsUrgesEl) statsUrgesEl.innerText = userState.totalUrgesOvercome;

    if (!skipSave) {
      savePersistedState();
    }
  }

  function getAvatarSrc(key) {
    if (!key) return 'assets/avatar_verde.png';
    const clean = String(key).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (clean.includes('cachecol')) return 'assets/avatar_cachecol.png';
    if (clean.includes('flor')) return 'assets/avatar_flor.png';
    if (clean.includes('folha')) return 'assets/avatar_folha.png';
    if (clean.includes('fone')) return 'assets/avatar_fone.png';
    if (clean.includes('laco')) return 'assets/avatar_laco.png';
    if (clean.includes('oculo')) return 'assets/avatar_oculos.png';
    if (clean.includes('azul')) return 'assets/avatar_azul.png';
    if (clean.includes('amarelo')) return 'assets/avatar_amarelo.png';
    if (clean.includes('laranja')) return 'assets/avatar_laranja.png';
    if (clean.includes('rosa')) return 'assets/avatar_rosa.png';
    if (clean.includes('vermelho')) return 'assets/avatar_vermelho.png';
    if (clean.includes('verde')) return 'assets/avatar_verde.png';
    return `assets/avatar_${clean}.png`;
  }
  window.getAvatarSrc = getAvatarSrc;

  function highlightActiveAvatarCard() {
    const cur = (userState.avatar || 'verde').toLowerCase().trim();
    const cards = document.querySelectorAll('.avatar-option-card');
    cards.forEach(card => {
      const cardKey = (card.dataset.avatar || card.dataset.color || '').toLowerCase().trim();
      const isMatch = cardKey === cur ||
        (cur.includes('fone') && cardKey.includes('fone')) ||
        (cur.includes('laco') && cardKey.includes('laco')) ||
        (cur.includes('oculo') && cardKey.includes('oculo')) ||
        (cur.includes('cachecol') && cardKey.includes('cachecol')) ||
        (cur.includes('flor') && cardKey.includes('flor')) ||
        (cur.includes('folha') && cardKey.includes('folha'));
      if (isMatch) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }
  window.highlightActiveAvatarCard = highlightActiveAvatarCard;

  window.selectUserAvatar = function(key) {
    if (!key) return;
    userState.avatar = key;
    savePersistedState();
    syncUserProfileUI();
    highlightActiveAvatarCard();
    const isEn = userState.currentLang === 'EN';
    const isEs = userState.currentLang === 'ES';
    showToast(isEn ? 'Avatar updated!' : (isEs ? '¡Avatar actualizado!' : 'Avatar atualizado!'));
    setTimeout(() => {
      showScreen(21);
    }, 280);
  };

  function syncUserProfileUI() {
    const isAuth = Boolean(userState.isAuthenticated);
    let rawName = userState.name ? userState.name.trim() : '';
    const rawEmail = userState.email ? userState.email.trim() : '';

    // Se estiver autenticado e não tiver nome ou for 'Visitante', define o nome real
    if (isAuth) {
      if (!rawName || rawName.toLowerCase() === 'visitante') {
        if (rawEmail) {
          const namePart = rawEmail.split('@')[0];
          rawName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        } else {
          rawName = 'Usuário Habbi';
        }
        userState.name = rawName;
      }
    }

    const homeNameEl = document.querySelector('.home-header h2, .home-v2-name');
    if (homeNameEl) {
      homeNameEl.innerText = (isAuth && rawName) ? `${rawName}!` : 'Olá!';
    }
    const profileNameEl = document.getElementById('profile-display-name') || document.querySelector('.profile-header-box h3');
    if (profileNameEl) {
      profileNameEl.innerText = isAuth ? (rawName || 'Usuário Habbi') : 'Visitante';
    }
    const profileSubEl = document.getElementById('profile-display-sub');
    if (profileSubEl) {
      if (isAuth) {
        profileSubEl.innerText = rawEmail ? rawEmail : 'Conta conectada';
      } else {
        profileSubEl.innerText = 'Crie uma conta para salvar seus dados';
      }
    }
    const unauthBox = document.getElementById('profile-unauth-box');
    if (unauthBox) {
      unauthBox.style.display = isAuth ? 'none' : 'flex';
    }
    const authBox = document.getElementById('profile-auth-box');
    if (authBox) {
      authBox.style.display = isAuth ? 'flex' : 'none';
    }
    const profileLogoutItem = document.getElementById('profile-logout-item');
    if (profileLogoutItem) {
      profileLogoutItem.style.display = isAuth ? 'flex' : 'none';
    }
    const editNameInput = document.getElementById('edit-account-name');
    if (editNameInput && document.activeElement !== editNameInput) {
      editNameInput.value = isAuth ? rawName : '';
    }
    const editEmailInput = document.getElementById('edit-account-email');
    if (editEmailInput && document.activeElement !== editEmailInput) {
      editEmailInput.value = isAuth ? rawEmail : '';
    }
    const profileAvatarImg = document.getElementById('profile-avatar-img');
    if (profileAvatarImg && userState.avatar) {
      profileAvatarImg.src = getAvatarSrc(userState.avatar);
    }
  }
  window.syncUserProfileUI = syncUserProfileUI;
  window.getCurrentScreen = () => currentScreen;

  function refreshAllViews(skipSave = false) {
    recalculateAllStats(skipSave);
    syncUserProfileUI();
    if (typeof updateHomeScreen === 'function') updateHomeScreen();
    if (typeof generateCalendar === 'function') generateCalendar();
    if (typeof renderHistoryTimeline === 'function') renderHistoryTimeline();
    if (typeof updateSavingsDisplay === 'function') updateSavingsDisplay();
    if (typeof syncQuickRegisterModalUI === 'function') syncQuickRegisterModalUI();
    if (typeof updateMinigamesRecordUI === 'function') updateMinigamesRecordUI();
  }

  function recordHabbiEvent({ dateKey, kind, title, desc, detail, moodValue, influences, note }) {
    const now = new Date();
    const todayKey = getDateKey(now);
    const targetKey = dateKey || todayKey;
    if (targetKey > todayKey) {
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
      if (typeof showToast === 'function') showToast(t.futureDateBlocked || 'Não é possível registrar em datas futuras.');
      return null;
    }

    ensureActiveProfileForWrite();
    const rec = getOrCreateDayRecord(targetKey);
    // Preserva rec.meta histórico caso o dia já possua meta definida (permitindo meta 0)
    if (typeof rec.meta !== 'number' || rec.meta < 0) {
      rec.meta = getSafeTodayMeta();
    }

    const timeClock = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const { day, month } = parseDateKey(targetKey);
    const monthShort = getMonthNamePt(month).slice(0, 3);
    const timeLabel = targetKey === todayKey ? `Hoje, ${timeClock}` : `${String(day).padStart(2, '0')} ${monthShort}, ${timeClock}`;

    let historyType = 'sucesso';
    if (kind === 'smoke') {
      const nextCigs = (rec.cigs || 0) + 1;
      historyType = nextCigs > rec.meta ? 'acima-meta' : 'sucesso';
    } else if (kind === 'mood') {
      historyType = 'humor';
    }

    const newEv = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      dateKey: targetKey,
      kind: kind, // 'no-smoke' | 'smoke' | 'urge' | 'sos' | 'mood'
      type: historyType,
      title: title,
      time: timeLabel,
      clock: timeClock,
      desc: desc || '',
      detail: detail || '',
      moodValue: moodValue || null,
      influences: Array.isArray(influences) ? influences : [],
      note: note || ''
    };

    rec.events.unshift(newEv);
    recomputeDayAggregates(rec);

    if (kind === 'smoke') {
      newEv.type = rec.cigs > rec.meta ? 'acima-meta' : 'sucesso';
    }

    refreshAllViews();
    return newEv;
  }

  window.deleteHabbiEvent = function(dateKey, eventId) {
    const rec = userState.dailyRecords[dateKey];
    if (!rec || !Array.isArray(rec.events)) return;
    const idx = rec.events.findIndex(e => String(e.id) === String(eventId));
    if (idx === -1) return;
    const removed = rec.events[idx];
    const snapshotForUndo = {
      dateKey,
      index: idx,
      prevMeta: rec.meta,
      event: JSON.parse(JSON.stringify(removed))
    };

    rec.events.splice(idx, 1);

    if (removed.kind === 'no-smoke' && userState.cigarettesAvoided > 0) {
      userState.cigarettesAvoided = Math.max(0, userState.cigarettesAvoided - 1);
      if (userState.savingsHistory.length > 0) {
        userState.savingsHistory.shift();
      }
    }

    recomputeDayAggregates(rec);
    if (rec.events.length === 0) {
      delete userState.dailyRecords[dateKey];
    }
    refreshAllViews();

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    showToast(t.toastEventRemoved || 'Registro removido', {
      duration: 4500,
      undoLabel: t.toastUndo || 'Desfazer',
      onUndo: () => {
        ensureActiveProfileForWrite();
        const targetRec = getOrCreateDayRecord(snapshotForUndo.dateKey);
        if (snapshotForUndo.prevMeta && typeof snapshotForUndo.prevMeta === 'number') {
          targetRec.meta = snapshotForUndo.prevMeta;
        }
        if (!Array.isArray(targetRec.events)) targetRec.events = [];
        const insertAt = Math.min(snapshotForUndo.index, targetRec.events.length);
        targetRec.events.splice(insertAt, 0, snapshotForUndo.event);
        recomputeDayAggregates(targetRec);
        refreshAllViews();
        showToast(t.toastEventRestored || 'Registro restaurado', { duration: 2200 });
      }
    });
  };

  window.editHabbiEvent = function(dateKey, eventId) {
    const targetKey = dateKey || userState.calSelectedDate || getDateKey(new Date());
    const rec = userState.dailyRecords[targetKey];
    const ev = rec && Array.isArray(rec.events)
      ? rec.events.find(e => String(e.id) === String(eventId))
      : null;

    if (typeof window.openQuickRegisterModal === 'function') {
      if (ev && ev.kind === 'mood') {
        window.openQuickRegisterModal(targetKey, 'mood', ev.id);
      } else {
        window.openQuickRegisterModal(targetKey, null, ev ? ev.id : null);
      }
    }
  };

  loadPersistedState();
  recalculateAllStats();

  // Selectors
  const screenElements = document.querySelectorAll('.screen');
  const sidebarItems = document.querySelectorAll('.menu-item');
  const statusBar = document.getElementById('status-bar');

  // Toast discreto plano com suporte a ação "Desfazer" e anúncio em região live ARIA
  let activeToastTimer = null;
  let activeToastUndoHandler = null;

  function hideToast() {
    const toast = document.getElementById('toast-notice');
    const undoBtn = document.getElementById('toast-undo-btn');
    if (toast) toast.classList.remove('show');
    if (undoBtn) undoBtn.style.display = 'none';
    activeToastUndoHandler = null;
    if (activeToastTimer) {
      clearTimeout(activeToastTimer);
      activeToastTimer = null;
    }
  }

  function showToast(message, options = {}) {
    const text = String(message || '').trim();
    if (!text) return;
    const toast = document.getElementById('toast-notice');
    const msgEl = toast ? toast.querySelector('.toast-message') : null;
    const undoBtn = document.getElementById('toast-undo-btn');
    const srStatus = document.getElementById('habbi-sr-status');

    if (activeToastTimer) {
      clearTimeout(activeToastTimer);
      activeToastTimer = null;
    }

    if (srStatus) {
      srStatus.textContent = '';
      setTimeout(() => { srStatus.textContent = text; }, 20);
    }

    if (!toast || !msgEl) return;
    msgEl.textContent = text;

    const hasUndo = Boolean(options && typeof options.onUndo === 'function');
    if (undoBtn) {
      if (hasUndo) {
        activeToastUndoHandler = options.onUndo;
        undoBtn.textContent = options.undoLabel || 'Desfazer';
        undoBtn.style.display = 'inline-flex';
        undoBtn.onclick = () => {
          const fn = activeToastUndoHandler;
          hideToast();
          if (typeof fn === 'function') fn();
        };
      } else {
        activeToastUndoHandler = null;
        undoBtn.style.display = 'none';
        undoBtn.onclick = null;
      }
    }

    toast.classList.add('show');
    const duration = typeof options.duration === 'number'
      ? options.duration
      : (hasUndo ? 4500 : 2600);
    activeToastTimer = setTimeout(() => {
      hideToast();
    }, duration);
  }
  window.showToast = showToast;
  window.hideToast = hideToast;

  // ==========================================================================
  // Helper reutilizável de diálogo acessível (WCAG 2.2 AA)
  // Garante role="dialog", aria-modal="true", aria-labelledby, foco inicial,
  // focus trap (Tab/Shift+Tab), fechamento por Escape e restauração de foco.
  // ==========================================================================
  const habbiDialogStack = [];

  function getFocusableElements(container) {
    if (!container) return [];
    const selector = [
      'a[href]',
      'button:not([disabled]):not([aria-hidden="true"])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    return Array.from(container.querySelectorAll(selector)).filter(el => {
      if (el.closest('[aria-hidden="true"]') || el.closest('[inert]')) return false;
      const st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
      return el.offsetParent !== null || st.position === 'fixed';
    });
  }

  function openAccessibleDialog(overlayEl, closeFn, labelledById) {
    if (!overlayEl) return;
    const dialogRoot = overlayEl.querySelector('[role="dialog"]') || overlayEl;
    if (!dialogRoot.getAttribute('role')) dialogRoot.setAttribute('role', 'dialog');
    dialogRoot.setAttribute('aria-modal', 'true');
    if (labelledById && !dialogRoot.getAttribute('aria-labelledby')) {
      dialogRoot.setAttribute('aria-labelledby', labelledById);
    }

    const existingIdx = habbiDialogStack.findIndex(item => item.overlayEl === overlayEl);
    const prevFocus = existingIdx !== -1
      ? habbiDialogStack[existingIdx].prevFocus
      : (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    if (existingIdx !== -1) {
      document.removeEventListener('keydown', habbiDialogStack[existingIdx].onKeydown, true);
      habbiDialogStack.splice(existingIdx, 1);
    }

    const onKeydown = (e) => {
      if (habbiDialogStack.length === 0 || habbiDialogStack[habbiDialogStack.length - 1].overlayEl !== overlayEl) {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (typeof closeFn === 'function') closeFn();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = getFocusableElements(dialogRoot);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !dialogRoot.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !dialogRoot.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    habbiDialogStack.push({ overlayEl, dialogRoot, prevFocus, closeFn, onKeydown });
    document.addEventListener('keydown', onKeydown, true);

    const focusInitial = () => {
      const focusables = getFocusableElements(dialogRoot);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        if (!dialogRoot.hasAttribute('tabindex')) dialogRoot.setAttribute('tabindex', '-1');
        dialogRoot.focus();
      }
    };
    focusInitial();
    requestAnimationFrame(() => {
      if (!dialogRoot.contains(document.activeElement)) {
        focusInitial();
      }
    });
  }

  function closeAccessibleDialog(overlayEl, restoreFocus = true) {
    if (!overlayEl) return;
    const idx = habbiDialogStack.findIndex(item => item.overlayEl === overlayEl);
    if (idx === -1) return;
    const entry = habbiDialogStack[idx];
    document.removeEventListener('keydown', entry.onKeydown, true);
    habbiDialogStack.splice(idx, 1);
    if (restoreFocus && entry.prevFocus && typeof entry.prevFocus.focus === 'function' && document.contains(entry.prevFocus)) {
      const target = entry.prevFocus;
      if (!target.disabled && !target.closest('[inert]')) {
        try { target.focus(); } catch (_e) {}
      }
    }
  }
  window.openAccessibleDialog = openAccessibleDialog;
  window.closeAccessibleDialog = closeAccessibleDialog;

  function syncCarouselSlidesInert(activeSlideIdx, carouselIsVisible) {
    const screenMap = [29, 10, 15];
    screenMap.forEach((scrId, idx) => {
      const slideEl = document.querySelector(`.screen[data-screen="${scrId}"]`);
      if (!slideEl) return;
      const isActive = Boolean(carouselIsVisible && idx === activeSlideIdx);
      slideEl.inert = !isActive;
      slideEl.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  // Function to transition to a screen
  function showScreen(screenNum) {
    if (screenNum === 2) screenNum = 1;
    if (screenNum === 6) screenNum = 7;
    if (screenNum === 8 || screenNum === 9) screenNum = 10;
    // As telas intermediárias 11 ("Como está agora?") e 25 ("Como você está?") foram unificadas no Painel Rápido de Registro
    if (screenNum === 11 || screenNum === 25) {
      const fallbackScr = (currentScreen === 16 || currentScreen === 14 || currentScreen === 10) ? currentScreen : (userState.returnScreenAfterRegister || 10);
      if (currentScreen !== fallbackScr) {
        showScreen(fallbackScr);
      }
      if (typeof window.openQuickRegisterModal === 'function') {
        window.openQuickRegisterModal(userState.activeRegisterDateKey || getDateKey(new Date()), screenNum === 25 ? 'mood' : null);
      }
      return;
    }
    if (screenNum < 1 || screenNum > totalScreens) return;
    
    if (screenNum === 12 && currentScreen !== 12 && currentScreen !== 13 && currentScreen !== 15) {
      userState.sosReturnScreen = currentScreen;
    }
    if (screenNum === 16 && (currentScreen === 10 || currentScreen === 15 || currentScreen === 29)) {
      userState.calendarReturnScreen = currentScreen;
    }
    if ((screenNum === 23 || screenNum === 24) && currentScreen === 21) {
      userState.authReturnScreen = 21;
    }

    // Limpeza de timers específicos ao sair de exercícios respiratórios e minijogos
    // O cronômetro principal do SOS (sosTimerInterval) é expressamente preservado durante toda navegação
    if (currentScreen === 13 && screenNum !== 13) {
      if (typeof breathState !== 'undefined' && breathState) {
        if (breathState.timer) {
          clearInterval(breathState.timer);
          breathState.timer = null;
        }
        if (breathState.sessionTimer) {
          clearInterval(breathState.sessionTimer);
          breathState.sessionTimer = null;
        }
      }
    }
    if (currentScreen === 15 && screenNum !== 15) {
      if (typeof reflexGameState !== 'undefined' && reflexGameState && reflexGameState.idleTimer) {
        clearTimeout(reflexGameState.idleTimer);
        reflexGameState.idleTimer = null;
      }
      userState.isGameActive = false;
      resetMinigamesUI();
    }

    const prevScreenNum = currentScreen;
    currentScreen = screenNum;
    localStorage.setItem('habbi-current-screen', screenNum);

    // Cancelar timers de roleta da splash caso esteja saindo da Tela 1
    if (prevScreenNum === 1 && screenNum !== 1) {
      if (typeof window.clearSplashRoulette === 'function') {
        window.clearSplashRoulette();
      }
    }

    // Suporte ao Carrossel de Onboarding (Telas 3, 4, 5) com rolagem horizontal contínua
    const onbSlider = document.getElementById('onboarding-slider-container');
    if (screenNum >= 3 && screenNum <= 5) {
      if (onbSlider) {
        onbSlider.classList.add('active');
        if (typeof window.goToOnboardingSlide === 'function') {
          window.goToOnboardingSlide(screenNum - 3, false);
        }
      }
      screenElements.forEach(s => {
        if (!s.classList.contains('onb-slide')) {
          s.classList.remove('active');
        } else {
          s.classList.add('active');
        }
      });
    } else {
      if (onbSlider) {
        onbSlider.classList.remove('active');
      }
    }

    // Suporte ao Carrossel Principal (Telas 29 ↔ 10 ↔ 15) como Janela Contínua
    const mainCarousel = document.getElementById('main-carousel-container');
    const isMainCarouselScreen = (screenNum === 10 || screenNum === 29 || screenNum === 15);

    if (isMainCarouselScreen) {
      if (mainCarousel) {
        mainCarousel.classList.add('active');
      }
      const s15El = document.querySelector('.screen[data-screen="15"]');
      const s29El = document.querySelector('.screen[data-screen="29"]');
      if (mainCarousel) {
        const toolsNow = (screenNum === 15 && userState.minijogosMode === 'tools') || (screenNum === 29 && userState.conquistaMode === 'tools');
        mainCarousel.classList.toggle('tools-mode', toolsNow);
      }
      if (screenNum === 15) {
        const isTools = (userState.minijogosMode === 'tools');
        if (s15El) s15El.classList.toggle('tools-mode', isTools);
        if (typeof window.goToCarouselSlide === 'function') {
          window.goToCarouselSlide(2, false);
        }
      } else if (screenNum === 29) {
        const isTools = (userState.conquistaMode === 'tools');
        if (s29El) s29El.classList.toggle('tools-mode', isTools);
        if (typeof window.goToCarouselSlide === 'function') {
          window.goToCarouselSlide(0, false);
        }
      } else {
        // Home: sempre volta ao modo carrossel (sem botão voltar)
        userState.minijogosMode = 'carousel';
        userState.conquistaMode = 'carousel';
        if (s15El) s15El.classList.remove('tools-mode');
        if (s29El) s29El.classList.remove('tools-mode');
        if (typeof window.goToCarouselSlide === 'function') {
          window.goToCarouselSlide(1, false);
        }
      }

      screenElements.forEach(s => {
        if (!s.classList.contains('carousel-slide') && !s.classList.contains('onb-slide')) {
          s.classList.remove('active');
        }
      });
    } else {
      if (mainCarousel) {
        mainCarousel.classList.remove('active');
      }
      syncCarouselSlidesInert(-1, false);
      if (!(screenNum >= 3 && screenNum <= 5)) {
        screenElements.forEach(screen => {
          if (parseInt(screen.dataset.screen) === screenNum) {
            screen.classList.add('active');
            screen.scrollTop = 0;
          } else if (!screen.classList.contains('onb-slide') && !screen.classList.contains('carousel-slide')) {
            screen.classList.remove('active');
          }
        });
      }
    }

    // Toggle active sidebar menu item
    sidebarItems.forEach(item => {
      item.classList.remove('active');
      if (parseInt(item.dataset.screen) === screenNum) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });


    // Adjust status bar text color for dark background screen
    if (screenNum === 1 || screenNum === 2) {
      statusBar.classList.add('white-text');
    } else {
      statusBar.classList.remove('white-text');
    }

    // Trigger screen-specific entry logic
    handleScreenEntry(screenNum);
    if (typeof window.applyAppLanguage === 'function') {
      window.applyAppLanguage(userState.currentLang || 'PT');
    }
  }

  // Handle specific logic when screen displays
  function handleScreenEntry(screenNum) {
    // Screen 1: Splash Screen - Accelerating mascot roulette + confetti celebration
    if (screenNum === 1) {
      if (typeof window.startSplashRoulette === 'function') {
        window.startSplashRoulette();
      }
    }

    // Screen 3: Reset cigarette fill bar when entering Screen 3
    if (screenNum === 3) {
      if (typeof window.resetOnb1Demo === 'function') {
        window.resetOnb1Demo();
      }
    }

    // Screen 10: Home
    if (screenNum === 10) {
      updateHomeScreen();
      if (typeof window.checkDailyGoalPrompt === 'function') {
        window.checkDailyGoalPrompt();
      }
      if (typeof window.checkAndTriggerFirstTimeTutorial === 'function') {
        window.checkAndTriggerFirstTimeTutorial();
      }
    }

    // Screen 7: Onboarding - Consumo habitual
    if (screenNum === 7) {
      if (typeof window.syncOnboardingFormToUserState === 'function') {
        window.syncOnboardingFormToUserState();
      }
    }

    // Screen 11: Registro Rápido
    if (screenNum === 11) {
      const targetKey = userState.activeRegisterDateKey || getDateKey(new Date());
      const dateHint = document.getElementById('wl-register-date-hint');
      if (dateHint) {
        dateHint.innerText = `Registrando para: ${formatDayLabelPt(targetKey)}`;
      }
      const closeBtn = document.querySelector('.screen[data-screen="11"] .wl-register-close');
      if (closeBtn) {
        closeBtn.setAttribute('onclick', `goToScreen(${userState.returnScreenAfterRegister || 10})`);
      }
    }

    // Screen 12: SOS Hub (Apoio Imediato)
    if (screenNum === 12) {
      if (typeof window.updateSosTimerUI === 'function') {
        window.updateSosTimerUI();
      }
      if (window.removeWhiteBgFromAllMascots) {
        window.removeWhiteBgFromAllMascots();
      }
    }

    // Screen 13: SOS Intervenção (Execution)
    if (screenNum === 13) {
      initInterventionScreen();
    }

    // Screen 15: Minijogos (Modo Carrossel vs Modo Ferramentas)
    if (screenNum === 15) {
      const carouselHeader = document.getElementById('wl-minijogos-carousel-header');
      const toolsHeader = document.getElementById('wl-minijogos-tools-header');
      const isCarouselMode = userState.minijogosMode !== 'tools';

      // Cabeçalhos são controlados só por CSS (.tools-mode) — sem estilos inline que "vazam" o botão voltar
      if (carouselHeader) carouselHeader.style.removeProperty('display');
      if (toolsHeader) toolsHeader.style.removeProperty('display');
      if (!userState.isGameActive) resetMinigamesUI();

      const dayNumEl = document.getElementById('wl-minijogos-day-num');
      if (dayNumEl) {
        dayNumEl.innerText = new Date().getDate();
      }
      const savingsEl = document.getElementById('minijogos-savings-top');
      if (savingsEl) {
        const homeSavings = document.getElementById('home-savings-top');
        if (homeSavings) {
          savingsEl.innerText = homeSavings.innerText;
        }
      }

      if (typeof updateMinigamesRecordUI === 'function') {
        updateMinigamesRecordUI();
      }
    }

    // Screen 16: Calendário
    if (screenNum === 16) {
      generateCalendar();
    }

    // Screen 17: Progresso
    if (screenNum === 17) {
      recalculateAllStats();
      updateSavingsDisplay();
    }

    // Screen 19: Histórico
    if (screenNum === 19) {
      renderHistoryTimeline();
    }

    // Screen 21: Perfil
    if (screenNum === 21) {
      syncUserProfileUI();
    }

    // Screen 26: Escolha seu Avatar
    if (screenNum === 26) {
      highlightActiveAvatarCard();
    }

    // Screen 28: Minha Conta
    if (screenNum === 28) {
      const nameField = document.getElementById('edit-account-name');
      const emailField = document.getElementById('edit-account-email');
      const passField = document.getElementById('edit-account-password');
      const metaField = document.getElementById('edit-account-meta');
      const packPriceField = document.getElementById('edit-account-pack-price');
      if (nameField) nameField.value = userState.name || '';
      if (emailField) emailField.value = userState.email || '';
      if (passField) passField.value = '';
      if (metaField) metaField.value = (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11;
      const habitualField = document.getElementById('edit-account-habitual');
      if (habitualField) habitualField.value = userState.habitualCigs || 12;
      if (packPriceField) packPriceField.value = userState.packPrice ? userState.packPrice.toFixed(2) : '10.00';
    }

    // Screen 29: Conquista / Economia (Modo Carrossel vs Modo Ferramentas)
    if (screenNum === 29) {
      const isCarouselMode = userState.conquistaMode !== 'tools';
      const s29El = document.querySelector('.screen[data-screen="29"]');
      if (s29El) {
        s29El.classList.toggle('tools-mode', !isCarouselMode);
      }
      const backBtn = document.getElementById('btn-conquista-back') || document.querySelector('.btn-back.wl-sav-back');
      if (backBtn) {
        backBtn.style.removeProperty('display');
      }
      updateSavingsDisplay();
      if (typeof window.updateConquistaBagUI === 'function') {
        window.updateConquistaBagUI();
      }
    }
  }

  function formatBrl(val) {
    const num = Number.isFinite(Number(val)) ? Number(val) : 0;
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }

  function getPackFreqLabel(days) {
    const d = Math.max(1, parseInt(days, 10) || 2);
    if (d === 1) return '1 maço por dia';
    if (d === 7) return '1 maço por semana';
    return `1 maço a cada ${d} dias`;
  }

  function computeSavingsMetrics() {
    const habitual = Math.max(1, parseInt(userState.habitualCigs, 10) || 12);
    const packPrice = Math.max(0.5, parseFloat(userState.packPrice) || 15);
    const cigsPerPack = Math.max(1, parseInt(userState.cigsPerPack, 10) || 20);
    const packFreqDays = Math.max(1, parseInt(userState.packFreqDays, 10) || 2);
    const costPerCig = packPrice / cigsPerPack;
    const fullDaySavings = habitual * costPerCig;
    const todayKey = getDateKey(new Date());

    let confirmedAvoidedCigs = 0;
    let confirmedSavings = 0;
    let confirmedDaysCount = 0;

    let hasTodayRecord = false;
    let todayCigs = 0;
    let todayAvoided = 0;
    let todaySavings = 0;
    let todayIsFinalized = false;

    // Gastos estimados (indicador independente da economia)
    const currentMonthPrefix = todayKey.slice(0, 7); // YYYY-MM
    let monthCigs = 0;

    const dailyHistoryItems = [];
    const dateKeys = Object.keys(userState.dailyRecords || {}).sort((a, b) => b.localeCompare(a));

    dateKeys.forEach(key => {
      const rec = userState.dailyRecords[key];
      if (!rec) return;
      const evs = Array.isArray(rec.events) ? rec.events : [];
      // Regra: dias sem registros nunca são considerados dias sem fumar nem geram economia
      if (evs.length === 0 && !rec.smokeFree && !rec.dayCompleted) return;

      const dayCigs = Math.max(0, parseInt(rec.cigs, 10) || 0);
      if (key.startsWith(currentMonthPrefix)) {
        monthCigs += dayCigs;
      }
      const dayAvoided = Math.max(0, habitual - dayCigs);
      const daySaved = dayAvoided * costPerCig;
      // Regra 3A: economia consolida apenas em dias passados concluídos (key < todayKey)
      // ou hoje SOMENTE quando explicitamente confirmado como "Não fumei hoje" (smokeFree && 0 cigarros).
      const isTodayConfirmedSmokeFree = Boolean(
        key === todayKey &&
        dayCigs === 0 &&
        (rec.smokeFree || evs.some(e => e && e.kind === 'no-smoke'))
      );
      const isFinalized = key < todayKey || isTodayConfirmedSmokeFree;

      if (key === todayKey) {
        hasTodayRecord = true;
        todayCigs = dayCigs;
        todayAvoided = isTodayConfirmedSmokeFree ? dayAvoided : 0;
        todaySavings = isTodayConfirmedSmokeFree ? daySaved : 0;
        todayIsFinalized = isTodayConfirmedSmokeFree;
      }

      if (isFinalized) {
        confirmedAvoidedCigs += dayAvoided;
        confirmedSavings += daySaved;
        confirmedDaysCount += 1;
        dailyHistoryItems.push({
          id: `day-${key}`,
          dateKey: key,
          timestamp: rec.events && rec.events[0] ? (rec.events[0].timestamp || 0) : 0,
          kind: 'daily-confirmed',
          title: dayCigs === 0 ? 'Dia sem fumar' : `Consumo reduzido (${dayCigs}/${habitual} cig)`,
          subtitle: `${formatDayLabelPt(key)} • ${dayAvoided} ${dayAvoided === 1 ? 'cigarro evitado' : 'cigarros evitados'}`,
          amount: daySaved,
          avoidedCigs: dayAvoided
        });
      }
    });

    const packEvents = Array.isArray(userState.packEvents) ? userState.packEvents : [];
    let packsAvoidedCount = 0;
    let moneyNotSpent = 0;
    let packsBoughtCount = 0;
    let moneySpentOnPacks = 0;

    packEvents.forEach(ev => {
      if (!ev) return;
      const p = Math.max(0, parseFloat(ev.price) || packPrice);
      if (ev.kind === 'avoided') {
        packsAvoidedCount += 1;
        moneyNotSpent += p;
      } else if (ev.kind === 'bought') {
        packsBoughtCount += 1;
        moneySpentOnPacks += p;
      }
    });

    const todaySpent = todayCigs * costPerCig;
    const monthSpent = monthCigs * costPerCig;

    return {
      habitual,
      packPrice,
      cigsPerPack,
      packFreqDays,
      costPerCig,
      fullDaySavings,
      confirmedAvoidedCigs,
      confirmedSavings,
      confirmedDaysCount,
      hasTodayRecord,
      todayCigs,
      todayAvoided,
      todaySavings,
      todayIsFinalized,
      todaySpent,
      monthCigs,
      monthSpent,
      packsAvoidedCount,
      moneyNotSpent,
      packsBoughtCount,
      moneySpentOnPacks,
      dailyHistoryItems,
      packEvents
    };
  }

  // Update Savings Displays (Screen 29 + Top Pills + Screen 17)
  function updateSavingsDisplay() {
    const m = computeSavingsMetrics();

    userState.totalSavings = m.confirmedSavings;
    userState.cigarettesAvoided = m.confirmedAvoidedCigs;

    // Regra 3A: nunca promover economia parcial de um dia em andamento.
    // Somente dias concluídos (key < todayKey) + hoje confirmado explicitamente como "Não fumei hoje".
    const heroSavingsVal = m.confirmedSavings;
    const heroFormatted = formatBrl(heroSavingsVal);

    const navValEl = document.getElementById('nav-savings-label');
    const totalValEl = document.getElementById('savings-total-value');
    const statsSavedEl = document.getElementById('stats-total-saved');
    const statsCigsEl = document.getElementById('stats-cigs-avoided');

    if (navValEl) navValEl.innerText = heroFormatted;
    if (totalValEl) totalValEl.innerText = heroFormatted;
    if (statsSavedEl) statsSavedEl.innerText = `R$ ${Math.round(heroSavingsVal)}`;
    if (statsCigsEl) statsCigsEl.innerText = m.confirmedAvoidedCigs;

    const topSavingsTexts = document.querySelectorAll('.top-savings-value-text');
    topSavingsTexts.forEach(el => {
      el.innerText = heroFormatted;
    });

    const activeLangPill = (userState.currentLang || 'PT').toUpperCase();
    const tPill = (window.HABBI_I18N && window.HABBI_I18N[activeLangPill]) ? window.HABBI_I18N[activeLangPill] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    const pillAriaTpl = tPill.savingsPillAria || 'Economia estimada: {0}. Abrir Conquista';
    document.querySelectorAll('.wl-home-savings-pill').forEach(pill => {
      pill.setAttribute('aria-label', pillAriaTpl.replace('{0}', heroFormatted));
    });

    // Elementos da nova Tela 29 (Sua economia)
    const statusBadgeEl = document.getElementById('wl-sav-status-badge');
    const cigsSummaryEl = document.getElementById('wl-sav-cigs-summary');
    const dayStatusTextEl = document.getElementById('wl-sav-day-status-text');
    const activeLangSav = (userState.currentLang || 'PT').toUpperCase();
    const tSav = (window.HABBI_I18N && window.HABBI_I18N[activeLangSav]) ? window.HABBI_I18N[activeLangSav] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

    if (statusBadgeEl && cigsSummaryEl && dayStatusTextEl) {
      statusBadgeEl.className = 'wl-sav-status-badge';
      if (m.confirmedDaysCount > 0) {
        statusBadgeEl.classList.add('is-confirmed');
        statusBadgeEl.innerText = 'Economia estimada confirmada';
        cigsSummaryEl.innerText = `${m.confirmedAvoidedCigs} ${m.confirmedAvoidedCigs === 1 ? 'cigarro evitado' : 'cigarros evitados'} no total`;
        if (m.todayIsFinalized) {
          dayStatusTextEl.innerText = `Hoje finalizado: +${formatBrl(m.todaySavings)} (${m.todayAvoided} cig)`;
        } else if (m.hasTodayRecord) {
          dayStatusTextEl.innerText = tSav.savingsDayInProgress || 'Dia em andamento • Consolida ao encerrar o dia ou confirmar sem fumar';
        } else {
          dayStatusTextEl.innerText = `Hoje sem registro • Sem fumar hoje: +${formatBrl(m.fullDaySavings)}`;
        }
      } else {
        statusBadgeEl.classList.add('is-neutral');
        statusBadgeEl.innerText = 'Economia estimada';
        cigsSummaryEl.innerText = m.hasTodayRecord
          ? '0 cigarros evitados consolidados • Dia em andamento'
          : '0 cigarros evitados • Nenhum registro hoje';
        dayStatusTextEl.innerText = m.hasTodayRecord
          ? (tSav.savingsDayInProgress || 'Dia em andamento • Consolida ao encerrar o dia ou confirmar sem fumar')
          : `Sem fumar hoje: ${formatBrl(m.fullDaySavings)} (${m.habitual} cigarros)`;
      }
    }

    // Tela 29 simplificada: rótulo curto e bloco "Hoje"
    const heroLblEl = document.getElementById('wl-sav-hero-lbl');
    if (heroLblEl) heroLblEl.innerText = 'Economia estimada';
    const todayHabEl = document.getElementById('wl-sav-today-habitual');
    const todaySmokedEl = document.getElementById('wl-sav-today-smoked');
    const todaySavedEl = document.getElementById('wl-sav-today-saved');
    if (todayHabEl) todayHabEl.innerText = m.habitual;
    if (todaySmokedEl) todaySmokedEl.innerText = m.hasTodayRecord ? m.todayCigs : '—';
    if (todaySavedEl) todaySavedEl.innerText = formatBrl(m.todayIsFinalized ? m.todaySavings : 0);

    // Indicador visual comparando Consumo Habitual vs. Consumo Atual (Hoje)
    const diffPillEl = document.getElementById('wl-sav-diff-pill');
    const habBarEl = document.getElementById('wl-sav-bar-habitual');
    const habValEl = document.getElementById('wl-sav-val-habitual');
    const curBarEl = document.getElementById('wl-sav-bar-current');
    const curValEl = document.getElementById('wl-sav-val-current');
    const baseRuleEl = document.getElementById('wl-sav-unit-rule');

    if (baseRuleEl) {
      baseRuleEl.innerText = `Maço ${formatBrl(m.packPrice)} (${m.cigsPerPack} un.) • ${formatBrl(m.costPerCig)}/cig`;
    }

    const maxBarRef = Math.max(m.habitual, m.hasTodayRecord ? m.todayCigs : 0, 1);
    if (habBarEl) {
      habBarEl.style.width = `${Math.round((m.habitual / maxBarRef) * 100)}%`;
    }
    if (habValEl) {
      habValEl.innerText = `${m.habitual}/dia`;
    }

    if (curBarEl && curValEl && diffPillEl) {
      diffPillEl.className = 'wl-sav-diff-pill';
      curBarEl.className = 'wl-sav-comp-fill';

      if (!m.hasTodayRecord) {
        diffPillEl.classList.add('neutral');
        diffPillEl.innerText = 'Sem registro hoje';
        curBarEl.classList.add('neutral');
        curBarEl.style.width = '0%';
        curValEl.innerText = '—';
      } else if (m.todayCigs === 0) {
        diffPillEl.classList.add('green');
        diffPillEl.innerText = `-${m.habitual} cig hoje`;
        curBarEl.classList.add('green');
        curBarEl.style.width = '6%';
        curValEl.innerText = '0 hoje';
      } else if (m.todayCigs <= m.habitual) {
        const diff = m.habitual - m.todayCigs;
        diffPillEl.classList.add(diff > 0 ? 'green' : 'neutral');
        diffPillEl.innerText = diff > 0 ? `-${diff} cig hoje` : 'Igual ao habitual';
        curBarEl.classList.add('green');
        curBarEl.style.width = `${Math.max(8, Math.round((m.todayCigs / maxBarRef) * 100))}%`;
        curValEl.innerText = `${m.todayCigs} hoje`;
      } else {
        const over = m.todayCigs - m.habitual;
        diffPillEl.classList.add('pink');
        diffPillEl.innerText = `+${over} acima`;
        curBarEl.classList.add('pink');
        curBarEl.style.width = '100%';
        curValEl.innerText = `${m.todayCigs} hoje`;
      }
    }

    // Card compacto de Compras de Maços (independente do cálculo por cigarro)
    const freqLblEl = document.getElementById('wl-sav-freq-label');
    const notSpentValEl = document.getElementById('wl-sav-not-spent-val');
    const packsAvoidedLblEl = document.getElementById('wl-sav-packs-avoided-lbl');
    const packsBoughtLblEl = document.getElementById('wl-sav-packs-bought-lbl');

    if (freqLblEl) freqLblEl.innerText = getPackFreqLabel(m.packFreqDays);
    if (notSpentValEl) notSpentValEl.innerText = formatBrl(m.moneyNotSpent);
    if (packsAvoidedLblEl) {
      packsAvoidedLblEl.innerText = `${m.packsAvoidedCount} ${m.packsAvoidedCount === 1 ? 'compra evitada' : 'compras evitadas'}`;
    }
    if (packsBoughtLblEl) {
      packsBoughtLblEl.innerText = `${m.packsBoughtCount} ${m.packsBoughtCount === 1 ? 'comprado' : 'comprados'} (${formatBrl(m.moneySpentOnPacks)})`;
    }

    // Sincroniza controles do Bottom Sheet de Configuração da Economia
    const cfgHabEl = document.getElementById('wl-sav-cfg-habitual-val');
    const cfgPriceEl = document.getElementById('wl-sav-cfg-price-input');
    const cfgPerPackEl = document.getElementById('wl-sav-cfg-perpack-val');
    if (cfgHabEl) cfgHabEl.innerText = m.habitual;
    if (cfgPriceEl && document.activeElement !== cfgPriceEl) {
      cfgPriceEl.value = m.packPrice.toFixed(2);
    }
    if (cfgPerPackEl) cfgPerPackEl.innerText = m.cigsPerPack;
    document.querySelectorAll('#wl-sav-freq-chips .wl-sav-freq-chip').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.days, 10) === m.packFreqDays);
    });

    // Histórico acessível (na aba inferior de histórico da tela Sua economia)
    const historyCountEl = document.getElementById('wl-sav-history-count');
    const totalHistoryEntries = m.dailyHistoryItems.length + m.packEvents.length;
    if (historyCountEl) historyCountEl.innerText = totalHistoryEntries;

    const historyContainer = document.getElementById('savings-history-container');
    if (historyContainer) {
      historyContainer.innerHTML = '';
      if (totalHistoryEntries === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'wl-sav-history-empty';
        emptyEl.innerText = 'Nenhum dia finalizado ou registro de maço ainda.';
        historyContainer.appendChild(emptyEl);
      } else {
        // 1. Compras de maços evitadas ou realizadas
        m.packEvents.forEach(ev => {
          const isAvoided = ev.kind === 'avoided';
          const row = document.createElement('div');
          row.className = 'wl-sav-history-row';

          const leftEl = document.createElement('div');
          leftEl.className = 'wl-sav-history-left';
          const dotEl = document.createElement('i');
          dotEl.className = `wl-sav-history-dot ${isAvoided ? 'green' : 'blue'}`;
          const textsEl = document.createElement('div');
          textsEl.className = 'wl-sav-history-texts';
          const strongTitle = document.createElement('strong');
          strongTitle.textContent = isAvoided ? 'Compra de maço evitada' : 'Maço comprado';
          const subSpan = document.createElement('span');
          subSpan.textContent = `${ev.timeLabel || 'Hoje'} • ${isAvoided ? 'Dinheiro não gasto' : 'Gasto registrado'}`;
          textsEl.appendChild(strongTitle);
          textsEl.appendChild(subSpan);
          leftEl.appendChild(dotEl);
          leftEl.appendChild(textsEl);

          const rightEl = document.createElement('div');
          rightEl.className = 'wl-sav-history-right';
          const amountEl = document.createElement('strong');
          amountEl.className = isAvoided ? 'pos' : 'neg';
          amountEl.textContent = `${isAvoided ? '+' : '-'}${formatBrl(ev.price)}`;
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'wl-sav-history-del';
          delBtn.title = 'Remover';
          delBtn.textContent = '✕';
          delBtn.addEventListener('click', () => {
            if (typeof window.deletePackPurchase === 'function') {
              window.deletePackPurchase(ev.id);
            }
          });
          rightEl.appendChild(amountEl);
          rightEl.appendChild(delBtn);

          row.appendChild(leftEl);
          row.appendChild(rightEl);
          historyContainer.appendChild(row);
        });

        // 2. Economia diária consolidada (dias finalizados)
        m.dailyHistoryItems.forEach(item => {
          const row = document.createElement('div');
          row.className = 'wl-sav-history-row';

          const leftEl = document.createElement('div');
          leftEl.className = 'wl-sav-history-left';
          const dotEl = document.createElement('i');
          dotEl.className = 'wl-sav-history-dot green';
          const textsEl = document.createElement('div');
          textsEl.className = 'wl-sav-history-texts';
          const strongTitle = document.createElement('strong');
          strongTitle.textContent = String(item.title || '');
          const subSpan = document.createElement('span');
          subSpan.textContent = String(item.subtitle || '');
          textsEl.appendChild(strongTitle);
          textsEl.appendChild(subSpan);
          leftEl.appendChild(dotEl);
          leftEl.appendChild(textsEl);

          const rightEl = document.createElement('div');
          rightEl.className = 'wl-sav-history-right';
          const amountEl = document.createElement('strong');
          amountEl.className = 'pos';
          amountEl.textContent = `+${formatBrl(item.amount)}`;
          rightEl.appendChild(amountEl);

          row.appendChild(leftEl);
          row.appendChild(rightEl);
          historyContainer.appendChild(row);
        });
      }
    }

    if (typeof window.updateConquistaBagUI === 'function') {
      window.updateConquistaBagUI();
    }
  }

  function addSavings(_qty, _title) {
    savePersistedState();
    updateSavingsDisplay();
  }

  window.finalizeTodayForSavings = function() {
    const todayKey = getDateKey(new Date());
    const rec = getOrCreateDayRecord(todayKey);
    if (rec.cigs === 0) {
      window.handleHomeNoSmokeToday();
      return;
    }
    const alreadyDone = Array.isArray(rec.events) && rec.events.some(e => e.kind === 'day-complete');
    if (!alreadyDone) {
      recordHabbiEvent({
        dateKey: todayKey,
        kind: 'day-complete',
        title: 'Dia encerrado',
        desc: `${rec.cigs} cigarros no dia`,
        detail: 'Dia encerrado para consolidação da economia.'
      });
    } else {
      rec.dayCompleted = true;
      refreshAllViews();
    }
  };

  window.recordPackPurchase = function(kind) {
    const now = new Date();
    const todayKey = getDateKey(now);
    const timeClock = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const price = Math.max(0.5, parseFloat(userState.packPrice) || 15);
    if (!Array.isArray(userState.packEvents)) userState.packEvents = [];
    userState.packEvents.unshift({
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      timestamp: Date.now(),
      dateKey: todayKey,
      timeLabel: `Hoje, ${timeClock}`,
      kind: kind === 'bought' ? 'bought' : 'avoided',
      price: price,
      cigsPerPack: userState.cigsPerPack || 20
    });
    savePersistedState();
    updateSavingsDisplay();
  };

  window.deletePackPurchase = function(id) {
    if (!Array.isArray(userState.packEvents)) return;
    userState.packEvents = userState.packEvents.filter(e => String(e.id) !== String(id));
    savePersistedState();
    updateSavingsDisplay();
  };

  window.openSavingsSheet = function(mode) {
    const overlay = document.getElementById('wl-sav-sheet-overlay');
    if (!overlay) return;
    const titleEl = document.getElementById('wl-sav-sheet-title');
    const cfgPanel = document.getElementById('wl-sav-panel-config');
    const histPanel = document.getElementById('wl-sav-panel-history');

    const isHist = mode === 'history';
    if (cfgPanel) cfgPanel.style.display = isHist ? 'none' : 'flex';
    if (histPanel) histPanel.style.display = isHist ? 'flex' : 'none';
    if (titleEl) {
      titleEl.innerText = isHist ? 'Histórico de economia' : 'Parâmetros de economia';
    }
    updateSavingsDisplay();
    overlay.classList.add('is-open');
    openAccessibleDialog(overlay, window.closeSavingsSheet, 'wl-sav-sheet-title');
  };

  window.closeSavingsSheet = function() {
    const overlay = document.getElementById('wl-sav-sheet-overlay');
    if (overlay) {
      overlay.classList.remove('is-open');
      closeAccessibleDialog(overlay);
    }
  };

  window.adjustSavingsHabitual = function(delta) {
    const cur = Math.max(1, parseInt(userState.habitualCigs, 10) || 12);
    userState.habitualCigs = Math.max(1, Math.min(60, cur + (parseInt(delta, 10) || 0)));
    userState.habitualCigsCustomized = true;
    savePersistedState();
    updateSavingsDisplay();
  };

  window.adjustSavingsPackPrice = function(delta) {
    const cur = Math.max(0.5, parseFloat(userState.packPrice) || 15);
    const next = Math.max(1, Math.min(150, Math.round((cur + (parseFloat(delta) || 0)) * 2) / 2));
    window.setCalcPackPrice(next);
    savePersistedState();
    updateSavingsDisplay();
  };

  window.onSavingsPriceInput = function(val) {
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      window.setCalcPackPrice(parsed);
      savePersistedState();
      updateSavingsDisplay();
    }
  };

  window.adjustSavingsCigsPerPack = function(delta) {
    const cur = Math.max(1, parseInt(userState.cigsPerPack, 10) || 20);
    userState.cigsPerPack = Math.max(1, Math.min(40, cur + (parseInt(delta, 10) || 0)));
    savePersistedState();
    updateSavingsDisplay();
  };

  window.selectSavingsPackFreq = function(days) {
    userState.packFreqDays = Math.max(1, parseInt(days, 10) || 2);
    savePersistedState();
    updateSavingsDisplay();
  };

  // ==========================================================================
  // Conquista (Screen 29) & Horizontal Carousel
  // ==========================================================================
  const GOAL_PRESETS = [
    { title: 'Jantar especial', target: 250 },
    { title: 'Tênis novo', target: 400 },
    { title: 'Fim de semana fora', target: 750 },
    { title: 'Smartphone novo', target: 1800 }
  ];

  window.openChangeGoalModal = function() {
    const modal = document.getElementById('wl-goal-modal-overlay');
    if (!modal) return;
    const nameInput = document.getElementById('wl-goal-custom-name');
    const amountInput = document.getElementById('wl-goal-custom-amount');
    const curGoal = userState.savingsGoal || { title: (typeof getDefaultGoalTitle === 'function' ? getDefaultGoalTitle(userState.currentLang) : 'Minha conquista'), target: 250 };
    if (nameInput) nameInput.value = curGoal.title || '';
    if (amountInput) amountInput.value = curGoal.target || '';
    modal.classList.add('is-open');
    openAccessibleDialog(modal, window.closeChangeGoalModal, 'wl-goal-modal-title');
  };

  window.closeChangeGoalModal = function() {
    const modal = document.getElementById('wl-goal-modal-overlay');
    if (modal) {
      modal.classList.remove('is-open');
      closeAccessibleDialog(modal);
    }
  };

  window.selectGoalPreset = function(title, target) {
    ensureActiveProfileForWrite();
    userState.savingsGoal = { title, target: Math.max(10, parseFloat(target) || 250) };
    userState.hasConfiguredFirstGoal = true;
    savePersistedState();
    window.closeChangeGoalModal();
    window.updateConquistaBagUI();
  };

  window.saveCustomGoal = function() {
    const nameInput = document.getElementById('wl-goal-custom-name');
    const amountInput = document.getElementById('wl-goal-custom-amount');
    const title = (nameInput && nameInput.value.trim()) || 'Minha conquista';
    const target = (amountInput && parseFloat(amountInput.value)) || 250;
    if (target < 5) return;
    ensureActiveProfileForWrite();
    userState.savingsGoal = { title, target };
    userState.hasConfiguredFirstGoal = true;
    savePersistedState();
    window.closeChangeGoalModal();
    window.updateConquistaBagUI();
  };

  window.updateConquistaBagUI = function() {
    const m = computeSavingsMetrics();
    const heroSavingsVal = m.confirmedSavings;

    if (!userState.savingsGoal) {
      userState.savingsGoal = { title: (typeof getDefaultGoalTitle === 'function' ? getDefaultGoalTitle(userState.currentLang) : 'Minha conquista'), target: 250 };
    }
    const goal = userState.savingsGoal;
    const targetVal = Math.max(1, parseFloat(goal.target) || 250);
    const rawRatio = heroSavingsVal / targetVal;
    const pct = Math.min(100, Math.max(0, Math.round(rawRatio * 100)));
    const remaining = Math.max(0, targetVal - heroSavingsVal);

    const titleEl = document.getElementById('wl-conquista-goal-title');
    const targetEl = document.getElementById('wl-conquista-goal-target');
    const pctEl = document.getElementById('wl-conquista-pct-pill');
    const heroValEl = document.getElementById('wl-conquista-main-val');
    const remainingEl = document.getElementById('wl-conquista-remaining');
    const fillImg = document.getElementById('wl-bag-fill-img');

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : window.HABBI_I18N.PT;

    if (titleEl) titleEl.innerText = goal.title;
    if (targetEl) targetEl.innerText = formatBrl(targetVal);
    if (pctEl) {
      if (pct >= 100) {
        pctEl.innerText = t.conquistaAchieved || '100% atingido!';
        pctEl.classList.add('is-completed');
      } else {
        pctEl.innerText = `${pct}% ${t.conquistaOfGoal || 'do objetivo'}`;
        pctEl.classList.remove('is-completed');
      }
    }
    const heroLblEl = document.getElementById('wl-conquista-hero-lbl');
    if (heroLblEl) {
      heroLblEl.innerText = (t.conquistaEstPrefix || 'Economia estimada:').replace(/:\s*$/, '');
    }
    if (heroValEl) {
      heroValEl.innerText = formatBrl(heroSavingsVal);
    }
    if (remainingEl) {
      if (remaining <= 0) {
        remainingEl.innerHTML = `<strong style="color:#16A34A;">${t.conquistaRemainingDone || 'Objetivo alcançado! Parabéns!'}</strong>`;
      } else {
        remainingEl.innerText = `${t.conquistaRemainingPrefix || 'Faltam'} ${formatBrl(remaining)}`;
      }
    }

    // Atualiza seção secundária "Seus gastos" (independente da economia estimada)
    const expTodayValEl = document.getElementById('wl-expenses-today-val');
    const expMonthValEl = document.getElementById('wl-expenses-month-val');
    const expPerCigEl = document.getElementById('wl-expenses-per-cig');
    if (expTodayValEl) expTodayValEl.innerText = formatBrl(m.todaySpent || 0);
    if (expMonthValEl) expMonthValEl.innerText = formatBrl(m.monthSpent || 0);
    if (expPerCigEl) {
      const perCigTpl = t.conquistaExpensesPerCig || 'Custo estimado: {0} / cigarro';
      expPerCigEl.innerText = perCigTpl.replace('{0}', formatBrl(m.costPerCig || 0));
    }

    // Confetes na primeira vez que atinge 100% (escopado por perfil)
    if (pct >= 100) {
      if (!userState.sacola100Celebrated) {
        userState.sacola100Celebrated = true;
        savePersistedState();
        if (typeof window.triggerConquistaConfetti === 'function') {
          setTimeout(() => window.triggerConquistaConfetti(), 350);
        }
      }
    }

    if (fillImg) {
      // Base da sacola: 70.0% do topo da imagem. Abertura do corpo: 35.9% do topo. Topo das alças: 0.0%.
      const emptyInset = 70.0;
      const bodyTopInset = 35.9;
      let currentInset;
      if (pct >= 100) {
        // Ao atingir ou passar de 100%, preenche a sacola completa inclusive as alças
        currentInset = 0;
      } else {
        const ratio = Math.max(0, pct / 100);
        currentInset = (emptyInset - (ratio * (emptyInset - bodyTopInset))).toFixed(2);
      }
      fillImg.style.clipPath = `inset(${currentInset}% 0 0 0)`;

      // Preenchimento fixo no verde característico do Habbi
      fillImg.classList.remove('is-yellow', 'is-orange', 'is-celebrate');
      fillImg.classList.add('is-green');
    }
  };

  window.triggerConquistaConfetti = function() {
    const stage = document.getElementById('wl-conquista-bag-stage');
    if (!stage) return;
    const existing = stage.querySelector('.wl-splash-confetti-layer');
    if (existing) existing.remove();

    const confettiLayer = document.createElement('div');
    confettiLayer.className = 'wl-splash-confetti-layer is-active';
    confettiLayer.style.position = 'absolute';
    confettiLayer.style.inset = '0';
    confettiLayer.style.zIndex = '30';
    confettiLayer.style.pointerEvents = 'none';

    const colors = ['#43A027', '#5FB149', '#FFD93D', '#5AB8FF', '#FF7F7F', '#B388FF', '#FF9F43', '#FFFFFF'];
    let pieces = '';
    for (let i = 0; i < 48; i++) {
      const color = colors[i % colors.length];
      const angle = (i / 48) * Math.PI * 2 + ((i % 3) * 0.1);
      const dist = 75 + ((i * 23) % 95);
      const tx = Math.round(Math.cos(angle) * dist * 1.15);
      const ty = Math.round(Math.sin(angle) * dist * 0.95 - 20);
      const delay = ((i % 6) * 0.02).toFixed(3);
      const dur = (1.2 + ((i % 5) * 0.09)).toFixed(2);
      const rot = (i * 57) % 360;
      pieces += `<span class="wl-splash-confetti-piece" style="--c-tx:${tx}px;--c-ty:${ty}px;--c-bg:${color};--c-delay:${delay}s;--c-dur:${dur}s;--c-rot:${rot}deg;"></span>`;
    }
    confettiLayer.innerHTML = pieces;
    stage.appendChild(confettiLayer);
    setTimeout(() => {
      if (confettiLayer && confettiLayer.parentNode) confettiLayer.remove();
    }, 2500);
  };

  // ==========================================================================
  // CARROSSEL PRINCIPAL (TELAS 29 ↔ 10 ↔ 15) - JANELA HORIZONTAL CONTÍNUA
  // ==========================================================================
  let currentCarouselSlide = 1; // 0 = Conquista (29), 1 = Início (10), 2 = Minijogos (15)

  let pendingCarouselTargetAfterLeaveGame = null;

  window.closeConfirmLeaveGameModal = function() {
    pendingCarouselTargetAfterLeaveGame = null;
    const modal = document.getElementById('habbi-confirm-leave-game-modal');
    if (modal) {
      modal.style.display = 'none';
      closeAccessibleDialog(modal);
    }
  };

  window.confirmPendingLeaveGame = function() {
    const nextScreen = pendingCarouselTargetAfterLeaveGame;
    window.closeConfirmLeaveGameModal();
    if (typeof quitInlineGame === 'function') quitInlineGame();
    if (typeof nextScreen === 'number') {
      window.navigateHorizontalCarousel(nextScreen, true);
    }
  };

  // Navegação por teclado WAI-ARIA tablist nas abas do carrossel (ArrowLeft, ArrowRight, Home, End)
  document.querySelectorAll('.wl-pager-nav-dots').forEach(bar => {
    bar.addEventListener('keydown', (e) => {
      const tabs = Array.from(bar.querySelectorAll('.wl-pager-tab'));
      if (tabs.length === 0) return;
      const curIdx = tabs.indexOf(document.activeElement);
      if (curIdx === -1) return;
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (curIdx + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') nextIdx = (curIdx - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = tabs.length - 1;
      if (nextIdx === null) return;
      e.preventDefault();
      const targetMap = [29, 10, 15];
      const targetScreen = targetMap[nextIdx];
      if (typeof window.navigateHorizontalCarousel === 'function') {
        window.navigateHorizontalCarousel(targetScreen);
      }
      // Só move o foco para a aba alvo se o diálogo de saída do jogo não bloqueou a troca
      const leaveModal = document.getElementById('habbi-confirm-leave-game-modal');
      if (!leaveModal || leaveModal.style.display === 'none') {
        tabs[nextIdx].focus();
      }
    });
  });

  window.goToCarouselSlide = function(slideIdx, smooth = true) {
    if (slideIdx < 0) slideIdx = 0;
    if (slideIdx > 2) slideIdx = 2;
    if (currentCarouselSlide === 2 && slideIdx !== 2) {
      // Saindo dos Minijogos pelo carrossel: encerra jogo em andamento e restaura o menu
      if (typeof reflexGameState !== 'undefined' && reflexGameState && reflexGameState.idleTimer) {
        clearTimeout(reflexGameState.idleTimer);
        reflexGameState.idleTimer = null;
      }
      resetMinigamesUI();
    }
    currentCarouselSlide = slideIdx;

    const screenMap = [29, 10, 15];
    const targetScreen = screenMap[slideIdx];
    currentScreen = targetScreen;
    localStorage.setItem('habbi-current-screen', targetScreen);

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const track = document.getElementById('main-carousel-track');
    if (track) {
      track.style.transition = (smooth && !prefersReducedMotion) ? 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none';
      track.style.transform = 'translate3d(-' + (slideIdx * 33.333333) + '%, 0, 0)';
    }

    // Isola slides ocultos do foco de teclado e leitores de tela (inert + aria-hidden)
    syncCarouselSlidesInert(slideIdx, true);

    // Sincroniza estado ativo de todos os grupos de abas do carrossel (.wl-pager-tab / .wl-pager-dot)
    document.querySelectorAll('.wl-pager-nav-dots').forEach(bar => {
      const tabs = bar.querySelectorAll('.wl-pager-tab, .wl-pager-dot');
      tabs.forEach((tab, idx) => {
        const isAct = idx === slideIdx;
        tab.classList.toggle('active', isAct);
        tab.setAttribute('aria-selected', isAct ? 'true' : 'false');
        tab.setAttribute('tabindex', isAct ? '0' : '-1');
      });
    });

    // Mantém a pílula de economia padronizada visualmente em todas as telas do carrossel
    document.querySelectorAll('.wl-home-savings-pill').forEach(pill => {
      pill.classList.remove('is-active');
      pill.setAttribute('aria-current', slideIdx === 0 ? 'page' : 'false');
    });

    // Sincroniza badges de dia no calendário e pílulas de economia em todos os cabeçalhos
    const curDay = new Date().getDate();
    document.querySelectorAll('.wl-top-cal-badge').forEach(b => { b.innerText = curDay; });

    const homeSavingsEl = document.getElementById('home-savings-top');
    const curSavingsText = homeSavingsEl ? homeSavingsEl.innerText : 'R$ 0,00';
    document.querySelectorAll('.top-savings-value-text').forEach(t => { t.innerText = curSavingsText; });

    // Atualização de conteúdo específica por tela
    if (slideIdx === 0) {
      if (typeof updateSavingsDisplay === 'function') updateSavingsDisplay();
      if (typeof window.updateConquistaBagUI === 'function') window.updateConquistaBagUI();
    } else if (slideIdx === 1) {
      if (typeof updateSavingsDisplay === 'function') updateSavingsDisplay();
      if (typeof syncDailyGoalAndWeekUI === 'function') syncDailyGoalAndWeekUI();
    } else if (slideIdx === 2) {
      if (typeof updateMinigamesRecordUI === 'function') updateMinigamesRecordUI();
    }

    if (typeof window.applyAppLanguage === 'function') {
      window.applyAppLanguage(userState.currentLang || 'PT');
    }
  };

  window.navigateHorizontalCarousel = function(targetScreen, bypassGameGuard = false) {
    // Proteção durante minijogo ativo no modo carrossel: pede confirmação antes de encerrar partida
    if (!bypassGameGuard && userState.isGameActive && currentCarouselSlide === 2 && targetScreen !== 15) {
      pendingCarouselTargetAfterLeaveGame = targetScreen;
      const modal = document.getElementById('habbi-confirm-leave-game-modal');
      if (modal) {
        modal.style.display = 'flex';
        openAccessibleDialog(modal, window.closeConfirmLeaveGameModal, 'habbi-leave-game-title');
        return;
      }
    }

    if (typeof hideTutorialSwipeHint === 'function') {
      hideTutorialSwipeHint();
    } else {
      const swipeHint = document.getElementById('wl-carousel-swipe-hint');
      if (swipeHint) {
        swipeHint.classList.remove('is-tutorial-visible');
        swipeHint.style.display = 'none';
      }
    }

    if (targetScreen === 15) {
      userState.minijogosMode = 'carousel';
      userState.minijogosReturnScreen = 10;
      const s15El = document.querySelector('.screen[data-screen="15"]');
      if (s15El) s15El.classList.remove('tools-mode');
    }
    if (targetScreen === 29) {
      userState.conquistaMode = 'carousel';
      const s29El = document.querySelector('.screen[data-screen="29"]');
      if (s29El) s29El.classList.remove('tools-mode');
    }

    const carouselIndexMap = { 29: 0, 10: 1, 15: 2 };
    const slideIdx = carouselIndexMap[targetScreen];
    const mainCarousel = document.getElementById('main-carousel-container');
    if (mainCarousel && slideIdx !== undefined) mainCarousel.classList.remove('tools-mode');

    if (slideIdx !== undefined) {
      if (mainCarousel && !mainCarousel.classList.contains('active')) {
        showScreen(targetScreen);
      } else {
        window.goToCarouselSlide(slideIdx, true);
      }
    } else {
      showScreen(targetScreen);
    }
  };

  // Abre o Painel Rápido de Registro diretamente sobre a tela atual (sem telas intermediárias)
  window.openRegisterSheet = function(dateKey, returnScreen) {
    userState.activeRegisterDateKey = dateKey || getDateKey(new Date());
    userState.returnScreenAfterRegister = returnScreen || currentScreen || 10;
    if (typeof window.openQuickRegisterModal === 'function') {
      window.openQuickRegisterModal(userState.activeRegisterDateKey);
    }
  };

  window.openRegisterFromCalendar = function() {
    userState.activeRegisterDateKey = userState.calSelectedDate || getDateKey(new Date());
    userState.returnScreenAfterRegister = 16;
    if (typeof window.openQuickRegisterModal === 'function') {
      window.openQuickRegisterModal(userState.activeRegisterDateKey);
    }
  };

  // "Não fumei hoje" direto do Calendário: confirma o dia selecionado e abre o "Bate aqui!"
  window.confirmNoSmokeFromCalendar = function() {
    userState.activeRegisterDateKey = userState.calSelectedDate || getDateKey(new Date());
    userState.returnScreenAfterRegister = 16;
    window.quickConfirmDay();
  };

  window.openHistoryFromCalendar = function() {
    const s19Back = document.querySelector('.screen[data-screen="19"] .btn-back');
    if (s19Back) s19Back.setAttribute('onclick', 'goToScreen(16)');
    showScreen(19);
  };

  // Habbi Flat UI Upgrade Injector (Pages 1-54)
  function applyHabbiFlatDesign() {
    // Strip all transparent white backgrounds from mascot illustrations via Canvas
    // so they sit ON TOP of solid colored cards/backgrounds cleanly with zero filter/blend distortion
    const cleanImgCache = {};
    window.removeWhiteBgFromAllMascots = function() {
      const imgs = document.querySelectorAll('img[src*="ilustra"]:not(.wl-keep-bg), .wl-splash-cat-frame, .wl-welcome-mascot, .wl-onb-mascot, .wl-notif-mascot, .wl-compare-cat, .wl-quest-cat, .wl-calc-cat, .home-v2-mascot, .wl-cal-mini-cat, .wl-savings-bush-cat, #wl-cel-img');
      imgs.forEach(img => {
        const rawSrc = img.getAttribute('src');
        if (!rawSrc || rawSrc.startsWith('data:') || rawSrc.includes('splash_screen')) return;
        const isSplashFrame = img.classList.contains('wl-splash-cat-frame');
        const isBushCorner = img.classList.contains('wl-savings-bush-cat');
        const cacheKey = isBushCorner
          ? rawSrc + '#bushCorner'
          : (isSplashFrame ? rawSrc + '#splashNorm' : rawSrc);
        if (cleanImgCache[cacheKey]) {
          if (cleanImgCache[cacheKey] !== rawSrc) {
            img.src = cleanImgCache[cacheKey];
          }
          return;
        }
        const process = () => {
          if (!img.naturalWidth || (img.getAttribute('src') || '').startsWith('data:')) return;
          try {
            // Verificação ultra-rápida dos 4 cantos: se o PNG já tem fundo transparente,
            // mantém a imagem original intacta (qualidade 100% original e zero travamento na Splash)
            if (!isBushCorner) {
              const probe = document.createElement('canvas');
              probe.width = 2;
              probe.height = 2;
              const pctx = probe.getContext('2d', { willReadFrequently: true });
              const nw = img.naturalWidth;
              const nh = img.naturalHeight;
              pctx.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
              pctx.drawImage(img, nw - 1, 0, 1, 1, 1, 0, 1, 1);
              pctx.drawImage(img, 0, nh - 1, 1, 1, 0, 1, 1, 1);
              pctx.drawImage(img, nw - 1, nh - 1, 1, 1, 1, 1, 1, 1);
              const pd = pctx.getImageData(0, 0, 2, 2).data;
              if (pd[3] < 20 && pd[7] < 20 && pd[11] < 20 && pd[15] < 20) {
                cleanImgCache[cacheKey] = rawSrc;
                return;
              }
            }
            const c = document.createElement('canvas');
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, c.width, c.height);
            const d = imgData.data;
            const w = c.width;
            const h = c.height;
            // 1) Flood-fill from borders so exterior white background becomes transparent
            const visited = new Uint8Array(w * h);
            const stack = [];
            for (let x = 0; x < w; x++) {
              stack.push(x);
              stack.push((h - 1) * w + x);
            }
            for (let y = 0; y < h; y++) {
              stack.push(y * w);
              stack.push(y * w + (w - 1));
            }
            while (stack.length > 0) {
              const idx = stack.pop();
              if (visited[idx]) continue;
              visited[idx] = 1;
              const p = idx * 4;
              const r = d[p], g = d[p + 1], b = d[p + 2];
              if (r > 232 && g > 232 && b > 232) {
                d[p + 3] = 0;
                const x = idx % w;
                const y = (idx - x) / w;
                if (x > 0 && !visited[idx - 1]) stack.push(idx - 1);
                if (x < w - 1 && !visited[idx + 1]) stack.push(idx + 1);
                if (y > 0 && !visited[idx - w]) stack.push(idx - w);
                if (y < h - 1 && !visited[idx + w]) stack.push(idx + w);
              }
            }
            // 2) Clear any trapped white pockets (e.g. inside hollow icons or between whiskers)
            // while keeping white eye highlights (which are surrounded on all 4 sides by the black pupil/head)
            const maxScan = Math.round(w * 0.12);
            const hasDarkWall = (sx, sy, dx, dy) => {
              let darkCount = 0;
              for (let s = 1; s <= maxScan; s++) {
                const nx = sx + dx * s;
                const ny = sy + dy * s;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) return false;
                const np = (ny * w + nx) * 4;
                if (d[np + 3] > 180 && d[np] < 50 && d[np + 1] < 50 && d[np + 2] < 50) {
                  darkCount++;
                  if (darkCount >= 5) return true;
                }
              }
              return false;
            };
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const p = (y * w + x) * 4;
                if (d[p + 3] === 0) continue;
                const r = d[p], g = d[p + 1], b = d[p + 2];
                if (r > 235 && g > 235 && b > 235) {
                  const isEyeHighlight =
                    hasDarkWall(x, y, -1, 0) &&
                    hasDarkWall(x, y, 1, 0) &&
                    hasDarkWall(x, y, 0, -1) &&
                    hasDarkWall(x, y, 0, 1);
                  if (!isEyeHighlight) {
                    d[p + 3] = 0;
                  }
                }
              }
            }
            // 3) Soften 1px anti-aliased white halo around black/colored edges
            for (let y = 1; y < h - 1; y++) {
              for (let x = 1; x < w - 1; x++) {
                const idx = y * w + x;
                const p = idx * 4;
                if (d[p + 3] === 0) continue;
                const r = d[p], g = d[p + 1], b = d[p + 2];
                if (r > 210 && g > 210 && b > 210) {
                  if (
                    d[(idx - 1) * 4 + 3] === 0 ||
                    d[(idx + 1) * 4 + 3] === 0 ||
                    d[(idx - w) * 4 + 3] === 0 ||
                    d[(idx + w) * 4 + 3] === 0
                  ) {
                    d[p + 3] = 0;
                  }
                }
              }
            }
            ctx.putImageData(imgData, 0, 0);
            let finalCanvas = c;
            if (isBushCorner) {
              let minX = w, minY = h, maxX = 0, maxY = 0;
              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  if (d[(y * w + x) * 4 + 3] > 24) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }
              if (maxX > minX && maxY > minY) {
                const cropX = Math.min(maxX, minX + 4);
                const cropY = minY;
                const cropW = Math.max(1, maxX - cropX + 1);
                const cropH = Math.max(1, Math.round((maxY - minY) * 0.98));
                const cc = document.createElement('canvas');
                cc.width = cropW;
                cc.height = cropH;
                cc.getContext('2d').drawImage(c, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                finalCanvas = cc;
              }
            }
            const dataUrl = finalCanvas.toDataURL('image/png');
            cleanImgCache[cacheKey] = dataUrl;
            img.src = dataUrl;
          } catch (e) {}
        };
        // Fila: processa uma imagem por vez, liberando a thread entre elas (splash/toques respondem na hora)
        const enqueue = () => {
          window.__mascotQueue = window.__mascotQueue || [];
          window.__mascotQueue.push(process);
          if (!window.__mascotQueueRunning) {
            window.__mascotQueueRunning = true;
            const runNext = () => {
              const job = window.__mascotQueue.shift();
              if (!job) { window.__mascotQueueRunning = false; return; }
              try { job(); } catch (e) {}
              setTimeout(runNext, 16);
            };
            setTimeout(runNext, 0);
          }
        };
        if (img.complete && img.naturalWidth) {
          enqueue();
        } else {
          img.addEventListener('load', enqueue, { once: true });
        }
      });
    };

    // 0. Screen 1 (Unificada com Boas-vindas): Fundo verde + Frase no topo + Roleta acelerada + Confetes que explodem pros lados e somem + Botão Iniciar branco centralizado + Idioma circular com bandeira
    const s1 = document.querySelector('.screen[data-screen="1"]');
    if (s1) {
      s1.removeAttribute('style');
      s1.className = 'screen active wl-splash-screen';

      // Todos os gatinhos calibrados para o mesmo porte visual da pose padrão (que permanece em scale: 1.0)
      const splashPoses = [
        { src: 'assets/ilustracoes/gato brincando com bola.png', alt: 'Gato brincando com bola', scale: 0.90, offsetX: '0%', offsetY: '7.5%' },
        { src: 'assets/ilustracoes/gato com ponto de nterroga\u00e7\u00e3o.png', alt: 'Gato com ponto de interroga\u00e7\u00e3o', scale: 1.0, offsetX: '0%', offsetY: '0%' },
        { src: 'assets/ilustracoes/gato dormindo.png', alt: 'Gato dormindo', scale: 0.88, offsetX: '0%', offsetY: '14.5%' },
        { src: 'assets/ilustracoes/entenda_seus_habitos.png', alt: 'Entenda seus h\u00e1bitos', scale: 1.0, offsetX: '3%', offsetY: '-8.2%' },
        { src: 'assets/ilustracoes/gato segurando cora\u00e7\u00e3o.png', alt: 'Gato segurando cora\u00e7\u00e3o', scale: 0.78, offsetX: '0%', offsetY: '9.2%' },
        { src: 'assets/ilustracoes/gato na caixa.png', alt: 'Gato na caixa', scale: 0.80, offsetX: '0%', offsetY: '7.2%' },
        { src: 'assets/ilustracoes/identifique_gatilhos.png', alt: 'Identifique gatilhos', scale: 1.0, offsetX: '3%', offsetY: '-7.8%' },
        { src: 'assets/ilustracoes/gato pose normal padrao.png', alt: 'Gato pose normal padr\u00e3o', scale: 1.0, offsetX: '0%', offsetY: '0%' }
      ];

      // 52 confetes que explodem do centro para fora (sem caimento) e desaceleram suavemente até sumir
      const confettiColors = ['#FFD93D', '#5AB8FF', '#FF7F7F', '#B388FF', '#FF9F43', '#FFFFFF'];
      let confettiSpans = '';
      for (let i = 0; i < 52; i++) {
        const color = confettiColors[i % confettiColors.length];
        const angle = (i / 52) * Math.PI * 2 + ((i % 3) * 0.08);
        const dist = 95 + ((i * 29) % 115);
        const tx = Math.round(Math.cos(angle) * dist * 1.12);
        const ty = Math.round(Math.sin(angle) * dist * 0.92 - 18);
        const delay = ((i % 6) * 0.018).toFixed(3);
        const dur = (1.15 + ((i % 5) * 0.09)).toFixed(2);
        const rot = (i % 2 === 0 ? 1 : -1) * (95 + ((i * 23) % 160));
        confettiSpans += `<span class="wl-splash-confetti-piece" style="--c-tx:${tx}px;--c-ty:${ty}px;--c-bg:${color};--c-delay:${delay}s;--c-dur:${dur}s;--c-rot:${rot}deg;"></span>`;
      }

      const flagSVGs = {
        PT: `<svg viewBox="0 0 36 36" width="100%" height="100%"><rect width="36" height="36" fill="#009B3A"/><polygon points="18,5 32,18 18,31 4,18" fill="#FEDF00"/><circle cx="18" cy="18" r="6.8" fill="#002776"/><path d="M11.4,16.6 Q18,13.8 24.6,18.4" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/></svg>`,
        EN: `<svg viewBox="0 0 36 36" width="100%" height="100%"><rect width="36" height="36" fill="#B22234"/><rect y="5" width="36" height="4" fill="#FFFFFF"/><rect y="13" width="36" height="4" fill="#FFFFFF"/><rect y="21" width="36" height="4" fill="#FFFFFF"/><rect y="29" width="36" height="4" fill="#FFFFFF"/><rect width="18" height="19" fill="#3C3B6E"/></svg>`,
        ES: `<svg viewBox="0 0 36 36" width="100%" height="100%"><rect width="36" height="36" fill="#AA151B"/><rect y="9" width="36" height="18" fill="#F1BF00"/></svg>`
      };

      s1.innerHTML = `
        <div class="wl-splash-confetti-layer" id="wl-splash-confetti" aria-hidden="true">
          ${confettiSpans}
        </div>

        <div class="wl-splash-top">
          <h1 class="wl-splash-headline" id="wl-splash-headline">Controle seus h\u00e1bitos,<br>acompanhe sua evolu\u00e7\u00e3o.</h1>
        </div>

        <div class="wl-splash-stage" id="wl-splash-stage" title="Toque no gatinho para repetir a anima\u00e7\u00e3o">
          <div class="wl-splash-shadow" id="wl-splash-shadow"></div>
          <div class="wl-splash-burst-ring" id="wl-splash-burst-ring"></div>
          ${splashPoses.map((p, idx) => `
            <img
              src="${p.src}"
              alt="${p.alt}"
              class="wl-splash-cat-frame ${idx === 0 ? 'is-visible' : ''} ${idx === 7 ? 'is-final-pose' : ''}"
              data-pose-idx="${idx}"
              style="--cat-scale:${p.scale};--cat-x:${p.offsetX || '0%'};--cat-y:${p.offsetY};"
            >
          `).join('')}
        </div>

        <div class="wl-splash-bottom">
          <div class="wl-splash-cta-bar" id="wl-splash-cta-wrap">
            <button type="button" class="wl-splash-lang-trigger" id="btn-splash-lang" title="Trocar idioma">
              <span class="wl-lang-flag-circle" id="wl-lang-flag-circle">${flagSVGs.PT}</span>
              <span class="wl-lang-code-txt" id="wl-lang-code-txt">PT</span>
            </button>
            <button type="button" class="wl-splash-white-start-btn" id="btn-splash-start">INICIAR</button>
          </div>
          <button type="button" class="wl-splash-login-link" id="btn-splash-login" onclick="if(window.clearSplashRoulette)window.clearSplashRoulette(); goToScreen(23);">Já tenho conta · Entrar</button>
        </div>
      `;

      let splashTimers = [];
      window.clearSplashRoulette = function() {
        splashTimers.forEach(t => clearTimeout(t));
        splashTimers = [];
      };
      window.startSplashRoulette = function() {
        window.clearSplashRoulette();

        const frames = s1.querySelectorAll('.wl-splash-cat-frame');
        const shadowEl = document.getElementById('wl-splash-shadow');
        const confettiLayer = document.getElementById('wl-splash-confetti');
        const burstRing = document.getElementById('wl-splash-burst-ring');
        const ctaWrap = document.getElementById('wl-splash-cta-wrap');
        if (!frames.length) return;

        // Reset initial state
        const headEl = document.getElementById('wl-splash-headline');
        if (headEl) {
          headEl.classList.remove('is-subtle-in');
          void headEl.offsetWidth;
          headEl.classList.add('is-subtle-in');
        }
        if (confettiLayer) {
          confettiLayer.classList.remove('is-active');
          void confettiLayer.offsetWidth;
        }
        if (burstRing) {
          burstRing.classList.remove('is-active');
          void burstRing.offsetWidth;
        }

        const showFrame = (poseIdx, mode) => {
          frames.forEach((f, idx) => {
            f.classList.remove('is-visible', 'is-stepping', 'is-celebrating');
            if (idx === poseIdx) {
              void f.offsetWidth;
              f.classList.add('is-visible');
              if (mode === 'step') f.classList.add('is-stepping');
              if (mode === 'celebrate') f.classList.add('is-celebrating');
            }
          });
        };

        // Sequência cadenciada e acelerando gradualmente até parar no #7 (gato pose normal padrao)
        const steps = [
          { idx: 0, delay: 0 },
          { idx: 1, delay: 650 },
          { idx: 2, delay: 1200 },
          { idx: 3, delay: 1660 },
          { idx: 4, delay: 2040 },
          { idx: 5, delay: 2350 },
          { idx: 6, delay: 2600 },
          { idx: 0, delay: 2810 },
          { idx: 1, delay: 2985 },
          { idx: 2, delay: 3135 },
          { idx: 3, delay: 3265 },
          { idx: 4, delay: 3385 },
          { idx: 5, delay: 3500 },
          { idx: 6, delay: 3620 },
          { idx: 7, delay: 3760, final: true }
        ];

        steps.forEach((step) => {
          const timer = setTimeout(() => {
            if (step.final) {
              showFrame(step.idx, 'celebrate');
              if (confettiLayer) confettiLayer.classList.add('is-active');
              if (burstRing) burstRing.classList.add('is-active');
              if (ctaWrap) ctaWrap.classList.add('is-ready');
            } else {
              showFrame(step.idx, 'step');
            }
          }, step.delay);
          splashTimers.push(timer);
        });
      };

      const stageEl = document.getElementById('wl-splash-stage');
      if (stageEl) {
        stageEl.addEventListener('click', () => {
          window.startSplashRoulette();
        });
      }
      const startBtn = document.getElementById('btn-splash-start');
      if (startBtn) {
        startBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (window.clearSplashRoulette) window.clearSplashRoulette();
          showScreen(3);
        });
      }

      // Botão clicável de idioma (PT -> EN -> ES -> PT)
      const langBtn = document.getElementById('btn-splash-lang');
      if (langBtn) {
        langBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof window.cycleAppLanguage === 'function') {
            window.cycleAppLanguage();
          }
        });
      }
      if (typeof window.applyAppLanguage === 'function') {
        window.applyAppLanguage(userState.currentLang || 'PT');
      }
    }

    // 1. Screen 2 foi substituída pela nova Screen 1 unificada
    const s2 = document.querySelector('.screen[data-screen="2"]');
    if (s2) {
      s2.removeAttribute('style');
      s2.className = 'screen';
      s2.innerHTML = '';
    }

    // 2. Screen 3: Onboarding 1 - Controle de meta diária com a ilustração do cigarro em cinza
    const s3 = document.querySelector('.screen[data-screen="3"]');
    if (s3) {
      s3.removeAttribute('style');
      s3.className = 'screen wl-onb-screen onb-slide';
      const cigImgSrc = 'assets/ilustracoes/cigarro_Prancheta 1.png';
      const cigImgFallback = 'assets/ilustracoes/cigarro_Prancheta 1.png';
      s3.innerHTML = `
        <div class="wl-onb-header">
          <div style="display:flex; align-items:center; gap:6px;">
            <button type="button" class="wl-onb-back-arrow" onclick="goToScreen(1)" aria-label="Voltar" style="background:none; border:none; font-size:22px; color:var(--text-muted); cursor:pointer; padding:0 6px 2px; line-height:1;">‹</button>
            <span class="wl-step-pill">1 de 3</span>
          </div>
          <button class="wl-skip-btn" onclick="goToScreen(7)">IGNORAR</button>
        </div>
        <div class="wl-onb-titles">
          <h1>Acompanhe seu limite<br>com 1 toque</h1>
          <p class="caption">Registre ao longo do dia para ficar dentro da sua meta diária.</p>
        </div>
        <div class="wl-cig-demo-stage" id="wl-cig-demo-stage">
          <svg width="0" height="0" style="position:absolute;pointer-events:none;" aria-hidden="true">
            <defs>
              <filter id="wl-cig-green-tint" color-interpolation-filters="sRGB">
                <feFlood flood-color="#78B848" result="flood" />
                <feComposite in="flood" in2="SourceAlpha" operator="in" />
              </filter>
            </defs>
          </svg>
          <div class="wl-cig-meter-wrap" id="onb3-cig-meter" onclick="triggerOnb1CigFill()" title="Toque para testar">
            <div class="wl-cig-illustration-box">
              <img
                src="${cigImgSrc}"
                onerror="this.onerror=null;this.src='${cigImgFallback}';"
                alt="Cigarro"
                class="wl-cig-png-base"
              >
              <img
                src="${cigImgSrc}"
                onerror="this.onerror=null;this.src='${cigImgFallback}';"
                alt=""
                aria-hidden="true"
                class="wl-cig-png-fill"
                id="onb3-cig-fill"
              >
            </div>
          </div>
        </div>
        <div class="wl-onb-footer">
          <div class="onboarding-progress"><div class="progress-dot active" onclick="goToOnboardingSlide(0)"></div><div class="progress-dot" onclick="goToOnboardingSlide(1)"></div><div class="progress-dot" onclick="goToOnboardingSlide(2)"></div></div>
          <button type="button" class="wl-dark-pill-btn" id="btn-onboarding-1-next" onclick="triggerOnb1CigFill()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>ADICIONAR</span>
          </button>
        </div>
      `;

      let onb3Advancing = false;
      window.resetOnb1Demo = function() {
        onb3Advancing = false;
        const cigFillEl = document.getElementById('onb3-cig-fill');
        const nextBtn = document.getElementById('btn-onboarding-1-next');
        if (cigFillEl) {
          cigFillEl.style.transition = 'none';
          cigFillEl.classList.remove('is-filled');
          void cigFillEl.offsetWidth;
          cigFillEl.style.transition = '';
        }
        if (nextBtn) {
          nextBtn.classList.remove('is-pressed');
        }
      };

      window.triggerOnb1CigFill = function() {
        if (onb3Advancing) return;
        onb3Advancing = true;
        const cigFillEl = document.getElementById('onb3-cig-fill');
        const cigMeterEl = document.getElementById('onb3-cig-meter');
        const nextBtn = document.getElementById('btn-onboarding-1-next');

        if (nextBtn) {
          nextBtn.classList.add('is-pressed');
        }
        if (cigFillEl) {
          cigFillEl.classList.add('is-filled');
        }
        if (cigMeterEl) {
          cigMeterEl.classList.remove('is-bumping');
          void cigMeterEl.offsetWidth;
          cigMeterEl.classList.add('is-bumping');
        }

        setTimeout(() => {
          onb3Advancing = false;
          if (nextBtn) nextBtn.classList.remove('is-pressed');
          if (typeof window.goToOnboardingSlide === 'function') {
            window.goToOnboardingSlide(1);
          } else {
            showScreen(4);
          }
        }, 120);

        // Watchdog de segurança para garantir que a transição nunca fique travada
        setTimeout(() => {
          onb3Advancing = false;
        }, 400);
      };

      const addNextBtn = document.getElementById('btn-onboarding-1-next');
      const cigMeterEl = document.getElementById('onb3-cig-meter');
      if (addNextBtn) {
        addNextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.triggerOnb1CigFill();
        });
      }
      if (cigMeterEl) {
        cigMeterEl.addEventListener('click', () => {
          window.triggerOnb1CigFill();
        });
      }
    }

    // 3. Screen 4: Onboarding 2 - Lembretes e Apoio Inteligente (Pages 4-5)
    window.handleOnboardingRemindersChoice = function(enabled) {
      userState.remindersEnabled = Boolean(enabled);
      userState.notificationsEnabled = Boolean(enabled);
      savePersistedState();
      if (typeof window.goToOnboardingSlide === 'function') {
        window.goToOnboardingSlide(2);
      } else {
        goToScreen(5);
      }
    };

    const s4 = document.querySelector('.screen[data-screen="4"]');
    if (s4) {
      s4.removeAttribute('style');
      s4.className = 'screen wl-onb-screen wl-onb-screen-notif onb-slide';
      s4.innerHTML = `
        <div class="wl-onb-header">
          <div style="display:flex; align-items:center; gap:6px;">
            <button type="button" class="wl-onb-back-arrow" onclick="goToOnboardingSlide(0)" aria-label="Voltar" style="background:none; border:none; font-size:22px; color:var(--text-muted); cursor:pointer; padding:0 6px 2px; line-height:1;">‹</button>
            <span class="wl-step-pill">2 de 3</span>
          </div>
          <button class="wl-skip-btn" onclick="goToScreen(7)">IGNORAR</button>
        </div>
        <div class="wl-onb-titles wl-onb-notif-titles">
          <h1>Identifique gatilhos</h1>
          <p class="caption">Pequenos incentivos para seguir no seu ritmo.</p>
        </div>
        <div class="wl-notif-card">
          <div class="wl-notif-bubble">
            <img src="assets/avatar_verde.png" alt="Habbi" class="wl-notif-avatar">
            <div style="flex:1;text-align:left;">
              <strong style="display:block;font-size:14px;color:#111827;margin-bottom:2px;">Que tal distrair a mente?</strong>
              <span style="font-size:12.5px;color:#4b5563;line-height:1.3;display:block;">Lembretes e ferramentas para te acompanhar.</span>
            </div>
            <span class="wl-notif-time">18:45</span>
          </div>
          <div class="wl-notif-mascot-wrap">
            <img src="assets/ilustracoes/gato escondido arbusto.png" alt="Gato escondido no arbusto" class="wl-notif-mascot">
          </div>
        </div>
        <div class="wl-onb-footer wl-onb-notif-footer">
          <div class="onboarding-progress"><div class="progress-dot" onclick="goToOnboardingSlide(0)"></div><div class="progress-dot active" onclick="goToOnboardingSlide(1)"></div><div class="progress-dot" onclick="goToOnboardingSlide(2)"></div></div>
          <div class="wl-onb-notif-actions">
            <button type="button" class="wl-dark-pill-btn wl-notif-cta-btn" id="btn-onboarding-2-next" onclick="handleOnboardingRemindersChoice(true)">Ativar lembretes</button>
            <button type="button" class="wl-subtle-link-btn" id="btn-onboarding-2-skip" onclick="handleOnboardingRemindersChoice(false)">Agora não</button>
          </div>
        </div>
      `;
    }

    // 4. Screen 5: Onboarding 3 - Comparativo Lado a Lado Antes vs Depois (Page 14)
    const s5 = document.querySelector('.screen[data-screen="5"]');
    if (s5) {
      s5.removeAttribute('style');
      s5.className = 'screen wl-onb-screen onb-slide';
      s5.innerHTML = `
        <div class="wl-onb-header">
          <div style="display:flex; align-items:center; gap:6px;">
            <button type="button" class="wl-onb-back-arrow" onclick="goToOnboardingSlide(1)" aria-label="Voltar" style="background:none; border:none; font-size:22px; color:var(--text-muted); cursor:pointer; padding:0 6px 2px; line-height:1;">‹</button>
            <span class="wl-step-pill">3 de 3</span>
          </div>
          <button class="wl-skip-btn" onclick="goToScreen(7)">IGNORAR</button>
        </div>
        <div class="wl-onb-titles" style="margin-bottom:6px;">
          <h1>Uma nova forma de<br>cuidar de você.</h1>
        </div>
        <div class="wl-compare-grid">
          <div class="wl-compare-card bad">
            <h3>No piloto<br>autom\u00e1tico</h3>
            <ul>
              <li><span class="wl-mark bad">\u2715</span> H\u00e1bitos sem perceber</li>
              <li><span class="wl-mark bad">\u2715</span> Momentos de ansiedade</li>
              <li><span class="wl-mark bad">\u2715</span> Falta de distra\u00e7\u00f5es</li>
              <li><span class="wl-mark bad">\u2715</span> Pouco controle da rotina</li>
              <li><span class="wl-mark bad">\u2715</span> Gastos acumulados</li>
              <li><span class="wl-mark bad">\u2715</span> Progresso despercebido</li>
            </ul>
            <img src="assets/ilustracoes/gato dormindo.png" alt="Gato dormindo" class="wl-compare-cat cat-sleeping">
          </div>
          <div class="wl-compare-arrow">\u2192</div>
          <div class="wl-compare-card good">
            <h3>Com o<br>Habbi</h3>
            <ul>
              <li><span class="wl-mark good">\u2713</span> Registro r\u00e1pido e f\u00e1cil</li>
              <li><span class="wl-mark good">\u2713</span> Apoio nos momentos dif\u00edceis</li>
              <li><span class="wl-mark good">\u2713</span> Minijogos para distrair</li>
              <li><span class="wl-mark good">\u2713</span> Calend\u00e1rio de h\u00e1bitos</li>
              <li><span class="wl-mark good">\u2713</span> Controle de gastos</li>
              <li><span class="wl-mark good">\u2713</span> Progresso visual di\u00e1rio</li>
            </ul>
            <img src="assets/ilustracoes/gato brincando com bola.png" alt="Gato brincando com bola" class="wl-compare-cat cat-ball">
          </div>
        </div>
        <div class="wl-onb-footer">
          <div class="onboarding-progress" style="margin-bottom:12px;"><div class="progress-dot" onclick="goToOnboardingSlide(0)"></div><div class="progress-dot" onclick="goToOnboardingSlide(1)"></div><div class="progress-dot active" onclick="goToOnboardingSlide(2)"></div></div>
          <button class="wl-dark-pill-btn" id="btn-onboarding-3-next" onclick="goToScreen(7)" style="width:100%;">Vamos começar!</button>
        </div>
      `;
    }

    // 5. Screen 6 ("Escolha sua jornada") foi removida do fluxo
    const s6 = document.querySelector('.screen[data-screen="6"]');
    if (s6) {
      s6.removeAttribute('style');
      s6.className = 'screen';
      s6.innerHTML = '';
    }

    // 6. Screen 7: Definição da Meta Inicial (Hierarquia elevada, textos maiores, folhas grandes variadas que somem ao toque da patinha em cima/meio/baixo e botão Pronto! centralizado embaixo)
    const s7 = document.querySelector('.screen[data-screen="7"]');
    if (s7) {
      s7.className = 'screen wl-calc-screen';
      const leavesMarkup = Array.from({ length: 6 }, (_, i) => (
        `<img src="assets/ilustracoes/png folha.png" alt="" class="wl-calc-leaf lf-${i + 1} wl-keep-bg">`
      )).join('');

      const catchPairsMarkup = [1, 2, 3, 4].map((idx) => `
        <img src="assets/ilustracoes/png folha.png" alt="" class="wl-calc-leaf wl-calc-catch-leaf lf-catch-${idx} wl-keep-bg">
        <div class="wl-calc-paw-actor paw-spot-${idx}">
          <img src="assets/ilustracoes/pata pra baixo.png" alt="" class="wl-calc-paw-img wl-keep-bg">
        </div>
      `).join('');

      s7.innerHTML = `
        <!-- Camada de fundo tela cheia: folhas grandes em tamanhos variados + patinhas em cima, no meio e embaixo que fazem a folha sumir ao tocar -->
        <div class="wl-calc-ambient-layer" aria-hidden="true">
          ${leavesMarkup}
          ${catchPairsMarkup}
        </div>

        <header class="wl-calc-top-bar">
          <button type="button" class="wl-calc-back" onclick="goToScreen(5)" aria-label="Voltar">\u2039</button>
        </header>

        <div class="wl-calc-main-column">
          <div class="wl-calc-body">
            <h1 class="wl-calc-top-title wl-calc-main-title" id="wl-calc-header-title">Quantos cigarros voc\u00ea fuma por dia?</h1>

            <!-- Consumo habitual de referência -->
            <div class="wl-calc-hero">
              <div class="wl-calc-big-number">
                <span id="cigarettes-per-day-val">12</span>
              </div>
              <div class="wl-calc-unit-label" id="wl-calc-unit-lbl"><span id="cigarettes-per-day-unit-label">cigarros por dia</span></div>
              <span class="wl-calc-sub" id="wl-calc-sub-headline" style="display:none;">Seu consumo habitual de refer\u00eancia</span>
            </div>

            <!-- Card de Meta Inicial Sugerida (independente e ajustável) -->
            <div class="habbi-suggested-goal-card" id="habbi-suggested-goal-card">
              <div class="habbi-suggested-goal-header">
                <span class="habbi-suggested-goal-badge" id="habbi-suggested-badge-text">Primeiro passo sugerido</span>
                <strong id="habbi-suggested-goal-title">Meta para hoje</strong>
              </div>
              <p class="habbi-suggested-goal-desc" id="habbi-suggested-goal-desc">
                Que tal começar com 1 cigarro a menos do seu consumo habitual?
              </p>
              <div class="habbi-suggested-stepper">
                <button type="button" class="habbi-step-btn" id="btn-suggested-meta-minus" onclick="adjustInitialSuggestedMeta(-1)" aria-label="Diminuir meta sugerida em 1">−</button>
                <div class="habbi-suggested-display">
                  <span class="habbi-suggested-num" id="habbi-suggested-meta-val">11</span>
                  <span class="habbi-suggested-unit" id="habbi-suggested-meta-unit">cigarros hoje</span>
                </div>
                <button type="button" class="habbi-step-btn" id="btn-suggested-meta-plus" onclick="adjustInitialSuggestedMeta(1)" aria-label="Aumentar meta sugerida em 1">+</button>
              </div>
              <span class="habbi-suggested-hint" id="habbi-suggested-hint">Você pode confirmar ou ajustar este valor antes de iniciar.</span>
            </div>

            <!-- Botões de seleção que abrem a aba inferior (bottom sheet) com opções -->
            <div class="wl-calc-pills">
              <button type="button" class="wl-calc-pill-card wl-calc-option-btn" id="btn-open-calc-cigs" onclick="openCalcOptionSheet('cigs')">
                <div class="wl-calc-pill-row">
                  <span id="wl-cigs-pill-title">Consumo habitual</span>
                  <span class="wl-calc-btn-right">
                    <strong id="wl-cigs-pill-label">12 cigarros</strong>
                    <svg class="wl-calc-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </div>
              </button>

              <button type="button" class="wl-calc-pill-card wl-calc-option-btn" id="btn-open-calc-years" onclick="openCalcOptionSheet('years')">
                <div class="wl-calc-pill-row">
                  <span>Tempo de consumo</span>
                  <span class="wl-calc-btn-right">
                    <strong id="wl-years-pill-label">&lt; 1 ano</strong>
                    <svg class="wl-calc-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </div>
              </button>

              <button type="button" class="wl-calc-pill-card wl-calc-option-btn" id="btn-open-calc-price" onclick="openCalcOptionSheet('price')">
                <div class="wl-calc-pill-row">
                  <span>Preço do maço</span>
                  <span class="wl-calc-btn-right">
                    <strong id="wl-price-pill-label">R$ 12,00</strong>
                    <svg class="wl-calc-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </div>
              </button>
            </div>
          </div>
          </div>

          <!-- Botão Pronto! na parte de baixo centralizado igual às outras telas -->
          <div class="wl-calc-footer">
            <button type="button" class="wl-dark-pill-btn wl-calc-submit-btn" id="btn-config-1-submit">Pronto!</button>
          </div>
        </div>

        <!-- Aba inferior (Bottom Sheet) de opções dos dados da meta diária -->
        <div class="wl-calc-sheet-overlay" id="wl-calc-sheet-overlay" onclick="if(event.target === this) closeCalcOptionSheet()">
          <div class="wl-calc-sheet" role="dialog" aria-modal="true" aria-labelledby="wl-calc-sheet-title">
            <div class="wl-calc-sheet-handle" aria-hidden="true"></div>
            <div class="wl-calc-sheet-header">
              <h3 class="wl-calc-sheet-title" id="wl-calc-sheet-title">Selecionar op\u00e7\u00e3o</h3>
              <button type="button" class="wl-calc-sheet-close" onclick="closeCalcOptionSheet()" aria-label="Fechar">\u00d7</button>
            </div>

            <!-- Painel 1: Quantos cigarros por dia? -->
            <div class="wl-calc-sheet-panel" id="wl-calc-panel-cigs">
              <div class="wl-calc-sheet-stepper">
                <button type="button" class="wl-calc-step-btn" onclick="adjustCalcCigsValue(-1)" aria-label="Diminuir 1 cigarro">\u2212</button>
                <div class="wl-calc-step-display">
                  <strong id="wl-sheet-cigs-display">11</strong>
                  <span>cigarros/dia</span>
                </div>
                <button type="button" class="wl-calc-step-btn" onclick="adjustCalcCigsValue(1)" aria-label="Aumentar 1 cigarro">+</button>
              </div>

              <input type="range" min="1" max="40" value="11" class="custom-range wl-white-range" id="cigarettes-slider" aria-label="Meta diária de cigarros">

              <button type="button" class="wl-calc-sheet-confirm" onclick="closeCalcOptionSheet()">Confirmar</button>
            </div>

            <!-- Painel 2: Há quanto tempo você fuma? -->
            <div class="wl-calc-sheet-panel" id="wl-calc-panel-years" style="display:none;">
              <div class="chips-container wl-calc-years-list" id="years-smoking-chips">
                <button type="button" class="chip wl-calc-list-opt selected" data-years="Menos de 1" data-label="&lt; 1 ano" onclick="selectCalcYearsOption(this)">
                  <span>Menos de 1 ano</span>
                  <span class="wl-calc-opt-check" aria-hidden="true"></span>
                </button>
                <button type="button" class="chip wl-calc-list-opt" data-years="1 - 5 anos" data-label="1-5 anos" onclick="selectCalcYearsOption(this)">
                  <span>De 1 a 5 anos</span>
                  <span class="wl-calc-opt-check" aria-hidden="true"></span>
                </button>
                <button type="button" class="chip wl-calc-list-opt" data-years="5 - 10 anos" data-label="5-10 anos" onclick="selectCalcYearsOption(this)">
                  <span>De 5 a 10 anos</span>
                  <span class="wl-calc-opt-check" aria-hidden="true"></span>
                </button>
                <button type="button" class="chip wl-calc-list-opt" data-years="10+ anos" data-label="10+ anos" onclick="selectCalcYearsOption(this)">
                  <span>Mais de 10 anos</span>
                  <span class="wl-calc-opt-check" aria-hidden="true"></span>
                </button>
              </div>

              <button type="button" class="wl-calc-sheet-confirm" onclick="closeCalcOptionSheet()">Confirmar</button>
            </div>

            <!-- Painel 3: Quanto custa um maço? -->
            <div class="wl-calc-sheet-panel" id="wl-calc-panel-price" style="display:none;">
              <div class="wl-calc-sheet-stepper">
                <button type="button" class="wl-calc-step-btn" onclick="adjustCalcPackPrice(-0.5)" aria-label="Diminuir valor">\u2212</button>
                <div class="wl-calc-price-field-wrap">
                  <span class="wl-calc-currency-prefix">R$</span>
                  <input type="number" id="cigarettes-pack-price" class="wl-inline-price-input" min="1" max="100" step="0.50" value="10.00" aria-label="Preço do maço de cigarros">
                </div>
                <button type="button" class="wl-calc-step-btn" onclick="adjustCalcPackPrice(0.5)" aria-label="Aumentar valor">+</button>
              </div>

              <button type="button" class="wl-calc-sheet-confirm" onclick="closeCalcOptionSheet()">Confirmar</button>
            </div>
          </div>
        </div>
      `;

    }

    // 7. Screen 10: Home minimalista e focada (Topo com Calendário + Menu, Progresso Diário, Cigarro Interativo Central e Ação Principal + SOS)
    const s10 = document.querySelector('.screen[data-screen="10"]');
    if (s10) {
      s10.className = 'screen carousel-slide';
      const cigImgSrc = 'assets/ilustracoes/cigarro_Prancheta 1.png';
      const cigImgFallback = 'assets/ilustracoes/cigarro_Prancheta 1.png';
      s10.innerHTML = `
        <div class="wl-home-hero-metric">
          <div class="wl-home-big-stat">
            <span id="home-meta-registered">0</span><small> / <span id="home-meta-cigs">11</span> <span id="home-today-word">hoje</span></small>
          </div>
          <div class="wl-home-sub-stat">
            <strong id="home-display-days">0</strong> <span id="home-display-days-label">dias sem fumar</span> \u2022 <span id="home-meta-pct">0%</span> <span id="home-meta-of-today-label">da meta de hoje</span>
          </div>
          <button type="button" class="wl-home-nosmoke-badge" id="home-nosmoke-badge" onclick="handleHomeNoSmokeToday()" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span id="home-nosmoke-badge-text">N\u00e3o fumei hoje</span>
          </button>
          <div class="wl-home-overmeta-banner" id="home-overmeta-banner" style="display:none;" role="status"></div>
        </div>

        <!-- Card discreto de Evolução Diária da Meta (perguntado 1x por dia, sem bloquear) -->
        <div class="habbi-goal-evolution-card" id="habbi-goal-evolution-card" style="display:none;" role="region" aria-label="Evolução da meta diária">
          <div class="habbi-goal-card-top">
            <div class="habbi-goal-card-badge-wrap">
              <span class="habbi-goal-card-badge" id="habbi-goal-badge-txt">Meta de hoje</span>
            </div>
            <button type="button" class="habbi-goal-card-close" id="btn-goal-close" onclick="handleDailyGoalDecision('later')" aria-label="Fechar">\u2715</button>
          </div>
          <h3 class="habbi-goal-card-title" id="habbi-goal-card-title">Novo dia, novo passo</h3>
          <p class="habbi-goal-card-desc" id="habbi-goal-card-desc">Como voc\u00ea prefere definir sua meta hoje?</p>
          <div class="habbi-goal-card-actions" id="habbi-goal-card-actions">
            <button type="button" class="btn btn-secondary habbi-goal-act-btn" id="btn-goal-keep" onclick="handleDailyGoalDecision('keep')">Continuar com 14</button>
            <button type="button" class="btn btn-primary habbi-goal-act-btn" id="btn-goal-reduce" onclick="handleDailyGoalDecision('reduce')">Tentar 13</button>
          </div>
          <button type="button" class="habbi-goal-later-link" id="btn-goal-later" onclick="handleDailyGoalDecision('later')">Decidir depois</button>
        </div>

        <div class="wl-cig-demo-stage wl-home-cig-stage" id="home-cig-stage">
          <svg width="0" height="0" style="position:absolute;pointer-events:none;" aria-hidden="true">
            <defs>
              <filter id="wl-home-cig-green-tint" color-interpolation-filters="sRGB">
                <feFlood flood-color="#78B848" result="flood" />
                <feComposite in="flood" in2="SourceAlpha" operator="in" />
              </filter>
              <filter id="wl-home-cig-yellow-tint" color-interpolation-filters="sRGB">
                <feFlood flood-color="#FFD93D" result="flood" />
                <feComposite in="flood" in2="SourceAlpha" operator="in" />
              </filter>
              <filter id="wl-home-cig-orange-tint" color-interpolation-filters="sRGB">
                <feFlood flood-color="#FF922B" result="flood" />
                <feComposite in="flood" in2="SourceAlpha" operator="in" />
              </filter>
              <filter id="wl-home-cig-red-tint" color-interpolation-filters="sRGB">
                <feFlood flood-color="#FF4736" result="flood" />
                <feComposite in="flood" in2="SourceAlpha" operator="in" />
              </filter>
              <filter id="wl-home-cig-dark-tint" color-interpolation-filters="sRGB">
                <feFlood flood-color="#4A0E17" result="flood" />
                <feComposite in="flood" in2="SourceAlpha" operator="in" />
              </filter>
            </defs>
          </svg>
          <div class="wl-cig-meter-wrap" id="home-cig-meter">
            <div class="wl-cig-illustration-box">
              <img
                src="${cigImgSrc}"
                onerror="this.onerror=null;this.src='${cigImgFallback}';"
                alt="Progresso diário do cigarro"
                class="wl-cig-png-base"
              >
              <img
                src="${cigImgSrc}"
                onerror="this.onerror=null;this.src='${cigImgFallback}';"
                alt=""
                aria-hidden="true"
                class="wl-cig-png-fill wl-home-cig-png-fill"
                id="home-cig-fill"
              >
              <img
                src="${cigImgSrc}"
                onerror="this.onerror=null;this.src='${cigImgFallback}';"
                alt=""
                aria-hidden="true"
                class="wl-cig-png-fill wl-home-cig-png-pink"
                id="home-cig-pink-fill"
              >
            </div>
          </div>
        </div>

        <div class="wl-home-focused-actions">
          <button type="button" class="wl-home-sos-pill" id="btn-home-sos" onclick="goToScreen(12)" aria-label="SOS Ajuda rápida para momentos de vontade" title="SOS Ajuda rápida">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>SOS</span>
          </button>

          <div class="wl-home-primary-row">
            <button type="button" class="wl-home-remove-btn" id="btn-home-remove-cig" onclick="handleHomeRemoveCigarette()" aria-label="Desfazer último cigarro registrado" title="Desfazer último cigarro registrado" disabled aria-disabled="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" style="display:block;"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>

            <button type="button" class="wl-dark-pill-btn wl-home-add-btn" id="btn-home-add-cig" onclick="handleHomeAddCigarette()" aria-label="Registrar cigarro" title="Registrar cigarro">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="display:block;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Registrar cigarro</span>
            </button>
          </div>
        </div>

        <!-- Menu Superior Direito (Hub com as demais áreas do app) -->
        <div class="wl-hub-overlay" id="wl-hub-menu-modal" onclick="if(event.target===this)toggleHabbiHubMenu(false)">
          <div class="wl-hub-sheet">
            <div class="wl-hub-header">
              <h3>Menu do Habbi</h3>
              <button type="button" class="wl-hub-close" onclick="toggleHabbiHubMenu(false)" aria-label="Fechar">\u2715</button>
            </div>
            <div class="wl-hub-grid">
              <button type="button" class="wl-hub-item" onclick="openHubScreen(21)">
                <span class="wl-hub-icon green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <div class="wl-hub-txt">
                  <strong>Meu perfil</strong>
                  <span>Conta e informa\u00e7\u00f5es pessoais</span>
                </div>
              </button>

              <button type="button" class="wl-hub-item" onclick="openHubScreen(17)">
                <span class="wl-hub-icon yellow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
                <div class="wl-hub-txt">
                  <strong>Meu progresso</strong>
                  <span>Hist\u00f3rico, desafios, insights e conquistas</span>
                </div>
              </button>

              <button type="button" class="wl-hub-item" onclick="openHubScreen(14)">
                <span class="wl-hub-icon blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </span>
                <div class="wl-hub-txt">
                  <strong>Ferramentas</strong>
                  <span>Respira\u00e7\u00e3o e exerc\u00edcios de apoio</span>
                </div>
              </button>

              <button type="button" class="wl-hub-item" onclick="openHubScreen(22)">
                <span class="wl-hub-icon orange">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </span>
                <div class="wl-hub-txt">
                  <strong>Configura\u00e7\u00f5es</strong>
                  <span>Lembretes e prefer\u00eancias</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    window.toggleHabbiHubMenu = function(show) {
      const hub = document.getElementById('wl-hub-menu-modal');
      if (!hub) return;
      if (show) {
        hub.classList.add('is-open');
      } else {
        hub.classList.remove('is-open');
      }
    };

    window.openHubScreen = function(screenNum) {
      window.toggleHabbiHubMenu(false);
      if (screenNum === 11) {
        userState.quickRegOpenedDirectlyFromHub = true;
        userState.activeRegisterDateKey = getDateKey(new Date());
        userState.returnScreenAfterRegister = 10;
        if (typeof window.openQuickRegisterModal === 'function') {
          window.openQuickRegisterModal(userState.activeRegisterDateKey);
        }
        return;
      }
      userState.openedFromMenu = true;
      showScreen(screenNum);
    };

    window.openProgressSubScreen = function(targetScreen) {
      userState.progressReturnScreen = 17;
      showScreen(targetScreen);
    };

    // Abertura de ferramentas a partir da Tela 14 preservando retorno à Tela 14
    window.openToolFromFerramentas = function(tool) {
      if (tool === 'respiracao') {
        userState.interventionReturnScreen = 14;
        userState.selectedIntervention = 'Respiração 4-6';
        showScreen(13);
      } else if (tool === 'minijogos') {
        if (typeof resetMinigamesUI === 'function') resetMinigamesUI();
        window._screen15EntryTime = Date.now();
        userState.minijogosMode = 'tools';
        userState.minijogosReturnScreen = 14;
        showScreen(15);
      } else if (tool === 'sos') {
        userState.sosReturnScreen = 14;
        showScreen(12);
      } else if (tool === 'gatilhos') {
        userState.returnScreenAfterRegister = 14;
        userState.moodReturnScreen = 14;
        if (typeof window.openQuickRegisterModal === 'function') {
          window.openQuickRegisterModal(null, 'mood');
        } else {
          showScreen(25);
        }
      }
    };

    // 8. Screen 14: Os cards de Ferramentas estão padronizados e estruturados no index.html (com openToolFromFerramentas)

    // 9. Screen 16: Calendário Dinâmico e Integrado (Habbi Flat, cores sólidas, sem patinha e sem textos repetidos)
    const s16 = document.querySelector('.screen[data-screen="16"]');
    if (s16) {
      const nowInit = new Date();
      const initTitle = `${getMonthNamePt(nowInit.getMonth())} de ${nowInit.getFullYear()}`;
      s16.innerHTML = `
        <div class="wl-cal-screen-wrap">
          <header class="wl-cal-header">
            <div class="wl-cal-nav-group">
              <button type="button" class="wl-cal-nav-arrow" onclick="changeCalendarMonth(-1)" aria-label="Mês anterior" title="Mês anterior">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <div class="wl-cal-title-box">
                <h2 class="wl-cal-month-title" id="wl-cal-month-title">${initTitle}</h2>
                <button type="button" class="wl-cal-today-chip" id="wl-cal-today-btn" onclick="resetCalendarToToday()" style="display:none;">Hoje</button>
              </div>
              <button type="button" class="wl-cal-nav-arrow" onclick="changeCalendarMonth(1)" aria-label="Próximo mês" title="Próximo mês">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
            <button type="button" class="wl-close-circle" onclick="handleBackFromScreen(16)" aria-label="Fechar calendário">✕</button>
          </header>

          <div class="wl-cal-main-card">
            <div class="wl-cal-weekdays">
              <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
            </div>
            <div class="calendar-month-grid wl-clean-cal-grid" id="calendar-month-grid"></div>
            <div class="wl-cal-legend">
              <span class="wl-cal-legend-item"><i class="dot green"></i>Dentro da meta</span>
              <span class="wl-cal-legend-item"><i class="dot pink"></i>Acima da meta</span>
              <span class="wl-cal-legend-item"><i class="dot in-progress"></i>Em andamento</span>
              <span class="wl-cal-legend-item"><i class="dot neutral"></i>Sem registro</span>
            </div>
          </div>

          <div class="wl-cal-month-metrics">
            <div class="wl-cal-metric-box">
              <strong id="wl-cal-stat-clean">0</strong>
              <span>Sem fumar</span>
            </div>
            <div class="wl-cal-metric-box">
              <strong id="wl-cal-stat-goal">0</strong>
              <span>Na meta</span>
            </div>
            <div class="wl-cal-metric-box">
              <strong id="wl-cal-stat-urges">0</strong>
              <span>Vontades</span>
            </div>
          </div>

          <div class="wl-cal-summary-card" id="wl-cal-summary-card">
            <div class="wl-cal-summary-top">
              <span class="wl-cal-selected-date" id="wl-cal-selected-date-label">Hoje</span>
              <span class="wl-cal-goal-pill neutral" id="wl-cal-daily-goal-pill">Sem registros</span>
            </div>
            <div class="wl-cal-goal-bar-track">
              <div class="wl-cal-goal-bar-fill neutral" id="wl-cal-goal-bar-fill" style="width:0%"></div>
              <div class="wl-cal-goal-bar-over" id="wl-cal-goal-bar-over" style="width:0%"></div>
            </div>
            <div class="wl-cal-day-events-wrap" id="wl-cal-day-events-wrap"></div>
          </div>

          <div class="wl-cal-pill-actions">
            <button type="button" class="wl-cal-btn primary wl-cal-btn-full" onclick="openRegisterFromCalendar()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Adicionar registro</span>
            </button>
          </div>
        </div>
      `;
    }

    // 9.5. Screen 17: Conecta o contador de vontades superadas aos dados reais
    const s17 = document.querySelector('.screen[data-screen="17"]');
    if (s17) {
      const statNums = s17.querySelectorAll('.stats-number');
      if (statNums.length >= 4 && !statNums[3].id) {
        statNums[3].id = 'stats-urges-overcome';
        statNums[3].innerText = userState.totalUrgesOvercome || 0;
      }
    }

    // 10 & 11: Telas de Insights (18) e Conquistas (20) desativadas temporariamente

    // Remove emojis from Screen 25 (Mood influences)
    const moodChips = document.querySelectorAll('#mood-influence-chips .chip');
    moodChips.forEach(chip => {
      if (chip.dataset.val) {
        chip.innerText = chip.dataset.val;
      }
    });

    // 11.5. Sincronização do Perfil
    syncUserProfileUI();

    // 11.8. Screen 29: Minha conquista (Habbi Flat, sacola de compras preenchível, sem jargões bancários)
    const s29 = document.querySelector('.screen[data-screen="29"]');
    if (s29) {
      s29.removeAttribute('style');
      s29.className = 'screen wl-savings-screen carousel-slide';
      s29.innerHTML = `
        <!-- Modo Carrossel: Topbar da Home (Calendário + Pílula Economia + Menu) e 3 Pager Dots -->
        <div id="wl-conquista-carousel-header">
          <div class="wl-conquista-carousel-intro">
            <h2 class="wl-sav-title">Minha conquista</h2>
          </div>
        </div>

        <!-- Modo Ferramentas: Cabeçalho com botão Voltar e título tradicional -->
        <div id="wl-conquista-tools-header" class="detail-header mb-16 wl-sav-header">
          <div class="wl-sav-header-left">
            <button type="button" class="btn-back wl-sav-back" id="btn-conquista-back" onclick="handleBackFromScreen(29)" aria-label="Voltar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <div>
              <h2 class="wl-sav-title">Minha conquista</h2>
              <p class="caption" style="margin:2px 0 0; font-size:13px; color:var(--text-secondary);">Economia e metas</p>
            </div>
          </div>
        </div>

        <div class="wl-sav-wrap wl-conquista-wrap">

          <!-- Card do Objetivo Atual -->
          <button type="button" class="wl-conquista-goal-card" id="wl-conquista-goal-card" onclick="openChangeGoalModal()" title="Toque para alterar seu objetivo" aria-label="Alterar objetivo de conquista">
            <div class="wl-conquista-goal-left">
              <span class="wl-conquista-goal-label">Objetivo</span>
              <strong class="wl-conquista-goal-title" id="wl-conquista-goal-title">Minha conquista</strong>
            </div>
            <div class="wl-conquista-goal-right">
              <span class="wl-conquista-goal-target" id="wl-conquista-goal-target">R$ 250,00</span>
              <span class="wl-conquista-change-chip">Trocar</span>
            </div>
          </button>

          <!-- Palco da Sacola de Compras Preenchível (Habbi Flat Style com Ilustração Original) -->
          <button type="button" class="wl-conquista-bag-stage" id="wl-conquista-bag-stage" onclick="openChangeGoalModal()" title="Toque para alterar seu objetivo" aria-label="Sacola de economia. Toque para alterar seu objetivo">
            <svg width="0" height="0" style="position:absolute;pointer-events:none;" aria-hidden="true" focusable="false">
              <defs>
                <filter id="wl-bag-yellow-tint" color-interpolation-filters="sRGB">
                  <feFlood flood-color="#43A027" result="flood" />
                  <feComposite in="flood" in2="SourceAlpha" operator="in" />
                </filter>
                <filter id="wl-bag-orange-tint" color-interpolation-filters="sRGB">
                  <feFlood flood-color="#43A027" result="flood" />
                  <feComposite in="flood" in2="SourceAlpha" operator="in" />
                </filter>
                <filter id="wl-bag-green-tint" color-interpolation-filters="sRGB">
                  <feFlood flood-color="#43A027" result="flood" />
                  <feComposite in="flood" in2="SourceAlpha" operator="in" />
                </filter>
                <filter id="wl-bag-celebrate-tint" color-interpolation-filters="sRGB">
                  <feFlood flood-color="#43A027" result="flood" />
                  <feComposite in="flood" in2="SourceAlpha" operator="in" />
                </filter>
              </defs>
            </svg>

            <div class="wl-bag-meter-wrap" id="wl-bag-meter-wrap">
              <div class="wl-bag-illustration-box">
                <img
                  src="assets/ilustracoes/sacola_Prancheta 1.png"
                  onerror="this.onerror=null;this.src='assets/ilustracoes/sacola_Prancheta 1.png';"
                  alt="Sacola de economia"
                  class="wl-bag-png-base"
                >
                <img
                  src="assets/ilustracoes/sacola_Prancheta 1.png"
                  onerror="this.onerror=null;this.src='assets/ilustracoes/sacola_Prancheta 1.png';"
                  alt=""
                  aria-hidden="true"
                  class="wl-bag-png-fill is-green"
                  id="wl-bag-fill-img"
                >
              </div>
            </div>
          </button>

          <!-- Métricas Centrais da Conquista: Economia em destaque + ícone info -> Progresso -->
          <div class="wl-conquista-metrics">
            <div class="wl-conquista-hero-row">
              <span class="wl-conquista-hero-lbl" id="wl-conquista-hero-lbl">Economia estimada</span>
              <button type="button" class="wl-conquista-info-btn" id="wl-conquista-info-btn" aria-expanded="false" aria-controls="wl-conquista-info-popover" aria-label="Sobre a economia estimada" title="Sobre a economia estimada" onclick="toggleConquistaInfoPopover(event)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </button>
            </div>
            <div class="wl-conquista-info-popover" id="wl-conquista-info-popover" role="note" hidden>
              Estimativa baseada nos seus registros.
            </div>
            <strong class="wl-conquista-main-val" id="wl-conquista-main-val">R$ 0,00</strong>
            <div class="wl-conquista-progress-row">
              <span class="wl-conquista-pct-pill" id="wl-conquista-pct-pill">0% do objetivo</span>
            </div>
            <span id="savings-total-value" style="display:none;">R$ 0,00</span>
          </div>

          <!-- Seção secundária e leve: Seus gastos (independente da economia estimada) -->
          <section class="wl-conquista-expenses-card" id="wl-conquista-expenses-card" aria-labelledby="wl-expenses-title">
            <div class="wl-expenses-head">
              <h3 class="wl-expenses-title" id="wl-expenses-title">Seus gastos</h3>
            </div>
            <div class="wl-expenses-grid">
              <div class="wl-expenses-item">
                <span class="wl-expenses-lbl" id="wl-expenses-today-lbl">Hoje</span>
                <strong class="wl-expenses-val" id="wl-expenses-today-val">R$ 0,00</strong>
              </div>
              <div class="wl-expenses-divider" aria-hidden="true"></div>
              <div class="wl-expenses-item">
                <span class="wl-expenses-lbl" id="wl-expenses-month-lbl">Este mês</span>
                <strong class="wl-expenses-val" id="wl-expenses-month-val">R$ 0,00</strong>
              </div>
            </div>
          </section>

          <!-- Ações secundárias -->
          <div class="wl-conquista-sub-actions">
            <button type="button" class="wl-conquista-action-btn" onclick="openSavingsSheet('config')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
              <span>Ajustar consumo</span>
            </button>
            <button type="button" class="wl-conquista-action-btn" onclick="openSavingsSheet('history')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Histórico</span>
            </button>
          </div>
        </div>

        <!-- Modal: Trocar Objetivo de Conquista -->
        <div class="wl-goal-modal-overlay" id="wl-goal-modal-overlay" onclick="if(event.target===this)closeChangeGoalModal()">
          <div class="wl-goal-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="wl-goal-modal-title">
            <div class="wl-calc-sheet-handle" aria-hidden="true"></div>
            <div class="wl-goal-modal-header">
              <h3 id="wl-goal-modal-title">Definir objetivo</h3>
              <button type="button" class="wl-close-circle" onclick="closeChangeGoalModal()" aria-label="Fechar">✕</button>
            </div>
            <p class="wl-goal-modal-sub">Defina para onde vai o fruto da sua vitória:</p>
            <div class="wl-goal-custom-box">
              <label for="wl-goal-custom-name">O que você quer conquistar?</label>
              <input type="text" id="wl-goal-custom-name" placeholder="Ex: Viagem, tênis novo, curso..." maxlength="40">
              <label for="wl-goal-custom-amount" style="margin-top:12px;">Quanto custa? (R$)</label>
              <input type="number" id="wl-goal-custom-amount" placeholder="Ex: 250,00" min="5" step="5">
              <button type="button" class="wl-dark-pill-btn" style="margin-top:16px; width:100%;" onclick="saveCustomGoal()">Salvar objetivo</button>
            </div>
          </div>
        </div>

        <!-- Aba Inferior (Bottom Sheet) para Configurar Parâmetros ou Ver Histórico -->
        <div class="wl-sav-sheet-overlay" id="wl-sav-sheet-overlay" onclick="if(event.target === this) closeSavingsSheet()">
          <div class="wl-sav-sheet" role="dialog" aria-modal="true" aria-labelledby="wl-sav-sheet-title">
            <div class="wl-calc-sheet-handle" aria-hidden="true"></div>
            <div class="wl-sav-sheet-header">
              <h3 class="wl-sav-sheet-title" id="wl-sav-sheet-title">Parâmetros de economia</h3>
              <button type="button" class="wl-close-circle" onclick="closeSavingsSheet()" aria-label="Fechar">✕</button>
            </div>

            <!-- Painel 1: Configurar Consumo Habitual, Maço e Frequência -->
            <div class="wl-sav-sheet-body" id="wl-sav-panel-config">
              <div class="wl-sav-cfg-row">
                <div class="wl-sav-cfg-info">
                  <strong>Consumo habitual</strong>
                  <span>Cigarros fumados por dia antes</span>
                </div>
                <div class="wl-sav-cfg-stepper">
                  <button type="button" class="wl-sav-step-btn" onclick="adjustSavingsHabitual(-1)">−</button>
                  <strong id="wl-sav-cfg-habitual-val">12</strong>
                  <button type="button" class="wl-sav-step-btn" onclick="adjustSavingsHabitual(1)">+</button>
                </div>
              </div>

              <div class="wl-sav-cfg-row">
                <div class="wl-sav-cfg-info">
                  <strong>Preço do maço (R$)</strong>
                  <span>Valor pago em cada maço</span>
                </div>
                <div class="wl-sav-cfg-stepper">
                  <button type="button" class="wl-sav-step-btn" onclick="adjustSavingsPackPrice(-0.5)" aria-label="Diminuir preço do maço">−</button>
                  <input type="number" id="wl-sav-cfg-price-input" class="wl-sav-price-input" min="1" max="150" step="0.50" value="12.00" oninput="onSavingsPriceInput(this.value)" aria-label="Preço do maço de cigarros">
                  <button type="button" class="wl-sav-step-btn" onclick="adjustSavingsPackPrice(0.5)" aria-label="Aumentar preço do maço">+</button>
                </div>
              </div>

              <div class="wl-sav-cfg-row">
                <div class="wl-sav-cfg-info">
                  <strong>Cigarros por maço</strong>
                  <span>Quantidade padrão por maço</span>
                </div>
                <div class="wl-sav-cfg-stepper">
                  <button type="button" class="wl-sav-step-btn" onclick="adjustSavingsCigsPerPack(-1)" aria-label="Diminuir cigarros por maço">−</button>
                  <strong id="wl-sav-cfg-perpack-val">20</strong>
                  <button type="button" class="wl-sav-step-btn" onclick="adjustSavingsCigsPerPack(1)" aria-label="Aumentar cigarros por maço">+</button>
                </div>
              </div>

              <div class="wl-sav-cfg-freq-block">
                <span class="wl-sav-cfg-sub">Frequência habitual de compra</span>
                <div class="wl-sav-freq-chips" id="wl-sav-freq-chips">
                  <button type="button" class="wl-sav-freq-chip" data-days="1" onclick="selectSavingsPackFreq(1)">1 por dia</button>
                  <button type="button" class="wl-sav-freq-chip active" data-days="2" onclick="selectSavingsPackFreq(2)">A cada 2 dias</button>
                  <button type="button" class="wl-sav-freq-chip" data-days="3" onclick="selectSavingsPackFreq(3)">A cada 3 dias</button>
                  <button type="button" class="wl-sav-freq-chip" data-days="7" onclick="selectSavingsPackFreq(7)">1 por semana</button>
                </div>
              </div>

              <button type="button" class="wl-dark-pill-btn wl-sav-sheet-done" onclick="closeSavingsSheet()">Pronto</button>
            </div>

            <!-- Painel 2: Histórico acessível -->
            <div class="wl-sav-sheet-body" id="wl-sav-panel-history" style="display:none;">
              <div class="wl-sav-history-list" id="savings-history-container"></div>
              <button type="button" class="wl-dark-pill-btn wl-sav-sheet-done" onclick="closeSavingsSheet()">Fechar</button>
            </div>
          </div>
        </div>
      `;
    }

    // Adiciona botão de voltar para a Home (Screen 10) nas telas que antes dependiam da barra inferior (14 e 21)
    [14, 21].forEach(scrId => {
      const scr = document.querySelector(`.screen[data-screen="${scrId}"]`);
      if (scr && !scr.querySelector('.btn-back')) {
        const headerRow = scr.firstElementChild;
        if (headerRow) {
          const backEl = document.createElement('div');
          backEl.className = 'btn-back';
          backEl.setAttribute('onclick', `handleBackFromScreen(${scrId})`);
          backEl.style.marginRight = '12px';
          backEl.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';
          headerRow.insertBefore(backEl, headerRow.firstChild);
        }
      }
    });

    // Ajusta a tela 19 (Histórico) para ocupar 100% da altura sem área branca vazia embaixo
    const s19 = document.querySelector('.screen[data-screen="19"]');
    if (s19) {
      const histContainer = s19.querySelector('#history-timeline-container');
      if (histContainer) {
        histContainer.style.maxHeight = 'none';
        histContainer.style.flex = '1';
        histContainer.style.overflowY = 'auto';
        histContainer.style.paddingBottom = '20px';
      }
      const s19Grow = s19.querySelector('.grow');
      if (s19Grow) s19Grow.remove();
    }

    // 12. Modal de Celebração com Patinha Livre Gigante Vindo de Baixo ("Bate Aqui!") e Mensagem Aparecendo Depois
    const deviceScreen = document.querySelector('.device-screen');
    if (deviceScreen && !document.getElementById('wl-celebration-modal')) {
      const celModal = document.createElement('div');
      celModal.id = 'wl-celebration-modal';
      celModal.className = 'wl-celebration-modal';
      celModal.setAttribute('role', 'dialog');
      celModal.setAttribute('aria-modal', 'true');
      celModal.setAttribute('aria-labelledby', 'wl-cel-title');
      celModal.style.display = 'none';
      celModal.innerHTML = `
        <div class="wl-cel-msg-card" id="wl-cel-msg-card">
          <span class="wl-cel-highfive-badge" id="wl-cel-highfive-badge">Parabéns!</span>
          <h2 class="wl-cel-title" id="wl-cel-title">Não fumei hoje!</h2>
          <span class="wl-cel-tag" id="wl-cel-tag">Mais um dia cuidando de você.</span>
          <button type="button" class="wl-dark-pill-btn wl-cel-btn" id="wl-cel-btn">Continuar</button>
        </div>

        <div class="wl-cel-free-paw-stage" id="wl-cel-paw-stage" title="Toque na patinha para bater aqui de novo!">
          <div class="wl-cel-highfive-ring" aria-hidden="true"></div>
          <div class="wl-cel-highfive-rays" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <span class="wl-cel-slap-pop" aria-hidden="true">Bate aqui!</span>
          <img id="wl-cel-img" src="assets/ilustracoes/pata pra cima.png" alt="Bate aqui!">
        </div>
      `;
      deviceScreen.appendChild(celModal);
      const pawStageEl = document.getElementById('wl-cel-paw-stage');
      if (pawStageEl) {
        pawStageEl.addEventListener('click', () => {
          pawStageEl.classList.remove('is-highfiving');
          void pawStageEl.offsetWidth;
          pawStageEl.classList.add('is-highfiving');
        });
      }
      window.closeCelebrationModal = function() {
        celModal.style.display = 'none';
        celModal.classList.remove('is-playing');
        closeAccessibleDialog(celModal);
        const targetScr = userState.returnScreenAfterRegister || currentScreen || 10;
        userState.returnScreenAfterRegister = 10;
        if (currentScreen !== targetScr) {
          showScreen(targetScr);
        }
      };
      const celBtn = document.getElementById('wl-cel-btn');
      if (celBtn) {
        celBtn.addEventListener('click', () => {
          window.closeCelebrationModal();
        });
      }

      const qregModal = document.createElement('div');
      qregModal.id = 'wl-quick-register-modal';
      qregModal.className = 'wl-qreg-overlay';
      qregModal.onclick = (e) => {
        if (e.target === qregModal) window.closeQuickRegisterModal();
      };
      qregModal.innerHTML = `
        <div class="wl-qreg-sheet" role="dialog" aria-modal="true" aria-labelledby="wl-qreg-header-title">
          <div class="wl-qreg-header">
            <div>
              <h3 class="wl-qreg-title" id="wl-qreg-header-title">Adicionar registro</h3>
              <span class="wl-qreg-date" id="wl-qreg-date-label">Hoje</span>
            </div>
            <button type="button" class="wl-close-circle" onclick="closeQuickRegisterModal()" aria-label="Fechar">✕</button>
          </div>

          <div class="wl-qreg-actions-grid">
            <button type="button" class="wl-qreg-action-btn green" id="wl-qreg-btn-confirm-day" aria-pressed="false" onclick="quickConfirmDay()">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span id="wl-qreg-confirm-lbl">Não fumei hoje</span>
            </button>
            <button type="button" class="wl-qreg-action-btn blue" onclick="quickAddUrge()">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>Vontade superada</span>
            </button>
          </div>

          <div class="wl-qreg-card">
            <div class="wl-qreg-row-between">
              <div>
                <span class="wl-qreg-section-lbl">Consumo na data</span>
                <div class="wl-qreg-cig-counter">
                  <strong id="wl-qreg-cigs-num">0</strong>
                  <span>/ <em id="wl-qreg-meta-num">11</em> cigarros</span>
                </div>
              </div>
              <div class="wl-qreg-stepper">
                <button type="button" class="wl-qreg-step-btn minus" id="wl-qreg-btn-minus" onclick="quickAdjustCigarette(-1)" aria-label="Remover 1 cigarro">−</button>
                <button type="button" class="wl-qreg-step-btn plus" id="wl-qreg-btn-plus" onclick="quickAdjustCigarette(1)">+1 cigarro</button>
              </div>
            </div>
          </div>

          <div class="wl-qreg-mood-block" id="wl-qreg-mood-block">
            <span class="wl-qreg-section-lbl">Como está se sentindo?</span>
            <div class="wl-qreg-mood-row" id="wl-qreg-mood-row">
              <button type="button" class="wl-qreg-mood-pill" data-mood="Feliz" aria-pressed="false" onclick="selectQuickMood('Feliz')" title="Feliz">
                <img src="assets/ilustracoes/Cabeça de Gato Preto com Olhos Verdes feliz.png" alt="" aria-hidden="true" class="wl-qreg-mood-img">
                <span>Feliz</span>
              </button>
              <button type="button" class="wl-qreg-mood-pill" data-mood="Calmo" aria-pressed="false" onclick="selectQuickMood('Calmo')" title="Calmo">
                <img src="assets/ilustracoes/Cabeça de Gato Preto com Olhos Verdes calmo.png" alt="" aria-hidden="true" class="wl-qreg-mood-img">
                <span>Calmo</span>
              </button>
              <button type="button" class="wl-qreg-mood-pill" data-mood="Ansioso" aria-pressed="false" onclick="selectQuickMood('Ansioso')" title="Ansioso">
                <img src="assets/ilustracoes/Gato Preto Ansioso com Gotas Azuis.png" alt="" aria-hidden="true" class="wl-qreg-mood-img">
                <span>Ansioso</span>
              </button>
              <button type="button" class="wl-qreg-mood-pill" data-mood="Triste" aria-pressed="false" onclick="selectQuickMood('Triste')" title="Triste">
                <img src="assets/ilustracoes/Gatinho Preto Triste com Olhos Verdes.png" alt="" aria-hidden="true" class="wl-qreg-mood-img">
                <span>Triste</span>
              </button>
              <button type="button" class="wl-qreg-mood-pill" data-mood="Irritado" aria-pressed="false" onclick="selectQuickMood('Irritado')" title="Irritado">
                <img src="assets/ilustracoes/Rosto de Gato Preto Irritado.png" alt="" aria-hidden="true" class="wl-qreg-mood-img">
                <span>Irritado</span>
              </button>
            </div>

            <div class="wl-qreg-mood-extra" id="wl-qreg-mood-extra" style="display:none;">
              <div class="wl-qreg-tags-row" id="wl-qreg-influence-chips">
                <button type="button" class="wl-qreg-tag" data-val="Sono" aria-pressed="false" onclick="this.classList.toggle('selected'); this.setAttribute('aria-pressed', String(this.classList.contains('selected'))); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Sono</button>
                <button type="button" class="wl-qreg-tag" data-val="Exercício" aria-pressed="false" onclick="this.classList.toggle('selected'); this.setAttribute('aria-pressed', String(this.classList.contains('selected'))); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Exercício</button>
                <button type="button" class="wl-qreg-tag" data-val="Trabalho" aria-pressed="false" onclick="this.classList.toggle('selected'); this.setAttribute('aria-pressed', String(this.classList.contains('selected'))); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Trabalho</button>
                <button type="button" class="wl-qreg-tag" data-val="Relações" aria-pressed="false" onclick="this.classList.toggle('selected'); this.setAttribute('aria-pressed', String(this.classList.contains('selected'))); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Relações</button>
                <button type="button" class="wl-qreg-tag" data-val="Alimentação" aria-pressed="false" onclick="this.classList.toggle('selected'); this.setAttribute('aria-pressed', String(this.classList.contains('selected'))); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Alimentação</button>
              </div>
              <div class="wl-qreg-note-row">
                <label for="wl-qreg-mood-note" class="sr-only" id="wl-qreg-mood-note-label">Nota opcional</label>
                <input type="text" id="wl-qreg-mood-note" class="wl-qreg-note-input" placeholder="Nota opcional..." oninput="if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">
                <button type="button" class="wl-qreg-save-mood-btn" id="wl-qreg-save-mood-btn" onclick="saveQuickMood()">Salvar humor</button>
              </div>
            </div>
          </div>
        </div>
      `;
      deviceScreen.appendChild(qregModal);

      const loadOverlay = document.createElement('div');
      loadOverlay.id = 'wl-loading-overlay';
      loadOverlay.className = 'wl-loading-overlay';
      loadOverlay.style.display = 'none';
      loadOverlay.innerHTML = `
        <div class="wl-spinner-ring">
          <img src="assets/avatar_verde.png" alt="Habbi" class="wl-spinner-cat">
        </div>
        <div class="wl-load-bars">
          <div class="wl-load-item">
            <div class="wl-load-row"><span class="blue">Analisando seus hábitos</span><strong id="wl-p1-txt">100%</strong></div>
            <div class="wl-load-track"><div class="wl-load-fill blue" id="wl-p1-bar" style="width:100%"></div></div>
          </div>
          <div class="wl-load-item">
            <div class="wl-load-row"><span class="purple">Personalizando metas</span><strong id="wl-p2-txt">100%</strong></div>
            <div class="wl-load-track"><div class="wl-load-fill purple" id="wl-p2-bar" style="width:100%"></div></div>
          </div>
          <div class="wl-load-item">
            <div class="wl-load-row"><span class="coral">Preparando seu companheiro</span><strong id="wl-p3-txt">100%</strong></div>
            <div class="wl-load-track"><div class="wl-load-fill coral" id="wl-p3-bar" style="width:100%"></div></div>
          </div>
        </div>
      `;
      deviceScreen.appendChild(loadOverlay);
    }

    removeWhiteBgFromAllMascots();
  }

  applyHabbiFlatDesign();

  let quickSelectedMood = '';
  let quickEditingEventId = null;

  window.syncQuickRegisterModalUI = function() {
    const targetKey = userState.activeRegisterDateKey || userState.calSelectedDate || getDateKey(new Date());
    const rec = userState.dailyRecords[targetKey];
    const cigs = rec ? rec.cigs : 0;
    const meta = (rec && rec.meta) || userState.todayMeta || 11;

    const dateLbl = document.getElementById('wl-qreg-date-label');
    if (dateLbl) dateLbl.innerText = formatDayLabelPt(targetKey);

    const cigsNumEl = document.getElementById('wl-qreg-cigs-num');
    if (cigsNumEl) cigsNumEl.innerText = cigs;

    const metaNumEl = document.getElementById('wl-qreg-meta-num');
    if (metaNumEl) metaNumEl.innerText = meta;

    const minusBtn = document.getElementById('wl-qreg-btn-minus');
    if (minusBtn) minusBtn.disabled = cigs <= 0;

    // Botão "Não fumei hoje" / "Não fumei neste dia" sempre visível e destacado na aba de registro
    const confirmBtn = document.getElementById('wl-qreg-btn-confirm-day');
    const confirmLbl = document.getElementById('wl-qreg-confirm-lbl');
    if (confirmBtn && confirmLbl) {
      confirmBtn.style.display = 'inline-flex';
      const todayKey = getDateKey(new Date());
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
      const baseLabel = (targetKey === todayKey)
        ? (t.homeNoSmoke || 'Não fumei hoje')
        : (t.noSmokeOtherDay || 'Não fumei neste dia');
      const isConfirmed = Boolean(rec && (rec.smokeFree || (Array.isArray(rec.events) && rec.events.some(e => e.kind === 'no-smoke'))));
      confirmLbl.innerText = isConfirmed ? `${baseLabel} ✓` : baseLabel;
      confirmBtn.setAttribute('aria-pressed', isConfirmed ? 'true' : 'false');
      if (isConfirmed) {
        confirmBtn.classList.add('is-confirmed');
      } else {
        confirmBtn.classList.remove('is-confirmed');
      }
    }
  };

  window.openQuickRegisterModal = function(dateKey, focusSection, editEventId) {
    const todayKey = getDateKey(new Date());
    const targetKey = dateKey || (currentScreen === 16 ? userState.calSelectedDate : null) || todayKey;
    if (targetKey > todayKey) {
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
      if (typeof showToast === 'function') showToast(t.futureDateBlocked || 'Não é possível registrar em datas futuras.');
      return;
    }
    userState.activeRegisterDateKey = targetKey;
    userState.calSelectedDate = targetKey;
    quickEditingEventId = editEventId || null;

    const headerTitleEl = document.getElementById('wl-qreg-header-title');
    if (headerTitleEl) {
      headerTitleEl.innerText = editEventId ? 'Editar registro' : 'Adicionar registro';
    }

    quickSelectedMood = '';
    document.querySelectorAll('#wl-qreg-mood-row .wl-qreg-mood-pill').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    document.querySelectorAll('#wl-qreg-influence-chips .wl-qreg-tag').forEach(t => {
      t.classList.remove('selected');
      t.setAttribute('aria-pressed', 'false');
    });
    const noteIn = document.getElementById('wl-qreg-mood-note');
    if (noteIn) noteIn.value = '';
    const saveMoodBtn = document.getElementById('wl-qreg-save-mood-btn');
    if (saveMoodBtn) saveMoodBtn.innerText = 'Salvar humor';

    const rec = userState.dailyRecords[targetKey];
    let targetMoodEv = null;
    if (rec && Array.isArray(rec.events)) {
      if (editEventId) {
        const found = rec.events.find(e => String(e.id) === String(editEventId));
        if (found && found.kind === 'mood') targetMoodEv = found;
      }
    }

    const extraEl = document.getElementById('wl-qreg-mood-extra');
    if (targetMoodEv) {
      quickSelectedMood = targetMoodEv.moodValue || (targetMoodEv.title ? targetMoodEv.title.replace(/^Humor:\s*/i, '').trim() : '');
      document.querySelectorAll('#wl-qreg-mood-row .wl-qreg-mood-pill').forEach(b => {
        const isSel = b.dataset.mood === quickSelectedMood;
        b.classList.toggle('active', isSel);
        b.setAttribute('aria-pressed', isSel ? 'true' : 'false');
      });

      const knownTags = ['Sono', 'Exercício', 'Trabalho', 'Relações', 'Alimentação'];
      let savedInfluences = Array.isArray(targetMoodEv.influences) ? targetMoodEv.influences : [];
      let savedNote = typeof targetMoodEv.note === 'string' ? targetMoodEv.note : '';

      if (savedInfluences.length === 0 && !savedNote && targetMoodEv.desc && targetMoodEv.desc !== 'Sentimento registrado') {
        const parts = targetMoodEv.desc.split(' • ');
        const extractedTags = [];
        const noteSegments = [];
        parts.forEach(part => {
          const subItems = part.split(',').map(s => s.trim()).filter(Boolean);
          const allKnown = subItems.length > 0 && subItems.every(s => knownTags.includes(s));
          if (allKnown) {
            extractedTags.push(...subItems);
          } else {
            noteSegments.push(part);
          }
        });
        savedInfluences = extractedTags;
        savedNote = noteSegments.join(' • ');
      }

      document.querySelectorAll('#wl-qreg-influence-chips .wl-qreg-tag').forEach(t => {
        const isTagSel = savedInfluences.includes(t.dataset.val);
        t.classList.toggle('selected', isTagSel);
        t.setAttribute('aria-pressed', isTagSel ? 'true' : 'false');
      });
      if (noteIn) noteIn.value = savedNote;
      if (saveMoodBtn) saveMoodBtn.innerText = 'Salvar humor';
      if (extraEl) extraEl.style.display = 'flex';
    } else {
      if (extraEl) extraEl.style.display = 'none';
    }

    window.syncQuickRegisterModalUI();

    const modal = document.getElementById('wl-quick-register-modal');
    if (modal) {
      modal.classList.add('is-open');
      openAccessibleDialog(modal, window.closeQuickRegisterModal, 'wl-qreg-header-title');
    }
  };

  window.closeQuickRegisterModal = function(opts) {
    quickEditingEventId = null;
    const modal = document.getElementById('wl-quick-register-modal');
    if (modal) {
      modal.classList.remove('is-open');
      closeAccessibleDialog(modal);
    }
    const wasDirectHub = Boolean(userState.quickRegOpenedDirectlyFromHub);
    userState.quickRegOpenedDirectlyFromHub = false;
    if (wasDirectHub && !(opts && opts.saved)) {
      setTimeout(() => window.toggleHabbiHubMenu(true), 40);
    }
  };

  // Modo visitante unificado (Decisão 2A): visitantes podem registrar localmente sem redirecionamento forçado
  function requireAuthToRegister(_returnScreen) {
    return true;
  }

  window.quickAdjustCigarette = function(delta) {
    if (!requireAuthToRegister(userState.returnScreenAfterRegister || 10)) return;
    const todayKey = getDateKey(new Date());
    const targetKey = userState.activeRegisterDateKey || todayKey;
    if (targetKey > todayKey) {
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
      if (typeof showToast === 'function') showToast(t.futureDateBlocked || 'Não é possível registrar em datas futuras.');
      return;
    }
    ensureActiveProfileForWrite();
    userState.calSelectedDate = targetKey;
    const existingRec = userState.dailyRecords[targetKey];
    const meta = (existingRec && existingRec.meta) || userState.todayMeta || 11;

    if (delta > 0) {
      const rec = getOrCreateDayRecord(targetKey);
      if (Array.isArray(rec.events)) {
        rec.events = rec.events.filter(e => e.kind !== 'no-smoke' && e.kind !== 'day-complete');
      }
      const nextNum = (rec.cigs || 0) + 1;
      recordHabbiEvent({
        dateKey: targetKey,
        kind: 'smoke',
        title: 'Cigarro registrado',
        desc: `${nextNum}/${meta} no dia`,
        detail: `Consumo registrado (${nextNum}/${meta}).`
      });
    } else if (delta < 0) {
      const rec = userState.dailyRecords[targetKey];
      if (!rec || !Array.isArray(rec.events)) return;
      const smokeIdx = rec.events.findIndex(e => e.kind === 'smoke');
      if (smokeIdx !== -1) {
        const minusBtn = document.getElementById('wl-qreg-btn-minus');
        const plusBtn = document.getElementById('wl-qreg-btn-plus');
        const minusWasFocused = Boolean(minusBtn && document.activeElement === minusBtn);
        rec.events.splice(smokeIdx, 1);
        recomputeDayAggregates(rec);
        const remainingCigs = rec.cigs || 0;
        if (rec.events.length === 0) {
          delete userState.dailyRecords[targetKey];
        }
        // Se o botão "-" estiver focado e for desabilitado ao zerar, move o foco para "+1 cigarro" antes
        if (minusWasFocused && remainingCigs <= 0 && plusBtn) {
          plusBtn.focus();
        }
        refreshAllViews();
      }
    }
  };

  let pendingNoSmokeTargetKey = null;

  window.closeConfirmNoSmokeModal = function() {
    pendingNoSmokeTargetKey = null;
    const modal = document.getElementById('habbi-confirm-nosmoke-modal');
    if (modal) {
      modal.style.display = 'none';
      closeAccessibleDialog(modal);
    }
  };

  window.confirmPendingNoSmokeDay = function() {
    const targetKey = pendingNoSmokeTargetKey;
    window.closeConfirmNoSmokeModal();
    if (targetKey) {
      userState.activeRegisterDateKey = targetKey;
      window.quickConfirmDay(true);
    }
  };

  window.quickConfirmDay = function(forceClearCigs = false) {
    if (!requireAuthToRegister(userState.returnScreenAfterRegister || 10)) return;
    const todayKey = getDateKey(new Date());
    const targetKey = userState.activeRegisterDateKey || todayKey;
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

    if (targetKey > todayKey) {
      if (typeof showToast === 'function') showToast(t.futureDateBlocked || 'Não é possível registrar em datas futuras.');
      return;
    }

    ensureActiveProfileForWrite();
    userState.calSelectedDate = targetKey;
    const existingRec = userState.dailyRecords[targetKey];

    // Se já houver cigarros registrados nesta data, exige confirmação explícita antes de zerar
    if (!forceClearCigs && existingRec && existingRec.cigs > 0) {
      pendingNoSmokeTargetKey = targetKey;
      const modal = document.getElementById('habbi-confirm-nosmoke-modal');
      const descEl = document.getElementById('habbi-nosmoke-modal-desc');
      if (descEl) {
        const tpl = t.noSmokeModalDesc || 'Esta data já possui {0} cigarro(s) registrado(s). Deseja zerar esses cigarros e confirmar como dia sem fumar?';
        descEl.textContent = tpl.replace('{0}', String(existingRec.cigs));
      }
      if (modal) {
        modal.style.display = 'flex';
        openAccessibleDialog(modal, window.closeConfirmNoSmokeModal, 'habbi-nosmoke-modal-title');
        return;
      }
    }

    const rec = getOrCreateDayRecord(targetKey);
    if (rec.cigs > 0 && Array.isArray(rec.events)) {
      rec.events = rec.events.filter(e => e.kind !== 'smoke');
      rec.cigs = 0;
    }

    const isToday = targetKey === todayKey;
    const dayLabel = isToday
      ? (t.homeNoSmoke || 'Não fumei hoje')
      : (t.noSmokeOtherDay || 'Não fumei neste dia');

    const alreadyMarked = Array.isArray(rec.events) && rec.events.some(e => e.kind === 'no-smoke');
    if (!alreadyMarked) {
      userState.lastMascotState = 'celebrate';
      addSavings(1, 'Dia sem fumar');
      recordHabbiEvent({
        dateKey: targetKey,
        kind: 'no-smoke',
        title: dayLabel,
        desc: '0 cigarros no dia',
        detail: 'Dia confirmado sem fumar.'
      });
    }
    // Sem efeito colateral em todayKey quando targetKey !== todayKey
    refreshAllViews();
    window.closeQuickRegisterModal({ saved: true });
    showCelebrationModal('Mais um dia cuidando de você.', `${dayLabel}!`, 'assets/ilustracoes/pata pra cima.png');
  };

  window.quickAddUrge = function() {
    if (!requireAuthToRegister(userState.returnScreenAfterRegister || 10)) return;
    const todayKey = getDateKey(new Date());
    const targetKey = userState.activeRegisterDateKey || todayKey;
    if (targetKey > todayKey) {
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
      if (typeof showToast === 'function') showToast(t.futureDateBlocked || 'Não é possível registrar em datas futuras.');
      return;
    }
    ensureActiveProfileForWrite();
    userState.calSelectedDate = targetKey;
    userState.lastMascotState = 'focus';
    recordHabbiEvent({
      dateKey: targetKey,
      kind: 'urge',
      title: 'Vontade superada',
      desc: 'Impulso controlado',
      detail: 'Vontade superada e registrada.'
    });
    window.closeQuickRegisterModal({ saved: true });
  };

  window.syncQuickMoodExtraVisibility = function() {
    const extraEl = document.getElementById('wl-qreg-mood-extra');
    if (!extraEl) return;
    const hasMood = Boolean(quickSelectedMood);
    const hasTags = document.querySelectorAll('#wl-qreg-influence-chips .wl-qreg-tag.selected').length > 0;
    const noteVal = (document.getElementById('wl-qreg-mood-note')?.value || '').trim();
    const saveMoodBtn = document.getElementById('wl-qreg-save-mood-btn');
    if (hasMood || hasTags || noteVal) {
      extraEl.style.display = 'flex';
      if (saveMoodBtn) {
        saveMoodBtn.innerText = hasMood ? 'Salvar humor' : 'Salvar registro';
      }
    } else {
      extraEl.style.display = 'none';
    }
  };

  window.selectQuickMood = function(moodName) {
    if (quickSelectedMood === moodName) {
      quickSelectedMood = '';
      document.querySelectorAll('#wl-qreg-mood-row .wl-qreg-mood-pill').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
    } else {
      quickSelectedMood = moodName;
      document.querySelectorAll('#wl-qreg-mood-row .wl-qreg-mood-pill').forEach(btn => {
        const isSel = btn.dataset.mood === moodName;
        btn.classList.toggle('active', isSel);
        btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
      });
    }
    window.syncQuickMoodExtraVisibility();
  };

  window.saveQuickMood = function() {
    const todayKey = getDateKey(new Date());
    const targetKey = userState.activeRegisterDateKey || todayKey;
    if (targetKey > todayKey) {
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
      if (typeof showToast === 'function') showToast(t.futureDateBlocked || 'Não é possível registrar em datas futuras.');
      return;
    }
    ensureActiveProfileForWrite();
    userState.calSelectedDate = targetKey;

    const influences = [];
    document.querySelectorAll('#wl-qreg-influence-chips .wl-qreg-tag.selected').forEach(tag => {
      if (tag.dataset.val) influences.push(tag.dataset.val);
    });
    const noteEl = document.getElementById('wl-qreg-mood-note');
    const note = noteEl ? noteEl.value.trim() : '';

    const infText = influences.length > 0 ? influences.join(', ') : '';
    const descParts = [];
    if (infText) descParts.push(infText);
    if (note) descParts.push(note);
    const fullDesc = descParts.join(' • ') || (quickSelectedMood ? 'Sentimento registrado' : 'Registro salvo');

    const rec = userState.dailyRecords[targetKey];
    const existingEv = (quickEditingEventId && rec && Array.isArray(rec.events))
      ? rec.events.find(e => String(e.id) === String(quickEditingEventId) && e.kind === 'mood')
      : null;

    const eventTitle = quickSelectedMood ? `Humor: ${quickSelectedMood}` : 'Registro de Sentimentos';

    if (existingEv) {
      existingEv.moodValue = quickSelectedMood || null;
      existingEv.title = eventTitle;
      existingEv.influences = influences;
      existingEv.note = note;
      existingEv.desc = fullDesc;
      existingEv.detail = fullDesc;
      recomputeDayAggregates(rec);
      refreshAllViews();
    } else {
      recordHabbiEvent({
        dateKey: targetKey,
        kind: 'mood',
        moodValue: quickSelectedMood || null,
        influences: influences,
        note: note,
        title: eventTitle,
        desc: fullDesc,
        detail: fullDesc
      });
    }

    const t = HABBI_I18N[(userState.currentLang || 'PT').toUpperCase()] || HABBI_I18N.PT;
    showToast(t.toastSaved || 'Registrado com sucesso');
    window.closeQuickRegisterModal({ saved: true });
  };

  window.showCelebrationModal = function(tagText, titleText, imgSrc) {
    const modal = document.getElementById('wl-celebration-modal');
    if (!modal) return;
    const tagEl = document.getElementById('wl-cel-tag');
    const titleEl = document.getElementById('wl-cel-title');
    const imgEl = document.getElementById('wl-cel-img');
    const pawStageEl = document.getElementById('wl-cel-paw-stage');
    if (tagEl && tagText) tagEl.innerText = tagText;
    if (titleEl && titleText) titleEl.innerText = titleText;
    if (imgEl && imgSrc) {
      imgEl.setAttribute('src', imgSrc);
      if (window.removeWhiteBgFromAllMascots) window.removeWhiteBgFromAllMascots();
    }
    modal.style.display = 'flex';
    modal.classList.remove('is-playing');
    if (pawStageEl) {
      pawStageEl.classList.remove('is-highfiving');
    }
    void modal.offsetWidth;
    modal.classList.add('is-playing');
    if (pawStageEl) {
      pawStageEl.classList.add('is-highfiving');
    }
    openAccessibleDialog(modal, window.closeCelebrationModal, 'wl-cel-title');
  };

  window.selectMascotPose = function(poseKey) {
    userState.lastMascotState = poseKey;
    updateHomeScreen();
    showToast('Gatinho selecionado na tela inicial!');
    showScreen(10);
  };

  // Update Home screen widgets
  function updateHomeScreen() {
    const metaCigs = document.getElementById('home-meta-cigs');
    const metaReg = document.getElementById('home-meta-registered');
    const metaPct = document.getElementById('home-meta-pct');
    const progressCircle = document.getElementById('home-progress-circle');
    const displayDays = document.getElementById('home-display-days');
    const displayDaysLbl = document.getElementById('home-display-days-label');
    const homeDayNum = document.getElementById('wl-home-day-num');
    const mascotImg = document.getElementById('home-mascot-img');
    const mascotArea = document.querySelector('.home-v2-mascot-area');
    const mascotCap = document.getElementById('wl-mascot-caption');

    const todayKey = getDateKey(new Date());
    const todayRec = userState.dailyRecords[todayKey];
    userState.todayLogged = todayRec ? todayRec.cigs : 0;

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const curI18n = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : null;

    if (displayDays) {
      displayDays.innerText = userState.daysClean;
    }
    if (displayDaysLbl) {
      if (curI18n) {
        displayDaysLbl.innerText = userState.daysClean === 1 ? curI18n.homeDaySingular : curI18n.homeDaysPlural;
      } else {
        displayDaysLbl.innerText = userState.daysClean === 1 ? 'dia sem fumar' : 'dias sem fumar';
      }
    }
    if (homeDayNum) {
      homeDayNum.innerText = new Date().getDate();
    }

    const swipeHint = document.getElementById('wl-carousel-swipe-hint');
    if (swipeHint) {
      if (!window.habbiTutorialActive) {
        swipeHint.classList.remove('is-tutorial-visible');
        swipeHint.style.display = 'none';
      }
    }

    const poseMap = {
      celebrate: { src: 'assets/ilustracoes/pata pra cima.png', stage: 'stage-green', text: 'Orgulho de você hoje!' },
      support:   { src: 'assets/ilustracoes/pata pra baixo.png', stage: 'stage-orange', text: 'Tudo bem. Um passo de cada vez.' },
      focus:     { src: 'assets/ilustracoes/avatar fone de ouvido.png', stage: 'stage-blue', text: 'Modo foco ativado! Respire fundo.' },
      heart:     { src: 'assets/ilustracoes/gato segurando coração.png', stage: 'stage-pink', text: 'Cuidando da sua saúde.' },
      play:      { src: 'assets/ilustracoes/gato brincando com bola.png', stage: 'stage-yellow', text: 'Mente distraída, fissura longe!' },
      grass:     { src: 'assets/ilustracoes/gato com grama.png', stage: 'stage-green', text: 'Respirando ar puro.' },
      glasses:   { src: 'assets/ilustracoes/avatar oculos.png', stage: 'stage-blue', text: 'De olho nos seus padrões.' },
      scarf:     { src: 'assets/ilustracoes/avatar cachecol.png', stage: 'stage-orange', text: 'Protegido e firme no propósito.' },
      box:       { src: 'assets/ilustracoes/gato na caixa.png', stage: 'stage-yellow', text: 'No seu espaço seguro.' },
      sleep:     { src: 'assets/ilustracoes/gato dormindo.png', stage: 'stage-blue', text: 'Calmo e em paz.' }
    };

    if (mascotImg && mascotArea) {
      mascotArea.classList.remove('stage-green', 'stage-yellow', 'stage-orange', 'stage-pink', 'stage-blue');
      const chosen = poseMap[userState.lastMascotState] || {
        src: 'assets/ilustracoes/gato com ponto de nterrogação.png',
        stage: 'stage-yellow',
        text: 'Toque para registrar seu dia'
      };
      mascotImg.setAttribute('src', chosen.src);
      mascotArea.classList.add(chosen.stage);
      if (mascotCap) mascotCap.innerText = chosen.text;
      if (window.removeWhiteBgFromAllMascots) window.removeWhiteBgFromAllMascots();
      mascotImg.classList.remove('is-reacting');
      void mascotImg.offsetWidth;
      mascotImg.classList.add('is-reacting');
    }

    const activeMeta = (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11;
    if (metaCigs) metaCigs.innerText = activeMeta;
    if (metaReg) metaReg.innerText = userState.todayLogged;

    // Atualiza botão nas Configurações se presente
    const settingsGoalMetaVal = document.getElementById('settings-goal-meta-val');
    if (settingsGoalMetaVal) {
      settingsGoalMetaVal.innerText = `${activeMeta} cig/dia`;
    }

    // Atualiza estado do botão secundário "Remover um cigarro" na Home
    const homeRemoveBtn = document.getElementById('btn-home-remove-cig');
    if (homeRemoveBtn) {
      const canRemoveToday = (userState.todayLogged || 0) > 0;
      homeRemoveBtn.disabled = !canRemoveToday;
      homeRemoveBtn.setAttribute('aria-disabled', String(!canRemoveToday));
    }
    
    const pct = activeMeta > 0
      ? Math.min(100, Math.round((userState.todayLogged / activeMeta) * 100))
      : (userState.todayLogged === 0 ? 0 : 100);
    if (metaPct) metaPct.innerText = `${pct}%`;

    // Atualiza o selo/botão "Não fumei hoje" na Tela Inicial
    const noSmokeBadge = document.getElementById('home-nosmoke-badge');
    const noSmokeBadgeText = document.getElementById('home-nosmoke-badge-text');
    if (noSmokeBadge && noSmokeBadgeText) {
      if (userState.todayLogged === 0) {
        noSmokeBadge.style.display = 'inline-flex';
        const isTodayConfirmedSmokeFree = Boolean(todayRec && todayRec.smokeFree);
        noSmokeBadge.classList.toggle('is-confirmed', isTodayConfirmedSmokeFree);
        const noSmokeTxt = curI18n ? curI18n.homeNoSmoke : 'Não fumei hoje';
        noSmokeBadgeText.innerText = isTodayConfirmedSmokeFree ? `${noSmokeTxt} ✓` : noSmokeTxt;
      } else {
        noSmokeBadge.style.display = 'none';
        noSmokeBadge.classList.remove('is-confirmed');
      }
    }

    // Atualiza o preenchimento e cor do cigarro interativo na Home:
    // - Até a meta: verde (#78B848), proporcional de vazio (71.5%) a cheio (39.2%)
    // - Ultrapassou a meta (sequência de alerta progressivo):
    //   * Amarelo: preenche em 1 vez (meta + 1 -> 100%)
    //   * Laranja: preenche em até 2 vezes (meta + 2 -> 50%, meta + 3 -> 100%)
    //   * Vermelho: preenche em até 2 vezes (meta + 4 -> 50%, meta + 5 -> 100%)
    //   * Escuro: preenche em 1 vez (meta + 6 em diante -> 100%)
    const homeCigFill = document.getElementById('home-cig-fill');
    const homeCigPinkFill = document.getElementById('home-cig-pink-fill');
    const metaVal = (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11;
    const loggedVal = Math.max(0, userState.todayLogged || 0);
    const overLimit = Math.max(0, loggedVal - metaVal);

    if (metaReg) {
      metaReg.style.color = '';
      metaReg.classList.remove('is-over-yellow', 'is-over-orange', 'is-over-red', 'is-over-dark');
      if (overLimit === 1) {
        metaReg.classList.add('is-over-yellow');
      } else if (overLimit === 2 || overLimit === 3) {
        metaReg.classList.add('is-over-orange');
      } else if (overLimit === 4 || overLimit === 5) {
        metaReg.classList.add('is-over-red');
      } else if (overLimit >= 6) {
        metaReg.classList.add('is-over-dark');
      }
    }

    // Micro-mensagem empática acima da meta (Decisão 1A — tom acolhedor e não punitivo)
    const overMetaBanner = document.getElementById('home-overmeta-banner');
    if (overMetaBanner) {
      if (overLimit > 0) {
        const tpl = (curI18n && curI18n.overMetaEmpathy)
          ? curI18n.overMetaEmpathy
          : '+{0} acima da meta — tudo bem, recomece no próximo';
        overMetaBanner.textContent = tpl.replace('{0}', String(overLimit));
        overMetaBanner.style.display = 'block';
      } else {
        overMetaBanner.textContent = '';
        overMetaBanner.style.display = 'none';
      }
    }

    if (homeCigFill) {
      homeCigFill.classList.remove('is-stage-green', 'is-stage-yellow', 'is-stage-orange', 'is-stage-red', 'is-stage-dark', 'is-over-limit');
      
      let newStage = 'green';
      let targetTopInset = 71.5;

      if (overLimit === 0) {
        newStage = 'green';
        if (loggedVal === 0) {
          targetTopInset = 71.5;
        } else {
          const minVisibleRatio = 0.10;
          const ratio = Math.min(1, Math.max(0, loggedVal / metaVal));
          const adjustedRatio = minVisibleRatio + (1 - minVisibleRatio) * ratio;
          targetTopInset = 71.5 - adjustedRatio * (71.5 - 39.2);
        }
      } else if (overLimit === 1) {
        newStage = 'yellow';
        targetTopInset = 39.20;
      } else if (overLimit === 2 || overLimit === 3) {
        // Mantém 100% preenchido (39.20) para qualquer overLimit >= 1, sem recuar para 50%
        newStage = 'orange';
        targetTopInset = 39.20;
      } else if (overLimit === 4 || overLimit === 5) {
        newStage = 'red';
        targetTopInset = 39.20;
      } else {
        newStage = 'dark';
        targetTopInset = 39.20;
      }

      homeCigFill.classList.add(`is-stage-${newStage}`);
      homeCigFill.dataset.cigStage = newStage;
      homeCigFill.style.clipPath = `inset(${targetTopInset.toFixed(2)}% 0 0 0)`;
    }

    if (homeCigPinkFill) {
      homeCigPinkFill.style.display = 'none';
      homeCigPinkFill.style.clipPath = 'inset(100% 0 0 0)';
    }

    if (progressCircle) {
      const circumference = 2 * Math.PI * 16;
      const offset = circumference - (pct / 100) * circumference;
      progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      progressCircle.style.strokeDashoffset = offset;
    }

    if (typeof window.checkDailyGoalPrompt === 'function') {
      window.checkDailyGoalPrompt();
    }
  }

  window.handleHomeNoSmokeToday = function() {
    const todayKey = getDateKey(new Date());
    userState.activeRegisterDateKey = todayKey;
    userState.returnScreenAfterRegister = 10;
    window.quickConfirmDay();
  };

  window.handleHomeAddCigarette = function() {
    const todayKey = getDateKey(new Date());
    const rec = getOrCreateDayRecord(todayKey);
    if (Array.isArray(rec.events)) {
      rec.events = rec.events.filter(e => e.kind !== 'no-smoke' && e.kind !== 'day-complete');
    }
    const nextNum = (rec.cigs || 0) + 1;
    const meta = (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11;

    recordHabbiEvent({
      dateKey: todayKey,
      kind: 'smoke',
      title: 'Cigarro registrado',
      desc: `${nextNum}/${meta} no dia`,
      detail: `Consumo anotado (${nextNum}/${meta}).`
    });

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const homeCigMeter = document.getElementById('home-cig-meter');
    if (homeCigMeter) {
      homeCigMeter.classList.remove('is-bumping');
      if (!prefersReducedMotion) {
        void homeCigMeter.offsetWidth;
        homeCigMeter.classList.add('is-bumping');
        setTimeout(() => homeCigMeter.classList.remove('is-bumping'), 350);
      }
    }

    const homeAddBtn = document.getElementById('btn-home-add-cig');
    if (homeAddBtn && !prefersReducedMotion) {
      homeAddBtn.classList.remove('is-pressed');
      void homeAddBtn.offsetWidth;
      homeAddBtn.classList.add('is-pressed');
      setTimeout(() => homeAddBtn.classList.remove('is-pressed'), 260);
    }

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const tAdd = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    showToast(`${tAdd.toastCigAdded || 'Cigarro registrado'} (${nextNum}/${meta})`);
  };

  window.handleHomeRemoveCigarette = function() {
    const todayKey = getDateKey(new Date());
    const rec = userState.dailyRecords[todayKey];
    if (!rec || !Array.isArray(rec.events) || (rec.cigs || 0) <= 0) {
      return;
    }

    // Remove somente o registro individual de cigarro mais recente de hoje (não afeta outros dias)
    const smokeIdx = rec.events.findIndex(e => e && e.kind === 'smoke');
    if (smokeIdx === -1) return;

    const homeRemoveBtn = document.getElementById('btn-home-remove-cig');
    const homeAddBtn = document.getElementById('btn-home-add-cig');
    const removeWasFocused = Boolean(homeRemoveBtn && document.activeElement === homeRemoveBtn);

    rec.events.splice(smokeIdx, 1);
    recomputeDayAggregates(rec);
    const remainingCigs = rec.cigs || 0;
    if (rec.events.length === 0) {
      delete userState.dailyRecords[todayKey];
    }

    // Se o botão "−" estava focado ao zerar, move o foco para "+ Registrar cigarro" antes de desabilitar "−"
    if (removeWasFocused && remainingCigs <= 0 && homeAddBtn) {
      homeAddBtn.focus();
    }

    refreshAllViews();

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (homeRemoveBtn && !prefersReducedMotion) {
      homeRemoveBtn.classList.remove('is-pressed');
      void homeRemoveBtn.offsetWidth;
      homeRemoveBtn.classList.add('is-pressed');
      setTimeout(() => homeRemoveBtn.classList.remove('is-pressed'), 220);
    }

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : window.HABBI_I18N.PT;
    showToast(t.homeRemoveCigToast || '1 cigarro removido');
  };

  // SOS intelligent intervention decision
  function selectIntelligentIntervention() {
    const context = userState.sosContext;
    const urge = userState.sosUrge;
    const time = userState.sosTime;

    let choice = 'Respiração 4-6';

    if (urge >= 8) {
      choice = 'Surfando a Onda';
    } else if (context === 'Casa' && time.includes('30s')) {
      choice = 'Respiração Quadrada';
    } else if (context === 'Trabalho' && time.includes('1 min')) {
      choice = 'Respiração Quadrada';
    } else if (context === 'Rua' && time.includes('3 min')) {
      choice = 'Ancoragem 5-4-3-2-1';
    } else if (context === 'Transporte' && time.includes('5 min')) {
      choice = 'Ancoragem 5-4-3-2-1';
    } else if (time.includes('30s')) {
      choice = 'Respiração Quadrada';
    } else if (time.includes('1 min')) {
      choice = 'Respiração Quadrada';
    } else if (time.includes('3 min')) {
      choice = 'Ancoragem 5-4-3-2-1';
    } else {
      choice = 'Respiração Quadrada';
    }

    userState.selectedIntervention = choice;
  }

  // Interactive SOS Intervenção (Screen 13)
  let gentleAudioCtx = null;
  userState.breathingSoundEnabled = false;

  window.toggleBreathingSound = function() {
    userState.breathingSoundEnabled = !userState.breathingSoundEnabled;
    const offIcon = document.getElementById('wl-interv-sound-off-icon');
    const onIcon = document.getElementById('wl-interv-sound-on-icon');
    if (offIcon && onIcon) {
      offIcon.style.display = userState.breathingSoundEnabled ? 'none' : 'block';
      onIcon.style.display = userState.breathingSoundEnabled ? 'block' : 'none';
    }
    if (userState.breathingSoundEnabled) {
      playGentleChime(528);
      showToast('Som da respiração ativado');
    } else {
      showToast('Som desativado');
    }
  };

  function playGentleChime(freq = 432) {
    if (!userState.breathingSoundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!gentleAudioCtx) gentleAudioCtx = new AudioContext();
      if (gentleAudioCtx.state === 'suspended') gentleAudioCtx.resume();
      const osc = gentleAudioCtx.createOscillator();
      const gain = gentleAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, gentleAudioCtx.currentTime);
      gain.gain.setValueAtTime(0.001, gentleAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, gentleAudioCtx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, gentleAudioCtx.currentTime + 1.4);
      osc.connect(gain);
      gain.connect(gentleAudioCtx.destination);
      osc.start();
      osc.stop(gentleAudioCtx.currentTime + 1.4);
    } catch (_e) {}
  }

  let breathState = {
    timer: null,
    sessionTimer: null,
    phase: 'inspire',
    countdown: 4,
    elapsed: 0,
    isPaused: false
  };

  function initInterventionScreen() {
    const titleEl = document.getElementById('intervention-execution-title');
    const intervName = userState.selectedIntervention || 'Respiração 4-6';
    if (titleEl) titleEl.innerText = intervName;

    if (breathState.timer) clearInterval(breathState.timer);
    if (breathState.sessionTimer) clearInterval(breathState.sessionTimer);

    if (intervName.includes('Ancoragem') || intervName.includes('5-4-3-2-1') || intervName.includes('observar')) {
      startGuidedGrounding();
    } else {
      startGuidedBreathing();
    }
  }

  function startGuidedBreathing() {
    const containerEl = document.getElementById('intervention-interactive-container');
    const controlsEl = document.getElementById('intervention-bottom-controls');
    const soundBtn = document.getElementById('btn-interv-sound-toggle');
    if (soundBtn) soundBtn.style.display = 'flex';

    if (breathState.timer) clearInterval(breathState.timer);
    if (breathState.sessionTimer) clearInterval(breathState.sessionTimer);

    breathState.phase = 'inspire';
    breathState.countdown = 4;
    breathState.elapsed = 0;
    breathState.isPaused = false;

    const silEl = document.getElementById('wl-interv-silhouette');
    if (silEl) {
      silEl.src = 'assets/ilustracoes/gato_dormindo_cropped.png';
      silEl.onerror = function() { this.onerror = null; this.src = 'assets/ilustracoes/gato dormindo.png'; };
      silEl.className = 'wl-interv-bg-silhouette is-breathing';
      silEl.style.display = 'block';
    }

    containerEl.innerHTML = `
      <div class="wl-breath-wrap">
        <div class="wl-breath-circle-stage is-inhale" id="wl-breath-circle-stage">
          <div class="wl-breath-outer-ring"></div>
          <div class="wl-breath-inner-circle">
            <span class="wl-breath-action-text" id="wl-breath-action-text">Inspire</span>
            <span class="wl-breath-counter" id="wl-breath-counter">4</span>
          </div>
        </div>
        <p class="wl-breath-tip" id="wl-breath-tip">Inspire pelo nariz por 4s e solte pela boca por 6s.</p>
      </div>
    `;

    controlsEl.innerHTML = `
      <button type="button" class="wl-interv-ctrl-btn secondary" id="btn-breath-pause-toggle" onclick="toggleBreathingPause()">Pausar</button>
      <button type="button" class="wl-interv-ctrl-btn primary" onclick="finishBreathingExercise()">Concluir</button>
    `;

    playGentleChime(432);

    breathState.timer = setInterval(() => {
      if (breathState.isPaused) return;
      breathState.countdown--;
      const counterEl = document.getElementById('wl-breath-counter');
      const actionEl = document.getElementById('wl-breath-action-text');
      const stageEl = document.getElementById('wl-breath-circle-stage');

      if (breathState.countdown <= 0) {
        if (breathState.phase === 'inspire') {
          breathState.phase = 'solte';
          breathState.countdown = 6;
          if (stageEl) {
            stageEl.classList.remove('is-inhale');
            stageEl.classList.add('is-exhale');
          }
          if (actionEl) actionEl.innerText = 'Solte';
          playGentleChime(340);
        } else {
          breathState.phase = 'inspire';
          breathState.countdown = 4;
          if (stageEl) {
            stageEl.classList.remove('is-exhale');
            stageEl.classList.add('is-inhale');
          }
          if (actionEl) actionEl.innerText = 'Inspire';
          playGentleChime(432);
        }
      }

      if (counterEl) counterEl.innerText = breathState.countdown;
    }, 1000);

    breathState.sessionTimer = setInterval(() => {
      if (!breathState.isPaused) breathState.elapsed++;
    }, 1000);
  }

  window.toggleBreathingPause = function() {
    breathState.isPaused = !breathState.isPaused;
    const btn = document.getElementById('btn-breath-pause-toggle');
    if (btn) btn.innerText = breathState.isPaused ? 'Continuar' : 'Pausar';
    const tip = document.getElementById('wl-breath-tip');
    if (tip) tip.innerText = breathState.isPaused ? 'Pausado. Toque em Continuar quando estiver pronto.' : 'Inspire pelo nariz por 4s e solte pela boca por 6s.';
  };

  window.finishBreathingExercise = function() {
    if (breathState.timer) clearInterval(breathState.timer);
    if (breathState.sessionTimer) clearInterval(breathState.sessionTimer);
    window.openSosFeedbackModal();
  };

  // 5. Ancoragem 5-4-3-2-1 Sensorial
  const GROUNDING_STEPS_I18N = {
    PT: [
      {
        num: 5, sense: 'Visão', title: '5 coisas que você vê',
        instruction: 'Observe seu ambiente com calma e toque nos itens conforme identificá-los:',
        color: '#3B82F6', bg: '#EFF6FF',
        items: [
          'Um objeto de cor marcante',
          'Um detalhe no teto ou na parede',
          'Algo que esteja distante de você',
          'Um formato geométrico ou textura',
          'Um ponto de luz ou sombra'
        ]
      },
      {
        num: 4, sense: 'Tato', title: '4 coisas que você sente',
        instruction: 'Conecte-se com as sensações físicas do seu corpo no momento:',
        color: '#10B981', bg: '#ECFDF5',
        items: [
          'A textura da sua roupa na pele',
          'Seus pés firmes apoiados no chão',
          'A temperatura do ar nas mãos',
          'O encosto da cadeira ou apoio onde está'
        ]
      },
      {
        num: 3, sense: 'Audição', title: '3 sons que você ouve',
        instruction: 'Feche os olhos por um instante e preste atenção aos sons ao redor:',
        color: '#F59E0B', bg: '#FFFBEB',
        items: [
          'Um som vindo de longe ou da rua',
          'Um ruído discreto no mesmo ambiente',
          'O som suave da sua própria respiração'
        ]
      },
      {
        num: 2, sense: 'Olfato', title: '2 cheiros que você nota',
        instruction: 'Inspire fundo pelo nariz e perceba aromas sutis no ambiente:',
        color: '#EC4899', bg: '#FDF2F8',
        items: [
          'O ar fresco entrando pelas narinas',
          'O aroma da sua roupa, sabonete ou café'
        ]
      },
      {
        num: 1, sense: 'Paladar', title: '1 sabor presente',
        instruction: 'Traga a atenção para a sua boca e o momento presente:',
        color: '#8B5CF6', bg: '#F5F3FF',
        items: [
          'O gosto na boca agora ou o frescor de um gole d\'água'
        ]
      }
    ],
    EN: [
      {
        num: 5, sense: 'Sight', title: '5 things you see',
        instruction: 'Observe your surroundings calmly and tap items as you find them:',
        color: '#3B82F6', bg: '#EFF6FF',
        items: [
          'An object with a striking color',
          'A detail on the ceiling or wall',
          'Something in the distance',
          'A geometric shape or texture',
          'A point of light or shadow'
        ]
      },
      {
        num: 4, sense: 'Touch', title: '4 things you feel',
        instruction: 'Connect with physical sensations of your body right now:',
        color: '#10B981', bg: '#ECFDF5',
        items: [
          'The texture of your clothes on skin',
          'Your feet firmly touching the floor',
          'The air temperature on your hands',
          'The chair backrest or support where you are'
        ]
      },
      {
        num: 3, sense: 'Hearing', title: '3 sounds you hear',
        instruction: 'Close your eyes for a moment and listen to the sounds around you:',
        color: '#F59E0B', bg: '#FFFBEB',
        items: [
          'A distant sound or street noise',
          'A subtle sound in the same room',
          'The gentle sound of your own breathing'
        ]
      },
      {
        num: 2, sense: 'Smell', title: '2 scents you notice',
        instruction: 'Inhale deeply through your nose and detect subtle scents:',
        color: '#EC4899', bg: '#FDF2F8',
        items: [
          'Fresh air entering your nostrils',
          'The scent of your clothes, soap, or coffee'
        ]
      },
      {
        num: 1, sense: 'Taste', title: '1 taste present',
        instruction: 'Bring your attention to your mouth and the present moment:',
        color: '#8B5CF6', bg: '#F5F3FF',
        items: [
          'The current taste or freshness of a sip of water'
        ]
      }
    ],
    ES: [
      {
        num: 5, sense: 'Vista', title: '5 cosas que ves',
        instruction: 'Observa tu entorno con calma y toca los elementos a medida que los notes:',
        color: '#3B82F6', bg: '#EFF6FF',
        items: [
          'Un objeto de color llamativo',
          'Un detalle en el techo o pared',
          'Algo que esté lejos de ti',
          'Una forma geométrica o textura',
          'Un punto de luz o sombra'
        ]
      },
      {
        num: 4, sense: 'Tacto', title: '4 cosas que sientes',
        instruction: 'Conéctate con las sensaciones físicas de tu cuerpo en este momento:',
        color: '#10B981', bg: '#ECFDF5',
        items: [
          'La textura de tu ropa en la piel',
          'Tus pies firmes apoyados en el suelo',
          'La temperatura del aire en tus manos',
          'El respaldo de la silla o apoyo donde estás'
        ]
      },
      {
        num: 3, sense: 'Oído', title: '3 sonidos que oyes',
        instruction: 'Cierra los ojos un instante y presta atención a los sonidos:',
        color: '#F59E0B', bg: '#FFFBEB',
        items: [
          'Un sonido lejano o de la calle',
          'Un ruido discreto en la misma habitación',
          'El suave sonido de tu propia respiración'
        ]
      },
      {
        num: 2, sense: 'Olfato', title: '2 olores que notas',
        instruction: 'Inhala hondo por la nariz y percibe aromas sutiles:',
        color: '#EC4899', bg: '#FDF2F8',
        items: [
          'El aire fresco entrando por las fosas nasales',
          'El aroma de tu ropa, jabón o café'
        ]
      },
      {
        num: 1, sense: 'Gusto', title: '1 sabor presente',
        instruction: 'Lleva la atención a tu boca y al momento presente:',
        color: '#8B5CF6', bg: '#F5F3FF',
        items: [
          'El sabor actual en la boca o la frescura de un trago de agua'
        ]
      }
    ]
  };

  const GROUNDING_STEPS = GROUNDING_STEPS_I18N.PT;

  let groundingCurrentStep = 0;
  let groundingChecks = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {} };

  function startGuidedGrounding() {
    const soundBtn = document.getElementById('btn-interv-sound-toggle');
    if (soundBtn) soundBtn.style.display = 'none';

    const silEl = document.getElementById('wl-interv-silhouette');
    if (silEl) {
      silEl.src = 'assets/ilustracoes/gato_dormindo_cropped.png';
      silEl.onerror = function() { this.onerror = null; this.src = 'assets/ilustracoes/gato dormindo.png'; };
      silEl.className = 'wl-interv-bg-silhouette is-grounding';
      silEl.style.display = 'block';
    }

    groundingCurrentStep = 0;
    groundingChecks = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {} };
    renderGroundingStep();
  }

  function renderGroundingStep() {
    const containerEl = document.getElementById('intervention-interactive-container');
    const controlsEl = document.getElementById('intervention-bottom-controls');
    if (!containerEl || !controlsEl) return;
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const gList = GROUNDING_STEPS_I18N[activeLang] || GROUNDING_STEPS_I18N.PT;
    const step = gList[groundingCurrentStep] || gList[0];
    const currentStepChecks = groundingChecks[groundingCurrentStep] || {};

    let listHtml = '';
    step.items.forEach((itemText, idx) => {
      const isChecked = !!currentStepChecks[idx];
      listHtml += `
        <button type="button" class="wl-grounding-item-card ${isChecked ? 'is-checked' : ''}" onclick="toggleGroundingItem(${idx})">
          <div class="wl-grounding-check-circle">${isChecked ? '✓' : ''}</div>
          <span class="wl-grounding-item-text">${itemText}</span>
        </button>
      `;
    });

    let dotsHtml = '';
    for (let d = 0; d < 5; d++) {
      dotsHtml += `<div class="wl-grounding-step-dot ${d === groundingCurrentStep ? 'active' : ''}"></div>`;
    }

    containerEl.innerHTML = `
      <div class="wl-grounding-wrap">
        <div class="wl-grounding-nav-dots">${dotsHtml}</div>
        <div class="wl-grounding-badge-wrap">
          <div class="wl-grounding-big-num" style="background-color: ${step.color};">${step.num}</div>
        </div>
        <h2 class="wl-grounding-title">${step.title}</h2>
        <p class="wl-grounding-desc">${step.instruction}</p>
        <div class="wl-grounding-items-list">${listHtml}</div>
      </div>
    `;

    const t = (HABBI_I18N && HABBI_I18N[activeLang]) ? HABBI_I18N[activeLang] : HABBI_I18N.PT;
    controlsEl.innerHTML = `
      ${groundingCurrentStep > 0 ? `<button type="button" class="wl-interv-ctrl-btn secondary" onclick="changeGroundingStep(-1)">${t.intervPrev || 'Anterior'}</button>` : ''}
      ${groundingCurrentStep < 4 ? `<button type="button" class="wl-interv-ctrl-btn primary" onclick="changeGroundingStep(1)">${t.intervNext || 'Próximo'}</button>` : `<button type="button" class="wl-interv-ctrl-btn primary" onclick="finishGroundingExercise()">${t.intervDone || 'Concluir'}</button>`}
    `;
  }

  window.toggleGroundingItem = function(itemIdx) {
    if (!groundingChecks[groundingCurrentStep]) groundingChecks[groundingCurrentStep] = {};
    groundingChecks[groundingCurrentStep][itemIdx] = !groundingChecks[groundingCurrentStep][itemIdx];
    renderGroundingStep();
  };
  window.toggleGroundingChip = window.toggleGroundingItem;

  window.changeGroundingStep = function(delta) {
    groundingCurrentStep = Math.max(0, Math.min(4, groundingCurrentStep + delta));
    renderGroundingStep();
  };

  window.finishGroundingExercise = function() {
    window.openSosFeedbackModal();
  };

  window.handleInterventionBack = function() {
    if (breathState.timer) clearInterval(breathState.timer);
    if (breathState.sessionTimer) clearInterval(breathState.sessionTimer);
    const silEl = document.getElementById('wl-interv-silhouette');
    if (silEl) silEl.style.display = 'none';
    const returnScreen = userState.interventionReturnScreen || 12;
    showScreen(returnScreen);
  };

  function formatGameScore(key, val1, val2) {
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : window.HABBI_I18N.PT;
    const template = t[key] || '';
    return template.replace('{0}', val1).replace('{1}', val2 !== undefined ? val2 : '');
  }

  // -------------------------------------------------------------
  // GAMIFICAÇÃO DE RECORDES DOS MINIJOGOS (ESCOPADO POR PERFIL)
  // -------------------------------------------------------------
  function getGameRecords() {
    if (!userState.gameRecords || typeof userState.gameRecords !== 'object') {
      userState.gameRecords = { memory: 0, sequence: 0, reflex: 0, math: 0 };
    }
    return {
      memory: Number(userState.gameRecords.memory) || 0,
      sequence: Number(userState.gameRecords.sequence) || 0,
      reflex: Number(userState.gameRecords.reflex) || 0,
      math: Number(userState.gameRecords.math) || 0
    };
  }
  window.getGameRecords = getGameRecords;
  window.loadGameRecords = getGameRecords;

  function saveGameRecord(gameKey, score) {
    if (!score || score <= 0) return false;
    ensureActiveProfileForWrite();
    const records = getGameRecords();
    if (score > (records[gameKey] || 0)) {
      records[gameKey] = score;
      userState.gameRecords = records;
      savePersistedState();
      updateMinigamesRecordUI();
      return true;
    }
    return false;
  }
  window.saveGameRecord = saveGameRecord;
  window.saveGameRecords = function(recordsObj) {
    if (!recordsObj || typeof recordsObj !== 'object') return;
    ensureActiveProfileForWrite();
    userState.gameRecords = {
      memory: Number(recordsObj.memory) || 0,
      sequence: Number(recordsObj.sequence) || 0,
      reflex: Number(recordsObj.reflex) || 0,
      math: Number(recordsObj.math) || 0
    };
    savePersistedState();
    updateMinigamesRecordUI();
  };

  function getGameRecordWord() {
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : window.HABBI_I18N.PT;
    return t.recordWord || 'Recorde';
  }
  window.getGameRecordWord = getGameRecordWord;

  function updateMinigamesRecordUI() {
    const records = getGameRecords();
    const recWord = getGameRecordWord();
    const map = {
      memory: 'record-game-memory',
      sequence: 'record-game-sequence',
      math: 'record-game-math',
      reflex: 'record-game-reflex'
    };
    Object.keys(map).forEach(k => {
      const el = document.getElementById(map[k]);
      if (el) {
        el.innerText = `${recWord}: ${records[k] || 0}`;
      }
    });
  }
  window.updateMinigamesRecordUI = updateMinigamesRecordUI;

  // Minigame 1: Memória Rápida Infinita com Ilustrações do Habbi
  let memoryGameState = {
    round: 1,
    totalMatches: 0
  };

  function startMemoryGame(keepScore) {
    const container = document.getElementById('game-memory-board');
    if (!container) return;
    if (!keepScore) {
      memoryGameState.round = 1;
      memoryGameState.totalMatches = 0;
    }

    container.innerHTML = '';

    // Ilustrações exclusivas do Habbi
    const catPool = [
      'cat_1.png', // brincando com bola
      'cat_2.png', // na caixa
      'cat_3.png', // dormindo
      'cat_4.png', // escondido arbusto
      'cat_5.png', // pose normal
      'cat_6.png', // segurando coração
      'cat_7.png', // feliz
      'cat_8.png'  // calmo
    ];

    // Dificuldade progressiva suave: Rodada 1 tem 4 pares (8 cartas). Rodada 2+ tem 6 pares (12 cartas).
    const pairCount = memoryGameState.round === 1 ? 4 : 6;
    const shuffledCats = [...catPool].sort(() => Math.random() - 0.5).slice(0, pairCount);
    const cardDeck = [...shuffledCats, ...shuffledCats].sort(() => Math.random() - 0.5);

    // Ajusta classe do grid para layout harmônico
    container.className = pairCount === 4 ? 'memory-grid grid-4x2' : 'memory-grid';

    // Badge de pontuação, rodada e recorde
    const scoreBadge = document.createElement('div');
    scoreBadge.className = 'game-score-badge';
    scoreBadge.style.gridColumn = pairCount === 4 ? 'span 2' : 'span 3';
    scoreBadge.style.textAlign = 'center';
    const recMem = getGameRecords().memory;
    scoreBadge.innerText = `${formatGameScore('gameScorePairs', memoryGameState.totalMatches, memoryGameState.round)} • ${getGameRecordWord()}: ${recMem}`;
    container.appendChild(scoreBadge);

    let activeTiles = [];
    let currentRoundMatches = 0;
    let isChecking = false;

    cardDeck.forEach((catFile, idx) => {
      const tile = document.createElement('div');
      tile.className = 'memory-tile';
      tile.dataset.cat = catFile;
      tile.dataset.idx = idx;

      // Carta virada para baixo: ícone da folha em cinza
      tile.innerHTML = '<img src="assets/folha_icon.png" class="memory-back-icon" alt="Folha" onerror="this.onerror=null;this.src=\'assets/folha_icon.png\';">';

      tile.addEventListener('click', () => {
        if (isChecking || tile.classList.contains('flipped') || tile.classList.contains('matched') || activeTiles.length >= 2) return;

        tile.classList.add('flipped');
        tile.innerHTML = `<img src="assets/${catFile}" class="memory-tile-img" alt="Gatinho Habbi" onerror="this.onerror=null;this.src='assets/folha_icon.png';">`;
        activeTiles.push(tile);

        if (activeTiles.length === 2) {
          const [t1, t2] = activeTiles;
          if (t1.dataset.cat === t2.dataset.cat) {
            // Acertou par
            t1.classList.add('matched');
            t2.classList.add('matched');
            activeTiles = [];
            currentRoundMatches++;
            memoryGameState.totalMatches++;
            const isNew = saveGameRecord('memory', memoryGameState.totalMatches);
            const curRec = getGameRecords().memory;
            scoreBadge.innerText = `${formatGameScore('gameScorePairs', memoryGameState.totalMatches, memoryGameState.round)} • ${getGameRecordWord()}: ${curRec}`;
            if (isNew && memoryGameState.totalMatches > 1) {
              scoreBadge.classList.add('record-burst');
              setTimeout(() => scoreBadge.classList.remove('record-burst'), 600);
            }

            if (currentRoundMatches === pairCount) {
              // Concluiu rodada: transição rápida e natural para a próxima sem telas de vitória ou bloqueio
              memoryGameState.round++;
              setTimeout(() => {
                if (userState.isGameActive) {
                  startMemoryGame(true);
                }
              }, 450);
            }
          } else {
            // Errou: cartas voltam a ficar escondidas suavemente
            isChecking = true;
            setTimeout(() => {
              t1.classList.remove('flipped');
              t2.classList.remove('flipped');
              t1.innerHTML = '<img src="assets/folha_icon.png" class="memory-back-icon" alt="Folha" onerror="this.onerror=null;this.src=\'assets/folha_icon.png\';">';
              t2.innerHTML = '<img src="assets/folha_icon.png" class="memory-back-icon" alt="Folha" onerror="this.onerror=null;this.src=\'assets/folha_icon.png\';">';
              activeTiles = [];
              isChecking = false;
            }, 650);
          }
        }
      });

      container.appendChild(tile);
    });
  }

  // Minigame 2: Genius de Números (Memória de Sequência)
  // Quatro botões grandes numerados de 1 a 4 com cores sólidas da paleta Habbi
  const SIMON_COLORS = [
    { id: '1', alias: 'green',  num: '1', colorClass: 'color-green',  freq: 330, key: '1' },
    { id: '2', alias: 'yellow', num: '2', colorClass: 'color-yellow', freq: 261, key: '2' },
    { id: '3', alias: 'blue',   num: '3', colorClass: 'color-blue',   freq: 392, key: '3' },
    { id: '4', alias: 'coral',  num: '4', colorClass: 'color-coral',  freq: 523, key: '4' }
  ];

  function normalizeSimonKey(input) {
    if (!input) return '1';
    const s = String(input).toLowerCase();
    if (s === 'green' || s === 'verde') return '1';
    if (s === 'yellow' || s === 'amarelo' || s === 'amarillo') return '2';
    if (s === 'blue' || s === 'azul') return '3';
    if (s === 'coral') return '4';
    if (['1', '2', '3', '4'].includes(s)) return s;
    return '1';
  }
  window.normalizeSimonKey = normalizeSimonKey;

  let simonAudioCtx = null;
  let simonAudioMuted = (localStorage.getItem('habbi-simon-muted') === '1');

  function isSimonAudioMuted() {
    return Boolean(simonAudioMuted);
  }

  function getSimonAudioCtx() {
    if (!simonAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      simonAudioCtx = new AudioCtx();
    }
    if (simonAudioCtx && simonAudioCtx.state === 'suspended') {
      simonAudioCtx.resume().catch(() => {});
    }
    return simonAudioCtx;
  }

  function playSimonTone(freq, durationMs = 380) {
    if (simonAudioMuted) return;
    try {
      const ctx = getSimonAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (durationMs / 1000));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (durationMs / 1000) + 0.04);
    } catch (_e) {}
  }

  function toggleSimonSound() {
    simonAudioMuted = !simonAudioMuted;
    localStorage.setItem('habbi-simon-muted', simonAudioMuted ? '1' : '0');
    const iconEl = document.getElementById('simon-sound-icon');
    const btnEl = document.getElementById('btn-seq-sound-toggle');
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    const txt = simonAudioMuted ? (t.gameSeqSoundOff || 'Sem som') : (t.gameSeqSoundOn || 'Som ativado');
    if (iconEl) iconEl.innerText = simonAudioMuted ? '🔇' : '🔊';
    if (btnEl) btnEl.setAttribute('aria-label', txt);
    if (!simonAudioMuted) {
      playSimonTone(392, 120);
    }
  }
  window.toggleSimonSound = toggleSimonSound;
  window.isSimonAudioMuted = isSimonAudioMuted;
  try {
    Object.defineProperty(window, 'simonAudioMuted', {
      get: () => simonAudioMuted,
      set: (v) => {
        simonAudioMuted = Boolean(v);
        localStorage.setItem('habbi-simon-muted', simonAudioMuted ? '1' : '0');
      },
      configurable: true
    });
  } catch (_e) {}

  let sequenceGameState = {
    round: 1,
    completed: 0,
    sequence: [],
    playerIndex: 0,
    phase: 'idle', // 'idle' | 'observing' | 'repeating' | 'success' | 'error'
    timeouts: []
  };

  function clearSimonTimeouts() {
    if (sequenceGameState.timeouts && sequenceGameState.timeouts.length > 0) {
      sequenceGameState.timeouts.forEach(t => clearTimeout(t));
      sequenceGameState.timeouts = [];
    }
  }
  window.clearSimonTimeouts = clearSimonTimeouts;

  function pickRandomSimonColor() {
    const idx = Math.floor(Math.random() * SIMON_COLORS.length);
    return SIMON_COLORS[idx].id;
  }

  function updateSimonBadge() {
    const badgeEl = document.getElementById('game-sequence-badge');
    if (!badgeEl) return;
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    const recSeq = getGameRecords().sequence;
    const tpl = t.gameSeqRoundRecord || 'Rodada {0} • Recorde: {1}';
    badgeEl.innerText = tpl.replace('{0}', String(sequenceGameState.round)).replace('{1}', String(recSeq));
  }

  function setSimonStatus(mode, text) {
    const statusEl = document.getElementById('habbi-simon-status');
    if (!statusEl) return;
    statusEl.className = `habbi-simon-status-box is-${mode}`;
    statusEl.innerText = text;
  }

  function flashSimonButton(colorId, durationMs = 500, playSound = true) {
    const norm = normalizeSimonKey(colorId);
    const btn = document.querySelector(`.habbi-simon-btn[data-color="${norm}"]`) || document.getElementById(`simon-btn-${norm}`);
    const colObj = SIMON_COLORS.find(c => c.id === norm || c.alias === norm);
    if (btn) {
      btn.classList.add('is-lit');
    }
    if (playSound && colObj) {
      playSimonTone(colObj.freq, durationMs);
    }
    const tId = setTimeout(() => {
      if (btn) btn.classList.remove('is-lit');
    }, durationMs);
    sequenceGameState.timeouts.push(tId);
  }

  function setSimonButtonsEnabled(enabled) {
    const btns = document.querySelectorAll('.habbi-simon-btn');
    btns.forEach(b => {
      b.classList.toggle('disabled', !enabled);
      b.setAttribute('aria-disabled', String(!enabled));
    });
  }

  function playSimonSequence() {
    if (!userState.isGameActive) return;
    clearSimonTimeouts();
    sequenceGameState.phase = 'observing';
    setSimonButtonsEnabled(false);

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    setSimonStatus('observing', t.gameSeqObserve || 'Observe');

    // Velocidade de apresentação calma com pausas claras entre os números
    const stepDuration = 700;
    const stepGap = 450;
    const initialDelay = 600;

    sequenceGameState.sequence.forEach((colorId, idx) => {
      const delay = initialDelay + (idx * (stepDuration + stepGap));
      const tId = setTimeout(() => {
        if (!userState.isGameActive || sequenceGameState.phase !== 'observing') return;
        flashSimonButton(colorId, stepDuration, true);
      }, delay);
      sequenceGameState.timeouts.push(tId);
    });

    const totalTime = initialDelay + (sequenceGameState.sequence.length * (stepDuration + stepGap)) + 150;
    const endTId = setTimeout(() => {
      if (!userState.isGameActive || sequenceGameState.phase !== 'observing') return;
      startSimonPlayerTurn();
    }, totalTime);
    sequenceGameState.timeouts.push(endTId);
  }

  function startSimonPlayerTurn() {
    if (!userState.isGameActive) return;
    sequenceGameState.phase = 'repeating';
    sequenceGameState.playerIndex = 0;
    setSimonButtonsEnabled(true);

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    setSimonStatus('repeating', t.gameSeqYourTurn || 'Sua vez');
  }

  function handleSimonButtonPress(rawColorId) {
    if (!userState.isGameActive) return;
    if (sequenceGameState.phase !== 'repeating') return;

    const colorId = normalizeSimonKey(rawColorId);
    flashSimonButton(colorId, 280, true);

    const expectedColor = normalizeSimonKey(sequenceGameState.sequence[sequenceGameState.playerIndex]);
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

    if (colorId === expectedColor) {
      // Acerto!
      sequenceGameState.playerIndex++;
      setSimonStatus('repeating', t.gameSeqYourTurn || 'Sua vez');

      if (sequenceGameState.playerIndex >= sequenceGameState.sequence.length) {
        // Rodada concluída com sucesso!
        sequenceGameState.phase = 'success';
        setSimonButtonsEnabled(false);
        setSimonStatus('repeating', t.gameSeqSuccess || 'Perfeito!');

        sequenceGameState.completed++;
        sequenceGameState.round++;
        const isNew = saveGameRecord('sequence', sequenceGameState.completed);
        updateSimonBadge();

        const badgeEl = document.getElementById('game-sequence-badge');
        if (badgeEl && isNew && sequenceGameState.completed > 1) {
          badgeEl.classList.add('record-burst');
          setTimeout(() => badgeEl.classList.remove('record-burst'), 600);
        }

        // Aumenta a dificuldade adicionando mais um número à sequência
        sequenceGameState.sequence.push(pickRandomSimonColor());

        const nextTId = setTimeout(() => {
          if (userState.isGameActive) {
            playSimonSequence();
          }
        }, 850);
        sequenceGameState.timeouts.push(nextTId);
      }
    } else {
      // Erro suave sem tela de derrota ou interrupção
      sequenceGameState.phase = 'error';
      setSimonButtonsEnabled(false);
      setSimonStatus('error', t.gameSeqSoftError || 'Tudo bem! Nova sequência...');
      playSimonTone(196, 320); // som grave suave

      // Reinicia automaticamente uma nova sequência curta (2 números)
      sequenceGameState.round = 1;
      sequenceGameState.sequence = [pickRandomSimonColor(), pickRandomSimonColor()];
      sequenceGameState.playerIndex = 0;
      updateSimonBadge();

      const resetTId = setTimeout(() => {
        if (userState.isGameActive) {
          playSimonSequence();
        }
      }, 1200);
      sequenceGameState.timeouts.push(resetTId);
    }
  }
  window.handleSimonButtonPress = handleSimonButtonPress;
  window.sequenceGameState = sequenceGameState;

  function startSequenceGame(keepScore = false) {
    const boardWrapper = document.getElementById('game-sequence-board');
    if (!boardWrapper) return;

    clearSimonTimeouts();

    if (!keepScore) {
      sequenceGameState.round = 1;
      sequenceGameState.completed = 0;
      // Começar com uma sequência de 2 números
      sequenceGameState.sequence = [pickRandomSimonColor(), pickRandomSimonColor()];
    }

    updateSimonBadge();

    // Renderiza os 4 botões grandes e arredondados com números 1 a 4
    boardWrapper.innerHTML = '';

    SIMON_COLORS.forEach(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `habbi-simon-btn ${c.colorClass} disabled`;
      btn.id = `simon-btn-${c.id}`;
      btn.dataset.color = c.id;
      btn.dataset.alias = c.alias;
      btn.setAttribute('aria-label', `Número ${c.num}`);
      btn.innerHTML = `<span class="habbi-simon-btn-num" aria-hidden="true">${c.num}</span>`;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleSimonButtonPress(c.id);
      });
      boardWrapper.appendChild(btn);
    });

    // Inicia a reprodução da sequência
    const startTId = setTimeout(() => {
      if (userState.isGameActive) {
        playSimonSequence();
      }
    }, 450);
    sequenceGameState.timeouts.push(startTId);
  }
  window.startSequenceGame = startSequenceGame;

  // Minigame 3: Jogo do Reflexo com Folhas Ilustradas do Habbi (Infinito)
  let reflexGameState = {
    count: 0,
    idleTimer: null
  };

  function startReflexGame() {
    const board = document.getElementById('game-reflex-board');
    if (!board) return;
    board.innerHTML = '';

    const silImg = document.createElement('img');
    silImg.className = 'reflex-board-bg-silhouette';
    silImg.src = 'assets/patinha_icon.png';
    silImg.alt = '';
    silImg.setAttribute('aria-hidden', 'true');
    board.appendChild(silImg);
    
    reflexGameState.count = 0;
    if (reflexGameState.idleTimer) {
      clearTimeout(reflexGameState.idleTimer);
      reflexGameState.idleTimer = null;
    }

    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'game-score-badge';
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '12px';
    scoreDisplay.style.right = '12px';
    scoreDisplay.style.zIndex = '10';
    const recRef = getGameRecords().reflex;
    scoreDisplay.innerText = `${formatGameScore('gameScoreLeaves', reflexGameState.count)} • ${getGameRecordWord()}: ${recRef}`;
    board.appendChild(scoreDisplay);

    const spawnTarget = () => {
      if (currentScreen !== 15 || !userState.isGameActive) return;

      if (reflexGameState.idleTimer) {
        clearTimeout(reflexGameState.idleTimer);
        reflexGameState.idleTimer = null;
      }

      const oldTargets = board.querySelectorAll('.reflex-leaf-target');
      oldTargets.forEach(t => t.remove());

      const target = document.createElement('div');
      target.className = 'reflex-leaf-target';

      // Dimensões do alvo e limites da área jogável (folha ampliada sem moldura)
      const targetWidth = 100;
      const targetHeight = 78;
      const boardWidth = board.clientWidth || 340;
      const boardHeight = board.clientHeight || 440;

      const maxX = Math.max(16, boardWidth - targetWidth - 16);
      const maxY = Math.max(50, boardHeight - targetHeight - 16);

      const posX = Math.floor(Math.random() * (maxX - 16)) + 16;
      const posY = Math.floor(Math.random() * (maxY - 50)) + 50; // Evita sobrepor o score badge

      target.style.left = `${posX}px`;
      target.style.top = `${posY}px`;
      target.innerHTML = '<img src="assets/folha_icon.png" class="reflex-leaf-img" alt="Folha Habbi" onerror="this.onerror=null;this.src=\'assets/ilustracoes/png folha.png\';">';

      let clicked = false;
      const handleTap = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (clicked) return;
        clicked = true;
        reflexGameState.count++;
        const isNew = saveGameRecord('reflex', reflexGameState.count);
        const curRec = getGameRecords().reflex;
        scoreDisplay.innerText = `${formatGameScore('gameScoreLeaves', reflexGameState.count)} • ${getGameRecordWord()}: ${curRec}`;
        if (isNew && reflexGameState.count > 1) {
          scoreDisplay.classList.add('record-burst');
          setTimeout(() => scoreDisplay.classList.remove('record-burst'), 600);
        }
        target.style.transform = 'scale(0.85)';
        setTimeout(() => {
          spawnTarget();
        }, 120);
      };

      target.addEventListener('pointerdown', handleTap);

      board.appendChild(target);

      // Reposiciona continuamente se o usuário ficar inativo
      reflexGameState.idleTimer = setTimeout(() => {
        if (currentScreen === 15 && userState.isGameActive) {
          spawnTarget();
        }
      }, 3200);
    };

    // Timeout para garantir que o container já possui dimensões renderizadas
    setTimeout(() => {
      spawnTarget();
    }, 60);
  }

  // Minigame 4: Matemática Básica com Operações Variadas e Correção Imediata (Infinito)
  let mathGameState = {
    score: 0,
    round: 1
  };

  function startMathGame() {
    const container = document.getElementById('game-math-board');
    if (!container) return;
    container.innerHTML = '';
    
    mathGameState.score = 0;
    mathGameState.round = 1;

    const layout = document.createElement('div');
    layout.className = 'math-game-layout';

    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'game-score-badge';
    const recMath = getGameRecords().math;
    scoreDisplay.innerText = `${formatGameScore('gameScoreMath', mathGameState.score, mathGameState.round)} • ${getGameRecordWord()}: ${recMath}`;
    layout.appendChild(scoreDisplay);

    const questionDisplay = document.createElement('div');
    questionDisplay.className = 'math-question-card';
    layout.appendChild(questionDisplay);

    const correctionBanner = document.createElement('div');
    correctionBanner.className = 'math-correction-banner';
    correctionBanner.style.display = 'none';
    layout.appendChild(correctionBanner);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'math-options-container';
    layout.appendChild(optionsContainer);

    container.appendChild(layout);

    let isProcessing = false;

    const generateQuestion = () => {
      if (currentScreen !== 15 || !userState.isGameActive) return;
      isProcessing = false;
      correctionBanner.style.display = 'none';
      questionDisplay.style.display = 'flex';

      const operations = ['+', '-', '×', '÷'];
      const op = operations[Math.floor(Math.random() * operations.length)];
      let num1, num2, answer;

      if (op === '+') {
        num1 = Math.floor(Math.random() * 24) + 2;
        num2 = Math.floor(Math.random() * 24) + 2;
        answer = num1 + num2;
      } else if (op === '-') {
        num1 = Math.floor(Math.random() * 25) + 12;
        num2 = Math.floor(Math.random() * (num1 - 3)) + 2;
        answer = num1 - num2;
      } else if (op === '×') {
        num1 = Math.floor(Math.random() * 9) + 2;
        num2 = Math.floor(Math.random() * 9) + 2;
        answer = num1 * num2;
      } else {
        // Divisão exata e limpa
        num2 = Math.floor(Math.random() * 8) + 2; // Divisor (2 a 9)
        answer = Math.floor(Math.random() * 9) + 2; // Quociente (2 a 10)
        num1 = num2 * answer;
      }

      questionDisplay.innerText = `${num1} ${op} ${num2} = ?`;

      const options = [answer];
      while (options.length < 3) {
        const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
        const candidate = answer + delta;
        if (candidate >= 0 && !options.includes(candidate)) {
          options.push(candidate);
        }
      }
      options.sort(() => Math.random() - 0.5);

      optionsContainer.innerHTML = '';
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'math-option-btn';
        btn.innerText = opt;

        btn.addEventListener('click', () => {
          if (isProcessing) return;
          isProcessing = true;

          if (opt === answer) {
            mathGameState.score++;
            mathGameState.round++;
            const isNew = saveGameRecord('math', mathGameState.score);
            const curRec = getGameRecords().math;
            scoreDisplay.innerText = `${formatGameScore('gameScoreMath', mathGameState.score, mathGameState.round)} • ${getGameRecordWord()}: ${curRec}`;
            if (isNew && mathGameState.score > 1) {
              scoreDisplay.classList.add('record-burst');
              setTimeout(() => scoreDisplay.classList.remove('record-burst'), 600);
            }
            btn.style.backgroundColor = '#ECFDF5';
            btn.style.borderColor = '#10B981';
            btn.style.color = '#065F46';
            setTimeout(() => {
              generateQuestion();
            }, 300);
          } else {
            // Ao errar, mostrar brevemente a resposta correta (ex: 8 × 3 = 24) antes da próxima conta
            btn.style.backgroundColor = '#FEF2F2';
            btn.style.borderColor = '#EF4444';
            btn.style.color = '#991B1B';

            correctionBanner.innerText = `${num1} ${op} ${num2} = ${answer}`;
            correctionBanner.style.display = 'block';

            mathGameState.round++;
            const curRec = getGameRecords().math;
            scoreDisplay.innerText = `${formatGameScore('gameScoreMath', mathGameState.score, mathGameState.round)} • ${getGameRecordWord()}: ${curRec}`;

            setTimeout(() => {
              generateQuestion();
            }, 1250);
          }
        });

        optionsContainer.appendChild(btn);
      });
    };

    generateQuestion();
  }

  // Game Play selectors
  function playInlineGame(gameType) {
    // Impede toque fantasma ao abrir Minijogos a partir de Ferramentas ou SOS
    if (window._screen15EntryTime && (Date.now() - window._screen15EntryTime) < 280) {
      return;
    }
    userState.isGameActive = true;
    const menuEl = document.getElementById('minijogos-menu-list');
    const panelEl = document.getElementById('game-execution-panel');
    const instructionsEl = document.getElementById('game-instructions');
    const boardEl = document.getElementById('game-board-container');

    if (!menuEl || !panelEl || !boardEl) return;

    menuEl.style.display = 'none';
    panelEl.style.display = 'flex';
    boardEl.innerHTML = '';

    const bgSilEl = document.getElementById('game-screen-bg-silhouette');
    const silhouetteMap = {
      memory: 'assets/memoria_icon.png',
      sequence: 'assets/sequencia_icon.png',
      math: 'assets/matematica_icon.png',
      reflex: 'assets/patinha_icon.png'
    };
    if (bgSilEl) {
      bgSilEl.src = silhouetteMap[gameType] || 'assets/folha_icon.png';
      bgSilEl.style.display = 'block';
    }

    if (gameType === 'memory') {
      if (instructionsEl && instructionsEl.parentElement) instructionsEl.parentElement.style.display = '';
      instructionsEl.innerText = 'Encontre os pares dos gatinhos Habbi.';
      boardEl.innerHTML = '<div id="game-memory-board" class="memory-grid"></div>';
      startMemoryGame();
    } else if (gameType === 'sequence') {
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
      if (instructionsEl && instructionsEl.parentElement) instructionsEl.parentElement.style.display = 'none';
      instructionsEl.innerText = t.gameSeqInstruction || 'Memorize a sequência e repita na mesma ordem.';
      const isMuted = isSimonAudioMuted();
      const soundLbl = isMuted ? (t.gameSeqSoundOff || 'Sem som') : (t.gameSeqSoundOn || 'Som ativado');
      boardEl.innerHTML = `
        <div class="habbi-simon-layout">
          <div class="habbi-simon-top-bar">
            <div class="game-score-badge" id="game-sequence-badge">Rodada 1 • Recorde: 0</div>
            <button type="button" class="habbi-simon-sound-btn" id="btn-seq-sound-toggle" onclick="toggleSimonSound()" aria-label="${soundLbl}">
              <span id="simon-sound-icon" aria-hidden="true">${isMuted ? '🔇' : '🔊'}</span>
            </button>
          </div>
          <div class="habbi-simon-status-box is-observing" id="habbi-simon-status" aria-live="polite">${escapeHtml(t.gameSeqObserve || 'Observe')}</div>
          <div class="habbi-simon-grid" id="game-sequence-board" role="group" aria-label="${escapeHtml(t.gameSeqTitle || 'Sequência')}"></div>
        </div>
      `;
      startSequenceGame();
    } else if (gameType === 'reflex') {
      if (instructionsEl && instructionsEl.parentElement) instructionsEl.parentElement.style.display = '';
      instructionsEl.innerText = 'Toque nas folhas do Habbi conforme aparecem.';
      boardEl.innerHTML = '<div id="game-reflex-board" class="reflex-board"></div>';
      startReflexGame();
    } else if (gameType === 'math') {
      if (instructionsEl && instructionsEl.parentElement) instructionsEl.parentElement.style.display = '';
      instructionsEl.innerText = 'Resolva os cálculos e mantenha o foco.';
      boardEl.innerHTML = '<div id="game-math-board" style="width: 100%;"></div>';
      startMathGame();
    }
  }

  function resetMinigamesUI() {
    userState.isGameActive = false;
    const instructionsEl = document.getElementById('game-instructions');
    if (instructionsEl && instructionsEl.parentElement) instructionsEl.parentElement.style.display = '';
    if (typeof clearSimonTimeouts === 'function') {
      clearSimonTimeouts();
    }
    if (typeof reflexGameState !== 'undefined' && reflexGameState && reflexGameState.idleTimer) {
      clearTimeout(reflexGameState.idleTimer);
      reflexGameState.idleTimer = null;
    }
    const menuEl = document.getElementById('minijogos-menu-list');
    const panelEl = document.getElementById('game-execution-panel');
    const bgSilEl = document.getElementById('game-screen-bg-silhouette');
    const boardEl = document.getElementById('game-board-container');
    if (menuEl) menuEl.style.display = '';
    if (panelEl) panelEl.style.display = 'none';
    if (bgSilEl) bgSilEl.style.display = 'none';
    if (boardEl) boardEl.innerHTML = '';
  }

  function quitInlineGame() {
    resetMinigamesUI();
    if (typeof updateMinigamesRecordUI === 'function') {
      updateMinigamesRecordUI();
    }
  }
  window.quitInlineGame = quitInlineGame;

  // Navegação e Seleção do Calendário Dinâmico (Screen 16)
  window.changeCalendarMonth = function(delta) {
    let m = userState.calViewMonth + delta;
    let y = userState.calViewYear;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    while (m > 11) {
      m -= 12;
      y += 1;
    }
    const now = new Date();
    const todayKey = getDateKey(now);
    // Bloqueia avançar para meses totalmente futuros
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) {
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
      if (typeof showToast === 'function') showToast(t.futureDateBlocked || 'Não é possível registrar em datas futuras.');
      return;
    }

    userState.calViewMonth = m;
    userState.calViewYear = y;

    if (y === now.getFullYear() && m === now.getMonth()) {
      userState.calSelectedDate = todayKey;
    } else {
      const candidateKey = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      userState.calSelectedDate = candidateKey > todayKey ? todayKey : candidateKey;
    }
    userState.calEventsExpandedDate = null;
    generateCalendar(true);
  };

  window.resetCalendarToToday = function() {
    const now = new Date();
    userState.calViewYear = now.getFullYear();
    userState.calViewMonth = now.getMonth();
    userState.calSelectedDate = getDateKey(now);
    userState.calEventsExpandedDate = null;
    generateCalendar(true);
  };

  window.selectCalendarDate = function(dateKey, animatePaw, shouldRestoreFocus = false) {
    if (!dateKey) return;
    const todayKey = getDateKey(new Date());
    if (dateKey > todayKey) {
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
      if (typeof showToast === 'function') showToast(t.futureDateBlocked || 'Não é possível registrar em datas futuras.');
      return;
    }
    const grid = document.getElementById('calendar-month-grid');
    const focusInsideGrid = Boolean(grid && document.activeElement && grid.contains(document.activeElement));
    const { year, month } = parseDateKey(dateKey);
    userState.calViewYear = year;
    userState.calViewMonth = month;
    userState.calSelectedDate = dateKey;
    userState.calEventsExpandedDate = null;
    generateCalendar(Boolean(animatePaw));
    if (shouldRestoreFocus || focusInsideGrid) {
      const nextGrid = document.getElementById('calendar-month-grid');
      const targetBtn = nextGrid ? nextGrid.querySelector(`button[data-date-key="${dateKey}"]`) : null;
      if (targetBtn && !targetBtn.disabled) {
        targetBtn.focus();
      }
    }
  };

  function generateCalendar(animatePaw) {
    const grid = document.getElementById('calendar-month-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const now = new Date();
    const todayKey = getDateKey(now);

    if (typeof userState.calViewYear !== 'number' || typeof userState.calViewMonth !== 'number') {
      userState.calViewYear = now.getFullYear();
      userState.calViewMonth = now.getMonth();
    }
    if (!userState.calSelectedDate || userState.calSelectedDate > todayKey) {
      userState.calSelectedDate = todayKey;
    }

    const viewYear = userState.calViewYear;
    const viewMonth = userState.calViewMonth;

    // 1. Atualiza título do cabeçalho ("Novembro de 2026") e botão rápido "Hoje"
    const titleEl = document.getElementById('wl-cal-month-title');
    if (titleEl) {
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      titleEl.innerText = activeLang === 'EN'
        ? `${getMonthNamePt(viewMonth)} ${viewYear}`
        : `${getMonthNamePt(viewMonth)} de ${viewYear}`;
    }
    const todayBtn = document.getElementById('wl-cal-today-btn');
    if (todayBtn) {
      const isCurrentMonthAndToday =
        viewYear === now.getFullYear() &&
        viewMonth === now.getMonth() &&
        userState.calSelectedDate === todayKey;
      todayBtn.style.display = isCurrentMonthAndToday ? 'none' : 'inline-flex';
    }

    // 2. Cálculo dinâmico do mês (Domingo = 0 ... Sábado = 6, incluindo anos bissextos)
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;

    const activeLangCal = (userState.currentLang || 'PT').toUpperCase();
    const tCal = (window.HABBI_I18N && window.HABBI_I18N[activeLangCal]) ? window.HABBI_I18N[activeLangCal] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevKey = `${prevMonthYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      const isFuture = prevKey > todayKey;
      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = `calendar-grid-day is-outside${isFuture ? ' is-future' : ''}`;
      dayEl.dataset.dateKey = prevKey;
      dayEl.setAttribute('aria-label', `${prevDay} ${getMonthNamePt(prevMonthIdx)} ${prevMonthYear}`);
      dayEl.innerHTML = `<span class="calendar-grid-circle state-outside">${prevDay}</span>`;
      if (isFuture) {
        dayEl.disabled = true;
        dayEl.setAttribute('aria-disabled', 'true');
      } else {
        dayEl.addEventListener('click', () => window.selectCalendarDate(prevKey, true, true));
      }
      grid.appendChild(dayEl);
    }

    // 3. Dias do mês atual com estados visuais sólidos
    for (let day = 1; day <= daysInMonth; day++) {
      const dKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = getDayStatus(dKey);
      const dayRec = userState.dailyRecords[dKey];
      const dayHasEvents = Boolean(dayRec && Array.isArray(dayRec.events) && dayRec.events.length > 0);
      const isToday = dKey === todayKey;
      const isFuture = dKey > todayKey;
      const isSelected = !isFuture && dKey === userState.calSelectedDate;

      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = 'calendar-grid-day';
      dayEl.dataset.dateKey = dKey;
      if (isToday) {
        dayEl.classList.add('is-today');
        dayEl.setAttribute('aria-current', 'date');
      }
      if (isSelected) dayEl.classList.add('is-selected');
      if (isFuture) {
        dayEl.classList.add('is-future');
        dayEl.disabled = true;
        dayEl.setAttribute('aria-disabled', 'true');
      }

      const statusDesc = isFuture
        ? (tCal.calStatusFuture || 'Data futura bloqueada')
        : (status === 'green'
          ? (tCal.calStatusMet || 'Meta atingida')
          : status === 'exceeded'
            ? (tCal.calStatusExceeded || 'Meta ultrapassada')
            : status === 'zero'
              ? (tCal.calStatusZero || 'Sem consumo')
              : (dayHasEvents
                ? (tCal.calStatusInProgress || 'Em andamento')
                : (tCal.calStatusNoLogs || 'Sem registros')));
      const todayWord = tCal.calTodayWord || 'Hoje';
      dayEl.setAttribute('aria-label', `${day} ${getMonthNamePt(viewMonth)} ${viewYear}, ${statusDesc}${isToday ? ` (${todayWord})` : ''}`);

      const circle = document.createElement('span');
      const circleState = isFuture
        ? 'neutral'
        : (status === 'neutral' && dayHasEvents ? 'in-progress' : status);
      circle.className = `calendar-grid-circle state-${circleState}`;
      circle.innerText = day;

      dayEl.appendChild(circle);
      if (isToday) {
        const todayDot = document.createElement('i');
        todayDot.className = 'wl-cal-today-dot';
        todayDot.setAttribute('aria-hidden', 'true');
        dayEl.appendChild(todayDot);
      }

      if (!isFuture) {
        dayEl.addEventListener('click', () => window.selectCalendarDate(dKey, true, true));
      }
      grid.appendChild(dayEl);
    }

    // 4. Preenche células restantes da última semana com o início do próximo mês
    const totalCells = firstDayOfWeek + daysInMonth;
    const trailingCells = (7 - (totalCells % 7)) % 7;
    const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;

    for (let nextDay = 1; nextDay <= trailingCells; nextDay++) {
      const nextKey = `${nextMonthYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
      const isFuture = nextKey > todayKey;
      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = `calendar-grid-day is-outside${isFuture ? ' is-future' : ''}`;
      dayEl.dataset.dateKey = nextKey;
      dayEl.setAttribute('aria-label', `${nextDay} ${getMonthNamePt(nextMonthIdx)} ${nextMonthYear}`);
      dayEl.innerHTML = `<span class="calendar-grid-circle state-outside">${nextDay}</span>`;
      if (isFuture) {
        dayEl.disabled = true;
        dayEl.setAttribute('aria-disabled', 'true');
      } else {
        dayEl.addEventListener('click', () => window.selectCalendarDate(nextKey, true, true));
      }
      grid.appendChild(dayEl);
    }

    // 5. Atualiza o Resumo Mensal, o Indicador Diário Integrado e a Lista do Dia Selecionado
    updateCalendarSummaryAndDetails(viewYear, viewMonth, daysInMonth, Boolean(animatePaw));
  }

  function updateCalendarSummaryAndDetails(viewYear, viewMonth, daysInMonth) {
    let monthSmokeFreeDays = 0;
    let monthGoalMetDays = 0;
    let monthUrges = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = userState.dailyRecords[dKey];
      if (!rec) continue;
      const evCount = Array.isArray(rec.events) ? rec.events.length : 0;
      if (evCount === 0) continue;
      monthUrges += rec.urges || 0;
      if (isDaySmokeFree(dKey)) {
        monthSmokeFreeDays++;
      }
      if (isDayGoalMet(dKey)) {
        monthGoalMetDays++;
      }
    }

    const statCleanEl = document.getElementById('wl-cal-stat-clean');
    const statGoalEl = document.getElementById('wl-cal-stat-goal');
    const statUrgesEl = document.getElementById('wl-cal-stat-urges');
    if (statCleanEl) statCleanEl.innerText = monthSmokeFreeDays;
    if (statGoalEl) statGoalEl.innerText = monthGoalMetDays;
    if (statUrgesEl) statUrgesEl.innerText = monthUrges;

    // Dados do dia selecionado
    const todayKey = getDateKey(new Date());
    const selKey = userState.calSelectedDate || todayKey;
    const selRec = userState.dailyRecords[selKey];
    const selStatus = getDayStatus(selKey);
    const meta = (selRec && selRec.meta) || userState.todayMeta || 11;
    const cigs = selRec ? selRec.cigs : 0;
    const hasEvents = Boolean(selRec && Array.isArray(selRec.events) && selRec.events.length > 0);

    const selDateLabelEl = document.getElementById('wl-cal-selected-date-label');
    if (selDateLabelEl) {
      selDateLabelEl.innerText = formatDayLabelPt(selKey);
    }

    // Botão "Não fumei hoje" foi movido para dentro da aba de registro — sem referências diretas no calendário

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

    const goalPillEl = document.getElementById('wl-cal-daily-goal-pill');
    const goalBarFillEl = document.getElementById('wl-cal-goal-bar-fill');
    const goalBarOverEl = document.getElementById('wl-cal-goal-bar-over');

    if (goalPillEl && goalBarFillEl) {
      goalPillEl.className = 'wl-cal-goal-pill';
      goalBarFillEl.className = 'wl-cal-goal-bar-fill';
      if (goalBarOverEl) goalBarOverEl.style.width = '0%';

      if (!hasEvents) {
        goalPillEl.classList.add('neutral');
        goalPillEl.innerText = (t.calGoalNoLogs || 'Sem registros • Meta {0}/dia').replace('{0}', meta);
        goalBarFillEl.classList.add('neutral');
        goalBarFillEl.style.width = '0%';
      } else if (selStatus === 'exceeded') {
        const exceededCount = Math.max(1, cigs - meta);
        const greenPct = Math.round((meta / Math.max(1, cigs)) * 100);
        const pinkPct = Math.max(8, 100 - greenPct);
        goalPillEl.classList.add('pink');
        goalPillEl.innerText = (t.calGoalExceeded || '{0} / {1} cigarros • +{2} acima da meta')
          .replace('{0}', cigs)
          .replace('{1}', meta)
          .replace('{2}', exceededCount);
        goalBarFillEl.classList.add('green');
        goalBarFillEl.style.width = `${100 - pinkPct}%`;
        if (goalBarOverEl) goalBarOverEl.style.width = `${pinkPct}%`;
      } else if (selStatus === 'neutral') {
        const pctUsed = Math.min(100, Math.round((cigs / Math.max(1, meta)) * 100));
        goalPillEl.classList.add('neutral');
        goalPillEl.innerText = (t.calGoalInProgress || '{0} / {1} cigarros • Em andamento')
          .replace('{0}', cigs)
          .replace('{1}', meta);
        goalBarFillEl.classList.add('neutral');
        goalBarFillEl.style.width = `${pctUsed}%`;
      } else {
        // selStatus === 'green' (dia concluído dentro da meta)
        const pctUsed = Math.min(100, Math.round((cigs / Math.max(1, meta)) * 100));
        goalPillEl.classList.add('green');
        goalPillEl.innerText = (cigs === 0)
          ? (t.calGoalSmokeFree || '0 / {0} cigarros • Sem fumar').replace('{0}', meta)
          : (t.calGoalWithin || '{0} / {1} cigarros • Dentro da meta').replace('{0}', cigs).replace('{1}', meta);
        goalBarFillEl.classList.add('green');
        goalBarFillEl.style.width = (cigs === 0) ? '100%' : `${pctUsed}%`;
      }
    }

    // Lista compacta dos registros da data selecionada: mostra o último e permite abrir o restante
    const eventsWrap = document.getElementById('wl-cal-day-events-wrap');
    if (eventsWrap) {
      eventsWrap.innerHTML = '';
      const visibleDayEvents = (selRec && Array.isArray(selRec.events))
        ? selRec.events.filter(ev => ev.kind !== 'day-complete')
        : [];
      const barTrackEl = document.querySelector('#wl-cal-summary-card .wl-cal-goal-bar-track');
      if (visibleDayEvents.length === 0) {
        eventsWrap.style.display = 'none';
        if (barTrackEl) barTrackEl.style.marginBottom = '0';
      } else {
        eventsWrap.style.display = 'flex';
        if (barTrackEl) barTrackEl.style.marginBottom = '10px';

        const createEventRowEl = (ev) => {
          let dotClass = 'green';
          let rowStateClass = '';
          if (ev.kind === 'smoke') {
            const isOver = Boolean(ev.isExceeded || (typeof ev.cigNumber === 'number' && ev.cigNumber > meta));
            dotClass = isOver ? 'pink' : 'green';
            rowStateClass = isOver ? 'is-exceeded' : 'is-within-meta';
          } else if (ev.kind === 'urge' || ev.kind === 'sos' || ev.kind === 'mood') {
            dotClass = 'blue';
          }
          const subText = ev.clock || ev.time || '';
          const item = document.createElement('div');
          item.className = `wl-cal-event-row ${rowStateClass}`.trim();

          const mainEl = document.createElement('div');
          mainEl.className = 'wl-cal-event-main';

          const dotEl = document.createElement('i');
          dotEl.className = `wl-cal-event-dot ${dotClass}`;

          const textsEl = document.createElement('div');
          textsEl.className = 'wl-cal-event-texts';

          const titleColEl = document.createElement('div');
          titleColEl.className = 'wl-cal-event-title-col';

          const localizedEv = getLocalizedEventDisplay(ev, meta, t);

          const strongEl = document.createElement('strong');
          strongEl.textContent = localizedEv.title;
          titleColEl.appendChild(strongEl);

          if (ev.kind === 'mood' && localizedEv.subdesc) {
            const subDescEl = document.createElement('small');
            subDescEl.className = 'wl-cal-event-subdesc';
            subDescEl.textContent = localizedEv.subdesc;
            titleColEl.appendChild(subDescEl);
          }

          const timeSpanEl = document.createElement('span');
          timeSpanEl.textContent = String(subText);

          textsEl.appendChild(titleColEl);
          textsEl.appendChild(timeSpanEl);
          mainEl.appendChild(dotEl);
          mainEl.appendChild(textsEl);

          const actionsEl = document.createElement('div');
          actionsEl.className = 'wl-cal-event-actions';

          // Decisão 5A: botão Editar exibido apenas para eventos de humor (mood)
          const evTitleContext = String(strongEl.textContent || ev.title || '').trim();
          if (ev.kind === 'mood') {
            const editLabel = t.calEventEdit || 'Editar';
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'wl-cal-ev-btn';
            editBtn.title = editLabel;
            editBtn.setAttribute('aria-label', evTitleContext ? `${editLabel}: ${evTitleContext}` : editLabel);
            editBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>';
            const editSpan = document.createElement('span');
            editSpan.textContent = editLabel;
            editBtn.appendChild(editSpan);
            editBtn.addEventListener('click', () => {
              if (typeof window.editHabbiEvent === 'function') {
                window.editHabbiEvent(selKey, ev.id);
              }
            });
            actionsEl.appendChild(editBtn);
          }

          const removeLabel = t.calEventRemove || 'Remover';
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'wl-cal-ev-btn danger';
          removeBtn.title = removeLabel;
          removeBtn.setAttribute('aria-label', evTitleContext ? `${removeLabel}: ${evTitleContext}` : removeLabel);
          removeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
          const removeSpan = document.createElement('span');
          removeSpan.textContent = removeLabel;
          removeBtn.appendChild(removeSpan);
          removeBtn.addEventListener('click', () => {
            if (typeof window.deleteHabbiEvent === 'function') {
              window.deleteHabbiEvent(selKey, ev.id);
            }
          });

          actionsEl.appendChild(removeBtn);

          item.appendChild(mainEl);
          item.appendChild(actionsEl);
          return item;
        };

        // Renderiza o último registro (mais recente)
        eventsWrap.appendChild(createEventRowEl(visibleDayEvents[0]));

        // Se houver mais registros, cria a seção expansível para não lotar a tela de cara
        if (visibleDayEvents.length > 1) {
          const remainingCount = visibleDayEvents.length - 1;
          const isExpanded = userState.calEventsExpandedDate === selKey;

          const moreContainer = document.createElement('div');
          moreContainer.id = 'wl-cal-more-events';
          moreContainer.style.display = isExpanded ? 'flex' : 'none';
          moreContainer.style.flexDirection = 'column';
          moreContainer.style.gap = '6px';

          for (let i = 1; i < visibleDayEvents.length; i++) {
            moreContainer.appendChild(createEventRowEl(visibleDayEvents[i]));
          }
          eventsWrap.appendChild(moreContainer);

          const noun = remainingCount === 1 ? (t.calSeeMoreSingular || 'registro') : (t.calSeeMorePlural || 'registros');
          const seeMoreText = (t.calSeeMoreLogs || 'Ver outros {0} {1}')
            .replace('{0}', remainingCount)
            .replace('{1}', noun);
          const showLessText = t.calShowLess || 'Mostrar menos';

          const toggleBtn = document.createElement('button');
          toggleBtn.type = 'button';
          toggleBtn.id = 'wl-cal-toggle-events-btn';
          toggleBtn.className = `wl-cal-toggle-events-btn ${isExpanded ? 'is-expanded' : ''}`.trim();
          toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
          toggleBtn.setAttribute('aria-controls', 'wl-cal-more-events');
          toggleBtn.innerHTML = `
            <span id="wl-cal-toggle-events-txt">${isExpanded ? showLessText : seeMoreText}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="6 9 12 15 18 9"></polyline></svg>
          `;
          toggleBtn.onclick = function() {
            const currentlyOpen = moreContainer.style.display === 'flex';
            if (currentlyOpen) {
              moreContainer.style.display = 'none';
              toggleBtn.classList.remove('is-expanded');
              toggleBtn.setAttribute('aria-expanded', 'false');
              document.getElementById('wl-cal-toggle-events-txt').innerText = seeMoreText;
              userState.calEventsExpandedDate = null;
            } else {
              moreContainer.style.display = 'flex';
              toggleBtn.classList.add('is-expanded');
              toggleBtn.setAttribute('aria-expanded', 'true');
              document.getElementById('wl-cal-toggle-events-txt').innerText = showLessText;
              userState.calEventsExpandedDate = selKey;
            }
          };
          eventsWrap.appendChild(toggleBtn);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Router Event Listeners
  // -------------------------------------------------------------
  
  // Sidebar menu binding
  sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen(parseInt(item.dataset.screen));
    });
  });

  window.goToScreen = function(screenNum) {
    showScreen(screenNum);
  };
  window.showScreen = showScreen;

  // ==========================================================================
  // SOS HUB & FEEDBACK LOGIC
  // ==========================================================================
  let sosTimerInterval = null;
  let sosTimerRemaining = 300;
  let sosTimerRunning = false;
  let sosTimerStarted = false;

  const SOS_TIMER_TIPS = [
    'A vontade atinge o pico em 3 minutos e logo diminui. Respire com calma.',
    'Cada minuto que você adia enfraquece o caminho do hábito no seu cérebro.',
    'Beba um gole de água devagar ou alongue o corpo.',
    'Você já venceu muitos desafios. Esse é só mais um momento passageiro.',
    'A fissura é como uma onda: ela sobe, atinge o topo e se desfaz.'
  ];

  window.isSosTimerActive = function() {
    return Boolean(sosTimerRunning);
  };
  window.playInlineGame = playInlineGame;
  window.quitInlineGame = quitInlineGame;

  window.toggleSosTimer = function() {
    if (sosTimerRunning) {
      window.pauseSosTimer();
    } else {
      window.startSosTimer();
    }
  };

  window.startSosTimer = function() {
    sosTimerStarted = true;
    sosTimerRunning = true;
    window.updateSosTimerUI();
    clearInterval(sosTimerInterval);
    sosTimerInterval = setInterval(() => {
      if (sosTimerRemaining > 0) {
        sosTimerRemaining--;
        window.updateSosTimerUI();
      } else {
        clearInterval(sosTimerInterval);
        sosTimerRunning = false;
        sosTimerStarted = false;
        sosTimerRemaining = 300;
        window.updateSosTimerUI();
        window.openSosFeedbackModal();
      }
    }, 1000);
  };

  window.pauseSosTimer = function() {
    sosTimerRunning = false;
    clearInterval(sosTimerInterval);
    window.updateSosTimerUI();
  };

  window.resetSosTimer = function() {
    sosTimerRunning = false;
    sosTimerStarted = false;
    clearInterval(sosTimerInterval);
    sosTimerRemaining = 300;
    window.updateSosTimerUI();
  };

  window.updateSosTimerUI = function() {
    const displayEl = document.getElementById('wl-sos-timer-display');
    const msgEl = document.getElementById('wl-sos-timer-msg');
    const barEl = document.getElementById('wl-sos-timer-bar');
    const startBtn = document.getElementById('btn-sos-timer-start');
    const activeControls = document.getElementById('wl-sos-active-controls');
    const btnTextEl = document.getElementById('wl-sos-timer-btn-text');
    const playIcon = document.getElementById('wl-sos-timer-icon-play');
    const pauseIcon = document.getElementById('wl-sos-timer-icon-pause');
    const subtagEl = document.getElementById('wl-sos-timer-subtag');

    const mins = Math.floor(sosTimerRemaining / 60);
    const secs = sosTimerRemaining % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (displayEl) displayEl.innerText = formatted;
    if (subtagEl) {
      subtagEl.innerText = sosTimerRunning ? `${formatted} restante` : (sosTimerRemaining === 300 ? '5 minutos' : `${formatted} pausado`);
    }

    if (barEl) {
      const pct = Math.max(0, Math.min(100, Math.round((sosTimerRemaining / 300) * 100)));
      barEl.style.width = `${pct}%`;
    }

    if (startBtn && activeControls) {
      if (!sosTimerStarted) {
        startBtn.style.display = 'block';
        activeControls.style.display = 'none';
      } else {
        startBtn.style.display = 'none';
        activeControls.style.display = 'flex';
      }
    }

    if (btnTextEl) {
      btnTextEl.innerText = sosTimerRunning ? 'Pausar' : 'Continuar';
    }

    if (playIcon && pauseIcon) {
      playIcon.style.display = sosTimerRunning ? 'none' : 'block';
      pauseIcon.style.display = sosTimerRunning ? 'block' : 'none';
    }

    if (msgEl) {
      const tipIdx = Math.min(SOS_TIMER_TIPS.length - 1, Math.floor((300 - sosTimerRemaining) / 60));
      msgEl.innerText = SOS_TIMER_TIPS[tipIdx];
    }
  };

  // Modais de Apoio (Água, Preciso de Alguém e Feedback)
  window.openSosWaterModal = function() {
    const m = document.getElementById('wl-sos-water-modal');
    if (m) m.classList.add('is-open');
  };
  window.closeSosWaterModal = function() {
    const m = document.getElementById('wl-sos-water-modal');
    if (m) m.classList.remove('is-open');
  };
  window.finishWaterAction = function() {
    window.closeSosWaterModal();
    window.openSosFeedbackModal();
  };

  window.openSosSupportModal = function() {
    const m = document.getElementById('wl-sos-support-modal');
    if (m) m.classList.add('is-open');
  };
  window.closeSosSupportModal = function() {
    const m = document.getElementById('wl-sos-support-modal');
    if (m) m.classList.remove('is-open');
  };
  window.handleCvvContact = function() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = 'tel:188';
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('188').then(() => {
          showToast('Número 188 copiado! Ligue gratuitamente para apoio.');
        }).catch(() => {
          showToast('Disque 188 para falar com o CVV (ligação gratuita).');
        });
      } else {
        showToast('Disque 188 para falar com o CVV (ligação gratuita).');
      }
    }
  };

  window.copySupportMessage = function() {
    const msg = "Oi! Estou passando por um momento de vontade de fumar e lembrei de você. Pode conversar um minutinho comigo?";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(() => {
        showToast('Mensagem de apoio copiada!');
      }).catch(() => {
        showToast('Mensagem: ' + msg);
      });
    } else {
      showToast('Mensagem de apoio pronta!');
    }
  };

  window.openSosFeedbackModal = function() {
    const modal = document.getElementById('wl-sos-feedback-modal');
    if (!modal) return;
    const askStep = document.getElementById('wl-sos-feedback-step-ask');
    const resultStep = document.getElementById('wl-sos-feedback-step-result');
    if (askStep) askStep.style.display = 'block';
    if (resultStep) {
      resultStep.style.display = 'none';
      resultStep.innerHTML = '';
    }
    modal.classList.add('is-open');
  };

  window.closeSosFeedbackModal = function() {
    const modal = document.getElementById('wl-sos-feedback-modal');
    if (modal) modal.classList.remove('is-open');
  };

  window.handleSosFeedbackAnswer = function(answer) {
    const askStep = document.getElementById('wl-sos-feedback-step-ask');
    const resultStep = document.getElementById('wl-sos-feedback-step-result');
    if (!askStep || !resultStep) return;

    askStep.style.display = 'none';
    resultStep.style.display = 'block';

    const activeCode = (userState.currentLang || 'PT').toUpperCase();
    const t = (HABBI_I18N && HABBI_I18N[activeCode]) ? HABBI_I18N[activeCode] : HABBI_I18N.PT;

    if (answer === 'passou') {
      userState.totalUrgesOvercome = (userState.totalUrgesOvercome || 0) + 1;
      savePersistedState();
      recordHabbiEvent({
        dateKey: getDateKey(new Date()),
        kind: 'sos',
        title: 'Vontade superada!',
        desc: 'Pausa concluída com sucesso e fissura dissipada.'
      });

      resultStep.innerHTML = `
        <img src="assets/ilustracoes/gato_transforme_cropped.png" alt="${t.feedbackSuccessTitle}" class="wl-sos-modal-mascot" onerror="this.onerror=null;this.src='assets/ilustracoes/transforme_seus_comportamentos_.png';">
        <h2 class="wl-sos-modal-title" style="color:#15803D;">${t.feedbackSuccessTitle}</h2>
        <p class="wl-sos-modal-desc">${t.feedbackSuccessDesc}</p>
        <div class="wl-sos-modal-actions">
          <button type="button" class="wl-dark-pill-btn" onclick="closeSosFeedbackModal(); showScreen(10);">${t.feedbackSuccessBtn}</button>
        </div>
      `;
    } else if (answer === 'diminuiu') {
      resultStep.innerHTML = `
        <img src="assets/ilustracoes/gato_entenda_habitos_cropped.png" alt="${t.feedbackDecTitle}" class="wl-sos-modal-mascot" onerror="this.onerror=null;this.src='assets/ilustracoes/entenda_seus_habitos.png';">
        <h2 class="wl-sos-modal-title" style="color:#0369A1;">${t.feedbackDecTitle}</h2>
        <p class="wl-sos-modal-desc">${t.feedbackDecDesc}</p>
        <div class="wl-sos-modal-actions">
          <button type="button" class="wl-dark-pill-btn" onclick="closeSosFeedbackModal(); showScreen(10);">${t.feedbackSuccessBtn}</button>
          <button type="button" class="wl-light-pill-btn" onclick="closeSosFeedbackModal(); handleSosChoice('distrair');">${t.toolsMiniTitle}</button>
        </div>
      `;
    } else {
      resultStep.innerHTML = `
        <img src="assets/ilustracoes/gato_entenda_habitos_cropped.png" alt="${t.feedbackStillTitle}" class="wl-sos-modal-mascot" onerror="this.onerror=null;this.src='assets/ilustracoes/entenda_seus_habitos.png';">
        <h2 class="wl-sos-modal-title" style="color:#C2410C;">${t.feedbackStillTitle}</h2>
        <p class="wl-sos-modal-desc">${t.feedbackStillDesc}</p>
        <div class="wl-sos-modal-actions">
          <button type="button" class="wl-dark-pill-btn" onclick="closeSosFeedbackModal(); handleSosChoice('distrair');">${t.toolsMiniTitle}</button>
          <button type="button" class="wl-light-pill-btn" onclick="closeSosFeedbackModal(); openSosWaterModal();">${t.sosCardWater}</button>
          <button type="button" class="wl-light-pill-btn" onclick="closeSosFeedbackModal(); openSosSupportModal();">${t.sosSupportBtn}</button>
          <button type="button" class="wl-light-pill-btn" onclick="closeSosFeedbackModal(); showScreen(10);">${t.feedbackSuccessBtn}</button>
        </div>
      `;
    }
  };

  window.handleSosChoice = function(choice) {
    userState.openedFromMenu = false;
    if (choice === 'distrair') {
      if (typeof resetMinigamesUI === 'function') resetMinigamesUI();
      window._screen15EntryTime = Date.now();
      userState.minijogosMode = 'tools';
      userState.minijogosReturnScreen = 12;
      showScreen(15);
    } else if (choice === 'respirar') {
      userState.interventionReturnScreen = 12;
      userState.selectedIntervention = 'Respiração 4-6';
      showScreen(13);
    } else if (choice === 'ancoragem' || choice === 'observar') {
      userState.interventionReturnScreen = 12;
      userState.selectedIntervention = 'Ancoragem 5-4-3-2-1';
      showScreen(13);
    } else if (choice === 'agua') {
      window.openSosWaterModal();
    }
  };

  window.handleBackFromScreen = function(fromScreenNum) {
    // 0. SOS Hub (Screen 12) retorna para tela de origem ou Home
    if (fromScreenNum === 12) {
      const returnScreen = userState.sosReturnScreen || 10;
      userState.sosReturnScreen = 10;
      showScreen(returnScreen);
      return;
    }

    // 1. Sub-telas de Meu Progresso voltam para a Tela 17 preservando o fluxo
    if (fromScreenNum === 18 || fromScreenNum === 19 || fromScreenNum === 20) {
      if (userState.progressReturnScreen === 17) {
        userState.progressReturnScreen = null;
        showScreen(17);
        return;
      }
    }

    // 2. Sub-tela de Minha Conta/Editar Perfil (Tela 28) volta sempre para o Perfil (Tela 21)
    if (fromScreenNum === 28) {
      userState.accountReturnScreen = null;
      showScreen(21);
      return;
    }

    // 3. Sub-tela de Sobre o Habbi (Tela 27) volta para Configurações (Tela 22)
    if (fromScreenNum === 27) {
      showScreen(22);
      return;
    }

    // 4. Sub-tela de Avatar volta sempre para o Perfil (Tela 21)
    if (fromScreenNum === 26) {
      showScreen(21);
      return;
    }

    // 3. Telas de Login e Cadastro voltam para a tela de origem (Home por padrão, ou Calendário/Perfil)
    if (fromScreenNum === 23 || fromScreenNum === 24) {
      const returnScreen = userState.authReturnScreen || 10;
      userState.authReturnScreen = 10;
      showScreen(returnScreen);
      return;
    }

    // 4. Retorno ao Menu Lateral (Hub) apenas para as 4 telas raiz abertas diretamente pelo menu (14, 17, 21, 22)
    if (userState.openedFromMenu && (fromScreenNum === 14 || fromScreenNum === 17 || fromScreenNum === 21 || fromScreenNum === 22)) {
      userState.openedFromMenu = false;
      showScreen(10);
      setTimeout(() => {
        window.toggleHabbiHubMenu(true);
      }, 40);
      return;
    }

    // Calendário (Tela 16): retorna ao slide do carrossel de onde veio (Conquista, Home ou Minijogos)
    if (fromScreenNum === 16) {
      const returnScreen = userState.calendarReturnScreen || 10;
      userState.calendarReturnScreen = 10;
      if (returnScreen === 29 || returnScreen === 10 || returnScreen === 15) {
        userState.minijogosMode = 'carousel';
        userState.conquistaMode = 'carousel';
      }
      showScreen(returnScreen);
      return;
    }

    // Conquista / Economia (Screen 29)
    if (fromScreenNum === 29) {
      if (userState.conquistaMode === 'tools') {
        const returnScreen = userState.conquistaReturnScreen || 14;
        showScreen(returnScreen);
        return;
      }
      navigateHorizontalCarousel(10);
      return;
    }

    // Minijogos (respeita modo ferramentas, SOS ou Carrossel)
    if (fromScreenNum === 15) {
      if (userState.isGameActive) {
        quitInlineGame();
        return;
      }
      if (userState.minijogosMode === 'tools') {
        const returnScreen = userState.minijogosReturnScreen || 14;
        showScreen(returnScreen);
        return;
      }
      navigateHorizontalCarousel(10);
      return;
    }

    // 6. SOS Intervenção (retorna para SOS Hub 12 ou Ferramentas 14)
    if (fromScreenNum === 13) {
      if (breathState.timer) clearInterval(breathState.timer);
      if (breathState.sessionTimer) clearInterval(breathState.sessionTimer);
      const returnScreen = userState.interventionReturnScreen || 12;
      userState.interventionReturnScreen = 12;
      showScreen(returnScreen);
      return;
    }

    // 7. Registro de Sentimentos / Gatilhos (Tela 25)
    if (fromScreenNum === 25) {
      const returnScreen = userState.returnScreenAfterRegister || userState.moodReturnScreen || 10;
      userState.returnScreenAfterRegister = 10;
      userState.moodReturnScreen = 10;
      showScreen(returnScreen);
      return;
    }

    // 8. Histórico detalhado
    if (fromScreenNum === 19) {
      const returnScreen = userState.historyReturnScreen || 10;
      showScreen(returnScreen);
      return;
    }

    showScreen(10);
  };

  window.handleMinijogosBack = function() {
    // Decisão 4A: quando há partida ativa, volta primeiro à grade dos 4 jogos (inclusive em tools-mode)
    if (userState.isGameActive) {
      quitInlineGame();
      return;
    }
    window.handleBackFromScreen(15);
  };

  window.handleJourneyBack = function() {
    if (userState.onboardingCompleted) {
      showScreen(21);
    } else {
      showScreen(5);
    }
  };

  window.toggleAvatarSelector = function() {
    const panel = document.getElementById('avatar-selector-panel');
    if (panel) {
      if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        panel.style.display = 'none';
      }
    }
  };

  // Troca segura para uma conta (sem mesclagem automática de visitante → conta)
  function switchToAccountProfile({ email, name = '', supabaseUserId = null }) {
    const normEmail = normalizeEmail(email);
    const currentLangKeep = (userState.currentLang || 'PT').toUpperCase();

    // 1. Salva o perfil atual no próprio cofre (preserva visitante ou conta anterior intactos)
    const prevSess = loadActiveSession();
    if (prevSess && prevSess.mode !== 'signed-out' && prevSess.activeProfileId) {
      savePersistedState();
    }

    // 2. Resolve ID estável da conta alvo (por supabaseUserId ou e-mail normalizado)
    const cleanName = String(name || '').trim();
    const derivedName = cleanName || (normEmail ? (normEmail.split('@')[0].charAt(0).toUpperCase() + normEmail.split('@')[0].slice(1)) : 'Usuário Habbi');
    const targetProfileId = resolveAccountProfileId({
      supabaseUserId: supabaseUserId || null,
      email: normEmail,
      label: derivedName
    });

    // 3. Limpa memória completamente antes de carregar o cofre da conta alvo (zero vazamento/mesclagem)
    const existingSnap = loadProfileSnapshot(targetProfileId);
    resetInMemoryUserState(currentLangKeep);

    if (existingSnap) {
      applySnapshotToUserState(existingSnap, true);
      if (cleanName && (!userState.name || userState.name.toLowerCase() === 'visitante')) {
        userState.name = cleanName;
      }
      if (normEmail) {
        userState.email = normEmail;
      }
      userState.isAuthenticated = true;
    } else {
      userState.name = derivedName;
      userState.email = normEmail;
      userState.isAuthenticated = true;
      userState.currentLang = currentLangKeep;
      userState.onboardingCompleted = true;
    }

    // 4. Ativa sessão da conta e persiste exclusivamente no cofre da conta alvo
    saveActiveSession({ mode: 'account', activeProfileId: targetProfileId });
    savePersistedState();
    clearAuthFormInputs();

    if (typeof window.setTheme === 'function') {
      window.setTheme(userState.theme || 'light', true);
    }
    if (typeof window.applyAppLanguage === 'function') {
      window.applyAppLanguage(userState.currentLang || 'PT');
    }
    refreshAllViews(true);
    if (typeof window.syncOnboardingFormToUserState === 'function') {
      window.syncOnboardingFormToUserState();
    }
    return targetProfileId;
  }
  window.switchToAccountProfile = switchToAccountProfile;

  window.continueAsGuest = function() {
    const prevSess = loadActiveSession();
    if (prevSess && prevSess.mode !== 'signed-out' && prevSess.activeProfileId) {
      savePersistedState();
    }
    const guestId = ensureGuestProfile();
    saveActiveSession({ mode: 'guest', activeProfileId: guestId });
    const guestSnap = loadProfileSnapshot(guestId);
    if (guestSnap) {
      applySnapshotToUserState(guestSnap, false);
    } else {
      resetInMemoryUserState(userState.currentLang || 'PT');
      savePersistedState();
    }
    clearAuthFormInputs();
    if (typeof window.setTheme === 'function') {
      window.setTheme(userState.theme || 'light', true);
    }
    if (typeof window.applyAppLanguage === 'function') {
      window.applyAppLanguage(userState.currentLang || 'PT');
    }
    refreshAllViews(true);
    if (typeof window.syncOnboardingFormToUserState === 'function') {
      window.syncOnboardingFormToUserState();
    }
    showScreen(10);
  };

  // Onboarding Routing
  const btnWelcomeSignup = document.getElementById('btn-welcome-signup');
  if (btnWelcomeSignup) btnWelcomeSignup.addEventListener('click', () => showScreen(24));
  const btnWelcomeLogin = document.getElementById('btn-welcome-login');
  if (btnWelcomeLogin) btnWelcomeLogin.addEventListener('click', () => showScreen(23));
  const btnOnb2 = document.getElementById('btn-onboarding-2-next');
  if (btnOnb2) btnOnb2.addEventListener('click', () => showScreen(5));
  const btnOnb3 = document.getElementById('btn-onboarding-3-next');
  if (btnOnb3) btnOnb3.addEventListener('click', () => showScreen(7));

  // Login / Register Screen submit bindings (com validação e isolamento por perfil)
  const loginSubmit = document.getElementById('btn-login-submit');
  if (loginSubmit) {
    loginSubmit.addEventListener('click', () => {
      const emailInput = document.getElementById('login-email');
      const errEl = document.getElementById('login-error-msg');
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

      if (!isValidEmail(emailVal)) {
        const msg = t.loginEmailInvalid || 'Informe um e-mail válido para entrar.';
        if (errEl) {
          errEl.textContent = msg;
          errEl.style.display = 'block';
        }
        if (emailInput) emailInput.focus();
        showToast(msg);
        return;
      }
      if (errEl) {
        errEl.textContent = '';
        errEl.style.display = 'none';
      }

      switchToAccountProfile({ email: emailVal, name: '' });
      showToast('Sessão iniciada com sucesso!');
      const targetScr = userState.authReturnScreen || 10;
      userState.authReturnScreen = 10;
      showScreen(targetScr);
    });
  }

  const registerSubmit = document.getElementById('btn-register-submit');
  if (registerSubmit) {
    registerSubmit.addEventListener('click', () => {
      const nameInput = document.getElementById('register-name');
      const emailInput = document.getElementById('register-email');
      const errEl = document.getElementById('register-error-msg');
      const nameVal = nameInput ? nameInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const activeLang = (userState.currentLang || 'PT').toUpperCase();
      const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

      if (!nameVal || !isValidEmail(emailVal)) {
        const msg = t.registerFieldsInvalid || 'Informe seu nome e um e-mail válido para criar a conta.';
        if (errEl) {
          errEl.textContent = msg;
          errEl.style.display = 'block';
        }
        if (!nameVal && nameInput) nameInput.focus();
        else if (emailInput) emailInput.focus();
        showToast(msg);
        return;
      }
      if (errEl) {
        errEl.textContent = '';
        errEl.style.display = 'none';
      }

      switchToAccountProfile({ email: emailVal, name: nameVal });
      showToast('Conta criada com sucesso!');
      const targetScr = userState.authReturnScreen || 10;
      userState.authReturnScreen = 10;
      showScreen(targetScr);
    });
  }

  // Setup Routing: da tela de meta (Screen 7) vai direto para o app (Screen 10) sem enrolação
  const btnJourneySubmit = document.getElementById('btn-journey-submit');
  if (btnJourneySubmit) btnJourneySubmit.addEventListener('click', () => showScreen(7));
  const btnConfig1Submit = document.getElementById('btn-config-1-submit');
  if (btnConfig1Submit) {
    btnConfig1Submit.addEventListener('click', () => {
      ensureActiveProfileForWrite();
      const packPriceInput = document.getElementById('cigarettes-pack-price');
      if (packPriceInput) {
        const price = parseFloat(packPriceInput.value);
        if (!isNaN(price) && price > 0) {
          userState.packPrice = price;
        }
      }
      userState.habitualCigsCustomized = true;
      userState.lastGoalPromptDateKey = getDateKey(new Date());
      userState.metaExceededModalShown = false;
      userState.onboardingCompleted = true;

      const todayKey = getDateKey(new Date());
      const rec = getOrCreateDayRecord(todayKey);
      rec.meta = (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : Math.max(0, userState.habitualCigs - 1);
      userState.todayMeta = rec.meta;

      savePersistedState();
      refreshAllViews();
      // Leva direto para a Home (Screen 10) para o usuário conhecer e explorar o app primeiro
      showScreen(10);
    });
  }
  const btnMotivationsSubmit = document.getElementById('btn-motivations-submit');
  if (btnMotivationsSubmit) {
    btnMotivationsSubmit.addEventListener('click', () => showScreen(9));
  }
  const btnTriggersSubmit = document.getElementById('btn-triggers-submit');
  if (btnTriggersSubmit) {
    btnTriggersSubmit.addEventListener('click', () => {
    ensureActiveProfileForWrite();
    userState.onboardingCompleted = true;
    savePersistedState();
    const loadOv = document.getElementById('wl-loading-overlay');
    if (loadOv) {
      loadOv.style.display = 'flex';
      const p1Bar = document.getElementById('wl-p1-bar');
      const p2Bar = document.getElementById('wl-p2-bar');
      const p3Bar = document.getElementById('wl-p3-bar');
      const p1Txt = document.getElementById('wl-p1-txt');
      const p2Txt = document.getElementById('wl-p2-txt');
      const p3Txt = document.getElementById('wl-p3-txt');
      if (p1Bar) { p1Bar.style.width = '72%'; p1Txt.innerText = '72%'; }
      if (p2Bar) { p2Bar.style.width = '0%'; p2Txt.innerText = '0%'; }
      if (p3Bar) { p3Bar.style.width = '0%'; p3Txt.innerText = '0%'; }
      setTimeout(() => {
        if (p1Bar) { p1Bar.style.width = '100%'; p1Txt.innerText = '100%'; }
        if (p2Bar) { p2Bar.style.width = '85%'; p2Txt.innerText = '85%'; }
      }, 450);
      setTimeout(() => {
        if (p2Bar) { p2Bar.style.width = '100%'; p2Txt.innerText = '100%'; }
        if (p3Bar) { p3Bar.style.width = '100%'; p3Txt.innerText = '100%'; }
      }, 950);
      setTimeout(() => {
        loadOv.style.display = 'none';
        showScreen(10);
      }, 1500);
    } else {
      showScreen(10);
    }
  });
  }

  const saveAccountBtn = document.getElementById('btn-save-account-changes');
  if (saveAccountBtn) {
    saveAccountBtn.addEventListener('click', () => {
      const nameVal = document.getElementById('edit-account-name').value.trim();
      const emailVal = document.getElementById('edit-account-email').value.trim();
      const metaVal = parseInt(document.getElementById('edit-account-meta').value);
      const packPriceVal = parseFloat(document.getElementById('edit-account-pack-price').value);
      
      if (!nameVal) {
        showToast('O nome não pode estar vazio.');
        return;
      }
      if (isNaN(metaVal) || metaVal < 0) {
        showToast('A meta diária não pode ser negativa.');
        return;
      }
      if (isNaN(packPriceVal) || packPriceVal <= 0) {
        showToast('O preço do maço deve ser maior que zero.');
        return;
      }

      const prevNormEmail = normalizeEmail(userState.email);
      const nextNormEmail = normalizeEmail(emailVal);
      userState.name = nameVal;
      userState.email = emailVal;
      userState.todayMeta = metaVal;
      userState.packPrice = packPriceVal;

      const habitualInput = document.getElementById('edit-account-habitual');
      if (habitualInput) {
        const habVal = parseInt(habitualInput.value, 10);
        if (!isNaN(habVal) && habVal >= 1) {
          userState.habitualCigs = habVal;
          userState.habitualCigsCustomized = true;
        }
      }

      const todayKey = getDateKey(new Date());
      const rec = getOrCreateDayRecord(todayKey);
      rec.meta = metaVal;

      userState.isAuthenticated = true;

      const curSess = loadActiveSession();
      if (curSess && curSess.mode === 'account' && curSess.activeProfileId) {
        const idx = loadProfilesIndex();
        const metaObj = idx.profiles[curSess.activeProfileId];
        if (metaObj) {
          if (prevNormEmail && prevNormEmail !== nextNormEmail && idx.emailToProfileId[prevNormEmail] === curSess.activeProfileId) {
            delete idx.emailToProfileId[prevNormEmail];
          }
          if (nextNormEmail) {
            idx.emailToProfileId[nextNormEmail] = curSess.activeProfileId;
          }
          metaObj.email = nextNormEmail || metaObj.email;
          metaObj.label = nameVal;
          metaObj.updatedAt = new Date().toISOString();
          saveProfilesIndex(idx);
        }
      }
      
      const homeNameEl = document.querySelector('.home-header h2');
      if (homeNameEl) homeNameEl.innerText = nameVal + '!';
      const profileNameEl = document.querySelector('.profile-header-box h3');
      if (profileNameEl) profileNameEl.innerText = nameVal;
      
      savePersistedState();
      refreshAllViews();
      
      showToast('Alterações salvas com sucesso!');
      userState.accountReturnScreen = null;
      showScreen(21);
    });
  }

  // Screen 7 UI listeners & Bottom Sheet (Aba inferior de opções da meta diária)
  function formatCurrencyLabelBr(priceVal) {
    const num = Number.isFinite(Number(priceVal)) ? Number(priceVal) : 10;
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }

  window.setCalcCigsValue = function(val) {
    const cleanVal = Math.max(1, Math.min(60, parseInt(val, 10) || 1));
    userState.habitualCigs = cleanVal;

    // Se o usuário ainda não personalizou a meta sugerida, calcula habitual - 1 (mínimo 0)
    if (!userState.suggestedMetaCustomized) {
      userState.todayMeta = Math.max(0, cleanVal - 1);
    } else {
      userState.todayMeta = Math.max(0, Math.min(cleanVal, userState.todayMeta));
    }

    const cigarettesValBox = document.getElementById('cigarettes-per-day-val');
    if (cigarettesValBox) cigarettesValBox.innerText = cleanVal;

    const pillLbl = document.getElementById('wl-cigs-pill-label');
    if (pillLbl) pillLbl.innerText = `${cleanVal} ${cleanVal === 1 ? 'cigarro' : 'cigarros'}`;

    const sheetDisplay = document.getElementById('wl-sheet-cigs-display');
    if (sheetDisplay) sheetDisplay.innerText = cleanVal;

    const suggDisplay = document.getElementById('habbi-suggested-meta-val');
    if (suggDisplay) suggDisplay.innerText = userState.todayMeta;

    const rangeInput = document.getElementById('cigarettes-slider');
    if (rangeInput && parseInt(rangeInput.value, 10) !== cleanVal) {
      rangeInput.value = String(cleanVal);
    }

    const quickBtns = document.querySelectorAll('#wl-calc-cigs-quick-grid .wl-calc-quick-opt');
    quickBtns.forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.cigs, 10) === cleanVal);
    });
  };

  window.adjustCalcCigsValue = function(delta) {
    const current = parseInt(userState.habitualCigs, 10) || 12;
    window.setCalcCigsValue(current + (parseInt(delta, 10) || 0));
  };

  window.adjustInitialSuggestedMeta = function(delta) {
    userState.suggestedMetaCustomized = true;
    const current = (typeof userState.todayMeta === 'number') ? userState.todayMeta : Math.max(0, (userState.habitualCigs || 12) - 1);
    const habitual = Math.max(1, parseInt(userState.habitualCigs, 10) || 12);
    const nextVal = Math.max(0, Math.min(habitual, current + (parseInt(delta, 10) || 0)));
    userState.todayMeta = nextVal;

    const suggDisplay = document.getElementById('habbi-suggested-meta-val');
    if (suggDisplay) suggDisplay.innerText = nextVal;
  };

  window.selectCalcYearsOption = function(btnEl) {
    if (!btnEl) return;
    const setupYearsChips = document.querySelectorAll('#years-smoking-chips .chip');
    setupYearsChips.forEach(c => c.classList.remove('selected'));
    btnEl.classList.add('selected');

    const shortLbl = btnEl.getAttribute('data-label') || btnEl.getAttribute('data-years') || '< 1 ano';
    const yearsPillLbl = document.getElementById('wl-years-pill-label');
    if (yearsPillLbl) yearsPillLbl.innerText = shortLbl;
    userState.yearsSmoking = btnEl.getAttribute('data-years') || 'Menos de 1';
  };

  window.setCalcPackPrice = function(val) {
    const numVal = Math.max(1, Math.min(100, parseFloat(val) || 10));
    userState.packPrice = numVal;

    const priceInput = document.getElementById('cigarettes-pack-price');
    if (priceInput && parseFloat(priceInput.value) !== numVal) {
      priceInput.value = numVal.toFixed(2);
    }

    const pricePillLbl = document.getElementById('wl-price-pill-label');
    if (pricePillLbl) pricePillLbl.innerText = formatCurrencyLabelBr(numVal);

    const quickBtns = document.querySelectorAll('#wl-calc-price-quick-grid .wl-calc-quick-opt');
    quickBtns.forEach(btn => {
      const btnPrice = parseFloat(btn.dataset.price);
      btn.classList.toggle('selected', Math.abs(btnPrice - numVal) < 0.01);
    });
  };

  window.adjustCalcPackPrice = function(delta) {
    const priceInput = document.getElementById('cigarettes-pack-price');
    const current = priceInput ? (parseFloat(priceInput.value) || userState.packPrice || 10) : (userState.packPrice || 10);
    const nextVal = Math.round((current + (parseFloat(delta) || 0)) * 2) / 2;
    window.setCalcPackPrice(nextVal);
  };

  window.openCalcOptionSheet = function(section) {
    const overlay = document.getElementById('wl-calc-sheet-overlay');
    if (!overlay) return;

    const titleEl = document.getElementById('wl-calc-sheet-title');
    const panelCigs = document.getElementById('wl-calc-panel-cigs');
    const panelYears = document.getElementById('wl-calc-panel-years');
    const panelPrice = document.getElementById('wl-calc-panel-price');

    if (panelCigs) panelCigs.style.display = section === 'cigs' ? 'flex' : 'none';
    if (panelYears) panelYears.style.display = section === 'years' ? 'flex' : 'none';
    if (panelPrice) panelPrice.style.display = section === 'price' ? 'flex' : 'none';

    if (titleEl) {
      if (section === 'cigs') titleEl.innerText = 'Quantos cigarros por dia?';
      else if (section === 'years') titleEl.innerText = 'Há quanto tempo você fuma?';
      else if (section === 'price') titleEl.innerText = 'Quanto custa um maço?';
    }

    const btnCigs = document.getElementById('btn-open-calc-cigs');
    const btnYears = document.getElementById('btn-open-calc-years');
    const btnPrice = document.getElementById('btn-open-calc-price');
    if (btnCigs) btnCigs.classList.toggle('active-sheet', section === 'cigs');
    if (btnYears) btnYears.classList.toggle('active-sheet', section === 'years');
    if (btnPrice) btnPrice.classList.toggle('active-sheet', section === 'price');

    overlay.classList.add('open');
  };

  window.closeCalcOptionSheet = function() {
    const overlay = document.getElementById('wl-calc-sheet-overlay');
    if (overlay) overlay.classList.remove('open');
    ['btn-open-calc-cigs', 'btn-open-calc-years', 'btn-open-calc-price'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active-sheet');
    });
  };

  const rangeInput = document.getElementById('cigarettes-slider');
  if (rangeInput) {
    rangeInput.addEventListener('input', (e) => {
      window.setCalcCigsValue(e.target.value);
    });
  }

  const packPriceInputEl = document.getElementById('cigarettes-pack-price');
  if (packPriceInputEl) {
    packPriceInputEl.addEventListener('input', (e) => {
      const raw = parseFloat(e.target.value);
      if (!isNaN(raw) && raw > 0) {
        userState.packPrice = raw;
        const pricePillLbl = document.getElementById('wl-price-pill-label');
        if (pricePillLbl) pricePillLbl.innerText = formatCurrencyLabelBr(raw);
        const quickBtns = document.querySelectorAll('#wl-calc-price-quick-grid .wl-calc-quick-opt');
        quickBtns.forEach(btn => {
          const btnPrice = parseFloat(btn.dataset.price);
          btn.classList.toggle('selected', Math.abs(btnPrice - raw) < 0.01);
        });
      }
    });
    packPriceInputEl.addEventListener('blur', (e) => {
      window.setCalcPackPrice(e.target.value);
    });
  }

  // Sincroniza os valores iniciais da tela 7 a partir do perfil ativo
  function syncOnboardingFormToUserState() {
    const habitual = (typeof userState.habitualCigs === 'number' && userState.habitualCigs >= 1) ? userState.habitualCigs : 12;
    const packPrice = (typeof userState.packPrice === 'number' && userState.packPrice > 0) ? userState.packPrice : 12.00;
    const years = userState.yearsSmoking || 'Menos de 1';

    window.setCalcCigsValue(habitual);
    window.setCalcPackPrice(packPrice);

    const setupYearsChips = document.querySelectorAll('#years-smoking-chips .chip');
    setupYearsChips.forEach(c => {
      const chipYears = c.getAttribute('data-years') || 'Menos de 1';
      const isSelected = (chipYears === years || (!c.getAttribute('data-years') && years === 'Menos de 1'));
      c.classList.toggle('selected', isSelected);
      if (isSelected) {
        const yearsPillLbl = document.getElementById('wl-years-pill-label');
        if (yearsPillLbl) yearsPillLbl.innerText = c.getAttribute('data-label') || c.getAttribute('data-years') || '< 1 ano';
      }
    });
  }
  window.syncOnboardingFormToUserState = syncOnboardingFormToUserState;
  syncOnboardingFormToUserState();

  // Screen 8 & 9 Multi-select Chips toggle
  const motivationsChips = document.querySelectorAll('#motivations-chips-grid .chip');
  motivationsChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
    });
  });

  const triggersChips = document.querySelectorAll('#triggers-chips-grid .chip');
  triggersChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
    });
  });

  // (#btn-home-sos já usa onclick="goToScreen(12)" no template da Home — listener duplicado removido)

  // SOS Wizard Chips and Selectors (legado / fallback seguro)
  const sosContextChips = document.querySelectorAll('#sos-context-chips .chip');
  sosContextChips.forEach(chip => {
    chip.addEventListener('click', () => {
      sosContextChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      userState.sosContext = chip.dataset.val;
    });
  });

  const sosIntensityChips = document.querySelectorAll('#sos-intensity-btns .intensity-dot');
  sosIntensityChips.forEach(chip => {
    chip.addEventListener('click', () => {
      sosIntensityChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      userState.sosUrge = parseInt(chip.dataset.val);
    });
  });

  const sosTimeChips = document.querySelectorAll('#sos-time-chips .chip');
  sosTimeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      sosTimeChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      userState.sosTime = chip.dataset.val;
    });
  });

  const btnSosSubmit = document.getElementById('btn-sos-submit');
  if (btnSosSubmit) {
    btnSosSubmit.addEventListener('click', () => {
      selectIntelligentIntervention();
      showScreen(13);
    });
  }

  // SOS Execution Conclude / Pausar
  const btnInterventionFinish = document.getElementById('btn-intervention-finish');
  if (btnInterventionFinish) {
    btnInterventionFinish.addEventListener('click', () => {
      window.openSosFeedbackModal();
    });
  }

  // Minigames Inline selectors
  const gmMem = document.getElementById('btn-game-memory');
  if (gmMem) gmMem.addEventListener('click', () => playInlineGame('memory'));
  const gmSeq = document.getElementById('btn-game-sequence');
  if (gmSeq) gmSeq.addEventListener('click', () => playInlineGame('sequence'));
  const gmMath = document.getElementById('btn-game-math');
  if (gmMath) gmMath.addEventListener('click', () => playInlineGame('math'));
  const gmRef = document.getElementById('btn-game-reflex');
  if (gmRef) gmRef.addEventListener('click', () => playInlineGame('reflex'));
  // btn-quit-game já usa onclick="quitInlineGame()" no HTML (evita disparo duplicado)

  // History timeline rendering (mostra tudo o que o usuário fez, somente leitura, sem opção de editar)
  function renderHistoryTimeline() {
    const container = document.getElementById('history-timeline-container');
    if (!container) return;
    container.innerHTML = '';

    const activeLangHist = (userState.currentLang || 'PT').toUpperCase();
    const tHist = (window.HABBI_I18N && window.HABBI_I18N[activeLangHist]) ? window.HABBI_I18N[activeLangHist] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

    const visibleEvents = Array.isArray(userState.historyEvents)
      ? userState.historyEvents.filter(evt => evt && evt.kind !== 'day-complete')
      : [];

    if (visibleEvents.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'card';
      emptyBox.style.cssText = 'padding: 24px 18px; text-align: center; border-radius: 20px;';
      const emptyTitle = document.createElement('div');
      emptyTitle.style.cssText = 'font-weight: 700; font-size: 15px; color: var(--text-primary); margin-bottom: 6px;';
      emptyTitle.textContent = tHist.histEmptyTitle || 'Nenhum registro salvo ainda';
      const emptyP = document.createElement('p');
      emptyP.className = 'caption';
      emptyP.style.margin = '0';
      emptyP.textContent = tHist.histEmptyDesc || 'Seus registros diários aparecerão aqui automaticamente.';
      emptyBox.appendChild(emptyTitle);
      emptyBox.appendChild(emptyP);
      container.appendChild(emptyBox);
      return;
    }

    visibleEvents.forEach(evt => {
      const isSuccess = evt.type === 'sucesso' && evt.kind !== 'mood';
      const isOverMeta = evt.type === 'acima-meta' || evt.type === 'aviso' || evt.type === 'recaída';
      const isMood = evt.kind === 'mood' || evt.type === 'humor';
      
      let markerClass = 'urge';
      let markerSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      if (isMood) {
        markerClass = 'urge';
        markerSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
      } else if (isSuccess) {
        markerClass = 'success';
        markerSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="20 6 9 17 4 12"/></svg>';
      } else if (isOverMeta) {
        markerClass = 'relapse';
        markerSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true" focusable="false"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
      }

      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';

      const circleEl = document.createElement('div');
      circleEl.className = `history-circle ${markerClass}`;
      circleEl.innerHTML = markerSvg;

      const contentEl = document.createElement('div');
      contentEl.className = 'history-content';

      const headerRow = document.createElement('div');
      headerRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px; gap: 8px;';

      const recMeta = (evt.dateKey && userState.dailyRecords[evt.dateKey] && userState.dailyRecords[evt.dateKey].meta) || userState.todayMeta || 11;
      const localized = getLocalizedEventDisplay(evt, recMeta, tHist);

      const titleSpan = document.createElement('span');
      titleSpan.style.cssText = 'font-weight:700; font-size:14px; color:var(--text-primary);';
      titleSpan.textContent = localized.title;

      const timeSpan = document.createElement('span');
      timeSpan.className = 'caption';
      timeSpan.style.cssText = 'color:var(--text-muted); font-size:11px; flex-shrink:0;';
      timeSpan.textContent = String(evt.time || '');

      headerRow.appendChild(titleSpan);
      headerRow.appendChild(timeSpan);

      const descP = document.createElement('p');
      descP.className = 'caption';
      descP.style.cssText = 'margin-bottom:0; font-size:12px;';
      descP.textContent = localized.subdesc || String(evt.desc || evt.detail || '');

      contentEl.appendChild(headerRow);
      contentEl.appendChild(descP);

      itemEl.appendChild(circleEl);
      itemEl.appendChild(contentEl);
      container.appendChild(itemEl);
    });
  }

  // -------------------------------------------------------------
  // Screen 25: Registro de Sentimentos Logic
  // -------------------------------------------------------------
  const moodCards = document.querySelectorAll('.mood-card');
  let selectedMood = '';
  const btnMoodSubmit = document.getElementById('btn-mood-submit');
  const moodNotesInput = document.getElementById('mood-notes');

  function updateScreen25SubmitState() {
    if (!btnMoodSubmit) return;
    const hasMood = Boolean(selectedMood);
    const hasChips = document.querySelectorAll('#mood-influence-chips .chip.selected').length > 0;
    const notesVal = (moodNotesInput?.value || '').trim();
    const hasAny = hasMood || hasChips || Boolean(notesVal);
    btnMoodSubmit.disabled = !hasAny;
    btnMoodSubmit.style.opacity = hasAny ? '1' : '0.4';
    btnMoodSubmit.style.pointerEvents = hasAny ? 'auto' : 'none';
  }

  moodCards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('active')) {
        card.classList.remove('active');
        selectedMood = '';
      } else {
        moodCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedMood = card.dataset.mood;
      }
      updateScreen25SubmitState();
    });
  });

  const moodInfluenceChips = document.querySelectorAll('#mood-influence-chips .chip');
  moodInfluenceChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      updateScreen25SubmitState();
    });
  });

  if (moodNotesInput) {
    moodNotesInput.addEventListener('input', updateScreen25SubmitState);
  }
  updateScreen25SubmitState();

  if (btnMoodSubmit) {
    btnMoodSubmit.addEventListener('click', () => {
      const selectedInfluences = [];
      moodInfluenceChips.forEach(c => {
        if (c.classList.contains('selected')) {
          selectedInfluences.push(c.dataset.val);
        }
      });

      const notes = (moodNotesInput ? moodNotesInput.value : '').trim();
      if (!selectedMood && selectedInfluences.length === 0 && !notes) {
        showToast('Nenhum dado informado.');
        return;
      }
      const targetKey = userState.activeRegisterDateKey || getDateKey(new Date());

      userState.mood = {
        mood: selectedMood || null,
        influences: selectedInfluences,
        notes: notes,
        date: new Date().toLocaleDateString('pt-BR')
      };

      const influencesText = selectedInfluences.length > 0 ? ` (Influências: ${selectedInfluences.join(', ')})` : '';
      const notesText = notes ? ` - "${notes}"` : '';

      const t = HABBI_I18N[(userState.currentLang || 'PT').toUpperCase()] || HABBI_I18N.PT;
      const eventTitle = selectedMood ? `Humor: ${selectedMood}` : 'Registro de Sentimentos';
      const eventDesc = selectedMood ? `Sentimento registrado.${influencesText}` : (selectedInfluences.length > 0 ? `Influências registradas.${influencesText}` : (notes ? 'Nota registrada.' : 'Registro salvo.'));

      recordHabbiEvent({
        dateKey: targetKey,
        kind: 'mood',
        moodValue: selectedMood || null,
        influences: selectedInfluences,
        note: notes,
        title: eventTitle,
        desc: eventDesc,
        detail: selectedMood ? `Estado de humor: ${selectedMood}.${influencesText}${notesText}` : `Sentimentos.${influencesText}${notesText}`
      });

      showToast(t.toastSaved || 'Registrado com sucesso');

      moodCards.forEach(c => c.classList.remove('active'));
      selectedMood = '';
      moodInfluenceChips.forEach(c => c.classList.remove('selected'));
      if (moodNotesInput) moodNotesInput.value = '';
      updateScreen25SubmitState();

      const dest = userState.returnScreenAfterRegister || 10;
      userState.returnScreenAfterRegister = 10;
      showScreen(dest);
    });
  }

  // -------------------------------------------------------------
  // LÓGICA DE EVOLUÇÃO GRADUAL DE METAS (DIÁRIA, LEVE E SEM COBRANÇA)
  // -------------------------------------------------------------
  function shouldShowDailyGoalPrompt() {
    if (!userState.onboardingCompleted) return false;
    const todayKey = getDateKey(new Date());
    if (userState.lastGoalPromptDateKey && userState.lastGoalPromptDateKey >= todayKey) {
      return false;
    }
    return true;
  }

  function renderDailyGoalPrompt() {
    const card = document.getElementById('habbi-goal-evolution-card');
    if (!card) return;

    if (!shouldShowDailyGoalPrompt()) {
      card.style.display = 'none';
      return;
    }

    const todayKey = getDateKey(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = getDateKey(yesterdayDate);

    const yesterdayRec = userState.dailyRecords[yesterdayKey];
    const yesterdayCigs = yesterdayRec ? Math.max(0, parseInt(yesterdayRec.cigs, 10) || 0) : null;
    const yesterdayMeta = (yesterdayRec && typeof yesterdayRec.meta === 'number' && yesterdayRec.meta >= 0)
      ? yesterdayRec.meta
      : ((typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11);

    const currentMeta = (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0)
      ? userState.todayMeta
      : 11;

    const hadYesterdayRecord = Boolean(yesterdayRec && (
      (Array.isArray(yesterdayRec.events) && yesterdayRec.events.length > 0) ||
      yesterdayRec.smokeFree ||
      yesterdayRec.dayCompleted ||
      (typeof yesterdayRec.cigs === 'number' && yesterdayRec.cigs > 0)
    ));
    const exceededYesterday = Boolean(hadYesterdayRecord && yesterdayCigs !== null && yesterdayCigs > yesterdayMeta);

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

    const badgeEl = document.getElementById('habbi-goal-badge-txt');
    const titleEl = document.getElementById('habbi-goal-card-title');
    const descEl = document.getElementById('habbi-goal-card-desc');
    const actionsEl = document.getElementById('habbi-goal-card-actions');
    const laterLink = document.getElementById('btn-goal-later');

    if (badgeEl) {
      badgeEl.innerText = t.goalPromptTitle || 'Meta de hoje';
      badgeEl.classList.toggle('is-challenge', exceededYesterday);
    }
    if (laterLink) {
      laterLink.innerText = t.goalPromptLaterBtn || 'Decidir depois';
    }

    if (currentMeta === 0) {
      if (titleEl) titleEl.innerText = t.goalPromptZero || 'Meta sem fumar mantida!';
      if (descEl) descEl.innerText = t.goalPromptZeroDesc || (activeLang === 'EN' ? 'You have reached 0 cigarettes goal. Keep smoke-free today?' : (activeLang === 'ES' ? 'Has alcanzado la meta de 0 cigarrillos. ¿Continuar sin fumar hoy?' : 'Você já conquistou a meta de 0 cigarros. Vamos continuar sem fumar hoje?'));
      if (actionsEl) {
        actionsEl.innerHTML = `
          <button type="button" class="btn btn-primary habbi-goal-act-btn" id="btn-goal-keep" onclick="handleDailyGoalDecision('keep')">${escapeHtml(t.goalPromptZeroKeepBtn || 'Continuar sem fumar')}</button>
        `;
      }
    } else if (exceededYesterday) {
      if (titleEl) titleEl.innerText = t.goalPromptOverYesterday || 'Ontem foi um dia desafiador, e tudo bem!';
      const tplDesc = activeLang === 'EN'
        ? 'Every day is a fresh start. Would you like to keep the same goal of {0} and try again today?'
        : (activeLang === 'ES' ? 'Cada día es un nuevo comienzo. ¿Quieres mantener la meta de {0} e intentarlo hoy de nuevo?' : 'Cada dia é um novo recomeço. Deseja manter a meta de {0} para tentar novamente hoje?');
      if (descEl) descEl.innerText = tplDesc.replace('{0}', String(currentMeta));
      const keepBtnLabel = (t.goalPromptKeepBtn || 'Continuar com {0}').replace('{0}', String(currentMeta));
      const reduceBtnLabel = (t.goalPromptReduceBtn || 'Tentar {0}').replace('{0}', String(Math.max(0, currentMeta - 1)));
      if (actionsEl) {
        actionsEl.innerHTML = `
          <button type="button" class="btn btn-secondary habbi-goal-act-btn" id="btn-goal-keep" onclick="handleDailyGoalDecision('keep')">${escapeHtml(keepBtnLabel)}</button>
          <button type="button" class="btn btn-primary habbi-goal-act-btn" id="btn-goal-reduce" onclick="handleDailyGoalDecision('reduce')">${escapeHtml(reduceBtnLabel)}</button>
        `;
      }
    } else {
      if (hadYesterdayRecord) {
        if (titleEl) titleEl.innerText = t.goalPromptMetYesterday || 'Ontem você mandou bem!';
      } else {
        if (titleEl) titleEl.innerText = t.goalPromptNormal || 'Novo dia, novo passo';
      }
      const tplDesc = activeLang === 'EN'
        ? 'Would you like to keep {0} cigarettes or try reducing 1 cigarette today?'
        : (activeLang === 'ES' ? '¿Quieres mantener {0} cigarrillos o intentar reducir 1 cigarrillo hoy?' : 'Deseja continuar com {0} cigarros ou tentar reduzir mais 1 cigarro hoje?');
      if (descEl) descEl.innerText = tplDesc.replace('{0}', String(currentMeta));
      const keepBtnLabel = (t.goalPromptKeepBtn || 'Continuar com {0}').replace('{0}', String(currentMeta));
      const reduceBtnLabel = (t.goalPromptReduceBtn || 'Tentar {0}').replace('{0}', String(Math.max(0, currentMeta - 1)));
      if (actionsEl) {
        actionsEl.innerHTML = `
          <button type="button" class="btn btn-secondary habbi-goal-act-btn" id="btn-goal-keep" onclick="handleDailyGoalDecision('keep')">${escapeHtml(keepBtnLabel)}</button>
          <button type="button" class="btn btn-primary habbi-goal-act-btn" id="btn-goal-reduce" onclick="handleDailyGoalDecision('reduce')">${escapeHtml(reduceBtnLabel)}</button>
        `;
      }
    }

    card.style.display = 'block';
  }

  function handleDailyGoalDecision(decision) {
    const todayKey = getDateKey(new Date());
    userState.lastGoalPromptDateKey = todayKey;
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});

    const card = document.getElementById('habbi-goal-evolution-card');
    if (card) card.style.display = 'none';

    if (decision === 'keep') {
      const todayRec = getOrCreateDayRecord(todayKey);
      todayRec.meta = (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11;
      const msg = userState.todayMeta === 0
        ? (t.goalToastZero || 'Excelente! Meta de 0 cigarros mantida para hoje.')
        : (t.goalToastKept || 'Meta mantida em {0} cigarros hoje.').replace('{0}', String(userState.todayMeta));
      showToast(msg);
      savePersistedState();
      refreshAllViews();
    } else if (decision === 'reduce') {
      const cur = (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11;
      const nextMeta = Math.max(0, cur - 1);
      userState.todayMeta = nextMeta;
      const todayRec = getOrCreateDayRecord(todayKey);
      todayRec.meta = nextMeta;
      const msg = nextMeta === 0
        ? (t.goalToastZero || 'Excelente! Meta de 0 cigarros mantida para hoje.')
        : (t.goalToastReduced || 'Nova meta definida: {0} cigarros hoje! Um passo de cada vez.').replace('{0}', String(nextMeta));
      showToast(msg);
      savePersistedState();
      refreshAllViews();
    } else {
      // 'later' -> adia a decisão sem penalidade nem alteração
      savePersistedState();
    }
  }

  window.shouldShowDailyGoalPrompt = shouldShowDailyGoalPrompt;
  window.renderDailyGoalPrompt = renderDailyGoalPrompt;
  window.checkDailyGoalPrompt = renderDailyGoalPrompt;
  window.handleDailyGoalDecision = handleDailyGoalDecision;
  window.getDateKey = getDateKey;
  window.getSafeTodayMeta = getSafeTodayMeta;
  window.getOrCreateDayRecord = getOrCreateDayRecord;
  window.getDayStatus = getDayStatus;
  window.isDayGoalMet = isDayGoalMet;
  window.computeSavingsMetrics = computeSavingsMetrics;

  // -------------------------------------------------------------
  // MODAL DE AJUSTE DE META E CONSUMO (CONFIGURAÇÕES E PERFIL)
  // -------------------------------------------------------------
  let modalAdjustTodayMeta = 11;
  let modalAdjustHabitualCigs = 12;

  window.openGoalAdjustModal = function() {
    modalAdjustTodayMeta = (typeof userState.todayMeta === 'number' && userState.todayMeta >= 0) ? userState.todayMeta : 11;
    modalAdjustHabitualCigs = (typeof userState.habitualCigs === 'number' && userState.habitualCigs >= 1) ? userState.habitualCigs : 12;

    const todayValEl = document.getElementById('modal-adjust-today-val');
    if (todayValEl) todayValEl.innerText = String(modalAdjustTodayMeta);

    const habitualValEl = document.getElementById('modal-adjust-habitual-val');
    if (habitualValEl) habitualValEl.innerText = String(modalAdjustHabitualCigs);

    const modal = document.getElementById('habbi-goal-adjust-modal');
    if (modal) {
      modal.style.display = 'flex';
      openAccessibleDialog(modal, window.closeGoalAdjustModal, 'habbi-goal-adjust-title');
    }
  };

  window.closeGoalAdjustModal = function() {
    const modal = document.getElementById('habbi-goal-adjust-modal');
    if (modal) {
      modal.style.display = 'none';
      closeAccessibleDialog(modal);
    }
  };

  window.stepAdjustGoalModalToday = function(delta) {
    modalAdjustTodayMeta = Math.max(0, Math.min(60, modalAdjustTodayMeta + (parseInt(delta, 10) || 0)));
    const todayValEl = document.getElementById('modal-adjust-today-val');
    if (todayValEl) todayValEl.innerText = String(modalAdjustTodayMeta);
  };

  window.stepAdjustGoalModalHabitual = function(delta) {
    modalAdjustHabitualCigs = Math.max(1, Math.min(60, modalAdjustHabitualCigs + (parseInt(delta, 10) || 0)));
    const habitualValEl = document.getElementById('modal-adjust-habitual-val');
    if (habitualValEl) habitualValEl.innerText = String(modalAdjustHabitualCigs);
  };

  window.saveGoalAdjustModal = function() {
    ensureActiveProfileForWrite();
    userState.todayMeta = modalAdjustTodayMeta;
    userState.habitualCigs = modalAdjustHabitualCigs;
    userState.habitualCigsCustomized = true;

    const todayKey = getDateKey(new Date());
    const todayRec = getOrCreateDayRecord(todayKey);
    todayRec.meta = modalAdjustTodayMeta;

    window.closeGoalAdjustModal();
    savePersistedState();
    refreshAllViews();

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    showToast(t.goalToastSaved || 'Meta e consumo atualizados com sucesso!');
  };

  // -------------------------------------------------------------
  // Goal Exceeded Modal Logic
  // -------------------------------------------------------------
  const modalKeepBtn = document.getElementById('btn-keep-meta');
  const modalReduceBtn = document.getElementById('btn-reduce-meta');
  const modalExceededOverlay = document.getElementById('meta-exceeded-modal');

  if (modalKeepBtn && modalReduceBtn) {
    modalKeepBtn.addEventListener('click', () => {
      const val = parseInt(document.getElementById('modal-keep-val').innerText);
      userState.todayMeta = val;
      savePersistedState();
      refreshAllViews();
      if (modalExceededOverlay) modalExceededOverlay.style.display = 'none';
      showScreen(10);
    });

    modalReduceBtn.addEventListener('click', () => {
      const val = parseInt(document.getElementById('modal-reduce-val').innerText);
      userState.todayMeta = val;
      savePersistedState();
      refreshAllViews();
      if (modalExceededOverlay) modalExceededOverlay.style.display = 'none';
      showScreen(10);
    });
  }

  // -------------------------------------------------------------
  // Screen 26: Dedicated Avatar Selector Screen Logic
  // -------------------------------------------------------------
  const avatarOptionCards = document.querySelectorAll('.avatar-option-card');
  if (avatarOptionCards) {
    avatarOptionCards.forEach(card => {
      card.addEventListener('click', () => {
        const key = card.dataset.avatar || card.dataset.color;
        if (typeof window.selectUserAvatar === 'function') {
          window.selectUserAvatar(key);
        }
      });
    });
  }

  // Theme Switching Logic (escopado por perfil ativo)
  const themeToggleBtn = document.getElementById('settings-theme');
  const themeStatusLabel = document.getElementById('theme-status-label');
  const deviceScreen = document.querySelector('.device-screen');

  function setTheme(theme, skipSave = false) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    userState.theme = normalized;
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    if (normalized === 'dark') {
      if (deviceScreen) deviceScreen.classList.add('dark-theme');
      if (themeStatusLabel) themeStatusLabel.innerText = t.themeDark || 'Escuro';
    } else {
      if (deviceScreen) deviceScreen.classList.remove('dark-theme');
      if (themeStatusLabel) themeStatusLabel.innerText = t.themeLight || 'Claro';
    }
    try {
      localStorage.setItem('habbi-theme', normalized);
    } catch (_e) {}
    if (!skipSave) {
      savePersistedState();
    }
  }
  window.setTheme = setTheme;

  setTheme(userState.theme || 'light', true);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (deviceScreen) {
        const isDark = deviceScreen.classList.contains('dark-theme');
        setTheme(isDark ? 'light' : 'dark');
      }
    });
  }

  // Detecção estrita de ambiente local/teste (NUNCA ativa via query string em domínios públicos)
  window.isHabbiLocalOrTestEnv = function(locOverride) {
    if (window.__HABBI_TEST_ENV__ === true) return true;
    const loc = locOverride || window.location;
    if (!loc) return false;
    const protocol = String(loc.protocol || '').toLowerCase();
    if (protocol === 'file:') return true;
    const host = String(loc.hostname || '').toLowerCase().trim();
    if (!host) return false;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') return true;
    if (host.endsWith('.local')) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    return false;
  };

  function syncLocalTestEnvControls(locOverride) {
    const isLocal = window.isHabbiLocalOrTestEnv(locOverride);
    const settingsSlot = document.getElementById('settings-local-test-slot');
    const profileSlot = document.getElementById('profile-local-test-slot');
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    const btnLabel = t.settingsRestartTest || 'Reiniciar experiência de teste';
    const envBadge = t.localTestEnvBadge || 'Ambiente de teste local';

    if (!isLocal) {
      if (settingsSlot) settingsSlot.innerHTML = '';
      if (profileSlot) profileSlot.innerHTML = '';
      return;
    }

    const mountLocalTestControl = (slotEl, btnId) => {
      if (!slotEl || document.getElementById(btnId)) return;
      const wrap = document.createElement('div');
      wrap.className = 'habbi-local-test-wrap';
      const badge = document.createElement('span');
      badge.className = 'habbi-local-test-badge';
      badge.textContent = envBadge;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = btnId;
      btn.className = 'habbi-local-test-btn';
      btn.textContent = btnLabel;
      btn.addEventListener('click', () => window.restartTestExperience());
      wrap.appendChild(badge);
      wrap.appendChild(btn);
      slotEl.appendChild(wrap);
    };

    mountLocalTestControl(settingsSlot, 'settings-restart-test-btn');
    mountLocalTestControl(profileSlot, 'profile-restart-test-btn');
  }
  window.syncLocalTestEnvControls = syncLocalTestEnvControls;

  // Popover discreto de informação em "Economia estimada" (Tela 29)
  window.toggleConquistaInfoPopover = function(ev) {
    if (ev) ev.stopPropagation();
    const btn = document.getElementById('wl-conquista-info-btn');
    const pop = document.getElementById('wl-conquista-info-popover');
    if (!btn || !pop) return;
    const isHidden = pop.hasAttribute('hidden');
    if (isHidden) {
      pop.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      pop.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  };
  document.addEventListener('click', (ev) => {
    const pop = document.getElementById('wl-conquista-info-popover');
    const btn = document.getElementById('wl-conquista-info-btn');
    if (!pop || !btn || pop.hasAttribute('hidden')) return;
    if (!pop.contains(ev.target) && !btn.contains(ev.target)) {
      pop.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    const pop = document.getElementById('wl-conquista-info-popover');
    const btn = document.getElementById('wl-conquista-info-btn');
    if (pop && btn && !pop.hasAttribute('hidden')) {
      pop.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });

  // Modal Backup e dados (agrupa exportação JSON e ação sensível de apagar registros)
  window.openBackupAndDataModal = function() {
    const modal = document.getElementById('habbi-backup-data-modal');
    if (modal) {
      modal.style.display = 'flex';
      openAccessibleDialog(modal, window.closeBackupAndDataModal, 'habbi-backup-modal-title');
    }
  };
  window.closeBackupAndDataModal = function() {
    const modal = document.getElementById('habbi-backup-data-modal');
    if (modal) {
      modal.style.display = 'none';
      closeAccessibleDialog(modal);
    }
  };

  // Logout NÃO DESTRUTIVO: preserva o cofre do perfil ativo, limpa apenas memória/UI/inputs
  window.handleProfileLogout = function() {
    const prevSess = loadActiveSession();
    if (prevSess && prevSess.mode !== 'signed-out' && prevSess.activeProfileId) {
      savePersistedState();
    }

    window.habbiTutorialActive = false;
    if (typeof hideTutorialSwipeHint === 'function') hideTutorialSwipeHint();
    if (typeof window.toggleHabbiHubMenu === 'function') window.toggleHabbiHubMenu(false);
    const overlay = document.getElementById('habbi-tutorial-overlay');
    if (overlay) overlay.style.display = 'none';

    const langKeep = userState.currentLang || 'PT';
    resetInMemoryUserState(langKeep);
    clearAuthFormInputs();

    // Encerra sessão ativa sem destruir nenhum cofre de perfil salvo
    saveActiveSession({ mode: 'signed-out', activeProfileId: null });

    setTheme('light', true);
    refreshAllViews(true);
    if (typeof window.syncOnboardingFormToUserState === 'function') {
      window.syncOnboardingFormToUserState();
    }
    try {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (_e) {}
    showToast('Você saiu da sua conta.');
    showScreen(2);
  };

  // Ação SEPARADA em Configurações: apagar registros apenas do perfil ativo
  window.openDeleteProfileDataModal = function() {
    const modal = document.getElementById('habbi-delete-profile-modal');
    if (modal) {
      modal.style.display = 'flex';
      openAccessibleDialog(modal, window.closeDeleteProfileDataModal, 'habbi-del-modal-title');
    }
  };

  window.closeDeleteProfileDataModal = function() {
    const modal = document.getElementById('habbi-delete-profile-modal');
    if (modal) {
      modal.style.display = 'none';
      closeAccessibleDialog(modal);
    }
  };

  window.confirmDeleteActiveProfileRecords = function() {
    const sess = loadActiveSession();
    const keepAuth = Boolean(sess && sess.mode === 'account' && userState.isAuthenticated);
    const keepName = keepAuth ? userState.name : '';
    const keepEmail = keepAuth ? userState.email : '';
    const keepLang = userState.currentLang || 'PT';

    if (sess && sess.activeProfileId) {
      try {
        localStorage.removeItem(getProfileStorageKey(sess.activeProfileId));
      } catch (_e) {}
    }

    resetInMemoryUserState(keepLang);
    if (keepAuth) {
      userState.isAuthenticated = true;
      userState.name = keepName;
      userState.email = keepEmail;
      userState.onboardingCompleted = true;
    }
    if (sess && sess.activeProfileId && sess.mode !== 'signed-out') {
      savePersistedState();
    }

    window.closeDeleteProfileDataModal();
    refreshAllViews(true);
    if (typeof window.syncOnboardingFormToUserState === 'function') {
      window.syncOnboardingFormToUserState();
    }

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : (window.HABBI_I18N ? window.HABBI_I18N.PT : {});
    showToast(t.delModalDone || 'Registros deste perfil apagados.');
  };

  // Reiniciar experiência de teste (exclusivo para ambiente local/testes)
  window.restartTestExperience = function(locOverride) {
    if (!window.isHabbiLocalOrTestEnv(locOverride)) {
      return null;
    }

    // 1. Preserva o perfil anterior no próprio cofre (nunca apaga contas nem históricos anteriores)
    const prevSess = loadActiveSession();
    if (prevSess && prevSess.mode !== 'signed-out' && prevSess.activeProfileId) {
      savePersistedState();
    }

    // 2. Fecha overlays e limpa UI/inputs
    window.habbiTutorialActive = false;
    if (typeof hideTutorialSwipeHint === 'function') hideTutorialSwipeHint();
    if (typeof window.toggleHabbiHubMenu === 'function') window.toggleHabbiHubMenu(false);
    const overlay = document.getElementById('habbi-tutorial-overlay');
    if (overlay) overlay.style.display = 'none';
    clearAuthFormInputs();

    // 3. Cria novo perfil de teste isolado completamente limpo
    const newTestProfileId = createTestProfile();
    resetInMemoryUserState('PT');
    userState.onboardingCompleted = false;
    userState.tutorialCompleted = false;
    userState.hasConfiguredFirstGoal = false;
    userState.sacola100Celebrated = false;

    saveActiveSession({ mode: 'test', activeProfileId: newTestProfileId });
    savePersistedState();

    setTheme('light', true);
    if (typeof window.applyAppLanguage === 'function') {
      window.applyAppLanguage('PT');
    }
    refreshAllViews(true);
    if (typeof window.syncOnboardingFormToUserState === 'function') {
      window.syncOnboardingFormToUserState();
    }

    try {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (_e) {}
    if (typeof window.resetOnb1Demo === 'function') {
      window.resetOnb1Demo();
    }
    showScreen(1);
    return { profileId: newTestProfileId, mode: 'test' };
  };

  window.restartOnboarding = function() {
    window.habbiTutorialActive = false;
    userState.onboardingCompleted = false;
    userState.tutorialCompleted = false;
    userState.hasConfiguredFirstGoal = false;
    if (typeof hideTutorialSwipeHint === 'function') hideTutorialSwipeHint();
    if (typeof window.toggleHabbiHubMenu === 'function') window.toggleHabbiHubMenu(false);
    const overlay = document.getElementById('habbi-tutorial-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    savePersistedState();
    try {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (_e) {}
    if (typeof window.resetOnb1Demo === 'function') {
      window.resetOnb1Demo();
    }
    showScreen(1);
    if (typeof showToast === 'function') {
      showToast('Iniciando tour do Habbi');
    }
  };

  window.simulateSocialLogin = function(provider) {
    const email = provider === 'Apple' ? 'usuario@icloud.com' : 'usuario@gmail.com';
    const name = provider === 'Apple' ? 'Usuário Apple' : 'Usuário Google';
    switchToAccountProfile({ email, name });
    showToast(`Conectado com ${provider}!`);
    const target = userState.authReturnScreen || 10;
    userState.authReturnScreen = 10;
    showScreen(target);
  };

  const logoutBtn = document.getElementById('settings-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', window.handleProfileLogout);
  }

  // Onboarding Carousel Controller (Screens 3, 4, 5) com rolagem física contínua
  let currentOnbSlideIndex = 0;
  window.goToOnboardingSlide = function(slideIndex, updateScreenState = true) {
    currentOnbSlideIndex = Math.max(0, Math.min(2, slideIndex));
    const track = document.getElementById('onboarding-slider-track');
    const container = document.getElementById('onboarding-slider-container');
    if (track) {
      track.classList.remove('is-dragging');
      track.style.transform = `translate3d(-${currentOnbSlideIndex * 33.333333}%, 0, 0)`;
    }
    if (container) {
      container.classList.add('active');
    }
    const targetScreenNum = currentOnbSlideIndex + 3;
    if (updateScreenState && currentScreen !== targetScreenNum) {
      currentScreen = targetScreenNum;
      localStorage.setItem('habbi-current-screen', currentScreen);
    }
    // Sincroniza progress dots
    document.querySelectorAll('.onboarding-slider-container .onboarding-progress').forEach(p => {
      const dots = p.querySelectorAll('.progress-dot');
      dots.forEach((dot, idx) => {
        if (idx === currentOnbSlideIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    });
  };

  // Detecção de gestos físicos com resposta em tempo real no Onboarding (Telas 3, 4, 5)
  (function initOnboardingSliderTouch() {
    let startX = 0;
    let startY = 0;
    let currentDeltaX = 0;
    let isTracking = false;
    let isHorizontalGesture = false;

    const getContainer = () => document.getElementById('onboarding-slider-container');
    const getTrack = () => document.getElementById('onboarding-slider-track');

    function onTouchStart(e) {
      const container = getContainer();
      if (!container || !container.classList.contains('active')) return;
      if (e.target && e.target.closest('button, input, a, .progress-dot')) return;

      const touch = e.touches ? e.touches[0] : e;
      startX = touch.clientX;
      startY = touch.clientY;
      currentDeltaX = 0;
      isTracking = true;
      isHorizontalGesture = false;
    }

    function onTouchMove(e) {
      if (!isTracking) return;
      const touch = e.touches ? e.touches[0] : e;
      const diffX = touch.clientX - startX;
      const diffY = touch.clientY - startY;

      if (!isHorizontalGesture) {
        if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
          isHorizontalGesture = true;
        } else if (Math.abs(diffY) > 10) {
          isTracking = false;
          return;
        }
      }

      if (isHorizontalGesture) {
        if (e.cancelable) e.preventDefault();
        currentDeltaX = diffX;
        const track = getTrack();
        if (track) {
          track.classList.add('is-dragging');
          let effectiveDelta = diffX;
          if ((currentOnbSlideIndex === 0 && diffX > 0) || (currentOnbSlideIndex === 2 && diffX < 0)) {
            effectiveDelta = diffX * 0.35;
          }
          track.style.transform = `translate3d(calc(-${currentOnbSlideIndex * 33.333333}% + ${effectiveDelta}px), 0, 0)`;
        }
      }
    }

    function onTouchEnd() {
      if (!isTracking) return;
      isTracking = false;
      const track = getTrack();
      if (track) track.classList.remove('is-dragging');

      if (isHorizontalGesture) {
        if (currentDeltaX < -45 && currentOnbSlideIndex < 2) {
          window.goToOnboardingSlide(currentOnbSlideIndex + 1);
        } else if (currentDeltaX > 45 && currentOnbSlideIndex > 0) {
          window.goToOnboardingSlide(currentOnbSlideIndex - 1);
        } else {
          window.goToOnboardingSlide(currentOnbSlideIndex);
        }
      }
      currentDeltaX = 0;
      isHorizontalGesture = false;
    }

    const onbContainer = getContainer();
    if (onbContainer) {
      onbContainer.addEventListener('touchstart', onTouchStart, { passive: true });
      onbContainer.addEventListener('touchmove', onTouchMove, { passive: false });
      onbContainer.addEventListener('touchend', onTouchEnd, { passive: true });

      // Suporte suave a mouse drag no container de onboarding (desktop)
      onbContainer.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        onTouchStart(e);
        const onMouseMove = (ev) => onTouchMove(ev);
        const onMouseUp = () => {
          onTouchEnd();
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }
  })();

  // Carrossel horizontal das telas principais (Conquista 29 ↔ Home 10 ↔ Minijogos 15) com suporte a touch e mouse drag
  (function initHorizontalCarouselGestures() {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isTracking = false;
    let hasDragged = false;
    let isHorizontalSwipe = false;

    function handleStart(x, y, target) {
      if (!target) return;
      if (window.habbiTutorialActive) return;
      if (target.closest('.wl-hub-overlay.is-open, .wl-sav-sheet-overlay.is-open, .wl-goal-modal-overlay.is-open, .wl-qreg-overlay.is-open, .wl-sos-modal.is-open, #habbi-tutorial-overlay')) {
        return;
      }
      if (userState.isGameActive && currentScreen === 15) {
        return;
      }
      if ((currentScreen === 15 && userState.minijogosMode === 'tools') || (currentScreen === 29 && userState.conquistaMode === 'tools')) {
        return;
      }
      const mainCarousel = document.getElementById('main-carousel-container');
      if (!mainCarousel || !mainCarousel.classList.contains('active')) {
        return;
      }
      // Bloqueia arrasto horizontal acidental durante uma partida de minijogo ativa
      if (userState.isGameActive && currentCarouselSlide === 2) {
        return;
      }

      startX = x;
      startY = y;
      currentX = x;
      isTracking = true;
      hasDragged = false;
      isHorizontalSwipe = false;
    }

    function handleMove(x, y, e) {
      if (!isTracking) return;
      currentX = x;
      const diffX = x - startX;
      const diffY = y - startY;

      if (!isHorizontalSwipe) {
        if (Math.abs(diffX) > 16 && Math.abs(diffX) > Math.abs(diffY) * 1.25) {
          isHorizontalSwipe = true;
          hasDragged = true;
        } else if (Math.abs(diffY) > 12) {
          isTracking = false;
          return;
        }
      }

      if (isHorizontalSwipe) {
        if (e && e.cancelable) e.preventDefault();
        const track = document.getElementById('main-carousel-track');
        if (track) {
          track.classList.add('is-dragging');
          let resistedDiffX = diffX;
          if (currentCarouselSlide === 0 && diffX > 0) {
            resistedDiffX = diffX * 0.28;
          } else if (currentCarouselSlide === 2 && diffX < 0) {
            resistedDiffX = diffX * 0.28;
          }
          const basePct = -currentCarouselSlide * 33.333333;
          track.style.transform = "translate3d(calc(" + basePct + "% + " + resistedDiffX + "px), 0, 0)";
        }
      }
    }

    function handleEnd(endX, endY) {
      if (!isTracking) return;
      isTracking = false;

      const track = document.getElementById('main-carousel-track');
      if (track) track.classList.remove('is-dragging');

      if (isHorizontalSwipe) {
        const finalX = (endX !== undefined ? endX : currentX);
        const diffX = finalX - startX;
        const threshold = 40;
        userState.minijogosMode = 'carousel';
        userState.conquistaMode = 'carousel';
        const mc = document.getElementById('main-carousel-container');
        if (mc) mc.classList.remove('tools-mode');
        const s15 = document.querySelector('.screen[data-screen="15"]');
        if (s15) s15.classList.remove('tools-mode');
        const s29 = document.querySelector('.screen[data-screen="29"]');
        if (s29) s29.classList.remove('tools-mode');

        if (diffX < -threshold && currentCarouselSlide < 2) {
          window.goToCarouselSlide(currentCarouselSlide + 1, true);
        } else if (diffX > threshold && currentCarouselSlide > 0) {
          window.goToCarouselSlide(currentCarouselSlide - 1, true);
        } else {
          window.goToCarouselSlide(currentCarouselSlide, true);
        }

        window.habbiCarouselJustDragged = true;
        setTimeout(() => { window.habbiCarouselJustDragged = false; }, 180);
      }
    }

    document.addEventListener('click', (e) => {
      if (window.habbiCarouselJustDragged) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true);

    // Gestos de arrasto ficam SOMENTE no viewport (abaixo da nav bar fixa) para nunca interferir nos botões do topo
    const container = document.getElementById('main-carousel-viewport') || document.getElementById('main-carousel-container') || document;

    container.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (isTracking && e.touches && e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
      const touch = e.changedTouches && e.changedTouches[0];
      handleEnd(touch ? touch.clientX : currentX, touch ? touch.clientY : undefined);
    }, { passive: true });

    container.addEventListener('touchcancel', () => {
      handleEnd(currentX);
    }, { passive: true });

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      handleStart(e.clientX, e.clientY, e.target);
    });

    window.addEventListener('mousemove', (e) => {
      if (isTracking) {
        handleMove(e.clientX, e.clientY, e);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (isTracking) {
        handleEnd(e.clientX, e.clientY);
      }
    });
  })();

  /* ==========================================================================
     MÓDULO: TUTORIAL INTERATIVO DE PRIMEIROS PASSOS NO HABBI
     - Executa somente no primeiro acesso à Home após o onboarding
     - Balões contextuais adaptados sobre a interface real com escurecimento suave (sem blur)
     - Etapas:
       1. Registro de cigarro
       2. Calendário (remoção e ajuste de registros incorretos)
       3. Carrossel de páginas (movimento horizontal)
       4. Economia estimada
       5. SOS (ajuda rápida para momentos de vontade)
       6. Ferramentas (no menu do Habbi)
     - Botões Próximo, Voltar e Pular com salvamento persistente
     - Permite reabrir pelo Perfil ("Como usar o Habbi")
     ========================================================================== */
  let currentTutorialStep = 0;
  window.habbiTutorialActive = false;

  function hideTutorialSwipeHint() {
    const swipeHint = document.getElementById('wl-carousel-swipe-hint');
    if (swipeHint) {
      swipeHint.classList.remove('is-tutorial-visible');
      swipeHint.style.display = 'none';
    }
  }
  window.hideTutorialSwipeHint = hideTutorialSwipeHint;

  const HABBI_TUTORIAL_STEPS = [
    {
      stepIndex: 1,
      screen: 10,
      title: 'Registre seu dia',
      desc: 'Toque aqui para adicionar um cigarro e acompanhar seu consumo.',
      targetSelector: '#btn-home-add-cig',
      fallbackTarget: '.wl-home-add-btn',
      prepare: () => {
        hideTutorialSwipeHint();
        if (window.toggleHabbiHubMenu) window.toggleHabbiHubMenu(false);
        if (currentScreen !== 10) showScreen(10);
      }
    },
    {
      stepIndex: 2,
      screen: 10,
      title: 'Errou um registro?',
      desc: 'Abra o calendário, selecione o dia e remova ou ajuste os cigarros registrados.',
      targetSelector: '.wl-top-nav-btn[onclick*="16"]',
      fallbackTarget: '.wl-home-topbar',
      prepare: () => {
        hideTutorialSwipeHint();
        if (window.toggleHabbiHubMenu) window.toggleHabbiHubMenu(false);
        if (currentScreen !== 10) showScreen(10);
      }
    },
    {
      stepIndex: 3,
      screen: 10,
      title: 'Explore o Habbi',
      desc: 'Arraste para os lados para encontrar sua economia e os minijogos.',
      targetSelector: '.wl-home-pager-bar',
      fallbackTarget: '.wl-pager-nav-dots',
      prepare: () => {
        hideTutorialSwipeHint();
        if (window.toggleHabbiHubMenu) window.toggleHabbiHubMenu(false);
        if (currentScreen !== 10) showScreen(10);
      }
    },
    {
      stepIndex: 4,
      screen: 10,
      title: 'Acompanhe sua economia',
      desc: 'Veja uma estimativa do dinheiro que deixou de gastar com base no seu consumo e nos registros. Não é dinheiro recebido pelo aplicativo.',
      targetSelector: '.wl-home-savings-pill',
      fallbackTarget: '.wl-home-topbar',
      prepare: () => {
        hideTutorialSwipeHint();
        if (window.toggleHabbiHubMenu) window.toggleHabbiHubMenu(false);
        if (currentScreen !== 10) showScreen(10);
      }
    },
    {
      stepIndex: 5,
      screen: 10,
      title: 'Uma ajuda quando precisar',
      desc: 'O SOS reúne exercícios e distrações para os momentos de vontade de fumar.',
      targetSelector: '#btn-home-sos',
      fallbackTarget: '.wl-home-sos-pill',
      prepare: () => {
        hideTutorialSwipeHint();
        if (window.toggleHabbiHubMenu) window.toggleHabbiHubMenu(false);
        if (currentScreen !== 10) showScreen(10);
      }
    },
    {
      stepIndex: 6,
      screen: 10,
      title: 'Mais recursos para você',
      desc: 'Encontre exercícios de respiração, atividades de apoio e recursos para o dia a dia.',
      targetSelector: '.wl-top-nav-btn[onclick*="toggleHabbiHubMenu"]',
      fallbackTarget: '.wl-home-topbar',
      isLast: true,
      prepare: () => {
        hideTutorialSwipeHint();
        if (currentScreen !== 10) showScreen(10);
        if (window.toggleHabbiHubMenu) window.toggleHabbiHubMenu(false);
      }
    }
  ];

  window.startInteractiveTutorial = function() {
    window.habbiTutorialActive = true;
    currentTutorialStep = 0;
    renderTutorialStep(currentTutorialStep, true);
  };

  function renderTutorialStep(stepIndex, isInitial = false) {
    const step = HABBI_TUTORIAL_STEPS[stepIndex];
    if (!step) return;

    step.prepare();

    let targetEl = null;
    if (step.targetSelector) {
      targetEl = document.querySelector(step.targetSelector);
    }
    if (!targetEl && step.fallbackTarget) {
      targetEl = document.querySelector(step.fallbackTarget);
    }

    const overlay = document.getElementById('habbi-tutorial-overlay');
    const spotlight = document.getElementById('habbi-tutorial-spotlight');
    const popover = document.getElementById('habbi-tutorial-popover');
    const badgeEl = document.getElementById('habbi-tutorial-step-badge');
    const titleEl = document.getElementById('habbi-tutorial-title');
    const descEl = document.getElementById('habbi-tutorial-desc');
    const btnBack = document.getElementById('habbi-tutorial-btn-back');
    const btnNext = document.getElementById('habbi-tutorial-btn-next');
    const btnSkip = document.getElementById('habbi-tutorial-skip-btn');
    const deviceEl = document.querySelector('.device-screen') || document.querySelector('.device-container') || document.body;

    if (!overlay || !spotlight || !popover || !deviceEl) return;

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : window.HABBI_I18N.PT;
    const stepText = (t.tutorialSteps && t.tutorialSteps[stepIndex]) || { title: step.title, desc: step.desc };

    if (badgeEl) badgeEl.innerText = `${step.stepIndex} ${t.tutStepOf || 'de'} ${HABBI_TUTORIAL_STEPS.length}`;
    if (titleEl) titleEl.innerText = stepText.title;
    if (descEl) descEl.innerText = stepText.desc;

    if (btnBack) {
      btnBack.innerText = t.tutPrev || 'Voltar';
      btnBack.style.display = (stepIndex === 0) ? 'none' : 'inline-flex';
    }
    if (btnNext) {
      btnNext.innerText = step.isLast ? (t.tutFinish || 'Concluir') : (t.tutNext || 'Próximo');
    }
    if (btnSkip) {
      btnSkip.innerText = t.tutSkip || 'Pular';
    }

    const extraEl = document.getElementById('habbi-tutorial-extra');
    if (extraEl) {
      extraEl.style.display = 'none';
      extraEl.innerHTML = '';
    }

    const devRect = deviceEl.getBoundingClientRect();
    let top = devRect.height * 0.4;
    let left = 16;
    let width = devRect.width - 32;
    let height = 64;

    if (targetEl) {
      const elRect = targetEl.getBoundingClientRect();
      top = elRect.top - devRect.top;
      left = elRect.left - devRect.left;
      width = elRect.width;
      height = elRect.height;
    }

    const pad = 6;
    const spotTop = Math.max(4, top - pad);
    const spotLeft = Math.max(4, left - pad);
    const spotWidth = Math.min(devRect.width - 8, width + pad * 2);
    const spotHeight = height + pad * 2;

    // Se for a primeira exibição, desativa transições temporariamente para posicionar sem travamento/salto
    if (isInitial) {
      spotlight.style.transition = 'none';
      popover.style.transition = 'none';
    }

    spotlight.style.top = `${spotTop}px`;
    spotlight.style.left = `${spotLeft}px`;
    spotlight.style.width = `${spotWidth}px`;
    spotlight.style.height = `${spotHeight}px`;

    // Posicionamento dinâmico do balão para garantir legibilidade perfeita
    const popHeight = popover.offsetHeight || 185;
    const spaceBelow = devRect.height - (spotTop + spotHeight);

    let popTop;
    if (spotTop > devRect.height * 0.52 || spaceBelow < popHeight + 14) {
      // Posiciona acima do elemento destacado
      popTop = Math.max(14, spotTop - popHeight - 12);
    } else {
      // Posiciona abaixo do elemento destacado
      popTop = Math.min(devRect.height - popHeight - 14, spotTop + spotHeight + 12);
    }

    popover.style.top = `${popTop}px`;

    overlay.style.display = 'block';
    overlay.style.opacity = '1';

    if (isInitial) {
      void popover.offsetHeight; // Força reflow síncrono
      requestAnimationFrame(() => {
        spotlight.style.transition = '';
        popover.style.transition = '';
      });
    }
  }

  window.nextInteractiveTutorialStep = function() {
    if (currentTutorialStep < HABBI_TUTORIAL_STEPS.length - 1) {
      currentTutorialStep++;
      renderTutorialStep(currentTutorialStep, false);
    } else {
      completeInteractiveTutorial(false);
    }
  };

  window.prevInteractiveTutorialStep = function() {
    if (currentTutorialStep > 0) {
      currentTutorialStep--;
      renderTutorialStep(currentTutorialStep, false);
    }
  };

  window.skipInteractiveTutorial = function() {
    completeInteractiveTutorial(true);
  };

  function completeInteractiveTutorial(skipped = false) {
    window.habbiTutorialActive = false;
    userState.tutorialCompleted = true;
    savePersistedState();

    hideTutorialSwipeHint();
    if (window.toggleHabbiHubMenu) window.toggleHabbiHubMenu(false);

    const overlay = document.getElementById('habbi-tutorial-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }

    if (currentScreen !== 10) {
      showScreen(10);
    }
    hideTutorialSwipeHint();

    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : window.HABBI_I18N.PT;

    if (skipped) {
      showToast(t.tutToastSkip || 'Tutorial pulado. Você pode revê-lo no Perfil.');
    } else {
      showToast(t.tutToastDone || 'Tudo pronto para usar o Habbi!');
    }
  }

  function checkAndTriggerFirstTimeTutorial() {
    const completedOnb = Boolean(userState.onboardingCompleted);
    const tutorialDone = Boolean(userState.tutorialCompleted);
    if (!tutorialDone && !window.habbiTutorialActive && (completedOnb || currentScreen === 10)) {
      setTimeout(() => {
        const stillNotDone = !Boolean(userState.tutorialCompleted);
        if (!window.habbiTutorialActive && stillNotDone && currentScreen === 10) {
          startInteractiveTutorial();
        }
      }, 500);
    }
  }

  window.completeInteractiveTutorial = completeInteractiveTutorial;
  window.checkAndTriggerFirstTimeTutorial = checkAndTriggerFirstTimeTutorial;

  // Overlays (menu Hub, objetivo, parâmetros) ficam fora das telas que deslizam:
  // um ancestral com transform quebraria o posicionamento/cliques deles.
  ['wl-hub-menu-modal', 'wl-goal-modal-overlay', 'wl-sav-sheet-overlay'].forEach(id => {
    const el = document.getElementById(id);
    const host = document.querySelector('.device-screen');
    if (el && host && el.parentElement !== host) host.appendChild(el);
  });

  // Suporte a teclado acessível para o minigame de Sequência (teclas numéricas 1, 2, 3, 4)
  document.addEventListener('keydown', (e) => {
    if (!userState.isGameActive || !sequenceGameState || sequenceGameState.phase !== 'repeating') return;
    const keyMap = { '1': '1', '2': '2', '3': '3', '4': '4' };
    if (keyMap[e.key]) {
      e.preventDefault();
      handleSimonButtonPress(keyMap[e.key]);
    }
  });

  // Initial runs
  syncLocalTestEnvControls();
  if (typeof window.applyAppLanguage === 'function') {
    window.applyAppLanguage(userState.currentLang || 'PT');
  }
  if (typeof updateMinigamesRecordUI === 'function') {
    updateMinigamesRecordUI();
  }
  refreshAllViews(true);

  const hashRaw = (window.location.hash || '').replace('#', '').trim().toLowerCase();
  let hashScreen = parseInt(hashRaw);

  let initialScreen = 1;

  if (hashRaw === 'home' || hashRaw === '10') {
    initialScreen = 10;
  } else if (!isNaN(hashScreen) && hashScreen >= 1 && hashScreen <= totalScreens) {
    // Se o desenvolvedor ou usuário abriu uma tela específica no hash (ex: #16, #29, #12)
    initialScreen = hashScreen;
  } else {
    // Padrão: Sempre inicia na Splash Screen (Tela 1), permitindo ver a roleta completa e iniciar o Onboarding com 1 toque
    initialScreen = 1;
  }

  showScreen(initialScreen);
});
