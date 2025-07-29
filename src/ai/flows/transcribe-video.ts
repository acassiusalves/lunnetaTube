'use server';

/**
 * @fileOverview A video transcription AI agent.
 *
 * - transcribeVideo - A function that handles the video transcription process.
 * - TranscribeVideoInput - The input type for the transcribeVideo function.
 * - TranscribeVideoOutput - The return type for the transcribeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeVideoInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeVideoInput = z.infer<typeof TranscribeVideoInputSchema>;

const TranscribeVideoOutputSchema = z.object({
  transcription: z.string().describe('The transcription of the video.'),
});
export type TranscribeVideoOutput = z.infer<typeof TranscribeVideoOutputSchema>;

export async function transcribeVideo(input: TranscribeVideoInput): Promise<TranscribeVideoOutput> {
  return transcribeVideoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeVideoPrompt',
  input: {schema: TranscribeVideoInputSchema},
  output: {schema: TranscribeVideoOutputSchema},
  prompt: `You are an expert transcriptionist.

You will use this information to transcribe the video.

Video: {{media url=videoDataUri}}`,
});

const transcribeVideoFlow = ai.defineFlow(
  {
    name: 'transcribeVideoFlow',
    inputSchema: TranscribeVideoInputSchema,
    outputSchema: TranscribeVideoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {
      model: 'googleai/gemini-1.5-pro',
    });
    return output!;
  }
);
