import { Manga as ApiManga, UIManga } from '../types';

type Relationship = {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
};

type MangaDexAttributes = {
  title: Record<string, string>;
  altTitles?: Record<string, string>[];
  description: Record<string, string>;
  tags?: { attributes: { name: Record<string, string>; group?: string } }[];
  status?: string;
  bayesianRating?: number;
  averageRating?: number;
  followedCount?: number;
  lastChapter?: string;
  lastVolume?: string;
  year?: number;
  contentRating?: string;
  publicationDemographic?: string;
  originalLanguage?: string;
  updatedAt?: string;
  createdAt?: string;
};

// Genre tags we want to display (filter out format/theme tags that aren't true genres)
const DISPLAY_GENRES = new Set([
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  'Psychological', 'Tragedy', 'Martial Arts', 'Historical', 'Mecha', 'Medical',
  'Music', 'School Life', 'Shounen', 'Shoujo', 'Seinen', 'Josei', 'Isekai',
  'Magical Girls', 'Military', 'Police', 'Crime', 'Survival', 'Cooking',
  'Philosophical', 'Wuxia', 'Superhero', 'Villainess', 'Video Games',
  'Virtual Reality', 'Zombies', 'Vampires', 'Demons', 'Magic', 'Time Travel',
  'Reincarnation', 'Post-Apocalyptic', 'Samurai', 'Ninja', 'Monsters', 'Animals',
  'Harem', 'Reverse Harem', 'Ecchi', 'Gore', 'Mature'
]);

function isUIManga(manga: unknown): manga is UIManga {
  return (
    typeof manga === 'object' && manga !== null &&
    'title' in manga && 'id' in manga && 'genres' in manga && 'image' in manga
  );
}

export function mapApiMangaToUICard(manga: UIManga | ApiManga): UIManga {
  if (isUIManga(manga)) {
    // UIManga shape
    return {
      ...manga,
      views: manga.follows ?? manga.views ?? 0,
      chapters: manga.totalChapters ?? manga.chapters ?? 0,
      rating: manga.rating ?? 0,
      status: manga.status ?? 'ongoing',
      author: manga.author ?? '',
      genres: manga.genres ?? [],
      image: manga.coverImage ?? manga.image ?? '',
      title: manga.title ?? '',
      description: manga.description ?? '',
      id: manga.id,
      lastUpdate: manga.lastUpdate ?? '',
      type: manga.type ?? 'manga',
    };
  }

  if ((manga as ApiManga).attributes) {
    const apiManga = manga as ApiManga;
    const attributes = apiManga.attributes as MangaDexAttributes;
    
    // Extract cover art filename from relationships
    let coverFileName = '';
    const coverRel = (apiManga.relationships || []).find((rel: Relationship) => rel.type === 'cover_art');
    if (coverRel && coverRel.attributes && typeof coverRel.attributes.fileName === 'string') {
      coverFileName = coverRel.attributes.fileName as string;
    } else if (coverRel && coverRel.attributes && typeof coverRel.attributes.filename === 'string') {
      coverFileName = coverRel.attributes.filename as string;
    }
    
    // Build proxy cover URL using backend route to avoid hotlinking
    const image = coverFileName ?
      `/api/manga/cover/${apiManga.id}/${encodeURIComponent(coverFileName)}?size=256` :
      '';
    
    // Extract author name
    let author = '';
    const authorRel = (apiManga.relationships || []).find((rel: Relationship) => rel.type === 'author');
    if (authorRel && authorRel.attributes && typeof authorRel.attributes.name === 'string') {
      author = authorRel.attributes.name as string;
    }
    
    // Extract artist name (if different from author)
    let artist = '';
    const artistRel = (apiManga.relationships || []).find((rel: Relationship) => rel.type === 'artist');
    if (artistRel && artistRel.attributes && typeof artistRel.attributes.name === 'string') {
      artist = artistRel.attributes.name as string;
    }
    
    // Extract rating (from attributes if present, fallback to 0)
    let rating = 0;
    if (attributes && typeof attributes.bayesianRating === 'number') {
      rating = attributes.bayesianRating;
    } else if (attributes && typeof attributes.averageRating === 'number') {
      rating = attributes.averageRating;
    }
    
    // Extract views (followedCount)
    let views = 0;
    if (attributes && typeof attributes.followedCount === 'number') {
      views = attributes.followedCount;
    }
    
    // Extract chapter count from lastChapter
    let chapters = 0;
    if (attributes && attributes.lastChapter) {
      // Parse the chapter number (e.g., "122.5" -> 122)
      const chapterNum = parseFloat(attributes.lastChapter);
      chapters = isNaN(chapterNum) ? 0 : Math.floor(chapterNum);
    }
    
    // Extract and filter genres (only show meaningful genre tags, not format tags)
    const allTags = (attributes.tags || []).map(tag => 
      tag.attributes.name.en || Object.values(tag.attributes.name)[0] || ''
    );
    // Filter to show only actual genre tags, limit to 5
    const genres = allTags.filter(tag => DISPLAY_GENRES.has(tag)).slice(0, 5);
    // If no display genres found, use first 3 tags as fallback
    const displayGenres = genres.length > 0 ? genres : allTags.slice(0, 3);
    
    // Extract publication demographic
    const demographic = attributes.publicationDemographic || '';
    
    // Extract type
    const type = (apiManga as { type?: string }).type || 'manga';
    
    // Extract year
    const year = attributes.year || null;
    
    // Extract content rating
    const contentRating = attributes.contentRating || 'safe';
    
    // Extract last update time
    const lastUpdate = attributes.updatedAt || attributes.createdAt || '';
    
    // Get alternate titles
    const altTitles = attributes.altTitles || [];
    const japaneseTitle = altTitles.find(t => t.ja || t['ja-ro'])?.ja || 
                          altTitles.find(t => t['ja-ro'])?.['ja-ro'] || '';
    
    return {
      id: apiManga.id,
      title: attributes.title?.en || Object.values(attributes.title)[0] || 'No Title',
      description: attributes.description?.en || Object.values(attributes.description)[0] || '',
      image,
      genres: displayGenres,
      rating,
      status: (attributes.status as 'ongoing' | 'completed' | 'hiatus' | 'cancelled') || 'ongoing',
      chapters,
      views,
      author: author || artist, // Fallback to artist if no author
      lastUpdate,
      type: type || 'manga',
      // Additional metadata
      year,
      contentRating,
      demographic,
      japaneseTitle,
      originalTitle: attributes.title,
    };
  }
  
  // Fallback: return a minimal UIManga object with default values
  return {
    id: (manga as { id?: string }).id || '',
    title: '',
    description: '',
    image: '',
    genres: [],
    rating: 0,
    status: 'ongoing',
    chapters: 0,
    views: 0,
    author: '',
    lastUpdate: '',
    type: 'manga',
  };
}