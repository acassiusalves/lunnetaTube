/**
 * Engine de Oportunidades - Sinais de Hype, Dor, Autoridade e Formato
 * Calcula score "Pronto pra Venda" baseado em múltiplos sinais
 */

import type { Video } from '@/lib/data';

export interface HypeSignals {
  viewsPerDay: number;
  likeRate: number;      // 0..1
  commentRate: number;   // 0..1
}

export interface OpportunitySignals {
  hype: HypeSignals;
  dorIntentPct: number;        // 0..1 (intenção de compra/ajuda)
  channelAuthority: number;    // 0..1 (normalizado)
  ease: number;                // 0..1 (facilidade de mapear para produto)
  geoFit: number;              // 0..1 (fit PT/ES)
  format: VideoFormat;
}

export type VideoFormat = 'tutorial' | 'lista' | 'receita' | 'desafio' | 'review' | 'outro';

export interface OpportunityScore {
  total: number;              // 0..1
  level: 'ouro' | 'bom' | 'tibio';
  breakdown: {
    hype: number;
    dor: number;
    autoridade: number;
    facilidade: number;
    geo: number;
  };
}

/**
 * Calcula sinais de HYPE baseados em métricas de engajamento
 */
export function computeHypeSignals(video: Video): HypeSignals {
  const views = video.views || 0;
  const likes = video.likes || 0;
  const comments = video.comments || 0;
  const publishedAt = new Date(video.publishedAt);
  const days = Math.max(1, (Date.now() - publishedAt.getTime()) / 86400000);

  const viewsPerDay = views / days;
  const likeRate = views > 0 ? likes / views : 0;
  const commentRate = views > 0 ? comments / views : 0;

  return { viewsPerDay, likeRate, commentRate };
}

/**
 * Detecta FORMATO do vídeo baseado em título e descrição
 */
export function detectFormat(title: string, description: string = ''): VideoFormat {
  const text = `${title} ${description}`.toLowerCase();

  // Tutorial / Como fazer
  if (/\bhow to\b|como (fazer|usar|criar|começar)|tutorial|passo a passo/i.test(text)) {
    return 'tutorial';
  }

  // Lista / Top / Ranking
  if (/top\s?\d+|melhores|lista|ranking|\d+\s+(melhores|piores|dicas)/i.test(text)) {
    return 'lista';
  }

  // Receita / Culinária
  if (/receit|recipe|cocina|cozinha|prepara(r|ção)|ingredientes/i.test(text)) {
    return 'receita';
  }

  // Desafio
  if (/desafio|challenge|30 dias|\d+ dias/i.test(text)) {
    return 'desafio';
  }

  // Review / Análise
  if (/review|resenha|análise|vale a pena|opinião|testei/i.test(text)) {
    return 'review';
  }

  return 'outro';
}

/**
 * Mapeia FORMATO para templates de produtos
 */
export function mapFormatToProductTemplates(format: VideoFormat): string[] {
  const templates: Record<VideoFormat, string[]> = {
    tutorial: [
      'E-book passo a passo',
      'Checklist de execução',
      'Planilha de acompanhamento',
      'Template Notion/PDF'
    ],
    lista: [
      'Planilha comparativa',
      'E-book "Top 10 explicados"',
      'Checklist de escolha',
      'Guia de referência rápida'
    ],
    receita: [
      'E-book com 15-30 receitas',
      'Planilha nutricional',
      'Lista de compras automática',
      'Calendário de refeições'
    ],
    desafio: [
      'Template de hábito (Notion/PDF)',
      'Calendário 30 dias',
      'Checklist diária',
      'Planilha de progresso'
    ],
    review: [
      'Guia de compra comparativo',
      'Checklist de avaliação',
      'Planilha de custo-benefício'
    ],
    outro: [
      'E-book prático',
      'Checklist',
      'Planilha simples',
      'Template PDF'
    ]
  };

  return templates[format] || templates.outro;
}

/**
 * Calcula AUTORIDADE do canal (normalizado 0..1)
 */
export function computeChannelAuthority(video: Video): number {
  if (!video.channelStats) return 0.3; // default médio-baixo

  const subs = video.channelStats.subscriberCount || 0;
  const avgViews = video.channelStats.avgViewsPerVideo || 0;

  // Normalização logarítmica
  const subsScore = Math.min(1, Math.log10(subs + 1) / 7); // 10M subs = 1.0
  const viewsScore = Math.min(1, Math.log10(avgViews + 1) / 6); // 1M views/video = 1.0

  // Peso: 60% inscritos, 40% views médias
  return 0.6 * subsScore + 0.4 * viewsScore;
}

