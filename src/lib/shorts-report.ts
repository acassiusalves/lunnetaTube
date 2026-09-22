/**
 * Relatório de comentários de Shorts para criativos de anúncio: tipos, prompt
 * enviado ao Gemini e exportação em texto. Sem dependências de servidor.
 */

export interface PainOrDesire {
  insight: string;
  frequency: 'alta' | 'média' | 'baixa';
  videoIds: string[];
}

export interface AudienceQuote {
  quote: string;          // literal, no idioma original
  translation?: string;   // pt-BR, quando o original não está em português
  videoId: string;
}

export interface AdAngle {
  hook: string;           // primeira frase do criativo
  angle: string;
  rationale: string;
  basedOnQuote: string;
  videoIds: string[];
}

export interface ShortsCommentsReport {
  painsAndDesires: PainOrDesire[];
  audienceLanguage: AudienceQuote[];
  adAngles: AdAngle[];
}

export interface VideoComments {
  id: string;
  title: string;
  comments: { text: string; likeCount?: number }[];
}

// Limite por comentário, para manter o prompt enxuto
export const MAX_COMMENT_CHARS = 500;

export function buildCommentsPrompt(videos: VideoComments[]): string {
  const blocks = videos.map(video => {
    const lines = video.comments.map(comment => {
      const text = comment.text.replace(/\s+/g, ' ').trim().slice(0, MAX_COMMENT_CHARS);
      return `- ${text}${comment.likeCount ? ` (${comment.likeCount} likes)` : ''}`;
    });
    return `### Short ${video.id}: ${video.title}\n${lines.join('\n')}`;
  });

  return `Você é estrategista de criativos de anúncios para Facebook e Instagram.
Abaixo estão comentários de Shorts do YouTube que performaram bem. Analise-os para gerar insumos de criativos.

Responda em português do Brasil, exceto as citações literais, que ficam no idioma original.
Use apenas o que aparece nos comentários; não invente fatos.

Entregue:
1. painsAndDesires: dores e desejos do público. Em cada item, "frequency" = "alta", "média" ou "baixa" conforme quantos comentários tocam no ponto, e "videoIds" com os ids dos Shorts de origem.
2. audienceLanguage: de 8 a 15 frases literais dos comentários que soem naturais em uma copy. Se a frase não estiver em português, preencha "translation" com a tradução para português do Brasil. "videoId" = id do Short de origem.
3. adAngles: de 5 a 8 ângulos de anúncio, cada um com "hook" (primeira frase do criativo, até 15 palavras), "angle" (o ângulo em uma frase), "rationale" (por que deve funcionar, citando o padrão dos comentários), "basedOnQuote" (o comentário literal que inspirou) e "videoIds".

Comentários:

${blocks.join('\n\n')}`;
}

export function formatReportMarkdown(report: ShortsCommentsReport, titles: Record<string, string>): string {
  const sources = (ids: string[]) => ids.map(id => titles[id] || id).join(', ');
  const lines: string[] = ['# Análise de comentários para criativos', '', '## Dores e desejos'];

  report.painsAndDesires.forEach(item => {
    lines.push(`- ${item.insight} (frequência ${item.frequency}; ${sources(item.videoIds)})`);
  });

  lines.push('', '## Linguagem do público');
  report.audienceLanguage.forEach(item => {
    lines.push(`- "${item.quote}"${item.translation ? ` (${item.translation})` : ''} (${sources([item.videoId])})`);
  });

  lines.push('', '## Ângulos de anúncio');
  report.adAngles.forEach((item, index) => {
    lines.push(
      `${index + 1}. **${item.hook}**`,
      `   - Ângulo: ${item.angle}`,
      `   - Por que funciona: ${item.rationale}`,
      `   - Baseado em: "${item.basedOnQuote}"`,
      `   - Shorts: ${sources(item.videoIds)}`,
    );
  });

  return lines.join('\n');
}

// Chave do cache de análises: mesma seleção, em qualquer ordem, reaproveita o resultado
export function analysisKey(videoIds: string[]): string {
  return [...videoIds].sort().join(',');
}
