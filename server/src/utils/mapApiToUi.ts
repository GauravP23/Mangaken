import { Manga } from '../types/mangadex';

export interface UIManga {
  id: string;
  title: string;
  description: string;
  image: string;
  genres: string[];
}

// Map a MangaDex API Manga to a simplified UIManga shape
export function mapApiMangaToUICard(manga: Manga): UIManga {
  // Title
  const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || '';
  // Description
  const description = manga.attributes.description.en || Object.values(manga.attributes.description)[0] || '';
  // Cover image via proxy
  let cover = '';
  const coverRel = manga.relationships?.find(r => r.type === 'cover_art');
  if (coverRel && coverRel.attributes && (coverRel.attributes as any).fileName) {
    const fileName = (coverRel.attributes as any).fileName as string;
    cover = `/api/manga/cover/${manga.id}/${fileName}?size=512`;
  }
  // Genres/tags
  const genres = manga.attributes.tags.map(tag => tag.attributes.name.en || Object.values(tag.attributes.name)[0] || '');
  return { id: manga.id, title, description, image: cover, genres };
}
