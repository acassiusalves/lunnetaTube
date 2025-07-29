
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, Terminal } from 'lucide-react';

import { searchYoutubeVideos } from '@/ai/flows/youtube-search';
import { fetchTopComments } from '@/ai/flows/fetch-comments';
import { analyzeComments, AnalyzeCommentsOutput } from '@/ai/flows/analyze-comments';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Video, mapApiToVideo, CommentData } from '@/lib/data';

const API_KEY_STORAGE_ITEM = 'youtube_api_key';

function formatNumber(num: number) {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(num);
}

export default function AnalyzeVideoPage() {
  const { videoId } = useParams();
  const { toast } = useToast();

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentNextPageToken, setCommentNextPageToken] = useState<string | undefined | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeCommentsOutput | null>(null);

  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE_ITEM) : null;

  useEffect(() => {
    if (!videoId || !apiKey) {
      setError('ID do vídeo ou chave de API não encontrados.');
      setIsLoadingVideo(false);
      return;
    }

    async function fetchVideoDetails() {
      setIsLoadingVideo(true);
      try {
        const result = await searchYoutubeVideos({
          apiKey: apiKey!,
          type: 'keyword', // Not ideal, but the API needs a type. We search by ID.
          keyword: videoId as string, // This will return the video if we search its ID.
        });
        
        // This is a bit of a hack since the search API isn't designed for direct ID lookups.
        // A better approach would be a dedicated `videos.list` call.
        const foundVideo = result.videos?.find((v: any) => v.id === videoId);

        if (foundVideo) {
          setVideo(mapApiToVideo(foundVideo));
          loadComments(true); // Initial load
        } else {
          setError('Vídeo não encontrado.');
        }
      } catch (e: any) {
        setError(e.message || 'Erro ao buscar detalhes do vídeo.');
      } finally {
        setIsLoadingVideo(false);
      }
    }

    fetchVideoDetails();
  }, [videoId, apiKey]);


  async function loadComments(initial = false) {
    if (!apiKey || !videoId) return;
    if (initial) {
      setIsLoadingComments(true);
    } else {
      setIsLoadingMoreComments(true);
    }
    
    try {
      const result = await fetchTopComments({
        apiKey,
        videoId: videoId as string,
        maxResults: 100,
        pageToken: initial ? undefined : commentNextPageToken || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setComments(prev => initial ? (result.comments || []) : [...prev, ...(result.comments || [])]);
        setCommentNextPageToken(result.nextPageToken);
      }
    } catch (e: any) {
        setError(e.message || 'Erro ao buscar comentários.');
    } finally {
        setIsLoadingComments(false);
        setIsLoadingMoreComments(false);
    }
  }

  async function handleAnalyzeComments() {
    if (comments.length === 0) {
        toast({ title: "Nenhum comentário para analisar", variant: "destructive" });
        return;
    }
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
        const allCommentsText = comments.map(c => c.text).join('\n\n---\n\n');
        const result = await analyzeComments({ comments: allCommentsText });
        setAnalysis(result);
    } catch(e: any) {
        toast({ title: "Erro na Análise", description: e.message, variant: "destructive" });
    } finally {
        setIsAnalyzing(false);
    }
  }


  if (isLoadingVideo) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!video) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Painel
            </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Coluna Esquerda: Detalhes e Análise */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <img src={video.snippet.thumbnails.high.url} alt={video.title} className="rounded-lg w-full" />
                    <CardTitle className="pt-4">{video.title}</CardTitle>
                    <CardDescription>{video.channel}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 rounded-md bg-muted">
                        <div className="font-bold">{formatNumber(video.views)}</div>
                        <div className="text-muted-foreground">Visualizações</div>
                    </div>
                     <div className="text-center p-2 rounded-md bg-muted">
                        <div className="font-bold">{formatNumber(video.likes)}</div>
                        <div className="text-muted-foreground">Likes</div>
                    </div>
                     <div className="text-center p-2 rounded-md bg-muted">
                        <div className="font-bold">{formatNumber(video.comments)}</div>
                        <div className="text-muted-foreground">Comentários</div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Análise de IA</CardTitle>
                    <CardDescription>Analise os comentários carregados para extrair insights.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleAnalyzeComments} disabled={isAnalyzing || comments.length === 0} className="w-full">
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Analisar {comments.length} Comentários
                    </Button>
                    
                    {isAnalyzing && <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>}

                    {analysis && (
                        <div className="mt-6 space-y-4 text-sm">
                            <div>
                                <h4 className="font-semibold">Sentimento Geral</h4>
                                <p className="text-muted-foreground">{analysis.sentiment}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Temas Principais</h4>
                                <p className="text-muted-foreground whitespace-pre-wrap">{analysis.keyThemes}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Resumo</h4>
                                <p className="text-muted-foreground whitespace-pre-wrap">{analysis.summary}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Coluna Direita: Comentários */}
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Comentários</CardTitle>
                    <CardDescription>
                        Explore os comentários mais relevantes do vídeo. Carregados: {comments.length} de {formatNumber(video.comments)}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingComments ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-muted-foreground">Nenhum comentário encontrado.</p>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment, index) => (
                                <div key={index} className="flex items-start gap-3 text-sm">
                                    <img src={comment.authorImageUrl} alt={comment.author} className="h-8 w-8 rounded-full border" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{comment.author}</p>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {commentNextPageToken && (
                        <div className="mt-6 flex justify-center">
                            <Button onClick={() => loadComments(false)} disabled={isLoadingMoreComments} variant="outline">
                                {isLoadingMoreComments && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Carregar Mais
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

