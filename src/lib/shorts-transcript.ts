/**
 * Transcrição de Shorts pelo Gemini: tipos, prompt, URL do vídeo e exportação em
 * texto. Sem dependências de servidor.
 */

export interface TranscriptSegment {
  start: string;  // momento em que o trecho começa, no formato m:ss
  text: string;   // fala literal, no idioma original
}

export interface ShortTranscript {
  language: string;        // idioma principal da fala, escrito em português
  segments: TranscriptSegment[];
  onScreenText: string[];  // textos escritos na tela, na ordem em que aparecem
}

export const TRANSCRIPT_PROMPT = `Transcreva este YouTube Short.

Entregue:
1. segments: a fala do vídeo, na ordem, em trechos curtos. Em cada trecho, "start" é o momento em que ele começa, no formato m:ss (ex.: 0:07), e "text" é a fala literal no idioma original. Se não houver fala, devolva uma lista vazia.
2. onScreenText: os textos escritos na tela (legendas embutidas, títulos, chamadas), na ordem em que aparecem, sem repetir. Se não houver, devolva uma lista vazia.
3. language: o idioma principal da fala, escrito em português (ex.: "português", "inglês", "espanhol"). Se não houver fala, use "sem fala".

Não resuma, não traduza e não invente: transcreva apenas o que é dito e mostrado.`;

// Ids de vídeo do YouTube têm 11 caracteres; nada além disso entra na URL enviada ao Gemini
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function youtubeWatchUrl(videoId: string): string {
  if (!VIDEO_ID_PATTERN.test(videoId)) throw new Error(`Id de vídeo inválido: ${videoId}`);
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function formatTranscriptText(transcript: ShortTranscript, title: string): string {
  const lines = [`# Transcrição: ${title}`, '', `Idioma: ${transcript.language}`, '', '## Fala'];
  if (transcript.segments.length === 0) lines.push('(sem fala)');
  transcript.segments.forEach(segment => lines.push(`${segment.start} ${segment.text}`));
  if (transcript.onScreenText.length > 0) {
    lines.push('', '## Texto na tela');
    transcript.onScreenText.forEach(text => lines.push(`- ${text}`));
  }
  return lines.join('\n');
}
