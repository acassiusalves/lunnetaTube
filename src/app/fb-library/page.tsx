
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Terminal, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { searchFacebookAds, type Ad } from '@/ai/flows/facebook-ads-search';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const FACEBOOK_APP_ID_STORAGE_ITEM = 'facebook_app_id';
const FACEBOOK_APP_SECRET_STORAGE_ITEM = 'facebook_app_secret';

const AdCard = ({ ad }: { ad: Ad }) => {
  const formatImpressions = (impressions: any) => {
    if (!impressions || !impressions.lower_bound) return 'N/A';
    return `${impressions.lower_bound} - ${impressions.upper_bound}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">{ad.page_name}</CardTitle>
                <CardDescription>ID da Página: {ad.page_id}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href={ad.ad_snapshot_url || '#'} target="_blank" rel="noopener noreferrer">
                    Ver Anúncio
                    <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="space-y-1">
            <h4 className="font-semibold text-sm">Texto do Anúncio:</h4>
            <p className="text-sm text-muted-foreground">{ad.ad_creative_bodies?.[0] || 'N/A'}</p>
        </div>
        <div className="space-y-1">
            <h4 className="font-semibold text-sm">Título do Link:</h4>
            <p className="text-sm text-muted-foreground">{ad.ad_creative_link_titles?.[0] || 'N/A'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">Início:</span> {ad.ad_delivery_start_time ? formatDate(ad.ad_delivery_start_time) : 'N/A'}</div>
            <div><span className="font-semibold">Impressões:</span> {formatImpressions(ad.impressions)}</div>
            <div><span className="font-semibold">Moeda:</span> {ad.currency || 'N/A'}</div>
            <div><span className="font-semibold">Gasto:</span> {ad.spend?.lower_bound} - {ad.spend?.upper_bound}</div>
        </div>
         <div>
            <h4 className="font-semibold text-sm mb-2">Plataformas:</h4>
            <div className="flex flex-wrap gap-2">
                {ad.publisher_platforms?.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
            </div>
        </div>
      </CardContent>
    </Card>
  )
};


export default function FBLibraryPage() {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);

  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');

   useEffect(() => {
    const savedAppId = localStorage.getItem(FACEBOOK_APP_ID_STORAGE_ITEM);
    const savedAppSecret = localStorage.getItem(FACEBOOK_APP_SECRET_STORAGE_ITEM);
    if (savedAppId) setAppId(savedAppId);
    if (savedAppSecret) setAppSecret(savedAppSecret);
  }, []);


  const handleSearch = async () => {
    if (!keyword) {
      toast({ title: 'Digite uma palavra-chave para buscar.', variant: 'destructive' });
      return;
    }
    if(!appId || !appSecret) {
      setError("Credenciais da API do Facebook não encontradas. Por favor, adicione-as na página de Configurações.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAds([]);

    try {
      const result = await searchFacebookAds({ appId, appSecret, keyword });
      if (result.error) {
        setError(result.error);
      } else {
        setAds(result.ads || []);
        if(!result.ads || result.ads.length === 0){
            toast({title: "Nenhum resultado", description: "Nenhum anúncio encontrado para esta palavra-chave."})
        }
      }
    } catch (e: any) {
      setError(e.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Anúncios do Facebook</h1>
          <p className="text-muted-foreground">
            Pesquise anúncios por palavra-chave para analisar a concorrência e ter ideias.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Pesquisar Anúncios</CardTitle>
            <CardDescription>
              Digite uma palavra-chave para encontrar anúncios relevantes na biblioteca do Facebook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-4">
              <Input
                id="keyword"
                placeholder="ex: 'curso de marketing digital'"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Pesquisar
              </Button>
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
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Card key={i}><CardHeader><Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" /></CardHeader><CardContent className="h-48"></CardContent></Card>)}
          </div>
        ) : ads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
