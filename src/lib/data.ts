export const countries = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'in', label: 'India' },
  { value: 'br', label: 'Brazil' },
];

export const categories = [
  { value: '1', label: 'Film & Animation' },
  { value: '2', label: 'Autos & Vehicles' },
  { value: '10', label: 'Music' },
  { value: '15', label: 'Pets & Animals' },
  { value: '17', label: 'Sports' },
  { value: '20', label: 'Gaming' },
  { value: '22', label: 'People & Blogs' },
  { value: '23', label: 'Comedy' },
  { value: '24', label: 'Entertainment' },
  { value: '25', label: 'News & Politics' },
  { value: '26', label: 'Howto & Style' },
  { value: '27', label: 'Education' },
  { value: '28', label: 'Science & Technology' },
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
  dataAiHint: string;
}

const mockVideos: Video[] = [
  {
    id: '1',
    title: 'The Ultimate Guide to Product Management',
    thumbnailUrl: 'https://placehold.co/400x225.png',
    views: 1205432,
    likes: 89342,
    comments: 5432,
    duration: '15:23',
    publishedAt: '2023-10-26',
    videoUrl: '#',
    dataAiHint: 'business meeting'
  },
  {
    id: '2',
    title: 'How to Start a SaaS Business in 2024',
    thumbnailUrl: 'https://placehold.co/400x225.png',
    views: 876345,
    likes: 65432,
    comments: 4321,
    duration: '25:10',
    publishedAt: '2023-11-15',
    videoUrl: '#',
    dataAiHint: 'startup office'
  },
  {
    id: '3',
    title: 'UX Design Principles for Beginners',
    thumbnailUrl: 'https://placehold.co/400x225.png',
    views: 2345678,
    likes: 123456,
    comments: 8765,
    duration: '12:45',
    publishedAt: '2023-09-01',
    videoUrl: '#',
    dataAiHint: 'design wireframe'
  },
  {
    id: '4',
    title: 'Top 5 Marketing Strategies for Small Businesses',
    thumbnailUrl: 'https://placehold.co/400x225.png',
    views: 543210,
    likes: 43210,
    comments: 3210,
    duration: '18:50',
    publishedAt: '2024-01-05',
    videoUrl: '#',
    dataAiHint: 'marketing strategy'
  },
  {
    id: '5',
    title: 'A Deep Dive into Machine Learning Models',
    thumbnailUrl: 'https://placehold.co/400x225.png',
    views: 987654,
    likes: 76543,
    comments: 6543,
    duration: '45:30',
    publishedAt: '2023-12-20',
    videoUrl: '#',
    dataAiHint: 'artificial intelligence'
  },
  {
    id: '6',
    title: 'Mastering Financial Freedom: A Step-by-Step Guide',
    thumbnailUrl: 'https://placehold.co/400x225.png',
    views: 3456789,
    likes: 234567,
    comments: 12345,
    duration: '35:00',
    publishedAt: '2023-08-10',
    videoUrl: '#',
    dataAiHint: 'finance chart'
  },
];

export const getMockVideos = (): Video[] => {
  // In a real app, this would fetch from an API
  return mockVideos;
};
