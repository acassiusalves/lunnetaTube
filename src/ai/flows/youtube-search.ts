
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
  keyword: z.string().optional().describe("The keyword to search for."),
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
        let searchTerm = input.keyword || '';
        const regionCode = input.country ? input.country.toUpperCase() : undefined;
        // regionCode só garante que o vídeo pode ser assistido no país; o idioma
        // é o que puxa resultados do mercado local
        const relevanceLanguage = input.relevanceLanguage || (input.country ? getRelevanceLanguage(input.country) : undefined);

        if (input.type === 'keyword') {
            // Translate keyword to the country's language (skip Portuguese-speaking countries)
            const countryInfo = input.country ? getCountryByCode(input.country) : undefined;
            if (countryInfo && !countryInfo.lang.startsWith('pt') && searchTerm) {
                 try {
                    const translationResult = await translateKeyword({
                        text: searchTerm,
                        targetLanguage: getLanguageName(countryInfo.lang),
                    });
                    searchTerm = translationResult.translatedText;
                } catch (e) {
                    console.warn(`Keyword translation failed for country ${input.country}. Using original keyword.`, e);
                    // If translation fails, proceed with the original keyword
                }
            }
        }

        // Tendências: desde 21/07/2025 o chart=mostPopular do videos.list só traz
        // os rankings de Música, Filmes e Games. "Em alta" passa a ser os vídeos
        // mais vistos entre os publicados no período, via search.list.
        const isTrending = input.type === 'trending';
        const searchResponse = await youtubeApi.search.list({
            part: ['snippet'],
            q: isTrending ? undefined : searchTerm,
            type: ['video'],
            regionCode,
            relevanceLanguage,
            videoCategoryId: isTrending ? input.category : undefined,
            maxResults: 50,
            pageToken: input.pageToken,
            // Não usamos videoDuration para excluir Shorts: "medium" só cobre 4-20 min e
            // cortaria vídeos longos. O filtro é feito abaixo pela duração real.
            publishedAfter: isTrending
                ? input.publishedAfter || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                : input.publishedAfter,
            publishedBefore: input.publishedBefore,
            order: isTrending ? 'viewCount' : input.order || 'relevance',
        });

        const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
        const nextPageToken = searchResponse.data.nextPageToken;

        if (videoIds.length === 0) {
            return { videos: [], nextPageToken: undefined };
        }

        // Detalhes (duração, estatísticas, categoria) dos vídeos encontrados
        const videoDetailsResponse = await youtubeApi.videos.list({
            part: ['snippet', 'contentDetails', 'statistics'],
            id: videoIds,
        });

        let videoItems = (videoDetailsResponse.data.items || []).filter(v => {
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
