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
    status: 'ongoing' | 'completed' | string;
    chapters: number;
    views: number;
    author: string;
    lastUpdate?: string;
    type?: string;
    follows?: number;
    totalChapters?: number;
    coverImage?: string; // Add coverImage to UIManga type
    originalTitle?: { [lang: string]: string }; // Store original title data for alternative displays
}