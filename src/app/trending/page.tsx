
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/data';
import { Loader2, Search, Terminal } from 'lucide-react';
import { searchYoutubeVideos } from '@/ai/flows/youtube-search';
import { fetchVideoCategories, type VideoCategory } from '@/ai/flows/fetch-video-categories';
import { Video, mapApiToVideo } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VideoTable, type SortConfig } from '@/components/dashboard/video-table';
import { TooltipProvider } from '@/components/ui/tooltip';

const API_KEY_STORAGE_ITEM = 'youtube_api_key';

export default function TrendingPage() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  
  const [country, setCountry] = useState('br');
  const [category, setCategory] = useState<string>('all');
  const [excludeShorts, setExcludeShorts] = useState(true);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'views', direction: 'descending' });
  
  const handleFetchComments = async (videoId: string) => { return; };
  const isLoadingComments = false;
  
  const getApiKey = () => typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE_ITEM) : null;

  const loadCategories = useCallback(async (regionCode: string) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        setError('Chave de API do YouTube não encontrada.');
        return;
    }
    setIsLoadingCategories(true);
    setCategory('all'); // Reset category when country changes
    try {
        const result = await fetchVideoCategories({ apiKey, regionCode });
        if (result.error) {
            toast({ title: "Erro ao carregar categorias", description: result.error, variant: 'destructive' });
            setCategories([]);
        } else {
            setCategories(result.categories || []);
        }
    } catch (e: any) {
        toast({ title: "Erro ao carregar categorias", description: e.message, variant: 'destructive' });
    } finally {
        setIsLoadingCategories(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadCategories(country);
  }, [country, loadCategories]);


  const getSearchParams = (pageToken?: string) => ({
    type: 'trending' as const,
    country,
    category: category === 'all' ? undefined : category,
    excludeShorts,
    pageToken,
  });

  const handleSearch = async (isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setVideos([]);
      setNextPageToken(undefined);
    }
    setError(null);

    const apiKey = getApiKey();
    if (!apiKey) {
      setError('Chave de API do YouTube não encontrada. Por favor, adicione-a na página de Configurações.');
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      const params = getSearchParams(isLoadMore ? nextPageToken : undefined);
      const result = await searchYoutubeVideos({ ...params, apiKey });
      if (result.error) {
        setError(result.error);
        setVideos([]);
      } else {
        const newVideos = result.videos?.map(mapApiToVideo) || [];
        setVideos(prev => isLoadMore ? [...prev, ...newVideos] : newVideos);
        setNextPageToken(result.nextPageToken);
      }
    } catch (e: any) {
      setError(e.message || 'Ocorreu um erro ao buscar os vídeos.');
    } finally {
      setIsLoading(false);
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
  
  const sortedVideos = [...videos].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });


  return (
    <div className="container mx-auto max-w-7xl">
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Vídeos em Alta</h1>
          <p className="text-muted-foreground">
            Descubra o que está em alta em diferentes categorias e países.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Filtros de Tendências</CardTitle>
            <CardDescription>
              Selecione os filtros para encontrar os vídeos mais populares.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="country-trending">País</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country-trending">
                      <SelectValue placeholder="Selecione um país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={category} onValueChange={setCategory} disabled={isLoadingCategories}>
                    <SelectTrigger id="category">
                      <div className="flex items-center gap-2">
                        {isLoadingCategories && <Loader2 className="h-4 w-4 animate-spin" />}
                        <SelectValue placeholder="Todas as categorias" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="exclude-shorts-trending" checked={excludeShorts} onCheckedChange={(c) => setExcludeShorts(c as boolean)} />
                  <Label htmlFor="exclude-shorts-trending" className="text-sm font-normal">Excluir Shorts</Label>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Buscar Tendências
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
                <VideoTable 
                    videos={sortedVideos} 
                    onFetchComments={handleFetchComments}
                    isLoadingComments={isLoadingComments}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />
            </TooltipProvider>
        </div>

        {videos.length === 0 && !isLoading && !error && (
            <div className="flex items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center text-muted-foreground shadow-sm">
                <p>Nenhum vídeo em alta para exibir. Use os filtros acima e clique em "Buscar Tendências".</p>
            </div>
        )}

        {videos.length > 0 && nextPageToken && (
            <div className="mt-6 flex justify-center">
            <Button onClick={() => handleSearch(true)} disabled={isLoadingMore} variant="outline">
              {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Carregar Mais
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

    