import type { NominatimResult } from '../types';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Search for locations using Nominatim geocoding API
 * @param query - Search query string
 * @returns Promise resolving to array of Nominatim results
 */
export async function searchNominatim(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '10',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'AOI-Map-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data as NominatimResult[];
  } catch (error) {
    console.error('Error fetching geocoding results:', error);
    return [];
  }
}

