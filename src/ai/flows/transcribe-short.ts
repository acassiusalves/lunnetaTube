'use server';

/**
 * @fileOverview Transcrição de um Short pelo Gemini, a partir do link público do YouTube.
 *
 * - transcribeShort - Devolve a fala com os tempos e os textos escritos na tela.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { safeErrorSummary } from '@/lib/log-error';
import { TRANSCRIPT_PROMPT, youtubeWatchUrl, type ShortTranscript } from '@/lib/shorts-transcript';

const TranscriptSchema = z.object({
  language: z.string(),
  segments: z.array(z.object({ start: z.string(), text: z.string() })),
  onScreenText: z.array(z.string()),
});

const TranscribeShortInputSchema = z.object({
  videoId: z.string().describe('Id do vídeo no YouTube (11 caracteres).'),
});
export type TranscribeShortInput = z.infer<typeof TranscribeShortInputSchema>;

const TranscribeShortOutputSchema = z.object({
  transcript: TranscriptSchema.optional(),
  error: z.string().optional(),
});
export type TranscribeShortOutput = { transcript?: ShortTranscript; error?: string };

export async function transcribeShort(input: TranscribeShortInput): Promise<TranscribeShortOutput> {
  return transcribeShortFlow(input);
}

const transcribeShortFlow = ai.defineFlow(
  {
    name: 'transcribeShortFlow',
    inputSchema: TranscribeShortInputSchema,
    outputSchema: TranscribeShortOutputSchema,
  },
  async ({ videoId }) => {
    let url: string;
    try {
      url = youtubeWatchUrl(videoId);
    } catch {
      return { error: 'Id de vídeo inválido.' };
    }

    try {
      // O Gemini recebe o link público do YouTube e assiste ao vídeo; o Genkit não baixa o arquivo
      const { output } = await ai.generate({
        prompt: [
          { media: { url, contentType: 'video/mp4' } },
          { text: TRANSCRIPT_PROMPT },
        ],
        output: { schema: TranscriptSchema, format: 'json' },
        config: { temperature: 0 },
      });
      if (!output) throw new Error('resposta vazia');
      return { transcript: output };
    } catch (e: any) {
      console.error('[transcribeShort] Erro no Gemini:', safeErrorSummary(e));
      return {
        error: `Não foi possível transcrever o Short com o Gemini (${e.message || 'erro desconhecido'}). Confira se a GEMINI_API_KEY está configurada.`,
      };
    }
  }
);
