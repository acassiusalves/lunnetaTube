/**
 * Análise Avançada de Comentários para Extração de Insights de Produtos
 * Focado em identificar dores, oportunidades de recorrência e segmentação
 */

import type { CommentData } from '@/lib/data';

// ============================================
// 1. ANÁLISE DE DORES PROFUNDAS (Pain Points)
// ============================================

export interface PainPoint {
  type: 'financial' | 'time' | 'knowledge' | 'frustration' | 'emotional' | 'technical' | 'access';
  text: string;
  intensity: 'low' | 'medium' | 'high';
  likeCount: number;
  author: string;
}

export interface PainPointAnalysis {
  totalPainPoints: number;
  painPointsByType: Record<string, number>;
  topPainPoints: PainPoint[];
  painPointDensity: number;
  dominantPainType: string;
}

const PAIN_PATTERNS = {
  financial: [
    /não\s+(tenho|tem)\s+(dinheiro|grana|condições)/i,
    /muito\s+(caro|custa)/i,
    /sem\s+(dinheiro|grana)/i,
    /(pagar|investir|gastar)\s+(muito|demais)/i,
    /financeiramente/i,
    /preço\s+(alto|absurdo)/i,
  ],
  time: [
    /não\s+(tenho|tem)\s+tempo/i,
    /falta\s+de\s+tempo/i,
    /correria/i,
    /muito\s+ocupado/i,
    /demora\s+(muito|demais)/i,
    /trabalhando\s+(muito|demais)/i,
    /sem\s+tempo/i,
  ],
  knowledge: [
    /não\s+(sei|entendo|compreendo|consigo)/i,
    /como\s+(fazer|faz|funciona)/i,
    /não\s+tenho\s+(ideia|noção)/i,
    /iniciante/i,
    /começando\s+agora/i,
    /leigo/i,
    /nunca\s+(fiz|aprendi)/i,
  ],
  frustration: [
    /já\s+tentei/i,
    /não\s+funciona/i,
    /desisti/i,
    /cansado\s+de/i,
    /frustrado/i,
    /não\s+dá\s+certo/i,
    /sempre\s+(falha|erro)/i,
    /perdi\s+(tempo|dinheiro)/i,
  ],
  emotional: [
    /desesperado/i,
    /ansioso/i,
    /preocupado/i,
    /estressado/i,
    /medo\s+de/i,
    /inseguro/i,
    /vergonha/i,
    /triste/i,
  ],
  technical: [
    /problema\s+(técnico|no\s+sistema)/i,
    /erro/i,
    /bug/i,
    /não\s+carrega/i,
    /travando/i,
    /lento/i,
    /não\s+abre/i,
  ],
  access: [
    /não\s+(encontro|acho|consigo\s+acessar)/i,
    /onde\s+(encontro|acho|consigo)/i,
    /indisponível/i,
    /bloqueado/i,
    /restrito/i,
  ],
};

function detectPainType(text: string): 'financial' | 'time' | 'knowledge' | 'frustration' | 'emotional' | 'technical' | 'access' | null {
  for (const [type, patterns] of Object.entries(PAIN_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(text))) {
      return type as any;
    }
  }
  return null;
}

function calculatePainIntensity(text: string, likeCount: number): 'low' | 'medium' | 'high' {
  const intensifiers = /(muito|demais|extremamente|super|mega|totalmente|completamente)/i;
  const hasIntensifier = intensifiers.test(text);
  const exclamationCount = (text.match(/!/g) || []).length;

  if (hasIntensifier || exclamationCount >= 2 || likeCount >= 10) return 'high';
  if (likeCount >= 3 || exclamationCount >= 1) return 'medium';
  return 'low';
}

export function analyzePainPoints(comments: CommentData[]): PainPointAnalysis {
  const painPoints: PainPoint[] = [];
  const painPointsByType: Record<string, number> = {
    financial: 0, time: 0, knowledge: 0, frustration: 0, emotional: 0, technical: 0, access: 0
  };

  comments.forEach(comment => {
    const painType = detectPainType(comment.text);
    if (painType) {
      painPointsByType[painType]++;
      painPoints.push({
        type: painType,
        text: comment.text,
        intensity: calculatePainIntensity(comment.text, comment.likeCount || 0),
        likeCount: comment.likeCount || 0,
        author: comment.author,
      });
    }
  });

  const dominantPainType = Object.entries(painPointsByType)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'knowledge';

  return {
    totalPainPoints: painPoints.length,
    painPointsByType,
    topPainPoints: painPoints.sort((a, b) => b.likeCount - a.likeCount).slice(0, 15),
    painPointDensity: comments.length > 0 ? (painPoints.length / comments.length) * 100 : 0,
    dominantPainType,
  };
}

