// AniList GraphQL Service
// Handles all requests to https://graphql.anilist.co
// No API key or OAuth required for public user data

const ANILIST_API_URL = 'https://graphql.anilist.co';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function fetchAniList<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const cacheKey = `${query}::${JSON.stringify(variables)}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      json?.errors?.map((e: { message?: string }) => e.message).filter(Boolean).join(', ') ||
      `${response.status} ${response.statusText}`;
    throw new Error(`AniList API Error: ${errorMsg}`);
  }

  if (json?.errors?.length) {
    throw new Error(json.errors[0]?.message || 'AniList API returned errors');
  }

  setCache(cacheKey, json.data);
  return json.data as T;
}

// ─────────────────────────────────────────────────────────
// GraphQL Queries
// ─────────────────────────────────────────────────────────

export const GET_TOP_MEDIA = `
  query GetTopMedia($type: MediaType!, $sort: [MediaSort]!, $page: Int, $perPage: Int, $genre: String) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        total
        currentPage
        lastPage
      }
      media(type: $type, sort: $sort, genre: $genre, isAdult: false) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
          color
        }
        bannerImage
        format
        status
        episodes
        chapters
        volumes
        averageScore
        meanScore
        popularity
        trending
        favourites
        genres
        description(asHtml: false)
        startDate {
          year
          month
        }
        endDate {
          year
        }
        season
        seasonYear
        studios(isMain: true) {
          nodes {
            id
            name
          }
        }
        source
        trailer {
          id
          site
        }
      }
    }
  }
`;

export const GET_USER_PROFILE_AND_STATS = `
  query GetUserStats($name: String!) {
    User(name: $name) {
      id
      name
      avatar {
        large
        medium
      }
      bannerImage
      about
      createdAt
      updatedAt
      statistics {
        anime {
          count
          meanScore
          standardDeviation
          minutesWatched
          episodesWatched
          genres(limit: 15, sort: COUNT_DESC) {
            genre
            count
            meanScore
            minutesWatched
          }
          tags(limit: 15, sort: COUNT_DESC) {
            tag {
              id
              name
              category
            }
            count
            meanScore
          }
          studios(limit: 10, sort: COUNT_DESC) {
            studio {
              id
              name
            }
            count
            meanScore
          }
          statuses(sort: COUNT_DESC) {
            status
            count
          }
          formats(sort: COUNT_DESC) {
            format
            count
          }
          releaseYears(sort: ID) {
            releaseYear
            count
            meanScore
            minutesWatched
          }
          scores(sort: ID_DESC) {
            score
            count
          }
        }
        manga {
          count
          meanScore
          standardDeviation
          chaptersRead
          volumesRead
          genres(limit: 15, sort: COUNT_DESC) {
            genre
            count
            meanScore
            chaptersRead
          }
          tags(limit: 15, sort: COUNT_DESC) {
            tag {
              id
              name
              category
            }
            count
            meanScore
          }
          statuses(sort: COUNT_DESC) {
            status
            count
          }
          formats(sort: COUNT_DESC) {
            format
            count
          }
          scores(sort: ID_DESC) {
            score
            count
          }
        }
      }
    }
  }
