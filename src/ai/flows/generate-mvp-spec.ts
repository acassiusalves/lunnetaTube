'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMvpSpecInputSchema = z.object({
  opportunity: z.object({
    title: z.string(),
    problem: z.string(),
    solution: z.string(),
    mvpFeatures: z.array(z.string()),
    targetAudience: z.string(),
    marketSegment: z.enum(['B2C', 'B2B', 'BOTH']),
  }),
});
export type GenerateMvpSpecInput = z.infer<typeof GenerateMvpSpecInputSchema>;

const FeatureSpecSchema = z.object({
  name: z.string(),
  description: z.string(),
  technicalRequirements: z.array(z.string()),
  estimatedHours: z.number(),
});

const GenerateMvpSpecOutputSchema = z.object({
  projectName: z.string().describe('Nome do projeto (slug-format)'),
  tagline: z.string().describe('Tagline curta do produto'),
  techStack: z.object({
    frontend: z.array(z.string()),
    backend: z.array(z.string()),
    database: z.string(),
    hosting: z.string(),
    thirdPartyAPIs: z.array(z.string()).optional(),
  }),
  architecture: z.string().describe('Descrição da arquitetura do sistema (2-3 parágrafos)'),
  dataModel: z.array(z.object({
    entity: z.string(),
    fields: z.array(z.string()),
    relationships: z.array(z.string()).optional(),
  })),
  features: z.array(FeatureSpecSchema).min(3).max(7),
  coreWorkflows: z.array(z.object({
    name: z.string(),
    steps: z.array(z.string()),
    userStory: z.string(),
  })),
  estimatedTimeline: z.object({
    totalWeeks: z.number(),
    breakdown: z.array(z.object({
      phase: z.string(),
      weeks: z.number(),
      deliverables: z.array(z.string()),
    })),
  }),
  estimatedCosts: z.object({
    development: z.string(),
    monthlyHosting: z.string(),
    thirdPartyServices: z.string().optional(),
  }),
  technicalChallenges: z.array(z.string()),
  scalabilityConsiderations: z.string(),
  securityConsiderations: z.array(z.string()),
  launchChecklist: z.array(z.string()),
});
export type GenerateMvpSpecOutput = z.infer<typeof GenerateMvpSpecOutputSchema>;

export async function generateMvpSpec(input: GenerateMvpSpecInput): Promise<GenerateMvpSpecOutput> {
  return generateMvpSpecFlow(input);
}

const PROMPT = `Você é um Arquiteto de Software Sênior especializado em criar especificações técnicas para Micro SaaS.

Sua missão é gerar uma especificação técnica COMPLETA e EXECUTÁVEL para implementar este MVP:

**Título do SaaS:** {{title}}
**Problema que Resolve:** {{problem}}
**Solução Proposta:** {{solution}}
**Público-Alvo:** {{targetAudience}}
**Segmento:** {{marketSegment}}
**Funcionalidades do MVP:** {{mvpFeatures}}

🎯 REQUISITOS DA ESPECIFICAÇÃO:

1. **Tech Stack Moderna e Simples:**
   - Escolha tecnologias que permitam desenvolvimento RÁPIDO (2-4 semanas)
   - Prefira soluções serverless e low-code quando apropriado
   - Exemplos: Next.js 14, React, Supabase/Firebase, Vercel/Netlify, Stripe
   - Evite over-engineering (não use Kubernetes, microservices, etc.)

2. **Arquitetura:**
   - Descreva a arquitetura em 2-3 parágrafos
   - Explique como os componentes se conectam
   - Justifique escolhas técnicas

3. **Modelo de Dados:**
   - Defina 3-7 entidades principais
   - Liste campos essenciais (sem detalhes de implementação)
   - Relacionamentos entre entidades

4. **Features Detalhadas:**
   - Para cada feature do MVP, forneça:
     - Nome e descrição
     - Requisitos técnicos específicos
     - Estimativa de horas de desenvolvimento

5. **Workflows Principais:**
   - 2-4 fluxos de usuário principais
   - Passo a passo de cada fluxo
   - User story ("Como [persona], eu quero [ação] para [benefício]")

6. **Timeline Realista:**
   - Dividir em 2-4 fases (semanas)
   - Deliverables por fase
   - Total: 2-4 semanas para 1-2 desenvolvedores

7. **Custos:**
   - Desenvolvimento (em R$ ou USD)
   - Hosting mensal (estimativa)
   - Serviços de terceiros (se aplicável)

8. **Considerações:**
   - Desafios técnicos previstos
   - Estratégia de escalabilidade
   - Requisitos de segurança (auth, dados, LGPD/GDPR)
   - Checklist de lançamento (10 itens essenciais)

✅ DIRETRIZES:
- Foque em MVP MÍNIMO mas funcional
- Priorize validação rápida sobre perfeição
- Escolha ferramentas com free tier generoso
- Considere custos para primeiros 100-1000 usuários
- Output deve ser pronto para passar ao Cursor/v0.dev

Sua resposta deve ser APENAS JSON válido seguindo o schema.
Responda em Português do Brasil.`;

const generateMvpSpecFlow = ai.defineFlow(
  {
    name: 'generateMvpSpecFlow',
    inputSchema: GenerateMvpSpecInputSchema,
    outputSchema: GenerateMvpSpecOutputSchema,
  },
  async ({ opportunity }) => {
    const {output} = await ai.generate({
      prompt: PROMPT
        .replace('{{title}}', opportunity.title)
        .replace('{{problem}}', opportunity.problem)
        .replace('{{solution}}', opportunity.solution)
        .replace('{{targetAudience}}', opportunity.targetAudience)
        .replace('{{marketSegment}}', opportunity.marketSegment)
        .replace('{{mvpFeatures}}', opportunity.mvpFeatures.join(', ')),
      model: 'googleai/gemini-2.5-pro',
      output: {
        schema: GenerateMvpSpecOutputSchema,
        format: 'json',
      },
      config: {
        temperature: 0.3, // Low temperature for technical precision
      }
    });

    return output!;
  }
);
