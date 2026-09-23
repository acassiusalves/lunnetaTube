'use server';

/**
 * @fileOverview Busca de Shorts para inspiração de criativos de anúncio.
 *
 * - searchShorts - Busca Shorts por país, tema, período e ordenação, com métricas de escala.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { youtube } from 'googleapis/build/src/apis/youtube';
import { translateKeyword } from './translate-keyword';
import { fetchChannelStats } from './fetch-channel-stats';
import { getCountryByCode, getLanguageName, getRelevanceLanguage } from '@/lib/countries';
import { parseDurationSeconds } from '@/lib/data';
import { computeShortMetrics, isShortVideo, type ShortVideo } from '@/lib/shorts';
import { safeErrorSummary } from '@/lib/log-error';

// search.list não retorna nada sem q, e "#shorts" traz Shorts globais em inglês mesmo com
// regionCode e relevanceLanguage (testado no APIs Explorer em 2026-09-22). Sem tema, usamos
// termos locais de formatos parecidos com criativos: dicas, tutoriais, truques e curiosidades
const DEFAULT_SHORTS_TERMS: Record<string, string> = {
  pt: 'dicas|"como fazer"|truque|"você sabia"',
  es: 'consejos|"cómo hacer"|truco|"sabías que"',
  en: 'tips|"how to"|hack|"did you know"',
};

// Traduz para o idioma do país; se o Gemini falhar, mantém o texto original
async function translateOrKeep(text: string, targetLanguage: string, country: string): Promise<string> {
  try {
    const translation = await translateKeyword({ text, targetLanguage });
    return translation.translatedText;
  } catch (e) {
    console.warn(`[searchShorts] Falha ao traduzir para ${country}. Usando o texto original.`, e);
    return text;
  }
}

const SearchShortsInputSchema = z.object({
  apiKey: z.string().describe('The YouTube Data API v3 key.'),
  country: z.string().describe('Código ISO do país (BR, PT, US...).'),
  topic: z.string().optional().describe('Tema opcional, traduzido para o idioma do país.'),
  order: z.enum(['viewCount', 'date', 'relevance']),
  publishedAfter: z.string().describe('RFC 3339 - início do período.'),
  pageToken: z.string().optional(),
});
export type SearchShortsInput = z.infer<typeof SearchShortsInputSchema>;

const SearchShortsOutputSchema = z.object({
  shorts: z.array(z.any()).optional(),
  nextPageToken: z.string().optional(),
  error: z.string().optional(),
});
export type SearchShortsOutput = { shorts?: ShortVideo[]; nextPageToken?: string; error?: string };

export async function searchShorts(input: SearchShortsInput): Promise<SearchShortsOutput> {
  return searchShortsFlow(input) as Promise<SearchShortsOutput>;
}

const searchShortsFlow = ai.defineFlow(
  {
    name: 'searchShortsFlow',
    inputSchema: SearchShortsInputSchema,
    outputSchema: SearchShortsOutputSchema,
  },
  async (input) => {
    const youtubeApi = youtube({ version: 'v3', auth: input.apiKey });

    try {
      const country = input.country.toUpperCase();
      const countryInfo = getCountryByCode(country);
      const relevanceLanguage = getRelevanceLanguage(country);
      // Países de língua portuguesa não precisam de tradução
      const translateTo = countryInfo && !countryInfo.lang.startsWith('pt') ? getLanguageName(countryInfo.lang) : undefined;

      let q = (input.topic || '').trim();
      if (q) {
        if (translateTo) q = await translateOrKeep(q, translateTo, country);
      } else {
        const localTerms = DEFAULT_SHORTS_TERMS[relevanceLanguage || 'pt'];
        q = localTerms || DEFAULT_SHORTS_TERMS.en;
        if (!localTerms && translateTo) q = await translateOrKeep(DEFAULT_SHORTS_TERMS.en, translateTo, country);
      }

      const searchResponse = await youtubeApi.search.list({
        part: ['snippet'],
        q,
        type: ['video'],
        videoDuration: 'short', // menos de 4 minutos
        regionCode: country,
        relevanceLanguage,
        publishedAfter: input.publishedAfter,
        order: input.order,
        maxResults: 50,
        pageToken: input.pageToken,
      });

      const nextPageToken = searchResponse.data.nextPageToken || undefined;
      const ids = [...new Set(
        (searchResponse.data.items || []).map(item => item.id?.videoId).filter((id): id is string => !!id),
      )];
      if (ids.length === 0) return { shorts: [], nextPageToken };

      // part=player com maxHeight devolve embedWidth/embedHeight: indicam se o vídeo é vertical
      const detailRequests = [];
      for (let i = 0; i < ids.length; i += 50) {
        detailRequests.push(youtubeApi.videos.list({
          part: ['snippet', 'contentDetails', 'statistics', 'player'],
          id: ids.slice(i, i + 50),
          maxHeight: 640,
        }));
      }
      const details = (await Promise.all(detailRequests)).flatMap(response => response.data.items || []);

      const verticalShorts = details.filter(video => isShortVideo(
        video.contentDetails?.duration,
        video.player?.embedWidth ? Number(video.player.embedWidth) : null,
        video.player?.embedHeight ? Number(video.player.embedHeight) : null,
      ));
      if (verticalShorts.length === 0) return { shorts: [], nextPageToken };

      const channelIds = [...new Set(
        verticalShorts.map(video => video.snippet?.channelId).filter((id): id is string => !!id),
      )];
      const { channelStats } = await fetchChannelStats({ channelIds, apiKey: input.apiKey });

      const shorts: ShortVideo[] = verticalShorts.map(video => {
        // fetchChannelStats devolve 0 quando o canal oculta os inscritos
        const subscriberCount = channelStats[video.snippet?.channelId || '']?.subscriberCount;
        const base = {
          views: parseInt(video.statistics?.viewCount || '0', 10),
          likes: video.statistics?.likeCount != null ? parseInt(video.statistics.likeCount, 10) : null,
          comments: parseInt(video.statistics?.commentCount || '0', 10),
          subscribers: subscriberCount ? subscriberCount : null,
          publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
        };
        return {
          id: video.id!,
          title: video.snippet?.title || '',
          channelId: video.snippet?.channelId || '',
          channelTitle: video.snippet?.channelTitle || '',
          thumbnail: video.snippet?.thumbnails?.high?.url
            || video.snippet?.thumbnails?.medium?.url
            || video.snippet?.thumbnails?.default?.url
            || '',
          durationSeconds: parseDurationSeconds(video.contentDetails?.duration),
          country,
          ...base,
          ...computeShortMetrics(base),
        };
      });

      return { shorts, nextPageToken };
    } catch (e: any) {
      console.error('[searchShorts] Erro:', safeErrorSummary(e));
      const reasons: string[] = e.response?.data?.error?.errors?.map((err: any) => err.reason) || [];
      if (reasons.includes('quotaExceeded')) {
        return { error: 'Limite diário de buscas do YouTube atingido. Ele renova à meia-noite no horário do Pacífico (4h ou 5h em Brasília).' };
      }
      const message = e.response?.data?.error?.message || e.message || 'Erro desconhecido na API do YouTube.';
      return { error: `Erro na API do YouTube: ${message}` };
    }
  }
);
