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
import {
  analyzeComments,
  type AnalyzeCommentsOutput,
} from "@/ai/flows/analyze-comments";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";

interface AnalysisDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  video: Video;
  analysisType: "content" | "comments";
}

const mockCommentData = "These are some great insights! I'd love to see a follow-up on point #3. Could you also explain how this applies to e-commerce? This is super helpful, thank you for sharing. I disagree with the main premise, I think there are better ways to approach this. What tool did you use at 5:32?";

export function AnalysisDialog({ isOpen, setIsOpen, video, analysisType }: AnalysisDialogProps) {
  const [transcription, setTranscription] = useState<TranscribeVideoOutput | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<AnalyzeTranscriptOutput | null>(null);
  const [commentAnalysis, setCommentAnalysis] = useState<AnalyzeCommentsOutput | null>(null);
  
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
      setTranscription(null);
      setContentAnalysis(null);
      setCommentAnalysis(null);
      setIsLoadingTranscription(false);
      setIsLoadingContent(false);
      setIsLoadingComments(false);
      setError(null);
  };

  useEffect(() => {
    if (isOpen) {
        resetState();

        const runAnalysis = async () => {
            try {
                if (analysisType === 'content') {
                    setIsLoadingTranscription(true);
                    // In a real app, you would fetch the video file and convert to data URI
                    const fakeVideoDataUri = "data:video/mp4;base64,AAAA...';";
                    const transcriptionResult = await transcribeVideo({ videoDataUri: fakeVideoDataUri });
                    setTranscription(transcriptionResult);
                    setIsLoadingTranscription(false);

                    setIsLoadingContent(true);
                    const contentAnalysisResult = await analyzeTranscript({ transcript: transcriptionResult.transcription });
                    setContentAnalysis(contentAnalysisResult);
                    setIsLoadingContent(false);

                } else if (analysisType === 'comments') {
                    setIsLoadingComments(true);
                    // In a real app, you would fetch comments from the YouTube API
                    const commentsResult = await analyzeComments({ comments: mockCommentData });
                    setCommentAnalysis(commentsResult);
                    setIsLoadingComments(false);
                }
            } catch (e) {
                console.error(e);
                setError("An error occurred during analysis. This is a mock error, as AI features require configuration.");
                setIsLoadingTranscription(false);
                setIsLoadingContent(false);
                setIsLoadingComments(false);
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
          <DialogTitle>AI Analysis: {video.title}</DialogTitle>
        </DialogHeader>
        {error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Analysis Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <div className="max-h-[70vh] overflow-y-auto pr-4">
          <Accordion type="multiple" defaultValue={analysisType === 'content' ? ['transcription'] : ['comment-analysis']} className="w-full">
            {analysisType === 'content' && (
              <>
                <AccordionItem value="transcription">
                  <AccordionTrigger>Video Transcription</AccordionTrigger>
                  <AccordionContent>
                    {isLoadingTranscription ? <LoadingSkeleton /> : <p className="whitespace-pre-wrap text-sm">{transcription?.transcription}</p>}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="content-analysis">
                  <AccordionTrigger>Content Analysis</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {isLoadingContent ? <LoadingSkeleton /> : (
                      <>
                        <div>
                          <h4 className="font-semibold">Pain Points</h4>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{contentAnalysis?.painPoints}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Frequently Asked Questions</h4>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{contentAnalysis?.faqs}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Product Opportunities</h4>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{contentAnalysis?.productNeeds}</p>
                        </div>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </>
            )}
            {analysisType === 'comments' && (
              <AccordionItem value="comment-analysis">
                <AccordionTrigger>Comment Analysis</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {isLoadingComments ? <LoadingSkeleton /> : (
                    <>
                      <div>
                        <h4 className="font-semibold">Overall Sentiment</h4>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{commentAnalysis?.sentiment}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Key Themes</h4>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{commentAnalysis?.keyThemes}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Summary</h4>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{commentAnalysis?.summary}</p>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
