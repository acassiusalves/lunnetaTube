'use server';

/**
 * @fileOverview A flow for fetching a transcript from a YouTube video.
 *
 * - fetchTranscript - Fetches the transcript for a given video ID.
 * - FetchTranscriptInput - Input schema for the fetchTranscript flow.
 * - FetchTranscriptOutput - Output schema for the fetchTranscript flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google, youtube_v3 } from 'googleapis';
import { stripHtml } from 'string-strip-html';

const FetchTranscriptInputSchema = z.object({
  apiKey: z.string().describe('The YouTube Data API v3 key.'),
  videoId: z.string().describe('The ID of the YouTube video.'),
});
export type FetchTranscriptInput = z.infer<typeof FetchTranscriptInputSchema>;

const FetchTranscriptOutputSchema = z.object({
  transcript: z.string().optional().describe('The full transcript text.'),
  error: z.string().optional().describe('An error message if fetching fails.'),
});
export type FetchTranscriptOutput = z.infer<typeof FetchTranscriptOutputSchema>;

export async function fetchTranscript(input: FetchTranscriptInput): Promise<FetchTranscriptOutput> {
  return fetchTranscriptFlow(input);
}

// Helper to fetch and clean the transcript
async function getTranscript(
  youtube: youtube_v3.Youtube,
  videoId: string,
  trackId: string
): Promise<string> {
    const response = await youtube.captions.download({ id: trackId, tfmt: 'ttml' });
    const ttml = response.data as string;
    
    // Naive TTML parsing: extract text content from <p> tags
    const lines = (ttml.match(/<p .*?>(.*?)<\/p>/gs) || []).map(line => {
        return stripHtml(line).result;
    });

    return lines.join(' ').replace(/\s+/g, ' ').trim();
}


const fetchTranscriptFlow = ai.defineFlow(
  {
    name: 'fetchTranscriptFlow',
    inputSchema: FetchTranscriptInputSchema,
    outputSchema: FetchTranscriptOutputSchema,
  },
  async ({ apiKey, videoId }) => {
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });

    try {
      // 1. Get available caption tracks
      const captionListResponse = await youtube.captions.list({
        part: ['snippet'],
        videoId: videoId,
      });

      const tracks = captionListResponse.data.items;
      if (!tracks || tracks.length === 0) {
        return { error: 'Nenhuma transcrição disponível para este vídeo.' };
      }

      // 2. Prioritize tracks: Brazilian Portuguese > Portuguese > English > auto-generated
      let trackId: string | null | undefined = null;
      
      const ptBrTrack = tracks.find(t => t.snippet?.language === 'pt-BR');
      const ptTrack = tracks.find(t => t.snippet?.language === 'pt');
      const enTrack = tracks.find(t => t.snippet?.language === 'en');
      const autoPtTrack = tracks.find(t => t.snippet?.language === 'pt' && t.snippet?.trackKind === 'ASR');
      const autoEnTrack = tracks.find(t => t.snippet?.language === 'en' && t.snippet?.trackKind === 'ASR');

      if (ptBrTrack) trackId = ptBrTrack.id;
      else if (ptTrack) trackId = ptTrack.id;
      else if (enTrack) trackId = enTrack.id;
      else if (autoPtTrack) trackId = autoPtTrack.id;
      else if (autoEnTrack) trackId = autoEnTrack.id;
      else trackId = tracks[0].id; // Fallback to the first available track

      if (!trackId) {
        return { error: 'Não foi possível encontrar uma faixa de transcrição adequada.' };
      }
      
      // 3. Download and process the transcript
      const transcript = await getTranscript(youtube, videoId, trackId);
      
      if (!transcript) {
        return { error: 'A transcrição encontrada estava vazia.' };
      }

      return { transcript };

    } catch (e: any) {
        console.error(e);
        const errorMessage = e.response?.data?.error?.message || e.message;
        if (errorMessage.includes('captionsNotAvailable')) {
            return { error: 'As legendas estão desativadas para este vídeo.' };
        }
        return { error: `Erro na API do YouTube: ${errorMessage}` };
    }
  }
);
