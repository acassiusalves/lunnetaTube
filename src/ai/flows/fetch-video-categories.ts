
'use server';

/**
 * @fileOverview A flow for fetching video categories for a specific region.
 *
 * - fetchVideoCategories - Fetches video categories for a given region.
 * - FetchVideoCategoriesInput - The input type for the fetchVideoCategories function.
 * - FetchVideoCategoriesOutput - The return type for the fetchVideoCategories function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { youtube } from 'googleapis/build/src/apis/youtube';

const VideoCategorySchema = z.object({
  id: z.string().describe("The ID of the video category."),
  title: z.string().describe("The display name of the category."),
});

const FetchVideoCategoriesInputSchema = z.object({
  apiKey: z.string().describe("The YouTube Data API v3 key."),
  regionCode: z.string().describe("The region code (e.g., 'US', 'BR')."),
});
export type FetchVideoCategoriesInput = z.infer<typeof FetchVideoCategoriesInputSchema>;

const FetchVideoCategoriesOutputSchema = z.object({
  categories: z.array(VideoCategorySchema).optional().describe("An array of video categories."),
  error: z.string().optional().describe("An error message if the fetch fails.")
});
export type FetchVideoCategoriesOutput = z.infer<typeof FetchVideoCategoriesOutputSchema>;

export async function fetchVideoCategories(input: FetchVideoCategoriesInput): Promise<FetchVideoCategoriesOutput> {
  return fetchVideoCategoriesFlow(input);
}

const fetchVideoCategoriesFlow = ai.defineFlow(
  {
    name: 'fetchVideoCategoriesFlow',
    inputSchema: FetchVideoCategoriesInputSchema,
    outputSchema: FetchVideoCategoriesOutputSchema,
  },
  async ({ apiKey, regionCode }) => {
    const youtubeApi = youtube({
      version: 'v3',
      auth: apiKey,
    });
    
    try {
      const response = await youtubeApi.videoCategories.list({
        part: ['snippet'],
        regionCode: regionCode,
      });

      const categories = response.data.items
        ?.filter(item => item.id && item.snippet?.title && item.snippet?.assignable)
        .map(item => ({
            id: item.id!,
            title: item.snippet!.title!,
        })) || [];

      return { categories };

    } catch (e: any) {
        console.error('Error fetching video categories:', e);
        const errorMessage = e.response?.data?.error?.message || e.message || "An unknown error occurred with the YouTube API.";
        return { error: `Erro na API do YouTube: ${errorMessage}` };
    }
  }
);

    