// ============================================
// 2. ANÁLISE DE MICRO-SAAS / RECORRÊNCIA
// ============================================

export interface RecurrenceOpportunity {
  type: 'automation' | 'community' | 'updates' | 'monitoring' | 'templates' | 'support';
  text: string;
  likeCount: number;
  potentialMRR: 'low' | 'medium' | 'high';
}

export interface RecurrenceAnalysis {
  totalOpportunities: number;
  opportunitiesByType: Record<string, number>;
  topOpportunities: RecurrenceOpportunity[];
  hasStrongRecurrencePotential: boolean;
  suggestedModels: string[];
}

const RECURRENCE_PATTERNS = {
  automation: [
    /automatizar/i,
    /automático/i,
    /sozinho/i,
    /sem\s+precisar/i,
    /fazer\s+por\s+mim/i,
    /simplificar/i,
  ],
  community: [
    /grupo/i,
    /comunidade/i,
    /discord/i,
    /telegram/i,
    /whatsapp/i,
    /networking/i,
    /trocar\s+ideia/i,
  ],
  updates: [
    /atualização/i,
    /novidades/i,
    /versão\s+nova/i,
    /conteúdo\s+novo/i,
    /sempre\s+atualizando/i,
    /manter\s+atualizado/i,
  ],
  monitoring: [
    /acompanhar/i,
    /monitorar/i,
    /alertar/i,
    /avisar\s+quando/i,
    /notificar/i,
    /relatório/i,
  ],
  templates: [
    /modelo\s+pronto/i,
    /template/i,
    /copiar\s+e\s+colar/i,
    /plug\s+and\s+play/i,
    /já\s+pronto/i,
  ],
  support: [
    /suporte/i,
    /ajuda\s+contínua/i,
    /tirar\s+dúvida/i,
    /mentoria/i,
    /consultoria/i,
    /acompanhamento/i,
  ],
};

function detectRecurrenceType(text: string): 'automation' | 'community' | 'updates' | 'monitoring' | 'templates' | 'support' | null {
  for (const [type, patterns] of Object.entries(RECURRENCE_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(text))) {
      return type as any;
    }
  }
  return null;
}

export function analyzeRecurrenceOpportunities(comments: CommentData[]): RecurrenceAnalysis {
  const opportunities: RecurrenceOpportunity[] = [];
  const opportunitiesByType: Record<string, number> = {
    automation: 0, community: 0, updates: 0, monitoring: 0, templates: 0, support: 0
  };

  comments.forEach(comment => {
    const type = detectRecurrenceType(comment.text);
    if (type) {
      opportunitiesByType[type]++;
      opportunities.push({
        type,
        text: comment.text,
        likeCount: comment.likeCount || 0,
        potentialMRR: (comment.likeCount || 0) >= 5 ? 'high' : (comment.likeCount || 0) >= 2 ? 'medium' : 'low',
      });
    }
  });

  const suggestedModels: string[] = [];
  if (opportunitiesByType.community >= 3) suggestedModels.push('Comunidade Fechada (R$47-197/mês)');
  if (opportunitiesByType.automation >= 3) suggestedModels.push('Ferramenta SaaS (R$29-97/mês)');
  if (opportunitiesByType.updates >= 3) suggestedModels.push('Assinatura de Conteúdo (R$19-47/mês)');
  if (opportunitiesByType.support >= 3) suggestedModels.push('Mentoria em Grupo (R$97-297/mês)');
  if (opportunitiesByType.templates >= 3) suggestedModels.push('Biblioteca de Templates (R$27-67/mês)');

  return {
    totalOpportunities: opportunities.length,
    opportunitiesByType,
    topOpportunities: opportunities.sort((a, b) => b.likeCount - a.likeCount).slice(0, 10),
    hasStrongRecurrencePotential: opportunities.length >= 5,
    suggestedModels,
  };
}

// ============================================
// 3. ANÁLISE DE OBJEÇÕES
// ============================================

export interface Objection {
  type: 'price' | 'trust' | 'time' | 'relevance' | 'complexity' | 'competition';
  text: string;
  likeCount: number;
  suggestedResponse: string;
}

export interface ObjectionAnalysis {
  totalObjections: number;
  objectionsByType: Record<string, number>;
  topObjections: Objection[];
  mainObjection: string;
}

