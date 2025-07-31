import { config } from 'dotenv';
config();

import '@/ai/flows/fetch-transcript.ts';
import '@/ai/flows/analyze-comments.ts';
import '@/ai/flows/analyze-transcript.ts';
import '@/ai/flows/youtube-search.ts';
import '@/ai/flows/fetch-comments.ts';
import '@/ai/flows/analyze-video-potential.ts';
import '@/ai/flows/generate-product-brief.ts';
import '@/ai/flows/generate-product-structure.ts';
import '@/ai/flows/generate-headlines.ts';
