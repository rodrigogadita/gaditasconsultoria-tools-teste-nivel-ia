/* ==========================================================================
   Banco de perguntas, dimensoes, perfis e mensagens de impulso.
   4 dimensoes x 10 perguntas = 40. O sorteio e sempre balanceado.
   ========================================================================== */

const DIMENSIONS = {
  conhecimento: {
    id: 'conhecimento',
    label: 'Conhecimento',
    desc: 'O quanto você entende de IA e consegue explicar para os outros.',
    axis: 'x',
    hex: { light: '#2a78d6', dark: '#3987e5' }
  },
  criterio: {
    id: 'criterio',
    label: 'Critério',
    desc: 'Sua capacidade de julgar, revisar e usar IA com responsabilidade.',
    axis: 'x',
    hex: { light: '#eb6834', dark: '#d95926' }
  },
  uso: {
    id: 'uso',
    label: 'Uso no dia a dia',
    desc: 'O quanto a IA já faz parte da sua rotina de trabalho.',
    axis: 'y',
    hex: { light: '#1baf7a', dark: '#199e70' }
  },
  criacao: {
    id: 'criacao',
    label: 'Criação',
    desc: 'O quanto você constrói suas próprias soluções com IA.',
    axis: 'y',
    hex: { light: '#eda100', dark: '#c98500' }
  }
};

/* Eixos do gráfico de quadrantes:
   X = o quanto a pessoa sabe  (conhecimento + critério)
   Y = usar -> criar           (uso + criação, com peso maior para criação) */
const AXIS_WEIGHTS = {
  x: { conhecimento: 0.55, criterio: 0.45 },
  y: { uso: 0.35, criacao: 0.65 }
};

