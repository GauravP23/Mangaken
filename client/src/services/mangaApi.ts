import { Manga, MangaDexResponse, Chapter, AtHomeServerResponse } from '../types';
import apiClient from './apiClient';

// Search manga by title
export const searchManga = async (title: string, limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/search', { params: { title, limit, offset } });
    return response.data.data;
};

// Get latest updated manga
export const getLatestManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/latest', { params: { limit, offset } });
    return response.data.data;
};

// Get most popular manga
export const getPopularManga = async (limit: number = 20, offset: number = 0): Promise<Manga[]> => {
    const response = await apiClient.get<MangaDexResponse<Manga>>('/manga/popular', { params: { limit, offset } });
    return response.data.data;
};

// Get manga details by ID
export const getMangaDetails = async (mangaId: string): Promise<Manga> => {
    const response = await apiClient.get<{ data: Manga }>(`/manga/${mangaId}`);
    return response.data.data;
};

// Get chapter feed for a manga
export const getMangaFeed = async (mangaId: string): Promise<Chapter[]> => {
    const response = await apiClient.get<MangaDexResponse<Chapter>>(`/manga/${mangaId}/feed`);
    return response.data.data;
};

// Get pages for a chapter
export const getChapterPages = async (chapterId: string): Promise<AtHomeServerResponse> => {
    const response = await apiClient.get<AtHomeServerResponse>(`/chapter/${chapterId}/pages`);
    return response.data;
};