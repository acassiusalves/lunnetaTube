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
  pageToken: z.string().optional().describe("The token for the next page of results."),
  maxResults: z.number().optional().describe("The maximum number of comments to return (default: 100)."),
  fetchAll: z.boolean().optional().describe("Whether to fetch all available comments up to maxResults."),
});
export type FetchCommentsInput = z.infer<typeof FetchCommentsInputSchema>;

const FetchCommentsOutputSchema = z.object({
  comments: z.any().optional().describe("An array of comment threads."),
  nextPageToken: z.string().optional().describe("Token for the next page."),
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
      const maxResults = input.maxResults || 100;
      const fetchAll = input.fetchAll !== false; // default true
      let allComments: any[] = [];
      let nextPageToken: string | null | undefined = input.pageToken;

      console.log(`[fetchTopComments] Buscando comentários do vídeo: ${input.videoId}, max: ${maxResults}`);

      // Buscar múltiplas páginas se fetchAll for true
      while (allComments.length < maxResults) {
        const pageSize = Math.min(100, maxResults - allComments.length); // API limita a 100 por página

        console.log(`[fetchTopComments] Buscando página, tamanho: ${pageSize}, total atual: ${allComments.length}`);

        const response = await youtubeApi.commentThreads.list({
          part: ['snippet'],
          videoId: input.videoId,
          order: 'relevance', // Ordenar por relevância para pegar os melhores comentários
          maxResults: pageSize,
          pageToken: nextPageToken || undefined,
          textFormat: 'plainText',
        });

        console.log(`[fetchTopComments] Resposta recebida, items: ${response.data.items?.length || 0}`);

        const pageComments = response.data.items?.map(item => {
          const snippet = item.snippet?.topLevelComment?.snippet;
          return {
              author: snippet?.authorDisplayName || 'Unknown',
              authorImageUrl: snippet?.authorProfileImageUrl || '',
              text: snippet?.textDisplay || '',
              likeCount: snippet?.likeCount || 0,
          };
        }) || [];

        allComments = allComments.concat(pageComments);
        nextPageToken = response.data.nextPageToken;

        console.log(`[fetchTopComments] Total de comentários agora: ${allComments.length}, próxima página: ${!!nextPageToken}`);

        // Parar se não houver mais páginas ou se não quiser buscar todas
        if (!nextPageToken || !fetchAll) {
          break;
        }

        // Se não encontrou nenhum comentário na primeira página, parar
        if (allComments.length === 0 && !nextPageToken) {
          break;
        }
      }

      console.log(`[fetchTopComments] Busca finalizada. Total de comentários: ${allComments.length}`);

      return {
        comments: allComments,
        nextPageToken: nextPageToken || undefined
      };

    } catch (e: any) {
        console.error('[fetchTopComments] Erro:', e);

        // Tratamento específico para comentários desabilitados
        if (e.response?.data?.error?.errors) {
          const errors = e.response.data.error.errors;
          const commentsDisabled = errors.some((err: any) =>
            err.reason === 'commentsDisabled' ||
            err.message?.includes('disabled')
          );

          if (commentsDisabled) {
            return {
              error: 'Os comentários estão desabilitados neste vídeo.',
              comments: []
            };
          }
        }

        const errorMessage = e.response?.data?.error?.message || e.message || "An unknown error occurred with the YouTube API.";
        return { error: `Erro na API do YouTube: ${errorMessage}` };
    }
  }
);
