/**
 * Configurações LATAM para Radar de Oportunidades
 */

export type CountryLang = 'pt' | 'es' | 'en';

export interface TrendingCountry {
  value: string;        // Código ISO uppercase (BR, MX, PT...)
  label: string;        // Nome completo
  lang: CountryLang;    // Idioma predominante
  currency: string;     // Código da moeda
  flag: string;         // Emoji da bandeira
}

// Países disponíveis na página de Tendências (todos suportados pelo
// chart=mostPopular da YouTube Data API)
export const TRENDING_COUNTRIES: TrendingCountry[] = [
  // Língua portuguesa
  { value: 'BR', label: 'Brasil', lang: 'pt', currency: 'BRL', flag: '🇧🇷' },
  { value: 'PT', label: 'Portugal', lang: 'pt', currency: 'EUR', flag: '🇵🇹' },
  // Língua espanhola
  { value: 'MX', label: 'México', lang: 'es', currency: 'MXN', flag: '🇲🇽' },
  { value: 'AR', label: 'Argentina', lang: 'es', currency: 'ARS', flag: '🇦🇷' },
  { value: 'CO', label: 'Colômbia', lang: 'es', currency: 'COP', flag: '🇨🇴' },
  { value: 'CL', label: 'Chile', lang: 'es', currency: 'CLP', flag: '🇨🇱' },
  { value: 'PE', label: 'Peru', lang: 'es', currency: 'PEN', flag: '🇵🇪' },
  { value: 'ES', label: 'Espanha', lang: 'es', currency: 'EUR', flag: '🇪🇸' },
  { value: 'VE', label: 'Venezuela', lang: 'es', currency: 'VES', flag: '🇻🇪' },
  { value: 'EC', label: 'Equador', lang: 'es', currency: 'USD', flag: '🇪🇨' },
  { value: 'BO', label: 'Bolívia', lang: 'es', currency: 'BOB', flag: '🇧🇴' },
  { value: 'PY', label: 'Paraguai', lang: 'es', currency: 'PYG', flag: '🇵🇾' },
  { value: 'UY', label: 'Uruguai', lang: 'es', currency: 'UYU', flag: '🇺🇾' },
  { value: 'CR', label: 'Costa Rica', lang: 'es', currency: 'CRC', flag: '🇨🇷' },
  { value: 'PA', label: 'Panamá', lang: 'es', currency: 'PAB', flag: '🇵🇦' },
  { value: 'DO', label: 'República Dominicana', lang: 'es', currency: 'DOP', flag: '🇩🇴' },
  { value: 'GT', label: 'Guatemala', lang: 'es', currency: 'GTQ', flag: '🇬🇹' },
  { value: 'HN', label: 'Honduras', lang: 'es', currency: 'HNL', flag: '🇭🇳' },
  { value: 'SV', label: 'El Salvador', lang: 'es', currency: 'USD', flag: '🇸🇻' },
  { value: 'NI', label: 'Nicarágua', lang: 'es', currency: 'NIO', flag: '🇳🇮' },
  { value: 'PR', label: 'Porto Rico', lang: 'es', currency: 'USD', flag: '🇵🇷' },
  // Língua inglesa
  { value: 'US', label: 'Estados Unidos', lang: 'en', currency: 'USD', flag: '🇺🇸' },
  { value: 'GB', label: 'Reino Unido', lang: 'en', currency: 'GBP', flag: '🇬🇧' },
  { value: 'CA', label: 'Canadá', lang: 'en', currency: 'CAD', flag: '🇨🇦' },
  { value: 'AU', label: 'Austrália', lang: 'en', currency: 'AUD', flag: '🇦🇺' },
  { value: 'IE', label: 'Irlanda', lang: 'en', currency: 'EUR', flag: '🇮🇪' },
  { value: 'NZ', label: 'Nova Zelândia', lang: 'en', currency: 'NZD', flag: '🇳🇿' },
];

export function getCountryByCode(code: string): TrendingCountry | undefined {
  return TRENDING_COUNTRIES.find(c => c.value === code.toUpperCase());
}

export function getLanguageByCountry(code: string): CountryLang {
  return getCountryByCode(code)?.lang || 'pt';
}

export function getCurrencyByCountry(code: string): string {
  return getCountryByCode(code)?.currency || 'BRL';
}

// Throttle entre chamadas de API (ms)
export const API_THROTTLE_MS = 150;

// TTL do cache (12 horas em ms)
export const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
