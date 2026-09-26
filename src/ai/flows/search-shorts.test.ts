import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

// Os testes não chamam o Gemini: sem chave, a tradução falha e o tema original é usado
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;

type VideoFixture = { duration: string; width?: number; height?: number; channelId: string; views: string; audio?: string };

const calls: { method: string; params: any }[] = [];
let searchIds: string[] = [];
let videoFixtures: Record<string, VideoFixture> = {};
let subscriberFixtures: Record<string, string> = {};
let channelCountryFixtures: Record<string, string> = {};
let searchError: unknown = null;

// YouTube Data API simulada (substitui o módulo do googleapis antes de carregar o fluxo)
const fakeYoutubeModule = {
  youtube: () => ({
    search: {
      list: async (params: any) => {
        calls.push({ method: 'search', params });
        if (searchError) throw searchError;
        return { data: { items: searchIds.map(id => ({ id: { videoId: id } })), nextPageToken: 'NEXT' } };
      },
    },
    videos: {
      list: async (params: any) => {
        calls.push({ method: 'videos', params });
        return {
          data: {
            items: params.id.map((id: string) => {
              const fixture = videoFixtures[id];
              return {
                id,
                snippet: {
                  title: `Título ${id}`,
                  channelId: fixture.channelId,
                  channelTitle: 'Canal',
                  publishedAt: '2026-09-21T12:00:00Z',
                  defaultAudioLanguage: fixture.audio,
                  thumbnails: { high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } },
                },
                contentDetails: { duration: fixture.duration },
                statistics: { viewCount: fixture.views, likeCount: '10', commentCount: '5' },
                player: fixture.width ? { embedWidth: String(fixture.width), embedHeight: String(fixture.height) } : {},
              };
            }),
          },
        };
      },
    },
    channels: {
      list: async (params: any) => {
        calls.push({ method: 'channels', params });
        return {
          data: {
            items: params.id.map((id: string) => ({
              id,
              snippet: { country: channelCountryFixtures[id] },
              statistics: { subscriberCount: subscriberFixtures[id] ?? '0', viewCount: '0', videoCount: '0' },
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

const { searchShorts } = require('@/ai/flows/search-shorts') as typeof import('@/ai/flows/search-shorts');

const BASE = {
  apiKey: 'x',
  country: 'BR',
  order: 'viewCount' as const,
  publishedAfter: '2026-09-15T00:00:00Z',
};

beforeEach(() => {
  calls.length = 0;
  searchIds = [];
  videoFixtures = {};
  subscriberFixtures = {};
  channelCountryFixtures = {};
  searchError = null;
});

test('sem tema usa os termos locais e mantém só Shorts verticais de até 3 min', async () => {
  searchIds = ['vertical', 'horizontal', 'longo', 'semProporcao'];
  videoFixtures = {
    vertical: { duration: 'PT45S', width: 360, height: 640, channelId: 'c1', views: '100000' },
    horizontal: { duration: 'PT2M', width: 640, height: 360, channelId: 'c1', views: '5000' },
    longo: { duration: 'PT3M30S', width: 360, height: 640, channelId: 'c1', views: '5000' },
    semProporcao: { duration: 'PT20S', channelId: 'c2', views: '800' },
  };
  subscriberFixtures = { c1: '5000' };

  const result = await searchShorts(BASE);

  assert.equal(result.error, undefined);
  assert.deepEqual(result.shorts?.map(s => s.id), ['vertical', 'semProporcao']);
  assert.equal(result.nextPageToken, 'NEXT');

  const search = calls.find(c => c.method === 'search')!.params;
  assert.equal(search.q, 'dicas|"como fazer"|truque|"você sabia"');
  assert.deepEqual(search.type, ['video']);
  assert.equal(search.videoDuration, 'short');
  assert.equal(search.order, 'viewCount');
  assert.equal(search.regionCode, 'BR');
  assert.equal(search.relevanceLanguage, 'pt');
  assert.equal(search.maxResults, 50);

  const videos = calls.find(c => c.method === 'videos')!.params;
  assert.deepEqual(videos.part, ['snippet', 'contentDetails', 'statistics', 'player']);
  assert.equal(videos.maxHeight, 640);
});

test('calcula as métricas e deixa a viralização nula com inscritos ocultos', async () => {
  searchIds = ['a', 'b'];
  videoFixtures = {
    a: { duration: 'PT30S', width: 360, height: 640, channelId: 'c1', views: '100000' },
    b: { duration: 'PT30S', width: 360, height: 640, channelId: 'c2', views: '800' },
  };
  subscriberFixtures = { c1: '5000' };

  const result = await searchShorts(BASE);
  const byId = Object.fromEntries((result.shorts || []).map(s => [s.id, s]));

  assert.equal(byId.a.viralScore, 20);
  assert.equal(byId.a.subscribers, 5000);
  assert.equal(byId.a.likes, 10);
  assert.equal(byId.a.durationSeconds, 30);
  assert.equal(byId.a.country, 'BR');
  assert.equal(byId.a.thumbnail, 'https://i.ytimg.com/vi/a/hqdefault.jpg');
  assert.equal(byId.b.viralScore, null);
  assert.equal(byId.b.subscribers, null);
});

test('usa o tema como q e repassa ordenação e paginação', async () => {
  const result = await searchShorts({ ...BASE, topic: '  receitas fit ', order: 'date', pageToken: 'P2' });

  const search = calls[0].params;
  assert.equal(search.q, 'receitas fit');
  assert.equal(search.order, 'date');
  assert.equal(search.pageToken, 'P2');
  assert.deepEqual(result.shorts, []);
  assert.equal(calls.filter(c => c.method === 'videos').length, 0);
});

test('sem tema em país de outro idioma usa os termos em inglês quando a tradução falha', async () => {
  await searchShorts({ ...BASE, country: 'JP' });

  const search = calls[0].params;
  assert.equal(search.q, 'tips|"how to"|hack|"did you know"');
  assert.equal(search.relevanceLanguage, 'ja');
  assert.equal(search.regionCode, 'JP');
});

test('cota esgotada vira mensagem clara', async () => {
  searchError = { response: { data: { error: { message: 'quota', errors: [{ reason: 'quotaExceeded' }] } } } };

  const result = await searchShorts(BASE);

  assert.match(result.error || '', /Limite diário de buscas/);
});

test('o log de erro não expõe a chave da API', async (t) => {
  const key = 'AIzaSyFAKE-key_123';
  searchError = {
    message: 'quota',
    config: { url: `https://youtube.googleapis.com/youtube/v3/search?q=x&key=${key}`, params: { key } },
    response: { data: { error: { message: 'quota', errors: [{ reason: 'quotaExceeded' }] } } },
  };
  const logged: unknown[] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => { logged.push(...args); });

  await searchShorts(BASE);

  assert.ok(logged.length > 0);
  assert.ok(!JSON.stringify(logged).includes(key));
});

test('traz o país do canal e o idioma do áudio sem chamada extra', async () => {
  searchIds = ['pt', 'semPais'];
  videoFixtures = {
    pt: { duration: 'PT30S', width: 360, height: 640, channelId: 'c1', views: '1000', audio: 'pt-PT' },
    semPais: { duration: 'PT30S', width: 360, height: 640, channelId: 'c2', views: '1000' },
  };
  subscriberFixtures = { c1: '100', c2: '100' };
  channelCountryFixtures = { c1: 'PT' };

  const result = await searchShorts({ ...BASE, country: 'PT' });
  const byId = Object.fromEntries((result.shorts || []).map(s => [s.id, s]));

  assert.equal(byId.pt.channelCountry, 'PT');
  assert.equal(byId.pt.audioLanguage, 'pt-PT');
  assert.equal(byId.semPais.channelCountry, null);
  assert.equal(byId.semPais.audioLanguage, null);
  const channelCalls = calls.filter(c => c.method === 'channels');
  assert.equal(channelCalls.length, 1);
  assert.deepEqual(channelCalls[0].params.part, ['statistics', 'snippet']);
});
