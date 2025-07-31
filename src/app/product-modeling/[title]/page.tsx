
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Copy, Check, Bot, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { generateProductStructure, GenerateProductStructureOutput } from '@/ai/flows/generate-product-structure';
import { generateHeadlines, GenerateHeadlinesOutput } from '@/ai/flows/generate-headlines';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const SkeletonLoader = ({ items = 3 }) => (
    <div className="space-y-4">
        {[...Array(items)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border space-y-2">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-4 w-4/5" />
            </div>
        ))}
    </div>
);


export default function ProductModelingPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const title = decodeURIComponent(params.title as string);
    const description = searchParams.get('description') || '';

    const [activeTab, setActiveTab] = useState('structure');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [structure, setStructure] = useState<GenerateProductStructureOutput | null>(null);
    const [headlines, setHeadlines] = useState<GenerateHeadlinesOutput | null>(null);
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});


    const handleGenerate = async (type: 'structure' | 'headlines') => {
        setIsLoading(true);
        setError(null);
        
        if (type === 'structure') {
            setStructure(null);
            try {
                const result = await generateProductStructure({ title, description });
                setStructure(result);
            } catch (e: any) {
                setError(e.message || 'Falha ao gerar a estrutura do produto.');
            }
        } else {
            setHeadlines(null);
            try {
                const result = await generateHeadlines({ title, description });
                setHeadlines(result);
            } catch (e: any) {
                setError(e.message || 'Falha ao gerar as headlines.');
            }
        }
        setIsLoading(false);
    };

    const handleCopyToClipboard = (textToCopy: string, id: string) => {
        navigator.clipboard.writeText(textToCopy);
        setCopiedStates(prev => ({...prev, [id]: true}));
        toast({ title: 'Copiado!', description: 'O conteúdo foi copiado para a área de transferência.' });
        setTimeout(() => setCopiedStates(prev => ({...prev, [id]: false})), 2000);
    };

    const productTypeMap: { [key: string]: string } = {
        ebook: 'E-book',
        video_course: 'Curso em Vídeo',
        guide: 'Guia Prático',
        other: 'Outro'
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <Button asChild variant="outline" size="sm">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Painel
                    </Link>
                </Button>
            </div>

            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-lg text-muted-foreground mt-1">{description}</p>
            </header>

             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="structure">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Estrutura do Produto
                    </TabsTrigger>
                    <TabsTrigger value="headlines">
                         <Wand2 className="mr-2 h-4 w-4" />
                        Headlines & Copy
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="structure" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gerador de Estrutura de Produto</CardTitle>
                            <CardDescription>
                                Clique no botão abaixo para que a IA crie uma estrutura de capítulos ou módulos para o seu produto digital.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Button onClick={() => handleGenerate('structure')} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Gerar Estrutura
                            </Button>
                            
                            {error && activeTab === 'structure' && <Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                            {isLoading && !structure && <SkeletonLoader items={4} />}

                            {structure && (
                                <div className="space-y-4">
                                     <div>
                                        <h3 className="font-semibold text-lg mb-2">Tipo de Produto Sugerido: <Badge variant="secondary">{productTypeMap[structure.productType] || 'Produto'}</Badge></h3>
                                    </div>
                                    <div className="space-y-4">
                                    {structure.chapters.map((chapter, index) => (
                                        <Card key={index} className="bg-muted/10">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg">{index + 1}. {chapter.title}</CardTitle>
                                                        <CardDescription className="mt-1">{chapter.description}</CardDescription>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(`${chapter.title}\n${chapter.description}`, `ch-${index}`)}>
                                                        {copiedStates[`ch-${index}`] ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="headlines" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Gerador de Headlines (Copy)</CardTitle>
                            <CardDescription>
                                Clique no botão para gerar headlines e sub-headlines persuasivas para a página de vendas do seu produto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <Button onClick={() => handleGenerate('headlines')} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                Gerar Headlines
                            </Button>
                            
                            {error && activeTab === 'headlines' && <Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                            
                            {isLoading && !headlines && <SkeletonLoader items={3} />}

                            {headlines && (
                                <div className="space-y-4">
                                    {headlines.headlines.map((headline, index) => (
                                         <Card key={index} className="bg-muted/10">
                                             <CardHeader>
                                                 <div className="flex justify-between items-start">
                                                     <div>
                                                         <h3 className="text-xl font-bold text-primary">{`"${headline.headline}"`}</h3>
                                                         <p className="text-muted-foreground mt-2">{headline.subheadline}</p>
                                                     </div>
                                                     <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(`Headline: ${headline.headline}\nSub-headline: ${headline.subheadline}`, `hl-${index}`)}>
                                                        {copiedStates[`hl-${index}`] ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                 </div>
                                             </CardHeader>
                                         </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
