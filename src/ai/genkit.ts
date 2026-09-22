
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Genkit uses GEMINI_API_KEY or GOOGLE_API_KEY environment variables
// Set these in your .env.local file.
// Without a key, `apiKey: false` keeps the plugin from failing on init, so
// flows that only hit the YouTube API (search, trending) still work; AI calls
// then fail individually at call time instead of taking every flow down.
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1beta', apiKey: geminiApiKey || false})],
  model: 'googleai/gemini-2.5-pro',
});