`;

export const GET_USER_MEDIA_LIST = `
  query GetUserMediaList($userName: String!, $type: MediaType!) {
    MediaListCollection(userName: $userName, type: $type) {
      lists {
        name
        status
        isCustomList
        entries {
          id
          score(format: POINT_100)
          status
          progress
          repeat
          startedAt {
            year
            month
            day
          }
          completedAt {
            year
            month
            day
          }
          media {
            id
            idMal
            title {
              english
              romaji
            }
            coverImage {
              medium
              large
            }
            averageScore
            meanScore
            popularity
            episodes
            chapters
            genres
            format
            status
            studios(isMain: true) {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const SEARCH_ANILIST_MEDIA = `
  query SearchAniListMedia($search: String!, $type: MediaType!, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $search, type: $type, isAdult: false) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          color
        }
        format
        status
        episodes
        chapters
        averageScore
        popularity
        genres
        startDate {
          year
        }
      }
    }
  }
`;

// ─────────────────────────────────────────────────────────
// Typed response interfaces
// ─────────────────────────────────────────────────────────

export interface AniListTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface AniListCoverImage {
  extraLarge?: string | null;
  large?: string | null;
  medium?: string | null;
  color?: string | null;
}

export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  bannerImage?: string | null;
  format: string | null;
  status: string | null;
  episodes?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  averageScore: number | null;
  meanScore?: number | null;
  popularity: number;
  trending?: number;
  favourites?: number;
  genres: string[];
  description?: string | null;
  startDate?: { year: number | null; month?: number | null } | null;
  endDate?: { year: number | null } | null;
  season?: string | null;
  seasonYear?: number | null;
  source?: string | null;
  studios?: { nodes: { id: number; name: string }[] };
  trailer?: { id: string; site: string } | null;
}

export interface AniListPageInfo {
  hasNextPage: boolean;
  total: number;
  currentPage?: number;
  lastPage?: number;
}

export interface AniListTopMediaResponse {
  Page: {
    pageInfo: AniListPageInfo;
    media: AniListMedia[];
  };
}

export interface AniListGenreStat {
  genre: string;
  count: number;
  meanScore: number;
  minutesWatched?: number;
  chaptersRead?: number;
}

export interface AniListTagStat {
  tag: { id: number; name: string; category: string };
  count: number;
  meanScore: number;
}

export interface AniListStudioStat {
  studio: { id: number; name: string };
  count: number;
  meanScore: number;
}

export interface AniListStatusStat {
  status: string;
  count: number;
}

export interface AniListFormatStat {
  format: string;
  count: number;
}

export interface AniListReleaseYearStat {
  releaseYear: number;
  count: number;
  meanScore: number;
  minutesWatched: number;
}

export interface AniListScoreStat {
  score: number;
  count: number;
}

export interface AniListAnimeStats {
  count: number;
  meanScore: number;
  standardDeviation: number;
  minutesWatched: number;
  episodesWatched: number;
  genres: AniListGenreStat[];
  tags: AniListTagStat[];
  studios: AniListStudioStat[];
  statuses: AniListStatusStat[];
  formats: AniListFormatStat[];
  releaseYears: AniListReleaseYearStat[];
  scores: AniListScoreStat[];
}

export interface AniListMangaStats {
  count: number;
  meanScore: number;
  standardDeviation: number;
  chaptersRead: number;
  volumesRead: number;
  genres: AniListGenreStat[];
  tags: AniListTagStat[];
  statuses: AniListStatusStat[];
  formats: AniListFormatStat[];
  scores: AniListScoreStat[];
}

export interface AniListUser {
  id: number;
  name: string;
  avatar: { large: string | null; medium: string | null };
  bannerImage: string | null;
  about: string | null;
  createdAt: number;
  updatedAt: number;
  statistics: {
    anime: AniListAnimeStats;
    manga: AniListMangaStats;
  };
}

export interface AniListUserResponse {
  User: AniListUser;
}

export interface AniListMediaListEntry {
  id: number;
  score: number;
  status: string;
  progress: number;
  repeat: number;
  startedAt: { year: number | null; month: number | null; day: number | null };
  completedAt: { year: number | null; month: number | null; day: number | null };
  media: {
    id: number;
    idMal: number | null;
    title: AniListTitle;
    coverImage: AniListCoverImage;
    averageScore: number | null;
    meanScore: number | null;
    popularity: number;
    episodes: number | null;
    chapters: number | null;
    genres: string[];
    format: string | null;
    status: string | null;
    studios?: { nodes: { id: number; name: string }[] };
  };
}

export interface AniListMediaList {
  name: string;
  status: string;
  isCustomList: boolean;
  entries: AniListMediaListEntry[];
}

export interface AniListMediaListResponse {
  MediaListCollection: {
    lists: AniListMediaList[];
  };
}

// ─────────────────────────────────────────────────────────
// Convenience fetch functions
// ─────────────────────────────────────────────────────────

export type MediaSort =
  | 'SCORE_DESC'
  | 'POPULARITY_DESC'
  | 'TRENDING_DESC'
  | 'FAVOURITES_DESC'
  | 'START_DATE_DESC';

export async function fetchTopMedia(
  type: 'ANIME' | 'MANGA',
  sort: MediaSort = 'SCORE_DESC',
  page = 1,
  perPage = 24,
  genre?: string
): Promise<AniListTopMediaResponse> {
  return fetchAniList<AniListTopMediaResponse>(GET_TOP_MEDIA, {
    type,
    sort: [sort],
    page,
    perPage,
    genre: genre || undefined,
  });
}

export async function fetchUserProfileAndStats(username: string): Promise<AniListUserResponse> {
  return fetchAniList<AniListUserResponse>(GET_USER_PROFILE_AND_STATS, { name: username });
}

export async function fetchUserMediaList(
  username: string,
  type: 'ANIME' | 'MANGA'
): Promise<AniListMediaListResponse> {
  return fetchAniList<AniListMediaListResponse>(GET_USER_MEDIA_LIST, {
    userName: username,
    type,
  });
}

export async function searchAniListMedia(
  search: string,
  type: 'ANIME' | 'MANGA',
  perPage = 10
): Promise<AniListMedia[]> {
  const data = await fetchAniList<{ Page: { media: AniListMedia[] } }>(SEARCH_ANILIST_MEDIA, {
    search,
    type,
    perPage,
  });
  return data.Page.media;
}

// Helper: get display title (English preferred, fallback to romaji)
export function getDisplayTitle(title: AniListTitle): string {
  return title.english || title.romaji || 'Unknown Title';
}

// Helper: format minutes watched to h/d string
export function formatWatchTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainH = hours % 24;
  return remainH > 0 ? `${days}d ${remainH}h` : `${days}d`;
}

// Helper: format large numbers
export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
