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

// Search manga by title
export const searchManga = async (title: string, limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/search', { params: { title, limit, offset } });
    return response.data.data;
};

// Get latest updated manga
export const getLatestManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const cacheKey = getCacheKey('/manga/latest', { limit, offset });
    const cached = getCachedData(cacheKey);
    if (cached) return cached as Manga[];

    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
        params: {
            limit,
            offset,
            'includes[]': ['cover_art', 'author', 'artist'],
            'order[latestUploadedChapter]': 'desc',
        }
    });
    
    setCachedData(cacheKey, response.data.data);
    return response.data.data;
};

// Get most popular manga
export const getPopularManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const cacheKey = getCacheKey('/manga/popular', { limit, offset });
    const cached = getCachedData(cacheKey);
    if (cached) return cached as Manga[];

    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
        params: {
            limit,
            offset,
            'includes[]': ['cover_art', 'author', 'artist'],
            'order[followedCount]': 'desc', // Sort by most followed (proxy for popularity)
        }
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

    const response = await apiClient.get('/hero');
    setCachedData(cacheKey, response.data);
    return response.data;
};