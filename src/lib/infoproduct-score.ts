/**
 * Calcula o Score de Oportunidade de Infoproduto (0-100)
 *
 * Este score combina múltiplas métricas para identificar vídeos com
 * alto potencial para criação e venda de infoprodutos (ebooks, planilhas, etc.)
 */

import type { Video } from '@/lib/data';

export interface ScoreBreakdown {
  totalScore: number; // 0-100
  engagementScore: number; // 0-30
  commentAnalysisScore: number; // 0-25
  growthScore: number; // 0-10
  channelScore: number; // 0-10
  contentQualityScore: number; // 0-25
  breakdown: {
    engagement: string;
    commentAnalysis: string;
    growth: string;
    channel: string;
    contentQuality: string;
  };
  opportunity: 'baixa' | 'média' | 'boa' | 'excelente' | 'ouro';
}

/**
 * Calcula score baseado na taxa de engajamento
 * Taxa alta = audiência ativa e interessada
 */
function calculateEngagementScore(video: Video): { score: number; detail: string } {
  const engagementRate = video.engagementRate || 0;
  const commentsPerThousand = video.commentsPerThousandViews || 0;

  let score = 0;

  // Engajamento geral (0-20 pontos)
  if (engagementRate > 50) score += 20;
  else if (engagementRate > 30) score += 15;
  else if (engagementRate > 15) score += 10;
  else if (engagementRate > 5) score += 5;

  // Comentários especificamente (0-10 pontos)
  // Alto número de comentários = muitas dúvidas/interesse
  if (commentsPerThousand > 20) score += 10;
  else if (commentsPerThousand > 10) score += 7;
  else if (commentsPerThousand > 5) score += 4;
  else if (commentsPerThousand > 2) score += 2;

  return {
    score,
    detail: `Engaj: ${engagementRate.toFixed(1)}/1000 • Coment: ${commentsPerThousand.toFixed(1)}/1000`
  };
}

/**
 * Calcula score baseado na análise de comentários
 * CRÍTICO: Densidade de perguntas e pedidos de material
 */
function calculateCommentAnalysisScore(video: Video): { score: number; detail: string } {
  if (!video.commentAnalysis || video.commentAnalysis.totalComments === 0) {
    return { score: 0, detail: 'Sem análise de comentários' };
  }

  const analysis = video.commentAnalysis;
  let score = 0;

  // Densidade de perguntas (0-10 pontos)
  const questionDensity = analysis.questionDensity;
  if (questionDensity > 40) score += 10;
  else if (questionDensity > 30) score += 8;
  else if (questionDensity > 20) score += 6;
  else if (questionDensity > 10) score += 3;

  // Densidade de pedidos de material (0-12 pontos) - PESO MAIOR!
  const materialDensity = analysis.materialRequestDensity;
  if (materialDensity > 20) score += 12; // OURO!
  else if (materialDensity > 15) score += 10;
  else if (materialDensity > 10) score += 8;
  else if (materialDensity > 5) score += 5;
  else if (materialDensity > 2) score += 2;

  // Problemas/dificuldades relatados (0-3 pontos)
  const problemRatio = analysis.problemStatementsCount / analysis.totalComments;
  if (problemRatio > 0.15) score += 3;
  else if (problemRatio > 0.08) score += 2;
  else if (problemRatio > 0.03) score += 1;

  return {
    score,
    detail: `Perguntas: ${questionDensity.toFixed(1)}% • Pedidos: ${materialDensity.toFixed(1)}%`
  };
}

/**
 * Calcula score baseado no crescimento do vídeo
 * Vídeos virais recentes = tendência quente
 */
function calculateGrowthScore(video: Video): { score: number; detail: string } {
  const viewsPerDay = video.viewsPerDay || 0;
  const views = video.views || 0;

  let score = 0;

  // Views por dia (0-10 pontos)
  if (viewsPerDay > 10000) score += 10;
  else if (viewsPerDay > 5000) score += 8;
  else if (viewsPerDay > 2000) score += 6;
  else if (viewsPerDay > 1000) score += 4;
  else if (viewsPerDay > 500) score += 2;

  return {
    score,
    detail: `${Math.round(viewsPerDay).toLocaleString()} views/dia`
  };
}

