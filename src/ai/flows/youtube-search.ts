
'use server';

/**
 * @fileOverview A flow for searching videos on YouTube and analyzing their potential.
 *
 * - searchYoutubeVideos - A function that searches for YouTube videos and analyzes their potential.
 * - YoutubeSearchInput - The input type for the searchYoutubeVideos function.
 * - YoutubeSearchOutput - The return type for the searchYoutubeVideos function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { youtube } from 'googleapis/build/src/apis/youtube';
import { analyzeVideoPotential } from './analyze-video-potential';
import { translateKeyword } from './translate-keyword';
import { fetchChannelStats } from './fetch-channel-stats';
import { getCountryByCode, getLanguageName, getRelevanceLanguage } from '@/lib/countries';
import { isShortDuration } from '@/lib/data';


const YoutubeSearchInputSchema = z.object({
  apiKey: z.string().describe("The YouTube Data API v3 key."),
  type: z.enum(['keyword', 'trending']).describe("The type of search to perform."),
  keyword: z.string().optional().describe("The keyword to search for. For 'trending', an optional topic."),
  country: z.string().optional().describe("The country code for the search (will be uppercased)."),
  relevanceLanguage: z.string().optional().describe("ISO 639-1 language for search relevance. Defaults to the country's language."),
  minViews: z.number().optional().describe("The minimum number of views."),
  excludeShorts: z.boolean().optional().describe("Whether to exclude YouTube Shorts (videos up to 3 minutes)."),
  excludeMusic: z.boolean().optional().describe("Whether to exclude Music category (categoryId 10)."),
  excludeGaming: z.boolean().optional().describe("Whether to exclude Gaming category (categoryId 20)."),
  category: z.string().optional().describe("The video category ID."),
  pageToken: z.string().optional().describe("The token for the next page of results."),
  skipAiAnalysis: z.boolean().optional().describe("Whether to skip the AI potential analysis."),
  publishedAfter: z.string().optional().describe("RFC 3339 - filter videos published after this date. For 'trending', defaults to 7 days ago."),
  publishedBefore: z.string().optional().describe("ISO 8601 format - filter videos published before this date."),
  order: z.enum(['relevance', 'date', 'rating', 'viewCount', 'title']).optional().describe("Order of results."),
});
export type YoutubeSearchInput = z.infer<typeof YoutubeSearchInputSchema>;

const YoutubeSearchOutputSchema = z.object({
  videos: z.any().optional().describe("An array of video results, potentially with an analysis field."),
  nextPageToken: z.string().optional().describe("Token for the next page."),
  error: z.string().optional().describe("An error message if the search fails.")
});
export type YoutubeSearchOutput = z.infer<typeof YoutubeSearchOutputSchema>;

export async function searchYoutubeVideos(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  return searchYoutubeVideosFlow(input);
}

// O search.list não retorna nada sem q. Em Tendências sem tema, usamos termos
// amplos de conteúdo educativo (operador | = OU)
const DEFAULT_TREND_TERMS: Record<string, string> = {
  pt: 'curso|aula|tutorial|dicas|"como fazer"',
  es: 'curso|clase|tutorial|consejos|"cómo hacer"',
  en: 'course|lesson|tutorial|tips|"how to"',
};

type SearchDuration = 'any' | 'medium' | 'long';

// Token de paginação combinado quando há mais de uma busca por página
function parsePageTokens(pageToken?: string): Partial<Record<SearchDuration, string>> {
  if (!pageToken) return {};
  try {
    return JSON.parse(pageToken);
  } catch {
    return {};
  }
}

const searchYoutubeVideosFlow = ai.defineFlow(
  {
    name: 'searchYoutubeVideosFlow',
    inputSchema: YoutubeSearchInputSchema,
    outputSchema: YoutubeSearchOutputSchema,
  },
  async (input) => {
    const youtubeApi = youtube({
      version: 'v3',
      auth: input.apiKey,
    });
    
    try {
        const isTrending = input.type === 'trending';
        const regionCode = input.country ? input.country.toUpperCase() : undefined;
        // regionCode só garante que o vídeo pode ser assistido no país; o idioma
        // é o que puxa resultados do mercado local
        const relevanceLanguage = input.relevanceLanguage || (input.country ? getRelevanceLanguage(input.country) : undefined);
        const countryInfo = input.country ? getCountryByCode(input.country) : undefined;
        // Traduz para o idioma do país, exceto países de língua portuguesa
        const translateTo = countryInfo && !countryInfo.lang.startsWith('pt') ? getLanguageName(countryInfo.lang) : undefined;

        let searchTerm = (input.keyword || '').trim();
        if (searchTerm) {
            if (translateTo) {
                try {
                    const translationResult = await translateKeyword({ text: searchTerm, targetLanguage: translateTo });
                    searchTerm = translationResult.translatedText;
                } catch (e) {
                    console.warn(`Keyword translation failed for country ${input.country}. Using original keyword.`, e);
                    // If translation fails, proceed with the original keyword
                }
            }
        } else if (isTrending) {
            searchTerm = DEFAULT_TREND_TERMS[relevanceLanguage || 'pt'] || DEFAULT_TREND_TERMS.en;
            if (!DEFAULT_TREND_TERMS[relevanceLanguage || 'pt'] && translateTo) {
                try {
                    const translationResult = await translateKeyword({ text: DEFAULT_TREND_TERMS.en, targetLanguage: translateTo });
                    searchTerm = translationResult.translatedText;
                } catch (e) {
                    console.warn(`Default trend terms translation failed for country ${input.country}. Using English.`, e);
                }
            }
        }

        // Tendências: desde 21/07/2025 o chart=mostPopular do videos.list só traz
        // os rankings de Música, Filmes e Games. "Em alta" = vídeos mais vistos
        // publicados no período, via search.list.
        // Com "Excluir Shorts", ordenar por visualizações traz quase só Shorts; então
        // pedimos à API só vídeos de 4+ min (medium = 4-20 min, long = mais de 20 min).
        // Na busca do Início (por relevância) o filtro é feito abaixo pela duração real,
        // já que "medium" sozinho cortaria os vídeos longos.
        const durations: SearchDuration[] = isTrending && input.excludeShorts ? ['medium', 'long'] : ['any'];
        const pageTokens = durations.length > 1 ? parsePageTokens(input.pageToken) : { any: input.pageToken };
        // Ao paginar, só continua as buscas que ainda têm próxima página
        const activeDurations = input.pageToken ? durations.filter(d => pageTokens[d]) : durations;

        const searchResponses = await Promise.all(activeDurations.map(duration =>
            youtubeApi.search.list({
                part: ['snippet'],
                q: searchTerm,
                type: ['video'],
                regionCode,
                relevanceLanguage,
                videoCategoryId: isTrending ? input.category : undefined,
                videoDuration: duration,
                maxResults: 50,
                pageToken: pageTokens[duration],
                publishedAfter: isTrending
                    ? input.publishedAfter || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                    : input.publishedAfter,
                publishedBefore: input.publishedBefore,
                order: isTrending ? 'viewCount' : input.order || 'relevance',
            })
        ));

        const videoIds = [...new Set(searchResponses.flatMap(response =>
            response.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || []
        ))];

        const nextTokens: Partial<Record<SearchDuration, string>> = {};
        activeDurations.forEach((duration, i) => {
            const token = searchResponses[i].data.nextPageToken;
            if (token) nextTokens[duration] = token;
        });
        const nextPageToken = durations.length > 1
            ? (Object.keys(nextTokens).length > 0 ? JSON.stringify(nextTokens) : undefined)
            : nextTokens.any;

        if (videoIds.length === 0) {
            return { videos: [], nextPageToken: undefined };
        }

        // Detalhes (duração, estatísticas, categoria), em lotes de até 50 ids
        const detailBatches = [];
        for (let i = 0; i < videoIds.length; i += 50) {
            detailBatches.push(youtubeApi.videos.list({
                part: ['snippet', 'contentDetails', 'statistics'],
                id: videoIds.slice(i, i + 50),
            }));
        }
        const detailItems = (await Promise.all(detailBatches)).flatMap(response => response.data.items || []);

        let videoItems = detailItems.filter(v => {
            if (input.excludeShorts && isShortDuration(v.contentDetails?.duration)) return false;
            if (input.excludeMusic && v.snippet?.categoryId === '10') return false;
            if (input.excludeGaming && v.snippet?.categoryId === '20') return false;
            if (input.minViews && parseInt(v.statistics?.viewCount || '0', 10) < input.minViews) return false;
            return true;
        }) as any[];

        if (videoItems.length === 0) {
            // Página sem resultados após os filtros: mantém o token para "Carregar Mais"
            return { videos: [], nextPageToken: nextPageToken || undefined };
        }

        // Buscar estatísticas dos canais
        try {
            const channelIds = videoItems.map(v => v.snippet?.channelId).filter((id): id is string => !!id);
            const uniqueChannelIds = [...new Set(channelIds)];

            if (uniqueChannelIds.length > 0) {
                const channelStatsResult = await fetchChannelStats({
                    channelIds: uniqueChannelIds,
                    apiKey: input.apiKey,
                });

                if (channelStatsResult.channelStats && Object.keys(channelStatsResult.channelStats).length > 0) {
                    videoItems = videoItems.map(video => ({
                        ...video,
                        channelStats: channelStatsResult.channelStats[video.snippet?.channelId || ''],
                    }));
                }
            }
        } catch (channelError) {
            console.warn("Failed to fetch channel stats, continuing without them.", channelError);
        }

        // AI-powered analysis for keyword search
        if (input.type === 'keyword' && input.keyword && videoItems.length > 0 && !input.skipAiAnalysis) {
            try {
                const videosForAnalysis = videoItems.map(v => ({
                    id: v.id,
                    title: v.snippet?.title || '',
                    description: v.snippet?.description || '',
                }));

                const analysisResult = await analyzeVideoPotential({
                    videos: videosForAnalysis,
                    keyword: input.keyword,
                });

                if (analysisResult.highPotentialVideoIds) {
                    videoItems = videoItems.map(video => ({
                        ...video,
                        hasHighPotential: analysisResult.highPotentialVideoIds.includes(video.id),
                    }));
                }
            } catch (aiError) {
                console.warn("AI analysis failed, returning results without potential analysis.", aiError);
                // Gracefully degrade: if AI analysis fails, just return the videos without the extra data.
                // The main function (searching videos) should not fail.
            }
        }

        return {
            videos: videoItems,
            nextPageToken: nextPageToken || undefined,
        };

    } catch (e: any) {
        console.error(e);
        const errorMessage = e.response?.data?.error?.message || e.message || "An unknown error occurred with the YouTube API.";
        return { error: `Erro na API do YouTube: ${errorMessage}` };
    }
  }
);
