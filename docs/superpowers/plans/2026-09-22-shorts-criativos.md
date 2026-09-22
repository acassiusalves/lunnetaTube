# Busca de Shorts para criativos: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a página `/shorts`, que busca Shorts do YouTube por país, tema, período e
ordenação, mostra métricas de escala em uma grade de cards e analisa comentários (de um
Short ou de vários) com o Gemini para gerar insumos de criativos de anúncio.

**Architecture:** Funções puras em `src/lib/shorts.ts` (identificação de Short, métricas,
ordenação, formatação) e `src/lib/shorts-report.ts` (tipos do relatório, prompt e
exportação em texto). Dois fluxos Genkit no servidor (`search-shorts`,
`analyze-shorts-comments`) usam a YouTube Data API e o Gemini. A página e três
componentes em `src/components/shorts/` fazem a interface.

**Tech Stack:** Next.js 15.3.9 (App Router, server actions), Genkit 1.15 +
`@genkit-ai/googleai`, `googleapis` (YouTube Data API v3), shadcn/ui, Tailwind, testes
com `node:test` executados via `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-22-shorts-criativos-design.md`

## Global Constraints

- Todo texto de interface em português do Brasil.
- Nenhuma dependência nova no `package.json` (testes usam `node:test` + `tsx`, que já existe).
- Um Short tem de 1 a 180 segundos (`SHORTS_MAX_SECONDS = 180` em `src/lib/data.ts`).
- Cada busca faz exatamente 1 chamada a `search.list` (limite de 100 por dia).
- Modelos do Gemini vêm de `src/lib/ai-models.ts`; a análise usa o padrão do Genkit (`DEFAULT_MODEL`).
- Arquivos com `'use server'` exportam apenas funções assíncronas (tipos são permitidos; constantes não).
- Imports usam o alias `@/` (`src/`).
- A pasta de trabalho é `/Users/acassiusalves/Documents/GitHub/lunnetaTube/.claude/worktrees/search-home-trends-bug-065b5c`, na branch `claude/shorts-feature`.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/shorts.ts` (novo) | Tipo `ShortVideo`, `isShortVideo`, `computeShortMetrics`, `sortShorts`, `defaultSortFor`, `formatCompactNumber`, `formatTimeAgo` |
| `src/lib/shorts.test.ts` (novo) | Testes das funções acima |
| `src/lib/shorts-report.ts` (novo) | Tipos do relatório, `buildCommentsPrompt`, `formatReportMarkdown`, `analysisKey` |
| `src/lib/shorts-report.test.ts` (novo) | Testes das funções acima |
| `src/ai/flows/search-shorts.ts` (novo) | Fluxo `searchShorts` |
| `src/ai/flows/search-shorts.test.ts` (novo) | Testes com a YouTube API simulada |
| `src/ai/flows/analyze-shorts-comments.ts` (novo) | Fluxo `analyzeShortsComments` |
| `src/ai/flows/analyze-shorts-comments.test.ts` (novo) | Testes com a YouTube API simulada |
| `src/components/shorts/ShortCard.tsx` (novo) | Card vertical com métricas |
| `src/components/shorts/ShortPlayerDialog.tsx` (novo) | Player do Short em diálogo |
| `src/components/shorts/CommentInsightsPanel.tsx` (novo) | Painel lateral com o relatório |
| `src/app/shorts/page.tsx` (novo) | Página: filtros, grade, seleção, análises |
| `src/components/youtube/Sidebar.tsx` (modificar) | Entrada "Shorts" no menu |
| `src/middleware.ts` (modificar) | Rota `/shorts` protegida |
| `package.json` (modificar) | Script `test` |

---

### Task 1: Validar as premissas da API no APIs Explorer

Esta tarefa não altera código. Ela confirma duas suposições do spec. **Clicar em
"Execute" no APIs Explorer implica aceitar os Termos do Google APIs Explorer: peça
autorização ao usuário antes.**

- [ ] **Step 1: Pedir autorização ao usuário** para executar chamadas no APIs Explorer oficial.

- [ ] **Step 2: Testar `#shorts` como termo padrão.** Abra no navegador (troque a data para 7 dias atrás):

```
https://developers.google.com/youtube/v3/docs/search/list?hl=en&apix=true&apix_params=%7B%22part%22%3A%5B%22snippet%22%5D%2C%22q%22%3A%22%23shorts%22%2C%22type%22%3A%5B%22video%22%5D%2C%22videoDuration%22%3A%22short%22%2C%22regionCode%22%3A%22BR%22%2C%22relevanceLanguage%22%3A%22pt%22%2C%22order%22%3A%22viewCount%22%2C%22publishedAfter%22%3A%222026-09-15T00%3A00%3A00Z%22%2C%22maxResults%22%3A10%7D
```

Abra o painel "API" à direita, clique em "Try it!", desmarque "Google OAuth 2.0", mantenha "API key" e clique em "Execute".
Esperado: `200` com `pageInfo.totalResults > 0` e itens em `items`. Anote 2 ids de `items[].id.videoId`.

- [ ] **Step 3: Testar a proporção do player.** Abra (troque `ID1,ID2` pelos ids anotados):

```
https://developers.google.com/youtube/v3/docs/videos/list?hl=en&apix=true&apix_params=%7B%22part%22%3A%5B%22player%22%2C%22contentDetails%22%5D%2C%22id%22%3A%5B%22ID1%22%2C%22ID2%22%5D%2C%22maxHeight%22%3A640%7D
```

Execute da mesma forma. Esperado: cada item traz `player.embedWidth` e `player.embedHeight`, com altura maior que a largura nos Shorts.

> **Resultado (executado em 2026-09-22):** `#shorts` retornou 1.000.000 de resultados, mas globais e em inglês
> (ex.: animações de Roblox), mesmo com `regionCode=BR` e `relevanceLanguage=pt`. Termos locais
> (`dicas|"como fazer"|truque|"você sabia"`) retornaram 859.006 resultados em português do Brasil. Decisão do
> usuário: sem tema, usar termos locais (Task 4). O teste do `videos.list` voltou 403 por cota esgotada da
> chave compartilhada do APIs Explorer; o código mantém o plano B (decidir só pela duração quando a proporção
> não vier).

- [ ] **Step 4: Registrar a decisão.**
  - Se o Step 2 falhar (0 resultados), use `'shorts'` no lugar de `'#shorts'` em `DEFAULT_SHORTS_QUERY` (Task 4) e repita o Step 2 com `q=shorts`.
  - Se o Step 3 não trouxer `embedWidth`/`embedHeight`, mantenha o código da Task 4 como está: `isShortVideo` já decide só pela duração quando a proporção não vem.
  - Anote o resultado no relatório final da execução.

---

### Task 2: Funções puras de Shorts (`src/lib/shorts.ts`)

**Files:**
- Create: `src/lib/shorts.ts`
- Create: `src/lib/shorts.test.ts`
- Modify: `package.json` (bloco `scripts`)

