
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
import { countries } from '@/lib/data';


const YoutubeSearchInputSchema = z.object({
  apiKey: z.string().describe("The YouTube Data API v3 key."),
  type: z.enum(['keyword', 'trending']).describe("The type of search to perform."),
  keyword: z.string().optional().describe("The keyword to search for."),
  country: z.string().optional().describe("The country code for the search (will be uppercased)."),
  relevanceLanguage: z.enum(['pt', 'es', 'en']).optional().describe("Language for content relevance (pt/es/en)."),
  minViews: z.number().optional().describe("The minimum number of views."),
  excludeShorts: z.boolean().optional().describe("Whether to exclude YouTube Shorts."),
  category: z.string().optional().describe("The video category ID."),
  pageToken: z.string().optional().describe("The token for the next page of results."),
  skipAiAnalysis: z.boolean().optional().describe("Whether to skip the AI potential analysis."),
  publishedAfter: z.string().optional().describe("ISO 8601 format - filter videos published after this date."),
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
        let videoIds: string[] = [];
        let nextPageToken: string | undefined | null;
        let videoItems: any[] = [];

        // Garantir regionCode em UPPERCASE
        const regionCode = input.country ? input.country.toUpperCase() : undefined;

        if (input.type === 'keyword') {
            
            let searchTerm = input.keyword || '';

            // Translate keyword if a country other than Brazil is selected
            if (input.country && input.country !== 'br' && searchTerm) {
                 try {
                    const countryInfo = countries.find(c => c.value === input.country);
                    if (countryInfo) {
                        const translationResult = await translateKeyword({
                            text: searchTerm,
                            targetLanguage: countryInfo.language,
                        });
                        searchTerm = translationResult.translatedText;
                    }
                } catch (e) {
                    console.warn(`Keyword translation failed for country ${input.country}. Using original keyword.`, e);
                    // If translation fails, proceed with the original keyword
                }
            }
            
            const searchResponse = await youtubeApi.search.list({
                part: ['snippet'],
                q: searchTerm,
                type: 'video',
                regionCode: regionCode,
                relevanceLanguage: input.relevanceLanguage,
                maxResults: 25, // Limiting results to 25 to avoid overly long AI analysis
                pageToken: input.pageToken,
                videoDuration: input.excludeShorts ? 'medium' : 'any',
                publishedAfter: input.publishedAfter,
                publishedBefore: input.publishedBefore,
                order: input.order || 'relevance',
            });

            videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
            nextPageToken = searchResponse.data.nextPageToken;

        } else { // trending
            const trendingResponse = await youtubeApi.videos.list({
                part: ['snippet', 'contentDetails', 'statistics'],
                chart: 'mostPopular',
                regionCode: regionCode,
                hl: input.relevanceLanguage, // Language for metadata
                videoCategoryId: input.category,
                maxResults: 25,
                pageToken: input.pageToken,
            });

            const videos = input.excludeShorts 
                ? trendingResponse.data.items?.filter(v => {
                    const duration = v.contentDetails?.duration;
                    if (!duration) return true;
                    // Improved check for shorts (duration <= 60 seconds)
                    const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
                    if (!match) return true; // if duration format is weird, don't filter
                    const minutes = parseInt(match[1] || '0', 10);
                    const seconds = parseInt(match[2] || '0', 10);
                    return (minutes * 60 + seconds) > 60;
                }) 
                : trendingResponse.data.items;

            videoItems = videos || [];
            nextPageToken = trendingResponse.data.nextPageToken || undefined;
        }

        if (input.type === 'keyword' && videoIds.length > 0) {
            const videoDetailsResponse = await youtubeApi.videos.list({
                part: ['snippet', 'contentDetails', 'statistics'],
                id: videoIds,
                maxResults: 25,
            });
            
            const filteredVideos = input.minViews
                ? videoDetailsResponse.data.items?.filter(v => parseInt(v.statistics?.viewCount || '0', 10) >= input.minViews!)
                : videoDetailsResponse.data.items;
            
            videoItems = filteredVideos || [];
        }

        if (videoItems.length === 0) {
            return { videos: [], nextPageToken: undefined };
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
