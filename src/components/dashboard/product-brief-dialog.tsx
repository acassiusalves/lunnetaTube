
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { useProductBrief } from '@/context/ProductBriefContext';
import { generateProductBrief, GenerateProductBriefOutput } from '@/ai/flows/generate-product-brief';
import { Loader2, Copy, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

const SkeletonLoader = () => (
    <div className="space-y-6">
        <div className="space-y-2">
            <div className="h-5 w-2/5 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-4/5 rounded-lg bg-muted animate-pulse" />
        </div>
         <div className="space-y-2">
            <div className="h-5 w-1/4 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-3/4 rounded-lg bg-muted animate-pulse" />
        </div>
         <div className="space-y-2">
            <div className="h-5 w-1/3 rounded-lg bg-muted animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-muted animate-pulse" />
        </div>
    </div>
);


export function ProductBriefDialog() {
  const { isBriefOpen, closeBriefDialog, productIdea } = useProductBrief();
  const { toast } = useToast();
  const [brief, setBrief] = useState<GenerateProductBriefOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  React.useEffect(() => {
    if (isBriefOpen && productIdea) {
      // Reset state on open
      setBrief(null);
      setError(null);
      setIsLoading(true);
      
      const fetchBrief = async () => {
        try {
          const result = await generateProductBrief({
            title: productIdea.title,
            description: productIdea.description,
          });
          setBrief(result);
        } catch (e: any) {
          setError(e.message || 'Ocorreu um erro ao gerar o briefing.');
          toast({
            title: 'Erro de Geração',
            description: e.message || 'Não foi possível gerar o briefing do produto.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchBrief();
    }
  }, [isBriefOpen, productIdea, toast]);


  const handleCopyToClipboard = () => {
    if (!brief) return;

    const briefText = `
Nome do Produto: ${brief.productName}
Slogan: ${brief.slogan}

Público-Alvo:
${brief.targetAudience}

Pontos de Dor Resolvidos:
${brief.painPoints.map(p => `- ${p}`).join('\n')}

Principais Funcionalidades:
${brief.keyFeatures.map(f => `- ${f}`).join('\n')}
    `;

    navigator.clipboard.writeText(briefText.trim());
    setHasCopied(true);
    toast({ title: 'Copiado!', description: 'O briefing do produto foi copiado para a área de transferência.' });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Dialog open={isBriefOpen} onOpenChange={closeBriefDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Briefing de Produto Gerado por IA</DialogTitle>
          <DialogDescription>
            Aqui está um rascunho inicial para o seu produto, baseado na ideia selecionada.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
            {isLoading && <SkeletonLoader />}
            {error && (
                 <Alert variant="destructive">
                    <AlertTitle>Erro na Geração</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {brief && (
                <div className="space-y-6 text-sm">
                    <div>
                        <h3 className="text-lg font-semibold">{brief.productName}</h3>
                        <p className="text-muted-foreground italic">"{brief.slogan}"</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1">Público-Alvo</h4>
                        <p className="text-muted-foreground">{brief.targetAudience}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Pontos de Dor</h4>
                        <div className="flex flex-wrap gap-2">
                        {brief.painPoints.map((point, index) => (
                           <Badge key={index} variant="secondary">{point}</Badge>
                        ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Principais Funcionalidades</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {brief.keyFeatures.map((feature, index) => (
                                <li key={index}>{feature}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeBriefDialog}>
            Fechar
          </Button>
           <Button onClick={handleCopyToClipboard} disabled={!brief || hasCopied}>
                {hasCopied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                {hasCopied ? 'Copiado!' : 'Copiar Texto'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