**Interfaces:**
- Consumes: `parseDurationSeconds(duration?: string | null): number` e `SHORTS_MAX_SECONDS` de `src/lib/data.ts`.
- Produces:
  - `type ShortsSearchOrder = 'viewCount' | 'date' | 'relevance'`
  - `type ShortsSortKey = 'viral' | 'velocity' | 'views' | 'engagement' | 'recent'`
  - `interface ShortVideo { id; title; channelId; channelTitle; subscribers: number | null; thumbnail; durationSeconds; publishedAt; views; likes: number | null; comments; country; viralScore: number | null; viewsPerDay; engagementRate }`
  - `const VIRAL_HIGHLIGHT = 10`
  - `isShortVideo(duration?: string | null, embedWidth?: number | null, embedHeight?: number | null): boolean`
  - `computeShortMetrics(input: ShortMetricsInput, now?: number): { viralScore: number | null; viewsPerDay: number; engagementRate: number }`
  - `sortShorts(shorts: ShortVideo[], key: ShortsSortKey): ShortVideo[]`
  - `defaultSortFor(order: ShortsSearchOrder): ShortsSortKey`
  - `formatCompactNumber(value: number): string`
  - `formatTimeAgo(iso: string, now?: number): string`

- [ ] **Step 1: Adicionar o script de testes** em `package.json`, dentro de `"scripts"`, depois de `"typecheck"`:

```json
    "typecheck": "tsc --noEmit",
    "test": "tsx --test \"src/**/*.test.ts\""
```

- [ ] **Step 2: Escrever o teste que falha** em `src/lib/shorts.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeShortMetrics,
  defaultSortFor,
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
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npx tsx --test src/lib/shorts.test.ts`
Expected: FAIL, com erro de módulo não encontrado para `@/lib/shorts`.

- [ ] **Step 4: Implementar** `src/lib/shorts.ts`:

```ts
/**
 * Regras da busca de Shorts: identificação do formato, métricas de escala,
 * ordenação e formatação. Funções puras, usadas no servidor e na página /shorts.
 */

import { parseDurationSeconds, SHORTS_MAX_SECONDS } from '@/lib/data';

export type ShortsSearchOrder = 'viewCount' | 'date' | 'relevance';
export type ShortsSortKey = 'viral' | 'velocity' | 'views' | 'engagement' | 'recent';

export interface ShortVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  subscribers: number | null;   // null quando o canal oculta os inscritos
  thumbnail: string;
  durationSeconds: number;
  publishedAt: string;          // ISO 8601
  views: number;
  likes: number | null;         // null quando o vídeo oculta os likes
  comments: number;
  country: string;              // código ISO do país da busca
  viralScore: number | null;    // views ÷ inscritos
  viewsPerDay: number;
  engagementRate: number;       // (likes + comentários) ÷ views, em %
}

// A partir deste índice de viralização o card ganha destaque
export const VIRAL_HIGHLIGHT = 10;

// Short = até 3 minutos e vertical. Se a proporção não vier da API, decide só pela duração
export function isShortVideo(
  duration?: string | null,
  embedWidth?: number | null,
  embedHeight?: number | null,
): boolean {
  const seconds = parseDurationSeconds(duration);
  if (seconds <= 0 || seconds > SHORTS_MAX_SECONDS) return false;
  if (embedWidth && embedHeight) return embedHeight > embedWidth;
  return true;
}

export interface ShortMetricsInput {
  views: number;
  likes: number | null;
  comments: number;
  subscribers: number | null;
  publishedAt: string;
}

export function computeShortMetrics(input: ShortMetricsInput, now: number = Date.now()) {
  // Em horas, com mínimo de 1, para não distorcer Shorts publicados há minutos
  const hours = Math.max(1, (now - Date.parse(input.publishedAt)) / 3_600_000);
  return {
    viralScore: input.subscribers && input.subscribers > 0 ? input.views / input.subscribers : null,
    viewsPerDay: (input.views / hours) * 24,
    engagementRate: input.views > 0 ? (((input.likes ?? 0) + input.comments) / input.views) * 100 : 0,
  };
}

function sortValue(short: ShortVideo, key: ShortsSortKey): number | null {
  switch (key) {
    case 'viral':
      return short.viralScore;
    case 'velocity':
      return short.viewsPerDay;
    case 'views':
      return short.views;
    case 'engagement':
      return short.engagementRate;
    case 'recent':
      return Date.parse(short.publishedAt);
  }
}

// Ordem decrescente; valores nulos (ex.: inscritos ocultos) ficam por último
export function sortShorts(shorts: ShortVideo[], key: ShortsSortKey): ShortVideo[] {
  return [...shorts].sort((a, b) => {
    const va = sortValue(a, key);
    const vb = sortValue(b, key);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return vb - va;
  });
}

// Ordenação inicial da grade conforme o "Buscar por"
export function defaultSortFor(order: ShortsSearchOrder): ShortsSortKey {
  return order === 'date' ? 'recent' : 'viral';
}

const compactFormatter = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

export function formatTimeAgo(iso: string, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'há 1 dia' : `há ${days} dias`;
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx tsx --test src/lib/shorts.test.ts`
Expected: `# pass 6` e `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/shorts.ts src/lib/shorts.test.ts
git commit -m "feat(shorts): métricas, identificação e ordenação de Shorts"
```

---

### Task 3: Relatório de comentários (`src/lib/shorts-report.ts`)

**Files:**
- Create: `src/lib/shorts-report.ts`
- Create: `src/lib/shorts-report.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `interface PainOrDesire { insight: string; frequency: 'alta' | 'média' | 'baixa'; videoIds: string[] }`
  - `interface AudienceQuote { quote: string; translation?: string; videoId: string }`
  - `interface AdAngle { hook: string; angle: string; rationale: string; basedOnQuote: string; videoIds: string[] }`
  - `interface ShortsCommentsReport { painsAndDesires: PainOrDesire[]; audienceLanguage: AudienceQuote[]; adAngles: AdAngle[] }`
  - `interface VideoComments { id: string; title: string; comments: { text: string; likeCount?: number }[] }`
  - `const MAX_COMMENT_CHARS = 500`
  - `buildCommentsPrompt(videos: VideoComments[]): string`
  - `formatReportMarkdown(report: ShortsCommentsReport, titles: Record<string, string>): string`
  - `analysisKey(videoIds: string[]): string`

- [ ] **Step 1: Escrever o teste que falha** em `src/lib/shorts-report.test.ts`:

```ts
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
    '- "Funciona mesmo?"',
    '- "Me encanta" (Eu adoro)',
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx tsx --test src/lib/shorts-report.test.ts`
Expected: FAIL, com erro de módulo não encontrado para `@/lib/shorts-report`.

- [ ] **Step 3: Implementar** `src/lib/shorts-report.ts`:

```ts
/**
 * Relatório de comentários de Shorts para criativos de anúncio: tipos, prompt
 * enviado ao Gemini e exportação em texto. Sem dependências de servidor.
 */

export interface PainOrDesire {
  insight: string;
  frequency: 'alta' | 'média' | 'baixa';
  videoIds: string[];
}

export interface AudienceQuote {
  quote: string;          // literal, no idioma original
  translation?: string;   // pt-BR, quando o original não está em português
  videoId: string;
}

export interface AdAngle {
  hook: string;           // primeira frase do criativo
  angle: string;
  rationale: string;
  basedOnQuote: string;
  videoIds: string[];
}

export interface ShortsCommentsReport {
  painsAndDesires: PainOrDesire[];
  audienceLanguage: AudienceQuote[];
  adAngles: AdAngle[];
}

export interface VideoComments {
  id: string;
  title: string;
  comments: { text: string; likeCount?: number }[];
}

// Limite por comentário, para manter o prompt enxuto
export const MAX_COMMENT_CHARS = 500;

