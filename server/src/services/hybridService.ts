import * as mangadexService from './mangadexService';
import * as anilistService from './anilistService';

/**
 * Hybrid Manga Service
 * Combines MangaDex (for reading) with AniList (for metadata, recommendations, reviews)
 *
 * Strategy:
 * 1. Use MangaDex as primary source for manga data and chapters
 * 2. Use AniList for enhanced metadata, recommendations, and reviews
 * 3. Match manga between services by title
 * 4. Cache aggressively to minimize API calls
 */

interface HybridManga {
    mangadex: {
        id: string;
        title: string;
        description: string;
        coverImage: string;
        author: string;
        status: string;
        genres: string[];
        year: number | null;
        chapters?: any[];
        totalChapters?: number;
    };
    anilist: {
        id: number | null;
        averageScore: number | null;
        meanScore: number | null;
        popularity: number | null;
        favourites: number | null;
        trending: number | null;
        rankings: any[] | null;
        recommendations: any[] | null;
        reviews: any[] | null;
        tags: any[] | null;
        characters: any[] | null;
        relations: any[] | null;
        bannerImage: string | null;
    } | null;
    enhancedRating: number;
    enhancedPopularity: number;
}

// ─── Cache stores ────────────────────────────────────────────────────────────
const titleMappingCache = new Map<string, number | null>();

const hybridCache = new Map<string, { data: any; timestamp: number }>();
const HYBRID_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const recCache = new Map<string, { data: any; timestamp: number }>();
const REC_CACHE_TTL = 20 * 60 * 1000; // 20 minutes

function getHybridCached(key: string) {
    const entry = hybridCache.get(key);
    if (entry && Date.now() - entry.timestamp < HYBRID_CACHE_TTL) return entry.data;
    return null;
}

function setHybridCache(key: string, data: any) {
    hybridCache.set(key, { data, timestamp: Date.now() });
}

function getRecCached(key: string) {
    const entry = recCache.get(key);
    if (entry && Date.now() - entry.timestamp < REC_CACHE_TTL) return entry.data;
    return null;
}

