# Shorts: comentários antes da análise, transcrição e link: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na página `/shorts`, permitir ver os comentários de um Short antes de analisá-los,
mostrar e ordenar pelo número de comentários, transcrever o Short com o Gemini e copiar o
link do Short.

**Architecture:** Funções puras novas em `src/lib/shorts.ts` (ordenação por comentários) e
`src/lib/shorts-transcript.ts` (tipos, prompt, URL validada e exportação da transcrição).
O fluxo `analyzeShortsComments` passa a aceitar comentários já carregados, e o novo fluxo
`transcribeShort` envia o link do YouTube ao Gemini. Na interface, o painel lateral vira
`ShortPanel`, com abas (Comentários, Análise e Transcrição), e o bloco do relatório vai para
`AnalysisReportView`.

**Tech Stack:** Next.js 15.3.9 (App Router, server actions), Genkit 1.15 +
`@genkit-ai/googleai` (Gemini, entrada de vídeo por URL do YouTube), `googleapis`,
shadcn/ui (`Sheet`, `Tabs`), Tailwind, testes com `node:test` via `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-22-shorts-criativos-design.md`, seção "Atualização: comentários antes da análise, transcrição e link".

## Global Constraints

- Todo texto de interface em português do Brasil.
- Nenhuma dependência nova no `package.json`.
- Arquivos com `'use server'` exportam apenas funções assíncronas (tipos são permitidos; constantes não).
- Imports usam o alias `@/` (`src/`).
- Logs de erro nunca recebem o objeto de erro inteiro: usar `safeErrorSummary` de `@/lib/log-error`.
- A análise de um Short usa exatamente os comentários exibidos no painel (sem buscar de novo).
- Id de vídeo enviado ao Gemini: somente 11 caracteres `[A-Za-z0-9_-]`.
- Pasta de trabalho: `/Users/acassiusalves/Documents/GitHub/lunnetaTube/.claude/worktrees/search-home-trends-bug-065b5c`, branch `claude/shorts-comments-transcript`.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/shorts.ts` (modificar) | Chave de ordenação `'comments'` |
| `src/lib/shorts.test.ts` (modificar) | Teste da nova ordenação |
| `src/lib/shorts-transcript.ts` (novo) | Tipos da transcrição, `TRANSCRIPT_PROMPT`, `youtubeWatchUrl`, `formatTranscriptText` |
| `src/lib/shorts-transcript.test.ts` (novo) | Testes |
| `src/ai/flows/analyze-shorts-comments.ts` (modificar) | Aceita comentários já carregados |
| `src/ai/flows/analyze-shorts-comments.test.ts` (modificar) | Teste do novo caminho |
| `src/ai/flows/transcribe-short.ts` (novo) | Fluxo `transcribeShort` |
| `src/ai/flows/transcribe-short.test.ts` (novo) | Testes |
| `src/components/shorts/ShortCard.tsx` (modificar) | Métrica de comentários, "Ver comentários", "Copiar link" |
| `src/components/shorts/AnalysisReportView.tsx` (novo) | Relatório da análise (extraído do painel antigo) |
| `src/components/shorts/ShortPanel.tsx` (novo) | Painel com abas; substitui `CommentInsightsPanel.tsx` |
| `src/components/shorts/CommentInsightsPanel.tsx` (remover) | Substituído por `ShortPanel` |
| `src/app/shorts/page.tsx` (modificar) | Estado e ligações novas; opção "Mais comentários" |

---

### Task 1: Funções puras (ordenação por comentários e transcrição)

**Files:**
- Modify: `src/lib/shorts.ts`
- Modify: `src/lib/shorts.test.ts`
- Create: `src/lib/shorts-transcript.ts`
- Create: `src/lib/shorts-transcript.test.ts`

**Interfaces:**
- Consumes: nada novo.
- Produces:
  - `ShortsSortKey` passa a incluir `'comments'`; `sortShorts(list, 'comments')` ordena por `short.comments`, de forma decrescente.
  - `interface TranscriptSegment { start: string; text: string }`
  - `interface ShortTranscript { language: string; segments: TranscriptSegment[]; onScreenText: string[] }`
  - `const TRANSCRIPT_PROMPT: string`
  - `youtubeWatchUrl(videoId: string): string` (lança erro se o id for inválido)
  - `formatTranscriptText(transcript: ShortTranscript, title: string): string`

- [ ] **Step 1: Teste da ordenação que falha.** Em `src/lib/shorts.test.ts`, acrescente ao final:

```ts
test('sortShorts: "comments" ordena por número de comentários', () => {
  const list = [
    makeShort('poucos', { comments: 3 }),
    makeShort('muitos', { comments: 900 }),
    makeShort('medio', { comments: 40 }),
  ];
  assert.deepEqual(sortShorts(list, 'comments').map(s => s.id), ['muitos', 'medio', 'poucos']);
});
```

- [ ] **Step 2: Testes da transcrição que falham.** Crie `src/lib/shorts-transcript.test.ts`:

```ts
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
```

- [ ] **Step 3: Rodar e confirmar que falham**

Run: `npx tsx --test src/lib/shorts.test.ts src/lib/shorts-transcript.test.ts`
Expected: FAIL. O teste de ordenação falha porque `'comments'` não existe, e o de transcrição falha por módulo não encontrado.

- [ ] **Step 4: Implementar a ordenação.** Em `src/lib/shorts.ts`, troque:

```ts
export type ShortsSortKey = 'viral' | 'velocity' | 'views' | 'engagement' | 'recent';
```

por:

```ts
export type ShortsSortKey = 'viral' | 'velocity' | 'views' | 'engagement' | 'comments' | 'recent';
```

e, em `sortValue`, logo depois do `case 'engagement'`:

```ts
    case 'comments':
      return short.comments;
