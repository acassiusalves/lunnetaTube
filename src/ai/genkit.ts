
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Genkit uses GEMINI_API_KEY or GOOGLE_API_KEY environment variables
// Set these in your .env.local file
export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1beta'})],
  model: 'googleai/gemini-2.5-pro',
});
