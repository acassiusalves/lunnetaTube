
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, CheckCircle, XCircle, Bot, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const API_KEY_STORAGE_ITEM = "youtube_api_key";
const COMMENT_ANALYSIS_PROMPT_STORAGE_ITEM = "comment_analysis_prompt";
const AI_MODEL_STORAGE_ITEM = "ai_model";


const SettingsSkeleton = () => (
    <div className="container mx-auto max-w-3xl space-y-6">
        <header>
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
        </header>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
    </div>
);


export default function SettingsPage() {
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();

  const [apiKey, setApiKey] = useState("");
  const [commentAnalysisPrompt, setCommentAnalysisPrompt] = useState("");
  const [aiModel, setAiModel] = useState("googleai/gemini-1.5-flash");
  const [isConnected, setIsConnected] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsConnected(true);
    }
    const savedPrompt = localStorage.getItem(COMMENT_ANALYSIS_PROMPT_STORAGE_ITEM);
    if (savedPrompt) {
      setCommentAnalysisPrompt(savedPrompt);
    }
    const savedModel = localStorage.getItem(AI_MODEL_STORAGE_ITEM);
    if (savedModel) {
      setAiModel(savedModel);
    }
  }, []);

  const handleSaveSettings = () => {
    // Save API Key
    if (apiKey) {
      localStorage.setItem(API_KEY_STORAGE_ITEM, apiKey);
      setIsConnected(true);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_ITEM);
      setIsConnected(false);
    }
    
    // Save Comment Analysis Prompt
     if (commentAnalysisPrompt) {
        localStorage.setItem(COMMENT_ANALYSIS_PROMPT_STORAGE_ITEM, commentAnalysisPrompt);
    } else {
        localStorage.removeItem(COMMENT_ANALYSIS_PROMPT_STORAGE_ITEM);
    }

    // Save AI Model
    localStorage.setItem(AI_MODEL_STORAGE_ITEM, aiModel);

    toast({
        title: "Configurações Salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
    });
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSaveSettings();
  };

  if (authLoading || !isMounted) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header>
          <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">
                    Gerencie as configurações da sua conta e as integrações de API.
                </p>
            </div>
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Salvar Tudo
            </Button>
          </div>
        </header>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>API do YouTube</CardTitle>
              {isConnected ? (
                <Badge variant="secondary" className="border-green-500 text-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Desconectado
                </Badge>
              )}
            </div>
            <CardDescription>
              Insira sua chave de API do YouTube para buscar vídeos e dados. Você
              pode obter uma chave no{" "}
              <Link
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Google Cloud Console
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="youtube-api-key">Chave de API do YouTube</Label>
              <Input
                id="youtube-api-key"
                type="password"
                placeholder="Cole sua chave de API aqui"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot />
                    Modelo de IA
                </CardTitle>
                <CardDescription>
                    Escolha o modelo de inteligência artificial para realizar as análises. O modelo Pro é mais poderoso, mas pode ser mais lento.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="ai-model">Modelo de Análise</Label>
                    <Select value={aiModel} onValueChange={setAiModel}>
                        <SelectTrigger id="ai-model">
                            <SelectValue placeholder="Selecione um modelo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="googleai/gemini-1.5-flash">
                                Gemini 1.5 Flash (Rápido e eficiente)
                            </SelectItem>
                             <SelectItem value="googleai/gemini-2.5-pro">
                                Gemini 2.5 Pro (Mais poderoso)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        {userProfile?.role === 'admin' && (
            <Card>
            <CardHeader>
                <CardTitle>Prompt de Análise de Comentários</CardTitle>
                <CardDescription>
                    Personalize o prompt que a IA usará para analisar os comentários dos vídeos. 
                    Deixe em branco para usar o prompt padrão. A IA sempre receberá a lista de comentários após seu prompt.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                <Label htmlFor="comment-analysis-prompt">Prompt Personalizado</Label>
                <Textarea
                    id="comment-analysis-prompt"
                    placeholder="Ex: Você é um analista de marketing. Analise os comentários e identifique as 3 principais dúvidas dos clientes e 3 sugestões de melhoria para o produto..."
                    value={commentAnalysisPrompt}
                    onChange={(e) => setCommentAnalysisPrompt(e.target.value)}
                    className="min-h-[150px]"
                />
                </div>
            </CardContent>
            <CardFooter className="justify-end">
                <Button type="button" onClick={handleSaveSettings}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                </Button>
            </CardFooter>
            </Card>
        )}
      </form>
    </div>
  );
}
