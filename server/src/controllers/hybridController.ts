import { RequestHandler } from 'express';
import * as hybridService from '../services/hybridService';
import * as anilistService from '../services/anilistService';

// ─── Controller-level response cache ─────────────────────────────────────────
const controllerCache = new Map<string, { data: any; timestamp: number }>();
const CONTROLLER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getControllerCached(key: string) {
    const entry = controllerCache.get(key);
    if (entry && Date.now() - entry.timestamp < CONTROLLER_CACHE_TTL) return entry.data;
    return null;
}

function setControllerCache(key: string, data: any) {
    controllerCache.set(key, { data, timestamp: Date.now() });
}

function setCacheHeaders(res: any, maxAgeSeconds = 900) {
    res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}, stale-while-revalidate=60`);
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get enhanced manga details combining MangaDex and AniList
 * GET /api/hybrid/manga/:id
 */
export const getEnhancedMangaDetails: RequestHandler = async (req, res, next) => {
    try {
        const mangadexId = req.params.id;
        if (!mangadexId) {
            res.status(400).json({ success: false, message: 'Manga ID is required' });
            return;
        }

        const cacheKey = `enhanced:${mangadexId}`;
        const cached = getControllerCached(cacheKey);
        if (cached) {
            setCacheHeaders(res);
            res.json(cached);
            return;
        }

        const data = await hybridService.getEnhancedMangaDetails(mangadexId);
        setControllerCache(cacheKey, data);
        setCacheHeaders(res);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

/**
 * Get complete enhanced manga info (with chapters and AniList data)
 * GET /api/hybrid/manga/:id/complete
 */
export const getCompleteEnhancedMangaInfo: RequestHandler = async (req, res, next) => {
    try {
        const mangadexId = req.params.id;
        if (!mangadexId) {
            res.status(400).json({ success: false, message: 'Manga ID is required' });
            return;
        }

        const cacheKey = `complete:${mangadexId}`;
        const cached = getControllerCached(cacheKey);
        if (cached) {
            setCacheHeaders(res, 600); // 10 min — chapters change more often
            res.json(cached);
            return;
        }

        const data = await hybridService.getCompleteEnhancedMangaInfo(mangadexId);
        setControllerCache(cacheKey, data);
        setCacheHeaders(res, 600);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

/**
 * Get trending manga from AniList with MangaDex reading links
 * GET /api/hybrid/trending
 */
export const getEnhancedTrending: RequestHandler = async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

        const cacheKey = `trending:${limit}`;
        const cached = getControllerCached(cacheKey);
        if (cached) {
            setCacheHeaders(res);
            res.json(cached);
            return;
        }

        const data = await hybridService.getEnhancedTrendingManga(limit);
        setControllerCache(cacheKey, data);
        setCacheHeaders(res);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

/**
 * Get recommendations for a manga (AniList recommendations + MangaDex links)
 * GET /api/hybrid/manga/:id/recommendations
 */
export const getEnhancedRecommendations: RequestHandler = async (req, res, next) => {
    try {
        const mangadexId = req.params.id;
        if (!mangadexId) {
            res.status(400).json({ success: false, message: 'Manga ID is required' });
            return;
        }

        const cacheKey = `rec:${mangadexId}`;
        const cached = getControllerCached(cacheKey);
        if (cached) {
            setCacheHeaders(res, 1200); // 20 min
            res.json(cached);
            return;
        }

        const data = await hybridService.getEnhancedRecommendations(mangadexId);
        setControllerCache(cacheKey, data);
        setCacheHeaders(res, 1200);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

/**
 * Search with both APIs and merge results
 * GET /api/hybrid/search
 */
export const hybridSearch: RequestHandler = async (req, res, next) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            res.status(400).json({ success: false, message: 'Search query is required' });
            return;
        }

        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

        const cacheKey = `search:${query.toLowerCase()}:${limit}`;
        const cached = getControllerCached(cacheKey);
        if (cached) {
            setCacheHeaders(res, 300); // 5 min for search
            res.json(cached);
            return;
        }

        const data = await hybridService.hybridSearch(query, limit);
        setControllerCache(cacheKey, data);
        setCacheHeaders(res, 300);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

/**
 * Get reviews for a manga from AniList
 * GET /api/hybrid/manga/:anilistId/reviews
 */
export const getMangaReviews: RequestHandler = async (req, res, next) => {
    try {
        const anilistId = parseInt(req.params.anilistId);
        if (isNaN(anilistId)) {
            res.status(400).json({ success: false, message: 'Valid AniList ID is required' });
            return;
        }

        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : 10;

        const cacheKey = `reviews:${anilistId}:${page}:${perPage}`;
        const cached = getControllerCached(cacheKey);
        if (cached) {
            setCacheHeaders(res, 1800); // 30 min — reviews don't change often
            res.json(cached);
            return;
        }

        const data = await anilistService.getMangaReviews(anilistId, page, perPage);
        setControllerCache(cacheKey, data);
        setCacheHeaders(res, 1800);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

/**
 * Get popular manga from AniList
 * GET /api/hybrid/popular
 */
export const getAniListPopular: RequestHandler = async (req, res, next) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : 20;

        const cacheKey = `popular:${page}:${perPage}`;
        const cached = getControllerCached(cacheKey);
        if (cached) {
            setCacheHeaders(res);
            res.json(cached);
            return;
        }

        const data = await anilistService.getPopularManga(page, perPage);
        setControllerCache(cacheKey, data);
        setCacheHeaders(res);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

/**
 * Get trending manga from AniList (direct)
 * GET /api/hybrid/anilist/trending
 */
export const getAniListTrending: RequestHandler = async (req, res, next) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : 20;

        const cacheKey = `anilist-trending:${page}:${perPage}`;
        const cached = getControllerCached(cacheKey);
        if (cached) {
            setCacheHeaders(res);
            res.json(cached);
            return;
        }

        const data = await anilistService.getTrendingManga(page, perPage);
        setControllerCache(cacheKey, data);
        setCacheHeaders(res);
        res.json(data);
    } catch (error) {
        next(error);
    }
};
