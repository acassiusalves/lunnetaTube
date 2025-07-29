'use server';

/**
 * @fileOverview A flow for searching videos on YouTube.
 *
 * - searchYoutubeVideos - A function that searches for YouTube videos based on various criteria.
 * - YoutubeSearchInput - The input type for the searchYoutubeVideos function.
 * - YoutubeSearchOutput - The return type for the searchYoutubeVideos function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { youtube } from 'googleapis/build/src/apis/youtube';

const YoutubeSearchInputSchema = z.object({
  apiKey: z.string().describe("The YouTube Data API v3 key."),
  type: z.enum(['keyword', 'trending']).describe("The type of search to perform."),
  keyword: z.string().optional().describe("The keyword to search for."),
  country: z.string().optional().describe("The country code for the search."),
  minViews: z.number().optional().describe("The minimum number of views."),
  excludeShorts: z.boolean().optional().describe("Whether to exclude YouTube Shorts."),
  category: z.string().optional().describe("The video category ID."),
  pageToken: z.string().optional().describe("The token for the next page of results."),
});
export type YoutubeSearchInput = z.infer<typeof YoutubeSearchInputSchema>;

const YoutubeSearchOutputSchema = z.object({
  videos: z.any().optional().describe("An array of video results."),
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

        if (input.type === 'keyword') {
            const searchResponse = await youtubeApi.search.list({
                part: ['snippet'],
                q: input.keyword,
                type: 'video',
                regionCode: input.country,
                maxResults: 50,
                pageToken: input.pageToken,
                videoDuration: input.excludeShorts ? 'medium' : 'any', // 'medium' is > 4 min, 'short' is < 4 min. 'any' is default. This is a proxy for shorts.
            });

            videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
            nextPageToken = searchResponse.data.nextPageToken;

        } else { // trending
            const trendingResponse = await youtubeApi.videos.list({
                part: ['snippet', 'contentDetails', 'statistics'],
                chart: 'mostPopular',
                regionCode: input.country,
                videoCategoryId: input.category,
                maxResults: 50,
                pageToken: input.pageToken,
            });

            const videos = input.excludeShorts 
                ? trendingResponse.data.items?.filter(v => {
                    const duration = v.contentDetails?.duration;
                    if (!duration) return true; // Keep if duration is unknown
                    const match = duration.match(/PT(\d+M)?(\d+S)?/);
                    if (!match) return true;
                    const minutes = parseInt(match[1] || '0');
                    const seconds = parseInt(match[2] || '0');
                    return (minutes * 60 + seconds) > 60;
                }) 
                : trendingResponse.data.items;

            return { videos: videos || [], nextPageToken: trendingResponse.data.nextPageToken || undefined };
        }

        if (videoIds.length === 0) {
            return { videos: [], nextPageToken: undefined };
        }

        // Get video details for the IDs found
        const videoDetailsResponse = await youtubeApi.videos.list({
            part: ['snippet', 'contentDetails', 'statistics'],
            id: videoIds,
            maxResults: 50,
        });
        
        // Filter by minimum views if specified
        const filteredVideos = input.minViews
            ? videoDetailsResponse.data.items?.filter(v => parseInt(v.statistics?.viewCount || '0', 10) >= input.minViews!)
            : videoDetailsResponse.data.items;

        return {
            videos: filteredVideos,
            nextPageToken: nextPageToken || undefined,
        };

    } catch (e: any) {
        console.error(e);
        // Extract useful error message from Google API response
        const errorMessage = e.response?.data?.error?.message || e.message || "An unknown error occurred with the YouTube API.";
        return { error: `Erro na API do YouTube: ${errorMessage}` };
    }
  }
);
