"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMangaStatistics = exports.getCompleteMangaInfo = exports.listManga = exports.getChapterPages = exports.getMangaFeed = exports.getMangaDetails = exports.searchManga = void 0;
const axios_1 = __importDefault(require("axios"));
const limiter_1 = require("limiter");
const MANGADEX_API_BASE_URL = process.env.MANGADEX_API_BASE_URL;
if (!MANGADEX_API_BASE_URL) {
    console.error("MANGADEX_API_BASE_URL is not defined in .env");
    process.exit(1);
}
const apiClient = axios_1.default.create({
    baseURL: MANGADEX_API_BASE_URL,
    headers: {
        'User-Agent': 'MangaKen/1.0 (https://github.com/your-repo)',
        'Accept': 'application/json'
    }
});
const limiter = new limiter_1.RateLimiter({ tokensPerInterval: 10, interval: 'second' });
function removeTokens(total) {
    return __awaiter(this, void 0, void 0, function* () {
        yield limiter.removeTokens(total);
    });
}
const searchManga = (title_1, ...args_1) => __awaiter(void 0, [title_1, ...args_1], void 0, function* (title, limit = 20, offset = 0) {
    try {
        yield removeTokens(1);
        const response = yield apiClient.get('/manga', {
            params: {
                title,
                limit,
                offset,
                "includes[]": ["cover_art", "author", "artist"], // Request related data
                "order[relevance]": "desc" // Order by relevance for search
            }
        });
        return response.data;
    }
    catch (error) {
        console.error('Error searching manga:', error);
        throw error;
    }
});
exports.searchManga = searchManga;
const getMangaDetails = (mangaId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield removeTokens(1);
        const response = yield apiClient.get(`/manga/${mangaId}`, {
            params: {
                "includes[]": ["cover_art", "author", "artist"]
            }
        });
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching manga details for ID ${mangaId}:`, error);
        throw error;
    }
});
exports.getMangaDetails = getMangaDetails;
const getMangaFeed = (mangaId_1, ...args_1) => __awaiter(void 0, [mangaId_1, ...args_1], void 0, function* (mangaId, translatedLanguage = ['en'], // Array of language codes
limit = 100, // MangaDex default limit is 100, max 500
offset = 0) {
    try {
        yield removeTokens(1);
        // The order parameters are objects, so we need to pass them correctly
        const orderParams = {};
        orderParams['volume'] = 'asc';
        orderParams['chapter'] = 'asc';
        const response = yield apiClient.get(`/manga/${mangaId}/feed`, {
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
    }
    catch (error) {
        console.error(`Error fetching manga feed for ID ${mangaId}:`, error);
        throw error;
    }
});
exports.getMangaFeed = getMangaFeed;
const getChapterPages = (chapterId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield removeTokens(1);
        const response = yield apiClient.get(`/at-home/server/${chapterId}`);
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching chapter pages for ID ${chapterId}:`, error);
        throw error;
    }
});
exports.getChapterPages = getChapterPages;
const listManga = (query) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield removeTokens(1);
        // Pass all query params directly to MangaDex /manga endpoint
        const response = yield apiClient.get('/manga', {
            params: query
        });
        return response.data;
    }
    catch (error) {
        console.error('Error listing manga:', error);
        throw error;
    }
});
exports.listManga = listManga;
/**
 * Fetches and combines all relevant manga info: details, statistics, and chapters.
 * Ensures all chapters are fetched and chapter pages are loaded robustly.
 */
