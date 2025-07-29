
export const countries = [
  { value: 'br', label: 'Brasil' },
  { value: 'us', label: 'Estados Unidos' },
  { value: 'gb', label: 'Reino Unido' },
  { value: 'ca', label: 'Canadá' },
  { value: 'au', label: 'Austrália' },
  { value: 'de', label: 'Alemanha' },
  { value: 'fr', label: 'França' },
  { value: 'jp', label: 'Japão' },
  { value: 'in', label: 'Índia' },
];

export const categories = [
  { value: '1', label: 'Filmes e Animação' },
  { value: '2', label: 'Automóveis e Veículos' },
  { value: '10', label: 'Música' },
  { value: '15', label: 'Animais de Estimação' },
  { value: '17', label: 'Esportes' },
  { value: '20', label: 'Jogos' },
  { value: '22', label: 'Pessoas e Blogs' },
  { value: '23', label: 'Comédia' },
  { value: '24', label: 'Entretenimento' },
  { value: '25', label: 'Notícias e Política' },
  { value: '26', label: 'Como Fazer e Estilo' },
  { value: '27', label: 'Educação' },
  { value: '28', label: 'Ciência e Tecnologia' },
];

export interface Video {
  id: string;
  title: string;
  snippet: any; // Simplified for mock
  views: number;
  likes: number;
  comments: number;
  duration: string;
  publishedAt: string;
  videoUrl: string;
  channel: string;
  category: string;
  isShort: boolean;
  dataAiHint: string;
  commentsData: CommentData[];
}

export interface CommentData {
  author: string;
  authorImageUrl: string;
  text: string;
}

