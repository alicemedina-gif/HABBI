window.goToScreen = function(screenNum) { if (typeof window.showScreen === 'function') { window.showScreen(screenNum); } };
document.addEventListener('DOMContentLoaded', () => {
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
    packPrice: 15.00,
    cigsPerPack: 20,
    packFreqDays: 2,
    packEvents: [],
    totalSavings: 0.00,
    cigarettesAvoided: 0,
    savingsHistory: [],
    savingsGoal: { title: 'Minha conquista', target: 250 },
    tutorialCompleted: false,
    hasConfiguredFirstGoal: false
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
      metaTitle: 'Sua meta diária',
      metaDesc: 'Defina uma meta realista para hoje.',
      metaUnit: 'cigarros por dia',
      metaSubmit: 'Pronto!',

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
      homeSosBtn: 'SOS • Ajuda rápida',
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
      gameSeqSub: 'Ordem numérica',
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
      themeLight: 'Claro',
      themeDark: 'Escuro',

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
      conquistaExpensesMonth: 'Neste mês',
      conquistaExpensesPerCig: 'Custo estimado: {0} / cigarro',
      homeRemoveCigAria: 'Remover um cigarro',
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
      metaTitle: 'Your daily goal',
      metaDesc: 'Set a realistic goal for today.',
      metaUnit: 'cigarettes per day',
      metaSubmit: 'Done!',

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
      homeSosBtn: 'SOS • Quick help',
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
      gameSeqSub: 'Number order',
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
      themeLight: 'Light',
      themeDark: 'Dark',

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
      homeRemoveCigAria: 'Remove one cigarette',
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
      metaTitle: 'Tu meta diaria',
      metaDesc: 'Define una meta realista para hoy.',
      metaUnit: 'cigarrillos por día',
      metaSubmit: '¡Listo!',

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
      homeSosBtn: 'SOS • Ayuda rápida',
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
      gameSeqSub: 'Orden numérico',
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
      themeLight: 'Claro',
      themeDark: 'Oscuro',

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
      homeRemoveCigAria: 'Quitar un cigarrillo',
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

  window.applyAppLanguage = function(langKey) {
    const code = (langKey || 'PT').toUpperCase();
    const lang = HABBI_I18N[code] ? code : 'PT';
    userState.currentLang = lang;
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
      if (h2) h2.innerText = t.metaTitle || t.configTitle || 'Sua meta diária';
      const h1 = s7.querySelector('h1');
      if (h1) h1.innerText = t.metaH1 || 'Quantos cigarros você fuma por dia?';
      const calcUnit = s7.querySelector('.wl-calc-unit-label');
      if (calcUnit) calcUnit.innerText = t.metaUnit || 'cigarros por dia';
      const calcSub = s7.querySelector('.wl-calc-sub');
      if (calcSub) calcSub.innerText = t.metaStartHere || (lang === 'EN' ? "Let's start here!" : (lang === 'ES' ? '¡Empecemos por aquí!' : 'Vamos começar por aqui!'));
      const btnDone = document.getElementById('btn-calc-done');
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
    const homeSosBtnText = document.querySelector('.wl-home-sos-pill span');
    if (homeSosBtnText) homeSosBtnText.innerText = t.homeSosBtn || 'SOS • Ajuda rápida';
    const homeAddCigText = document.querySelector('.wl-home-add-btn span');
    if (homeAddCigText) homeAddCigText.innerText = t.homeAddCig || 'Registrar cigarro';
    const homeRemoveBtn = document.getElementById('btn-home-remove-cig');
    if (homeRemoveBtn) {
      const remLabel = t.homeRemoveCigAria || 'Remover um cigarro';
      homeRemoveBtn.setAttribute('aria-label', remLabel);
      homeRemoveBtn.setAttribute('title', remLabel);
    }
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

    // Screen 11: Registro Rápido
    const s11Title = document.querySelector('.screen[data-screen="11"] h2');
    if (s11Title) s11Title.innerText = t.quickTitle;
    const qNoSmoke = document.querySelector('#btn-quick-no-smoke span');
    if (qNoSmoke) qNoSmoke.innerText = t.quickNoSmoke;
    const qUrge = document.querySelector('#btn-quick-urge span');
    if (qUrge) qUrge.innerText = t.quickUrge;
    const qSmoke = document.querySelector('#btn-quick-smoke span');
    if (qSmoke) qSmoke.innerText = t.quickSmoke;
    const qMood = document.querySelector('.btn-quick-choice.mood span');
    if (qMood) qMood.innerText = t.quickMood;

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
    if (calLegends.length >= 3) {
      calLegends[0].innerHTML = `<i class="dot green"></i>${t.calLegendGoal}`;
      calLegends[1].innerHTML = `<i class="dot pink"></i>${t.calLegendOver}`;
      calLegends[2].innerHTML = `<i class="dot neutral"></i>${t.calLegendEmpty}`;
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
    }

    // Screen 23: Login
    const s23 = document.querySelector('.screen[data-screen="23"]');
    if (s23) {
      const h2 = s23.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.loginTitle;
      const sub = s23.querySelector('.detail-header .caption');
      if (sub) sub.innerText = t.loginSubtitle;
      const guestBtn = s23.querySelector('button[onclick*="10"]');
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
    }

    // Screen 28: Minha Conta
    const s28 = document.querySelector('.screen[data-screen="28"]');
    if (s28) {
      const h2 = s28.querySelector('.detail-header h2');
      if (h2) h2.innerText = t.accountTitle;
      const labels = s28.querySelectorAll('.form-label');
      if (labels.length >= 5) {
        labels[0].innerText = t.accountNameLabel || 'Nome';
        labels[1].innerText = t.accountEmailLabel || 'E-mail';
        labels[2].innerText = t.accountPassLabel || 'Nova Senha (opcional)';
        labels[3].innerText = t.accountMetaLabel || 'Meta Diária (cigarros/dia)';
        labels[4].innerText = t.accountPackPriceLabel || 'Preço do Maço (R$)';
      }
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
      const disc = document.getElementById('wl-conquista-disclaimer');
      if (disc) disc.innerText = t.conquistaDisclaimer || 'Estimativa baseada nos seus registros.';
      const expTitle = document.getElementById('wl-expenses-title');
      if (expTitle) expTitle.innerText = t.conquistaExpensesTitle || 'Seus gastos';
      const expSub = document.getElementById('wl-expenses-sub');
      if (expSub) expSub.innerText = t.conquistaExpensesSub || 'Gasto estimado com base nos seus registros';
      const expTodayLbl = document.getElementById('wl-expenses-today-lbl');
      if (expTodayLbl) expTodayLbl.innerText = t.conquistaExpensesToday || 'Hoje';
      const expMonthLbl = document.getElementById('wl-expenses-month-lbl');
      if (expMonthLbl) expMonthLbl.innerText = t.conquistaExpensesMonth || 'Neste mês';
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
    const qSaveMoodBtn = document.getElementById('wl-qreg-save-mood-btn');
    if (qSaveMoodBtn) qSaveMoodBtn.innerText = t.qregSaveMoodBtn || 'Salvar humor';

    // Atualiza detalhes do calendário se visível
    if (currentScreen === 16 && typeof updateCalendarSummaryAndDetails === 'function' && typeof userState.calViewYear === 'number') {
      const daysInMonth = new Date(userState.calViewYear, userState.calViewMonth + 1, 0).getDate();
      updateCalendarSummaryAndDetails(userState.calViewYear, userState.calViewMonth, daysInMonth);
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

  const RECORDS_STORAGE_KEY = 'habbi-real-records-v2';

  function loadPersistedState() {
    try {
      const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (!raw) {
        userState.currentLang = localStorage.getItem('habbi-app-lang') || 'PT';
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.currentLang === 'string') {
          userState.currentLang = parsed.currentLang;
        } else {
          userState.currentLang = localStorage.getItem('habbi-app-lang') || 'PT';
        }
        if (typeof parsed.name === 'string') {
          userState.name = parsed.name;
        }
        if (typeof parsed.email === 'string') {
          userState.email = parsed.email;
        }
        if (typeof parsed.avatar === 'string') {
          userState.avatar = parsed.avatar;
        }
        if (typeof parsed.isAuthenticated === 'boolean') {
          userState.isAuthenticated = parsed.isAuthenticated;
        } else {
          userState.isAuthenticated = false;
        }
        if (parsed.dailyRecords && typeof parsed.dailyRecords === 'object') {
          userState.dailyRecords = parsed.dailyRecords;
        }
        if (typeof parsed.todayMeta === 'number' && parsed.todayMeta >= 1) {
          userState.todayMeta = parsed.todayMeta;
        }
        if (typeof parsed.habitualCigs === 'number' && parsed.habitualCigs >= 1) {
          userState.habitualCigs = parsed.habitualCigs;
        } else if (typeof parsed.todayMeta === 'number' && parsed.todayMeta >= 1) {
          userState.habitualCigs = parsed.todayMeta;
        }
        if (typeof parsed.habitualCigsCustomized === 'boolean') {
          userState.habitualCigsCustomized = parsed.habitualCigsCustomized;
        }
        if (typeof parsed.packPrice === 'number' && parsed.packPrice > 0) {
          userState.packPrice = parsed.packPrice;
        }
        if (typeof parsed.cigsPerPack === 'number' && parsed.cigsPerPack >= 1) {
          userState.cigsPerPack = parsed.cigsPerPack;
        }
        if (typeof parsed.packFreqDays === 'number' && parsed.packFreqDays >= 1) {
          userState.packFreqDays = parsed.packFreqDays;
        }
        if (Array.isArray(parsed.packEvents)) {
          userState.packEvents = parsed.packEvents;
        }
        if (typeof parsed.cigarettesAvoided === 'number' && parsed.cigarettesAvoided >= 0) {
          userState.cigarettesAvoided = parsed.cigarettesAvoided;
        }
        if (Array.isArray(parsed.savingsHistory)) {
          userState.savingsHistory = parsed.savingsHistory;
        }
        if (parsed.savingsGoal && typeof parsed.savingsGoal.title === 'string') {
          const lower = parsed.savingsGoal.title.toLowerCase();
          if (lower.includes('bola') || lower === 'jantar especial' || !parsed.savingsGoal.title.trim()) {
            userState.savingsGoal = { title: (typeof getDefaultGoalTitle === 'function' ? getDefaultGoalTitle(userState.currentLang) : 'Minha conquista'), target: parsed.savingsGoal.target || 250 };
          } else {
            userState.savingsGoal = parsed.savingsGoal;
          }
        }
        if (typeof parsed.tutorialCompleted === 'boolean') {
          userState.tutorialCompleted = parsed.tutorialCompleted;
        } else if (localStorage.getItem('habbi-tutorial-completed') === '1') {
          userState.tutorialCompleted = true;
        } else {
          userState.tutorialCompleted = false;
        }
        if (typeof parsed.hasConfiguredFirstGoal === 'boolean') {
          userState.hasConfiguredFirstGoal = parsed.hasConfiguredFirstGoal;
        } else if (localStorage.getItem('habbi-first-goal-set') === '1') {
          userState.hasConfiguredFirstGoal = true;
        } else {
          userState.hasConfiguredFirstGoal = false;
        }
      }
    } catch (_e) {
      // Ignora erro de leitura no localStorage
    }
  }

  function savePersistedState() {
    try {
      const payload = {
        name: userState.name || '',
        email: userState.email || '',
        avatar: userState.avatar || 'verde',
        currentLang: userState.currentLang || 'PT',
        isAuthenticated: Boolean(userState.isAuthenticated),
        dailyRecords: userState.dailyRecords,
        todayMeta: userState.todayMeta,
        habitualCigs: userState.habitualCigs,
        habitualCigsCustomized: userState.habitualCigsCustomized,
        packPrice: userState.packPrice,
        cigsPerPack: userState.cigsPerPack,
        packFreqDays: userState.packFreqDays,
        packEvents: userState.packEvents,
        cigarettesAvoided: userState.cigarettesAvoided,
        savingsHistory: userState.savingsHistory,
        savingsGoal: userState.savingsGoal,
        tutorialCompleted: Boolean(userState.tutorialCompleted),
        hasConfiguredFirstGoal: Boolean(userState.hasConfiguredFirstGoal)
      };
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem('habbi-app-lang', userState.currentLang || 'PT');
    } catch (_e) {
      // Ignora erro de gravação no localStorage
    }
  }
  window.savePersistedState = savePersistedState;

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
      const rawRecords = localStorage.getItem(RECORDS_STORAGE_KEY);
      const parsedRecords = rawRecords ? JSON.parse(rawRecords) : {};

      const allHabbiKeys = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('habbi-')) {
          allHabbiKeys[k] = localStorage.getItem(k);
        }
      }

      const snapshot = {
        app: 'Habbi',
        schemaVersion: '2.0.0',
        exportedAt: new Date().toISOString(),
        userState: {
          name: userState.name || '',
          email: userState.email || '',
          avatar: userState.avatar || 'verde',
          currentLang: userState.currentLang || 'PT',
          isAuthenticated: Boolean(userState.isAuthenticated),
          todayMeta: userState.todayMeta || 11,
          habitualCigs: userState.habitualCigs || 11,
          habitualCigsCustomized: Boolean(userState.habitualCigsCustomized),
          packPrice: userState.packPrice || 12,
          cigsPerPack: userState.cigsPerPack || 20,
          packFreqDays: userState.packFreqDays || 1,
          packEvents: Array.isArray(userState.packEvents) ? userState.packEvents : [],
          cigarettesAvoided: userState.cigarettesAvoided || 0,
          savingsHistory: Array.isArray(userState.savingsHistory) ? userState.savingsHistory : [],
          savingsGoal: userState.savingsGoal || null,
          dailyRecords: userState.dailyRecords || {}
        },
        persistedPayload: parsedRecords,
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
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, errors: ['Objeto de backup ausente ou nulo.'], summary: null };
    }
    const state = parsed.userState || parsed.persistedPayload;
    if (!state || typeof state !== 'object') {
      errors.push('Falta seção "userState" ou "persistedPayload" no backup.');
    } else {
      if (typeof state.dailyRecords !== 'object') {
        errors.push('"dailyRecords" ausente ou inválido.');
      }
      if (typeof state.todayMeta !== 'number' && typeof state.todayMeta !== 'undefined') {
        errors.push('"todayMeta" deve ser numérico.');
      }
    }

    const dailyKeys = (state && state.dailyRecords) ? Object.keys(state.dailyRecords) : [];
    const summary = {
      app: parsed.app || 'Desconhecido',
      schemaVersion: parsed.schemaVersion || '1.0',
      exportedAt: parsed.exportedAt || 'Desconhecido',
      totalDaysWithRecords: dailyKeys.length,
      hasSavingsGoal: Boolean(state && state.savingsGoal),
      avatar: (state && state.avatar) || 'verde',
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
      if (parsed.allHabbiLocalStorage && typeof parsed.allHabbiLocalStorage === 'object') {
        Object.keys(parsed.allHabbiLocalStorage).forEach(key => {
          try {
            localStorage.setItem(key, parsed.allHabbiLocalStorage[key]);
          } catch (_e) {}
        });
      }

      if (incomingState) {
        localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(incomingState));
      }

      loadPersistedState();

      if (typeof syncUserProfileUI === 'function') syncUserProfileUI();
      if (typeof renderCalendarDays === 'function') renderCalendarDays();
      if (typeof renderHistoryTimeline === 'function') renderHistoryTimeline();

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
    const dateStr = new Date().toISOString().slice(0, 10);
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

  function getOrCreateDayRecord(dateKey) {
    const key = dateKey || getDateKey(new Date());
    if (!userState.dailyRecords[key]) {
      userState.dailyRecords[key] = {
        dateKey: key,
        cigs: 0,
        meta: userState.todayMeta || 11,
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
    if (!record.meta) record.meta = userState.todayMeta || 11;
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
    const meta = record.meta || userState.todayMeta || 11;
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
    const meta = record.meta || userState.todayMeta || 11;
    if (record.cigs > meta) return false;
    const todayKey = getDateKey(new Date());
    if (dateKey < todayKey) return true;
    if (record.smokeFree || record.dayCompleted) return true;
    return false;
  }

  function recalculateAllStats() {
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
      if (evs.length === 0) {
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

    savePersistedState();
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

  function refreshAllViews() {
    recalculateAllStats();
    syncUserProfileUI();
    if (typeof updateHomeScreen === 'function') updateHomeScreen();
    if (typeof generateCalendar === 'function') generateCalendar();
    if (typeof renderHistoryTimeline === 'function') renderHistoryTimeline();
    if (typeof updateSavingsDisplay === 'function') updateSavingsDisplay();
    if (typeof syncQuickRegisterModalUI === 'function') syncQuickRegisterModalUI();
  }

  function recordHabbiEvent({ dateKey, kind, title, desc, detail, moodValue, influences, note }) {
    const targetKey = dateKey || getDateKey(new Date());
    const rec = getOrCreateDayRecord(targetKey);
    rec.meta = userState.todayMeta || 11;

    const now = new Date();
    const timeClock = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const todayKey = getDateKey(now);
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

  // Notificações popup desativadas para manter a interface limpa
  function showToast(_message) {
    const toast = document.getElementById('toast-notice');
    if (toast) toast.classList.remove('show');
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
      if (typeof window.checkAndTriggerFirstTimeTutorial === 'function') {
        window.checkAndTriggerFirstTimeTutorial();
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
      if (metaField) metaField.value = userState.todayMeta || 11;
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
    const habitual = Math.max(1, parseInt(userState.habitualCigs, 10) || parseInt(userState.todayMeta, 10) || 12);
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
      const isFinalized = key < todayKey || Boolean(rec.smokeFree || rec.dayCompleted);

      if (key === todayKey) {
        hasTodayRecord = true;
        todayCigs = dayCigs;
        todayAvoided = dayAvoided;
        todaySavings = daySaved;
        todayIsFinalized = isFinalized;
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

    // Valor protagonista: mostra o consolidado se houver dias finalizados, ou o parcial de hoje caso hoje tenha registros em aberto
    const showPartialAsHero = m.confirmedDaysCount === 0 && m.hasTodayRecord && !m.todayIsFinalized;
    const heroSavingsVal = showPartialAsHero ? m.todaySavings : m.confirmedSavings;
    const heroFormatted = formatBrl(heroSavingsVal);

    const navValEl = document.getElementById('nav-savings-label');
    const totalValEl = document.getElementById('savings-total-value');
    const statsSavedEl = document.getElementById('stats-total-saved');
    const statsCigsEl = document.getElementById('stats-cigs-avoided');

    if (navValEl) navValEl.innerText = heroFormatted;
    if (totalValEl) totalValEl.innerText = heroFormatted;
    if (statsSavedEl) statsSavedEl.innerText = `R$ ${Math.round(heroSavingsVal)}`;
    if (statsCigsEl) statsCigsEl.innerText = showPartialAsHero ? m.todayAvoided : m.confirmedAvoidedCigs;

    const topSavingsTexts = document.querySelectorAll('.top-savings-value-text');
    topSavingsTexts.forEach(el => {
      el.innerText = heroFormatted;
    });

    // Elementos da nova Tela 29 (Sua economia)
    const statusBadgeEl = document.getElementById('wl-sav-status-badge');
    const cigsSummaryEl = document.getElementById('wl-sav-cigs-summary');
    const dayStatusTextEl = document.getElementById('wl-sav-day-status-text');

    if (statusBadgeEl && cigsSummaryEl && dayStatusTextEl) {
      statusBadgeEl.className = 'wl-sav-status-badge';
      if (showPartialAsHero) {
        statusBadgeEl.classList.add('is-partial');
        statusBadgeEl.innerText = 'Parcial de hoje • Dia em aberto';
        cigsSummaryEl.innerText = `${m.todayAvoided} ${m.todayAvoided === 1 ? 'cigarro evitado' : 'cigarros evitados'} hoje`;
        dayStatusTextEl.innerText = `Sem fumar hoje: ${formatBrl(m.fullDaySavings)} • Definitivo: R$ 0,00`;
      } else if (m.confirmedDaysCount > 0) {
        statusBadgeEl.classList.add('is-confirmed');
        statusBadgeEl.innerText = 'Economia estimada confirmada';
        cigsSummaryEl.innerText = `${m.confirmedAvoidedCigs} ${m.confirmedAvoidedCigs === 1 ? 'cigarro evitado' : 'cigarros evitados'} no total`;
        if (m.hasTodayRecord && !m.todayIsFinalized) {
          dayStatusTextEl.innerText = `Hoje (parcial): +${formatBrl(m.todaySavings)} (${m.todayAvoided} cig)`;
        } else if (m.todayIsFinalized) {
          dayStatusTextEl.innerText = `Hoje finalizado: +${formatBrl(m.todaySavings)} (${m.todayAvoided} cig)`;
        } else {
          dayStatusTextEl.innerText = `Hoje sem registro • Sem fumar hoje: +${formatBrl(m.fullDaySavings)}`;
        }
      } else {
        statusBadgeEl.classList.add('is-neutral');
        statusBadgeEl.innerText = 'Economia estimada';
        cigsSummaryEl.innerText = '0 cigarros evitados • Nenhum registro hoje';
        dayStatusTextEl.innerText = `Sem fumar hoje: ${formatBrl(m.fullDaySavings)} (${m.habitual} cigarros)`;
      }
    }

    // Tela 29 simplificada: rótulo curto e bloco "Hoje"
    const heroLblEl = document.getElementById('wl-sav-hero-lbl');
    if (heroLblEl) heroLblEl.innerText = showPartialAsHero ? 'Parcial de hoje' : 'Economia estimada';
    const todayHabEl = document.getElementById('wl-sav-today-habitual');
    const todaySmokedEl = document.getElementById('wl-sav-today-smoked');
    const todaySavedEl = document.getElementById('wl-sav-today-saved');
    if (todayHabEl) todayHabEl.innerText = m.habitual;
    if (todaySmokedEl) todaySmokedEl.innerText = m.hasTodayRecord ? m.todayCigs : '—';
    if (todaySavedEl) todaySavedEl.innerText = formatBrl(m.hasTodayRecord ? m.todaySavings : 0);

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
          row.innerHTML = `
            <div class="wl-sav-history-left">
              <i class="wl-sav-history-dot ${isAvoided ? 'green' : 'blue'}"></i>
              <div class="wl-sav-history-texts">
                <strong>${isAvoided ? 'Compra de maço evitada' : 'Maço comprado'}</strong>
                <span>${ev.timeLabel || 'Hoje'} • ${ isAvoided ? 'Dinheiro não gasto' : 'Gasto registrado' }</span>
              </div>
            </div>
            <div class="wl-sav-history-right">
              <strong class="${isAvoided ? 'pos' : 'neg'}">${isAvoided ? '+' : '-'}${formatBrl(ev.price)}</strong>
              <button type="button" class="wl-sav-history-del" onclick="deletePackPurchase('${ev.id}')" title="Remover">✕</button>
            </div>
          `;
          historyContainer.appendChild(row);
        });

        // 2. Economia diária consolidada (dias finalizados)
        m.dailyHistoryItems.forEach(item => {
          const row = document.createElement('div');
          row.className = 'wl-sav-history-row';
          row.innerHTML = `
            <div class="wl-sav-history-left">
              <i class="wl-sav-history-dot green"></i>
              <div class="wl-sav-history-texts">
                <strong>${item.title}</strong>
                <span>${item.subtitle}</span>
              </div>
            </div>
            <div class="wl-sav-history-right">
              <strong class="pos">+${formatBrl(item.amount)}</strong>
            </div>
          `;
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
  };

  window.closeSavingsSheet = function() {
    const overlay = document.getElementById('wl-sav-sheet-overlay');
    if (overlay) overlay.classList.remove('is-open');
  };

  window.adjustSavingsHabitual = function(delta) {
    const cur = Math.max(1, parseInt(userState.habitualCigs, 10) || parseInt(userState.todayMeta, 10) || 12);
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
  };

  window.closeChangeGoalModal = function() {
    const modal = document.getElementById('wl-goal-modal-overlay');
    if (modal) modal.classList.remove('is-open');
  };

  window.selectGoalPreset = function(title, target) {
    userState.savingsGoal = { title, target: Math.max(10, parseFloat(target) || 250) };
    userState.hasConfiguredFirstGoal = true;
    try { localStorage.setItem('habbi-first-goal-set', '1'); } catch (_e) {}
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
    userState.savingsGoal = { title, target };
    userState.hasConfiguredFirstGoal = true;
    try { localStorage.setItem('habbi-first-goal-set', '1'); } catch (_e) {}
    savePersistedState();
    window.closeChangeGoalModal();
    window.updateConquistaBagUI();
  };

  window.updateConquistaBagUI = function() {
    const m = computeSavingsMetrics();
    const heroSavingsVal = (m.confirmedDaysCount === 0 && m.hasTodayRecord && !m.todayIsFinalized) ? m.todaySavings : m.confirmedSavings;

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
    if (heroValEl) {
      heroValEl.innerText = `${t.conquistaEstPrefix || 'Economia estimada:'} ${formatBrl(heroSavingsVal)}`;
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

    // Confetes na primeira vez que atinge 100%
    if (pct >= 100) {
      const celKey = 'habbi-sacola-100-celebrated';
      if (!localStorage.getItem(celKey)) {
        localStorage.setItem(celKey, 'true');
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

    const track = document.getElementById('main-carousel-track');
    if (track) {
      track.style.transition = smooth ? 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none';
      track.style.transform = 'translate3d(-' + (slideIdx * 33.333333) + '%, 0, 0)';
    }

    // Sincroniza estado ativo de todos os grupos de pager dots (.wl-pager-dot)
    document.querySelectorAll('.wl-pager-nav-dots').forEach(bar => {
      const dots = bar.querySelectorAll('.wl-pager-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === slideIdx);
      });
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

  window.navigateHorizontalCarousel = function(targetScreen) {
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
    if (!userState.isAuthenticated) {
      showToast('Crie ou acesse sua conta para fazer registros!');
      userState.authReturnScreen = returnScreen || currentScreen || 10;
      showScreen(24);
      return;
    }
    userState.activeRegisterDateKey = dateKey || getDateKey(new Date());
    userState.returnScreenAfterRegister = returnScreen || currentScreen || 10;
    if (typeof window.openQuickRegisterModal === 'function') {
      window.openQuickRegisterModal(userState.activeRegisterDateKey);
    }
  };

  window.openRegisterFromCalendar = function() {
    if (!userState.isAuthenticated) {
      showToast('Crie ou acesse sua conta para fazer registros!');
      userState.authReturnScreen = 16;
      showScreen(24);
      return;
    }
    userState.activeRegisterDateKey = userState.calSelectedDate || getDateKey(new Date());
    userState.returnScreenAfterRegister = 16;
    if (typeof window.openQuickRegisterModal === 'function') {
      window.openQuickRegisterModal(userState.activeRegisterDateKey);
    }
  };

  // "Não fumei hoje" direto do Calendário: confirma o dia selecionado e abre o "Bate aqui!"
  window.confirmNoSmokeFromCalendar = function() {
    if (!userState.isAuthenticated) {
      showToast('Crie ou acesse sua conta para confirmar seu dia!');
      userState.authReturnScreen = 16;
      showScreen(24);
      return;
    }
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
          <div class="wl-splash-progress-track" id="wl-splash-progress-wrap">
            <div class="wl-splash-progress-fill" id="wl-splash-progress-fill"></div>
          </div>

          <div class="wl-splash-cta-bar" id="wl-splash-cta-wrap">
            <button type="button" class="wl-splash-lang-trigger" id="btn-splash-lang" title="Trocar idioma">
              <span class="wl-lang-flag-circle" id="wl-lang-flag-circle">${flagSVGs.PT}</span>
              <span class="wl-lang-code-txt" id="wl-lang-code-txt">PT</span>
            </button>
            <button type="button" class="wl-splash-white-start-btn" id="btn-splash-start">INICIAR</button>
          </div>
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
        const progressWrap = document.getElementById('wl-splash-progress-wrap');
        const progressFill = document.getElementById('wl-splash-progress-fill');
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
        if (progressWrap) progressWrap.classList.remove('is-hidden');
        if (progressFill) progressFill.style.width = '6%';

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

        steps.forEach((step, i) => {
          const timer = setTimeout(() => {
            const pct = Math.min(100, Math.round(((i + 1) / steps.length) * 100));
            if (progressFill) progressFill.style.width = pct + '%';

            if (step.final) {
              showFrame(step.idx, 'celebrate');
              if (confettiLayer) confettiLayer.classList.add('is-active');
              if (burstRing) burstRing.classList.add('is-active');
              if (progressWrap) progressWrap.classList.add('is-hidden');
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
          <div class="wl-calc-top-left">
            <button type="button" class="wl-calc-back" onclick="goToScreen(5)" aria-label="Voltar">\u2039</button>
            <h2 class="wl-calc-top-title">Sua meta di\u00e1ria</h2>
          </div>
        </header>

        <div class="wl-calc-main-column">
          <div class="wl-calc-body">
          <!-- Meta diária como protagonista absoluta e centralizada -->
          <div class="wl-calc-hero">
            <div class="wl-calc-big-number">
              <span id="cigarettes-per-day-val">11</span>
            </div>
            <div class="wl-calc-unit-label">cigarros por dia</div>
            <span class="wl-calc-sub">Vamos come\u00e7ar por aqui!</span>
          </div>

          <!-- Botões de seleção que abrem a aba inferior (bottom sheet) com opções -->
          <div class="wl-calc-pills">
            <button type="button" class="wl-calc-pill-card wl-calc-option-btn" id="btn-open-calc-cigs" onclick="openCalcOptionSheet('cigs')">
              <div class="wl-calc-pill-row">
                <span>Consumo di\u00e1rio</span>
                <span class="wl-calc-btn-right">
                  <strong id="wl-cigs-pill-label">11 cigarros</strong>
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
                <span>Pre\u00e7o do ma\u00e7o</span>
                <span class="wl-calc-btn-right">
                  <strong id="wl-price-pill-label">R$ 10,00</strong>
                  <svg class="wl-calc-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </div>
            </button>
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
            <span id="home-meta-registered">0</span><small> / <span id="home-meta-cigs">11</span> hoje</small>
          </div>
          <div class="wl-home-sub-stat">
            <strong id="home-display-days">0</strong> <span id="home-display-days-label">dias sem fumar</span> \u2022 <span id="home-meta-pct">0%</span> da meta de hoje
          </div>
          <button type="button" class="wl-home-nosmoke-badge" id="home-nosmoke-badge" onclick="handleHomeNoSmokeToday()" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span id="home-nosmoke-badge-text">N\u00e3o fumei hoje</span>
          </button>
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
          <div class="wl-cig-meter-wrap" id="home-cig-meter" onclick="handleHomeAddCigarette()" title="Toque para adicionar">
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>SOS • Ajuda rápida</span>
          </button>

          <div class="wl-home-primary-row">
            <button type="button" class="wl-home-remove-btn" id="btn-home-remove-cig" onclick="handleHomeRemoveCigarette()" aria-label="Remover um cigarro" title="Remover um cigarro" disabled aria-disabled="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>

            <button type="button" class="wl-dark-pill-btn wl-home-add-btn" id="btn-home-add-cig" onclick="handleHomeAddCigarette()" aria-label="Registrar cigarro" title="Registrar cigarro">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
      userState.openedFromMenu = true;
      window.toggleHabbiHubMenu(false);
      if (screenNum === 11) {
        userState.activeRegisterDateKey = getDateKey(new Date());
        userState.returnScreenAfterRegister = 10;
        if (typeof window.openQuickRegisterModal === 'function') {
          window.openQuickRegisterModal(userState.activeRegisterDateKey);
        }
        return;
      }
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <div class="wl-cal-title-box">
                <h2 class="wl-cal-month-title" id="wl-cal-month-title">${initTitle}</h2>
                <button type="button" class="wl-cal-today-chip" id="wl-cal-today-btn" onclick="resetCalendarToToday()" style="display:none;">Hoje</button>
              </div>
              <button type="button" class="wl-cal-nav-arrow" onclick="changeCalendarMonth(1)" aria-label="Próximo mês" title="Próximo mês">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
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
            <p class="caption">Acompanhe sua economia e metas</p>
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
          <div class="wl-conquista-goal-card" onclick="openChangeGoalModal()" role="button" tabindex="0" title="Toque para alterar seu objetivo">
            <div class="wl-conquista-goal-left">
              <span class="wl-conquista-goal-label">Objetivo</span>
              <strong class="wl-conquista-goal-title" id="wl-conquista-goal-title">Minha conquista</strong>
            </div>
            <div class="wl-conquista-goal-right">
              <span class="wl-conquista-goal-target" id="wl-conquista-goal-target">R$ 250,00</span>
              <span class="wl-conquista-change-chip">Trocar</span>
            </div>
          </div>

          <!-- Palco da Sacola de Compras Preenchível (Habbi Flat Style com Ilustração Original) -->
          <div class="wl-conquista-bag-stage" id="wl-conquista-bag-stage" onclick="openChangeGoalModal()" role="button" tabindex="0" title="Toque para alterar seu objetivo">
            <svg width="0" height="0" style="position:absolute;pointer-events:none;" aria-hidden="true">
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
          </div>

          <!-- Métricas Centrais da Conquista -->
          <div class="wl-conquista-metrics">
            <div class="wl-conquista-pct-pill" id="wl-conquista-pct-pill">0% do objetivo</div>
            <div class="wl-conquista-main-val" id="wl-conquista-main-val">Economia estimada: R$ 0,00</div>
            <div class="wl-conquista-remaining" id="wl-conquista-remaining">Faltam R$ 250,00</div>
            <span id="savings-total-value" style="display:none;">R$ 0,00</span>
          </div>

          <!-- Disclaimer sutil e acolhedor -->
          <p class="wl-conquista-disclaimer" id="wl-conquista-disclaimer">
            Estimativa baseada nos seus registros.
          </p>

          <!-- Seção secundária e sutil: Seus gastos (independente da economia estimada) -->
          <section class="wl-conquista-expenses-card" id="wl-conquista-expenses-card" aria-labelledby="wl-expenses-title">
            <div class="wl-expenses-head">
              <h3 class="wl-expenses-title" id="wl-expenses-title">Seus gastos</h3>
              <span class="wl-expenses-per-cig" id="wl-expenses-per-cig">Custo estimado: R$ 0,50 / cigarro</span>
            </div>
            <div class="wl-expenses-grid">
              <div class="wl-expenses-item">
                <span class="wl-expenses-lbl" id="wl-expenses-today-lbl">Hoje</span>
                <strong class="wl-expenses-val" id="wl-expenses-today-val">R$ 0,00</strong>
              </div>
              <div class="wl-expenses-divider" aria-hidden="true"></div>
              <div class="wl-expenses-item">
                <span class="wl-expenses-lbl" id="wl-expenses-month-lbl">Neste mês</span>
                <strong class="wl-expenses-val" id="wl-expenses-month-val">R$ 0,00</strong>
              </div>
            </div>
            <p class="wl-expenses-sub" id="wl-expenses-sub">Gasto estimado com base nos seus registros</p>
          </section>

          <!-- Ações secundárias -->
          <div class="wl-conquista-sub-actions">
            <button type="button" class="wl-conquista-action-btn" onclick="openSavingsSheet('config')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
              <span>Ajustar consumo</span>
            </button>
            <button type="button" class="wl-conquista-action-btn" onclick="openSavingsSheet('history')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Histórico</span>
            </button>
          </div>
        </div>

        <!-- Modal: Trocar Objetivo de Conquista -->
        <div class="wl-goal-modal-overlay" id="wl-goal-modal-overlay" onclick="if(event.target===this)closeChangeGoalModal()">
          <div class="wl-goal-modal-sheet" role="dialog" aria-labelledby="wl-goal-modal-title">
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
                  <input type="number" id="wl-sav-cfg-price-input" class="wl-sav-price-input" min="1" max="150" step="0.50" value="15.00" oninput="onSavingsPriceInput(this.value)" aria-label="Preço do maço de cigarros">
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
      const celBtn = document.getElementById('wl-cel-btn');
      if (celBtn) {
        celBtn.addEventListener('click', () => {
          celModal.style.display = 'none';
          celModal.classList.remove('is-playing');
          const targetScr = userState.returnScreenAfterRegister || currentScreen || 10;
          userState.returnScreenAfterRegister = 10;
          if (currentScreen !== targetScr) {
            showScreen(targetScr);
          }
        });
      }

      const qregModal = document.createElement('div');
      qregModal.id = 'wl-quick-register-modal';
      qregModal.className = 'wl-qreg-overlay';
      qregModal.onclick = (e) => {
        if (e.target === qregModal) window.closeQuickRegisterModal();
      };
      qregModal.innerHTML = `
        <div class="wl-qreg-sheet">
          <div class="wl-qreg-header">
            <div>
              <h3 class="wl-qreg-title" id="wl-qreg-header-title">Adicionar registro</h3>
              <span class="wl-qreg-date" id="wl-qreg-date-label">Hoje</span>
            </div>
            <button type="button" class="wl-close-circle" onclick="closeQuickRegisterModal()" aria-label="Fechar">✕</button>
          </div>

          <div class="wl-qreg-actions-grid">
            <button type="button" class="wl-qreg-action-btn green" id="wl-qreg-btn-confirm-day" onclick="quickConfirmDay()">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span id="wl-qreg-confirm-lbl">Não fumei hoje</span>
            </button>
            <button type="button" class="wl-qreg-action-btn blue" onclick="quickAddUrge()">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
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
                <button type="button" class="wl-qreg-step-btn plus" onclick="quickAdjustCigarette(1)">+1 cigarro</button>
              </div>
            </div>
          </div>

          <div class="wl-qreg-mood-block" id="wl-qreg-mood-block">
            <span class="wl-qreg-section-lbl">Como está se sentindo?</span>
            <div class="wl-qreg-mood-row" id="wl-qreg-mood-row">
              <button type="button" class="wl-qreg-mood-pill" data-mood="Feliz" onclick="selectQuickMood('Feliz')" title="Feliz">
                <img src="assets/ilustracoes/Cabeça de Gato Preto com Olhos Verdes feliz.png" alt="Feliz" class="wl-qreg-mood-img">
                <span>Feliz</span>
              </button>
              <button type="button" class="wl-qreg-mood-pill" data-mood="Calmo" onclick="selectQuickMood('Calmo')" title="Calmo">
                <img src="assets/ilustracoes/Cabeça de Gato Preto com Olhos Verdes calmo.png" alt="Calmo" class="wl-qreg-mood-img">
                <span>Calmo</span>
              </button>
              <button type="button" class="wl-qreg-mood-pill" data-mood="Ansioso" onclick="selectQuickMood('Ansioso')" title="Ansioso">
                <img src="assets/ilustracoes/Gato Preto Ansioso com Gotas Azuis.png" alt="Ansioso" class="wl-qreg-mood-img">
                <span>Ansioso</span>
              </button>
              <button type="button" class="wl-qreg-mood-pill" data-mood="Triste" onclick="selectQuickMood('Triste')" title="Triste">
                <img src="assets/ilustracoes/Gatinho Preto Triste com Olhos Verdes.png" alt="Triste" class="wl-qreg-mood-img">
                <span>Triste</span>
              </button>
              <button type="button" class="wl-qreg-mood-pill" data-mood="Irritado" onclick="selectQuickMood('Irritado')" title="Irritado">
                <img src="assets/ilustracoes/Rosto de Gato Preto Irritado.png" alt="Irritado" class="wl-qreg-mood-img">
                <span>Irritado</span>
              </button>
            </div>

            <div class="wl-qreg-mood-extra" id="wl-qreg-mood-extra" style="display:none;">
              <div class="wl-qreg-tags-row" id="wl-qreg-influence-chips">
                <button type="button" class="wl-qreg-tag" data-val="Sono" onclick="this.classList.toggle('selected'); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Sono</button>
                <button type="button" class="wl-qreg-tag" data-val="Exercício" onclick="this.classList.toggle('selected'); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Exercício</button>
                <button type="button" class="wl-qreg-tag" data-val="Trabalho" onclick="this.classList.toggle('selected'); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Trabalho</button>
                <button type="button" class="wl-qreg-tag" data-val="Relações" onclick="this.classList.toggle('selected'); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Relações</button>
                <button type="button" class="wl-qreg-tag" data-val="Alimentação" onclick="this.classList.toggle('selected'); if(window.syncQuickMoodExtraVisibility) window.syncQuickMoodExtraVisibility();">Alimentação</button>
              </div>
              <div class="wl-qreg-note-row">
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

    // Botão "Não fumei hoje" sempre visível e destacado na aba de registro
    const confirmBtn = document.getElementById('wl-qreg-btn-confirm-day');
    const confirmLbl = document.getElementById('wl-qreg-confirm-lbl');
    if (confirmBtn && confirmLbl) {
      confirmBtn.style.display = 'inline-flex';
      const isConfirmed = Boolean(rec && (rec.smokeFree || (Array.isArray(rec.events) && rec.events.some(e => e.kind === 'no-smoke'))));
      confirmLbl.innerText = isConfirmed ? 'Não fumei hoje ✓' : 'Não fumei hoje';
      if (isConfirmed) {
        confirmBtn.classList.add('is-confirmed');
      } else {
        confirmBtn.classList.remove('is-confirmed');
      }
    }
  };

  window.openQuickRegisterModal = function(dateKey, focusSection, editEventId) {
    const targetKey = dateKey || (currentScreen === 16 ? userState.calSelectedDate : null) || getDateKey(new Date());
    userState.activeRegisterDateKey = targetKey;
    userState.calSelectedDate = targetKey;
    quickEditingEventId = editEventId || null;

    const headerTitleEl = document.getElementById('wl-qreg-header-title');
    if (headerTitleEl) {
      headerTitleEl.innerText = editEventId ? 'Editar registro' : 'Adicionar registro';
    }

    quickSelectedMood = '';
    document.querySelectorAll('#wl-qreg-mood-row .wl-qreg-mood-pill').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#wl-qreg-influence-chips .wl-qreg-tag').forEach(t => t.classList.remove('selected'));
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
        b.classList.toggle('active', b.dataset.mood === quickSelectedMood);
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
        t.classList.toggle('selected', savedInfluences.includes(t.dataset.val));
      });
      if (noteIn) noteIn.value = savedNote;
      if (saveMoodBtn) saveMoodBtn.innerText = 'Salvar humor';
      if (extraEl) extraEl.style.display = 'flex';
    } else {
      if (extraEl) extraEl.style.display = 'none';
    }

    window.syncQuickRegisterModalUI();

    const modal = document.getElementById('wl-quick-register-modal');
    if (modal) modal.classList.add('is-open');
  };

  window.closeQuickRegisterModal = function() {
    quickEditingEventId = null;
    const modal = document.getElementById('wl-quick-register-modal');
    if (modal) modal.classList.remove('is-open');
    if (userState.openedFromMenu) {
      userState.openedFromMenu = false;
      setTimeout(() => window.toggleHabbiHubMenu(true), 40);
    }
  };

  function requireAuthToRegister(returnScreen) {
    if (!userState.isAuthenticated) {
      if (typeof showToast === 'function') {
        showToast('Crie ou acesse sua conta para salvar seus registros!');
      }
      userState.authReturnScreen = returnScreen || currentScreen || 10;
      showScreen(24);
      return false;
    }
    return true;
  }

  window.quickAdjustCigarette = function(delta) {
    if (!requireAuthToRegister(userState.returnScreenAfterRegister || 10)) return;
    const targetKey = userState.activeRegisterDateKey || getDateKey(new Date());
    userState.calSelectedDate = targetKey;
    const meta = userState.todayMeta || 11;

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
        rec.events.splice(smokeIdx, 1);
        recomputeDayAggregates(rec);
        if (rec.events.length === 0) {
          delete userState.dailyRecords[targetKey];
        }
        refreshAllViews();
      }
    }
  };

  window.quickConfirmDay = function() {
    if (!requireAuthToRegister(userState.returnScreenAfterRegister || 10)) return;
    const todayKey = getDateKey(new Date());
    const targetKey = userState.activeRegisterDateKey || todayKey;
    userState.calSelectedDate = targetKey;
    const rec = getOrCreateDayRecord(targetKey);

    // Se havia cigarros registrados por engano, zera para confirmar o dia sem fumar
    if (rec.cigs > 0 && Array.isArray(rec.events)) {
      rec.events = rec.events.filter(e => e.kind !== 'smoke');
      rec.cigs = 0;
    }

    const alreadyMarked = Array.isArray(rec.events) && rec.events.some(e => e.kind === 'no-smoke');
    if (!alreadyMarked) {
      userState.lastMascotState = 'celebrate';
      addSavings(1, 'Dia sem fumar');
      recordHabbiEvent({
        dateKey: targetKey,
        kind: 'no-smoke',
        title: 'Não fumei hoje',
        desc: '0 cigarros no dia',
        detail: 'Dia confirmado sem fumar.'
      });
    }
    // Se hoje também está com 0 cigarros e o usuário acionou "Não fumei hoje", garante sincronia na tela inicial
    const todayRec = userState.dailyRecords[todayKey];
    if ((!todayRec || todayRec.cigs === 0) && targetKey !== todayKey) {
      const tRec = getOrCreateDayRecord(todayKey);
      if (!tRec.events.some(e => e.kind === 'no-smoke')) {
        recordHabbiEvent({
          dateKey: todayKey,
          kind: 'no-smoke',
          title: 'Não fumei hoje',
          desc: '0 cigarros no dia',
          detail: 'Dia confirmado sem fumar.'
        });
      }
    }
    refreshAllViews();
    window.closeQuickRegisterModal();
    showCelebrationModal('Mais um dia cuidando de você.', 'Não fumei hoje!', 'assets/ilustracoes/pata pra cima.png');
  };

  window.quickAddUrge = function() {
    if (!requireAuthToRegister(userState.returnScreenAfterRegister || 10)) return;
    const targetKey = userState.activeRegisterDateKey || getDateKey(new Date());
    userState.calSelectedDate = targetKey;
    userState.lastMascotState = 'focus';
    recordHabbiEvent({
      dateKey: targetKey,
      kind: 'urge',
      title: 'Vontade superada',
      desc: 'Impulso controlado',
      detail: 'Vontade superada e registrada.'
    });
    window.closeQuickRegisterModal();
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
      });
    } else {
      quickSelectedMood = moodName;
      document.querySelectorAll('#wl-qreg-mood-row .wl-qreg-mood-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mood === moodName);
      });
    }
    window.syncQuickMoodExtraVisibility();
  };

  window.saveQuickMood = function() {
    const targetKey = userState.activeRegisterDateKey || getDateKey(new Date());
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
    window.closeQuickRegisterModal();
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
  };

  window.triggerQuickNoSmoke = function() {
    const btn = document.getElementById('btn-quick-no-smoke');
    if (btn) btn.click();
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

    if (metaCigs) metaCigs.innerText = userState.todayMeta;
    if (metaReg) metaReg.innerText = userState.todayLogged;

    // Atualiza estado do botão secundário "Remover um cigarro" na Home
    const homeRemoveBtn = document.getElementById('btn-home-remove-cig');
    if (homeRemoveBtn) {
      const canRemoveToday = (userState.todayLogged || 0) > 0;
      homeRemoveBtn.disabled = !canRemoveToday;
      homeRemoveBtn.setAttribute('aria-disabled', String(!canRemoveToday));
    }
    
    const pct = Math.min(100, Math.round((userState.todayLogged / Math.max(1, userState.todayMeta)) * 100));
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
    const metaVal = Math.max(1, userState.todayMeta || 11);
    const loggedVal = Math.max(0, userState.todayLogged || 0);
    const overLimit = Math.max(0, loggedVal - metaVal);

    if (metaReg) {
      if (overLimit === 1) {
        metaReg.style.color = '#D97706';
      } else if (overLimit === 2 || overLimit === 3) {
        metaReg.style.color = '#EA580C';
      } else if (overLimit === 4 || overLimit === 5) {
        metaReg.style.color = '#FF4736';
      } else if (overLimit >= 6) {
        metaReg.style.color = '#4A0E17';
      } else {
        metaReg.style.color = '';
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
        // Amarelo: preenche em 1 vez (100%)
        newStage = 'yellow';
        targetTopInset = 39.20;
      } else if (overLimit === 2) {
        // Laranja: 1ª de 2 (50%)
        newStage = 'orange';
        targetTopInset = 55.35;
      } else if (overLimit === 3) {
        // Laranja: 2ª de 2 (100%)
        newStage = 'orange';
        targetTopInset = 39.20;
      } else if (overLimit === 4) {
        // Vermelho: 1ª de 2 (50%)
        newStage = 'red';
        targetTopInset = 55.35;
      } else if (overLimit === 5) {
        // Vermelho: 2ª de 2 (100%)
        newStage = 'red';
        targetTopInset = 39.20;
      } else {
        // Escuro: 1 vez (100%)
        newStage = 'dark';
        targetTopInset = 39.20;
      }

      homeCigFill.classList.add(`is-stage-${newStage}`);

      const prevStage = homeCigFill.dataset.cigStage;
      // Se trocou de cor/estágio (e já havia um estágio anterior renderizado), anima preenchendo da base
      if (prevStage && prevStage !== newStage && overLimit > 0) {
        homeCigFill.style.transition = 'none';
        homeCigFill.style.clipPath = 'inset(71.5% 0 0 0)';
        void homeCigFill.offsetWidth;
        homeCigFill.style.transition = '';
      }
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
  }

  window.handleHomeNoSmokeToday = function() {
    if (!userState.isAuthenticated) {
      showToast('Crie ou acesse sua conta para confirmar seu dia!');
      userState.authReturnScreen = 10;
      showScreen(24);
      return;
    }
    const todayKey = getDateKey(new Date());
    userState.activeRegisterDateKey = todayKey;
    userState.returnScreenAfterRegister = 10;
    window.quickConfirmDay();
  };

  window.handleHomeAddCigarette = function() {
    if (!userState.isAuthenticated) {
      showToast('Crie ou acesse sua conta para começar a registrar!');
      userState.authReturnScreen = 10;
      showScreen(24);
      return;
    }
    const todayKey = getDateKey(new Date());
    const rec = getOrCreateDayRecord(todayKey);
    if (Array.isArray(rec.events)) {
      rec.events = rec.events.filter(e => e.kind !== 'no-smoke' && e.kind !== 'day-complete');
    }
    const nextNum = (rec.cigs || 0) + 1;
    const meta = userState.todayMeta || 11;

    recordHabbiEvent({
      dateKey: todayKey,
      kind: 'smoke',
      title: 'Cigarro registrado',
      desc: `${nextNum}/${meta} no dia`,
      detail: `Consumo anotado (${nextNum}/${meta}).`
    });

    const homeCigMeter = document.getElementById('home-cig-meter');
    if (homeCigMeter) {
      homeCigMeter.classList.remove('is-bumping');
    }

    const homeAddBtn = document.getElementById('btn-home-add-cig');
    if (homeAddBtn) {
      homeAddBtn.classList.remove('is-pressed');
      void homeAddBtn.offsetWidth;
      homeAddBtn.classList.add('is-pressed');
      setTimeout(() => homeAddBtn.classList.remove('is-pressed'), 260);
    }
  };

  window.handleHomeRemoveCigarette = function() {
    if (!userState.isAuthenticated) {
      return;
    }
    const todayKey = getDateKey(new Date());
    const rec = userState.dailyRecords[todayKey];
    if (!rec || !Array.isArray(rec.events) || (rec.cigs || 0) <= 0) {
      return;
    }

    // Remove somente o registro individual de cigarro mais recente de hoje (não afeta outros dias)
    const smokeIdx = rec.events.findIndex(e => e && e.kind === 'smoke');
    if (smokeIdx === -1) return;

    rec.events.splice(smokeIdx, 1);
    recomputeDayAggregates(rec);
    if (rec.events.length === 0) {
      delete userState.dailyRecords[todayKey];
    }

    refreshAllViews();

    const homeRemoveBtn = document.getElementById('btn-home-remove-cig');
    if (homeRemoveBtn) {
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
  // GAMIFICAÇÃO DE RECORDES DOS MINIJOGOS (HABBI FLAT GAMIFICATION)
  // -------------------------------------------------------------
  const GAME_RECORDS_KEY = 'habbi-game-records';
  function getGameRecords() {
    try {
      const raw = localStorage.getItem(GAME_RECORDS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_e) {}
    return { memory: 0, sequence: 0, reflex: 0, math: 0 };
  }
  window.getGameRecords = getGameRecords;

  function saveGameRecord(gameKey, score) {
    if (!score || score <= 0) return false;
    const records = getGameRecords();
    if (score > (records[gameKey] || 0)) {
      records[gameKey] = score;
      try {
        localStorage.setItem(GAME_RECORDS_KEY, JSON.stringify(records));
      } catch (_e) {}
      updateMinigamesRecordUI();
      return true;
    }
    return false;
  }
  window.saveGameRecord = saveGameRecord;

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

  // Minigame 2: Sequência Numérica Infinita com botões coloridos e destaque ao errar
  let sequenceGameState = {
    round: 1,
    completed: 0
  };

  function startSequenceGame(keepScore) {
    const boardWrapper = document.getElementById('game-sequence-board');
    if (!boardWrapper) return;
    if (!keepScore) {
      sequenceGameState.round = 1;
      sequenceGameState.completed = 0;
    }

    const badgeEl = document.getElementById('game-sequence-badge');
    if (badgeEl) {
      const recSeq = getGameRecords().sequence;
      badgeEl.innerText = `${formatGameScore('gameScoreSeq', sequenceGameState.completed, sequenceGameState.round)} • ${getGameRecordWord()}: ${recSeq}`;
    }

    boardWrapper.innerHTML = '';

    // Dificuldade progressiva: 6 números no início, aumentando até 9
    let count = 6;
    if (sequenceGameState.round >= 2) count = 7;
    if (sequenceGameState.round >= 3) count = 8;
    if (sequenceGameState.round >= 4) count = 9;

    const numbers = [];
    for (let i = 1; i <= count; i++) numbers.push(i);
    numbers.sort(() => Math.random() - 0.5);

    let currentTarget = 1;
    const targetDisplay = document.getElementById('game-sequence-target');
    if (targetDisplay) targetDisplay.innerText = currentTarget;

    const btnMap = {};

    numbers.forEach((num) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      // Botões coloridos com as classes color-0 a color-8
      const colorClass = `color-${(num - 1) % 9}`;
      btn.className = `sequence-btn ${colorClass}`;
      btn.innerText = num;
      btn.dataset.num = num;
      btnMap[num] = btn;

      btn.addEventListener('click', () => {
        if (num === currentTarget) {
          // Clique correto: esmaecer e desativar botão
          btn.style.opacity = '0.22';
          btn.style.transform = 'scale(0.92)';
          btn.style.pointerEvents = 'none';
          currentTarget++;

          if (currentTarget > count) {
            // Completou a sequência com sucesso
            sequenceGameState.completed++;
            sequenceGameState.round++;
            const isNew = saveGameRecord('sequence', sequenceGameState.completed);
            const curRec = getGameRecords().sequence;
            if (badgeEl) {
              badgeEl.innerText = `${formatGameScore('gameScoreSeq', sequenceGameState.completed, sequenceGameState.round)} • ${getGameRecordWord()}: ${curRec}`;
              if (isNew && sequenceGameState.completed > 1) {
                badgeEl.classList.add('record-burst');
                setTimeout(() => badgeEl.classList.remove('record-burst'), 600);
              }
            }
            if (targetDisplay) targetDisplay.innerText = '✓';
            setTimeout(() => {
              if (userState.isGameActive) {
                startSequenceGame(true);
              }
            }, 350);
          } else {
            if (targetDisplay) targetDisplay.innerText = currentTarget;
          }
        } else {
          // Errou: destacar brevemente o próximo número correto sem travar o jogo
          btn.style.transform = 'scale(0.9)';
          setTimeout(() => {
            btn.style.transform = '';
          }, 200);

          const nextCorrectBtn = btnMap[currentTarget];
          if (nextCorrectBtn) {
            nextCorrectBtn.classList.remove('sequence-hint-pulse');
            // Força reflow para reiniciar animação se necessário
            void nextCorrectBtn.offsetWidth;
            nextCorrectBtn.classList.add('sequence-hint-pulse');
            setTimeout(() => {
              nextCorrectBtn.classList.remove('sequence-hint-pulse');
            }, 850);
          }
        }
      });

      boardWrapper.appendChild(btn);
    });
  }

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
      instructionsEl.innerText = 'Encontre os pares dos gatinhos Habbi.';
      boardEl.innerHTML = '<div id="game-memory-board" class="memory-grid"></div>';
      startMemoryGame();
    } else if (gameType === 'sequence') {
      instructionsEl.innerText = 'Toque nos números em ordem crescente.';
      boardEl.innerHTML = `
        <div class="sequence-layout">
          <div class="game-score-badge" id="game-sequence-badge">Sequências: 0 • Rodada 1</div>
          <div class="sequence-target-num">Próximo número:</div>
          <div class="sequence-target-display" id="game-sequence-target">1</div>
          <div class="sequence-grid" id="game-sequence-board"></div>
        </div>
      `;
      startSequenceGame();
    } else if (gameType === 'reflex') {
      instructionsEl.innerText = 'Toque nas folhas do Habbi conforme aparecem.';
      boardEl.innerHTML = '<div id="game-reflex-board" class="reflex-board"></div>';
      startReflexGame();
    } else if (gameType === 'math') {
      instructionsEl.innerText = 'Resolva os cálculos e mantenha o foco.';
      boardEl.innerHTML = '<div id="game-math-board" style="width: 100%;"></div>';
      startMathGame();
    }
  }

  function resetMinigamesUI() {
    userState.isGameActive = false;
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
    userState.calViewMonth = m;
    userState.calViewYear = y;

    const now = new Date();
    if (y === now.getFullYear() && m === now.getMonth()) {
      userState.calSelectedDate = getDateKey(now);
    } else {
      userState.calSelectedDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
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

  window.selectCalendarDate = function(dateKey, animatePaw) {
    if (!dateKey) return;
    const { year, month } = parseDateKey(dateKey);
    userState.calViewYear = year;
    userState.calViewMonth = month;
    userState.calSelectedDate = dateKey;
    userState.calEventsExpandedDate = null;
    generateCalendar(Boolean(animatePaw));
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
    if (!userState.calSelectedDate) {
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

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevKey = `${prevMonthYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = 'calendar-grid-day is-outside';
      dayEl.setAttribute('aria-label', `${prevDay} de ${getMonthNamePt(prevMonthIdx)} de ${prevMonthYear}`);
      dayEl.innerHTML = `<span class="calendar-grid-circle state-outside">${prevDay}</span>`;
      dayEl.addEventListener('click', () => window.selectCalendarDate(prevKey, true));
      grid.appendChild(dayEl);
    }

    // 3. Dias do mês atual com estados visuais sólidos
    for (let day = 1; day <= daysInMonth; day++) {
      const dKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = getDayStatus(dKey);
      const isToday = dKey === todayKey;
      const isSelected = dKey === userState.calSelectedDate;

      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = 'calendar-grid-day';
      if (isToday) dayEl.classList.add('is-today');
      if (isSelected) dayEl.classList.add('is-selected');

      const statusDesc = status === 'green' ? 'Meta atingida' : status === 'exceeded' ? 'Meta ultrapassada' : status === 'zero' ? 'Sem consumo' : 'Sem registros';
      dayEl.setAttribute('aria-label', `${day} de ${getMonthNamePt(viewMonth)} de ${viewYear}, ${statusDesc}${isToday ? ' (Hoje)' : ''}`);

      const circle = document.createElement('span');
      circle.className = `calendar-grid-circle state-${status}`;
      circle.innerText = day;

      dayEl.appendChild(circle);
      if (isToday) {
        const todayDot = document.createElement('i');
        todayDot.className = 'wl-cal-today-dot';
        todayDot.setAttribute('aria-hidden', 'true');
        dayEl.appendChild(todayDot);
      }

      dayEl.addEventListener('click', () => window.selectCalendarDate(dKey, true));
      grid.appendChild(dayEl);
    }

    // 4. Preenche células restantes da última semana com o início do próximo mês
    const totalCells = firstDayOfWeek + daysInMonth;
    const trailingCells = (7 - (totalCells % 7)) % 7;
    const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;

    for (let nextDay = 1; nextDay <= trailingCells; nextDay++) {
      const nextKey = `${nextMonthYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = 'calendar-grid-day is-outside';
      dayEl.setAttribute('aria-label', `${nextDay} de ${getMonthNamePt(nextMonthIdx)} de ${nextMonthYear}`);
      dayEl.innerHTML = `<span class="calendar-grid-circle state-outside">${nextDay}</span>`;
      dayEl.addEventListener('click', () => window.selectCalendarDate(nextKey, true));
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
          const subText = ev.clock || ev.time;
          const extraNote = (ev.kind === 'mood' && ev.desc && ev.desc !== 'Sentimento registrado')
            ? `<small class="wl-cal-event-subdesc">${ev.desc}</small>`
            : '';
          const item = document.createElement('div');
          item.className = `wl-cal-event-row ${rowStateClass}`.trim();
          item.innerHTML = `
            <div class="wl-cal-event-main">
              <i class="wl-cal-event-dot ${dotClass}"></i>
              <div class="wl-cal-event-texts">
                <div class="wl-cal-event-title-col">
                  <strong>${ev.title}</strong>
                  ${extraNote}
                </div>
                <span>${subText}</span>
              </div>
            </div>
            <div class="wl-cal-event-actions">
              <button type="button" class="wl-cal-ev-btn" onclick="editHabbiEvent('${selKey}', '${ev.id}')" title="${t.calEventEdit || 'Editar'}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
                <span>${t.calEventEdit || 'Editar'}</span>
              </button>
              <button type="button" class="wl-cal-ev-btn danger" onclick="deleteHabbiEvent('${selKey}', '${ev.id}')" title="${t.calEventRemove || 'Remover'}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>${t.calEventRemove || 'Remover'}</span>
              </button>
            </div>
          `;
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
          toggleBtn.innerHTML = `
            <span id="wl-cal-toggle-events-txt">${isExpanded ? showLessText : seeMoreText}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
          `;
          toggleBtn.onclick = function() {
            const currentlyOpen = moreContainer.style.display === 'flex';
            if (currentlyOpen) {
              moreContainer.style.display = 'none';
              toggleBtn.classList.remove('is-expanded');
              document.getElementById('wl-cal-toggle-events-txt').innerText = seeMoreText;
              userState.calEventsExpandedDate = null;
            } else {
              moreContainer.style.display = 'flex';
              toggleBtn.classList.add('is-expanded');
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
    if (userState.isGameActive) {
      const returnScreen = userState.minijogosReturnScreen || 10;
      quitInlineGame();
      if (returnScreen === 14 || returnScreen === 12) {
        showScreen(returnScreen);
      }
      return;
    }
    window.handleBackFromScreen(15);
  };

  window.handleJourneyBack = function() {
    const completed = parseInt(localStorage.getItem('habbi-onboarding-completed')) || 0;
    if (completed === 1) {
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

  // Onboarding Routing
  const btnWelcomeSignup = document.getElementById('btn-welcome-signup');
  if (btnWelcomeSignup) btnWelcomeSignup.addEventListener('click', () => showScreen(24));
  const btnWelcomeLogin = document.getElementById('btn-welcome-login');
  if (btnWelcomeLogin) btnWelcomeLogin.addEventListener('click', () => showScreen(23));
  const btnOnb2 = document.getElementById('btn-onboarding-2-next');
  if (btnOnb2) btnOnb2.addEventListener('click', () => showScreen(5));
  const btnOnb3 = document.getElementById('btn-onboarding-3-next');
  if (btnOnb3) btnOnb3.addEventListener('click', () => showScreen(7));

  // Login / Register Screen submit bindings
  const loginSubmit = document.getElementById('btn-login-submit');
  if (loginSubmit) {
    loginSubmit.addEventListener('click', () => {
      const emailVal = document.getElementById('login-email').value.trim();
      if (emailVal) {
        const parts = emailVal.split('@')[0];
        const rawName = parts.charAt(0).toUpperCase() + parts.slice(1);
        userState.name = rawName;
        userState.email = emailVal;
      }
      userState.isAuthenticated = true;
      savePersistedState();
      refreshAllViews();
      showToast('Sessão iniciada com sucesso!');
      const targetScr = userState.authReturnScreen || 10;
      userState.authReturnScreen = 10;
      showScreen(targetScr);
    });
  }

  const registerSubmit = document.getElementById('btn-register-submit');
  if (registerSubmit) {
    registerSubmit.addEventListener('click', () => {
      const nameVal = document.getElementById('register-name').value.trim();
      const emailVal = document.getElementById('register-email').value.trim();
      if (nameVal) {
        userState.name = nameVal;
      }
      if (emailVal) {
        userState.email = emailVal;
      }
      userState.isAuthenticated = true;
      savePersistedState();
      refreshAllViews();
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
      const packPriceInput = document.getElementById('cigarettes-pack-price');
      if (packPriceInput) {
        const price = parseFloat(packPriceInput.value);
        if (!isNaN(price) && price > 0) {
          userState.packPrice = price;
        }
      }
      userState.metaExceededModalShown = false;
      localStorage.setItem('habbi-onboarding-completed', '1');
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
    localStorage.setItem('habbi-onboarding-completed', '1');
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
      if (isNaN(metaVal) || metaVal < 1) {
        showToast('A meta diária deve ser pelo menos 1.');
        return;
      }
      if (isNaN(packPriceVal) || packPriceVal <= 0) {
        showToast('O preço do maço deve ser maior que zero.');
        return;
      }

      userState.name = nameVal;
      userState.email = emailVal;
      userState.todayMeta = metaVal;
      userState.packPrice = packPriceVal;
      userState.isAuthenticated = true;
      
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
    const cleanVal = Math.max(1, Math.min(40, parseInt(val, 10) || 1));
    userState.todayMeta = cleanVal;
    if (!userState.habitualCigsCustomized) {
      userState.habitualCigs = cleanVal;
    }

    const cigarettesValBox = document.getElementById('cigarettes-per-day-val');
    if (cigarettesValBox) cigarettesValBox.innerText = cleanVal;

    const pillLbl = document.getElementById('wl-cigs-pill-label');
    if (pillLbl) pillLbl.innerText = `${cleanVal} ${cleanVal === 1 ? 'cigarro' : 'cigarros'}`;

    const sheetDisplay = document.getElementById('wl-sheet-cigs-display');
    if (sheetDisplay) sheetDisplay.innerText = cleanVal;

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
    const current = parseInt(userState.todayMeta, 10) || 11;
    window.setCalcCigsValue(current + (parseInt(delta, 10) || 0));
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

  // Sincroniza os valores iniciais exibidos nos 3 botões da tela 7
  window.setCalcCigsValue(userState.todayMeta || 11);
  window.setCalcPackPrice(userState.packPrice || 10);

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

  // Home Screen bindings
  const btnHomeSos = document.getElementById('btn-home-sos');
  if (btnHomeSos) {
    btnHomeSos.addEventListener('click', () => showScreen(12));
  }

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

  // Express Mood Log/Quick Log (Screen 11 buttons)
  const qNoSmoke = document.getElementById('btn-quick-no-smoke');
  if (qNoSmoke) {
    qNoSmoke.addEventListener('click', () => {
      window.quickConfirmDay();
      showToast('Confirmado: Dia sem fumar!');
      window.handleBackFromScreen(11);
    });
  }

  const qUrge = document.getElementById('btn-quick-urge');
  if (qUrge) {
    qUrge.addEventListener('click', () => {
      window.quickAddUrge();
      showToast('Vontade superada registrada!');
      window.handleBackFromScreen(11);
    });
  }

  const qSmoke = document.getElementById('btn-quick-smoke');
  if (qSmoke) {
    qSmoke.addEventListener('click', () => {
      window.quickAdjustCigarette(1);
      showToast('Cigarro registrado');
      window.handleBackFromScreen(11);
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

    const visibleEvents = Array.isArray(userState.historyEvents)
      ? userState.historyEvents.filter(evt => evt && evt.kind !== 'day-complete')
      : [];

    if (visibleEvents.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'card';
      emptyBox.style.cssText = 'padding: 24px 18px; text-align: center; border-radius: 20px;';
      emptyBox.innerHTML = `
        <div style="font-weight: 700; font-size: 15px; color: var(--text-primary); margin-bottom: 6px;">Nenhum registro salvo ainda</div>
        <p class="caption" style="margin: 0;">Seus registros diários aparecerão aqui automaticamente.</p>
      `;
      container.appendChild(emptyBox);
      return;
    }

    visibleEvents.forEach(evt => {
      const isSuccess = evt.type === 'sucesso' && evt.kind !== 'mood';
      const isOverMeta = evt.type === 'acima-meta' || evt.type === 'aviso' || evt.type === 'recaída';
      const isMood = evt.kind === 'mood' || evt.type === 'humor';
      
      let markerClass = 'urge';
      let markerSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      if (isMood) {
        markerClass = 'urge';
        markerSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
      } else if (isSuccess) {
        markerClass = 'success';
        markerSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      } else if (isOverMeta) {
        markerClass = 'relapse';
        markerSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
      }

      const itemHtml = `
        <div class="history-item">
          <div class="history-circle ${markerClass}">
            ${markerSvg}
          </div>
          <div class="history-content">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px; gap: 8px;">
              <span style="font-weight:700; font-size:14px; color:var(--text-primary);">${evt.title}</span>
              <span class="caption" style="color:var(--text-muted); font-size:11px; flex-shrink:0;">${evt.time}</span>
            </div>
            <p class="caption" style="margin-bottom:0; font-size:12px;">${evt.desc || evt.detail || ''}</p>
          </div>
        </div>
      `;
      const wrapper = document.createElement('div');
      wrapper.innerHTML = itemHtml;
      container.appendChild(wrapper.firstElementChild);
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

  // Theme Switching Logic
  const themeToggleBtn = document.getElementById('settings-theme');
  const themeStatusLabel = document.getElementById('theme-status-label');
  const deviceScreen = document.querySelector('.device-screen');

  function setTheme(theme) {
    if (theme === 'dark') {
      if (deviceScreen) deviceScreen.classList.add('dark-theme');
      if (themeStatusLabel) themeStatusLabel.innerText = 'Escuro';
      localStorage.setItem('habbi-theme', 'dark');
    } else {
      if (deviceScreen) deviceScreen.classList.remove('dark-theme');
      if (themeStatusLabel) themeStatusLabel.innerText = 'Claro';
      localStorage.setItem('habbi-theme', 'light');
    }
  }
  window.setTheme = setTheme;

  const savedTheme = localStorage.getItem('habbi-theme') || 'light';
  setTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (deviceScreen) {
        const isDark = deviceScreen.classList.contains('dark-theme');
        setTheme(isDark ? 'light' : 'dark');
      }
    });
  }

  // Logout Logic
  window.handleProfileLogout = function() {
    localStorage.removeItem('habbi-current-screen');
    localStorage.removeItem('habbi-theme');
    localStorage.removeItem(RECORDS_STORAGE_KEY);
    localStorage.removeItem('habbi-onboarding-completed');
    localStorage.removeItem('habbi-tutorial-completed');
    localStorage.removeItem('habbi-first-goal-set');
    
    window.habbiTutorialActive = false;
    userState.tutorialCompleted = false;
    userState.hasConfiguredFirstGoal = false;
    userState.savingsGoal = {
      title: typeof getDefaultGoalTitle === 'function' ? getDefaultGoalTitle(userState.currentLang) : 'Minha conquista',
      target: 250
    };

    if (typeof removeCalTutorialDemoRow === 'function') removeCalTutorialDemoRow();
    if (typeof hideTutorialSwipeHint === 'function') hideTutorialSwipeHint();
    if (typeof window.toggleHabbiHubMenu === 'function') window.toggleHabbiHubMenu(false);
    const overlay = document.getElementById('habbi-tutorial-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }

    userState.isAuthenticated = false;
    userState.name = '';
    userState.email = '';
    
    const nowReset = new Date();
    userState.motivations = [];
    userState.patterns = [];
    userState.mood = null;
    userState.sosUrge = 7;
    userState.sosContext = 'Casa';
    userState.sosTime = '3 min';
    userState.selectedIntervention = 'Respiração 4-6';
    userState.groundingCheckedCount = 0;
    userState.daysClean = 0;
    userState.totalUrgesOvercome = 0;
    userState.todayMeta = 11;
    userState.todayLogged = 0;
    userState.metaExceededModalShown = false;
    userState.isGameActive = false;
    userState.habitualCigs = 12;
    userState.habitualCigsCustomized = false;
    userState.packPrice = 15.00;
    userState.cigsPerPack = 20;
    userState.packFreqDays = 2;
    userState.packEvents = [];
    userState.cigarettesAvoided = 0;
    userState.savingsHistory = [];
    userState.dailyRecords = {};
    userState.historyEvents = [];
    userState.calViewYear = nowReset.getFullYear();
    userState.calViewMonth = nowReset.getMonth();
    userState.calSelectedDate = getDateKey(nowReset);
    userState.avatar = 'verde';
    
    savePersistedState();
    setTheme('light');
    syncUserProfileUI();
    refreshAllViews();
    try {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (_e) {}
    showToast('Você saiu da sua conta.');
    showScreen(1);
  };

  window.restartOnboarding = function() {
    localStorage.removeItem('habbi-onboarding-completed');
    localStorage.removeItem('habbi-current-screen');
    localStorage.removeItem('habbi-tutorial-completed');
    localStorage.removeItem('habbi-first-goal-set');
    window.habbiTutorialActive = false;
    userState.tutorialCompleted = false;
    userState.hasConfiguredFirstGoal = false;
    userState.savingsGoal = {
      title: typeof getDefaultGoalTitle === 'function' ? getDefaultGoalTitle(userState.currentLang) : 'Minha conquista',
      target: 250
    };
    if (typeof removeCalTutorialDemoRow === 'function') removeCalTutorialDemoRow();
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
    userState.isAuthenticated = true;
    if (!userState.name || userState.name === 'Visitante') {
      userState.name = provider === 'Apple' ? 'Usuário Apple' : 'Usuário Google';
    }
    userState.email = provider === 'Apple' ? 'usuario@icloud.com' : 'usuario@gmail.com';
    localStorage.setItem('habbi-onboarding-completed', '1');
    savePersistedState();
    refreshAllViews();
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

  function ensureCalTutorialDemoRow() {
    const eventsWrap = document.getElementById('wl-cal-day-events-wrap');
    if (!eventsWrap) return;
    const activeLang = (userState.currentLang || 'PT').toUpperCase();
    const t = (window.HABBI_I18N && window.HABBI_I18N[activeLang]) ? window.HABBI_I18N[activeLang] : window.HABBI_I18N.PT;
    if (!eventsWrap.querySelector('.wl-cal-event-row')) {
      const demoRow = document.createElement('div');
      demoRow.className = 'wl-cal-event-row wl-cal-tutorial-demo-row';
      demoRow.id = 'wl-cal-tutorial-demo-row';
      demoRow.innerHTML = `
        <div class="wl-cal-event-main">
          <i class="wl-cal-event-dot green"></i>
          <div class="wl-cal-event-texts">
            <div class="wl-cal-event-title-col">
              <strong>${t.calDemoEventTitle || '1 cigarro'}</strong>
              <small class="wl-cal-event-subdesc" style="color:var(--primary, #379A6A); font-weight:700;">${t.calDemoEventSubtitle || 'Exemplo para demonstração'}</small>
            </div>
            <span>14:30 • Intervalo</span>
          </div>
        </div>
        <div class="wl-cal-event-actions" id="wl-cal-demo-actions">
          <button type="button" class="wl-cal-ev-btn" onclick="showToast('${t.calDemoEditToast || 'No calendário real você edita horários e detalhes.'}')" title="${t.calBtnEdit || 'Editar'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
            <span>${t.calBtnEdit || 'Editar'}</span>
          </button>
          <button type="button" class="wl-cal-ev-btn danger" onclick="showToast('${t.calDemoDelToast || 'Toque aqui para remover um cigarro registrado por engano.'}')" title="${t.calBtnRemove || 'Remover'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>${t.calBtnRemove || 'Remover'}</span>
          </button>
        </div>
      `;
      eventsWrap.appendChild(demoRow);
    }
  }

  function removeCalTutorialDemoRow() {
    const demoRow = document.getElementById('wl-cal-tutorial-demo-row');
    if (demoRow && demoRow.parentNode) {
      demoRow.parentNode.removeChild(demoRow);
    }
  }

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
        removeCalTutorialDemoRow();
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
        removeCalTutorialDemoRow();
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
        removeCalTutorialDemoRow();
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
        removeCalTutorialDemoRow();
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
        removeCalTutorialDemoRow();
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
    try {
      localStorage.setItem('habbi-tutorial-completed', '1');
    } catch (_e) {}
    savePersistedState();

    removeCalTutorialDemoRow();
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
    const completedOnb = localStorage.getItem('habbi-onboarding-completed') === '1';
    const tutorialDone = Boolean(userState.tutorialCompleted) || localStorage.getItem('habbi-tutorial-completed') === '1';
    if (!tutorialDone && !window.habbiTutorialActive && (completedOnb || currentScreen === 10)) {
      setTimeout(() => {
        const stillNotDone = !Boolean(userState.tutorialCompleted) && localStorage.getItem('habbi-tutorial-completed') !== '1';
        if (!window.habbiTutorialActive && stillNotDone && currentScreen === 10) {
          startInteractiveTutorial();
        }
      }, 500);
    }
  }

  window.completeInteractiveTutorial = completeInteractiveTutorial;
  window.checkAndTriggerFirstTimeTutorial = checkAndTriggerFirstTimeTutorial;
  window.ensureCalTutorialDemoRow = ensureCalTutorialDemoRow;
  window.removeCalTutorialDemoRow = removeCalTutorialDemoRow;

  // Overlays (menu Hub, objetivo, parâmetros) ficam fora das telas que deslizam:
  // um ancestral com transform quebraria o posicionamento/cliques deles.
  ['wl-hub-menu-modal', 'wl-goal-modal-overlay', 'wl-sav-sheet-overlay'].forEach(id => {
    const el = document.getElementById(id);
    const host = document.querySelector('.device-screen');
    if (el && host && el.parentElement !== host) host.appendChild(el);
  });

  // Initial runs
  if (typeof window.applyAppLanguage === 'function') {
    window.applyAppLanguage(userState.currentLang || 'PT');
  }
  if (typeof updateMinigamesRecordUI === 'function') {
    updateMinigamesRecordUI();
  }
  refreshAllViews();

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
