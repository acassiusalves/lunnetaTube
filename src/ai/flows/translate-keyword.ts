
'use server';

/**
 * @fileOverview A simple flow to translate text to a target language.
 *
 * - translateKeyword - A function that translates text.
 * - TranslateKeywordInput - The input type for the translateKeyword function.
 * - TranslateKeywordOutput - The return type for the translateKeyword function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateKeywordInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The target language for translation (e.g., "English", "Brazilian Portuguese").'),
});
export type TranslateKeywordInput = z.infer<typeof TranslateKeywordInputSchema>;

const TranslateKeywordOutputSchema = z.object({
    translatedText: z.string().describe('The translated text.'),
});
export type TranslateKeywordOutput = z.infer<typeof TranslateKeywordOutputSchema>;

export async function translateKeyword(input: TranslateKeywordInput): Promise<TranslateKeywordOutput> {
  return translateKeywordFlow(input);
}

const translateKeywordFlow = ai.defineFlow(
  {
    name: 'translateKeywordFlow',
    inputSchema: TranslateKeywordInputSchema,
    outputSchema: TranslateKeywordOutputSchema,
  },
  async ({ text, targetLanguage }) => {

    if (!text) {
        return { translatedText: '' };
    }

    const prompt = `Translate the following keyword/phrase to ${targetLanguage}.
    Return ONLY the translated text, without any extra explanation, formatting, or quotation marks.
    
    Keyword: "${text}"`;

    const { output } = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-1.5-flash',
      output: {
          schema: TranslateKeywordOutputSchema
      },
      config: {
        temperature: 0, // Be deterministic
      }
    });

    return output!;
  }
);
