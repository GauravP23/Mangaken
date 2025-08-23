import { Manga as ApiManga, UIManga } from '../types';

type Relationship = {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
};

type MangaDexAttributes = {
  title: Record<string, string>;
  description: Record<string, string>;
  tags?: { attributes: { name: Record<string, string> } }[];
  status?: string;
  bayesianRating?: number;
  averageRating?: number;
  followedCount?: number;
  lastChapter?: string;
  lastVolume?: string;
};

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
    // Build MangaDex cover URL if possible
    const image = coverFileName ?
      `https://uploads.mangadex.org/covers/${apiManga.id}/${coverFileName}.256.jpg` :
      '';
    // Extract author name
    let author = '';
    const authorRel = (apiManga.relationships || []).find((rel: Relationship) => rel.type === 'author');
    if (authorRel && authorRel.attributes && typeof authorRel.attributes.name === 'string') {
      author = authorRel.attributes.name as string;
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
    
    // Extract type
    const type = (apiManga as { type?: string }).type || 'manga';
    return {
      id: apiManga.id,
      title: attributes.title?.en || Object.values(attributes.title)[0] || 'No Title',
      description: attributes.description?.en || Object.values(attributes.description)[0] || '',
      image,
      genres: (attributes.tags || []).map(tag => tag.attributes.name.en || Object.values(tag.attributes.name)[0] || ''),
      rating,
      status: (attributes.status as 'ongoing' | 'completed') || 'ongoing',
      chapters, // Now using real chapter count from API!
      views,
      author,
      lastUpdate: '', // Not available from API by default
      type: type || 'manga',
      // Store original title data for alternative displays
      originalTitle: attributes.title,
    };
  }
  // Fallback: treat as UIManga
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
