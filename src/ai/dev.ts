import { config } from 'dotenv';
config();

import '@/ai/flows/fetch-transcript.ts';
import '@/ai/flows/analyze-comments.ts';
import '@/ai/flows/analyze-transcript.ts';
import '@/ai/flows/youtube-search.ts';
import '@/ai/flows/fetch-comments.ts';