/**
 * Calcula FACILIDADE de transformar em produto (0..1)
 */
export function computeEase(format: VideoFormat, hasSteps: boolean): number {
  const formatEase: Record<VideoFormat, number> = {
    tutorial: 0.9,   // Muito fácil: já tem passo a passo
    lista: 0.85,     // Fácil: só organizar
    receita: 0.9,    // Muito fácil: formato claro
    desafio: 0.8,    // Médio-fácil: precisa estrutura
    review: 0.7,     // Médio: precisa consolidar comparação
    outro: 0.5       // Médio-difícil: precisa descobrir estrutura
  };

  let ease = formatEase[format];

  // Bônus se tem passos explícitos no título/descrição
  if (hasSteps) ease = Math.min(1, ease + 0.1);

  return ease;
}

/**
 * Calcula FIT GEOGRÁFICO (0..1)
 * Maior para PT/ES, menor para outros idiomas
 */
export function computeGeoFit(countryCode: string): number {
  const latamCodes = ['BR', 'MX', 'AR', 'CO', 'CL', 'PE', 'UY', 'PY', 'BO', 'EC', 'VE'];
  return latamCodes.includes(countryCode.toUpperCase()) ? 1.0 : 0.3;
}

/**
 * Calcula SCORE FINAL "Pronto pra Venda"
 * Combina todos os sinais com pesos estratégicos
 */
export function computeProntoPraVendaScore(signals: OpportunitySignals): OpportunityScore {
  // Normalizar hype (viewsPerDay)
  const hypeNorm = normalizeHype(signals.hype.viewsPerDay);

  // Pesos estratégicos
  const weights = {
    hype: 0.35,         // Crescimento = urgência
    dor: 0.25,          // Intenção de compra = demanda
    autoridade: 0.15,   // Credibilidade do canal
    facilidade: 0.15,   // Esforço de produção
    geo: 0.10          // Fit LATAM
  };

  const breakdown = {
    hype: hypeNorm * weights.hype,
    dor: signals.dorIntentPct * weights.dor,
    autoridade: signals.channelAuthority * weights.autoridade,
    facilidade: signals.ease * weights.facilidade,
    geo: signals.geoFit * weights.geo
  };

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  // Classificação
  let level: 'ouro' | 'bom' | 'tibio';
  if (total >= 0.7) level = 'ouro';
  else if (total >= 0.5) level = 'bom';
  else level = 'tibio';

  return { total, level, breakdown };
}

/**
 * Normaliza views/dia para escala 0..1
 */
function normalizeHype(viewsPerDay: number): number {
  // Log scale: 1k/dia = 0.5, 10k/dia = 0.75, 100k/dia = 1.0
  return Math.max(0, Math.min(1, Math.log10(viewsPerDay + 1) / 5));
}

/**
 * Sugestão de PREÇO por país baseado em score e esforço
 */
export interface PriceSuggestion {
  currency: string;
  min: number;
  max: number;
}

export function suggestPrice(
  countryCode: string,
  score: number,
  effortHours: number
): PriceSuggestion {
  const ranges: Record<string, { base: [number, number]; multiplier: number }> = {
    BR: { base: [9, 29], multiplier: 1.0 },
    MX: { base: [39, 99], multiplier: 1.0 },
    AR: { base: [500, 1500], multiplier: 1.0 },
    CO: { base: [15000, 45000], multiplier: 1.0 },
    CL: { base: [5000, 15000], multiplier: 1.0 },
    PE: { base: [20, 60], multiplier: 1.0 }
  };

  const config = ranges[countryCode.toUpperCase()] || ranges.BR;
  let [min, max] = config.base;

  // Ajuste por score (ouro = +50%, tíbio = -20%)
  if (score >= 0.7) {
    min *= 1.3;
    max *= 1.5;
  } else if (score < 0.5) {
    min *= 0.8;
    max *= 0.8;
  }

  // Ajuste por esforço
  if (effortHours >= 4) {
    min *= 1.2;
    max *= 1.3;
  }

  const currency = getCurrencyCode(countryCode);

  return {
    currency,
    min: Math.round(min),
    max: Math.round(max)
  };
}

function getCurrencyCode(countryCode: string): string {
  const currencies: Record<string, string> = {
    BR: 'BRL',
    MX: 'MXN',
    AR: 'ARS',
    CO: 'COP',
    CL: 'CLP',
    PE: 'PEN'
  };
  return currencies[countryCode.toUpperCase()] || 'USD';
}
