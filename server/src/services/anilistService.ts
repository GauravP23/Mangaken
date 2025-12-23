import axios from 'axios';
import { RateLimiter } from 'limiter';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// AniList rate limit: 90 requests per minute
const limiter = new RateLimiter({ tokensPerInterval: 90, interval: 'minute' });

async function removeTokens(total: number) {
  await limiter.removeTokens(total);
}

// Cache for AniList data to reduce API calls
const anilistCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(key: string) {
  const cached = anilistCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  anilistCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Search for manga on AniList by title
 * Returns enhanced metadata including recommendations, reviews, and rankings
 */
export const searchAniListManga = async (title: string, page: number = 1, perPage: number = 10) => {
  const cacheKey = `search:${title}:${page}:${perPage}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  await removeTokens(1);

  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          description(asHtml: false)
          coverImage {
            large
            extraLarge
          }
          bannerImage
          averageScore
          meanScore
          popularity
          favourites
          genres
          tags {
            id
            name
            rank
          }
          status
          format
          chapters
          volumes
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          staff {
            edges {
              role
              node {
                name {
                  full
                }
              }
            }
          }
          recommendations {
            edges {
              node {
                mediaRecommendation {
                  id
                  title {
                    romaji
                    english
                  }
                  coverImage {
                    large
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API_URL, {
      query,
      variables: { search: title, page, perPage }
    });

    const result = response.data.data.Page;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error searching AniList:', error);
    throw error;
  }
};

/**
 * Get detailed manga info from AniList by ID
 */
export const getAniListMangaById = async (anilistId: number) => {
  const cacheKey = `manga:${anilistId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  await removeTokens(1);

  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        coverImage {
          large
          extraLarge
        }
        bannerImage
        averageScore
        meanScore
        popularity
        favourites
        trending
        genres
        tags {
          id
          name
          rank
          category
        }
        status
        format
        chapters
        volumes
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        staff {
          edges {
            role
            node {
              id
              name {
                full
              }
            }
          }
        }
        characters {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              type
            }
          }
        }
        recommendations(sort: RATING_DESC, page: 1, perPage: 10) {
          edges {
            rating
            node {
              mediaRecommendation {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  large
                }
                averageScore
                format
              }
            }
          }
        }
        reviews(sort: RATING_DESC, page: 1, perPage: 5) {
          edges {
            node {
              id
              rating
              summary
              body(asHtml: false)
              score
              user {
                name
                avatar {
                  large
                }
              }
              createdAt
            }
          }
        }
        stats {
          scoreDistribution {
            score
            amount
          }
          statusDistribution {
            status
            amount
          }
        }
        rankings {
          rank
          type
          context
          year
          season
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API_URL, {
      query,
      variables: { id: anilistId }
    });

    const result = response.data.data.Media;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching AniList manga:', error);
    throw error;
  }
};

/**
 * Get trending manga from AniList
 */
export const getTrendingManga = async (page: number = 1, perPage: number = 20) => {
  const cacheKey = `trending:${page}:${perPage}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  await removeTokens(1);

  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          hasNextPage
        }
        media(type: MANGA, sort: TRENDING_DESC) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          averageScore
          popularity
          trending
          genres
          format
          chapters
          status
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API_URL, {
      query,
      variables: { page, perPage }
    });

    const result = response.data.data.Page;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching trending manga:', error);
    throw error;
  }
};

/**
 * Get popular manga from AniList
 */
export const getPopularManga = async (page: number = 1, perPage: number = 20) => {
  const cacheKey = `popular:${page}:${perPage}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  await removeTokens(1);

  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          hasNextPage
        }
        media(type: MANGA, sort: POPULARITY_DESC) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          averageScore
          popularity
          genres
          format
          chapters
          status
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API_URL, {
      query,
      variables: { page, perPage }
    });

    const result = response.data.data.Page;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching popular manga:', error);
    throw error;
  }
};

/**
 * Get recommendations based on manga ID
 */
export const getRecommendations = async (anilistId: number) => {
  const cacheKey = `recommendations:${anilistId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  await removeTokens(1);

  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        recommendations(sort: RATING_DESC, page: 1, perPage: 20) {
          edges {
            rating
            node {
              mediaRecommendation {
                id
                idMal
                title {
                  romaji
                  english
                }
                coverImage {
                  large
                }
                averageScore
                popularity
                genres
                format
                chapters
                status
                description(asHtml: false)
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API_URL, {
      query,
      variables: { id: anilistId }
    });

    const result = response.data.data.Media.recommendations;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

/**
 * Match AniList manga with MangaDex by title
 * Returns best match or null
 */
export const matchMangaByTitle = async (mangadexTitle: string) => {
  try {
    const result = await searchAniListManga(mangadexTitle, 1, 5);
    if (result.media && result.media.length > 0) {
      // Return the first (best) match
      return result.media[0];
    }
    return null;
  } catch (error) {
    console.error('Error matching manga by title:', error);
    return null;
  }
};

/**
 * Get reviews for a manga
 */
export const getMangaReviews = async (anilistId: number, page: number = 1, perPage: number = 10) => {
  const cacheKey = `reviews:${anilistId}:${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  await removeTokens(1);

  const query = `
    query ($id: Int, $page: Int, $perPage: Int) {
      Media(id: $id, type: MANGA) {
        reviews(sort: RATING_DESC, page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            hasNextPage
          }
          edges {
            node {
              id
              rating
              ratingAmount
              summary
              body(asHtml: false)
              score
              user {
                id
                name
                avatar {
                  large
                }
              }
              createdAt
              updatedAt
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API_URL, {
      query,
      variables: { id: anilistId, page, perPage }
    });

    const result = response.data.data.Media.reviews;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

/**
 * Clear cache for specific key or all cache
 */
export const clearCache = (key?: string) => {
  if (key) {
    anilistCache.delete(key);
  } else {
    anilistCache.clear();
  }
};
