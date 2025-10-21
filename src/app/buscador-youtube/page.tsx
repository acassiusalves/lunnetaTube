
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Video, mapApiToVideo, CommentData } from "@/lib/data";
import { VideoTable, type SortConfig } from "@/components/dashboard/video-table";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Terminal } from "lucide-react";
import { searchYoutubeVideos } from "@/ai/flows/youtube-search";
import { fetchTopComments } from "@/ai/flows/fetch-comments";
import { analyzeVideoPotential } from "@/ai/flows/analyze-video-potential";
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

  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Form state for keyword search
  const [keyword, setKeyword] = useState(searchState.searchParams?.keyword || '');
  const [country, setCountry] = useState(searchState.searchParams?.country || 'br');
  const [minViews, setMinViews] = useState(String(searchState.searchParams?.minViews || 100000));
  const [excludeShorts, setExcludeShorts] = useState(searchState.searchParams?.excludeShorts || false);

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
    setLoadingStatus({ active: true, message: 'Traduzindo termo e buscando vídeos...', progress: 25 });
    
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
      setLoadingStatus({ active: true, message: 'Analisando resultados com IA...', progress: 75 });
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

    } catch (e: any) {
      setError(e.message || "Ocorreu um erro ao buscar os vídeos.");
    } finally {
      setLoadingStatus({ active: false, message: '', progress: 100 });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: SearchParams = {
        type: 'keyword',
        keyword: keyword,
        country: country,
        minViews: parseInt(minViews, 10) || 100000,
        excludeShorts: excludeShorts,
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
    
    sortableVideos.sort((a, b) => {
        // Prioritize high potential videos
        if (a.hasHighPotential && !b.hasHighPotential) return -1;
        if (!a.hasHighPotential && b.hasHighPotential) return 1;

        // Then, sort by the selected column
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
      <div className="space-y-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Análise</h1>
          <p className="text-muted-foreground">
            Descubra insights de vídeos do YouTube para impulsionar sua próxima grande ideia.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Pesquisa por Palavra-chave</CardTitle>
            <CardDescription>
              Encontre vídeos com base em palavras-chave e filtros específicos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="keyword">Palavra-chave</Label>
                  <Input 
                    id="keyword" 
                    placeholder="ex: 'ferramentas de gestão de produtos'" 
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
                  <Input _id="views" type="number" placeholder="ex: 100000" value={minViews} onChange={(e) => setMinViews(e.target.value)}
                  />
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
                <Button type="submit" disabled={loadingStatus.active} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  {loadingStatus.active ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Pesquisar
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