function setRecCache(key: string, data: any) {
    recCache.set(key, { data, timestamp: Date.now() });
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get enhanced manga data combining MangaDex and AniList
 */
export const getEnhancedMangaDetails = async (mangadexId: string): Promise<HybridManga> => {
    const cacheKey = `enhanced:${mangadexId}`;
    const cached = getHybridCached(cacheKey);
    if (cached) return cached as HybridManga;

    try {
        const mangadexData = await mangadexService.getMangaDetails(mangadexId);
        const manga = mangadexData.data;

        const title = (manga.attributes.title as any)?.en || Object.values(manga.attributes.title)[0] || 'No Title';
        const description = (manga.attributes.description as any)?.en || Object.values(manga.attributes.description)[0] || '';

        let author = '';
        const authorRel = (manga.relationships || []).find(rel => rel.type === 'author');
        if (authorRel?.attributes?.name) author = authorRel.attributes.name;

        const genres = (manga.attributes.tags || []).map((tag: any) =>
            tag.attributes.name.en || Object.values(tag.attributes.name)[0] || ''
        );

        let coverFileName = '';
        const coverRel = (manga.relationships || []).find((rel: any) => rel.type === 'cover_art');
        if (coverRel?.attributes?.fileName) coverFileName = coverRel.attributes.fileName;
        const coverImage = coverFileName
            ? `/api/manga/cover/${manga.id}/${encodeURIComponent(coverFileName)}?size=256`
            : '';

        const hybridManga: HybridManga = {
            mangadex: { id: manga.id, title, description, coverImage, author, status: manga.attributes.status, genres, year: manga.attributes.year },
            anilist: null,
            enhancedRating: 0,
            enhancedPopularity: 0,
        };

        // Try AniList enrichment (non-blocking)
        try {
            let anilistId: number | null = titleMappingCache.get(mangadexId) ?? null;
            if (anilistId === null && !titleMappingCache.has(mangadexId)) {
                const anilistMatch = await anilistService.matchMangaByTitle(title);
                anilistId = anilistMatch?.id ?? null;
                titleMappingCache.set(mangadexId, anilistId);
            }

            if (anilistId) {
                const anilistData = await anilistService.getAniListMangaById(anilistId);
                hybridManga.anilist = {
                    id: anilistData.id,
                    averageScore: anilistData.averageScore || null,
                    meanScore: anilistData.meanScore || null,
                    popularity: anilistData.popularity || null,
                    favourites: anilistData.favourites || null,
                    trending: anilistData.trending || null,
                    rankings: anilistData.rankings || null,
                    recommendations: anilistData.recommendations?.edges || null,
                    reviews: anilistData.reviews?.edges || null,
                    tags: anilistData.tags || null,
                    characters: anilistData.characters?.edges || null,
                    relations: anilistData.relations?.edges || null,
                    bannerImage: anilistData.bannerImage || null,
                };
                hybridManga.enhancedRating = anilistData.averageScore || 0;
                hybridManga.enhancedPopularity = anilistData.popularity || 0;
            }
        } catch (error) {
            console.warn('[Hybrid] Could not fetch AniList data for', title);
        }

        // MangaDex stats as fallback for rating
        try {
            const stats = await mangadexService.getMangaStatistics(mangadexId);
            if (!hybridManga.enhancedRating) hybridManga.enhancedRating = stats.rating || 0;
            if (!hybridManga.enhancedPopularity) hybridManga.enhancedPopularity = stats.follows || 0;
        } catch (error) {
            console.warn('[Hybrid] Could not fetch MangaDex stats for', mangadexId);
        }

        setHybridCache(cacheKey, hybridManga);
        return hybridManga;
    } catch (error) {
        console.error('Error getting enhanced manga details:', error);
        throw error;
    }
};

/**
 * Get complete manga info with chapters and AniList data
 */
export const getCompleteEnhancedMangaInfo = async (mangadexId: string) => {
    const cacheKey = `complete:${mangadexId}`;
    const cached = getHybridCached(cacheKey);
    if (cached) return cached;

    try {
        const completeInfo = await mangadexService.getCompleteMangaInfo(mangadexId);

        let anilistData = null;
        try {
            let anilistId: number | null = titleMappingCache.get(mangadexId) ?? null;
            if (anilistId === null && !titleMappingCache.has(mangadexId)) {
                const anilistMatch = await anilistService.matchMangaByTitle(completeInfo.title);
                anilistId = anilistMatch?.id ?? null;
                titleMappingCache.set(mangadexId, anilistId);
            }
            if (anilistId) {
                anilistData = await anilistService.getAniListMangaById(anilistId);
            }
        } catch (error) {
            console.warn('[Hybrid] Could not fetch AniList data:', error);
        }

        const result = {
            ...completeInfo,
            anilist: anilistData ? {
                id: anilistData.id,
                averageScore: anilistData.averageScore,
                popularity: anilistData.popularity,
                favourites: anilistData.favourites,
                recommendations: anilistData.recommendations?.edges || [],
                reviews: anilistData.reviews?.edges || [],
                tags: anilistData.tags || [],
                rankings: anilistData.rankings || [],
                bannerImage: anilistData.bannerImage,
            } : null,
        };

        setHybridCache(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error getting complete enhanced manga info:', error);
        throw error;
    }
};

/**
 * Get trending manga — OPTIMISED.
 * Strategy: Fetch trending titles from AniList (1 call), then do ONE bulk MangaDex
 * search using the top titles instead of N individual searches.
 */
export const getEnhancedTrendingManga = async (limit: number = 20) => {
    const cacheKey = `trending:${limit}`;
    const cached = getHybridCached(cacheKey);
    if (cached) return cached;

    try {
        // 1. Get trending from AniList (1 GraphQL call)
        const anilistTrending = await anilistService.getTrendingManga(1, limit);
        const anilistMedia: any[] = anilistTrending.media || [];

        if (anilistMedia.length === 0) {
            return [];
        }

        // 2. Build a title → anilist entry map for fast lookup
        const anilistByTitle = new Map<string, any>();
        for (const m of anilistMedia) {
            const engTitle = (m.title.english || m.title.romaji || '').toLowerCase();
            const romTitle = (m.title.romaji || '').toLowerCase();
            if (engTitle) anilistByTitle.set(engTitle, m);
            if (romTitle) anilistByTitle.set(romTitle, m);
        }

        // 3. Search MangaDex for each AniList title — batched in parallel groups of 4
        //    to stay well within the rate limit without blocking the queue
        const results: any[] = [];
        const BATCH_SIZE = 4;

        for (let i = 0; i < anilistMedia.length; i += BATCH_SIZE) {
            const batch = anilistMedia.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.allSettled(
                batch.map(async (anilistManga) => {
                    try {
                        const englishTitle = anilistManga.title.english || anilistManga.title.romaji;
                        if (!englishTitle) return null;

                        const mangadexResults = await mangadexService.searchManga(englishTitle, 1, 0);
                        if (mangadexResults.data && mangadexResults.data.length > 0) {
                            const mangadexManga = mangadexResults.data[0];
                            return {
                                mangadexId: mangadexManga.id,
                                anilistId: anilistManga.id,
                                title: englishTitle,
                                coverImage: anilistManga.coverImage?.large || anilistManga.coverImage?.extraLarge || '',
                                averageScore: anilistManga.averageScore,
                                popularity: anilistManga.popularity,
                                trending: anilistManga.trending,
                                genres: anilistManga.genres,
                                status: anilistManga.status,
                                format: anilistManga.format,
                            };
                        }
                        return null;
                    } catch {
                        return null;
                    }
                })
            );

            for (const r of batchResults) {
                if (r.status === 'fulfilled' && r.value !== null) {
                    results.push(r.value);
                }
            }
        }

        setHybridCache(cacheKey, results);
        return results;
    } catch (error) {
        console.error('Error getting enhanced trending manga:', error);
        throw error;
    }
};

/**
 * Get recommendations for a manga (from AniList) with MangaDex links
 */
export const getEnhancedRecommendations = async (mangadexId: string) => {
    const cacheKey = `rec:${mangadexId}`;
    const cached = getRecCached(cacheKey);
    if (cached) return cached;

    try {
        let anilistId: number | null = titleMappingCache.get(mangadexId) ?? null;

        if (anilistId === null && !titleMappingCache.has(mangadexId)) {
            const mangadexData = await mangadexService.getMangaDetails(mangadexId);
            const title = (mangadexData.data.attributes.title as any)?.en ||
                Object.values(mangadexData.data.attributes.title)[0];
            const anilistMatch = await anilistService.matchMangaByTitle(title);
            anilistId = anilistMatch?.id ?? null;
            titleMappingCache.set(mangadexId, anilistId);
        }

        if (!anilistId) {
            setRecCache(cacheKey, []);
            return [];
        }

        const recommendations = await anilistService.getRecommendations(anilistId);

        const enhanced = await Promise.allSettled(
            recommendations.edges.slice(0, 10).map(async (edge: any) => {
                try {
                    const recManga = edge.node.mediaRecommendation;
                    const title = recManga.title.english || recManga.title.romaji;
                    const mangadexResults = await mangadexService.searchManga(title, 1, 0);
                    if (mangadexResults.data && mangadexResults.data.length > 0) {
                        return {
                            mangadexId: mangadexResults.data[0].id,
                            anilistId: recManga.id,
                            title,
                            coverImage: recManga.coverImage?.large || '',
                            averageScore: recManga.averageScore,
                            popularity: recManga.popularity,
                            genres: recManga.genres,
                            rating: edge.rating,
                        };
                    }
                    return null;
                } catch {
                    return null;
                }
            })
        );

        const result = enhanced
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
            .map(r => r.value);

        setRecCache(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error getting enhanced recommendations:', error);
        return [];
    }
};

/**
 * Search with both APIs and merge results intelligently
 */
export const hybridSearch = async (query: string, limit: number = 20) => {
    try {
        // Search both APIs in parallel
        const [mangadexResults, anilistResults] = await Promise.all([
            mangadexService.searchManga(query, limit, 0),
            anilistService.searchAniListManga(query, 1, Math.min(limit, 10)),
        ]);

        // Enhance MangaDex results with AniList data where possible
        const enhanced = mangadexResults.data.map((manga: any) => {
            const title = (manga.attributes.title as any)?.en || Object.values(manga.attributes.title)[0];

            const anilistMatch = anilistResults.media?.find((am: any) => {
                const aniTitle = (am.title.english || am.title.romaji || '').toLowerCase();
                const t = (title || '').toLowerCase();
                return aniTitle === t || t.includes(aniTitle) || aniTitle.includes(t);
            });

            return { manga, anilist: anilistMatch || null };
        });

        return enhanced;
    } catch (error) {
        console.error('Error in hybrid search:', error);
        throw error;
    }
};
