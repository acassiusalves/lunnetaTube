"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Flame, Target, Users, Calendar, Tag as TagIcon } from "lucide-react";
import type { TrendAnalysis } from "@/lib/trends-analyzer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TrendsPanelProps {
  analysis: TrendAnalysis;
  totalVideos: number;
}

export function TrendsPanel({ analysis, totalVideos }: TrendsPanelProps) {
  const { topTags, tagCombinations, viralVideos, seasonalityInsights, nicheInsights } = analysis;

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tendência Temporal */}
        <Card className="border-soft-blue/20 hover:shadow-lg hover:shadow-soft-blue/10 transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-soft-blue-700">
              <Calendar className="h-4 w-4" />
              Tendência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {seasonalityInsights.recentTrend === 'crescente' && (
                <>
                  <div className="p-2 bg-soft-green-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-soft-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-soft-green-600">Crescente</p>
                    <p className="text-xs text-muted-foreground">
                      {seasonalityInsights.recentVideosPercentage}% são recentes
                    </p>
                  </div>
                </>
              )}
              {seasonalityInsights.recentTrend === 'estável' && (
                <>
                  <div className="p-2 bg-soft-blue-50 rounded-lg">
                    <Minus className="h-6 w-6 text-soft-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-soft-blue-600">Estável</p>
                    <p className="text-xs text-muted-foreground">
                      {seasonalityInsights.recentVideosPercentage}% são recentes
                    </p>
                  </div>
                </>
              )}
              {seasonalityInsights.recentTrend === 'decrescente' && (
                <>
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">Esfriando</p>
                    <p className="text-xs text-muted-foreground">
                      {seasonalityInsights.recentVideosPercentage}% são recentes
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Nível de Nicho */}
        <Card className="border-soft-green/20 hover:shadow-lg hover:shadow-soft-green/10 transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-soft-green-700">
              <Target className="h-4 w-4" />
              Nicho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-soft-green-50 rounded-lg">
                <Target className="h-6 w-6 text-soft-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-soft-green-600">
                  {nicheInsights.isNiche ? 'Específico' : 'Amplo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(nicheInsights.avgChannelSize / 1000).toFixed(0)}k subs médio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competição */}
        <Card className="border-soft-blue/20 hover:shadow-lg hover:shadow-soft-blue/10 transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-soft-blue-700">
              <Users className="h-4 w-4" />
              Competição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                nicheInsights.competitionLevel === 'baixa' ? 'bg-soft-green-50' :
                nicheInsights.competitionLevel === 'média' ? 'bg-yellow-50' :
                'bg-red-50'
              }`}>
                <Users className={`h-6 w-6 ${
                  nicheInsights.competitionLevel === 'baixa' ? 'text-soft-green-600' :
                  nicheInsights.competitionLevel === 'média' ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  nicheInsights.competitionLevel === 'baixa' ? 'text-soft-green-600' :
                  nicheInsights.competitionLevel === 'média' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {nicheInsights.competitionLevel === 'baixa' ? 'Baixa' :
                   nicheInsights.competitionLevel === 'média' ? 'Média' : 'Alta'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nicheInsights.smallChannelOpportunity
                    ? 'Boa para iniciantes'
                    : 'Canais grandes dominam'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Virais */}
        <Card className="border-orange-200 hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 bg-gradient-to-br from-orange-50/50 to-red-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
              <Flame className="h-4 w-4" />
              Vídeos Virais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {viralVideos.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {viralVideos.filter(v => v.isAccelerating).length} acelerando
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Tags */}
      {topTags.length > 0 && (
        <Card className="border-soft-blue/20 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-soft-blue-50 rounded-lg">
                <TagIcon className="h-5 w-5 text-soft-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-soft-blue-900">
                  Top Tags por Score de Infoproduto
                </CardTitle>
                <CardDescription className="text-sm">
                  Tags mais relevantes para identificar oportunidades
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topTags.slice(0, 15).map((tag, idx) => (
                <Tooltip key={idx}>
                  <TooltipTrigger>
                    <Badge
                      variant="secondary"
                      className={`cursor-pointer hover:scale-105 transition-transform ${
                        tag.avgScore >= 70 ? 'bg-gradient-to-r from-soft-green-100 to-soft-green-50 text-soft-green-800 border-soft-green-300 hover:shadow-md' :
                        tag.avgScore >= 50 ? 'bg-gradient-to-r from-soft-blue-100 to-soft-blue-50 text-soft-blue-800 border-soft-blue-300 hover:shadow-md' :
                        'hover:shadow-sm'
                      }`}
                    >
                      #{tag.tag} ({tag.count})
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border-soft-blue-200 shadow-lg">
                    <div className="text-xs space-y-1">
                      <p><strong className="text-soft-blue-700">Vídeos:</strong> {tag.count}</p>
                      <p><strong className="text-soft-blue-700">Score médio:</strong> {tag.avgScore.toFixed(0)}/100</p>
                      <p><strong className="text-soft-blue-700">Views médias:</strong> {(tag.avgViews / 1000).toFixed(0)}k</p>
                      <p><strong className="text-soft-blue-700">Engajamento:</strong> {tag.avgEngagement.toFixed(1)}/1000</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Combinações de Tags */}
      {tagCombinations.length > 0 && (
        <Card className="border-soft-green/20 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-soft-green-50 rounded-lg">
                <TagIcon className="h-5 w-5 text-soft-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-soft-green-900">
                  Combinações de Tags Populares
                </CardTitle>
                <CardDescription className="text-sm">
                  Tags que aparecem juntas com alto score
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tagCombinations.slice(0, 8).map((combo, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-soft-green-50/50 to-white rounded-lg border border-soft-green-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-soft-green-900">
                      #{combo.tags[0]} + #{combo.tags[1]}
                    </span>
                    <Badge variant="outline" className="text-xs border-soft-green-300 text-soft-green-700">
                      {combo.count} vídeos
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold text-soft-green-600">
                    {combo.avgScore.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vídeos Virais */}
      {viralVideos.length > 0 && (
        <Card className="border-orange-200 shadow-sm bg-gradient-to-br from-orange-50/30 to-red-50/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                  Vídeos em Crescimento Viral
                </CardTitle>
                <CardDescription className="text-sm">
                  Vídeos com crescimento acelerado - oportunidade de agir rápido!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {viralVideos.slice(0, 5).map((viral, idx) => (
                <div key={idx} className="p-4 border border-orange-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm line-clamp-2 text-gray-900">
                        {viral.video.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">{viral.video.channel}</span>
                        <span>•</span>
                        <span>{(viral.video.views / 1000).toFixed(0)}k views</span>
                        {viral.isAccelerating && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600 font-semibold flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded">
                              <TrendingUp className="h-3 w-3" />
                              Acelerando
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg">
                        <div className="text-lg font-bold">
                          {viral.viralScore}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(viral.growthRate / 1000).toFixed(1)}k/dia
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
