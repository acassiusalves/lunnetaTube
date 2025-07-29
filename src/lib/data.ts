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
  thumbnailUrl: string;
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
  },
];

const dataAiHints: {[key: string]: string} = {
  'gC_x9-y_4Qc': 'reunião de negócios',
  'h55-w4I5s5g': 'escritório de startup',
  's_obIuWwe_M': 'wireframe de design',
  'Qaqs22Sh36A': 'estratégia de marketing',
  'WcI_1i8hr5U': 'inteligência artificial',
  'S4zBSP01D38': 'gráfico financeiro',
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
const mapApiToVideo = (apiVideo: any): Video => {
  const duration = formatDuration(apiVideo.contentDetails.duration);
  const totalSeconds = (parseInt(apiVideo.contentDetails.duration.match(/(\d+)S/)?.[1] || '0', 10)) + 
                     (parseInt(apiVideo.contentDetails.duration.match(/(\d+)M/)?.[1] || '0', 10) * 60) +
                     (parseInt(apiVideo.contentDetails.duration.match(/(\d+)H/)?.[1] || '0', 10) * 3600);
  return {
    id: apiVideo.id,
    title: apiVideo.snippet.title,
    thumbnailUrl: apiVideo.snippet.thumbnails.high.url,
    views: parseInt(apiVideo.statistics.viewCount, 10),
    likes: parseInt(apiVideo.statistics.likeCount, 10),
    comments: parseInt(apiVideo.statistics.commentCount, 10),
    duration: duration,
    publishedAt: apiVideo.snippet.publishedAt.split('T')[0],
    videoUrl: `https://www.youtube.com/watch?v=${apiVideo.id}`,
    channel: apiVideo.snippet.channelTitle,
    category: categories.find(c => c.value === apiVideo.snippet.categoryId)?.label || 'Desconhecido',
    isShort: totalSeconds <= 60,
    dataAiHint: dataAiHints[apiVideo.id] || 'vídeo do youtube'
  };
};

export const getMockVideos = (): Video[] => {
  // Mapeia os dados "brutos" da API para a nossa interface Video
  return mockApiVideos.map(mapApiToVideo);
};