```

- [ ] **Step 5: Implementar** `src/lib/shorts-transcript.ts`:

```ts
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
```

- [ ] **Step 6: Rodar e confirmar que passam**

Run: `npx tsx --test src/lib/shorts.test.ts src/lib/shorts-transcript.test.ts`
Expected: `# pass 10` e `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/shorts.ts src/lib/shorts.test.ts src/lib/shorts-transcript.ts src/lib/shorts-transcript.test.ts
git commit -m "feat(shorts): ordenar por comentários e formato da transcrição"
```

---

### Task 2: Fluxos (análise com comentários recebidos e transcrição)

**Files:**
- Modify: `src/ai/flows/analyze-shorts-comments.ts`
- Modify: `src/ai/flows/analyze-shorts-comments.test.ts`
- Create: `src/ai/flows/transcribe-short.ts`
- Create: `src/ai/flows/transcribe-short.test.ts`

**Interfaces:**
- Consumes: `TRANSCRIPT_PROMPT`, `youtubeWatchUrl`, `ShortTranscript` (Task 1); `safeErrorSummary` de `@/lib/log-error`; `fetchTopComments` e `type FetchCommentsOutput` de `./fetch-comments`.
- Produces:
  - `analyzeShortsComments({ apiKey, videos: { id, title, comments?: { text: string; likeCount?: number }[] }[] })`: com `comments`, não chama `commentThreads.list` para aquele vídeo.
  - `transcribeShort({ videoId }): Promise<{ transcript?: ShortTranscript; error?: string }>`

- [ ] **Step 1: Teste da análise que falha.** Em `src/ai/flows/analyze-shorts-comments.test.ts`, acrescente ao final:

```ts
test('usa os comentários recebidos, sem buscar de novo', async () => {
  const result = await analyzeShortsComments({
    apiKey: 'x',
    videos: [{ id: 'a', title: 'A', comments: [{ text: 'Amei', likeCount: 2 }, { text: 'Onde compro?' }] }],
  });

  assert.equal(commentCalls.length, 0);
  assert.equal(result.commentsAnalyzed, 2);
  assert.match(result.error || '', /Gemini/);
});
```

- [ ] **Step 2: Testes da transcrição que falham.** Crie `src/ai/flows/transcribe-short.test.ts`:

```ts
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
```

- [ ] **Step 3: Rodar e confirmar que falham**

Run: `npx tsx --test src/ai/flows/analyze-shorts-comments.test.ts src/ai/flows/transcribe-short.test.ts`
Expected: FAIL. No teste novo da análise, `commentCalls.length` é 1; o de transcrição falha por módulo não encontrado.

- [ ] **Step 4: Implementar a análise com comentários recebidos.** Em `src/ai/flows/analyze-shorts-comments.ts`:

Troque o import:

```ts
import { fetchTopComments } from './fetch-comments';
```

por:

```ts
import { fetchTopComments, type FetchCommentsOutput } from './fetch-comments';
```

Troque o schema de entrada:

```ts
  videos: z.array(z.object({ id: z.string(), title: z.string() })).min(1).max(10),
```

por:

```ts
  videos: z.array(z.object({
    id: z.string(),
    title: z.string(),
    // Comentários já exibidos na tela: a análise usa exatamente esses, sem buscar de novo
    comments: z.array(z.object({ text: z.string(), likeCount: z.number().optional() })).optional(),
  })).min(1).max(10),