const QUESTIONS = [
  /* ---------- CONHECIMENTO ---------- */
  { id: 'c01', dim: 'conhecimento', emoji: '🧠', text: 'Consigo explicar, em palavras simples, o que é um modelo de IA e como ele gera as respostas.' },
  { id: 'c02', dim: 'conhecimento', emoji: '🔍', text: 'Sei diferenciar IA generativa de automação comum e de análise de dados tradicional.' },
  { id: 'c03', dim: 'conhecimento', emoji: '🧩', text: 'Entendo como a forma de escrever o pedido (o prompt) muda completamente o resultado.' },
  { id: 'c04', dim: 'conhecimento', emoji: '📰', text: 'Acompanho as novidades de IA com alguma frequência (newsletters, vídeos, comunidades).' },
  { id: 'c05', dim: 'conhecimento', emoji: '📚', text: 'Já fiz algum curso, treinamento ou trilha de estudo sobre IA.' },
  { id: 'c06', dim: 'conhecimento', emoji: '🗂️', text: 'Entendo o que é dar contexto para a IA (anexar arquivos, montar uma base de conhecimento).' },
  { id: 'c07', dim: 'conhecimento', emoji: '🤖', text: 'Sei o que é um agente de IA e como ele é diferente de um chat comum.' },
  { id: 'c08', dim: 'conhecimento', emoji: '🎛️', text: 'Sei escolher a ferramenta certa para cada tarefa (texto, imagem, planilha, código, pesquisa).' },
  { id: 'c09', dim: 'conhecimento', emoji: '💡', text: 'Consigo identificar, na minha área, quais tarefas são boas candidatas para IA.' },
  { id: 'c10', dim: 'conhecimento', emoji: '🗣️', text: 'Já expliquei para alguém o que é IA e como ela funciona.' },

  /* ---------- CRITÉRIO ---------- */
  { id: 'r01', dim: 'criterio', emoji: '✅', text: 'Confio na minha capacidade de avaliar se a resposta da IA está correta.' },
  { id: 'r02', dim: 'criterio', emoji: '⚠️', text: 'Entendo os riscos e as limitações da IA atual (erros, invenções, vieses).' },
  { id: 'r03', dim: 'criterio', emoji: '🔐', text: 'Sei quais informações não podem ser colocadas em uma ferramenta de IA.' },
  { id: 'r04', dim: 'criterio', emoji: '📊', text: 'Sei medir se a IA trouxe ganho real de tempo, custo ou qualidade.' },
  { id: 'r05', dim: 'criterio', emoji: '🧾', text: 'Reviso e assumo a responsabilidade pelo que a IA produz antes de enviar ou publicar.' },
  { id: 'r06', dim: 'criterio', emoji: '⚖️', text: 'Conheço as regras que se aplicam ao uso de IA no meu trabalho (LGPD, política interna).' },
  { id: 'r07', dim: 'criterio', emoji: '🔎', text: 'Costumo conferir a fonte quando a IA me entrega um dado, um número ou uma citação.' },
  { id: 'r08', dim: 'criterio', emoji: '🎯', text: 'Sei reformular o pedido quando a resposta vem genérica ou fora do alvo.' },
  { id: 'r09', dim: 'criterio', emoji: '🚦', text: 'Sei reconhecer quando NÃO vale a pena usar IA em uma tarefa.' },
  { id: 'r10', dim: 'criterio', emoji: '💼', text: 'Já participei de conversas estratégicas sobre como a IA muda o meu trabalho.' },

  /* ---------- USO ---------- */
  { id: 'u01', dim: 'uso', emoji: '💬', text: 'Uso ferramentas de IA generativa (ChatGPT, Gemini, Claude, Copilot) no meu trabalho.' },
  { id: 'u02', dim: 'uso', emoji: '📅', text: 'Recorro à IA pelo menos algumas vezes por semana.' },
  { id: 'u03', dim: 'uso', emoji: '✍️', text: 'Uso IA para escrever ou revisar textos (e-mails, relatórios, propostas, mensagens).' },
  { id: 'u04', dim: 'uso', emoji: '📈', text: 'Uso IA para analisar planilhas, documentos longos ou conjuntos de dados.' },
  { id: 'u05', dim: 'uso', emoji: '🎙️', text: 'Já usei IA com imagem, áudio ou vídeo (gerar arte, transcrever, resumir reunião).' },
  { id: 'u06', dim: 'uso', emoji: '🧭', text: 'Uso a IA para destravar decisões, comparar opções e organizar ideias.' },
  { id: 'u07', dim: 'uso', emoji: '🗃️', text: 'Guardo prompts, instruções ou modelos prontos para reaproveitar depois.' },
  { id: 'u08', dim: 'uso', emoji: '🏠', text: 'Também uso IA fora do trabalho (estudos, casa, projetos pessoais).' },
  { id: 'u09', dim: 'uso', emoji: '⏱️', text: 'A IA já reduziu de forma perceptível o tempo de alguma tarefa minha.' },
  { id: 'u10', dim: 'uso', emoji: '🤝', text: 'Já ensinei ou ajudei alguém a usar IA.' },

  /* ---------- CRIAÇÃO ---------- */
  { id: 'x01', dim: 'criacao', emoji: '🛠️', text: 'Tenho interesse em criar minhas próprias soluções de IA.' },
  { id: 'x02', dim: 'criacao', emoji: '⚙️', text: 'Já personalizei uma ferramenta de IA para a minha rotina (assistente próprio, instruções fixas).' },
  { id: 'x03', dim: 'criacao', emoji: '🤖', text: 'Já criei um agente, bot ou assistente de IA.' },
  { id: 'x04', dim: 'criacao', emoji: '🔗', text: 'Já conectei IA a alguma ferramenta que eu uso (planilhas, e-mail, WhatsApp, CRM).' },
  { id: 'x05', dim: 'criacao', emoji: '🏢', text: 'Já conectei IA a sistemas da empresa (ERP, CRM, banco de dados, intranet).' },
  { id: 'x06', dim: 'criacao', emoji: '🔁', text: 'Já automatizei uma tarefa de ponta a ponta com IA (script, integração, fluxo automático).' },
  { id: 'x07', dim: 'criacao', emoji: '👥', text: 'Já montei ou testei vários agentes de IA trabalhando juntos em um mesmo processo.' },
  { id: 'x08', dim: 'criacao', emoji: '🧪', text: 'Testo e ajusto o que eu construo até o resultado ficar confiável.' },
  { id: 'x09', dim: 'criacao', emoji: '🚀', text: 'Já coloquei uma solução minha de IA para outras pessoas usarem.' },
  { id: 'x10', dim: 'criacao', emoji: '📣', text: 'Lidero (ou quero liderar) iniciativas de IA na minha equipe ou empresa.' }
];

const SCALE_LABELS = ['Discordo totalmente', 'Discordo', 'Mais ou menos', 'Concordo', 'Concordo totalmente'];

