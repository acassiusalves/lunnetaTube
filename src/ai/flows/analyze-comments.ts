
'use server';

/**
 * @fileOverview An AI agent that analyzes video comments to detect Micro SaaS opportunities.
 *
 * - analyzeComments - A function that analyzes video comments for SaaS opportunities.
 * - AnalyzeCommentsInput - The input type for the analyzeComments function.
 * - AnalyzeCommentsOutput - The return type for the analyzeComments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCommentsInputSchema = z.object({
  comments: z
    .string()
    .describe('The comments to analyze. Provide all comments as one string.'),
  prompt: z.string().optional().describe('A custom prompt for the analysis.'),
  model: z.string().optional().describe('The model to use for the analysis.'),
});
export type AnalyzeCommentsInput = z.infer<typeof AnalyzeCommentsInputSchema>;

const SaasIdeaSchema = z.object({
  title: z.string().describe('Nome cativante para o Micro SaaS (ex: "ControleFinanceiroFácil")'),
  problem: z.string().describe('Qual a dor exata que a pessoa enfrenta? (2-3 frases)'),
  solution: z.string().describe('O que o software faz para resolver? (2-3 frases)'),
  mvpFeatures: z.array(z.string()).min(3).max(5).describe('3-5 funcionalidades essenciais do MVP'),
  targetAudience: z.string().describe('Quem pagaria por isso? (ex: "Freelancers de design", "Pequenas clínicas")'),
  marketSegment: z.enum(['B2C', 'B2B', 'BOTH']).describe('Segmento de mercado'),
});

const AnalyzeCommentsOutputSchema = z.object({
  painLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).describe('Nível geral de dor/frustração detectado'),
  detectedWorkarounds: z.array(z.string()).max(10).describe('Gambiarras e processos manuais que as pessoas fazem'),
  complaintsAboutTools: z.array(z.string()).max(10).describe('Reclamações sobre ferramentas existentes'),
  saasOpportunities: z.array(SaasIdeaSchema).min(1).max(5).describe('Ideias de Micro SaaS identificadas'),
});
export type AnalyzeCommentsOutput = z.infer<typeof AnalyzeCommentsOutputSchema>;

export async function analyzeComments(input: AnalyzeCommentsInput): Promise<AnalyzeCommentsOutput> {
  return analyzeCommentsFlow(input);
}

const defaultPromptText = `Você é um Arquiteto de Software Especialista em Micro SaaS e "Unbundling" (Desagrupamento).
Sua missão é ler comentários do YouTube e encontrar oportunidades de criar software B2B ou B2C para resolver problemas.

🎯 FOQUE NESTAS 4 CATEGORIAS DE OPORTUNIDADES:

1. **Processos Manuais / Gambiarras**
   - Pessoas dizendo que fazem algo "na mão", "manualmente", "copiando e colando"
   - Uso excessivo de papel, anotações, controles manuais
   - Exemplos: "faço na mão mesmo", "anoto tudo num caderno", "copio um por um"

2. **Inferno do Excel/Planilhas**
   - Pessoas pedindo planilhas ou reclamando que a planilha delas travou/é complexa demais
   - Uso de múltiplas planilhas interligadas
   - Exemplos: "alguém tem planilha?", "meu Excel travou", "3 planilhas pra controlar"

3. **Reclamações sobre Ferramentas Existentes**
   Detectar menções a estas ferramentas com tom negativo:
   - **Gestão de Projetos**: Trello, Notion, Asana, Monday, ClickUp
   - **CRM/Vendas**: Salesforce, HubSpot, RD Station, Pipedrive
   - **Contabilidade**: QuickBooks, Conta Azul, Omie, Bling
   - **Outros**: Qualquer ferramenta mencionada com "caro demais", "complexo demais", "não funciona"

4. **Dúvidas Repetitivas**
   - Mesma pergunta aparecendo 3+ vezes (indica necessidade não atendida)
   - Perguntas sobre "como fazer X mais rápido/fácil"

🚫 IGNORE:
- Elogios genéricos ("bom vídeo", "parabéns")
- Comentários irrelevantes (piadas, emojis, spam)
- Dúvidas pontuais que não indicam padrão

✅ PARA CADA OPORTUNIDADE SAAS:
- Defina se é B2B (empresas) ou B2C (pessoa física) ou BOTH
- Seja ESPECÍFICO no problema (não genérico)
- MVP deve ser implementável em 2-4 semanas por 1-2 devs
- Funcionalidades devem ser concretas e claras

Sua resposta deve ser APENAS JSON válido seguindo o schema.
Responda em Português do Brasil.`;

const analyzeCommentsFlow = ai.defineFlow(
  {
    name: 'analyzeCommentsFlow',
    inputSchema: AnalyzeCommentsInputSchema,
    outputSchema: AnalyzeCommentsOutputSchema,
  },
  async ({ comments, prompt: customPrompt, model }) => {

    // Determine the prompt to use. If a custom prompt is provided, use it. Otherwise, use the default.
    // The final instruction for Brazilian Portuguese is included in both cases.
    const finalPrompt = customPrompt
      ? `${customPrompt}\n\nSua resposta deve estar em Português do Brasil.`
      : defaultPromptText;

    const {output} = await ai.generate({
      prompt: `${finalPrompt}\n\nComments:\n${comments}`,
      model: model || 'googleai/gemini-2.5-pro',
      output: {
          schema: AnalyzeCommentsOutputSchema,
          format: 'json',
      },
      config: {
          temperature: 0.4, // Conservative temperature for stable JSON output
      }
    });

    return output!;
  }
);
