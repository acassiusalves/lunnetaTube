'use server';

/**
 * @fileOverview Busca estatísticas de canais do YouTube
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { youtube } from 'googleapis/build/src/apis/youtube';
import type { ChannelStats } from '@/lib/data';

const FetchChannelStatsInputSchema = z.object({
  channelIds: z.array(z.string()).describe("Array de IDs dos canais"),
  apiKey: z.string().describe("The YouTube Data API v3 key."),
});
export type FetchChannelStatsInput = z.infer<typeof FetchChannelStatsInputSchema>;

const FetchChannelStatsOutputSchema = z.object({
  channelStats: z.record(z.any()).describe("Mapa de channelId para estatísticas do canal"),
  error: z.string().optional().describe("Mensagem de erro se houver"),
});
export type FetchChannelStatsOutput = z.infer<typeof FetchChannelStatsOutputSchema>;

export async function fetchChannelStats(input: FetchChannelStatsInput): Promise<FetchChannelStatsOutput> {
  return fetchChannelStatsFlow(input);
}

const fetchChannelStatsFlow = ai.defineFlow(
  {
    name: 'fetchChannelStatsFlow',
    inputSchema: FetchChannelStatsInputSchema,
    outputSchema: FetchChannelStatsOutputSchema,
  },
  async (input) => {
    const youtubeApi = youtube({
      version: 'v3',
      auth: input.apiKey,
    });

    try {
      // Remover duplicatas
      const uniqueChannelIds = [...new Set(input.channelIds)];

      if (uniqueChannelIds.length === 0) {
        return { channelStats: {} };
      }

      // YouTube API permite até 50 IDs por requisição
      const channelStats: Record<string, ChannelStats> = {};

      for (let i = 0; i < uniqueChannelIds.length; i += 50) {
        const batch = uniqueChannelIds.slice(i, i + 50);

        const response = await youtubeApi.channels.list({
          part: ['statistics'],
          id: batch,
        });

        if (response.data.items) {
          for (const channel of response.data.items) {
            const stats = channel.statistics;
            if (stats && channel.id) {
              const viewCount = parseInt(stats.viewCount || '0', 10);
              const videoCount = parseInt(stats.videoCount || '0', 10);

              channelStats[channel.id] = {
                subscriberCount: parseInt(stats.subscriberCount || '0', 10),
                viewCount: viewCount,
                videoCount: videoCount,
                avgViewsPerVideo: videoCount > 0 ? viewCount / videoCount : 0,
              };
            }
          }
        }
      }

      return { channelStats };
    } catch (e: any) {
      console.error('Error fetching channel stats:', e);
      const errorMessage = e.response?.data?.error?.message || e.message || "Erro ao buscar estatísticas dos canais.";
      return { channelStats: {}, error: errorMessage };
    }
  }
);
