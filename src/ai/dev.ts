import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-video.ts';
import '@/ai/flows/analyze-comments.ts';
import '@/ai/flows/analyze-transcript.ts';
import '@/ai/flows/youtube-search.ts';
