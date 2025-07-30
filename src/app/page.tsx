
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoSearchTabs, type SearchParams } from "@/components/dashboard/video-search-tabs";
import { AnalysisDialog } from "@/components/dashboard/analysis-dialog";
import { Video, mapApiToVideo, CommentData } from "@/lib/data";
import { VideoTable, type SortConfig } from "@/components/dashboard/video-table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { searchYoutubeVideos } from "@/ai/flows/youtube-search";
import { fetchTopComments } from "@/ai/flows/fetch-comments";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSearch } from "@/context/SearchContext";

type AnalysisType = "content";
const API_KEY_STORAGE_ITEM = "youtube_api_key";

export default function DashboardPage() {
  const { toast } = useToast();
  const {
    searchState,
    setSearchState,
    clearSearchState,
  } = useSearch();

  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("content");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'views', direction: 'descending' });
    
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mainContainerRef = useRef<HTMLDivElement>(null);

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
    setIsLoading(true);
    setError(null);
    clearSearchState();
    
    const apiKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
    if (!apiKey) {
      setError("Chave de API do YouTube não encontrada. Por favor, adicione-a na página de Configurações.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await searchYoutubeVideos({ ...params, apiKey });
      if (result.error) {
        setError(result.error);
        clearSearchState();
      } else {
        const fetchedVideos = result.videos?.map(mapApiToVideo) || [];
        setSearchState({
            videos: fetchedVideos,
            searchParams: params,
            nextPageToken: result.nextPageToken,
            scrollPosition: 0,
        });
      }
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro ao buscar os vídeos.");
    } finally {
      setIsLoading(false);
    }
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
      }
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro ao buscar os vídeos.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleOpenDialog = (video: Video, type: AnalysisType) => {
    setSelectedVideo(video);
    setAnalysisType(type);
    setIsDialogOpen(true);
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
      const result = await fetchTopComments({ videoId, apiKey, maxResults: 20 });
      if (result.error) {
        toast({
          title: "Erro ao Buscar Comentários",
          description: result.error,
          variant: "destructive"
        });
      } else {
        setSearchState(prev => {
            const updatedVideos = [...prev.videos];
            updatedVideos[videoIndex].commentsData = result.comments as CommentData[];
            return { ...prev, videos: updatedVideos };
        });
      }
    } catch (e: any) {
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
    if (sortConfig.key) {
      sortableVideos.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableVideos;
  }, [searchState.videos, sortConfig]);

  const canLoadMore = !!searchState.nextPageToken;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full overflow-y-auto" ref={mainContainerRef}>
      <div className="space-y-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Analisador de Mercado</h1>
          <p className="text-muted-foreground">
            Descubra insights de vídeos do YouTube para impulsionar sua próxima grande ideia.
          </p>
        </header>

        <VideoSearchTabs onSearch={handleSearch} isLoading={isLoading} initialParams={searchState.searchParams} />

        {error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro na Busca</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
         <TooltipProvider>
          {isLoading ? (
             <div className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              </div>
          ) : (
            <VideoTable 
              videos={sortedVideos} 
              onAnalyze={handleOpenDialog}
              onFetchComments={handleFetchComments}
              isLoadingComments={isLoadingComments}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
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
      
      {selectedVideo && (
        <AnalysisDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          video={selectedVideo}
          analysisType={analysisType}
        />
      )}
    </div>
  );
}