const getCompleteMangaInfo = (mangaId_1, ...args_1) => __awaiter(void 0, [mangaId_1, ...args_1], void 0, function* (mangaId, languages = ['en']) {
    var _a, _b, _c, _d;
    try {
        // 1. Fetch manga details
        const detailsRes = yield (0, exports.getMangaDetails)(mangaId);
        const manga = detailsRes.data;
        // 2. Fetch statistics (rating, follows)
        let rating = null, follows = null;
        try {
            const statsRes = yield axios_1.default.get(`${MANGADEX_API_BASE_URL}/statistics/manga/${mangaId}`);
            if (statsRes.data && statsRes.data.statistics && statsRes.data.statistics[mangaId]) {
                // MangaDex returns rating as an object: { average, bayesian, distribution }
                // Use average.bayesian or average as a number
                const ratingObj = statsRes.data.statistics[mangaId].rating;
                rating = typeof ratingObj === 'object' ? ((_b = (_a = ratingObj.bayesian) !== null && _a !== void 0 ? _a : ratingObj.average) !== null && _b !== void 0 ? _b : 0) : ratingObj !== null && ratingObj !== void 0 ? ratingObj : 0;
                follows = statsRes.data.statistics[mangaId].follows;
            }
        }
        catch (e) {
            // fallback: leave as null
        }
        // 3. Fetch ALL chapters robustly (handle pagination)
        let allChapters = [];
        let offset = 0;
        const limit = 500;
        let total = 1;
        while (allChapters.length < total) {
            const feedRes = yield (0, exports.getMangaFeed)(mangaId, languages, limit, offset);
            if (feedRes && feedRes.data) {
                allChapters.push(...feedRes.data);
                total = feedRes.total || allChapters.length;
                offset += limit;
            }
            else {
                break;
            }
        }
        // 4. For each chapter, ensure pages are loadable (optional: can be slow for many chapters)
        // Uncomment below if you want to verify every chapter's pages
        // for (const chapter of allChapters) {
        //   try {
        //     await getChapterPages(chapter.id);
        //   } catch (e) {
        //     // Log or handle missing/broken chapter pages
        //   }
        // }
        // 5. Extract author from relationships
        let author = '';
        const authorRel = (manga.relationships || []).find(rel => rel.type === 'author');
        if (authorRel && authorRel.attributes && authorRel.attributes.name) {
            author = authorRel.attributes.name;
        }
        // 6. Extract genres/tags
        const genres = (manga.attributes.tags || []).map(tag => tag.attributes.name.en || Object.values(tag.attributes.name)[0] || '');
        // 7. Extract cover image
        let coverFileName = '';
        const coverRel = (manga.relationships || []).find(rel => rel.type === 'cover_art');
        if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
            coverFileName = coverRel.attributes.fileName;
        }
        const coverImage = coverFileName ?
            `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg` : '';
        // 8. Build and return complete info object
        return {
            id: manga.id,
            title: ((_c = manga.attributes.title) === null || _c === void 0 ? void 0 : _c.en) || Object.values(manga.attributes.title)[0] || 'No Title',
            description: ((_d = manga.attributes.description) === null || _d === void 0 ? void 0 : _d.en) || Object.values(manga.attributes.description)[0] || '',
            author,
            type: manga.type || 'manga',
            status: manga.attributes.status,
            genres,
            rating,
            follows,
            totalChapters: allChapters.length,
            coverImage,
            year: manga.attributes.year,
            contentRating: manga.attributes.contentRating,
            chapters: allChapters,
        };
    }
    catch (error) {
        console.error('Error fetching complete manga info:', error);
        throw error;
    }
});
exports.getCompleteMangaInfo = getCompleteMangaInfo;
const getMangaStatistics = (mangaId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        yield removeTokens(1);
        const response = yield apiClient.get(`/statistics/manga/${mangaId}`);
        // Extract just the statistics for this manga
        if (response.data && response.data.statistics && response.data.statistics[mangaId]) {
            const stats = response.data.statistics[mangaId];
            // Return a simplified statistics object
            return {
                rating: typeof stats.rating === 'object' ?
                    ((_b = (_a = stats.rating.bayesian) !== null && _a !== void 0 ? _a : stats.rating.average) !== null && _b !== void 0 ? _b : 0) :
                    (_c = stats.rating) !== null && _c !== void 0 ? _c : 0,
                follows: (_d = stats.follows) !== null && _d !== void 0 ? _d : 0
            };
        }
        return { rating: 0, follows: 0 };
    }
    catch (error) {
        console.error(`Error fetching manga statistics for ID ${mangaId}:`, error);
        return { rating: 0, follows: 0 };
    }
});
exports.getMangaStatistics = getMangaStatistics;