const OBJECTION_PATTERNS = {
  price: [
    /muito\s+caro/i,
    /preço\s+(alto|absurdo)/i,
    /não\s+vale/i,
    /investimento\s+(alto|pesado)/i,
    /sem\s+condições/i,
  ],
  trust: [
    /funciona\s+mesmo/i,
    /é\s+confiável/i,
    /golpe/i,
    /pirâmide/i,
    /será\s+que/i,
    /não\s+acredito/i,
    /duvidoso/i,
  ],
  time: [
    /demora\s+muito/i,
    /quanto\s+tempo/i,
    /não\s+tenho\s+tempo/i,
    /muito\s+longo/i,
    /rápido\s+demais/i,
  ],
  relevance: [
    /não\s+serve\s+para/i,
    /meu\s+caso\s+é\s+diferente/i,
    /não\s+se\s+aplica/i,
    /muito\s+específico/i,
    /muito\s+genérico/i,
  ],
  complexity: [
    /muito\s+complexo/i,
    /difícil\s+demais/i,
    /complicado/i,
    /não\s+entendi/i,
    /confuso/i,
  ],
  competition: [
    /já\s+vi\s+isso/i,
    /tem\s+de\s+graça/i,
    /concorrente/i,
    /outro\s+lugar/i,
    /canal\s+X\s+ensina/i,
  ],
};

const OBJECTION_RESPONSES: Record<string, string> = {
  price: 'Demonstre ROI e ofereça garantia ou parcelamento',
  trust: 'Mostre provas sociais, depoimentos e garantia',
  time: 'Apresente resultados rápidos e método acelerado',
  relevance: 'Segmente melhor e mostre casos similares',
  complexity: 'Simplifique e ofereça suporte passo a passo',
  competition: 'Destaque diferenciais únicos e bônus exclusivos',
};

export function analyzeObjections(comments: CommentData[]): ObjectionAnalysis {
  const objections: Objection[] = [];
  const objectionsByType: Record<string, number> = {
    price: 0, trust: 0, time: 0, relevance: 0, complexity: 0, competition: 0
  };

  comments.forEach(comment => {
    for (const [type, patterns] of Object.entries(OBJECTION_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(comment.text))) {
        objectionsByType[type]++;
        objections.push({
          type: type as any,
          text: comment.text,
          likeCount: comment.likeCount || 0,
          suggestedResponse: OBJECTION_RESPONSES[type],
        });
        break;
      }
    }
  });

  const mainObjection = Object.entries(objectionsByType)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'trust';

  return {
    totalObjections: objections.length,
    objectionsByType,
    topObjections: objections.sort((a, b) => b.likeCount - a.likeCount).slice(0, 10),
    mainObjection,
  };
}

// ============================================
// 4. ANÁLISE DE NÍVEL DE CONSCIÊNCIA
// ============================================

export interface AwarenessLevel {
  level: 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware' | 'most-aware';
  count: number;
  percentage: number;
  comments: { text: string; likeCount: number }[];
}

export interface AwarenessAnalysis {
  levels: AwarenessLevel[];
  dominantLevel: string;
  funnelHealth: 'cold' | 'warming' | 'warm' | 'hot';
  recommendation: string;
}

const AWARENESS_PATTERNS = {
  'unaware': [
    /o\s+que\s+é\s+isso/i,
    /nunca\s+ouvi\s+falar/i,
    /não\s+sabia\s+que\s+existia/i,
    /primeira\s+vez/i,
  ],
  'problem-aware': [
    /tenho\s+esse\s+problema/i,
    /sofro\s+com\s+isso/i,
    /preciso\s+resolver/i,
    /como\s+resolver/i,
    /não\s+aguento\s+mais/i,
  ],
  'solution-aware': [
    /qual\s+(a\s+)?melhor\s+(forma|maneira|solução)/i,
    /existe\s+algum/i,
    /que\s+método/i,
    /o\s+que\s+você\s+recomenda/i,
  ],
  'product-aware': [
    /tem\s+curso/i,
    /onde\s+compro/i,
    /qual\s+o\s+valor/i,
    /quanto\s+custa/i,
    /link\s+do\s+produto/i,
  ],
  'most-aware': [
    /já\s+comprei/i,
    /vou\s+comprar/i,
    /quero\s+comprar/i,
    /quando\s+abre/i,
    /esperando\s+abrir/i,
    /vale\s+muito/i,
  ],
};

