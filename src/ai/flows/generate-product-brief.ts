
'use server';

/**
 * @fileOverview A Genkit flow for generating a detailed product brief from a simple idea.
 *
 * - generateProductBrief - A function that creates a product brief.
 * - GenerateProductBriefInput - The input type for the generateProductBrief function.
 * - GenerateProductBriefOutput - The return type for the generateProductBrief function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProductBriefInputSchema = z.object({
  title: z.string().describe('The title of the product idea.'),
  description: z.string().describe('The description of the product idea.'),
});
export type GenerateProductBriefInput = z.infer<typeof GenerateProductBriefInputSchema>;

const GenerateProductBriefOutputSchema = z.object({
  productName: z.string().describe('A creative and catchy name for the product.'),
  slogan: z.string().describe('A short, memorable slogan for the product.'),
  targetAudience: z.string().describe('A description of the ideal customer for this product.'),
  painPoints: z.array(z.string()).describe('A list of specific problems or "pain points" this product solves.'),
  keyFeatures: z.array(z.string()).describe('A list of the main features of the product.'),
});
export type GenerateProductBriefOutput = z.infer<typeof GenerateProductBriefOutputSchema>;

export async function generateProductBrief(input: GenerateProductBriefInput): Promise<GenerateProductBriefOutput> {
  return generateProductBriefFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductBriefPrompt',
  input: { schema: GenerateProductBriefInputSchema },
  output: { schema: GenerateProductBriefOutputSchema },
  prompt: `You are a product development expert. Your task is to expand a simple product idea into a structured product brief.
  Based on the provided title and description, generate a creative product name, a catchy slogan, define the target audience, list the key pain points it solves, and outline the main features.

  Your entire response must be a valid JSON object that conforms to the output schema.
  Your response must be in Brazilian Portuguese.

  Product Idea Title: {{title}}
  Product Idea Description: {{description}}
  `,
});

const generateProductBriefFlow = ai.defineFlow(
  {
    name: 'generateProductBriefFlow',
    inputSchema: GenerateProductBriefInputSchema,
    outputSchema: GenerateProductBriefOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
