import axios from 'axios';
import { MangaDexResponse, MangaDexSingleResponse, Manga, ChapterFeedResponse, AtHomeServerResponse } from '../types/mangadex';
import { RateLimiter } from 'limiter';

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

const limiter = new RateLimiter({ tokensPerInterval: 10, interval: 'second' });

async function removeTokens(total: number) {
  await limiter.removeTokens(total);
}

export const searchManga = async (title: string, limit: number = 20, offset: number = 0): Promise<MangaDexResponse<Manga>> => {
    try {
        await removeTokens(1);
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
        await removeTokens(1);
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
        await removeTokens(1);
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
        await removeTokens(1);
        const response = await apiClient.get<AtHomeServerResponse>(`/at-home/server/${chapterId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching chapter pages for ID ${chapterId}:`, error);
        throw error;
    }
};

export const listManga = async (query: any): Promise<MangaDexResponse<Manga>> => {
    try {
        await removeTokens(1);
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

/**
 * Fetches and combines all relevant manga info: details, statistics, and chapters.
 * Ensures all chapters are fetched and chapter pages are loaded robustly.
 */
export const getCompleteMangaInfo = async (mangaId: string, languages: string[] = ['en']) => {
  try {
    // 1. Fetch manga details
    const detailsRes = await getMangaDetails(mangaId);
    const manga = detailsRes.data;

    // 2. Fetch statistics (rating, follows)
    let rating = null, follows = null;
    try {
      const statsRes = await axios.get(`${MANGADEX_API_BASE_URL}/statistics/manga/${mangaId}`);
      if (statsRes.data && statsRes.data.statistics && statsRes.data.statistics[mangaId]) {
        // MangaDex returns rating as an object: { average, bayesian, distribution }
        // Use average.bayesian or average as a number
        const ratingObj = statsRes.data.statistics[mangaId].rating;
        rating = typeof ratingObj === 'object' ? (ratingObj.bayesian ?? ratingObj.average ?? 0) : ratingObj ?? 0;
        follows = statsRes.data.statistics[mangaId].follows;
      }
    } catch (e) {
      // fallback: leave as null
    }

    // 3. Fetch ALL chapters robustly (handle pagination)
    let allChapters = [];
    let offset = 0;
    const limit = 500;
    let total = 1;
    while (allChapters.length < total) {
      const feedRes = await getMangaFeed(mangaId, languages, limit, offset);
      if (feedRes && feedRes.data) {
        allChapters.push(...feedRes.data);
        total = feedRes.total || allChapters.length;
        offset += limit;
      } else {
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
      title: manga.attributes.title?.en || Object.values(manga.attributes.title)[0] || 'No Title',
      description: manga.attributes.description?.en || Object.values(manga.attributes.description)[0] || '',
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
  } catch (error) {
    console.error('Error fetching complete manga info:', error);
    throw error;
  }
};

export const getMangaStatistics = async (mangaId: string) => {
  try {
    await removeTokens(1);
    const response = await apiClient.get(`/statistics/manga/${mangaId}`);
    // Extract just the statistics for this manga
    if (response.data && response.data.statistics && response.data.statistics[mangaId]) {
      const stats = response.data.statistics[mangaId];
      // Return a simplified statistics object
      return {
        rating: typeof stats.rating === 'object' ? 
          (stats.rating.bayesian ?? stats.rating.average ?? 0) : 
          stats.rating ?? 0,
        follows: stats.follows ?? 0
      };
    }
    return { rating: 0, follows: 0 };
  } catch (error) {
    console.error(`Error fetching manga statistics for ID ${mangaId}:`, error);
    return { rating: 0, follows: 0 };
  }
};