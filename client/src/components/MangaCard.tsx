import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { Manga } from '../data/mangaData';
// Accept both API and UI Manga types
import { Manga as ApiManga, UIManga } from '../types';

export interface MangaCardProps {
  manga: UIManga | ApiManga;
  size?: 'small' | 'medium' | 'large';
}

// Helper to map API Manga to UI MangaCard shape
export function mapApiMangaToUICard(manga: any): UIManga {
  // If new complete info shape (from backend)
  if (manga && manga.rating !== undefined && (manga.follows !== undefined || manga.views !== undefined) && (manga.totalChapters !== undefined || manga.chapters !== undefined)) {
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
    };
  }

  if ((manga as any).attributes) {
    const apiManga = manga as ApiManga;
    // Extract cover art filename from relationships
    let coverFileName = '';
    const coverRel = (apiManga.relationships || []).find(rel => rel.type === 'cover_art');
    if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
      coverFileName = coverRel.attributes.fileName;
    } else if (coverRel && coverRel.attributes && coverRel.attributes.filename) {
      coverFileName = coverRel.attributes.filename;
    }
    // Build MangaDex cover URL if possible
    const image = coverFileName ?
      `https://uploads.mangadex.org/covers/${apiManga.id}/${coverFileName}.256.jpg` :
      '';
    // Extract author name
    let author = '';
    const authorRel = (apiManga.relationships || []).find(rel => rel.type === 'author');
    if (authorRel && authorRel.attributes && authorRel.attributes.name) {
      author = authorRel.attributes.name;
    }
    // Extract rating (from attributes if present, fallback to 0)
    let rating = 0;
    if (apiManga.attributes && typeof (apiManga.attributes as any).bayesianRating === 'number') {
      rating = (apiManga.attributes as any).bayesianRating;
    } else if (apiManga.attributes && typeof (apiManga.attributes as any).averageRating === 'number') {
      rating = (apiManga.attributes as any).averageRating;
    }
    // Extract views (followedCount)
    let views = 0;
    if (apiManga.attributes && typeof (apiManga.attributes as any).followedCount === 'number') {
      views = (apiManga.attributes as any).followedCount;
    }
    // Extract type
    const type = (apiManga as any).type || 'manga';
    return {
      id: apiManga.id,
      title: apiManga.attributes.title?.en || Object.values(apiManga.attributes.title)[0] || 'No Title',
      description: apiManga.attributes.description?.en || Object.values(apiManga.attributes.description)[0] || '',
      image,
      genres: (apiManga.attributes.tags || []).map(tag => tag.attributes.name.en || Object.values(tag.attributes.name)[0] || ''),
      rating,
      status: (apiManga.attributes.status as 'ongoing' | 'completed') || 'ongoing',
      chapters: 0, // Not available from API by default
      views,
      author,
      lastUpdate: '', // Not available from API by default
      // type is not in UI Manga type, so omit it
    };
  }
  // Already UI shape
  return manga as Manga;
}

const MangaCard = ({ manga, size = 'medium' }: MangaCardProps) => {
  const uiManga = mapApiMangaToUICard(manga);

  const sizeClasses = {
    small: 'w-32 h-44',
    medium: 'w-40 h-56',
    large: 'w-48 h-64'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const [imgSrc, setImgSrc] = React.useState(uiManga.image || 'https://placehold.co/400x600?text=Manga+Cover');

  return (
    <Link to={`/manga/${uiManga.id}`} className="group cursor-pointer transition-transform duration-300 hover:scale-105 block">
      <div className="relative overflow-hidden shadow-lg rounded-2xl">
        <img
          src={imgSrc}
          alt={uiManga.title}
          className={`${sizeClasses[size]} object-cover transition-transform duration-300 group-hover:scale-110 rounded-2xl`}
          onError={() => setImgSrc('/placeholder.svg')}
        />
        
        {/* Status Badge */}
        <Badge 
          className={`absolute top-2 right-4 ${
            uiManga.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
          } text-white`}
        >
          {uiManga.status === 'completed' ? 'Complete' : 'Ongoing'}
        </Badge>

        {/* Rating */}
        <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 flex items-center gap-1 text-white text-xs">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>{uiManga.rating}</span>
        </div>

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="text-white">
            <p className="text-xs mb-2 line-clamp-3">{uiManga.description}</p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{(uiManga.views / 1000000).toFixed(1)}M</span>
              </div>
              <span className="text-red-500 font-semibold">{uiManga.chapters} ch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title and Info */}
      <div className="mt-2 space-y-1">
        <h3 className={`${textSizes[size]} font-semibold text-white line-clamp-2 group-hover:text-red-400 transition-colors`}>
          {uiManga.title}
        </h3>
        <div className="flex flex-wrap gap-1">
          {uiManga.genres.slice(0, 2).map((genre) => (
            <Badge key={genre} variant="outline" className="text-xs text-white bg-transparent">
              {genre}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default MangaCard;