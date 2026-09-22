import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  analysisKey,
  buildCommentsPrompt,
  formatReportMarkdown,
  MAX_COMMENT_CHARS,
  type ShortsCommentsReport,
} from '@/lib/shorts-report';

test('buildCommentsPrompt: agrupa por Short, junta espaços, corta textos longos e mostra likes', () => {
  const prompt = buildCommentsPrompt([
    { id: 'v1', title: 'Treino em casa', comments: [{ text: 'Amei   esse\ntreino', likeCount: 12 }, { text: 'x'.repeat(600) }] },
    { id: 'v2', title: 'Dieta', comments: [{ text: 'Funciona mesmo?', likeCount: 0 }] },
  ]);
  assert.match(prompt, /### Short v1: Treino em casa/);
  assert.match(prompt, /- Amei esse treino \(12 likes\)/);
  assert.ok(prompt.includes(`- ${'x'.repeat(MAX_COMMENT_CHARS)}\n`));
  assert.ok(!prompt.includes('x'.repeat(MAX_COMMENT_CHARS + 1)));
  assert.match(prompt, /### Short v2: Dieta\n- Funciona mesmo\?/);
  assert.ok(!prompt.includes('(0 likes)'));
  assert.match(prompt, /português do Brasil/);
});

test('formatReportMarkdown: três seções com fontes e traduções', () => {
  const report: ShortsCommentsReport = {
    painsAndDesires: [{ insight: 'Querem emagrecer sem academia', frequency: 'alta', videoIds: ['v1'] }],
    audienceLanguage: [
      { quote: 'Funciona mesmo?', videoId: 'v2' },
      { quote: 'Me encanta', translation: 'Eu adoro', videoId: 'v1' },
    ],
    adAngles: [{
      hook: 'Você não precisa de academia',
      angle: 'Treino curto em casa',
      rationale: 'Muitos citam falta de tempo',
      basedOnQuote: 'Não tenho tempo pra academia',
      videoIds: ['v1', 'v2'],
    }],
  };
  const text = formatReportMarkdown(report, { v1: 'Treino em casa', v2: 'Dieta' });
  assert.equal(text, [
    '# Análise de comentários para criativos',
    '',
    '## Dores e desejos',
    '- Querem emagrecer sem academia (frequência alta; Treino em casa)',
    '',
    '## Linguagem do público',
    '- "Funciona mesmo?" (Dieta)',
    '- "Me encanta" (Eu adoro) (Treino em casa)',
    '',
    '## Ângulos de anúncio',
    '1. **Você não precisa de academia**',
    '   - Ângulo: Treino curto em casa',
    '   - Por que funciona: Muitos citam falta de tempo',
    '   - Baseado em: "Não tenho tempo pra academia"',
    '   - Shorts: Treino em casa, Dieta',
  ].join('\n'));
});

test('analysisKey independe da ordem', () => {
  assert.equal(analysisKey(['b', 'a']), 'a,b');
  assert.equal(analysisKey(['a', 'b']), analysisKey(['b', 'a']));
});
