
'use server';

/**
 * @fileOverview A Genkit flow for generating a product structure (e.g., chapters, modules).
 *
 * - generateProductStructure - A function that creates a product structure.
 * - GenerateProductStructureInput - The input type for the generateProductStructure function.
 * - GenerateProductStructureOutput - The return type for the generateProductStructure function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProductStructureInputSchema = z.object({
  title: z.string().describe('The title of the product idea.'),
  description: z.string().describe('The description of the product idea.'),
});
export type GenerateProductStructureInput = z.infer<typeof GenerateProductStructureInputSchema>;

const ChapterSchema = z.object({
    title: z.string().describe('The title of the chapter or module.'),
    description: z.string().describe('A detailed description of what is covered in this chapter/module, with at least 300 characters.'),
});

const GenerateProductStructureOutputSchema = z.object({
  productType: z.enum(['ebook', 'video_course', 'guide', 'other']).describe('The suggested type of product (e.g., E-book, Video Course).'),
  chapters: z.array(ChapterSchema).describe('A list of proposed chapters or modules for the product.'),
});
export type GenerateProductStructureOutput = z.infer<typeof GenerateProductStructureOutputSchema>;

export async function generateProductStructure(input: GenerateProductStructureInput): Promise<GenerateProductStructureOutput> {
  return generateProductStructureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductStructurePrompt',
  input: { schema: GenerateProductStructureInputSchema },
  output: { schema: GenerateProductStructureOutputSchema },
  prompt: `You are an instructional designer and product creator. Your task is to outline a logical structure for a digital product based on its title and description.
  Determine the best format (e.g., e-book, video course) and create a list of chapters or modules. 
  Each chapter must have a clear title and a detailed description of its contents, with a minimum of 300 characters per description.
  The structure should be logical and guide the user from the basics to more advanced topics.

  Your entire response must be a valid JSON object that conforms to the output schema.
  Your response must be in Brazilian Portuguese.

  Product Idea Title: {{title}}
  Product Idea Description: {{description}}
  `,
});

const generateProductStructureFlow = ai.defineFlow(
  {
    name: 'generateProductStructureFlow',
    inputSchema: GenerateProductStructureInputSchema,
    outputSchema: GenerateProductStructureOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