/**
 * Calcula score baseado no canal
 * Canal pequeno com vídeo viral = oportunidade sem concorrência grande
 */
function calculateChannelScore(video: Video): { score: number; detail: string } {
  if (!video.channelStats) {
    return { score: 5, detail: 'Dados do canal indisponíveis' };
  }

  const stats = video.channelStats;
  const performance = video.channelPerformanceRatio || 1;

  let score = 0;

  // Performance relativa ao canal (0-5 pontos)
  if (performance > 5) score += 5; // Vídeo MUITO acima da média
  else if (performance > 3) score += 4;
  else if (performance > 2) score += 3;
  else if (performance > 1.5) score += 2;
  else if (performance >= 0.8) score += 1;

  // Tamanho do canal (0-5 pontos)
  // Canais menores = menos concorrência
  const subs = stats.subscriberCount;
  if (subs < 10000) score += 5; // Micro canal = nicho inexplorado
  else if (subs < 50000) score += 4;
  else if (subs < 100000) score += 3;
  else if (subs < 500000) score += 2;
  else if (subs < 1000000) score += 1;

  return {
    score,
    detail: `${(subs / 1000).toFixed(0)}k subs • ${performance.toFixed(1)}x média`
  };
}

/**
 * Calcula score baseado na qualidade do conteúdo
 * Views, likes, e outras métricas de validação
 */
function calculateContentQualityScore(video: Video): { score: number; detail: string } {
  const views = video.views || 0;
  const likes = video.likes || 0;
  const comments = video.comments || 0;

  let score = 0;

  // Views mínimas (0-10 pontos)
  // Muitas views = tema validado
  if (views > 1000000) score += 10;
  else if (views > 500000) score += 8;
  else if (views > 200000) score += 6;
  else if (views > 100000) score += 4;
  else if (views > 50000) score += 2;

  // Quantidade absoluta de comentários (0-10 pontos)
  // Muitos comentários = muitas dúvidas
  if (comments > 1000) score += 10;
  else if (comments > 500) score += 8;
  else if (comments > 200) score += 6;
  else if (comments > 100) score += 4;
  else if (comments > 50) score += 2;

  // Ratio likes/views (0-5 pontos)
  const likeRatio = views > 0 ? (likes / views) * 100 : 0;
  if (likeRatio > 5) score += 5;
  else if (likeRatio > 3) score += 4;
  else if (likeRatio > 2) score += 3;
  else if (likeRatio > 1) score += 2;
  else if (likeRatio > 0.5) score += 1;

  return {
    score,
    detail: `${(views / 1000).toFixed(0)}k views • ${comments} coment`
  };
}

/**
 * Determina o nível de oportunidade baseado no score
 */
function getOpportunityLevel(score: number): 'baixa' | 'média' | 'boa' | 'excelente' | 'ouro' {
  if (score >= 80) return 'ouro';
  if (score >= 65) return 'excelente';
  if (score >= 50) return 'boa';
  if (score >= 30) return 'média';
  return 'baixa';
}

/**
 * Calcula o Score de Infoproduto completo
 */
export function calculateInfoproductScore(video: Video): ScoreBreakdown {
  const engagement = calculateEngagementScore(video);
  const commentAnalysis = calculateCommentAnalysisScore(video);
  const growth = calculateGrowthScore(video);
  const channel = calculateChannelScore(video);
  const contentQuality = calculateContentQualityScore(video);

  const totalScore = Math.min(100,
    engagement.score +
    commentAnalysis.score +
    growth.score +
    channel.score +
    contentQuality.score
  );

  return {
    totalScore: Math.round(totalScore),
    engagementScore: engagement.score,
    commentAnalysisScore: commentAnalysis.score,
    growthScore: growth.score,
    channelScore: channel.score,
    contentQualityScore: contentQuality.score,
    breakdown: {
      engagement: engagement.detail,
      commentAnalysis: commentAnalysis.detail,
      growth: growth.detail,
      channel: channel.detail,
      contentQuality: contentQuality.detail,
    },
    opportunity: getOpportunityLevel(totalScore),
  };
}

/**
 * Adiciona o score de infoproduto ao vídeo
 */
export function addInfoproductScore(video: Video): Video {
  const scoreData = calculateInfoproductScore(video);

  return {
    ...video,
    infoproductScore: scoreData.totalScore,
  };
}