/* Perfis por quadrante. A/B em cima (criar), C/D embaixo (usar). */
const PROFILES = {
  A: {
    letter: 'A',
    title: 'Criador em Formação',
    tagline: 'Muita vontade de construir, base ainda em construção.',
    summary: 'Você quer criar suas próprias soluções e já experimenta por conta própria — mas ainda sente que falta base para andar sozinho. Esse é um ótimo ponto de partida: a motivação, que é a parte difícil de ensinar, você já tem. O próximo salto vem de fundamento, não de esforço.',
    roadmap: [
      { prazo: 'Curto prazo (1-3 meses)', acao: 'Fechar a base: prompts estruturados, contexto e limites da ferramenta que você mais usa.' },
      { prazo: 'Médio prazo (3-6 meses)', acao: 'Construir a primeira automação real de uma tarefa sua, do começo ao fim.' },
      { prazo: 'Longo prazo (6+ meses)', acao: 'Transformar essa automação em algo que outra pessoa da equipe consiga usar.' }
    ],
    steps: [
      'Escolher UMA tarefa repetitiva sua e automatizá-la esta semana',
      'Fazer um curso estruturado de fundamentos (não só vídeos soltos)',
      'Registrar o que der certo em um caderno de prompts'
    ]
  },
  B: {
    letter: 'B',
    title: 'Construtor Avançado',
    tagline: 'Entende os conceitos e executa soluções próprias com confiança.',
    summary: 'Você une conhecimento sólido de IA com a prática de construir. Já resolve problemas reais com o que cria e consegue avaliar criticamente o que a IA entrega. Esse perfil coloca você em posição de liderança: o próximo ganho não vem de aprender mais, vem de escalar e ensinar.',
    roadmap: [
      { prazo: 'Curto prazo (1-3 meses)', acao: 'Consolidar boas práticas e criar templates reutilizáveis do que você já faz bem.' },
      { prazo: 'Médio prazo (3-6 meses)', acao: 'Explorar integrações mais complexas: APIs, dados da empresa, múltiplos agentes.' },
      { prazo: 'Longo prazo (6+ meses)', acao: 'Liderar iniciativas de IA na equipe ou na empresa, com métrica de resultado.' }
    ],
    steps: [
      'Criar um template ou framework reutilizável',
      'Implementar uma integração com API ou sistema da empresa',
      'Mentorar pelo menos 1 pessoa em IA'
    ]
  },
  C: {
    letter: 'C',
    title: 'Explorador Iniciante',
    tagline: 'No começo da jornada — e no melhor momento para acelerar.',
    summary: 'Você já teve contato com IA, mas ela ainda não virou hábito. Nada aqui é obstáculo técnico: é repetição. Quem usa IA todo dia por três semanas seguidas muda de quadrante sem perceber. Comece pelo que já incomoda na sua rotina.',
    roadmap: [
      { prazo: 'Curto prazo (1-3 meses)', acao: 'Criar o hábito: usar IA em pelo menos uma tarefa por dia, por 21 dias.' },
      { prazo: 'Médio prazo (3-6 meses)', acao: 'Aprender a dar contexto (anexar arquivos, dados, exemplos) e comparar ferramentas.' },
      { prazo: 'Longo prazo (6+ meses)', acao: 'Assumir uma tarefa da equipe e melhorá-la com IA de ponta a ponta.' }
    ],
    steps: [
      'Listar 3 tarefas chatas da sua semana e testar IA nas três',
      'Aprender a anexar arquivos e dar contexto à ferramenta',
      'Reservar 30 minutos por semana só para experimentar'
    ]
  },
  D: {
    letter: 'D',
    title: 'Usuário Estratégico',
    tagline: 'Domina o uso e sabe julgar resultados — falta construir.',
    summary: 'Você usa IA com maturidade: sabe pedir, sabe revisar e sabe quando desconfiar. O que ainda não aconteceu foi o salto de consumidor para construtor. É um salto menor do que parece — com a base que você já tem, a primeira automação própria costuma sair em poucos dias.',
    roadmap: [
      { prazo: 'Curto prazo (1-3 meses)', acao: 'Criar um assistente personalizado com as suas instruções e a sua base de conhecimento.' },
      { prazo: 'Médio prazo (3-6 meses)', acao: 'Conectar IA a uma ferramenta que você já usa (planilha, e-mail, CRM).' },
      { prazo: 'Longo prazo (6+ meses)', acao: 'Entregar uma solução própria rodando para o time, com ganho medido.' }
    ],
    steps: [
      'Montar um assistente próprio com instruções fixas',
      'Automatizar um fluxo simples entre duas ferramentas',
      'Medir o tempo economizado e apresentar o número'
    ]
  }
};

const LEVEL_BANDS = [
  { max: 1.9, name: 'Primeiros passos' },
  { max: 2.9, name: 'Em desenvolvimento' },
  { max: 3.7, name: 'Praticante' },
  { max: 4.4, name: 'Avançado' },
  { max: 5.1, name: 'Referência' }
];

/* Mensagens de impulso durante o diagnóstico. */
const NUDGES = {
  high: [
    'Resposta de quem já colocou a mão na massa. Continue.',
    'Você está acima da média do mercado nesse ponto.',
    'Esse tipo de resposta aparece em quem já lidera pelo exemplo.',
    'Boa. É esse comportamento que separa quem usa de quem constrói.',
    'Você já aplica IA de forma consistente. Agora é ampliar o impacto.'
  ],
  mid: [
    'Você está no meio do caminho — e é aí que a evolução acontece mais rápido.',
    'Um pouco mais de prática aqui já muda o seu quadrante.',
    'Esse ponto tem espaço para crescer com pouco esforço.',
    'Metade do caminho andado. A outra metade é repetição.'
  ],
  low: [
    'Tudo bem. É justamente esse tipo de ponto que o diagnóstico existe para revelar.',
    'Ninguém começa sabendo. Mapear é o primeiro passo.',
    'Esse é um ponto de virada em potencial para você.',
    'Sinceridade aqui vale mais do que pontuação alta.'
  ],
  progress: [
    'Metade do caminho. Segue firme.',
    'Faltam poucas perguntas.',
    'Reta final — suas respostas já estão desenhando o seu perfil.'
  ]
};
