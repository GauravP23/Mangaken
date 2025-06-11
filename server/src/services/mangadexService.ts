import axios from 'axios';
import { MangaDexResponse, MangaDexSingleResponse, Manga, ChapterFeedResponse, AtHomeServerResponse } from '../types/mangadex';

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

export const searchManga = async (title: string, limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
    try {
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
        const response = await apiClient.get<AtHomeServerResponse>(`/at-home/server/${chapterId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching chapter pages for ID ${chapterId}:`, error);
        throw error;
    }
};

export const listManga = async (query: any): Promise<MangaDexResponse<Manga>> => {
    try {
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