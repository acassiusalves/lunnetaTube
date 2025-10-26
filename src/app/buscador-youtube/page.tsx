
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Video, mapApiToVideo, CommentData } from "@/lib/data";
import { VideoTable, type SortConfig } from "@/components/dashboard/video-table";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Terminal, Sparkles } from "lucide-react";
import { searchYoutubeVideos } from "@/ai/flows/youtube-search";
import { fetchTopComments } from "@/ai/flows/fetch-comments";
import { analyzeVideoPotential } from "@/ai/flows/analyze-video-potential";
import { analyzeComments } from "@/lib/comment-analyzer";
import { addInfoproductScore } from "@/lib/infoproduct-score";
import { analyzeTrends, type TrendAnalysis } from "@/lib/trends-analyzer";
import { TrendsPanel } from "@/components/dashboard/trends-panel";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSearch } from "@/context/SearchContext";
import type { SearchParams } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/lib/data";
import { LoadingState } from "@/components/dashboard/loading-state";

const API_KEY_STORAGE_ITEM = "youtube_api_key";

type LoadingStatus = {
  active: boolean;
  message: string;
  progress: number;
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { searchState, setSearchState, clearSearchState } = useSearch();

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({ active: false, message: '', progress: 0 });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'views', direction: 'descending' });
    
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrends, setShowTrends] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);

  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Form state for keyword search
  const [keyword, setKeyword] = useState(searchState.searchParams?.keyword || '');
  const [country, setCountry] = useState(searchState.searchParams?.country || 'br');
  const [minViews, setMinViews] = useState(String(searchState.searchParams?.minViews || 100000));
  const [excludeShorts, setExcludeShorts] = useState(searchState.searchParams?.excludeShorts || false);
  const [dateFilter, setDateFilter] = useState<string>(searchState.searchParams?.publishedAfter ? 'custom' : 'any');
  const [order, setOrder] = useState<'relevance' | 'date' | 'rating' | 'viewCount' | 'title'>(searchState.searchParams?.order || 'relevance');

  // Restore scroll position on mount
  useEffect(() => {
    if (mainContainerRef.current && searchState.scrollPosition > 0) {
      mainContainerRef.current.scrollTop = searchState.scrollPosition;
    }
  }, []);

  // Save scroll position on unmount
  useEffect(() => {
    const handleScroll = () => {
      if (mainContainerRef.current) {
        setSearchState(prev => ({ ...prev, scrollPosition: mainContainerRef.current!.scrollTop }));
      }
    };
    
    const currentRef = mainContainerRef.current;
    currentRef?.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      currentRef?.removeEventListener('scroll', handleScroll);
    };
  }, [setSearchState]);
  

  const handleSearch = async (params: SearchParams) => {
    clearSearchState();
    setError(null);
    setLoadingStatus({ active: true, message: 'Traduzindo termo e buscando vídeos...', progress: 20 });

    const apiKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
    if (!apiKey) {
      setError("Chave de API do YouTube não encontrada. Por favor, adicione-a na página de Configurações.");
      setLoadingStatus({ active: false, message: '', progress: 0 });
      return;
    }

    try {
      // Step 1: Fetch videos from YouTube (which now includes translation)
      const result = await searchYoutubeVideos({ ...params, apiKey, skipAiAnalysis: true });
      if (result.error) {
        setError(result.error);
        clearSearchState();
        setLoadingStatus({ active: false, message: '', progress: 0 });
        return;
      }

      let fetchedVideos = result.videos?.map(mapApiToVideo) || [];
      const nextPageToken = result.nextPageToken;
      setSearchState({ videos: fetchedVideos, searchParams: params, nextPageToken, scrollPosition: 0 });

      // Step 2: Analyze videos with AI
      setLoadingStatus({ active: true, message: 'Analisando resultados com IA...', progress: 40 });
      const videosForAnalysis = fetchedVideos.map(v => ({
          id: v.id,
          title: v.title,
          description: v.snippet?.description || '',
      }));

      const analysisResult = await analyzeVideoPotential({ videos: videosForAnalysis, keyword: params.keyword! });

      if (analysisResult.highPotentialVideoIds) {
          fetchedVideos = fetchedVideos.map(video => ({
              ...video,
              hasHighPotential: analysisResult.highPotentialVideoIds.includes(video.id),
          }));
      }

      setSearchState({ videos: fetchedVideos, searchParams: params, nextPageToken, scrollPosition: 0 });

      // Step 3: Fetch comments for all videos and analyze
      setLoadingStatus({ active: true, message: 'Buscando e analisando comentários...', progress: 60 });

      for (let i = 0; i < fetchedVideos.length; i++) {
        const video = fetchedVideos[i];
        const progressPercent = 60 + Math.round((i / fetchedVideos.length) * 20);
        setLoadingStatus({
          active: true,
          message: `Analisando comentários (${i + 1}/${fetchedVideos.length})...`,
          progress: progressPercent
        });

        try {
          console.log(`[handleSearch] Buscando comentários para vídeo ${i + 1}/${fetchedVideos.length}: ${video.title}`);

          const commentsResult = await fetchTopComments({
            videoId: video.id,
            apiKey,
            maxResults: 100,
            fetchAll: true
          });

          if (!commentsResult.error && commentsResult.comments) {
            const comments = (commentsResult.comments as CommentData[]) || [];
            console.log(`[handleSearch] ${comments.length} comentários recebidos para ${video.title}`);

            const commentAnalysis = analyzeComments(comments);
            console.log(`[handleSearch] Análise concluída:`, commentAnalysis);

            // Atualizar vídeo com comentários e análise
            const updatedVideo = {
              ...fetchedVideos[i],
              commentsData: comments,
              commentAnalysis: commentAnalysis
            };

            // Calcular score
            const videoWithScore = addInfoproductScore(updatedVideo);
            fetchedVideos[i] = videoWithScore;

            console.log(`[handleSearch] Score calculado para ${video.title}: ${videoWithScore.infoproductScore}`);
          } else {
            console.log(`[handleSearch] Erro ou sem comentários para ${video.title}:`, commentsResult.error);
            // Marcar como sem comentários
            fetchedVideos[i] = {
              ...fetchedVideos[i],
              commentsData: []
            };
          }
        } catch (commentError) {
          console.error(`[handleSearch] Erro ao buscar comentários do vídeo ${video.id}:`, commentError);
          fetchedVideos[i].commentsData = [];
        }
      }

      console.log('[handleSearch] Todos os comentários processados. Atualizando estado...');
      console.log('[handleSearch] Vídeos com score:', fetchedVideos.map(v => ({ title: v.title, score: v.infoproductScore })));

      setSearchState({ videos: fetchedVideos, searchParams: params, nextPageToken, scrollPosition: 0 });

      // Step 4: Analyze trends
      setLoadingStatus({ active: true, message: 'Analisando tendências...', progress: 85 });
      if (fetchedVideos.length > 0) {
        const trends = analyzeTrends(fetchedVideos);
        setTrendAnalysis(trends);
      }

    } catch (e: any) {
      setError(e.message || "Ocorreu um erro ao buscar os vídeos.");
    } finally {
      setLoadingStatus({ active: false, message: '', progress: 100 });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calcular publishedAfter baseado no filtro de data
    let publishedAfter: string | undefined;
    if (dateFilter !== 'any') {
      const now = new Date();
      switch (dateFilter) {
        case '1h':
          now.setHours(now.getHours() - 1);
          break;
        case 'today':
          now.setHours(0, 0, 0, 0);
          break;
        case 'week':
          now.setDate(now.getDate() - 7);
          break;
        case 'month':
          now.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          now.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          now.setFullYear(now.getFullYear() - 1);
          break;
      }
      if (dateFilter !== 'custom') {
        publishedAfter = now.toISOString();
      }
    }

    const params: SearchParams = {
        type: 'keyword',
        keyword: keyword,
        country: country,
        minViews: parseInt(minViews, 10) || 100000,
        excludeShorts: excludeShorts,
        publishedAfter,
        order,
    };
    handleSearch(params);
  };


  const handleLoadMore = async () => {
    if (!searchState.nextPageToken || !searchState.searchParams) return;

    setIsLoadingMore(true);
    setError(null);
    const apiKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
     if (!apiKey) {
      setError("Chave de API do YouTube não encontrada. Por favor, adicione-a na página de Configurações.");
      setIsLoadingMore(false);
      return;
    }

    try {
      const result = await searchYoutubeVideos({ ...searchState.searchParams, apiKey, pageToken: searchState.nextPageToken });
        if (result.error) {
        setError(result.error);
      } else {
        let newVideos = result.videos?.map(mapApiToVideo) || [];

        // Buscar comentários para os novos vídeos
        for (let i = 0; i < newVideos.length; i++) {
          const video = newVideos[i];

          try {
            const commentsResult = await fetchTopComments({
              videoId: video.id,
              apiKey,
              maxResults: 100,
              fetchAll: true
            });

            if (!commentsResult.error && commentsResult.comments) {
              const comments = (commentsResult.comments as CommentData[]) || [];
              const commentAnalysis = analyzeComments(comments);

              // Atualizar vídeo com comentários e análise
              const updatedVideo = {
                ...newVideos[i],
                commentsData: comments,
                commentAnalysis: commentAnalysis
              };

              // Calcular score
              newVideos[i] = addInfoproductScore(updatedVideo);
            } else {
              newVideos[i] = {
                ...newVideos[i],
                commentsData: []
              };
            }
          } catch (commentError) {
            console.error(`Erro ao buscar comentários do vídeo ${video.id}:`, commentError);
            newVideos[i].commentsData = [];
          }
        }

        setSearchState(prev => ({
            ...prev,
            videos: [...prev.videos, ...newVideos],
            nextPageToken: result.nextPageToken
        }));
      }
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro ao buscar os vídeos.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSort = (key: keyof Video) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleFetchComments = async (videoId: string) => {
    const videoIndex = searchState.videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1 || searchState.videos[videoIndex].commentsData.length > 0) {
      return; // Already fetched or video not found
    }
    
    setIsLoadingComments(true);
    const apiKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
    if (!apiKey) {
      toast({
        title: "Erro",
        description: "Chave de API do YouTube não encontrada.",
        variant: "destructive"
      });
      setIsLoadingComments(false);
      return;
    }

    try {
      console.log(`[handleFetchComments] Iniciando busca de comentários para vídeo: ${videoId}`);

      // Buscar 100 comentários ao invés de 20
      const result = await fetchTopComments({ videoId, apiKey, maxResults: 100, fetchAll: true });

      console.log('[handleFetchComments] Resultado:', result);

      if (result.error) {
        console.error('[handleFetchComments] Erro na resposta:', result.error);

        // Marcar como buscado mesmo com erro para evitar loops
        setSearchState(prev => {
            const updatedVideos = [...prev.videos];
            updatedVideos[videoIndex].commentsData = [];
            return { ...prev, videos: updatedVideos };
        });

        toast({
          title: "Erro ao Buscar Comentários",
          description: result.error,
          variant: "destructive"
        });
      } else {
        // Analisar os comentários
        const comments = (result.comments as CommentData[]) || [];

        console.log(`[handleFetchComments] ${comments.length} comentários recebidos`);

        const commentAnalysis = analyzeComments(comments);

        console.log('[handleFetchComments] Análise concluída:', commentAnalysis);

        setSearchState(prev => {
            const updatedVideos = [...prev.videos];
            updatedVideos[videoIndex].commentsData = comments;
            updatedVideos[videoIndex].commentAnalysis = commentAnalysis;

            // Calcular score de infoproduto
            updatedVideos[videoIndex] = addInfoproductScore(updatedVideos[videoIndex]);

            console.log('[handleFetchComments] Score calculado:', updatedVideos[videoIndex].infoproductScore);

            return { ...prev, videos: updatedVideos };
        });

        // Mostrar resumo da análise com score
        const video = searchState.videos[videoIndex];
        const scoreText = video.infoproductScore ? ` • Score: ${video.infoproductScore}/100` : '';

        if (comments.length > 0) {
          toast({
            title: "Comentários Analisados",
            description: `${comments.length} comentários • ${commentAnalysis.questionsCount} perguntas (${commentAnalysis.questionDensity.toFixed(1)}%) • ${commentAnalysis.materialRequestsCount} pedidos de material${scoreText}`,
          });
        } else {
          toast({
            title: "Nenhum Comentário",
            description: "Este vídeo não possui comentários ou os comentários estão desabilitados.",
          });
        }
      }
    } catch (e: any) {
        console.error('[handleFetchComments] Exceção capturada:', e);

        toast({
          title: "Erro Inesperado",
          description: e.message || "Ocorreu um erro ao buscar os comentários.",
          variant: "destructive"
        });
    } finally {
        setIsLoadingComments(false);
    }
  };

  const sortedVideos = useMemo(() => {
    if (!searchState.videos) return [];
    const sortableVideos = [...searchState.videos];

    sortableVideos.sort((a, b) => {
        // PRIORIDADE 1: Vídeos com Score de Infoproduto >= 80 (OURO)
        const aIsGold = (a.infoproductScore || 0) >= 80;
        const bIsGold = (b.infoproductScore || 0) >= 80;
        if (aIsGold && !bIsGold) return -1;
        if (!aIsGold && bIsGold) return 1;

        // PRIORIDADE 2: Vídeos com Score >= 65 (EXCELENTE)
        const aIsExcellent = (a.infoproductScore || 0) >= 65;
        const bIsExcellent = (b.infoproductScore || 0) >= 65;
        if (aIsExcellent && !bIsExcellent) return -1;
        if (!aIsExcellent && bIsExcellent) return 1;

        // PRIORIDADE 3: High potential videos (análise de IA anterior)
        if (a.hasHighPotential && !b.hasHighPotential) return -1;
        if (!a.hasHighPotential && b.hasHighPotential) return 1;

        // PRIORIDADE 4: Ordenação por coluna selecionada
        if (sortConfig.key) {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
        }

        return 0;
    });

    return sortableVideos;
  }, [searchState.videos, sortConfig]);

  const canLoadMore = !!searchState.nextPageToken;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full overflow-y-auto" ref={mainContainerRef}>
      <div className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-soft-blue-600 to-soft-green-600 bg-clip-text text-transparent">
            Analisador de Mercado YouTube
          </h1>
          <p className="text-lg text-muted-foreground">
            Identifique oportunidades de infoprodutos através da análise inteligente de vídeos e comentários
          </p>
        </header>

        <Card className="border-soft-blue/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-soft-blue-50/50 to-white pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-soft-blue-100 rounded-lg">
                <Search className="h-5 w-5 text-soft-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-soft-blue-900">Pesquisa por Palavra-chave</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Encontre vídeos com base em palavras-chave e filtros específicos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="keyword">Palavra-chave</Label>
                  <Input
                    id="keyword"
                    placeholder="ex: 'planilha financeira', 'como fazer'"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Selecione um país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="views">Mínimo de Visualizações</Label>
                  <Input id="views" type="number" placeholder="ex: 100000" value={minViews} onChange={(e) => setMinViews(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFilter">Data de Publicação</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger id="dateFilter">
                      <SelectValue placeholder="Qualquer data" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer data</SelectItem>
                      <SelectItem value="1h">Última hora</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                      <SelectItem value="3months">Últimos 3 meses</SelectItem>
                      <SelectItem value="year">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Ordenar por</Label>
                  <Select value={order} onValueChange={(value) => setOrder(value as any)}>
                    <SelectTrigger id="order">
                      <SelectValue placeholder="Relevância" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevância</SelectItem>
                      <SelectItem value="date">Data de publicação</SelectItem>
                      <SelectItem value="viewCount">Visualizações</SelectItem>
                      <SelectItem value="rating">Avaliação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="exclude-shorts-keyword" checked={excludeShorts} onCheckedChange={(checked) => setExcludeShorts(checked as boolean)} 
                  />
                  <Label htmlFor="exclude-shorts-keyword" className="text-sm font-normal">
                    Excluir Shorts
                  </Label>
                </div>
                <Button type="submit" disabled={loadingStatus.active} className="w-full sm:w-auto bg-gradient-to-r from-soft-blue-500 to-soft-blue-600 text-white hover:from-soft-blue-600 hover:to-soft-blue-700 shadow-md">
                  {loadingStatus.active ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Pesquisar Vídeos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro na Busca</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {/* Painel de Tendências */}
        {trendAnalysis && searchState.videos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-soft-green-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-soft-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-soft-green-900">Análise de Tendências e Nichos</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTrends(!showTrends)}
                className="border-soft-green-300 text-soft-green-700 hover:bg-soft-green-50"
              >
                {showTrends ? 'Ocultar' : 'Mostrar'} Tendências
              </Button>
            </div>
            {showTrends && (
              <TooltipProvider>
                <TrendsPanel analysis={trendAnalysis} totalVideos={searchState.videos.length} />
              </TooltipProvider>
            )}
          </div>
        )}

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
         <TooltipProvider>
          {loadingStatus.active ? (
             <LoadingState message={loadingStatus.message} progress={loadingStatus.progress} />
          ) : searchState.videos.length > 0 ? (
            <VideoTable 
              videos={sortedVideos} 
              onFetchComments={handleFetchComments}
              isLoadingComments={isLoadingComments}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          ) : (
            !loadingStatus.active && !error && (
              <div className="flex items-center justify-center rounded-lg bg-card p-12 text-center text-muted-foreground">
                  <p>Use a busca acima para encontrar vídeos para analisar.</p>
              </div>
            )
          )}
          </TooltipProvider>
        </div>
        {sortedVideos.length > 0 && canLoadMore && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
            >
              {isLoadingMore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Carregar Mais
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