export function analyzeAwarenessLevels(comments: CommentData[]): AwarenessAnalysis {
  const levelCounts: Record<string, { count: number; comments: { text: string; likeCount: number }[] }> = {
    'unaware': { count: 0, comments: [] },
    'problem-aware': { count: 0, comments: [] },
    'solution-aware': { count: 0, comments: [] },
    'product-aware': { count: 0, comments: [] },
    'most-aware': { count: 0, comments: [] },
  };

  comments.forEach(comment => {
    for (const [level, patterns] of Object.entries(AWARENESS_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(comment.text))) {
        levelCounts[level].count++;
        if (levelCounts[level].comments.length < 5) {
          levelCounts[level].comments.push({ text: comment.text, likeCount: comment.likeCount || 0 });
        }
        break;
      }
    }
  });

  const total = Object.values(levelCounts).reduce((sum, l) => sum + l.count, 0) || 1;

  const levels: AwarenessLevel[] = Object.entries(levelCounts).map(([level, data]) => ({
    level: level as any,
    count: data.count,
    percentage: (data.count / total) * 100,
    comments: data.comments,
  }));

  const dominantLevel = levels.sort((a, b) => b.count - a.count)[0]?.level || 'problem-aware';

  let funnelHealth: 'cold' | 'warming' | 'warm' | 'hot' = 'cold';
  const productAwarePercentage = levelCounts['product-aware'].count / total * 100;
  const mostAwarePercentage = levelCounts['most-aware'].count / total * 100;

  if (mostAwarePercentage > 10) funnelHealth = 'hot';
  else if (productAwarePercentage > 15) funnelHealth = 'warm';
  else if (levelCounts['solution-aware'].count > levelCounts['unaware'].count) funnelHealth = 'warming';

  const recommendations: Record<string, string> = {
    'unaware': 'Crie conteúdo educacional para despertar consciência do problema',
    'problem-aware': 'Mostre que existe solução e apresente alternativas',
    'solution-aware': 'Diferencie seu produto e mostre por que é a melhor opção',
    'product-aware': 'Ofereça provas sociais, garantias e urgência',
    'most-aware': 'Facilite a compra e ofereça condições especiais',
  };

  return {
    levels,
    dominantLevel,
    funnelHealth,
    recommendation: recommendations[dominantLevel],
  };
}

// ============================================
// 5. ANÁLISE DE WORD CLOUD
// ============================================

export interface WordFrequency {
  word: string;
  count: number;
  relevance: number;
}

export interface WordCloudAnalysis {
  topWords: WordFrequency[];
  topBigrams: WordFrequency[];
  categories: {
    actions: WordFrequency[];
    objects: WordFrequency[];
    emotions: WordFrequency[];
  };
}

const STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'é', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as', 'que', 'para', 'por',
  'com', 'se', 'mais', 'muito', 'também', 'já', 'foi', 'ser', 'tem', 'ter',
  'são', 'está', 'esse', 'essa', 'isso', 'este', 'esta', 'isto', 'ele', 'ela',
  'eles', 'elas', 'eu', 'você', 'vocês', 'meu', 'minha', 'seu', 'sua', 'não',
  'sim', 'bem', 'aqui', 'ali', 'lá', 'quando', 'como', 'porque', 'então',
  'mas', 'ou', 'nem', 'só', 'ainda', 'agora', 'depois', 'antes', 'desde',
]);

const ACTION_WORDS = /^(fazer|criar|aprender|começar|comprar|vender|usar|melhorar|resolver|conseguir|querer|precisar|ajudar)/i;
const EMOTION_WORDS = /^(bom|ótimo|ruim|péssimo|incrível|maravilhoso|terrível|difícil|fácil|amor|ódio|medo|feliz|triste)/i;

