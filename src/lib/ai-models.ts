/**
 * Modelos Gemini usados pelo sistema.
 *
 * Módulo sem dependências do Genkit, para poder ser importado também em
 * componentes de cliente (ex.: seletor de modelo em Configurações).
 *
 * gemini-1.5-flash e gemini-2.0-flash foram desativados pelo Google, e o
 * acesso ao gemini-2.5-pro ficou restrito. Referência:
 * https://ai.google.dev/gemini-api/docs/models
 */

export interface AiModelOption {
  value: string;
  label: string;
}

// Modelos estáveis oferecidos no seletor de Configurações
export const AI_MODELS: AiModelOption[] = [
  { value: 'googleai/gemini-3.8-flash', label: 'Gemini 3.8 Flash (recomendado)' },
  { value: 'googleai/gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { value: 'googleai/gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (mais rápido e barato)' },
];

// Modelo padrão para análises e geração de conteúdo
export const DEFAULT_MODEL = 'googleai/gemini-3.8-flash';

// Modelo rápido e barato para tarefas simples (traduções)
export const FAST_MODEL = 'googleai/gemini-3.5-flash-lite';

// Normaliza o modelo salvo pelo usuário: valores antigos ou desativados
// (ex.: "gemini-1.5-flash", "googleai/gemini-2.5-pro") viram o padrão
export function resolveModel(model?: string | null): string {
  if (!model) return DEFAULT_MODEL;
  const withPrefix = model.startsWith('googleai/') ? model : `googleai/${model}`;
  return AI_MODELS.some(option => option.value === withPrefix) ? withPrefix : DEFAULT_MODEL;
}