export function buildCommentsPrompt(videos: VideoComments[]): string {
  const blocks = videos.map(video => {
    const lines = video.comments.map(comment => {
      const text = comment.text.replace(/\s+/g, ' ').trim().slice(0, MAX_COMMENT_CHARS);
      return `- ${text}${comment.likeCount ? ` (${comment.likeCount} likes)` : ''}`;
    });
    return `### Short ${video.id}: ${video.title}\n${lines.join('\n')}`;
  });

  return `Você é estrategista de criativos de anúncios para Facebook e Instagram.
Abaixo estão comentários de Shorts do YouTube que performaram bem. Analise-os para gerar insumos de criativos.

Responda em português do Brasil, exceto as citações literais, que ficam no idioma original.
Use apenas o que aparece nos comentários; não invente fatos.

Entregue:
1. painsAndDesires: dores e desejos do público. Em cada item, "frequency" = "alta", "média" ou "baixa" conforme quantos comentários tocam no ponto, e "videoIds" com os ids dos Shorts de origem.
2. audienceLanguage: de 8 a 15 frases literais dos comentários que soem naturais em uma copy. Se a frase não estiver em português, preencha "translation" com a tradução para português do Brasil. "videoId" = id do Short de origem.
3. adAngles: de 5 a 8 ângulos de anúncio, cada um com "hook" (primeira frase do criativo, até 15 palavras), "angle" (o ângulo em uma frase), "rationale" (por que deve funcionar, citando o padrão dos comentários), "basedOnQuote" (o comentário literal que inspirou) e "videoIds".

Comentários:

${blocks.join('\n\n')}`;
}

export function formatReportMarkdown(report: ShortsCommentsReport, titles: Record<string, string>): string {
  const sources = (ids: string[]) => ids.map(id => titles[id] || id).join(', ');
  const lines: string[] = ['# Análise de comentários para criativos', '', '## Dores e desejos'];

  report.painsAndDesires.forEach(item => {
    lines.push(`- ${item.insight} (frequência ${item.frequency}; ${sources(item.videoIds)})`);
  });

  lines.push('', '## Linguagem do público');
  report.audienceLanguage.forEach(item => {
    lines.push(`- "${item.quote}"${item.translation ? ` (${item.translation})` : ''}`);
  });

  lines.push('', '## Ângulos de anúncio');
  report.adAngles.forEach((item, index) => {
    lines.push(
      `${index + 1}. **${item.hook}**`,
      `   - Ângulo: ${item.angle}`,
      `   - Por que funciona: ${item.rationale}`,
      `   - Baseado em: "${item.basedOnQuote}"`,
      `   - Shorts: ${sources(item.videoIds)}`,
    );
  });

  return lines.join('\n');
}

