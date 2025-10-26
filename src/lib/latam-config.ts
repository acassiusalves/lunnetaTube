/**
 * Configurações LATAM para Radar de Oportunidades
 */

export interface LatamCountry {
  value: string;        // Código ISO uppercase (BR, MX, AR...)
  label: string;        // Nome completo
  lang: 'pt' | 'es';   // Idioma predominante
  currency: string;    // Código da moeda
  flag: string;        // Emoji da bandeira
}

export const LATAM_COUNTRIES: LatamCountry[] = [
  { value: 'BR', label: 'Brasil', lang: 'pt', currency: 'BRL', flag: '🇧🇷' },
  { value: 'MX', label: 'México', lang: 'es', currency: 'MXN', flag: '🇲🇽' },
  { value: 'AR', label: 'Argentina', lang: 'es', currency: 'ARS', flag: '🇦🇷' },
  { value: 'CO', label: 'Colômbia', lang: 'es', currency: 'COP', flag: '🇨🇴' },
  { value: 'CL', label: 'Chile', lang: 'es', currency: 'CLP', flag: '🇨🇱' },
  { value: 'PE', label: 'Peru', lang: 'es', currency: 'PEN', flag: '🇵🇪' },
];

export function getCountryByCode(code: string): LatamCountry | undefined {
  return LATAM_COUNTRIES.find(c => c.value === code.toUpperCase());
}

export function getLanguageByCountry(code: string): 'pt' | 'es' {
  return getCountryByCode(code)?.lang || 'pt';
}

export function getCurrencyByCountry(code: string): string {
  return getCountryByCode(code)?.currency || 'BRL';
}

// Throttle entre chamadas de API (ms)
export const API_THROTTLE_MS = 150;

// TTL do cache (12 horas em ms)
export const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
