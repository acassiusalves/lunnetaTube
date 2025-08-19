
'use server';

/**
 * @fileOverview A flow for searching ads in the Facebook Ads Library.
 *
 * - searchFacebookAds - A function that searches for Facebook ads.
 * - FacebookAdsSearchInput - The input type for the searchFacebookAds function.
 * - FacebookAdsSearchOutput - The return type for the searchFacebookAds function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { URLSearchParams } from 'url';

const FacebookAdsSearchInputSchema = z.object({
  appId: z.string().describe('The Facebook App ID.'),
  appSecret: z.string().describe('The Facebook App Secret.'),
  keyword: z.string().describe('The keyword to search for in the ads library.'),
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
  ads: z.array(AdSchema).optional().describe('An array of ad results.'),
  error: z.string().optional().describe('An error message if the search fails.'),
});
export type FacebookAdsSearchOutput = z.infer<typeof FacebookAdsSearchOutputSchema>;

// Helper function to get an access token
async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const response = await fetch(`https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch access token');
  }
  return data.access_token;
}

const searchFacebookAdsFlow = ai.defineFlow(
  {
    name: 'searchFacebookAdsFlow',
    inputSchema: FacebookAdsSearchInputSchema,
    outputSchema: FacebookAdsSearchOutputSchema,
  },
  async ({ appId, appSecret, keyword }) => {
    try {
      const accessToken = await getAccessToken(appId, appSecret);
      
      const searchParams = new URLSearchParams({
        access_token: accessToken,
        search_terms: keyword,
        ad_type: 'ALL',
        ad_active_status: 'ALL',
        ad_reached_countries: "['BR']",
        limit: '25',
        fields: [
          'id', 'ad_creation_time', 'ad_creative_bodies', 'ad_creative_link_captions',
          'ad_creative_link_descriptions', 'ad_creative_link_titles', 'ad_delivery_start_time',
          'ad_snapshot_url', 'bylines', 'currency', 'delivery_by_region', 'estimated_audience_size',
          'impressions', 'languages', 'page_id', 'page_name', 'publisher_platforms', 'spend'
        ].join(','),
      });

      const response = await fetch(`https://graph.facebook.com/v20.0/ads_archive?${searchParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to search ads.');
      }
      
      // Validate data with Zod schema
      const validatedAds = z.array(AdSchema).safeParse(data.data);

      if (!validatedAds.success) {
        console.error("Facebook API data validation error:", validatedAds.error);
        throw new Error("Dados recebidos da API do Facebook não correspondem ao formato esperado.");
      }
      
      return { ads: validatedAds.data };
    } catch (e: any) {
      console.error('Error in searchFacebookAdsFlow:', e);
      return { error: `Erro na API do Facebook: ${e.message}` };
    }
  }
);

export async function searchFacebookAds(input: FacebookAdsSearchInput): Promise<FacebookAdsSearchOutput> {
  return searchFacebookAdsFlow(input);
}
