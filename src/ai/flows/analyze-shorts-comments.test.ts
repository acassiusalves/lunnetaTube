import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

// Sem chave do Gemini, a chamada de IA falha: o teste verifica tudo o que vem antes dela
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;

const commentCalls: any[] = [];
let commentFixtures: Record<string, string[]> = {};

const fakeYoutubeModule = {
  youtube: () => ({
    commentThreads: {
      list: async (params: any) => {
        commentCalls.push(params);
        const texts = commentFixtures[params.videoId] || [];
        return {
          data: {
            items: texts.map(text => ({
              snippet: { topLevelComment: { snippet: { textDisplay: text, likeCount: 3, authorDisplayName: 'Pessoa' } } },
            })),
          },
        };
      },
    },
  }),
};

const youtubeModulePath = require.resolve('googleapis/build/src/apis/youtube');
require.cache[youtubeModulePath] = {
  id: youtubeModulePath,
  filename: youtubeModulePath,
  loaded: true,
  exports: fakeYoutubeModule,
} as any;

const { analyzeShortsComments } = require('@/ai/flows/analyze-shorts-comments') as typeof import('@/ai/flows/analyze-shorts-comments');

beforeEach(() => {
  commentCalls.length = 0;
  commentFixtures = {};
});

test('sem comentários em nenhum Short retorna erro claro, sem chamar o Gemini', async () => {
  const result = await analyzeShortsComments({
    apiKey: 'x',
    videos: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }],
  });

  assert.equal(result.commentsAnalyzed, 0);
  assert.deepEqual(result.videosWithoutComments, ['a', 'b']);
  assert.match(result.error || '', /Nenhum comentário/);
  assert.deepEqual(commentCalls.map(c => c.maxResults), [50, 50]);
});

test('um Short busca 100 comentários; falha do Gemini vira mensagem', async () => {
  commentFixtures = { a: ['Amei', 'Funciona?'] };

  const result = await analyzeShortsComments({ apiKey: 'x', videos: [{ id: 'a', title: 'A' }] });

  assert.equal(commentCalls[0].maxResults, 100);
  assert.equal(commentCalls[0].order, 'relevance');
  assert.equal(result.commentsAnalyzed, 2);
  assert.equal(result.report, undefined);
  assert.match(result.error || '', /Gemini/);
});

test('consolidada ignora o Short sem comentários', async () => {
  commentFixtures = { a: ['Quero saber mais'], b: [] };

  const result = await analyzeShortsComments({
    apiKey: 'x',
    videos: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }],
  });

  assert.equal(result.commentsAnalyzed, 1);
  assert.deepEqual(result.videosWithoutComments, ['b']);
});
