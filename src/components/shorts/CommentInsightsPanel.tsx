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
