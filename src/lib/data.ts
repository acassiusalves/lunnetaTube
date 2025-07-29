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

const mockVideos: Video[] = [
  {
    id: '1',
    title: 'O Guia Definitivo para Gestão de Produtos',
    thumbnailUrl: 'https://placehold.co/120x68.png',
    views: 1205432,
    likes: 89342,
    comments: 5432,
    duration: '15:23',
    publishedAt: '2023-10-26',
    videoUrl: '#',
    channel: 'ProdMasters',
    category: 'Educação',
    isShort: false,
    dataAiHint: 'reunião de negócios'
  },
  {
    id: '2',
    title: 'Como Iniciar um Negócio SaaS em 2024',
    thumbnailUrl: 'https://placehold.co/120x68.png',
    views: 876345,
    likes: 65432,
    comments: 4321,
    duration: '25:10',
    publishedAt: '2023-11-15',
    videoUrl: '#',
    channel: 'SaaSWiz',
    category: 'Ciência e Tecnologia',
    isShort: false,
    dataAiHint: 'escritório de startup'
  },
  {
    id: '3',
    title: 'Princípios de Design de UX para Iniciantes',
    thumbnailUrl: 'https://placehold.co/120x68.png',
    views: 2345678,
    likes: 123456,
    comments: 8765,
    duration: '00:45',
    publishedAt: '2023-09-01',
    videoUrl: '#',
    channel: 'Design Fácil',
    category: 'Como Fazer e Estilo',
    isShort: true,
    dataAiHint: 'wireframe de design'
  },
  {
    id: '4',
    title: 'Top 5 Estratégias de Marketing para Pequenas Empresas',
    thumbnailUrl: 'https://placehold.co/120x68.png',
    views: 543210,
    likes: 43210,
    comments: 3210,
    duration: '18:50',
    publishedAt: '2024-01-05',
    videoUrl: '#',
    channel: 'MarketingPRO',
    category: 'Educação',
    isShort: false,
    dataAiHint: 'estratégia de marketing'
  },
  {
    id: '5',
    title: 'Um Mergulho Profundo em Modelos de Machine Learning',
    thumbnailUrl: 'https://placehold.co/120x68.png',
    views: 987654,
    likes: 76543,
    comments: 6543,
    duration: '45:30',
    publishedAt: '2023-12-20',
    videoUrl: '#',
    channel: 'AI Explorers',
    category: 'Ciência e Tecnologia',
    isShort: false,
    dataAiHint: 'inteligência artificial'
  },
  {
    id: '6',
    title: 'Dominando a Liberdade Financeira: Um Guia Passo a Passo',
    thumbnailUrl: 'https://placehold.co/120x68.png',
    views: 3456789,
    likes: 234567,
    comments: 12345,
    duration: '00:59',
    publishedAt: '2023-08-10',
    videoUrl: '#',
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
