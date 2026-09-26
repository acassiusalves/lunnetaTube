import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeShortMetrics,
  defaultSortFor,
  isFromCountry,
  formatCompactNumber,
  formatTimeAgo,
  isShortVideo,
  sortShorts,
  type ShortVideo,
} from '@/lib/shorts';

const NOW = Date.parse('2026-09-22T12:00:00Z');

function makeShort(id: string, overrides: Partial<ShortVideo>): ShortVideo {
  return {
    id,
    title: id,
    channelId: 'c1',
    channelTitle: 'Canal',
    subscribers: 1,
    thumbnail: '',
    durationSeconds: 30,
    publishedAt: '2026-09-21T12:00:00Z',
    views: 0,
    likes: 0,
    comments: 0,
    country: 'BR',
    channelCountry: null,
    audioLanguage: null,
    terms: [],
    viralScore: null,
    viewsPerDay: 0,
    engagementRate: 0,
    ...overrides,
  };
}

test('isShortVideo: duração de até 3 min e formato vertical', () => {
  assert.equal(isShortVideo('PT45S', 360, 640), true);
  assert.equal(isShortVideo('PT3M', 360, 640), true);
  assert.equal(isShortVideo('PT3M1S', 360, 640), false);
  assert.equal(isShortVideo('PT2M', 640, 360), false);
  assert.equal(isShortVideo('PT30S'), true);
  assert.equal(isShortVideo('P0D', 360, 640), false);
  assert.equal(isShortVideo(undefined), false);
});

test('computeShortMetrics: viralização, velocidade e engajamento', () => {
  const metrics = computeShortMetrics(
    { views: 100_000, likes: 4_000, comments: 1_000, subscribers: 5_000, publishedAt: '2026-09-20T12:00:00Z' },
    NOW,
  );
  assert.equal(metrics.viralScore, 20);
  assert.equal(metrics.viewsPerDay, 50_000);
  assert.equal(metrics.engagementRate, 5);
});

test('computeShortMetrics: inscritos ocultos, likes ocultos e mínimo de 1 hora', () => {
  const metrics = computeShortMetrics(
    { views: 1_000, likes: null, comments: 10, subscribers: null, publishedAt: '2026-09-22T11:30:00Z' },
    NOW,
  );
  assert.equal(metrics.viralScore, null);
  assert.equal(metrics.viewsPerDay, 24_000);
  assert.equal(metrics.engagementRate, 1);

  const zero = computeShortMetrics(
    { views: 0, likes: 0, comments: 0, subscribers: 0, publishedAt: '2026-09-21T12:00:00Z' },
    NOW,
  );
  assert.equal(zero.viralScore, null);
  assert.equal(zero.engagementRate, 0);
});

test('sortShorts: decrescente, nulos por último e sem alterar a lista original', () => {
  const list = [
    makeShort('a', { viralScore: 2 }),
    makeShort('b', { viralScore: null }),
    makeShort('c', { viralScore: 30 }),
  ];
  assert.deepEqual(sortShorts(list, 'viral').map(s => s.id), ['c', 'a', 'b']);
  assert.deepEqual(list.map(s => s.id), ['a', 'b', 'c']);

  const byDate = [
    makeShort('old', { publishedAt: '2026-09-01T00:00:00Z' }),
    makeShort('new', { publishedAt: '2026-09-22T00:00:00Z' }),
  ];
  assert.deepEqual(sortShorts(byDate, 'recent').map(s => s.id), ['new', 'old']);
});

test('defaultSortFor acompanha o "Buscar por"', () => {
  assert.equal(defaultSortFor('date'), 'recent');
  assert.equal(defaultSortFor('viewCount'), 'viral');
  assert.equal(defaultSortFor('relevance'), 'viral');
});

test('formatações em pt-BR', () => {
  assert.equal(formatCompactNumber(950), '950');
  assert.equal(formatCompactNumber(1_500), '1,5 mil');
  assert.equal(formatCompactNumber(2_300_000), '2,3 mi');
  assert.equal(formatTimeAgo('2026-09-22T11:20:00Z', NOW), 'há 40 min');
  assert.equal(formatTimeAgo('2026-09-22T07:00:00Z', NOW), 'há 5 h');
  assert.equal(formatTimeAgo('2026-09-21T10:00:00Z', NOW), 'há 1 dia');
  assert.equal(formatTimeAgo('2026-09-19T12:00:00Z', NOW), 'há 3 dias');
});

test('sortShorts: "comments" ordena por número de comentários', () => {
  const list = [
    makeShort('poucos', { comments: 3 }),
    makeShort('muitos', { comments: 900 }),
    makeShort('medio', { comments: 40 }),
  ];
  assert.deepEqual(sortShorts(list, 'comments').map(s => s.id), ['muitos', 'medio', 'poucos']);
});

test('isFromCountry: país do canal tem prioridade; sem ele, vale a região do áudio', () => {
  assert.equal(isFromCountry(makeShort('a', { channelCountry: 'PT' }), 'PT'), true);
  assert.equal(isFromCountry(makeShort('b', { channelCountry: 'BR', audioLanguage: 'pt-PT' }), 'PT'), false);
  assert.equal(isFromCountry(makeShort('c', { audioLanguage: 'pt-PT' }), 'PT'), true);
  assert.equal(isFromCountry(makeShort('d', { audioLanguage: 'pt-BR' }), 'PT'), false);
  assert.equal(isFromCountry(makeShort('e', { audioLanguage: 'pt' }), 'PT'), false);
  assert.equal(isFromCountry(makeShort('f', { audioLanguage: 'es-419' }), 'MX'), false);
  assert.equal(isFromCountry(makeShort('g', { channelCountry: 'pt' }), 'PT'), true);
  assert.equal(isFromCountry(makeShort('h', {}), 'PT'), false);
});
