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
import { Save, CheckCircle, XCircle } from "lucide-react";

const API_KEY_STORAGE_ITEM = "youtube_api_key";

export default function SettingsPage() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsConnected(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (apiKey) {
      localStorage.setItem(API_KEY_STORAGE_ITEM, apiKey);
      setIsConnected(true);
      toast({
        title: "Configurações Salvas",
        description: "Sua chave de API do YouTube foi salva com sucesso.",
      });
    } else {
      localStorage.removeItem(API_KEY_STORAGE_ITEM);
      setIsConnected(false);
      toast({
        title: "Chave Removida",
        description: "Sua chave de API do YouTube foi removida.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="space-y-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua conta e as integrações de API.
          </p>
        </header>
        <form onSubmit={handleSubmit}>
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
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Salvar Chave
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
