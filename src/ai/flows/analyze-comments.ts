'use server';

/**
 * @fileOverview An AI agent that analyzes video comments to understand sentiment and key themes.
 *
 * - analyzeComments - A function that analyzes video comments.
 * - AnalyzeCommentsInput - The input type for the analyzeComments function.
 * - AnalyzeCommentsOutput - The return type for the analyzeComments function.
 */

import {ai} from '@/ai/genkit';
import { generate } from 'genkit';
import {z} from 'genkit';

const AnalyzeCommentsInputSchema = z.object({
  comments: z
    .string()
    .describe('The comments to analyze. Provide all comments as one string.'),
  prompt: z.string().optional().describe('A custom prompt for the analysis.'),
});
export type AnalyzeCommentsInput = z.infer<typeof AnalyzeCommentsInputSchema>;

const AnalyzeCommentsOutputSchema = z.object({
  sentiment: z.string().describe('The overall sentiment of the comments.'),
  keyThemes: z.string().describe('The key themes that emerge from the comments.'),
  summary: z.string().describe('A summary of the comments.'),
});
export type AnalyzeCommentsOutput = z.infer<typeof AnalyzeCommentsOutputSchema>;

export async function analyzeComments(input: AnalyzeCommentsInput): Promise<AnalyzeCommentsOutput> {
  return analyzeCommentsFlow(input);
}

const defaultPrompt = ai.definePrompt({
  name: 'analyzeCommentsPrompt',
  input: {schema: z.object({ comments: z.string() })},
  output: {schema: AnalyzeCommentsOutputSchema},
  prompt: `You are an AI assistant that analyzes video comments to understand the overall sentiment and identify key themes. You will be provided with a string containing all comments. Analyze the comments and determine the overall sentiment, key themes, and provide a summary.

Your response must be in Brazilian Portuguese.

Comments: {{{comments}}}`,
});

const analyzeCommentsFlow = ai.defineFlow(
  {
    name: 'analyzeCommentsFlow',
    inputSchema: AnalyzeCommentsInputSchema,
    outputSchema: AnalyzeCommentsOutputSchema,
  },
  async ({ comments, prompt: customPrompt }) => {
    if (customPrompt) {
      const {output} = await generate({
        prompt: `${customPrompt}\n\nComments:\n{{{comments}}}`,
        input: { comments },
        model: ai.model,
        output: { schema: AnalyzeCommentsOutputSchema },
        config: {
            temperature: 0.5,
        }
      });
      return output!;
    }

    const {output} = await defaultPrompt({ comments });
    return output!;
  }
);