// Simulando uma estrutura mais próxima da API do YouTube
const mockApiVideos = [
  {
    id: 'gC_x9-y_4Qc',
    snippet: {
      title: 'O Guia Definitivo para Gestão de Produtos',
      publishedAt: '2023-10-26T00:00:00Z',
      channelTitle: 'ProdMasters',
      categoryId: '27',
      thumbnails: {
        high: {
          url: 'https://i.ytimg.com/vi/gC_x9-y_4Qc/hqdefault.jpg',
        },
      },
    },
    statistics: {
      viewCount: '1205432',
      likeCount: '89342',
      commentCount: '5432',
    },
    contentDetails: {
      duration: 'PT15M23S',
    },
    commentsData: [
        { author: 'Ana B.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Excelente guia! Muito claro e direto ao ponto.'},
        { author: 'Carlos S.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Isso me ajudou a estruturar todo o meu processo. Obrigado!'},
        { author: 'Mariana L.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Gostaria de ver mais sobre a priorização de features.'},
        { author: 'Rafael G.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Uau, conteúdo de altíssima qualidade. Parabéns!'},
        { author: 'Beatriz M.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Qual ferramenta de roadmap você recomenda?'},
    ]
  },
  {
    id: 'h55-w4I5s5g',
    snippet: {
      title: 'Como Iniciar um Negócio SaaS em 2024',
      publishedAt: '2023-11-15T00:00:00Z',
      channelTitle: 'SaaSWiz',
      categoryId: '28',
      thumbnails: {
        high: {
          url: 'https://i.ytimg.com/vi/h55-w4I5s5g/hqdefault.jpg',
        },
      },
    },
    statistics: {
      viewCount: '876345',
      likeCount: '65432',
      commentCount: '4321',
    },
    contentDetails: {
      duration: 'PT25M10S',
    },
    commentsData: [
        { author: 'Pedro M.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Vídeo inspirador! Mostra que é possível começar pequeno.'},
        { author: 'Julia A.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Quais ferramentas você recomenda para o MVP?'},
        { author: 'Fernando P.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'A parte sobre pricing foi especialmente útil para mim.'},
    ]
  },
  {
    id: 's_obIuWwe_M',
    snippet: {
      title: 'Princípios de Design de UX para Iniciantes',
      publishedAt: '2023-09-01T00:00:00Z',
      channelTitle: 'Design Fácil',
      categoryId: '26',
      thumbnails: {
        high: {
          url: 'https://i.ytimg.com/vi/s_obIuWwe_M/hqdefault.jpg',
        },
      },
    },
    statistics: {
      viewCount: '2345678',
      likeCount: '123456',
      commentCount: '8765',
    },
    contentDetails: {
      duration: 'PT0M45S',
    },
    commentsData: [
        { author: 'Fernanda C.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Curto, mas muito eficaz! Adorei as dicas.'},
        { author: 'Lucas P.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Ótima introdução ao mundo do UX.'},
    ]
  },
  {
    id: 'Qaqs22Sh36A',
    snippet: {
      title: 'Top 5 Estratégias de Marketing para Pequenas Empresas',
      publishedAt: '2024-01-05T00:00:00Z',
      channelTitle: 'MarketingPRO',
      categoryId: '27',
      thumbnails: {
        high: {
          url: 'https://i.ytimg.com/vi/Qaqs22Sh36A/hqdefault.jpg',
        },
      },
    },
    statistics: {
      viewCount: '543210',
      likeCount: '43210',
      commentCount: '3210',
    },
    contentDetails: {
      duration: 'PT18M50S',
    },
    commentsData: [
        { author: 'Marcos V.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'A estratégia de conteúdo local funcionou muito bem para mim.'},
        { author: 'Livia S.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Simples e acionável. Vou testar o marketing de parceria.'},
    ]
  },
  {
    id: 'WcI_1i8hr5U',
    snippet: {
      title: 'Um Mergulho Profundo em Modelos de Machine Learning',
      publishedAt: '2023-12-20T00:00:00Z',
      channelTitle: 'AI Explorers',
      categoryId: '28',
      thumbnails: {
        high: {
          url: 'https://i.ytimg.com/vi/WcI_1i8hr5U/hqdefault.jpg',
        },
      },
    },
    statistics: {
      viewCount: '987654',
      likeCount: '76543',
      commentCount: '6543',
    },
    contentDetails: {
      duration: 'PT45M30S',
    },
    commentsData: [
        { author: 'Ricardo T.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Explicação muito técnica, mas valeu a pena.'},
        { author: 'Sofia K.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Poderia fazer um vídeo sobre redes neurais convolucionais?'},
        { author: 'Daniel H.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'A melhor explicação sobre o tema que já vi no YouTube.'},
    ]
  },
  {
    id: 'S4zBSP01D38',
    snippet: {
      title: 'Dominando a Liberdade Financeira: Um Guia Passo a Passo',
      publishedAt: '2023-08-10T00:00:00Z',
      channelTitle: 'Dinheiro+',
      categoryId: '22', // People & Blogs, as Finance is not a default category
      thumbnails: {
        high: {
          url: 'https://i.ytimg.com/vi/S4zBSP01D38/hqdefault.jpg',
        },
      },
    },
    statistics: {
      viewCount: '3456789',
      likeCount: '234567',
      commentCount: '12345',
    },
    contentDetails: {
      duration: 'PT0M59S',
    },
    commentsData: [
        { author: 'Beatriz R.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Mudou minha perspectiva sobre dinheiro.'},
        { author: 'André F.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Preciso começar a investir agora mesmo.'},
        { author: 'Clara N.', authorImageUrl: 'https://placehold.co/40x40.png', text: 'Um short com mais valor que muitos cursos pagos por aí!'},
    ]
  },
];

const dataAiHints: {[key: string]: string} = {
  'gC_x9-y_4Qc': 'business meeting',
  'h55-w4I5s5g': 'startup office',
  's_obIuWwe_M': 'design wireframe',
  'Qaqs22Sh36A': 'marketing strategy',
  'WcI_1i8hr5U': 'artificial intelligence',
  'S4zBSP01D38': 'finance graph',
};

// Função para formatar a duração do formato ISO 8601 para MM:SS
const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "00:00";

  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Mapear os dados da API simulada para nossa interface Video
const mapApiToVideo = (apiVideo: any, index: number): Video => {
  const duration = formatDuration(apiVideo.contentDetails.duration);
  const totalSeconds = (parseInt(apiVideo.contentDetails.duration.match(/(\d+)S/)?.[1] || '0', 10)) + 
                     (parseInt(apiVideo.contentDetails.duration.match(/(\d+)M/)?.[1] || '0', 10) * 60) +
                     (parseInt(apiVideo.contentDetails.duration.match(/(\d+)H/)?.[1] || '0', 10) * 3600);
  return {
    id: `${apiVideo.id}-${index}`, // Make id unique for generated data
    title: `${apiVideo.snippet.title} #${index + 1}`,
    snippet: apiVideo.snippet,
    views: parseInt(apiVideo.statistics.viewCount, 10) - (index * 1000),
    likes: parseInt(apiVideo.statistics.likeCount, 10) - (index * 100),
    comments: parseInt(apiVideo.statistics.commentCount, 10) - (index * 10),
    duration: duration,
    publishedAt: apiVideo.snippet.publishedAt.split('T')[0],
    videoUrl: `https://www.youtube.com/watch?v=${apiVideo.id}`,
    channel: apiVideo.snippet.channelTitle,
    category: categories.find(c => c.value === apiVideo.snippet.categoryId)?.label || 'Desconhecido',
    isShort: totalSeconds <= 60,
    dataAiHint: dataAiHints[apiVideo.id] || 'youtube video',
    commentsData: apiVideo.commentsData || []
  };
};

export const getMockVideos = (count: number = mockApiVideos.length): Video[] => {
  const generatedVideos: Video[] = [];
  while (generatedVideos.length < count) {
    mockApiVideos.forEach((video) => {
      if (generatedVideos.length < count) {
        generatedVideos.push(mapApiToVideo(video, generatedVideos.length));
      }
    });
  }
  return generatedVideos;
};
