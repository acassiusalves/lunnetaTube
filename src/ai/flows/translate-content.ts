
'use server';

/**
 * @fileOverview A flow to translate video content (titles and comments) to Portuguese.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateContentInputSchema = z.object({
  texts: z.array(z.object({
    id: z.string().describe('Unique identifier for the text'),
    text: z.string().describe('The text to translate'),
  })).describe('Array of texts to translate'),
  targetLanguage: z.string().default('Brazilian Portuguese').describe('Target language for translation'),
});
export type TranslateContentInput = z.infer<typeof TranslateContentInputSchema>;

const TranslateContentOutputSchema = z.object({
  translations: z.array(z.object({
    id: z.string().describe('The original text identifier'),
    translatedText: z.string().describe('The translated text'),
  })).describe('Array of translated texts'),
});
export type TranslateContentOutput = z.infer<typeof TranslateContentOutputSchema>;

export async function translateContent(input: TranslateContentInput): Promise<TranslateContentOutput> {
  return translateContentFlow(input);
}

const translateContentFlow = ai.defineFlow(
  {
    name: 'translateContentFlow',
    inputSchema: TranslateContentInputSchema,
    outputSchema: TranslateContentOutputSchema,
  },
  async ({ texts, targetLanguage }) => {
    if (!texts || texts.length === 0) {
      return { translations: [] };
    }

    // Processar em lotes de 10 para evitar limites de tokens
    const batchSize = 10;
    const allTranslations: { id: string; translatedText: string }[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const textsForPrompt = batch.map((t, idx) => `[${t.id}]: ${t.text}`).join('\n');

      const prompt = `Translate the following texts to ${targetLanguage}.
Return a JSON array with the translations. Each item should have "id" (same as input) and "translatedText".
Keep the same meaning and tone. If the text is already in ${targetLanguage}, return it as is.

Texts to translate:
${textsForPrompt}

Return ONLY valid JSON in this exact format:
{"translations": [{"id": "...", "translatedText": "..."}]}`;

      try {
        const { output } = await ai.generate({
          prompt: prompt,
          model: 'googleai/gemini-2.0-flash',
          output: {
            schema: TranslateContentOutputSchema
          },
          config: {
            temperature: 0.1,
          }
        });

        if (output?.translations) {
          allTranslations.push(...output.translations);
        }
      } catch (error) {
        console.error('Translation batch error:', error);
        // Em caso de erro, retornar os textos originais para este lote
        batch.forEach(t => {
          allTranslations.push({ id: t.id, translatedText: t.text });
        });
      }
    }

    return { translations: allTranslations };
  }
);
