/**
 * Termos em alta nos Shorts encontrados: hashtags do título e da descrição e tags de
 * cada vídeo, contadas por canal. Mostram como os criadores do país escrevem sobre o
 * tema, no idioma deles. Funções puras, usadas no servidor e na página /shorts.
 */

// Termos que aparecem em qualquer Short e não dizem nada sobre o tema
const GENERIC_TERMS = new Set([
  'shorts', 'short', 'youtubeshorts', 'ytshorts', 'youtube', 'youtube shorts', 'shortsvideo', 'shortvideo',
  'shorts video', 'short video', 'shortsfeed', 'shortsviral', 'viral', 'viralvideo', 'viral video',
  'viralshorts', 'viralshort', 'fyp', 'foryou', 'for you', 'foryoupage', 'parati', 'paravoce', 'pravoce',
  'trending', 'trend', 'tendencia', 'tiktok', 'reels', 'instagram', 'subscribe', 'explore', 'explorepage',
  'video', 'videos', 'vídeo', 'vídeos',
]);

const MIN_LENGTH = 3;
const MAX_LENGTH = 40;
const MAX_TERMS_PER_VIDEO = 40;

// Minúsculas, sem # e com espaços simples; null quando o termo não serve
function normalizeTerm(raw: string): string | null {
  const term = raw.normalize('NFC').trim().replace(/^#+/, '').replace(/\s+/g, ' ').toLowerCase();
  if (term.length < MIN_LENGTH || term.length > MAX_LENGTH) return null;
  if (/^\d+$/.test(term) || GENERIC_TERMS.has(term)) return null;
  return term;
}

function hashtags(text: string): string[] {
  return [...text.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(match => match[1]);
}

export function extractVideoTerms(title: string, description: string, tags?: string[] | null): string[] {
  const terms = new Set<string>();
  for (const raw of [...hashtags(title), ...hashtags(description), ...(tags || [])]) {
    const term = normalizeTerm(raw);
    if (term) terms.add(term);
    if (terms.size >= MAX_TERMS_PER_VIDEO) break;
  }
  return [...terms];
}

// Alternativas do q da busca (a|"b c"|d), para não sugerir o que já foi buscado
export function queryTerms(q: string): string[] {
  return q.split('|').map(part => part.replace(/"/g, '').trim().toLowerCase()).filter(Boolean);
}

export interface TopTerm {
  term: string;
  channels: number;
  videos: number;
}

// Conta canais, não vídeos: um canal que posta 5 Shorts com as mesmas tags não é tendência
export function topTerms(
  shorts: { channelId: string; terms: string[] }[],
  options: { exclude?: string[]; limit?: number; minChannels?: number } = {},
): TopTerm[] {
  const { exclude = [], limit = 15, minChannels = 2 } = options;
  const excluded = new Set(exclude.map(term => term.toLowerCase()));
  const counts = new Map<string, { channels: Set<string>; videos: number }>();

  for (const short of shorts) {
    for (const term of new Set(short.terms)) {
      if (excluded.has(term)) continue;
      const entry = counts.get(term) ?? { channels: new Set<string>(), videos: 0 };
      entry.channels.add(short.channelId);
      entry.videos += 1;
      counts.set(term, entry);
    }
  }

  return [...counts.entries()]
    .map(([term, { channels, videos }]) => ({ term, channels: channels.size, videos }))
    .filter(entry => entry.channels >= minChannels)
    .sort((a, b) => b.channels - a.channels || b.videos - a.videos || a.term.localeCompare(b.term))
    .slice(0, limit);
}
