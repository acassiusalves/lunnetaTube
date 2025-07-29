"use client";

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

interface VideoSearchTabsProps {
  onSearch: () => void;
  isLoading: boolean;
}

export function VideoSearchTabs({ onSearch, isLoading }: VideoSearchTabsProps) {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  
  return (
    <Tabs defaultValue="keyword">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="keyword">Search by Keyword</TabsTrigger>
        <TabsTrigger value="trending">Trending Videos</TabsTrigger>
      </TabsList>
      <TabsContent value="keyword">
        <Card>
          <CardHeader>
            <CardTitle>Keyword Search</CardTitle>
            <CardDescription>
              Find videos based on keywords and specific filters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="keyword">Keyword</Label>
                  <Input id="keyword" placeholder="e.g., 'product management tools'" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select a country" />
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
                  <Label htmlFor="views">Minimum Views</Label>
                  <Input id="views" type="number" placeholder="e.g., 100000" />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="exclude-shorts-keyword" />
                  <Label htmlFor="exclude-shorts-keyword" className="text-sm font-normal">
                    Exclude Shorts
                  </Label>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="trending">
        <Card>
          <CardHeader>
            <CardTitle>Trending Videos</CardTitle>
            <CardDescription>
              Discover what's currently trending in different categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
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
                  <Label htmlFor="country-trending">Country</Label>
                  <Select>
                    <SelectTrigger id="country-trending">
                      <SelectValue placeholder="Select a country" />
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
                  <Checkbox id="exclude-shorts-trending" />
                  <Label htmlFor="exclude-shorts-trending" className="text-sm font-normal">
                    Exclude Shorts
                  </Label>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
                   {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
