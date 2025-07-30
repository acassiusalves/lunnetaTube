'use server';

/**
 * @fileOverview Analyzes a video transcript to identify user pain points, FAQs, and product needs.
 *
 * - analyzeTranscript - Analyzes the transcript and returns insights.
 * - AnalyzeTranscriptInput - The input type for the analyzeTranscript function.
 * - AnalyzeTranscriptOutput - The return type for the analyzeTranscript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTranscriptInputSchema = z.object({
  transcript: z
    .string()
    .describe('The transcript of the video to analyze.'),
});
export type AnalyzeTranscriptInput = z.infer<typeof AnalyzeTranscriptInputSchema>;

const AnalyzeTranscriptOutputSchema = z.object({
  painPoints: z.string().describe('Identified user pain points from the transcript.'),
  faqs: z.string().describe('Frequently asked questions derived from the transcript.'),
  productNeeds: z.string().describe('Potential low-cost product ideas based on user needs.'),
});
export type AnalyzeTranscriptOutput = z.infer<typeof AnalyzeTranscriptOutputSchema>;

export async function analyzeTranscript(input: AnalyzeTranscriptInput): Promise<AnalyzeTranscriptOutput> {
  return analyzeTranscriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTranscriptPrompt',
  input: {schema: AnalyzeTranscriptInputSchema},
  output: {schema: AnalyzeTranscriptOutputSchema},
  prompt: `You are an AI assistant tasked with analyzing video transcripts to extract valuable insights for product development.

  Analyze the following transcript and identify user pain points, frequently asked questions, and potential low-cost product ideas that address user needs.

  Your response must be in Brazilian Portuguese.

  Transcript:
  {{transcript}}

  Present your findings in a structured format, clearly outlining each category:

  Pain Points:
  - ...

  Frequently Asked Questions:
  - ...

  Product Needs:
  - ...`,
});

const analyzeTranscriptFlow = ai.defineFlow(
  {
    name: 'analyzeTranscriptFlow',
    inputSchema: AnalyzeTranscriptInputSchema,
    outputSchema: AnalyzeTranscriptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
