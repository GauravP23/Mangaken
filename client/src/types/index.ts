// filepath: src/types/index.ts
export interface Tag {
    id: string;
    type: string;
    attributes: {
        name: { [lang: string]: string };
        group?: string;
    };
}

export interface Relationship {
    id: string;
    type: string;
    attributes?: any;
}

export interface Manga {
    id: string;
    attributes: {
        title: { [lang: string]: string };
        description: { [lang: string]: string };
        tags: Tag[];
        status?: string;
        year?: number;
    };
    relationships: Relationship[];
}

export interface Chapter {
    id: string;
    attributes: {
        chapter?: string;
        title?: string;
        volume?: string;
        translatedLanguage?: string;
    };
}

export interface MangaDexResponse<T> {
    data: T[];
}

export interface AtHomeServerResponse {
    baseUrl: string;
    chapter: {
        hash: string;
        data: string[];
    };
}

// Extended Manga type for UI/complete info
export interface UIManga {
    id: string;
    title: string;
    description: string;
    image: string;
    genres: string[];
    rating: number;
    status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | string;
    chapters: number;
    views: number;
    author: string;
    lastUpdate?: string;
    type?: string;
    follows?: number;
    totalChapters?: number;
    coverImage?: string;
    originalTitle?: { [lang: string]: string };
    // Additional metadata
    year?: number | null;
    contentRating?: string;
    demographic?: string;
    japaneseTitle?: string;
}

// Hybrid API Types (AniList + MangaDex combined)
export interface EnhancedTrendingManga {
    mangadexId: string;
    anilistId: number;
    title: string;
    coverImage: string;
    averageScore: number | null;
    popularity: number | null;
    trending: number | null;
    genres: string[];
    status: string;
    format: string;
}

export interface EnhancedRecommendation {
    mangadexId: string;
    anilistId: number;
    title: string;
    coverImage: string;
    averageScore: number | null;
    popularity: number | null;
    genres: string[];
    rating: number;
}