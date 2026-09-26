/**
 * Área de cada país para o filtro de localização da busca de Shorts
 * (`search.list` com `location` + `locationRadius`).
 *
 * O centro vem da tabela pública de centroides de países do Google (Dataset
 * Publishing Language, developers.google.com/public-data/docs/canonical/countries_csv).
 * O raio cobre o território principal a partir do centro, limitado a 1.000 km, o
 * máximo aceito pela API: países maiores (Brasil, EUA, Rússia...) e ilhas distantes
 * (Açores, Canárias...) ficam cobertos só em parte.
 */

import { iso1A2Code } from '@rapideditor/country-coder';

export interface CountryGeo {
  lat: number;
  lng: number;
  radiusKm: number;
}

export const MAX_LOCATION_RADIUS_KM = 1000;

export const COUNTRY_GEO: Record<string, CountryGeo> = {
  ZA: { lat: -30.56, lng: 22.94, radiusKm: 900 }, // South Africa
  DE: { lat: 51.17, lng: 10.45, radiusKm: 450 }, // Germany
  SA: { lat: 23.89, lng: 45.08, radiusKm: 1000 }, // Saudi Arabia
  DZ: { lat: 28.03, lng: 1.66, radiusKm: 1000 }, // Algeria
  AR: { lat: -38.42, lng: -63.62, radiusKm: 1000 }, // Argentina
  AU: { lat: -25.27, lng: 133.78, radiusKm: 1000 }, // Australia
  AT: { lat: 47.52, lng: 14.55, radiusKm: 300 }, // Austria
  AZ: { lat: 40.14, lng: 47.58, radiusKm: 250 }, // Azerbaijan
  BH: { lat: 25.93, lng: 50.64, radiusKm: 50 }, // Bahrain
  BD: { lat: 23.68, lng: 90.36, radiusKm: 300 }, // Bangladesh
  BY: { lat: 53.71, lng: 27.95, radiusKm: 350 }, // Belarus
  BE: { lat: 50.5, lng: 4.47, radiusKm: 150 }, // Belgium
  BO: { lat: -16.29, lng: -63.59, radiusKm: 700 }, // Bolivia
  BA: { lat: 43.92, lng: 17.68, radiusKm: 200 }, // Bosnia and Herzegovina
  BR: { lat: -14.24, lng: -51.93, radiusKm: 1000 }, // Brazil
  BG: { lat: 42.73, lng: 25.49, radiusKm: 300 }, // Bulgaria
  KH: { lat: 12.57, lng: 104.99, radiusKm: 300 }, // Cambodia
  CA: { lat: 56.13, lng: -106.35, radiusKm: 1000 }, // Canada
  QA: { lat: 25.35, lng: 51.18, radiusKm: 120 }, // Qatar
  KZ: { lat: 48.02, lng: 66.92, radiusKm: 1000 }, // Kazakhstan
  CL: { lat: -35.68, lng: -71.54, radiusKm: 1000 }, // Chile
  CY: { lat: 35.13, lng: 33.43, radiusKm: 120 }, // Cyprus
  CO: { lat: 4.57, lng: -74.3, radiusKm: 700 }, // Colombia
  KR: { lat: 35.91, lng: 127.77, radiusKm: 300 }, // South Korea
  CR: { lat: 9.75, lng: -83.75, radiusKm: 200 }, // Costa Rica
  HR: { lat: 45.1, lng: 15.2, radiusKm: 300 }, // Croatia
  DK: { lat: 56.26, lng: 9.5, radiusKm: 250 }, // Denmark
  EG: { lat: 26.82, lng: 30.8, radiusKm: 700 }, // Egypt
  SV: { lat: 13.79, lng: -88.9, radiusKm: 150 }, // El Salvador
  AE: { lat: 23.42, lng: 53.85, radiusKm: 250 }, // United Arab Emirates
  EC: { lat: -1.83, lng: -78.18, radiusKm: 400 }, // Ecuador
  SK: { lat: 48.67, lng: 19.7, radiusKm: 250 }, // Slovakia
  SI: { lat: 46.15, lng: 15.0, radiusKm: 150 }, // Slovenia
  ES: { lat: 40.46, lng: -3.75, radiusKm: 550 }, // Spain
  US: { lat: 37.09, lng: -95.71, radiusKm: 1000 }, // United States
  EE: { lat: 58.6, lng: 25.01, radiusKm: 200 }, // Estonia
  PH: { lat: 12.88, lng: 121.77, radiusKm: 900 }, // Philippines
  FI: { lat: 61.92, lng: 25.75, radiusKm: 600 }, // Finland
  FR: { lat: 46.23, lng: 2.21, radiusKm: 600 }, // France
  GH: { lat: 7.95, lng: -1.02, radiusKm: 400 }, // Ghana
  GE: { lat: 42.32, lng: 43.36, radiusKm: 250 }, // Georgia
  GR: { lat: 39.07, lng: 21.82, radiusKm: 400 }, // Greece
  GT: { lat: 15.78, lng: -90.23, radiusKm: 250 }, // Guatemala
  HN: { lat: 15.2, lng: -86.24, radiusKm: 300 }, // Honduras
  HK: { lat: 22.4, lng: 114.11, radiusKm: 50 }, // Hong Kong
  HU: { lat: 47.16, lng: 19.5, radiusKm: 250 }, // Hungary
  YE: { lat: 15.55, lng: 48.52, radiusKm: 600 }, // Yemen
  IN: { lat: 20.59, lng: 78.96, radiusKm: 1000 }, // India
  ID: { lat: -0.79, lng: 113.92, radiusKm: 1000 }, // Indonesia
  IQ: { lat: 33.22, lng: 43.68, radiusKm: 500 }, // Iraq
  IE: { lat: 53.41, lng: -8.24, radiusKm: 250 }, // Ireland
  IS: { lat: 64.96, lng: -19.02, radiusKm: 300 }, // Iceland
  IL: { lat: 31.05, lng: 34.85, radiusKm: 250 }, // Israel
  IT: { lat: 41.87, lng: 12.57, radiusKm: 650 }, // Italy
  JM: { lat: 18.11, lng: -77.3, radiusKm: 150 }, // Jamaica
  JP: { lat: 36.2, lng: 138.25, radiusKm: 1000 }, // Japan
  JO: { lat: 30.59, lng: 36.24, radiusKm: 300 }, // Jordan
  KW: { lat: 29.31, lng: 47.48, radiusKm: 120 }, // Kuwait
  LA: { lat: 19.86, lng: 102.5, radiusKm: 450 }, // Laos
  LV: { lat: 56.88, lng: 24.6, radiusKm: 250 }, // Latvia
  LB: { lat: 33.85, lng: 35.86, radiusKm: 120 }, // Lebanon
  LY: { lat: 26.34, lng: 17.23, radiusKm: 1000 }, // Libya
  LI: { lat: 47.17, lng: 9.56, radiusKm: 30 }, // Liechtenstein
  LT: { lat: 55.17, lng: 23.88, radiusKm: 250 }, // Lithuania
  LU: { lat: 49.82, lng: 6.13, radiusKm: 60 }, // Luxembourg
  MK: { lat: 41.61, lng: 21.75, radiusKm: 120 }, // Macedonia [FYROM]
  MY: { lat: 4.21, lng: 101.98, radiusKm: 1000 }, // Malaysia
  MT: { lat: 35.94, lng: 14.38, radiusKm: 50 }, // Malta
  MA: { lat: 31.79, lng: -7.09, radiusKm: 600 }, // Morocco
  MX: { lat: 23.63, lng: -102.55, radiusKm: 1000 }, // Mexico
  ME: { lat: 42.71, lng: 19.37, radiusKm: 120 }, // Montenegro
  NP: { lat: 28.39, lng: 84.12, radiusKm: 450 }, // Nepal
  NI: { lat: 12.87, lng: -85.21, radiusKm: 250 }, // Nicaragua
  NG: { lat: 9.08, lng: 8.68, radiusKm: 700 }, // Nigeria
  NO: { lat: 60.47, lng: 8.47, radiusKm: 800 }, // Norway
  NZ: { lat: -40.9, lng: 174.89, radiusKm: 800 }, // New Zealand
  OM: { lat: 21.51, lng: 55.92, radiusKm: 600 }, // Oman
  NL: { lat: 52.13, lng: 5.29, radiusKm: 200 }, // Netherlands
  PA: { lat: 8.54, lng: -80.78, radiusKm: 350 }, // Panama
  PG: { lat: -6.31, lng: 143.96, radiusKm: 700 }, // Papua New Guinea
  PK: { lat: 30.38, lng: 69.35, radiusKm: 900 }, // Pakistan
  PY: { lat: -23.44, lng: -58.44, radiusKm: 500 }, // Paraguay
  PE: { lat: -9.19, lng: -75.02, radiusKm: 900 }, // Peru
  PL: { lat: 51.92, lng: 19.15, radiusKm: 400 }, // Poland
  PR: { lat: 18.22, lng: -66.59, radiusKm: 100 }, // Puerto Rico
  PT: { lat: 39.4, lng: -8.22, radiusKm: 350 }, // Portugal
  KE: { lat: -0.02, lng: 37.91, radiusKm: 550 }, // Kenya
  GB: { lat: 55.38, lng: -3.44, radiusKm: 550 }, // United Kingdom
  DO: { lat: 18.74, lng: -70.16, radiusKm: 200 }, // Dominican Republic
  CZ: { lat: 49.82, lng: 15.47, radiusKm: 250 }, // Czech Republic
  RO: { lat: 45.94, lng: 24.97, radiusKm: 400 }, // Romania
  RU: { lat: 61.52, lng: 105.32, radiusKm: 1000 }, // Russia
  SN: { lat: 14.5, lng: -14.45, radiusKm: 400 }, // Senegal
  RS: { lat: 44.02, lng: 21.01, radiusKm: 300 }, // Serbia
  SG: { lat: 1.35, lng: 103.82, radiusKm: 40 }, // Singapore
  LK: { lat: 7.87, lng: 80.77, radiusKm: 250 }, // Sri Lanka
  SE: { lat: 60.13, lng: 18.64, radiusKm: 800 }, // Sweden
  CH: { lat: 46.82, lng: 8.23, radiusKm: 200 }, // Switzerland
  TH: { lat: 15.87, lng: 100.99, radiusKm: 700 }, // Thailand
  TW: { lat: 23.7, lng: 120.96, radiusKm: 250 }, // Taiwan
  TZ: { lat: -6.37, lng: 34.89, radiusKm: 700 }, // Tanzania
  TN: { lat: 33.89, lng: 9.54, radiusKm: 400 }, // Tunisia
  TR: { lat: 38.96, lng: 35.24, radiusKm: 800 }, // Turkey
  UA: { lat: 48.38, lng: 31.17, radiusKm: 700 }, // Ukraine
  UG: { lat: 1.37, lng: 32.29, radiusKm: 350 }, // Uganda
  UY: { lat: -32.52, lng: -55.77, radiusKm: 300 }, // Uruguay
  VE: { lat: 6.42, lng: -66.59, radiusKm: 700 }, // Venezuela
  VN: { lat: 14.06, lng: 108.28, radiusKm: 900 }, // Vietnam
  ZW: { lat: -19.02, lng: 29.15, radiusKm: 450 }, // Zimbabwe
};

// Parâmetros do search.list para buscar só vídeos marcados dentro do país
export function getLocationFilter(code: string): { location: string; locationRadius: string } | undefined {
  const geo = COUNTRY_GEO[code.toUpperCase()];
  if (!geo) return undefined;
  return { location: `${geo.lat},${geo.lng}`, locationRadius: `${geo.radiusKm}km` };
}

// O filtro location do search.list é impreciso: vídeos marcados com o país vizinho inteiro
// ("España") ou fora do raio ("Madrid", a 402 km de Portugal) também entram (testado no
// APIs Explorer em 2026-09-25). As coordenadas de cada vídeo (videos.list, recordingDetails)
// dizem o país de verdade, pelas fronteiras (limites offline do country-coder)
export function countryAtPoint(lat: number, lng: number): string | null {
  return iso1A2Code([lng, lat]) ?? null;
}
