
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, getCountryByCode } from '@/lib/countries';
import { fetchTrendingLatam } from '@/ai/flows/fetch-trending-latam';
import { MultiSelectCountries } from '@/components/ui/multi-select-countries';
import { Loader2, Search, Terminal, Sparkles, Languages } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { translateContent } from '@/ai/flows/translate-content';
import { searchYoutubeVideos } from '@/ai/flows/youtube-search';
import { fetchVideoCategories } from '@/ai/flows/fetch-video-categories';
import { fetchTopComments } from '@/ai/flows/fetch-comments';
import { analyzeVideoPotential } from '@/ai/flows/analyze-video-potential';
import { Video, mapApiToVideo } from '@/lib/data';
import { analyzeComments } from '@/lib/comment-analyzer';
import { addInfoproductScore } from '@/lib/infoproduct-score';
import { analyzeTrends, type TrendAnalysis } from '@/lib/trends-analyzer';
import { TrendsPanel } from '@/components/dashboard/trends-panel';
import { LoadingState } from '@/components/dashboard/loading-state';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VideoTable, type SortConfig } from '@/components/dashboard/video-table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { z } from 'zod';

const VideoCategorySchema = z.object({
  id: z.string().describe("The ID of the video category."),
  title: z.string().describe("The display name of the category."),
});
export type VideoCategory = z.infer<typeof VideoCategorySchema>;


const API_KEY_STORAGE_ITEM = 'youtube_api_key';

// Cada país consome 1 ou 2 chamadas de search.list (limite padrão: 100 por dia)
const MAX_COUNTRIES = 5;

