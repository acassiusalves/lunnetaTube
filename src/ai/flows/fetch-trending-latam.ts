'use server';

/**
 * @fileOverview Orquestrador LATAM - Busca trending videos em múltiplos países simultaneamente
 *
 * - fetchTrendingLatam - Busca vídeos trending em vários países LATAM
 * - FetchTrendingLatamInput - Input type
 * - FetchTrendingLatamOutput - Output type
 */

import { searchYoutubeVideos } from './youtube-search';
import { getLanguageByCountry, API_THROTTLE_MS } from '@/lib/latam-config';

export interface FetchTrendingLatamInput {
  apiKey: string;
  countries: Array<{ code: string; lang: 'pt' | 'es' }>;
  excludeShorts?: boolean;
  excludeMusic?: boolean;
  excludeGaming?: boolean;
  category?: string;
  maxResultsPerCountry?: number;
}

export interface CountryVideosResult {
  country: string;
  countryName: string;
  flag: string;
  videos: any[];
  nextPageToken?: string;
  error?: string;
}

export interface FetchTrendingLatamOutput {
  results: CountryVideosResult[];
  totalVideos: number;
  countriesProcessed: number;
  errors: string[];
}

/**
 * Busca vídeos trending em múltiplos países LATAM com throttling
 */
export async function fetchTrendingLatam(
  params: FetchTrendingLatamInput
): Promise<FetchTrendingLatamOutput> {
  const results: CountryVideosResult[] = [];
  const errors: string[] = [];
  let totalVideos = 0;

  console.log(`[LATAM] Iniciando busca em ${params.countries.length} países...`);

  for (const country of params.countries) {
    try {
      console.log(`[LATAM] Buscando trending em ${country.code}...`);

      const result = await searchYoutubeVideos({
        type: 'trending',
        country: country.code.toUpperCase(),
        relevanceLanguage: country.lang,
        excludeShorts: params.excludeShorts ?? true,
        excludeMusic: params.excludeMusic ?? true,
        excludeGaming: params.excludeGaming ?? true,
        category: params.category === 'all' ? undefined : params.category,
        apiKey: params.apiKey,
      });

      if (result.error) {
        console.error(`[LATAM] Erro em ${country.code}:`, result.error);
        errors.push(`${country.code}: ${result.error}`);
        results.push({
          country: country.code,
          countryName: getCountryName(country.code),
          flag: getCountryFlag(country.code),
          videos: [],
          error: result.error,
        });
      } else {
        const videos = result.videos || [];
        totalVideos += videos.length;

        console.log(`[LATAM] ${country.code}: ${videos.length} vídeos encontrados`);

        results.push({
          country: country.code,
          countryName: getCountryName(country.code),
          flag: getCountryFlag(country.code),
          videos: videos,
          nextPageToken: result.nextPageToken,
        });
      }

      // Throttle leve entre chamadas (evita quota burst)
      if (params.countries.indexOf(country) < params.countries.length - 1) {
        await sleep(API_THROTTLE_MS);
      }
    } catch (e: any) {
      console.error(`[LATAM] Exceção em ${country.code}:`, e);
      errors.push(`${country.code}: ${e.message}`);
      results.push({
        country: country.code,
        countryName: getCountryName(country.code),
        flag: getCountryFlag(country.code),
        videos: [],
        error: e.message,
      });
    }
  }

  console.log(`[LATAM] Busca concluída: ${totalVideos} vídeos de ${params.countries.length} países`);

  return {
    results,
    totalVideos,
    countriesProcessed: results.filter(r => !r.error).length,
    errors,
  };
}

/**
 * Sleep helper para throttling
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helpers para metadados dos países
 */
function getCountryName(code: string): string {
  const names: Record<string, string> = {
    BR: 'Brasil',
    MX: 'México',
    AR: 'Argentina',
    CO: 'Colômbia',
    CL: 'Chile',
    PE: 'Peru',
  };
  return names[code.toUpperCase()] || code;
}

function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    BR: '🇧🇷',
    MX: '🇲🇽',
    AR: '🇦🇷',
    CO: '🇨🇴',
    CL: '🇨🇱',
    PE: '🇵🇪',
  };
  return flags[code.toUpperCase()] || '🌎';
}
