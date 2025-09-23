'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FacebookAdsSearchInputSchema = z.object({
  accessToken: z.string().describe('The Facebook Access Token.'),
  keyword: z.string().describe('The keyword to search for in the ads library.'),
});
export type FacebookAdsSearchInput = z.infer<typeof FacebookAdsSearchInputSchema>;

const AdSchema = z.object({
  id: z.string(),
  ad_creation_time: z.string().optional(),
  ad_creative_bodies: z.array(z.string()).optional(),
  page_name: z.string().optional(),
  ad_snapshot_url: z.string().optional(),
  impressions: z.object({
    lower_bound: z.string().optional(),
    upper_bound: z.string().optional(),
  }).optional(),
});
export type Ad = z.infer<typeof AdSchema>;

const FacebookAdsSearchOutputSchema = z.object({
  ads: z.array(AdSchema).optional(),
  error: z.string().optional(),
  nextCursor: z.string().optional(),
});
export type FacebookAdsSearchOutput = z.infer<typeof FacebookAdsSearchOutputSchema>;

// mesmo fields do Postman (evita erros de schema/escopo)
const FIELDS = [
  'id',
  'ad_creation_time',
  'ad_creative_bodies',
  'page_name',
  'ad_snapshot_url',
  'impressions',
].join(',');

// use exatamente a versão que você testou
const API_VERSION = 'v19.0';

const searchFacebookAdsFlow = ai.defineFlow(
  {
    name: 'searchFacebookAdsFlow',
    inputSchema: FacebookAdsSearchInputSchema,
    outputSchema: FacebookAdsSearchOutputSchema,
  },
  async ({ accessToken, keyword }) => {
    try {
      const token = accessToken.trim();

      const params = new URLSearchParams({
        access_token: token,
        search_terms: keyword,
        ad_active_status: 'ACTIVE',
        ad_type: 'POLITICAL_AND_ISSUE_ADS',
        ad_reached_countries: 'BR',
        fields: FIELDS,
        limit: '25',
      });

      const url = `https://graph.facebook.com/${API_VERSION}/ads_archive?${params.toString()}`;

      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' }, // não precisa Content-Type no GET
      });

      const json = await res.json();

      if (!res.ok) {
        console.error('FB Ads Library ERROR', { status: res.status, error: json?.error });
        // mensagens mais claras
        const fbErr = json?.error;
        if (fbErr?.code === 190 || fbErr?.type === 'OAuthException') {
          throw new Error('Token inválido/expirado. Gere um novo token e salve em Configurações.');
        }
        throw new Error(fbErr?.message || 'Falha ao buscar no Ad Library.');
      }

      const data = Array.isArray(json?.data) ? json.data : [];
      const nextCursor = json?.paging?.next ?? undefined;
      return { ads: data, nextCursor };
    } catch (e: any) {
      console.error('Error in searchFacebookAdsFlow:', e);
      return { error: `Erro na API do Facebook: ${e.message}` };
    }
  }
);

export async function searchFacebookAds(input: FacebookAdsSearchInput): Promise<FacebookAdsSearchOutput> {
  return searchFacebookAdsFlow(input);
}
