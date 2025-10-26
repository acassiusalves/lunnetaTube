/**
 * Análise de Tendências e Nichos
 * Identifica padrões em tags, crescimento viral, e sazonalidade
 */

import type { Video } from '@/lib/data';

export interface TagAnalysis {
  tag: string;
  count: number;
  avgScore: number;
  avgViews: number;
  avgEngagement: number;
  videos: string[]; // IDs dos vídeos
}

export interface TrendAnalysis {
  // Análise de Tags
  topTags: TagAnalysis[];
  tagCombinations: {
    tags: string[];
    count: number;
    avgScore: number;
  }[];

  // Detector de Viral
  viralVideos: {
    video: Video;
    viralScore: number; // 0-100
    growthRate: number; // views por dia
    isAccelerating: boolean;
  }[];

  // Análise Temporal
  seasonalityInsights: {
    recentTrend: 'crescente' | 'estável' | 'decrescente';
    avgPublicationAge: number; // dias
    recentVideosPercentage: number; // % de vídeos dos últimos 30 dias
  };

  // Padrões de Nicho
  nicheInsights: {
    isNiche: boolean; // Se é um nicho específico
    avgChannelSize: number;
    smallChannelOpportunity: boolean; // Muitos canais pequenos = oportunidade
    competitionLevel: 'baixa' | 'média' | 'alta';
  };
}

/**
 * Analisa tags e retorna as mais relevantes
 */
export function analyzeTagsAndTopics(videos: Video[]): TagAnalysis[] {
  const tagMap = new Map<string, {
    count: number;
    totalScore: number;
    totalViews: number;
    totalEngagement: number;
    videos: string[];
  }>();

  // Processar tags de todos os vídeos
  videos.forEach(video => {
    if (video.tags && video.tags.length > 0) {
      video.tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase().trim();

        if (!tagMap.has(normalizedTag)) {
          tagMap.set(normalizedTag, {
            count: 0,
            totalScore: 0,
            totalViews: 0,
            totalEngagement: 0,
            videos: []
          });
        }

        const tagData = tagMap.get(normalizedTag)!;
        tagData.count++;
        tagData.totalScore += video.infoproductScore || 0;
        tagData.totalViews += video.views || 0;
        tagData.totalEngagement += video.engagementRate || 0;
        tagData.videos.push(video.id);
      });
    }
  });

  // Converter para array e calcular médias
  const tagAnalysis: TagAnalysis[] = Array.from(tagMap.entries()).map(([tag, data]) => ({
    tag,
    count: data.count,
    avgScore: data.totalScore / data.count,
    avgViews: data.totalViews / data.count,
    avgEngagement: data.totalEngagement / data.count,
    videos: data.videos
  }));

  // Ordenar por relevância (score médio * quantidade)
  return tagAnalysis
    .sort((a, b) => (b.avgScore * b.count) - (a.avgScore * a.count))
    .slice(0, 20); // Top 20 tags
}

/**
 * Detecta vídeos virais ou em crescimento acelerado
 */
export function detectViralVideos(videos: Video[]): TrendAnalysis['viralVideos'] {
  const viralVideos = videos
    .filter(video => video.viewsPerDay && video.viewsPerDay > 0)
    .map(video => {
      const viewsPerDay = video.viewsPerDay || 0;
      const views = video.views || 1;
      const publishedDate = new Date(video.publishedAt);
      const daysSincePublished = Math.max(1, Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Calcular se está acelerando (vídeos recentes com muitas views/dia)
      const isRecent = daysSincePublished <= 14; // Últimas 2 semanas
      const hasHighGrowth = viewsPerDay > 1000;
      const isAccelerating = isRecent && hasHighGrowth;

      // Viral Score (0-100)
      let viralScore = 0;

      // Views por dia (0-40 pontos)
      if (viewsPerDay > 50000) viralScore += 40;
      else if (viewsPerDay > 20000) viralScore += 35;
      else if (viewsPerDay > 10000) viralScore += 30;
      else if (viewsPerDay > 5000) viralScore += 25;
      else if (viewsPerDay > 2000) viralScore += 20;
      else if (viewsPerDay > 1000) viralScore += 15;
      else if (viewsPerDay > 500) viralScore += 10;

      // Aceleração recente (0-30 pontos)
      if (isAccelerating) {
        viralScore += 30;
      } else if (isRecent) {
        viralScore += 15;
      }

      // Engajamento alto (0-20 pontos)
      const engagementRate = video.engagementRate || 0;
      if (engagementRate > 50) viralScore += 20;
      else if (engagementRate > 30) viralScore += 15;
      else if (engagementRate > 15) viralScore += 10;

      // Performance do canal (0-10 pontos)
      const channelPerf = video.channelPerformanceRatio || 1;
      if (channelPerf > 5) viralScore += 10;
      else if (channelPerf > 3) viralScore += 7;
      else if (channelPerf > 2) viralScore += 5;

      return {
        video,
        viralScore: Math.min(100, viralScore),
        growthRate: viewsPerDay,
        isAccelerating
      };
    })
    .filter(v => v.viralScore >= 30) // Apenas vídeos com score viral >= 30
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 10); // Top 10 virais

  return viralVideos;
}

