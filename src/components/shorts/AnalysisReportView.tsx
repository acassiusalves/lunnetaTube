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
