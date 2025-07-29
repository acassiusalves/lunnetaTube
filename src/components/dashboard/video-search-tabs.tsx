"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories, countries } from "@/lib/data";
import { Loader2, Search } from "lucide-react";

export interface SearchParams {
  type: 'keyword' | 'trending';
  keyword?: string;
  country?: string;
  minViews?: number;
  excludeShorts?: boolean;
  category?: string;
  pageToken?: string;
}

interface VideoSearchTabsProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

export function VideoSearchTabs({ onSearch, isLoading }: VideoSearchTabsProps) {
  const [activeTab, setActiveTab] = useState('keyword');
  
  // Refs for keyword search
  const keywordRef = useRef<HTMLInputElement>(null);
  const countryKeywordRef = useRef<string>("br");
  const minViewsRef = useRef<HTMLInputElement>(null);
  const excludeShortsKeywordRef = useRef<HTMLButtonElement>(null);

  // Refs for trending search
  const categoryTrendingRef = useRef<string>();
  const countryTrendingRef = useRef<string>("br");
  const excludeShortsTrendingRef = useRef<HTMLButtonElement>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let params: SearchParams = { type: activeTab as 'keyword' | 'trending' };

    if (activeTab === 'keyword') {
      params = {
        ...params,
        keyword: keywordRef.current?.value || '',
        country: countryKeywordRef.current,
        minViews: minViewsRef.current ? parseInt(minViewsRef.current.value, 10) : 100000,
        excludeShorts: excludeShortsKeywordRef.current?.getAttribute('data-state') === 'checked',
      };
    } else { // trending
      params = {
        ...params,
        category: categoryTrendingRef.current,
        country: countryTrendingRef.current,
        excludeShorts: excludeShortsTrendingRef.current?.getAttribute('data-state') === 'checked',
      };
    }
    onSearch(params);
  };
  
  return (
    <Tabs defaultValue="keyword" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
        <TabsTrigger value="keyword">Pesquisar por Palavra-chave</TabsTrigger>
        <TabsTrigger value="trending">Vídeos em Alta</TabsTrigger>
      </TabsList>
      <TabsContent value="keyword">
        <Card>
          <CardHeader>
            <CardTitle>Pesquisa por Palavra-chave</CardTitle>
            <CardDescription>
              Encontre vídeos com base em palavras-chave e filtros específicos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="keyword">Palavra-chave</Label>
                  <Input ref={keywordRef} id="keyword" placeholder="ex: 'ferramentas de gestão de produtos'" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Select defaultValue="br" onValueChange={(val) => countryKeywordRef.current = val}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Selecione um país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="views">Mínimo de Visualizações</Label>
                  <Input ref={minViewsRef} id="views" type="number" placeholder="ex: 100000" defaultValue={100000} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="exclude-shorts-keyword" ref={excludeShortsKeywordRef} />
                  <Label htmlFor="exclude-shorts-keyword" className="text-sm font-normal">
                    Excluir Shorts
                  </Label>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Pesquisar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="trending">
        <Card>
          <CardHeader>
            <CardTitle>Vídeos em Alta</CardTitle>
            <CardDescription>
              Descubra o que está em alta em diferentes categorias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select onValueChange={(val) => categoryTrendingRef.current = val}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="country-trending">País</Label>
                  <Select defaultValue="br" onValueChange={(val) => countryTrendingRef.current = val}>
                    <SelectTrigger id="country-trending">
                      <SelectValue placeholder="Selecione um país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="exclude-shorts-trending" ref={excludeShortsTrendingRef} />
                  <Label htmlFor="exclude-shorts-trending" className="text-sm font-normal">
                    Excluir Shorts
                  </Label>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
                   {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Pesquisar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
