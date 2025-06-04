import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Manga } from '@/data/mangaData';

interface MangaCardProps {
  manga: Manga;
  size?: 'small' | 'medium' | 'large';
}

const MangaCard = ({ manga, size = 'medium' }: MangaCardProps) => {
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
    <Link to={`/manga/${manga.id}`} className="group cursor-pointer transition-transform duration-300 hover:scale-105 block">
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        <img
          src={manga.image}
          alt={manga.title}
          className={`${sizeClasses[size]} object-cover transition-transform duration-300 group-hover:scale-110`}
        />
        
        {/* Status Badge */}
        <Badge 
          className={`absolute top-2 right-2 ${
            manga.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
          } text-white`}
        >
          {manga.status === 'completed' ? 'Complete' : 'Ongoing'}
        </Badge>

        {/* Rating */}
        <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 flex items-center gap-1 text-white text-xs">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>{manga.rating}</span>
        </div>

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="text-white">
            <p className="text-xs mb-2 line-clamp-3">{manga.description}</p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{(manga.views / 1000000).toFixed(1)}M</span>
              </div>
              <span>{manga.chapters} ch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title and Info */}
      <div className="mt-2 space-y-1">
        <h3 className={`${textSizes[size]} font-semibold text-white line-clamp-2 group-hover:text-red-400 transition-colors`}>
          {manga.title}
        </h3>
        <div className="flex flex-wrap gap-1">
          {manga.genres.slice(0, 2).map((genre) => (
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