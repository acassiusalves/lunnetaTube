
'use server';

/**
 * @fileOverview An AI agent that analyzes video comments to understand sentiment and key themes.
 *
 * - analyzeComments - A function that analyzes video comments.
 * - AnalyzeCommentsInput - The input type for the analyzeComments function.
 * - AnalyzeCommentsOutput - The return type for the analyzeComments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCommentsInputSchema = z.object({
  comments: z
    .string()
    .describe('The comments to analyze. Provide all comments as one string.'),
  prompt: z.string().optional().describe('A custom prompt for the analysis.'),
  model: z.string().optional().describe('The model to use for the analysis.'),
});
export type AnalyzeCommentsInput = z.infer<typeof AnalyzeCommentsInputSchema>;

const AnalyzeCommentsOutputSchema = z.object({
    analysis: z.string().describe('The full analysis of the comments, formatted as requested by the prompt.'),
});
export type AnalyzeCommentsOutput = z.infer<typeof AnalyzeCommentsOutputSchema>;

export async function analyzeComments(input: AnalyzeCommentsInput): Promise<AnalyzeCommentsOutput> {
  return analyzeCommentsFlow(input);
}

const defaultPromptText = `You are an AI assistant that analyzes video comments to understand the overall sentiment and identify key themes. You will be provided with a string containing all comments. Analyze the comments and determine the overall sentiment, key themes, and provide a summary.`;

const analyzeCommentsFlow = ai.defineFlow(
  {
    name: 'analyzeCommentsFlow',
    inputSchema: AnalyzeCommentsInputSchema,
    outputSchema: AnalyzeCommentsOutputSchema,
  },
  async ({ comments, prompt: customPrompt, model }) => {
    
    // Determine the prompt to use. If a custom prompt is provided, use it. Otherwise, use the default.
    const basePrompt = customPrompt || defaultPromptText;
    
    // Ensure the Portuguese instruction is always added.
    const finalPrompt = `${basePrompt}\n\nSua resposta deve estar em Português do Brasil.`;

    const {output} = await ai.generate({
      prompt: `${finalPrompt}\n\nComments:\n${comments}`,
      model: model || 'googleai/gemini-1.5-flash',
      output: { 
          schema: AnalyzeCommentsOutputSchema,
      },
      config: {
          temperature: 0.5,
      }
    });

    return output!;
  }
);