// Chave do cache de análises: mesma seleção, em qualquer ordem, reaproveita o resultado
export function analysisKey(videoIds: string[]): string {
  return [...videoIds].sort().join(',');
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx tsx --test src/lib/shorts-report.test.ts`
Expected: `# pass 3` e `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shorts-report.ts src/lib/shorts-report.test.ts
git commit -m "feat(shorts): prompt e exportação do relatório de comentários"
```

---

### Task 4: Fluxo de busca `searchShorts`

**Files:**
- Create: `src/ai/flows/search-shorts.ts`
- Create: `src/ai/flows/search-shorts.test.ts`

**Interfaces:**
- Consumes:
  - `isShortVideo`, `computeShortMetrics`, `ShortVideo`, `ShortsSearchOrder` (Task 2)
  - `getCountryByCode`, `getLanguageName`, `getRelevanceLanguage` de `src/lib/countries.ts`
  - `parseDurationSeconds` de `src/lib/data.ts`
  - `translateKeyword({ text, targetLanguage }): Promise<{ translatedText: string }>` de `src/ai/flows/translate-keyword.ts` (sem `GEMINI_API_KEY`, lança erro: o fluxo mantém o texto original)
  - `fetchChannelStats({ channelIds, apiKey }): Promise<{ channelStats: Record<string, { subscriberCount: number }>; error?: string }>` de `src/ai/flows/fetch-channel-stats.ts` (retorna `subscriberCount = 0` quando oculto)
- Produces:
  - `searchShorts(input: SearchShortsInput): Promise<SearchShortsOutput>`
  - `type SearchShortsInput = { apiKey: string; country: string; topic?: string; order: ShortsSearchOrder; publishedAfter: string; pageToken?: string }`
  - `type SearchShortsOutput = { shorts?: ShortVideo[]; nextPageToken?: string; error?: string }`

- [ ] **Step 1: Escrever o teste que falha** em `src/ai/flows/search-shorts.test.ts`:

```ts
import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

// Os testes não chamam o Gemini: sem chave, a tradução falha e o tema original é usado
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;

type VideoFixture = { duration: string; width?: number; height?: number; channelId: string; views: string };

const calls: { method: string; params: any }[] = [];
let searchIds: string[] = [];
let videoFixtures: Record<string, VideoFixture> = {};
let subscriberFixtures: Record<string, string> = {};
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx tsx --test src/ai/flows/search-shorts.test.ts`
Expected: FAIL, com erro de módulo não encontrado para `@/ai/flows/search-shorts`.

- [ ] **Step 3: Implementar** `src/ai/flows/search-shorts.ts`:

```ts
'use server';

/**
 * @fileOverview Busca de Shorts para inspiração de criativos de anúncio.
 *
 * - searchShorts - Busca Shorts por país, tema, período e ordenação, com métricas de escala.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { youtube } from 'googleapis/build/src/apis/youtube';
import { translateKeyword } from './translate-keyword';
import { fetchChannelStats } from './fetch-channel-stats';
import { getCountryByCode, getLanguageName, getRelevanceLanguage } from '@/lib/countries';
import { parseDurationSeconds } from '@/lib/data';
import { computeShortMetrics, isShortVideo, type ShortVideo } from '@/lib/shorts';

// search.list não retorna nada sem q, e "#shorts" traz Shorts globais em inglês mesmo com
// regionCode e relevanceLanguage (testado no APIs Explorer em 2026-09-22). Sem tema, usamos
// termos locais de formatos parecidos com criativos: dicas, tutoriais, truques e curiosidades
const DEFAULT_SHORTS_TERMS: Record<string, string> = {
  pt: 'dicas|"como fazer"|truque|"você sabia"',
  es: 'consejos|"cómo hacer"|truco|"sabías que"',
  en: 'tips|"how to"|hack|"did you know"',
};

// Traduz para o idioma do país; se o Gemini falhar, mantém o texto original
async function translateOrKeep(text: string, targetLanguage: string, country: string): Promise<string> {
  try {
    const translation = await translateKeyword({ text, targetLanguage });
    return translation.translatedText;
  } catch (e) {
    console.warn(`[searchShorts] Falha ao traduzir para ${country}. Usando o texto original.`, e);
    return text;
  }
}

const SearchShortsInputSchema = z.object({
  apiKey: z.string().describe('The YouTube Data API v3 key.'),
  country: z.string().describe('Código ISO do país (BR, PT, US...).'),
  topic: z.string().optional().describe('Tema opcional, traduzido para o idioma do país.'),
  order: z.enum(['viewCount', 'date', 'relevance']),
  publishedAfter: z.string().describe('RFC 3339 - início do período.'),
  pageToken: z.string().optional(),
});
export type SearchShortsInput = z.infer<typeof SearchShortsInputSchema>;

const SearchShortsOutputSchema = z.object({
  shorts: z.array(z.any()).optional(),
  nextPageToken: z.string().optional(),
  error: z.string().optional(),
});
export type SearchShortsOutput = { shorts?: ShortVideo[]; nextPageToken?: string; error?: string };

export async function searchShorts(input: SearchShortsInput): Promise<SearchShortsOutput> {
  return searchShortsFlow(input) as Promise<SearchShortsOutput>;
}

const searchShortsFlow = ai.defineFlow(
  {
    name: 'searchShortsFlow',
    inputSchema: SearchShortsInputSchema,
    outputSchema: SearchShortsOutputSchema,
  },
  async (input) => {
    const youtubeApi = youtube({ version: 'v3', auth: input.apiKey });

    try {
      const country = input.country.toUpperCase();
      const countryInfo = getCountryByCode(country);
      const relevanceLanguage = getRelevanceLanguage(country);
      // Países de língua portuguesa não precisam de tradução
      const translateTo = countryInfo && !countryInfo.lang.startsWith('pt') ? getLanguageName(countryInfo.lang) : undefined;

      let q = (input.topic || '').trim();
      if (q) {
        if (translateTo) q = await translateOrKeep(q, translateTo, country);
      } else {
        const localTerms = DEFAULT_SHORTS_TERMS[relevanceLanguage || 'pt'];
        q = localTerms || DEFAULT_SHORTS_TERMS.en;
        if (!localTerms && translateTo) q = await translateOrKeep(DEFAULT_SHORTS_TERMS.en, translateTo, country);
      }

      const searchResponse = await youtubeApi.search.list({
        part: ['snippet'],
        q,
        type: ['video'],
        videoDuration: 'short', // menos de 4 minutos
        regionCode: country,
        relevanceLanguage,
        publishedAfter: input.publishedAfter,
        order: input.order,
        maxResults: 50,
        pageToken: input.pageToken,
      });

      const nextPageToken = searchResponse.data.nextPageToken || undefined;
      const ids = [...new Set(
        (searchResponse.data.items || []).map(item => item.id?.videoId).filter((id): id is string => !!id),
      )];
      if (ids.length === 0) return { shorts: [], nextPageToken };

      // part=player com maxHeight devolve embedWidth/embedHeight: indicam se o vídeo é vertical
      const detailRequests = [];
      for (let i = 0; i < ids.length; i += 50) {
        detailRequests.push(youtubeApi.videos.list({
          part: ['snippet', 'contentDetails', 'statistics', 'player'],
          id: ids.slice(i, i + 50),
          maxHeight: 640,
        }));
      }
      const details = (await Promise.all(detailRequests)).flatMap(response => response.data.items || []);

      const verticalShorts = details.filter(video => isShortVideo(
        video.contentDetails?.duration,
        video.player?.embedWidth ? Number(video.player.embedWidth) : null,
        video.player?.embedHeight ? Number(video.player.embedHeight) : null,
      ));
      if (verticalShorts.length === 0) return { shorts: [], nextPageToken };

      const channelIds = [...new Set(
        verticalShorts.map(video => video.snippet?.channelId).filter((id): id is string => !!id),
      )];
      const { channelStats } = await fetchChannelStats({ channelIds, apiKey: input.apiKey });

      const shorts: ShortVideo[] = verticalShorts.map(video => {
        // fetchChannelStats devolve 0 quando o canal oculta os inscritos
        const subscriberCount = channelStats[video.snippet?.channelId || '']?.subscriberCount;
        const base = {
          views: parseInt(video.statistics?.viewCount || '0', 10),
          likes: video.statistics?.likeCount != null ? parseInt(video.statistics.likeCount, 10) : null,
          comments: parseInt(video.statistics?.commentCount || '0', 10),
          subscribers: subscriberCount ? subscriberCount : null,
          publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
        };
        return {
          id: video.id!,
          title: video.snippet?.title || '',
          channelId: video.snippet?.channelId || '',
          channelTitle: video.snippet?.channelTitle || '',
          thumbnail: video.snippet?.thumbnails?.high?.url
            || video.snippet?.thumbnails?.medium?.url
            || video.snippet?.thumbnails?.default?.url
            || '',
          durationSeconds: parseDurationSeconds(video.contentDetails?.duration),
          country,
          ...base,
          ...computeShortMetrics(base),
        };
      });

      return { shorts, nextPageToken };
    } catch (e: any) {
      console.error('[searchShorts] Erro:', e);
      const reasons: string[] = e.response?.data?.error?.errors?.map((err: any) => err.reason) || [];
      if (reasons.includes('quotaExceeded')) {
        return { error: 'Limite diário de buscas do YouTube atingido. Ele renova à meia-noite no horário do Pacífico (4h ou 5h em Brasília).' };
      }
      const message = e.response?.data?.error?.message || e.message || 'Erro desconhecido na API do YouTube.';
      return { error: `Erro na API do YouTube: ${message}` };
    }
  }
);
```


- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx tsx --test src/ai/flows/search-shorts.test.ts`
Expected: `# pass 5` e `# fail 0`. Logs no console são esperados nos testes de cota e de tradução.

- [ ] **Step 5: Typecheck do arquivo novo**

Run: `npx tsc --noEmit 2>&1 | grep -E "search-shorts|lib/shorts"`
Expected: nenhuma saída.

- [ ] **Step 6: Commit**

```bash
git add src/ai/flows/search-shorts.ts src/ai/flows/search-shorts.test.ts
git commit -m "feat(shorts): fluxo de busca de Shorts com métricas de escala"
```

---

### Task 5: Fluxo de análise `analyzeShortsComments`

**Files:**
- Create: `src/ai/flows/analyze-shorts-comments.ts`
- Create: `src/ai/flows/analyze-shorts-comments.test.ts`

**Interfaces:**
- Consumes:
  - `buildCommentsPrompt`, `ShortsCommentsReport`, `VideoComments` (Task 3)
  - `fetchTopComments({ apiKey, videoId, maxResults }): Promise<{ comments?: { text: string; likeCount?: number }[]; error?: string }>` de `src/ai/flows/fetch-comments.ts`. Com comentários desativados, retorna `error` contendo "desabilitados" e `comments: []`.
- Produces:
  - `analyzeShortsComments(input: AnalyzeShortsCommentsInput): Promise<AnalyzeShortsCommentsOutput>`
  - `type AnalyzeShortsCommentsInput = { apiKey: string; videos: { id: string; title: string }[] }` (de 1 a 10 vídeos)
  - `type AnalyzeShortsCommentsOutput = { report?: ShortsCommentsReport; commentsAnalyzed: number; videosWithoutComments: string[]; error?: string }`

- [ ] **Step 1: Escrever o teste que falha** em `src/ai/flows/analyze-shorts-comments.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx tsx --test src/ai/flows/analyze-shorts-comments.test.ts`
Expected: FAIL, com erro de módulo não encontrado para `@/ai/flows/analyze-shorts-comments`.

- [ ] **Step 3: Implementar** `src/ai/flows/analyze-shorts-comments.ts`:

```ts
'use server';

/**
 * @fileOverview Análise dos comentários de 1 a 10 Shorts para criativos de anúncio.
 *
 * - analyzeShortsComments - Busca os comentários mais relevantes e gera o relatório no Gemini.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchTopComments } from './fetch-comments';
import { buildCommentsPrompt, type ShortsCommentsReport, type VideoComments } from '@/lib/shorts-report';

const ReportSchema = z.object({
  painsAndDesires: z.array(z.object({
    insight: z.string(),
    frequency: z.enum(['alta', 'média', 'baixa']),
    videoIds: z.array(z.string()),
  })),
  audienceLanguage: z.array(z.object({
    quote: z.string(),
    translation: z.string().optional(),
    videoId: z.string(),
  })),
  adAngles: z.array(z.object({
    hook: z.string(),
    angle: z.string(),
    rationale: z.string(),
    basedOnQuote: z.string(),
    videoIds: z.array(z.string()),
  })),
});

const AnalyzeShortsCommentsInputSchema = z.object({
  apiKey: z.string().describe('The YouTube Data API v3 key.'),
  videos: z.array(z.object({ id: z.string(), title: z.string() })).min(1).max(10),
});
export type AnalyzeShortsCommentsInput = z.infer<typeof AnalyzeShortsCommentsInputSchema>;

const AnalyzeShortsCommentsOutputSchema = z.object({
  report: ReportSchema.optional(),
  commentsAnalyzed: z.number(),
  videosWithoutComments: z.array(z.string()),
  error: z.string().optional(),
});
export type AnalyzeShortsCommentsOutput = {
  report?: ShortsCommentsReport;
  commentsAnalyzed: number;
  videosWithoutComments: string[];
  error?: string;
};

export async function analyzeShortsComments(input: AnalyzeShortsCommentsInput): Promise<AnalyzeShortsCommentsOutput> {
  return analyzeShortsCommentsFlow(input);
}

const analyzeShortsCommentsFlow = ai.defineFlow(
  {
    name: 'analyzeShortsCommentsFlow',
    inputSchema: AnalyzeShortsCommentsInputSchema,
    outputSchema: AnalyzeShortsCommentsOutputSchema,
  },
  async ({ apiKey, videos }) => {
    // 100 comentários para um Short; 50 por Short na análise consolidada
    const perVideo = videos.length === 1 ? 100 : 50;
    const results = await Promise.all(
      videos.map(video => fetchTopComments({ apiKey, videoId: video.id, maxResults: perVideo })),
    );

    const withComments: VideoComments[] = [];
    const videosWithoutComments: string[] = [];
    videos.forEach((video, index) => {
      const comments = (results[index].comments || []) as { text: string; likeCount?: number }[];
      if (comments.length === 0) videosWithoutComments.push(video.id);
      else withComments.push({ ...video, comments });
    });

    const commentsAnalyzed = withComments.reduce((sum, video) => sum + video.comments.length, 0);
    if (commentsAnalyzed === 0) {
      // Erro da API (ex.: chave inválida) tem prioridade sobre "comentários desativados"
      const apiError = results.find(result => result.error && !result.error.includes('desabilitados'))?.error;
      return {
        commentsAnalyzed,
        videosWithoutComments,
        error: apiError || 'Nenhum comentário disponível nos Shorts selecionados (podem estar desativados).',
      };
    }

    try {
      const { output } = await ai.generate({
        prompt: buildCommentsPrompt(withComments),
        output: { schema: ReportSchema, format: 'json' },
        config: { temperature: 0.4 },
      });
      if (!output) throw new Error('resposta vazia');
      return { report: output, commentsAnalyzed, videosWithoutComments };
    } catch (e: any) {
      console.error('[analyzeShortsComments] Erro no Gemini:', e);
      return {
        commentsAnalyzed,
        videosWithoutComments,
        error: `Não foi possível gerar a análise com o Gemini (${e.message || 'erro desconhecido'}). Confira se a GEMINI_API_KEY está configurada.`,
      };
    }
  }
);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx tsx --test src/ai/flows/analyze-shorts-comments.test.ts`
Expected: `# pass 3` e `# fail 0`. Logs do `fetchTopComments` e do Gemini no console são esperados.

- [ ] **Step 5: Typecheck do arquivo novo**

Run: `npx tsc --noEmit 2>&1 | grep -E "analyze-shorts-comments|shorts-report"`
Expected: nenhuma saída.

- [ ] **Step 6: Commit**

```bash
git add src/ai/flows/analyze-shorts-comments.ts src/ai/flows/analyze-shorts-comments.test.ts
git commit -m "feat(shorts): análise de comentários para criativos com o Gemini"
```

---

### Task 6: Componentes da interface

**Files:**
- Create: `src/components/shorts/ShortCard.tsx`
- Create: `src/components/shorts/ShortPlayerDialog.tsx`
- Create: `src/components/shorts/CommentInsightsPanel.tsx`

**Interfaces:**
- Consumes: `ShortVideo`, `VIRAL_HIGHLIGHT`, `formatCompactNumber`, `formatTimeAgo` (Task 2); `ShortsCommentsReport`, `formatReportMarkdown` (Task 3); shadcn `Checkbox`, `Button`, `Badge`, `Dialog*`, `Sheet*`; `useToast` de `@/hooks/use-toast`; `cn` de `@/lib/utils`.
- Produces:
  - `ShortCard(props: { short: ShortVideo; selected: boolean; selectDisabled: boolean; analyzing: boolean; onToggleSelect(): void; onPlay(): void; onAnalyze(): void })`
  - `ShortPlayerDialog(props: { short: ShortVideo | null; onClose(): void })`
  - `type AnalysisState` (abaixo) e `CommentInsightsPanel(props: { analysis: AnalysisState | null; titles: Record<string, string>; onOpenChange(open: boolean): void })`

- [ ] **Step 1: Criar** `src/components/shorts/ShortCard.tsx`:

```tsx
'use client';

import { ExternalLink, Flame, Loader2, MessageSquareText, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { formatCompactNumber, formatTimeAgo, VIRAL_HIGHLIGHT, type ShortVideo } from '@/lib/shorts';

interface ShortCardProps {
  short: ShortVideo;
  selected: boolean;
  selectDisabled: boolean;
  analyzing: boolean;
  onToggleSelect: () => void;
  onPlay: () => void;
  onAnalyze: () => void;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatViralScore(score: number | null): string {
  if (score === null) return '—';
  return `${score < 10 ? score.toFixed(1) : Math.round(score)}×`;
}

export function ShortCard({ short, selected, selectDisabled, analyzing, onToggleSelect, onPlay, onAnalyze }: ShortCardProps) {
  const isViral = short.viralScore !== null && short.viralScore >= VIRAL_HIGHLIGHT;

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm', selected && 'ring-2 ring-primary')}>
      <button
        type="button"
        onClick={onPlay}
        className="group relative aspect-[9/16] w-full overflow-hidden bg-black"
        aria-label={`Assistir: ${short.title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={short.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(short.durationSeconds)}
        </span>
        {isViral && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
            <Flame className="h-3 w-3" />
            {formatViralScore(short.viralScore)}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <Play className="h-10 w-10 text-white" fill="white" />
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          <Checkbox
            checked={selected}
            disabled={selectDisabled && !selected}
            onCheckedChange={onToggleSelect}
            aria-label="Selecionar para análise consolidada"
            className="mt-0.5"
          />
          <p className="line-clamp-2 text-sm font-medium leading-snug" title={short.title}>{short.title}</p>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {short.channelTitle} · {short.subscribers !== null ? `${formatCompactNumber(short.subscribers)} inscritos` : 'inscritos ocultos'}
        </p>

        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <div>
            <dt className="text-muted-foreground">Viralização</dt>
            <dd className={cn('font-semibold', isViral && 'text-orange-600')}>{formatViralScore(short.viralScore)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Views/dia</dt>
            <dd className="font-semibold">{formatCompactNumber(Math.round(short.viewsPerDay))}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Views</dt>
            <dd className="font-semibold">{formatCompactNumber(short.views)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Engajamento</dt>
            <dd className="font-semibold">{short.engagementRate.toFixed(1)}%</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">{formatTimeAgo(short.publishedAt)}</p>

        <div className="mt-auto flex gap-2 pt-1">
          <Button size="sm" variant="secondary" className="flex-1 px-2 text-xs" onClick={onAnalyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageSquareText className="mr-1 h-3 w-3" />}
            Analisar comentários
          </Button>
          <Button size="sm" variant="ghost" className="px-2" asChild>
            <a href={`https://www.youtube.com/shorts/${short.id}`} target="_blank" rel="noopener noreferrer" aria-label="Abrir no YouTube">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar** `src/components/shorts/ShortPlayerDialog.tsx`:

```tsx
'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ShortVideo } from '@/lib/shorts';

interface ShortPlayerDialogProps {
  short: ShortVideo | null;
  onClose: () => void;
}

export function ShortPlayerDialog({ short, onClose }: ShortPlayerDialogProps) {
  return (
    <Dialog open={!!short} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* Largura limitada pela altura da tela, para o 9:16 caber sem rolagem */}
      <DialogContent className="w-[min(380px,calc((100vh-4rem)*0.5625))] max-w-none overflow-hidden border-0 bg-black p-0 [&>button]:text-white">
        <DialogTitle className="sr-only">{short?.title ?? 'Short'}</DialogTitle>
        {short && (
          <div className="aspect-[9/16] w-full">
            <iframe
              src={`https://www.youtube.com/embed/${short.id}?autoplay=1&rel=0`}
              title={short.title}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Criar** `src/components/shorts/CommentInsightsPanel.tsx`:

```tsx
'use client';

import { AlertCircle, Copy, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { formatReportMarkdown, type ShortsCommentsReport } from '@/lib/shorts-report';

export type AnalysisState =
  | { status: 'loading'; videoIds: string[] }
  | { status: 'done'; videoIds: string[]; report: ShortsCommentsReport; commentsAnalyzed: number; videosWithoutComments: string[] }
  | { status: 'error'; videoIds: string[]; error: string };

interface CommentInsightsPanelProps {
  analysis: AnalysisState | null;
  titles: Record<string, string>;
  onOpenChange: (open: boolean) => void;
}

const FREQUENCY_STYLE: Record<'alta' | 'média' | 'baixa', string> = {
  alta: 'bg-red-100 text-red-800 hover:bg-red-100',
  'média': 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  baixa: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
};

export function CommentInsightsPanel({ analysis, titles, onOpenChange }: CommentInsightsPanelProps) {
  const { toast } = useToast();
  const isConsolidated = !!analysis && analysis.videoIds.length > 1;
  const sources = (ids: string[]) => ids.map(id => titles[id] || id).join(', ');

  const copyReport = async () => {
    if (analysis?.status !== 'done') return;
    try {
      await navigator.clipboard.writeText(formatReportMarkdown(analysis.report, titles));
      toast({ title: 'Relatório copiado' });
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={!!analysis} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {isConsolidated ? `Análise consolidada de ${analysis!.videoIds.length} Shorts` : 'Análise de comentários'}
          </SheetTitle>
          {analysis && !isConsolidated && (
            <SheetDescription className="line-clamp-2">{titles[analysis.videoIds[0]]}</SheetDescription>
          )}
        </SheetHeader>

        {analysis?.status === 'loading' && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Lendo os comentários e gerando a análise...
          </div>
        )}

        {analysis?.status === 'error' && (
          <div className="mt-6 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{analysis.error}</p>
          </div>
        )}

        {analysis?.status === 'done' && (
          <div className="mt-4 space-y-6 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {analysis.commentsAnalyzed} comentários analisados
                {analysis.videosWithoutComments.length > 0 && ` · ${analysis.videosWithoutComments.length} Short(s) sem comentários`}
                {analysis.commentsAnalyzed < 10 && ' · poucos comentários, use com cautela'}
              </p>
              <Button size="sm" variant="outline" onClick={copyReport}>
                <Copy className="mr-1 h-3 w-3" />
                Copiar relatório
              </Button>
            </div>

            <section>
              <h3 className="mb-2 font-semibold">Dores e desejos</h3>
              <ul className="space-y-2">
                {analysis.report.painsAndDesires.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="secondary" className={FREQUENCY_STYLE[item.frequency]}>{item.frequency}</Badge>
                    <span>
                      {item.insight}
                      {isConsolidated && <span className="block text-xs text-muted-foreground">{sources(item.videoIds)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">Linguagem do público</h3>
              <ul className="space-y-2">
                {analysis.report.audienceLanguage.map((item, index) => (
                  <li key={index} className="border-l-2 border-primary/40 pl-3">
                    <p className="italic">&ldquo;{item.quote}&rdquo;</p>
                    {item.translation && <p className="text-xs text-muted-foreground">{item.translation}</p>}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">Ângulos de anúncio</h3>
              <ol className="space-y-3">
                {analysis.report.adAngles.map((item, index) => (
                  <li key={index} className="rounded-md border p-3">
                    <p className="font-semibold">{index + 1}. {item.hook}</p>
                    <p className="mt-1"><span className="text-muted-foreground">Ângulo:</span> {item.angle}</p>
                    <p className="mt-1"><span className="text-muted-foreground">Por que funciona:</span> {item.rationale}</p>
                    <p className="mt-1 text-xs italic text-muted-foreground">Baseado em: &ldquo;{item.basedOnQuote}&rdquo;</p>
                    {isConsolidated && <p className="mt-1 text-xs text-muted-foreground">Shorts: {sources(item.videoIds)}</p>}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Typecheck dos componentes**

Run: `npx tsc --noEmit 2>&1 | grep -E "components/shorts"`
Expected: nenhuma saída.

- [ ] **Step 5: Commit**

```bash
git add src/components/shorts
git commit -m "feat(shorts): card, player e painel de análise"
```

---

### Task 7: Página `/shorts`, menu e rota protegida

**Files:**
- Create: `src/app/shorts/page.tsx`
- Modify: `src/components/youtube/Sidebar.tsx` (imports da linha 5 e lista `navItems`)
- Modify: `src/middleware.ts` (lista `protectedRoutes`)

**Interfaces:**
- Consumes: `searchShorts` (Task 4), `analyzeShortsComments` (Task 5), `ShortCard`, `ShortPlayerDialog`, `CommentInsightsPanel`, `AnalysisState` (Task 6), `sortShorts`, `defaultSortFor`, `ShortVideo`, `ShortsSearchOrder`, `ShortsSortKey` (Task 2), `analysisKey` (Task 3), `COUNTRIES` de `src/lib/countries.ts`.
- Produces: rota `/shorts`.

- [ ] **Step 1: Criar** `src/app/shorts/page.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, Search, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShortCard } from '@/components/shorts/ShortCard';
import { ShortPlayerDialog } from '@/components/shorts/ShortPlayerDialog';
import { CommentInsightsPanel, type AnalysisState } from '@/components/shorts/CommentInsightsPanel';
import { searchShorts, type SearchShortsInput } from '@/ai/flows/search-shorts';
import { analyzeShortsComments } from '@/ai/flows/analyze-shorts-comments';
import { COUNTRIES } from '@/lib/countries';
import { defaultSortFor, sortShorts, type ShortsSearchOrder, type ShortsSortKey, type ShortVideo } from '@/lib/shorts';
import { analysisKey } from '@/lib/shorts-report';

const API_KEY_STORAGE_ITEM = 'youtube_api_key';
const MAX_SELECTED = 10;

const ORDER_OPTIONS: { value: ShortsSearchOrder; label: string }[] = [
  { value: 'viewCount', label: 'Mais vistos' },
  { value: 'date', label: 'Mais recentes' },
  { value: 'relevance', label: 'Mais relevantes' },
];

const PERIOD_OPTIONS = [
  { value: '1', label: 'Últimas 24 horas' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

const SORT_OPTIONS: { value: ShortsSortKey; label: string }[] = [
  { value: 'viral', label: 'Viralização' },
  { value: 'velocity', label: 'Velocidade (views/dia)' },
  { value: 'views', label: 'Views' },
  { value: 'engagement', label: 'Engajamento' },
  { value: 'recent', label: 'Mais recentes' },
];

type SearchQuery = Omit<SearchShortsInput, 'apiKey' | 'pageToken'>;

export default function ShortsPage() {
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('BR');
  const [order, setOrder] = useState<ShortsSearchOrder>('viewCount');
  const [period, setPeriod] = useState('7');

  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [lastQuery, setLastQuery] = useState<SearchQuery | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [sortKey, setSortKey] = useState<ShortsSortKey>('viral');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [missingKey, setMissingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [playing, setPlaying] = useState<ShortVideo | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});
  const [openAnalysisKey, setOpenAnalysisKey] = useState<string | null>(null);

  const sortedShorts = useMemo(() => sortShorts(shorts, sortKey), [shorts, sortKey]);
  const titles = useMemo(() => Object.fromEntries(shorts.map(short => [short.id, short.title])), [shorts]);

  const getApiKey = () => localStorage.getItem(API_KEY_STORAGE_ITEM);

  const runSearch = async (loadMore: boolean) => {
    const apiKey = getApiKey();
    setMissingKey(!apiKey);
    if (!apiKey) return;

    // "Carregar mais" repete a última busca, mesmo que os filtros tenham mudado depois
    const query: SearchQuery = loadMore && lastQuery ? lastQuery : {
      country,
      order,
      topic: topic.trim() || undefined,
      publishedAfter: new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (loadMore) setIsLoadingMore(true);
    else setIsSearching(true);
    setError(null);

    try {
      const result = await searchShorts({ apiKey, ...query, pageToken: loadMore ? nextPageToken : undefined });
      if (result.error) {
        setError(result.error);
        return;
      }
      const found = result.shorts || [];
      if (loadMore) {
        setShorts(prev => {
          const seen = new Set(prev.map(short => short.id));
          return [...prev, ...found.filter(short => !seen.has(short.id))];
        });
      } else {
        setShorts(found);
        setSelectedIds([]);
        setLastQuery(query);
        setSortKey(defaultSortFor(query.order));
      }
      setNextPageToken(result.nextPageToken);
    } catch (e: any) {
      setError(e.message || 'Erro ao buscar Shorts.');
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const analyze = async (videoIds: string[]) => {
    const key = analysisKey(videoIds);
    setOpenAnalysisKey(key);
    // Já analisado (ou em andamento): só reabre o painel. Em caso de erro, tenta de novo
    const existing = analyses[key];
    if (existing && existing.status !== 'error') return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setAnalyses(prev => ({ ...prev, [key]: { status: 'error', videoIds, error: 'Chave de API do YouTube não encontrada. Adicione-a em Configurações.' } }));
      return;
    }

    setAnalyses(prev => ({ ...prev, [key]: { status: 'loading', videoIds } }));
    try {
      const result = await analyzeShortsComments({
        apiKey,
        videos: videoIds.map(id => ({ id, title: titles[id] || '' })),
      });
      setAnalyses(prev => ({
        ...prev,
        [key]: result.report
          ? { status: 'done', videoIds, report: result.report, commentsAnalyzed: result.commentsAnalyzed, videosWithoutComments: result.videosWithoutComments }
          : { status: 'error', videoIds, error: result.error || 'Não foi possível analisar os comentários.' },
      }));
    } catch (e: any) {
      setAnalyses(prev => ({ ...prev, [key]: { status: 'error', videoIds, error: e.message || 'Erro ao analisar os comentários.' } }));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(selected => selected !== id);
      return prev.length >= MAX_SELECTED ? prev : [...prev, id];
    });
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Shorts para Criativos</h1>
        <p className="text-muted-foreground">
          Encontre Shorts que estão escalando para inspirar anúncios e entenda o público pelos comentários.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Cada busca consome 1 das 100 buscas diárias da sua chave do YouTube. Ordenar os resultados não consome.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); runSearch(false); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shorts-topic">Tema ou nicho (opcional)</Label>
              <Input
                id="shorts-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex.: emagrecimento, skincare, renda extra..."
              />
              <p className="text-xs text-muted-foreground">
                Em branco, busca Shorts de dicas, tutoriais, truques e curiosidades do país. O tema é traduzido para o idioma do país.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="shorts-country">País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="shorts-country"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.flag} {option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shorts-order">Buscar por</Label>
                <Select value={order} onValueChange={(value) => setOrder(value as ShortsSearchOrder)}>
                  <SelectTrigger id="shorts-order"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shorts-period">Publicados em</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger id="shorts-period"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isSearching}>
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar Shorts
            </Button>
          </form>
        </CardContent>
      </Card>

      {missingKey && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            Chave de API do YouTube não encontrada. Adicione-a em{' '}
            <Link href="/settings" className="font-semibold underline">Configurações</Link>.
          </p>
        </div>
      )}

      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {shorts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{shorts.length} Shorts encontrados</p>
          <div className="flex items-center gap-2">
            <Label htmlFor="shorts-sort" className="text-sm">Ordenar por</Label>
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as ShortsSortKey)}>
              <SelectTrigger id="shorts-sort" className="w-[210px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {shorts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {sortedShorts.map(short => (
            <ShortCard
              key={short.id}
              short={short}
              selected={selectedIds.includes(short.id)}
              selectDisabled={selectedIds.length >= MAX_SELECTED}
              analyzing={analyses[analysisKey([short.id])]?.status === 'loading'}
              onToggleSelect={() => toggleSelect(short.id)}
              onPlay={() => setPlaying(short)}
              onAnalyze={() => analyze([short.id])}
            />
          ))}
        </div>
      )}

      {lastQuery && !isSearching && !error && shorts.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Nenhum Short encontrado com esses filtros. Tente outro tema ou um período maior
          {nextPageToken ? ', ou carregue mais resultados' : ''}.
        </div>
      )}

      {lastQuery && nextPageToken && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => runSearch(true)} disabled={isLoadingMore}>
            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Carregar mais
          </Button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg">
          <span className="text-sm">
            {selectedIds.length} selecionado(s){selectedIds.length >= MAX_SELECTED ? ' (máximo)' : ''}
          </span>
          <Button size="sm" onClick={() => analyze(selectedIds)} disabled={selectedIds.length < 2}>
            <Sparkles className="mr-1 h-3 w-3" />
            Analisar selecionados
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} aria-label="Limpar seleção">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ShortPlayerDialog short={playing} onClose={() => setPlaying(null)} />
      <CommentInsightsPanel
        analysis={openAnalysisKey ? analyses[openAnalysisKey] ?? null : null}
        titles={titles}
        onOpenChange={(open) => { if (!open) setOpenAnalysisKey(null); }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Adicionar a entrada no menu** em `src/components/youtube/Sidebar.tsx`. Troque a linha 5:

```tsx
import { Home, TrendingUp, Facebook, Shield, Settings, FileText } from 'lucide-react';
```

por:

```tsx
import { Home, TrendingUp, Facebook, Shield, Settings, FileText, Smartphone } from 'lucide-react';
```

E, em `navItems`, logo depois da linha de Tendências:

```tsx
  { icon: TrendingUp, label: 'Tendências', href: '/trending' },
  { icon: Smartphone, label: 'Shorts', href: '/shorts' },
```

- [ ] **Step 3: Proteger a rota** em `src/middleware.ts`, na lista `protectedRoutes`, logo depois de `'/trending',`:

```ts
  '/trending',
  '/shorts',
```

- [ ] **Step 4: Typecheck e build**

Run: `npx tsc --noEmit 2>&1 | grep -E "app/shorts|components/shorts|Sidebar|middleware"`
Expected: nenhuma saída.

Run: `npx next build 2>&1 | grep -E "✓ Generating|Error|⨯|/shorts"`
Expected: `✓ Generating static pages` e uma linha `○ /shorts`, sem `Error` nem `⨯`.

- [ ] **Step 5: Rodar todos os testes**

Run: `npm test 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# pass 17` e `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add src/app/shorts/page.tsx src/components/youtube/Sidebar.tsx src/middleware.ts
git commit -m "feat(shorts): página /shorts no menu"
```

---

### Task 8: Verificação visual e PR

**Files:**
- Create (temporário, não commitar): `src/app/shorts-preview/page.tsx`

A busca real exige uma chave do YouTube que não está disponível localmente. Uma página
temporária renderiza os componentes com dados fictícios para a conferência visual.

- [ ] **Step 1: Criar a página temporária** `src/app/shorts-preview/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ShortCard } from '@/components/shorts/ShortCard';
import { ShortPlayerDialog } from '@/components/shorts/ShortPlayerDialog';
import { CommentInsightsPanel, type AnalysisState } from '@/components/shorts/CommentInsightsPanel';
import type { ShortVideo } from '@/lib/shorts';

const now = Date.now();
const SHORTS: ShortVideo[] = [
  { id: 'aqz-KE-bpKQ', title: 'Treino de 5 minutos que mudou meu corpo em 30 dias', channelId: 'c1', channelTitle: 'Fit em Casa', subscribers: 12_000, thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg', durationSeconds: 48, publishedAt: new Date(now - 2 * 86_400_000).toISOString(), views: 540_000, likes: 31_000, comments: 820, country: 'BR', viralScore: 45, viewsPerDay: 270_000, engagementRate: 5.9 },
  { id: 'jNQXAC9IVRw', title: 'Receita sem açúcar', channelId: 'c2', channelTitle: 'Cozinha Leve', subscribers: null, thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg', durationSeconds: 125, publishedAt: new Date(now - 5 * 3_600_000).toISOString(), views: 18_000, likes: null, comments: 90, country: 'BR', viralScore: null, viewsPerDay: 86_400, engagementRate: 0.5 },
];

const DONE: AnalysisState = {
  status: 'done',
  videoIds: ['aqz-KE-bpKQ', 'jNQXAC9IVRw'],
  commentsAnalyzed: 87,
  videosWithoutComments: [],
  report: {
    painsAndDesires: [{ insight: 'Querem resultado rápido sem academia', frequency: 'alta', videoIds: ['aqz-KE-bpKQ'] }],
    audienceLanguage: [{ quote: 'Fiz 3 dias e já senti diferença', videoId: 'aqz-KE-bpKQ' }, { quote: 'Me encanta', translation: 'Eu adoro', videoId: 'jNQXAC9IVRw' }],
    adAngles: [{ hook: 'Você não precisa de academia para ver resultado', angle: 'Treino curto em casa', rationale: 'Falta de tempo é a queixa mais citada', basedOnQuote: 'Não tenho tempo pra academia', videoIds: ['aqz-KE-bpKQ', 'jNQXAC9IVRw'] }],
  },
};

export default function ShortsPreview() {
  const [playing, setPlaying] = useState<ShortVideo | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const titles = Object.fromEntries(SHORTS.map(s => [s.id, s.title]));
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
      {SHORTS.map(short => (
        <ShortCard key={short.id} short={short} selected={false} selectDisabled={false} analyzing={false}
          onToggleSelect={() => {}} onPlay={() => setPlaying(short)} onAnalyze={() => setAnalysis(DONE)} />
      ))}
      <ShortPlayerDialog short={playing} onClose={() => setPlaying(null)} />
      <CommentInsightsPanel analysis={analysis} titles={titles} onOpenChange={(open) => { if (!open) setAnalysis(null); }} />
    </div>
  );
}
```

- [ ] **Step 2: Subir o app e conferir.** Rode `npx next build && npx next start -p 4123` (ou use o preview do navegador). No navegador, crie o cookie `__session=test` e abra `/shorts-preview`. Confira:
  - os cards verticais, com o selo laranja "45×" no primeiro e "—" / "inscritos ocultos" no segundo;
  - clicar na capa abre o player 9:16;
  - "Analisar comentários" abre o painel com os três blocos, as fontes (análise consolidada) e o botão "Copiar relatório".

  Abra também `/shorts` e confira o formulário (tema, país, "Buscar por", "Publicados em") e a entrada "Shorts" no menu.

- [ ] **Step 3: Apagar a página temporária e conferir que ela não vai para o commit**

Run: `rm -rf src/app/shorts-preview .next && git status --short`
Expected: nenhuma linha com `shorts-preview`.

- [ ] **Step 4: Push e PR.** No corpo do PR, a linha "Validação da API" deve trazer o resultado real da Task 1 (termo padrão usado e se `embedWidth`/`embedHeight` vieram).

```bash
git push -u origin claude/shorts-feature
gh pr create --base master --head claude/shorts-feature --title "feat: busca de Shorts para criativos de anúncio" --body-file - <<'EOF'
## O que é
Nova página **Shorts** (`/shorts`) para encontrar Shorts que estão escalando e usá-los como inspiração de criativos para anúncios no Facebook.

- **Busca:** tema opcional (traduzido para o idioma do país; em branco usa termos locais de dicas, tutoriais, truques e curiosidades), país, "Buscar por" (Mais vistos, Mais recentes, Mais relevantes) e período (24 horas a 90 dias). Cada busca gasta 1 chamada de `search.list`.
- **Identificação de Short:** até 3 minutos e vertical (`player.embedWidth`/`embedHeight`).
- **Métricas:** viralização (views ÷ inscritos), velocidade (views/dia), views e engajamento, com ordenação na tela.
- **Grade de cards 9:16**, com o player abrindo na própria página.
- **Análise de comentários com o Gemini**, por Short ou consolidada (de 2 a 10), trazendo dores e desejos, linguagem do público e ângulos de anúncio, com o botão "Copiar relatório".

Spec: `docs/superpowers/specs/2026-09-22-shorts-criativos-design.md`
Plano: `docs/superpowers/plans/2026-09-22-shorts-criativos.md`

## Testes
- Validação da API (APIs Explorer): RESULTADO DA TASK 1
- `npm test`: 17 testes (métricas, relatório, busca e análise com a YouTube API simulada)
- `tsc` sem erros nos arquivos novos; `next build` passando
- Conferência visual dos cards, do player e do painel com dados fictícios

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

Antes de rodar, troque `RESULTADO DA TASK 1` pelo resultado anotado na Task 1, Step 4. Depois, espere o check "Vercel" do PR ficar `pass`.
