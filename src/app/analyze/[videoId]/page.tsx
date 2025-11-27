
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, Terminal, TrendingUp, Users, Target, MessageSquare, AlertTriangle, BarChart3, Zap, Brain, Cloud, Award, ChevronDown, ChevronUp } from 'lucide-react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  performAdvancedAnalysis,
  type AdvancedCommentAnalysis,
  type PainPointAnalysis,
  type RecurrenceAnalysis,
  type ObjectionAnalysis,
  type AwarenessAnalysis,
  type WordCloudAnalysis,
  type CompetitorAnalysis,
  type SegmentationAnalysis,
} from '@/lib/advanced-comment-analyzer';


const API_KEY_STORAGE_ITEM = 'youtube_api_key';
const COMMENT_ANALYSIS_PROMPT_STORAGE_ITEM = 'comment_analysis_prompt';
const AI_MODEL_STORAGE_ITEM = 'ai_model';


function formatNumber(num: number) {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(num);
}

// Funções de tradução para termos em inglês
const translatePainType = (type: string): string => {
  const translations: Record<string, string> = {
    'financial': 'Financeira',
    'time': 'Tempo',
    'knowledge': 'Conhecimento',
    'frustration': 'Frustração',
    'emotional': 'Emocional',
    'technical': 'Técnica',
    'access': 'Acesso',
  };
  return translations[type] || type;
};

const translateRecurrenceType = (type: string): string => {
  const translations: Record<string, string> = {
    'automation': 'Automação',
    'community': 'Comunidade',
    'updates': 'Atualizações',
    'monitoring': 'Monitoramento',
    'templates': 'Templates',
    'support': 'Suporte',
  };
  return translations[type] || type;
};

const translateObjectionType = (type: string): string => {
  const translations: Record<string, string> = {
    'price': 'Preço',
    'trust': 'Confiança',
    'time': 'Tempo',
    'relevance': 'Relevância',
    'complexity': 'Complexidade',
    'competition': 'Competição',
  };
  return translations[type] || type;
};

const translateAwarenessLevel = (level: string): string => {
  const translations: Record<string, string> = {
    'unaware': 'Inconsciente',
    'problem-aware': 'Consciente do Problema',
    'solution-aware': 'Consciente da Solução',
    'product-aware': 'Consciente do Produto',
    'most-aware': 'Mais Consciente',
  };
  return translations[level] || level;
};

const translateCompetitorContext = (context: string): string => {
  const translations: Record<string, string> = {
    'positive': 'Positivo',
    'negative': 'Negativo',
    'neutral': 'Neutro',
    'comparison': 'Comparação',
  };
  return translations[context] || context;
};

const translateIntensity = (intensity: string): string => {
  const translations: Record<string, string> = {
    'high': 'Alta',
    'medium': 'Média',
    'low': 'Baixa',
  };
  return translations[intensity] || intensity;
};

