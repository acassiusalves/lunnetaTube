
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, Terminal } from 'lucide-react';

import { searchYoutubeVideos } from '@/ai/flows/youtube-search';
import { fetchTopComments } from '@/ai/flows/fetch-comments';
import { analyzeComments as analyzeCommentsAI, AnalyzeCommentsOutput } from '@/ai/flows/analyze-comments';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Video, mapApiToVideo, CommentData } from '@/lib/data';
import { AnalysisViewer } from '@/components/analysis-viewer';
import { analyzeComments } from '@/lib/comment-analyzer';
import { calculateInfoproductScore, type ScoreBreakdown } from '@/lib/infoproduct-score';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';


const API_KEY_STORAGE_ITEM = 'youtube_api_key';
const COMMENT_ANALYSIS_PROMPT_STORAGE_ITEM = 'comment_analysis_prompt';
const AI_MODEL_STORAGE_ITEM = 'ai_model';


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
  const [quantitativeAnalysis, setQuantitativeAnalysis] = useState<any>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);

  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE_ITEM) : null;
  const customPrompt = typeof window !== 'undefined' ? localStorage.getItem(COMMENT_ANALYSIS_PROMPT_STORAGE_ITEM) : null;
  const aiModel = typeof window !== 'undefined' ? localStorage.getItem(AI_MODEL_STORAGE_ITEM) : null;

  useEffect(() => {
    if (!videoId || !apiKey) {
      setError('ID do vídeo ou chave de API não encontrados.');
      setIsLoadingVideo(false);
      return;
    }

    async function fetchVideoDetails() {
      setIsLoadingVideo(true);
      try {
        // This is a temporary solution to fetch a single video by its ID.
        // The YouTube API's `search.list` is not ideal for this. 
        // A direct `videos.list` call with the ID would be more efficient.
        const result = await searchYoutubeVideos({
          apiKey: apiKey!,
          type: 'keyword', 
          keyword: `https://www.youtube.com/watch?v=${videoId}`,
        });
        
        const foundVideo = result.videos?.find((v: any) => v.id === videoId);

        if (foundVideo) {
          setVideo(mapApiToVideo(foundVideo));
          loadComments(true); // Initial load
        } else {
           // Fallback to videos.list if search fails
           const detailsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${apiKey}`);
           const detailsData = await detailsResponse.json();
           if (detailsData.items && detailsData.items.length > 0) {
                setVideo(mapApiToVideo(detailsData.items[0]));
                loadComments(true);
           } else {
                setError('Vídeo não encontrado.');
           }
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
        const newComments = initial ? (result.comments || []) : [...comments, ...(result.comments || [])];
        setComments(newComments);
        setCommentNextPageToken(result.nextPageToken);

        // Calcular análise quantitativa
        if (newComments.length > 0) {
          const quantAnalysis = analyzeComments(newComments);
          setQuantitativeAnalysis(quantAnalysis);

          // Calcular score se tivermos o vídeo
          if (video) {
            const videoWithComments = {
              ...video,
              commentsData: newComments,
              commentAnalysis: quantAnalysis
            };
            const score = calculateInfoproductScore(videoWithComments);
            setScoreBreakdown(score);

            // Notificar quando não for o carregamento inicial
            if (!initial && comments.length > 0) {
              toast({
                title: "Análises Atualizadas",
                description: `Score recalculado com ${newComments.length} comentários. Novo score: ${score.totalScore}/100`,
              });
            }
          }
        }
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
        const result = await analyzeCommentsAI({
            comments: allCommentsText,
            ...(customPrompt && { prompt: customPrompt }),
            ...(aiModel && { model: aiModel }),
        });
        setAnalysis(result);
    } catch(e: any) {
        toast({ title: "Erro na Análise", description: e.message || "Ocorreu um erro inesperado durante a análise.", variant: "destructive" });
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
            <Link href="/buscador-youtube">
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

            {/* Score de Infoproduto */}
            {scoreBreakdown && (
              <Card className="border-soft-blue/20 shadow-lg bg-gradient-to-br from-soft-blue-50/30 to-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-soft-blue-900">Score de Infoproduto</CardTitle>
                      <CardDescription className="text-sm">Oportunidade de criação de produto</CardDescription>
                    </div>
                    <div className={`text-5xl font-bold ${
                      scoreBreakdown.totalScore >= 80 ? 'text-yellow-600' :
                      scoreBreakdown.totalScore >= 65 ? 'text-soft-green-600' :
                      scoreBreakdown.totalScore >= 50 ? 'text-soft-blue-600' :
                      'text-gray-500'
                    }`}>
                      {scoreBreakdown.totalScore}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Badge className={`text-sm px-4 py-1 ${
                      scoreBreakdown.opportunity === 'ouro' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                      scoreBreakdown.opportunity === 'excelente' ? 'bg-gradient-to-r from-soft-green-400 to-soft-green-500 text-white' :
                      scoreBreakdown.opportunity === 'boa' ? 'bg-gradient-to-r from-soft-blue-400 to-soft-blue-500 text-white' :
                      scoreBreakdown.opportunity === 'média' ? 'bg-gray-200 text-gray-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {scoreBreakdown.opportunity === 'ouro' ? '🏆 OPORTUNIDADE DE OURO' :
                       scoreBreakdown.opportunity === 'excelente' ? '⭐ Excelente Oportunidade' :
                       scoreBreakdown.opportunity === 'boa' ? 'Boa Oportunidade' :
                       scoreBreakdown.opportunity === 'média' ? 'Oportunidade Média' :
                       'Oportunidade Baixa'}
                    </Badge>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-soft-blue-700">Engajamento</span>
                        <span className="font-semibold">{scoreBreakdown.engagementScore}/30</span>
                      </div>
                      <Progress value={(scoreBreakdown.engagementScore / 30) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{scoreBreakdown.breakdown.engagement}</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-orange-700">Análise de Comentários</span>
                        <span className="font-semibold">{scoreBreakdown.commentAnalysisScore}/25</span>
                      </div>
                      <Progress value={(scoreBreakdown.commentAnalysisScore / 25) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{scoreBreakdown.breakdown.commentAnalysis}</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-soft-green-700">Crescimento</span>
                        <span className="font-semibold">{scoreBreakdown.growthScore}/10</span>
                      </div>
                      <Progress value={(scoreBreakdown.growthScore / 10) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{scoreBreakdown.breakdown.growth}</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-purple-700">Canal</span>
                        <span className="font-semibold">{scoreBreakdown.channelScore}/10</span>
                      </div>
                      <Progress value={(scoreBreakdown.channelScore / 10) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{scoreBreakdown.breakdown.channel}</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-700">Qualidade do Conteúdo</span>
                        <span className="font-semibold">{scoreBreakdown.contentQualityScore}/25</span>
                      </div>
                      <Progress value={(scoreBreakdown.contentQualityScore / 25) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{scoreBreakdown.breakdown.contentQuality}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Análise Quantitativa */}
            {quantitativeAnalysis && (
              <Card className="border-soft-green/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-soft-green-900">Análise Quantitativa</CardTitle>
                  <CardDescription className="text-sm">Métricas extraídas de {quantitativeAnalysis.totalComments} comentários</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gradient-to-br from-soft-blue-50 to-white rounded-lg border border-soft-blue-200">
                      <div className="text-2xl font-bold text-soft-blue-600">{quantitativeAnalysis.questionsCount}</div>
                      <div className="text-xs text-muted-foreground mt-1">Perguntas</div>
                      <div className="text-xs font-semibold text-soft-blue-600">{quantitativeAnalysis.questionDensity.toFixed(1)}%</div>
                    </div>

                    <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-orange-600">{quantitativeAnalysis.materialRequestsCount}</div>
                      <div className="text-xs text-muted-foreground mt-1">Pedidos</div>
                      <div className="text-xs font-semibold text-orange-600">{quantitativeAnalysis.materialRequestDensity.toFixed(1)}%</div>
                    </div>

                    <div className="text-center p-3 bg-gradient-to-br from-red-50 to-white rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{quantitativeAnalysis.problemStatementsCount}</div>
                      <div className="text-xs text-muted-foreground mt-1">Problemas</div>
                    </div>

                    <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-white rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{quantitativeAnalysis.unansweredQuestionsCount}</div>
                      <div className="text-xs text-muted-foreground mt-1">Não Respondidas</div>
                    </div>
                  </div>

                  {quantitativeAnalysis.topMaterialRequests.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2 text-orange-900">Top Pedidos de Material</h4>
                      <div className="space-y-1">
                        {quantitativeAnalysis.topMaterialRequests.slice(0, 3).map((req: any, idx: number) => (
                          <div key={idx} className="text-xs p-2 bg-orange-50 rounded">
                            <span className="font-medium">{req.materialType}:</span> {req.text.substring(0, 80)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Análise Qualitativa com IA</CardTitle>
                    <CardDescription>Analise os comentários com IA para extrair insights qualitativos e ideias de produtos</CardDescription>
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
                            <h4 className="font-semibold">Resultado da Análise</h4>
                            <AnalysisViewer data={analysis} videoId={videoId as string} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Coluna Direita: Comentários */}
        <div className="lg:col-span-2 space-y-6">
            {/* Indicador de Progresso de Comentários */}
            {comments.length > 0 && (
              <Card className="border-soft-blue/20 bg-gradient-to-r from-soft-blue-50/30 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-2xl font-bold text-soft-blue-600">{comments.length}</div>
                      <div className="text-xs text-muted-foreground">comentários carregados de {formatNumber(video.comments)} totais</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-soft-blue-700">
                        {((comments.length / video.comments) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">do total</div>
                    </div>
                  </div>
                  <Progress value={(comments.length / video.comments) * 100} className="h-2" />
                  {commentNextPageToken && (
                    <div className="mt-3 text-center">
                      <Button
                        onClick={() => loadComments(false)}
                        disabled={isLoadingMoreComments}
                        size="sm"
                        className="bg-gradient-to-r from-soft-blue-500 to-soft-blue-600 text-white hover:from-soft-blue-600 hover:to-soft-blue-700"
                      >
                        {isLoadingMoreComments ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Carregando mais 100 comentários...
                          </>
                        ) : (
                          <>
                            Carregar Mais 100 Comentários
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        ℹ️ O score e análises serão atualizados automaticamente
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Comentários</CardTitle>
                    <CardDescription>
                        Comentários mais relevantes ordenados por engajamento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingComments ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Nenhum comentário encontrado.</p>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {comments.map((comment, index) => (
                                <div key={index} className="flex items-start gap-3 text-sm p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <img src={comment.authorImageUrl} alt={comment.author} className="h-8 w-8 rounded-full border" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="font-semibold text-sm">{comment.author}</p>
                                          {comment.likeCount && comment.likeCount > 0 && (
                                            <span className="text-xs text-muted-foreground">👍 {comment.likeCount}</span>
                                          )}
                                        </div>
                                        <p className="text-muted-foreground whitespace-pre-wrap break-words">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
