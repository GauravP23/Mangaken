import axios from 'axios';
import { MangaDexResponse, MangaDexSingleResponse, Manga, ChapterFeedResponse, AtHomeServerResponse } from '../types/mangadex';

const MANGADEX_API_BASE_URL = process.env.MANGADEX_API_BASE_URL;

if (!MANGADEX_API_BASE_URL) {
    console.error("MANGADEX_API_BASE_URL is not defined in .env");
    process.exit(1);
}

// ─── Queue-based rate limiter (4 req/sec, never blocks the event loop) ────────
const RATE_LIMIT_INTERVAL_MS = 250; // 4 req/sec = 1 req every 250ms
let lastCallTime = 0;
let pendingQueue: Array<() => void> = [];
let isProcessing = false;

function processQueue() {
    if (isProcessing || pendingQueue.length === 0) return;
    isProcessing = true;

    const now = Date.now();
    const wait = Math.max(0, RATE_LIMIT_INTERVAL_MS - (now - lastCallTime));

    setTimeout(() => {
        lastCallTime = Date.now();
        const next = pendingQueue.shift();
        if (next) next();
        isProcessing = false;
        processQueue(); // process next item in queue
    }, wait);
}

function rateLimit(): Promise<void> {
    return new Promise((resolve) => {
        pendingQueue.push(resolve);
        processQueue();
    });
}
// ──────────────────────────────────────────────────────────────────────────────

const apiClient = axios.create({
    baseURL: MANGADEX_API_BASE_URL,
    timeout: 12000,
    headers: {
        'User-Agent': 'MangaKen/1.0 (https://github.com/GauravP23/Mangaken)',
        'Accept': 'application/json'
    }
});

// ─── Retry interceptor: exponential backoff on 429 / 503 ─────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config as any;
        if (!config) return Promise.reject(error);

        const status = error.response?.status;
        const isRetryable = status === 429 || status === 503 || error.code === 'ECONNABORTED';

        if (isRetryable) {
            config._retryCount = (config._retryCount ?? 0) + 1;
            if (config._retryCount <= 3) {
                // Exponential backoff: 500ms, 1s, 2s
                const backoff = 500 * Math.pow(2, config._retryCount - 1);
                console.warn(`[MangaDex] ${status} — retry ${config._retryCount}/3 in ${backoff}ms for ${config.url}`);
                await new Promise((r) => setTimeout(r, backoff));
                return apiClient(config);
            }
        }
        return Promise.reject(error);
    }
);
// ──────────────────────────────────────────────────────────────────────────────

