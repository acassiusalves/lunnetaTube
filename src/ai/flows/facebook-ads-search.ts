'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FacebookAdsSearchInputSchema = z.object({
  accessToken: z.string().describe('The Facebook Access Token.'),
  keyword: z.string().describe('The keyword to search for in the ads library.'),
  adType: z.enum(['POLITICAL_AND_ISSUE_ADS', 'ALL']).optional().describe('Type of ads to search. Note: API only supports POLITICAL_AND_ISSUE_ADS for keyword search.'),
  searchType: z.enum(['keyword', 'page']).optional().describe('Search by keyword or page ID'),
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
  'publisher_platforms',
].join(',');

// use exatamente a versão que você testou
const API_VERSION = 'v21.0';

const searchFacebookAdsFlow = ai.defineFlow(
  {
    name: 'searchFacebookAdsFlow',
    inputSchema: FacebookAdsSearchInputSchema,
    outputSchema: FacebookAdsSearchOutputSchema,
  },
  async ({ accessToken, keyword, adType = 'POLITICAL_AND_ISSUE_ADS', searchType = 'keyword' }) => {
    try {
      const token = accessToken.trim();

      // Build params based on search type
      const params: Record<string, string> = {
        access_token: token,
        fields: FIELDS,
        limit: '25',
      };

      // For keyword search
      if (searchType === 'keyword') {
        params.search_terms = keyword;
        params.ad_active_status = 'ALL'; // Changed to ALL to get more results
        params.ad_type = adType;

        // Remove country filter to get international results too
        // params.ad_reached_countries = 'BR'; // Commented out to search globally
      }
      // For page ID search
      else if (searchType === 'page') {
        params.search_page_ids = keyword; // keyword is treated as page ID
        params.ad_active_status = 'ALL';
        // Note: When searching by page_id, ad_type is not required
      }

      const queryString = new URLSearchParams(params).toString();
      const url = `https://graph.facebook.com/${API_VERSION}/ads_archive?${queryString}`;

      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      const json = await res.json();

      if (!res.ok) {
        console.error('FB Ads Library ERROR', { status: res.status, error: json?.error });
        const fbErr = json?.error;

        // Better error messages
        if (fbErr?.code === 190 || fbErr?.type === 'OAuthException') {
          throw new Error('Token inválido ou expirado. Gere um novo token de acesso no Facebook e salve em Configurações.');
        }
        if (fbErr?.code === 100) {
          throw new Error('Parâmetros inválidos. Verifique se o token tem as permissões necessárias (ads_read).');
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
