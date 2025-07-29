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

// Real YouTube Video IDs
const mockVideoIds = [
  'eW7T3w_3sZg', // Product Management Guide
  'u6gSSpfOKa4', // How to Start a SaaS Business
  '7Tq8-2yzt4E', // UX Design Principles for Beginners
  'a25J2r9T6oM', // Top 5 Marketing Strategies
  'v4c4L-EvjN8', // Deep Dive into Machine Learning
  '8B5k_2xK3iU', // Mastering Financial Freedom
];


const mockVideos: Video[] = [
  {
    id: 'eW7T3w_3sZg',
    title: 'O Guia Definitivo para Gestão de Produtos',
    thumbnailUrl: `https://i.ytimg.com/vi/eW7T3w_3sZg/hqdefault.jpg`,
    views: 1205432,
    likes: 89342,
    comments: 5432,
    duration: '15:23',
    publishedAt: '2023-10-26',
    videoUrl: 'https://www.youtube.com/watch?v=eW7T3w_3sZg',
    channel: 'ProdMasters',
    category: 'Educação',
    isShort: false,
    dataAiHint: 'reunião de negócios'
  },
  {
    id: 'u6gSSpfOKa4',
    title: 'Como Iniciar um Negócio SaaS em 2024',
    thumbnailUrl: `https://i.ytimg.com/vi/u6gSSpfOKa4/hqdefault.jpg`,
    views: 876345,
    likes: 65432,
    comments: 4321,
    duration: '25:10',
    publishedAt: '2023-11-15',
    videoUrl: 'https://www.youtube.com/watch?v=u6gSSpfOKa4',
    channel: 'SaaSWiz',
    category: 'Ciência e Tecnologia',
    isShort: false,
    dataAiHint: 'escritório de startup'
  },
  {
    id: '7Tq8-2yzt4E',
    title: 'Princípios de Design de UX para Iniciantes',
    thumbnailUrl: `https://i.ytimg.com/vi/7Tq8-2yzt4E/hqdefault.jpg`,
    views: 2345678,
    likes: 123456,
    comments: 8765,
    duration: '00:45',
    publishedAt: '2023-09-01',
    videoUrl: 'https://www.youtube.com/watch?v=7Tq8-2yzt4E',
    channel: 'Design Fácil',
    category: 'Como Fazer e Estilo',
    isShort: true,
    dataAiHint: 'wireframe de design'
  },
  {
    id: 'a25J2r9T6oM',
    title: 'Top 5 Estratégias de Marketing para Pequenas Empresas',
    thumbnailUrl: `https://i.ytimg.com/vi/a25J2r9T6oM/hqdefault.jpg`,
    views: 543210,
    likes: 43210,
    comments: 3210,
    duration: '18:50',
    publishedAt: '2024-01-05',
    videoUrl: 'https://www.youtube.com/watch?v=a25J2r9T6oM',
    channel: 'MarketingPRO',
    category: 'Educação',
    isShort: false,
    dataAiHint: 'estratégia de marketing'
  },
  {
    id: 'v4c4L-EvjN8',
    title: 'Um Mergulho Profundo em Modelos de Machine Learning',
    thumbnailUrl: `https://i.ytimg.com/vi/v4c4L-EvjN8/hqdefault.jpg`,
    views: 987654,
    likes: 76543,
    comments: 6543,
    duration: '45:30',
    publishedAt: '2023-12-20',
    videoUrl: 'https://www.youtube.com/watch?v=v4c4L-EvjN8',
    channel: 'AI Explorers',
    category: 'Ciência e Tecnologia',
    isShort: false,
    dataAiHint: 'inteligência artificial'
  },
  {
    id: '8B5k_2xK3iU',
    title: 'Dominando a Liberdade Financeira: Um Guia Passo a Passo',
    thumbnailUrl: `https://i.ytimg.com/vi/8B5k_2xK3iU/hqdefault.jpg`,
    views: 3456789,
    likes: 234567,
    comments: 12345,
    duration: '00:59',
    publishedAt: '2023-08-10',
    videoUrl: 'https://www.youtube.com/watch?v=8B5k_2xK3iU',
    channel: 'Dinheiro+',
    category: 'Finanças',
    isShort: true,
    dataAiHint: 'gráfico financeiro'
  },
];

export const getMockVideos = (): Video[] => {
  // In a real app, this would fetch from an API
  return mockVideos;
};
