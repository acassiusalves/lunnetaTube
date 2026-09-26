
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

export interface SearchParams {
  type: 'keyword' | 'trending';
  keyword?: string;
  country?: string;
  minViews?: number;
  excludeShorts?: boolean;
  category?: string;
  pageToken?: string;
  publishedAfter?: string; // ISO 8601 format
  publishedBefore?: string; // ISO 8601 format
  order?: 'relevance' | 'date' | 'rating' | 'viewCount' | 'title';
}

export interface ChannelStats {
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  avgViewsPerVideo: number;
  country?: string; // país informado pelo canal (opcional no YouTube)
}

export interface Video {
  id: string;
  title: string;
  snippet: any;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  publishedAt: string;
  videoUrl: string;
  channel: string;
  channelId: string;
  category: string;
  isShort: boolean;
  dataAiHint: string;
  commentsData: CommentData[];
  tags: string[];
  hasHighPotential?: boolean;

  // Origem (para busca multi-país)
  sourceCountry?: string;       // Código do país (BR, PT, US...)
  sourceCountryFlag?: string;   // Emoji da bandeira

  // Dados do canal
  channelStats?: ChannelStats;

  // Análise de comentários
  commentAnalysis?: CommentAnalysis;

  // Métricas calculadas
  engagementRate?: number; // (likes + comments) / views * 1000
  viewsPerDay?: number; // views / dias desde publicação
  commentsPerThousandViews?: number; // comments / views * 1000
  channelPerformanceRatio?: number; // views do vídeo / média do canal

  // Score de oportunidade de infoproduto
  infoproductScore?: number; // 0-100
}

export interface CommentData {
  author: string;
  authorImageUrl: string;
  text: string;
  likeCount?: number;
  isQuestion?: boolean;
  isMaterialRequest?: boolean;
  isProblemStatement?: boolean;
  questionType?: 'how-to' | 'what-is' | 'where-to-find' | 'general';
  materialType?: 'planilha' | 'ebook' | 'template' | 'checklist' | 'lista' | 'receita' | 'curso' | 'general';
}

export interface CommentAnalysis {
  totalComments: number;
  questionsCount: number;
  materialRequestsCount: number;
  problemStatementsCount: number;
  questionDensity: number; // % de comentários que são perguntas
  materialRequestDensity: number; // % de comentários pedindo material
  topQuestions: CommentData[];
  topMaterialRequests: CommentData[];
  unansweredQuestionsCount: number;
}

const dataAiHints: {[key: string]: string} = {
  'gC_x9-y_4Qc': 'business meeting',
  'h55-w4I5s5g': 'startup office',
  's_obIuWwe_M': 'design wireframe',
  'Qaqs22Sh36A': 'marketing strategy',
  'WcI_1i8hr5U': 'artificial intelligence',
  'S4zBSP01D38': 'finance graph',
};

// Desde 15/10/2024 um Short pode ter até 3 minutos. A API não informa se um
// vídeo é Short, então usamos a duração como critério.
export const SHORTS_MAX_SECONDS = 180;

// Converte a duração ISO 8601 da API (ex.: PT1H2M3S, P1DT2H) em segundos
export const parseDurationSeconds = (duration?: string | null): number => {
  const match = duration?.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return 0;
  const [, d, h, m, s] = match.map(v => parseInt(v || '0', 10));
  return d * 86400 + h * 3600 + m * 60 + s;
};

// Shorts: duração conhecida e de até 3 minutos (lives em andamento vêm como P0D)
export const isShortDuration = (duration?: string | null): boolean => {
  const seconds = parseDurationSeconds(duration);
  return seconds > 0 && seconds <= SHORTS_MAX_SECONDS;
};

const formatDuration = (duration: string): string => {
  if (!duration) return "00:00";
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

export const calculateMetrics = (video: Video): Video => {
  const views = video.views || 1; // Evitar divisão por zero
  const likes = video.likes || 0;
  const comments = video.comments || 0;

  // Taxa de engajamento (por 1000 views)
  const engagementRate = ((likes + comments) / views) * 1000;

  // Views por dia
  const publishedDate = new Date(video.publishedAt);
  const today = new Date();
  const daysSincePublished = Math.max(1, Math.floor((today.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const viewsPerDay = views / daysSincePublished;

  // Comentários por 1000 views
  const commentsPerThousandViews = (comments / views) * 1000;

  // Performance relativa ao canal (será calculado depois quando tivermos dados do canal)
  let channelPerformanceRatio = undefined;
  if (video.channelStats?.avgViewsPerVideo) {
    channelPerformanceRatio = views / video.channelStats.avgViewsPerVideo;
  }

  return {
    ...video,
    engagementRate,
    viewsPerDay,
    commentsPerThousandViews,
    channelPerformanceRatio,
  };
};

export const mapApiToVideo = (apiVideo: any): Video => {
  const duration = formatDuration(apiVideo.contentDetails?.duration);

  const video: Video = {
    id: apiVideo.id.videoId || apiVideo.id,
    title: apiVideo.snippet.title,
    snippet: apiVideo.snippet,
    thumbnail: apiVideo.snippet?.thumbnails?.high?.url || apiVideo.snippet?.thumbnails?.medium?.url || apiVideo.snippet?.thumbnails?.default?.url || '',
    views: parseInt(apiVideo.statistics?.viewCount || '0', 10),
    likes: parseInt(apiVideo.statistics?.likeCount || '0', 10),
    comments: parseInt(apiVideo.statistics?.commentCount || '0', 10),
    duration: duration,
    publishedAt: apiVideo.snippet.publishedAt.split('T')[0],
    videoUrl: `https://www.youtube.com/watch?v=${apiVideo.id.videoId || apiVideo.id}`,
    channel: apiVideo.snippet.channelTitle,
    channelId: apiVideo.snippet.channelId,
    category: 'Desconhecido', // This will be updated later or can be fetched with categories
    isShort: isShortDuration(apiVideo.contentDetails?.duration),
    dataAiHint: dataAiHints[apiVideo.id.videoId || apiVideo.id] || 'youtube video',
    commentsData: apiVideo.commentsData || [],
    tags: apiVideo.snippet.tags || [],
    hasHighPotential: apiVideo.hasHighPotential || false,
    channelStats: apiVideo.channelStats,
  };

  // Calcular métricas
  return calculateMetrics(video);
};

    