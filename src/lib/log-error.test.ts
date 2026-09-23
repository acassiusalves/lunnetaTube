import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactSecrets, safeErrorSummary } from '@/lib/log-error';

const KEY = 'AIzaSyFAKE-key_123';

test('safeErrorSummary: erro da API do Google vira o corpo do erro, sem a config da requisição', () => {
  const apiError = { code: 403, message: 'Quota exceeded', errors: [{ reason: 'quotaExceeded' }] };
  const gaxiosError = {
    message: 'Quota exceeded',
    config: { url: `https://youtube.googleapis.com/youtube/v3/search?part=snippet&key=${KEY}`, params: { key: KEY } },
    response: { status: 403, data: { error: apiError } },
  };

  const summary = safeErrorSummary(gaxiosError);

  assert.deepEqual(summary, apiError);
  assert.ok(!JSON.stringify(summary).includes(KEY));
});

test('safeErrorSummary: mensagem com a URL (falha de rede do node-fetch) tem a chave mascarada', () => {
  const networkError = new Error(
    `request to https://youtube.googleapis.com/youtube/v3/videos?part=snippet&key=${KEY}&id=abc failed, reason: ETIMEDOUT`,
  );

  const summary = safeErrorSummary(networkError);

  assert.equal(
    summary,
    'request to https://youtube.googleapis.com/youtube/v3/videos?part=snippet&key=[REDACTED]&id=abc failed, reason: ETIMEDOUT',
  );
});

test('safeErrorSummary: erros simples e valores que não são Error', () => {
  assert.equal(safeErrorSummary(new Error('falhou')), 'falhou');
  assert.equal(safeErrorSummary('texto solto'), 'texto solto');
  assert.equal(safeErrorSummary(undefined), 'undefined');
});

test('redactSecrets mascara key e access_token em qualquer posição da query', () => {
  assert.equal(
    redactSecrets(`https://graph.facebook.com/v19.0/ads_archive?access_token=EAAB123&search_terms=x`),
    'https://graph.facebook.com/v19.0/ads_archive?access_token=[REDACTED]&search_terms=x',
  );
  assert.equal(redactSecrets(`?key=${KEY}`), '?key=[REDACTED]');
  assert.equal(redactSecrets('Erro na API do YouTube: API key not valid.'), 'Erro na API do YouTube: API key not valid.');
});
