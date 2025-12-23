import { Manga, MangaDexResponse, Chapter, AtHomeServerResponse } from '../types';
import apiClient from './apiClient';

// Simple cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (endpoint: string, params?: Record<string, unknown>) => {
    return `${endpoint}${params ? JSON.stringify(params) : ''}`;
};

const getCachedData = (key: string) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
};

const setCachedData = (key: string, data: unknown) => {
    cache.set(key, { data, timestamp: Date.now() });
};

// Search manga by title (supports AbortSignal and simple cache)
export const searchManga = async (
    title: string,
    limit: number = 20,
    offset: number = 0,
    signal?: AbortSignal
): Promise<Manga[]> => {
    const cacheKey = getCacheKey('/manga/search', { title, limit, offset });
    const cached = getCachedData(cacheKey);
    if (cached) return cached as Manga[];

    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/search', {
        params: { title, limit, offset },
        signal,
    });
    setCachedData(cacheKey, response.data.data);
    return response.data.data;
};

// Get latest updated manga
export const getLatestManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const cacheKey = getCacheKey('/manga/latest', { limit, offset });
    const cached = getCachedData(cacheKey);
    if (cached) return cached as Manga[];

    // Use the dedicated latest endpoint
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/latest', {
        params: { limit, offset }
    });
    
    setCachedData(cacheKey, response.data.data);
    return response.data.data;
};

// Get most popular manga (by followed count)
export const getPopularManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const cacheKey = getCacheKey('/manga/popular', { limit, offset });
    const cached = getCachedData(cacheKey);
    if (cached) return cached as Manga[];

    // Use the dedicated most-viewed endpoint (ordered by followed count)
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/most-viewed', {
        params: { limit, offset }
    });
    
    setCachedData(cacheKey, response.data.data);
    return response.data.data;
};

// Get trending manga (recently updated popular series)
export const getTrendingManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const cacheKey = getCacheKey('/manga/trending', { limit, offset });
    const cached = getCachedData(cacheKey);
    if (cached) return cached as Manga[];

    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/trending', {
        params: { limit, offset }
    });
    
    setCachedData(cacheKey, response.data.data);
    return response.data.data;
};

// Get completed manga series (status = completed)
export const getCompletedManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const cacheKey = getCacheKey('/manga/completed', { limit, offset });
    const cached = getCachedData(cacheKey);
    if (cached) return cached as Manga[];

    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/completed', {
        params: { limit, offset }
    });
    
    setCachedData(cacheKey, response.data.data);
    return response.data.data;
};

// Get most viewed manga (distinct from popular, uses offset to get different results)
export const getMostViewedManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const cacheKey = getCacheKey('/manga/most-viewed', { limit, offset });
    const cached = getCachedData(cacheKey);
    if (cached) return cached as Manga[];

    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/most-viewed', {
        params: { limit, offset }
    });
    
    setCachedData(cacheKey, response.data.data);
    return response.data.data;
};

// Get manga details by ID
export const getMangaDetails = async (mangaId: string): Promise<Manga> => {
    const response = await apiClient.get<{ data: Manga }>(`/manga/${mangaId}`);
    return response.data.data;
};

// Get chapter feed for a manga
export const getMangaFeed = async (mangaId: string, limit: number = 500, offset: number = 0): Promise<Chapter[]> => {
    const response = await apiClient.get<MangaDexResponse<Chapter>>(`/manga/${mangaId}/feed`, {
        params: {
            limit,
            offset,
            'order[chapter]': 'asc',
        }
    });
    return response.data.data;
};

// Get pages for a chapter
export const getChapterPages = async (chapterId: string): Promise<AtHomeServerResponse> => {
    const response = await apiClient.get<AtHomeServerResponse>(`/manga/chapter/${chapterId}/pages`);
    return response.data;
};

// Utility to fetch the total number of chapters for a manga, handling pagination
export const getMangaChapterCount = async (mangaId: string): Promise<number> => {
    let total = 0;
    let offset = 0;
    const limit = 500; // MangaDex API max limit per request
    let hasMore = true;
    while (hasMore) {
        const response = await apiClient.get<MangaDexResponse<Chapter>>(`/manga/${mangaId}/feed`, {
            params: {
                limit,
                offset,
                'order[chapter]': 'asc',
                'translatedLanguage[]': ['en'],
                'includeFutureUpdates': 0,
            }
        });
        const chapters = response.data.data;
        total += chapters.length;
        if (chapters.length < limit) {
            hasMore = false;
        } else {
            offset += limit;
        }
    }
    return total;
};

// Add: Get complete manga info (all details, stats, chapters)
export const getCompleteMangaInfo = async (mangaId: string) => {
    const response = await apiClient.get(`/manga/complete/${mangaId}`);
    return response.data;
};

// Add: Get manga statistics (rating, follows)
export const getMangaStatistics = async (mangaId: string) => {
  try {
    const response = await apiClient.get(`/manga/statistics/${mangaId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching statistics for manga ${mangaId}:`, error);
    return { rating: 0, follows: 0 };
  }
};

// New: Batch statistics fetch for multiple IDs
export const getMangaStatisticsBatch = async (ids: string[]) => {
  if (!ids.length) return {} as Record<string, { rating: number; follows: number }>;
  const params = new URLSearchParams();
  ids.forEach(id => params.append('manga[]', id));
  try {
    const response = await apiClient.get(`/manga/statistics/batch`, { params });
    return response.data as Record<string, { rating: number; follows: number }>;
  } catch (error) {
    console.error('Error fetching batch statistics:', error);
    return {} as Record<string, { rating: number; follows: number }>;
  }
};

// Get batch hero manga data for homepage hero slider
type HeroEntry = {
    id: string;
    title: string;
    description: string;
    image: string;
    genres: string[];
    chapters: number;
};

export const getHeroManga = async (): Promise<{
    id: string;
    title: string;
    description: string;
    image: string;
    genres: string[];
    chapters: number;
}[]> => {
    const cacheKey = getCacheKey('/hero');
    const cached = getCachedData(cacheKey);
    if (cached) return cached as {
        id: string;
        title: string;
        description: string;
        image: string;
        genres: string[];
        chapters: number;
    }[];
    // Also check localStorage for a stale-but-usable fallback
    try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('heroCache') : null;
        if (raw) {
            const parsed = JSON.parse(raw) as { data: HeroEntry[]; ts: number };
            // Accept up to 24h old as a last-resort fallback
            if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000 && Array.isArray(parsed.data)) {
                setCachedData(cacheKey, parsed.data);
                return parsed.data;
            }
        }
    } catch (e) {
        // ignore parse or access errors
    }

    // Small retry with backoff
    const tryFetch = async (attempt = 1): Promise<HeroEntry[]> => {
        try {
            const response = await apiClient.get('/hero');
            setCachedData(cacheKey, response.data as HeroEntry[]);
            try {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('heroCache', JSON.stringify({ data: response.data as HeroEntry[], ts: Date.now() }));
                }
            } catch (e) {
                // ignore storage errors
            }
            return response.data as HeroEntry[];
        } catch (err) {
            if (attempt < 2) {
                await new Promise(r => setTimeout(r, 500 * attempt));
                return tryFetch(attempt + 1);
            }
            // On final failure, attempt to return any localStorage data even if older
            try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('heroCache') : null;
                if (raw) {
                    const parsed = JSON.parse(raw) as { data: HeroEntry[] };
                    if (Array.isArray(parsed.data)) return parsed.data;
                }
            } catch (e) {
                // ignore
            }
            throw err;
        }
    };
    return tryFetch();
};