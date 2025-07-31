
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
  fetchTranscript,
  type FetchTranscriptOutput,
} from "@/ai/flows/fetch-transcript";
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
}

const API_KEY_STORAGE_ITEM = 'youtube_api_key';

export function AnalysisDialog({ isOpen, setIsOpen, video }: AnalysisDialogProps) {
  const [transcription, setTranscription] = useState<FetchTranscriptOutput | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<AnalyzeTranscriptOutput | null>(null);
  
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE_ITEM) : null;

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
            if (!apiKey) {
                setError("Chave de API do YouTube não encontrada. Adicione-a nas Configurações.");
                return;
            }
            try {
                setIsLoadingTranscription(true);
                const transcriptionResult = await fetchTranscript({ videoId: video.id, apiKey });
                
                if (transcriptionResult.error) {
                    setError(transcriptionResult.error);
                    setTranscription(null);
                } else {
                    setTranscription(transcriptionResult);
                    setIsLoadingContent(true);
                    const contentAnalysisResult = await analyzeTranscript({ transcript: transcriptionResult.transcript! });
                    setContentAnalysis(contentAnalysisResult);
                }

            } catch (e: any) {
                console.error(e);
                setError(e.message || "Ocorreu um erro inesperado durante a análise.");
            } finally {
                setIsLoadingTranscription(false);
                setIsLoadingContent(false);
            }
        };
        runAnalysis();
    }
  }, [isOpen, video, apiKey]);

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
          <DialogTitle>Análise de Conteúdo: {video.title}</DialogTitle>
        </DialogHeader>
        {error && !isLoadingTranscription && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro na Análise</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <div className="max-h-[70vh] overflow-y-auto pr-4">
          <Accordion type="multiple" defaultValue={['transcription', 'content-analysis']} className="w-full">
            <AccordionItem value="transcription">
                <AccordionTrigger>Transcrição do Vídeo</AccordionTrigger>
                <AccordionContent>
                {isLoadingTranscription ? <LoadingSkeleton /> : transcription?.transcript ? (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{transcription.transcript}</p>
                ) : <p className="text-sm text-muted-foreground">Aguardando transcrição...</p>}
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
                    <p className="text-sm text-muted-foreground">A análise do conteúdo aparecerá aqui após a obtenção da transcrição.</p>
                )}
                </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
