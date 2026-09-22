'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, Search, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShortCard } from '@/components/shorts/ShortCard';
import { ShortPlayerDialog } from '@/components/shorts/ShortPlayerDialog';
import { CommentInsightsPanel, type AnalysisState } from '@/components/shorts/CommentInsightsPanel';
import { searchShorts, type SearchShortsInput } from '@/ai/flows/search-shorts';
import { analyzeShortsComments } from '@/ai/flows/analyze-shorts-comments';
import { COUNTRIES } from '@/lib/countries';
import { defaultSortFor, sortShorts, type ShortsSearchOrder, type ShortsSortKey, type ShortVideo } from '@/lib/shorts';
import { analysisKey } from '@/lib/shorts-report';

const API_KEY_STORAGE_ITEM = 'youtube_api_key';
const MAX_SELECTED = 10;

const ORDER_OPTIONS: { value: ShortsSearchOrder; label: string }[] = [
  { value: 'viewCount', label: 'Mais vistos' },
  { value: 'date', label: 'Mais recentes' },
  { value: 'relevance', label: 'Mais relevantes' },
];

const PERIOD_OPTIONS = [
  { value: '1', label: 'Últimas 24 horas' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

const SORT_OPTIONS: { value: ShortsSortKey; label: string }[] = [
  { value: 'viral', label: 'Viralização' },
  { value: 'velocity', label: 'Velocidade (views/dia)' },
  { value: 'views', label: 'Views' },
  { value: 'engagement', label: 'Engajamento' },
  { value: 'recent', label: 'Mais recentes' },
];

type SearchQuery = Omit<SearchShortsInput, 'apiKey' | 'pageToken'>;

export default function ShortsPage() {
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('BR');
  const [order, setOrder] = useState<ShortsSearchOrder>('viewCount');
  const [period, setPeriod] = useState('7');

  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [lastQuery, setLastQuery] = useState<SearchQuery | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [sortKey, setSortKey] = useState<ShortsSortKey>('viral');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [missingKey, setMissingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [playing, setPlaying] = useState<ShortVideo | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});
  const [openAnalysisKey, setOpenAnalysisKey] = useState<string | null>(null);

  const busy = isSearching || isLoadingMore;

  const sortedShorts = useMemo(() => sortShorts(shorts, sortKey), [shorts, sortKey]);
  const titles = useMemo(() => Object.fromEntries(shorts.map(short => [short.id, short.title])), [shorts]);

  const getApiKey = () => localStorage.getItem(API_KEY_STORAGE_ITEM);

  const runSearch = async (loadMore: boolean) => {
    if (busy) return;
    const apiKey = getApiKey();
    setMissingKey(!apiKey);
    if (!apiKey) return;

    // "Carregar mais" repete a última busca, mesmo que os filtros tenham mudado depois
    const query: SearchQuery = loadMore && lastQuery ? lastQuery : {
      country,
      order,
      topic: topic.trim() || undefined,
      publishedAfter: new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (loadMore) setIsLoadingMore(true);
    else setIsSearching(true);
    setError(null);

    try {
      const result = await searchShorts({ apiKey, ...query, pageToken: loadMore ? nextPageToken : undefined });
      if (result.error) {
        setError(result.error);
        return;
      }
      const found = result.shorts || [];
      if (loadMore) {
        setShorts(prev => {
          const seen = new Set(prev.map(short => short.id));
          return [...prev, ...found.filter(short => !seen.has(short.id))];
        });
      } else {
        setShorts(found);
        setSelectedIds([]);
        setLastQuery(query);
        setSortKey(defaultSortFor(query.order));
      }
      setNextPageToken(result.nextPageToken);
    } catch (e: any) {
      setError(e.message || 'Erro ao buscar Shorts.');
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const analyze = async (videoIds: string[]) => {
    const key = analysisKey(videoIds);
    setOpenAnalysisKey(key);
    // Já analisado (ou em andamento): só reabre o painel. Em caso de erro, tenta de novo
    const existing = analyses[key];
    if (existing && existing.status !== 'error') return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setAnalyses(prev => ({ ...prev, [key]: { status: 'error', videoIds, error: 'Chave de API do YouTube não encontrada. Adicione-a em Configurações.' } }));
      return;
    }

    setAnalyses(prev => ({ ...prev, [key]: { status: 'loading', videoIds } }));
    try {
      const result = await analyzeShortsComments({
        apiKey,
        videos: videoIds.map(id => ({ id, title: titles[id] || '' })),
      });
      setAnalyses(prev => ({
        ...prev,
        [key]: result.report
          ? { status: 'done', videoIds, report: result.report, commentsAnalyzed: result.commentsAnalyzed, videosWithoutComments: result.videosWithoutComments }
          : { status: 'error', videoIds, error: result.error || 'Não foi possível analisar os comentários.' },
      }));
    } catch (e: any) {
      setAnalyses(prev => ({ ...prev, [key]: { status: 'error', videoIds, error: e.message || 'Erro ao analisar os comentários.' } }));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(selected => selected !== id);
      return prev.length >= MAX_SELECTED ? prev : [...prev, id];
    });
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Shorts para Criativos</h1>
        <p className="text-muted-foreground">
          Encontre Shorts que estão escalando para inspirar anúncios e entenda o público pelos comentários.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Cada busca consome 1 das 100 buscas diárias da sua chave do YouTube. Ordenar os resultados não consome.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); runSearch(false); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shorts-topic">Tema ou nicho (opcional)</Label>
              <Input
                id="shorts-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex.: emagrecimento, skincare, renda extra..."
              />
              <p className="text-xs text-muted-foreground">
                Em branco, busca Shorts de dicas, tutoriais, truques e curiosidades do país. O tema é traduzido para o idioma do país.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="shorts-country">País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="shorts-country"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.flag} {option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shorts-order">Buscar por</Label>
                <Select value={order} onValueChange={(value) => setOrder(value as ShortsSearchOrder)}>
                  <SelectTrigger id="shorts-order"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shorts-period">Publicados em</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger id="shorts-period"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={busy}>
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar Shorts
            </Button>
          </form>
        </CardContent>
      </Card>

      {missingKey && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            Chave de API do YouTube não encontrada. Adicione-a em{' '}
            <Link href="/settings" className="font-semibold underline">Configurações</Link>.
          </p>
        </div>
      )}

      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {shorts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{shorts.length} Shorts encontrados</p>
          <div className="flex items-center gap-2">
            <Label htmlFor="shorts-sort" className="text-sm">Ordenar por</Label>
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as ShortsSortKey)}>
              <SelectTrigger id="shorts-sort" className="w-[210px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {shorts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {sortedShorts.map(short => (
            <ShortCard
              key={short.id}
              short={short}
              selected={selectedIds.includes(short.id)}
              selectDisabled={selectedIds.length >= MAX_SELECTED}
              analyzing={analyses[analysisKey([short.id])]?.status === 'loading'}
              onToggleSelect={() => toggleSelect(short.id)}
              onPlay={() => setPlaying(short)}
              onAnalyze={() => analyze([short.id])}
            />
          ))}
        </div>
      )}

      {lastQuery && !isSearching && !error && shorts.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Nenhum Short encontrado com esses filtros. Tente outro tema ou um período maior
          {nextPageToken ? ', ou carregue mais resultados' : ''}.
        </div>
      )}

      {lastQuery && nextPageToken && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => runSearch(true)} disabled={busy}>
            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Carregar mais
          </Button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg">
          <span className="text-sm">
            {selectedIds.length} selecionado(s){selectedIds.length >= MAX_SELECTED ? ' (máximo)' : ''}
          </span>
          <Button size="sm" onClick={() => analyze(selectedIds)} disabled={selectedIds.length < 2}>
            <Sparkles className="mr-1 h-3 w-3" />
            Analisar selecionados
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} aria-label="Limpar seleção">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ShortPlayerDialog short={playing} onClose={() => setPlaying(null)} />
      <CommentInsightsPanel
        analysis={openAnalysisKey ? analyses[openAnalysisKey] ?? null : null}
        titles={titles}
        onOpenChange={(open) => { if (!open) setOpenAnalysisKey(null); }}
      />
    </div>
  );
}
