import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractVideoTerms, queryTerms, topTerms } from '@/lib/shorts-terms';

test('extractVideoTerms junta hashtags do título e da descrição com as tags, sem repetir', () => {
  const terms = extractVideoTerms(
    'TRUCO DE MAQUILLAJE #shorts #Maquillaje #beautytips',
    'Sígueme para más #pielmadura #maquillaje',
    ['maquillaje', '  Truco   de maquillaje ', 'shorts', '2026', 'ab'],
  );
  assert.deepEqual(terms, ['maquillaje', 'beautytips', 'pielmadura', 'truco de maquillaje']);
});

test('extractVideoTerms ignora termos genéricos de Shorts e aceita tags ausentes', () => {
  assert.deepEqual(extractVideoTerms('Olha isso #viral #fyp #YouTubeShorts #receita', '', undefined), ['receita']);
});

test('topTerms conta canais diferentes, não vídeos, e exige pelo menos 2 canais', () => {
  const shorts = [
    { channelId: 'c1', terms: ['maquillaje', 'skincare'] },
    { channelId: 'c1', terms: ['maquillaje', 'skincare'] },
    { channelId: 'c1', terms: ['maquillaje', 'skincare'] },
    { channelId: 'c2', terms: ['maquillaje', 'labial'] },
    { channelId: 'c3', terms: ['labial'] },
  ];
  assert.deepEqual(topTerms(shorts), [
    { term: 'maquillaje', channels: 2, videos: 4 },
    { term: 'labial', channels: 2, videos: 2 },
  ]);
});

test('topTerms tira os termos usados na busca e respeita o limite', () => {
  const shorts = ['c1', 'c2', 'c3'].map(channelId => ({ channelId, terms: ['truco', 'consejos', 'cocina', 'receta', 'fácil'] }));
  const result = topTerms(shorts, { exclude: queryTerms('consejos|"cómo hacer"|truco'), limit: 2 });
  assert.deepEqual(result.map(t => t.term), ['cocina', 'fácil']);
});

test('queryTerms separa as alternativas da busca e tira as aspas', () => {
  assert.deepEqual(queryTerms('dicas|"como fazer"|Truque|"você sabia"'), ['dicas', 'como fazer', 'truque', 'você sabia']);
  assert.deepEqual(queryTerms('receitas fit'), ['receitas fit']);
});