```

Troque a busca:

```ts
    const results = await Promise.all(
      videos.map(video => fetchTopComments({ apiKey, videoId: video.id, maxResults: perVideo })),
    );
```

por:

```ts
    const results = await Promise.all(
      videos.map(video => video.comments
        ? Promise.resolve<FetchCommentsOutput>({ comments: video.comments })
        : fetchTopComments({ apiKey, videoId: video.id, maxResults: perVideo })),
    );
```

E troque:

```ts
      else withComments.push({ ...video, comments });
```

por:

```ts
      else withComments.push({ id: video.id, title: video.title, comments });
```

- [ ] **Step 5: Implementar** `src/ai/flows/transcribe-short.ts`:

```ts
'use server';

/**
 * @fileOverview Transcrição de um Short pelo Gemini, a partir do link público do YouTube.
 *
 * - transcribeShort - Devolve a fala com os tempos e os textos escritos na tela.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { safeErrorSummary } from '@/lib/log-error';
import { TRANSCRIPT_PROMPT, youtubeWatchUrl, type ShortTranscript } from '@/lib/shorts-transcript';

const TranscriptSchema = z.object({
  language: z.string(),
  segments: z.array(z.object({ start: z.string(), text: z.string() })),
  onScreenText: z.array(z.string()),
});

const TranscribeShortInputSchema = z.object({
  videoId: z.string().describe('Id do vídeo no YouTube (11 caracteres).'),
});
export type TranscribeShortInput = z.infer<typeof TranscribeShortInputSchema>;

const TranscribeShortOutputSchema = z.object({
  transcript: TranscriptSchema.optional(),
  error: z.string().optional(),
});
export type TranscribeShortOutput = { transcript?: ShortTranscript; error?: string };

export async function transcribeShort(input: TranscribeShortInput): Promise<TranscribeShortOutput> {
  return transcribeShortFlow(input);
}

const transcribeShortFlow = ai.defineFlow(
  {
    name: 'transcribeShortFlow',
    inputSchema: TranscribeShortInputSchema,
    outputSchema: TranscribeShortOutputSchema,
  },
  async ({ videoId }) => {
    let url: string;
    try {
      url = youtubeWatchUrl(videoId);
    } catch {
      return { error: 'Id de vídeo inválido.' };
    }

    try {
      // O Gemini recebe o link público do YouTube e assiste ao vídeo; o Genkit não baixa o arquivo
      const { output } = await ai.generate({
        prompt: [
          { media: { url, contentType: 'video/mp4' } },
          { text: TRANSCRIPT_PROMPT },
        ],
        output: { schema: TranscriptSchema, format: 'json' },
        config: { temperature: 0 },
      });
      if (!output) throw new Error('resposta vazia');
      return { transcript: output };
    } catch (e: any) {
      console.error('[transcribeShort] Erro no Gemini:', safeErrorSummary(e));
      return {
        error: `Não foi possível transcrever o Short com o Gemini (${e.message || 'erro desconhecido'}). Confira se a GEMINI_API_KEY está configurada.`,
      };
    }
  }
);
```

- [ ] **Step 6: Rodar e confirmar que passam**

Run: `npx tsx --test src/ai/flows/analyze-shorts-comments.test.ts src/ai/flows/transcribe-short.test.ts`
Expected: `# pass 6` e `# fail 0`. Logs do Gemini no console são esperados.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "analyze-shorts-comments|transcribe-short|shorts-transcript"`
Expected: nenhuma saída.

- [ ] **Step 8: Commit**

```bash
git add src/ai/flows/analyze-shorts-comments.ts src/ai/flows/analyze-shorts-comments.test.ts src/ai/flows/transcribe-short.ts src/ai/flows/transcribe-short.test.ts
git commit -m "feat(shorts): análise com comentários exibidos e transcrição pelo Gemini"
```

---

### Task 3: Componentes (card, relatório e painel com abas)

**Files:**
- Modify: `src/components/shorts/ShortCard.tsx` (arquivo inteiro abaixo)
- Create: `src/components/shorts/AnalysisReportView.tsx`
- Create: `src/components/shorts/ShortPanel.tsx`
- Delete: `src/components/shorts/CommentInsightsPanel.tsx`

**Interfaces:**
- Consumes: `formatCompactNumber`, `formatTimeAgo`, `VIRAL_HIGHLIGHT`, `ShortVideo` (`@/lib/shorts`); `formatReportMarkdown`, `ShortsCommentsReport` (`@/lib/shorts-report`); `formatTranscriptText`, `ShortTranscript` (`@/lib/shorts-transcript`); shadcn `Button`, `Checkbox`, `Badge`, `Sheet*`, `Tabs*`; `useToast`; `cn`.
- Produces:
  - `ShortCard(props: { short; selected; selectDisabled; loadingComments: boolean; onToggleSelect(); onPlay(); onOpenComments() })`
  - `AnalysisReportView(props: { videoIds: string[]; report: ShortsCommentsReport; commentsAnalyzed: number; videosWithoutComments: string[]; titles: Record<string, string> })`
  - Em `ShortPanel.tsx`: `interface ShortComment { author: string; text: string; likeCount: number }`; `type CommentsState`, `type AnalysisState`, `type TranscriptState`, `type PanelTab = 'comments' | 'analysis' | 'transcript'`; `ShortPanel(props: { videoIds: string[] | null; tab: PanelTab; titles; comments?; analysis?; transcript?; onTabChange(tab); onAnalyze(); onTranscribe(); onOpenChange(open) })`

- [ ] **Step 1: Substituir** `src/components/shorts/ShortCard.tsx` por:

```tsx
'use client';

import { ExternalLink, Flame, Link2, Loader2, MessageSquareText, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCompactNumber, formatTimeAgo, VIRAL_HIGHLIGHT, type ShortVideo } from '@/lib/shorts';

interface ShortCardProps {
  short: ShortVideo;
  selected: boolean;
  selectDisabled: boolean;
  loadingComments: boolean;
  onToggleSelect: () => void;
  onPlay: () => void;
  onOpenComments: () => void;
}

const decimalFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatViralScore(score: number | null): string {
  if (score === null) return '—';
  return `${score < 10 ? decimalFormatter.format(score) : Math.round(score)}×`;
}

export function ShortCard({ short, selected, selectDisabled, loadingComments, onToggleSelect, onPlay, onOpenComments }: ShortCardProps) {
  const { toast } = useToast();
  const isViral = short.viralScore !== null && short.viralScore >= VIRAL_HIGHLIGHT;
  const shortUrl = `https://www.youtube.com/shorts/${short.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast({ title: 'Link copiado' });
    } catch {
      toast({ title: 'Não foi possível copiar o link', variant: 'destructive' });
    }
  };

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
            <dt className="text-muted-foreground">Comentários</dt>
            <dd className="font-semibold">{formatCompactNumber(short.comments)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Engajamento</dt>
            <dd className="font-semibold">{decimalFormatter.format(short.engagementRate)}%</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">{formatTimeAgo(short.publishedAt)}</p>

        <div className="mt-auto flex gap-1 pt-1">
          <Button size="sm" variant="secondary" className="flex-1 px-2 text-xs" onClick={onOpenComments} disabled={loadingComments}>
            {loadingComments ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageSquareText className="mr-1 h-3 w-3" />}
            Ver comentários
          </Button>
          <Button size="sm" variant="ghost" className="px-2" onClick={copyLink} aria-label="Copiar link" title="Copiar link">
            <Link2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="px-2" asChild>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir no YouTube" title="Abrir no YouTube">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar** `src/components/shorts/AnalysisReportView.tsx`, com o bloco do relatório extraído do painel antigo:

```tsx
'use client';

import { Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatReportMarkdown, type ShortsCommentsReport } from '@/lib/shorts-report';

interface AnalysisReportViewProps {
  videoIds: string[];
  report: ShortsCommentsReport;
  commentsAnalyzed: number;
  videosWithoutComments: string[];
  titles: Record<string, string>;
}

const FREQUENCY_STYLE: Record<'alta' | 'média' | 'baixa', string> = {
  alta: 'bg-red-100 text-red-800 hover:bg-red-100',
  'média': 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  baixa: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
};

export function AnalysisReportView({ videoIds, report, commentsAnalyzed, videosWithoutComments, titles }: AnalysisReportViewProps) {
  const { toast } = useToast();
  const isConsolidated = videoIds.length > 1;
  const sources = (ids: string[]) => ids.map(id => titles[id] || id).join(', ');

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(formatReportMarkdown(report, titles));
      toast({ title: 'Relatório copiado' });
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  return (
    <div className="mt-4 space-y-6 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {commentsAnalyzed} comentários analisados
          {videosWithoutComments.length > 0 && ` · ${videosWithoutComments.length} Short(s) sem comentários`}
          {commentsAnalyzed < 10 && ' · poucos comentários, use com cautela'}
        </p>
        <Button size="sm" variant="outline" onClick={copyReport}>
          <Copy className="mr-1 h-3 w-3" />
          Copiar relatório
        </Button>
      </div>

      <section>
        <h3 className="mb-2 font-semibold">Dores e desejos</h3>
        <ul className="space-y-2">
          {report.painsAndDesires.map((item, index) => (
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
          {report.audienceLanguage.map((item, index) => (
            <li key={index} className="border-l-2 border-primary/40 pl-3">
              <p className="italic">&ldquo;{item.quote}&rdquo;</p>
              {item.translation && <p className="text-xs text-muted-foreground">{item.translation}</p>}
              {isConsolidated && <p className="text-xs text-muted-foreground">{titles[item.videoId] || item.videoId}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Ângulos de anúncio</h3>
        <ol className="space-y-3">
          {report.adAngles.map((item, index) => (
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
  );
}
```

- [ ] **Step 3: Criar** `src/components/shorts/ShortPanel.tsx`:

```tsx
'use client';

import { AlertCircle, Copy, FileText, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatCompactNumber } from '@/lib/shorts';
import type { ShortsCommentsReport } from '@/lib/shorts-report';
import { formatTranscriptText, type ShortTranscript } from '@/lib/shorts-transcript';
import { AnalysisReportView } from './AnalysisReportView';

export interface ShortComment {
  author: string;
  text: string;
  likeCount: number;
}

export type CommentsState =
  | { status: 'loading' }
  | { status: 'done'; comments: ShortComment[] }
  | { status: 'error'; error: string };

export type AnalysisState =
  | { status: 'loading'; videoIds: string[] }
  | { status: 'done'; videoIds: string[]; report: ShortsCommentsReport; commentsAnalyzed: number; videosWithoutComments: string[] }
  | { status: 'error'; videoIds: string[]; error: string };

export type TranscriptState =
  | { status: 'loading' }
  | { status: 'done'; transcript: ShortTranscript }
  | { status: 'error'; error: string };

export type PanelTab = 'comments' | 'analysis' | 'transcript';

interface ShortPanelProps {
  videoIds: string[] | null;  // o painel fica aberto enquanto não for nulo
  tab: PanelTab;
  titles: Record<string, string>;
  comments?: CommentsState;
  analysis?: AnalysisState;
  transcript?: TranscriptState;
  onTabChange: (tab: PanelTab) => void;
  onAnalyze: () => void;
  onTranscribe: () => void;
  onOpenChange: (open: boolean) => void;
}

function Spinner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mt-4 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

interface AnalysisContentProps {
  analysis?: AnalysisState;
  titles: Record<string, string>;
  canAnalyze: boolean;
  onAnalyze: () => void;
}

function AnalysisContent({ analysis, titles, canAnalyze, onAnalyze }: AnalysisContentProps) {
  if (!analysis) {
    return (
      <div className="space-y-3 py-6 text-sm text-muted-foreground">
        <p>Os comentários ainda não foram analisados.</p>
        {canAnalyze && (
          <Button size="sm" onClick={onAnalyze}>
            <Sparkles className="mr-1 h-3 w-3" />
            Analisar com IA
          </Button>
        )}
      </div>
    );
  }
  if (analysis.status === 'loading') return <Spinner text="Lendo os comentários e gerando a análise..." />;
  if (analysis.status === 'error') {
    return (
      <>
        <ErrorBox message={analysis.error} />
        {canAnalyze && (
          <Button className="mt-3" size="sm" variant="outline" onClick={onAnalyze}>
            Tentar de novo
          </Button>
        )}
      </>
    );
  }
  return (
    <AnalysisReportView
      videoIds={analysis.videoIds}
      report={analysis.report}
      commentsAnalyzed={analysis.commentsAnalyzed}
      videosWithoutComments={analysis.videosWithoutComments}
      titles={titles}
    />
  );
}

export function ShortPanel({
  videoIds, tab, titles, comments, analysis, transcript, onTabChange, onAnalyze, onTranscribe, onOpenChange,
}: ShortPanelProps) {
  const { toast } = useToast();
  const isConsolidated = !!videoIds && videoIds.length > 1;
  const title = videoIds && videoIds.length === 1 ? titles[videoIds[0]] : undefined;
  const commentsReady = comments?.status === 'done' && comments.comments.length > 0;

  const copyTranscript = async () => {
    if (transcript?.status !== 'done') return;
    try {
      await navigator.clipboard.writeText(formatTranscriptText(transcript.transcript, title || ''));
      toast({ title: 'Transcrição copiada' });
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={!!videoIds} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {isConsolidated ? `Análise consolidada de ${videoIds?.length} Shorts` : 'Detalhes do Short'}
          </SheetTitle>
          {title && <SheetDescription className="line-clamp-2">{title}</SheetDescription>}
        </SheetHeader>

        {isConsolidated ? (
          <AnalysisContent analysis={analysis} titles={titles} canAnalyze={false} onAnalyze={onAnalyze} />
        ) : (
          <Tabs value={tab} onValueChange={(value) => onTabChange(value as PanelTab)} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comments">Comentários</TabsTrigger>
              <TabsTrigger value="analysis">Análise</TabsTrigger>
              <TabsTrigger value="transcript">Transcrição</TabsTrigger>
            </TabsList>

            <TabsContent value="comments">
              {(!comments || comments.status === 'loading') && <Spinner text="Carregando os comentários..." />}
              {comments?.status === 'error' && <ErrorBox message={comments.error} />}
              {comments?.status === 'done' && comments.comments.length === 0 && (
                <p className="py-6 text-sm text-muted-foreground">Este Short não tem comentários.</p>
              )}
              {comments?.status === 'done' && comments.comments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{comments.comments.length} comentários mais relevantes</p>
                    <Button
                      size="sm"
                      onClick={analysis?.status === 'done' ? () => onTabChange('analysis') : onAnalyze}
                      disabled={analysis?.status === 'loading'}
                    >
                      {analysis?.status === 'loading'
                        ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        : <Sparkles className="mr-1 h-3 w-3" />}
                      {analysis?.status === 'done' ? 'Ver análise' : 'Analisar com IA'}
                    </Button>
                  </div>
                  <ul className="divide-y text-sm">
                    {comments.comments.map((comment, index) => (
                      <li key={index} className="py-2">
                        <p className="text-xs font-semibold">{comment.author}</p>
                        <p className="whitespace-pre-wrap break-words">{comment.text}</p>
                        {comment.likeCount > 0 && (
                          <p className="mt-0.5 text-xs text-muted-foreground">👍 {formatCompactNumber(comment.likeCount)}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analysis">
              <AnalysisContent analysis={analysis} titles={titles} canAnalyze={commentsReady} onAnalyze={onAnalyze} />
            </TabsContent>

            <TabsContent value="transcript">
              {!transcript && (
                <div className="space-y-3 py-6 text-sm text-muted-foreground">
                  <p>O Gemini assiste ao Short e transcreve a fala com os tempos e os textos escritos na tela.</p>
                  <Button size="sm" onClick={onTranscribe}>
                    <FileText className="mr-1 h-3 w-3" />
                    Transcrever
                  </Button>
                </div>
              )}
              {transcript?.status === 'loading' && <Spinner text="O Gemini está assistindo ao Short..." />}
              {transcript?.status === 'error' && (
                <>
                  <ErrorBox message={transcript.error} />
                  <Button className="mt-3" size="sm" variant="outline" onClick={onTranscribe}>
                    Tentar de novo
                  </Button>
                </>
              )}
              {transcript?.status === 'done' && (
                <div className="mt-4 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Idioma: {transcript.transcript.language}</p>
                    <Button size="sm" variant="outline" onClick={copyTranscript}>
                      <Copy className="mr-1 h-3 w-3" />
                      Copiar transcrição
                    </Button>
                  </div>
                  <section>
                    <h3 className="mb-2 font-semibold">Fala</h3>
                    {transcript.transcript.segments.length === 0 ? (
                      <p className="text-muted-foreground">Sem fala.</p>
                    ) : (
                      <ul className="space-y-1">
                        {transcript.transcript.segments.map((segment, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="w-10 shrink-0 font-mono text-xs leading-5 text-muted-foreground">{segment.start}</span>
                            <span>{segment.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  {transcript.transcript.onScreenText.length > 0 && (
                    <section>
                      <h3 className="mb-2 font-semibold">Texto na tela</h3>
                      <ul className="list-disc space-y-1 pl-5">
                        {transcript.transcript.onScreenText.map((text, index) => (
                          <li key={index}>{text}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Remover o painel antigo**

Run: `git rm -q src/components/shorts/CommentInsightsPanel.tsx`

- [ ] **Step 5: Typecheck dos componentes**

Run: `npx tsc --noEmit 2>&1 | grep -E "components/shorts"`
Expected: nenhuma saída. `src/app/shorts/page.tsx` pode ainda acusar erro, porque importa o painel antigo e usa as props antigas do card; ele é corrigido na Task 4.

- [ ] **Step 6: Commit**

```bash
git add src/components/shorts
git commit -m "feat(shorts): card com comentários e copiar link; painel com abas"
```

---

### Task 4: Página `/shorts`

**Files:**
- Modify: `src/app/shorts/page.tsx`

**Interfaces:**
- Consumes: `ShortCard` (props novas), `ShortPanel`, `AnalysisState`, `CommentsState`, `TranscriptState`, `PanelTab` (Task 3); `fetchTopComments` (`@/ai/flows/fetch-comments`, retorna `{ comments?: { author; authorImageUrl; text; likeCount }[]; error? }`); `transcribeShort` (Task 2); `analyzeShortsComments` com `comments` opcional (Task 2).
- Produces: a página com as funções novas.

- [ ] **Step 1: Imports.** Troque:

```tsx
import { CommentInsightsPanel, type AnalysisState } from '@/components/shorts/CommentInsightsPanel';
import { searchShorts, type SearchShortsInput } from '@/ai/flows/search-shorts';
import { analyzeShortsComments } from '@/ai/flows/analyze-shorts-comments';
```

por:

```tsx
import {
  ShortPanel, type AnalysisState, type CommentsState, type PanelTab, type TranscriptState,
} from '@/components/shorts/ShortPanel';
import { searchShorts, type SearchShortsInput } from '@/ai/flows/search-shorts';
import { analyzeShortsComments } from '@/ai/flows/analyze-shorts-comments';
import { fetchTopComments } from '@/ai/flows/fetch-comments';
import { transcribeShort } from '@/ai/flows/transcribe-short';
```

- [ ] **Step 2: Opção de ordenação.** Em `SORT_OPTIONS`, logo depois de `{ value: 'engagement', label: 'Engajamento' },`, acrescente:

```tsx
  { value: 'comments', label: 'Mais comentários' },
```

- [ ] **Step 3: Estado.** Troque:

```tsx
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});
  const [openAnalysisKey, setOpenAnalysisKey] = useState<string | null>(null);
```

por:

```tsx
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});
  const [comments, setComments] = useState<Record<string, CommentsState>>({});
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptState>>({});
  // Painel lateral: um Short (abas) ou vários (análise consolidada)
  const [panel, setPanel] = useState<{ videoIds: string[]; tab: PanelTab } | null>(null);
```

- [ ] **Step 4: Análise com os comentários exibidos.** Substitua a função `analyze` inteira por:

```tsx
  const analyze = async (videoIds: string[]) => {
    const key = analysisKey(videoIds);
    // Já analisado (ou em andamento): o painel só mostra. Em caso de erro, tenta de novo
    const existing = analyses[key];
    if (existing && existing.status !== 'error') return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setAnalyses(prev => ({ ...prev, [key]: { status: 'error', videoIds, error: 'Chave de API do YouTube não encontrada. Adicione-a em Configurações.' } }));
      return;
    }

    // Um Short: a análise usa exatamente os comentários exibidos no painel
    const shown = videoIds.length === 1 ? comments[videoIds[0]] : undefined;
    const shownComments = shown?.status === 'done'
      ? shown.comments.map(({ text, likeCount }) => ({ text, likeCount }))
      : undefined;

    setAnalyses(prev => ({ ...prev, [key]: { status: 'loading', videoIds } }));
    try {
      const result = await analyzeShortsComments({
        apiKey,
        videos: videoIds.map(id => ({ id, title: titles[id] || '', comments: shownComments })),
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

  const openComments = async (id: string) => {
    setPanel({ videoIds: [id], tab: 'comments' });
    const existing = comments[id];
    if (existing && existing.status !== 'error') return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setComments(prev => ({ ...prev, [id]: { status: 'error', error: 'Chave de API do YouTube não encontrada. Adicione-a em Configurações.' } }));
      return;
    }

    setComments(prev => ({ ...prev, [id]: { status: 'loading' } }));
    try {
      const result = await fetchTopComments({ apiKey, videoId: id, maxResults: 100 });
      const list = (result.comments || []) as { author: string; text: string; likeCount?: number }[];
      setComments(prev => ({
        ...prev,
        [id]: result.error && list.length === 0
          ? { status: 'error', error: result.error }
          : { status: 'done', comments: list.map(comment => ({ author: comment.author, text: comment.text, likeCount: comment.likeCount || 0 })) },
      }));
    } catch (e: any) {
      setComments(prev => ({ ...prev, [id]: { status: 'error', error: e.message || 'Erro ao carregar os comentários.' } }));
    }
  };

  const transcribe = async (id: string) => {
    const existing = transcripts[id];
    if (existing && existing.status !== 'error') return;

    setTranscripts(prev => ({ ...prev, [id]: { status: 'loading' } }));
    try {
      const result = await transcribeShort({ videoId: id });
      setTranscripts(prev => ({
        ...prev,
        [id]: result.transcript
          ? { status: 'done', transcript: result.transcript }
          : { status: 'error', error: result.error || 'Não foi possível transcrever o Short.' },
      }));
    } catch (e: any) {
      setTranscripts(prev => ({ ...prev, [id]: { status: 'error', error: e.message || 'Erro ao transcrever o Short.' } }));
    }
  };

  const panelIds = panel?.videoIds ?? null;
  const singleId = panelIds && panelIds.length === 1 ? panelIds[0] : null;
```

- [ ] **Step 5: Card.** No `<ShortCard ... />` da grade, troque:

```tsx
              analyzing={analyses[analysisKey([short.id])]?.status === 'loading'}
              onToggleSelect={() => toggleSelect(short.id)}
              onPlay={() => setPlaying(short)}
              onAnalyze={() => analyze([short.id])}
```

por:

```tsx
              loadingComments={comments[short.id]?.status === 'loading'}
              onToggleSelect={() => toggleSelect(short.id)}
              onPlay={() => setPlaying(short)}
              onOpenComments={() => openComments(short.id)}
```

- [ ] **Step 6: "Analisar selecionados".** Troque:

```tsx
          <Button size="sm" onClick={() => analyze(selectedIds)} disabled={selectedIds.length < 2}>
```

por:

```tsx
          <Button
            size="sm"
            onClick={() => { setPanel({ videoIds: selectedIds, tab: 'analysis' }); analyze(selectedIds); }}
            disabled={selectedIds.length < 2}
          >
```

- [ ] **Step 7: Painel.** Troque:

```tsx
      <CommentInsightsPanel
        analysis={openAnalysisKey ? analyses[openAnalysisKey] ?? null : null}
        titles={titles}
        onOpenChange={(open) => { if (!open) setOpenAnalysisKey(null); }}
      />
```

por:

```tsx
      <ShortPanel
        videoIds={panelIds}
        tab={panel?.tab ?? 'comments'}
        titles={titles}
        comments={singleId ? comments[singleId] : undefined}
        analysis={panelIds ? analyses[analysisKey(panelIds)] : undefined}
        transcript={singleId ? transcripts[singleId] : undefined}
        onTabChange={(tab) => setPanel(prev => prev && { ...prev, tab })}
        onAnalyze={() => {
          if (!panelIds) return;
          setPanel(prev => prev && { ...prev, tab: 'analysis' });
          analyze(panelIds);
        }}
        onTranscribe={() => { if (singleId) transcribe(singleId); }}
        onOpenChange={(open) => { if (!open) setPanel(null); }}
      />
```

- [ ] **Step 8: Typecheck, testes e build**

Run: `npx tsc --noEmit 2>&1 | grep -E "app/shorts|components/shorts|flows/.*shorts|transcribe|lib/shorts"`
Expected: nenhuma saída.

Run: `npm test 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# pass 29` e `# fail 0`.

Run: `npx next build 2>&1 | grep -E "✓ Generating|Error|⨯|/shorts"`
Expected: `✓ Generating static pages` e `○ /shorts`, sem erros. Depois: `rm -rf .next`.

- [ ] **Step 9: Commit**

```bash
git add src/app/shorts/page.tsx
git commit -m "feat(shorts): ver comentários antes de analisar, transcrição e ordenar por comentários"
```

---

### Task 5: Verificação visual e integração

Feita pelo controlador (navegador).

- [ ] **Step 1:** Crie uma página temporária `src/app/shorts-preview/page.tsx`, que **não vai para o commit**. Ela renderiza `ShortCard` e `ShortPanel` com dados fictícios nos três estados de cada aba (comentários carregados, análise concluída e transcrição concluída), mais a análise consolidada.
- [ ] **Step 2:** `npx next build && npx next start -p 4123`, cookie `__session=test`, abrir `/shorts-preview`. Conferir:
  - no card: "Comentários" nas métricas, "Ver comentários", "Copiar link" (com o toast "Link copiado") e "Abrir no YouTube";
  - no painel: as abas Comentários, Análise e Transcrição; o botão "Analisar com IA" na aba Comentários; os tempos na Transcrição; "Copiar transcrição";
  - na análise consolidada: sem abas.
- [ ] **Step 3:** Em `/shorts`, conferir a opção "Mais comentários" no "Ordenar por".
- [ ] **Step 4:** `rm -rf src/app/shorts-preview .next` e `git status --short` sem `shorts-preview`.
