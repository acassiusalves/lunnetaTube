
"use client";

import { useState, useMemo, useEffect } from "react";
import { Video, mapApiToVideo, CommentData } from "@/lib/data";
import { searchYoutubeVideos } from "@/ai/flows/youtube-search";
import { fetchTopComments } from "@/ai/flows/fetch-comments";
import { analyzeVideoPotential } from "@/ai/flows/analyze-video-potential";
import { analyzeComments } from "@/lib/comment-analyzer";
import { addInfoproductScore } from "@/lib/infoproduct-score";
import { analyzeTrends, type TrendAnalysis } from "@/lib/trends-analyzer";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "@/context/SearchContext";
import type { SearchParams } from "@/lib/data";
import { YouTubeLayout, SearchFilters, VideoCard } from "@/components/youtube";
import type { SearchFilterValues, VideoCardData } from "@/components/youtube";
import { Loader2, Search, AlertCircle, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoTable, type SortConfig } from "@/components/dashboard/video-table";
import { TrendsPanel } from "@/components/dashboard/trends-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrends, setShowTrends] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [loadingCommentVideoId, setLoadingCommentVideoId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'views', direction: 'descending' });
  

  const handleSearch = async (params: SearchParams) => {
    clearSearchState();
    setError(null);
    setShowTrends(false);
    setLoadingStatus({ active: true, message: 'Buscando vídeos...', progress: 50 });

    const apiKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
    if (!apiKey) {
      setError("Chave de API do YouTube não encontrada. Por favor, adicione-a na página de Configurações.");
      setLoadingStatus({ active: false, message: '', progress: 0 });
      return;
    }

    try {
      // Fetch videos from YouTube
      const result = await searchYoutubeVideos({ ...params, apiKey, skipAiAnalysis: true });
      if (result.error) {
        setError(result.error);
        clearSearchState();
        setLoadingStatus({ active: false, message: '', progress: 0 });
        return;
      }

      const fetchedVideos = result.videos?.map(mapApiToVideo) || [];
      const nextPageToken = result.nextPageToken;
      setSearchState({ videos: fetchedVideos, searchParams: params, nextPageToken, scrollPosition: 0 });

      toast({
        title: "Busca concluída!",
        description: `${fetchedVideos.length} vídeos encontrados. Use "Analisar Todos" para análise detalhada.`
      });

    } catch (e: any) {
      setError(e.message || "Ocorreu um erro ao buscar os vídeos.");
    } finally {
      setLoadingStatus({ active: false, message: '', progress: 100 });
    }
  };

  // Função para analisar todos os vídeos com IA
  const analyzeAllVideos = async () => {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
    if (!apiKey) {
      toast({ title: "Chave de API necessária", description: "Configure sua chave de API do YouTube", variant: 'destructive' });
      return;
    }

    if (searchState.videos.length === 0) {
      toast({ title: "Nenhum vídeo", description: "Busque vídeos primeiro", variant: 'destructive' });
      return;
    }

    setLoadingStatus({ active: true, message: 'Analisando vídeos com IA...', progress: 10 });
    const updatedVideos = [...searchState.videos];

    try {
      // Step 1: Análise com IA (identifica vídeos com alto potencial)
      const videosForAnalysis = updatedVideos.map(v => ({
        id: v.id,
        title: v.title,
        description: v.snippet?.description || '',
      }));

      const analysisResult = await analyzeVideoPotential({
        videos: videosForAnalysis,
        keyword: searchState.searchParams?.keyword || 'videos'
      });

      if (analysisResult.highPotentialVideoIds) {
        updatedVideos.forEach((video, index) => {
          updatedVideos[index] = {
            ...video,
            hasHighPotential: analysisResult.highPotentialVideoIds.includes(video.id),
          };
        });
        setSearchState(prev => ({ ...prev, videos: [...updatedVideos] }));
      }

      // Step 2: Buscar e analisar comentários
      setLoadingStatus({ active: true, message: 'Buscando comentários...', progress: 30 });

      for (let i = 0; i < updatedVideos.length; i++) {
        const video = updatedVideos[i];
        const progress = 30 + Math.round((i / updatedVideos.length) * 60);

        setLoadingStatus({
          active: true,
          message: `Analisando vídeo ${i + 1} de ${updatedVideos.length}...`,
          progress
        });

        // Buscar comentários
        const result = await fetchTopComments({ videoId: video.id, apiKey, maxResults: 100 });

        if (!result.error && result.comments) {
          const comments = result.comments;
          const commentAnalysis = analyzeComments(comments);

          updatedVideos[i] = {
            ...video,
            commentAnalysis,
            commentsData: comments
          };

          updatedVideos[i] = addInfoproductScore(updatedVideos[i]);
        }

        // Atualizar UI progressivamente
        setSearchState(prev => ({ ...prev, videos: [...updatedVideos] }));
      }

      // Step 3: Calcular análise de tendências
      setLoadingStatus({ active: true, message: 'Calculando insights de tendências...', progress: 95 });
      const trends = analyzeTrends(updatedVideos);
      setTrendAnalysis(trends);
      setShowTrends(true);

      setLoadingStatus({ active: false, message: '', progress: 100 });
      toast({
        title: "Análise completa!",
        description: `${updatedVideos.length} vídeos analisados com sucesso`
      });
    } catch (e: any) {
      toast({ title: "Erro na análise", description: e.message, variant: 'destructive' });
    } finally {
      setLoadingStatus({ active: false, message: '', progress: 0 });
    }
  };

  // Função para buscar e analisar comentários de um vídeo
  const handleFetchComments = async (videoId: string) => {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
    if (!apiKey) {
      toast({ title: "Chave de API necessária", description: "Configure sua chave de API do YouTube", variant: 'destructive' });
      return;
    }

    setLoadingCommentVideoId(videoId);

    try {
      const result = await fetchTopComments({ videoId, apiKey, maxResults: 100 });

      if (result.error) {
        toast({ title: "Erro ao buscar comentários", description: result.error, variant: 'destructive' });
        return;
      }

      const comments = result.comments || [];
      const commentAnalysis = analyzeComments(comments);

      setSearchState(prev => ({
        ...prev,
        videos: prev.videos.map(v => {
          if (v.id === videoId) {
            const videoWithComments = { ...v, commentAnalysis, commentsData: comments };
            return addInfoproductScore(videoWithComments);
          }
          return v;
        })
      }));

      toast({ title: "Comentários analisados", description: `${comments.length} comentários processados` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: 'destructive' });
    } finally {
      setLoadingCommentVideoId(null);
    }
  };

  const handleSearchSubmit = (filters: SearchFilterValues) => {
    const params: SearchParams = {
      type: 'keyword',
      keyword: filters.keyword,
      country: filters.country,
      minViews: parseInt(filters.minViews, 10) || 0,
      excludeShorts: filters.excludeShorts,
      publishedAfter: filters.publishedAfter || undefined,
      order: filters.order as 'relevance' | 'date' | 'rating' | 'viewCount',
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
        const newVideos = result.videos?.map(mapApiToVideo) || [];

        setSearchState(prev => ({
            ...prev,
            videos: [...prev.videos, ...newVideos],
            nextPageToken: result.nextPageToken
        }));

        toast({
          title: "Mais vídeos carregados!",
          description: `${newVideos.length} novos vídeos adicionados`
        });
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

  // Sort videos based on sortConfig
  const sortedVideos = useMemo(() => {
    if (!searchState.videos) return [];
    const sorted = [...searchState.videos].sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    // Priorizar vídeos com score alto (oportunidades de ouro)
    const withScore = sorted.filter(v => v.infoproductScore && v.infoproductScore >= 65);
    const withoutScore = sorted.filter(v => !v.infoproductScore || v.infoproductScore < 65);

    if (sortConfig.key === 'infoproductScore' || sortConfig.key === 'views') {
      return [...withScore, ...withoutScore];
    }

    return sorted;
  }, [searchState.videos, sortConfig]);

  const canLoadMore = !!searchState.nextPageToken;

  return (
    <YouTubeLayout>
      <div className="space-y-6">
        {/* Search Filters */}
        <SearchFilters onSearch={handleSearchSubmit} isLoading={loadingStatus.active} />

        {/* Analyze All Button */}
        {searchState.videos.length > 0 && !loadingStatus.active && (
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={analyzeAllVideos}
              disabled={loadingStatus.active}
              className="bg-[#FF6B00] hover:bg-[#E65A00] text-white"
            >
              {loadingStatus.active ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analisar Todos com IA
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Erro na Busca</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loadingStatus.active && (
          <Card>
            <CardContent className="pt-6">
              <LoadingState message={loadingStatus.message} progress={loadingStatus.progress} />
            </CardContent>
          </Card>
        )}

        {/* Trends Panel */}
        {showTrends && trendAnalysis && (
          <TooltipProvider>
            <TrendsPanel analysis={trendAnalysis} totalVideos={searchState.videos.length} />
          </TooltipProvider>
        )}

        {/* Video Results Table */}
        {!loadingStatus.active && searchState.videos.length > 0 && (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <TooltipProvider>
              <VideoTable
                videos={sortedVideos}
                onFetchComments={handleFetchComments}
                isLoadingComments={!!loadingCommentVideoId}
                loadingCommentVideoId={loadingCommentVideoId}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </TooltipProvider>
          </div>
        )}

        {/* Load More Button */}
        {searchState.videos.length > 0 && canLoadMore && !loadingStatus.active && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
            >
              {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Carregar Mais
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loadingStatus.active && !error && searchState.videos.length === 0 && (
          <div className="bg-white rounded-lg border border-[#f0f0f0] p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              Use a busca acima para encontrar vídeos para analisar.
            </p>
          </div>
        )}
      </div>
    </YouTubeLayout>
  );
}
