
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import crypto from 'crypto';

const FacebookAdsSearchInputSchema = z.object({
  accessToken: z.string().describe('The Facebook Access Token.'),
  keyword: z.string().describe('The keyword to search for in the ads library.'),
  appSecret: z.string().describe('The Facebook App Secret.'),
});
export type FacebookAdsSearchInput = z.infer<typeof FacebookAdsSearchInputSchema>;

const AdSchema = z.object({
  id: z.string(),
  ad_creation_time: z.string().optional(),
  ad_creative_bodies: z.array(z.string()).optional(),
  ad_creative_link_captions: z.array(z.string()).optional(),
  ad_creative_link_descriptions: z.array(z.string()).optional(),
  ad_creative_link_titles: z.array(z.string()).optional(),
  ad_delivery_start_time: z.string().optional(),
  ad_snapshot_url: z.string().optional(),
  bylines: z.string().optional(),
  currency: z.string().optional(),
  delivery_by_region: z.array(z.object({
    percentage: z.number(),
    region: z.string(),
  })).optional(),
  estimated_audience_size: z.object({
    lower_bound: z.string().optional(),
    upper_bound: z.string().optional(),
  }).optional(),
  impressions: z.object({
    lower_bound: z.string().optional(),
    upper_bound: z.string().optional(),
  }).optional(),
  languages: z.array(z.string()).optional(),
  page_id: z.string().optional(),
  page_name: z.string().optional(),
  publisher_platforms: z.array(z.string()).optional(),
  spend: z.object({
    lower_bound: z.string().optional(),
    upper_bound: z.string().optional(),
  }).optional(),
});
export type Ad = z.infer<typeof AdSchema>;

const FacebookAdsSearchOutputSchema = z.object({
  ads: z.array(AdSchema).optional(),
  error: z.string().optional(),
  nextCursor: z.string().optional(), // paging.next
});
export type FacebookAdsSearchOutput = z.infer<typeof FacebookAdsSearchOutputSchema>;

const FIELDS = [
  'id',
  'ad_creation_time',
  'ad_creative_bodies',
  'ad_creative_link_captions',
  'ad_creative_link_descriptions',
  'ad_creative_link_titles',
  'ad_delivery_start_time',
  'ad_snapshot_url',
  'bylines',
  'currency',
  'delivery_by_region',
  'estimated_audience_size',
  'impressions',
  'languages',
  'page_id',
  'page_name',
  'publisher_platforms',
  'spend',
].join(',');

const API_VERSION = 'v20.0';

function buildAppSecretProof(accessToken: string, appSecret?: string) {
  if (!appSecret) return undefined;
  return crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex');
}

const searchFacebookAdsFlow = ai.defineFlow(
  {
    name: 'searchFacebookAdsFlow',
    inputSchema: FacebookAdsSearchInputSchema,
    outputSchema: FacebookAdsSearchOutputSchema,
  },
  async ({ accessToken, keyword, appSecret }) => {
    try {
      const token = accessToken.trim();
      const appsecret_proof = buildAppSecretProof(token, appSecret);

      const params = new URLSearchParams({
        access_token: token,
        search_terms: keyword,
        ad_type: 'POLITICAL_AND_ISSUE_ADS',
        ad_active_status: 'ALL',
        ad_reached_countries: 'BR',
        fields: FIELDS,
        limit: '25',
      });

      if (appsecret_proof) params.set('appsecret_proof', appsecret_proof);

      const url = `https://graph.facebook.com/${API_VERSION}/ads_archive?${params.toString()}`;
      const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
      const json = await res.json();

      if (!res.ok) {
        console.error('FB Ads Library ERROR', {
          status: res.status,
          error: json?.error,
          url,
        });
        const message = json?.error?.message || 'Falha ao buscar no Ad Library.';
        throw new Error(message);
      }

      const data = Array.isArray(json?.data) ? json.data : [];
      const parsed = z.array(AdSchema).safeParse(data);
      if (!parsed.success) {
        console.error('Zod validation error:', parsed.error);
        throw new Error('Formato inesperado retornado pela API do Facebook.');
      }

      const nextCursor = json?.paging?.next ?? undefined;
      return { ads: parsed.data, nextCursor };
    } catch (e: any) {
      console.error('Error in searchFacebookAdsFlow:', e);
      return { error: `Erro na API do Facebook: ${e.message}` };
    }
  }
);

export async function searchFacebookAds(input: FacebookAdsSearchInput): Promise<FacebookAdsSearchOutput> {
  return searchFacebookAdsFlow(input);
}
