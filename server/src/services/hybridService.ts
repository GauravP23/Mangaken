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
  // MangaDex data (primary)
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
  // AniList data (enhanced)
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
  // Combined/computed fields
  enhancedRating: number;
  enhancedPopularity: number;
}

// Cache for title mappings (MangaDex ID -> AniList ID)
const titleMappingCache = new Map<string, number | null>();

/**
 * Get enhanced manga data combining MangaDex and AniList
 */
export const getEnhancedMangaDetails = async (mangadexId: string): Promise<HybridManga> => {
  try {
    // 1. Get MangaDex data first (this is our source of truth)
    const mangadexData = await mangadexService.getMangaDetails(mangadexId);
    const manga = mangadexData.data;

    // Extract basic info
    const title = (manga.attributes.title as any)?.en || Object.values(manga.attributes.title)[0] || 'No Title';
    const description = (manga.attributes.description as any)?.en || Object.values(manga.attributes.description)[0] || '';
    
    // Get author
    let author = '';
    const authorRel = (manga.relationships || []).find(rel => rel.type === 'author');
    if (authorRel && authorRel.attributes && authorRel.attributes.name) {
      author = authorRel.attributes.name;
    }

    // Get genres
    const genres = (manga.attributes.tags || []).map((tag: any) => 
      tag.attributes.name.en || Object.values(tag.attributes.name)[0] || ''
    );

    // Get cover
    let coverFileName = '';
    const coverRel = (manga.relationships || []).find((rel: any) => rel.type === 'cover_art');
    if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
      coverFileName = coverRel.attributes.fileName;
    }
    const coverImage = coverFileName ?
      `/api/manga/cover/${manga.id}/${encodeURIComponent(coverFileName)}?size=256` : '';

    // Build base MangaDex data
    const hybridManga: HybridManga = {
      mangadex: {
        id: manga.id,
        title,
        description,
        coverImage,
        author,
        status: manga.attributes.status,
        genres,
        year: manga.attributes.year,
      },
      anilist: null,
      enhancedRating: 0,
      enhancedPopularity: 0,
    };

    // 2. Try to match with AniList (async, don't block if it fails)
    try {
      // Check cache first
      let anilistId: number | null = titleMappingCache.get(mangadexId) ?? null;
      
      if (anilistId === null && !titleMappingCache.has(mangadexId)) {
        // Not in cache, search AniList
        const anilistMatch = await anilistService.matchMangaByTitle(title);
        anilistId = anilistMatch?.id ?? null;
        titleMappingCache.set(mangadexId, anilistId);
      }

      if (anilistId) {
        // Get detailed AniList data
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

        // Compute enhanced ratings
        hybridManga.enhancedRating = anilistData.averageScore || 0;
        hybridManga.enhancedPopularity = anilistData.popularity || 0;
      }
    } catch (error) {
      console.warn('Could not fetch AniList data for', title, error);
      // Continue without AniList data
    }

    // 3. Get MangaDex statistics as fallback
    try {
      const stats = await mangadexService.getMangaStatistics(mangadexId);
      if (!hybridManga.enhancedRating) {
        hybridManga.enhancedRating = stats.rating || 0;
      }
      if (!hybridManga.enhancedPopularity) {
        hybridManga.enhancedPopularity = stats.follows || 0;
      }
    } catch (error) {
      console.warn('Could not fetch MangaDex stats for', mangadexId);
    }

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
  try {
    // Get complete MangaDex info (includes chapters)
    const completeInfo = await mangadexService.getCompleteMangaInfo(mangadexId);
    
    // Try to enhance with AniList
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
      console.warn('Could not fetch AniList data:', error);
    }

    // Combine the data
    return {
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
  } catch (error) {
    console.error('Error getting complete enhanced manga info:', error);
    throw error;
  }
};

/**
 * Get trending manga from AniList and match with MangaDex for reading
 */
export const getEnhancedTrendingManga = async (limit: number = 20) => {
  try {
    // Get trending from AniList
    const anilistTrending = await anilistService.getTrendingManga(1, limit);
    
    // For each trending manga, try to find MangaDex equivalent
    const enhanced = await Promise.all(
      anilistTrending.media.map(async (anilistManga: any) => {
        try {
          // Search MangaDex by title
          const englishTitle = anilistManga.title.english || anilistManga.title.romaji;
          const mangadexResults = await mangadexService.searchManga(englishTitle, 1, 0);
          
          if (mangadexResults.data && mangadexResults.data.length > 0) {
            const mangadexManga = mangadexResults.data[0];
            
            return {
              mangadexId: mangadexManga.id,
              anilistId: anilistManga.id,
              title: englishTitle,
              coverImage: anilistManga.coverImage.large,
              averageScore: anilistManga.averageScore,
              popularity: anilistManga.popularity,
              trending: anilistManga.trending,
              genres: anilistManga.genres,
              status: anilistManga.status,
              format: anilistManga.format,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      })
    );

    return enhanced.filter(item => item !== null);
  } catch (error) {
    console.error('Error getting enhanced trending manga:', error);
    throw error;
  }
};

/**
 * Get recommendations for a manga (from AniList) with MangaDex links
 */
export const getEnhancedRecommendations = async (mangadexId: string) => {
  try {
    // Get AniList ID for this manga
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
      return [];
    }

    // Get recommendations from AniList
    const recommendations = await anilistService.getRecommendations(anilistId);
    
    // For each recommendation, try to find MangaDex equivalent
    const enhanced = await Promise.all(
      recommendations.edges.slice(0, 10).map(async (edge: any) => {
        try {
          const recManga = edge.node.mediaRecommendation;
          const title = recManga.title.english || recManga.title.romaji;
          
          // Search MangaDex
          const mangadexResults = await mangadexService.searchManga(title, 1, 0);
          
          if (mangadexResults.data && mangadexResults.data.length > 0) {
            return {
              mangadexId: mangadexResults.data[0].id,
              anilistId: recManga.id,
              title,
              coverImage: recManga.coverImage.large,
              averageScore: recManga.averageScore,
              popularity: recManga.popularity,
              genres: recManga.genres,
              rating: edge.rating,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      })
    );

    return enhanced.filter(item => item !== null);
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

    // Create a map of MangaDex results
    const mangadexMap = new Map();
    mangadexResults.data.forEach((manga: any) => {
      const title = (manga.attributes.title as any)?.en || Object.values(manga.attributes.title)[0];
      mangadexMap.set(title.toLowerCase(), manga);
    });

    // Enhance MangaDex results with AniList data where possible
    const enhanced = mangadexResults.data.map((manga: any) => {
      const title = (manga.attributes.title as any)?.en || Object.values(manga.attributes.title)[0];
      
      // Find matching AniList entry
      const anilistMatch = anilistResults.media?.find((am: any) => {
        const aniTitle = (am.title.english || am.title.romaji).toLowerCase();
        return aniTitle === title.toLowerCase() || 
               title.toLowerCase().includes(aniTitle) ||
               aniTitle.includes(title.toLowerCase());
      });

      return {
        manga,
        anilist: anilistMatch || null,
      };
    });

    return enhanced;
  } catch (error) {
    console.error('Error in hybrid search:', error);
    throw error;
  }
};
