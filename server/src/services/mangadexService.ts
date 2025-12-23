import axios from 'axios';
import { MangaDexResponse, MangaDexSingleResponse, Manga, ChapterFeedResponse, AtHomeServerResponse } from '../types/mangadex';
import { RateLimiter } from 'limiter';

const MANGADEX_API_BASE_URL = process.env.MANGADEX_API_BASE_URL;

if (!MANGADEX_API_BASE_URL) {
    console.error("MANGADEX_API_BASE_URL is not defined in .env");
    process.exit(1);
}

const apiClient = axios.create({
    baseURL: MANGADEX_API_BASE_URL,
    headers: {
        'User-Agent': 'MangaKen/1.0 (https://github.com/your-repo)',
        'Accept': 'application/json'
    }
});

// MangaDex rate limit: 5 requests per second (per IP)
// Using a conservative 4 req/sec to be safe
const limiter = new RateLimiter({ tokensPerInterval: 4, interval: 'second' });

async function removeTokens(total: number) {
  await limiter.removeTokens(total);
}

export const searchManga = async (title: string, limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
    try {
        await removeTokens(1);
        const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
            params: {
                title,
                limit,
                offset,
                "includes[]": ["cover_art", "author", "artist"], // Request related data
                "order[relevance]": "desc" // Order by relevance for search
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error searching manga:', error);
        throw error;
    }
};

export const getMangaDetails = async (mangaId: string): Promise<MangaDexSingleResponse<Manga>> => {
    try {
        await removeTokens(1);
        const response = await apiClient.get<MangaDexSingleResponse<Manga>>(`/manga/${mangaId}`, {
            params: {
                "includes[]": ["cover_art", "author", "artist"]
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching manga details for ID ${mangaId}:`, error);
        throw error;
    }
};

export const getMangaFeed = async (
    mangaId: string,
    translatedLanguage: string[] = ['en'], // Array of language codes
    limit: number = 100, // MangaDex default limit is 100, max 500
    offset: number = 0
): Promise<ChapterFeedResponse> => { // Using simplified ChapterFeedResponse
    try {
        await removeTokens(1);
        // The order parameters are objects, so we need to pass them correctly
        const orderParams: { [key: string]: 'asc' | 'desc' } = {};
        orderParams['volume'] = 'asc';
        orderParams['chapter'] = 'asc';

        const response = await apiClient.get<ChapterFeedResponse>(`/manga/${mangaId}/feed`, { // Type should be MangaDexResponse<Chapter> but simplified
            params: {
                "translatedLanguage[]": translatedLanguage,
                limit,
                offset,
                "includes[]": ["scanlation_group"], // Optional: get scan group info
                order: orderParams // Pass order object directly
            }
        });
        // The actual response is MangaDexResponse<Chapter>, if it's different adjust types or mapping
        return response.data;
    } catch (error) {
        console.error(`Error fetching manga feed for ID ${mangaId}:`, error);
        throw error;
    }
};

export const getChapterPages = async (chapterId: string): Promise<AtHomeServerResponse> => {
    try {
        await removeTokens(1);
        const response = await apiClient.get<AtHomeServerResponse>(`/at-home/server/${chapterId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching chapter pages for ID ${chapterId}:`, error);
        throw error;
    }
};

export const listManga = async (query: any): Promise<MangaDexResponse<Manga>> => {
    try {
        await removeTokens(1);
        // Pass all query params directly to MangaDex /manga endpoint
        const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
            params: query
        });
        return response.data;
    } catch (error) {
        console.error('Error listing manga:', error);
        throw error;
    }
};

/**
 * Fetches and combines all relevant manga info: details, statistics, and chapters.
 * Ensures all chapters are fetched and chapter pages are loaded robustly.
 */
export const getCompleteMangaInfo = async (mangaId: string, languages: string[] = ['en']) => {
  try {
    // 1. Fetch manga details
    const detailsRes = await getMangaDetails(mangaId);
    const manga = detailsRes.data;

    // 2. Fetch statistics (rating, follows)
    let rating = null, follows = null;
    try {
      const statsRes = await axios.get(`${MANGADEX_API_BASE_URL}/statistics/manga/${mangaId}`);
      if (statsRes.data && statsRes.data.statistics && statsRes.data.statistics[mangaId]) {
        // MangaDex returns rating as an object: { average, bayesian, distribution }
        // Use average.bayesian or average as a number
        const ratingObj = statsRes.data.statistics[mangaId].rating;
        rating = typeof ratingObj === 'object' ? (ratingObj.bayesian ?? ratingObj.average ?? 0) : ratingObj ?? 0;
        follows = statsRes.data.statistics[mangaId].follows;
      }
    } catch (e) {
      // fallback: leave as null
    }

    // 3. Fetch ALL chapters robustly (handle pagination)
    let allChapters = [] as any[];
    let offset = 0;
    const limit = 500;
    let total = 1;
    while (allChapters.length < total) {
      const feedRes = await getMangaFeed(mangaId, languages, limit, offset);
      if (feedRes && feedRes.data) {
        allChapters.push(...feedRes.data);
        total = feedRes.total || allChapters.length;
        offset += limit;
      } else {
        break;
      }
    }

    // 4. Extract author from relationships
    let author = '';
    const authorRel = (manga.relationships || []).find(rel => rel.type === 'author');
    if (authorRel && authorRel.attributes && authorRel.attributes.name) {
      author = authorRel.attributes.name;
    }

    // 5. Extract genres/tags
    const genres = (manga.attributes.tags || []).map((tag: any) => tag.attributes.name.en || Object.values(tag.attributes.name)[0] || '');

    // 6. Extract cover image
    let coverFileName = '';
    const coverRel = (manga.relationships || []).find((rel: any) => rel.type === 'cover_art');
    if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
      coverFileName = coverRel.attributes.fileName;
    }
    const coverImage = coverFileName ?
      `/api/manga/cover/${manga.id}/${encodeURIComponent(coverFileName)}?size=256` : '';

    // 7. Build and return complete info object
    return {
      id: manga.id,
      title: (manga.attributes.title as any)?.en || Object.values(manga.attributes.title)[0] || 'No Title',
      description: (manga.attributes.description as any)?.en || Object.values(manga.attributes.description)[0] || '',
      author,
      type: (manga as any).type || 'manga',
      status: manga.attributes.status,
      genres,
      rating,
      follows,
      totalChapters: allChapters.length,
      coverImage,
      year: manga.attributes.year,
      contentRating: (manga.attributes as any).contentRating,
      chapters: allChapters,
    };
  } catch (error) {
    console.error('Error fetching complete manga info:', error);
    throw error;
  }
};

export const getMangaStatistics = async (mangaId: string) => {
  try {
    await removeTokens(1);
    const response = await apiClient.get(`/statistics/manga/${mangaId}`);
    // Extract just the statistics for this manga
    if (response.data && response.data.statistics && response.data.statistics[mangaId]) {
      const stats = response.data.statistics[mangaId];
      // Return a simplified statistics object
      return {
        rating: typeof stats.rating === 'object' ? 
          (stats.rating.bayesian ?? stats.rating.average ?? 0) : 
          stats.rating ?? 0,
        follows: stats.follows ?? 0
      };
    }
    return { rating: 0, follows: 0 };
  } catch (error) {
    console.error(`Error fetching manga statistics for ID ${mangaId}:`, error);
    return { rating: 0, follows: 0 };
  }
};

// New: Batch statistics fetch for multiple manga IDs
export const getMangaStatisticsBatch = async (ids: string[]) => {
  if (!ids || ids.length === 0) {
    return {} as Record<string, { rating: number; follows: number }>;
  }
  try {
    await removeTokens(1);
    const params: Record<string, string[]> = {};
    // MangaDex expects repeated manga[] params
    params['manga[]'] = ids;
    const response = await apiClient.get(`/statistics/manga`, { params });
    const result: Record<string, { rating: number; follows: number }> = {};
    if (response.data && response.data.statistics) {
      for (const [id, stats] of Object.entries<Record<string, number | { bayesian?: number; average?: number }>>(response.data.statistics)) {
        const statsTyped = stats as { rating?: number | { bayesian?: number; average?: number }; follows?: number };
        result[id] = {
          rating: typeof statsTyped.rating === 'object' ? (statsTyped.rating.bayesian ?? statsTyped.rating.average ?? 0) : (statsTyped.rating ?? 0),
          follows: statsTyped.follows ?? 0,
        };
      }
    }
    return result;
  } catch (error) {
    console.error(`Error fetching batch manga statistics for IDs ${ids.join(',')}:`, error);
    return {} as Record<string, { rating: number; follows: number }>;
  }
};

/**
 * Fetches completed manga series (status = completed)
 * @param limit Number of results to fetch
 * @param offset Pagination offset
 */
export const getCompletedManga = async (limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
  try {
    await removeTokens(1);
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
      params: {
        limit,
        offset,
        "status[]": "completed",
        "includes[]": ["cover_art", "author", "artist"],
        "order[followedCount]": "desc",
        "contentRating[]": ["safe", "suggestive"],
        "availableTranslatedLanguage[]": "en"
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching completed manga:', error);
    throw error;
  }
};

/**
 * Fetches trending manga based on recent updates with high follows
 * @param limit Number of results to fetch
 * @param offset Pagination offset
 */
export const getTrendingManga = async (limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
  try {
    await removeTokens(1);
    // Get recently updated manga that are popular (high followed count)
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
      params: {
        limit,
        offset,
        "includes[]": ["cover_art", "author", "artist"],
        "order[updatedAt]": "desc", // Recently updated
        "contentRating[]": ["safe", "suggestive"],
        "availableTranslatedLanguage[]": "en",
        "hasAvailableChapters": true
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trending manga:', error);
    throw error;
  }
};

/**
 * Fetches most viewed/followed manga
 * @param limit Number of results to fetch
 * @param offset Pagination offset
 */
export const getMostViewedManga = async (limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
  try {
    await removeTokens(1);
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
      params: {
        limit,
        offset,
        "includes[]": ["cover_art", "author", "artist"],
        "order[followedCount]": "desc",
        "contentRating[]": ["safe", "suggestive"],
        "availableTranslatedLanguage[]": "en",
        "hasAvailableChapters": true
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching most viewed manga:', error);
    throw error;
  }
};

/**
 * Fetches latest/recently added manga
 * @param limit Number of results to fetch  
 * @param offset Pagination offset
 */
export const getLatestManga = async (limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
  try {
    await removeTokens(1);
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
      params: {
        limit,
        offset,
        "includes[]": ["cover_art", "author", "artist"],
        "order[createdAt]": "desc",
        "contentRating[]": ["safe", "suggestive"],
        "availableTranslatedLanguage[]": "en",
        "hasAvailableChapters": true
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching latest manga:', error);
    throw error;
  }
};

// MangaDex tag IDs for common genres (mapped from tag names)
const GENRE_TAG_IDS: Record<string, string> = {
  'Action': '391b0423-d847-456f-aff0-8b0cfc03066b',
  'Adventure': '87cc87cd-a395-47af-b27a-93258283bbc6',
  'Comedy': '4d32cc48-9f00-4cca-9b5a-a839f0764984',
  'Drama': 'b9af3a63-f058-46de-a9a0-e0c13906197a',
  'Fantasy': 'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
  'Horror': 'cdad7e68-1419-41dd-bdce-27753074a640',
  'Mystery': 'ee968100-4191-4968-93d3-f82d72be7e46',
  'Romance': '423e2eae-a7a2-4a8b-ac03-a8351462d71d',
  'Sci-Fi': '256c8bd9-4904-4360-bf4f-508a76571a84',
  'Slice of Life': 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9',
  'Sports': '69964a64-2f90-4d33-beeb-f3ed2875eb4c',
  'Supernatural': 'eabc5b4c-6aff-42f3-b657-3e90cbd00b75',
  'Thriller': '07251805-a27e-4d59-b488-f0bfbec15168',
  'Historical': '33771934-028e-4cb3-8c9b-3c5e21b9a39f',
  'School Life': 'caaa44eb-cd40-4177-b930-79d3ef2afe87',
  'Magic': 'a1f53773-c69a-4ce5-8cab-fffcd90b1565',
  'Martial Arts': '799c202e-7daa-44eb-9cf7-8a3c0441531e',
  'Psychological': '3b60b75c-a2d7-4860-ab56-05f391bb889c',
  'Isekai': 'ace04997-f6bd-436e-b261-779182193d3d',
  'Shounen': 'f4bbd1a0-1d9e-4ae4-8e81-15d6de682d0c',
  'Shoujo': 'a3c67850-4684-404e-9b7f-c69850ee5da6',
  'Seinen': 'f8f62932-27da-4fe4-8ee1-6779a8c5edba',
  'Josei': 'josei-tag-id', // placeholder
  'Mecha': '0a39b5a1-b235-4886-a747-1d05d216532d',
  'Music': '77a50f30-7f3b-4e47-a0b9-36d8b7e0f0d5',
  'Harem': 'aafb99c1-7f60-43fa-b75f-fc9502ce29c7',
  'Ecchi': 'b29d6a3d-1569-4e7a-8caf-7557bc92cd5d',
  'Gore': 'b29d6a3d-1569-4e7a-8caf-7557bc92cd5d',
};

// Publication demographics
const DEMOGRAPHICS: Record<string, string> = {
  'shounen': 'shounen',
  'shoujo': 'shoujo', 
  'seinen': 'seinen',
  'josei': 'josei',
};

// Sort options mapping
const SORT_OPTIONS: Record<string, Record<string, string>> = {
  'rating': { 'order[rating]': 'desc' },
  'followedCount': { 'order[followedCount]': 'desc' },
  'latestUploadedChapter': { 'order[latestUploadedChapter]': 'desc' },
  'createdAt': { 'order[createdAt]': 'desc' },
  'updatedAt': { 'order[updatedAt]': 'desc' },
  'title': { 'order[title]': 'asc' },
  'year': { 'order[year]': 'desc' },
};

export interface AdvancedSearchParams {
  query?: string;
  genres?: string[];
  excludedGenres?: string[];
  status?: string;  // 'ongoing' | 'completed' | 'hiatus' | 'cancelled'
  demographic?: string;  // 'shounen' | 'shoujo' | 'seinen' | 'josei'
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  sortBy?: string;
  contentRating?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Advanced manga search with multiple filters
 */
export const advancedSearchManga = async (params: AdvancedSearchParams): Promise<MangaDexResponse<Manga>> => {
  try {
    await removeTokens(1);
    
    const queryParams: Record<string, unknown> = {
      limit: params.limit || 20,
      offset: params.offset || 0,
      "includes[]": ["cover_art", "author", "artist"],
      "contentRating[]": params.contentRating || ["safe", "suggestive"],
      "availableTranslatedLanguage[]": "en",
      "hasAvailableChapters": true,
    };

    // Add search query
    if (params.query) {
      queryParams.title = params.query;
    }

    // Add genre filters (includedTags)
    if (params.genres && params.genres.length > 0) {
      const tagIds = params.genres
        .map(g => GENRE_TAG_IDS[g])
        .filter(Boolean);
      if (tagIds.length > 0) {
        queryParams["includedTags[]"] = tagIds;
      }
    }

    // Add excluded genres
    if (params.excludedGenres && params.excludedGenres.length > 0) {
      const excludedTagIds = params.excludedGenres
        .map(g => GENRE_TAG_IDS[g])
        .filter(Boolean);
      if (excludedTagIds.length > 0) {
        queryParams["excludedTags[]"] = excludedTagIds;
      }
    }

    // Add status filter
    if (params.status && params.status !== 'all') {
      queryParams["status[]"] = params.status;
    }

    // Add demographic filter
    if (params.demographic && params.demographic !== 'all') {
      queryParams["publicationDemographic[]"] = params.demographic;
    }

    // Add year filter
    if (params.year) {
      queryParams.year = params.year;
    }

    // Add sort order
    if (params.sortBy && SORT_OPTIONS[params.sortBy]) {
      Object.assign(queryParams, SORT_OPTIONS[params.sortBy]);
    } else {
      // Default sort by followed count
      queryParams["order[followedCount]"] = "desc";
    }

    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
      params: queryParams
    });
    return response.data;
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw error;
  }
};

/**
 * Get available tags/genres from MangaDex
 */
export const getMangaTags = async () => {
  try {
    await removeTokens(1);
    const response = await apiClient.get('/manga/tag');
    return response.data;
  } catch (error) {
    console.error('Error fetching manga tags:', error);
    throw error;
  }
};