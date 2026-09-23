import { test } from 'node:test';
import assert from 'node:assert/strict';

// Sem chave do Gemini, a chamada de IA falha: o teste verifica a validação e a mensagem de erro
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;

const { transcribeShort } = require('@/ai/flows/transcribe-short') as typeof import('@/ai/flows/transcribe-short');

test('id de vídeo inválido é recusado', async () => {
  const result = await transcribeShort({ videoId: 'abc&x=1' });

  assert.equal(result.error, 'Id de vídeo inválido.');
  assert.equal(result.transcript, undefined);
});

test('falha do Gemini vira mensagem', async () => {
  const result = await transcribeShort({ videoId: 'aqz-KE-bpKQ' });

  assert.match(result.error || '', /Gemini/);
  assert.equal(result.transcript, undefined);
});
