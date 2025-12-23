import apiClient from './apiClient';
import { EnhancedTrendingManga, EnhancedRecommendation } from '../types';

/**
 * Hybrid API Client
 * Combines MangaDex (reading) with AniList (metadata, recommendations, reviews)
 */

// Types for hybrid search results
export interface HybridSearchResult {
  manga: {
    id: string;
    attributes: {
      title: { [lang: string]: string };
      description: { [lang: string]: string };
    };
  };
  anilist: {
    id: number;
    averageScore: number | null;
    popularity: number | null;
  } | null;
}

// Cache for hybrid API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (longer than regular API cache)

const getCacheKey = (endpoint: string, params?: Record<string, unknown>) => {
  return `hybrid:${endpoint}${params ? JSON.stringify(params) : ''}`;
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

/**
 * Get enhanced manga details (MangaDex + AniList combined)
 */
export const getEnhancedMangaDetails = async (mangadexId: string) => {
  const cacheKey = getCacheKey(`/manga/${mangadexId}`);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const response = await apiClient.get(`/hybrid/manga/${mangadexId}`);
  setCachedData(cacheKey, response.data);
  return response.data;
};

/**
 * Get complete enhanced manga info (with chapters and AniList data)
 */
export const getCompleteEnhancedMangaInfo = async (mangadexId: string) => {
  const cacheKey = getCacheKey(`/manga/${mangadexId}/complete`);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const response = await apiClient.get(`/hybrid/manga/${mangadexId}/complete`);
  setCachedData(cacheKey, response.data);
  return response.data;
};

/**
 * Get trending manga from AniList with MangaDex reading links
 */
export const getEnhancedTrendingManga = async (limit: number = 20): Promise<EnhancedTrendingManga[]> => {
  const cacheKey = getCacheKey('/trending', { limit });
  const cached = getCachedData(cacheKey);
  if (cached) return cached as EnhancedTrendingManga[];

  const response = await apiClient.get<EnhancedTrendingManga[]>('/hybrid/trending', {
    params: { limit }
  });
  setCachedData(cacheKey, response.data);
  return response.data;
};

/**
 * Get recommendations for a manga (from AniList with MangaDex links)
 */
export const getEnhancedRecommendations = async (mangadexId: string): Promise<EnhancedRecommendation[]> => {
  const cacheKey = getCacheKey(`/manga/${mangadexId}/recommendations`);
  const cached = getCachedData(cacheKey);
  if (cached) return cached as EnhancedRecommendation[];

  const response = await apiClient.get<EnhancedRecommendation[]>(`/hybrid/manga/${mangadexId}/recommendations`);
  setCachedData(cacheKey, response.data);
  return response.data;
};

/**
 * Hybrid search (combines MangaDex and AniList results)
 */
export const hybridSearch = async (query: string, limit: number = 20): Promise<HybridSearchResult[]> => {
  const cacheKey = getCacheKey('/search', { query, limit });
  const cached = getCachedData(cacheKey);
  if (cached) return cached as HybridSearchResult[];

  const response = await apiClient.get<HybridSearchResult[]>('/hybrid/search', {
    params: { q: query, limit }
  });
  setCachedData(cacheKey, response.data);
  return response.data;
};

/**
 * Get reviews for a manga from AniList
 */
export const getMangaReviews = async (anilistId: number, page: number = 1, perPage: number = 10) => {
  const cacheKey = getCacheKey(`/manga/${anilistId}/reviews`, { page, perPage });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const response = await apiClient.get(`/hybrid/manga/${anilistId}/reviews`, {
    params: { page, perPage }
  });
  setCachedData(cacheKey, response.data);
  return response.data;
};

/**
 * Get popular manga from AniList
 */
export const getAniListPopular = async (page: number = 1, perPage: number = 20) => {
  const cacheKey = getCacheKey('/popular', { page, perPage });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const response = await apiClient.get('/hybrid/popular', {
    params: { page, perPage }
  });
  setCachedData(cacheKey, response.data);
  return response.data;
};

/**
 * Get trending from AniList (direct)
 */
export const getAniListTrending = async (page: number = 1, perPage: number = 20) => {
  const cacheKey = getCacheKey('/anilist/trending', { page, perPage });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const response = await apiClient.get('/hybrid/anilist/trending', {
    params: { page, perPage }
  });
  setCachedData(cacheKey, response.data);
  return response.data;
};

/**
 * Clear cache
 */
export const clearHybridCache = (key?: string) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};
