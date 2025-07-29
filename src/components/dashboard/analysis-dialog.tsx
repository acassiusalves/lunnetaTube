
"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Video } from "@/lib/data";
import {
  transcribeVideo,
  type TranscribeVideoOutput,
} from "@/ai/flows/transcribe-video";
import {
  analyzeTranscript,
  type AnalyzeTranscriptOutput,
} from "@/ai/flows/analyze-transcript";

import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";

interface AnalysisDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  video: Video;
  analysisType: "content";
}

export function AnalysisDialog({ isOpen, setIsOpen, video, analysisType }: AnalysisDialogProps) {
  const [transcription, setTranscription] = useState<TranscribeVideoOutput | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<AnalyzeTranscriptOutput | null>(null);
  
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
      setTranscription(null);
      setContentAnalysis(null);
      setIsLoadingTranscription(false);
      setIsLoadingContent(false);
      setError(null);
  };

  useEffect(() => {
    if (isOpen) {
        resetState();

        const runAnalysis = async () => {
            try {
                if (analysisType === 'content') {
                    setIsLoadingTranscription(true);
                    // Em um aplicativo real, você buscaria o arquivo de vídeo e converteria para data URI
                    const fakeVideoDataUri = "data:video/mp4;base64,AAAAFGZ0eXBNU05WAAACAE1TTlYgAAAAAAYAAAFucGF2YwAAAAEAAABtYWN0dAAAAAAAAAAPAAAAAQAAAAEAAAAAAQAAAAEAAAAAAAAAIAAABwEAAABvbm1ldGEAAAAPAAAAC1VTQ0lQUk9GSUxFAAAAEAAAABFVU0NNVEFQUk9GSUxFAAAAAQAAAEdTU0lEPg==";
                    const transcriptionResult = await transcribeVideo({ videoDataUri: fakeVideoDataUri });
                    setTranscription(transcriptionResult);
                    setIsLoadingTranscription(false);

                    setIsLoadingContent(true);
                    const contentAnalysisResult = await analyzeTranscript({ transcript: transcriptionResult.transcription });
                    setContentAnalysis(contentAnalysisResult);
                    setIsLoadingContent(false);
                }
            } catch (e) {
                console.error(e);
                setError("Ocorreu um erro durante a análise. A transcrição de vídeo real requer a configuração da API do YouTube para baixar o arquivo de vídeo e, em seguida, processá-lo, o que está além da demonstração atual.");
                setIsLoadingTranscription(false);
                setIsLoadingContent(false);
            }
        };
        runAnalysis();
    }
  }, [isOpen, video, analysisType]);

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Análise de IA: {video.title}</DialogTitle>
        </DialogHeader>
        {error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro de Análise</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <div className="max-h-[70vh] overflow-y-auto pr-4">
          <Accordion type="multiple" defaultValue={['transcription']} className="w-full">
            {analysisType === 'content' && (
              <>
                <AccordionItem value="transcription">
                  <AccordionTrigger>Transcrição do Vídeo</AccordionTrigger>
                  <AccordionContent>
                    {isLoadingTranscription ? <LoadingSkeleton /> : transcription ? (
                      <p className="whitespace-pre-wrap text-sm">{transcription.transcription}</p>
                    ) : <p className="text-sm text-muted-foreground">A transcrição aparecerá aqui.</p>}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="content-analysis">
                  <AccordionTrigger>Análise de Conteúdo</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {isLoadingContent ? <LoadingSkeleton /> : contentAnalysis ? (
                      <>
                        <div>
                          <h4 className="font-semibold">Pontos de Dor</h4>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{contentAnalysis.painPoints}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Perguntas Frequentes</h4>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{contentAnalysis.faqs}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Oportunidades de Produto</h4>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{contentAnalysis.productNeeds}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">A análise do conteúdo aparecerá aqui após a transcrição.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </>
            )}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
