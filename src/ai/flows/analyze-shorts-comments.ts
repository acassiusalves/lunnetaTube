'use server';

/**
 * @fileOverview Análise dos comentários de 1 a 10 Shorts para criativos de anúncio.
 *
 * - analyzeShortsComments - Usa os comentários já exibidos (ou busca os mais relevantes) e gera o relatório no Gemini.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchTopComments, type FetchCommentsOutput } from './fetch-comments';
import { buildCommentsPrompt, type ShortsCommentsReport, type VideoComments } from '@/lib/shorts-report';
import { safeErrorSummary } from '@/lib/log-error';

const ReportSchema = z.object({
  painsAndDesires: z.array(z.object({
    insight: z.string(),
    frequency: z.enum(['alta', 'média', 'baixa']),
    videoIds: z.array(z.string()),
  })),
  audienceLanguage: z.array(z.object({
    quote: z.string(),
    translation: z.string().optional(),
    videoId: z.string(),
  })),
  adAngles: z.array(z.object({
    hook: z.string(),
    angle: z.string(),
    rationale: z.string(),
    basedOnQuote: z.string(),
    videoIds: z.array(z.string()),
  })),
});

const AnalyzeShortsCommentsInputSchema = z.object({
  apiKey: z.string().describe('The YouTube Data API v3 key.'),
  videos: z.array(z.object({
    id: z.string(),
    title: z.string(),
    // Comentários já exibidos na tela: a análise usa exatamente esses, sem buscar de novo
    comments: z.array(z.object({ text: z.string().max(10_000), likeCount: z.number().optional() })).max(100).optional(),
  })).min(1).max(10),
});
export type AnalyzeShortsCommentsInput = z.infer<typeof AnalyzeShortsCommentsInputSchema>;

const AnalyzeShortsCommentsOutputSchema = z.object({
  report: ReportSchema.optional(),
  commentsAnalyzed: z.number(),
  videosWithoutComments: z.array(z.string()),
  error: z.string().optional(),
});
export type AnalyzeShortsCommentsOutput = {
  report?: ShortsCommentsReport;
  commentsAnalyzed: number;
  videosWithoutComments: string[];
  error?: string;
};

export async function analyzeShortsComments(input: AnalyzeShortsCommentsInput): Promise<AnalyzeShortsCommentsOutput> {
  return analyzeShortsCommentsFlow(input);
}

const analyzeShortsCommentsFlow = ai.defineFlow(
  {
    name: 'analyzeShortsCommentsFlow',
    inputSchema: AnalyzeShortsCommentsInputSchema,
    outputSchema: AnalyzeShortsCommentsOutputSchema,
  },
  async ({ apiKey, videos }) => {
    // 100 comentários para um Short; 50 por Short na análise consolidada
    const perVideo = videos.length === 1 ? 100 : 50;
    const results = await Promise.all(
      videos.map(video => video.comments
        ? Promise.resolve<FetchCommentsOutput>({ comments: video.comments })
        : fetchTopComments({ apiKey, videoId: video.id, maxResults: perVideo })),
    );

    const withComments: VideoComments[] = [];
    const videosWithoutComments: string[] = [];
    videos.forEach((video, index) => {
      const comments = (results[index].comments || []) as { text: string; likeCount?: number }[];
      if (comments.length === 0) videosWithoutComments.push(video.id);
      else withComments.push({ id: video.id, title: video.title, comments });
    });

    const commentsAnalyzed = withComments.reduce((sum, video) => sum + video.comments.length, 0);
    if (commentsAnalyzed === 0) {
      // Erro da API (ex.: chave inválida) tem prioridade sobre "comentários desativados"
      const apiError = results.find(result => result.error && !result.error.includes('desabilitados'))?.error;
      return {
        commentsAnalyzed,
        videosWithoutComments,
        error: apiError || 'Nenhum comentário disponível nos Shorts selecionados (podem estar desativados).',
      };
    }

    try {
      const { output } = await ai.generate({
        prompt: buildCommentsPrompt(withComments),
        output: { schema: ReportSchema, format: 'json' },
        config: { temperature: 0.4 },
      });
      if (!output) throw new Error('resposta vazia');
      return { report: output, commentsAnalyzed, videosWithoutComments };
    } catch (e: any) {
      console.error('[analyzeShortsComments] Erro no Gemini:', safeErrorSummary(e));
      return {
        commentsAnalyzed,
        videosWithoutComments,
        error: `Não foi possível gerar a análise com o Gemini (${e.message || 'erro desconhecido'}). Confira se a GEMINI_API_KEY está configurada.`,
      };
    }
  }
);