export function analyzeWordCloud(comments: CommentData[]): WordCloudAnalysis {
  const wordCounts: Record<string, number> = {};
  const bigramCounts: Record<string, number> = {};
  const actionWords: Record<string, number> = {};
  const emotionWords: Record<string, number> = {};
  const objectWords: Record<string, number> = {};

  comments.forEach(comment => {
    const words = comment.text
      .toLowerCase()
      .replace(/[^\wáàâãéèêíïóôõöúçñ\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    words.forEach((word, i) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;

      if (ACTION_WORDS.test(word)) actionWords[word] = (actionWords[word] || 0) + 1;
      else if (EMOTION_WORDS.test(word)) emotionWords[word] = (emotionWords[word] || 0) + 1;
      else objectWords[word] = (objectWords[word] || 0) + 1;

      if (i < words.length - 1) {
        const bigram = `${word} ${words[i + 1]}`;
        bigramCounts[bigram] = (bigramCounts[bigram] || 0) + 1;
      }
    });
  });

  const toWordFrequency = (counts: Record<string, number>, maxRelevance = 100): WordFrequency[] => {
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .map(([word, count]) => ({ word, count, relevance: (count / max) * maxRelevance }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  };

  return {
    topWords: toWordFrequency(wordCounts),
    topBigrams: toWordFrequency(bigramCounts),
    categories: {
      actions: toWordFrequency(actionWords, 100).slice(0, 10),
      objects: toWordFrequency(objectWords, 100).slice(0, 10),
      emotions: toWordFrequency(emotionWords, 100).slice(0, 10),
    },
  };
}

// ============================================
// 6. ANÁLISE DE COMPETIDORES
// ============================================

export interface CompetitorMention {
  name: string;
  context: 'positive' | 'negative' | 'neutral' | 'comparison';
  text: string;
  likeCount: number;
}

export interface CompetitorAnalysis {
  totalMentions: number;
  competitors: { name: string; mentions: number; sentiment: string }[];
  topMentions: CompetitorMention[];
  competitiveInsights: string[];
}

const COMPETITOR_PATTERNS = [
  // Canais de YouTube
  /canal\s+d[oa]\s+(\w+)/i,
  /(\w+)\s+ensina\s+melhor/i,
  /vi\s+no\s+(\w+)/i,
  // Plataformas
  /hotmart/i, /eduzz/i, /monetizze/i, /kiwify/i, /udemy/i, /coursera/i,
  // Menções genéricas
  /outro\s+curso/i, /concorrente/i, /alternativa/i,
];

const POSITIVE_CONTEXT = /(melhor|incrível|recomendo|gostei)/i;
const NEGATIVE_CONTEXT = /(pior|ruim|não\s+gostei|decepcionante)/i;
const COMPARISON_CONTEXT = /(comparando|diferente|versus|vs|ou\s+o)/i;

export function analyzeCompetitors(comments: CommentData[]): CompetitorAnalysis {
  const mentions: CompetitorMention[] = [];
  const competitorCounts: Record<string, { count: number; positiveCount: number; negativeCount: number }> = {};

  comments.forEach(comment => {
    const text = comment.text;

    COMPETITOR_PATTERNS.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        const name = match[1] || match[0];
        const normalizedName = name.toLowerCase().replace(/[^\w]/g, '');

        if (!competitorCounts[normalizedName]) {
          competitorCounts[normalizedName] = { count: 0, positiveCount: 0, negativeCount: 0 };
        }
        competitorCounts[normalizedName].count++;

        let context: 'positive' | 'negative' | 'neutral' | 'comparison' = 'neutral';
        if (COMPARISON_CONTEXT.test(text)) context = 'comparison';
        else if (POSITIVE_CONTEXT.test(text)) {
          context = 'positive';
          competitorCounts[normalizedName].positiveCount++;
        }
        else if (NEGATIVE_CONTEXT.test(text)) {
          context = 'negative';
          competitorCounts[normalizedName].negativeCount++;
        }

        mentions.push({
          name: normalizedName,
          context,
          text: comment.text,
          likeCount: comment.likeCount || 0,
        });
      }
    });
  });

  const competitors = Object.entries(competitorCounts)
    .map(([name, data]) => ({
      name,
      mentions: data.count,
      sentiment: data.positiveCount > data.negativeCount ? 'positivo' :
                 data.negativeCount > data.positiveCount ? 'negativo' : 'neutro',
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);

  const competitiveInsights: string[] = [];
  if (mentions.length > 0) {
    const negativeCompetitor = competitors.find(c => c.sentiment === 'negativo');
    if (negativeCompetitor) {
      competitiveInsights.push(`Oportunidade: ${negativeCompetitor.name} tem menções negativas - destaque seus diferenciais`);
    }
    if (mentions.some(m => m.context === 'comparison')) {
      competitiveInsights.push('Audiência compara opções - crie conteúdo comparativo');
    }
  }

  return {
    totalMentions: mentions.length,
    competitors,
    topMentions: mentions.sort((a, b) => b.likeCount - a.likeCount).slice(0, 10),
    competitiveInsights,
  };
}

// ============================================
// 7. SEGMENTAÇÃO DE PÚBLICO
// ============================================

export interface AudienceSegment {
  segment: string;
  count: number;
  percentage: number;
  characteristics: string[];
  productRecommendation: string;
}

export interface SegmentationAnalysis {
  segments: AudienceSegment[];
  dominantSegment: string;
  diversityScore: number;
}

const SEGMENT_PATTERNS = {
  'Iniciante': {
    patterns: [/iniciante/i, /começando/i, /primeiro/i, /básico/i, /nunca\s+fiz/i, /como\s+começo/i],
    characteristics: ['Precisa de conteúdo básico', 'Busca passo a passo', 'Medo de errar'],
    recommendation: 'Curso introdutório com suporte',
  },
  'Intermediário': {
    patterns: [/já\s+sei\s+o\s+básico/i, /próximo\s+nível/i, /avançar/i, /melhorar/i, /aprofundar/i],
    characteristics: ['Conhece fundamentos', 'Quer otimizar resultados', 'Busca estratégias avançadas'],
    recommendation: 'Mentoria ou curso avançado',
  },
  'Avançado': {
    patterns: [/avançado/i, /profissional/i, /anos\s+de\s+experiência/i, /expert/i, /especialista/i],
    characteristics: ['Alto conhecimento', 'Busca networking', 'Quer se destacar'],
    recommendation: 'Mastermind ou consultoria',
  },
  'Empreendedor': {
    patterns: [/minha\s+empresa/i, /meu\s+negócio/i, /empreendedor/i, /empresa/i, /loja/i, /e-commerce/i],
    characteristics: ['Foco em resultados', 'Busca ROI', 'Precisa de praticidade'],
    recommendation: 'Solução completa B2B',
  },
  'Estudante': {
    patterns: [/faculdade/i, /estudante/i, /escola/i, /universidade/i, /tcc/i, /prova/i],
    characteristics: ['Orçamento limitado', 'Tempo restrito', 'Busca certificação'],
    recommendation: 'Pacote acessível com certificado',
  },
  'Profissional CLT': {
    patterns: [/meu\s+trabalho/i, /meu\s+chefe/i, /clt/i, /empresa\s+que\s+trabalho/i, /promoção/i],
    characteristics: ['Quer crescer na carreira', 'Horário limitado', 'Busca diferencial'],
    recommendation: 'Curso rápido com certificado',
  },
};

export function analyzeAudienceSegmentation(comments: CommentData[]): SegmentationAnalysis {
  const segmentCounts: Record<string, number> = {};

  Object.keys(SEGMENT_PATTERNS).forEach(segment => {
    segmentCounts[segment] = 0;
  });

  comments.forEach(comment => {
    for (const [segment, config] of Object.entries(SEGMENT_PATTERNS)) {
      if (config.patterns.some(pattern => pattern.test(comment.text))) {
        segmentCounts[segment]++;
        break;
      }
    }
  });

  const total = Object.values(segmentCounts).reduce((sum, c) => sum + c, 0) || 1;

  const segments: AudienceSegment[] = Object.entries(SEGMENT_PATTERNS).map(([segment, config]) => ({
    segment,
    count: segmentCounts[segment],
    percentage: (segmentCounts[segment] / total) * 100,
    characteristics: config.characteristics,
    productRecommendation: config.recommendation,
  })).sort((a, b) => b.count - a.count);

  const dominantSegment = segments[0]?.segment || 'Iniciante';

  // Diversity score: quanto mais distribuído, maior
  const nonZeroSegments = segments.filter(s => s.count > 0).length;
  const diversityScore = (nonZeroSegments / segments.length) * 100;

  return {
    segments,
    dominantSegment,
    diversityScore,
  };
}

// ============================================
// ANÁLISE COMPLETA COMBINADA
// ============================================

export interface AdvancedCommentAnalysis {
  painPoints: PainPointAnalysis;
  recurrence: RecurrenceAnalysis;
  objections: ObjectionAnalysis;
  awareness: AwarenessAnalysis;
  wordCloud: WordCloudAnalysis;
  competitors: CompetitorAnalysis;
  segmentation: SegmentationAnalysis;
}

export function performAdvancedAnalysis(comments: CommentData[]): AdvancedCommentAnalysis {
  return {
    painPoints: analyzePainPoints(comments),
    recurrence: analyzeRecurrenceOpportunities(comments),
    objections: analyzeObjections(comments),
    awareness: analyzeAwarenessLevels(comments),
    wordCloud: analyzeWordCloud(comments),
    competitors: analyzeCompetitors(comments),
    segmentation: analyzeAudienceSegmentation(comments),
  };
}
