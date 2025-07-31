'use server';

/**
 * @fileOverview An AI agent that analyzes a list of videos to identify those with high potential for product ideas.
 *
 * - analyzeVideoPotential - A function that analyzes a list of videos.
 * - AnalyzeVideoPotentialInput - The input type for the analyzeVideoPotential function.
 * - AnalyzeVideoPotentialOutput - The return type for the analyzeVideoPotential function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for a single video object for analysis
const VideoForAnalysisSchema = z.object({
  id: z.string().describe('The unique ID of the video.'),
  title: z.string().describe('The title of the video.'),
  description: z.string().describe('The description of the video.'),
});

// Input schema for the main flow
const AnalyzeVideoPotentialInputSchema = z.object({
  videos: z.array(VideoForAnalysisSchema).describe('A list of videos to be analyzed.'),
  keyword: z.string().describe('The original keyword used for the search.'),
});
export type AnalyzeVideoPotentialInput = z.infer<typeof AnalyzeVideoPotentialInputSchema>;


// Output schema for the main flow
const AnalyzeVideoPotentialOutputSchema = z.object({
  highPotentialVideoIds: z.array(z.string()).describe('A list of video IDs that have high potential for containing product insights.'),
});
export type AnalyzeVideoPotentialOutput = z.infer<typeof AnalyzeVideoPotentialOutputSchema>;

// Exported wrapper function
export async function analyzeVideoPotential(input: AnalyzeVideoPotentialInput): Promise<AnalyzeVideoPotentialOutput> {
  return analyzeVideoPotentialFlow(input);
}

// Genkit Prompt
const prompt = ai.definePrompt({
  name: 'analyzeVideoPotentialPrompt',
  input: { schema: AnalyzeVideoPotentialInputSchema },
  output: { schema: AnalyzeVideoPotentialOutputSchema },
  prompt: `You are a market research expert. Your task is to analyze a list of YouTube videos based on a user's search keyword.
  Your goal is to identify which videos are most likely to contain valuable insights for creating a low-ticket digital product.

  Look for videos whose titles and descriptions suggest they address a specific problem, a "pain point," or offer a detailed tutorial ("how-to"). These are strong indicators of product potential.
  Avoid videos that are purely for entertainment, vlogs, or news, unless they explicitly discuss a problem related to the keyword.

  Analyze the provided list of videos and return only the IDs of the videos with the highest potential.

  Search Keyword: {{keyword}}

  Videos to Analyze:
  {{#each videos}}
  - ID: {{id}}
    Title: {{title}}
    Description: {{description}}
  ---
  {{/each}}

  Your response must be in Brazilian Portuguese.
  `,
});

// Genkit Flow
const analyzeVideoPotentialFlow = ai.defineFlow(
  {
    name: 'analyzeVideoPotentialFlow',
    inputSchema: AnalyzeVideoPotentialInputSchema,
    outputSchema: AnalyzeVideoPotentialOutputSchema,
  },
  async (input) => {

    if (input.videos.length === 0) {
      return { highPotentialVideoIds: [] };
    }

    const { output } = await prompt(input);

    return output || { highPotentialVideoIds: [] };
  }
);

    