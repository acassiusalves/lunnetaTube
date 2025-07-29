"use client";

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
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Em um aplicativo real, você salvaria a chave de API no backend
    toast({
      title: "Configurações Salvas",
      description: "Sua chave de API do YouTube foi salva com sucesso.",
    });
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
              <CardTitle>API do YouTube</CardTitle>
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
                />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
