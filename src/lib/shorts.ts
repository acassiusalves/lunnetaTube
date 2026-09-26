/**
 * Regras da busca de Shorts: identificação do formato, métricas de escala,
 * ordenação e formatação. Funções puras, usadas no servidor e na página /shorts.
 */

import { parseDurationSeconds, SHORTS_MAX_SECONDS } from '@/lib/data';

export type ShortsSearchOrder = 'viewCount' | 'date' | 'relevance';
export type ShortsSortKey = 'viral' | 'velocity' | 'views' | 'engagement' | 'comments' | 'recent';

export interface ShortVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  subscribers: number | null;   // null quando o canal oculta os inscritos
  thumbnail: string;
  durationSeconds: number;
  publishedAt: string;          // ISO 8601
  views: number;
  likes: number | null;         // null quando o vídeo oculta os likes
  comments: number;
  country: string;              // código ISO do país da busca
  channelCountry: string | null; // país informado pelo canal (opcional no YouTube)
  audioLanguage: string | null;  // idioma do áudio marcado pelo criador (ex.: pt-PT)
  terms: string[];               // hashtags e tags do vídeo, normalizadas (termos em alta)
  viralScore: number | null;    // views ÷ inscritos
  viewsPerDay: number;
  engagementRate: number;       // (likes + comentários) ÷ views, em %
}

// A partir deste índice de viralização o card ganha destaque
export const VIRAL_HIGHLIGHT = 10;

// Short = até 3 minutos e vertical. Se a proporção não vier da API, decide só pela duração
export function isShortVideo(
  duration?: string | null,
  embedWidth?: number | null,
  embedHeight?: number | null,
): boolean {
  const seconds = parseDurationSeconds(duration);
  if (seconds <= 0 || seconds > SHORTS_MAX_SECONDS) return false;
  if (embedWidth && embedHeight) return embedHeight > embedWidth;
  return true;
}

export interface ShortMetricsInput {
  views: number;
  likes: number | null;
  comments: number;
  subscribers: number | null;
  publishedAt: string;
}

export function computeShortMetrics(input: ShortMetricsInput, now: number = Date.now()) {
  // Em horas, com mínimo de 1, para não distorcer Shorts publicados há minutos
  const hours = Math.max(1, (now - Date.parse(input.publishedAt)) / 3_600_000);
  return {
    viralScore: input.subscribers && input.subscribers > 0 ? input.views / input.subscribers : null,
    viewsPerDay: (input.views / hours) * 24,
    engagementRate: input.views > 0 ? (((input.likes ?? 0) + input.comments) / input.views) * 100 : 0,
  };
}

function sortValue(short: ShortVideo, key: ShortsSortKey): number | null {
  switch (key) {
    case 'viral':
      return short.viralScore;
    case 'velocity':
      return short.viewsPerDay;
    case 'views':
      return short.views;
    case 'engagement':
      return short.engagementRate;
    case 'comments':
      return short.comments;
    case 'recent':
      return Date.parse(short.publishedAt);
  }
}

// Região do idioma do áudio (pt-PT -> PT); idiomas sem região (pt, es-419) não contam
function audioRegion(language: string | null): string | null {
  const match = language?.match(/^[a-z]{2,3}[-_]([A-Za-z]{2})$/);
  return match ? match[1].toUpperCase() : null;
}

// O YouTube não informa o país de origem do vídeo. Vale o país do canal; se o canal
// não informou, vale a região do idioma do áudio
export function isFromCountry(short: ShortVideo, country: string): boolean {
  const target = country.toUpperCase();
  if (short.channelCountry) return short.channelCountry.toUpperCase() === target;
  return audioRegion(short.audioLanguage) === target;
}

// Ordem decrescente; valores nulos (ex.: inscritos ocultos) ficam por último
export function sortShorts(shorts: ShortVideo[], key: ShortsSortKey): ShortVideo[] {
  return [...shorts].sort((a, b) => {
    const va = sortValue(a, key);
    const vb = sortValue(b, key);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return vb - va;
  });
}

// Ordenação inicial da grade conforme o "Buscar por"
export function defaultSortFor(order: ShortsSearchOrder): ShortsSortKey {
  return order === 'date' ? 'recent' : 'viral';
}

const compactFormatter = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

export function formatTimeAgo(iso: string, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'há 1 dia' : `há ${days} dias`;
}