export const searchManga = async (title: string, limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
    try {
        await rateLimit();
        const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
            params: {
                title,
                limit,
                offset,
                "includes[]": ["cover_art", "author", "artist"],
                "order[relevance]": "desc"
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
        await rateLimit();
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
    translatedLanguage: string[] = ['en'],
    limit: number = 100,
    offset: number = 0
): Promise<ChapterFeedResponse> => {
    try {
        await rateLimit();
        const orderParams: { [key: string]: 'asc' | 'desc' } = {};
        orderParams['volume'] = 'asc';
        orderParams['chapter'] = 'asc';

        const response = await apiClient.get<ChapterFeedResponse>(`/manga/${mangaId}/feed`, {
            params: {
                "translatedLanguage[]": translatedLanguage,
                limit,
                offset,
                "includes[]": ["scanlation_group"],
                order: orderParams
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching manga feed for ID ${mangaId}:`, error);
        throw error;
    }
};

export const getChapterPages = async (chapterId: string): Promise<AtHomeServerResponse> => {
    try {
        await rateLimit();
        const response = await apiClient.get<AtHomeServerResponse>(`/at-home/server/${chapterId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching chapter pages for ID ${chapterId}:`, error);
        throw error;
    }
};

export const listManga = async (query: any): Promise<MangaDexResponse<Manga>> => {
    try {
        await rateLimit();
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
 * Bulk fetch manga by IDs — uses a single API call instead of N searches.
 * MangaDex supports up to 100 IDs per request via ids[].
 */
export const getMangaByIds = async (ids: string[]): Promise<MangaDexResponse<Manga>> => {
    if (!ids || ids.length === 0) return { data: [], total: 0, limit: 0, offset: 0, result: 'ok' } as any;
    try {
        await rateLimit();
        const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
            params: {
                "ids[]": ids,
                "includes[]": ["cover_art", "author", "artist"],
                limit: Math.min(ids.length, 100),
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching manga by IDs:', error);
        throw error;
    }
};

/**
 * Fetches and combines all relevant manga info: details, statistics, and chapters.
 */
export const getCompleteMangaInfo = async (mangaId: string, languages: string[] = ['en']) => {
    try {
        const detailsRes = await getMangaDetails(mangaId);
        const manga = detailsRes.data;

        let rating = null, follows = null;
        try {
            const statsRes = await axios.get(`${MANGADEX_API_BASE_URL}/statistics/manga/${mangaId}`, { timeout: 8000 });
            if (statsRes.data?.statistics?.[mangaId]) {
                const ratingObj = statsRes.data.statistics[mangaId].rating;
                rating = typeof ratingObj === 'object' ? (ratingObj.bayesian ?? ratingObj.average ?? 0) : ratingObj ?? 0;
                follows = statsRes.data.statistics[mangaId].follows;
            }
        } catch (e) {
            // fallback: leave as null
        }

        let allChapters = [] as any[];
        let offset = 0;
        const limit = 500;
        let total = 1;
        while (allChapters.length < total) {
            const feedRes = await getMangaFeed(mangaId, languages, limit, offset);
            if (feedRes?.data) {
                allChapters.push(...feedRes.data);
                total = feedRes.total || allChapters.length;
                offset += limit;
            } else {
                break;
            }
        }

        let author = '';
        const authorRel = (manga.relationships || []).find(rel => rel.type === 'author');
        if (authorRel?.attributes?.name) {
            author = authorRel.attributes.name;
        }

        const genres = (manga.attributes.tags || []).map((tag: any) =>
            tag.attributes.name.en || Object.values(tag.attributes.name)[0] || ''
        );

        let coverFileName = '';
        const coverRel = (manga.relationships || []).find((rel: any) => rel.type === 'cover_art');
        if (coverRel?.attributes?.fileName) {
            coverFileName = coverRel.attributes.fileName;
        }
        const coverImage = coverFileName
            ? `/api/manga/cover/${manga.id}/${encodeURIComponent(coverFileName)}?size=256`
            : '';

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
        await rateLimit();
        const response = await apiClient.get(`/statistics/manga/${mangaId}`);
        if (response.data?.statistics?.[mangaId]) {
            const stats = response.data.statistics[mangaId];
            return {
                rating: typeof stats.rating === 'object'
                    ? (stats.rating.bayesian ?? stats.rating.average ?? 0)
                    : stats.rating ?? 0,
                follows: stats.follows ?? 0
            };
        }
        return { rating: 0, follows: 0 };
    } catch (error) {
        console.error(`Error fetching manga statistics for ID ${mangaId}:`, error);
        return { rating: 0, follows: 0 };
    }
};

export const getMangaStatisticsBatch = async (ids: string[]) => {
    if (!ids || ids.length === 0) {
        return {} as Record<string, { rating: number; follows: number }>;
    }
    try {
        await rateLimit();
        const params: Record<string, string[]> = {};
        params['manga[]'] = ids;
        const response = await apiClient.get(`/statistics/manga`, { params });
        const result: Record<string, { rating: number; follows: number }> = {};
        if (response.data?.statistics) {
            for (const [id, stats] of Object.entries<Record<string, number | { bayesian?: number; average?: number }>>(response.data.statistics)) {
                const statsTyped = stats as { rating?: number | { bayesian?: number; average?: number }; follows?: number };
                result[id] = {
                    rating: typeof statsTyped.rating === 'object'
                        ? (statsTyped.rating.bayesian ?? statsTyped.rating.average ?? 0)
                        : (statsTyped.rating ?? 0),
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

export const getCompletedManga = async (limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
    try {
        await rateLimit();
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

export const getTrendingManga = async (limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
    try {
        await rateLimit();
        const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
            params: {
                limit,
                offset,
                "includes[]": ["cover_art", "author", "artist"],
                "order[updatedAt]": "desc",
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

export const getMostViewedManga = async (limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
    try {
        await rateLimit();
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

export const getLatestManga = async (limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
    try {
        await rateLimit();
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

// MangaDex tag IDs for common genres
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
    'Josei': 'josei-tag-id',
    'Mecha': '0a39b5a1-b235-4886-a747-1d05d216532d',
    'Music': '77a50f30-7f3b-4e47-a0b9-36d8b7e0f0d5',
    'Harem': 'aafb99c1-7f60-43fa-b75f-fc9502ce29c7',
    'Ecchi': 'b29d6a3d-1569-4e7a-8caf-7557bc92cd5d',
    'Gore': 'b29d6a3d-1569-4e7a-8caf-7557bc92cd5d',
};

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
    status?: string;
    demographic?: string;
    year?: number;
    yearFrom?: number;
    yearTo?: number;
    sortBy?: string;
    contentRating?: string[];
    limit?: number;
    offset?: number;
}

export const advancedSearchManga = async (params: AdvancedSearchParams): Promise<MangaDexResponse<Manga>> => {
    try {
        await rateLimit();

        const queryParams: Record<string, unknown> = {
            limit: params.limit || 20,
            offset: params.offset || 0,
            "includes[]": ["cover_art", "author", "artist"],
            "contentRating[]": params.contentRating || ["safe", "suggestive"],
            "availableTranslatedLanguage[]": "en",
            "hasAvailableChapters": true,
        };

        if (params.query) queryParams.title = params.query;

        if (params.genres && params.genres.length > 0) {
            const tagIds = params.genres.map(g => GENRE_TAG_IDS[g]).filter(Boolean);
            if (tagIds.length > 0) queryParams["includedTags[]"] = tagIds;
        }

        if (params.excludedGenres && params.excludedGenres.length > 0) {
            const excludedTagIds = params.excludedGenres.map(g => GENRE_TAG_IDS[g]).filter(Boolean);
            if (excludedTagIds.length > 0) queryParams["excludedTags[]"] = excludedTagIds;
        }

        if (params.status && params.status !== 'all') queryParams["status[]"] = params.status;
        if (params.demographic && params.demographic !== 'all') queryParams["publicationDemographic[]"] = params.demographic;
        if (params.year) queryParams.year = params.year;

        if (params.sortBy && SORT_OPTIONS[params.sortBy]) {
            Object.assign(queryParams, SORT_OPTIONS[params.sortBy]);
        } else {
            queryParams["order[followedCount]"] = "desc";
        }

        const response = await apiClient.get<MangaDexResponse<Manga>>('/manga', { params: queryParams });
        return response.data;
    } catch (error) {
        console.error('Error in advanced search:', error);
        throw error;
    }
};

export const getMangaTags = async () => {
    try {
        await rateLimit();
        const response = await apiClient.get('/manga/tag');
        return response.data;
    } catch (error) {
        console.error('Error fetching manga tags:', error);
        throw error;
    }
};

export interface FormattedRelatedManga {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    rating: number;
    follows: number;
    status: string;
    genres: string[];
    year?: number | null;
    relation?: string;
    relationType?: string;
}

export interface RelatedMangaResult {
    franchise: FormattedRelatedManga[];
    recommendations: FormattedRelatedManga[];
}

export const getRelatedManga = async (mangaId: string): Promise<RelatedMangaResult> => {
    try {
        const mangaDetails = await getMangaDetails(mangaId);
        const manga = mangaDetails.data;
        if (!manga) return { franchise: [], recommendations: [] };

        const RELATION_LABELS: Record<string, string> = {
            main_story: 'Main Story',
            adapted_from: 'Adapted From',
            based_on: 'Based On',
            prequel: 'Prequel',
            sequel: 'Sequel',
            side_story: 'Side Story',
            spin_off: 'Spin-off',
            alternate_story: 'Alternate Story',
            alternate_version: 'Alternate Version',
            colored: 'Colored Edition',
            preserialization: 'Pre-serialization',
            serialization: 'Serialization',
            doujinshi: 'Doujinshi'
        };

        const mangaRels = (manga.relationships || []).filter((r: any) => r.type === 'manga' && r.id !== mangaId);
        const officialRels = mangaRels.filter((r: any) => r.related && r.related !== 'doujinshi');
        const candidateRels = officialRels.length > 0 ? officialRels : mangaRels.slice(0, 8);

        const franchiseMap = new Map<string, { type: string; label: string }>();
        for (const rel of candidateRels.slice(0, 10)) {
            const relType = rel.related || 'related';
            franchiseMap.set(rel.id, {
                type: relType,
                label: RELATION_LABELS[relType] || relType.replace(/_/g, ' ')
            });
        }

        const franchiseIds = Array.from(franchiseMap.keys());
        let franchiseMangaList: Manga[] = [];
        if (franchiseIds.length > 0) {
            try {
                const franchiseRes = await getMangaByIds(franchiseIds);
                franchiseMangaList = franchiseRes.data || [];
            } catch (err) {
                console.error('Error fetching franchise relations:', err);
            }
        }

        const tagIds = (manga.attributes.tags || [])
            .map((t: any) => t.id)
            .filter(Boolean);

        let recMangaList: Manga[] = [];
        if (tagIds.length > 0) {
            try {
                await rateLimit();
                const queryTags = tagIds.slice(0, 2);
                const recRes = await apiClient.get<MangaDexResponse<Manga>>('/manga', {
                    params: {
                        limit: 16,
                        "includedTags[]": queryTags,
                        "includes[]": ["cover_art", "author", "artist"],
                        "order[followedCount]": "desc",
                        "contentRating[]": ["safe", "suggestive"],
                        "availableTranslatedLanguage[]": "en"
                    }
                });
                const excludedIds = new Set([mangaId, ...franchiseIds]);
                recMangaList = (recRes.data.data || [])
                    .filter(m => !excludedIds.has(m.id))
                    .slice(0, 12);
            } catch (err) {
                console.error('Error fetching genre recommendations:', err);
            }
        }

        if (recMangaList.length < 4) {
            try {
                const popularRes = await getTrendingManga(12, 0);
                const excludedIds = new Set([mangaId, ...franchiseIds, ...recMangaList.map(m => m.id)]);
                const filler = (popularRes.data || []).filter(m => !excludedIds.has(m.id));
                recMangaList = [...recMangaList, ...filler].slice(0, 12);
            } catch {
                // ignore
            }
        }

        const allTargetIds = [...franchiseMangaList.map(m => m.id), ...recMangaList.map(m => m.id)];
        let statsMap: Record<string, { rating: number; follows: number }> = {};
        if (allTargetIds.length > 0) {
            try {
                statsMap = await getMangaStatisticsBatch(allTargetIds);
            } catch (err) {
                console.error('Error fetching stats for related manga:', err);
            }
        }

        const formatItem = (m: Manga, relation?: { type: string; label: string }): FormattedRelatedManga => {
            let coverFileName = '';
            const coverRel = (m.relationships || []).find((rel: any) => rel.type === 'cover_art');
            if (coverRel?.attributes?.fileName) {
                coverFileName = coverRel.attributes.fileName;
            }
            const coverImage = coverFileName
                ? `/api/manga/cover/${m.id}/${encodeURIComponent(coverFileName)}?size=256`
                : '';

            const genres = (m.attributes.tags || []).map((tag: any) =>
                tag.attributes.name.en || Object.values(tag.attributes.name)[0] || ''
            );

            const st = statsMap[m.id];

            return {
                id: m.id,
                title: (m.attributes.title as any)?.en || Object.values(m.attributes.title)[0] || 'No Title',
                description: (m.attributes.description as any)?.en || Object.values(m.attributes.description)[0] || '',
                coverImage,
                rating: st?.rating ?? 0,
                follows: st?.follows ?? 0,
                status: m.attributes.status || 'ongoing',
                genres,
                year: m.attributes.year,
                relation: relation?.label,
                relationType: relation?.type,
            };
        };

        const franchise = franchiseMangaList.map(m => formatItem(m, franchiseMap.get(m.id)));
        const recommendations = recMangaList.map(m => formatItem(m));

        return { franchise, recommendations };
    } catch (error) {
        console.error(`Error in getRelatedManga for ${mangaId}:`, error);
        return { franchise: [], recommendations: [] };
    }
};