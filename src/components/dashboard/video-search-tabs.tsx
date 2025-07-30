
"use client";

import React, { useRef, useState, useEffect } from "react";
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
  initialParams: SearchParams | null;
}

export function VideoSearchTabs({ onSearch, isLoading, initialParams }: VideoSearchTabsProps) {
  const [activeTab, setActiveTab] = useState(initialParams?.type || 'keyword');
  
  // Refs for keyword search
  const keywordRef = useRef<HTMLInputElement>(null);
  const [countryKeyword, setCountryKeyword] = useState(initialParams?.country || "br");
  const minViewsRef = useRef<HTMLInputElement>(null);
  const [excludeShortsKeyword, setExcludeShortsKeyword] = useState(initialParams?.excludeShorts || false);


  // Refs for trending search
  const [categoryTrending, setCategoryTrending] = useState(initialParams?.category);
  const [countryTrending, setCountryTrending] = useState(initialParams?.country || "br");
  const [excludeShortsTrending, setExcludeShortsTrending] = useState(initialParams?.excludeShorts || false);

  useEffect(() => {
    if (initialParams) {
        setActiveTab(initialParams.type);
        if (initialParams.type === 'keyword') {
            if(keywordRef.current) keywordRef.current.value = initialParams.keyword || '';
            setCountryKeyword(initialParams.country || 'br');
            if(minViewsRef.current) minViewsRef.current.value = String(initialParams.minViews || 100000);
            setExcludeShortsKeyword(initialParams.excludeShorts || false);
        } else {
            setCategoryTrending(initialParams.category);
            setCountryTrending(initialParams.country || 'br');
            setExcludeShortsTrending(initialParams.excludeShorts || false);
        }
    }
  }, [initialParams]);


  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let params: SearchParams = { type: activeTab as 'keyword' | 'trending' };

    if (activeTab === 'keyword') {
      params = {
        ...params,
        keyword: keywordRef.current?.value || '',
        country: countryKeyword,
        minViews: minViewsRef.current ? parseInt(minViewsRef.current.value, 10) : 100000,
        excludeShorts: excludeShortsKeyword,
      };
    } else { // trending
      params = {
        ...params,
        category: categoryTrending,
        country: countryTrending,
        excludeShorts: excludeShortsTrending,
      };
    }
    onSearch(params);
  };
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  <Input ref={keywordRef} id="keyword" placeholder="ex: 'ferramentas de gestão de produtos'" defaultValue={initialParams?.keyword} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Select value={countryKeyword} onValueChange={setCountryKeyword}>
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
                  <Input ref={minViewsRef} id="views" type="number" placeholder="ex: 100000" defaultValue={initialParams?.minViews || 100000} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="exclude-shorts-keyword" checked={excludeShortsKeyword} onCheckedChange={(checked) => setExcludeShortsKeyword(checked as boolean)} />
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
                  <Select value={categoryTrending} onValueChange={setCategoryTrending}>
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
                  <Select value={countryTrending} onValueChange={setCountryTrending}>
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
                  <Checkbox id="exclude-shorts-trending" checked={excludeShortsTrending} onCheckedChange={(checked) => setExcludeShortsTrending(checked as boolean)} />
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
