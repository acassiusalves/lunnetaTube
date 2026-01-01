'use server';

import googleTrends from 'google-trends-api';

export interface TrendResult {
  growthPercent: number;
  isGrowing: boolean;
  trendData: number[]; // Array simples para plotar um sparkline se quisermos
  lastValue: number;
  error?: string;
}

export async function checkTrendGrowth(keyword: string): Promise<TrendResult | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // Últimos 12 meses

    const results = await googleTrends.interestOverTime({
      keyword: keyword,
      geo: 'BR',
      startTime: startDate,
    });

    if (!results) return null;

    const data = JSON.parse(results);
    const timeline = data.default?.timelineData;

    if (!timeline || timeline.length === 0) return null;

    // Extrai os valores (0 a 100)
    const values = timeline.map((item: any) => item.value[0]);

    // Lógica de Crescimento: Compara a média dos primeiros 3 pontos com os últimos 3 (para suavizar picos)
    const startAvg = values.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / 3;
    const endAvg = values.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;

    // Evita divisão por zero
    const safeStart = startAvg === 0 ? 1 : startAvg;
    const growth = ((endAvg - safeStart) / safeStart) * 100;

    return {
      growthPercent: Math.round(growth),
      isGrowing: growth > 0,
      trendData: values,
      lastValue: values[values.length - 1]
    };

  } catch (error) {
    console.error("Erro no Google Trends:", error);
    return { growthPercent: 0, isGrowing: false, trendData: [], lastValue: 0, error: 'Falha ao buscar trends' };
  }
}
