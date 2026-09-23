import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTranscriptText, youtubeWatchUrl, type ShortTranscript } from '@/lib/shorts-transcript';

test('youtubeWatchUrl aceita só ids de 11 caracteres', () => {
  assert.equal(youtubeWatchUrl('aqz-KE-bpKQ'), 'https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  assert.throws(() => youtubeWatchUrl('abc'));
  assert.throws(() => youtubeWatchUrl('aqz-KE-bpKQ&x=1'));
  assert.throws(() => youtubeWatchUrl('aqz-KE-bp/Q'));
});

test('formatTranscriptText: fala com tempos e texto na tela', () => {
  const transcript: ShortTranscript = {
    language: 'português',
    segments: [
      { start: '0:00', text: 'Você sabia que dá pra treinar em 5 minutos?' },
      { start: '0:04', text: 'Olha só.' },
    ],
    onScreenText: ['TREINO DE 5 MIN', 'Salve pra depois'],
  };
  assert.equal(formatTranscriptText(transcript, 'Treino rápido'), [
    '# Transcrição: Treino rápido',
    '',
    'Idioma: português',
    '',
    '## Fala',
    '0:00 Você sabia que dá pra treinar em 5 minutos?',
    '0:04 Olha só.',
    '',
    '## Texto na tela',
    '- TREINO DE 5 MIN',
    '- Salve pra depois',
  ].join('\n'));
});

test('formatTranscriptText: sem fala e sem texto na tela', () => {
  const text = formatTranscriptText({ language: 'sem fala', segments: [], onScreenText: [] }, 'Dança');
  assert.equal(text, ['# Transcrição: Dança', '', 'Idioma: sem fala', '', '## Fala', '(sem fala)'].join('\n'));
});
