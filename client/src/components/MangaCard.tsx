import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { Manga } from '../data/mangaData';
// Accept both API and UI Manga types
import { Manga as ApiManga } from '../types';

export interface MangaCardProps {
  manga: Manga | ApiManga;
  size?: 'small' | 'medium' | 'large';
}

// Helper to map API Manga to UI MangaCard shape
function mapApiMangaToUICard(manga: ApiManga | Manga): Manga {
  if ((manga as any).attributes) {
    const apiManga = manga as ApiManga;
    return {
      id: apiManga.id,
      title: apiManga.attributes.title?.en || Object.values(apiManga.attributes.title)[0] || 'No Title',
      description: apiManga.attributes.description?.en || Object.values(apiManga.attributes.description)[0] || '',
      image: '', // You may want to extract cover art from relationships
      genres: (apiManga.attributes.tags || []).map(tag => tag.attributes.name.en || Object.values(tag.attributes.name)[0] || ''),
      rating: 0, // Not available from API by default
      status: (apiManga.attributes.status as 'ongoing' | 'completed') || 'ongoing',
      chapters: 0, // Not available from API by default
      views: 0, // Not available from API by default
      author: '', // Not available from API by default
      lastUpdate: '', // Not available from API by default
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

  return (
    <Link to={`/manga/${uiManga.id}`} className="group cursor-pointer transition-transform duration-300 hover:scale-105 block">
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        <img
          src={uiManga.image || 'https://placehold.co/400x600?text=Manga+Cover'}
          alt={uiManga.title}
          className={`${sizeClasses[size]} object-cover transition-transform duration-300 group-hover:scale-110`}
        />
        
        {/* Status Badge */}
        <Badge 
          className={`absolute top-2 right-2 ${
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
              <span>{uiManga.chapters} ch</span>
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
            <Badge key={genre} variant="outline" className="text-xs border-gray-600 text-gray-400">
              {genre}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default MangaCard;