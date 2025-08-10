
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

const ProductIdeaSchema = z.object({
    title: z.string().describe('A short, catchy title for the product idea.'),
    description: z.string().describe('A one-paragraph description of the product idea, explaining what it is and what problem it solves.'),
});

const AnalyzeCommentsOutputSchema = z.object({
    summary: z.string().describe('A brief summary of the overall comment analysis.'),
    sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']).describe('The overall sentiment of the comments.'),
    keyThemes: z.array(z.string()).describe('A list of the main themes or topics discussed in the comments.'),
    productIdeas: z.array(ProductIdeaSchema).describe('A list of potential low-ticket product ideas based on the comments.'),
});
export type AnalyzeCommentsOutput = z.infer<typeof AnalyzeCommentsOutputSchema>;

export async function analyzeComments(input: AnalyzeCommentsInput): Promise<AnalyzeCommentsOutput> {
  return analyzeCommentsFlow(input);
}

const defaultPromptText = `You are an AI assistant that analyzes video comments to understand the overall sentiment, identify key themes, and generate potential product ideas. 
Analyze the comments and provide a summary, the overall sentiment, key themes, and a list of 2-3 low-ticket product ideas.
Your entire response must be a valid JSON object that conforms to the output schema.
`;

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
      model: model || 'googleai/gemini-2.5-pro',
      output: { 
          schema: AnalyzeCommentsOutputSchema,
          format: 'json',
      },
      config: {
          temperature: 0.5,
      }
    });

    return output!;
  }
);
