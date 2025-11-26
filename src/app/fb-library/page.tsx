
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

const FACEBOOK_ACCESS_TOKEN_STORAGE_ITEM = 'facebook_access_token';


const AdCard = ({ ad }: { ad: Ad }) => {
  const formatImpressions = (impressions: any) => {
    if (!impressions || !impressions.lower_bound) return 'N/A';
    // O schema agora retorna string, então tratamos como tal
    const lower = parseInt(impressions.lower_bound, 10);
    if (isNaN(lower)) return 'N/A';
    if (impressions.upper_bound) {
       return `${impressions.lower_bound} - ${impressions.upper_bound}`;
    }
    return `>= ${impressions.lower_bound}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">{ad.page_name || 'Página não informada'}</CardTitle>
                <CardDescription>Criado em: {formatDate(ad.ad_creation_time)}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" disabled={!ad.ad_snapshot_url}>
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
            <p className="text-sm text-muted-foreground">{ad.ad_creative_bodies?.[0] || 'Não disponível'}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 text-sm">
            <div><span className="font-semibold">Impressões:</span> {formatImpressions(ad.impressions)}</div>
        </div>
         {ad.publisher_platforms && ad.publisher_platforms.length > 0 && (
            <div>
                <h4 className="font-semibold text-sm mb-2">Plataformas:</h4>
                <div className="flex flex-wrap gap-2">
                    {ad.publisher_platforms?.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                </div>
            </div>
         )}
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

  const [accessToken, setAccessToken] = useState('');


   useEffect(() => {
    const savedAccessToken = localStorage.getItem(FACEBOOK_ACCESS_TOKEN_STORAGE_ITEM);
    if (savedAccessToken) setAccessToken(savedAccessToken.trim());
  }, []);


  const handleSearch = async () => {
    if (!keyword) {
      toast({ title: 'Digite uma palavra-chave para buscar.', variant: 'destructive' });
      return;
    }
    const token = accessToken.trim();
    if(!token) {
      setError("Token de Acesso da API do Facebook não encontrado. Por favor, adicione-o na página de Configurações.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAds([]);

    try {
      const result = await searchFacebookAds({ accessToken: token, keyword });
      if (result.error) {
        setError(result.error);
      } else {
        setAds(result.ads || []);
        if(!result.ads || result.ads.length === 0){
            toast({
              title: "Nenhum resultado",
              description: "Nenhum anúncio político/social encontrado para esta palavra-chave. Tente termos relacionados a temas sociais, políticos, saúde ou educação.",
              variant: "default"
            })
        } else {
            toast({
              title: "Busca concluída!",
              description: `${result.ads.length} anúncios encontrados.`
            })
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

        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Limitação da API do Facebook</AlertTitle>
          <AlertDescription>
            A API do Facebook Ad Library só permite buscar anúncios <strong>políticos e de questões sociais</strong> por palavra-chave.
            Para buscar anúncios comerciais, use a <Link href="https://www.facebook.com/ads/library" target="_blank" className="underline font-semibold">interface web</Link> e procure diretamente pela página do anunciante.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Pesquisar Anúncios</CardTitle>
            <CardDescription>
              Digite uma palavra-chave para encontrar anúncios políticos e de questões sociais. Para anúncios comerciais, visite a biblioteca web do Facebook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-4">
              <Input
                id="keyword"
                placeholder="ex: 'educação', 'saúde', 'política'"
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