export default function AnalyzeVideoPage() {
  const { videoId } = useParams();
  const { toast } = useToast();

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentNextPageToken, setCommentNextPageToken] = useState<string | undefined | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeCommentsOutput | null>(null);
  const [quantitativeAnalysis, setQuantitativeAnalysis] = useState<any>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [advancedAnalysis, setAdvancedAnalysis] = useState<AdvancedCommentAnalysis | null>(null);

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

          // Calcular análise avançada
          const advAnalysis = performAdvancedAnalysis(newComments);
          setAdvancedAnalysis(advAnalysis);

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

            {/* Análises Avançadas */}
            {advancedAnalysis && comments.length > 0 && (
              <Card className="border-purple-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg text-purple-900">Análises Avançadas de Comentários</CardTitle>
                  </div>
                  <CardDescription>Insights extraídos de {comments.length} comentários para criação de produtos</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pain-points" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto gap-1">
                      <TabsTrigger value="pain-points" className="text-xs px-2 py-1.5">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Dores
                      </TabsTrigger>
                      <TabsTrigger value="recurrence" className="text-xs px-2 py-1.5">
                        <Zap className="h-3 w-3 mr-1" />
                        SaaS
                      </TabsTrigger>
                      <TabsTrigger value="objections" className="text-xs px-2 py-1.5">
                        <Target className="h-3 w-3 mr-1" />
                        Objeções
                      </TabsTrigger>
                      <TabsTrigger value="awareness" className="text-xs px-2 py-1.5">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Funil
                      </TabsTrigger>
                      <TabsTrigger value="wordcloud" className="text-xs px-2 py-1.5">
                        <Cloud className="h-3 w-3 mr-1" />
                        Palavras
                      </TabsTrigger>
                      <TabsTrigger value="competitors" className="text-xs px-2 py-1.5">
                        <Award className="h-3 w-3 mr-1" />
                        Competidores
                      </TabsTrigger>
                      <TabsTrigger value="segments" className="text-xs px-2 py-1.5">
                        <Users className="h-3 w-3 mr-1" />
                        Público
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab: Dores Profundas */}
                    <TabsContent value="pain-points" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-gradient-to-br from-red-50 to-white rounded-lg border border-red-200">
                          <div className="text-2xl font-bold text-red-600">{advancedAnalysis.painPoints.totalPainPoints}</div>
                          <div className="text-xs text-muted-foreground">Total de Dores</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-200">
                          <div className="text-2xl font-bold text-orange-600">{advancedAnalysis.painPoints.painPointDensity.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Densidade</div>
                        </div>
                        <div className="col-span-2 p-3 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-200">
                          <div className="text-sm font-semibold text-purple-700">Dor Dominante: {translatePainType(advancedAnalysis.painPoints.dominantPainType)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {advancedAnalysis.painPoints.dominantPainType === 'financial' && 'Audiência tem problemas financeiros'}
                            {advancedAnalysis.painPoints.dominantPainType === 'time' && 'Audiência sofre com falta de tempo'}
                            {advancedAnalysis.painPoints.dominantPainType === 'knowledge' && 'Audiência precisa de mais conhecimento'}
                            {advancedAnalysis.painPoints.dominantPainType === 'frustration' && 'Audiência está frustrada com soluções atuais'}
                            {advancedAnalysis.painPoints.dominantPainType === 'emotional' && 'Audiência tem dores emocionais'}
                            {advancedAnalysis.painPoints.dominantPainType === 'technical' && 'Audiência enfrenta problemas técnicos'}
                            {advancedAnalysis.painPoints.dominantPainType === 'access' && 'Audiência tem dificuldade de acesso'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-red-900">Distribuição por Tipo de Dor</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(advancedAnalysis.painPoints.painPointsByType).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                              <span>{translatePainType(type)}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {advancedAnalysis.painPoints.topPainPoints.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-red-900">Top Comentários com Dores (por likes)</h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {advancedAnalysis.painPoints.topPainPoints.slice(0, 8).map((pain, idx) => (
                              <div key={idx} className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={pain.intensity === 'high' ? 'destructive' : pain.intensity === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                    {translatePainType(pain.type)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {pain.intensity === 'high' ? '🔥 Alta' : pain.intensity === 'medium' ? '⚡ Média' : '💧 Baixa'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground ml-auto">👍 {pain.likeCount}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{pain.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab: Micro-SaaS / Recorrência */}
                    <TabsContent value="recurrence" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-600">{advancedAnalysis.recurrence.totalOpportunities}</div>
                          <div className="text-xs text-muted-foreground">Oportunidades Identificadas</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-white rounded-lg border border-emerald-200">
                          <div className={`text-2xl font-bold ${advancedAnalysis.recurrence.hasStrongRecurrencePotential ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {advancedAnalysis.recurrence.hasStrongRecurrencePotential ? '✓ SIM' : '✗ NÃO'}
                          </div>
                          <div className="text-xs text-muted-foreground">Potencial de Recorrência</div>
                        </div>
                      </div>

                      {advancedAnalysis.recurrence.suggestedModels.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-sm text-green-900 mb-2">💡 Modelos de Negócio Sugeridos</h4>
                          <div className="space-y-1">
                            {advancedAnalysis.recurrence.suggestedModels.map((model, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="text-green-600">•</span>
                                <span>{model}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-green-900">Distribuição por Tipo de Oportunidade</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(advancedAnalysis.recurrence.opportunitiesByType).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between p-2 bg-green-50/50 rounded text-xs border border-green-100">
                              <span>{translateRecurrenceType(type)}</span>
                              <Badge variant="outline" className="bg-white">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {advancedAnalysis.recurrence.topOpportunities.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-green-900">Top Oportunidades</h4>
                          <div className="space-y-2 max-h-[250px] overflow-y-auto">
                            {advancedAnalysis.recurrence.topOpportunities.slice(0, 6).map((opp, idx) => (
                              <div key={idx} className="p-3 bg-green-50/50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-200">{translateRecurrenceType(opp.type)}</Badge>
                                  <Badge variant={opp.potentialMRR === 'high' ? 'default' : 'secondary'} className="text-xs">
                                    Potencial: {opp.potentialMRR === 'high' ? 'Alto' : opp.potentialMRR === 'medium' ? 'Médio' : 'Baixo'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground ml-auto">👍 {opp.likeCount}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{opp.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab: Objeções */}
                    <TabsContent value="objections" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-white rounded-lg border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-600">{advancedAnalysis.objections.totalObjections}</div>
                          <div className="text-xs text-muted-foreground">Total de Objeções</div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-amber-50 to-white rounded-lg border border-amber-200">
                          <div className="text-sm font-semibold text-amber-700">Principal: {translateObjectionType(advancedAnalysis.objections.mainObjection)}</div>
                          <div className="text-xs text-muted-foreground mt-1">Objeção mais frequente</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-yellow-900">Distribuição por Tipo de Objeção</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(advancedAnalysis.objections.objectionsByType).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between p-2 bg-yellow-50/50 rounded text-xs border border-yellow-100">
                              <span>{translateObjectionType(type)}</span>
                              <Badge variant="outline" className="bg-white">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {advancedAnalysis.objections.topObjections.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-yellow-900">Top Objeções com Sugestões de Resposta</h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {advancedAnalysis.objections.topObjections.slice(0, 6).map((obj, idx) => (
                              <div key={idx} className="p-3 bg-yellow-50/50 rounded-lg border border-yellow-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="text-xs bg-yellow-100 text-yellow-800">{translateObjectionType(obj.type)}</Badge>
                                  <span className="text-xs text-muted-foreground ml-auto">👍 {obj.likeCount}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{obj.text}</p>
                                <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                                  💡 <strong>Sugestão:</strong> {obj.suggestedResponse}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab: Nível de Consciência */}
                    <TabsContent value="awareness" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
                          <div className="text-sm font-semibold text-blue-700">Nível Dominante: {translateAwarenessLevel(advancedAnalysis.awareness.dominantLevel)}</div>
                          <div className="text-xs text-muted-foreground mt-1">{advancedAnalysis.awareness.recommendation}</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-white rounded-lg border border-indigo-200">
                          <div className={`text-2xl font-bold ${
                            advancedAnalysis.awareness.funnelHealth === 'hot' ? 'text-red-500' :
                            advancedAnalysis.awareness.funnelHealth === 'warm' ? 'text-orange-500' :
                            advancedAnalysis.awareness.funnelHealth === 'warming' ? 'text-yellow-500' :
                            'text-blue-500'
                          }`}>
                            {advancedAnalysis.awareness.funnelHealth === 'hot' ? '🔥 Quente' :
                             advancedAnalysis.awareness.funnelHealth === 'warm' ? '☀️ Morno' :
                             advancedAnalysis.awareness.funnelHealth === 'warming' ? '🌤️ Aquecendo' :
                             '❄️ Frio'}
                          </div>
                          <div className="text-xs text-muted-foreground">Saúde do Funil</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-blue-900">Pirâmide de Consciência</h4>
                        {advancedAnalysis.awareness.levels.map((level) => (
                          <div key={level.level} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{translateAwarenessLevel(level.level)}</span>
                              <span className="text-muted-foreground">{level.count} ({level.percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={level.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>

                      <Alert className="bg-blue-50 border-blue-200">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-900">Recomendação de Conteúdo</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          {advancedAnalysis.awareness.recommendation}
                        </AlertDescription>
                      </Alert>
                    </TabsContent>

                    {/* Tab: Word Cloud */}
                    <TabsContent value="wordcloud" className="mt-4 space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm text-purple-900 mb-2">Palavras Mais Frequentes</h4>
                          <div className="flex flex-wrap gap-2">
                            {advancedAnalysis.wordCloud.topWords.slice(0, 20).map((word, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="transition-all"
                                style={{
                                  fontSize: `${Math.max(10, Math.min(18, 10 + word.relevance / 10))}px`,
                                  opacity: Math.max(0.5, word.relevance / 100)
                                }}
                              >
                                {word.word} ({word.count})
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-semibold text-sm text-purple-900 mb-2">Bigramas (Pares de Palavras)</h4>
                          <div className="flex flex-wrap gap-2">
                            {advancedAnalysis.wordCloud.topBigrams.slice(0, 15).map((bigram, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {bigram.word} ({bigram.count})
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <h5 className="font-semibold text-xs text-blue-900 mb-2">🎯 Ações</h5>
                            <div className="flex flex-wrap gap-1">
                              {advancedAnalysis.wordCloud.categories.actions.slice(0, 6).map((w, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-white">{w.word}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
                            <h5 className="font-semibold text-xs text-green-900 mb-2">📦 Objetos</h5>
                            <div className="flex flex-wrap gap-1">
                              {advancedAnalysis.wordCloud.categories.objects.slice(0, 6).map((w, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-white">{w.word}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-pink-50/50 rounded-lg border border-pink-100">
                            <h5 className="font-semibold text-xs text-pink-900 mb-2">💭 Emoções</h5>
                            <div className="flex flex-wrap gap-1">
                              {advancedAnalysis.wordCloud.categories.emotions.slice(0, 6).map((w, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-white">{w.word}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab: Competidores */}
                    <TabsContent value="competitors" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-200">
                          <div className="text-2xl font-bold text-orange-600">{advancedAnalysis.competitors.totalMentions}</div>
                          <div className="text-xs text-muted-foreground">Menções a Competidores</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-white rounded-lg border border-amber-200">
                          <div className="text-2xl font-bold text-amber-600">{advancedAnalysis.competitors.competitors.length}</div>
                          <div className="text-xs text-muted-foreground">Competidores Identificados</div>
                        </div>
                      </div>

                      {advancedAnalysis.competitors.competitiveInsights.length > 0 && (
                        <Alert className="bg-orange-50 border-orange-200">
                          <Award className="h-4 w-4 text-orange-600" />
                          <AlertTitle className="text-orange-900">Insights Competitivos</AlertTitle>
                          <AlertDescription className="text-orange-700">
                            <ul className="list-disc list-inside space-y-1">
                              {advancedAnalysis.competitors.competitiveInsights.map((insight, idx) => (
                                <li key={idx}>{insight}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {advancedAnalysis.competitors.competitors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-orange-900">Competidores Mencionados</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {advancedAnalysis.competitors.competitors.map((comp, idx) => (
                              <div key={idx} className="p-2 bg-orange-50/50 rounded border border-orange-100 text-sm">
                                <div className="font-medium capitalize">{comp.name}</div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{comp.mentions} menções</span>
                                  <Badge variant="outline" className={`text-xs ${
                                    comp.sentiment === 'positivo' ? 'border-green-300 text-green-700' :
                                    comp.sentiment === 'negativo' ? 'border-red-300 text-red-700' :
                                    'border-gray-300'
                                  }`}>
                                    {comp.sentiment}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {advancedAnalysis.competitors.topMentions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-orange-900">Top Menções</h4>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {advancedAnalysis.competitors.topMentions.slice(0, 5).map((mention, idx) => (
                              <div key={idx} className="p-2 bg-orange-50/30 rounded text-sm border border-orange-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">{mention.name}</Badge>
                                  <Badge className={`text-xs ${
                                    mention.context === 'positive' ? 'bg-green-100 text-green-800' :
                                    mention.context === 'negative' ? 'bg-red-100 text-red-800' :
                                    mention.context === 'comparison' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {translateCompetitorContext(mention.context)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground ml-auto">👍 {mention.likeCount}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{mention.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {advancedAnalysis.competitors.totalMentions === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Award className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>Nenhuma menção a competidores encontrada nos comentários.</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab: Segmentação de Público */}
                    <TabsContent value="segments" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gradient-to-br from-violet-50 to-white rounded-lg border border-violet-200">
                          <div className="text-sm font-semibold text-violet-700">Segmento Dominante: {advancedAnalysis.segmentation.dominantSegment}</div>
                          <div className="text-xs text-muted-foreground mt-1">Maior parte da audiência</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-fuchsia-50 to-white rounded-lg border border-fuchsia-200">
                          <div className="text-2xl font-bold text-fuchsia-600">{advancedAnalysis.segmentation.diversityScore.toFixed(0)}%</div>
                          <div className="text-xs text-muted-foreground">Diversidade de Público</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-violet-900">Segmentos Identificados</h4>
                        {advancedAnalysis.segmentation.segments.filter(s => s.count > 0).map((segment) => (
                          <div key={segment.segment} className="p-3 bg-violet-50/30 rounded-lg border border-violet-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{segment.segment}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{segment.count} comentários</span>
                                <Badge variant="outline">{segment.percentage.toFixed(1)}%</Badge>
                              </div>
                            </div>
                            <Progress value={segment.percentage} className="h-1.5 mb-2" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <div className="p-2 bg-white/50 rounded">
                                <span className="font-medium text-violet-700">Características:</span>
                                <ul className="list-disc list-inside text-muted-foreground mt-1">
                                  {segment.characteristics.map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-2 bg-green-50/50 rounded">
                                <span className="font-medium text-green-700">Produto Recomendado:</span>
                                <p className="text-muted-foreground mt-1">{segment.productRecommendation}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {advancedAnalysis.segmentation.segments.filter(s => s.count > 0).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>Não foi possível identificar segmentos específicos nos comentários.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
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
