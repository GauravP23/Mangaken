import { Manga, MangaDexResponse, Chapter, AtHomeServerResponse } from '../types';
import apiClient from './apiClient';

// Search manga by title
export const searchManga = async (title: string, limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/search', { params: { title, limit, offset } });
    return response.data.data;
};

// Get latest updated manga
export const getLatestManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    // Use the generic /manga endpoint with order[latestUploadedChapter]=desc for latest updates
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
        params: {
            limit,
            offset,
            'includes[]': ['cover_art', 'author', 'artist'],
            'order[latestUploadedChapter]': 'desc',
        }
    });
    return response.data.data;
};

// Get most popular manga
export const getPopularManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    // Use the generic /manga endpoint with order[followedCount] or order[relevance] as a fallback for popularity
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
        params: {
            limit,
            offset,
            'includes[]': ['cover_art', 'author', 'artist'],
            'order[followedCount]': 'desc', // Sort by most followed (proxy for popularity)
        }
    });
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