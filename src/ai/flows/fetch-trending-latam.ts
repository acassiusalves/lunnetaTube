'use server';

/**
 * @fileOverview Orquestrador multi-país - Busca trending videos em múltiplos países simultaneamente
 *
 * - fetchTrendingLatam - Busca vídeos trending em vários países
 * - FetchTrendingLatamInput - Input type
 * - FetchTrendingLatamOutput - Output type
 */

import { searchYoutubeVideos } from './youtube-search';
import { getCountryByCode } from '@/lib/countries';

// Throttle entre chamadas de API (ms)
const API_THROTTLE_MS = 150;

export interface FetchTrendingLatamInput {
  apiKey: string;
  countries: string[]; // Códigos ISO (BR, PT, US...)
  keyword?: string;    // Tema opcional (traduzido para o idioma de cada país)
  excludeShorts?: boolean;
  excludeMusic?: boolean;
  excludeGaming?: boolean;
  category?: string;
  publishedAfter?: string; // RFC 3339 - início do período "em alta"
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
 * Busca vídeos trending em múltiplos países com throttling
 */
export async function fetchTrendingLatam(
  params: FetchTrendingLatamInput
): Promise<FetchTrendingLatamOutput> {
  const results: CountryVideosResult[] = [];
  const errors: string[] = [];
  let totalVideos = 0;

  console.log(`[LATAM] Iniciando busca em ${params.countries.length} países...`);

  for (const code of params.countries) {
    try {
      console.log(`[LATAM] Buscando trending em ${code}...`);

      const result = await searchYoutubeVideos({
        type: 'trending',
        keyword: params.keyword,
        country: code.toUpperCase(),
        excludeShorts: params.excludeShorts ?? true,
        excludeMusic: params.excludeMusic ?? true,
        excludeGaming: params.excludeGaming ?? true,
        category: params.category === 'all' ? undefined : params.category,
        publishedAfter: params.publishedAfter,
        apiKey: params.apiKey,
      });

      if (result.error) {
        console.error(`[LATAM] Erro em ${code}:`, result.error);
        errors.push(`${code}: ${result.error}`);
        results.push({
          country: code,
          countryName: getCountryName(code),
          flag: getCountryFlag(code),
          videos: [],
          error: result.error,
        });
      } else {
        const videos = result.videos || [];
        totalVideos += videos.length;

        console.log(`[LATAM] ${code}: ${videos.length} vídeos encontrados`);

        results.push({
          country: code,
          countryName: getCountryName(code),
          flag: getCountryFlag(code),
          videos: videos,
          nextPageToken: result.nextPageToken,
        });
      }

      // Throttle leve entre chamadas (evita quota burst)
      if (params.countries.indexOf(code) < params.countries.length - 1) {
        await sleep(API_THROTTLE_MS);
      }
    } catch (e: any) {
      console.error(`[LATAM] Exceção em ${code}:`, e);
      errors.push(`${code}: ${e.message}`);
      results.push({
        country: code,
        countryName: getCountryName(code),
        flag: getCountryFlag(code),
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
  return getCountryByCode(code)?.label || code;
}

function getCountryFlag(code: string): string {
  return getCountryByCode(code)?.flag || '🌎';
}
