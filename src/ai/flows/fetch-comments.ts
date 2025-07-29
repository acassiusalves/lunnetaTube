'use server';

/**
 * @fileOverview A flow for fetching top comments from a YouTube video.
 *
 * - fetchTopComments - A function that fetches the top 20 relevant comments.
 * - FetchCommentsInput - The input type for the fetchTopComments function.
 * - FetchCommentsOutput - The return type for the fetchTopComments function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { youtube } from 'googleapis/build/src/apis/youtube';

const FetchCommentsInputSchema = z.object({
  apiKey: z.string().describe("The YouTube Data API v3 key."),
  videoId: z.string().describe("The ID of the YouTube video."),
});
export type FetchCommentsInput = z.infer<typeof FetchCommentsInputSchema>;

const FetchCommentsOutputSchema = z.object({
  comments: z.any().optional().describe("An array of comment threads."),
  error: z.string().optional().describe("An error message if the fetch fails.")
});
export type FetchCommentsOutput = z.infer<typeof FetchCommentsOutputSchema>;

export async function fetchTopComments(input: FetchCommentsInput): Promise<FetchCommentsOutput> {
  return fetchTopCommentsFlow(input);
}

const fetchTopCommentsFlow = ai.defineFlow(
  {
    name: 'fetchTopCommentsFlow',
    inputSchema: FetchCommentsInputSchema,
    outputSchema: FetchCommentsOutputSchema,
  },
  async (input) => {
    const youtubeApi = youtube({
      version: 'v3',
      auth: input.apiKey,
    });
    
    try {
      const response = await youtubeApi.commentThreads.list({
        part: ['snippet'],
        videoId: input.videoId,
        order: 'relevance',
        maxResults: 20,
        textFormat: 'plainText',
      });

      const comments = response.data.items?.map(item => {
        const snippet = item.snippet?.topLevelComment?.snippet;
        return {
            author: snippet?.authorDisplayName || 'Unknown',
            authorImageUrl: snippet?.authorProfileImageUrl || '',
            text: snippet?.textDisplay || '',
        };
      });

      return { comments: comments || [] };

    } catch (e: any) {
        console.error(e);
        const errorMessage = e.response?.data?.error?.message || e.message || "An unknown error occurred with the YouTube API.";
        return { error: `Erro na API do YouTube: ${errorMessage}` };
    }
  }
);