/**
 * Analisa sazonalidade e tendências temporais
 */
export function analyzeSeasonality(videos: Video[]): TrendAnalysis['seasonalityInsights'] {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

  let recentVideos = 0;
  let olderVideos = 0;
  let totalDays = 0;

  videos.forEach(video => {
    const publishedDate = new Date(video.publishedAt).getTime();
    const days = Math.floor((now - publishedDate) / (1000 * 60 * 60 * 24));
    totalDays += days;

    if (publishedDate > thirtyDaysAgo) {
      recentVideos++;
    } else if (publishedDate > sixtyDaysAgo) {
      olderVideos++;
    }
  });

  const avgPublicationAge = videos.length > 0 ? totalDays / videos.length : 0;
  const recentVideosPercentage = videos.length > 0 ? (recentVideos / videos.length) * 100 : 0;

  // Determinar tendência
  let recentTrend: 'crescente' | 'estável' | 'decrescente';
  if (recentVideosPercentage > 40) {
    recentTrend = 'crescente'; // Muitos vídeos recentes = tema em alta
  } else if (recentVideosPercentage > 20) {
    recentTrend = 'estável';
  } else {
    recentTrend = 'decrescente'; // Poucos vídeos recentes = tema esfriando
  }

  return {
    recentTrend,
    avgPublicationAge: Math.round(avgPublicationAge),
    recentVideosPercentage: Math.round(recentVideosPercentage)
  };
}

/**
 * Analisa padrões de nicho
 */
export function analyzeNichePatterns(videos: Video[]): TrendAnalysis['nicheInsights'] {
  const channelSizes: number[] = [];
  let smallChannels = 0;
  let mediumChannels = 0;
  let largeChannels = 0;

  videos.forEach(video => {
    if (video.channelStats) {
      const subs = video.channelStats.subscriberCount;
      channelSizes.push(subs);

      if (subs < 50000) smallChannels++;
      else if (subs < 500000) mediumChannels++;
      else largeChannels++;
    }
  });

  const avgChannelSize = channelSizes.length > 0
    ? channelSizes.reduce((a, b) => a + b, 0) / channelSizes.length
    : 0;

  const totalChannels = channelSizes.length;
  const smallChannelPercentage = totalChannels > 0 ? (smallChannels / totalChannels) * 100 : 0;

  // É nicho se média de inscritos for baixa ou moderada
  const isNiche = avgChannelSize < 200000;

  // Oportunidade para canais pequenos se maioria são canais pequenos
  const smallChannelOpportunity = smallChannelPercentage > 60;

  // Nível de competição
  let competitionLevel: 'baixa' | 'média' | 'alta';
  if (largeChannels > totalChannels * 0.5) {
    competitionLevel = 'alta'; // Maioria são canais grandes
  } else if (mediumChannels > totalChannels * 0.4) {
    competitionLevel = 'média';
  } else {
    competitionLevel = 'baixa'; // Maioria são canais pequenos
  }

  return {
    isNiche,
    avgChannelSize: Math.round(avgChannelSize),
    smallChannelOpportunity,
    competitionLevel
  };
}

/**
 * Análise completa de tendências
 */
export function analyzeTrends(videos: Video[]): TrendAnalysis {
  const topTags = analyzeTagsAndTopics(videos);
  const viralVideos = detectViralVideos(videos);
  const seasonalityInsights = analyzeSeasonality(videos);
  const nicheInsights = analyzeNichePatterns(videos);

  // Analisar combinações de tags (tags que aparecem juntas)
  const tagCombinations: Map<string, { count: number; totalScore: number }> = new Map();

  videos.forEach(video => {
    if (video.tags && video.tags.length >= 2) {
      // Pegar pares de tags
      for (let i = 0; i < video.tags.length - 1; i++) {
        for (let j = i + 1; j < Math.min(i + 3, video.tags.length); j++) {
          const combo = [video.tags[i], video.tags[j]]
            .map(t => t.toLowerCase().trim())
            .sort()
            .join(' + ');

          if (!tagCombinations.has(combo)) {
            tagCombinations.set(combo, { count: 0, totalScore: 0 });
          }

          const comboData = tagCombinations.get(combo)!;
          comboData.count++;
          comboData.totalScore += video.infoproductScore || 0;
        }
      }
    }
  });

  const topCombinations = Array.from(tagCombinations.entries())
    .map(([combo, data]) => ({
      tags: combo.split(' + '),
      count: data.count,
      avgScore: data.totalScore / data.count
    }))
    .filter(c => c.count >= 2) // Pelo menos 2 vídeos
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 10);

  return {
    topTags,
    tagCombinations: topCombinations,
    viralVideos,
    seasonalityInsights,
    nicheInsights
  };
}
