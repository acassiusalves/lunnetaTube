
'use server';

/**
 * @fileOverview A Genkit flow for generating compelling headlines and sub-headlines for a product.
 *
 * - generateHeadlines - A function that creates headlines using copywriting techniques.
 * - GenerateHeadlinesInput - The input type for the generateHeadlines function.
 * - GenerateHeadlinesOutput - The return type for the generateHeadlines function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateHeadlinesInputSchema = z.object({
  title: z.string().describe('The title of the product idea.'),
  description: z.string().describe('The description of the product idea.'),
});
export type GenerateHeadlinesInput = z.infer<typeof GenerateHeadlinesInputSchema>;

const HeadlineSchema = z.object({
    headline: z.string().describe('A compelling, attention-grabbing headline for the product.'),
    subheadline: z.string().describe('A supportive sub-headline that expands on the main headline.'),
});

const GenerateHeadlinesOutputSchema = z.object({
  headlines: z.array(HeadlineSchema).describe('A list of generated headline and sub-headline pairs.'),
});
export type GenerateHeadlinesOutput = z.infer<typeof GenerateHeadlinesOutputSchema>;

export async function generateHeadlines(input: GenerateHeadlinesInput): Promise<GenerateHeadlinesOutput> {
  return generateHeadlinesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHeadlinesPrompt',
  input: { schema: GenerateHeadlinesInputSchema },
  output: { schema: GenerateHeadlinesOutputSchema },
  prompt: `You are an expert copywriter specializing in creating high-converting headlines for digital products.
  Based on the provided product title and description, generate a list of 5 compelling headline and sub-headline pairs.
  Use proven copywriting formulas (e.g., AIDA, PAS, 'How to...') to create headlines that grab attention and generate interest.

  Your entire response must be a valid JSON object that conforms to the output schema.
  Your response must be in Brazilian Portuguese.

  Product Idea Title: {{title}}
  Product Idea Description: {{description}}
  `,
});

const generateHeadlinesFlow = ai.defineFlow(
  {
    name: 'generateHeadlinesFlow',
    inputSchema: GenerateHeadlinesInputSchema,
    outputSchema: GenerateHeadlinesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