// Janela de publicação usada para definir o que está "em alta"
const PERIOD_OPTIONS = [
  { value: '1', label: 'Últimas 24 horas' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
];

type LoadingStatus = {
  active: boolean;
  message: string;
  progress: number;
};

const categoryTranslations: { [key: string]: string } = {
    "Film & Animation": "Filme & Animação",
    "Autos & Vehicles": "Automóveis & Veículos",
    "Music": "Música",
    "Pets & Animals": "Animais de Estimação",
    "Sports": "Esportes",
    "Travel & Events": "Viagens & Eventos",
    "Gaming": "Jogos",
    "People & Blogs": "Pessoas & Blogs",
    "Comedy": "Comédia",
    "Entertainment": "Entretenimento",
    "News & Politics": "Notícias & Política",
    "Howto & Style": "Como Fazer & Estilo",
    "Education": "Educação",
    "Science & Technology": "Ciência & Tecnologia",
    "Nonprofits & Activism": "Organizações sem fins lucrativos & Ativismo",
    "Movies": "Filmes",
    "Anime/Animation": "Anime/Animação",
    "Action/Adventure": "Ação/Aventura",
    "Classics": "Clássicos",
    "Documentary": "Documentário",
    "Drama": "Drama",
    "Family": "Família",
    "Foreign": "Estrangeiro",
    "Horror": "Terror",
    "Sci-Fi/Fantasy": "Ficção Científica/Fantasia",
    "Thriller": "Suspense",
    "Shorts": "Curtas",
    "Shows": "Programas",
    "Trailers": "Trailers"
};

const translateCategory = (title: string): string => {
    return categoryTranslations[title] || title;
};

export default function TrendingPage() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({ active: false, message: '', progress: 0 });
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingCommentVideoId, setLoadingCommentVideoId] = useState<string | null>(null);
  const [showTrends, setShowTrends] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);

  const [selectedCountries, setSelectedCountries] = useState<string[]>(['BR']);
  const [category, setCategory] = useState<string>('all');
  const [excludeShorts, setExcludeShorts] = useState(true);
  const [excludeMusic, setExcludeMusic] = useState(true);
  const [excludeGaming, setExcludeGaming] = useState(true);
  const [isMultiCountry, setIsMultiCountry] = useState(false);
  const [period, setPeriod] = useState('7');
  const [topic, setTopic] = useState('');
  // Início da janela da última busca, reaproveitado no "Carregar Mais"
  const [publishedAfter, setPublishedAfter] = useState<string | undefined>();

  // "Em alta" = ritmo de visualizações, não o total acumulado
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'viewsPerDay', direction: 'descending' });

  // Estado de tradução
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const getApiKey = () => typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE_ITEM) : null;

  // Função para traduzir conteúdo dos vídeos
  const handleTranslationToggle = async (enabled: boolean) => {
    setIsTranslationEnabled(enabled);

    if (enabled && videos.length > 0) {
      setIsTranslating(true);

      try {
        const textsToTranslate: { id: string; text: string }[] = [];

        // Coletar títulos não traduzidos
        videos.forEach(v => {
          if (!translations[`title_${v.id}`]) {
            textsToTranslate.push({
              id: `title_${v.id}`,
              text: v.title,
            });
          }

          // Coletar comentários não traduzidos (top perguntas e pedidos de material)
          if (v.commentAnalysis) {
            v.commentAnalysis.topQuestions?.forEach((comment, idx) => {
              const commentId = `comment_${v.id}_q_${idx}`;
              if (!translations[commentId]) {
                textsToTranslate.push({
                  id: commentId,
                  text: comment.text,
                });
              }
            });

            v.commentAnalysis.topMaterialRequests?.forEach((comment, idx) => {
              const commentId = `comment_${v.id}_m_${idx}`;
              if (!translations[commentId]) {
                textsToTranslate.push({
                  id: commentId,
                  text: comment.text,
                });
              }
            });
          }

          // Coletar todos os comentários do vídeo
          v.commentsData?.forEach((comment, idx) => {
            const commentId = `comment_${v.id}_${idx}`;
            if (!translations[commentId]) {
              textsToTranslate.push({
                id: commentId,
                text: comment.text,
              });
            }
          });
        });

        if (textsToTranslate.length > 0) {
          const result = await translateContent({
            texts: textsToTranslate,
            targetLanguage: 'Brazilian Portuguese',
          });

          // Atualizar traduções
          const newTranslations: Record<string, string> = { ...translations };
          result.translations.forEach(t => {
            newTranslations[t.id] = t.translatedText;
          });
          setTranslations(newTranslations);

          toast({
            title: "Tradução concluída",
            description: `${result.translations.length} textos traduzidos`,
          });
        } else {
          toast({
            title: "Tradução ativada",
            description: "Todos os textos já estão traduzidos",
          });
        }
      } catch (e: any) {
        toast({
          title: "Erro na tradução",
          description: e.message,
          variant: 'destructive',
        });
        setIsTranslationEnabled(false);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  // Função para buscar e analisar comentários de um vídeo
  const handleFetchComments = async (videoId: string) => {
    const apiKey = getApiKey();
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

      setVideos(prev => prev.map(v => {
        if (v.id === videoId) {
          const videoWithComments = { ...v, commentAnalysis, commentsData: comments };
          return addInfoproductScore(videoWithComments);
        }
        return v;
      }));

      toast({ title: "Comentários analisados", description: `${comments.length} comentários processados` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: 'destructive' });
    } finally {
      setLoadingCommentVideoId(null);
    }
  };

  // Atualizar isMultiCountry quando seleção mudar
  useEffect(() => {
    setIsMultiCountry(selectedCountries.length > 1);
  }, [selectedCountries]);

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
            const translatedCategories = result.categories?.map(cat => ({
                ...cat,
                title: translateCategory(cat.title)
            })) || [];
            setCategories(translatedCategories);
        }
    } catch (e: any) {
        toast({ title: "Erro ao carregar categorias", description: e.message, variant: 'destructive' });
    } finally {
        setIsLoadingCategories(false);
    }
  }, [toast]);

  // Carregar categorias do primeiro país selecionado (só quando ele muda)
  const firstCountry = selectedCountries[0];
  useEffect(() => {
    if (firstCountry) {
      loadCategories(firstCountry);
    }
  }, [firstCountry, loadCategories]);


  const handleSearch = async (isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setVideos([]);
      setNextPageToken(undefined);
      setShowTrends(false); // Reset trends
    }
    setError(null);

    const apiKey = getApiKey();
    if (!apiKey) {
      setError('Chave de API do YouTube não encontrada. Por favor, adicione-a na página de Configurações.');
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    const windowStart = isLoadMore && publishedAfter
      ? publishedAfter
      : new Date(Date.now() - parseInt(period, 10) * 24 * 60 * 60 * 1000).toISOString();
    if (!isLoadMore) setPublishedAfter(windowStart);

    try {
      if (selectedCountries.length > 1) {
        // BUSCA MULTI-PAÍS
        const result = await fetchTrendingLatam({
          apiKey,
          countries: selectedCountries,
          keyword: topic.trim() || undefined,
          excludeShorts,
          excludeMusic,
          excludeGaming,
          category: category === 'all' ? undefined : category,
          publishedAfter: windowStart,
        });

        if (result.errors.length > 0) {
          toast({
            title: "Alguns países falharam",
            description: result.errors.join(', '),
            variant: 'destructive'
          });
        }

        // Consolidar vídeos de todos os países
        const allVideos = result.results.flatMap(countryResult =>
          countryResult.videos.map((video: any) => ({
            ...mapApiToVideo(video),
            sourceCountry: countryResult.country, // Adicionar país de origem
            sourceCountryFlag: countryResult.flag,
          }))
        );

        setVideos(allVideos);
        setNextPageToken(undefined); // Não suporta paginação multi-país por enquanto

        toast({
          title: "Busca multi-país concluída!",
          description: `${result.totalVideos} vídeos de ${result.countriesProcessed} países`
        });
      } else {
        // BUSCA SINGLE-PAÍS (original)
        const result = await searchYoutubeVideos({
          type: 'trending',
          keyword: topic.trim() || undefined,
          country: selectedCountries[0],
          category: category === 'all' ? undefined : category,
          publishedAfter: windowStart,
          excludeShorts,
          excludeMusic,
          excludeGaming,
          pageToken: isLoadMore ? nextPageToken : undefined,
          apiKey,
        });

        if (result.error) {
          setError(result.error);
          setVideos([]);
        } else {
          const newVideos = result.videos?.map((video: any) => ({
            ...mapApiToVideo(video),
            sourceCountry: selectedCountries[0],
            sourceCountryFlag: getCountryByCode(selectedCountries[0])?.flag || '🌎',
          })) || [];

          setVideos(prev => isLoadMore ? [...prev, ...newVideos] : newVideos);
          setNextPageToken(result.nextPageToken);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Ocorreu um erro ao buscar os vídeos.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Função para analisar automaticamente todos os vídeos
  const analyzeAllVideos = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({ title: "Chave de API necessária", description: "Configure sua chave de API do YouTube", variant: 'destructive' });
      return;
    }

    if (videos.length === 0) {
      toast({ title: "Nenhum vídeo", description: "Busque vídeos trending primeiro", variant: 'destructive' });
      return;
    }

    setLoadingStatus({ active: true, message: 'Analisando vídeos com IA...', progress: 10 });
    const updatedVideos = [...videos];

    try {
      // Step 1: Análise com IA (identifica vídeos com alto potencial)
      const videosForAnalysis = updatedVideos.map(v => ({
        id: v.id,
        title: v.title,
        description: v.snippet?.description || '',
      }));

      const analysisResult = await analyzeVideoPotential({
        videos: videosForAnalysis,
        keyword: topic.trim() || `trending ${category !== 'all' ? category : ''} videos in ${selectedCountries.join(', ')}`
      });

      if (analysisResult.highPotentialVideoIds) {
        updatedVideos.forEach((video, index) => {
          updatedVideos[index] = {
            ...video,
            hasHighPotential: analysisResult.highPotentialVideoIds.includes(video.id),
          };
        });
        setVideos([...updatedVideos]);
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
        setVideos([...updatedVideos]);
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

  const handleSort = (key: keyof Video) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedVideos = useMemo(() => {
    const sorted = [...videos].sort((a, b) => {
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
  }, [videos, sortConfig]);


  return (
    <div className="container mx-auto max-w-7xl">
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Vídeos em Alta</h1>
          <p className="text-muted-foreground">
            Os vídeos mais vistos entre os publicados recentemente, por tema, país e categoria, ordenados por visualizações por dia.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Filtros de Tendências</CardTitle>
            <CardDescription>
              Cada país selecionado consome 2 das 100 buscas diárias da sua chave do YouTube (1 se "Excluir Shorts" estiver desmarcado).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Tema ou nicho (opcional)</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex.: emagrecimento, finanças pessoais, inglês..."
                />
                <p className="text-xs text-muted-foreground">
                  Em branco, busca conteúdo educativo em geral (cursos, aulas, tutoriais, dicas). O tema é traduzido para o idioma de cada país.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="countries">
                    Países
                    {isMultiCountry && (
                      <span className="ml-2 text-xs font-normal text-orange-600">
                        🌎 Modo Multi-País Ativo
                      </span>
                    )}
                  </Label>
                  <MultiSelectCountries
                    countries={COUNTRIES}
                    selectedCountries={selectedCountries}
                    onSelectionChange={setSelectedCountries}
                    placeholder="Selecione 1 ou mais países..."
                    maxSelected={MAX_COUNTRIES}
                  />
                  <p className="text-xs text-muted-foreground">Até {MAX_COUNTRIES} países por busca.</p>
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
                <div className="space-y-2">
                  <Label htmlFor="period">Publicados em</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger id="period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="exclude-shorts-trending" checked={excludeShorts} onCheckedChange={(c) => setExcludeShorts(c as boolean)} />
                    <Label htmlFor="exclude-shorts-trending" className="text-sm font-normal">Excluir Shorts (até 3 min)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="exclude-music-trending" checked={excludeMusic} onCheckedChange={(c) => setExcludeMusic(c as boolean)} />
                    <Label htmlFor="exclude-music-trending" className="text-sm font-normal">Excluir Música</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="exclude-gaming-trending" checked={excludeGaming} onCheckedChange={(c) => setExcludeGaming(c as boolean)} />
                    <Label htmlFor="exclude-gaming-trending" className="text-sm font-normal">Excluir Games</Label>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Buscar Tendências
                  </Button>
                  {videos.length > 0 && (
                    <Button
                      type="button"
                      onClick={analyzeAllVideos}
                      disabled={loadingStatus.active}
                      variant="secondary"
                      className="w-full sm:w-auto"
                    >
                      {loadingStatus.active ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Analisar Todos
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {loadingStatus.active && (
          <Card>
            <CardContent className="pt-6">
              <LoadingState message={loadingStatus.message} progress={loadingStatus.progress} />
            </CardContent>
          </Card>
        )}

        {error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro na Busca</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {showTrends && trendAnalysis && (
          <TooltipProvider>
            <TrendsPanel analysis={trendAnalysis} totalVideos={videos.length} />
          </TooltipProvider>
        )}
        
        {videos.length > 0 && (
          <div className="flex items-center justify-end gap-3 px-4 py-2 bg-muted/30 rounded-t-lg border border-b-0">
            <div className="flex items-center gap-2">
              {isTranslating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="translation-toggle" className="text-sm font-medium cursor-pointer">
                Traduzir para Português
              </Label>
              <Switch
                id="translation-toggle"
                checked={isTranslationEnabled}
                onCheckedChange={handleTranslationToggle}
                disabled={isTranslating}
              />
            </div>
          </div>
        )}

        <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${videos.length > 0 ? 'rounded-t-none border-t-0' : ''}`}>
            <TooltipProvider>
                <VideoTable
                    videos={sortedVideos}
                    onFetchComments={handleFetchComments}
                    isLoadingComments={!!loadingCommentVideoId}
                    loadingCommentVideoId={loadingCommentVideoId}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    isTranslationEnabled={isTranslationEnabled}
                    translations={translations}
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
