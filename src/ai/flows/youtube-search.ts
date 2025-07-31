
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

const YoutubeSearchInputSchema = z.object({
  apiKey: z.string().describe("The YouTube Data API v3 key."),
  type: z.enum(['keyword', 'trending']).describe("The type of search to perform."),
  keyword: z.string().optional().describe("The keyword to search for."),
  country: z.string().optional().describe("The country code for the search."),
  minViews: z.number().optional().describe("The minimum number of views."),
  excludeShorts: z.boolean().optional().describe("Whether to exclude YouTube Shorts."),
  category: z.string().optional().describe("The video category ID."),
  pageToken: z.string().optional().describe("The token for the next page of results."),
  skipAiAnalysis: z.boolean().optional().describe("Whether to skip the AI potential analysis.")
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

        if (input.type === 'keyword') {
            const searchResponse = await youtubeApi.search.list({
                part: ['snippet'],
                q: input.keyword,
                type: 'video',
                regionCode: input.country,
                maxResults: 25, // Limiting results to 25 to avoid overly long AI analysis
                pageToken: input.pageToken,
                videoDuration: input.excludeShorts ? 'medium' : 'any',
            });

            videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
            nextPageToken = searchResponse.data.nextPageToken;

        } else { // trending
            const trendingResponse = await youtubeApi.videos.list({
                part: ['snippet', 'contentDetails', 'statistics'],
                chart: 'mostPopular',
                regionCode: input.country,
                videoCategoryId: input.category,
                maxResults: 25,
                pageToken: input.pageToken,
            });

            const videos = input.excludeShorts 
                ? trendingResponse.data.items?.filter(v => {
                    const duration = v.contentDetails?.duration;
                    if (!duration) return true;
                    const match = duration.match(/PT(\d+M)?(\d+S)?/);
                    if (!match) return true;
                    const minutes = parseInt(match[1] || '0');
                    const seconds = parseInt(match[2] || '0');
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
