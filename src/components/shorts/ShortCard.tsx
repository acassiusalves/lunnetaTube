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
