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
